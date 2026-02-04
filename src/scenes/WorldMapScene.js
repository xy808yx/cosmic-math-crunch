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
    this.add.rectangle(200, 350, 400, 700, 0x1a1a2e);

    // === HEADER: y = 0 to 80 ===
    this.add.rectangle(200, 40, 400, 80, 0x12121f).setDepth(10);

    this.add.text(200, 25, 'Cosmic Math Crunch', {
      fontSize: '22px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    this.totalStarsText = this.add.text(200, 55, `${progress.totalStars} Stars`, {
      fontSize: '16px',
      fill: '#81ecec',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(11);

    // Settings button (top left)
    const settingsBtn = this.add.text(20, 55, '⚙️', {
      fontSize: '22px'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(11);
    settingsBtn.on('pointerdown', () => {
      audio.playClick();
      this.scene.start('ParentDashboardScene');
    });

    // Achievements button (top left, next to settings)
    const achBtn = this.add.text(60, 55, '🏆', {
      fontSize: '22px'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(11);
    achBtn.on('pointerdown', () => {
      audio.playClick();
      this.showAchievements();
    });

    // Sound toggle (top right)
    this.soundBtn = this.add.text(380, 55, audio.musicEnabled ? '🔊' : '🔇', {
      fontSize: '22px'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(11);
    this.soundBtn.on('pointerdown', () => {
      audio.playClick();
      const enabled = audio.toggleMusic();
      this.soundBtn.setText(enabled ? '🔊' : '🔇');
    });

    // === WORLD LIST: y = 90 to 650 ===
    this.createWorldList();

    // === FOOTER: y = 650 to 700 ===
    this.add.rectangle(200, 675, 400, 50, 0x12121f).setDepth(10);

    const tutorialBtn = this.add.text(200, 675, 'Review Tutorial', {
      fontSize: '14px',
      fill: '#666666',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(11);
    tutorialBtn.on('pointerover', () => tutorialBtn.setFill('#ffffff'));
    tutorialBtn.on('pointerout', () => tutorialBtn.setFill('#666666'));
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
    const startY = 125;
    const cardHeight = 65;
    const gap = 6;

    this.worldContainer = this.add.container(0, 0).setDepth(5);

    WORLDS.forEach((world, i) => {
      const y = startY + i * (cardHeight + gap);
      this.createWorldCard(world, y, cardHeight);
    });

    // Scrolling
    const totalHeight = WORLDS.length * (cardHeight + gap);
    const viewHeight = 550;
    const maxScroll = Math.max(0, totalHeight - viewHeight);

    if (maxScroll > 0) {
      this.input.on('wheel', (p, g, dx, dy) => {
        this.worldContainer.y = Phaser.Math.Clamp(this.worldContainer.y - dy * 0.5, -maxScroll, 0);
      });

      let dragStart = 0, containerStart = 0;
      this.input.on('pointerdown', p => {
        if (p.y > 90 && p.y < 650) {
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
    const card = this.add.rectangle(200, y, 380, height, cardColor)
      .setStrokeStyle(2, isUnlocked ? world.accentColor : 0x444444);
    this.worldContainer.add(card);

    if (isUnlocked) {
      card.setInteractive({ useHandCursor: true });
      card.on('pointerover', () => card.setStrokeStyle(3, 0xffffff));
      card.on('pointerout', () => card.setStrokeStyle(2, world.accentColor));
      card.on('pointerdown', () => {
        audio.playClick();
        this.selectWorld(world);
      });
    }

    // World icon
    const icon = this.add.image(40, y, `world_${world.id}`).setScale(0.8);
    if (!isUnlocked) icon.setAlpha(0.4);
    this.worldContainer.add(icon);

    // World name
    this.worldContainer.add(
      this.add.text(80, y - 12, world.name, {
        fontSize: '18px',
        fill: isUnlocked ? '#ffffff' : '#666666',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5)
    );

    // Table info
    const tableText = world.tables.length > 1
      ? `${world.tables[0]}x and ${world.tables[1]}x`
      : `${world.tables[0]}x table`;
    this.worldContainer.add(
      this.add.text(80, y + 12, tableText, {
        fontSize: '14px',
        fill: isUnlocked ? '#aaaaaa' : '#555555',
        fontFamily: 'Arial'
      }).setOrigin(0, 0.5)
    );

    // Right side - stars/progress or lock
    if (isUnlocked) {
      this.worldContainer.add(
        this.add.text(350, y - 10, `${wp.starsEarned}⭐`, {
          fontSize: '16px',
          fill: '#f7dc6f',
          fontFamily: 'Arial'
        }).setOrigin(0.5)
      );
      this.worldContainer.add(
        this.add.text(350, y + 12, `${wp.levelsCompleted}/${world.levelsRequired}`, {
          fontSize: '14px',
          fill: '#81ecec',
          fontFamily: 'Arial'
        }).setOrigin(0.5)
      );
    } else {
      this.worldContainer.add(
        this.add.text(350, y, '🔒', { fontSize: '24px' }).setOrigin(0.5)
      );
    }
  }

  selectWorld(world) {
    this.registry.set('selectedWorld', world.id);
    new TransitionManager(this).fadeToScene('LevelSelectScene');
  }

  onSceneWake() {
    this.totalStarsText.setText(`${progress.totalStars} Stars`);
    this.worldContainer.removeAll(true);
    const startY = 125;
    const cardHeight = 65;
    const gap = 6;
    WORLDS.forEach((world, i) => {
      this.createWorldCard(world, startY + i * (cardHeight + gap), cardHeight);
    });
  }

  showAchievements() {
    const overlay = this.add.rectangle(200, 350, 400, 700, 0x000000, 0.9)
      .setInteractive().setDepth(100);

    const panel = this.add.rectangle(200, 350, 360, 550, 0x1a1a2e)
      .setStrokeStyle(2, 0xf7dc6f).setDepth(101);

    const title = this.add.text(200, 95, 'Achievements', {
      fontSize: '22px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101);

    const closeBtn = this.add.text(360, 90, '✕', {
      fontSize: '28px',
      fill: '#ff6b6b'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(101);

    const elements = [overlay, panel, title, closeBtn];

    const allAch = achievements.getAllAchievements();
    let yPos = 140;

    allAch.forEach(ach => {
      if (yPos > 580) return;

      const row = this.add.rectangle(200, yPos, 340, 50, ach.earned ? 0x2a4a2a : 0x252535)
        .setStrokeStyle(1, ach.earned ? 0x58d68d : 0x3a3a4a).setDepth(101);
      elements.push(row);

      elements.push(this.add.text(45, yPos, ach.icon, { fontSize: '24px' })
        .setOrigin(0.5).setAlpha(ach.earned ? 1 : 0.4).setDepth(101));

      elements.push(this.add.text(75, yPos - 8, ach.name, {
        fontSize: '14px',
        fill: ach.earned ? '#ffffff' : '#888888',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5).setDepth(101));

      elements.push(this.add.text(75, yPos + 10, ach.description, {
        fontSize: '11px',
        fill: ach.earned ? '#81ecec' : '#666666',
        fontFamily: 'Arial'
      }).setOrigin(0, 0.5).setDepth(101));

      yPos += 55;
    });

    closeBtn.on('pointerdown', () => {
      audio.playClick();
      elements.forEach(el => el.destroy());
    });
  }
}
