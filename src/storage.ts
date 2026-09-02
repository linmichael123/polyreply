import type { Settings } from "./types";

const SETTINGS_KEY = "polyreply:settings:v1";
const SELECTED_KEY = "polyreply:selected:v1";
const DEMO_KEY = "polyreply:demo:v1";

export const DEFAULT_SETTINGS: Settings = {
  groqKey: "",
  geminiKey: "",
  openrouterKey: "",
  judgeEnabled: false,
  timeoutMs: 30_000,
};

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

export function loadSelected(fallback: string[]): string[] {
  const stored = readJson<string[] | null>(SELECTED_KEY, null);
  return Array.isArray(stored) && stored.length ? stored : fallback;
}

export function saveSelected(ids: string[]): void {
  localStorage.setItem(SELECTED_KEY, JSON.stringify(ids));
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
