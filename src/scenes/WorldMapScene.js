import Phaser from 'phaser';
import { WORLDS, progress } from '../GameData.js';
import { audio } from '../AudioManager.js';
import { achievements, ACHIEVEMENTS } from '../AchievementManager.js';

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create() {
    audio.init();

    // Background
    this.add.rectangle(200, 350, 400, 700, 0x0a0a1a);

    // Stars background
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, 400);
      const y = Phaser.Math.Between(0, 700);
      const size = Phaser.Math.Between(1, 2);
      const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.3, 0.8));

      this.tweens.add({
        targets: star,
        alpha: star.alpha * 0.3,
        duration: Phaser.Math.Between(1000, 2000),
        yoyo: true,
        repeat: -1
      });
    }

    // Title
    this.add.text(200, 35, 'Cosmic Math Crunch', {
      fontSize: '22px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Total stars - stored as reference to update on scene resume
    this.totalStarsText = this.add.text(200, 60, '', {
      fontSize: '14px',
      fill: '#81ecec',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    this.updateTotalStars();

    // Music toggle button (top right)
    this.createMusicToggle();

    // Achievements button (top left)
    this.createAchievementsButton();

    // Parent dashboard button (gear icon, below music)
    this.createParentDashboardButton();

    // Speed Challenge button (unlocks after completing first world)
    this.createSpeedChallengeButton();

    // Scrollable world list
    this.createWorldList();

    // Update display when scene resumes (after completing a level)
    this.events.on('wake', this.onSceneWake, this);
    this.events.on('resume', this.onSceneWake, this);

    // Back to tutorial button (small, bottom)
    const tutorialBtn = this.add.text(200, 670, 'Review Tutorial', {
      fontSize: '12px',
      fill: '#666666',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive();

    tutorialBtn.on('pointerover', () => tutorialBtn.setFill('#ffffff'));
    tutorialBtn.on('pointerout', () => tutorialBtn.setFill('#666666'));
    tutorialBtn.on('pointerdown', () => {
      audio.playClick();
      this.registry.set('tutorialComplete', false);
      this.scene.start('TutorialScene');
    });
  }

  createWorldList() {
    const startY = 130;
    const spacing = 85;

    // Create a container for scrolling
    this.worldContainer = this.add.container(0, 0);

    WORLDS.forEach((world, index) => {
      const y = startY + index * spacing;
      this.createWorldCard(world, y);
    });

    // Enable scrolling if needed
    const totalHeight = WORLDS.length * spacing;
    if (totalHeight > 550) {
      this.setupScrolling(totalHeight);
    }
  }

  createWorldCard(world, y) {
    const isUnlocked = progress.isWorldUnlocked(world.id);
    const wp = progress.getWorldProgress(world.id);

    // Card background
    const cardColor = isUnlocked ? world.color : 0x2a2a3a;
    const card = this.add.rectangle(200, y, 360, 75, cardColor, 0.9)
      .setStrokeStyle(2, isUnlocked ? world.accentColor : 0x444444);

    if (isUnlocked) {
      card.setInteractive();
      card.on('pointerover', () => card.setStrokeStyle(3, 0xffffff));
      card.on('pointerout', () => card.setStrokeStyle(2, world.accentColor));
      card.on('pointerdown', () => {
        audio.playClick();
        this.selectWorld(world);
      });
    }

    this.worldContainer.add(card);

    // World icon (pixel art)
    const icon = this.add.image(50, y, `world_${world.id}`);
    if (!isUnlocked) {
      icon.setTint(0x444444);
      icon.setAlpha(0.5);
    }
    this.worldContainer.add(icon);

    // World name
    const nameText = this.add.text(90, y - 15, world.name, {
      fontSize: '18px',
      fill: isUnlocked ? '#ffffff' : '#666666',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    this.worldContainer.add(nameText);

    // Tables practiced
    const tablesStr = world.tables.length > 1
      ? `${world.tables[0]}s & ${world.tables[1]}s`
      : `${world.tables[0]}s table`;

    const tablesText = this.add.text(90, y + 8, tablesStr, {
      fontSize: '13px',
      fill: isUnlocked ? world.accentColor : '#555555',
      fontFamily: 'Arial'
    }).setOrigin(0, 0.5);
    this.worldContainer.add(tablesText);

    // Progress / Lock indicator
    if (isUnlocked) {
      // Stars earned
      const starsText = this.add.text(340, y - 12, `${wp.starsEarned}`, {
        fontSize: '16px',
        fill: '#f7dc6f',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      this.worldContainer.add(starsText);

      // Star icon
      this.worldContainer.add(
        this.add.star(358, y - 12, 5, 5, 10, 0xf7dc6f)
      );

      // Levels completed
      const levelsText = this.add.text(340, y + 12, `${wp.levelsCompleted}/${world.levelsRequired}`, {
        fontSize: '12px',
        fill: '#81ecec',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      this.worldContainer.add(levelsText);
    } else {
      // Lock icon (text placeholder)
      const lockText = this.add.text(340, y, '🔒', {
        fontSize: '24px'
      }).setOrigin(0.5);
      this.worldContainer.add(lockText);

      // Unlock hint
      const prevWorld = WORLDS[world.id - 2];
      if (prevWorld) {
        const hintText = this.add.text(200, y + 28, `Complete ${prevWorld.name} to unlock`, {
          fontSize: '10px',
          fill: '#555555',
          fontFamily: 'Arial'
        }).setOrigin(0.5);
        this.worldContainer.add(hintText);
      }
    }
  }

  setupScrolling(totalHeight) {
    const visibleHeight = 550;
    const maxScroll = totalHeight - visibleHeight + 100;

    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      this.worldContainer.y -= deltaY * 0.5;
      this.worldContainer.y = Phaser.Math.Clamp(this.worldContainer.y, -maxScroll, 0);
    });

    // Touch drag scrolling
    let dragStartY = 0;
    let containerStartY = 0;

    this.input.on('pointerdown', (pointer) => {
      dragStartY = pointer.y;
      containerStartY = this.worldContainer.y;
    });

    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        const deltaY = pointer.y - dragStartY;
        this.worldContainer.y = Phaser.Math.Clamp(
          containerStartY + deltaY,
          -maxScroll,
          0
        );
      }
    });
  }

  selectWorld(world) {
    // Store selected world and go to level select
    this.registry.set('selectedWorld', world.id);
    this.scene.start('LevelSelectScene');
  }

  updateTotalStars() {
    this.totalStarsText.setText(`Total Stars: ${progress.totalStars}`);
  }

  onSceneWake() {
    // Refresh progress data when returning to this scene
    this.updateTotalStars();
    // Rebuild world list to show updated progress
    this.worldContainer.removeAll(true);
    WORLDS.forEach((world, index) => {
      const y = 130 + index * 85;
      this.createWorldCard(world, y);
    });
  }

  createMusicToggle() {
    // Music toggle button in top right
    const musicIcon = audio.musicEnabled ? '♪' : '♪';
    const musicColor = audio.musicEnabled ? '#4ecdc4' : '#555555';

    this.musicBtn = this.add.text(370, 25, musicIcon, {
      fontSize: '24px',
      fill: musicColor,
      fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive();

    // Strike-through line when muted
    this.musicStrike = this.add.rectangle(370, 25, 28, 3, 0xff6b6b);
    this.musicStrike.setAngle(-45);
    this.musicStrike.setVisible(!audio.musicEnabled);

    this.musicBtn.on('pointerover', () => this.musicBtn.setScale(1.2));
    this.musicBtn.on('pointerout', () => this.musicBtn.setScale(1));
    this.musicBtn.on('pointerdown', () => {
      audio.playClick();
      const enabled = audio.toggleMusic();
      this.musicBtn.setFill(enabled ? '#4ecdc4' : '#555555');
      this.musicStrike.setVisible(!enabled);
    });
  }

  createAchievementsButton() {
    // Trophy button in top left
    const earned = achievements.getEarnedCount();
    const total = achievements.getTotalCount();

    this.achieveBtn = this.add.text(30, 25, '🏆', {
      fontSize: '22px'
    }).setOrigin(0.5).setInteractive();

    // Count badge
    this.achieveCount = this.add.text(45, 35, `${earned}/${total}`, {
      fontSize: '10px',
      fill: '#f7dc6f',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.achieveBtn.on('pointerover', () => this.achieveBtn.setScale(1.2));
    this.achieveBtn.on('pointerout', () => this.achieveBtn.setScale(1));
    this.achieveBtn.on('pointerdown', () => {
      audio.playClick();
      this.showAchievements();
    });
  }

  createParentDashboardButton() {
    // Gear/settings button for parent dashboard (top right, below music)
    this.settingsBtn = this.add.text(370, 55, '⚙️', {
      fontSize: '20px'
    }).setOrigin(0.5).setInteractive();

    // Small label
    this.add.text(370, 72, 'Parent', {
      fontSize: '8px',
      fill: '#555555',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.settingsBtn.on('pointerover', () => this.settingsBtn.setScale(1.2));
    this.settingsBtn.on('pointerout', () => this.settingsBtn.setScale(1));
    this.settingsBtn.on('pointerdown', () => {
      audio.playClick();
      this.scene.start('ParentDashboardScene');
    });
  }

  createSpeedChallengeButton() {
    // Unlocks after completing at least one world (8 levels)
    const isUnlocked = progress.getWorldProgress(1).levelsCompleted >= 8 ||
                       progress.totalStars >= 10;

    // Speed challenge button positioned below achievements
    const btnY = 95;

    if (isUnlocked) {
      // Use a text button with background for reliable clicks
      const speedBtnText = this.add.text(85, btnY, '⚡ SPEED', {
        fontSize: '14px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        backgroundColor: '#ff6b9d',
        padding: { x: 12, y: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      speedBtnText.on('pointerover', () => {
        speedBtnText.setStyle({ backgroundColor: '#ff8fab' });
      });

      speedBtnText.on('pointerout', () => {
        speedBtnText.setStyle({ backgroundColor: '#ff6b9d' });
      });

      speedBtnText.on('pointerdown', () => {
        audio.playClick();
        this.scene.start('SpeedChallengeScene');
      });
    } else {
      // Locked state
      const lockedBtn = this.add.text(85, btnY, '⚡ SPEED 🔒', {
        fontSize: '12px',
        fill: '#666666',
        fontFamily: 'Arial',
        backgroundColor: '#333333',
        padding: { x: 10, y: 6 }
      }).setOrigin(0.5).setAlpha(0.7);
    }
  }

  showAchievements() {
    // Create achievements overlay
    const overlay = this.add.rectangle(200, 350, 400, 700, 0x000000, 0.85);
    overlay.setInteractive(); // Block clicks behind

    // Panel
    const panel = this.add.rectangle(200, 350, 360, 600, 0x2d2d44)
      .setStrokeStyle(2, 0xf7dc6f);

    // Title
    const title = this.add.text(200, 80, '🏆 Achievements', {
      fontSize: '24px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Close button
    const closeBtn = this.add.text(360, 70, '✕', {
      fontSize: '24px',
      fill: '#ff6b6b',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive();

    closeBtn.on('pointerover', () => closeBtn.setScale(1.2));
    closeBtn.on('pointerout', () => closeBtn.setScale(1));

    // Container for cleanup
    const elements = [overlay, panel, title, closeBtn];

    // List achievements
    const allAchievements = achievements.getAllAchievements();
    const startY = 120;
    const spacing = 55;

    allAchievements.forEach((ach, index) => {
      const y = startY + index * spacing;
      if (y > 620) return; // Don't overflow

      // Achievement row background
      const rowBg = this.add.rectangle(200, y, 340, 50, ach.earned ? 0x3a5a3a : 0x2a2a3a, 0.8)
        .setStrokeStyle(1, ach.earned ? 0x58d68d : 0x444444);
      elements.push(rowBg);

      // Icon
      const icon = this.add.text(45, y, ach.icon, {
        fontSize: '28px'
      }).setOrigin(0.5);
      if (!ach.earned) icon.setAlpha(0.4);
      elements.push(icon);

      // Name
      const name = this.add.text(80, y - 10, ach.name, {
        fontSize: '14px',
        fill: ach.earned ? '#ffffff' : '#666666',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      elements.push(name);

      // Description
      const desc = this.add.text(80, y + 10, ach.description, {
        fontSize: '11px',
        fill: ach.earned ? '#81ecec' : '#555555',
        fontFamily: 'Arial'
      }).setOrigin(0, 0.5);
      elements.push(desc);

      // Checkmark if earned
      if (ach.earned) {
        const check = this.add.text(360, y, '✓', {
          fontSize: '20px',
          fill: '#58d68d',
          fontFamily: 'Arial'
        }).setOrigin(0.5);
        elements.push(check);
      }
    });

    // Close handler
    closeBtn.on('pointerdown', () => {
      audio.playClick();
      elements.forEach(el => el.destroy());
    });
  }
}
