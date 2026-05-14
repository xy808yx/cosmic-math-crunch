// Boss Rush — random 5 bosses from cleared visible worlds, in random order.
// 3 lives total. Tracks best time + accuracy in progress.arcade.bossRushBest.
// Compact arena: a boss appears, kid solves 6 picks until boss is "defeated"
// (1 right = 1 HP off), then next boss. Wrong answer = -1 life.

import Phaser from 'phaser';
import {
  progress, VISIBLE_WORLDS, getProblemForWorld, getDistractors
} from '../GameData.js';
import { audio } from '../AudioManager.js';
import { music } from '../MusicManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { style } from '../textStyles.js';
import { COLORS } from '../colorPalette.js';
import { createButton } from '../buttonHelper.js';

const W = 1080;
const H = 1920;
const BOSS_HP = 6;
const LIVES = 3;
const TOTAL_BOSSES = 5;

export class BossRushScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BossRushScene' });
  }

  create() {
    audio.init();
    music.ensurePlaying(this, 'bossTheme');
    createStarfield(this, { width: W, height: H, accentColor: 0xc44b5e, accentStrength: 0.22 });

    // Pick 5 random cleared bosses; if fewer cleared, fall back to all visible.
    const cleared = VISIBLE_WORLDS.filter(w => progress.isWorldFullyCleared(w.id));
    const pool = cleared.length >= TOTAL_BOSSES ? cleared : VISIBLE_WORLDS;
    this.queue = this.shuffle(pool.slice()).slice(0, TOTAL_BOSSES);
    this.queueIndex = 0;
    this.lives = LIVES;
    this.correct = 0;
    this.totalAttempts = 0;
    this.startTimeMs = Date.now();

    this.add.text(W / 2, 140, 'BOSS RUSH', style('display', {
      fontSize: '64px',
      fill: '#c44b5e',
      stroke: '#0a0a1a',
      strokeThickness: 4
    })).setOrigin(0.5);

    this.livesText = this.add.text(W / 2 - 280, 240, `LIVES ${this.lives}`, style('subhead', {
      fontSize: '34px',
      fill: '#fbbf24'
    })).setOrigin(0, 0.5);
    this.queueText = this.add.text(W / 2 + 280, 240, `BOSS 1/${TOTAL_BOSSES}`, style('subhead', {
      fontSize: '34px',
      fill: '#cfcfe0'
    })).setOrigin(1, 0.5);

    this.bossTitle = this.add.text(W / 2, 340, '', style('subhead', {
      fontSize: '40px',
      fill: '#ffffff'
    })).setOrigin(0.5);
    this.bossSubtitle = this.add.text(W / 2, 390, '', style('caption', {
      fontSize: '24px',
      fill: '#cfcfe0'
    })).setOrigin(0.5);

    this.hpBar = this.add.graphics();
    this.hpBar.setDepth(5);

    this.questionCard = this.add.container(W / 2, 850);
    const cardBg = this.add.graphics();
    cardBg.fillStyle(COLORS.bgPanel, 0.95);
    cardBg.fillRoundedRect(-380, -150, 760, 300, 28);
    cardBg.lineStyle(4, 0xc44b5e, 0.95);
    cardBg.strokeRoundedRect(-380, -150, 760, 300, 28);
    this.questionCard.add(cardBg);
    this.questionText = this.add.text(0, 0, '', style('display', {
      fontSize: '90px',
      fill: '#ffffff'
    })).setOrigin(0.5);
    this.questionCard.add(this.questionText);

    this.buttonContainer = this.add.container(W / 2, 1400);

    this.startBoss();

    new TransitionManager(this).fadeIn(280);
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  startBoss() {
    if (this.queueIndex >= this.queue.length) {
      this.endRun(true);
      return;
    }
    this.currentBoss = this.queue[this.queueIndex];
    this.bossHp = BOSS_HP;
    this.bossTitle.setText(this.currentBoss.villain || this.currentBoss.name);
    this.bossSubtitle.setText(this.currentBoss.name);
    this.queueText.setText(`BOSS ${this.queueIndex + 1}/${TOTAL_BOSSES}`);
    this.drawHp();
    this.nextProblem();
    audio.playBossRumble?.();
  }

  drawHp() {
    this.hpBar.clear();
    const x = W / 2 - 300;
    const y = 460;
    this.hpBar.fillStyle(0x2a1a30, 1);
    this.hpBar.fillRoundedRect(x, y, 600, 24, 8);
    const pct = this.bossHp / BOSS_HP;
    this.hpBar.fillStyle(0xc44b5e, 1);
    this.hpBar.fillRoundedRect(x, y, 600 * pct, 24, 8);
  }

  nextProblem() {
    this.problem = getProblemForWorld(this.currentBoss.id, 'boss');
    this.questionText.setText(this.problem.display);
    this.buttonContainer.removeAll(true);
    const distractors = getDistractors(this.problem, 5);
    const all = [this.problem.answer, ...distractors];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    const cols = 3;
    const bw = 240;
    const bh = 120;
    const gap = 24;
    all.forEach((v, idx) => {
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      const bx = (c - 1) * (bw + gap);
      const by = r * (bh + gap);
      const btn = createButton(this, {
        x: bx, y: by, label: `${v}`,
        width: bw, height: bh,
        color: 0xc44b5e,
        textOverrides: { fontSize: '42px', fill: '#ffffff', fontStyle: '900' },
        onClick: () => this.handleAnswer(v)
      });
      this.buttonContainer.add(btn);
    });
  }

  handleAnswer(v) {
    this.totalAttempts++;
    if (v === this.problem.answer) {
      this.correct++;
      this.bossHp--;
      audio.playBossImpact?.();
      this.drawHp();
      if (this.bossHp <= 0) {
        // Boss down, next boss.
        audio.playWorldClearFanfare?.();
        this.queueIndex++;
        this.time.delayedCall(700, () => this.startBoss());
        return;
      }
      this.nextProblem();
    } else {
      this.lives--;
      audio.playShipDamage?.();
      this.livesText.setText(`LIVES ${this.lives}`);
      this.cameras.main.shake(150, 0.008);
      if (this.lives <= 0) {
        this.endRun(false);
        return;
      }
      this.nextProblem();
    }
  }

  endRun(won) {
    const timeMs = Date.now() - this.startTimeMs;
    const wasBest = progress.recordBossRushResult({
      won, timeMs, correct: this.correct, total: this.totalAttempts
    });

    this.questionCard.setVisible(false);
    this.buttonContainer.setVisible(false);
    this.hpBar.clear();

    const panel = this.add.container(W / 2, H / 2);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgPanel, 0.98);
    bg.fillRoundedRect(-380, -280, 760, 560, 28);
    bg.lineStyle(4, won ? 0xfbbf24 : 0xc44b5e, 0.95);
    bg.strokeRoundedRect(-380, -280, 760, 560, 28);
    panel.add(bg);
    panel.add(this.add.text(0, -200, won ? 'GAUNTLET CLEARED' : 'OVERWHELMED', style('display', {
      fontSize: '50px',
      fill: won ? '#fbbf24' : '#c44b5e'
    })).setOrigin(0.5));
    const acc = this.totalAttempts > 0 ? Math.round((this.correct / this.totalAttempts) * 100) : 0;
    panel.add(this.add.text(0, -100, `Accuracy: ${acc}%`, style('subhead', {
      fontSize: '36px',
      fill: '#ffffff'
    })).setOrigin(0.5));
    panel.add(this.add.text(0, -40, `Time: ${(timeMs / 1000).toFixed(1)}s`, style('subhead', {
      fontSize: '32px',
      fill: '#cfcfe0'
    })).setOrigin(0.5));
    if (wasBest) {
      panel.add(this.add.text(0, 30, 'NEW BEST!', style('subhead', {
        fontSize: '36px',
        fill: '#fbbf24'
      })).setOrigin(0.5));
    }
    panel.add(createButton(this, {
      x: -120, y: 200, label: 'Retry',
      width: 240, height: 84,
      color: 0x4a4a6a,
      onClick: () => this.scene.restart()
    }));
    panel.add(createButton(this, {
      x: 120, y: 200, label: 'Done',
      width: 240, height: 84,
      color: 0xc44b5e,
      onClick: () => new TransitionManager(this).fadeToScene('ArcadeMenuScene')
    }));
  }
}
