import Phaser from 'phaser';
import { audio } from '../AudioManager.js';
import { WORLDS } from '../GameData.js';
import { achievements } from '../AchievementManager.js';
import { powerUps } from '../PowerUpManager.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    const gameScene = this.scene.get('GameScene');
    this.gameScene = gameScene;
    this.isTransitioning = false;

    const worldId = gameScene?.worldId || this.registry.get('currentWorldId') || 1;
    const world = WORLDS[worldId - 1];
    const level = gameScene?.currentLevel || this.registry.get('currentLevel') || 1;

    // === TOP BAR (y: 0-60) ===
    this.add.rectangle(200, 30, 400, 60, 0x0a0a1a, 0.9);

    // Back button - LARGE and visible
    const backBtn = this.add.text(20, 30, '< Back', {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setFill('#f7dc6f'));
    backBtn.on('pointerout', () => backBtn.setFill('#ffffff'));
    backBtn.on('pointerdown', () => {
      audio.playClick();
      gameScene.goToWorldMap();
    });

    // World name and level - centered
    this.add.text(200, 20, world.name, {
      fontSize: '20px',
      fill: '#' + world.accentColor.toString(16).padStart(6, '0'),
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.levelText = this.add.text(200, 44, `Level ${level}`, {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Music toggle - top right
    this.createMusicToggle();

    // === TARGET DISPLAY (y: 70-160) ===
    this.createTargetDisplay(world);

    // === BOTTOM BAR (y: 600-700) ===
    this.createBottomBar(gameScene);

    // Hint text (above bottom bar)
    this.hintText = this.add.text(200, 570, '', {
      fontSize: '18px',
      fill: '#81ecec',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Listen for game events
    gameScene.events.on('updateUI', this.updateUI, this);
    gameScene.events.on('targetChanged', this.updateTarget, this);
    gameScene.events.on('levelComplete', this.showLevelComplete, this);
    gameScene.events.on('levelFailed', this.showLevelFailed, this);
    gameScene.events.on('correctAnswer', this.showCorrectFeedback, this);
    gameScene.events.on('wrongAnswer', this.showWrongFeedback, this);
    gameScene.events.on('powerUpUpdate', this.updatePowerUp, this);

    this.events.on('shutdown', this.cleanup, this);

    if (gameScene.targetProduct) {
      this.updateTarget(gameScene.targetProduct, gameScene.currentFactors);
    }
  }

  cleanup() {
    if (this.gameScene && this.gameScene.events) {
      this.gameScene.events.off('updateUI', this.updateUI, this);
      this.gameScene.events.off('targetChanged', this.updateTarget, this);
      this.gameScene.events.off('levelComplete', this.showLevelComplete, this);
      this.gameScene.events.off('levelFailed', this.showLevelFailed, this);
      this.gameScene.events.off('correctAnswer', this.showCorrectFeedback, this);
      this.gameScene.events.off('wrongAnswer', this.showWrongFeedback, this);
      this.gameScene.events.off('powerUpUpdate', this.updatePowerUp, this);
    }
  }

  createTargetDisplay(world) {
    const accentColor = world?.accentColor || 0x4ecdc4;

    // Large target panel
    this.add.rectangle(200, 115, 380, 90, 0x1a1a2e, 0.95)
      .setStrokeStyle(3, accentColor);

    // Instruction text - LARGE and readable
    this.add.text(200, 82, 'Find two numbers that multiply to:', {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Main target number - BIG (stroke only, no glow)
    this.targetText = this.add.text(200, 125, '?', {
      fontSize: '52px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Factors hint - readable size
    this.factorsText = this.add.text(200, 155, '', {
      fontSize: '14px',
      fill: '#81ecec',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  createBottomBar(gameScene) {
    // Bottom panel background
    this.add.rectangle(200, 650, 400, 100, 0x0a0a1a, 0.95);

    const initialScore = gameScene?.score || 0;
    const initialTargetScore = gameScene?.targetScore || 500;
    const initialMoves = gameScene?.movesLeft || 40;

    // === SCORE (left side) ===
    this.add.rectangle(100, 640, 160, 70, 0x2d2d44)
      .setStrokeStyle(2, 0xff6b9d);

    this.add.text(100, 615, 'SCORE', {
      fontSize: '16px',
      fill: '#ff6b9d',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.scoreText = this.add.text(100, 645, initialScore.toString(), {
      fontSize: '28px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.targetScoreText = this.add.text(100, 672, `Goal: ${initialTargetScore}`, {
      fontSize: '14px',
      fill: '#aaaaaa',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Progress bar
    this.add.rectangle(100, 690, 140, 8, 0x1a1a2e);
    this.scoreProgressBar = this.add.rectangle(31, 690, 0, 6, 0xff6b9d).setOrigin(0, 0.5);

    // === MOVES (right side) ===
    this.add.rectangle(300, 640, 160, 70, 0x2d2d44)
      .setStrokeStyle(2, 0x4ecdc4);

    this.add.text(300, 615, 'MOVES LEFT', {
      fontSize: '16px',
      fill: '#4ecdc4',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.movesText = this.add.text(300, 650, initialMoves.toString(), {
      fontSize: '36px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  createMusicToggle() {
    const musicIcon = audio.musicEnabled ? '🔊' : '🔇';
    this.musicBtn = this.add.text(380, 30, musicIcon, {
      fontSize: '24px'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.musicBtn.on('pointerdown', () => {
      audio.playClick();
      const enabled = audio.toggleMusic();
      this.musicBtn.setText(enabled ? '🔊' : '🔇');
    });
  }

  updateUI(data) {
    if (!this.scoreText || !this.targetScoreText || !this.movesText || !this.levelText) return;

    this.scoreText.setText(data.score.toString());
    this.targetScoreText.setText(`Goal: ${data.targetScore}`);
    this.movesText.setText(data.movesLeft.toString());
    this.levelText.setText(`Level ${data.level}`);

    // Color moves red when low
    if (data.movesLeft <= 5) {
      this.movesText.setFill('#ff6b6b');
      if (!this.movesWarningPulsing) {
        this.movesWarningPulsing = true;
        this.tweens.add({
          targets: this.movesText,
          scale: { from: 1, to: 1.15 },
          duration: 400,
          yoyo: true,
          repeat: -1
        });
      }
    } else {
      this.movesText.setFill('#ffffff');
      if (this.movesWarningPulsing) {
        this.movesWarningPulsing = false;
        this.tweens.killTweensOf(this.movesText);
        this.movesText.setScale(1);
      }
    }

    // Update progress bar
    const progress = Math.min(data.score / data.targetScore, 1);
    if (this.scoreProgressBar) {
      this.tweens.add({
        targets: this.scoreProgressBar,
        width: progress * 138,
        duration: 300
      });

      if (progress >= 0.9) this.scoreProgressBar.setFillStyle(0x58d68d);
      else if (progress >= 0.7) this.scoreProgressBar.setFillStyle(0xf7dc6f);
      else this.scoreProgressBar.setFillStyle(0xff6b9d);
    }
  }

  updateTarget(product, factors) {
    if (!this.targetText || !this.factorsText) return;

    this.tweens.add({
      targets: this.targetText,
      scale: { from: 0.8, to: 1 },
      duration: 200,
      ease: 'Back.easeOut'
    });

    this.targetText.setText(product.toString());

    // Show factors as hint
    const factorPairs = [];
    for (let i = 1; i <= Math.sqrt(product); i++) {
      if (product % i === 0) factorPairs.push(`${i} x ${product / i}`);
    }
    this.factorsText.setText(factorPairs.join('  or  '));
  }

  showCorrectFeedback(product) {
    const messages = ['Great job!', 'Awesome!', 'Perfect!', 'Nice work!', 'You got it!'];
    this.hintText.setText(Phaser.Utils.Array.GetRandom(messages));
    this.hintText.setFill('#58d68d');
    this.time.delayedCall(1500, () => this.hintText.setText(''));
    this.checkAchievements();
  }

  showWrongFeedback(product) {
    const factors = [];
    for (let i = 1; i <= Math.sqrt(product); i++) {
      if (product % i === 0) factors.push(`${i} x ${product / i} = ${product}`);
    }
    this.hintText.setText(`Hint: ${factors[0]}`);
    this.hintText.setFill('#f39c12');
    this.time.delayedCall(2500, () => this.hintText.setText(''));
  }

  checkAchievements() {
    const pending = achievements.getPendingNotifications();
    if (pending.length > 0) this.showAchievementPopup(pending[0]);
  }

  showAchievementPopup(achievement) {
    const popup = this.add.container(200, -80);
    popup.add(this.add.rectangle(0, 0, 320, 70, 0x2d2d44, 0.95).setStrokeStyle(2, 0xf7dc6f));
    popup.add(this.add.text(-130, 0, achievement.icon, { fontSize: '36px' }).setOrigin(0.5));
    popup.add(this.add.text(10, -12, 'Achievement Unlocked!', {
      fontSize: '14px', fill: '#f7dc6f', fontFamily: 'Arial'
    }).setOrigin(0.5));
    popup.add(this.add.text(10, 12, achievement.name, {
      fontSize: '18px', fill: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5));

    this.tweens.add({ targets: popup, y: 50, duration: 500, ease: 'Back.easeOut' });
    audio.playStar();

    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: popup, y: -80, duration: 400, ease: 'Back.easeIn',
        onComplete: () => popup.destroy()
      });
    });
  }

  showLevelComplete(data) {
    audio.playLevelComplete();
    this.createConfetti();
    this.time.delayedCall(1000, () => this.checkAchievements());

    const overlay = this.add.rectangle(200, 350, 400, 700, 0x000000, 0)
      .setInteractive().setDepth(50);
    this.tweens.add({ targets: overlay, alpha: 0.8, duration: 300 });

    const startingMoves = this.registry.get('levelDifficulty')?.moves || 40;
    const movesUsedPercent = (startingMoves - data.movesLeft) / startingMoves;
    let stars = 1;
    if (movesUsedPercent <= 0.5) stars = 3;
    else if (movesUsedPercent <= 0.75) stars = 2;

    const panel = this.add.container(200, 800);
    panel.add(this.add.rectangle(0, 0, 320, 300, 0x1a1a2e).setStrokeStyle(4, 0xf7dc6f));

    panel.add(this.add.text(0, -110, 'Level Complete!', {
      fontSize: '28px', fill: '#f7dc6f', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5));

    panel.add(this.add.text(0, -60, 'Score', {
      fontSize: '18px', fill: '#aaaaaa', fontFamily: 'Arial'
    }).setOrigin(0.5));

    const scoreValue = this.add.text(0, -30, '0', {
      fontSize: '36px', fill: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);
    panel.add(scoreValue);

    const starSprites = [];
    for (let i = 0; i < 3; i++) {
      const star = this.add.image(-50 + i * 50, 30, i < stars ? 'star' : 'star_empty').setScale(0);
      panel.add(star);
      starSprites.push({ star, filled: i < stars, index: i });
    }

    panel.setDepth(60);

    this.tweens.add({
      targets: panel, y: 320, duration: 500, ease: 'Back.easeOut',
      onComplete: () => {
        const nextBtn = this.add.rectangle(200, 430, 200, 60, 0x4ecdc4)
          .setInteractive({ useHandCursor: true }).setDepth(100);
        const nextText = this.add.text(200, 430, 'Continue', {
          fontSize: '22px', fill: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(101);

        nextBtn.on('pointerover', () => nextBtn.setFillStyle(0x5dade2));
        nextBtn.on('pointerout', () => nextBtn.setFillStyle(0x4ecdc4));
        nextBtn.on('pointerdown', () => {
          if (this.isTransitioning) return;
          this.isTransitioning = true;
          audio.playClick();
          this.gameScene?.nextLevel();
        });

        this.tweens.addCounter({
          from: 0, to: data.score, duration: 800,
          onUpdate: (t) => scoreValue.setText(Math.floor(t.getValue()).toString())
        });

        starSprites.forEach(({ star, filled, index }) => {
          this.time.delayedCall(600 + index * 200, () => {
            if (filled) audio.playStar();
            this.tweens.add({
              targets: star, scale: 1.5, duration: 200, ease: 'Back.easeOut',
              onComplete: () => this.tweens.add({ targets: star, scale: 1.2, duration: 100 })
            });
          });
        });
      }
    });
  }

  createConfetti() {
    const colors = [0xf7dc6f, 0xff6b9d, 0x4ecdc4, 0xa29bfe, 0x58d68d];
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(50, 350);
      const confetti = this.add.rectangle(x, -10, Phaser.Math.Between(6, 10), Phaser.Math.Between(8, 14), Phaser.Utils.Array.GetRandom(colors));
      confetti.setAngle(Phaser.Math.Between(0, 360));
      this.tweens.add({
        targets: confetti, y: 750, x: x + Phaser.Math.Between(-100, 100),
        angle: confetti.angle + Phaser.Math.Between(-360, 360),
        duration: Phaser.Math.Between(2000, 3500), delay: Phaser.Math.Between(0, 500),
        onComplete: () => confetti.destroy()
      });
    }
  }

  showLevelFailed(data) {
    audio.playLevelFailed();

    const overlay = this.add.rectangle(200, 350, 400, 700, 0x000000, 0)
      .setInteractive().setDepth(50);
    this.tweens.add({ targets: overlay, alpha: 0.8, duration: 300 });

    const panel = this.add.container(200, 800);
    panel.add(this.add.rectangle(0, 0, 320, 260, 0x1a1a2e).setStrokeStyle(4, 0xff6b6b));

    panel.add(this.add.text(0, -90, 'Out of Moves!', {
      fontSize: '26px', fill: '#ff6b6b', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5));

    panel.add(this.add.text(0, -40, `Score: ${data.score} / ${data.targetScore}`, {
      fontSize: '20px', fill: '#ffffff', fontFamily: 'Arial'
    }).setOrigin(0.5));

    const failures = data.failures || 1;
    let message = 'So close! Try again!';
    if (failures >= 4) message = 'Made it easier - you got this!';
    else if (failures >= 3) message = 'Watch for the hints!';
    else if (failures >= 2) message = 'You\'re getting better!';

    panel.add(this.add.text(0, 0, message, {
      fontSize: '18px', fill: '#81ecec', fontFamily: 'Arial'
    }).setOrigin(0.5));

    panel.setDepth(60);

    this.tweens.add({
      targets: panel, y: 320, duration: 500, ease: 'Back.easeOut',
      onComplete: () => {
        const retryBtn = this.add.rectangle(200, 400, 200, 60, 0xff6b6b)
          .setInteractive({ useHandCursor: true }).setDepth(100);
        const retryText = this.add.text(200, 400, 'Try Again', {
          fontSize: '22px', fill: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(101);

        retryBtn.on('pointerover', () => retryBtn.setFillStyle(0xff8fab));
        retryBtn.on('pointerout', () => retryBtn.setFillStyle(0xff6b6b));
        retryBtn.on('pointerdown', () => {
          if (this.isTransitioning) return;
          this.isTransitioning = true;
          audio.playClick();
          this.gameScene?.restartLevel();
          this.scene.restart();
        });
      }
    });
  }

  updatePowerUp(data) {
    // Power-up display simplified for now
  }
}
