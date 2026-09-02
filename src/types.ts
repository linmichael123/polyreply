export type ProviderId = "groq" | "gemini" | "openrouter" | "demo";

export type ResultStatus = "idle" | "pending" | "ok" | "error" | "skipped";

export interface ModelDef {
  id: string;
  provider: ProviderId;
  label: string;
  model: string;
  blurb: string;
  accent: string;
}

export interface Settings {
  groqKey: string;
  geminiKey: string;
  openrouterKey: string;
  judgeEnabled: boolean;
  timeoutMs: number;
}

export interface ModelResult {
  modelId: string;
  status: ResultStatus;
  text: string;
  error?: string;
  latencyMs?: number;
}

export interface Agreement {
  claim: string;
  models: string[];
}

export interface Divergence {
  topic: string;
  views: { model: string; stance: string }[];
}

export interface Comparison {
  agreements: Agreement[];
  divergences: Divergence[];
  source: "heuristic" | "judge";
}

export interface AppState {
  prompt: string;
  demoMode: boolean;
  selected: string[];
  settings: Settings;
  results: ModelResult[];
  comparison: Comparison | null;
  running: boolean;
  settingsOpen: boolean;
  editing: Settings | null;
  compareError?: string;
}
