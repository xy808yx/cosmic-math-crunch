// Companion (pet) system — species data, evolution, lore.
// Singleton; reads/writes through `progress.companion` on GameData.
//
// Pixel-art rendering lives in PetRenderer.js — this module is data only.

import { progress } from './GameData.js';

// Each species has 4 evolution stages with distinct names + lore.
export const SPECIES = {
  ember: {
    id: 'ember',
    name: 'Ember',
    archetype: 'fire',
    color: 0xff6b3d,
    accent: 0xffd86b,
    tagline: 'Plasma comet, fast and fierce',
    stages: {
      egg: {
        name: 'Cinder Egg',
        type: 'Solar / Egg',
        lore: 'Warm to the touch. Faint embers flicker through hairline cracks. Hatches when the pilot logs enough wins.'
      },
      baby: {
        name: 'Sparkling',
        type: 'Solar / Sprite',
        lore: 'A hand-sized blob with one huge eye and a single ember tuft. Pops with delight whenever its pilot answers fast.'
      },
      teen: {
        name: 'Blazewisp',
        type: 'Solar / Wisp',
        lore: 'Sprouted ember wings and a crescent comet tail. Streaks across the cockpit when its pilot nails a tough problem.'
      },
      adult: {
        name: 'Solfire',
        type: 'Solar / Drake',
        lore: 'A pixel star-dragon with curled horns, broad wings, and a long tail. Said to lead lost pilots back through the dark.'
      }
    }
  },
  tide: {
    id: 'tide',
    name: 'Tide',
    archetype: 'water',
    color: 0x5dade2,
    accent: 0xa9e6ff,
    tagline: 'Liquid-metal jelly, calm and ancient',
    stages: {
      egg: {
        name: 'Pearl Egg',
        type: 'Aqua / Egg',
        lore: 'A faintly dripping pearl. Drifted in on a comet from somewhere wetter than this galaxy.'
      },
      baby: {
        name: 'Driplet',
        type: 'Aqua / Sprite',
        lore: 'A soft round drop with curious eyes and two antennae. Hums when the pilot is on a streak.'
      },
      teen: {
        name: 'Wavemite',
        type: 'Aqua / Drifter',
        lore: 'Grew side fins and a flicking tail. Coasts on the air-current of a quick correct answer.'
      },
      adult: {
        name: 'Tidalord',
        type: 'Aqua / Whale',
        lore: 'A long cosmic whale with a tall dorsal fin and tail flukes. Older than the Asteroid Belt, calmer than the void.'
      }
    }
  },
  sprout: {
    id: 'sprout',
    name: 'Sprout',
    archetype: 'grass',
    color: 0x58d68d,
    accent: 0xc8f7c5,
    tagline: 'Crystal-flora alien, cheerful and curious',
    stages: {
      egg: {
        name: 'Pod',
        type: 'Verdant / Egg',
        lore: 'A round green pod with a single hopeful leaf. Wants very much to be a plant when it grows up.'
      },
      baby: {
        name: 'Seedling',
        type: 'Verdant / Sprite',
        lore: 'A mossy blob with a fresh sprig on its head. Reseeds whatever it lands on, including the pilot.'
      },
      teen: {
        name: 'Vinepup',
        type: 'Verdant / Bloom',
        lore: 'Vines instead of legs and a bright cheek-bloom. Hops the dashboard like it owns the place.'
      },
      adult: {
        name: 'Cosmoss',
        type: 'Verdant / Treant',
        lore: 'A walking treant with bark legs, branching arms, and a flower crown. Where it stands, ferns grow.'
      }
    }
  }
};

const STAGE_ORDER = ['egg', 'baby', 'teen', 'adult'];

// Evolution gates — tuned for ~3 month adult timeline at ~14 sessions/month.
// Each stage requires (worlds cleared, lifetime correct, lifetime accuracy).
const STAGE_GATES = {
  baby: {
    worldsCleared: 1,
    lifetimeCorrect: 0,
    accuracy: 0,
    description: 'Clear world 1'
  },
  teen: {
    worldsCleared: 5,
    lifetimeCorrect: 400,
    accuracy: 0.70,
    description: 'Clear 5 worlds + 400 correct + 70% accuracy'
  },
  adult: {
    worldsCleared: 11,
    lifetimeCorrect: 1500,
    accuracy: 0.85,
    description: 'Defeat the final boss + 1500 correct + 85% accuracy'
  }
};

class CompanionManager {
  pickStarter(speciesId) {
    if (!SPECIES[speciesId]) return false;
    progress.companion.speciesId = speciesId;
    progress.companion.stage = 'egg';
    progress.save();
    return true;
  }

  hasStarter() {
    return !!progress.companion.speciesId;
  }

  // ---------------- Trophy shelf -------------------------------------------
  // Once a pet hits adult, the player can retire it and raise a new one.
  // Retired pets land in `progress.companion.completed[]` as a permanent
  // collection (read-only — they are not re-equippable).
  isFullyEvolved() {
    return progress.companion.stage === 'adult';
  }

  getCompletedPets() {
    return progress.companion.completed || [];
  }

  // Retires the current pet (if adult) into the completed list and resets
  // companion state so the StarterPickerScene can pick a new species.
  retireAndStartNew() {
    if (!this.isFullyEvolved() || !progress.companion.speciesId) return false;
    const completed = progress.companion.completed || [];
    completed.push({
      speciesId: progress.companion.speciesId,
      retiredAt: Date.now()
    });
    progress.companion.completed = completed;
    progress.companion.speciesId = null;
    progress.companion.stage = null;
    progress.save();
    return true;
  }

  getSpecies() {
    return SPECIES[progress.companion.speciesId] || null;
  }

  getCurrentLore() {
    const sp = this.getSpecies();
    if (!sp) return null;
    return sp.stages[this.getStage()] || sp.stages.egg;
  }

  // Counts a correct answer toward evolution. checkEvolutionEligibility
  // saves only when the stage actually advances.
  feed() {
    return this.checkEvolutionEligibility();
  }

  // Re-evaluates the pet's stage against the new gate criteria. If the next
  // stage is unlocked, advances and returns the new stage; otherwise returns null.
  checkEvolutionEligibility() {
    const stats = this.getEvolutionStats();
    const currentIdx = STAGE_ORDER.indexOf(progress.companion.stage);
    if (currentIdx < 0 || currentIdx === STAGE_ORDER.length - 1) return null;
    const nextStage = STAGE_ORDER[currentIdx + 1];
    const gate = STAGE_GATES[nextStage];
    if (!gate) return null;
    if (stats.worldsCleared >= gate.worldsCleared
      && stats.lifetimeCorrect >= gate.lifetimeCorrect
      && stats.accuracy >= gate.accuracy) {
      progress.companion.stage = nextStage;
      progress.save();
      return nextStage;
    }
    return null;
  }

  getStage() {
    return progress.companion.stage;
  }

  // Lifetime correct answers — derived from factMastery so old per-pellet
  // counter doesn't drift.
  getTotalPellets() {
    return progress.getLifetimeTotals().correct;
  }

  // Stats used to render evolution progress UI + decide eligibility.
  getEvolutionStats() {
    const totals = progress.getLifetimeTotals();
    const worldsCleared = progress.getWorldsClearedCount();
    return {
      worldsCleared,
      lifetimeCorrect: totals.correct,
      lifetimeTotal: totals.total,
      accuracy: totals.accuracy
    };
  }

  // Returns null if fully evolved; otherwise an object describing the gate to
  // the next stage and the player's current progress against each sub-goal.
  getStageProgress() {
    const idx = STAGE_ORDER.indexOf(progress.companion.stage);
    if (idx < 0 || idx === STAGE_ORDER.length - 1) {
      return { nextStage: null };
    }
    const nextStage = STAGE_ORDER[idx + 1];
    const gate = STAGE_GATES[nextStage];
    const stats = this.getEvolutionStats();
    return {
      nextStage,
      description: gate.description,
      worldsCleared: { current: stats.worldsCleared, target: gate.worldsCleared },
      lifetimeCorrect: { current: stats.lifetimeCorrect, target: gate.lifetimeCorrect },
      accuracy: { current: Math.round(stats.accuracy * 100), target: Math.round(gate.accuracy * 100) },
      // Overall progress 0..1 — the slowest sub-goal is the binding constraint.
      ratio: Math.min(
        gate.worldsCleared > 0 ? stats.worldsCleared / gate.worldsCleared : 1,
        gate.lifetimeCorrect > 0 ? stats.lifetimeCorrect / gate.lifetimeCorrect : 1,
        gate.accuracy > 0 ? stats.accuracy / gate.accuracy : 1
      )
    };
  }
}

export const companion = new CompanionManager();

// Re-export the renderer at this path so existing callsites (`import { drawCompanion }
// from '../CompanionManager.js'`) keep working.
export { drawCompanion } from './PetRenderer.js';
