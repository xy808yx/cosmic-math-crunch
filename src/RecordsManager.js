// Personal Records — replaces the old AchievementManager. No badges, no
// notifications. Just numbers that get better over time, displayed on the
// cockpit dashboard.
//
// Tracked:
//   - fastestPerFact[factKey]   ms     — best time on a specific fact
//   - longestStreak             count  — best in-session perfect streak ever
//   - todayAvgMs                ms     — rolling average response time today
//   - todaySamples              count  — samples making up today's average
//   - todayDate                 'YYYY-MM-DD' — the date `today*` reflects
//   - worldsCleared             count  — total worlds where every level is done
//   - totalCorrect              count  — lifetime correct answers
//   - totalAttempts             count  — lifetime answer attempts
//   - lastUpdatedAt             ms     — for "new record" flash decay
//
// Storage: separate localStorage key `cosmicMathRecords`.

const STORAGE_KEY = 'cosmicMathRecords';

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

class RecordsManager {
  constructor() {
    this.load();
    this._pendingFlash = null;
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.fastestPerFact = data.fastestPerFact || {};
        this.longestStreak = data.longestStreak || 0;
        this.todayAvgMs = data.todayAvgMs || 0;
        this.todaySamples = data.todaySamples || 0;
        this.todayDate = data.todayDate || todayString();
        this.worldsCleared = data.worldsCleared || 0;
        this.totalCorrect = data.totalCorrect || 0;
        this.totalAttempts = data.totalAttempts || 0;
        this.lastUpdatedAt = data.lastUpdatedAt || 0;
      } else {
        this.reset();
      }
    } catch (e) {
      this.reset();
    }
    // Roll today's window if the date has changed since last save.
    this.rolloverTodayIfNeeded();
  }

  reset() {
    this.fastestPerFact = {};
    this.longestStreak = 0;
    this.todayAvgMs = 0;
    this.todaySamples = 0;
    this.todayDate = todayString();
    this.worldsCleared = 0;
    this.totalCorrect = 0;
    this.totalAttempts = 0;
    this.lastUpdatedAt = 0;
    this.save();
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        fastestPerFact: this.fastestPerFact,
        longestStreak: this.longestStreak,
        todayAvgMs: this.todayAvgMs,
        todaySamples: this.todaySamples,
        todayDate: this.todayDate,
        worldsCleared: this.worldsCleared,
        totalCorrect: this.totalCorrect,
        totalAttempts: this.totalAttempts,
        lastUpdatedAt: this.lastUpdatedAt
      }));
    } catch (e) { /* quota exhausted; harmless */ }
  }

  rolloverTodayIfNeeded() {
    const t = todayString();
    if (this.todayDate !== t) {
      this.todayDate = t;
      this.todayAvgMs = 0;
      this.todaySamples = 0;
      this.save();
    }
  }

  // Record a single answer attempt. `problem` is the object from
  // getProblemForWorld; `correct` is bool; `elapsedMs` is the time the kid
  // took to answer (≥0). Sets _pendingFlash to a short label when a record
  // breaks, so the dashboard can render a subtle highlight.
  recordAnswer(problem, correct, elapsedMs) {
    this.rolloverTodayIfNeeded();
    this.totalAttempts++;
    if (correct) this.totalCorrect++;

    if (correct && elapsedMs > 0) {
      // Update today's rolling average (only count correct answers — wrong
      // answers don't reflect recall speed, just confusion).
      const n = this.todaySamples;
      this.todayAvgMs = (this.todayAvgMs * n + elapsedMs) / (n + 1);
      this.todaySamples = n + 1;

      // Per-fact best
      const key = problem?.factKey;
      if (key) {
        const prev = this.fastestPerFact[key];
        if (!prev || elapsedMs < prev) {
          this.fastestPerFact[key] = Math.round(elapsedMs);
          // Only flash on a real improvement of an existing record (not on
          // the very first time the fact is seen — that'd flash constantly).
          if (prev) this._flash(`Fastest ${formatFactKey(key)} ↓`);
        }
      }
    }

    this.lastUpdatedAt = Date.now();
    this.save();
  }

  // Called from GameScene at end of level. We update streak + worlds-cleared.
  recordLevelComplete(worldId, stars, bestStreakThisLevel) {
    if (bestStreakThisLevel > this.longestStreak) {
      this.longestStreak = bestStreakThisLevel;
      this._flash(`Longest streak: ${this.longestStreak}`);
    }
    this.lastUpdatedAt = Date.now();
    this.save();
  }

  // Recompute worldsCleared from progress (called on cockpit open).
  // Uses the same definition the world map uses.
  refreshWorldsCleared(progress, WORLDS) {
    let cleared = 0;
    for (const w of WORLDS) {
      const wp = progress.getWorldProgress(w.id);
      if (wp && wp.levelsCompleted >= w.levelsRequired) cleared++;
    }
    if (cleared !== this.worldsCleared) {
      this.worldsCleared = cleared;
      this.save();
    }
    return cleared;
  }

  // Public reads --------------------------------------------------------------
  getOverallStats() {
    return {
      totalCorrect: this.totalCorrect,
      totalAttempts: this.totalAttempts
    };
  }

  // Top N fastest-per-fact entries, sorted ascending by ms.
  getTopFastFacts(n = 3) {
    return Object.entries(this.fastestPerFact)
      .map(([key, ms]) => ({ key, ms }))
      .sort((a, b) => a.ms - b.ms)
      .slice(0, n);
  }

  getTodayAvgMs() {
    this.rolloverTodayIfNeeded();
    return this.todaySamples > 0 ? Math.round(this.todayAvgMs) : 0;
  }

  getTodaySamples() {
    this.rolloverTodayIfNeeded();
    return this.todaySamples;
  }

  getLongestStreak() {
    return this.longestStreak;
  }

  getWorldsCleared() {
    return this.worldsCleared;
  }

  // Returns the pending flash message (and clears it) — caller renders a
  // subtle highlight on the dashboard.
  consumeFlash() {
    const m = this._pendingFlash;
    this._pendingFlash = null;
    return m;
  }

  _flash(msg) {
    this._pendingFlash = msg;
  }
}

function formatFactKey(key) {
  // factKey is "MIN x MAX" — display as "M×M".
  const [a, b] = key.split('x');
  return `${a}×${b}`;
}

export const records = new RecordsManager();
export { formatFactKey };
