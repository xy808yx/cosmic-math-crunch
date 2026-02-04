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

    this.events.on('wake', this.onSceneWake, this);
    this.events.on('resume', this.onSceneWake, this);

    // Background
    this.add.rectangle(200, 350, 400, 700, this.world.color);

    // Stars
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, 400);
      const y = Phaser.Math.Between(0, 700);
      this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xffffff, 0.3);
    }

    // === HEADER (y: 0-200) ===
    this.createHeader();

    // === LEVEL BUTTONS (y: 200-500) ===
    this.createLevelGrid();

    // === INFO SECTION (y: 500-700) ===
    this.createInfoSection();

    new TransitionManager(this).fadeIn(300);
  }

  createHeader() {
    // Header background
    this.add.rectangle(200, 100, 400, 200, 0x000000, 0.3);

    // Back button - large and clear
    const backBtn = this.add.text(20, 25, '← Back', {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setFill('#f7dc6f'));
    backBtn.on('pointerout', () => backBtn.setFill('#ffffff'));
    backBtn.on('pointerdown', () => {
      audio.playClick();
      new TransitionManager(this).fadeToScene('WorldMapScene');
    });

    // World icon
    const icon = this.add.image(200, 70, `world_${this.world.id}`).setScale(1.3);
    this.tweens.add({
      targets: icon,
      y: 65,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // World name - BIG
    this.add.text(200, 130, this.world.name, {
      fontSize: '28px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Tables info
    const tablesStr = this.world.tables.length > 1
      ? `${this.world.tables[0]}× and ${this.world.tables[1]}× tables`
      : `${this.world.tables[0]}× table`;

    this.add.text(200, 165, tablesStr, {
      fontSize: '18px',
      fill: '#' + this.world.accentColor.toString(16).padStart(6, '0'),
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  createLevelGrid() {
    // Section title
    this.add.text(200, 220, 'Select a Level', {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 4 levels in a 2x2 grid for better sizing
    const startY = 280;
    const startX = 100;
    const spacingX = 200;
    const spacingY = 120;

    for (let i = 0; i < 4; i++) {
      const levelNum = i + 1;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;
      this.createLevelButton(x, y, levelNum);
    }
  }

  createLevelButton(x, y, levelNum) {
    const stars = this.worldProgress.levelStars[levelNum] || 0;
    const isCompleted = stars > 0;
    const isUnlocked = levelNum === 1 || this.worldProgress.levelStars[levelNum - 1] > 0;

    // Button shadow
    this.add.rectangle(x + 3, y + 3, 150, 90, 0x000000, 0.4);

    // Button background
    const bgColor = isUnlocked
      ? (isCompleted ? this.world.accentColor : 0x3a3a5a)
      : 0x2a2a3a;

    const btn = this.add.rectangle(x, y, 150, 90, bgColor)
      .setStrokeStyle(3, isUnlocked ? this.world.accentColor : 0x444444);

    if (isUnlocked) {
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => {
        btn.setStrokeStyle(4, 0xffffff);
        this.tweens.add({ targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 100 });
      });
      btn.on('pointerout', () => {
        btn.setStrokeStyle(3, this.world.accentColor);
        this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 100 });
      });
      btn.on('pointerdown', () => {
        audio.playClick();
        this.startLevel(levelNum);
      });
    }

    // Level number - LARGE
    this.add.text(x, y - 15, `Level ${levelNum}`, {
      fontSize: '24px',
      fill: isUnlocked ? '#ffffff' : '#666666',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Stars or lock indicator
    if (isUnlocked) {
      // Stars display
      const starY = y + 20;
      for (let s = 0; s < 3; s++) {
        const starX = x - 30 + s * 30;
        const filled = s < stars;
        this.add.text(starX, starY, filled ? '⭐' : '☆', {
          fontSize: '20px',
          fill: filled ? '#f7dc6f' : '#555555'
        }).setOrigin(0.5);
      }
    } else {
      this.add.text(x, y + 18, '🔒 Locked', {
        fontSize: '16px',
        fill: '#666666',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
    }
  }

  createInfoSection() {
    // Info panel background
    this.add.rectangle(200, 590, 380, 180, 0x000000, 0.4);

    // Mastery section
    const mastery = this.world.tables.map(t => progress.getTableMastery(t));
    const avgMastery = Math.round(mastery.reduce((a, b) => a + b, 0) / mastery.length);

    this.add.text(200, 520, 'Your Mastery', {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Mastery bar background
    this.add.rectangle(200, 555, 300, 25, 0x2a2a3a);

    // Mastery bar fill
    const masteryWidth = (avgMastery / 100) * 296;
    const masteryColor = avgMastery >= 70 ? 0x58d68d : avgMastery >= 40 ? 0xf39c12 : 0xff6b6b;
    this.add.rectangle(52 + masteryWidth / 2, 555, masteryWidth, 21, masteryColor);

    // Mastery percentage
    this.add.text(200, 555, `${avgMastery}%`, {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Progress info
    const completed = this.worldProgress.levelsCompleted;
    const required = this.world.levelsRequired;
    const starsEarned = this.worldProgress.starsEarned;

    this.add.text(110, 600, `Levels: ${completed}/${required}`, {
      fontSize: '16px',
      fill: '#81ecec',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.text(290, 600, `Stars: ⭐ ${starsEarned}`, {
      fontSize: '16px',
      fill: '#f7dc6f',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Tip text
    this.add.text(200, 650, 'Tip: Get 3 stars by finishing with moves to spare!', {
      fontSize: '12px',
      fill: '#888888',
      fontFamily: 'Arial',
      fontStyle: 'italic'
    }).setOrigin(0.5);
  }

  startLevel(levelNum) {
    this.registry.set('currentWorldId', this.world.id);
    this.registry.set('currentLevel', levelNum);

    const difficulty = {
      moves: 40 + (levelNum - 1) * 5,
      targetScore: 800 + (levelNum - 1) * 200,
      boardSize: 5
    };
    this.registry.set('levelDifficulty', difficulty);

    this.input.enabled = false;
    const overlay = this.add.rectangle(200, 350, 400, 700, 0x000000, 0).setDepth(1000);

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
    this.scene.restart();
  }
}
