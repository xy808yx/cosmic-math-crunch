// Boss Rush launcher — builds a fresh 5-boss gauntlet and hands off to the real
// GameScene engine (arcadeMode='bossRush'). Each boss is a full falling-asteroid
// boss fight; GameScene chains them via the registry arcadeState and shows the
// gauntlet results (see GameScene._arcadeRoundEnd + ArcadeRun.js).

import Phaser from 'phaser';
import { progress, VISIBLE_WORLDS } from '../GameData.js';

const TOTAL_BOSSES = 5;
const START_HP = 5; // one ship across the whole gauntlet (matches SHIP_HP_MAX)

export class BossRushScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BossRushScene' });
  }

  create() {
    // Random distinct bosses from cleared worlds; fall back to all visible.
    const cleared = VISIBLE_WORLDS.filter(w => progress.isWorldFullyCleared(w.id));
    const pool = cleared.length >= TOTAL_BOSSES ? cleared : VISIBLE_WORLDS;
    const queue = this.shuffle(pool.slice()).slice(0, TOTAL_BOSSES).map(w => w.id);

    this.registry.set('arcadeMode', 'bossRush');
    this.registry.set('arcadeState', {
      queue, index: 0, correct: 0, attempts: 0, startMs: Date.now(), shipHp: START_HP
    });
    this.registry.set('currentWorldId', queue[0]);
    this.registry.set('currentLevel', 1);
    this.registry.set('levelMode', 'boss');
    this.registry.set('freePlay', true);

    this.scene.start('GameScene');
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
