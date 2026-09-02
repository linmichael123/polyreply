import type { Comparison, ModelResult, Settings } from "../types";
import { completeGemini } from "../providers/gemini";
import { completeGroq } from "../providers/groq";
import { completeOpenRouter } from "../providers/openrouter";
import { modelById } from "../providers/catalog";

const JUDGE_PROMPT = `You compare answers from several language models to the same user prompt.
Return ONLY valid JSON with this shape:
{
  "agreements": [{"claim": "shared point", "models": ["Model A", "Model B"]}],
  "divergences": [{"topic": "short topic", "views": [{"model": "Model A", "stance": "what they uniquely said"}]}]
}
Rules:
- agreements = claims at least two models share
- divergences = genuine disagreements or unique points
- quote substance, not style
- 3-8 agreements and 3-8 divergences max
- no markdown, no commentary`;

function label(modelId: string): string {
  return modelById(modelId)?.label ?? modelId;
}

function parseComparison(raw: string): Comparison | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as Comparison;
    if (!Array.isArray(parsed.agreements) || !Array.isArray(parsed.divergences)) return null;
    return {
      agreements: parsed.agreements
        .filter((a) => a && typeof a.claim === "string" && Array.isArray(a.models))
        .slice(0, 8),
      divergences: parsed.divergences
        .filter((d) => d && typeof d.topic === "string" && Array.isArray(d.views))
        .slice(0, 8),
      source: "judge",
    };
  } catch {
    return null;
  }
}

async function runJudge(
  settings: Settings,
  bundle: string,
): Promise<string> {
  const prompt = `${JUDGE_PROMPT}\n\n${bundle}`;
  if (settings.groqKey.trim()) {
    return completeGroq(settings.groqKey.trim(), "llama-3.1-8b-instant", prompt, settings.timeoutMs);
  }
  if (settings.geminiKey.trim()) {
    return completeGemini(settings.geminiKey.trim(), "gemini-2.0-flash", prompt, settings.timeoutMs);
  }
  if (settings.openrouterKey.trim()) {
    return completeOpenRouter(
      settings.openrouterKey.trim(),
      "meta-llama/llama-3.2-3b-instruct:free",
      prompt,
      settings.timeoutMs,
    );
  }
  throw new Error("No API key for judge");
}

export async function refineWithJudge(
  prompt: string,
  results: ModelResult[],
  settings: Settings,
): Promise<Comparison> {
  const ok = results.filter((r) => r.status === "ok" && r.text.trim());
  const bundle = [
    `User prompt:\n${prompt}`,
    ...ok.map((r) => `--- ${label(r.modelId)} ---\n${r.text}`),
  ].join("\n\n");
  const raw = await runJudge(settings, bundle);
  const parsed = parseComparison(raw);
  if (!parsed) throw new Error("Judge returned unusable JSON");
  return parsed;
}

export function canJudge(settings: Settings, demoMode: boolean): boolean {
  return !demoMode && settings.judgeEnabled && Boolean(
    settings.groqKey.trim() || settings.geminiKey.trim() || settings.openrouterKey.trim(),
  );
}
