// World and progression data.
// Math is no longer per-world — every world contains the full 12×12 set.
// Worlds are pure progression / theming, gated by total stars.
// `levelsRequired` is 3 (mult, div, mixed) for Phase 1.
// Phase 3 will add a 4th boss slot and bump to 4 — see LEVEL_MODES in LevelSelectScene.

export const WORLDS = [
  {
    id: 1,
    name: 'Moon Base',
    color: 0x4a4a6a,
    accentColor: 0x81ecec,
    description: 'Where it all begins — your first hop into the dark.',
    levelsRequired: 3,
    unlockStars: 0
  },
  {
    id: 2,
    name: 'Asteroid Belt',
    color: 0x6b4423,
    accentColor: 0xf39c12,
    description: 'Dodging the rubble of long-gone planets.',
    levelsRequired: 3,
    unlockStars: 5
  },
  {
    id: 3,
    name: 'Crystal Planet',
    color: 0x4a235a,
    accentColor: 0xa29bfe,
    description: 'A world where time chimes like glass.',
    levelsRequired: 3,
    unlockStars: 12
  },
  {
    id: 4,
    name: 'Nebula Gardens',
    color: 0x1e4d2b,
    accentColor: 0x58d68d,
    description: 'Drifting clouds of color and quiet warmth.',
    levelsRequired: 3,
    unlockStars: 22
  },
  {
    id: 5,
    name: 'Robot Station',
    color: 0x2c3e50,
    accentColor: 0x5dade2,
    description: 'An automated outpost humming with ancient code.',
    levelsRequired: 3,
    unlockStars: 35
  },
  {
    id: 6,
    name: 'Black Hole Edge',
    color: 0x1a1a2e,
    accentColor: 0xff6b9d,
    description: 'Light bends. So does logic.',
    levelsRequired: 3,
    unlockStars: 50
  },
  {
    id: 7,
    name: 'Ice Comet',
    color: 0x2e4a62,
    accentColor: 0x74b9ff,
    description: 'A frozen tail blazing across the sky.',
    levelsRequired: 3,
    unlockStars: 65
  },
  {
    id: 8,
    name: 'Supernova',
    color: 0x4a1a1a,
    accentColor: 0xff7675,
    description: "A star's last brilliant breath.",
    levelsRequired: 3,
    unlockStars: 80
  },
  {
    id: 9,
    name: 'Galactic Core',
    color: 0x2d132c,
    accentColor: 0xf7dc6f,
    description: 'The bright, dense heart of your home galaxy.',
    levelsRequired: 3,
    unlockStars: 95
  },
  {
    id: 10,
    name: 'Parallel Dimension',
    color: 0x0a3d62,
    accentColor: 0x82ccdd,
    description: 'Familiar yet strange — the rules feel sideways.',
    levelsRequired: 3,
    unlockStars: 110
  },
  {
    id: 11,
    name: "Universe's End",
    color: 0x1e1e1e,
    accentColor: 0xffeaa7,
    description: 'The last horizon. Beyond, only theories.',
    levelsRequired: 3,
    unlockStars: 125
  }
];

// Mode → human-readable label and config used by GameScene/LevelSelectScene.
// Cut: speed/missing/multi — every level is timed now (timer comes from world),
// and missing/multi target advanced cognition rather than automaticity.
export const MODES = {
  mult:  { label: 'Multiply', symbol: '×',  duration: 60, scoreThreshold: 18 },
  div:   { label: 'Divide',   symbol: '÷',  duration: 60, scoreThreshold: 14 },
  mixed: { label: 'Mixed',    symbol: '×÷', duration: 60, scoreThreshold: 16 }
};

// Generate one problem for the given mode.
// Math is no longer constrained by world — facts are sampled freely from 1..12.
// `worldId` is accepted for back-compat but only used for theming elsewhere.
// Returns { display, a, b, op, answer, factKey }.
export function getProblemForWorld(_worldId, mode = 'mult') {
  // Decide operation
  let op = mode;
  if (mode === 'mixed') {
    op = Math.random() < 0.5 ? 'mult' : 'div';
  }

  // ~30% chance: surface a fact that's due for review (priority loop).
  let a, b;
  if (Math.random() < 0.3) {
    const due = progress.getFactsDueForReview()
      .filter(f => Math.max(f.a, f.b) <= 12);
    if (due.length > 0) {
      const pf = due[0];
      a = pf.a;
      b = pf.b;
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
        this.worldProgress = data.worldProgress || this.getDefaultWorldProgress();
        this.factMastery = data.factMastery || {};
        this.totalStars = data.totalStars || 0;
        this.currentWorld = data.currentWorld || 1;
        this.companion = { ...this.getDefaultCompanion(), ...(data.companion || {}) };
        this.streak = { ...this.getDefaultStreak(), ...(data.streak || {}) };
        this.parentSettings = { ...this.getDefaultParentSettings(), ...(data.parentSettings || {}) };
        this.economy = { ...this.getDefaultEconomy(), ...(data.economy || {}) };
        this.ship = this.mergeShip(data.ship);
        this.cosmetics = this.mergeCosmetics(data.cosmetics);
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
    this.streak = this.getDefaultStreak();
    this.parentSettings = this.getDefaultParentSettings();
    this.economy = this.getDefaultEconomy();
    this.ship = this.getDefaultShip();
    this.cosmetics = this.getDefaultCosmetics();
    this.save();
  }

  getDefaultCompanion() {
    return {
      speciesId: null,            // 'ember' | 'tide' | 'sprout' — null = needs starter pick
      stage: 'egg',               // 'egg' | 'baby' | 'teen' | 'adult'
      totalPellets: 0,            // lifetime food eaten — drives evolution
      lastFedAt: Date.now(),
      lastVisitedAt: Date.now()   // updated whenever the kid opens the app — drives "missed you" greeting
    };
  }

  getDefaultStreak() {
    return {
      current: 0,
      best: 0,
      lastPlayDate: null,         // 'YYYY-MM-DD'
      milestonesEarned: []        // [3, 7, 30] etc.
    };
  }

  getDefaultParentSettings() {
    return {};
  }

  getDefaultEconomy() {
    return {
      stardust: 0
    };
  }

  getDefaultShip() {
    return {
      parts: { hull: 'hull_default', wings: 'wings_default', paint: 'paint_default', decal: null },
      ownedParts: ['hull_default', 'wings_default', 'paint_default'],
      newSinceLastView: []
    };
  }

  getDefaultCosmetics() {
    return {
      pet: { hat: null, accessory: null },
      ownedIds: [],
      newSinceLastView: []
    };
  }

  mergeShip(saved) {
    const def = this.getDefaultShip();
    if (!saved) return def;
    return {
      parts: { ...def.parts, ...(saved.parts || {}) },
      ownedParts: Array.isArray(saved.ownedParts) ? saved.ownedParts : def.ownedParts,
      newSinceLastView: Array.isArray(saved.newSinceLastView) ? saved.newSinceLastView : []
    };
  }

  mergeCosmetics(saved) {
    const def = this.getDefaultCosmetics();
    if (!saved) return def;
    return {
      pet: { ...def.pet, ...(saved.pet || {}) },
      ownedIds: Array.isArray(saved.ownedIds) ? saved.ownedIds : [],
      newSinceLastView: Array.isArray(saved.newSinceLastView) ? saved.newSinceLastView : []
    };
  }

  getDefaultWorldProgress() {
    const progress = {};
    for (const world of WORLDS) {
      progress[world.id] = {
        unlocked: (world.unlockStars || 0) === 0,
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
        streak: this.streak,
        parentSettings: this.parentSettings,
        economy: this.economy,
        ship: this.ship,
        cosmetics: this.cosmetics
      }));
    } catch (e) {
      console.warn('Could not save progress');
    }
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

  // Get facts that are due for review
  getFactsDueForReview() {
    const now = Date.now();
    const dueFacts = [];

    for (const [key, fact] of Object.entries(this.factMastery)) {
      if (fact.nextReview <= now) {
        const [a, b] = key.split('x').map(Number);
        dueFacts.push({
          key,
          a,
          b,
          product: a * b,
          priority: this.getFactPriority(fact)
        });
      }
    }

    // Sort by priority (higher = more urgent)
    return dueFacts.sort((x, y) => y.priority - x.priority);
  }

  // Calculate priority for a fact (higher = needs more practice)
  getFactPriority(fact) {
    let priority = 0;

    // Recently wrong = high priority
    if (fact.streak === 0 && fact.total > 0) {
      priority += 100;
    }

    // Low accuracy = higher priority
    const accuracy = fact.total > 0 ? fact.correct / fact.total : 0.5;
    priority += (1 - accuracy) * 50;

    // Overdue = higher priority
    const overdueDays = (Date.now() - fact.nextReview) / (24 * 60 * 60 * 1000);
    if (overdueDays > 0) {
      priority += Math.min(overdueDays * 10, 50);
    }

    return priority;
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
    // Stars-based unlock — re-evaluate every world after each level completion.
    for (const world of WORLDS) {
      const wp = this.worldProgress[world.id];
      if (!wp || wp.unlocked) continue;
      if (this.totalStars >= (world.unlockStars || 0)) {
        wp.unlocked = true;
      }
    }
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
    const facts = [];

    for (const [key, data] of Object.entries(this.factMastery)) {
      if (data.total >= 3) { // Only include facts with enough attempts
        const [a, b] = key.split('x').map(Number);
        const accuracy = Math.round((data.correct / data.total) * 100);
        facts.push({ a, b, accuracy, total: data.total });
      }
    }

    // Sort by accuracy (lowest first)
    facts.sort((x, y) => x.accuracy - y.accuracy);

    return facts.slice(0, count);
  }
}

// Singleton
export const progress = new PlayerProgress();
