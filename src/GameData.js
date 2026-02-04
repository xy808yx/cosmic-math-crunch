// World and progression data

export const WORLDS = [
  {
    id: 1,
    name: 'Moon Base',
    tables: [1, 2],
    color: 0x4a4a6a,
    accentColor: 0x81ecec,
    description: 'Learn the basics!',
    levelsRequired: 3,
    unlocked: true
  },
  {
    id: 2,
    name: 'Asteroid Belt',
    tables: [3],
    color: 0x6b4423,
    accentColor: 0xf39c12,
    description: 'Master the 3s!',
    levelsRequired: 3,
    unlocked: false
  },
  {
    id: 3,
    name: 'Crystal Planet',
    tables: [4],
    color: 0x4a235a,
    accentColor: 0xa29bfe,
    description: 'Conquer the 4s!',
    levelsRequired: 3,
    unlocked: false
  },
  {
    id: 4,
    name: 'Nebula Gardens',
    tables: [5],
    color: 0x1e4d2b,
    accentColor: 0x58d68d,
    description: 'Learn the 5s!',
    levelsRequired: 3,
    unlocked: false
  },
  {
    id: 5,
    name: 'Robot Station',
    tables: [6],
    color: 0x2c3e50,
    accentColor: 0x5dade2,
    description: 'Master the 6s!',
    levelsRequired: 3,
    unlocked: false
  },
  {
    id: 6,
    name: 'Black Hole Edge',
    tables: [7],
    color: 0x1a1a2e,
    accentColor: 0xff6b9d,
    description: 'The tricky 7s!',
    levelsRequired: 3,
    unlocked: false
  },
  {
    id: 7,
    name: 'Ice Comet',
    tables: [8],
    color: 0x2e4a62,
    accentColor: 0x74b9ff,
    description: 'Conquer the 8s!',
    levelsRequired: 3,
    unlocked: false
  },
  {
    id: 8,
    name: 'Supernova',
    tables: [9],
    color: 0x4a1a1a,
    accentColor: 0xff7675,
    description: 'Master the 9s!',
    levelsRequired: 3,
    unlocked: false
  },
  {
    id: 9,
    name: 'Galactic Core',
    tables: [10],
    color: 0x2d132c,
    accentColor: 0xf7dc6f,
    description: 'The mighty 10s!',
    levelsRequired: 3,
    unlocked: false
  },
  {
    id: 10,
    name: 'Parallel Dimension',
    tables: [11],
    color: 0x0a3d62,
    accentColor: 0x82ccdd,
    description: 'Bonus: 11s!',
    levelsRequired: 3,
    unlocked: false
  },
  {
    id: 11,
    name: "Universe's End",
    tables: [12],
    color: 0x1e1e1e,
    accentColor: 0xffeaa7,
    description: 'Final challenge: 12s!',
    levelsRequired: 3,
    unlocked: false
  }
];

// Generate products for a given table
export function getProductsForTable(table) {
  const products = [];
  for (let i = 1; i <= 10; i++) {
    products.push(table * i);
  }
  return products;
}

// Generate available numbers for a world (factors that make sense)
export function getNumbersForWorld(worldId) {
  const world = WORLDS[worldId - 1];

  // Numbers 1-10 are always available
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Weight toward factors of current tables
  const weighted = [];
  for (const num of numbers) {
    const isKeyFactor = world.tables.includes(num) || num <= 5;
    const count = isKeyFactor ? 3 : 1;
    for (let i = 0; i < count; i++) {
      weighted.push(num);
    }
  }

  return weighted;
}

// Generate target products for a world
export function getTargetsForWorld(worldId) {
  const world = WORLDS[worldId - 1];
  const targets = [];

  for (const table of world.tables) {
    for (let i = 2; i <= 10; i++) {
      targets.push(table * i);
    }
  }

  // Shuffle
  return targets.sort(() => Math.random() - 0.5);
}

// Player progress manager
class PlayerProgress {
  constructor() {
    this.load();
    // Track consecutive failures per level (not persisted)
    this.levelFailures = {};
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
    this.levelFailures = {};
    this.save();
  }

  // Track level failures for progressive support
  recordLevelFailure(worldId, levelNum) {
    const key = `${worldId}-${levelNum}`;
    this.levelFailures[key] = (this.levelFailures[key] || 0) + 1;
    return this.levelFailures[key];
  }

  getLevelFailures(worldId, levelNum) {
    const key = `${worldId}-${levelNum}`;
    return this.levelFailures[key] || 0;
  }

  clearLevelFailures(worldId, levelNum) {
    const key = `${worldId}-${levelNum}`;
    this.levelFailures[key] = 0;
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
        currentWorld: this.currentWorld
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

  // Get priority targets for a world (facts that need review)
  getPriorityTargetsForWorld(worldId) {
    const world = WORLDS[worldId - 1];
    const dueFacts = this.getFactsDueForReview();

    // Filter to facts relevant to this world's tables
    const relevantFacts = dueFacts.filter(fact => {
      return world.tables.some(table =>
        fact.a === table || fact.b === table
      );
    });

    return relevantFacts.map(f => f.product);
  }

  // Check if there are facts due for session start review
  hasFactsDueForReview() {
    return this.getFactsDueForReview().length > 0;
  }

  // Get mastery percentage for a table
  getTableMastery(table) {
    let correct = 0;
    let total = 0;

    for (let i = 1; i <= 10; i++) {
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

  checkWorldUnlock(completedWorldId) {
    const world = WORLDS[completedWorldId - 1];
    const wp = this.worldProgress[completedWorldId];

    // Check unlock conditions
    const levelsComplete = wp.levelsCompleted >= world.levelsRequired;
    const hasMastery = world.tables.every(t => this.getTableMastery(t) >= 70);

    if (levelsComplete && hasMastery) {
      // Unlock next world
      const nextWorldId = completedWorldId + 1;
      if (nextWorldId <= WORLDS.length) {
        this.worldProgress[nextWorldId].unlocked = true;
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
