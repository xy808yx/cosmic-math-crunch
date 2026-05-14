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
  {
    id: 1,
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
    name: "Universe's End",
    color: 0x4a4a8c,
    accentColor: 0xfff3b8,
    description: 'The last horizon. The final stand against the Void.',
    villain: 'The Void Devourer',
    flavorText: 'The Void shatters. Stars relight across every world.',
    levelsRequired: 4,
    bigBoss: true
  },
  // Hidden worlds — discovered via warp asteroids in specific levels.
  // Not part of the main world map S-curve. Don't gate the ending.
  {
    id: 15,
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
    name: "Dad's Garage",
    color: 0xc88a3a,
    accentColor: 0xffe07a,
    description: "The garage where Dad tinkers between worlds.",
    villain: null,
    flavorText: 'You found it. Dad smiles at the screen.',
    levelsRequired: 1,
    hidden: true,
    discoveredFrom: { worldId: 9, mode: 'mixed' },
    kind: 'exploration'
  }
];

// Visible worlds — the main world map S-curve.
export const VISIBLE_WORLDS = WORLDS.filter(w => !w.hidden);

// Hidden worlds — discoverable via warp asteroids.
export const HIDDEN_WORLDS = WORLDS.filter(w => w.hidden);

// The final visible boss — beating it triggers the endgame cinematic + credits.
export const FINAL_VISIBLE_WORLD_ID =
  VISIBLE_WORLDS[VISIBLE_WORLDS.length - 1].id;

// True if this world is the FINAL visible world (last boss = end-of-game).
export function isFinalVisibleWorld(worldId) {
  return worldId === FINAL_VISIBLE_WORLD_ID;
}

// Returns the next visible world id (for ship auto-advance), or null at the end.
export function getNextVisibleWorldId(currentId) {
  const idx = VISIBLE_WORLDS.findIndex(w => w.id === currentId);
  if (idx < 0 || idx === VISIBLE_WORLDS.length - 1) return null;
  return VISIBLE_WORLDS[idx + 1].id;
}

// Find a world by id (visible or hidden). Used by GameScene/HiddenWorldScene.
export function findWorld(worldId) {
  return WORLDS.find(w => w.id === worldId) || null;
}

// Which hidden world (if any) is reachable from this (worldId, mode) host?
export function getHiddenWorldForHost(worldId, mode) {
  return HIDDEN_WORLDS.find(h =>
    h.discoveredFrom?.worldId === worldId &&
    h.discoveredFrom?.mode === mode
  ) || null;
}

// Mode → human-readable label and config used by GameScene/LevelSelectScene.
// Cut: speed/missing/multi — every level is timed now (timer comes from world),
// and missing/multi target advanced cognition rather than automaticity.
export const MODES = {
  mult:  { label: 'Multiply', symbol: '×',  duration: 60, scoreThreshold: 18 },
  div:   { label: 'Divide',   symbol: '÷',  duration: 60, scoreThreshold: 14 },
  mixed: { label: 'Mixed',    symbol: '×÷', duration: 60, scoreThreshold: 16 }
};

// Per-problem timer (seconds) keyed by world id. Drives asteroid descent speed.
// Phase 2 uses this to size each asteroid's fall duration; Phase 3 will also
// drive multi-asteroid spawn cadence.
const WORLD_PROBLEM_SECONDS = {
  1: 7.0,  2: 6.0,  3: 5.5,  4: 5.0,  5: 4.5,
  6: 4.0,  7: 3.5,  8: 3.0,  9: 2.5,  10: 2.0,  11: 1.5,
  // Hidden worlds use their own pacing (read lazily).
  15: 2.0,  16: 4.0
};

function getProblemSecondsForWorld(worldId) {
  return WORLD_PROBLEM_SECONDS[worldId] ?? 6.0;
}

// Number of asteroids on screen at once. Worlds 1–5 = 1, 6–8 = 2, 9–11 = 3.
// Hidden Glitch World (15) plays with W11 density; Workshop (16) is non-combat.
export function getAsteroidCountForWorld(worldId) {
  if (worldId === 15) return 3;
  if (worldId === 16) return 0;
  if (worldId <= 5) return 1;
  if (worldId <= 8) return 2;
  return 3;
}

// Boss timer adds +1.0s to the world's per-problem timer — boss is rigorous
// on accuracy, not chaotic on speed.
const BOSS_TIMER_BONUS_S = 1.0;
export function getProblemSecondsForWorldAndMode(worldId, mode) {
  const base = getProblemSecondsForWorld(worldId);
  return mode === 'boss' ? base + BOSS_TIMER_BONUS_S : base;
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
export function getBossHpForWorld(worldId) {
  if (worldId === 11) return 48;       // Void Devourer — 4 phases of ~12 hp each.
  if (worldId === 15) return 14;       // Glitch World mini-boss (Datamosh).
  return 8 + worldId * 2;
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
// Fact-pool weighting (Phase 3):
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
        this.hiddenWorldBest = { 15: null, ...(data.hiddenWorldBest || {}) };
        this.arcade = { endlessBest: 0, bossRushBest: null, ...(data.arcade || {}) };
        this.petHelperUsed = !!data.petHelperUsed; // big-boss helper consumed
        this.dadNoteState = { lastClaimDate: null, nextIndex: 0, ...(data.dadNoteState || {}) };
        this.tutorialSeen = !!data.tutorialSeen;
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
    this.hiddenWorldBest = { 15: null };
    this.arcade = { endlessBest: 0, bossRushBest: null };
    this.petHelperUsed = false;
    this.dadNoteState = { lastClaimDate: null, nextIndex: 0 };
    this.tutorialSeen = false;
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
        decal: null,
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
        hiddenWorldBest: this.hiddenWorldBest,
        arcade: this.arcade,
        petHelperUsed: this.petHelperUsed,
        dadNoteState: this.dadNoteState,
        tutorialSeen: this.tutorialSeen
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
    this.save();
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

  // Force-unlock every visible world (dev menu only).
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

  // Glitch World best clear time. Lower is better. Returns true if updated.
  recordGlitchClearTime(timeMs) {
    const prev = this.hiddenWorldBest?.[15];
    if (prev == null || timeMs < prev) {
      this.hiddenWorldBest = { ...(this.hiddenWorldBest || {}), 15: timeMs };
      this.save();
      return true;
    }
    return false;
  }

  getGlitchBest() {
    return this.hiddenWorldBest?.[15] ?? null;
  }

  // Dad's Garage daily note. Returns { isNewDay, message, index } where
  // isNewDay=true means caller should award the daily stardust and show
  // the note as "today's". Cycles sequentially through the notes array.
  claimDailyDadNoteIfDue(notes) {
    if (!notes || notes.length === 0) return { isNewDay: false, message: '', index: 0 };
    const today = new Date().toISOString().slice(0, 10);
    const state = this.dadNoteState || { lastClaimDate: null, nextIndex: 0 };
    const isNewDay = state.lastClaimDate !== today;
    const index = state.nextIndex % notes.length;
    const message = notes[index];
    if (isNewDay) {
      this.dadNoteState = {
        lastClaimDate: today,
        nextIndex: (index + 1) % notes.length
      };
      this.save();
    }
    return { isNewDay, message, index };
  }

  markTutorialSeen() {
    if (this.tutorialSeen) return;
    this.tutorialSeen = true;
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
    const isBest = !prev || (won && (!prev.won || accuracy > prev.accuracy
      || (accuracy === prev.accuracy && timeMs < prev.timeMs)));
    if (isBest) {
      this.arcade.bossRushBest = { won, timeMs, correct, total, accuracy };
      this.save();
      return true;
    }
    return false;
  }

  // Record a fact attempt with spaced repetition (Section 4.3)
  recordFactAttempt(a, b, correct) {
    const key = `${Math.min(a, b)}x${Math.max(a, b)}`;
    if (!this.factMastery[key]) {
      this.factMastery[key] = {
        correct: 0,
        total: 0,
        lastSeen: Date.now(),
        interval: 0,        // Days until next review (0 = immediate)
        nextReview: Date.now(), // When fact is due
        streak: 0           // Consecutive correct answers
      };
    }

    const fact = this.factMastery[key];

    // Ensure all fields exist (for old save data migration)
    if (fact.streak === undefined) fact.streak = 0;
    if (fact.interval === undefined) fact.interval = 0;
    if (fact.nextReview === undefined) fact.nextReview = Date.now();

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
    } else {
      // Wrong answer - reset to immediate review
      fact.streak = 0;
      fact.interval = 0;
      fact.nextReview = Date.now(); // Due immediately
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
    // World N+1 unlocks when world N has all 4 challenges cleared. World 1 is
    // always unlocked. Hidden worlds (15+) are NOT part of this sequential
    // chain — they unlock via warp-asteroid discovery (see discoverHiddenWorld).
    for (let i = 0; i < VISIBLE_WORLDS.length; i++) {
      const world = VISIBLE_WORLDS[i];
      const wp = this.worldProgress[world.id];
      if (!wp) continue;
      if (i === 0) {
        wp.unlocked = true;
        continue;
      }
      const prev = VISIBLE_WORLDS[i - 1];
      const prevWp = this.worldProgress[prev.id];
      const prevCleared = prevWp && Object.keys(prevWp.levelStars).length >= prev.levelsRequired;
      if (prevCleared && !wp.unlocked) {
        wp.unlocked = true;
      }
    }
    // Hidden worlds: unlocked iff discovered. (They are accessed from glitch
    // nodes on the map, not the sequential chain.)
    for (const h of HIDDEN_WORLDS) {
      const wp = this.worldProgress[h.id];
      if (wp) wp.unlocked = this.isHiddenWorldDiscovered(h.id);
    }
  }

  // Facts the player has attempted, sorted weakest-first (lowest accuracy,
  // tie-broken by fewest attempts so we surface novel weak ones).
  rankedWeakFacts(minTotal = 2) {
    const facts = [];
    for (const [key, data] of Object.entries(this.factMastery)) {
      if (!data || data.total < minTotal) continue;
      const [a, b] = key.split('x').map(Number);
      if (a < 1 || b < 1 || a > 12 || b > 12) continue;
      facts.push({ a, b, accuracy: data.correct / data.total, total: data.total });
    }
    facts.sort((x, y) => x.accuracy - y.accuracy || x.total - y.total);
    return facts;
  }

  // Returns null on fresh saves so callers can fall back to random sampling.
  // Bottom third of weakest facts, floor 3 / cap 8 — focused without becoming
  // repetitive on a single fact.
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

  // Get most missed facts for analytics
  getMostMissedFacts(count = 5) {
    return this.rankedWeakFacts(3).slice(0, count).map(f => ({
      a: f.a,
      b: f.b,
      accuracy: Math.round(f.accuracy * 100),
      total: f.total
    }));
  }
}

// Singleton
export const progress = new PlayerProgress();
