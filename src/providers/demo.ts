import { sleep } from "../net";

const DELAYS: Record<string, number> = {
  "demo:atlas": 420,
  "demo:pulse": 680,
  "demo:north": 910,
};

export async function completeDemo(modelId: string, prompt: string): Promise<string> {
  const delay = DELAYS[modelId] ?? 500;
  await sleep(delay);
  const pack = pickPack(prompt);
  if (modelId === "demo:atlas") return pack.atlas;
  if (modelId === "demo:pulse") return pack.pulse;
  return pack.north;
}

function clip(prompt: string, max = 140): string {
  const t = prompt.trim().replace(/\s+/g, " ");
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

interface Pack {
  atlas: string;
  pulse: string;
  north: string;
}

function pickPack(prompt: string): Pack {
  const p = prompt.toLowerCase();
  if (/rust|typescript/.test(p)) return rustPack(prompt);
  if (/lisbon|itinerary/.test(p)) return lisbonPack(prompt);
  if (/crdt/.test(p)) return crdtPack(prompt);
  return genericPack(prompt);
}

function rustPack(prompt: string): Pack {
  const q = clip(prompt);
  return {
    atlas: [
      `**Recommendation:** A scoped Rust experiment, not an identity bet.`,
      ``,
      `On “${q}”: there is no universal yes — context decides whether a change is worth it.`,
      ``,
      `1. **Write the success test first.** One CLI, one WASM module, or one hot path you can benchmark against TypeScript.`,
      `2. **Keep TypeScript for product glue.** Only reach for Rust where memory, concurrency, or packaging actually pay rent.`,
      `3. **Time-box two weekends.** If you do not have a demo artifact, stop — you collected trivia, not a skill.`,
      ``,
      `A practical next step exists today: pick the smallest shippable slice and start it before the enthusiasm cools.`,
    ].join("\n"),
    pulse: [
      `Skip the romance. For “${q}”, the interesting question is *what you would stop shipping*.`,
      ``,
      `Pulse's take: default to **no new language** unless TypeScript is actually blocking you. Most people do not have a tools problem; they have an unfinished-project problem.`,
      ``,
      `- There is no universal yes — context decides whether a change is worth it.`,
      `- A practical next step exists today: finish the TypeScript thing already on your desk, then re-evaluate.`,
      `- If you still itch, steal one idea (ownership, Result types, a single native addon) instead of converting religions.`,
      ``,
      `Contrarian bit: Rust tutorials feel like progress and usually are not. Ship first, then specialize.`,
    ].join("\n"),
    north: [
      `Cautious reading of “${q}”.`,
      ``,
      `- **Agree with the room:** there is no universal yes — context decides whether a change is worth it.`,
      `- **Agree:** a practical next step exists today — write constraints (deadline, hiring, deploy story) before picking Rust.`,
      `- **Caveat:** hiring and debugging a mixed TS/Rust stack at 1am is the hidden cost demos skip.`,
      `- **Caveat:** free-tier answers (including this demo voice) compress nuance; treat “learn Rust” as a hypothesis.`,
      ``,
      `If you must choose tonight: prefer the option you can reverse in a week. An irreversible rewrite wants a second opinion and a rollback plan.`,
    ].join("\n"),
  };
}

function lisbonPack(prompt: string): Pack {
  const q = clip(prompt);
  return {
    atlas: [
      `**3-day Lisbon, modest budget** — built as a walking-first loop.`,
      ``,
      `On “${q}”: there is no universal itinerary — context decides (weather, hills, how much you like sardines).`,
      ``,
      `1. **Day 1 — Baixa to Alfama.** Tram 28 if you must, but walking the grid is cheaper and you skip the pickup lines. Sunset at a miradouro, dinner at a tascas, not a rooftop.`,
      `2. **Day 2 — Belém.** Pasteis, Jerónimos from the outside if tickets are steep, waterfront walk, ferry instead of a taxi.`,
      `3. **Day 3 — LX Factory + river.** Slow morning, one paid museum max, evening in Cais do Sodré.`,
      ``,
      `A practical next step exists today: book one central bed and leave the rest walkable.`,
    ].join("\n"),
    pulse: [
      `Ignore the influencer circuit. For “${q}”, Lisbon rewards **less schedule**, not more.`,
      ``,
      `- There is no universal itinerary — context decides whether a change (or a hill) is worth it.`,
      `- A practical next step exists today: pick a neighborhood and eat where the menu is a chalkboard.`,
      `- Skip three paid viewpoints; the city already is the viewpoint.`,
      ``,
      `Contrarian bit: Tram 28 is a tourist conveyor. Walk. Your budget and your knees will both last longer — maybe.`,
    ].join("\n"),
    north: [
      `Cautious 3-day sketch for “${q}”.`,
      ``,
      `- **Agree:** there is no universal itinerary — context decides whether a change is worth it.`,
      `- **Agree:** a practical next step exists today — lock lodging near a metro stop before locking museums.`,
      `- **Caveat:** hills, heat, and pickpockets on tram lines are the operational costs glossy lists omit.`,
      `- **Caveat:** “modest budget” still needs a buffer for transit cards and one sit-down meal that is not a bakery.`,
      ``,
      `Prefer plans you can reverse by 11am: if Belém is packed, flip to a neighborhood walk. Irreversible big-bus tours want a second opinion.`,
    ].join("\n"),
  };
}

function crdtPack(prompt: string): Pack {
  const q = clip(prompt);
  return {
    atlas: [
      `**CRDTs, for a frontend engineer.**`,
      ``,
      `On “${q}”: there is no universal datatype — context decides whether a change is worth it.`,
      ``,
      `1. **Mental model.** A CRDT is state that two tabs can edit offline and merge without a leader, because every edit is designed to commute.`,
      `2. **Frontend analogue.** Think “git merge that cannot conflict” for a JSON doc, a list, or a rich-text string — not for your whole Redux store.`,
      `3. **When to reach for one.** Collaborative cursors, shared outlines, local-first notes. Not your checkout cart.`,
      ``,
      `A practical next step exists today: sketch one document (title + bullets) and list which fields must merge vs last-write-wins.`,
    ].join("\n"),
    pulse: [
      `Most teams saying “we need CRDTs” for “${q}” actually need **last-write-wins plus a toast**.`,
      ``,
      `- There is no universal datatype — context decides whether a change is worth it.`,
      `- A practical next step exists today: write down the conflict you have actually seen in production.`,
      `- If two users never edit the same field, Yjs is a hobby, not a requirement.`,
      ``,
      `Contrarian bit: CRDT talks feel like distributed-systems fluency. Shipping an operational transform you do not understand is worse than a lock.`,
    ].join("\n"),
    north: [
      `Cautious explainer for “${q}”.`,
      ``,
      `- **Agree:** there is no universal datatype — context decides whether a change is worth it.`,
      `- **Agree:** a practical next step exists today — name the document and the merge rule before picking a library.`,
      `- **Caveat:** tombstones, counters, and rich text have different cost models; “just use Automerge” hides disk growth.`,
      `- **Caveat:** demo-quality diagrams compress the hard part (identity, clocks, UX for unseen conflicts).`,
      ``,
      `Prefer reversible choices: a research spike in one editor, not a platform rewrite. Irreversible sync layers want a second opinion.`,
    ].join("\n"),
  };
}

function genericPack(prompt: string): Pack {
  const q = clip(prompt);
  return {
    atlas: [
      `**Recommendation:** Treat this as a scoped experiment, not an identity bet.`,
      ``,
      `On “${q}”: there is no universal yes — context decides whether a change is worth it.`,
      ``,
      `1. **Write the success test first.** One weekend demo, one production-shaped slice, or one explanation you could teach.`,
      `2. **Reuse what already works.** Only switch tools where they clearly pay rent.`,
      `3. **Time-box the learning.** Two focused sessions beat a month of tab-collecting.`,
      ``,
      `A practical next step exists today: outline the smallest shippable slice and start it before the enthusiasm cools.`,
    ].join("\n"),
    pulse: [
      `Skip the romance. For “${q}”, the interesting question is not *should you* — it is *what would you stop doing*.`,
      ``,
      `- There is no universal yes — context decides whether a change is worth it.`,
      `- A practical next step exists today: finish the thing already on your desk, then re-evaluate.`,
      `- If you still itch after shipping, steal one idea instead of converting religions.`,
      ``,
      `Contrarian bit: tutorials feel like progress and usually are not. Ship first, then specialize.`,
    ].join("\n"),
    north: [
      `Cautious reading of “${q}”.`,
      ``,
      `- **Agree with the room:** there is no universal yes — context decides whether a change is worth it.`,
      `- **Agree:** a practical next step exists today — write the constraints down before picking a tool.`,
      `- **Caveat:** demo-quality answers hide operational cost (tooling, hiring, debugging at 1am).`,
      `- **Caveat:** free-tier models (including this demo voice) compress nuance; treat strong claims as hypotheses.`,
      ``,
      `If you must choose tonight: prefer the option you can reverse in a week. Irreversible migrations want a second opinion and a rollback plan.`,
    ].join("\n"),
  };
}
