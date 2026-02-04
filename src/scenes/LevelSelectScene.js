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
    this.add.rectangle(400, 700, 800, 1400, this.world.color);

    // Stars
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(0, 1400);
      this.add.circle(x, y, Phaser.Math.Between(2, 4), 0xffffff, 0.3);
    }

    // === HEADER (y: 0-400) ===
    this.createHeader();

    // === LEVEL BUTTONS (y: 400-1000) ===
    this.createLevelGrid();

    // === INFO SECTION (y: 1000-1400) ===
    this.createInfoSection();

    new TransitionManager(this).fadeIn(300);
  }

  createHeader() {
    // Header background
    this.add.rectangle(400, 200, 800, 400, 0x000000, 0.3);

    // Back button - large and clear
    const backBtn = this.add.text(40, 50, '← Back', {
      fontSize: '36px',
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
    const icon = this.add.image(400, 140, `world_${this.world.id}`).setScale(2.6);
    this.tweens.add({
      targets: icon,
      y: 130,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // World name - BIG
    this.add.text(400, 260, this.world.name, {
      fontSize: '56px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    // Tables info
    const tablesStr = this.world.tables.length > 1
      ? `${this.world.tables[0]}× and ${this.world.tables[1]}× tables`
      : `${this.world.tables[0]}× table`;

    this.add.text(400, 330, tablesStr, {
      fontSize: '36px',
      fill: '#' + this.world.accentColor.toString(16).padStart(6, '0'),
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  createLevelGrid() {
    // Section title
    this.add.text(400, 440, 'Select a Level', {
      fontSize: '40px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 4 levels in a 2x2 grid for better sizing
    const startY = 560;
    const startX = 200;
    const spacingX = 400;
    const spacingY = 240;

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
    this.add.rectangle(x + 6, y + 6, 300, 180, 0x000000, 0.4);

    // Button background
    const bgColor = isUnlocked
      ? (isCompleted ? this.world.accentColor : 0x3a3a5a)
      : 0x2a2a3a;

    const btn = this.add.rectangle(x, y, 300, 180, bgColor)
      .setStrokeStyle(6, isUnlocked ? this.world.accentColor : 0x444444);

    if (isUnlocked) {
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => {
        btn.setStrokeStyle(8, 0xffffff);
        this.tweens.add({ targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 100 });
      });
      btn.on('pointerout', () => {
        btn.setStrokeStyle(6, this.world.accentColor);
        this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 100 });
      });
      btn.on('pointerdown', () => {
        audio.playClick();
        this.startLevel(levelNum);
      });
    }

    // Level number - LARGE
    this.add.text(x, y - 30, `Level ${levelNum}`, {
      fontSize: '48px',
      fill: isUnlocked ? '#ffffff' : '#666666',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Stars or lock indicator
    if (isUnlocked) {
      // Stars display
      const starY = y + 40;
      for (let s = 0; s < 3; s++) {
        const starX = x - 60 + s * 60;
        const filled = s < stars;
        this.add.text(starX, starY, filled ? '⭐' : '☆', {
          fontSize: '40px',
          fill: filled ? '#f7dc6f' : '#555555'
        }).setOrigin(0.5);
      }
    } else {
      this.add.text(x, y + 36, '🔒 Locked', {
        fontSize: '32px',
        fill: '#666666',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
    }
  }

  createInfoSection() {
    // Info panel background
    this.add.rectangle(400, 1180, 760, 360, 0x000000, 0.4);

    // Mastery section
    const mastery = this.world.tables.map(t => progress.getTableMastery(t));
    const avgMastery = Math.round(mastery.reduce((a, b) => a + b, 0) / mastery.length);

    this.add.text(400, 1040, 'Your Mastery', {
      fontSize: '36px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Mastery bar background
    this.add.rectangle(400, 1110, 600, 50, 0x2a2a3a);

    // Mastery bar fill
    const masteryWidth = (avgMastery / 100) * 592;
    const masteryColor = avgMastery >= 70 ? 0x58d68d : avgMastery >= 40 ? 0xf39c12 : 0xff6b6b;
    this.add.rectangle(104 + masteryWidth / 2, 1110, masteryWidth, 42, masteryColor);

    // Mastery percentage
    this.add.text(400, 1110, `${avgMastery}%`, {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Progress info
    const completed = this.worldProgress.levelsCompleted;
    const required = this.world.levelsRequired;
    const starsEarned = this.worldProgress.starsEarned;

    this.add.text(220, 1200, `Levels: ${completed}/${required}`, {
      fontSize: '32px',
      fill: '#81ecec',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.add.text(580, 1200, `Stars: ⭐ ${starsEarned}`, {
      fontSize: '32px',
      fill: '#f7dc6f',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Tip text
    this.add.text(400, 1300, 'Tip: Get 3 stars by finishing with moves to spare!', {
      fontSize: '28px',
      fill: '#aaaaaa',
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
    const overlay = this.add.rectangle(400, 700, 800, 1400, 0x000000, 0).setDepth(1000);

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
