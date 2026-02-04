import Phaser from 'phaser';
import { audio } from '../AudioManager.js';

// Tutorial teaches multiplication through 3 visual models

export class TutorialScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TutorialScene' });
  }

  init() {
    this.currentModel = 0;
  }

  create() {
    // Initialize audio (for first user interaction)
    audio.init();

    // Solid background
    this.add.rectangle(400, 700, 800, 1400, 0x1a1a2e);

    // Add some stars
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(20, 780);
      const y = Phaser.Math.Between(20, 1380);
      this.add.circle(x, y, Phaser.Math.Between(2, 4), 0xffffff, 0.5);
    }

    // Title area (top)
    this.titleText = this.add.text(400, 80, 'Learn to Multiply!', {
      fontSize: '44px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Instruction area (below title)
    this.instructionText = this.add.text(400, 180, '', {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      align: 'center',
      wordWrap: { width: 680 }
    }).setOrigin(0.5, 0);

    // Main content container (middle of screen)
    this.contentContainer = this.add.container(400, 640);

    // Equation display (lower area)
    this.equationText = this.add.text(400, 1080, '', {
      fontSize: '48px',
      fill: '#4ecdc4',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Continue button (bottom)
    this.continueBtn = this.createButton(400, 1200, 'Continue', () => this.nextStep());
    this.continueBtn.setVisible(false);

    // Skip button (top right) - clear and easy to find
    const skipBtn = this.add.text(760, 40, 'Skip →', {
      fontSize: '36px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      backgroundColor: '#3d3d5c',
      padding: { x: 24, y: 12 }
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    skipBtn.on('pointerdown', () => this.startGame());
    skipBtn.on('pointerover', () => skipBtn.setStyle({ backgroundColor: '#5d5d7c' }));
    skipBtn.on('pointerout', () => skipBtn.setStyle({ backgroundColor: '#3d3d5c' }));

    // Sound toggle (top-left)
    this.createSoundToggle();

    // Start tutorial
    this.showModel(0);
  }

  createSoundToggle() {
    const container = this.add.container(60, 50);

    // Button background
    const bgGlow = this.add.circle(0, 0, 32, 0x4ecdc4, 0.2);
    container.add(bgGlow);

    const bg = this.add.circle(0, 0, 28, 0x1a1a2e, 0.8);
    bg.setStrokeStyle(2, 0x4ecdc4, 0.6);
    container.add(bg);

    // Sound icon
    this.soundIcon = this.createSoundIcon(audio.musicEnabled);
    container.add(this.soundIcon);

    // Interactive
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      container.setScale(1.15);
      bgGlow.setAlpha(0.4);
    });
    bg.on('pointerout', () => {
      container.setScale(1);
      bgGlow.setAlpha(0.2);
    });
    bg.on('pointerdown', () => {
      audio.playClick();
      const enabled = audio.toggleMusic();
      this.soundIcon.destroy();
      this.soundIcon = this.createSoundIcon(enabled);
      container.add(this.soundIcon);
    });
  }

  createSoundIcon(isOn) {
    const g = this.add.graphics();
    const size = 18;

    // Speaker body
    g.fillStyle(0x81ecec, 1);
    g.fillRect(-size * 0.4, -size * 0.25, size * 0.3, size * 0.5);

    // Speaker cone
    g.beginPath();
    g.moveTo(-size * 0.1, -size * 0.25);
    g.lineTo(size * 0.2, -size * 0.5);
    g.lineTo(size * 0.2, size * 0.5);
    g.lineTo(-size * 0.1, size * 0.25);
    g.closePath();
    g.fillPath();

    if (isOn) {
      // Sound waves
      g.lineStyle(2, 0x81ecec, 0.8);
      g.beginPath();
      g.arc(size * 0.3, 0, size * 0.3, -Math.PI / 4, Math.PI / 4);
      g.strokePath();

      g.lineStyle(2, 0x81ecec, 0.5);
      g.beginPath();
      g.arc(size * 0.3, 0, size * 0.5, -Math.PI / 4, Math.PI / 4);
      g.strokePath();
    } else {
      // X mark
      g.lineStyle(3, 0xff6b6b, 1);
      g.beginPath();
      g.moveTo(size * 0.3, -size * 0.3);
      g.lineTo(size * 0.7, size * 0.3);
      g.moveTo(size * 0.7, -size * 0.3);
      g.lineTo(size * 0.3, size * 0.3);
      g.strokePath();
    }

    return g;
  }

  createButton(x, y, text, callback) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 320, 88, 0x4ecdc4)
      .setInteractive()
      .on('pointerover', () => bg.setFillStyle(0x5dade2))
      .on('pointerout', () => bg.setFillStyle(0x4ecdc4))
      .on('pointerdown', () => {
        audio.playClick();
        callback();
      });

    const label = this.add.text(0, 0, text, {
      fontSize: '36px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, label]);
    return container;
  }

  showModel(modelIndex) {
    this.currentModel = modelIndex;
    this.continueBtn.setVisible(false);
    this.contentContainer.removeAll(true);

    switch (modelIndex) {
      case 0:
        this.showGroupsModel();
        break;
      case 1:
        this.showArrayModel();
        break;
      case 2:
        this.showNumberLineModel();
        break;
      case 3:
        this.showPracticeIntro();
        break;
    }
  }

  // MODEL 1: Groups of Objects
  showGroupsModel() {
    this.titleText.setText('Part 1: Groups');
    this.instructionText.setText('Multiplication means having GROUPS of things.\n\nTap each group to count the stars!');
    this.equationText.setText('');

    this.groupsCounted = 0;

    // Create 3 groups of 4 stars, spaced horizontally
    for (let g = 0; g < 3; g++) {
      const gx = -200 + g * 200;
      const groupContainer = this.add.container(gx, 0);
      this.contentContainer.add(groupContainer);

      // Group circle background
      const bg = this.add.circle(0, 0, 80, 0x2d2d44, 0.9)
        .setStrokeStyle(4, 0x4ecdc4)
        .setInteractive();
      groupContainer.add(bg);

      // 4 stars in 2x2 pattern
      const positions = [[-24, -24], [24, -24], [-24, 24], [24, 24]];
      for (const [sx, sy] of positions) {
        const star = this.add.star(sx, sy, 5, 12, 24, 0xf7dc6f);
        groupContainer.add(star);
      }

      // Label below
      const label = this.add.text(0, 110, `Group ${g + 1}`, {
        fontSize: '24px',
        fill: '#81ecec',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      groupContainer.add(label);

      // Count display above
      const countText = this.add.text(0, -110, '', {
        fontSize: '36px',
        fill: '#f7dc6f',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      groupContainer.add(countText);

      // Click handler
      bg.on('pointerdown', () => {
        if (groupContainer.counted) return;
        groupContainer.counted = true;
        this.groupsCounted++;

        // Play a happy sound
        audio.playMatch();

        countText.setText('4');

        this.tweens.add({
          targets: groupContainer,
          scale: 1.15,
          duration: 100,
          yoyo: true
        });

        // Update equation
        if (this.groupsCounted === 1) {
          this.equationText.setText('4 stars');
        } else if (this.groupsCounted === 2) {
          this.equationText.setText('4 + 4 = 8 stars');
        } else if (this.groupsCounted === 3) {
          this.equationText.setText('4 + 4 + 4 = 12 stars!');
          this.time.delayedCall(600, () => {
            this.instructionText.setText('3 groups of 4 = 12\n\nWe write: 3 x 4 = 12');
            this.equationText.setText('3 x 4 = 12');
            this.continueBtn.setVisible(true);
          });
        }
      });
    }

    // Tap hint
    const hint = this.add.text(0, 200, 'Tap each circle!', {
      fontSize: '28px',
      fill: '#ff6b9d',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    this.contentContainer.add(hint);
  }

  // MODEL 2: Array/Grid
  showArrayModel() {
    this.titleText.setText('Part 2: Grid');
    this.instructionText.setText('Multiplication can be a GRID!\n\nTap "Count Row" to see each row.');
    this.equationText.setText('');

    this.rowsCounted = 0;
    this.rocketGrid = [];

    // 3 rows x 4 columns of rockets
    const cellSize = 90;
    const startX = -134;
    const startY = -100;

    for (let r = 0; r < 3; r++) {
      this.rocketGrid[r] = [];
      for (let c = 0; c < 4; c++) {
        const rocket = this.add.text(
          startX + c * cellSize,
          startY + r * cellSize,
          '🚀',
          { fontSize: '48px' }
        ).setOrigin(0.5).setAlpha(0.3);
        this.contentContainer.add(rocket);
        this.rocketGrid[r][c] = rocket;
      }
    }

    // Count button
    const countBtn = this.createButton(0, 180, 'Count Row', () => {
      if (this.rowsCounted >= 3) return;

      const row = this.rocketGrid[this.rowsCounted];
      row.forEach((rocket, i) => {
        this.time.delayedCall(i * 80, () => {
          rocket.setAlpha(1);
          this.tweens.add({
            targets: rocket,
            scale: 1.2,
            duration: 80,
            yoyo: true
          });
        });
      });

      this.rowsCounted++;

      if (this.rowsCounted === 1) {
        this.equationText.setText('1 row of 4 = 4');
      } else if (this.rowsCounted === 2) {
        this.equationText.setText('2 rows of 4 = 8');
      } else if (this.rowsCounted === 3) {
        this.equationText.setText('3 rows of 4 = 12!');
        countBtn.setVisible(false);
        this.time.delayedCall(600, () => {
          this.instructionText.setText('3 rows x 4 columns = 12\n\nAnother way to see 3 x 4 = 12');
          this.equationText.setText('3 x 4 = 12');
          this.continueBtn.setVisible(true);
        });
      }
    });
    this.contentContainer.add(countBtn);
  }

  // MODEL 3: Number Line
  showNumberLineModel() {
    this.titleText.setText('Part 3: Skip Counting');
    this.instructionText.setText('Multiplication is SKIP COUNTING!\n\nTap "Jump!" to hop by 4s.');
    this.equationText.setText('');

    this.jumpCount = 0;

    // Number line
    const lineY = 40;
    const line = this.add.rectangle(0, lineY, 560, 6, 0x4ecdc4);
    this.contentContainer.add(line);

    // Tick marks and labels at 0, 4, 8, 12
    const positions = [
      { val: 0, x: -260 },
      { val: 4, x: -86 },
      { val: 8, x: 86 },
      { val: 12, x: 260 }
    ];

    for (const p of positions) {
      const tick = this.add.rectangle(p.x, lineY, 4, 32, 0x4ecdc4);
      this.contentContainer.add(tick);

      const label = this.add.text(p.x, lineY + 40, p.val.toString(), {
        fontSize: '28px',
        fill: '#ffffff',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      this.contentContainer.add(label);
    }

    // Rocket starting at 0
    this.jumpRocket = this.add.text(-260, lineY - 60, '🚀', {
      fontSize: '56px'
    }).setOrigin(0.5);
    this.contentContainer.add(this.jumpRocket);

    // Jump counter
    this.jumpCountText = this.add.text(0, -120, 'Jumps: 0', {
      fontSize: '32px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(this.jumpCountText);

    // Jump button
    const jumpBtn = this.createButton(0, 180, 'Jump +4!', () => {
      if (this.jumpCount >= 3) return;

      this.jumpCount++;
      const targetX = -260 + this.jumpCount * 174;

      this.tweens.add({
        targets: this.jumpRocket,
        x: targetX,
        y: { value: lineY - 120, duration: 150, ease: 'Quad.easeOut', yoyo: true },
        duration: 300,
        ease: 'Quad.easeInOut'
      });

      this.jumpCountText.setText(`Jumps: ${this.jumpCount}`);

      if (this.jumpCount === 1) {
        this.equationText.setText('4');
      } else if (this.jumpCount === 2) {
        this.equationText.setText('4, 8');
      } else if (this.jumpCount === 3) {
        this.equationText.setText('4, 8, 12!');
        jumpBtn.setVisible(false);
        this.time.delayedCall(600, () => {
          this.instructionText.setText('3 jumps of 4 = 12\n\nSkip count: 4... 8... 12!');
          this.equationText.setText('3 x 4 = 12');
          this.continueBtn.setVisible(true);
        });
      }
    });
    this.contentContainer.add(jumpBtn);
  }

  // Final screen
  showPracticeIntro() {
    this.titleText.setText('Ready to Play!');
    this.instructionText.setText('');
    this.equationText.setText('');

    // Summary text
    const summary = this.add.text(0, -120,
      'You learned 3 ways to multiply!\n\n' +
      '• Groups: 3 groups of 4\n' +
      '• Grid: 3 rows x 4 columns\n' +
      '• Jumps: Skip count by 4s\n\n' +
      'All equal 3 x 4 = 12!', {
      fontSize: '30px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      align: 'center',
      lineSpacing: 12
    }).setOrigin(0.5);
    this.contentContainer.add(summary);

    // How to play
    const howTo = this.add.text(0, 120,
      'Now practice! Find two numbers\n' +
      'next to each other that multiply\n' +
      'to the target number.', {
      fontSize: '28px',
      fill: '#81ecec',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5);
    this.contentContainer.add(howTo);

    // Start button
    const startBtn = this.createButton(0, 280, 'Start Game!', () => this.startGame());
    startBtn.list[0].setFillStyle(0xff6b9d); // Pink button
    this.contentContainer.add(startBtn);
  }

  nextStep() {
    this.currentModel++;
    this.showModel(this.currentModel);
  }

  startGame() {
    this.registry.set('tutorialComplete', true);
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.stop('TutorialScene');
      this.scene.start('WorldMapScene');
    });
  }
}
