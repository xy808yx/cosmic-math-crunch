// Parent / dev menu. Hidden behind a long-press + corner-tap combo from the
// world map (see WorldMapScene). Lets Dad: replay the endgame credits, jump
// to any world, unlock cosmetics, reset progress.

import Phaser from 'phaser';
import { progress, HIDDEN_WORLDS } from '../GameData.js';
import { audio } from '../AudioManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { style } from '../textStyles.js';
import { createButton } from '../buttonHelper.js';
import { createModal } from '../modalHelper.js';

const W = 1080;
const H = 1920;

export class DevMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DevMenuScene' });
  }

  create() {
    audio.init();
    createStarfield(this, { width: W, height: H, accentColor: 0xff00ff, accentStrength: 0.18 });

    this.add.text(W / 2, 140, "DAD'S MENU", style('display', {
      fontSize: '60px',
      fill: '#ff00ff',
      stroke: '#0a0a1a',
      strokeThickness: 4
    })).setOrigin(0.5);

    this.add.text(W / 2, 220, '(shh — kids can\'t see this)', style('caption', {
      fontSize: '22px',
      fill: '#9a9aae'
    })).setOrigin(0.5);

    const buttons = [
      {
        label: 'Replay endgame credits',
        color: 0xfbbf24,
        onClick: () => {
          progress.resetEndingSeen();
          new TransitionManager(this).fadeToScene('CreditsScene');
        }
      },
      {
        label: 'Open Arcade menu',
        color: 0x4ecdc4,
        onClick: () => new TransitionManager(this).fadeToScene('ArcadeMenuScene')
      },
      {
        label: 'Mark hidden worlds discovered',
        color: 0x39ff14,
        onClick: () => {
          for (const h of HIDDEN_WORLDS) progress.discoverHiddenWorld(h.id);
          this.flashToast('Hidden worlds revealed.');
        }
      },
      {
        label: 'Unlock all visible worlds',
        color: 0x10b981,
        onClick: () => {
          progress.unlockAllVisibleWorlds();
          this.flashToast('All worlds unlocked.');
        }
      },
      {
        label: 'Reset progress (confirm)',
        color: 0xc44b5e,
        onClick: () => this.confirmReset()
      },
      {
        label: 'Back to map',
        color: 0x4a4a6a,
        onClick: () => new TransitionManager(this).fadeToScene('WorldMapScene')
      }
    ];

    const startY = 380;
    const gap = 130;
    buttons.forEach((b, i) => {
      createButton(this, {
        x: W / 2, y: startY + i * gap,
        label: b.label,
        width: 680, height: 100,
        color: b.color,
        textOverrides: { fontSize: '28px', fill: '#0a0a1a', fontStyle: '900' },
        onClick: () => { audio.playClick?.(); b.onClick(); }
      });
    });

    new TransitionManager(this).fadeIn(260);
  }

  flashToast(text) {
    const toast = this.add.container(W / 2, H - 200).setDepth(70);
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a, 0.95);
    bg.fillRoundedRect(-260, -36, 520, 72, 16);
    bg.lineStyle(2, 0xff00ff, 0.95);
    bg.strokeRoundedRect(-260, -36, 520, 72, 16);
    toast.add(bg);
    toast.add(this.add.text(0, 0, text, style('subhead', {
      fontSize: '26px',
      fill: '#ff00ff'
    })).setOrigin(0.5));
    toast.alpha = 0;
    this.tweens.add({ targets: toast, alpha: 1, duration: 200 });
    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: toast,
        alpha: 0,
        duration: 400,
        onComplete: () => toast.destroy()
      });
    });
  }

  confirmReset() {
    const { card, close } = createModal(this, {
      width: 720, height: 420,
      accentColor: 0xc44b5e,
      showCloseHint: false
    });
    card.add(this.add.text(0, -130, 'Wipe ALL progress?', style('display', {
      fontSize: '40px',
      fill: '#ffffff'
    })).setOrigin(0.5));
    card.add(this.add.text(0, -60, 'Stars, worlds, pet, ship, cosmetics — all gone.', style('caption', {
      fontSize: '22px',
      fill: '#cfcfe0',
      align: 'center'
    })).setOrigin(0.5));
    card.add(createButton(this, {
      x: -120, y: 100, label: 'Cancel',
      width: 200, height: 84,
      color: 0x4a4a6a,
      onClick: close
    }));
    card.add(createButton(this, {
      x: 120, y: 100, label: 'WIPE',
      width: 200, height: 84,
      color: 0xc44b5e,
      onClick: () => {
        progress.resetAll();
        close();
        this.flashToast('Progress wiped.');
        this.time.delayedCall(800, () => {
          new TransitionManager(this).fadeToScene('BootScene');
        });
      }
    }));
  }
}
