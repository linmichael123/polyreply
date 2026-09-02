import { openaiContent, postJson } from "./http";

export async function completeGroq(
  apiKey: string,
  model: string,
  prompt: string,
  timeoutMs: number,
): Promise<string> {
  const payload = await postJson(
    "https://api.groq.com/openai/v1/chat/completions",
    { Authorization: `Bearer ${apiKey}` },
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
