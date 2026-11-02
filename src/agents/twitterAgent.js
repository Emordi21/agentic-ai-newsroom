// AGENT 3: X/Twitter Agent
// Writes a thread with EXACTLY the number of tweets the user asked for.

import { askJSON } from '../lib/openai.js';

const MAX = 280;

const system = (n) => `You write X/Twitter threads for developers at tech startups in San Francisco.
Style rules: direct, concrete, a bit witty, zero corporate fluff. Show code-minded thinking, real tradeoffs, and "what to build/try".
Thread format: EXACTLY ${n} tweets. Tweet 1 is a strong hook. The last tweet is a takeaway or question. Number tweets like "1/${n}".
Every tweet MUST be ${MAX} characters or fewer including the number. At most 1 hashtag in the whole thread.
Reply ONLY with JSON: {"tweets":["...","..."]}`;

export async function runTwitterAgent({ openaiKey, model, idea, tweetCount }) {
  const user = `Idea: ${idea.title}\nAngle: ${idea.angle}\nSummary: ${idea.summary}\nWhy it matters: ${idea.why_it_matters}\nSource: ${idea.sources?.[0]?.url ?? ''}`;

  let { tweets = [] } = await askJSON({ apiKey: openaiKey, model, system: system(tweetCount), user });

  // Models sometimes miscount or write long tweets, so we check and retry ONCE.
  const bad = tweets.length !== tweetCount || tweets.some((t) => t.length > MAX);
  if (bad) {
    const retry = await askJSON({
      apiKey: openaiKey,
      model,
      system: system(tweetCount),
      user: `${user}\n\nYour previous attempt broke the rules (needed exactly ${tweetCount} tweets, each <= ${MAX} chars). Previous attempt:\n${JSON.stringify(tweets)}\nFix it.`,
    });
    tweets = retry.tweets ?? tweets;
  }
  return tweets;
}
