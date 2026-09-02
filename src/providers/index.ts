import type { ModelDef, Settings } from "../types";
import { completeDemo } from "./demo";
import { completeGemini } from "./gemini";
import { completeGroq } from "./groq";
import { completeOpenRouter } from "./openrouter";

export function keyForProvider(provider: ModelDef["provider"], settings: Settings): string {
  switch (provider) {
    case "groq":
      return settings.groqKey.trim();
    case "gemini":
      return settings.geminiKey.trim();
    case "openrouter":
      return settings.openrouterKey.trim();
    default:
      return "demo";
  }
}

export function canRun(model: ModelDef, settings: Settings, demoMode: boolean): boolean {
  if (demoMode) return model.provider === "demo";
  if (model.provider === "demo") return false;
  return Boolean(keyForProvider(model.provider, settings));
}

export async function completeModel(
  model: ModelDef,
  prompt: string,
  settings: Settings,
  demoMode: boolean,
): Promise<string> {
  if (demoMode || model.provider === "demo") {
    return completeDemo(model.id, prompt);
  }
  const key = keyForProvider(model.provider, settings);
  if (!key) throw new Error("Missing API key");

  switch (model.provider) {
    case "groq":
      return completeGroq(key, model.model, prompt, settings.timeoutMs);
    case "gemini":
      return completeGemini(key, model.model, prompt, settings.timeoutMs);
    case "openrouter":
      return completeOpenRouter(key, model.model, prompt, settings.timeoutMs);
    default:
      throw new Error("Unknown provider");
  }
}

export {
  CATALOG,
  EXAMPLE_PROMPTS,
  defaultLiveModelIds,
  modelById,
  modelsForMode,
  preferredOpenRouterIds,
} from "./catalog";
