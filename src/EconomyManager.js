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
