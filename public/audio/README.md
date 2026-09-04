# Soundtrack assets

Drop MP3s in this folder (`public/audio/`). They're git-tracked; commit + push and
the GitHub Pages Action serves them, no build step needed. Until a file exists the
game falls back to an earlier track (see each entry), so nothing is ever silent.

## How to generate in Suno (read this first)

The Instrumental TOGGLE is what keeps vocals out. The word "instrumental" inside the
style box is only a hint. Simple mode with no toggle hands the description to an
automatic lyric writer, which is how the Sept 2026 Chapter 3 attempts came back sung.
The three Chapter 1 tracks that came out clean carry `lyrics-eng=[Instrumental]` in
their ID3 tags, so they were made with the toggle on.

1. Create > Custom mode (not Simple).
2. Instrumental toggle ON. Re-check it on every single generation.
3. Style box: paste the exact box below, nothing else.
4. Advanced Options > Exclude Styles:
   `vocals, choir, humming, vocal chops, lo-fi hip hop, EDM, cinematic, anime`
5. Style Influence about 80%, Weirdness about 30%.
6. Title: the target filename, so the download is already named.
7. Newest model you have (v4.5+ or later). On v5.5 web, set the Duration slider to
   roughly 75 to 90 s.
8. Generate two takes; keep the one that starts at full level and holds its tempo.

Words that pull vocals or the wrong genre, never put them in a style box: choir (even
"wordless choir"), chorus, theme / theme song, catchy, anthem, ballad, call and
response, harmonies, epic, cinematic, trailer, heroic, boss battle, orchestral (as a
genre), lo-fi (as a word), muffled, driving beat, and any "no ..." negation (negatives
go in Exclude Styles only). Real game, composer, place and business names can hard-fail
moderation; "SNES" has passed every time so far.

## File spec (matches the nine shipped tracks)

Stereo MP3, 44.1 or 48 kHz, 128 to 200 kbps, 60 to 110 s. Starts at full level on the
downbeat (every scene restarts the file from sample 0 under a 500 ms fade-in). Ends
clean with at most a 1 to 2 s ring-out (Phaser loops sample-to-sample with no
crossfade). Loudness about -13.5 LUFS integrated, true peak at or below -1.5 dBFS,
loudness range 2 to 4 LU: the game plays music at 0.35 and ducks it 25% on every
answer, so quiet passages vanish. None of the nine shipped files were trimmed in an
editor; they went in as downloaded. Plan on the same.

Two sound worlds, measured on the shipped files. The intense group (boss-fight,
levels, dads-garage, credits, inner-space-*) is bright and full-band out to 8 kHz at
roughly 140 to 150 BPM. The cozy group (home-theme, playground) is heavily rolled off,
99% of its energy below about 1.5 kHz, sparse and slow at 72 to 76 BPM. Cozy in this
soundtrack means dark and rounded, not just slow.

## Chapter 1 (present)
home-theme.mp3 · levels.mp3 · boss-fight.mp3 · dads-garage.mp3 · credits.mp3

## Chapter 2 "Inner Space" (present)

Aesthetic: **Chrono Trigger** (Yasunori Mitsuda / Nobuo Uematsu, SNES SPC): melody-
forward, lush sampled orchestra, the same era/idiom as the Chapter 1 music. Suno
tends to filter explicit artist/game names; the descriptive tags below get the sound.
These four boxes produced the shipped files (with the Instrumental toggle on). Do not
copy their "wordless choir" wording forward; see the banned-word list above.

### 1. `inner-space-home.mp3` → key `innerSpaceHome`  (Ch2 map / overworld)
Style box:
`16-bit SNES JRPG overworld theme, SPC sampled orchestra, dreamy, swaying 12/8 lilt, harp and celesta arpeggios, tender pan flute and oboe lead, lush warm strings, soft wordless choir, slow heartbeat pulse, serene nostalgic wonder, instrumental, ~78 BPM`

### 2. `inner-space-level.mp3` → key `innerSpaceLevel`  (Ch2 gameplay; game pitch-shifts ±1 semitone)
Produce at a NEUTRAL key/tempo (the engine re-pitches it per world).
Style box:
`16-bit SNES JRPG field exploration theme, sampled orchestra, bouncy marimba and pizzicato groove, light hand percussion, plucky ocarina/recorder lead over warm strings, steady heartbeat pulse, hopeful curious adventure, instrumental, ~104 BPM`

### 3. `inner-space-boss.mp3` → key `innerSpaceBoss`  (Ch2 bosses; speeds up for W17 & W28)
Leave headroom: the engine ramps tempo up in the final HP third.
Style box:
`16-bit SNES JRPG boss battle theme, driving prog-rock organ, gritty synth bass, fast tremolo strings, stabbing brass, pounding tribal toms, ominous wordless choir swells, dark minor key, dramatic and tense, instrumental, ~140 BPM`

### 4. `playground.mp3` → key `playgroundTheme`  (Recess / Playground)
The warm earthbound OPPOSITE of the micro-world.
Style box:
`16-bit SNES JRPG nostalgic hometown theme, gentle piano and fingerpicked acoustic guitar, soft warm strings, tender music-box/celesta countermelody, wistful bittersweet golden-afternoon memory, cozy, instrumental, ~76 BPM`

> King Coli (secret boss, W17) needs no track, it reuses `inner-space-boss` pitched up.

## Chapter 3 "Home Ground" → STILL NEEDED (4 tracks)

Setting: one family Saturday of errands around the family's city, morning to dusk. No
enemies. The "bosses" are rush orders (a tipped pallet, early sprinklers, the tide over
the towels), a deadline, not a battle. Same 16-bit idiom as Ch1/Ch2, pushed toward the
owner's stated target: JRPG chiptune with SNES action-game energy in the fast tracks.
Fallbacks until each file exists: home → `home-theme`, level → `levels`,
boss → `boss-fight`, hot-pot → `dads-garage`.

All four share one timbre spine, byte for byte, so they read as one soundtrack:
`16-bit chiptune, SNES sampled soundfont` up front, `FM synth bass` in the instrument
list, `grainy 1993 sampler, dry narrow mix` right before the BPM. Tempo ladder
80 / 104 / 124 / 150. Each track owns its own colours: map = square lead + acoustic
guitar + celesta; level = marimba + pulse lead + chip arps + gated snare; rush = sawtooth
lead + orchestra hits + brass stabs; hot-pot = flute + muted marimba + guzheng + triangle.

### 1. `home-ground-home.mp3` → key `homeGroundHome`  (Ch3 map; Hot Pot exits to it; never pitch-shifted)
Tuneful and a little more upbeat than the other two maps, but nothing is chasing anyone.
Style box:
`16-bit chiptune, SNES sampled soundfont, JRPG overworld music, sunny and easygoing, tuneful square wave lead with vibrato, sampled acoustic guitar strums, celesta arpeggios, FM synth bass, light sampled kick and snare with shaker, offbeat bass hops, G major, grainy 1993 sampler, dry narrow mix, 104 BPM, instrumental, starts at full energy, steady level throughout`

### 2. `home-ground-level.mp3` → key `homeGroundLevel`  (Ch3 belt + mission briefing; engine re-pitches -1 to +1 semitone)
The belt never accelerates, so busy and cheerful, never tense. Mid-register lead and a
rhythmic first bar (a 600 ms pitch glide plays on every entry).
Style box:
`16-bit chiptune, SNES sampled soundfont, JRPG field music, cheerful and busy, plucky mid-register pulse wave lead, 16th-note chip arpeggios, bouncy sampled marimba, FM synth bass, snappy gated snare with tight hi-hat, syncopated bass line, bright major key, grainy 1993 sampler, dry narrow mix, 124 BPM, instrumental, full groove from bar one, steady level throughout`

Hotter alternate if the "hyper" energy belongs here too (trade-off: it lands only
12 BPM under the rush track, and works against the calm-belt design):
`16-bit chiptune, SNES sampled soundfont, action platformer stage music, fast and cheerful, plucky mid-register square wave lead, 16th-note chip arpeggios, sampled marimba accents, punchy FM synth bass, driving gated snare with tight hi-hat, bright major key, grainy 1993 sampler, dry narrow mix, 138 BPM, instrumental, full groove from bar one, steady level throughout`

### 3. `home-ground-boss.mp3` → key `homeGroundBoss`  (all eight rush orders, the W38 Mountain finale, the W20 Night Shift; engine re-pitches -1 to +1 semitone)
Urgent but positive: major key, no build to a payoff (it loops under a quota timer and
Chapter 3 has no HP tempo ramp). The night mood of W20 comes from the visuals, not the
music. Intensity comes from subdivision and the snare, not from adjectives.
Style box:
`16-bit chiptune, SNES sampled soundfont, action platformer stage music, fast, upbeat and confident, sawtooth lead with vibrato, 16th-note square wave arpeggios, galloping FM synth bass, sampled orchestra hit accents, sampled brass stabs, gated snare on every beat, double-time hi-hat, bright major key, grainy 1993 sampler, dry narrow mix, 150 BPM, instrumental, full groove from bar one, steady level throughout`

### 4. `hot-pot.mp3` → key `hotPotTheme`  (Hot Pot Time, W19; never pitch-shifted; crossfades into #1 in 500 ms)
The third secret room. A family at a table, Dad asking the kids questions, steam under
amber lamps. Intimate, not bustling, and audibly different from `dads-garage` (bright,
fast), which is what the room plays until this file lands. Dark and rounded like
home-theme and playground: every instrument named is inherently soft, and there is no
hi-hat, shaker or celesta. One restrained Chinese colour is right here and only here.
Same key as #1 for the crossfade.
Style box:
`16-bit chiptune, SNES sampled soundfont, cozy JRPG town music, warm and nostalgic, soft sampled flute lead, muted sampled marimba, a touch of plucked guzheng, slow triangle wave arpeggios, soft FM synth bass, gentle woodblock pulse, G major, rolled-off treble, soft rounded tones, grainy 1993 sampler, dry narrow mix, 80 BPM, instrumental, starts at full level`

If it comes back with lo-fi beats, add `boom bap, vinyl crackle, jazz` to Exclude Styles.
If it hums, cut `nostalgic` first. If it comes back as Chinese folk rather than game
music, move the guzheng tag to the very end. If it is simply too bright, a low-pass to
match home-theme's rolloff (about 1.5 kHz) is a five-second ffmpeg job.

> The W38 finale and the W20 Night Shift reuse `home-ground-boss` (pitched per world). The
> homecoming credits reuse `creditsSong`. King Coli (W17) reuses `inner-space-boss`.
