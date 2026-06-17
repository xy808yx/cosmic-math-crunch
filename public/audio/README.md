# Soundtrack assets

Drop MP3s in this folder (`public/audio/`). They're git-tracked; commit + push and
the GitHub Pages Action serves them — no build step needed.

Tracks must **loop seamlessly** (Suno songs have intros — generate, then trim/
crossfade a clean ~90–120s loop in Audacity). Instrumental only (wordless choir/
"oohs" OK, no lead vocals). Keep peaks consistent and un-clipped — they play at
0.35 game volume. Until a file exists, Inner Space falls back to the Chapter 1
themes, so it's never silent.

## Chapter 1 (present)
home-theme.mp3 · levels.mp3 · boss-fight.mp3 · dads-garage.mp3 · credits.mp3

## Chapter 2 "Inner Space" — STILL NEEDED (4 tracks)

Aesthetic: **Chrono Trigger** (Yasunori Mitsuda / Nobuo Uematsu, SNES SPC) — melody-
forward, lush sampled orchestra, the same era/idiom as the Chapter 1 music. Suno
tends to filter explicit artist/game names; the descriptive tags below get the sound.

### 1. `inner-space-home.mp3` → key `innerSpaceHome`  (Ch2 map / overworld)
Style box:
`16-bit SNES JRPG overworld theme, SPC sampled orchestra, dreamy, swaying 12/8 lilt, harp and celesta arpeggios, tender pan flute and oboe lead, lush warm strings, soft wordless choir, slow heartbeat pulse, serene nostalgic wonder, instrumental, ~78 BPM`

### 2. `inner-space-level.mp3` → key `innerSpaceLevel`  (Ch2 gameplay; game pitch-shifts ±1 semitone)
Produce at a NEUTRAL key/tempo (the engine re-pitches it per world).
Style box:
`16-bit SNES JRPG field exploration theme, sampled orchestra, bouncy marimba and pizzicato groove, light hand percussion, plucky ocarina/recorder lead over warm strings, steady heartbeat pulse, hopeful curious adventure, instrumental, ~104 BPM`

### 3. `inner-space-boss.mp3` → key `innerSpaceBoss`  (Ch2 bosses; speeds up for W17 & W28)
Leave headroom — the engine ramps tempo up in the final HP third.
Style box:
`16-bit SNES JRPG boss battle theme, driving prog-rock organ, gritty synth bass, fast tremolo strings, stabbing brass, pounding tribal toms, ominous wordless choir swells, dark minor key, dramatic and tense, instrumental, ~140 BPM`

### 4. `playground.mp3` → key `playgroundTheme`  (Recess / Playground)
The warm earthbound OPPOSITE of the micro-world.
Style box:
`16-bit SNES JRPG nostalgic hometown theme, gentle piano and fingerpicked acoustic guitar, soft warm strings, tender music-box/celesta countermelody, wistful bittersweet golden-afternoon memory, cozy, instrumental, ~76 BPM`

> King Coli (secret boss, W17) needs no track — it reuses `inner-space-boss` pitched up.
