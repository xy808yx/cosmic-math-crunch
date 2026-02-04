// Achievement System
// Tracks player achievements and unlocks cosmetic rewards

export const ACHIEVEMENTS = [
  // Early game achievements
  {
    id: 'first_contact',
    name: 'First Contact',
    description: 'Complete your first level',
    icon: '🛸',
    condition: { type: 'levels_completed', value: 1 }
  },
  {
    id: 'perfect_launch',
    name: 'Perfect Launch',
    description: '3-star a level on first try',
    icon: '⭐',
    condition: { type: 'first_try_three_star', value: 1 }
  },
  {
    id: 'getting_started',
    name: 'Getting Started',
    description: 'Complete 5 levels',
    icon: '🚀',
    condition: { type: 'levels_completed', value: 5 }
  },

  // Streak achievements
  {
    id: 'streak_5',
    name: 'On a Roll',
    description: '5 correct answers in a row',
    icon: '🔥',
    condition: { type: 'streak', value: 5 }
  },
  {
    id: 'streak_10',
    name: 'Streak Seeker',
    description: '10 correct answers in a row',
    icon: '🌟',
    condition: { type: 'streak', value: 10 }
  },
  {
    id: 'streak_20',
    name: 'Unstoppable',
    description: '20 correct answers in a row',
    icon: '💫',
    condition: { type: 'streak', value: 20 }
  },

  // Star collection achievements
  {
    id: 'star_collector_10',
    name: 'Star Collector',
    description: 'Earn 10 stars',
    icon: '✨',
    condition: { type: 'total_stars', value: 10 }
  },
  {
    id: 'star_collector_25',
    name: 'Star Hunter',
    description: 'Earn 25 stars',
    icon: '🌠',
    condition: { type: 'total_stars', value: 25 }
  },
  {
    id: 'star_collector_50',
    name: 'Star Master',
    description: 'Earn 50 stars',
    icon: '🌌',
    condition: { type: 'total_stars', value: 50 }
  },

  // World completion achievements
  {
    id: 'moon_master',
    name: 'Moon Master',
    description: 'Complete all Moon Base levels',
    icon: '🌙',
    condition: { type: 'world_complete', value: 1 }
  },
  {
    id: 'asteroid_ace',
    name: 'Asteroid Ace',
    description: 'Complete all Asteroid Belt levels',
    icon: '☄️',
    condition: { type: 'world_complete', value: 2 }
  },
  {
    id: 'crystal_champion',
    name: 'Crystal Champion',
    description: 'Complete all Crystal Planet levels',
    icon: '💎',
    condition: { type: 'world_complete', value: 3 }
  },

  // Table mastery achievements
  {
    id: 'mastery_2s',
    name: 'Twos Pro',
    description: '90% accuracy on 2s table',
    icon: '2️⃣',
    condition: { type: 'table_mastery', value: 2, threshold: 90 }
  },
  {
    id: 'mastery_3s',
    name: 'Threes Pro',
    description: '90% accuracy on 3s table',
    icon: '3️⃣',
    condition: { type: 'table_mastery', value: 3, threshold: 90 }
  },
  {
    id: 'mastery_5s',
    name: 'Fives Pro',
    description: '90% accuracy on 5s table',
    icon: '5️⃣',
    condition: { type: 'table_mastery', value: 5, threshold: 90 }
  },
  {
    id: 'mastery_10s',
    name: 'Tens Pro',
    description: '90% accuracy on 10s table',
    icon: '🔟',
    condition: { type: 'table_mastery', value: 10, threshold: 90 }
  },

  // Special achievements
  {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Complete a level after 3+ failures',
    icon: '💪',
    condition: { type: 'comeback', value: 3 }
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a level with 10+ moves remaining',
    icon: '⚡',
    condition: { type: 'moves_remaining', value: 10 }
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Unlock 3 different worlds',
    icon: '🗺️',
    condition: { type: 'worlds_unlocked', value: 3 }
  }
];

class AchievementManager {
  constructor() {
    this.load();
    this.currentStreak = 0;
    this.pendingNotifications = [];
  }

  load() {
    try {
      const saved = localStorage.getItem('cosmicMathAchievements');
      if (saved) {
        const data = JSON.parse(saved);
        this.earned = data.earned || {};
        this.stats = data.stats || this.getDefaultStats();
      } else {
        this.reset();
      }
    } catch (e) {
      this.reset();
    }
  }

  reset() {
    this.earned = {};
    this.stats = this.getDefaultStats();
    this.save();
  }

  getDefaultStats() {
    return {
      levelsCompleted: 0,
      totalCorrect: 0,
      totalWrong: 0,
      bestStreak: 0,
      firstTryThreeStars: 0
    };
  }

  save() {
    try {
      localStorage.setItem('cosmicMathAchievements', JSON.stringify({
        earned: this.earned,
        stats: this.stats
      }));
    } catch (e) {
      console.warn('Could not save achievements');
    }
  }

  // Check if an achievement is earned
  isEarned(achievementId) {
    return !!this.earned[achievementId];
  }

  // Get all earned achievements
  getEarnedAchievements() {
    return ACHIEVEMENTS.filter(a => this.isEarned(a.id));
  }

  // Get all achievements with earned status
  getAllAchievements() {
    return ACHIEVEMENTS.map(a => ({
      ...a,
      earned: this.isEarned(a.id),
      earnedAt: this.earned[a.id]?.earnedAt
    }));
  }

  // Unlock an achievement
  unlock(achievementId) {
    if (this.isEarned(achievementId)) return false;

    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return false;

    this.earned[achievementId] = {
      earnedAt: Date.now()
    };
    this.save();

    // Queue notification
    this.pendingNotifications.push(achievement);
    return true;
  }

  // Get and clear pending notifications
  getPendingNotifications() {
    const notifications = [...this.pendingNotifications];
    this.pendingNotifications = [];
    return notifications;
  }

  // Record a correct answer
  recordCorrectAnswer() {
    this.currentStreak++;
    this.stats.totalCorrect++;

    if (this.currentStreak > this.stats.bestStreak) {
      this.stats.bestStreak = this.currentStreak;
    }

    // Check streak achievements
    if (this.currentStreak >= 5) this.unlock('streak_5');
    if (this.currentStreak >= 10) this.unlock('streak_10');
    if (this.currentStreak >= 20) this.unlock('streak_20');

    this.save();
  }

  // Record a wrong answer
  recordWrongAnswer() {
    this.currentStreak = 0;
    this.stats.totalWrong++;
    this.save();
  }

  // Record level completion
  recordLevelComplete(worldId, levelNum, stars, movesRemaining, failureCount, progress) {
    this.stats.levelsCompleted++;

    // First Contact
    if (this.stats.levelsCompleted >= 1) this.unlock('first_contact');
    if (this.stats.levelsCompleted >= 5) this.unlock('getting_started');

    // Perfect Launch - 3 stars on first try (0 failures)
    if (stars === 3 && failureCount === 0) {
      this.stats.firstTryThreeStars++;
      this.unlock('perfect_launch');
    }

    // Comeback Kid
    if (failureCount >= 3) {
      this.unlock('comeback_kid');
    }

    // Speed Demon
    if (movesRemaining >= 10) {
      this.unlock('speed_demon');
    }

    // Check star achievements
    const totalStars = progress?.totalStars || 0;
    if (totalStars >= 10) this.unlock('star_collector_10');
    if (totalStars >= 25) this.unlock('star_collector_25');
    if (totalStars >= 50) this.unlock('star_collector_50');

    // Check world completion (each world has 4 levels)
    const worldProgress = progress?.getWorldProgress(worldId);
    if (worldProgress && worldProgress.levelsCompleted >= 4) {
      if (worldId === 1) this.unlock('moon_master');
      if (worldId === 2) this.unlock('asteroid_ace');
      if (worldId === 3) this.unlock('crystal_champion');
    }

    // Check worlds unlocked
    let worldsUnlocked = 0;
    for (let i = 1; i <= 11; i++) {
      if (progress?.isWorldUnlocked(i)) worldsUnlocked++;
    }
    if (worldsUnlocked >= 3) this.unlock('explorer');

    this.save();
  }

  // Check table mastery
  checkTableMastery(table, accuracy) {
    if (accuracy >= 90) {
      if (table === 2) this.unlock('mastery_2s');
      if (table === 3) this.unlock('mastery_3s');
      if (table === 5) this.unlock('mastery_5s');
      if (table === 10) this.unlock('mastery_10s');
    }
  }

  // Get achievement count
  getEarnedCount() {
    return Object.keys(this.earned).length;
  }

  getTotalCount() {
    return ACHIEVEMENTS.length;
  }
}

// Singleton instance
export const achievements = new AchievementManager();
