import { describe, expect, it } from "vitest";
import { normalizeSelection } from "./storage";

const demo = ["demo:atlas", "demo:pulse", "demo:north"];
const live = ["openrouter:a", "openrouter:b"];

describe("normalizeSelection", () => {
  it("splits a legacy id array into demo vs live", () => {
    expect(
      normalizeSelection(["demo:atlas", "groq:x", "demo:north"], demo, live),
    ).toEqual({
      demo: ["demo:atlas", "demo:north"],
      live: ["groq:x"],
    });
  });

  it("uses fallbacks when a mode is missing from the legacy array", () => {
    expect(normalizeSelection(["demo:atlas"], demo, live)).toEqual({
      demo: ["demo:atlas"],
      live,
    });
  });

  it("keeps v3 {demo,live} objects", () => {
    expect(normalizeSelection({ demo: ["demo:pulse"], live: ["openrouter:a"] }, demo, live)).toEqual({
      demo: ["demo:pulse"],
      live: ["openrouter:a"],
    });
  });

  it("falls back when stored value is empty or invalid", () => {
    expect(normalizeSelection(null, demo, live)).toEqual({ demo, live });
    expect(normalizeSelection({ demo: [], live: [] }, demo, live)).toEqual({ demo, live });
  });
});
