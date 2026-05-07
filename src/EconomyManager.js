// Stardust soft currency. Earned by correct answers and level completion;
// spent in the shop on cosmetics and ship parts. State lives on `progress.economy`.

import { progress } from './GameData.js';

class EconomyManager {
  getStardust() {
    return progress.economy.stardust;
  }

  addStardust(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    progress.economy.stardust += amount;
    progress.save();
  }

  spendStardust(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return false;
    if (progress.economy.stardust < amount) return false;
    progress.economy.stardust -= amount;
    progress.save();
    return true;
  }

  canAfford(amount) {
    return progress.economy.stardust >= amount;
  }
}

export const economy = new EconomyManager();

const DAILY_BONUS_AMOUNT = 5;

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Awards +5 stardust the first time it's called on a calendar day.
// Returns the amount awarded (5 on first call of the day, 0 otherwise).
export function claimDailyBonusIfDue() {
  const today = todayString();
  if (progress.economy.lastDailyBonusDate === today) return 0;
  progress.economy.lastDailyBonusDate = today;
  economy.addStardust(DAILY_BONUS_AMOUNT);
  return DAILY_BONUS_AMOUNT;
}
