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

    // Get world info - prefer GameScene values over registry
    const worldId = gameScene?.worldId || this.registry.get('currentWorldId') || 1;
    const world = WORLDS[worldId - 1];
    const level = gameScene?.currentLevel || this.registry.get('currentLevel') || 1;

    // Back button
    const backBtn = this.add.text(15, 15, '< Back', {
      fontSize: '14px',
      fill: '#888888',
      fontFamily: 'Arial'
    }).setInteractive();

    backBtn.on('pointerover', () => backBtn.setFill('#ffffff'));
    backBtn.on('pointerout', () => backBtn.setFill('#888888'));
    backBtn.on('pointerdown', () => {
      audio.playClick();
      gameScene.goToWorldMap();
    });

    // World name and level
    this.add.text(200, 20, world.name, {
      fontSize: '18px',
      fill: '#' + world.accentColor.toString(16).padStart(6, '0'),
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Target product display
    this.createTargetDisplay();

    // Score display
    this.createScoreDisplay();

    // Moves display
    this.createMovesDisplay();

    // Level display
    this.levelText = this.add.text(200, 45, `Level ${level}`, {
      fontSize: '14px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Hint text
    this.hintText = this.add.text(200, 560, '', {
      fontSize: '14px',
      fill: '#81ecec',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5);

    // Music toggle (small, top right)
    this.createMusicToggle();

    // Power-up display
    this.createPowerUpDisplay();

    // Listen for game events
    gameScene.events.on('updateUI', this.updateUI, this);
    gameScene.events.on('targetChanged', this.updateTarget, this);
    gameScene.events.on('levelComplete', this.showLevelComplete, this);
    gameScene.events.on('levelFailed', this.showLevelFailed, this);
    gameScene.events.on('correctAnswer', this.showCorrectFeedback, this);
    gameScene.events.on('wrongAnswer', this.showWrongFeedback, this);
    gameScene.events.on('powerUpUpdate', this.updatePowerUp, this);

    // Request initial target from GameScene (in case event was missed)
    if (gameScene.targetProduct) {
      this.updateTarget(gameScene.targetProduct, gameScene.currentFactors);
    }
  }

  createTargetDisplay() {
    // Background panel
    this.add.rectangle(200, 115, 320, 60, 0x2d2d44, 0.8)
      .setStrokeStyle(2, 0x4ecdc4);

    this.add.text(200, 95, 'Find two numbers that multiply to:', {
      fontSize: '14px',
      fill: '#fff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.targetText = this.add.text(200, 125, '?', {
      fontSize: '36px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.factorsText = this.add.text(200, 155, '', {
      fontSize: '12px',
      fill: '#81ecec',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  createScoreDisplay() {
    const gameScene = this.scene.get('GameScene');
    const initialScore = gameScene?.score || 0;
    const initialTargetScore = gameScene?.targetScore || 500;

    // Score background
    this.add.rectangle(70, 600, 120, 50, 0x2d2d44, 0.8)
      .setStrokeStyle(2, 0xff6b9d);

    this.add.text(70, 585, 'SCORE', {
      fontSize: '12px',
      fill: '#ff6b9d',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.scoreText = this.add.text(70, 610, initialScore.toString(), {
      fontSize: '24px',
      fill: '#fff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Target score - use actual value from GameScene
    this.targetScoreText = this.add.text(70, 635, `/ ${initialTargetScore}`, {
      fontSize: '12px',
      fill: '#888',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  createMovesDisplay() {
    const gameScene = this.scene.get('GameScene');
    const initialMoves = gameScene?.movesLeft || 15;
    const movesColor = initialMoves <= 3 ? '#ff6b6b' : '#fff';

    // Moves background
    this.add.rectangle(330, 600, 120, 50, 0x2d2d44, 0.8)
      .setStrokeStyle(2, 0x4ecdc4);

    this.add.text(330, 585, 'MOVES', {
      fontSize: '12px',
      fill: '#4ecdc4',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.movesText = this.add.text(330, 610, initialMoves.toString(), {
      fontSize: '24px',
      fill: movesColor,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  updateUI(data) {
    // Guard against race condition where event fires before UI elements are created
    if (!this.scoreText || !this.targetScoreText || !this.movesText || !this.levelText) {
      return;
    }

    this.scoreText.setText(data.score.toString());
    this.targetScoreText.setText(`/ ${data.targetScore}`);
    this.movesText.setText(data.movesLeft.toString());
    this.levelText.setText(`Level ${data.level}`);

    // Color moves red when low
    if (data.movesLeft <= 3) {
      this.movesText.setFill('#ff6b6b');
    } else {
      this.movesText.setFill('#fff');
    }

    // Progress bar effect on score
    const progress = Math.min(data.score / data.targetScore, 1);
    // Could add visual progress bar here
  }

  updateTarget(product, factors) {
    // Guard against race condition where event fires before UI elements are created
    if (!this.targetText || !this.factorsText) {
      return;
    }

    // Animate target change
    this.tweens.add({
      targets: this.targetText,
      scale: 1.3,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut'
    });

    this.targetText.setText(product.toString());

    // Show helpful factors (early game scaffolding)
    const factorPairs = [];
    for (let i = 1; i <= Math.sqrt(product); i++) {
      if (product % i === 0) {
        factorPairs.push(`${i}×${product / i}`);
      }
    }
    this.factorsText.setText(`(${factorPairs.join(', ')})`);
  }

  showCorrectFeedback(product) {
    // Green flash
    this.cameras.main.flash(200, 100, 255, 150);

    // Update hint with encouragement
    const messages = [
      'Great job! 🌟',
      'You got it! ⭐',
      'Awesome! 🚀',
      'Perfect! ✨',
      'Nice work! 🎯'
    ];
    this.hintText.setText(Phaser.Utils.Array.GetRandom(messages));
    this.hintText.setFill('#58d68d');

    this.time.delayedCall(1500, () => {
      this.hintText.setText('');
    });

    // Check for new achievements
    this.checkAchievements();
  }

  checkAchievements() {
    const pending = achievements.getPendingNotifications();
    if (pending.length > 0) {
      // Show first achievement (queue others)
      this.showAchievementPopup(pending[0]);
    }
  }

  showAchievementPopup(achievement) {
    // Achievement popup at top of screen
    const popup = this.add.container(200, -80);

    // Background
    const bg = this.add.rectangle(0, 0, 300, 70, 0x2d2d44, 0.95)
      .setStrokeStyle(2, 0xf7dc6f);
    popup.add(bg);

    // Icon
    const icon = this.add.text(-120, 0, achievement.icon, {
      fontSize: '32px'
    }).setOrigin(0.5);
    popup.add(icon);

    // "Achievement Unlocked!" text
    const title = this.add.text(10, -15, 'Achievement Unlocked!', {
      fontSize: '12px',
      fill: '#f7dc6f',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    popup.add(title);

    // Achievement name
    const name = this.add.text(10, 8, achievement.name, {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    popup.add(name);

    // Slide in animation
    this.tweens.add({
      targets: popup,
      y: 50,
      duration: 500,
      ease: 'Back.easeOut'
    });

    // Play achievement sound
    audio.playStar();

    // Slide out after delay
    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: popup,
        y: -80,
        duration: 400,
        ease: 'Back.easeIn',
        onComplete: () => popup.destroy()
      });
    });
  }

  showWrongFeedback(product) {
    // Show hint about the target
    const factors = [];
    for (let i = 1; i <= Math.sqrt(product); i++) {
      if (product % i === 0) {
        factors.push(`${i}×${product / i}=${product}`);
      }
    }
    this.hintText.setText(`Hint: ${factors[0]}`);
    this.hintText.setFill('#f39c12');

    this.time.delayedCall(2000, () => {
      this.hintText.setText('');
    });
  }

  showLevelComplete(data) {
    // Play victory sound
    audio.playLevelComplete();

    // Confetti burst!
    this.createConfetti();

    // Check for achievements (delayed to not overlap with confetti)
    this.time.delayedCall(1000, () => this.checkAchievements());

    // Overlay
    const overlay = this.add.rectangle(200, 350, 400, 700, 0x000000, 0.7);

    // Calculate stars (3 for lots of moves left, 2 for some, 1 for barely)
    let stars = 1;
    if (data.movesLeft >= 10) stars = 3;
    else if (data.movesLeft >= 5) stars = 2;

    // Victory panel
    const panel = this.add.rectangle(200, 300, 280, 250, 0x2d2d44)
      .setStrokeStyle(3, 0xf7dc6f);

    this.add.text(200, 210, '🎉 Level Complete! 🎉', {
      fontSize: '22px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(200, 250, `Score: ${data.score}`, {
      fontSize: '18px',
      fill: '#fff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Stars
    for (let i = 0; i < 3; i++) {
      const starX = 150 + i * 50;
      const filled = i < stars;
      this.add.image(starX, 300, filled ? 'star' : 'star_empty')
        .setScale(1.5);
    }

    // Next level button
    const nextBtn = this.add.rectangle(200, 380, 150, 45, 0x4ecdc4)
      .setInteractive()
      .on('pointerover', () => nextBtn.setFillStyle(0x5dade2))
      .on('pointerout', () => nextBtn.setFillStyle(0x4ecdc4))
      .on('pointerdown', () => {
        audio.playClick();
        const gameScene = this.scene.get('GameScene');
        gameScene.nextLevel();
      });

    this.add.text(200, 380, 'Next Level →', {
      fontSize: '18px',
      fill: '#fff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  createConfetti() {
    // Create colorful confetti particles
    const colors = [0xf7dc6f, 0xff6b9d, 0x4ecdc4, 0xa29bfe, 0x58d68d, 0xff7675];

    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(50, 350);
      const color = Phaser.Utils.Array.GetRandom(colors);
      const size = Phaser.Math.Between(4, 8);

      const confetti = this.add.rectangle(x, -10, size, size * 1.5, color);
      confetti.setAngle(Phaser.Math.Between(0, 360));

      this.tweens.add({
        targets: confetti,
        y: 750,
        x: x + Phaser.Math.Between(-100, 100),
        angle: confetti.angle + Phaser.Math.Between(-360, 360),
        duration: Phaser.Math.Between(2000, 3500),
        delay: Phaser.Math.Between(0, 500),
        ease: 'Quad.easeIn',
        onComplete: () => confetti.destroy()
      });
    }
  }

  showLevelFailed(data) {
    // Play failure sound
    audio.playLevelFailed();

    // Overlay
    const overlay = this.add.rectangle(200, 350, 400, 700, 0x000000, 0.7);

    // Failed panel
    const panel = this.add.rectangle(200, 300, 280, 220, 0x2d2d44)
      .setStrokeStyle(3, 0xff6b9d);

    this.add.text(200, 220, 'Out of Moves!', {
      fontSize: '22px',
      fill: '#ff6b9d',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(200, 260, `Score: ${data.score} / ${data.targetScore}`, {
      fontSize: '16px',
      fill: '#fff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Progressive encouragement messages based on failure count
    const failures = data.failures || 1;
    let message = 'So close! Try again!';
    if (failures === 2) {
      message = 'You\'re getting better! Keep going!';
    } else if (failures === 3) {
      message = 'Watch for the hint next time!';
    } else if (failures >= 4) {
      message = 'We made it easier - you\'ve got this!';
    }

    this.add.text(200, 290, message, {
      fontSize: '14px',
      fill: '#81ecec',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Retry button
    const retryBtn = this.add.rectangle(200, 360, 150, 45, 0xff6b9d)
      .setInteractive()
      .on('pointerover', () => retryBtn.setFillStyle(0xff8fab))
      .on('pointerout', () => retryBtn.setFillStyle(0xff6b9d))
      .on('pointerdown', () => {
        audio.playClick();
        const gameScene = this.scene.get('GameScene');
        gameScene.restartLevel();
        this.scene.restart();
      });

    this.add.text(200, 360, 'Try Again', {
      fontSize: '18px',
      fill: '#fff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  createMusicToggle() {
    // Small music toggle in top right corner
    const musicColor = audio.musicEnabled ? '#4ecdc4' : '#555555';

    this.musicBtn = this.add.text(385, 15, '♪', {
      fontSize: '18px',
      fill: musicColor,
      fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive();

    // Strike-through line when muted
    this.musicStrike = this.add.rectangle(385, 15, 20, 2, 0xff6b6b);
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

  createPowerUpDisplay() {
    const equipped = powerUps.getEquippedPowerUp();
    if (!equipped) return;

    // Power-up container at bottom center
    this.powerUpContainer = this.add.container(200, 660);

    // Background
    const bg = this.add.rectangle(0, 0, 140, 35, 0x2d2d44, 0.9)
      .setStrokeStyle(2, 0xa29bfe);
    this.powerUpContainer.add(bg);

    // Power-up icon
    this.powerUpIcon = this.add.text(-55, 0, equipped.icon, {
      fontSize: '20px'
    }).setOrigin(0.5);
    this.powerUpContainer.add(this.powerUpIcon);

    // Charge bar background
    const chargeBarBg = this.add.rectangle(10, 0, 80, 16, 0x1a1a2e);
    this.powerUpContainer.add(chargeBarBg);

    // Charge bar fill
    this.chargeBarFill = this.add.rectangle(-29, 0, 0, 12, 0xa29bfe);
    this.chargeBarFill.setOrigin(0, 0.5);
    this.powerUpContainer.add(this.chargeBarFill);

    // Charge percentage text
    this.chargeText = this.add.text(10, 0, '0%', {
      fontSize: '10px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.powerUpContainer.add(this.chargeText);

    // "READY!" indicator (hidden initially)
    this.readyText = this.add.text(10, 0, 'READY!', {
      fontSize: '11px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);
    this.powerUpContainer.add(this.readyText);

    // Activate button (hidden initially)
    this.activateBtn = this.add.rectangle(55, 0, 24, 24, 0xf7dc6f, 0)
      .setInteractive()
      .setVisible(false);
    this.powerUpContainer.add(this.activateBtn);

    this.activateBtnIcon = this.add.text(55, 0, '!', {
      fontSize: '16px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);
    this.powerUpContainer.add(this.activateBtnIcon);

    // Button interactions
    this.activateBtn.on('pointerover', () => {
      this.activateBtnIcon.setScale(1.2);
    });
    this.activateBtn.on('pointerout', () => {
      this.activateBtnIcon.setScale(1);
    });
    this.activateBtn.on('pointerdown', () => {
      this.activatePowerUp();
    });

    // Streak indicator
    this.streakText = this.add.text(200, 640, '', {
      fontSize: '12px',
      fill: '#f7dc6f',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  updatePowerUp(data) {
    if (!this.chargeBarFill) return;

    const charge = data.charge;
    const isReady = data.isReady;
    const streak = data.streak;

    // Update charge bar (max width is 78px)
    const fillWidth = (charge / 100) * 78;
    this.chargeBarFill.width = fillWidth;

    // Update charge text
    this.chargeText.setText(`${charge}%`);
    this.chargeText.setVisible(!isReady);

    // Show/hide ready indicator
    this.readyText.setVisible(isReady);

    // Show/hide activate button
    this.activateBtn.setVisible(isReady);
    this.activateBtnIcon.setVisible(isReady);

    // Pulse animation when ready
    if (isReady && !this.powerUpPulsing) {
      this.powerUpPulsing = true;
      this.tweens.add({
        targets: [this.powerUpIcon, this.readyText],
        scale: 1.2,
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Change bar color when ready
      this.chargeBarFill.setFillStyle(0xf7dc6f);
    } else if (!isReady && this.powerUpPulsing) {
      this.powerUpPulsing = false;
      this.tweens.killTweensOf([this.powerUpIcon, this.readyText]);
      this.powerUpIcon.setScale(1);
      this.readyText.setScale(1);
      this.chargeBarFill.setFillStyle(0xa29bfe);
    }

    // Update streak indicator
    if (streak >= 3) {
      this.streakText.setText(`Streak: ${streak}`);
      this.streakText.setFill(streak >= 10 ? '#ff6b9d' : '#f7dc6f');
    } else {
      this.streakText.setText('');
    }
  }

  activatePowerUp() {
    const gameScene = this.scene.get('GameScene');
    if (!gameScene) return;

    // Check if power-up is ready
    if (!gameScene.powerUpCharge.isReady) return;

    // Use the power-up
    const success = gameScene.powerUpCharge.usePowerUp();
    if (!success) return;

    audio.playStar();

    // Get equipped power-up
    const equipped = powerUps.getEquippedPowerUp();

    // Apply power-up effect
    gameScene.applyPowerUpEffect(equipped);

    // Update UI
    this.updatePowerUp({
      charge: 0,
      isReady: false,
      streak: gameScene.powerUpCharge.streakCount
    });
  }
}
