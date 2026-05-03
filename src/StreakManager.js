// Daily play streak. Resets if a calendar day is missed; persists best.
// Milestones at 3 / 7 / 30 days fire a callback for cosmetic rewards.

import { progress } from './GameData.js';

const MILESTONES = [3, 7, 30];

function todayString(d = new Date()) {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(a, b) {
  // Inputs are 'YYYY-MM-DD'. Calendar-day diff (no DST drama since UTC midnight).
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

class StreakManager {
  // Called on app open and on each level completion. Idempotent within a day.
  // Returns the new streak count.
  registerPlayDay() {
    const today = todayString();
    const last = progress.streak.lastPlayDate;

    if (last === today) {
      // Already counted today.
      return progress.streak.current;
    }

    if (last === null) {
      progress.streak.current = 1;
    } else {
      const diff = daysBetween(last, today);
      if (diff === 1) {
        progress.streak.current += 1;
      } else if (diff <= 0) {
        // Clock skew — be conservative, don't reset, just keep current.
      } else {
        progress.streak.current = 1;
      }
    }

    progress.streak.lastPlayDate = today;
    progress.streak.best = Math.max(progress.streak.best, progress.streak.current);
    progress.save();
    return progress.streak.current;
  }

  // Called on app open. Recalculates streak loss without registering today's play.
  // (e.g. if kid opens the app but doesn't play, we still want the counter to
  // reflect a missed day so the visible number is honest.)
  onAppOpen() {
    const last = progress.streak.lastPlayDate;
    if (!last) return;
    const diff = daysBetween(last, todayString());
    if (diff > 1) {
      progress.streak.current = 0;
      progress.save();
    }
  }

  getCurrent() {
    return progress.streak.current;
  }

  getBest() {
    return progress.streak.best;
  }

  // Returns any newly-earned milestones (3/7/30) since last check, and marks them earned.
  consumeNewMilestones() {
    const newly = [];
    for (const m of MILESTONES) {
      if (progress.streak.current >= m && !progress.streak.milestonesEarned.includes(m)) {
        newly.push(m);
        progress.streak.milestonesEarned.push(m);
      }
    }
    if (newly.length > 0) progress.save();
    return newly;
  }

}

export const streak = new StreakManager();
