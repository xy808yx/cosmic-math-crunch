import Phaser from 'phaser';
import { WORLDS, progress } from '../GameData.js';
import { audio } from '../AudioManager.js';
import { TransitionManager } from '../TransitionManager.js';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create() {
    const worldId = this.registry.get('selectedWorld') || 1;
    this.world = WORLDS[worldId - 1];
    this.worldProgress = progress.getWorldProgress(worldId);

    // Update display when scene resumes (after completing a level)
    this.events.on('wake', this.onSceneWake, this);
    this.events.on('resume', this.onSceneWake, this);

    // Background with world color
    this.add.rectangle(200, 350, 400, 700, this.world.color);

    // Stars
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, 400);
      const y = Phaser.Math.Between(0, 700);
      this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xffffff, 0.4);
    }

    // Back button
    const backBtn = this.add.text(30, 30, '< Back', {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setInteractive();

    backBtn.on('pointerover', () => backBtn.setFill('#' + this.world.accentColor.toString(16).padStart(6, '0')));
    backBtn.on('pointerout', () => backBtn.setFill('#ffffff'));
    backBtn.on('pointerdown', () => {
      audio.playClick();
      new TransitionManager(this).fadeToScene('WorldMapScene');
    });

    // Fade in effect
    new TransitionManager(this).fadeIn(300);

    // World icon (pixel art) - prominent at top
    const icon = this.add.image(200, 55, `world_${this.world.id}`);
    icon.setScale(1.2);

    // Add gentle floating animation to icon
    this.tweens.add({
      targets: icon,
      y: icon.y - 5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // World title
    this.add.text(200, 95, this.world.name, {
      fontSize: '22px',
      fill: '#' + this.world.accentColor.toString(16).padStart(6, '0'),
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Tables info
    const tablesStr = this.world.tables.length > 1
      ? `Practicing: ${this.world.tables[0]}s & ${this.world.tables[1]}s`
      : `Practicing: ${this.world.tables[0]}s table`;

    this.add.text(200, 118, tablesStr, {
      fontSize: '13px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Mastery display
    const mastery = this.world.tables.map(t => progress.getTableMastery(t));
    const avgMastery = Math.round(mastery.reduce((a, b) => a + b, 0) / mastery.length);

    this.add.text(200, 138, `Mastery: ${avgMastery}%`, {
      fontSize: '12px',
      fill: avgMastery >= 70 ? '#58d68d' : '#f39c12',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Level grid
    this.createLevelGrid();
  }

  createLevelGrid() {
    const startY = 170;
    const cols = 4;
    const cellSize = 80;
    const offsetX = (400 - cols * cellSize) / 2 + cellSize / 2;

    const totalLevels = 12; // 12 levels per world

    for (let i = 0; i < totalLevels; i++) {
      const levelNum = i + 1;
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = offsetX + col * cellSize;
      const y = startY + row * (cellSize + 10);

      this.createLevelButton(x, y, levelNum);
    }
  }

  createLevelButton(x, y, levelNum) {
    const stars = this.worldProgress.levelStars[levelNum] || 0;
    const isCompleted = stars > 0;
    const isUnlocked = levelNum === 1 || this.worldProgress.levelStars[levelNum - 1] > 0;

    // Button background
    const bgColor = isUnlocked
      ? (isCompleted ? this.world.accentColor : 0x3a3a5a)
      : 0x2a2a3a;

    const btn = this.add.rectangle(x, y, 65, 65, bgColor, 0.9)
      .setStrokeStyle(2, isUnlocked ? this.world.accentColor : 0x444444);

    if (isUnlocked) {
      btn.setInteractive();
      btn.on('pointerover', () => btn.setStrokeStyle(3, 0xffffff));
      btn.on('pointerout', () => btn.setStrokeStyle(2, this.world.accentColor));
      btn.on('pointerdown', () => {
        audio.playClick();
        this.startLevel(levelNum);
      });
    }

    // Level number
    const numText = this.add.text(x, y - 8, levelNum.toString(), {
      fontSize: isUnlocked ? '22px' : '18px',
      fill: isUnlocked ? '#ffffff' : '#555555',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Stars or lock
    if (isUnlocked) {
      // Show stars (filled or empty)
      for (let s = 0; s < 3; s++) {
        const starX = x - 15 + s * 15;
        const starY = y + 18;
        const filled = s < stars;

        if (filled) {
          this.add.star(starX, starY, 5, 4, 8, 0xf7dc6f);
        } else {
          this.add.star(starX, starY, 5, 4, 8, 0x555555);
        }
      }
    } else {
      // Lock icon
      this.add.text(x, y + 15, '🔒', {
        fontSize: '14px'
      }).setOrigin(0.5);
    }
  }

  startLevel(levelNum) {
    // Store level info for GameScene
    this.registry.set('currentWorldId', this.world.id);
    this.registry.set('currentLevel', levelNum);

    // Calculate difficulty based on level
    const difficulty = {
      moves: 15 + Math.floor(levelNum / 3),
      targetScore: 400 + levelNum * 50,
      boardSize: levelNum > 8 ? 6 : 5
    };
    this.registry.set('levelDifficulty', difficulty);

    // Fade transition to game
    this.input.enabled = false;
    const overlay = this.add.rectangle(200, 350, 400, 700, 0x0a0a1a, 0).setDepth(1000);

    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 350,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.scene.start('GameScene');
        this.scene.start('UIScene');
      }
    });
  }

  onSceneWake() {
    // Refresh progress and rebuild UI when returning from a level
    this.scene.restart();
  }
}
