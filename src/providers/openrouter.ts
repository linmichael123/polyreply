import { openaiContent, postJson } from "./http";

export async function completeOpenRouter(
  apiKey: string,
  model: string,
  prompt: string,
  timeoutMs: number,
): Promise<string> {
  const payload = await postJson(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": typeof location !== "undefined" ? location.origin : "https://polyreply.app",
      "X-Title": "PolyReply",
    },
    {
      model,
      temperature: 0.4,
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content: "You are a concise, useful assistant. Prefer clear structure and concrete claims.",
        },
        { role: "user", content: prompt },
      ],
    },
    timeoutMs,
  );
  return openaiContent(payload);
}
