import Phaser from 'phaser';
import { WORLDS, progress } from '../GameData.js';
import { audio } from '../AudioManager.js';
import { achievements } from '../AchievementManager.js';
import { TransitionManager } from '../TransitionManager.js';

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create() {
    audio.init();

    // Simple dark background
    this.add.rectangle(400, 700, 800, 1400, 0x1a1a2e);

    // === HEADER: y = 0 to 180 ===
    this.add.rectangle(400, 90, 800, 180, 0x12121f).setDepth(10);

    // Top row: Settings, Title, Sound
    const settingsBtn = this.add.text(50, 50, '⚙️', {
      fontSize: '48px'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(11);
    settingsBtn.on('pointerdown', () => {
      audio.playClick();
      this.scene.start('ParentDashboardScene');
    });

    this.add.text(400, 50, 'Cosmic Math Crunch', {
      fontSize: '44px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    this.soundBtn = this.add.text(750, 50, audio.musicEnabled ? '🔊' : '🔇', {
      fontSize: '48px'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(11);
    this.soundBtn.on('pointerdown', () => {
      audio.playClick();
      const enabled = audio.toggleMusic();
      this.soundBtn.setText(enabled ? '🔊' : '🔇');
    });

    // Bottom row: Trophy, Stars
    const achBtn = this.add.text(50, 130, '🏆', {
      fontSize: '48px'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(11);
    achBtn.on('pointerdown', () => {
      audio.playClick();
      this.showAchievements();
    });

    this.totalStarsText = this.add.text(400, 130, `⭐ ${progress.totalStars} Stars`, {
      fontSize: '36px',
      fill: '#81ecec',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    // === WORLD LIST: y = 180 to 1300 ===
    this.createWorldList();

    // === FOOTER: y = 1300 to 1400 ===
    this.add.rectangle(400, 1350, 800, 100, 0x12121f).setDepth(10);

    const tutorialBtn = this.add.text(400, 1350, 'Review Tutorial', {
      fontSize: '32px',
      fill: '#888888',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(11);
    tutorialBtn.on('pointerover', () => tutorialBtn.setFill('#ffffff'));
    tutorialBtn.on('pointerout', () => tutorialBtn.setFill('#888888'));
    tutorialBtn.on('pointerdown', () => {
      audio.playClick();
      this.registry.set('tutorialComplete', false);
      this.scene.start('TutorialScene');
    });

    // Scene events
    this.events.on('wake', this.onSceneWake, this);
    this.events.on('resume', this.onSceneWake, this);

    new TransitionManager(this).fadeIn(300);
  }

  createWorldList() {
    const startY = 270;
    const cardHeight = 130;
    const gap = 12;

    this.worldContainer = this.add.container(0, 0).setDepth(5);

    WORLDS.forEach((world, i) => {
      const y = startY + i * (cardHeight + gap);
      this.createWorldCard(world, y, cardHeight);
    });

    // Scrolling
    const totalHeight = WORLDS.length * (cardHeight + gap);
    const viewHeight = 1020;
    const maxScroll = Math.max(0, totalHeight - viewHeight);

    if (maxScroll > 0) {
      this.input.on('wheel', (p, g, dx, dy) => {
        this.worldContainer.y = Phaser.Math.Clamp(this.worldContainer.y - dy * 0.5, -maxScroll, 0);
      });

      let dragStart = 0, containerStart = 0;
      this.input.on('pointerdown', p => {
        if (p.y > 200 && p.y < 1300) {
          dragStart = p.y;
          containerStart = this.worldContainer.y;
        }
      });
      this.input.on('pointermove', p => {
        if (p.isDown && dragStart > 0) {
          this.worldContainer.y = Phaser.Math.Clamp(containerStart + (p.y - dragStart), -maxScroll, 0);
        }
      });
      this.input.on('pointerup', () => dragStart = 0);
    }
  }

  createWorldCard(world, y, height) {
    const isUnlocked = progress.isWorldUnlocked(world.id);
    const wp = progress.getWorldProgress(world.id);

    // Card background
    const cardColor = isUnlocked ? world.color : 0x2a2a3a;
    const card = this.add.rectangle(400, y, 760, height, cardColor)
      .setStrokeStyle(4, isUnlocked ? world.accentColor : 0x444444);
    this.worldContainer.add(card);

    if (isUnlocked) {
      card.setInteractive({ useHandCursor: true });
      card.on('pointerover', () => card.setStrokeStyle(6, 0xffffff));
      card.on('pointerout', () => card.setStrokeStyle(4, world.accentColor));
      card.on('pointerdown', () => {
        audio.playClick();
        this.selectWorld(world);
      });
    }

    // World icon
    const icon = this.add.image(80, y, `world_${world.id}`).setScale(1.6);
    if (!isUnlocked) icon.setAlpha(0.4);
    this.worldContainer.add(icon);

    // World name
    this.worldContainer.add(
      this.add.text(160, y - 20, world.name, {
        fontSize: '40px',
        fill: isUnlocked ? '#ffffff' : '#666666',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5)
    );

    // Table info
    const tableText = world.tables.length > 1
      ? `${world.tables[0]}x and ${world.tables[1]}x tables`
      : `${world.tables[0]}x table`;
    this.worldContainer.add(
      this.add.text(160, y + 28, tableText, {
        fontSize: '32px',
        fill: isUnlocked ? '#aaaaaa' : '#555555',
        fontFamily: 'Arial'
      }).setOrigin(0, 0.5)
    );

    // Right side - stars/progress or lock
    if (isUnlocked) {
      this.worldContainer.add(
        this.add.text(710, y - 16, `${wp.starsEarned}⭐`, {
          fontSize: '36px',
          fill: '#f7dc6f',
          fontFamily: 'Arial',
          fontStyle: 'bold'
        }).setOrigin(0.5)
      );
      this.worldContainer.add(
        this.add.text(710, y + 28, `${wp.levelsCompleted}/${world.levelsRequired}`, {
          fontSize: '32px',
          fill: '#81ecec',
          fontFamily: 'Arial'
        }).setOrigin(0.5)
      );
    } else {
      this.worldContainer.add(
        this.add.text(710, y, '🔒', { fontSize: '56px' }).setOrigin(0.5)
      );
    }
  }

  selectWorld(world) {
    this.registry.set('selectedWorld', world.id);
    new TransitionManager(this).fadeToScene('LevelSelectScene');
  }

  onSceneWake() {
    this.totalStarsText.setText(`⭐ ${progress.totalStars} Stars`);
    this.worldContainer.removeAll(true);
    const startY = 270;
    const cardHeight = 130;
    const gap = 12;
    WORLDS.forEach((world, i) => {
      this.createWorldCard(world, startY + i * (cardHeight + gap), cardHeight);
    });
  }

  showAchievements() {
    const overlay = this.add.rectangle(400, 700, 800, 1400, 0x000000, 0.9)
      .setInteractive().setDepth(100);

    const panel = this.add.rectangle(400, 700, 720, 1100, 0x1a1a2e)
      .setStrokeStyle(4, 0xf7dc6f).setDepth(101);

    const title = this.add.text(400, 190, 'Achievements', {
      fontSize: '44px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101);

    const closeBtn = this.add.text(720, 180, '✕', {
      fontSize: '56px',
      fill: '#ff6b6b'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(101);

    const elements = [overlay, panel, title, closeBtn];

    const allAch = achievements.getAllAchievements();
    let yPos = 280;

    allAch.forEach(ach => {
      if (yPos > 1160) return;

      const row = this.add.rectangle(400, yPos, 680, 100, ach.earned ? 0x2a4a2a : 0x252535)
        .setStrokeStyle(2, ach.earned ? 0x58d68d : 0x3a3a4a).setDepth(101);
      elements.push(row);

      elements.push(this.add.text(90, yPos, ach.icon, { fontSize: '48px' })
        .setOrigin(0.5).setAlpha(ach.earned ? 1 : 0.4).setDepth(101));

      elements.push(this.add.text(150, yPos - 16, ach.name, {
        fontSize: '28px',
        fill: ach.earned ? '#ffffff' : '#888888',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5).setDepth(101));

      elements.push(this.add.text(150, yPos + 20, ach.description, {
        fontSize: '22px',
        fill: ach.earned ? '#81ecec' : '#666666',
        fontFamily: 'Arial'
      }).setOrigin(0, 0.5).setDepth(101));

      yPos += 110;
    });

    closeBtn.on('pointerdown', () => {
      audio.playClick();
      elements.forEach(el => el.destroy());
    });
  }
}
