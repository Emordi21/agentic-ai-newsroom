// Searches Google News through SerpAPI and returns a simplified list of articles.

export async function searchNews({ apiKey, query, num = 8 }) {
  const params = new URLSearchParams({
    engine: 'google_news',
    q: query,
    gl: 'us',
    hl: 'en',
    api_key: apiKey,
  });
  const res = await fetch(`/api/serp/search.json?${params}`);
  if (!res.ok) {
    throw new Error(`SerpAPI error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.news_results ?? [])
    .slice(0, num)
    .map((n) => ({
      title: n.title ?? n.stories?.[0]?.title,
      source: n.source?.name ?? n.stories?.[0]?.source?.name,
      date: n.date ?? n.stories?.[0]?.date,
      link: n.link ?? n.stories?.[0]?.link,
    }))
    .filter((n) => n.title && n.link);
}
