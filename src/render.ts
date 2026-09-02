import type { AppState, ModelResult, Settings } from "./types";
import { escapeHtml, renderMarkdown } from "./markdown";
import { EXAMPLE_PROMPTS, modelById, modelsForMode } from "./providers";

function latency(r: ModelResult): string {
  if (r.status === "pending") return "running";
  if (r.status === "skipped") return "skipped";
  if (r.latencyMs == null) return "";
  return r.latencyMs >= 1000 ? `${(r.latencyMs / 1000).toFixed(1)}s` : `${r.latencyMs}ms`;
}

function badge(r: ModelResult): string {
  if (r.status === "ok") return `<span class="badge ok">${escapeHtml(latency(r))}</span>`;
  if (r.status === "error") return `<span class="badge err">error</span>`;
  if (r.status === "pending") return `<span class="badge pending">thinking</span>`;
  if (r.status === "skipped") return `<span class="badge">no key</span>`;
  return `<span class="badge">idle</span>`;
}

function cardBody(r: ModelResult): string {
  if (r.status === "pending") {
    return `<div class="skeleton w90"></div><div class="skeleton w80"></div><div class="skeleton w60"></div>`;
  }
  if (r.status === "error") {
    return `<p class="error">${escapeHtml(r.error || "Request failed")}</p>`;
  }
  if (r.status === "skipped") {
    const provider = modelById(r.modelId)?.provider;
    const name =
      provider === "openrouter" ? "OpenRouter" : provider === "groq" ? "Groq" : provider === "gemini" ? "Gemini" : provider ?? "provider";
    const article = name === "OpenRouter" ? "an" : "a";
    return `<p class="empty">Add ${article} ${escapeHtml(name)} key in Settings, or switch on Demo mode.</p>`;
  }
  if (r.status === "ok") {
    return `<div class="markdown">${renderMarkdown(r.text)}</div>`;
  }
  return `<p class="empty">Waiting for a run.</p>`;
}

export function render(state: AppState): string {
  const visible = modelsForMode(state.demoMode);
  const selectedSet = new Set(state.demoMode ? state.selectedDemo : state.selectedLive);
  const shownResults = state.results;

  return `
    <header class="topbar">
      <div class="brand">
        <svg class="logo" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#12151d"/>
          <path d="M8 10.5c0-.8.65-1.5 1.5-1.5H18c.8 0 1.5.7 1.5 1.5v7c0 .8-.7 1.5-1.5 1.5h-4.2L10.5 21v-2.5H9.5C8.7 18.5 8 17.8 8 17V10.5Z" fill="#7c6af7"/>
          <path d="M13 13.5c0-.8.65-1.5 1.5-1.5H23c.8 0 1.5.7 1.5 1.5v7c0 .8-.7 1.5-1.5 1.5h-4.2L15.5 24v-2.5H14.5c-.8 0-1.5-.7-1.5-1.5v-6.5Z" fill="#3ee0b0" opacity=".92"/>
        </svg>
        <div>
          <h1>PolyReply</h1>
          <p>One prompt. Many models. The overlap that matters.</p>
        </div>
      </div>
      <div class="top-actions">
        <label class="toggle">
          <input type="checkbox" data-action="toggle-demo" ${state.demoMode ? "checked" : ""} />
          Demo mode
        </label>
        <button class="ghost" type="button" data-action="open-settings">Settings</button>
      </div>
    </header>

    <section class="stage">
      <label class="prompt-label" for="prompt">Prompt</label>
      <textarea id="prompt" class="prompt" data-field="prompt" placeholder="Ask something you actually want a second opinion on…">${escapeHtml(state.prompt)}</textarea>
      <div class="prompt-row">
        <div class="examples">
          ${EXAMPLE_PROMPTS.map(
            (p, i) => `<button type="button" class="chip" data-action="example" data-index="${i}">${escapeHtml(p)}</button>`,
          ).join("")}
        </div>
        <button class="run" type="button" data-action="run" ${state.running ? "disabled" : ""}>
          ${state.running ? "Running…" : "Run"}
        </button>
      </div>
      <div class="models" role="group" aria-label="Models">
        ${visible
          .map((m) => {
            const on = selectedSet.has(m.id);
            return `<label class="model-chip ${on ? "" : "is-off"}" style="--chip-accent:${m.accent}">
              <input type="checkbox" data-action="toggle-model" data-id="${escapeHtml(m.id)}" ${on ? "checked" : ""} />
              <span class="dot"></span>
              ${escapeHtml(m.label)}
            </label>`;
          })
          .join("")}
      </div>
      <p class="hint">${state.demoMode
        ? "Demo mode uses mocked replies — no keys required. Turn it off and add an OpenRouter key to hit live free models."
        : "One OpenRouter key runs several free models. Groq and Gemini are optional. Keys stay in this browser and are sent only to the provider you call."}</p>
    </section>

    ${shownResults.length || state.comparison || state.compareError
      ? `<div id="results" class="results">
    ${shownResults.length
      ? `<section class="grid" aria-live="polite">${shownResults
          .map((r) => {
            const m = modelById(r.modelId);
            return `<article class="card" style="--card-accent:${m?.accent ?? "#7c6af7"}">
              <div class="card-head">
                <div>
                  <h3>${escapeHtml(m?.label ?? r.modelId)}</h3>
                  <div class="meta">${escapeHtml(m?.blurb ?? "")}</div>
                </div>
                ${badge(r)}
              </div>
              <div class="card-body">${cardBody(r)}</div>
            </article>`;
          })
          .join("")}</section>`
      : ""}

    ${renderCompare(state)}
    </div>`
      : ""}

    <p class="footer-note">Open source · MIT · No analytics · Keys never leave this device except to OpenRouter, or optionally Groq / Google AI Studio.</p>
    ${state.settingsOpen && state.editing ? renderSettings(state.editing) : ""}
  `;
}

function renderCompare(state: AppState): string {
  if (!state.comparison && !state.compareError) return "";
  const source = state.comparison?.source === "judge" ? "judge model" : "heuristic";
  const agreements = state.comparison?.agreements ?? [];
  const divergences = state.comparison?.divergences ?? [];

  return `
    <section class="compare">
      <div class="panel">
        <div class="kicker">Agreements <span class="source-tag">${escapeHtml(source)}</span></div>
        <h2>Where they overlap</h2>
        ${state.compareError ? `<p class="error">${escapeHtml(state.compareError)}</p>` : ""}
        <ul>
          ${agreements.length
            ? agreements
                .map(
                  (a) => `<li>${escapeHtml(a.claim)}<span class="models-inline">${escapeHtml(a.models.join(" · "))}</span></li>`,
                )
                .join("")
            : `<li class="empty">No shared claims detected yet.</li>`}
        </ul>
      </div>
      <div class="panel">
        <div class="kicker">Divergences</div>
        <h2>Where they split</h2>
        <ul>
          ${divergences.length
            ? divergences
                .map(
                  (d) => `<li><strong>${escapeHtml(d.topic)}</strong>${d.views
                    .map((v) => `<span class="models-inline">${escapeHtml(v.model)} — ${escapeHtml(v.stance)}</span>`)
                    .join("")}</li>`,
                )
                .join("")
            : `<li class="empty">No unique claims detected yet.</li>`}
        </ul>
      </div>
    </section>
  `;
}

function renderSettings(s: Settings): string {
  return `
    <div class="modal-backdrop" data-action="close-settings">
      <div class="modal" role="dialog" aria-labelledby="settings-title" data-stop>
        <h2 id="settings-title">Settings</h2>
        <p class="lede">One OpenRouter key unlocks multiple free models. Keys are stored only in localStorage on this device. PolyReply has no backend and ships with analytics off.</p>
        <div class="field field-primary">
          <label for="openrouterKey">OpenRouter key</label>
          <p class="field-hint">Primary path — one key → multiple <code>:free</code> models</p>
          <input id="openrouterKey" type="password" autocomplete="off" data-setting="openrouterKey" value="${escapeHtml(s.openrouterKey)}" />
          <p class="field-link"><a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">Get a free OpenRouter key</a></p>
        </div>
        <details class="advanced">
          <summary>Optional providers — Groq &amp; Gemini</summary>
          <p class="advanced-lede">Not required. Use these if you already have keys or want extra models beside OpenRouter.</p>
          <div class="field">
            <label for="groqKey">Groq API key</label>
            <input id="groqKey" type="password" autocomplete="off" data-setting="groqKey" value="${escapeHtml(s.groqKey)}" />
          </div>
          <div class="field">
            <label for="geminiKey">Google AI Studio (Gemini) key</label>
            <input id="geminiKey" type="password" autocomplete="off" data-setting="geminiKey" value="${escapeHtml(s.geminiKey)}" />
          </div>
          <div class="links">
            <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">Get a Groq key</a>
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Get a Gemini key</a>
          </div>
        </details>
        <label class="check">
          <input type="checkbox" data-setting-bool="judgeEnabled" ${s.judgeEnabled ? "checked" : ""} />
          Refine the summary with a judge model when a key exists
        </label>
        <div class="field">
          <label for="timeoutMs">Per-model timeout (ms)</label>
          <input id="timeoutMs" type="number" min="5000" max="120000" step="1000" data-setting-number="timeoutMs" value="${s.timeoutMs}" />
        </div>
        <div class="modal-actions">
          <button class="ghost" type="button" data-action="clear-keys">Clear keys</button>
          <button class="run" type="button" data-action="save-settings">Save</button>
        </div>
      </div>
    </div>
  `;
}
