import { sleep } from "../net";

const DELAYS: Record<string, number> = {
  "demo:atlas": 420,
  "demo:pulse": 680,
  "demo:north": 910,
};

export async function completeDemo(modelId: string, prompt: string): Promise<string> {
  const delay = DELAYS[modelId] ?? 500;
  await sleep(delay);
  return renderDemo(modelId, prompt);
}

function clip(prompt: string, max = 140): string {
  const t = prompt.trim().replace(/\s+/g, " ");
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function renderDemo(modelId: string, prompt: string): string {
  const q = clip(prompt);

  if (modelId === "demo:atlas") {
    return [
      `**Recommendation:** Treat this as a scoped experiment, not an identity bet.`,
      ``,
      `**Shared reading:** there is no universal yes — context decides whether a change is worth it.`,
      ``,
      `On “${q}”, Atlas would start from constraints (time, existing skills, blast radius) and pick the smallest path that still produces a real artifact.`,
      ``,
      `1. **Write the success test first.** One weekend demo, one production-shaped slice, or one explanation you could teach.`,
      `2. **Reuse what already works.** Keep TypeScript (or whatever you already ship) for glue; only switch tools where they clearly pay rent.`,
      `3. **Time-box the learning.** Two focused sessions beat a month of tab-collecting.`,
      ``,
      `Shared truth: there is no universal yes. Context decides. A practical next step exists today — outline the smallest shippable slice and start it before the enthusiasm cools.`,
    ].join("\n");
  }

  if (modelId === "demo:pulse") {
    return [
      `Skip the romance. For “${q}”, the interesting question is not *should you* — it is *what would you stop doing*.`,
      ``,
      `Pulse's take: default to **no new stack** unless the current one is actually blocking you. Most people do not have a tools problem; they have an unfinished-project problem.`,
      ``,
      `- There is no universal yes — context decides whether a change is worth it.`,
      `- A practical next step exists today: finish the thing already on your desk, then re-evaluate.`,
      `- If you still itch after shipping, steal one idea (a type, a pattern, a library) instead of converting religions.`,
      ``,
      `Contrarian bit: tutorials feel like progress and usually are not. Ship first, then specialize.`,
    ].join("\n");
  }

  return [
    `Cautious reading of “${q}”.`,
    ``,
    `North would not lock a verdict without more constraints: deadline, audience, maintenance burden, and how wrong a bad call would feel six months later.`,
    ``,
    `- **Agree with the room:** there is no universal yes — context decides whether a change is worth it.`,
    `- **Agree:** a practical next step exists today — write the constraints down before picking a tool.`,
    `- **Caveat:** demo-quality answers hide operational cost (tooling, hiring, debugging at 1am).`,
    `- **Caveat:** free-tier models (including this demo voice) compress nuance; treat strong claims as hypotheses.`,
    ``,
    `If you must choose tonight: prefer the option you can reverse in a week. Irreversible migrations want a second opinion and a rollback plan.`,
  ].join("\n");
}
