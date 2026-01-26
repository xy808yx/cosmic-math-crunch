import Phaser from 'phaser';
import { audio } from '../AudioManager.js';
import { achievements } from '../AchievementManager.js';

export class SpeedChallengeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SpeedChallengeScene' });
  }

  init() {
    // Game state
    this.score = 0;
    this.problemsAnswered = 0;
    this.correctAnswers = 0;
    this.wrongAnswers = 0;
    this.currentStreak = 0;
    this.bestStreak = 0;

    // Timer mechanics (per spec 11.2)
    this.baseTimer = 10000; // 10 seconds in ms
    this.currentMaxTime = this.baseTimer;
    this.timeRemaining = this.currentMaxTime;
    this.minTimer = 2000; // 2 seconds minimum
    this.timerPenalty = false; // Flag for wrong answer penalty

    // Zone tracking
    this.currentZone = 1;
    this.problemsInZone = 0;
    this.problemsPerZone = 25;

    // Speed tracking for achievements
    this.fastAnswers = 0; // Answers under 3 seconds

    // Current problem
    this.currentProblem = null;
    this.problemStartTime = 0;

    // Game state
    this.isGameOver = false;
    this.isPaused = false;
  }

  create() {
    audio.init();

    // Background - cosmic speed theme
    this.add.rectangle(200, 350, 400, 700, 0x0a0a1a);

    // Animated star field for speed effect
    this.createStarField();

    // UI Elements
    this.createUI();

    // Create answer buttons first (before generating problem)
    this.createAnswerButtons();

    // Generate first problem
    this.generateProblem();

    // Start the timer
    this.lastUpdate = Date.now();
    this.timerEvent = this.time.addEvent({
      delay: 50, // Update every 50ms for smooth timer
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });
  }

  createStarField() {
    this.stars = [];
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, 400);
      const y = Phaser.Math.Between(0, 700);
      const size = Phaser.Math.Between(1, 3);
      const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.3, 0.8));
      this.stars.push({ sprite: star, speed: size * 2 });
    }

    // Animate stars moving down (speed effect)
    this.time.addEvent({
      delay: 30,
      callback: () => {
        if (this.isGameOver) return;
        for (const star of this.stars) {
          star.sprite.y += star.speed;
          if (star.sprite.y > 700) {
            star.sprite.y = 0;
            star.sprite.x = Phaser.Math.Between(0, 400);
          }
        }
      },
      loop: true
    });
  }

  createUI() {
    // Title
    this.add.text(200, 30, 'SPEED CHALLENGE', {
      fontSize: '20px',
      fill: '#ff6b9d',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Zone indicator
    this.zoneText = this.add.text(200, 55, 'Zone 1', {
      fontSize: '14px',
      fill: '#f7dc6f',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Timer bar background
    this.add.rectangle(200, 100, 360, 30, 0x2d2d44)
      .setStrokeStyle(2, 0xff6b9d);

    // Timer bar fill
    this.timerBar = this.add.rectangle(22, 100, 356, 24, 0x4ecdc4);
    this.timerBar.setOrigin(0, 0.5);

    // Timer text
    this.timerText = this.add.text(200, 100, '10.0s', {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Problem display panel
    this.add.rectangle(200, 200, 340, 120, 0x2d2d44, 0.9)
      .setStrokeStyle(3, 0xf7dc6f);

    // Problem text
    this.problemText = this.add.text(200, 180, '? × ? = ', {
      fontSize: '36px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Answer display
    this.answerText = this.add.text(200, 225, '?', {
      fontSize: '48px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Score display
    this.add.rectangle(70, 300, 100, 50, 0x2d2d44)
      .setStrokeStyle(2, 0x4ecdc4);
    this.add.text(70, 285, 'SCORE', {
      fontSize: '10px',
      fill: '#4ecdc4',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    this.scoreText = this.add.text(70, 310, '0', {
      fontSize: '24px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Streak display
    this.add.rectangle(200, 300, 100, 50, 0x2d2d44)
      .setStrokeStyle(2, 0xf7dc6f);
    this.add.text(200, 285, 'STREAK', {
      fontSize: '10px',
      fill: '#f7dc6f',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    this.streakText = this.add.text(200, 310, '0', {
      fontSize: '24px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Problems count
    this.add.rectangle(330, 300, 100, 50, 0x2d2d44)
      .setStrokeStyle(2, 0xa29bfe);
    this.add.text(330, 285, 'PROBLEMS', {
      fontSize: '10px',
      fill: '#a29bfe',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    this.problemsText = this.add.text(330, 310, '0', {
      fontSize: '24px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Feedback text
    this.feedbackText = this.add.text(200, 350, '', {
      fontSize: '18px',
      fill: '#58d68d',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.text(30, 680, '< Exit', {
      fontSize: '14px',
      fill: '#888888',
      fontFamily: 'Arial'
    }).setInteractive();

    backBtn.on('pointerover', () => backBtn.setFill('#ffffff'));
    backBtn.on('pointerout', () => backBtn.setFill('#888888'));
    backBtn.on('pointerdown', () => {
      audio.playClick();
      this.exitToMenu();
    });
  }

  createAnswerButtons() {
    // Generate 4 answer options
    this.answerButtons = [];
    const buttonY = 450;
    const buttonSpacing = 90;
    const startX = 65;

    for (let i = 0; i < 4; i++) {
      const x = startX + i * buttonSpacing;

      const btn = this.add.rectangle(x, buttonY, 75, 75, 0x2d2d44)
        .setStrokeStyle(2, 0x4ecdc4)
        .setInteractive();

      const text = this.add.text(x, buttonY, '', {
        fontSize: '28px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      btn.on('pointerover', () => btn.setStrokeStyle(3, 0xffffff));
      btn.on('pointerout', () => btn.setStrokeStyle(2, 0x4ecdc4));
      btn.on('pointerdown', () => this.selectAnswer(i));

      this.answerButtons.push({ btn, text, value: 0 });
    }

    // Also create a second row for larger numbers
    const buttonY2 = 540;
    for (let i = 0; i < 4; i++) {
      const x = startX + i * buttonSpacing;

      const btn = this.add.rectangle(x, buttonY2, 75, 75, 0x2d2d44)
        .setStrokeStyle(2, 0x4ecdc4)
        .setInteractive();

      const text = this.add.text(x, buttonY2, '', {
        fontSize: '28px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      btn.on('pointerover', () => btn.setStrokeStyle(3, 0xffffff));
      btn.on('pointerout', () => btn.setStrokeStyle(2, 0x4ecdc4));
      btn.on('pointerdown', () => this.selectAnswer(i + 4));

      this.answerButtons.push({ btn, text, value: 0 });
    }
  }

  generateProblem() {
    // Generate random multiplication problem
    // Difficulty increases with zone
    const maxFactor = Math.min(10 + Math.floor(this.currentZone / 2), 12);
    const minFactor = Math.max(2, Math.floor(this.currentZone / 3));

    const a = Phaser.Math.Between(minFactor, maxFactor);
    const b = Phaser.Math.Between(minFactor, maxFactor);
    const answer = a * b;

    this.currentProblem = { a, b, answer };
    this.problemStartTime = Date.now();

    // Update display
    this.problemText.setText(`${a} × ${b} =`);
    this.answerText.setText('?');

    // Generate answer options (1 correct + 7 wrong)
    const options = [answer];

    // Add plausible wrong answers
    while (options.length < 8) {
      let wrong;
      const type = Phaser.Math.Between(0, 4);

      switch (type) {
        case 0: // Off by one
          wrong = answer + Phaser.Math.Between(-2, 2);
          break;
        case 1: // Wrong factor
          wrong = a * (b + Phaser.Math.Between(-2, 2));
          break;
        case 2: // Other factor wrong
          wrong = (a + Phaser.Math.Between(-2, 2)) * b;
          break;
        case 3: // Addition instead of multiplication
          wrong = a + b;
          break;
        default: // Random nearby
          wrong = answer + Phaser.Math.Between(-10, 10);
      }

      if (wrong > 0 && wrong !== answer && !options.includes(wrong)) {
        options.push(wrong);
      }
    }

    // Shuffle and assign to buttons
    Phaser.Utils.Array.Shuffle(options);
    for (let i = 0; i < 8; i++) {
      this.answerButtons[i].value = options[i];
      this.answerButtons[i].text.setText(options[i].toString());
    }

    // Reset timer if penalty was active
    if (this.timerPenalty) {
      this.timerPenalty = false;
      // Reset to current max time (not penalty time)
    }

    this.timeRemaining = this.timerPenalty ? 5000 : this.currentMaxTime;
  }

  selectAnswer(index) {
    if (this.isGameOver) return;

    const selected = this.answerButtons[index].value;
    const correct = selected === this.currentProblem.answer;
    const answerTime = Date.now() - this.problemStartTime;

    // Flash the selected button
    const btn = this.answerButtons[index].btn;
    const originalColor = 0x2d2d44;

    if (correct) {
      // Correct answer!
      audio.playMatch();
      btn.setFillStyle(0x58d68d);

      this.correctAnswers++;
      this.currentStreak++;
      this.problemsAnswered++;
      this.problemsInZone++;

      if (this.currentStreak > this.bestStreak) {
        this.bestStreak = this.currentStreak;
      }

      // Track fast answers (under 3 seconds)
      if (answerTime < 3000) {
        this.fastAnswers++;
      }

      // Calculate score (speed bonus)
      let points = 100;
      if (answerTime < 1000) points += 100; // Super fast bonus
      else if (answerTime < 2000) points += 50;
      else if (answerTime < 3000) points += 25;

      // Streak bonus
      points += Math.min(this.currentStreak * 10, 100);

      // Zone multiplier
      points = Math.floor(points * (1 + (this.currentZone - 1) * 0.1));

      this.score += points;

      // Show feedback
      this.showFeedback(`+${points}`, '#58d68d');

      // Every 10 correct: decrease timer by 0.5s (per spec)
      if (this.correctAnswers % 10 === 0) {
        this.currentMaxTime = Math.max(this.minTimer, this.currentMaxTime - 500);
        this.showFeedback('FASTER!', '#ff6b9d');
      }

      // Check zone progression
      if (this.problemsInZone >= this.problemsPerZone) {
        this.advanceZone();
      }

      // Update UI and generate next problem
      this.updateUI();
      this.time.delayedCall(200, () => {
        btn.setFillStyle(originalColor);
        this.generateProblem();
      });

    } else {
      // Wrong answer
      audio.playWrong();
      btn.setFillStyle(0xff6b6b);
      this.cameras.main.shake(100, 0.01);

      this.wrongAnswers++;
      this.currentStreak = 0;
      this.problemsAnswered++;

      // Timer penalty: next problem gets only 5 seconds
      this.timerPenalty = true;
      this.timeRemaining = 5000;

      this.showFeedback(`${this.currentProblem.a} × ${this.currentProblem.b} = ${this.currentProblem.answer}`, '#ff6b6b');

      this.updateUI();
      this.time.delayedCall(500, () => {
        btn.setFillStyle(originalColor);
        this.generateProblem();
      });
    }

    // Track achievements
    if (correct) {
      achievements.recordCorrectAnswer();
      // Check speed challenge achievements on every correct answer
      achievements.recordSpeedChallenge(this.problemsAnswered, this.currentZone, this.currentStreak);
    } else {
      achievements.recordWrongAnswer();
    }
  }

  updateTimer() {
    if (this.isGameOver || this.isPaused) return;

    const now = Date.now();
    const delta = now - this.lastUpdate;
    this.lastUpdate = now;

    this.timeRemaining -= delta;

    // Update timer bar
    const percent = Math.max(0, this.timeRemaining / this.currentMaxTime);
    this.timerBar.width = 356 * percent;

    // Color changes based on time
    if (percent > 0.5) {
      this.timerBar.setFillStyle(0x4ecdc4); // Teal
    } else if (percent > 0.25) {
      this.timerBar.setFillStyle(0xf7dc6f); // Yellow
    } else {
      this.timerBar.setFillStyle(0xff6b6b); // Red
    }

    // Update timer text
    const seconds = Math.max(0, this.timeRemaining / 1000).toFixed(1);
    this.timerText.setText(`${seconds}s`);

    // Check for game over
    if (this.timeRemaining <= 0) {
      this.gameOver();
    }
  }

  advanceZone() {
    this.currentZone++;
    this.problemsInZone = 0;

    // Zone advancement animation
    this.zoneText.setText(`Zone ${this.currentZone}`);

    // Flash effect
    this.cameras.main.flash(300, 247, 220, 111);
    audio.playStar();

    // Zone message
    const zoneMsg = this.add.text(200, 350, `ZONE ${this.currentZone}!`, {
      fontSize: '48px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.tweens.add({
      targets: zoneMsg,
      scale: 1.5,
      alpha: 0,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => zoneMsg.destroy()
    });

    // Check zone achievements through the manager
    achievements.recordSpeedChallenge(this.problemsAnswered, this.currentZone, this.currentStreak);
  }

  showFeedback(text, color) {
    this.feedbackText.setText(text);
    this.feedbackText.setFill(color);

    this.tweens.add({
      targets: this.feedbackText,
      alpha: { from: 1, to: 0 },
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.feedbackText.setAlpha(1);
        this.feedbackText.setText('');
      }
    });
  }

  updateUI() {
    this.scoreText.setText(this.score.toString());
    this.streakText.setText(this.currentStreak.toString());
    this.problemsText.setText(this.problemsAnswered.toString());
  }

  gameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Stop timer
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }

    audio.playLevelFailed();

    // Save personal best
    this.savePersonalBest();

    // Final achievements check
    achievements.recordSpeedChallenge(this.problemsAnswered, this.currentZone, this.bestStreak);

    // Game over overlay
    const overlay = this.add.rectangle(200, 350, 400, 700, 0x000000, 0.8);

    const panel = this.add.rectangle(200, 320, 320, 350, 0x2d2d44)
      .setStrokeStyle(3, 0xff6b9d);

    this.add.text(200, 180, 'TIME UP!', {
      fontSize: '32px',
      fill: '#ff6b9d',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Stats
    const stats = [
      { label: 'Final Score', value: this.score, color: '#f7dc6f' },
      { label: 'Zone Reached', value: this.currentZone, color: '#a29bfe' },
      { label: 'Problems', value: this.problemsAnswered, color: '#4ecdc4' },
      { label: 'Accuracy', value: `${this.problemsAnswered > 0 ? Math.round((this.correctAnswers / this.problemsAnswered) * 100) : 0}%`, color: '#58d68d' },
      { label: 'Best Streak', value: this.bestStreak, color: '#f7dc6f' }
    ];

    let y = 230;
    for (const stat of stats) {
      this.add.text(80, y, stat.label, {
        fontSize: '14px',
        fill: '#888888',
        fontFamily: 'Arial'
      });
      this.add.text(320, y, stat.value.toString(), {
        fontSize: '18px',
        fill: stat.color,
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(1, 0);
      y += 30;
    }

    // Personal best indicator
    const pb = this.getPersonalBest();
    if (this.score >= pb.score) {
      this.add.text(200, 400, 'NEW PERSONAL BEST!', {
        fontSize: '16px',
        fill: '#f7dc6f',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    } else {
      this.add.text(200, 400, `Personal Best: ${pb.score}`, {
        fontSize: '14px',
        fill: '#888888',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
    }

    // Buttons
    const retryBtn = this.add.rectangle(130, 460, 120, 45, 0x4ecdc4)
      .setInteractive()
      .on('pointerover', () => retryBtn.setFillStyle(0x5dade2))
      .on('pointerout', () => retryBtn.setFillStyle(0x4ecdc4))
      .on('pointerdown', () => {
        audio.playClick();
        this.scene.restart();
      });

    this.add.text(130, 460, 'Try Again', {
      fontSize: '16px',
      fill: '#1a1a2e',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const exitBtn = this.add.rectangle(270, 460, 120, 45, 0xff6b9d)
      .setInteractive()
      .on('pointerover', () => exitBtn.setFillStyle(0xff8fab))
      .on('pointerout', () => exitBtn.setFillStyle(0xff6b9d))
      .on('pointerdown', () => {
        audio.playClick();
        this.exitToMenu();
      });

    this.add.text(270, 460, 'Exit', {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  savePersonalBest() {
    try {
      const current = this.getPersonalBest();
      if (this.score > current.score) {
        localStorage.setItem('cosmicMathSpeedBest', JSON.stringify({
          score: this.score,
          zone: this.currentZone,
          problems: this.problemsAnswered,
          accuracy: this.problemsAnswered > 0 ? Math.round((this.correctAnswers / this.problemsAnswered) * 100) : 0,
          date: Date.now()
        }));
      }
    } catch (e) {
      console.warn('Could not save personal best');
    }
  }

  getPersonalBest() {
    try {
      const saved = localStorage.getItem('cosmicMathSpeedBest');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // Ignore
    }
    return { score: 0, zone: 1, problems: 0, accuracy: 0 };
  }

  exitToMenu() {
    this.scene.start('WorldMapScene');
  }
}
