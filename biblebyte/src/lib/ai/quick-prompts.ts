/** UTC-aligned windows so every client/server sees the same chip set for the same 4-hour period. */
export const QUICK_PROMPT_ROTATION_HOURS = 4;

const SLOT_MS = QUICK_PROMPT_ROTATION_HOURS * 60 * 60 * 1000;

/** Larger pool — companion is Bible/faith scoped; chips nudge toward on-topic asks. */
export const QUICK_PROMPT_POOL = [
  "I feel anxious",
  "Help me pray",
  "Explain this verse",
  "What does God say about forgiveness?",
  "Help me build discipline",
  "I need direction",
  "Help my relationship with God",
  "I'm struggling to trust God right now",
  "What does the Bible say about grief?",
  "How do I read Scripture when I'm busy?",
  "I feel angry — what does Scripture say?",
  "What is grace, in simple terms?",
  "How can I share my faith gently?",
  "I'm lonely — any biblical encouragement?",
  "What does God say about money and worry?",
  "Help me forgive someone who hurt me",
  "I'm afraid of the future",
  "How should Christians think about work?",
  "Explain the Lord's Prayer",
  "I'm doubting my faith",
  "What is the Gospel in simple terms?",
  "Help me understand the Old Testament",
  "I'm facing temptation — pray with me",
  "What does the Bible say about rest and Sabbath?",
  "Teach me how to meditate on one verse",
  "I'm burned out — can you give a faith perspective?",
  "How can I serve my church community?",
  "What does the Bible say about peace?",
  "Pray with me for my family",
] as const;

const VISIBLE_COUNT = 5;

/** Deterministic PRNG for a numeric seed (Fisher–Yates shuffle per slot). */
function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Monotonic UTC slot index; changes every `QUICK_PROMPT_ROTATION_HOURS` hours. */
export function quickPromptsUtcSlot(now: Date = new Date()): number {
  return Math.floor(now.getTime() / SLOT_MS);
}

/** Same slot → same prompts (stable for SSR + hydration). */
export function getRotatingQuickPrompts(
  now: Date = new Date(),
  count: number = VISIBLE_COUNT
): string[] {
  const pool = [...QUICK_PROMPT_POOL];
  const slot = quickPromptsUtcSlot(now);
  const rand = mulberry32(slot);
  const n = Math.min(count, pool.length);

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const a = pool[i];
    const b = pool[j];
    if (a !== undefined && b !== undefined) {
      pool[i] = b;
      pool[j] = a;
    }
  }

  return pool.slice(0, n);
}
