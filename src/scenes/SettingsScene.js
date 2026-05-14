// Kid-facing settings panel — unified Sound + Music toggles. Reached from the
// WorldMap top-bar (parent controls live in ParentDashboardScene). Kept small
// and direct so the toggles are reachable in one tap.

import Phaser from 'phaser';
import { audio } from '../AudioManager.js';
import { music } from '../MusicManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { createIconButton, createButton } from '../buttonHelper.js';
import { style } from '../textStyles.js';
import { drawArrowLeftIcon, drawSoundIcon } from '../StatIcons.js';
import { COLORS } from '../colorPalette.js';

const W = 1080;
const H = 1920;

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SettingsScene' });
  }

  create() {
    audio.init();
    music.ensurePlaying(this);
    createStarfield(this, { width: W, height: H, accentStrength: 0 });

    // Header
    const bg = this.add.graphics().setDepth(10);
    bg.fillStyle(COLORS.bgDark, 0.95);
    bg.fillRect(0, 0, W, 160);

    createIconButton(this, {
      x: 90, y: 80, radius: 38,
      accentColor: COLORS.accentTeal,
      drawIcon: (g, size) => drawArrowLeftIcon(g, 0, 0, size),
      onClick: () => {
        audio.playClick();
        new TransitionManager(this).fadeToScene('WorldMapScene');
      }
    }).setDepth(15);

    this.add.text(W / 2, 80, 'SETTINGS', style('display', {
      fontSize: '54px',
      fill: '#b6e0ff'
    })).setOrigin(0.5).setDepth(14);

    // Card panel housing the toggles
    const cardX = W / 2;
    const cardY = H / 2 - 100;
    const cardW = 760;
    const cardH = 540;
    const card = this.add.graphics().setDepth(11);
    card.fillStyle(COLORS.bgPanel, 0.95);
    card.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 24);
    card.lineStyle(3, 0xb6e0ff, 0.7);
    card.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 24);

    this.add.text(cardX, cardY - cardH / 2 + 60, 'AUDIO', style('subhead', {
      fontSize: '32px',
      fill: '#ffffff',
      fontStyle: '900'
    })).setOrigin(0.5).setDepth(12);

    this.soundBtn = null;
    this.musicBtn = null;
    this.renderToggles(cardX, cardY);

    // Hint about per-game pause menu — kids should know that's there too.
    this.add.text(W / 2, cardY + cardH / 2 + 60, 'You can also toggle these from the pause button during a level.', style('caption', {
      fontSize: '20px',
      fill: '#9a9aae',
      align: 'center',
      wordWrap: { width: 800 }
    })).setOrigin(0.5).setDepth(11);

    new TransitionManager(this).fadeIn(280);
  }

  renderToggles(cardX, cardY) {
    if (this.soundBtn) this.soundBtn.destroy();
    if (this.musicBtn) this.musicBtn.destroy();

    this.soundBtn = createButton(this, {
      x: cardX, y: cardY - 40,
      width: 540, height: 110,
      label: `Sound: ${audio.enabled ? 'ON' : 'OFF'}`,
      color: audio.enabled ? 0xb6e0ff : 0x4a4a5a,
      textOverrides: { fontSize: '34px', fill: '#0a0a1a', fontStyle: '900' },
      onClick: () => {
        audio.toggleEnabled?.();
        this.renderToggles(cardX, cardY);
      }
    });
    this.soundBtn.setDepth(13);

    this.musicBtn = createButton(this, {
      x: cardX, y: cardY + 100,
      width: 540, height: 110,
      label: `Music: ${music.enabled ? 'ON' : 'OFF'}`,
      color: music.enabled ? 0xc77eff : 0x4a4a5a,
      textOverrides: { fontSize: '34px', fill: '#0a0a1a', fontStyle: '900' },
      onClick: () => {
        music.setEnabled?.(!music.enabled);
        this.renderToggles(cardX, cardY);
      }
    });
    this.musicBtn.setDepth(13);
  }
}
