// PILOT LOGBOOK — full-screen records / stats with a 12×12 mastery grid
// and top-5 fastest-fact list. Replaces the cramped cockpit panel.

import Phaser from 'phaser';
import { audio } from '../AudioManager.js';
import { music } from '../MusicManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { createIconButton } from '../buttonHelper.js';
import { style } from '../textStyles.js';
import { progress, VISIBLE_WORLDS } from '../GameData.js';
import { records, formatFactKey } from '../RecordsManager.js';
import { drawArrowLeftIcon, drawStarIcon } from '../StatIcons.js';
import { COLORS } from '../colorPalette.js';

const W = 1080;
const H = 1920;

export class RecordsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RecordsScene' });
  }

  create() {
    audio.init();
    music.ensurePlaying(this);
    createStarfield(this, { width: W, height: H, accentStrength: 0 });

    records.refreshWorldsCleared(progress, VISIBLE_WORLDS);

    this.createHeader();
    this.createStatCards();
    this.createMasteryGrid();
    this.createTopFacts();

    new TransitionManager(this).fadeIn(280);
  }

  createHeader() {
    const bg = this.add.graphics().setDepth(10);
    bg.fillStyle(COLORS.bgDark, 0.95);
    bg.fillRect(0, 0, W, 160);

    createIconButton(this, {
      x: 90, y: 80, radius: 38,
      accentColor: COLORS.accentWarm,
      drawIcon: (g, size) => drawArrowLeftIcon(g, 0, 0, size),
      onClick: () => {
        audio.playClick();
        new TransitionManager(this).fadeToScene('WorldMapScene');
      }
    }).setDepth(15);

    this.add.text(W / 2, 80, 'PILOT LOGBOOK', style('display', {
      fontSize: '54px',
      fill: '#ffd86b'
    })).setOrigin(0.5).setDepth(14);
  }

  // ============================================================
  // STAT CARDS — 4 cards in a 2x2 grid
  // ============================================================
  createStatCards() {
    const cardW = 480;
    const cardH = 200;
    const gap = 24;
    const startX = W / 2 - cardW - gap / 2;
    const startY = 200;

    const cards = [
      {
        label: 'BEST STREAK',
        value: `${records.getLongestStreak()}`,
        accent: 0xff8b3d
      },
      {
        label: 'WORLDS CLEARED',
        value: `${records.getWorldsCleared()} / ${VISIBLE_WORLDS.length}`,
        accent: COLORS.accentTeal
      },
      {
        label: 'TOTAL STARS',
        value: `${progress.totalStars}`,
        accent: COLORS.warning,
        showStar: true
      },
      {
        label: "TODAY'S AVG",
        value: records.getTodayAvgMs() > 0
          ? `${(records.getTodayAvgMs() / 1000).toFixed(2)}s`
          : '—',
        sub: records.getTodaySamples() > 0 ? `${records.getTodaySamples()} answers` : 'No plays today',
        accent: COLORS.accentPurple
      }
    ];

    cards.forEach((card, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (cardW + gap) + cardW / 2;
      const y = startY + row * (cardH + gap) + cardH / 2;
      this.makeStatCard(x, y, cardW, cardH, card);
    });

  }

  makeStatCard(x, y, w, h, card) {
    const c = this.add.container(x, y).setDepth(11);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgPanel, 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 22);
    bg.lineStyle(3, card.accent, 0.85);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 22);
    c.add(bg);

    c.add(this.add.text(0, -h / 2 + 32, card.label, style('caption', {
      fontSize: '22px',
      fill: '#cfcfe0',
      fontStyle: '900'
    })).setOrigin(0.5));

    c.add(this.add.text(0, 0, card.value, style('display', {
      fontSize: '72px',
      fill: '#' + card.accent.toString(16).padStart(6, '0')
    })).setOrigin(0.5));

    if (card.sub) {
      c.add(this.add.text(0, h / 2 - 32, card.sub, style('caption', {
        fontSize: '22px',
        fill: '#7a7a90'
      })).setOrigin(0.5));
    }

    if (card.showStar) {
      const starG = this.add.graphics();
      drawStarIcon(starG, 0, 0, 22);
      starG.x = -w / 2 + 50;
      starG.y = -h / 2 + 50;
      c.add(starG);
    }
  }

  // ============================================================
  // 12×12 MASTERY GRID
  // ============================================================
  createMasteryGrid() {
    const sectionY = 720;
    this.add.text(W / 2, sectionY, 'FACT MASTERY (1×1 to 12×12)', style('subhead', {
      fontSize: '28px',
      fill: '#ffffff'
    })).setOrigin(0.5).setDepth(11);

    const gridSize = 880;
    const cellSize = (gridSize - 60) / 12;
    const startX = W / 2 - gridSize / 2 + 40;
    const startY = sectionY + 50;

    // Column headers
    for (let i = 1; i <= 12; i++) {
      this.add.text(startX + (i - 0.5) * cellSize, startY + 4, i.toString(), style('caption', {
        fontSize: '20px',
        fill: '#7a7a90'
      })).setOrigin(0.5).setDepth(11);
    }

    const grid = this.add.graphics().setDepth(11);
    for (let r = 1; r <= 12; r++) {
      this.add.text(startX - 16, startY + 30 + (r - 0.5) * cellSize, r.toString(), style('caption', {
        fontSize: '20px',
        fill: '#7a7a90'
      })).setOrigin(1, 0.5).setDepth(11);

      for (let col = 1; col <= 12; col++) {
        const cellX = startX + (col - 1) * cellSize;
        const cellY = startY + 30 + (r - 1) * cellSize;
        const fact = this.factForCell(r, col);
        const color = this.colorForFact(fact);
        grid.fillStyle(color, 1);
        grid.fillRoundedRect(cellX + 2, cellY + 2, cellSize - 4, cellSize - 4, 4);
        if (fact && fact.streak >= 7 && fact.total >= 3) {
          grid.fillStyle(0xffffff, 0.7);
          grid.fillCircle(cellX + cellSize / 2, cellY + cellSize / 2, cellSize * 0.12);
        }
      }
    }

    // Legend
    const legendY = startY + 30 + 12 * cellSize + 24;
    const legendItems = [
      { color: 0x2d2d44, label: 'Unseen' },
      { color: COLORS.error, label: '<60%' },
      { color: COLORS.warning, label: '60-85%' },
      { color: COLORS.success, label: '85%+' }
    ];
    const legendW = legendItems.length * 200;
    let lx = W / 2 - legendW / 2 + 20;
    for (const item of legendItems) {
      const swatch = this.add.graphics().setDepth(11);
      swatch.fillStyle(item.color, 1);
      swatch.fillRoundedRect(lx - 18, legendY - 10, 24, 24, 4);
      this.add.text(lx + 14, legendY + 2, item.label, style('caption', {
        fontSize: '18px',
        fill: '#cfcfe0'
      })).setOrigin(0, 0.5).setDepth(11);
      lx += 200;
    }
  }

  factForCell(r, c) {
    const key = `${Math.min(r, c)}x${Math.max(r, c)}`;
    return progress.factMastery[key] || null;
  }

  colorForFact(fact) {
    if (!fact || fact.total === 0) return 0x2d2d44;
    const acc = fact.correct / fact.total;
    if (acc >= 0.85) return COLORS.success;
    if (acc >= 0.60) return COLORS.warning;
    return COLORS.error;
  }

  // ============================================================
  // TOP FAST FACTS — top-5 fact records as elevated cards.
  // ============================================================
  createTopFacts() {
    const sectionY = 1710;
    this.add.text(W / 2, sectionY, 'FASTEST FACTS', style('subhead', {
      fontSize: '28px',
      fill: '#58d68d'
    })).setOrigin(0.5).setDepth(11);

    const top = records.getTopFastFacts(5);
    if (top.length === 0) {
      this.add.text(W / 2, sectionY + 60, 'No records yet — keep playing!', style('caption', {
        fontSize: '20px',
        fill: '#7a7a90'
      })).setOrigin(0.5).setDepth(11);
      return;
    }

    const cardW = 170;
    const cardH = 150;
    const gap = 14;
    const startY = sectionY + 30 + cardH / 2;
    const totalW = top.length * cardW + (top.length - 1) * gap;
    const startX = W / 2 - totalW / 2 + cardW / 2;

    top.forEach((f, i) => {
      const x = startX + i * (cardW + gap);
      const c = this.add.container(x, startY).setDepth(11);

      // Shadow for depth.
      const shadow = this.add.graphics();
      shadow.fillStyle(0x000000, 0.35);
      shadow.fillRoundedRect(-cardW / 2 + 3, -cardH / 2 + 6, cardW, cardH, 16);
      c.add(shadow);

      // Card body — top-three get a gold/silver/bronze tint, rest blend in.
      const tintColor = i === 0 ? 0xffd86b
                       : i === 1 ? 0xcfcfe0
                       : i === 2 ? 0xff8b3d
                       : 0x4a4a64;
      const bg = this.add.graphics();
      bg.fillStyle(COLORS.bgPanel, 0.96);
      bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
      bg.lineStyle(3, tintColor, i < 3 ? 1 : 0.65);
      bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
      c.add(bg);

      // Rank chip.
      const chip = this.add.graphics();
      chip.fillStyle(tintColor, 0.95);
      chip.fillRoundedRect(-cardW / 2 + 8, -cardH / 2 + 8, 40, 22, 6);
      c.add(chip);
      c.add(this.add.text(-cardW / 2 + 28, -cardH / 2 + 19, `#${i + 1}`, style('caption', {
        fontSize: '14px', fill: '#0a0a1a', fontStyle: '900'
      })).setOrigin(0.5));

      // Fact text.
      c.add(this.add.text(0, -16, formatFactKey(f.key), style('subhead', {
        fontSize: '32px',
        fill: '#ffffff'
      })).setOrigin(0.5));

      // Time.
      c.add(this.add.text(0, 32, `${(f.ms / 1000).toFixed(2)}s`, style('caption', {
        fontSize: '22px',
        fill: '#58d68d',
        fontStyle: '900'
      })).setOrigin(0.5));
    });
  }
}
