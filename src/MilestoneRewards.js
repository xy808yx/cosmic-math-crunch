// Maps streak milestones to cosmetic / ship rewards. Used by GameScene
// after StreakManager.consumeNewMilestones() returns newly-earned days.

import { cosmetics, PET_COSMETICS } from './CosmeticManager.js';
import { ship, SHIP_PARTS } from './ShipManager.js';

export const STREAK_REWARDS = {
  3: 'acc_starbow',
  7: 'hat_starhat',
  30: 'paint_galaxy'
};

function grantOne(days) {
  const itemId = STREAK_REWARDS[days];
  if (!itemId) return null;

  const petItem = PET_COSMETICS.find(c => c.id === itemId);
  if (petItem) {
    cosmetics.addOwned(itemId);
    return { kind: 'pet', item: petItem };
  }

  const shipPart = SHIP_PARTS.find(p => p.id === itemId);
  if (shipPart) {
    ship.addOwnedPart(itemId);
    return { kind: 'ship', item: shipPart };
  }

  return null;
}

// Grant rewards for a list of newly-earned milestone days.
export function grantStreakRewards(daysList) {
  return daysList.map(grantOne).filter(Boolean);
}
