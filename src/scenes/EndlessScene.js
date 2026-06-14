// Endless launcher — hands off to the real GameScene engine (arcadeMode=
// 'endless'): mixed-fact asteroids that never stop coming, survive on ship HP,
// score = how many you crunch. Best score persists in progress.arcade.endlessBest
// (recorded from ArcadeRun.js when the ship is lost).

import Phaser from 'phaser';

// Late-world theme + mixed ×/÷ facts for a varied endless field.
const ENDLESS_WORLD_ID = 11;

export class EndlessScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EndlessScene' });
  }

  create() {
    this.registry.set('arcadeMode', 'endless');
    this.registry.set('arcadeState', { startMs: Date.now() });
    this.registry.set('currentWorldId', ENDLESS_WORLD_ID);
    this.registry.set('currentLevel', 1);
    this.registry.set('levelMode', 'mixed');
    this.registry.set('freePlay', true);

    this.scene.start('GameScene');
  }
}
