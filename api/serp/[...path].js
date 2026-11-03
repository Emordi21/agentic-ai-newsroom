// A Vercel "serverless function": a small piece of server code that runs on demand.
// Browser -> /api/serp/search.json -> THIS function -> serpapi.com -> back to the browser.
// (When you run `npm run dev` locally, Vite's proxy in vite.config.js does this job instead.)

// Only these two SerpAPI endpoints are allowed, so nobody can use this as a general-purpose relay.
const ALLOWED = new Set(['search.json', 'account.json']);

export default async function handler(req, res) {
  try {
    // Read the endpoint from the actual request URL, e.g. "/api/serp/search.json?q=ai"
    // -> endpoint "search.json". (More dependable than req.query.path on Vercel.)
    const incoming = new URL(req.url, 'http://localhost');
    let endpoint = incoming.pathname.replace(/^\/api\/serp\/?/, '');
    // Fallback: Vercel may also hand us the endpoint as req.query.path.
    if (!ALLOWED.has(endpoint)) endpoint = [].concat(req.query?.path ?? []).join('/');
    if (!ALLOWED.has(endpoint)) {
      return res.status(404).json({ error: `Endpoint not allowed: "${endpoint}" (url: ${req.url.split('?')[0]})` });
    }

    // Forward every query parameter (q, api_key, ...) except the internal "path" one.
    const url = new URL(`https://serpapi.com/${endpoint}`);
    for (const [key, value] of incoming.searchParams) {
      if (key !== 'path') url.searchParams.set(key, value);
    }

    const upstream = await fetch(url);
    const body = await upstream.text();
    res
      .status(upstream.status)
      .setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json')
      .send(body);
  } catch (e) {
    res.status(502).json({ error: `Function could not reach SerpAPI: ${e.message}` });
  }
}
