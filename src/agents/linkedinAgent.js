// AGENT 2: LinkedIn Agent
// Writes one post per selected idea, for experienced (10-20 yrs) engineers
// and managers who are new to agentic AI.

import { askJSON } from '../lib/openai.js';

const SYSTEM = `You write LinkedIn posts for a senior technical audience (10-20 years of experience:
staff engineers, architects, engineering managers). They are smart but NEW to agentic AI.
Style rules:
- Approachable and plain-spoken. Explain jargon in one short phrase. Use analogies to things they know (microservices, CI/CD, databases).
- Strong first line hook. Short paragraphs. Max ~200 words. At most 2 emojis. 3-4 hashtags at the end.
- No hype, no "game-changer". Be specific and honest.
Reply ONLY with JSON: {"post":"..."}`;

export async function runLinkedInAgent({ openaiKey, model, idea, ctaLink }) {
  const user = `Idea: ${idea.title}\nAngle: ${idea.angle}\nSummary: ${idea.summary}\nWhy it matters: ${idea.why_it_matters}\nSources: ${(idea.sources ?? []).map((s) => s.url).join(', ')}
${ctaLink ? 'End the post body with a one-line call to action inviting readers to click the link (do not include the URL itself).' : 'Do not include a call to action link.'}`;

  const { post } = await askJSON({ apiKey: openaiKey, model, system: SYSTEM, user });

  // We add the link ourselves (not the AI) so it is always exactly what you typed.
  return ctaLink ? `${post}\n\n🔗 ${ctaLink}` : post;
}
