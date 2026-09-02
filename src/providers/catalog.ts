import type { ModelDef, Settings } from "../types";

export const CATALOG: ModelDef[] = [
  {
    id: "demo:atlas",
    provider: "demo",
    label: "Atlas",
    model: "demo-atlas",
    blurb: "Structured, optimistic demo voice",
    accent: "#7c6af7",
  },
  {
    id: "demo:pulse",
    provider: "demo",
    label: "Pulse",
    model: "demo-pulse",
    blurb: "Punchy, slightly contrarian demo voice",
    accent: "#3ee0b0",
  },
  {
    id: "demo:north",
    provider: "demo",
    label: "North",
    model: "demo-north",
    blurb: "Cautious, caveat-heavy demo voice",
    accent: "#f4c430",
  },
  {
    id: "openrouter:google/gemma-4-31b-it:free",
    provider: "openrouter",
    label: "Gemma 4 31B",
    model: "google/gemma-4-31b-it:free",
    blurb: "OpenRouter · free",
    accent: "#22c55e",
    preferred: true,
  },
  {
    id: "openrouter:nvidia/nemotron-3.5-lightning:free",
    provider: "openrouter",
    label: "Nemotron Lightning",
    model: "nvidia/nemotron-3.5-lightning:free",
    blurb: "OpenRouter · free",
    accent: "#34d399",
    preferred: true,
  },
  {
    id: "openrouter:z-ai/glm-5.2:free",
    provider: "openrouter",
    label: "GLM 5.2",
    model: "z-ai/glm-5.2:free",
    blurb: "OpenRouter · free",
    accent: "#2dd4bf",
    preferred: true,
  },
  {
    id: "openrouter:minimax/minimax-m2.7:free",
    provider: "openrouter",
    label: "MiniMax M2.7",
    model: "minimax/minimax-m2.7:free",
    blurb: "OpenRouter · free",
    accent: "#4ade80",
    preferred: true,
  },
  {
    id: "groq:llama-3.1-8b-instant",
    provider: "groq",
    label: "Llama 3.1 8B",
    model: "llama-3.1-8b-instant",
    blurb: "Groq · optional",
    accent: "#f55036",
  },
  {
    id: "groq:llama-3.3-70b-versatile",
    provider: "groq",
    label: "Llama 3.3 70B",
    model: "llama-3.3-70b-versatile",
    blurb: "Groq · optional",
    accent: "#fb7185",
  },
  {
    id: "gemini:gemini-2.0-flash",
    provider: "gemini",
    label: "Gemini 2.0 Flash",
    model: "gemini-2.0-flash",
    blurb: "Google AI Studio · optional",
    accent: "#4b8bff",
  },
  {
    id: "gemini:gemini-2.5-flash",
    provider: "gemini",
    label: "Gemini 2.5 Flash",
    model: "gemini-2.5-flash",
    blurb: "Google AI Studio · optional",
    accent: "#60a5fa",
  },
];

const PROVIDER_ORDER: Record<ModelDef["provider"], number> = {
  demo: 0,
  openrouter: 1,
  groq: 2,
  gemini: 3,
};

export function modelById(id: string): ModelDef | undefined {
  return CATALOG.find((m) => m.id === id);
}

export function modelsForMode(demoMode: boolean): ModelDef[] {
  return CATALOG.filter((m) => (demoMode ? m.provider === "demo" : m.provider !== "demo")).sort(
    (a, b) => PROVIDER_ORDER[a.provider] - PROVIDER_ORDER[b.provider],
  );
}

export function preferredOpenRouterIds(): string[] {
  return CATALOG.filter((m) => m.provider === "openrouter" && m.preferred).map((m) => m.id);
}

/** Live-mode defaults: OpenRouter :free set when that key exists; else keyed providers; else OR set. */
export function defaultLiveModelIds(settings: Settings): string[] {
  const live = modelsForMode(false);
  const orDefaults = preferredOpenRouterIds();
  if (settings.openrouterKey.trim()) return orDefaults;

  const withKeys = live
    .filter((m) => {
      if (m.provider === "groq") return Boolean(settings.groqKey.trim());
      if (m.provider === "gemini") return Boolean(settings.geminiKey.trim());
      return false;
    })
    .map((m) => m.id);
  return withKeys.length ? withKeys : orDefaults;
}

export const EXAMPLE_PROMPTS = [
  "Is it worth learning Rust if I already ship TypeScript for a living?",
  "Give me a 3-day Lisbon itinerary on a modest budget.",
  "Explain CRDTs like I'm a frontend engineer who has never touched distributed systems.",
];
