// Procedural SFX (Web Audio API, no asset files). Background music is a
// separate concern handled by MusicManager — wired here so the global mute
// toggle drives both at once.

import { music } from './MusicManager.js';

export class AudioManager {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.enabled = true;

    // Will be initialized on first user interaction
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();

      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.context.destination);

      this.sfxGain = this.context.createGain();
      this.sfxGain.gain.value = 0.6;
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }

  resume() {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  // Play a simple tone
  playTone(frequency, duration, type = 'sine', gainValue = 0.3, delay = 0) {
    if (!this.enabled || !this.initialized) return;
    this.resume();

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(0, this.context.currentTime + delay);
    gain.gain.linearRampToValueAtTime(gainValue, this.context.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(this.context.currentTime + delay);
    osc.stop(this.context.currentTime + delay + duration);
  }

  // Correct match - happy ascending arpeggio
  playMatch() {
    music.musicDuck();
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.15, 'sine', 0.3, i * 0.08);
    });
  }

  // Wrong answer - soft "oof". Sine wave with a gentle attack and a narrow
  // 220→165 Hz dip; reads as "no" without the buzz of the old sawtooth bwah.
  playWrong() {
    if (!this.enabled || !this.initialized) return;
    this.resume();
    music.musicDuck();
    const t0 = this.context.currentTime;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t0);
    osc.frequency.exponentialRampToValueAtTime(165, t0 + 0.22);

    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.30);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t0);
    osc.stop(t0 + 0.32);
  }

  // Level complete - triumphant fanfare
  playLevelComplete() {
    if (!this.enabled || !this.initialized) return;
    this.resume();

    // Fanfare melody: C-E-G-C (octave up)
    const melody = [
      { freq: 523, time: 0, dur: 0.15 },     // C5
      { freq: 659, time: 0.15, dur: 0.15 },  // E5
      { freq: 784, time: 0.3, dur: 0.15 },   // G5
      { freq: 1047, time: 0.45, dur: 0.4 },  // C6 (held)
    ];

    melody.forEach(note => {
      this.playTone(note.freq, note.dur, 'sine', 0.4, note.time);
      // Add harmony
      this.playTone(note.freq * 1.25, note.dur, 'sine', 0.2, note.time);
    });

    // Sparkle effect
    for (let i = 0; i < 8; i++) {
      const freq = 1200 + Math.random() * 800;
      this.playTone(freq, 0.1, 'sine', 0.15, 0.6 + i * 0.05);
    }
  }

  // Level failed - sad descending tones
  playLevelFailed() {
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.25, 'sine', 0.25, i * 0.2);
    });
  }

  // Button click
  playClick() {
    this.playTone(800, 0.05, 'sine', 0.2);
  }

  // Star earned
  playStar() {
    this.playTone(880, 0.1, 'sine', 0.3);
    this.playTone(1100, 0.15, 'sine', 0.3, 0.1);
  }

  // Timer tick (fires once per second under 5s remaining)
  playTick() {
    this.playTone(1200, 0.06, 'square', 0.18);
  }

  // ============================================================
  // ARCADE SFX — asteroid arcade
  // ============================================================

  // Laser fire on correct answer — quick zappy sweep down.
  playLaser() {
    if (!this.enabled || !this.initialized) return;
    this.resume();

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.context.currentTime + 0.12);

    gain.gain.setValueAtTime(0.22, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.2);
  }

  // One shared white-noise buffer (raw, amplitude 1), generated lazily and
  // reused by every burst. The glitch boss fires _playNoiseBurst on a recurring
  // loop, so re-allocating + Math.random()-filling a buffer per call was needless
  // churn. 2s long and looped at playback, so any burst duration is covered.
  _getNoiseBuffer() {
    if (!this._noiseBuffer || this._noiseBuffer.sampleRate !== this.context.sampleRate) {
      const len = Math.floor(this.context.sampleRate * 2);
      const buf = this.context.createBuffer(1, len, this.context.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this._noiseBuffer = buf;
    }
    return this._noiseBuffer;
  }

  _playNoiseBurst({ duration = 0.35, startOffset = 0, peakGain = 0.3, amplitude = 1, filter = null } = {}) {
    const noise = this.context.createBufferSource();
    noise.buffer = this._getNoiseBuffer();
    noise.loop = true;
    const gain = this.context.createGain();
    const startAt = this.context.currentTime + startOffset;
    // amplitude (previously baked into the buffer samples) folds into the peak.
    gain.gain.setValueAtTime(peakGain * amplitude, startAt);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    if (filter) {
      const f = this.context.createBiquadFilter();
      f.type = filter.type || 'bandpass';
      f.frequency.value = filter.frequency || 1000;
      f.Q.value = filter.Q || 1;
      noise.connect(f);
      f.connect(gain);
    } else {
      noise.connect(gain);
    }
    gain.connect(this.sfxGain);
    noise.start(startAt);
    noise.stop(startAt + duration);
  }

  // Asteroid explosion — noise burst + low rumble + sub-bass reverb tail
  // (~700ms past the burst). Cheaper than a Web Audio convolver and reads
  // as a heavy arcade boom against the ducked music.
  playAsteroidBoom() {
    if (!this.enabled || !this.initialized) return;
    this.resume();
    music.musicDuck();
    const t0 = this.context.currentTime;

    this._playNoiseBurst({ duration: 0.35, peakGain: 0.3 });

    // Low rumble layer
    const osc = this.context.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t0);
    osc.frequency.exponentialRampToValueAtTime(40, t0 + 0.3);
    const oscGain = this.context.createGain();
    oscGain.gain.setValueAtTime(0.35, t0);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + 0.4);

    // Reverb tail — sub-bass sine that fades over ~700ms, giving the boom
    // its "weight" trailing behind the noise transient.
    const tail = this.context.createOscillator();
    tail.type = 'sine';
    tail.frequency.setValueAtTime(55, t0);
    tail.frequency.exponentialRampToValueAtTime(38, t0 + 0.7);
    const tailGain = this.context.createGain();
    tailGain.gain.setValueAtTime(0.001, t0);
    tailGain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.06);
    tailGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.75);
    tail.connect(tailGain);
    tailGain.connect(this.sfxGain);
    tail.start(t0);
    tail.stop(t0 + 0.8);
  }

  // Ship damage — clang + crackle.
  playShipDamage() {
    if (!this.enabled || !this.initialized) return;
    this.resume();

    // Metallic clang: two detuned squares
    const o1 = this.context.createOscillator();
    o1.type = 'square';
    o1.frequency.setValueAtTime(440, this.context.currentTime);
    o1.frequency.exponentialRampToValueAtTime(180, this.context.currentTime + 0.15);
    const g1 = this.context.createGain();
    g1.gain.setValueAtTime(0.25, this.context.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.25);
    o1.connect(g1);
    g1.connect(this.sfxGain);
    o1.start();
    o1.stop(this.context.currentTime + 0.27);

    const o2 = this.context.createOscillator();
    o2.type = 'sawtooth';
    o2.frequency.setValueAtTime(620, this.context.currentTime);
    o2.frequency.exponentialRampToValueAtTime(220, this.context.currentTime + 0.18);
    const g2 = this.context.createGain();
    g2.gain.setValueAtTime(0.18, this.context.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.3);
    o2.connect(g2);
    g2.connect(this.sfxGain);
    o2.start();
    o2.stop(this.context.currentTime + 0.32);
  }

  // Pet chirp — happy little bird-like blip on streaks / good moments.
  playPetChirp() {
    if (!this.enabled || !this.initialized) return;
    this.resume();

    const osc = this.context.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, this.context.currentTime + 0.07);
    osc.frequency.exponentialRampToValueAtTime(1100, this.context.currentTime + 0.13);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.18, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.2);
  }

  // ============================================================
  // BOSS / WORLD-CLEAR SFX
  // ============================================================

  // Boss rumble — a deep, building growl on boss appearance.
  playBossRumble() {
    if (!this.enabled || !this.initialized) return;
    this.resume();

    // Layered low oscillators sweep up then fall — feels heavy and looming.
    const o1 = this.context.createOscillator();
    o1.type = 'sawtooth';
    o1.frequency.setValueAtTime(40, this.context.currentTime);
    o1.frequency.exponentialRampToValueAtTime(70, this.context.currentTime + 0.6);
    o1.frequency.exponentialRampToValueAtTime(35, this.context.currentTime + 1.2);
    const g1 = this.context.createGain();
    g1.gain.setValueAtTime(0.001, this.context.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.4, this.context.currentTime + 0.4);
    g1.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 1.3);
    o1.connect(g1);
    g1.connect(this.sfxGain);
    o1.start();
    o1.stop(this.context.currentTime + 1.4);

    const o2 = this.context.createOscillator();
    o2.type = 'square';
    o2.frequency.setValueAtTime(60, this.context.currentTime + 0.05);
    o2.frequency.exponentialRampToValueAtTime(110, this.context.currentTime + 0.7);
    o2.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 1.2);
    const g2 = this.context.createGain();
    g2.gain.setValueAtTime(0.001, this.context.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.18, this.context.currentTime + 0.4);
    g2.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 1.3);
    o2.connect(g2);
    g2.connect(this.sfxGain);
    o2.start();
    o2.stop(this.context.currentTime + 1.4);

    this._playNoiseBurst({ duration: 0.5, startOffset: 0.2, peakGain: 0.18, amplitude: 0.4 });
  }

  // Boss impact — meaty hit on each boss HP loss.
  playBossImpact() {
    if (!this.enabled || !this.initialized) return;
    this.resume();

    // Heavy thump
    const o1 = this.context.createOscillator();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(160, this.context.currentTime);
    o1.frequency.exponentialRampToValueAtTime(60, this.context.currentTime + 0.18);
    const g1 = this.context.createGain();
    g1.gain.setValueAtTime(0.4, this.context.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.22);
    o1.connect(g1);
    g1.connect(this.sfxGain);
    o1.start();
    o1.stop(this.context.currentTime + 0.25);

    // Bright zap layer (the laser striking)
    const o2 = this.context.createOscillator();
    o2.type = 'square';
    o2.frequency.setValueAtTime(900, this.context.currentTime);
    o2.frequency.exponentialRampToValueAtTime(300, this.context.currentTime + 0.12);
    const g2 = this.context.createGain();
    g2.gain.setValueAtTime(0.2, this.context.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.16);
    o2.connect(g2);
    g2.connect(this.sfxGain);
    o2.start();
    o2.stop(this.context.currentTime + 0.18);
  }

  // World-clear fanfare — bigger, brassier than the round-complete fanfare.
  playWorldClearFanfare() {
    if (!this.enabled || !this.initialized) return;
    this.resume();

    const melody = [
      { freq: 392, time: 0, dur: 0.18 },     // G4
      { freq: 523, time: 0.18, dur: 0.18 },  // C5
      { freq: 659, time: 0.36, dur: 0.18 },  // E5
      { freq: 784, time: 0.54, dur: 0.18 },  // G5
      { freq: 1047, time: 0.72, dur: 0.6 }   // C6 (held)
    ];
    melody.forEach(note => {
      this.playTone(note.freq, note.dur, 'triangle', 0.4, note.time);
      this.playTone(note.freq * 0.5, note.dur, 'sine', 0.22, note.time);
      this.playTone(note.freq * 1.5, note.dur, 'sine', 0.16, note.time);
    });
    // Long sparkle tail
    for (let i = 0; i < 14; i++) {
      const freq = 1200 + Math.random() * 1200;
      this.playTone(freq, 0.12, 'sine', 0.12, 0.9 + i * 0.06);
    }
  }

  // Round-over fanfare (timed sprint complete)
  playRoundComplete() {
    if (!this.enabled || !this.initialized) return;
    this.resume();

    const melody = [
      { freq: 523, time: 0, dur: 0.18 },     // C5
      { freq: 659, time: 0.18, dur: 0.18 },  // E5
      { freq: 784, time: 0.36, dur: 0.18 },  // G5
      { freq: 1047, time: 0.54, dur: 0.45 }  // C6
    ];

    melody.forEach(note => {
      this.playTone(note.freq, note.dur, 'sine', 0.35, note.time);
      this.playTone(note.freq * 1.25, note.dur, 'sine', 0.18, note.time);
    });
  }

  playGlitchStatic({ duration = 0.18, peakGain = 0.10 } = {}) {
    if (!this.enabled || !this.initialized) return;
    this.resume();
    this._playNoiseBurst({
      duration, peakGain,
      filter: { type: 'bandpass', frequency: 2200 + Math.random() * 1600, Q: 1.4 }
    });
  }

  // Stardust counter tick — short bright blip during count-up animation.
  playStardustTick() {
    if (!this.enabled || !this.initialized) return;
    this.resume();
    this.playTone(1400 + Math.random() * 200, 0.05, 'sine', 0.10);
  }

  // Stardust chime — small resolved chord when count finishes.
  playStardustChime() {
    if (!this.enabled || !this.initialized) return;
    this.resume();
    this.playTone(880, 0.18, 'sine', 0.22, 0);
    this.playTone(1320, 0.20, 'sine', 0.18, 0.04);
    this.playTone(1760, 0.24, 'triangle', 0.12, 0.08);
  }

  // Boss intro slam — heavy boom + low rumble for the Borderlands card.
  playBossIntroSlam() {
    if (!this.enabled || !this.initialized) return;
    this.resume();
    // Sub-bass thump
    const o1 = this.context.createOscillator();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(80, this.context.currentTime);
    o1.frequency.exponentialRampToValueAtTime(35, this.context.currentTime + 0.40);
    const g1 = this.context.createGain();
    g1.gain.setValueAtTime(0.55, this.context.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.45);
    o1.connect(g1); g1.connect(this.sfxGain);
    o1.start(); o1.stop(this.context.currentTime + 0.5);

    // Mid metallic clang
    const o2 = this.context.createOscillator();
    o2.type = 'square';
    o2.frequency.setValueAtTime(220, this.context.currentTime);
    o2.frequency.exponentialRampToValueAtTime(110, this.context.currentTime + 0.18);
    const g2 = this.context.createGain();
    g2.gain.setValueAtTime(0.20, this.context.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.22);
    o2.connect(g2); g2.connect(this.sfxGain);
    o2.start(); o2.stop(this.context.currentTime + 0.24);

    this._playNoiseBurst?.({ duration: 0.35, startOffset: 0, peakGain: 0.18, amplitude: 0.5 });
  }

  // Hyperspace warp — used when the warp asteroid is solved and the kid is
  // pulled into Glitch World / Dad's Garage. Three layers: a rising whoosh
  // (sub-bass climbing to a high siren), filtered noise sweeping up like
  // wind past the ship, and a final shimmer pop at the punch-out.
  playWarp() {
    if (!this.enabled || !this.initialized) return;
    this.resume();
    const t0 = this.context.currentTime;

    // Whoosh layer — sawtooth swept 90Hz → 1400Hz, with a long tail.
    const o1 = this.context.createOscillator();
    o1.type = 'sawtooth';
    o1.frequency.setValueAtTime(90, t0);
    o1.frequency.exponentialRampToValueAtTime(1400, t0 + 0.85);
    const g1 = this.context.createGain();
    g1.gain.setValueAtTime(0.001, t0);
    g1.gain.exponentialRampToValueAtTime(0.30, t0 + 0.25);
    g1.gain.exponentialRampToValueAtTime(0.05, t0 + 0.95);
    g1.gain.exponentialRampToValueAtTime(0.001, t0 + 1.20);
    o1.connect(g1); g1.connect(this.sfxGain);
    o1.start(t0); o1.stop(t0 + 1.25);

    // Air-rush layer — wide bandpass noise sweeping up.
    const buffSize = Math.floor(this.context.sampleRate * 1.2);
    const buff = this.context.createBuffer(1, buffSize, this.context.sampleRate);
    const data = buff.getChannelData(0);
    for (let i = 0; i < buffSize; i++) data[i] = (Math.random() * 2 - 1) * 0.7;
    const noise = this.context.createBufferSource();
    noise.buffer = buff;
    const filt = this.context.createBiquadFilter();
    filt.type = 'bandpass';
    filt.Q.value = 1.4;
    filt.frequency.setValueAtTime(400, t0);
    filt.frequency.exponentialRampToValueAtTime(4200, t0 + 0.85);
    const ng = this.context.createGain();
    ng.gain.setValueAtTime(0.001, t0);
    ng.gain.exponentialRampToValueAtTime(0.20, t0 + 0.30);
    ng.gain.exponentialRampToValueAtTime(0.001, t0 + 1.15);
    noise.connect(filt); filt.connect(ng); ng.connect(this.sfxGain);
    noise.start(t0); noise.stop(t0 + 1.20);

    // Punch-out shimmer — bright triangle stab at the top of the climb.
    const o2 = this.context.createOscillator();
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(1800, t0 + 0.80);
    o2.frequency.exponentialRampToValueAtTime(2600, t0 + 1.00);
    const g2 = this.context.createGain();
    g2.gain.setValueAtTime(0.001, t0 + 0.80);
    g2.gain.exponentialRampToValueAtTime(0.18, t0 + 0.90);
    g2.gain.exponentialRampToValueAtTime(0.001, t0 + 1.20);
    o2.connect(g2); g2.connect(this.sfxGain);
    o2.start(t0 + 0.80); o2.stop(t0 + 1.25);
  }

  // Evolution buildup — soft ascending shimmer.
  playEvolutionBuildup() {
    if (!this.enabled || !this.initialized) return;
    this.resume();
    const t0 = this.context.currentTime;
    // Slow ascending sine sweep
    const o = this.context.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(220, t0);
    o.frequency.exponentialRampToValueAtTime(880, t0 + 1.4);
    const g = this.context.createGain();
    g.gain.setValueAtTime(0.001, t0);
    g.gain.exponentialRampToValueAtTime(0.18, t0 + 1.0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 1.5);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t0); o.stop(t0 + 1.55);

    // Sparkle layer climbing
    for (let i = 0; i < 6; i++) {
      this.playTone(880 + i * 220, 0.18, 'sine', 0.10, 0.15 * i);
    }
  }

  // Evolution flash — bright sting at the moment of transformation.
  playEvolutionFlash() {
    if (!this.enabled || !this.initialized) return;
    this.resume();
    music.musicDuck();
    const t0 = this.context.currentTime;
    // Bright triangle stab
    const o1 = this.context.createOscillator();
    o1.type = 'triangle';
    o1.frequency.setValueAtTime(2200, t0);
    o1.frequency.exponentialRampToValueAtTime(1400, t0 + 0.18);
    const g1 = this.context.createGain();
    g1.gain.setValueAtTime(0.30, t0);
    g1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5);
    o1.connect(g1); g1.connect(this.sfxGain);
    o1.start(t0); o1.stop(t0 + 0.55);

    // Reverb tail (sine at lower octave)
    const o2 = this.context.createOscillator();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(880, t0);
    const g2 = this.context.createGain();
    g2.gain.setValueAtTime(0.001, t0);
    g2.gain.exponentialRampToValueAtTime(0.20, t0 + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.9);
    o2.connect(g2); g2.connect(this.sfxGain);
    o2.start(t0); o2.stop(t0 + 0.95);
  }

  // Evolution resolve — soft major chord landing on the title card.
  playEvolutionResolve() {
    if (!this.enabled || !this.initialized) return;
    this.resume();
    // C major triad held + a high sparkle on top
    [523, 659, 784, 1047].forEach((freq, i) => {
      this.playTone(freq, 1.4, 'sine', 0.20 - i * 0.02, i * 0.05);
    });
    // Sparkle tail
    for (let i = 0; i < 8; i++) {
      this.playTone(1600 + Math.random() * 1200, 0.18, 'sine', 0.10, 0.4 + i * 0.08);
    }
  }

  // SFX on/off only — does NOT touch music. Used by the independent "Sound"
  // toggle in Settings and the pause menu, where Music has its own toggle.
  setEnabled(enabled) {
    this.enabled = !!enabled;
    return this.enabled;
  }

  // Master mute for the standalone speaker icons (LevelSelect, Parent Dashboard):
  // flips SFX and forces music to match, so one tap silences — or restores — all
  // audio. Granular Sound/Music control lives in Settings and the pause menu.
  toggleEnabled() {
    // Master toggle: flip SFX through the canonical setter, then mirror to music
    // so the enable-flag mutation lives in exactly one place (setEnabled).
    this.setEnabled(!this.enabled);
    music.setEnabled(this.enabled);
    return this.enabled;
  }
}

// Singleton instance
export const audio = new AudioManager();
