# AI Newsroom

A team of 3 AI agents (Vite + React):

1. **Research Agent** – searches the latest AI news (SerpAPI) and proposes 10 content ideas. You pick the top 3.
2. **LinkedIn Agent** – writes approachable posts for experienced technical readers, with an optional CTA link.
3. **X/Twitter Agent** – writes a thread per idea with a tweet count you choose.

After you approve the ideas, agents 2 and 3 run in parallel.

## Run

```bash
npm install
npm run dev
```

Open the URL shown, paste your OpenAI and SerpAPI keys into the Settings panel, and go.

Note: the app uses the Vite dev server as a proxy (see `vite.config.js`), so use `npm run dev`.
