// Tune-Up launcher — the spaced-repetition "refresh your rusty facts" round.
// Hands off to the real GameScene engine (arcadeMode='review'): a varied mixed
// ×/÷ field drawn 100% from the kid's due/rusty facts (see getReviewProblem),
// adaptive fall speed, no campaign progression. Reached from the World Map nudge
// that appears once previously-mastered facts decay past their review date.
// Ends on ship loss like Endless; results return to the map.

import Phaser from 'phaser';
import { progress, VISIBLE_WORLDS } from '../GameData.js';

export class ReviewScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ReviewScene' });
  }

  create() {
    // Theme the refresh on the kid's furthest unlocked world so it feels like
    // "home turf" wherever they are; fall back to Moon Base. Math is world-
    // agnostic, so the backdrop is purely cosmetic.
    let themeWorldId = 1;
    for (const w of VISIBLE_WORLDS) {
      if (progress.isWorldUnlocked(w.id)) themeWorldId = w.id;
    }

    this.registry.set('arcadeMode', 'review');
    this.registry.set('arcadeState', { startMs: Date.now() });
    this.registry.set('currentWorldId', themeWorldId);
    this.registry.set('currentLevel', 1);
    this.registry.set('levelMode', 'mixed');
    this.registry.set('freePlay', true);

    this.scene.start('GameScene');
  }
}
