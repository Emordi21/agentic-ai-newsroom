import { useEffect, useState } from 'react';
import { runResearchAgent } from './agents/researchAgent.js';
import { runLinkedInAgent } from './agents/linkedinAgent.js';
import { runTwitterAgent } from './agents/twitterAgent.js';

// "State" = data React remembers between renders. When state changes, the screen updates.
// We save settings in localStorage so you don't retype keys on every refresh.
function useStored(key, initial) {
  const [value, setValue] = useState(() => localStorage.getItem(key) ?? initial);
  useEffect(() => localStorage.setItem(key, value), [key, value]);
  return [value, setValue];
}

export default function App() {
  // ---- Settings ----
  const [openaiKey, setOpenaiKey] = useStored('openaiKey', '');
  const [serpKey, setSerpKey] = useStored('serpKey', '');
  const [model, setModel] = useStored('model', 'gpt-6.1-sol');
  const [ctaLink, setCtaLink] = useStored('ctaLink', '');
  const [tweetCount, setTweetCount] = useStored('tweetCount', '6');

  // ---- Workflow ----
  // step: 'research' -> 'select' (human in the loop) -> 'results'
  const [step, setStep] = useState('research');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [ideas, setIdeas] = useState([]);
  const [selected, setSelected] = useState([]); // array of idea ids
  const [linkedin, setLinkedin] = useState({}); // { ideaId: postText }
  const [threads, setThreads] = useState({}); // { ideaId: [tweets] }
  const [busy, setBusy] = useState(false);

  const keysReady = openaiKey.trim() && serpKey.trim();

  async function startResearch() {
    setError('');
    setBusy(true);
    try {
      const found = await runResearchAgent({ openaiKey, serpKey, model, onStatus: setStatus });
      setIdeas(found);
      setSelected([]);
      setStep('select');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      setStatus('');
    }
  }

  function toggle(id) {
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < 3 ? [...cur, id] : cur
    );
  }

  async function createContent() {
    setError('');
    setBusy(true);
    setStatus('LinkedIn and X agents are writing in parallel…');
    setLinkedin({});
    setThreads({});
    const chosen = ideas.filter((i) => selected.includes(i.id));
    const count = Math.min(15, Math.max(2, parseInt(tweetCount, 10) || 6));
    try {
      // Promise.all runs everything AT THE SAME TIME instead of one after another.
      // Each finished result is shown the moment it arrives.
      await Promise.all(
        chosen.flatMap((idea) => [
          runLinkedInAgent({ openaiKey, model, idea, ctaLink: ctaLink.trim() }).then((post) =>
            setLinkedin((p) => ({ ...p, [idea.id]: post }))
          ),
          runTwitterAgent({ openaiKey, model, idea, tweetCount: count }).then((t) =>
            setThreads((p) => ({ ...p, [idea.id]: t }))
          ),
        ])
      );
      setStep('results');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      setStatus('');
    }
  }

  const copy = (text) => navigator.clipboard.writeText(text);
  const chosenIdeas = ideas.filter((i) => selected.includes(i.id));

  return (
    <div className="app">
      <header>
        <h1>🗞️ AI Newsroom</h1>
        <p>Research → you pick → LinkedIn &amp; X agents write.</p>
      </header>

      <section className="card">
        <h2>Settings</h2>
        <div className="grid">
          <label>OpenAI API key
            <input type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} placeholder="sk-…" />
          </label>
          <label>SerpAPI key
            <input type="password" value={serpKey} onChange={(e) => setSerpKey(e.target.value)} placeholder="SerpAPI key" />
          </label>
          <label>Model
            <input value={model} onChange={(e) => setModel(e.target.value)} />
          </label>
          <label>CTA link for LinkedIn (optional)
            <input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="https://…" />
          </label>
          <label>Tweets per thread (2–15)
            <input type="number" min="2" max="15" value={tweetCount} onChange={(e) => setTweetCount(e.target.value)} />
          </label>
        </div>
        <small>Keys are stored only in this browser (localStorage) and sent only to OpenAI / SerpAPI via the local dev server.</small>
      </section>

      {error && <div className="error">⚠️ {error}</div>}
      {busy && <div className="status">⏳ {status || 'Working…'}</div>}

      <section className="card">
        <h2>1. Research Agent</h2>
        <button disabled={!keysReady || busy} onClick={startResearch}>
          {ideas.length ? 'Re-run research' : 'Find the latest AI news & 10 ideas'}
        </button>
        {!keysReady && <small> Enter both API keys first.</small>}
      </section>

      {ideas.length > 0 && (
        <section className="card">
          <h2>2. Pick your top 3 ideas <span className="pill">{selected.length}/3</span></h2>
          <div className="ideas">
            {ideas.map((idea) => (
              <label key={idea.id} className={`idea ${selected.includes(idea.id) ? 'on' : ''}`}>
                <input type="checkbox" checked={selected.includes(idea.id)} onChange={() => toggle(idea.id)} />
                <div>
                  <strong>{idea.title}</strong>
                  <p>{idea.summary}</p>
                  <p className="muted"><em>Angle:</em> {idea.angle}</p>
                  <p className="muted"><em>Why it matters:</em> {idea.why_it_matters}</p>
                  {(idea.sources ?? []).map((s) => (
                    <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.title || s.url}</a>
                  ))}
                </div>
              </label>
            ))}
          </div>
          <button disabled={selected.length !== 3 || busy} onClick={createContent}>
            Approve &amp; create content
          </button>
        </section>
      )}

      {(step === 'results' || Object.keys(linkedin).length > 0 || Object.keys(threads).length > 0) && (
        <section className="card">
          <h2>3. Your content</h2>
          {chosenIdeas.map((idea) => (
            <div key={idea.id} className="result">
              <h3>{idea.title}</h3>
              <div className="cols">
                <div>
                  <h4>LinkedIn</h4>
                  {linkedin[idea.id] ? (
                    <>
                      <textarea readOnly value={linkedin[idea.id]} rows={14} />
                      <button onClick={() => copy(linkedin[idea.id])}>Copy</button>
                    </>
                  ) : <p className="muted">Writing…</p>}
                </div>
                <div>
                  <h4>X thread</h4>
                  {threads[idea.id] ? (
                    <>
                      {threads[idea.id].map((t, i) => (
                        <div key={i} className="tweet">
                          {t}
                          <span className={t.length > 280 ? 'over' : 'muted'}>{t.length}/280</span>
                        </div>
                      ))}
                      <button onClick={() => copy(threads[idea.id].join('\n\n'))}>Copy thread</button>
                    </>
                  ) : <p className="muted">Writing…</p>}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
