// Checks each service separately so you can see exactly which one is failing.
// Both calls are cheap and do NOT use up search credits.

async function check(label, fn) {
  try {
    return { label, ok: true, msg: await fn() };
  } catch (e) {
    return { label, ok: false, msg: e.message };
  }
}

export function testConnections({ openaiKey, serpKey, model }) {
  return Promise.all([
    check('SerpAPI', async () => {
      const res = await fetch(`/api/serp/account.json?api_key=${encodeURIComponent(serpKey.trim())}`);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error(`HTTP ${res.status}: not JSON (${text.slice(0, 80)})`); }
      if (!res.ok || data.error) throw new Error(`HTTP ${res.status}: ${data.error ?? 'failed'}`);
      return `Key works. Searches left this month: ${data.total_searches_left ?? 'unknown'}`;
    }),
    check('OpenAI', async () => {
      const res = await fetch('/api/openai/v1/models', {
        headers: { Authorization: `Bearer ${openaiKey.trim()}` },
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 150)}`);
      const ids = JSON.parse(text).data.map((m) => m.id);
      return ids.includes(model)
        ? `Key works and model "${model}" is available.`
        : `Key works, but model "${model}" is NOT in your account's model list. Pick one, e.g. ${ids.filter((i) => i.startsWith('gpt')).slice(0, 5).join(', ')}`;
    }),
  ]);
}
