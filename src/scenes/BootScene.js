import Phaser from 'phaser';
import { style } from '../textStyles.js';
import { companion } from '../CompanionManager.js';
import { streak } from '../StreakManager.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Loading…', style('headline', {
      fontSize: '54px',
      fill: '#cfcfe0'
    })).setOrigin(0.5);
  }

  create() {
    streak.onAppOpen();
    companion.markVisitOpen();

    if (!companion.hasStarter()) {
      this.scene.start('StarterPickerScene');
    } else {
      this.scene.start('WorldMapScene');
    }
  }
}
