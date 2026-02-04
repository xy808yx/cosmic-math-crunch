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
  width: 400,
  height: 700,
  backgroundColor: '#1a1a2e',
  pixelArt: false,
  antialias: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, TutorialScene, WorldMapScene, LevelSelectScene, GameScene, UIScene, ParentDashboardScene]
};

const game = new Phaser.Game(config);

// Expose for debugging
window.game = game;
