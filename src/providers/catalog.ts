import type { ModelDef } from "../types";

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
    id: "groq:llama-3.1-8b-instant",
    provider: "groq",
    label: "Llama 3.1 8B",
    model: "llama-3.1-8b-instant",
    blurb: "Groq · fast free tier",
    accent: "#f55036",
  },
  {
    id: "groq:llama-3.3-70b-versatile",
    provider: "groq",
    label: "Llama 3.3 70B",
    model: "llama-3.3-70b-versatile",
    blurb: "Groq · stronger free-tier pick",
    accent: "#fb7185",
  },
  {
    id: "gemini:gemini-2.0-flash",
    provider: "gemini",
    label: "Gemini 2.0 Flash",
    model: "gemini-2.0-flash",
    blurb: "Google AI Studio",
    accent: "#4b8bff",
  },
  {
    id: "gemini:gemini-2.5-flash",
    provider: "gemini",
    label: "Gemini 2.5 Flash",
    model: "gemini-2.5-flash",
    blurb: "Google AI Studio",
    accent: "#60a5fa",
  },
  {
    id: "openrouter:google/gemma-3-4b-it:free",
    provider: "openrouter",
    label: "Gemma 3 4B",
    model: "google/gemma-3-4b-it:free",
    blurb: "OpenRouter · free",
    accent: "#22c55e",
  },
  {
    id: "openrouter:meta-llama/llama-3.2-3b-instruct:free",
    provider: "openrouter",
    label: "Llama 3.2 3B",
    model: "meta-llama/llama-3.2-3b-instruct:free",
    blurb: "OpenRouter · free",
    accent: "#34d399",
  },
];

export function modelById(id: string): ModelDef | undefined {
  return CATALOG.find((m) => m.id === id);
}

export function modelsForMode(demoMode: boolean): ModelDef[] {
  return CATALOG.filter((m) => (demoMode ? m.provider === "demo" : m.provider !== "demo"));
}

export const EXAMPLE_PROMPTS = [
  "Is it worth learning Rust if I already ship TypeScript for a living?",
  "Give me a 3-day Lisbon itinerary on a modest budget.",
  "Explain CRDTs like I'm a frontend engineer who has never touched distributed systems.",
];
