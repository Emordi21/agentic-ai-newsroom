// A tiny wrapper around OpenAI's chat endpoint.
// Every agent uses this one function, so the "talking to the AI" logic lives in one place.

export async function askJSON({ apiKey, model, system, user }) {
  const res = await fetch('/api/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      // Forces the model to reply with valid JSON so we can parse it safely.
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '{}';
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('The model did not return valid JSON. Try again.');
  }
}
