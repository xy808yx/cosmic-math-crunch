// Pet cosmetic items (hats + accessories). Ownership and equip live on
// `progress.cosmetics`. Items have a single slot.
//
// `animationHook` indicates a special animation method on the pet container
// that the GameScene fires when relevant: 'streak' (on milestone streaks),
// 'correct' (on each correct answer), or 'always' (idle background loop).

import { progress } from './GameData.js';

export const PET_COSMETICS = [
  // ---- HATS (snacks + a few classics) ----
  { id: 'hat_strawberry', slot: 'hat', name: 'Strawberry',     price: 80,   color: 0xff5b6e, rarity: 'common' },
  { id: 'hat_banana',     slot: 'hat', name: 'Banana Slip',    price: 80,   color: 0xffe07a, rarity: 'common' },
  { id: 'hat_avocado',    slot: 'hat', name: 'Avocado',        price: 100,  color: 0x9be8a3, rarity: 'common' },
  { id: 'hat_pizza',      slot: 'hat', name: 'Pizza Slice',    price: 120,  color: 0xffae8a, rarity: 'common' },
  { id: 'hat_donut',      slot: 'hat', name: 'Frosted Donut',  price: 100,  color: 0xff9ec7, rarity: 'common' },
  { id: 'hat_onigiri',    slot: 'hat', name: 'Onigiri',        price: 100,  color: 0xffffff, rarity: 'common' },
  { id: 'hat_taiyaki',    slot: 'hat', name: 'Taiyaki',        price: 120,  color: 0xffd86b, rarity: 'common' },
  { id: 'hat_sushi',      slot: 'hat', name: 'Salmon Nigiri',  price: 100,  color: 0xff8b3d, rarity: 'common' },
  { id: 'hat_propeller',  slot: 'hat', name: 'Propeller Hat',  price: 250,  color: 0x4ecdc4, rarity: 'rare', animation: 'propellerSpin', trigger: 'correct' },
  { id: 'hat_astronaut',  slot: 'hat', name: 'Astronaut',      price: 250,  color: 0xb6e0ff, rarity: 'rare' },
  { id: 'hat_wizard',     slot: 'hat', name: 'Wizard Hat',     price: 280,  color: 0x6c2bd9, rarity: 'rare' },
  { id: 'hat_starhat',     slot: 'hat', name: 'Star Helmet',    price: 1500, color: 0xffd86b, rarity: 'legendary' },
  { id: 'hat_crown_stars', slot: 'hat', name: 'Crown of Stars', price: 1500, color: 0xfff3b8, rarity: 'legendary' },
  { id: 'hat_galaxy_helm', slot: 'hat', name: 'Galaxy Helm',    price: 1500, color: 0x6c2bd9, rarity: 'legendary' },

  // ---- ACCESSORIES (snacks + classics) ----
  { id: 'acc_shades',   slot: 'accessory', name: 'Sun Shades',   price: 100, color: 0x12122a, rarity: 'common' },
  { id: 'acc_boba',     slot: 'accessory', name: 'Boba Tea',     price: 120, color: 0xc77eff, rarity: 'common' },
  { id: 'acc_pocky',    slot: 'accessory', name: 'Pocky Stick',  price: 80,  color: 0xff9ec7, rarity: 'common' },
  { id: 'acc_cookie',   slot: 'accessory', name: 'Cookie',       price: 100, color: 0xc77a4a, rarity: 'common' },
  { id: 'acc_dango',    slot: 'accessory', name: 'Dango Skewer', price: 120, color: 0xff9ec7, rarity: 'common' },
  { id: 'acc_jetpack',  slot: 'accessory', name: 'Mini Jetpack', price: 250, color: 0xff8b3d, rarity: 'rare', animation: 'rocketBoost', trigger: 'streak' },
  { id: 'acc_antenna',  slot: 'accessory', name: 'Star Antenna', price: 250, color: 0xffd86b, rarity: 'rare', animation: 'radioWavePing', trigger: 'streak' },
  { id: 'acc_starhalo', slot: 'accessory', name: 'Star Halo',    price: 250, color: 0xffeaa7, rarity: 'rare', animation: 'starHaloOrbit', trigger: 'always' },
  { id: 'acc_wings',    slot: 'accessory', name: 'Tiny Wings',   price: 350, color: 0xb6e0ff, rarity: 'rare' },
  { id: 'acc_cape',     slot: 'accessory', name: 'Hero Cape',    price: 250, color: 0xff9ec7, rarity: 'rare' },
  { id: 'acc_starbow',      slot: 'accessory', name: 'Rainbow Scarf', price: 1500, color: 0xc77eff, rarity: 'legendary' },
  { id: 'acc_phoenix_cape', slot: 'accessory', name: 'Phoenix Cape',  price: 1500, color: 0xff5b3d, rarity: 'legendary' },
  { id: 'acc_void_amulet',  slot: 'accessory', name: 'Void Amulet',   price: 1500, color: 0x6c2bd9, rarity: 'legendary' },

  // ---- AURAS ----
  { id: 'aura_none',      slot: 'aura', name: 'None',           price: 0,    isDefault: true, color: 0x000000, rarity: 'common' },
  { id: 'aura_sparkle',   slot: 'aura', name: 'Sparkle Trail',  price: 150,  color: 0xfff3b8, rarity: 'common' },
  { id: 'aura_hearts',    slot: 'aura', name: 'Heart Bubbles',  price: 150,  color: 0xff9ec7, rarity: 'common' },
  { id: 'aura_bubbles',   slot: 'aura', name: 'Bubble Float',   price: 200,  color: 0xb6e0ff, rarity: 'common' },
  { id: 'aura_snow',      slot: 'aura', name: 'Snow Globe',     price: 200,  color: 0xffffff, rarity: 'common' },
  { id: 'aura_orbit',     slot: 'aura', name: 'Star Orbit',     price: 250,  color: 0xffe07a, rarity: 'rare' },
  { id: 'aura_petals',    slot: 'aura', name: 'Cherry Blossom', price: 280,  color: 0xff9ec7, rarity: 'rare' },
  { id: 'aura_flame',     slot: 'aura', name: 'Flame Ring',     price: 320,  color: 0xff8b3d, rarity: 'rare' },
  { id: 'aura_lightning', slot: 'aura', name: 'Storm Pulse',    price: 380,  color: 0xfff3b8, rarity: 'rare' },
  { id: 'aura_planets',   slot: 'aura', name: 'Planet Orbit',   price: 420,  color: 0x9be8a3, rarity: 'rare' },
  { id: 'aura_rainbow',   slot: 'aura', name: 'Rainbow Pulse',  price: 350,  color: 0xc77eff, rarity: 'rare' },
  { id: 'aura_embers',    slot: 'aura', name: 'Rising Embers',  price: 320,  color: 0xff8b3d, rarity: 'rare' },
  { id: 'aura_galaxy',    slot: 'aura', name: 'Mini Galaxy',    price: 1500, color: 0xc77eff, rarity: 'legendary' },
  { id: 'aura_legendary', slot: 'aura', name: 'Legendary Glow', price: 1500, color: 0xfff3b8, rarity: 'legendary' },
  { id: 'aura_constellation', slot: 'aura', name: 'Constellation', price: 1500, color: 0xb6e0ff, rarity: 'legendary' }
];

class CosmeticManager {
  getEquipped() {
    return { ...progress.cosmetics.pet };
  }

  ownsItem(id) {
    return progress.cosmetics.ownedIds.includes(id);
  }

  equipItem(id) {
    const item = PET_COSMETICS.find(c => c.id === id);
    if (!item || !this.ownsItem(id)) return false;
    progress.cosmetics.pet[item.slot] = id;
    progress.save();
    return true;
  }

  // Unequip a slot — for slots with a default (aura), reset to that default.
  // For nullable slots (hat, accessory), set to null.
  unequipSlot(slot) {
    const def = PET_COSMETICS.find(c => c.slot === slot && c.isDefault);
    progress.cosmetics.pet[slot] = def ? def.id : null;
    progress.save();
    return true;
  }

  // Single-save buy-and-equip.
  addAndEquip(id) {
    const item = PET_COSMETICS.find(c => c.id === id);
    if (!item) return false;
    if (!this.ownsItem(id)) progress.cosmetics.ownedIds.push(id);
    progress.cosmetics.pet[item.slot] = id;
    progress.save();
    return true;
  }

  // Returns equipped items that have a matching trigger ('correct'|'streak'|'always').
  itemsWithTrigger(trigger) {
    const eq = this.getEquipped();
    return [eq.hat, eq.accessory, eq.aura]
      .filter(Boolean)
      .map(id => PET_COSMETICS.find(c => c.id === id))
      .filter(item => item && item.trigger === trigger);
  }

  getItemById(id) {
    return PET_COSMETICS.find(c => c.id === id) || null;
  }
}

export const cosmetics = new CosmeticManager();
