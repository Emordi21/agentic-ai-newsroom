import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// WHY A PROXY?
// Browsers block JavaScript from calling some websites directly (this rule is
// called CORS). SerpAPI does not allow direct browser calls, so we send the
// request to our own dev server at /api/serp, and Vite forwards it to
// serpapi.com for us. We do the same for OpenAI so both work identically.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/serp': {
        target: 'https://serpapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/serp/, ''),
      },
      '/api/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, ''),
      },
    },
  },
});
