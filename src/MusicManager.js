// Background music manager. Wraps Phaser's global sound manager so looping
// tracks persist across scenes, share the mute state of AudioManager, and
// can be swapped per-scene (home theme on the map, hidden-world themes in
// Glitch World / Dad's Garage).

class MusicManager {
  constructor() {
    this.tracks = {};        // key -> Phaser sound instance
    this.enabled = true;
    this.volume = 0.35;
    this.currentKey = null;  // last-requested track key
  }

  // Ensure `key` is the actively playing track. If a different track is
  // playing, it's stopped first. Missing audio (file not provided yet) is
  // a quiet no-op rather than a crash.
  ensurePlaying(scene, key = 'homeTheme') {
    if (!scene.cache.audio.exists(key)) {
      if (this.currentKey && this.currentKey !== key) this._stopCurrent();
      this.currentKey = key;
      return;
    }

    if (this.currentKey && this.currentKey !== key) this._stopCurrent();

    if (!this.tracks[key]) {
      this.tracks[key] = scene.sound.add(key, { loop: true, volume: this.volume });
      this._applyMuteToTrack(this.tracks[key]);
    }
    const t = this.tracks[key];
    if (t.isPaused) t.resume();
    else if (!t.isPlaying) t.play();
    this.currentKey = key;
  }

  pause() {
    if (!this.currentKey) return;
    const t = this.tracks[this.currentKey];
    if (t && t.isPlaying) t.pause();
  }

  // Set the current music's playback rate. `rate` is a multiplier on the
  // base sample rate — 1.0 = unchanged, 1.0595 ≈ +1 semitone, 0.8909 ≈ −2.
  // If `durationMs > 0`, smoothly ramps via Web Audio's playbackRate AudioParam
  // on the current source node; otherwise jumps instantly.
  //
  // No-op if no music is playing or the active sound is HTML5Audio (no
  // playbackRate AudioParam).
  setPlaybackRate(rate, durationMs = 0) {
    if (!this.currentKey) return;
    const t = this.tracks[this.currentKey];
    if (!t) return;

    const src = t.source;
    const hasAudioParam = src && src.playbackRate && src.context;

    if (!hasAudioParam || durationMs <= 0) {
      // Instant change via Phaser's API. setRate exists in 3.x; fall back to
      // the property setter otherwise.
      if (typeof t.setRate === 'function') t.setRate(rate);
      else t.rate = rate;
      return;
    }

    try {
      const ctx = src.context;
      const now = ctx.currentTime;
      src.playbackRate.cancelScheduledValues(now);
      src.playbackRate.setValueAtTime(src.playbackRate.value, now);
      src.playbackRate.linearRampToValueAtTime(rate, now + durationMs / 1000);
      t.rate = rate; // keep Phaser's view of the property in sync
    } catch (e) {
      // Graceful no-op (HTML5Audio fallback, unsupported impls).
      try { t.rate = rate; } catch (_) {}
    }
  }

  // Immediately set the current music's playback volume to `base * multiplier`.
  // Used by the boot intro to start at 30% before ramping to full. No-op if
  // no music is playing or the active sound has no WebAudio volumeNode.
  setVolume(multiplier = 1) {
    if (!this.currentKey) return;
    const t = this.tracks[this.currentKey];
    if (!t || !t.volumeNode || !t.volumeNode.context) return;
    try {
      const ctx = t.volumeNode.context;
      const now = ctx.currentTime;
      t.volumeNode.gain.cancelScheduledValues(now);
      t.volumeNode.gain.setValueAtTime(this.volume * multiplier, now);
    } catch (e) { /* graceful no-op */ }
  }

  // Linearly ramp the current music's volume to `base * multiplier` over
  // `durationMs`. Used by the boot intro to fade from 30% → 100% on exit.
  fadeVolume(multiplier = 1, durationMs = 400) {
    if (!this.currentKey) return;
    const t = this.tracks[this.currentKey];
    if (!t || !t.volumeNode || !t.volumeNode.context) return;
    try {
      const ctx = t.volumeNode.context;
      const now = ctx.currentTime;
      t.volumeNode.gain.cancelScheduledValues(now);
      t.volumeNode.gain.setValueAtTime(t.volumeNode.gain.value, now);
      t.volumeNode.gain.linearRampToValueAtTime(this.volume * multiplier, now + durationMs / 1000);
    } catch (e) { /* graceful no-op */ }
  }

  // Gently dip music volume under a foreground SFX so the SFX punches through.
  // Drops to `current * (1 - amount)` over ~40ms, holds for the middle of the
  // window, restores over ~40ms. Re-triggering before the ramp finishes cancels
  // the pending schedule and starts a fresh duck — back-to-back SFX read as one
  // sustained dip rather than a bouncing volume.
  //
  // No-op if no music is playing or the active sound exposes no WebAudio
  // volumeNode (e.g. HTML5Audio fallback on some browsers).
  musicDuck(amount = 0.25, durationMs = 150) {
    if (!this.currentKey) return;
    const t = this.tracks[this.currentKey];
    if (!t || (!t.isPlaying && !t.isPaused)) return;

    const gainNode = t.volumeNode;
    if (!gainNode || !gainNode.gain || !gainNode.context) return;

    const ctx = gainNode.context;
    const now = ctx.currentTime;
    const baseVol = this.volume;
    const duckedVol = Math.max(0, baseVol * (1 - amount));
    const rampS = 0.04;
    const holdS = Math.max(0, durationMs / 1000 - rampS * 2);

    try {
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(duckedVol, now + rampS);
      gainNode.gain.setValueAtTime(duckedVol, now + rampS + holdS);
      gainNode.gain.linearRampToValueAtTime(baseVol, now + rampS + holdS + rampS);
    } catch (e) {
      // Graceful no-op on unsupported audio implementations.
    }
  }

  _stopCurrent() {
    const cur = this.tracks[this.currentKey];
    if (cur && (cur.isPlaying || cur.isPaused)) cur.stop();
  }

  setEnabled(bool) {
    this.enabled = bool;
    for (const t of Object.values(this.tracks)) this._applyMuteToTrack(t);
  }

  // Phaser 3.90's WebAudioSound.mute setter uses setValueAtTime(_, 0), which
  // is silently ignored by Chrome once the audio context has been running past
  // time zero. Writing the gain node value directly is the reliable workaround.
  _applyMuteToTrack(t) {
    if (t && t.muteNode) t.muteNode.gain.value = this.enabled ? 1 : 0;
  }
}

export const music = new MusicManager();
