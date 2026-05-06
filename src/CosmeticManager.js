// Pet cosmetic items (hats + accessories). Ownership and equip live on
// `progress.cosmetics`. Items have a single slot.
//
// `animationHook` indicates a special animation method on the pet container
// that the GameScene fires when relevant: 'streak' (on milestone streaks),
// 'correct' (on each correct answer), or 'always' (idle background loop).

import { progress } from './GameData.js';

export const PET_COSMETICS = [
  { id: 'hat_cap',     slot: 'hat',       name: 'Pilot Cap',     price: 40, color: 0x4ecdc4 },
  { id: 'hat_crown',   slot: 'hat',       name: 'Star Crown',    price: 80, color: 0xf7dc6f },
  { id: 'acc_scarf',   slot: 'accessory', name: 'Cozy Scarf',    price: 35, color: 0xff5b6e },
  { id: 'acc_shades',  slot: 'accessory', name: 'Sun Shades',    price: 60, color: 0x12122a },

  // Animation-unlock items — each ties to a method on the pet container.
  { id: 'acc_jetpack',   slot: 'accessory', name: 'Mini Jetpack',   price: 60, color: 0xff8b3d, animation: 'rocketBoost', trigger: 'streak' },
  { id: 'hat_propeller', slot: 'hat',       name: 'Propeller Hat',  price: 50, color: 0x4ecdc4, animation: 'propellerSpin', trigger: 'correct' },
  { id: 'acc_antenna',   slot: 'accessory', name: 'Star Antenna',   price: 50, color: 0xffd86b, animation: 'radioWavePing', trigger: 'streak' },
  { id: 'acc_starhalo',  slot: 'accessory', name: 'Star Halo',      price: 70, color: 0xffeaa7, animation: 'starHaloOrbit', trigger: 'always' },

  // Milestone-only items — granted via streak milestones, not buyable.
  { id: 'acc_starbow', slot: 'accessory', name: 'Rainbow Scarf', price: 0, color: 0xc77eff, unlock: { type: 'streak', days: 3 } },
  { id: 'hat_starhat', slot: 'hat',       name: 'Star Helmet',   price: 0, color: 0xffd86b, unlock: { type: 'streak', days: 7 } }
];

class CosmeticManager {
  getEquipped() {
    return { ...progress.cosmetics.pet };
  }

  ownsItem(id) {
    return progress.cosmetics.ownedIds.includes(id);
  }

  addOwned(id) {
    if (this.ownsItem(id)) return;
    progress.cosmetics.ownedIds.push(id);
    if (!progress.cosmetics.newSinceLastView.includes(id)) {
      progress.cosmetics.newSinceLastView.push(id);
    }
    progress.save();
  }

  equipItem(id) {
    const item = PET_COSMETICS.find(c => c.id === id);
    if (!item || !this.ownsItem(id)) return false;
    progress.cosmetics.pet[item.slot] = id;
    progress.save();
    return true;
  }

  // Single-save buy-and-equip — see ShipManager.addAndEquip for the rationale.
  addAndEquip(id) {
    const item = PET_COSMETICS.find(c => c.id === id);
    if (!item) return false;
    if (!this.ownsItem(id)) {
      progress.cosmetics.ownedIds.push(id);
      if (!progress.cosmetics.newSinceLastView.includes(id)) {
        progress.cosmetics.newSinceLastView.push(id);
      }
    }
    progress.cosmetics.pet[item.slot] = id;
    progress.save();
    return true;
  }

  markSeen(id) {
    const idx = progress.cosmetics.newSinceLastView.indexOf(id);
    if (idx >= 0) {
      progress.cosmetics.newSinceLastView.splice(idx, 1);
      progress.save();
    }
  }

  isNew(id) {
    return progress.cosmetics.newSinceLastView.includes(id);
  }

  // Returns equipped items that have a matching trigger ('correct'|'streak'|'always').
  itemsWithTrigger(trigger) {
    const eq = this.getEquipped();
    const ids = [eq.hat, eq.accessory].filter(Boolean);
    return ids
      .map(id => PET_COSMETICS.find(c => c.id === id))
      .filter(item => item && item.trigger === trigger);
  }

  getEquippedItems() {
    const eq = this.getEquipped();
    return [eq.hat, eq.accessory]
      .filter(Boolean)
      .map(id => PET_COSMETICS.find(c => c.id === id))
      .filter(Boolean);
  }
}

export const cosmetics = new CosmeticManager();
