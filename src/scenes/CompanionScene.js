import Phaser from 'phaser';
import { audio } from '../AudioManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { createIconButton } from '../buttonHelper.js';
import { style } from '../textStyles.js';
import { companion, drawCompanion } from '../CompanionManager.js';
import { streak } from '../StreakManager.js';
import { ship, SHIP_PARTS } from '../ShipManager.js';
import { drawShip } from '../ShipRenderer.js';
import { PET_COSMETICS } from '../CosmeticManager.js';
import { STREAK_REWARDS } from '../MilestoneRewards.js';

const W = 800;
const H = 1400;

const STAGE_LABELS = { egg: 'Egg', baby: 'Baby', teen: 'Teen', adult: 'Adult' };

export class CompanionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CompanionScene' });
  }

  create() {
    audio.init();
    createStarfield(this, { accentStrength: 0 });

    this.createHeader();
    this.createPetShowcase();
    this.createShipShowcase();
    this.createEvolutionRoadmap();
    this.createStreakRoadmap();

    new TransitionManager(this).fadeIn(300);
  }

  // ============================================================
  // HEADER
  // ============================================================
  createHeader() {
    const bg = this.add.graphics().setDepth(10);
    bg.fillStyle(0x07071a, 0.95);
    bg.fillRect(0, 0, W, 130);

    createIconButton(this, {
      x: 60, y: 60, radius: 28,
      accentColor: 0x4ecdc4,
      drawIcon: (g, size) => this.drawBackIcon(g, size),
      onClick: () => this.exit()
    }).setDepth(15);

    const species = companion.getSpecies();
    this.add.text(W / 2, 70, species ? species.name : 'Companion', style('display', {
      fontSize: '50px',
      fill: '#ffffff'
    })).setOrigin(0.5).setDepth(14);
  }

  drawBackIcon(g, size) {
    g.lineStyle(4, 0x4ecdc4, 1);
    g.beginPath();
    g.moveTo(size * 0.4, -size * 0.5);
    g.lineTo(-size * 0.4, 0);
    g.lineTo(size * 0.4, size * 0.5);
    g.strokePath();
  }

  // ============================================================
  // PET SHOWCASE
  // ============================================================
  createPetShowcase() {
    if (!companion.hasStarter()) return;
    const cx = W / 2;
    const cy = 280;

    // Glow ring
    const glow = this.add.graphics().setDepth(8);
    const sp = companion.getSpecies();
    glow.fillStyle(sp?.color || 0xc77eff, 0.18);
    glow.fillCircle(cx, cy, 130);

    const pet = drawCompanion(this, cx, cy, { scale: 1.4 });
    pet.setDepth(9);
    this.tweens.add({
      targets: pet,
      y: cy - 8,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const stageLabel = STAGE_LABELS[companion.getStage()] || companion.getStage();
    this.add.text(cx, 410, `Stage: ${stageLabel}`, style('subhead', {
      fontSize: '24px',
      fill: '#ffffff'
    })).setOrigin(0.5).setDepth(10);
  }

  // ============================================================
  // SHIP SHOWCASE
  // ============================================================
  createShipShowcase() {
    const cx = W / 2;
    const cy = 510;

    this.add.text(cx, cy - 60, 'Your Ship', style('caption', {
      fontSize: '20px',
      fill: '#cfcfe0'
    })).setOrigin(0.5).setDepth(10);

    drawShip(this, cx, cy, { scale: 1.1, parts: ship.getCurrentParts() }).setDepth(10);
  }

  // ============================================================
  // EVOLUTION ROADMAP
  // ============================================================
  createEvolutionRoadmap() {
    const sectionY = 620;

    this.add.text(W / 2, sectionY, 'Evolution', style('subhead', {
      fontSize: '26px',
      fill: '#cfcfe0'
    })).setOrigin(0.5).setDepth(10);

    const progressBarY = sectionY + 50;
    const sp = companion.getStageProgress();
    const stages = ['egg', 'baby', 'teen', 'adult'];
    const currentIdx = stages.indexOf(companion.getStage());

    const trackW = 600;
    const trackH = 16;
    const trackX = W / 2 - trackW / 2;

    // Track
    const track = this.add.graphics().setDepth(10);
    track.fillStyle(0x2a2a44, 0.9);
    track.fillRoundedRect(trackX, progressBarY, trackW, trackH, 8);

    // Fill — progress towards next stage within the current segment
    const segmentW = trackW / 3; // 3 segments between 4 stages
    const completedW = currentIdx * segmentW;
    let fillW = completedW;
    if (sp.nextStage && sp.target > 0) {
      const stageRatio = Math.min(1, sp.current / sp.target);
      fillW = completedW + segmentW * stageRatio;
    } else if (currentIdx === stages.length - 1) {
      fillW = trackW;
    }

    const fill = this.add.graphics().setDepth(11);
    fill.fillStyle(0x58d68d, 1);
    fill.fillRoundedRect(trackX, progressBarY, fillW, trackH, 8);

    // Stage labels under each tick
    stages.forEach((stage, i) => {
      const x = trackX + i * segmentW;
      const isCurrent = i === currentIdx;
      const isCompleted = i < currentIdx;

      // Tick marker
      const tick = this.add.graphics().setDepth(12);
      tick.fillStyle(isCompleted || isCurrent ? 0x58d68d : 0x4a4a60, 1);
      tick.fillCircle(x, progressBarY + trackH / 2, isCurrent ? 12 : 8);
      if (isCurrent) {
        tick.lineStyle(3, 0xffffff, 0.9);
        tick.strokeCircle(x, progressBarY + trackH / 2, 12);
      }

      this.add.text(x, progressBarY + 38, STAGE_LABELS[stage], style('caption', {
        fontSize: '16px',
        fill: isCurrent ? '#58d68d' : isCompleted ? '#cfcfe0' : '#7a7a90'
      })).setOrigin(0.5).setDepth(12);
    });

    // Progress text
    if (sp.nextStage) {
      this.add.text(W / 2, progressBarY + 80, `${sp.current} / ${sp.target} pellets to ${STAGE_LABELS[sp.nextStage]}`, style('caption', {
        fontSize: '18px',
        fill: '#a8a8c0'
      })).setOrigin(0.5).setDepth(10);
    } else {
      this.add.text(W / 2, progressBarY + 80, 'Fully grown!', style('caption', {
        fontSize: '18px',
        fill: '#58d68d'
      })).setOrigin(0.5).setDepth(10);
    }
  }

  // ============================================================
  // STREAK ROADMAP
  // ============================================================
  createStreakRoadmap() {
    const sectionY = 800;

    this.add.text(W / 2, sectionY, 'Streak Milestones', style('subhead', {
      fontSize: '26px',
      fill: '#cfcfe0'
    })).setOrigin(0.5).setDepth(10);

    const currentDays = streak.getCurrent();
    const milestones = [3, 7, 30];
    const cardW = 200;
    const cardH = 220;
    const gap = 28;
    const total = milestones.length * cardW + (milestones.length - 1) * gap;
    const startX = W / 2 - total / 2 + cardW / 2;

    milestones.forEach((days, i) => {
      const x = startX + i * (cardW + gap);
      const y = sectionY + 160;
      const earned = currentDays >= days;
      const rewardId = STREAK_REWARDS[days];

      const card = this.add.container(x, y).setDepth(10);

      const bg = this.add.graphics();
      bg.fillStyle(0x12122a, 0.95);
      bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 18);
      bg.lineStyle(3, earned ? 0xff8b3d : 0x3a3a4a, earned ? 1 : 0.5);
      bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 18);
      card.add(bg);

      // Flame icon
      const flame = this.add.graphics();
      flame.fillStyle(earned ? 0xff8b3d : 0x4a4a60, 1);
      const fy = -cardH / 2 + 50;
      flame.beginPath();
      flame.moveTo(-16, fy + 8);
      flame.lineTo(-22, fy + 22);
      flame.lineTo(-14, fy + 32);
      flame.lineTo(0, fy + 36);
      flame.lineTo(14, fy + 32);
      flame.lineTo(22, fy + 22);
      flame.lineTo(16, fy + 8);
      flame.lineTo(10, fy + 18);
      flame.lineTo(0, fy + 4);
      flame.closePath();
      flame.fillPath();
      if (earned) {
        flame.fillStyle(0xffd86b, 0.85);
        flame.fillCircle(0, fy + 22, 6);
      }
      card.add(flame);

      card.add(this.add.text(0, -cardH / 2 + 95, `${days} days`, style('subhead', {
        fontSize: '24px',
        fill: earned ? '#ff8b3d' : '#7a7a90'
      })).setOrigin(0.5));

      card.add(this.add.text(0, -cardH / 2 + 130, earned ? 'EARNED' : 'LOCKED', style('caption', {
        fontSize: '16px',
        fill: earned ? '#58d68d' : '#5a5a72',
        fontStyle: '900'
      })).setOrigin(0.5));

      const rewardName = this.lookupRewardName(rewardId);
      if (rewardName) {
        card.add(this.add.text(0, cardH / 2 - 28, `Unlocks ${rewardName}`, style('caption', {
          fontSize: '15px',
          fill: '#a8a8c0',
          align: 'center',
          wordWrap: { width: cardW - 24 }
        })).setOrigin(0.5));
      }
    });

    // Current-streak indicator under the row
    this.add.text(W / 2, sectionY + 310, `Current streak: ${currentDays} day${currentDays === 1 ? '' : 's'}`, style('body', {
      fontSize: '20px',
      fill: '#ff8b3d'
    })).setOrigin(0.5).setDepth(10);
  }

  lookupRewardName(id) {
    if (!id) return null;
    return PET_COSMETICS.find(x => x.id === id)?.name
        || SHIP_PARTS.find(x => x.id === id)?.name
        || id;
  }

  exit() {
    new TransitionManager(this).fadeToScene('WorldMapScene');
  }
}
