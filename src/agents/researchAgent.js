// AGENT 1: Research Agent
// Step 1: use SerpAPI to fetch fresh headlines (the "tool").
// Step 2: ask the model to turn those headlines into 10 content ideas.

import { askJSON } from '../lib/openai.js';
import { searchNews } from '../lib/serp.js';

const QUERIES = [
  'latest AI news',
  'agentic AI',
  'AI agents developers',
  'LLM new model release',
  'AI startup funding',
];

export async function runResearchAgent({ openaiKey, serpKey, model, onStatus }) {
  onStatus?.('Searching the web for the latest AI news…');
  const batches = await Promise.all(
    QUERIES.map((query) => searchNews({ apiKey: serpKey, query }).catch(() => []))
  );

  // Remove duplicate links.
  const seen = new Set();
  const articles = batches.flat().filter((a) => !seen.has(a.link) && seen.add(a.link));
  if (articles.length === 0) throw new Error('No news found. Check your SerpAPI key.');

  onStatus?.(`Found ${articles.length} articles. Brainstorming ideas…`);

  const system = `You are a sharp AI-industry research analyst and content strategist.
Reply ONLY with JSON in this shape:
{"ideas":[{"id":1,"title":"","angle":"","summary":"","why_it_matters":"","sources":[{"title":"","url":""}]}]}
Rules: exactly 10 ideas, ids 1-10, each grounded in the provided articles (use their real URLs only).
Favor ideas that are concrete, timely, and explainable to technical readers.`;

  const user = `Today is ${new Date().toDateString()}. Latest articles:\n` +
    articles.map((a, i) => `${i + 1}. ${a.title} — ${a.source} (${a.date}) ${a.link}`).join('\n');

  const result = await askJSON({ apiKey: openaiKey, model, system, user });
  return result.ideas ?? [];
}
