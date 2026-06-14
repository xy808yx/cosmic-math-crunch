// Arcade hub — unlocked after the endgame (progress.endingSeen === true).
// Three buttons route to the three arcade modes. Free Play opens a picker of
// cleared worlds — this menu is the single entry point for free-play replays.

import Phaser from 'phaser';
import { progress, VISIBLE_WORLDS } from '../GameData.js';
import { audio } from '../AudioManager.js';
import { music } from '../MusicManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { style } from '../textStyles.js';
import { COLORS } from '../colorPalette.js';
import { createButton } from '../buttonHelper.js';
import { createModal } from '../modalHelper.js';

const W = 1080;
const H = 1920;

export class ArcadeMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ArcadeMenuScene' });
  }

  create() {
    audio.init();
    music.ensurePlaying(this);
    createStarfield(this, { width: W, height: H, accentColor: 0xfbbf24, accentStrength: 0.18 });

    this.add.text(W / 2, 220, 'COSMIC ARCADE', style('display', {
      fontSize: '78px',
      fill: '#fbbf24',
      stroke: '#0a0a1a',
      strokeThickness: 5
    })).setOrigin(0.5);
    this.add.text(W / 2, 310, 'Pick a mode, pilot.', style('caption', {
      fontSize: '30px',
      fill: '#cfcfe0'
    })).setOrigin(0.5);

    const bestEndless = progress.arcade?.endlessBest ?? 0;
    const bestRush = progress.arcade?.bossRushBest;

    const cy0 = 600;
    const gap = 280;

    this.makeModeCard(W / 2, cy0, {
      title: 'ENDLESS',
      subtitle: 'Asteroids never stop',
      detail: `Best score: ${bestEndless}`,
      accent: 0x4ecdc4,
      onClick: () => new TransitionManager(this).fadeToScene('EndlessScene')
    });

    this.makeModeCard(W / 2, cy0 + gap, {
      title: 'BOSS RUSH',
      subtitle: '5 boss fights, one ship',
      detail: bestRush
        ? `Best: ${Math.round(bestRush.accuracy * 100)}% in ${(bestRush.timeMs / 1000).toFixed(1)}s`
        : 'No runs yet',
      accent: 0xc44b5e,
      onClick: () => new TransitionManager(this).fadeToScene('BossRushScene')
    });

    const clearedCount = VISIBLE_WORLDS.filter(w => progress.isWorldFullyCleared(w.id)).length;
    this.makeModeCard(W / 2, cy0 + gap * 2, {
      title: 'FREE PLAY',
      subtitle: 'Replay any cleared world',
      detail: clearedCount > 0
        ? `${clearedCount} world${clearedCount === 1 ? '' : 's'} ready to replay`
        : 'Clear a world to unlock free play',
      accent: 0xa7f3d0,
      onClick: () => {
        if (clearedCount === 0) return;
        this.openFreePlayPicker();
      }
    });

    // Back arrow
    createButton(this, {
      x: 130, y: 100, label: '← MAP',
      width: 220, height: 76,
      color: COLORS.bgPanel,
      textOverrides: { fontSize: '24px', fill: '#fbbf24', fontStyle: '900' },
      onClick: () => new TransitionManager(this).fadeToScene('WorldMapScene')
    });

    new TransitionManager(this).fadeIn(300);
  }

  makeModeCard(x, y, opts) {
    const cw = 820;
    const ch = 220;
    const c = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgPanel, 0.95);
    bg.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 28);
    bg.lineStyle(4, opts.accent, 0.95);
    bg.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 28);
    c.add(bg);

    c.add(this.add.text(-cw / 2 + 40, -50, opts.title, style('display', {
      fontSize: '54px',
      fill: '#ffffff'
    })).setOrigin(0, 0.5));

    c.add(this.add.text(-cw / 2 + 40, 14, opts.subtitle, style('subhead', {
      fontSize: '28px',
      fill: '#' + opts.accent.toString(16).padStart(6, '0')
    })).setOrigin(0, 0.5));

    c.add(this.add.text(-cw / 2 + 40, 60, opts.detail, style('caption', {
      fontSize: '22px',
      fill: '#cfcfe0'
    })).setOrigin(0, 0.5));

    const hit = this.add.rectangle(x, y, cw, ch, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => this.tweens.add({ targets: c, scale: 1.03, duration: 120 }));
    hit.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 120 }));
    hit.on('pointerdown', () => { audio.playClick?.(); opts.onClick(); });
    return c;
  }

  openFreePlayPicker() {
    const cleared = VISIBLE_WORLDS.filter(w => progress.isWorldFullyCleared(w.id));
    const cw = 920;
    const ch = 1340;
    const hits = [];
    const { card, close } = createModal(this, {
      width: cw, height: ch,
      accentColor: 0xa7f3d0,
      radius: 28, strokeWidth: 4,
      closeOnCardTap: false,
      onClose: () => hits.forEach(h => h.destroy())
    });

    card.add(this.add.text(0, -ch / 2 + 70, 'FREE PLAY', style('display', {
      fontSize: '56px',
      fill: '#a7f3d0',
      stroke: '#0a0a1a',
      strokeThickness: 4
    })).setOrigin(0.5));
    card.add(this.add.text(0, -ch / 2 + 138, 'Pick a world to replay', style('caption', {
      fontSize: '26px',
      fill: '#cfcfe0'
    })).setOrigin(0.5));

    // 2-column grid of name chips, sized to fit up to 11 worlds.
    const cols = 2;
    const cellW = 380;
    const cellH = 92;
    const gapX = 32;
    const gapY = 22;
    const startY = -ch / 2 + 220;
    cleared.forEach((world, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - (cols - 1) / 2) * (cellW + gapX);
      const y = startY + row * (cellH + gapY) + cellH / 2;
      const chip = this.add.container(x, y);
      const bg = this.add.graphics();
      bg.fillStyle(COLORS.bgPanel, 0.95);
      bg.fillRoundedRect(-cellW / 2, -cellH / 2, cellW, cellH, 18);
      bg.lineStyle(2, world.accentColor, 0.95);
      bg.strokeRoundedRect(-cellW / 2, -cellH / 2, cellW, cellH, 18);
      chip.add(bg);
      chip.add(this.add.text(0, 0, world.name.toUpperCase(), style('subhead', {
        fontSize: '26px',
        fill: '#' + world.accentColor.toString(16).padStart(6, '0'),
        fontStyle: '900'
      })).setOrigin(0.5));
      card.add(chip);

      // Hit area positioned in screen coords (card is centered at W/2, H/2)
      const sx = W / 2 + x;
      const sy = H / 2 + y;
      const hit = this.add.rectangle(sx, sy, cellW, cellH, 0, 0)
        .setInteractive({ useHandCursor: true }).setDepth(82);
      hits.push(hit);
      hit.on('pointerover', () => this.tweens.add({ targets: chip, scale: 1.04, duration: 120 }));
      hit.on('pointerout', () => this.tweens.add({ targets: chip, scale: 1, duration: 120 }));
      hit.on('pointerdown', () => {
        audio.playClick?.();
        // Free Play is the campaign engine (freePlay), not an arcade mode —
        // clear any arcadeMode left over from a Boss Rush / Endless run.
        this.registry.set('arcadeMode', null);
        this.registry.set('arcadeState', null);
        this.registry.set('freePlay', true);
        this.registry.set('selectedWorld', world.id);
        this.registry.set('shipParkedWorldId', world.id);
        close();
        new TransitionManager(this).fadeToScene('LevelSelectScene');
      });
    });
  }
}
