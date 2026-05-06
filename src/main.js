import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { WorldMapScene } from './scenes/WorldMapScene.js';
import { LevelSelectScene } from './scenes/LevelSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { ParentDashboardScene } from './scenes/ParentDashboardScene.js';
import { StarterPickerScene } from './scenes/StarterPickerScene.js';
import { ShopScene } from './scenes/ShopScene.js';
import { RecordsScene } from './scenes/RecordsScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1080,
  height: 1920,
  backgroundColor: '#12121f',
  antialias: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container',
    expandParent: true,
    min: {
      width: 360,
      height: 640
    },
    max: {
      width: 1080,
      height: 1920
    }
  },
  scene: [BootScene, StarterPickerScene, WorldMapScene, LevelSelectScene, GameScene, ShopScene, RecordsScene, ParentDashboardScene]
};

const game = new Phaser.Game(config);

window.game = game;
