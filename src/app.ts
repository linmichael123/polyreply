import { canJudge, compareResults, refineWithJudge } from "./compare";
import { EXAMPLE_PROMPTS, canRun, completeModel, defaultLiveModelIds, modelsForMode } from "./providers";
import { render } from "./render";
import {
  hasAnyKey,
  loadDemoMode,
  loadSelected,
  loadSettings,
  saveDemoMode,
  saveSelected,
  saveSettings,
} from "./storage";
import type { AppState, ModelResult, Settings } from "./types";

function defaultSelected(demoMode: boolean, settings: Settings): string[] {
  if (demoMode) return modelsForMode(true).map((m) => m.id);
  return defaultLiveModelIds(settings);
}

function sanitizeSelected(ids: string[], demoMode: boolean, settings: Settings): string[] {
  const allowed = new Set(modelsForMode(demoMode).map((m) => m.id));
  const filtered = ids.filter((id) => allowed.has(id));
  return filtered.length ? filtered : defaultSelected(demoMode, settings);
}

function createState(): AppState {
  const settings = loadSettings();
  const demoMode = loadDemoMode(!hasAnyKey(settings));
  return {
    prompt: EXAMPLE_PROMPTS[0],
    demoMode,
    selected: sanitizeSelected(loadSelected(defaultSelected(demoMode, settings)), demoMode, settings),
    settings,
    results: [],
    comparison: null,
    running: false,
    settingsOpen: false,
    editing: null,
  };
}

export function mount(root: HTMLElement): void {
  const state = createState();

  const paint = () => {
    root.innerHTML = render(state);
    bind();
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
      el.addEventListener("click", (event) => {
        const target = event.currentTarget as HTMLElement;
        const action = target.dataset.action;
        if (action === "close-settings" && event.target !== target) return;
        handleAction(action, target);
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
        state.selected = defaultSelected(state.demoMode, state.settings);
        saveSelected(state.selected);
        state.results = [];
        state.comparison = null;
        paint();
        break;
      }
      case "toggle-model": {
        const id = target.dataset.id;
        if (!id) return;
        const on = (target as HTMLInputElement).checked;
        const set = new Set(state.selected);
        if (on) set.add(id);
        else set.delete(id);
        state.selected = [...set];
        saveSelected(state.selected);
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
      case "save-settings": {
        const hadOpenRouter = Boolean(state.settings.openrouterKey.trim());
        if (state.editing) {
          state.settings = { ...state.editing };
          saveSettings(state.settings);
        }
        const hasOpenRouter = Boolean(state.settings.openrouterKey.trim());
        if (!state.demoMode && hasOpenRouter && !hadOpenRouter) {
          state.selected = defaultSelected(false, state.settings);
          saveSelected(state.selected);
        }
        state.settingsOpen = false;
        state.editing = null;
        paint();
        break;
      }
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

    const visible = modelsForMode(state.demoMode).filter((m) => state.selected.includes(m.id));
    if (!visible.length) {
      state.compareError = "Select at least one model.";
      paint();
      return;
    }

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
