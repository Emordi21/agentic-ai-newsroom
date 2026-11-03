// Searches Google News through SerpAPI and returns a simplified list of articles.

export async function searchNews({ apiKey, query, num = 8 }) {
  // engine=google + tbm=nws is the "News" tab of regular Google search.
  // It is more reliable than the separate google_news engine for keyword queries.
  const params = new URLSearchParams({
    engine: 'google',
    tbm: 'nws',
    q: query,
    num: String(num),
    api_key: apiKey.trim(),
  });
  const res = await fetch(`/api/serp/search.json?${params}`);
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    // Not JSON at all - usually means the dev server proxy is not running/working.
    throw new Error(`SerpAPI returned an unexpected response (HTTP ${res.status}): ${text.slice(0, 150)}`);
  }

  // SerpAPI reports problems (bad key, no credits...) in an "error" field.
  if (!res.ok || data.error) {
    throw new Error(`SerpAPI (HTTP ${res.status}): ${data.error ?? 'request failed'}`);
  }

  return (data.news_results ?? [])
    .slice(0, num)
    .map((n) => ({
      title: n.title,
      // "source" is a plain string here, but handle the object form too.
      source: typeof n.source === 'string' ? n.source : n.source?.name,
      date: n.date,
      link: n.link,
    }))
    .filter((n) => n.title && n.link);
}
