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

## Chapter 2 "Inner Space" (present)

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

## Chapter 3 "Home Ground" → STILL NEEDED (4 tracks)

Aesthetic: the **homecoming** chapter, now one family Saturday around the city:
the grocery store in the morning, the big garden, the mall in the rain, the beach,
the big store, the bread place, the seawall at golden hour, and the mountain at
dusk as the lights come on. Same 16-bit SNES JRPG idiom as Ch1/Ch2, but sunlit,
contented and unhurried: errands, not battles. Until each file exists, Home Ground
falls back to the Chapter 1 home/level/boss themes (resolveTrack), so it's never
silent.

### 1. `home-ground-home.mp3` → key `homeGroundHome`  (Ch3 map / overworld)
Loop seamlessly, no lead vocals.
Style box:
`16-bit SNES JRPG hometown Saturday-morning theme, sunlit, gentle music-box and celesta, warm fingerpicked acoustic guitar, soft strings, light shaker and woodblock like a walk to the store, contented and unhurried, instrumental, ~80 BPM`

### 2. `home-ground-level.mp3` → key `homeGroundLevel`  (Ch3 belt; the engine re-pitches it per world)
Produce at a NEUTRAL key/tempo (the engine re-pitches it per world).
Style box:
`16-bit SNES JRPG errand-day groove, bouncy marimba and pizzicato, plucky clarinet lead, light hand percussion with a checkout-beep feel, cheerful and busy but never tense, instrumental, ~108 BPM`

### 3. `home-ground-boss.mp3` → key `homeGroundBoss`  (Ch3 rush orders + the W38 finale; engine may re-pitch)
NOT a monster fight: a deadline, not a battle. Urgent but POSITIVE. Leave headroom
for the engine's pitch changes.
Style box:
`16-bit SNES JRPG upbeat time-pressure theme, driving marimba and warm brass, busy hand percussion, rising build like the last gondola before dark, exciting and positive, a deadline not a battle, instrumental, ~146 BPM`

### 4. `hot-pot.mp3` → key `hotPotTheme`  (the hidden Hot Pot Time room, W19)
The Chapter 3 counterpart to `dads-garage` and `playground`: a secret room has its own
theme, not the chapter's. Warm and communal rather than industrious — a full table, not
a workbench. Until this file exists the room falls back to the garage track.
Style box:
`16-bit SNES JRPG warm gathering-place theme, bustling but cozy, plucked strings and gentle woodblock, mellow flute and clarinet trading a simple melody, soft hand percussion, steam-and-chatter warmth, generous and unhurried, instrumental, ~84 BPM`

> The W38 finale (The Mountain) reuses `home-ground-boss` (pitched per world); the
> homecoming credits cinematic reuses `creditsSong`. The hidden Night Shift (W20)
> deliberately reuses `home-ground-boss` too: it is a deadline, not a new place.
