import type { Agreement, Comparison, Divergence, ModelResult } from "../types";
import { modelById } from "../providers/catalog";

const STOP = new Set([
  "the", "and", "for", "that", "with", "this", "from", "your", "have", "are",
  "not", "but", "you", "was", "were", "been", "being", "they", "their", "them",
  "its", "it's", "into", "than", "then", "also", "just", "like", "about",
  "there", "here", "what", "when", "which", "would", "could", "should", "will",
  "can", "may", "more", "most", "some", "any", "all", "each", "other", "such",
  "only", "very", "really", "still", "over", "after", "before", "because",
  "while", "where", "how", "why", "who", "out", "our", "one", "two", "use",
  "used", "using", "make", "made", "get", "got", "let", "put", "per",
]);

const JACCARD_THRESHOLD = 0.38;
const MIN_INTERSECTION = 4;

export interface Claim {
  text: string;
  modelId: string;
  tokens: Set<string>;
}

export function extractClaims(text: string, modelId: string): Claim[] {
  const chunks = splitClaims(text);
  const seen = new Set<string>();
  const claims: Claim[] = [];
  for (const raw of chunks) {
    const textNorm = tidy(raw);
    if (wordCount(textNorm) < 5) continue;
    const tokens = tokenize(textNorm);
    if (tokens.size < 3) continue;
    const key = [...tokens].sort().join(" ");
    if (seen.has(key)) continue;
    seen.add(key);
    claims.push({ text: textNorm, modelId, tokens });
  }
  return claims;
}

function splitClaims(text: string): string[] {
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/^#{1,6}\s+/, "").replace(/^[-*+]\s+/, "").replace(/^\d+\.\s+/, "").replace(/\*\*/g, "").trim())
    .filter(Boolean);

  const out: string[] = [];
  for (const line of lines) {
    const parts = line.split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/);
    for (const p of parts) {
      const t = tidy(p);
      if (t) out.push(t);
    }
  }
  return out;
}

function tidy(s: string): string {
  return s.replace(/\s+/g, " ").replace(/^["'«»]+|["'«»]+$/g, "").trim();
}

function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

export function tokenize(s: string): Set<string> {
  const words = s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((w) => (w.length <= 4 ? w : w.replace(/(ing|ed|es|s)$/, "")))
    .filter((w) => w.length > 2 && !STOP.has(w));
  return new Set(words);
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function similar(a: Set<string>, b: Set<string>): boolean {
  if (jaccard(a, b) >= JACCARD_THRESHOLD) return true;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  if (inter >= MIN_INTERSECTION) return true;
  const smaller = Math.min(a.size, b.size);
  return smaller > 0 && inter / smaller >= 0.55;
}

function parentOf(parents: number[], i: number): number {
  while (parents[i] !== i) {
    parents[i] = parents[parents[i]];
    i = parents[i];
  }
  return i;
}

function union(parents: number[], a: number, b: number): void {
  const pa = parentOf(parents, a);
  const pb = parentOf(parents, b);
  if (pa !== pb) parents[pa] = pb;
}

function labelFor(modelId: string): string {
  return modelById(modelId)?.label ?? modelId;
}

export function compareResults(results: ModelResult[]): Comparison {
  const ok = results.filter((r) => r.status === "ok" && r.text.trim());
  const claims: Claim[] = [];
  for (const r of ok) claims.push(...extractClaims(r.text, r.modelId));

  if (claims.length === 0) {
    return { agreements: [], divergences: [], source: "heuristic" };
  }

  const parents = claims.map((_, i) => i);
  for (let i = 0; i < claims.length; i++) {
    for (let j = i + 1; j < claims.length; j++) {
      if (similar(claims[i].tokens, claims[j].tokens)) {
        union(parents, i, j);
      }
    }
  }

  const clusters = new Map<number, Claim[]>();
  claims.forEach((c, i) => {
    const p = parentOf(parents, i);
    const list = clusters.get(p) ?? [];
    list.push(c);
    clusters.set(p, list);
  });

  const agreements: Agreement[] = [];
  const uniqueByModel = new Map<string, string[]>();

  const sorted = [...clusters.values()].sort((a, b) => {
    const am = new Set(a.map((c) => c.modelId)).size;
    const bm = new Set(b.map((c) => c.modelId)).size;
    if (bm !== am) return bm - am;
    return b.length - a.length;
  });

  for (const group of sorted) {
    const models = [...new Set(group.map((c) => c.modelId))];
    const representative = group.reduce((best, c) => (c.text.length > best.text.length ? c : best)).text;
    if (models.length >= 2) {
      agreements.push({
        claim: representative,
        models: models.map(labelFor).sort(),
      });
    } else {
      const id = models[0];
      const list = uniqueByModel.get(id) ?? [];
      if (list.length < 3) list.push(representative);
      uniqueByModel.set(id, list);
    }
  }

  const divergences: Divergence[] = [];
  for (const [modelId, stances] of uniqueByModel) {
    for (const stance of stances) {
      divergences.push({
        topic: "Unique to " + labelFor(modelId),
        views: [{ model: labelFor(modelId), stance }],
      });
    }
  }

  return {
    agreements: agreements.slice(0, 8),
    divergences: divergences.slice(0, 10),
    source: "heuristic",
  };
}
