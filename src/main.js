import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { TutorialScene } from './scenes/TutorialScene.js';
import { WorldMapScene } from './scenes/WorldMapScene.js';
import { LevelSelectScene } from './scenes/LevelSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { ParentDashboardScene } from './scenes/ParentDashboardScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 1400,
  backgroundColor: '#12121f',
  antialias: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container',
    expandParent: true,
    min: {
      width: 320,
      height: 480
    },
    max: {
      width: 800,
      height: 1400
    }
  },
  scene: [BootScene, TutorialScene, WorldMapScene, LevelSelectScene, GameScene, UIScene, ParentDashboardScene]
};

const game = new Phaser.Game(config);

// Expose for debugging
window.game = game;
