# Cosmic Evolution Spec

## Context

`progress.companion.cosmicForm` is set by [CreditsScene.js:233](src/scenes/CreditsScene.js:233) on the first final-boss win, but no code reads it — the credits "COSMIC FORM" moment renders the adult sprite under a title card, and the in-game pet never actually transforms. This spec defines the real cosmic form: smaller-but-special, per-species, ethereal.

The pet card on the world map (`showLoreCard` in [WorldMapScene.js:850](src/scenes/WorldMapScene.js:850)) also gets an upgrade: once cosmic is unlocked, it becomes a stage carousel — player can browse and pick which form to display game-wide.

Plus a separate cosmetics-alignment audit to fix food/hat/cape positioning on existing forms — surfaced during this conversation, scoped here as a follow-on.

---

## 1. Cosmic Form Visual Design

### Universal rules

- **Vibe**: Ethereal mini-self — the pet is still recognizably itself, but smaller, semi-translucent, with quiet presence.
- **Size**: ~50% of adult footprint. Rendered everywhere at half scale.
- **Palette**: Species-intensified — same color family, pushed to extremes.
- **Per-species**: Each gets a unique astronomical metaphor (see below).
- **Idle**: Mostly still. No constant orbits or shimmer. Every 6–8 seconds, **the pet's signature accent feature pulses brighter** (silent, just a brief alpha+color pulse on the feature). Otherwise just the standard body bob from [PetRenderer.js:154](src/PetRenderer.js:154).
- **Sound**: Silent. No new audio.
- **Reactions**: Same as adult — no new bounce/streak animations. Cosmic is purely a visual upgrade.

### Per-species designs (astronomical objects)

| Species | Adult | Cosmic name | Astronomical metaphor | Signature pulse feature |
|---------|-------|-------------|----------------------|------------------------|
| Ember | Solfire | **Cosmic Solfire** | Small star / supernova-remnant. Compact orange-yellow core with a thin corona crown. Brighter, hotter, more luminous than Solfire. | Corona crown — pulses white-yellow every 6–8s |
| Tide | Tidalord | **Cosmic Tidalord** | Nebular jellyfish / hydrothermal vent. Translucent body with bioluminescent spots, trailing tendrils replacing fins. Deep-cyan with magenta bioluminous accents. | Bioluminescent tendril tips — pulse magenta every 6–8s |
| Sprout | Cosmoss | **Cosmic Cosmoss** | Wandering planet with bio-luminous flora. Small sphere-shaped body with glowing flora dots; a thin Saturn-style ring tilted around it. Deep emerald with gold flora highlights. | Planetary ring + flora dots — pulse gold every 6–8s |

### Sprite grid implementation

- Add 3 new grids to [PetSprites.js](src/PetSprites.js): `EMBER_COSMIC`, `TIDE_COSMIC`, `SPROUT_COSMIC`.
- Extend `PET_SPRITES.ember/tide/sprout` to include `cosmic` key.
- Grid resolution: keep ~10–12 rows tall (smaller than adult's ~16–18) so detail stays crisp at 50% on-screen size. Pixel cell size stays at the renderer default; the smaller grid is what makes the pet feel smaller without the renderer needing special scale logic.
- Each grid uses the same character palette as adults (`O`=outline, `B`=body, `H`=highlight, `A`=accent, etc.) so [PetRenderer.js](src/PetRenderer.js) renders them unchanged.
- Add `cosmic` anchor entries to `ANCHORS_BY_SPECIES` in [PetSprites.js](src/PetSprites.js) (lines 323-342) so cosmetics still attach (see Cosmetics section).

### Stage name additions

In [CompanionManager.js:9](src/CompanionManager.js:9), add `cosmic` stage entries for each species's `stages` object:

```js
ember.stages.cosmic = { name: 'Cosmic Solfire', tier: 'cosmic' }
tide.stages.cosmic   = { name: 'Cosmic Tidalord', tier: 'cosmic' }
sprout.stages.cosmic = { name: 'Cosmic Cosmoss', tier: 'cosmic' }
```

Stage progression order does **not** include `cosmic` — it's parallel to adult, gated on the `cosmicForm` flag rather than the lifetime-correct/accuracy gates.

---

## 2. Where Cosmic Appears

**Replaces adult everywhere once unlocked.** A new helper in [CompanionManager.js](src/CompanionManager.js):

```js
companion.getActiveStage() {
  // Returns the stage to render anywhere in the game.
  // Honors the player's display preference if set; otherwise:
  //   - cosmicForm + adult-reached → 'cosmic'
  //   - else → progress.companion.stage
}
```

All current `drawCompanion(scene, x, y, opts)` callsites that don't pass an explicit `stage` already pull from `progress.companion.stage`. We change [PetRenderer.js:83](src/PetRenderer.js:83) to instead call `companion.getActiveStage()` when no stage is passed. That's a one-line swap that makes cosmic appear in:

- World-map cockpit/cameo
- Shop preview avatar
- In-game GameScene pet
- HiddenWorldScene garage pet
- StarterPicker (n/a — starter is egg-only)
- All cosmetic shop previews
- CreditsScene cockpit pet during choreography

### Display-preference override

New field: `progress.companion.displayStage` (`null` = auto / latest unlocked).

`getActiveStage()` returns `progress.companion.displayStage` if set, otherwise computes the latest unlocked stage.

The pet card carousel sets this field.

---

## 3. Pet Card — Stage Carousel

### Activation

The carousel **only replaces the current lore card after cosmic is unlocked** (`progress.companion.cosmicForm === true`). Adult-stage and earlier players see today's lore card unchanged. This makes the carousel itself a small extra reward for reaching cosmic.

### Layout — one pet at a time

Re-purposes the modal opened by `showLoreCard()` in [WorldMapScene.js:852](src/scenes/WorldMapScene.js:852).

```
┌─────────────────────────────────────┐
│           ◀  ●●●○●  ▶               │  Page dots (5 = egg/baby/teen/adult/cosmic)
│                                     │
│                                     │
│            [BIG PET]                │  Currently-selected stage at full size
│                                     │
│                                     │
│           BLAZEWISP                 │  Stage name (or '???' if locked)
│           — TEEN —                  │  Tier label
│                                     │
│   "Quick on its feet…" lore text    │  Per-stage lore (existing lore for egg→adult;
│                                     │   cosmic gets new lore line below)
│                                     │
│   [  Set as my pet  ]               │  Instant-action button
└─────────────────────────────────────┘
```

- **Arrows** (`◀ ▶`) at the top wrap around the 5 stages.
- **Page dots** (`●●●○●`) show position. Locked stages render as a hollow ring `○`; unlocked as a filled dot `●`.
- **Locked stages** show `???` as both the stage name and pet sprite area — no silhouette, just a `?` glyph (~120px) centered in the pet zone with the species accent color at low alpha. Tapping the arrow lands on it but no "Set as my pet" button is shown for locked stages.
- **Selected-stage indicator**: subtle green border around the page dot if `displayStage` equals this stage; or an `✓ ACTIVE` chip near the stage name.

### Toggle action

- "Set as my pet" button is shown only on **unlocked** stages.
- Tapping it:
  1. Sets `progress.companion.displayStage` to this stage.
  2. Persists via `progress.save()`.
  3. Shows a **visual toast** (`createToast` if it exists; otherwise a fading text container) at the bottom of the screen: `"Now showing: Sparkling"` (or the chosen stage's name). Toast auto-fades after ~1800ms.
  4. Refreshes the pet badge in the top-right (`refreshPlayerAvatar` or equivalent).

### Cosmic lore (one new line per species)

Add a single line of cosmic-stage lore for each species so the carousel's cosmic page has something to read:

- **Cosmic Solfire**: "What's left when a star burns down to its core: pure, condensed light."
- **Cosmic Tidalord**: "Drifting between currents we'll never see — translucent, listening."
- **Cosmic Cosmoss**: "A tiny world that grew its own sky. Walk softly here."

### Backward compat — Adult lore card

Adult-stage players still see today's evolution-progress block (worlds cleared / correct / accuracy bars). For adult players who have NOT yet unlocked cosmic, the card stays exactly as it is today. Once cosmic unlocks (final boss win), next time the card opens, it's the carousel.

---

## 4. Reveal Moment in Credits

In [CreditsScene.js:181](src/scenes/CreditsScene.js:181) the `playPetEvolutionMoment` currently does:

```js
const pet = drawCompanion(this, cx, cy, { scale: 1.6 }).setDepth(16);
```

…rendering whatever the player's current stage is (adult, since they just beat the boss).

**Change**: at the moment the white "cosmic flash" ring expands (line 192), the pet sprite should swap from adult → cosmic on-screen. Implementation:

1. Set the `cosmicForm` flag at the START of the moment (so `getActiveStage()` returns `cosmic`).
2. At the flash point (line 196 onComplete), destroy the existing pet and re-draw it with `{ stage: 'cosmic', scale: 1.6 }` so it appears at the same on-screen size (cosmic at scale 1.6 with smaller grid = roughly the same on-screen footprint as adult at scale 1.6 with bigger grid — but visibly different).
3. Keep the existing scale yo-yo + "COSMIC FORM" title card.

The audio cue (`audio.playEvolutionFlash`) stays.

---

## 5. Unlock Condition

**Unchanged.** [CreditsScene.js:231-234](src/scenes/CreditsScene.js:231) already does:

```js
if (progress.companion) {
  progress.companion.cosmicForm = true;
  progress.save();
}
```

Add one tiny defensive guard so cosmic can't accidentally activate before adult:

```js
if (progress.companion && progress.companion.stage === 'adult') {
  progress.companion.cosmicForm = true;
  progress.save();
}
```

(In practice, players who reach the final boss are adult already, but this prevents weird state if someone arrives via dev menu.)

---

## 6. Cosmetics on the Cosmic Form

Cosmetics still equip (player's choice). They auto-scale with the pet container (since cosmic = ~50% scale via smaller grid). The signature-feature pulse on cosmic happens **under** the cosmetic layer, so cosmetics don't block it visually.

**Anchor entries** for cosmic stage need defining in [PetSprites.js:323](src/PetSprites.js:323) (`ANCHORS_BY_SPECIES`). Each cosmic sprite gets `head_top`, `head_eye`, `neck`, `chest`, `back`, `foot` — same names as other stages, just at coordinates appropriate for the smaller sprite.

### Related: cosmetics-alignment audit (separate task, surfaced here)

User noted that food accessories should sit "by the side" rather than over the head/face, hats don't fit right on all stage/species combos, and capes look weird. This applies to **all** existing stages (egg/baby/teen/adult), not just cosmic.

**Approach** (scope chosen: audit + fix as I go):

1. For each species × stage × accessory/hat/cape combo (3 × 4 × ~28 cosmetics = ~336 combos, but most reuse the same anchors so the actual fix work is per-anchor not per-combo):
   - Render a sample on a test scene.
   - Capture screenshot.
   - Note misalignments (e.g., banana hat sits 3px too high on Sparkling).
2. Fix by adjusting:
   - Anchor coordinates in `ANCHORS_BY_SPECIES`.
   - Or per-cosmetic anchor mode (`onTop` vs `below`) in `ACC_ANCHORS` ([PetCosmeticSprites.js:553](src/PetCosmeticSprites.js:553)).
   - For food items: introduce a `side` anchor mode that positions the food container at the pet's `neck` x-offset by the body's right edge.

This is a longer pass than the cosmic form itself. Tracked separately; ships independently of cosmic if cosmic lands first.

---

## 7. Save Data

- `progress.companion.cosmicForm`: already exists. Now actually read.
- `progress.companion.displayStage`: new. Defaults to `null` (= auto).
- No migration needed — existing saves that have `cosmicForm: true` will immediately get the cosmic pet next time they open the game. (User-confirmed: backward-compat = just work.)

---

## 8. Files Touched

| File | Change |
|------|--------|
| [src/PetSprites.js](src/PetSprites.js) | Add `EMBER_COSMIC`, `TIDE_COSMIC`, `SPROUT_COSMIC` grids. Extend `PET_SPRITES`. Add `cosmic` entries to `ANCHORS_BY_SPECIES`. |
| [src/CompanionManager.js](src/CompanionManager.js) | Add `cosmic` stage entries to each species's `stages`. New `getActiveStage()` helper. Cosmic lore lines. |
| [src/PetRenderer.js](src/PetRenderer.js) | Default stage selection uses `companion.getActiveStage()` instead of raw `progress.companion.stage`. |
| [src/scenes/CreditsScene.js](src/scenes/CreditsScene.js) | Adult→cosmic swap during the flash moment. Defensive guard around flag set. |
| [src/scenes/WorldMapScene.js](src/scenes/WorldMapScene.js) | `showLoreCard()` branches: if `cosmicForm` → render carousel; else → current lore card. New carousel UI. |
| [src/GameData.js](src/GameData.js) (`PlayerProgress`) | Initialize `displayStage: null` in companion defaults. |

---

## 9. Verification

1. **Fresh save → progress to adult → defeat final boss**. Cosmic flash in credits: pet swaps adult → cosmic on screen, not just a title card.
2. **Back to world map**. Pet badge top-right shows cosmic form (smaller, accent feature pulses every 6–8s).
3. **In-game** (start a level). Pet during play is cosmic, not adult.
4. **Open pet card** (tap pet badge). Carousel modal opens. Arrows cycle through egg/baby/teen/adult/cosmic. Page dots reflect locked/unlocked. Locked → `???` page.
5. **Pick "Sparkling" on the carousel + Set as my pet**. Toast: `Now showing: Sparkling`. Modal stays open. Close → pet badge re-renders as baby-stage Sparkling. Open game scene → cosmic in level is now Sparkling.
6. **Pick cosmic again on the carousel + Set as my pet**. Back to cosmic everywhere.
7. **Existing save with `cosmicForm: true`** (set via dev menu or prior playthrough): On boot, pet is already cosmic. No re-trigger needed.
8. **Cosmetics**: equip hat + accessory + aura on cosmic-form pet. They render scaled to fit. (Note: alignment audit is a separate task; some misalignment expected pre-audit.)
9. **Visual sanity per species**: Cosmic Solfire reads as star-with-corona, Cosmic Tidalord as nebular-jellyfish, Cosmic Cosmoss as ringed-living-planet. Distinct silhouettes.

---

## Open follow-ups (tracked separately, not part of this spec)

- **Cosmetics alignment audit** — fix food/hat/cape placement across all species × stage combos.
- **Dev menu max-out button** — also requested this session; trivial implementation, ship independently.
- **Pet card stage toggle on the existing badge button** — currently the top-right pet badge in shop is a static avatar; if we want tapping it from the *shop* (not just the world map) to also open the new carousel, that's a small extra wire-up.
