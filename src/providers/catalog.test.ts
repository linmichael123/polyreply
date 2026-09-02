import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../storage";
import { defaultLiveModelIds, modelsForMode, preferredOpenRouterIds } from "./catalog";

describe("OpenRouter-first defaults", () => {
  it("keeps four preferred :free models", () => {
    const ids = preferredOpenRouterIds();
    expect(ids).toHaveLength(4);
    expect(ids.every((id) => id.includes(":free"))).toBe(true);
  });

  it("selects OpenRouter defaults when that key is present, even with Groq/Gemini keys", () => {
    const ids = defaultLiveModelIds({
      ...DEFAULT_SETTINGS,
      openrouterKey: "sk-or-test",
      groqKey: "gsk-test",
      geminiKey: "gem-test",
    });
    expect(ids).toEqual(preferredOpenRouterIds());
  });

  it("falls back to Groq/Gemini when only those keys exist", () => {
    const ids = defaultLiveModelIds({
      ...DEFAULT_SETTINGS,
      groqKey: "gsk-test",
    });
    expect(ids.some((id) => id.startsWith("groq:"))).toBe(true);
    expect(ids.some((id) => id.startsWith("openrouter:"))).toBe(false);
  });

  it("lists OpenRouter chips before Groq and Gemini in live mode", () => {
    const providers = modelsForMode(false).map((m) => m.provider);
    const firstGroq = providers.indexOf("groq");
    const lastOr = providers.lastIndexOf("openrouter");
    expect(lastOr).toBeGreaterThanOrEqual(0);
    expect(firstGroq).toBeGreaterThan(lastOr);
  });

  it("does not mix live models into demo mode", () => {
    const demo = modelsForMode(true);
    expect(demo.every((m) => m.provider === "demo")).toBe(true);
    expect(demo).toHaveLength(3);
  });
});
