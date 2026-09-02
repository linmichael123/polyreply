# PolyReply

One prompt → fan out in parallel to multiple free-tier LLMs → side-by-side answers → a clean **Agreements / Divergences** summary.

Works with **zero API keys** via Demo mode. When you add keys, PolyReply calls Groq, Google AI Studio (Gemini), and OpenRouter free models directly from the browser.

## Quick start

```bash
git clone https://github.com/linmichael123/polyreply.git
cd polyreply
npm install
npm run dev
```

Open the printed local URL (Vite defaults to `http://localhost:5173`). Demo mode is on until you save a key.

```bash
npm run build     # typecheck + production bundle in dist/
npm run preview   # serve dist/
npm test          # heuristic compare unit tests
```

## What you get

- Prompt box, example chips, **Run** (`⌘/Ctrl+Enter`)
- Per-model toggles and cards: name, latency, markdown, error/skip states
- **Agreements** and **Divergences** from a deterministic claim heuristic
- Optional **judge-model refine** when a key exists (Settings)
- Settings for API keys — **localStorage only**, sent only to that provider
- Timeouts, parallel requests, skipped adapters when a key is missing
- No analytics by default, no backend, static-host friendly

## Free API keys

Add any subset. Models whose provider has no key are skipped.

| Provider | Where to get a free-tier key | Default models |
| --- | --- | --- |
| [Groq](https://console.groq.com/keys) | [console.groq.com/keys](https://console.groq.com/keys) | Llama 3.1 8B Instant, Llama 3.3 70B |
| [Google AI Studio](https://aistudio.google.com/apikey) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | Gemini 2.0 Flash, Gemini 2.5 Flash |
| [OpenRouter](https://openrouter.ai/keys) | [openrouter.ai/keys](https://openrouter.ai/keys) | Gemma 3 4B `:free`, Llama 3.2 3B `:free` |

Keys never leave this device except as `Authorization` / query credentials to those endpoints. PolyReply does not log them.

## How compare works

1. Split each successful answer into claims (sentences and bullets).
2. Tokenize, drop stopwords, cluster with Jaccard similarity (threshold `0.42`).
3. Clusters spanning **two or more models** become Agreements; singleton clusters become Divergences.
4. If **Refine with a judge model** is on and a key exists, a cheap model rewrites that summary as JSON. Failures fall back to the heuristic.

Demo voices (Atlas, Pulse, North) are written so the heuristic has obvious overlap and split — useful for screenshots and first-run.

## Deploy

`npm run build` emits a static `dist/` with relative asset paths (`base: './'`). Drop it on GitHub Pages, Netlify, Cloudflare Pages, or any static host.

- Build command: `npm run build`
- Publish directory: `dist`

Because calls are browser-to-provider, the host does not need secrets. If a provider blocks CORS from your origin, use another provider or Demo mode.

## Privacy

- No telemetry in this repo
- Settings live under `polyreply:*` keys in `localStorage`
- Network: Groq `api.groq.com`, Gemini `generativelanguage.googleapis.com`, OpenRouter `openrouter.ai` — plus Google Fonts for UI type

## License

[MIT](./LICENSE)
