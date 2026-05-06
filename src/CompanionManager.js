// Companion (pet) system — species data, evolution, lore.
// Singleton; reads/writes through `progress.companion` on GameData.
//
// Hunger removed (no guilt trips). Pet is always glad to see the kid.
// Pixel-art rendering lives in PetRenderer.js — this module is data only.

import { progress } from './GameData.js';

// Each species has 4 evolution stages with distinct names + lore.
// Stage visuals live in PetRenderer.js; this is the canonical lore source.
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
        lore: 'Streaked itself with a flame tail and grew tiny mitten-paws. Sometimes leaves scorch marks on the dashboard.'
      },
      adult: {
        name: 'Solfire',
        type: 'Solar / Drake',
        lore: 'A small dragon-form with a blazing mane and crescent wings. Said to lead lost pilots back through nebulae.'
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
        lore: 'Sprouted little fins and learned to coast on the air-current of a quick laugh.'
      },
      adult: {
        name: 'Tidalord',
        type: 'Aqua / Whale',
        lore: 'A small cosmic whale with luminous fins. Older than the Asteroid Belt, calmer than the void.'
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
        lore: 'Vines instead of legs, a fresh bloom in its hair. Tiny enough to perch in the cockpit.'
      },
      adult: {
        name: 'Cosmoss',
        type: 'Verdant / Treant',
        lore: 'A small treant in flower. Where it walks, ferns grow. Has been known to plant moons.'
      }
    }
  }
};

// Pellet thresholds for visible evolution stages.
const STAGE_THRESHOLDS = {
  egg:  0,
  baby: 30,
  teen: 150,
  adult: 500
};

const STAGE_ORDER = ['egg', 'baby', 'teen', 'adult'];

// "Missed you" greeting fires when the kid returns after this much time away.
const MISSED_YOU_THRESHOLD_MS = 8 * 60 * 60 * 1000; // 8 hours — anything overnight

class CompanionManager {
  // Set the species on first-launch picker.
  pickStarter(speciesId) {
    if (!SPECIES[speciesId]) return false;
    progress.companion.speciesId = speciesId;
    progress.companion.stage = 'egg';
    progress.companion.totalPellets = 0;
    progress.companion.lastFedAt = Date.now();
    progress.companion.lastVisitedAt = Date.now();
    progress.save();
    return true;
  }

  hasStarter() {
    return !!progress.companion.speciesId;
  }

  getSpecies() {
    return SPECIES[progress.companion.speciesId] || null;
  }

  // Lore for the pet's current evolution stage.
  getCurrentLore() {
    const sp = this.getSpecies();
    if (!sp) return null;
    return sp.stages[this.getStage()] || sp.stages.egg;
  }

  // Called when the app opens. Records the visit; surfaces "missed you" state
  // if the gap since last visit is meaningful. Returns true if greeting should play.
  markVisitOpen() {
    const last = progress.companion.lastVisitedAt || Date.now();
    const gap = Date.now() - last;
    this._lastGapMs = gap;
    progress.companion.lastVisitedAt = Date.now();
    progress.save();
    return gap >= MISSED_YOU_THRESHOLD_MS;
  }

  // True if the kid is returning after a gap and hasn't been greeted yet this session.
  shouldShowMissedYou() {
    return (this._lastGapMs || 0) >= MISSED_YOU_THRESHOLD_MS && !this._missedYouShown;
  }

  // Call after the greeting plays, so it doesn't repeat on every scene transition.
  markMissedYouShown() {
    this._missedYouShown = true;
  }

  // Feed N pellets (called per correct answer in GameScene).
  feed(pellets = 1) {
    progress.companion.totalPellets += pellets;
    progress.companion.lastFedAt = Date.now();
    this.recomputeStage();
    progress.save();
  }

  recomputeStage() {
    const total = progress.companion.totalPellets;
    let next = 'egg';
    if (total >= STAGE_THRESHOLDS.adult) next = 'adult';
    else if (total >= STAGE_THRESHOLDS.teen) next = 'teen';
    else if (total >= STAGE_THRESHOLDS.baby) next = 'baby';
    progress.companion.stage = next;
  }

  getStage() {
    return progress.companion.stage;
  }

  getTotalPellets() {
    return progress.companion.totalPellets;
  }

  // Pellets-to-next-stage progress for UI roadmap.
  getStageProgress() {
    const total = progress.companion.totalPellets;
    const idx = STAGE_ORDER.indexOf(progress.companion.stage);
    if (idx < 0 || idx === STAGE_ORDER.length - 1) {
      return { current: total, target: total, nextStage: null };
    }
    const nextStage = STAGE_ORDER[idx + 1];
    return {
      current: total,
      target: STAGE_THRESHOLDS[nextStage],
      nextStage
    };
  }
}

export const companion = new CompanionManager();

// Re-export the pixel-art renderer at this path so existing callsites
// (`import { drawCompanion } from '../CompanionManager.js'`) keep working.
export { drawCompanion } from './PetRenderer.js';
