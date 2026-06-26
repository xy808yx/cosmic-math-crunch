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

// Conveyor (Chapter 3 "Stamp & Ship") instrumentation. Keyed by input mode so the
// owner can resolve the production-vs-recognition A/B from real timing data
// (Phase 6). Per mode we keep the correct-answer recall-time distribution
// (buckets) so "fast but not retrieving" clustering is visible; recognition also
// tracks how often the CORRECT answer's dock lands in the same screen slot as the
// previous crate (posRepeat / posTotal) — at full randomization this sits near
// chance (1/DOCK_COUNT ≈ 25%); a high rate means a kid could be tapping by
// position, not recalling. CONVEYOR_BUCKET_MS are the upper bounds (ms) of each
// recall-time bucket; the last bucket is the "5s+" overflow.
const CONVEYOR_BUCKET_MS = [1000, 2000, 3000, 5000];
function emptyConveyorMode(recognition) {
  const base = { count: 0, sumMs: 0, fast: 0, buckets: [0, 0, 0, 0, 0] };
  if (recognition) { base.posRepeat = 0; base.posTotal = 0; }
  return base;
}
function normalizeConveyorStats(raw) {
  const out = {
    production: emptyConveyorMode(false),
    recognition: emptyConveyorMode(true)
  };
  if (!raw) return out;
  for (const mode of ['production', 'recognition']) {
    const src = raw[mode];
    if (!src) continue;
    const dst = out[mode];
    dst.count = src.count || 0;
    dst.sumMs = src.sumMs || 0;
    dst.fast = src.fast || 0;
    if (Array.isArray(src.buckets)) {
      for (let i = 0; i < dst.buckets.length; i++) dst.buckets[i] = src.buckets[i] || 0;
    }
    if (mode === 'recognition') {
      dst.posRepeat = src.posRepeat || 0;
      dst.posTotal = src.posTotal || 0;
    }
  }
  return out;
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
        this.conveyorStats = normalizeConveyorStats(data.conveyorStats);
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
    this.conveyorStats = normalizeConveyorStats(null);
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
        paceMs: this.paceMs,
        conveyorStats: this.conveyorStats
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

  // ── Conveyor (Stamp & Ship) instrumentation ───────────────────────────────
  // Record one CORRECT crate's recall time, bucketed for the dashboard. Only
  // correct answers carry recall-speed signal (mirrors recordAnswer/factMastery).
  recordConveyorTiming(mode, elapsedMs) {
    const s = this.conveyorStats?.[mode];
    if (!s || !(elapsedMs > 0)) return;
    s.count++;
    s.sumMs += elapsedMs;
    if (elapsedMs <= 2500) s.fast++;
    let bi = CONVEYOR_BUCKET_MS.findIndex(b => elapsedMs < b);
    if (bi < 0) bi = s.buckets.length - 1;
    s.buckets[bi]++;
    this.save();
  }

  // Recognition only: log whether the CORRECT answer's dock sat in the same slot
  // as the previous crate. `repeated` is a bool; first crate of a round passes
  // null and is not counted (no previous slot to compare against).
  recordConveyorDockPosition(repeated) {
    if (repeated === null || repeated === undefined) return;
    const s = this.conveyorStats?.recognition;
    if (!s) return;
    s.posTotal++;
    if (repeated) s.posRepeat++;
    this.save();
  }

  // Summarized view for the dashboard: per mode { count, avgMs, fastPct, buckets }
  // (recognition also gets posTotal / posRepeatPct). bucketLabels describe the bins.
  getConveyorStats() {
    const summarize = (s, recognition) => {
      const count = s.count || 0;
      const out = {
        count,
        avgMs: count > 0 ? Math.round(s.sumMs / count) : 0,
        fastPct: count > 0 ? Math.round((s.fast / count) * 100) : 0,
        buckets: s.buckets.slice()
      };
      if (recognition) {
        out.posTotal = s.posTotal || 0;
        out.posRepeatPct = s.posTotal > 0 ? Math.round((s.posRepeat / s.posTotal) * 100) : 0;
      }
      return out;
    };
    return {
      production: summarize(this.conveyorStats.production, false),
      recognition: summarize(this.conveyorStats.recognition, true),
      bucketLabels: ['<1s', '1–2s', '2–3s', '3–5s', '5s+']
    };
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
