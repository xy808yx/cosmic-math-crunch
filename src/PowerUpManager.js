// Power-Up System
// Earned through streaks and speed, unlocked by table mastery

export const POWER_UPS = {
  shooting_star: {
    id: 'shooting_star',
    name: 'Shooting Star',
    description: 'Clears an entire row',
    icon: '⭐',
    unlockedByTable: 2,
    effect: 'clear_row'
  },
  companion_zap: {
    id: 'companion_zap',
    name: 'Companion Zap',
    description: 'Clears a random matched set',
    icon: '⚡',
    unlockedByTable: 3,
    effect: 'clear_match'
  },
  black_hole: {
    id: 'black_hole',
    name: 'Black Hole',
    description: 'Clears 3x3 area',
    icon: '🕳️',
    unlockedByTable: 4,
    effect: 'clear_area'
  },
  multiplier: {
    id: 'multiplier',
    name: 'Multiplier Boost',
    description: 'Next match worth 2x points',
    icon: '✨',
    unlockedByTable: 5,
    effect: 'double_points'
  },
  factor_bomb: {
    id: 'factor_bomb',
    name: 'Factor Bomb',
    description: 'Clears all tiles that are factors of a number',
    icon: '💣',
    unlockedByTable: 6,
    effect: 'clear_factors'
  },
  supernova: {
    id: 'supernova',
    name: 'Supernova',
    description: 'Clears all tiles of one number',
    icon: '💥',
    unlockedByTable: 7,
    effect: 'clear_number'
  },
  wild_card: {
    id: 'wild_card',
    name: 'Wild Card',
    description: 'Tap a tile to change it to any number',
    icon: '🃏',
    unlockedByTable: 8,
    effect: 'wild'
  },
  hint_helper: {
    id: 'hint_helper',
    name: 'Hint Helper',
    description: 'Highlights valid moves for 3 turns',
    icon: '🔍',
    unlockedByTable: 9,
    effect: 'show_hints'
  }
};

class PowerUpManager {
  constructor() {
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem('cosmicMathPowerUps');
      if (saved) {
        const data = JSON.parse(saved);
        this.unlockedPowerUps = data.unlockedPowerUps || ['shooting_star']; // Start with one
        this.equippedPowerUp = data.equippedPowerUp || 'shooting_star';
      } else {
        this.reset();
      }
    } catch (e) {
      this.reset();
    }
  }

  reset() {
    // Start with shooting star unlocked (easiest to earn)
    this.unlockedPowerUps = ['shooting_star'];
    this.equippedPowerUp = 'shooting_star';
    this.save();
  }

  save() {
    try {
      localStorage.setItem('cosmicMathPowerUps', JSON.stringify({
        unlockedPowerUps: this.unlockedPowerUps,
        equippedPowerUp: this.equippedPowerUp
      }));
    } catch (e) {
      console.warn('Could not save power-ups');
    }
  }

  // Check if a power-up is unlocked
  isUnlocked(powerUpId) {
    return this.unlockedPowerUps.includes(powerUpId);
  }

  // Unlock a power-up when table is mastered
  unlockForTable(tableNumber) {
    const powerUp = Object.values(POWER_UPS).find(p => p.unlockedByTable === tableNumber);
    if (powerUp && !this.isUnlocked(powerUp.id)) {
      this.unlockedPowerUps.push(powerUp.id);
      this.save();
      return powerUp;
    }
    return null;
  }

  // Check mastery and unlock corresponding power-ups (70% threshold per spec)
  checkMasteryUnlocks(progress) {
    const newUnlocks = [];
    for (let table = 2; table <= 10; table++) {
      const mastery = progress.getTableMastery(table);
      if (mastery >= 70) {
        const unlocked = this.unlockForTable(table);
        if (unlocked) {
          newUnlocks.push(unlocked);
        }
      }
    }
    return newUnlocks;
  }

  // Get all unlocked power-ups
  getUnlockedPowerUps() {
    return this.unlockedPowerUps.map(id => POWER_UPS[id]).filter(Boolean);
  }

  // Get currently equipped power-up
  getEquippedPowerUp() {
    return POWER_UPS[this.equippedPowerUp];
  }

  // Equip a power-up
  equipPowerUp(powerUpId) {
    if (this.isUnlocked(powerUpId)) {
      this.equippedPowerUp = powerUpId;
      this.save();
      return true;
    }
    return false;
  }

  // Get power-up info
  getPowerUpInfo(powerUpId) {
    return POWER_UPS[powerUpId];
  }

  // Get all power-ups with unlock status
  getAllPowerUps() {
    return Object.values(POWER_UPS).map(p => ({
      ...p,
      unlocked: this.isUnlocked(p.id),
      equipped: this.equippedPowerUp === p.id
    }));
  }
}

// Power-up charge tracker for in-game use
export class PowerUpChargeTracker {
  constructor() {
    this.charge = 0;
    this.maxCharge = 100;
    this.isReady = false;
    this.streakCount = 0;
    this.multiplierActive = false;
    this.hintTurnsRemaining = 0;
  }

  reset() {
    this.charge = 0;
    this.isReady = false;
    this.streakCount = 0;
    this.multiplierActive = false;
    this.hintTurnsRemaining = 0;
  }

  // Called when player gets correct answer
  onCorrectAnswer(answerTimeMs) {
    this.streakCount++;

    // Streak-based charging
    if (this.streakCount === 3) {
      this.addCharge(25);
    } else if (this.streakCount === 5) {
      this.addCharge(25); // Total 50%
    } else if (this.streakCount === 10) {
      this.addCharge(50); // Total 100%
    } else if (this.streakCount > 10) {
      // Bonus for continuing streak
      this.addCharge(10);
    }

    // Speed bonus
    if (answerTimeMs < 1000) {
      this.addCharge(25);
    } else if (answerTimeMs < 3000) {
      this.addCharge(10);
    }

    // Decrement hint turns if active
    if (this.hintTurnsRemaining > 0) {
      this.hintTurnsRemaining--;
    }

    return {
      chargeGained: this.charge,
      isReady: this.isReady,
      streakCount: this.streakCount
    };
  }

  // Called when player gets wrong answer
  onWrongAnswer() {
    this.streakCount = 0;
    // Don't lose charge on wrong answer - that would be too punishing

    // Decrement hint turns if active
    if (this.hintTurnsRemaining > 0) {
      this.hintTurnsRemaining--;
    }
  }

  addCharge(amount) {
    this.charge = Math.min(this.maxCharge, this.charge + amount);
    if (this.charge >= this.maxCharge) {
      this.isReady = true;
    }
  }

  // Use the power-up (resets charge)
  usePowerUp() {
    if (!this.isReady) return false;
    this.charge = 0;
    this.isReady = false;
    return true;
  }

  // Activate multiplier boost
  activateMultiplier() {
    this.multiplierActive = true;
  }

  // Consume multiplier (returns true if was active)
  consumeMultiplier() {
    if (this.multiplierActive) {
      this.multiplierActive = false;
      return true;
    }
    return false;
  }

  // Activate hint helper
  activateHints() {
    this.hintTurnsRemaining = 3;
  }

  // Check if hints are active
  areHintsActive() {
    return this.hintTurnsRemaining > 0;
  }

  getChargePercent() {
    return Math.round((this.charge / this.maxCharge) * 100);
  }
}

// Singleton instance
export const powerUps = new PowerUpManager();
