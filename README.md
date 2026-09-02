# PolyReply

One prompt → fan out in parallel to multiple free-tier LLMs → side-by-side answers → a clean **Agreements / Divergences** summary.

Works with **zero API keys** via Demo mode. For live models, start with a single **OpenRouter** key — one key, several `:free` models.

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
npm test          # heuristic compare + default-selection tests
```

## Setup (OpenRouter-first)

1. Get a key at [openrouter.ai/keys](https://openrouter.ai/keys) (free tier is enough).
2. Open **Settings**, paste it into **OpenRouter key**, Save.
3. Turn **Demo mode** off. PolyReply selects four OpenRouter `:free` models by default:
   - Gemma 4 31B
   - Nemotron Lightning
   - GLM 5.2
   - MiniMax M2.7
4. Run a prompt. Toggle extra models on if you want them.

The OpenRouter catalog of `:free` models rotates. If a slug 404s, turn that chip off and try another — or check [openrouter.ai/models?max_price=0](https://openrouter.ai/models?max_price=0).

### Optional: Groq and Gemini

Groq and Google AI Studio adapters are still in the app. They are **not** required.

- [Groq keys](https://console.groq.com/keys) — Llama 3.1 8B Instant, Llama 3.3 70B
- [Google AI Studio](https://aistudio.google.com/apikey) — Gemini 2.0 Flash, Gemini 2.5 Flash

Add those keys under **Optional providers** in Settings, then toggle the extra chips. If an OpenRouter key is present, defaults stay on the four `:free` models until you change them.

Keys never leave this device except as `Authorization` / query credentials to the provider you call. PolyReply does not log them.

## What you get

- Prompt box, example chips, **Run** (`⌘/Ctrl+Enter`)
- Per-model toggles and cards: name, latency, markdown, error/skip states
- **Agreements** and **Divergences** from a deterministic claim heuristic
- Optional **judge-model refine** when a key exists (Settings) — prefers OpenRouter
- Settings for API keys — **localStorage only**, sent only to that provider
- Timeouts, parallel requests, skipped adapters when a key is missing
- No analytics by default, no backend, static-host friendly

## How compare works

1. Split each successful answer into claims (sentences and bullets).
2. Tokenize, drop stopwords, cluster with Jaccard similarity.
3. Clusters spanning **two or more models** become Agreements; singleton clusters become Divergences.
4. If **Refine with a judge model** is on and a key exists, a cheap model rewrites that summary as JSON. Failures fall back to the heuristic.

Demo voices (Atlas, Pulse, North) are unchanged — mocked replies with obvious overlap and split, no keys required.

## Deploy

`npm run build` emits a static `dist/` with relative asset paths (`base: './'`). Drop it on GitHub Pages, Netlify, Cloudflare Pages, or any static host.

- Build command: `npm run build`
- Publish directory: `dist`

Because calls are browser-to-provider, the host does not need secrets. If a provider blocks CORS from your origin, use another provider or Demo mode.

## Privacy

- No telemetry in this repo
- Settings live under `polyreply:*` keys in `localStorage`
- Network: OpenRouter `openrouter.ai` first; optionally Groq `api.groq.com` and Gemini `generativelanguage.googleapis.com` — plus Google Fonts for UI type

## License

[MIT](./LICENSE)
