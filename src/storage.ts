import type { Settings } from "./types";

const SETTINGS_KEY = "polyreply:settings:v1";
const SELECTED_V2 = "polyreply:selected:v2";
const SELECTED_KEY = "polyreply:selected:v3";
const DEMO_KEY = "polyreply:demo:v1";

export const DEFAULT_SETTINGS: Settings = {
  groqKey: "",
  geminiKey: "",
  openrouterKey: "",
  judgeEnabled: false,
  timeoutMs: 30_000,
};

export interface ModeSelection {
  demo: string[];
  live: string[];
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadSettings(): Settings {
  const stored = readJson<Partial<Settings>>(SETTINGS_KEY, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function takeIds(ids: string[] | undefined, fallback: string[]): string[] {
  return Array.isArray(ids) && ids.length ? ids : fallback;
}

/** Migrate a stored array or {demo,live} object into per-mode selection. */
export function normalizeSelection(
  stored: unknown,
  demoFallback: string[],
  liveFallback: string[],
): ModeSelection {
  if (Array.isArray(stored)) {
    const demo = stored.filter((id): id is string => typeof id === "string" && id.startsWith("demo:"));
    const live = stored.filter((id): id is string => typeof id === "string" && !id.startsWith("demo:"));
    return { demo: takeIds(demo, demoFallback), live: takeIds(live, liveFallback) };
  }
  if (stored && typeof stored === "object") {
    const rec = stored as { demo?: unknown; live?: unknown };
    const demo = Array.isArray(rec.demo) ? rec.demo.filter((id): id is string => typeof id === "string") : [];
    const live = Array.isArray(rec.live) ? rec.live.filter((id): id is string => typeof id === "string") : [];
    return { demo: takeIds(demo, demoFallback), live: takeIds(live, liveFallback) };
  }
  return { demo: demoFallback, live: liveFallback };
}

export function loadSelection(demoFallback: string[], liveFallback: string[]): ModeSelection {
  const v3 = readJson<unknown>(SELECTED_KEY, null);
  if (v3 != null) return normalizeSelection(v3, demoFallback, liveFallback);
  const v2 = readJson<unknown>(SELECTED_V2, null);
  return normalizeSelection(v2, demoFallback, liveFallback);
}

export function saveSelection(selection: ModeSelection): void {
  localStorage.setItem(SELECTED_KEY, JSON.stringify(selection));
}

export function loadDemoMode(fallback: boolean): boolean {
  const raw = localStorage.getItem(DEMO_KEY);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return fallback;
}

export function saveDemoMode(on: boolean): void {
  localStorage.setItem(DEMO_KEY, on ? "true" : "false");
}

export function hasAnyKey(settings: Settings): boolean {
  return Boolean(settings.groqKey || settings.geminiKey || settings.openrouterKey);
}
