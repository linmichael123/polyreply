import { describe, expect, it } from "vitest";
import { compareResults, extractClaims, jaccard, tokenize } from "./heuristic";
import type { ModelResult } from "../types";

function ok(id: string, text: string): ModelResult {
  return { modelId: id, status: "ok", text, latencyMs: 10 };
}

describe("tokenize / jaccard", () => {
  it("treats paraphrases as similar", () => {
    const a = tokenize("There is no universal yes. Context decides the answer.");
    const b = tokenize("There is no universal yes and context decides.");
    expect(jaccard(a, b)).toBeGreaterThan(0.4);
  });

  it("keeps unrelated sentences apart", () => {
    const a = tokenize("Lisbon trams are worth riding at sunset.");
    const b = tokenize("CRDTs merge concurrent edits without a leader.");
    expect(jaccard(a, b)).toBeLessThan(0.2);
  });
});

describe("extractClaims", () => {
  it("splits bullets and sentences", () => {
    const claims = extractClaims(
      "## Title\n- Context decides the right tool for the job.\n- A practical next step exists today.\n\nIrreversible migrations want a rollback plan.",
      "demo:north",
    );
    expect(claims.length).toBeGreaterThanOrEqual(3);
    expect(claims.every((c) => c.modelId === "demo:north")).toBe(true);
  });
});

describe("compareResults", () => {
  it("finds shared vs unique claims deterministically", () => {
    const a = ok(
      "demo:atlas",
      [
        "There is no universal yes — context decides whether a change is worth it.",
        "A practical next step exists today: outline the smallest shippable slice.",
        "Reuse TypeScript for glue and only switch tools where they pay rent.",
      ].join("\n"),
    );
    const b = ok(
      "demo:pulse",
      [
        "There is no universal yes — context decides whether a change is worth it.",
        "A practical next step exists today: finish the thing already on your desk.",
        "Tutorials feel like progress and usually are not. Ship first.",
      ].join("\n"),
    );
    const c = ok(
      "demo:north",
      [
        "There is no universal yes — context decides whether a change is worth it.",
        "A practical next step exists today: write the constraints down.",
        "Demo-quality answers hide operational cost at 1am.",
      ].join("\n"),
    );

    const first = compareResults([a, b, c]);
    const second = compareResults([a, b, c]);
    expect(first).toEqual(second);
    expect(first.source).toBe("heuristic");
    expect(first.agreements.length).toBeGreaterThanOrEqual(1);
    expect(first.agreements.some((ag) => /universal yes/i.test(ag.claim))).toBe(true);
    expect(first.agreements[0].models.length).toBeGreaterThanOrEqual(2);
    expect(first.divergences.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty comparison when nothing succeeded", () => {
    const empty = compareResults([{ modelId: "x", status: "error", text: "", error: "nope" }]);
    expect(empty.agreements).toEqual([]);
    expect(empty.divergences).toEqual([]);
  });
});
