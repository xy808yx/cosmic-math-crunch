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
        // paceMs: persistent (across-session) EWMA of correct response times —
        // drives the adaptive fall speed. Unlike todayAvgMs it does NOT reset
        // daily. Cold-start from fastestPerFact so existing saves aren't jarring.
        this.paceMs = data.paceMs || 0;
        if (!this.paceMs) this._seedPaceFromFastest();
      } else {
        this.reset();
      }
    } catch (e) {
      this.reset();
    }
    // Roll today's window if the date has changed since last save.
    this.rolloverTodayIfNeeded();
  }

  // Seed paceMs from the fastest-per-fact data already on the save. Typical
  // recall is slower than a personal best, so scale the median best up a bit.
  _seedPaceFromFastest() {
    const vals = Object.values(this.fastestPerFact || {}).filter(n => n > 0).sort((a, b) => a - b);
    if (!vals.length) return;
    const median = vals[Math.floor(vals.length / 2)];
    this.paceMs = median * 1.4;
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
    this.paceMs = 0;
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
        paceMs: this.paceMs
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
  // took to answer (≥0).
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

      // Persistent pace EWMA (slow alpha so a single fast/slow answer doesn't
      // swing the adaptive difficulty). Survives the daily rollover.
      this.paceMs = this.paceMs > 0 ? this.paceMs * 0.85 + elapsedMs * 0.15 : elapsedMs;

      const key = problem?.factKey;
      if (key) {
        const prev = this.fastestPerFact[key];
        if (!prev || elapsedMs < prev) {
          this.fastestPerFact[key] = Math.round(elapsedMs);
        }
      }
    }

    this.save();
  }

  // Called from GameScene at end of level — updates the lifetime best streak.
  recordLevelComplete(bestStreakThisLevel) {
    if (bestStreakThisLevel > this.longestStreak) {
      this.longestStreak = bestStreakThisLevel;
      this.save();
    }
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

  // Persistent per-kid recall pace (ms) — drives the adaptive fall speed.
  getPaceMs() {
    return Math.round(this.paceMs || 0);
  }

  getLongestStreak() {
    return this.longestStreak;
  }

  getWorldsCleared() {
    return this.worldsCleared;
  }
}

function formatFactKey(key) {
  // factKey is "MIN x MAX" — display as "M×M".
  const [a, b] = key.split('x');
  return `${a}×${b}`;
}

export const records = new RecordsManager();
export { formatFactKey };
