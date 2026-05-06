import Phaser from 'phaser';
import { generateWorldIcons } from '../WorldArt.js';
import { style } from '../textStyles.js';
import { companion } from '../CompanionManager.js';
import { streak } from '../StreakManager.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.add.text(400, 700, 'Loading…', style('headline', {
      fontSize: '40px',
      fill: '#cfcfe0'
    })).setOrigin(0.5);
  }

  create() {
    generateWorldIcons(this);

    streak.onAppOpen();
    companion.markVisitOpen();

    if (!companion.hasStarter()) {
      this.scene.start('StarterPickerScene');
    } else {
      this.scene.start('WorldMapScene');
    }
  }
}
