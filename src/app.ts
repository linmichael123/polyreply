import { canJudge, compareResults, refineWithJudge } from "./compare";
import { EXAMPLE_PROMPTS, canRun, completeModel, defaultLiveModelIds, modelsForMode } from "./providers";
import { render } from "./render";
import {
  hasAnyKey,
  loadDemoMode,
  loadSelection,
  loadSettings,
  saveDemoMode,
  saveSelection,
  saveSettings,
} from "./storage";
import type { AppState, ModelResult, Settings } from "./types";

function demoIds(): string[] {
  return modelsForMode(true).map((m) => m.id);
}

function liveAllowed(): Set<string> {
  return new Set(modelsForMode(false).map((m) => m.id));
}

function sanitize(ids: string[], allowed: Set<string>, fallback: string[]): string[] {
  const filtered = ids.filter((id) => allowed.has(id));
  return filtered.length ? filtered : fallback;
}

function createState(): AppState {
  const settings = loadSettings();
  const demoMode = loadDemoMode(!hasAnyKey(settings));
  const demoFallback = demoIds();
  const liveFallback = defaultLiveModelIds(settings);
  const loaded = loadSelection(demoFallback, liveFallback);
  return {
    prompt: EXAMPLE_PROMPTS[0],
    demoMode,
    selectedDemo: sanitize(loaded.demo, new Set(demoFallback), demoFallback),
    selectedLive: sanitize(loaded.live, liveAllowed(), liveFallback),
    settings,
    results: [],
    comparison: null,
    running: false,
    settingsOpen: false,
    editing: null,
  };
}

function activeSelected(state: AppState): string[] {
  return state.demoMode ? state.selectedDemo : state.selectedLive;
}

export function mount(root: HTMLElement): void {
  const state = createState();
  let scrolledForRun = false;

  const persistSelection = () => {
    saveSelection({ demo: state.selectedDemo, live: state.selectedLive });
  };

  const paint = () => {
    root.innerHTML = render(state);
    bind();
  };

  const scrollResultsOnce = () => {
    if (scrolledForRun) return;
    const el = root.querySelector<HTMLElement>("#results");
    if (!el) return;
    scrolledForRun = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const bind = () => {
    const promptEl = root.querySelector<HTMLTextAreaElement>("[data-field=prompt]");
    promptEl?.addEventListener("input", () => {
      state.prompt = promptEl.value;
    });
    promptEl?.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void run();
      }
    });

    root.querySelectorAll("[data-action]").forEach((el) => {
      const action = (el as HTMLElement).dataset.action;
      if (action === "toggle-demo" || action === "toggle-model") {
        el.addEventListener("change", () => handleAction(action, el as HTMLElement));
        return;
      }
      el.addEventListener("click", (event) => {
        const target = event.currentTarget as HTMLElement;
        const act = target.dataset.action;
        if (act === "close-settings" && event.target !== target) return;
        handleAction(act, target);
      });
    });

    root.querySelectorAll<HTMLInputElement>("[data-setting]").forEach((input) => {
      input.addEventListener("input", () => {
        const key = input.dataset.setting as keyof Settings;
        if (state.editing && (key === "groqKey" || key === "geminiKey" || key === "openrouterKey")) {
          state.editing[key] = input.value;
        }
      });
    });
    root.querySelectorAll<HTMLInputElement>("[data-setting-bool]").forEach((input) => {
      input.addEventListener("change", () => {
        if (state.editing) state.editing.judgeEnabled = input.checked;
      });
    });
    root.querySelectorAll<HTMLInputElement>("[data-setting-number]").forEach((input) => {
      input.addEventListener("input", () => {
        if (state.editing) {
          state.editing.timeoutMs = Math.min(120000, Math.max(5000, Number(input.value) || 30000));
        }
      });
    });
  };

  const handleAction = (action: string | undefined, target: HTMLElement) => {
    switch (action) {
      case "run":
        void run();
        break;
      case "toggle-demo": {
        const input = target.querySelector("input") ?? (target as unknown as HTMLInputElement);
        state.demoMode = Boolean(input.checked);
        saveDemoMode(state.demoMode);
        if (!state.demoMode && state.selectedLive.length === 0) {
          state.selectedLive = defaultLiveModelIds(state.settings);
          persistSelection();
        }
        if (state.demoMode && state.selectedDemo.length === 0) {
          state.selectedDemo = demoIds();
          persistSelection();
        }
        // Paint after the click/change finishes so the replacement checkbox
        // does not eat the same pointer event and flip Demo back on.
        window.setTimeout(() => paint(), 0);
        break;
      }
      case "toggle-model": {
        const id = target.dataset.id;
        if (!id) return;
        const on = (target as HTMLInputElement).checked;
        const current = new Set(activeSelected(state));
        if (on) current.add(id);
        else current.delete(id);
        const next = [...current];
        if (state.demoMode) state.selectedDemo = next;
        else state.selectedLive = next;
        persistSelection();
        paint();
        break;
      }
      case "example": {
        const i = Number(target.dataset.index);
        state.prompt = EXAMPLE_PROMPTS[i] ?? state.prompt;
        paint();
        break;
      }
      case "open-settings":
        state.editing = { ...state.settings };
        state.settingsOpen = true;
        paint();
        break;
      case "close-settings":
        state.settingsOpen = false;
        state.editing = null;
        paint();
        break;
      case "save-settings":
        if (state.editing) {
          state.settings = { ...state.editing };
          saveSettings(state.settings);
        }
        state.settingsOpen = false;
        state.editing = null;
        paint();
        break;
      case "clear-keys":
        if (state.editing) {
          state.editing = {
            ...state.editing,
            groqKey: "",
            geminiKey: "",
            openrouterKey: "",
          };
        }
        paint();
        break;
      default:
        break;
    }
  };

  async function run(): Promise<void> {
    const prompt = state.prompt.trim();
    if (state.running) return;
    if (!prompt) {
      state.compareError = "Write a prompt first.";
      paint();
      return;
    }

    const visible = modelsForMode(state.demoMode).filter((m) => activeSelected(state).includes(m.id));
    if (!visible.length) {
      state.compareError = "Select at least one model.";
      paint();
      return;
    }

    scrolledForRun = false;
    state.running = true;
    state.comparison = null;
    state.compareError = undefined;
    state.results = visible.map((m) => ({
      modelId: m.id,
      status: canRun(m, state.settings, state.demoMode) ? "pending" : "skipped",
      text: "",
      error: canRun(m, state.settings, state.demoMode) ? undefined : "Missing API key",
    }));
    paint();
    scrollResultsOnce();

    await Promise.all(
      visible.map(async (model, index) => {
        if (!canRun(model, state.settings, state.demoMode)) return;
        const t0 = performance.now();
        try {
          const text = await completeModel(model, prompt, state.settings, state.demoMode);
          const next: ModelResult = {
            modelId: model.id,
            status: "ok",
            text,
            latencyMs: Math.round(performance.now() - t0),
          };
          state.results[index] = next;
        } catch (err) {
          state.results[index] = {
            modelId: model.id,
            status: "error",
            text: "",
            latencyMs: Math.round(performance.now() - t0),
            error: err instanceof Error ? err.message : "Request failed",
          };
        }
        paint();
      }),
    );

    const heuristic = compareResults(state.results);
    state.comparison = heuristic;

    if (canJudge(state.settings, state.demoMode)) {
      try {
        state.comparison = await refineWithJudge(prompt, state.results, state.settings);
      } catch (err) {
        state.compareError =
          "Judge refine failed; showing heuristic summary. " +
          (err instanceof Error ? err.message : "");
        state.comparison = heuristic;
      }
    }

    state.running = false;
    paint();
  }

  paint();
}
