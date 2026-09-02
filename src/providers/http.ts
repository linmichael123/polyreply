import { fetchWithTimeout } from "../net";

function extractError(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const rec = payload as Record<string, unknown>;
  const err = rec.error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const nested = err as Record<string, unknown>;
    if (typeof nested.message === "string") return nested.message;
  }
  if (typeof rec.message === "string") return rec.message;
  return fallback;
}

export async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs: number,
): Promise<unknown> {
  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    },
    timeoutMs,
  );

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = { message: text.slice(0, 280) };
    }
  }

  if (!res.ok) {
    throw new Error(extractError(json, `HTTP ${res.status}`));
  }
  return json;
}

export function openaiContent(payload: unknown): string {
  const rec = payload as {
    choices?: { message?: { content?: string | Array<{ text?: string }> } }[];
  };
  const content = rec.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) return content;
  if (Array.isArray(content)) {
    const joined = content.map((p) => p.text ?? "").join("");
    if (joined.trim()) return joined;
  }
  throw new Error("Empty response from model");
}
