import Phaser from 'phaser';
import { audio } from '../AudioManager.js';
import { WORLDS, MODES, getProblemForWorld, progress } from '../GameData.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { createButton, createIconButton } from '../buttonHelper.js';
import { style } from '../textStyles.js';
import { companion, drawCompanion } from '../CompanionManager.js';
import { streak } from '../StreakManager.js';
import { economy } from '../EconomyManager.js';
import { grantStreakRewards } from '../MilestoneRewards.js';
import { rollLevelEndDrop } from '../RandomDrops.js';
import { PetHUD } from '../PetHUD.js';
import { records } from '../RecordsManager.js';

const W = 800;
const H = 1400;

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    this.worldId = this.registry.get('currentWorldId') || 1;
    this.currentLevel = this.registry.get('currentLevel') || 1;
    this.mode = this.registry.get('levelMode') || 'mult';
    this.world = WORLDS[this.worldId - 1];
    this.modeConfig = MODES[this.mode];

    this.duration = this.modeConfig.duration;
    this.scoreThreshold = this.modeConfig.scoreThreshold;
    this.timeLeft = this.duration * 1000;

    this.score = 0;
    this.attempts = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.history = [];
    this.problemStartedAtMs = 0;

    this.input_ = '';
    this.problem = null;
    this.state = 'ready'; // ready | playing | feedback | ended
    this.autoSubmitTimer = null;
  }

  create() {
    audio.init();

    // === Background ===
    createStarfield(this, {
      accentColor: this.world.accentColor,
      accentStrength: 0.18
    });

    // === Top bar ===
    this.createTopBar();

    // === Pet HUD (shows the kid feeding their pet live) ===
    if (companion.hasStarter()) {
      this.petHud = new PetHUD(this, 80, 170);
    }

    // === Time bar ===
    this.timeBarBg = this.add.graphics().setDepth(5);
    this.timeBarBg.fillStyle(0x1a1a2e, 0.8);
    this.timeBarBg.fillRect(0, 100, W, 8);
    this.timeBar = this.add.graphics().setDepth(6);
    this.drawTimeBar(1);

    // === Problem card ===
    this.createProblemCard();

    // === Stats row ===
    this.createStatsRow();

    // === Number pad ===
    this.createNumberPad();

    // Keyboard input (desktop). Bind once and remove on shutdown so
    // scene.restart() (the Retry button) doesn't stack duplicate listeners.
    this._onKeyDown = this.onKeyDown.bind(this);
    this.input.keyboard?.on('keydown', this._onKeyDown);
    this.events.once('shutdown', () => {
      this.input.keyboard?.off('keydown', this._onKeyDown);
    });

    new TransitionManager(this).fadeIn(300);

    // First problem appears, give the player a beat before the timer starts
    this.nextProblem();
    this.time.delayedCall(450, () => {
      this.state = 'playing';
    });
  }

  // ============================================================
  // TOP BAR
  // ============================================================
  createTopBar() {
    const bg = this.add.graphics().setDepth(4);
    bg.fillStyle(0x07071a, 0.85);
    bg.fillRect(0, 0, W, 100);

    createIconButton(this, {
      x: 60, y: 50, radius: 28,
      accentColor: this.world.accentColor,
      drawIcon: (g, size) => {
        g.lineStyle(5, 0xffffff, 1);
        g.lineBetween(size * 0.4, 0, -size * 0.3, 0);
        g.lineBetween(-size * 0.3, 0, 0, -size * 0.4);
        g.lineBetween(-size * 0.3, 0, 0, size * 0.4);
      },
      onClick: () => this.exitToLevelSelect()
    }).setDepth(15);

    this.add.text(400, 38, this.world.name, style('subhead', {
      fontSize: '28px',
      fill: '#' + this.world.accentColor.toString(16).padStart(6, '0')
    })).setOrigin(0.5).setDepth(15);

    this.add.text(400, 70, this.modeConfig.label.toUpperCase(), style('caption', {
      fontSize: '18px',
      fill: '#cfcfe0'
    })).setOrigin(0.5).setDepth(15);

    createIconButton(this, {
      x: 740, y: 50, radius: 28,
      accentColor: this.world.accentColor,
      drawIcon: (g, size) => this.drawSoundIcon(g, size, audio.enabled),
      onClick: () => audio.toggleEnabled()
    }).setDepth(15);
  }

  drawSoundIcon(g, size, isOn) {
    g.fillStyle(0xffffff, 1);
    g.fillRect(-size * 0.5, -size * 0.25, size * 0.3, size * 0.5);
    g.beginPath();
    g.moveTo(-size * 0.2, -size * 0.25);
    g.lineTo(size * 0.1, -size * 0.5);
    g.lineTo(size * 0.1, size * 0.5);
    g.lineTo(-size * 0.2, size * 0.25);
    g.closePath();
    g.fillPath();
    if (isOn) {
      g.lineStyle(3, 0xffffff, 0.9);
      g.beginPath();
      g.arc(size * 0.25, 0, size * 0.35, -Math.PI / 4, Math.PI / 4);
      g.strokePath();
    } else {
      g.lineStyle(3, 0xff6b6b, 1);
      g.lineBetween(size * 0.25, -size * 0.3, size * 0.6, size * 0.3);
      g.lineBetween(size * 0.6, -size * 0.3, size * 0.25, size * 0.3);
    }
  }

  drawTimeBar(pct) {
    this.timeBar.clear();
    const fillW = Math.max(0, Math.floor(W * pct));
    const color = pct > 0.4 ? this.world.accentColor : pct > 0.2 ? 0xf7dc6f : 0xff6b6b;
    this.timeBar.fillStyle(color, 1);
    this.timeBar.fillRect(0, 100, fillW, 8);
  }

  // ============================================================
  // PROBLEM CARD
  // ============================================================
  createProblemCard() {
    const cx = 400;
    const cy = 290;
    const cw = 660;
    const ch = 320;

    this.problemCardContainer = this.add.container(cx, cy).setDepth(10);

    const glow = this.add.graphics();
    glow.fillStyle(this.world.accentColor, 0.18);
    glow.fillRoundedRect(-cw / 2 - 12, -ch / 2 - 12, cw + 24, ch + 24, 28);
    this.problemCardContainer.add(glow);
    this.cardGlow = glow;

    this.tweens.add({
      targets: glow,
      alpha: 0.3,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const card = this.add.graphics();
    card.fillStyle(0x12122a, 0.95);
    card.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 22);
    card.lineStyle(3, this.world.accentColor, 0.8);
    card.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 22);
    this.problemCardContainer.add(card);
    this.problemCard = card;
    this.problemCardWidth = cw;
    this.problemCardHeight = ch;

    // Mode-specific nudge so kids don't read "2 × 10" and submit 20 when the
    // problem is actually "2 × 10 − 6" or "2 × ? = 20".
    this.modeHint = this.add.text(0, -125, '', style('caption', {
      fontSize: '20px',
      fill: '#f7dc6f',
      fontStyle: '900'
    })).setOrigin(0.5);
    this.problemCardContainer.add(this.modeHint);

    this.problemText = this.add.text(0, -70, '', style('problem')).setOrigin(0.5);
    this.problemCardContainer.add(this.problemText);

    // Thin divider line between question and answer
    const divider = this.add.graphics();
    divider.lineStyle(2, 0x4a4a60, 0.6);
    divider.lineBetween(-cw / 2 + 70, 0, cw / 2 - 70, 0);
    this.problemCardContainer.add(divider);

    this.answerText = this.add.text(0, 75, '', style('answer')).setOrigin(0.5);
    this.problemCardContainer.add(this.answerText);

    // Blinking cursor — placed dynamically next to whatever the user has typed
    this.cursor = this.add.rectangle(0, 75, 6, 80, 0xf7dc6f, 1);
    this.problemCardContainer.add(this.cursor);
    this.tweens.add({
      targets: this.cursor,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }

  flashCard(color, intensity = 1) {
    const cw = this.problemCardWidth;
    const ch = this.problemCardHeight;
    const flash = this.add.graphics().setDepth(11);
    flash.fillStyle(color, 0.35 * intensity);
    flash.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 22);
    flash.x = this.problemCardContainer.x;
    flash.y = this.problemCardContainer.y;
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 350,
      onComplete: () => flash.destroy()
    });
  }

  shakeCard() {
    const ox = this.problemCardContainer.x;
    this.tweens.add({
      targets: this.problemCardContainer,
      x: { from: ox - 14, to: ox + 14 },
      duration: 60,
      repeat: 4,
      yoyo: true,
      onComplete: () => { this.problemCardContainer.x = ox; }
    });
  }

  // ============================================================
  // STATS ROW
  // ============================================================
  createStatsRow() {
    const y = 510;
    this.streakText = this.add.text(160, y, '0', style('stat', {
      fill: '#ff8b3d'
    })).setOrigin(0.5).setDepth(10);
    this.add.text(160, y + 32, 'STREAK', style('statLabel')).setOrigin(0.5).setDepth(10);

    this.scoreText = this.add.text(400, y, '0', style('stat', {
      fill: '#ffffff'
    })).setOrigin(0.5).setDepth(10);
    this.add.text(400, y + 32, 'SCORE', style('statLabel')).setOrigin(0.5).setDepth(10);

    this.timeText = this.add.text(640, y, this.formatTime(this.timeLeft), style('stat', {
      fill: '#' + this.world.accentColor.toString(16).padStart(6, '0')
    })).setOrigin(0.5).setDepth(10);
    this.add.text(640, y + 32, 'TIME', style('statLabel')).setOrigin(0.5).setDepth(10);
  }

  formatTime(ms) {
    const totalS = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalS / 60);
    const s = totalS % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ============================================================
  // NUMBER PAD
  // ============================================================
  createNumberPad() {
    const cellW = 200;
    const cellH = 140;
    const gap = 16;
    const startY = 600;
    const cols = [184, 400, 616];

    const layout = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['back', '0', 'enter']
    ];

    this.padButtons = [];

    for (let r = 0; r < 4; r++) {
      const y = startY + cellH / 2 + r * (cellH + gap);
      for (let c = 0; c < 3; c++) {
        const key = layout[r][c];
        const x = cols[c];
        const btn = this.makePadButton(x, y, cellW, cellH, key);
        this.padButtons.push(btn);
      }
    }
  }

  makePadButton(x, y, w, h, key) {
    const isAction = key === 'back' || key === 'enter';
    const baseColor = key === 'enter'
      ? this.world.accentColor
      : key === 'back' ? 0x6a3a3a : 0x2a2a44;
    const radius = 18;

    const container = this.add.container(x, y).setDepth(10);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.5);
    shadow.fillRoundedRect(-w / 2 + 2, -h / 2 + 6, w, h, radius);
    container.add(shadow);

    const bg = this.add.graphics();
    this.drawPadFace(bg, w, h, radius, baseColor);
    container.add(bg);

    let face;
    if (key === 'back') {
      face = this.add.graphics();
      face.lineStyle(6, 0xffffff, 1);
      face.lineBetween(-22, 0, 22, 0);
      face.lineBetween(-22, 0, -8, -16);
      face.lineBetween(-22, 0, -8, 16);
      container.add(face);
    } else if (key === 'enter') {
      face = this.add.graphics();
      face.lineStyle(8, 0xffffff, 1);
      face.lineBetween(-26, 4, -6, 26);
      face.lineBetween(-6, 26, 30, -22);
      container.add(face);
    } else {
      face = this.add.text(0, -2, key, style('pad')).setOrigin(0.5);
      container.add(face);
    }

    const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0).setInteractive({ useHandCursor: true });
    container.add(hit);

    hit.on('pointerdown', () => {
      this.tweens.add({ targets: container, scaleX: 0.92, scaleY: 0.92, duration: 60, yoyo: true });
      this.handleKey(key);
    });

    container.key = key;
    container.bg = bg;
    container.baseColor = baseColor;
    container.dimensions = { w, h, radius };
    return container;
  }

  drawPadFace(g, w, h, radius, color) {
    const lighter = Phaser.Display.Color.ValueToColor(color).lighten(18).color;
    const darker = Phaser.Display.Color.ValueToColor(color).darken(20).color;

    g.fillStyle(darker, 1);
    g.fillRoundedRect(-w / 2, -h / 2 + 4, w, h - 4, radius);

    g.fillStyle(color, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h - 6, radius);

    g.fillStyle(lighter, 0.45);
    g.fillRoundedRect(
      -w / 2 + 4,
      -h / 2 + 3,
      w - 8,
      (h - 6) / 2.4,
      { tl: radius - 2, tr: radius - 2, bl: 4, br: 4 }
    );

    g.lineStyle(2, 0x000000, 0.25);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h - 6, radius);
  }

  // ============================================================
  // INPUT
  // ============================================================
  onKeyDown(event) {
    if (this.state !== 'playing') return;
    if (event.key >= '0' && event.key <= '9') {
      this.handleKey(event.key);
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      this.handleKey('back');
    } else if (event.key === 'Enter' || event.key === ' ') {
      this.handleKey('enter');
    }
  }

  handleKey(key) {
    if (this.state !== 'playing') return;

    if (key === 'back') {
      if (this.input_.length > 0) {
        this.input_ = this.input_.slice(0, -1);
        this.cancelAutoSubmit();
        this.renderInput();
      }
      return;
    }

    if (key === 'enter') {
      if (this.input_.length > 0) {
        this.cancelAutoSubmit();
        this.submitAnswer();
      }
      return;
    }

    // Digit
    if (this.input_.length >= 3) return; // max 3 digits (e.g. 144)
    this.input_ += key;
    this.renderInput();

    audio.playSelect();

    // Auto-submit on a short delay if length matches expected
    const expectedLen = this.problem.answer.toString().length;
    if (this.input_.length >= expectedLen) {
      this.cancelAutoSubmit();
      this.autoSubmitTimer = this.time.delayedCall(220, () => {
        if (this.state === 'playing' && this.input_.length >= expectedLen) {
          this.submitAnswer();
        }
      });
    }
  }

  cancelAutoSubmit() {
    if (this.autoSubmitTimer) {
      this.autoSubmitTimer.remove();
      this.autoSubmitTimer = null;
    }
  }

  renderInput() {
    this.answerText.setText(this.input_ || '');
    // Cursor sits to the right of whatever's typed (centered around x=0)
    const halfW = this.answerText.width / 2;
    this.cursor.x = halfW + 14;
    this.cursor.setVisible(this.input_.length < 3);
  }

  elapsedThisProblemMs() {
    if (!this.problemStartedAtMs) return 0;
    return performance.now() - this.problemStartedAtMs;
  }

  // ============================================================
  // PROBLEM FLOW
  // ============================================================
  nextProblem() {
    this.problem = getProblemForWorld(this.worldId, this.mode);
    this.problemStartedAtMs = performance.now();
    this.input_ = '';
    this.cancelAutoSubmit();
    this.problemText.setText(this.problem.display);
    if (this.modeHint) this.modeHint.setText('');
    this.answerText.setText('');
    this.renderInput();

    // Pop the new problem in
    this.problemText.setScale(0.7);
    this.tweens.add({
      targets: this.problemText,
      scale: 1,
      duration: 220,
      ease: 'Back.easeOut'
    });
  }

  submitAnswer() {
    if (!this.problem) return;
    this.cancelAutoSubmit();

    const userAnswer = parseInt(this.input_, 10);
    const correct = userAnswer === this.problem.answer;
    this.attempts++;
    this.history.push({
      problem: this.problem,
      userAnswer,
      correct
    });

    progress.recordFactAttempt(this.problem.a, this.problem.b, correct);

    // Block input + pause the timer while feedback plays so the player
    // can't double-submit the same problem.
    this.state = 'feedback';

    if (correct) {
      this.score++;
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      this.scoreText.setText(this.score.toString());
      this.streakText.setText(this.streak.toString());
      this.flashCard(0x58d68d, 1);
      audio.playMatch();
      records.recordAnswer(this.problem, true, this.elapsedThisProblemMs());

      // Feed the pet — one pellet per correct answer.
      this.petHud?.munch(1);

      // Earn one stardust per correct answer.
      economy.addStardust(1);

      // Pulse score for emphasis
      this.tweens.add({
        targets: this.scoreText,
        scale: { from: 1.4, to: 1 },
        duration: 220,
        ease: 'Back.easeOut'
      });

      this.time.delayedCall(280, () => {
        if (this.state === 'feedback') {
          this.state = 'playing';
          this.nextProblem();
        }
      });
    } else {
      this.streak = 0;
      this.streakText.setText('0');
      this.flashCard(0xff6b6b, 1);
      this.shakeCard();
      audio.playWrong();
      records.recordAnswer(this.problem, false, this.elapsedThisProblemMs());
      this.petHud?.droop();

      // Show correct answer briefly, then next problem
      this.answerText.setText(this.problem.answer.toString());
      this.answerText.setColor('#ff6b6b');
      this.cursor.setVisible(false);

      this.time.delayedCall(900, () => {
        this.answerText.setColor('#f7dc6f');
        if (this.state === 'feedback') {
          this.state = 'playing';
          this.nextProblem();
        }
      });
    }
  }

  // ============================================================
  // UPDATE LOOP
  // ============================================================
  update(_time, delta) {
    if (this.state !== 'playing') return;

    this.timeLeft -= delta;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.endRound();
      return;
    }

    const pct = this.timeLeft / (this.duration * 1000);
    this.drawTimeBar(pct);
    this.timeText.setText(this.formatTime(this.timeLeft));

    // Tick sound under 5 seconds (once per second)
    if (this.timeLeft <= 5000) {
      const sec = Math.ceil(this.timeLeft / 1000);
      if (sec !== this.lastTickSec) {
        this.lastTickSec = sec;
        audio.playTick?.();
        this.tweens.add({
          targets: this.timeText,
          scale: { from: 1.3, to: 1 },
          duration: 250,
          ease: 'Quad.easeOut'
        });
      }
    }
  }

  // ============================================================
  // END OF ROUND
  // ============================================================
  endRound() {
    this.state = 'ended';
    this.cancelAutoSubmit();
    audio.playRoundComplete?.();

    const accuracy = this.attempts > 0 ? Math.round((this.score / this.attempts) * 100) : 0;
    const stars = this.calculateStars(this.score, accuracy);

    progress.completeLevel(this.worldId, this.currentLevel, stars);

    // Star bonus stardust on top of per-correct earn.
    if (stars > 0) {
      economy.addStardust(stars * 5);
    }

    // Register the play day for the streak system + collect any new milestones.
    streak.registerPlayDay();
    this.newStreakMilestones = streak.consumeNewMilestones();
    this.streakRewards = grantStreakRewards(this.newStreakMilestones || []);

    // Roll a random cosmetic drop weighted by stars earned.
    this.randomDrop = stars > 0 ? rollLevelEndDrop(stars) : null;

    records.recordLevelComplete(this.worldId, stars, this.bestStreak);

    this.showSummary({ stars, accuracy });
  }

  calculateStars(score, accuracy) {
    if (score === 0) return 0;
    const meetsAccuracy = accuracy >= 85;
    if (score >= this.scoreThreshold && meetsAccuracy) return 3;
    if (score >= Math.ceil(this.scoreThreshold * 0.7) || meetsAccuracy) return 2;
    return 1;
  }

  showSummary({ stars, accuracy }) {
    // Dim background
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(50).setInteractive();
    this.tweens.add({ targets: overlay, alpha: 0.7, duration: 350 });

    const panelW = 700;
    const panelH = 980;
    const panel = this.add.container(W / 2, H + panelH / 2).setDepth(60);

    const bg = this.add.graphics();
    bg.fillStyle(0x12122a, 0.98);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 28);
    bg.lineStyle(3, this.world.accentColor, 0.9);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 28);
    panel.add(bg);

    panel.add(this.add.text(0, -panelH / 2 + 60, 'Time’s Up!', style('display', {
      fontSize: '48px'
    })).setOrigin(0.5));

    panel.add(this.add.text(0, -panelH / 2 + 110, this.modeConfig.label.toUpperCase(), style('caption', {
      fill: '#cfcfe0', fontSize: '20px'
    })).setOrigin(0.5));

    // Stars
    const starY = -panelH / 2 + 200;
    for (let i = 0; i < 3; i++) {
      const filled = i < stars;
      const star = this.makeStarShape(filled);
      star.x = -110 + i * 110;
      star.y = starY;
      star.setScale(0);
      panel.add(star);
      this.tweens.add({
        targets: star,
        scale: 1,
        duration: 250,
        delay: 700 + i * 200,
        ease: 'Back.easeOut',
        onStart: () => filled && audio.playStar()
      });
    }

    // Stats
    const statY = starY + 160;
    panel.add(this.add.text(-160, statY, this.score.toString(), style('display', {
      fontSize: '64px',
      fill: '#ffffff'
    })).setOrigin(0.5));
    panel.add(this.add.text(-160, statY + 50, 'CORRECT', style('caption')).setOrigin(0.5));

    panel.add(this.add.text(0, statY, `${accuracy}%`, style('display', {
      fontSize: '64px',
      fill: '#' + this.world.accentColor.toString(16).padStart(6, '0')
    })).setOrigin(0.5));
    panel.add(this.add.text(0, statY + 50, 'ACCURACY', style('caption')).setOrigin(0.5));

    panel.add(this.add.text(160, statY, this.bestStreak.toString(), style('display', {
      fontSize: '64px',
      fill: '#ff8b3d'
    })).setOrigin(0.5));
    panel.add(this.add.text(160, statY + 50, 'BEST STREAK', style('caption')).setOrigin(0.5));

    // Streak milestone celebration banner (if any earned this round)
    if (this.newStreakMilestones && this.newStreakMilestones.length > 0) {
      const m = this.newStreakMilestones[0];
      const reward = (this.streakRewards || []).find(r => r);
      const banner = this.add.container(0, -panelH / 2 + 30);
      const bannerBg = this.add.graphics();
      bannerBg.fillStyle(0xff8b3d, 1);
      bannerBg.fillRoundedRect(-260, -28, 520, 56, 28);
      banner.add(bannerBg);
      const label = reward
        ? `🔥 ${m}-day streak — unlocked ${reward.item.name}!`
        : `🔥 ${m}-day streak unlocked!`;
      banner.add(this.add.text(0, 0, label, style('subhead', {
        fontSize: '22px',
        fill: '#1a0a00',
        fontStyle: '900'
      })).setOrigin(0.5));
      panel.add(banner);
      this.tweens.add({
        targets: banner,
        scale: { from: 0.6, to: 1 },
        duration: 400,
        delay: 1200,
        ease: 'Back.easeOut'
      });
    }

    // Random cosmetic drop banner (separate row below the milestone banner)
    if (this.randomDrop) {
      const dropY = (this.newStreakMilestones && this.newStreakMilestones.length > 0)
        ? -panelH / 2 + 92
        : -panelH / 2 + 30;
      const banner = this.add.container(0, dropY);
      const bannerBg = this.add.graphics();
      bannerBg.fillStyle(0xc77eff, 1);
      bannerBg.fillRoundedRect(-260, -26, 520, 52, 26);
      banner.add(bannerBg);
      banner.add(this.add.text(0, 0, `✨ Surprise drop: ${this.randomDrop.item.name}!`, style('subhead', {
        fontSize: '22px',
        fill: '#1a0a26',
        fontStyle: '900'
      })).setOrigin(0.5));
      panel.add(banner);
      this.tweens.add({
        targets: banner,
        scale: { from: 0.6, to: 1 },
        duration: 400,
        delay: 1500,
        ease: 'Back.easeOut'
      });
    }

    // Weakest facts to review
    const weakFacts = this.getWeakFactsFromHistory();
    const reviewY = statY + 130;
    panel.add(this.add.text(0, reviewY, weakFacts.length ? 'Practice these' : 'No tricky facts!', style('subhead', {
      fontSize: '24px',
      fill: '#cfcfe0'
    })).setOrigin(0.5));

    weakFacts.slice(0, 3).forEach((wf, i) => {
      const wy = reviewY + 50 + i * 56;
      panel.add(this.add.text(0, wy, `${wf.display} = ${wf.answer}`, style('subhead', {
        fontSize: '32px',
        fill: '#f7dc6f'
      })).setOrigin(0.5));
    });

    // Pet "chow down" moment — show the pet eating the pellets earned this level.
    // Positioned below the weak-facts review section so it doesn't overlap.
    if (companion.hasStarter() && this.petHud) {
      const petY = reviewY + 230;
      const pet = drawCompanion(this, 0, petY, { scale: 0.7 });
      panel.add(pet);

      const fedText = this.add.text(0, petY + 60,
        `Fed ${this.petHud.pelletsThisLevel} pellets to ${companion.getSpecies().name}!`,
        style('subhead', { fontSize: '22px', fill: '#f7dc6f' })
      ).setOrigin(0.5);
      panel.add(fedText);

      // Quick chomp animation cycle
      this.tweens.add({
        targets: pet,
        scaleX: 0.92,
        scaleY: 0.6,
        duration: 180,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.easeInOut',
        delay: 600
      });
    }

    // Buttons
    const btnY = panelH / 2 - 130;
    const retryBtn = createButton(this, {
      x: -130, y: btnY, label: 'Retry',
      width: 240, height: 80,
      color: 0x4a4a6a,
      onClick: () => this.scene.restart()
    });
    panel.add(retryBtn);

    const continueBtn = createButton(this, {
      x: 130, y: btnY, label: 'Continue',
      width: 240, height: 80,
      color: this.world.accentColor,
      onClick: () => this.exitToLevelSelect()
    });
    panel.add(continueBtn);

    this.tweens.add({
      targets: panel,
      y: H / 2,
      duration: 500,
      ease: 'Back.easeOut'
    });
  }

  makeStarShape(filled) {
    const g = this.add.graphics();
    const points = 5;
    const outerR = 36;
    const innerR = 16;
    g.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    if (filled) {
      g.fillStyle(0xf7dc6f, 1);
      g.fillPath();
      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(-outerR * 0.3, -outerR * 0.3, outerR * 0.18);
    } else {
      g.lineStyle(3, 0x6a6a80, 1);
      g.strokePath();
    }
    return g;
  }

  getWeakFactsFromHistory() {
    const stats = new Map();
    for (const h of this.history) {
      const key = h.problem.display;
      const e = stats.get(key) || { display: h.problem.display, answer: h.problem.answer, correct: 0, total: 0 };
      e.total++;
      if (h.correct) e.correct++;
      stats.set(key, e);
    }
    return [...stats.values()]
      .filter(e => e.total >= 1 && e.correct < e.total)
      .sort((a, b) => (a.correct / a.total) - (b.correct / b.total));
  }

  // ============================================================
  // EXIT
  // ============================================================
  exitToLevelSelect() {
    this.scene.start('LevelSelectScene');
  }
}
