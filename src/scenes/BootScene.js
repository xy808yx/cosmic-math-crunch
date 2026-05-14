import Phaser from 'phaser';
import { style } from '../textStyles.js';
import { companion, drawCompanion } from '../CompanionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { audio } from '../AudioManager.js';
import { music } from '../MusicManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { COLORS } from '../colorPalette.js';

const W = 1080;
const H = 1920;

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Audio map (filename → role):
    //   home-theme.mp3 → home/menu theme (boot, world map, shop, etc.)
    //   levels.mp3     → regular gameplay + endless mode
    //   boss-fight.mp3 → all boss fights (regular bosses, Glitch Datamosh, Boss Rush)
    //   credits.mp3    → end credits cinematic
    //   dads-garage.mp3 → warm garage ambience
    this.load.audio('homeTheme',   'audio/home-theme.mp3');
    this.load.audio('creditsSong', 'audio/credits.mp3');
    // Optional tracks — gated on a HEAD check so missing files don't spam
    // the console with audio-decode errors (Vite serves index.html for unknown
    // paths, which Phaser then tries to decode as audio).
    this._maybeLoadAudio('levelTheme', 'audio/levels.mp3');
    this._maybeLoadAudio('bossTheme',  'audio/boss-fight.mp3');
    this._maybeLoadAudio('dadsGarage', 'audio/dads-garage.mp3');

    this.loadingText = this.add.text(W / 2, H / 2, 'Loading…', style('headline', {
      fontSize: '54px',
      fill: '#cfcfe0'
    })).setOrigin(0.5);
  }

  _maybeLoadAudio(key, url) {
    // Synchronous existence + content-type check via XHR HEAD. Keeps preload
    // synchronous (Phaser's loader needs it that way) while avoiding the
    // decode-error spew for missing files.
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('HEAD', url, false);
      xhr.send(null);
      const ct = xhr.getResponseHeader('Content-Type') || '';
      if (xhr.status >= 200 && xhr.status < 300 && /audio\//i.test(ct)) {
        this.load.audio(key, url);
      } else {
        console.info(`[boot] skipping optional audio "${key}" (file not provided)`);
      }
    } catch (e) {
      console.info(`[boot] skipping optional audio "${key}" (probe failed)`);
    }
  }

  create() {
    if (this.loadingText) {
      this.loadingText.destroy();
      this.loadingText = null;
    }

    createStarfield(this, { width: W, height: H, accentStrength: 0.15 });

    this.add.text(W / 2, 560, 'COSMIC MATH', style('display', {
      fontSize: '120px',
      fill: '#ffffff',
      stroke: '#0a0a1a',
      strokeThickness: 6
    })).setOrigin(0.5);

    this.add.text(W / 2, 660, 'A space adventure for the cosmic crew', style('caption', {
      fontSize: '30px',
      fill: '#a7f3d0'
    })).setOrigin(0.5);

    if (companion.hasStarter()) {
      const sp = companion.getSpecies();
      const haloColor = sp ? sp.accent : COLORS.accentPurple;
      const halo = this.add.graphics();
      halo.fillStyle(haloColor, 0.18);
      halo.fillCircle(W / 2, 1020, 220);
      halo.fillStyle(haloColor, 0.10);
      halo.fillCircle(W / 2, 1020, 300);

      const pet = drawCompanion(this, W / 2, 1020, { scale: 2.0 });
      this.tweens.add({
        targets: pet,
        y: 1004,
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    const prompt = this.add.text(W / 2, 1400, 'Tap anywhere to start', style('subhead', {
      fontSize: '46px',
      fill: '#fbbf24',
      stroke: '#0a0a1a',
      strokeThickness: 3
    })).setOrigin(0.5);
    this.tweens.add({
      targets: prompt,
      alpha: { from: 1, to: 0.45 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const hit = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    let consumed = false;
    hit.on('pointerdown', () => {
      if (consumed) return;
      consumed = true;

      audio.init();
      music.ensurePlaying(this);
      audio.playClick?.();

      const target = companion.hasStarter() ? 'WorldMapScene' : 'StarterPickerScene';
      new TransitionManager(this).fadeToScene(target);
    });
  }
}
