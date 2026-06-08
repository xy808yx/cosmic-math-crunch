// 60-second timed sprint. Random 1×12 facts, pure score chase, no lives.
// Persists best score per save into progress.arcade.endlessBest.

import Phaser from 'phaser';
import { progress, getProblemForWorld, getDistractors } from '../GameData.js';
import { audio } from '../AudioManager.js';
import { music } from '../MusicManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { style } from '../textStyles.js';
import { COLORS } from '../colorPalette.js';
import { createButton } from '../buttonHelper.js';

const W = 1080;
const H = 1920;
const DURATION_MS = 60000;

export class EndlessScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EndlessScene' });
  }

  create() {
    audio.init();
    music.ensurePlaying(this, 'levelTheme');
    createStarfield(this, { width: W, height: H, accentColor: 0x4ecdc4, accentStrength: 0.2 });

    this.score = 0;
    this.timeLeftMs = DURATION_MS;
    this.problem = null;

    this.add.text(W / 2, 140, 'ENDLESS', style('display', {
      fontSize: '64px',
      fill: '#4ecdc4',
      stroke: '#0a0a1a',
      strokeThickness: 4
    })).setOrigin(0.5);

    this.scoreText = this.add.text(W / 2 - 280, 240, 'SCORE 0', style('subhead', {
      fontSize: '40px',
      fill: '#ffffff'
    })).setOrigin(0, 0.5);

    this.timeText = this.add.text(W / 2 + 280, 240, '60.0s', style('subhead', {
      fontSize: '40px',
      fill: '#fbbf24'
    })).setOrigin(1, 0.5);

    this.questionCard = this.add.container(W / 2, 800);
    const cardBg = this.add.graphics();
    cardBg.fillStyle(COLORS.bgPanel, 0.95);
    cardBg.fillRoundedRect(-380, -150, 760, 300, 28);
    cardBg.lineStyle(4, 0x4ecdc4, 0.95);
    cardBg.strokeRoundedRect(-380, -150, 760, 300, 28);
    this.questionCard.add(cardBg);
    this.questionText = this.add.text(0, 0, '', style('display', {
      fontSize: '100px',
      fill: '#ffffff'
    })).setOrigin(0.5);
    this.questionCard.add(this.questionText);

    this.buttonContainer = this.add.container(W / 2, 1400);

    this.nextProblem();

    this.tickEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        this.timeLeftMs -= 100;
        this.timeText.setText(`${(this.timeLeftMs / 1000).toFixed(1)}s`);
        if (this.timeLeftMs <= 0) {
          this.tickEvent.remove();
          this.endRun();
        }
      }
    });

    new TransitionManager(this).fadeIn(280);
  }

  nextProblem() {
    this.problem = getProblemForWorld(11, 'mixed');
    this.questionText.setText(this.problem.display);
    this.buttonContainer.removeAll(true);
    const distractors = getDistractors(this.problem, 3);
    const all = [this.problem.answer, ...distractors];
    // shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    const cols = 2;
    const gap = 30;
    const bw = 320;
    const bh = 140;
    all.forEach((v, idx) => {
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      const bx = (c - 0.5) * (bw + gap);
      const by = r * (bh + gap);
      const btn = createButton(this, {
        x: bx, y: by, label: `${v}`,
        width: bw, height: bh,
        color: 0x4ecdc4,
        textOverrides: { fontSize: '50px', fill: '#0a0a1a', fontStyle: '900' },
        onClick: () => this.handleAnswer(v)
      });
      this.buttonContainer.add(btn);
    });
  }

  handleAnswer(v) {
    if (this.timeLeftMs <= 0) return;
    if (v === this.problem.answer) {
      this.score++;
      this.scoreText.setText(`SCORE ${this.score}`);
      audio.playMatch?.();
    } else {
      audio.playWrong?.();
      this.cameras.main.shake(100, 0.005);
    }
    this.nextProblem();
  }

  endRun() {
    const wasBest = progress.recordEndlessScore(this.score);

    this.questionCard.setVisible(false);
    this.buttonContainer.setVisible(false);

    const panel = this.add.container(W / 2, H / 2);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgPanel, 0.98);
    bg.fillRoundedRect(-380, -260, 760, 520, 28);
    bg.lineStyle(4, 0x4ecdc4, 0.95);
    bg.strokeRoundedRect(-380, -260, 760, 520, 28);
    panel.add(bg);
    panel.add(this.add.text(0, -180, "Time's up!", style('display', { fontSize: '60px', fill: '#ffffff' })).setOrigin(0.5));
    panel.add(this.add.text(0, -60, `Score: ${this.score}`, style('subhead', { fontSize: '50px', fill: '#4ecdc4' })).setOrigin(0.5));
    if (wasBest) {
      panel.add(this.add.text(0, 20, 'NEW BEST!', style('subhead', { fontSize: '40px', fill: '#fbbf24' })).setOrigin(0.5));
    } else {
      panel.add(this.add.text(0, 20, `Best: ${progress.arcade?.endlessBest || 0}`, style('caption', { fontSize: '28px', fill: '#cfcfe0' })).setOrigin(0.5));
    }
    panel.add(createButton(this, {
      x: -120, y: 180, label: 'Retry',
      width: 240, height: 84,
      color: 0x4a4a6a,
      onClick: () => this.scene.restart()
    }));
    panel.add(createButton(this, {
      x: 120, y: 180, label: 'Done',
      width: 240, height: 84,
      color: 0x4ecdc4,
      onClick: () => new TransitionManager(this).fadeToScene('ArcadeMenuScene')
    }));
  }
}
