// World and progression data.
// Math is no longer per-world — every world contains the full 12×12 set.
// Worlds are pure progression / theming.
// `levelsRequired` is 4 (mult, div, mixed, boss) — world N+1 unlocks when all
// 4 challenges of world N are cleared. See checkWorldUnlock() below.
//
// Each world also carries:
//   - `villain`: the boss persona text (shown above the boss HP bar)
//   - `flavorText`: the 1-line story card shown after the world is cleared

export const WORLDS = [
  // ── Chapter 1 — "Outer Space" (the original campaign) ──────────────────────
  {
    id: 1,
    chapter: 1,
    name: 'Moon Base',
    color: 0x6f7ec4,
    accentColor: 0xb5e6ff,
    description: 'Where it all begins — your first hop into the dark.',
    villain: 'Cratershade',
    flavorText: 'Moon Base reclaimed. The Void recoils into deeper space.',
    levelsRequired: 4
  },
  {
    id: 2,
    chapter: 1,
    name: 'Asteroid Belt',
    color: 0xc77a4a,
    accentColor: 0xffb38a,
    description: 'Dodging the rubble of long-gone planets.',
    villain: 'Boulderlord',
    flavorText: 'Asteroid Belt cleared. The rubble drifts quiet again.',
    levelsRequired: 4
  },
  {
    id: 3,
    chapter: 1,
    name: 'Crystal Planet',
    color: 0x7a4eaa,
    accentColor: 0xd5a6ff,
    description: 'A world where time chimes like glass.',
    villain: 'Shardmaw',
    flavorText: 'Crystal Planet rings free. Light pours through the facets.',
    levelsRequired: 4
  },
  {
    id: 4,
    chapter: 1,
    name: 'Nebula Gardens',
    color: 0x4f956b,
    accentColor: 0x9be8a3,
    description: 'Drifting clouds of color and quiet warmth.',
    villain: 'Mistshroud',
    flavorText: 'Nebula Gardens bloom. Color rolls back across the dark.',
    levelsRequired: 4
  },
  {
    id: 5,
    chapter: 1,
    name: 'Robot Station',
    color: 0x4c7ab5,
    accentColor: 0x9bd4ff,
    description: 'An automated outpost humming with ancient code.',
    villain: 'Coregrinder',
    flavorText: 'Robot Station reboots. Ancient lights blink awake.',
    levelsRequired: 4
  },
  {
    id: 6,
    chapter: 1,
    name: 'Black Hole Edge',
    color: 0x4a2a55,
    accentColor: 0xff9ec7,
    description: 'Light bends. So does logic.',
    villain: 'Eventhorror',
    flavorText: 'The Black Hole Edge holds. Light bends back toward home.',
    levelsRequired: 4
  },
  {
    id: 7,
    chapter: 1,
    name: 'Ice Comet',
    color: 0x6e95c2,
    accentColor: 0xb6e0ff,
    description: 'A frozen tail blazing across the sky.',
    villain: 'Frostfang',
    flavorText: 'Ice Comet streaks free. Its tail blazes a path forward.',
    levelsRequired: 4
  },
  {
    id: 8,
    chapter: 1,
    name: 'Supernova',
    color: 0xc44b5e,
    accentColor: 0xffae8a,
    description: "A star's last brilliant breath.",
    villain: 'Pyrewraith',
    flavorText: 'Supernova settles. Its embers seed new constellations.',
    levelsRequired: 4
  },
  {
    id: 9,
    chapter: 1,
    name: 'Galactic Core',
    color: 0xc88a3a,
    accentColor: 0xffe07a,
    description: 'The bright, dense heart of your home galaxy.',
    villain: 'Corecrusher',
    flavorText: 'Galactic Core pulses gold. The galaxy turns on its axis once more.',
    levelsRequired: 4
  },
  {
    id: 10,
    chapter: 1,
    name: 'Parallel Dimension',
    color: 0x55858a,
    accentColor: 0xa6f0e8,
    description: 'Familiar yet strange — the rules feel sideways.',
    villain: 'Mirrorshade',
    flavorText: 'Parallel Dimension snaps back. The rules feel right again.',
    levelsRequired: 4
  },
  {
    id: 11,
    chapter: 1,
    name: "Universe's End",
    color: 0x4a4a8c,
    accentColor: 0xfff3b8,
    description: 'The last horizon. The final stand against the Void.',
    villain: 'The Void Devourer',
    flavorText: 'The Void cracks open — and something pulls you inward, smaller and smaller…',
    levelsRequired: 4,
    bigBoss: true
  },
  // ── Chapter 2 — "Inner Space" (the microscopic finale) ─────────────────────
  // Reached via the wormhole that tears open beside "Universe's End" (World 11,
  // CHAPTER1_FINAL_ID) once that finale boss is beaten — the Void cracks open and
  // pulls you inward. A nanocraft shrinks down through the body; bosses are
  // kid-friendly giant germs. The grand finale lives at the end (world 28).
  {
    id: 21,
    chapter: 2,
    name: 'Bloodstream',
    color: 0x8a2b3a,
    accentColor: 0xff7a8a,
    description: 'Shrunk to a speck — riding the warm red rivers within.',
    villain: 'Sneezel',
    flavorText: 'The Bloodstream runs clear. The current carries you deeper.',
    levelsRequired: 4
  },
  {
    id: 22,
    chapter: 2,
    name: 'Cell City',
    color: 0x2f8f86,
    accentColor: 0x4ecdc4,
    description: 'A bustling metropolis of living cells.',
    villain: 'Gunkster',
    flavorText: 'Cell City hums back to life. The streets glow clean again.',
    levelsRequired: 4
  },
  {
    id: 23,
    chapter: 2,
    name: 'Nucleus Vault',
    color: 0x6a3fa0,
    accentColor: 0xc77eff,
    description: 'The vault where the cell keeps its blueprints.',
    villain: 'Scramble',
    flavorText: 'The Nucleus settles. The blueprints read true again.',
    levelsRequired: 4
  },
  {
    id: 24,
    chapter: 2,
    name: 'Neuron Forest',
    color: 0x3a5fa0,
    accentColor: 0x7fb8ff,
    description: 'A glowing forest of crackling nerve-trees.',
    villain: 'Staticbug',
    flavorText: 'The Neuron Forest steadies. Bright signals race home.',
    levelsRequired: 4
  },
  {
    id: 25,
    chapter: 2,
    name: 'Marrow Caverns',
    color: 0xb5863a,
    accentColor: 0xffcf6b,
    description: 'Deep caverns where brand-new cells are born.',
    villain: 'Crustle',
    flavorText: 'Marrow Caverns bloom. Fresh cells stream upward.',
    levelsRequired: 4
  },
  {
    id: 26,
    chapter: 2,
    name: 'Immune Front',
    color: 0x4f8a35,
    accentColor: 0x9be86b,
    description: 'The front line where the body defends itself.',
    villain: 'Swarm Mother',
    flavorText: 'The Immune Front holds. The body breathes easy.',
    levelsRequired: 4
  },
  {
    id: 27,
    chapter: 2,
    name: 'Mitochondria Core',
    color: 0xc4622a,
    accentColor: 0xff9b4a,
    description: 'The roaring furnace that powers every cell.',
    villain: 'Drainol',
    flavorText: 'Mitochondria Core reignites. Energy floods back through the body.',
    levelsRequired: 4
  },
  {
    id: 28,
    chapter: 2,
    name: 'The Singularity Cell',
    color: 0x6a6ab0,
    accentColor: 0xfff3b8,
    description: 'The very first cell of all — where the smallest war ends.',
    villain: 'Patient Zero',
    flavorText: 'The Singularity Cell goes quiet. From the smallest speck, everything heals.',
    levelsRequired: 4,
    bigBoss: true
  },
  // Hidden worlds — discovered via warp asteroids in specific levels.
  // Not part of the main world map S-curve. Don't gate the ending.
  {
    id: 15,
    chapter: 1,
    name: 'Glitch World',
    color: 0x39ff14,
    accentColor: 0xff00ff,
    description: 'Something is wrong with the math here.',
    villain: 'Datamosh',
    flavorText: 'The glitches settle. You sense the system breathing.',
    levelsRequired: 1,
    hidden: true,
    discoveredFrom: { worldId: 5, mode: 'div' },
    kind: 'gauntlet'
  },
  {
    id: 16,
    chapter: 1,
    name: "Dad's Garage",
    color: 0xc88a3a,
    accentColor: 0xffe07a,
    description: "The garage where Dad tinkers between worlds.",
    villain: null,
    flavorText: 'You found it. Dad smiles at the screen.',
    levelsRequired: 1,
    hidden: true,
    discoveredFrom: { worldId: 9, modes: ['mult', 'mixed'] },
    kind: 'exploration'
  },
  // Chapter 2 secret — King Coli, the hidden hygiene superboss. A regal E. coli
  // germ-king on a porcelain throne. Discovered via the mixed-mode warp asteroid
  // in Neuron Forest (W24). Tough-but-fair (~40 HP, below Patient Zero's 46).
  {
    id: 17,
    chapter: 2,
    name: 'The Royal Flush',
    color: 0x6b8f3a,
    accentColor: 0xeed25a,
    description: 'A throne where forgotten germs grow strong.',
    villain: 'King Coli',
    flavorText: 'Scrubbed clean. The throne sits empty and gleaming.',
    levelsRequired: 1,
    hidden: true,
    discoveredFrom: { worldId: 24, mode: 'mixed' },
    kind: 'gauntlet'
  },
  // Chapter 2 secret — "Recess": a real-world playground + running track tucked
  // inside the body (the Dad's-Garage trick). Discovered via the div-mode warp
  // asteroid in Immune Front (W26). Non-combat exploration.
  {
    id: 18,
    chapter: 2,
    name: 'Playground',
    color: 0x4a90d9,
    accentColor: 0x7ed957,
    description: 'A patch of the outside world, tucked away.',
    villain: null,
    flavorText: 'You found it. The bell never rings here.',
    levelsRequired: 1,
    hidden: true,
    discoveredFrom: { worldId: 26, mode: 'div' },
    kind: 'exploration'
  }
];

// Visible worlds — the main world map S-curve.
export const VISIBLE_WORLDS = WORLDS.filter(w => !w.hidden);

// Hidden worlds — discoverable via warp asteroids.
export const HIDDEN_WORLDS = WORLDS.filter(w => w.hidden);

// Chapter finals are PINNED explicitly (not "last visible world") so that
// adding Chapter 2 worlds can't silently move the end-of-game trigger. Beating
// World 11 ends Chapter 1 (Cosmic pet + Arcade unlock, then the cliffhanger);
// beating World 28 is the true grand finale at the end of Chapter 2.
export const CHAPTER1_FINAL_ID = 11;
export const CHAPTER2_FINAL_ID = 28;

// True if this world is the Chapter 1 final boss (Void Devourer). Drives the
// Cosmic-form unlock + the cliffhanger cinematic. Named for back-compat.
export function isFinalVisibleWorld(worldId) {
  return worldId === CHAPTER1_FINAL_ID;
}

// True if this world is the grand-finale boss at the end of Chapter 2.
export function isFinaleWorld(worldId) {
  return worldId === CHAPTER2_FINAL_ID;
}

// Visible worlds belonging to a chapter, in map order. Existing (untagged)
// worlds default to chapter 1.
export function getChapterWorlds(chapter) {
  return VISIBLE_WORLDS.filter(w => (w.chapter || 1) === chapter);
}

// Returns the next visible world id (for ship auto-advance), or null at the end
// of the chapter. Stays WITHIN the world's own chapter — clearing World 11 does
// not auto-advance into Chapter 2 (that's reached via the warp gate).
export function getNextVisibleWorldId(currentId) {
  const world = findWorld(currentId);
  const chapterWorlds = getChapterWorlds(world?.chapter || 1);
  const idx = chapterWorlds.findIndex(w => w.id === currentId);
  if (idx < 0 || idx === chapterWorlds.length - 1) return null;
  return chapterWorlds[idx + 1].id;
}

// Find a world by id (visible or hidden). Used by GameScene/HiddenWorldScene.
export function findWorld(worldId) {
  return WORLDS.find(w => w.id === worldId) || null;
}

// Which hidden world (if any) is reachable from this (worldId, mode) host?
// Supports both shapes: { mode: 'div' } (single host mode) and
// { modes: ['mult', 'mixed'] } (list of host modes — Dad's Garage uses this).
export function getHiddenWorldForHost(worldId, mode) {
  return HIDDEN_WORLDS.find(h => {
    const df = h.discoveredFrom;
    if (df?.worldId !== worldId) return false;
    if (df.modes) return df.modes.includes(mode);
    return df.mode === mode;
  }) || null;
}

// Mode → human-readable label and config used by GameScene/LevelSelectScene.
// Cut: speed/missing/multi — every level is timed now (timer comes from world),
// and missing/multi target advanced cognition rather than automaticity.
export const MODES = {
  mult:  { label: 'Multiply', symbol: '×',  duration: 60, scoreThreshold: 18 },
  div:   { label: 'Divide',   symbol: '÷',  duration: 60, scoreThreshold: 14 },
  mixed: { label: 'Mixed',    symbol: '×÷', duration: 60, scoreThreshold: 16 }
};

// Per-problem timer (seconds) keyed by world id. Drives asteroid descent speed
// and spawn cadence.
const WORLD_PROBLEM_SECONDS = {
  1: 8.0,  2: 7.5,  3: 7.0,  4: 6.5,  5: 6.0,
  6: 5.5,  7: 5.0,  8: 4.5,  9: 4.0,  10: 3.5,  11: 3.0,
  // Chapter 2 ("Inner Space") keeps a flat-ish "same designed speed" (~4.5→3.5)
  // on purpose — it is NOT a faster hand-tuned ramp. The per-kid pressure comes
  // from getAdaptiveProblemSeconds (scoped to chapter 2 + arcade), which these
  // values only serve as the cold-start fallback for.
  21: 4.5,  22: 4.3,  23: 4.1,  24: 4.0,  25: 3.9,  26: 3.8,  27: 3.6,  28: 3.5,
  // Hidden worlds use their own pacing (read lazily). Glitch boss (15) gets a
  // touch more time: its problems are visually corrupted and it's a 22-hit
  // gauntlet, so 4.5s base (+1.0s boss = 5.5s) keeps a 3-star run attainable.
  15: 4.5,  16: 4.0
};

// Tuning dials for the upper-level variety mechanics. Stardust, twists, and
// mini-bosses all gate on world id and roll against these. One stop for
// playtest tweaks — no spelunking.
export const UPPER_LEVEL_CONFIG = {
  stardust: { minWorldId: 8,  oneIn: 8, bonusScore: 2, bonusStreak: 2 },
  // Chapter 1 worlds 8-11 ramp 0.30→0.40. Chapter 2 (21-28) carries the same
  // signature-twist variety so Inner Space doesn't read as "plain" next to the
  // upper Outer-Space worlds — a matching ramp climbing to the grand finale.
  twist: {
    minWorldId: 8,
    rate: {
      8: 0.30, 9: 0.30, 10: 0.30, 11: 0.40,
      21: 0.30, 22: 0.30, 23: 0.32, 24: 0.34, 25: 0.36, 26: 0.38, 27: 0.40, 28: 0.45,
    },
  },
  miniBoss: { minWorldId: 10, oneIn: 8, hp: 2, fallMultiplier: 1.3, bonusScore: 3 },
};

function getProblemSecondsForWorld(worldId) {
  return WORLD_PROBLEM_SECONDS[worldId] ?? 6.0;
}

// Number of ANSWERABLE asteroids on screen at once. Every world is single-slot
// now — multi-slot share-the-button-strip caused a class of bugs (warp focus
// theft, duplicate problems, target-swap mid-tap, race conditions) that we
// kept whack-a-moling. Difficulty still scales via fall speed (W1 8s/problem,
// W11 3s/problem) and per-world problem pools.
// Workshop (16) is non-combat (0 means no spawn loop).
export function getAsteroidCountForWorld(worldId) {
  if (worldId === 16) return 0;
  return 1;
}

// Boss timer adds +1.0s to the world's per-problem timer — boss is rigorous
// on accuracy, not chaotic on speed.
const BOSS_TIMER_BONUS_S = 1.0;
export function getProblemSecondsForWorldAndMode(worldId, mode) {
  const base = getProblemSecondsForWorld(worldId);
  return mode === 'boss' ? base + BOSS_TIMER_BONUS_S : base;
}

// ── Automaticity ───────────────────────────────────────────────────────────
// The whole point of the game is INSTANT recall, not just correctness. A fact
// is "automatic" only when answered correctly AND fast, several times running.
// FLUENCY_CAP_MS is a FIXED absolute threshold (independent of any kid's
// baseline) so "automatic" means real fluency for every kid — a slow kid's
// pace can never define mastery down. The per-kid adaptivity lives in the
// fall-speed pressure (getAdaptiveProblemSeconds), not in this definition.
// ~2500ms includes reading the problem + finding + tapping the button.
export const FLUENCY_CAP_MS = 2500;
const AUTOMATIC_FAST_STREAK = 3; // consecutive correct+fast reps to certify a fact

// Adaptive per-problem fall window (seconds) derived from a kid's measured pace.
// Pushes ~10% faster than their comfort, clamped so it never plateaus slow
// (FLOOR keeps pulling toward true fluency) nor overwhelms a young kid (CEIL).
// `paceMs` is the kid's EWMA correct response time (records.getPaceMs()).
// Cold start (no pace yet) falls back to the world's designed pacing.
// SCOPED by the caller (GameScene) to Chapter 2 + Arcade only — Chapter 1 keeps
// its original hand-designed speed curve.
const ADAPTIVE_PUSH = 0.9;
const ADAPTIVE_FLOOR_S = 2.0;
const ADAPTIVE_CEIL_S = 6.0;
export function getAdaptiveProblemSeconds(worldId, mode, paceMs) {
  if (!paceMs || paceMs <= 0) return getProblemSecondsForWorldAndMode(worldId, mode);
  const target = (paceMs / 1000) * ADAPTIVE_PUSH;
  let s = Math.min(ADAPTIVE_CEIL_S, Math.max(ADAPTIVE_FLOOR_S, target));
  if (mode === 'boss') s += BOSS_TIMER_BONUS_S; // boss keeps its accuracy cushion
  return s;
}

// Boss config — buttonCount/asteroidScale are fixed; HP scales by world
// (see getBossHpForWorld). Boss is meant to be a real fight, not a 5-tap
// formality, so even world 1 is 10 HP.
export const BOSS_CONFIG = {
  buttonCount: 6,
  asteroidScale: 3.4
};

// Boss HP per world: 10 at world 1, +2 per world up to W10 (28 HP).
// W11 is the BIG boss (Void Devourer) and gets a hard override — 4 phases.
// Stays inside the 90s boss timer at every world.
// Chapter 2 bosses get explicit HP — the `8 + worldId*2` formula would give
// world 28 a brutal 64 HP. The germ bosses sit ~10–18; Patient Zero (28) is the
// grand-finale big boss, tuned just under World 11's Void Devourer.
const CHAPTER2_BOSS_HP = {
  21: 10, 22: 11, 23: 12, 24: 13, 25: 14, 26: 15, 27: 16, 28: 46
};
export function getBossHpForWorld(worldId) {
  if (worldId === 11) return 48;       // Void Devourer — 4 phases of ~12 hp each.
  if (worldId === 15) return 22;       // Glitch World boss (Datamosh) — mid-game spike.
  if (worldId === 17) return 40;       // King Coli — hidden superboss, just under Patient Zero.
  if (CHAPTER2_BOSS_HP[worldId]) return CHAPTER2_BOSS_HP[worldId];
  return 8 + worldId * 2;
}

// Boss round length (seconds). Standard bosses get 90s. The grand-finale boss
// (Patient Zero, W28) is the single longest fight in the game at 46 HP, so it
// gets a bigger clock (120s ≈ 2.6s/hit) to stay fair for younger players —
// without it, 46 correct answers in 90s (~1.95s each) is out of reach for the
// target age. Tuning dial: lower W28's HP or raise this if playtests disagree.
export function getBossDurationForWorld(worldId) {
  if (worldId === 28) return 120;
  if (worldId === 17) return 110;   // King Coli — 40 HP superboss, needs a bigger clock.
  return 90;
}

const GLITCH_MATH_WORLDS = [6, 7, 8];

export function getGlitchProblem() {
  const worldForMath = GLITCH_MATH_WORLDS[Math.floor(Math.random() * GLITCH_MATH_WORLDS.length)];
  const base = getProblemForWorld(worldForMath, 'boss');

  const roll = Math.random();
  if (roll < 0.25) {
    return { ...base, glitchKind: 'clean', glitchChoices: null };
  }

  if (roll < 0.625) {
    const answerStr = base.answer.toString();
    const hiddenIdx = Math.floor(Math.random() * answerStr.length);
    const hiddenDigit = parseInt(answerStr[hiddenIdx], 10);
    const display = `${base.display} = ${answerStr.slice(0, hiddenIdx)}▓${answerStr.slice(hiddenIdx + 1)}`;

    const choiceSet = new Set([hiddenDigit]);
    for (let d = 1; d <= 9 && choiceSet.size < 6; d++) {
      if (hiddenDigit - d >= 0) choiceSet.add(hiddenDigit - d);
      if (choiceSet.size < 6 && hiddenDigit + d <= 9) choiceSet.add(hiddenDigit + d);
    }
    const choices = [...choiceSet].sort((a, b) => a - b);

    return {
      ...base,
      display,
      answer: hiddenDigit,
      glitchKind: 'hidden-digit',
      glitchChoices: choices
    };
  }

  const hideLeft = Math.random() < 0.5;
  const match = base.display.match(/^(\d+)\s*([×÷])\s*(\d+)$/);
  if (!match) {
    return { ...base, glitchKind: 'clean', glitchChoices: null };
  }
  const left = parseInt(match[1], 10);
  const op = match[2];
  const right = parseInt(match[3], 10);
  const hiddenOperand = hideLeft ? left : right;
  const display = hideLeft
    ? `? ${op} ${right} = ${base.answer}`
    : `${left} ${op} ? = ${base.answer}`;

  // Division-dividends can exceed 12 (e.g. 96), so the cap is generous.
  const upperBound = Math.max(12, hiddenOperand + 8);
  const choiceSet = new Set([hiddenOperand]);
  for (let d = 1; d <= 11 && choiceSet.size < 6; d++) {
    if (hiddenOperand - d >= 1) choiceSet.add(hiddenOperand - d);
    if (choiceSet.size < 6 && hiddenOperand + d <= upperBound) choiceSet.add(hiddenOperand + d);
  }
  const choices = [...choiceSet].sort((a, b) => a - b);

  return {
    ...base,
    display,
    answer: hiddenOperand,
    glitchKind: 'hidden-operand',
    glitchChoices: choices
  };
}

// Smart distractors: build 3 wrong answers that mimic real kid mistakes for
// the given problem. Always pulls from this fact family, never random.
//
// For multiplication a × b = c:
//   - off-by-one factor results: (a-1)*b, (a+1)*b, a*(b-1), a*(b+1)
//   - swapped → addition mistake: a + b
//   - one ballpark distractor: c ± small
//
// For division c ÷ d = q (where c = d*q):
//   - off-by-one quotient: q ± 1
//   - the divisor / dividend itself
//   - common confusion: c - d
//
// Returns `count` distinct ints, none equal to the correct answer, none
// negative, none implausibly far from the correct value. Default 3 for normal
// 4-button play; pass 5 for boss (6 buttons total).
export function getDistractors(problem, count = 3) {
  const { a, b, op, answer } = problem;
  const candidates = new Set();

  if (op === '×') {
    // Off-by-one factor (very common kid mistake — they recall the wrong fact).
    candidates.add((a - 1) * b);
    candidates.add((a + 1) * b);
    candidates.add(a * (b - 1));
    candidates.add(a * (b + 1));
    // Square-of-factor mistake (e.g. 7×8 → guess 49 because they thought 7×7).
    candidates.add(a * a);
    candidates.add(b * b);
    // Addition / counted-on-fingers mistake.
    candidates.add(a + b);
    // Double-the-answer / half-the-answer ballpark slips.
    candidates.add(answer + a);
    candidates.add(answer - b);
    candidates.add(answer + 1);
    candidates.add(answer - 1);
  } else {
    // Division: c ÷ d = q
    const dividend = a * b;
    const divisor = (problem.display.match(/÷\s*(\d+)/) || [])[1];
    const dNum = divisor ? parseInt(divisor, 10) : Math.max(a, b);
    const q = answer;
    // Off-by-one quotient.
    candidates.add(q - 1);
    candidates.add(q + 1);
    candidates.add(q + 2);
    // Subtract divisor from dividend instead of dividing.
    candidates.add(dividend - dNum);
    // Quotient × 2 / quotient / 2 (rough ballpark slip).
    candidates.add(q * 2);
    candidates.add(Math.max(1, Math.floor(q / 2)));
    // The divisor itself (kid froze and just typed something on the card).
    candidates.add(dNum);
  }

  // Filter to plausible values, drop duplicates and the correct answer.
  const valid = [...candidates].filter(n =>
    Number.isInteger(n) &&
    n > 0 &&
    n !== answer &&
    n <= 200          // anything beyond is implausible for 1..12 facts
  );

  // Shuffle and pick 3.
  for (let i = valid.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [valid[i], valid[j]] = [valid[j], valid[i]];
  }

  const picked = [];
  for (const v of valid) {
    if (picked.length >= count) break;
    if (!picked.includes(v)) picked.push(v);
  }

  // Fallback: if we couldn't find enough (very small facts like 1×1), pad ±n.
  let pad = 1;
  while (picked.length < count) {
    const candidate = answer + pad;
    if (candidate > 0 && candidate !== answer && !picked.includes(candidate)) {
      picked.push(candidate);
    }
    pad = pad > 0 ? -pad : -pad + 1;
    if (Math.abs(pad) > 30) break;
  }

  return picked;
}

// Generate one problem for the given mode.
// Math is no longer constrained by world — facts are sampled freely from 1..12.
// `worldId` is accepted for back-compat but only used for theming elsewhere.
//
// Fact-pool weighting:
//   - mode === 'boss': 100% weak facts (lowest accuracy first; ties broken by
//     slowest avg). Falls back to random if no factMastery data exists yet.
//   - other modes: 60% weak fact, 40% pure random. The "weak" picker pulls
//     from the bottom-third of accuracy among facts the player has actually
//     attempted (>=2 tries).
//
// Returns { display, a, b, op, answer, factKey }.
export function getProblemForWorld(_worldId, mode = 'mult') {
  // Decide operation
  let op = mode;
  if (mode === 'mixed' || mode === 'boss') {
    op = Math.random() < 0.5 ? 'mult' : 'div';
  }

  let a, b;
  const useWeak = mode === 'boss' ? true : Math.random() < 0.6;
  if (useWeak) {
    const weak = progress.pickWeakFact();
    if (weak) {
      a = weak.a;
      b = weak.b;
    }
  }

  if (a === undefined) {
    a = Math.floor(Math.random() * 12) + 1;
    b = Math.floor(Math.random() * 12) + 1;
  }

  const product = a * b;
  const factKey = `${Math.min(a, b)}x${Math.max(a, b)}`;

  if (op === 'mult') {
    // Random factor order
    const flip = Math.random() < 0.5;
    const left = flip ? b : a;
    const right = flip ? a : b;
    return {
      display: `${left} × ${right}`,
      a, b,
      op: '×',
      answer: product,
      factKey
    };
  }

  if (op === 'div') {
    // Division: present product ÷ divisor = quotient.
    const divisorIsA = Math.random() < 0.5;
    const divisor = divisorIsA ? a : b;
    const quotient = divisorIsA ? b : a;
    return {
      display: `${product} ÷ ${divisor}`,
      a, b,
      op: '÷',
      answer: quotient,
      factKey
    };
  }

  // Fallback: behave like multiplication.
  return {
    display: `${a} × ${b}`,
    a, b,
    op: '×',
    answer: product,
    factKey
  };
}

// Wraps getProblemForWorld with a W8+ "twist" — same underlying fact, different
// presentation. Each upper world has a signature twist; W11 mixes them. Twists
// that don't fit the current operation (e.g. mirror only makes sense for ×)
// degrade to flare (visual-only) so the upper levels never look "normal."
//
// Returns the standard problem shape plus { twistKind, twistDistractors? }.
// `twistKind: null` means "no twist this spawn" (rolls below the per-world rate).
export function getTwistedProblem(worldId, mode) {
  const base = getProblemForWorld(worldId, mode);
  if (worldId < UPPER_LEVEL_CONFIG.twist.minWorldId) {
    return { ...base, twistKind: null };
  }

  const rate = UPPER_LEVEL_CONFIG.twist.rate[worldId] ?? 0;
  if (Math.random() > rate) return { ...base, twistKind: null };

  const kindForWorld = {
    8: 'flare',
    9: 'gravity',
    10: 'mirror',
    11: ['flare', 'gravity', 'mirror'][Math.floor(Math.random() * 3)],
    // Chapter 2 cycles the three signature twists so each inner world has its
    // own flavor; the grand finale (28) mixes all three like World 11. (Twists
    // that don't fit the current op degrade to flare downstream.)
    21: 'flare',
    22: 'gravity',
    23: 'mirror',
    24: 'flare',
    25: 'gravity',
    26: 'mirror',
    27: 'gravity',
    28: ['flare', 'gravity', 'mirror'][Math.floor(Math.random() * 3)],
  };
  const kind = kindForWorld[worldId] || 'flare';

  if (kind === 'flare') {
    return { ...base, twistKind: 'flare' };
  }

  if (kind === 'mirror' && base.op === '×') {
    const match = base.display.match(/^(\d+)\s*×\s*(\d+)$/);
    if (!match) return { ...base, twistKind: 'flare' };
    const swapped = `${match[2]} × ${match[1]}`;
    return { ...base, display: swapped, twistKind: 'mirror' };
  }

  if (kind === 'gravity' && base.op === '×') {
    const match = base.display.match(/^(\d+)\s*×\s*(\d+)$/);
    if (!match) return { ...base, twistKind: 'flare' };
    const left = parseInt(match[1], 10);
    const right = parseInt(match[2], 10);
    const product = base.answer;
    const hideLeft = Math.random() < 0.5;
    const missingFactor = hideLeft ? left : right;
    const visibleFactor = hideLeft ? right : left;
    const display = hideLeft
      ? `? × ${right} = ${product}`
      : `${left} × ? = ${product}`;
    return {
      ...base,
      display,
      answer: missingFactor,
      twistKind: 'gravity',
      twistDistractors: getFactorDistractors(product, missingFactor, visibleFactor),
    };
  }

  // Twist doesn't fit the operation (e.g. mirror/gravity on ÷); degrade
  // to flare so the asteroid still LOOKS special.
  return { ...base, twistKind: 'flare' };
}

// Distractors for gravity-twist problems where the answer is the missing
// factor. Pulls other factors of the product, off-by-one slips, and the
// visible factor itself (kid trap: "must be the number I can see").
export function getFactorDistractors(product, missingFactor, visibleFactor, count = 3) {
  const candidates = new Set();
  candidates.add(missingFactor - 1);
  candidates.add(missingFactor + 1);
  candidates.add(missingFactor + 2);
  candidates.add(missingFactor - 2);
  candidates.add(visibleFactor);
  for (let f = 1; f <= 12; f++) {
    if (product % f === 0 && f !== missingFactor) candidates.add(f);
  }

  const valid = [...candidates].filter(n =>
    Number.isInteger(n) &&
    n > 0 &&
    n !== missingFactor &&
    n <= 144
  );

  for (let i = valid.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [valid[i], valid[j]] = [valid[j], valid[i]];
  }

  const picked = [];
  for (const v of valid) {
    if (picked.length >= count) break;
    if (!picked.includes(v)) picked.push(v);
  }

  let pad = 1;
  while (picked.length < count) {
    const cand = missingFactor + pad;
    if (cand > 0 && cand !== missingFactor && !picked.includes(cand)) picked.push(cand);
    pad = pad > 0 ? -pad : -pad + 1;
    if (Math.abs(pad) > 20) break;
  }
  return picked;
}

// Player progress manager
class PlayerProgress {
  constructor() {
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem('cosmicMathProgress');
      if (saved) {
        const data = JSON.parse(saved);
        this.worldProgress = this.mergeWorldProgress(data.worldProgress);
        this.factMastery = data.factMastery || {};
        this.totalStars = data.totalStars || 0;
        this.currentWorld = data.currentWorld || 1;
        this.companion = { ...this.getDefaultCompanion(), ...(data.companion || {}) };
        this.economy = { ...this.getDefaultEconomy(), ...(data.economy || {}) };
        this.ship = this.mergeShip(data.ship);
        this.cosmetics = this.mergeCosmetics(data.cosmetics);
        // Act 2 / hidden / arcade additions — backward-compatible defaults.
        this.endingSeen = !!data.endingSeen;
        this.justClearedWorld = data.justClearedWorld || null;
        this.hiddenWorldDiscovered = { 15: false, 16: false, ...(data.hiddenWorldDiscovered || {}) };
        this.hiddenWorldCleared = { 15: false, 16: false, ...(data.hiddenWorldCleared || {}) };
        this.arcade = { endlessBest: 0, bossRushBest: null, ...(data.arcade || {}) };
        this.petHelperUsed = !!data.petHelperUsed; // big-boss helper consumed
        this.dadNoteState = { lastClaimDate: null, nextIndex: 0, ...(data.dadNoteState || {}) };
        this.recessNoteState = { lastClaimDate: null, nextIndex: 0, ...(data.recessNoteState || {}) };
        this.tutorialSeen = !!data.tutorialSeen;
        this.cosmicHintSeen = !!data.cosmicHintSeen;
        // Chapter 2 ("Inner Space") additions — backward-compatible defaults so
        // existing saves (endingSeen, Cosmic pet) are untouched. currentChapter
        // is just which map the player is viewing; finaleSeen gates the grand
        // finale at World 28 (separate from endingSeen, which gates World 11's
        // Cosmic/Arcade unlock and must NOT be reset).
        this.currentChapter = data.currentChapter || 1;
        this.finaleSeen = !!data.finaleSeen;
        if (this.currentWorld >= 12 && this.currentWorld <= 14) this.currentWorld = 11;
        this.checkWorldUnlock(null);
      } else {
        this.reset();
      }
    } catch (e) {
      this.reset();
    }
  }

  reset() {
    this.worldProgress = this.getDefaultWorldProgress();
    this.factMastery = {};
    this.totalStars = 0;
    this.currentWorld = 1;
    this.companion = this.getDefaultCompanion();
    this.economy = this.getDefaultEconomy();
    this.ship = this.getDefaultShip();
    this.cosmetics = this.getDefaultCosmetics();
    this.endingSeen = false;
    this.justClearedWorld = null;
    this.hiddenWorldDiscovered = { 15: false, 16: false };
    this.hiddenWorldCleared = { 15: false, 16: false };
    this.arcade = { endlessBest: 0, bossRushBest: null };
    this.petHelperUsed = false;
    this.dadNoteState = { lastClaimDate: null, nextIndex: 0 };
    this.recessNoteState = { lastClaimDate: null, nextIndex: 0 };
    this.tutorialSeen = false;
    this.cosmicHintSeen = false;
    this.currentChapter = 1;
    this.finaleSeen = false;
    this.save();
  }

  // Wipe ALL game data (and the companion picker). Wired to the Reset button
  // in the parent dashboard. Keeps the parent PIN.
  resetAll() {
    try {
      localStorage.removeItem('cosmicMathProgress');
      localStorage.removeItem('cosmicMathRecords');
      localStorage.removeItem('cosmicMathAchievements');
    } catch (e) {}
    this.reset();
  }

  // Lifetime answer totals derived from factMastery — used by evolution gates.
  getLifetimeTotals() {
    let correct = 0;
    let total = 0;
    for (const fact of Object.values(this.factMastery)) {
      if (!fact) continue;
      correct += fact.correct || 0;
      total += fact.total || 0;
    }
    return {
      correct,
      total,
      accuracy: total > 0 ? correct / total : 0
    };
  }

  getWorldsClearedCount() {
    let count = 0;
    for (const w of VISIBLE_WORLDS) {
      if (this.isWorldFullyCleared(w.id)) count++;
    }
    return count;
  }

  getDefaultCompanion() {
    return {
      speciesId: null,
      stage: 'egg',
      cosmicForm: false,
      displayStage: null,
      // Trophy shelf: pets the player has fully raised. Each entry is
      // { speciesId, retiredAt }. Read-only — not re-equippable.
      completed: []
    };
  }

  getDefaultEconomy() {
    return {
      stardust: 0,
      lastDailyBonusDate: null    // 'YYYY-MM-DD' — first game of day grants +5
    };
  }

  getDefaultShip() {
    return {
      parts: {
        hull: 'hull_default',
        wings: 'wings_default',
        paint: 'paint_default',
        addon: null,
        pattern: 'pattern_none',
        trail: 'trail_default_flame'
      },
      ownedParts: [
        'hull_default', 'wings_default', 'paint_default',
        'pattern_none', 'trail_default_flame'
      ]
    };
  }

  getDefaultCosmetics() {
    return {
      pet: { hat: null, accessory: null, aura: 'aura_none' },
      ownedIds: ['aura_none']
    };
  }

  mergeShip(saved) {
    const def = this.getDefaultShip();
    if (!saved) return def;
    const ownedParts = Array.isArray(saved.ownedParts) ? [...saved.ownedParts] : [...def.ownedParts];
    // Migration: ensure default pattern + trail are owned for old saves
    for (const id of ['pattern_none', 'trail_default_flame']) {
      if (!ownedParts.includes(id)) ownedParts.push(id);
    }
    const parts = { ...def.parts, ...(saved.parts || {}) };
    // Patterns are now folded into paints. Reset any non-default pattern slot
    // to pattern_none so the legacy slot doesn't paint over the new system.
    if (parts.pattern && parts.pattern !== 'pattern_none') {
      parts.pattern = 'pattern_none';
    }
    // Migration: decal slot → addon slot.
    const DECAL_TO_ADDON = {
      decal_star: 'addon_antenna',
      decal_heart: 'addon_spoiler',
      decal_crown: 'addon_periscope',
      decal_comet: 'addon_cannons',
      decal_compass: 'addon_satellite',
      decal_phoenix: 'addon_phoenix_crest',
      decal_galaxy_swirl: 'addon_galaxy_orb',
      decal_dragon: 'addon_dragon_horns',
      decal_glitch: 'addon_glitch_module'
    };
    for (let i = ownedParts.length - 1; i >= 0; i--) {
      const id = ownedParts[i];
      if (DECAL_TO_ADDON[id]) {
        const addonId = DECAL_TO_ADDON[id];
        if (!ownedParts.includes(addonId)) ownedParts.push(addonId);
        ownedParts.splice(i, 1);
      }
    }
    if (parts.decal && DECAL_TO_ADDON[parts.decal]) {
      parts.addon = DECAL_TO_ADDON[parts.decal];
    }
    delete parts.decal;
    if (!('addon' in parts)) parts.addon = null;
    // Migration: retired hull/trail ids whose art was removed. An unknown hull
    // id silently renders the default silhouette (ShipRenderer falls through to
    // HULL_STANDARD), so reset the equipped slot and drop the dead ids from
    // owned — same treatment retired cosmetics get in mergeCosmetics.
    const RETIRED_HULLS = new Set(['hull_vortex']);
    const RETIRED_TRAILS = new Set(['trail_starlight']);
    if (RETIRED_HULLS.has(parts.hull)) parts.hull = 'hull_default';
    if (RETIRED_TRAILS.has(parts.trail)) parts.trail = 'trail_default_flame';
    for (let i = ownedParts.length - 1; i >= 0; i--) {
      if (RETIRED_HULLS.has(ownedParts[i]) || RETIRED_TRAILS.has(ownedParts[i])) {
        ownedParts.splice(i, 1);
      }
    }
    return { parts, ownedParts };
  }

  mergeCosmetics(saved) {
    const def = this.getDefaultCosmetics();
    if (!saved) return def;
    const ownedIds = Array.isArray(saved.ownedIds) ? [...saved.ownedIds] : [];
    if (!ownedIds.includes('aura_none')) ownedIds.push('aura_none');
    const pet = { hat: null, accessory: null, aura: 'aura_none', ...(saved.pet || {}) };
    delete pet.outfit;
    if (!pet.aura) pet.aura = 'aura_none';
    // Migration: food hat slot → accessory slot.
    const FOOD_IDS = new Set([
      'hat_strawberry','hat_banana','hat_avocado','hat_pizza',
      'hat_donut','hat_onigiri','hat_taiyaki','hat_sushi'
    ]);
    if (FOOD_IDS.has(pet.hat)) {
      if (!pet.accessory) pet.accessory = pet.hat;
      pet.hat = null;
    }
    // Migration: drop retired wearables.
    const RETIRED_IDS = new Set([
      'hat_propeller','hat_astronaut','hat_wizard',
      'hat_starhat','hat_crown_stars','hat_galaxy_helm',
      'acc_jetpack','acc_antenna','acc_starhalo',
      'acc_wings','acc_cape','acc_starbow','acc_phoenix_cape'
    ]);
    for (let i = ownedIds.length - 1; i >= 0; i--) {
      if (RETIRED_IDS.has(ownedIds[i])) ownedIds.splice(i, 1);
    }
    if (RETIRED_IDS.has(pet.hat)) pet.hat = null;
    if (RETIRED_IDS.has(pet.accessory)) pet.accessory = null;
    return { pet, ownedIds };
  }

  mergeWorldProgress(saved) {
    const defaults = this.getDefaultWorldProgress();
    if (!saved) return defaults;
    for (const w of WORLDS) {
      const s = saved[w.id];
      if (s) {
        defaults[w.id] = {
          unlocked: s.unlocked || defaults[w.id].unlocked,
          levelsCompleted: s.levelsCompleted || 0,
          starsEarned: s.starsEarned || 0,
          levelStars: s.levelStars || {}
        };
      }
    }
    return defaults;
  }

  getDefaultWorldProgress() {
    const progress = {};
    for (const world of WORLDS) {
      progress[world.id] = {
        unlocked: world.id === 1,
        levelsCompleted: 0,
        starsEarned: 0,
        levelStars: {} // levelNum: stars (1-3)
      };
    }
    return progress;
  }

  save() {
    try {
      localStorage.setItem('cosmicMathProgress', JSON.stringify({
        worldProgress: this.worldProgress,
        factMastery: this.factMastery,
        totalStars: this.totalStars,
        currentWorld: this.currentWorld,
        companion: this.companion,
        economy: this.economy,
        ship: this.ship,
        cosmetics: this.cosmetics,
        endingSeen: this.endingSeen,
        justClearedWorld: this.justClearedWorld,
        hiddenWorldDiscovered: this.hiddenWorldDiscovered,
        hiddenWorldCleared: this.hiddenWorldCleared,
        arcade: this.arcade,
        petHelperUsed: this.petHelperUsed,
        dadNoteState: this.dadNoteState,
        recessNoteState: this.recessNoteState,
        tutorialSeen: this.tutorialSeen,
        cosmicHintSeen: this.cosmicHintSeen,
        currentChapter: this.currentChapter,
        finaleSeen: this.finaleSeen
      }));
    } catch (e) {
      console.warn('Could not save progress');
    }
  }

  // Mark the ending sequence as seen (so it doesn't auto-replay next final-boss win).
  markEndingSeen() {
    if (this.endingSeen) return;
    this.endingSeen = true;
    this.save();
  }

  // Force-replay the ending on next final-boss win (dev menu only).
  resetEndingSeen() {
    if (!this.endingSeen) return;
    this.endingSeen = false;
    this.save();
  }

  // Switch which chapter map the player is viewing. Driven by the warp gate
  // (→ chapter 2) and the return gate (→ chapter 1) on the world map.
  setCurrentChapter(chapter) {
    if (this.currentChapter === chapter) return;
    this.currentChapter = chapter;
    this.save();
  }

  // Mark the grand finale (World 28) as seen, grant its rewards, and persist —
  // atomically. Called EARLY (before the long credits roll, mirroring
  // markEndingSeen) so closing the tab mid-finale can't strand the reward.
  // Returns true on the first call. Idempotent.
  markFinaleSeen() {
    const firstTime = !this.finaleSeen;
    this.finaleSeen = true;
    this.grantFinaleRewards();
    this.save();
    return firstTime;
  }

  // Force-replay the finale on next World-28 win (dev menu only).
  resetFinaleSeen() {
    if (!this.finaleSeen) return;
    this.finaleSeen = false;
    this.save();
  }

  // Idempotently grant the Chapter 2 finale rewards: the signature Nanocraft
  // hull (auto-equipped) + the Bioluminescent aura. Mutates the save shape
  // directly rather than calling ShipManager/CosmeticManager — those modules
  // import `progress` from here, so calling back into them would be circular.
  // Caller is responsible for save() (markFinaleSeen does it).
  grantFinaleRewards() {
    const ship = this.ship;
    if (ship && Array.isArray(ship.ownedParts)) {
      if (!ship.ownedParts.includes('hull_nanocraft')) {
        ship.ownedParts.push('hull_nanocraft');
        if (ship.parts) ship.parts.hull = 'hull_nanocraft'; // auto-equip the trophy
      }
    }
    const cos = this.cosmetics;
    if (cos && Array.isArray(cos.ownedIds) && !cos.ownedIds.includes('aura_bioluminescent')) {
      cos.ownedIds.push('aura_bioluminescent');
    }
  }

  // Mark a hidden world as discovered (warp asteroid was solved). UI updates.
  discoverHiddenWorld(worldId) {
    if (this.hiddenWorldDiscovered[worldId]) return false;
    this.hiddenWorldDiscovered[worldId] = true;
    this.save();
    return true;
  }

  // Mark a hidden world as cleared (after its boss / exploration completes).
  clearHiddenWorld(worldId) {
    if (this.hiddenWorldCleared[worldId]) return;
    this.hiddenWorldCleared[worldId] = true;
    this.grantSecretReward(worldId);
    this.save();
  }

  // Idempotently grant a hidden world's signature reward on first clear. King
  // Coli (17) drops the exclusive Aegis hull (auto-equipped). Exploration
  // secrets (e.g. Recess, 18) grant their cosmetic in-scene via CosmeticManager.
  // Mutates the save shape directly to avoid a circular import of ShipManager.
  grantSecretReward(worldId) {
    if (worldId === 17) {
      const ship = this.ship;
      if (ship && Array.isArray(ship.ownedParts) && !ship.ownedParts.includes('hull_aegis')) {
        ship.ownedParts.push('hull_aegis');
        if (ship.parts) ship.parts.hull = 'hull_aegis'; // auto-equip the trophy
      }
    }
  }

  isHiddenWorldDiscovered(worldId) {
    return !!this.hiddenWorldDiscovered?.[worldId];
  }

  isHiddenWorldCleared(worldId) {
    return !!this.hiddenWorldCleared?.[worldId];
  }

  // Set after a world is cleared by a boss win; consumed by WorldMapScene to
  // auto-advance the ship one node. Null when nothing is pending.
  setJustClearedWorld(worldId) {
    if (this.justClearedWorld === worldId) return;
    this.justClearedWorld = worldId;
    this.save();
  }

  consumeJustClearedWorld() {
    const v = this.justClearedWorld;
    if (v === null) return null;
    this.justClearedWorld = null;
    this.save();
    return v;
  }

  // Force-unlock every visible world (dev menu only). NOTE: this only flips the
  // `unlocked` flag — it does NOT clear Universe's End (World 11), so the Inner
  // Space wormhole stays hidden even though Bloodstream reads unlocked. To
  // exercise the wormhole/chapter-warp, use "Clear ALL levels" (devClearAllWorlds)
  // instead, which 3-stars every world and reveals the gate.
  unlockAllVisibleWorlds() {
    let changed = false;
    for (const w of VISIBLE_WORLDS) {
      const wp = this.worldProgress[w.id];
      if (wp && !wp.unlocked) {
        wp.unlocked = true;
        changed = true;
      }
    }
    if (changed) this.save();
  }

  // Dev convenience: fully 3-star every visible world in BOTH chapters. Because
  // World 11 (Universe's End) ends up cleared, the Inner Space wormhole appears;
  // because the Chapter 2 worlds get cleared, the whole Chapter 2 map opens up.
  // Leaves the narrative flags (endingSeen/finaleSeen) alone — use the replay
  // buttons for the cinematics.
  devClearAllWorlds() {
    for (const w of VISIBLE_WORLDS) {
      const wp = this.worldProgress[w.id];
      if (!wp) continue;
      const stars = {};
      for (let lvl = 1; lvl <= w.levelsRequired; lvl++) stars[lvl] = 3;
      wp.levelStars = stars;
      wp.levelsCompleted = w.levelsRequired;
      wp.starsEarned = w.levelsRequired * 3;
      wp.unlocked = true;
    }
    // Rebuild the star counter from scratch so the header chip stays consistent.
    let total = 0;
    for (const id in this.worldProgress) total += this.worldProgress[id].starsEarned || 0;
    this.totalStars = total;
    this.checkWorldUnlock(null);
    this.save();
  }

  // Dad's Garage daily note. Returns { isNewDay, message, index } where
  // isNewDay=true means caller should award the daily stardust and show
  // the note as "today's". Draws notes in RANDOM order from a shuffled deck:
  // every note is shown once before any repeats, and the deck reshuffles each
  // cycle — so it's unpredictable but never skips a note.
  // Pull today's note for a daily board. `stateKey` selects which independent
  // board's state to use — 'dadNoteState' (the garage whiteboard) by default, or
  // 'recessNoteState' for the recess playground board — so each board rotates and
  // pays out once per day independently of the other.
  claimDailyDadNoteIfDue(notes, stateKey = 'dadNoteState') {
    if (!notes || notes.length === 0) return { isNewDay: false, message: '', index: 0 };
    // Local calendar date (YYYY-MM-DD) — must match EconomyManager.todayString so
    // the note and its daily stardust reset together at LOCAL midnight. Using UTC
    // here rolled the note over hours early/late for non-UTC players.
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const N = notes.length;
    const state = this[stateKey] || {};
    const isNewDay = state.lastClaimDate !== today;

    if (!isNewDay) {
      // Same day — re-show the note already claimed today. (nextIndex is the
      // legacy sequential field; honored here so a same-day upgrade keeps
      // showing the note the kid already saw.)
      let index = 0;
      if (Number.isInteger(state.lastIndex)) index = ((state.lastIndex % N) + N) % N;
      else if (Number.isInteger(state.nextIndex)) index = (((state.nextIndex - 1) % N) + N) % N;
      return { isNewDay: false, message: notes[index], index };
    }

    // New day: deal the next index off a shuffled deck. Rebuild + reshuffle when
    // the deck is missing/exhausted or the notes list changed length, so every
    // note is seen once per cycle in a fresh random order. The reshuffle avoids
    // dealing yesterday's note first (no back-to-back repeat across cycles).
    let deck = Array.isArray(state.deck) ? state.deck.slice() : [];
    if (deck.length === 0 || state.deckN !== N) {
      deck = this._shuffledNoteDeck(N, state.lastIndex);
    }
    const index = deck.shift();
    this[stateKey] = { lastClaimDate: today, deck, deckN: N, lastIndex: index };
    this.save();
    return { isNewDay: true, message: notes[index], index };
  }

  // Fisher-Yates shuffle of [0..N). When `avoidFirst` is a valid index, makes
  // sure the deck doesn't start with it (prevents the same note two days in a
  // row across a deck boundary).
  _shuffledNoteDeck(N, avoidFirst) {
    const deck = Array.from({ length: N }, (_, i) => i);
    for (let i = N - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    if (N > 1 && deck[0] === avoidFirst) {
      [deck[0], deck[1]] = [deck[1], deck[0]];
    }
    return deck;
  }

  markTutorialSeen() {
    if (this.tutorialSeen) return;
    this.tutorialSeen = true;
    this.save();
  }

  markCosmicHintSeen() {
    if (this.cosmicHintSeen) return;
    this.cosmicHintSeen = true;
    this.save();
  }

  // Endless mode best (60s timed sprint score).
  recordEndlessScore(score) {
    if (score > (this.arcade.endlessBest || 0)) {
      this.arcade.endlessBest = score;
      this.save();
      return true;
    }
    return false;
  }

  // Boss Rush best (lower time + higher accuracy is better — caller decides).
  recordBossRushResult({ won, timeMs, correct, total }) {
    const accuracy = total > 0 ? correct / total : 0;
    const prev = this.arcade.bossRushBest;
    // Only a WIN can be a "best". A first-ever run that was a loss must NOT be
    // stored (otherwise `!prev` would record the defeat and flash "NEW BEST!").
    const isBest = won && (!prev || !prev.won || accuracy > prev.accuracy
      || (accuracy === prev.accuracy && timeMs < prev.timeMs));
    if (isBest) {
      this.arcade.bossRushBest = { won, timeMs, correct, total, accuracy };
      this.save();
      return true;
    }
    return false;
  }

  // Record a fact attempt with spaced repetition (Section 4.3) + speed-based
  // automaticity. `elapsedMs` is the kid's response time (from GameScene); pass
  // null/undefined when timing isn't available (the speed fields then hold).
  recordFactAttempt(a, b, correct, elapsedMs = null) {
    const key = `${Math.min(a, b)}x${Math.max(a, b)}`;
    if (!this.factMastery[key]) {
      this.factMastery[key] = {
        correct: 0,
        total: 0,
        lastSeen: Date.now(),
        interval: 0,        // Days until next review (0 = immediate)
        nextReview: Date.now(), // When fact is due
        streak: 0,          // Consecutive correct answers
        recentMs: 0,        // EWMA of correct response times (automaticity)
        fastStreak: 0,      // Consecutive correct+fast (< fluency cap) answers
        automatic: false    // True once fastStreak reaches AUTOMATIC_FAST_STREAK
      };
    }

    const fact = this.factMastery[key];

    // Ensure all fields exist (for old save data migration)
    if (fact.streak === undefined) fact.streak = 0;
    if (fact.interval === undefined) fact.interval = 0;
    if (fact.nextReview === undefined) fact.nextReview = Date.now();
    if (fact.recentMs === undefined) fact.recentMs = 0;
    if (fact.fastStreak === undefined) fact.fastStreak = 0;
    if (fact.automatic === undefined) fact.automatic = false;

    fact.total++;
    fact.lastSeen = Date.now();

    if (correct) {
      fact.correct++;
      fact.streak++;
      // Extend interval based on streak (modified SM-2)
      // Intervals: immediate -> same session -> 1 day -> 3 days -> 7 days -> 14 days
      const intervals = [0, 0, 1, 3, 7, 14, 30];
      const intervalIndex = Math.min(fact.streak, intervals.length - 1);
      fact.interval = intervals[intervalIndex];
      fact.nextReview = Date.now() + (fact.interval * 24 * 60 * 60 * 1000);

      // Speed-based automaticity. Only correct answers carry timing signal —
      // a wrong answer's elapsed time reflects confusion, not recall speed.
      if (typeof elapsedMs === 'number' && elapsedMs > 0) {
        fact.recentMs = fact.recentMs > 0
          ? fact.recentMs * 0.7 + elapsedMs * 0.3
          : elapsedMs;
        if (elapsedMs <= FLUENCY_CAP_MS) fact.fastStreak++;
        else fact.fastStreak = 0; // correct but slow breaks the fast streak
        fact.automatic = fact.fastStreak >= AUTOMATIC_FAST_STREAK;
      }
    } else {
      // Wrong answer - reset to immediate review and de-certify automaticity.
      fact.streak = 0;
      fact.interval = 0;
      fact.nextReview = Date.now(); // Due immediately
      fact.fastStreak = 0;
      fact.automatic = false;
    }

    this.save();
  }

  // Get mastery percentage for a table (partners 1..12)
  getTableMastery(table) {
    let correct = 0;
    let total = 0;

    for (let i = 1; i <= 12; i++) {
      const key = `${Math.min(table, i)}x${Math.max(table, i)}`;
      if (this.factMastery[key]) {
        correct += this.factMastery[key].correct;
        total += this.factMastery[key].total;
      }
    }

    return total > 0 ? Math.round((correct / total) * 100) : 0;
  }

  // Complete a level
  completeLevel(worldId, levelNum, stars) {
    const wp = this.worldProgress[worldId];
    const prevStars = wp.levelStars[levelNum] || 0;

    // Only update if better
    if (stars > prevStars) {
      wp.levelStars[levelNum] = stars;
      wp.starsEarned += (stars - prevStars);
      this.totalStars += (stars - prevStars);
    }

    // Update levels completed
    wp.levelsCompleted = Object.keys(wp.levelStars).length;

    // Check if next world should unlock
    this.checkWorldUnlock(worldId);

    this.save();
  }

  checkWorldUnlock(_completedWorldId) {
    // Sequential unlock WITHIN each chapter: world N+1 unlocks when world N has
    // all its challenges cleared. Each chapter's FIRST world has its own gate:
    //   • Chapter 1 (Moon Base) is always unlocked.
    //   • Chapter 2 (Bloodstream) unlocks once "Universe's End" (World 11, the
    //     Chapter 1 finale) is fully cleared — the same condition that reveals
    //     the warp gate, so the wormhole and the unlocked first inner world
    //     appear together right after the Void cracks open.
    // Hidden worlds (15/16) are NOT in this chain — they unlock via warp-asteroid
    // discovery (see discoverHiddenWorld).
    for (const chapter of [1, 2]) {
      const worlds = getChapterWorlds(chapter);
      for (let i = 0; i < worlds.length; i++) {
        const world = worlds[i];
        const wp = this.worldProgress[world.id];
        if (!wp) continue;
        if (i === 0) {
          // First world of the chapter: gate on the chapter's entry condition.
          // Never re-lock (matches original behavior of only flipping → true).
          // Inner Space (Chapter 2) opens only after the Chapter 1 finale —
          // "Universe's End" (World 11) — is beaten and the Void cracks open,
          // pulling the player inward. This matches the warp-gate reveal on the
          // map so the wormhole and the unlocked first world appear together.
          if (chapter === 1 || this.isWorldFullyCleared(CHAPTER1_FINAL_ID)) wp.unlocked = true;
          continue;
        }
        const prev = worlds[i - 1];
        const prevWp = this.worldProgress[prev.id];
        const prevCleared = prevWp && Object.keys(prevWp.levelStars).length >= prev.levelsRequired;
        if (prevCleared && !wp.unlocked) {
          wp.unlocked = true;
        }
      }
    }
    // Hidden worlds: unlocked iff discovered. (They are accessed from glitch
    // nodes on the map, not the sequential chain.)
    for (const h of HIDDEN_WORLDS) {
      const wp = this.worldProgress[h.id];
      if (wp) wp.unlocked = this.isHiddenWorldDiscovered(h.id);
    }
  }

  // How badly a fact needs practice — the automaticity NEED score (higher =
  // more in need). Drives weak-fact targeting. Three signals, layered:
  //   1. Inaccuracy — a fact you get wrong needs work most (dominant weight).
  //   2. Accurate-but-slow — correct but over the fluency cap and not yet
  //      automatic. THIS is the core automaticity signal the old engine
  //      ignored: the kid who is right but counting on fingers.
  //   3. Decay — a once-automatic fact whose spaced-repetition review is
  //      overdue resurfaces so it stays sharp (activates the dormant
  //      nextReview logic). Keeps the already-fluent kid's facts fresh.
  _automaticityNeedScore(data) {
    const accuracy = data.total > 0 ? data.correct / data.total : 0;
    let score = (1 - accuracy) * 2;
    if (accuracy >= 0.7 && !data.automatic) {
      if (data.recentMs > 0) {
        score += Math.min(1, Math.max(0, (data.recentMs - FLUENCY_CAP_MS) / FLUENCY_CAP_MS));
      } else {
        score += 0.5; // accurate but never timed → still worth a fast rep
      }
    }
    if (data.automatic && data.nextReview && Date.now() > data.nextReview) {
      score += 0.8;
    }
    return score;
  }

  // Facts the player has attempted, ranked most-in-need first by the
  // automaticity need score, tie-broken by fewest attempts (surface novel ones).
  rankedWeakFacts(minTotal = 2) {
    const facts = [];
    for (const [key, data] of Object.entries(this.factMastery)) {
      if (!data || data.total < minTotal) continue;
      const [a, b] = key.split('x').map(Number);
      if (a < 1 || b < 1 || a > 12 || b > 12) continue;
      facts.push({
        a, b,
        accuracy: data.correct / data.total,
        total: data.total,
        recentMs: data.recentMs || 0,
        automatic: !!data.automatic,
        score: this._automaticityNeedScore(data)
      });
    }
    facts.sort((x, y) => y.score - x.score || x.total - y.total);
    return facts;
  }

  // Returns null on fresh saves so callers can fall back to random sampling.
  // Top third by need, floor 3 / cap 8 — focused without becoming repetitive
  // on a single fact.
  pickWeakFact() {
    const facts = this.rankedWeakFacts();
    if (facts.length === 0) return null;
    const poolSize = Math.min(Math.max(3, Math.ceil(facts.length / 3)), 8);
    const pool = facts.slice(0, poolSize);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  isWorldFullyCleared(worldId) {
    const wp = this.worldProgress[worldId];
    const world = WORLDS.find(w => w.id === worldId);
    if (!wp || !world) return false;
    return Object.keys(wp.levelStars).length >= world.levelsRequired;
  }

  isWorldUnlocked(worldId) {
    return this.worldProgress[worldId]?.unlocked || false;
  }

  getWorldProgress(worldId) {
    return this.worldProgress[worldId];
  }

  // Get mastery percentage for a specific fact (for analytics)
  getFactMastery(a, b) {
    const key = `${Math.min(a, b)}x${Math.max(a, b)}`;
    const fact = this.factMastery[key];
    if (!fact || fact.total === 0) return 0;
    return Math.round((fact.correct / fact.total) * 100);
  }

  // Has this fact been certified automatic (correct + fast, repeatedly)?
  isAutomatic(a, b) {
    const key = `${Math.min(a, b)}x${Math.max(a, b)}`;
    return !!this.factMastery[key]?.automatic;
  }

  // Per-fact automaticity status for the parent dashboard grid:
  //   'automatic'    — fast + accurate (gold)
  //   'slow'         — accurate (>=70%) but not yet automatic (the gap to close)
  //   'inaccurate'   — below 70% accuracy
  //   'unseen'       — not yet attempted
  getFactStatus(a, b) {
    const key = `${Math.min(a, b)}x${Math.max(a, b)}`;
    const fact = this.factMastery[key];
    if (!fact || fact.total === 0) return 'unseen';
    if (fact.automatic) return 'automatic';
    return (fact.correct / fact.total) >= 0.7 ? 'slow' : 'inaccurate';
  }

  // Dashboard summary across the 78 unique facts (1..12, a<=b). Counts how many
  // are automatic, accurate-but-slow, still inaccurate, and untouched.
  getAutomaticityStats() {
    let automatic = 0, slow = 0, inaccurate = 0, attempted = 0;
    const totalFacts = 78; // 12*13/2 unique normalized facts
    for (let a = 1; a <= 12; a++) {
      for (let b = a; b <= 12; b++) {
        const status = this.getFactStatus(a, b);
        if (status === 'unseen') continue;
        attempted++;
        if (status === 'automatic') automatic++;
        else if (status === 'slow') slow++;
        else inaccurate++;
      }
    }
    return { automatic, slow, inaccurate, attempted, totalFacts };
  }

  // Accurate-but-slow facts — the actionable automaticity gap for parents.
  // Correct most of the time but still over the fluency cap (not automatic),
  // ranked slowest-first.
  getSlowFacts(count = 8) {
    const out = [];
    for (const [key, data] of Object.entries(this.factMastery)) {
      if (!data || data.total < 2) continue;
      const [a, b] = key.split('x').map(Number);
      if (a < 1 || b < 1 || a > 12 || b > 12) continue;
      if (data.automatic) continue;
      if ((data.correct / data.total) < 0.7) continue; // that's an accuracy problem
      out.push({ a, b, recentMs: Math.round(data.recentMs || 0), total: data.total });
    }
    out.sort((x, y) => y.recentMs - x.recentMs);
    return out.slice(0, count);
  }

  // SM-2 weakness predicate. Used by the wrong-answer flow to decide whether
  // to interrupt with a correction card. A fact qualifies as weak when the
  // player has seen it more than once and is averaging below 70% — i.e.
  // there's a real pattern of struggle, not just a single slip-up on a
  // fresh fact. Returning false on first-misses keeps gameplay snappy.
  isFactWeak(a, b) {
    const key = `${Math.min(a, b)}x${Math.max(a, b)}`;
    const fact = this.factMastery[key];
    if (!fact || fact.total < 2) return false;
    return (fact.correct / fact.total) < 0.7;
  }

  // Get most missed facts for analytics — strictly lowest-accuracy first
  // (rankedWeakFacts now sorts by overall need, which includes slow-but-correct
  // facts; "most missed" must stay accuracy-based for the dashboard label).
  getMostMissedFacts(count = 5) {
    return this.rankedWeakFacts(3)
      .filter(f => f.accuracy < 0.7) // accuracy problems only — slow-but-accurate
                                     // facts belong to the speed list, not here
      .sort((x, y) => x.accuracy - y.accuracy || y.total - x.total)
      .slice(0, count)
      .map(f => ({
        a: f.a,
        b: f.b,
        accuracy: Math.round(f.accuracy * 100),
        total: f.total
      }));
  }
}

// Singleton
export const progress = new PlayerProgress();

// Per-world music tempo. Pitches `levels.mp3` up/down via Web Audio
// playbackRate so each world reads a little differently. 2^(n/12) gives
// n semitones: +1=1.0595, +0.5≈1.0293, -2=0.8909, -3=0.8409. Default 1.0.
const WORLD_MUSIC_RATE = {
  1: 1.0,
  4: 1.0595,   // crystal sparkle: +1 semitone
  6: 0.8909,   // frost: -2 semitones
  9: 0.8409,   // void: -3 semitones
  11: 1.0293,  // final: +0.5 semitones
  // Chapter 2 — "Inner Space" reads warmer/closer than the cold cosmos. The
  // bespoke level theme is organic/wet, so per-world pitch stays subtle (≤ ±1
  // semitone): deep downshifts on a resampled organic track turn muddy.
  21: 1.0293,  // bloodstream: +0.5 (a quickened pulse)
  22: 1.0,     // cell city: neutral
  23: 1.0595,  // nucleus vault: +1 (bright, crystalline)
  24: 0.9439,  // neuron forest: -1 (low, electric hush)
  25: 1.0,     // marrow caverns: neutral
  26: 0.9719,  // immune front: -0.5 (tense)
  27: 0.9439,  // mitochondria core: -1 (furnace rumble)
  28: 0.9439,  // singularity cell: -1 (finale gravitas, kept clean)
};
export function getWorldMusicRate(worldId) {
  return WORLD_MUSIC_RATE[worldId] ?? 1.0;
}
