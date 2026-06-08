# Round-Flow State-Machine Refactor — Spec

**Target file:** `src/scenes/GameScene.js` (~3,166 lines as of commit `a4cd08e`).
**Status:** not started. This is a deliberate, behavior-preserving refactor of a
**working, live** game. Production deploys from `main` → GitHub Pages, and kids
play the Pages site, so **do not push to `main` until the human reviews.**

This document is self-contained: a fresh session should be able to execute it by
reading only this file plus the code. Line numbers are "as of `a4cd08e`" and will
drift as you edit — re-grep to locate things.

---

## 1. Why (the problem)

The per-round flow is structurally fragile and has been patched repeatedly. Git log:
- *"Fix streak-tier crash that froze bosses and broke warp asteroids"*
- *"harden boss/gateway flows against stranded asteroids"*
- *"Fix asteroid answer and warp flow bugs"*

Same bug class — **stranded asteroid / frozen boss / lost warp** — patched over and
over with new guards, never fixed at the root. Four structural causes:

### 1a. `this.state` is a free-form string with no transition rules
A single property holds 8 phase strings — `ready`, `intro`, `playing`, `feedback`,
`correction`, `warp`, `failed`, `ended` — assigned at **~24 sites** across a dozen
handlers (grep `this\.state *=`). Nothing enforces which phase may follow which. Many
`this.time.delayedCall(...)` callbacks **both** guard on the state **and** overwrite
it, so two callbacks firing out of order can wedge the round. Helpers re-derive
meaning by string-matching: `_isOver()` (`state==='failed'||'ended'`),
`_inputUnlocked()`, `_buttonsActive()`.

### 1b. "Tear down asteroid + spawn the next" is duplicated ~13 times
Every way an asteroid can finish re-implements a slightly different combination of
stop-fall-tween / explode / `removeAsteroid` / set `state='playing'` / `spawnAsteroid`.
Grep `this\.(removeAsteroid|spawnAsteroid)\(` — sites include: correct (normal/warp/
boss/mini-boss), `onAsteroidImpact` (wrong-glance / pass-through / no-container),
correction-card dismiss, and the watchdogs. Miss one step in any copy → **freeze**
(no next asteroid) or **double-spawn**.

### 1c. Three frame watchdogs paper over 1b
`update()` runs three recovery loops via `_tickWatchdog` whose only job is to notice a
frozen round and force-recover:
- `_stuckMs` (1500ms) — locked asteroid parked in the field → wipe all + respawn
- `_emptySlotMs` (650ms) — zero asteroids while playing → respawn
- `_bossStuckMs` (3000ms) — boss asteroid locked too long → force-cycle
They treat the symptom. (`_stuckMs`'s recover can also nuke an in-progress mini-boss.)

### 1d. Warp liveness is tracked in two places, synced by ordering tricks
`warpState` (`null → 'pending' → 'ready' → 'spawned'`) **and** `this.state === 'warp'`
both answer "is the gateway live?". `handleCorrect` deliberately sets `state='warp'`
**before** `removeAsteroid` so `removeAsteroid`'s blanket re-arm (which fires "for any
removal where `state !== 'warp'`") doesn't re-arm on a successful warp. Correctness
depends on line ordering. Grep `warpState`.

### Per-asteroid flag soup
Each asteroid juggles `lockedOut` + `impactPending` + a 120ms `IMPACT_GRACE_MS` timer
(grep those). ~8 reachable boolean combinations, only some intended — the source of
double-credit / unanswerable-but-present bugs.

---

## 2. Goal (the target design)

Introduce three single-source-of-truth mechanisms, then delete the band-aids.

### 2a. `setState(next)` — the only way to change round phase
```
setState(next) {
  const from = this.state;
  if (from === next) return;
  if (!ROUND_TRANSITIONS[from]?.includes(next)) {
    console.warn(`[GameScene] illegal round transition ${from} -> ${next}`);
    // In dev, surfacing this is the point. Still set it (don't crash a live game),
    // but an illegal transition firing means a caller is wrong — fix the caller.
  }
  this.state = next;
}
```
Replace **all** `this.state = '...'` assignments with `this.setState('...')`.
Proposed legal transition table (refine as you learn the real flow — the table is the
deliverable, encode reality):
```
const ROUND_TRANSITIONS = {
  ready:      ['intro', 'playing'],
  intro:      ['playing', 'failed', 'ended'],
  playing:    ['feedback', 'correction', 'warp', 'failed', 'ended'],
  feedback:   ['playing', 'correction', 'warp', 'failed', 'ended'],
  correction: ['playing', 'feedback', 'failed', 'ended'],
  warp:       [],           // terminal — only a scene change leaves it
  failed:     [],           // terminal
  ended:      [],           // terminal
};
```

### 2b. `teardownAsteroid(asteroid, { thenSpawn })` — the only asteroid exit
One function owns "finish this asteroid, optionally spawn the next":
```
teardownAsteroid(asteroid, { thenSpawn = false } = {}) {
  this.removeAsteroid(asteroid);           // already: filter from activeAsteroids,
                                           // kill tweens, destroy container
  if (thenSpawn && !this._isOver() && this.state !== 'warp'
      && this.activeAsteroids.length === 0) {
    this.spawnAsteroid();
  }
}
```
Replace the ~13 scattered `removeAsteroid`/`spawnAsteroid` combos with calls to this,
one exit at a time. The "exactly one asteroid follows each resolved one" invariant now
lives in exactly one place and cannot be half-implemented.

### 2c. Per-asteroid `phase` enum replaces the flag soup
Give each asteroid one field: `phase ∈ { 'falling', 'impactGrace', 'resolving', 'gone' }`.
- `falling` — descending, answerable (was `lockedOut=false`)
- `impactGrace` — reached the ship line, 120ms still-answerable window (was the
  `impactPending && !lockedOut` window)
- `resolving` — answer locked / impacted, exit animation playing, **not** answerable
  (was `lockedOut=true`)
- `gone` — removed
Then `isAnswerableAsteroid(a)` becomes `a.phase === 'falling' || a.phase === 'impactGrace'`.
Delete `lockedOut` / `impactPending` once `phase` is authoritative. Illegal flag
combinations become unrepresentable.

### 2d. Single source of truth for warp liveness
Pick ONE: keep `warpState` as the only authority, and make `teardownAsteroid` decide
whether a removal re-arms the gateway from **explicit intent** (e.g. a `rearmWarp`
option or the asteroid's `_isWarp` + outcome), **not** by reading `this.state`. Remove
the "set `state='warp'` before `removeAsteroid`" ordering trick.

### 2e. Delete the watchdogs
With 2a–2d, the round cannot strand, so remove `_stuckMs`, `_emptySlotMs`,
`_bossStuckMs` and `_tickWatchdog`. If you keep a backstop, keep **exactly one**,
documented, and explain in a comment why it can still be needed. (Keep the existing
`if (this._pauseOpen) return;` gate at the top of `update()` — that's a separate,
already-shipped fix.)

---

## 3. Invariants (must hold after the refactor)

- **I1** Exactly one playable asteroid spawns after each resolved asteroid — never
  zero (freeze), never two (double).
- **I2** `this.state` changes **only** via `setState()`; illegal transitions are logged
  (and ideally impossible by construction).
- **I3** An asteroid is answerable **iff** `phase ∈ {falling, impactGrace}`. No
  contradictory flag combos exist.
- **I4** Warp "is it live" has **one** source of truth; no ordering tricks.
- **I5** **Zero player-facing behavior change.** Every flow looks and feels identical.
- **I6** The 3 frame watchdogs are gone (or reduced to one documented backstop) and the
  game still never freezes across the §5 matrix.

---

## 4. Recommended staged plan (game must boot & play after every step — commit each)

1. **Add `setState` + table; mechanize all assignments.** Replace ~24 `this.state =`
   with `this.setState(...)`. Table permissive (warn-only). No behavior change. Verify.
2. **Introduce asteroid `phase`** alongside the existing flags; derive `isAnswerable`
   from `phase`; keep flags in sync temporarily. Verify. Then make `phase` authoritative
   and delete `lockedOut`/`impactPending`. Verify.
3. **Add `teardownAsteroid`; migrate exits one at a time** to it, verifying after each.
4. **Single-source the warp;** remove the ordering trick. Verify warp end-to-end.
5. **Tighten the transition table** to reject/clearly-log illegal transitions; fix any
   caller that trips it. Verify the whole §5 matrix.
6. **Remove the 3 watchdogs** (or reduce to one). Re-run the §5 matrix, especially that
   nothing freezes and the mini-boss is never nuked.

Make a commit after each step with a clear message. If a step destabilizes, the prior
commit is a safe fallback.

---

## 5. Verification matrix (run after structural steps; full pass at the end)

Dev server: `npm run dev` (Vite, port 3000). The game exposes `window.game`; you can
drive scenes from the browser/preview console, e.g.:
```
const g = window.game;
g.registry.set('currentWorldId', 1); g.registry.set('levelMode', 'mult');
g.scene.start('GameScene');
const gs = g.scene.getScene('GameScene');           // inspect gs.state, gs.activeAsteroids
gs.update(performance.now(), 100);                  // step one 100ms frame deterministically
```
(The preview tab backgrounds `requestAnimationFrame`, so for timing assertions call
`gs.update(t, delta)` directly rather than waiting on the real loop.)

Test every path:
1. **Normal level** — correct → explode + next spawns; wrong → glance/feedback + next
   spawns; let one time out → ship damage + next spawns. No freeze, no double-spawn.
2. **Boss** — correct → HP down + problem cycles; wrong → correction card shows the
   **correct full equation** (incl. glitch boss) + dismiss continues; defeat → ended.
3. **Mini-boss (W10+)** — answerable; never silently destroyed/replaced.
4. **Hidden-world warp** — first-time host level (e.g. W5 `div`), solve the warp
   asteroid → warp animation → arrives at the hidden world. Back-arrow mid-warp is
   ignored. Gateway re-arms correctly if the warp asteroid is removed some other way.
5. **Streak tiers** — build a 10+ streak through tier changes → HUD updates, no crash.
6. **Pause** — mid-each-phase: timer freezes, nothing spawns behind the modal; resume
   restores play.
7. **Rapid double-taps** at every transition — no double-spawn, no negative HP, no
   skipped phase.
8. **Impact grace** — answer exactly as the asteroid reaches the ship line (120ms).

Before any deploy: `npm run build` must be clean.

---

## 6. Constraints / ground rules

- **Behavior-preserving.** This is structural. If the player can tell, you changed too
  much.
- **Branch only.** Work on a feature branch off current `main`. **Never push to `main`**
  (it auto-deploys to the kids' live site) until the human reviews and approves.
- Keep the already-shipped fixes intact (pause-gate in `update()`, glitch correction
  card, Boss Rush input lock, etc. — these are in `a4cd08e`).
- Incremental commits; the game boots and plays at every commit.
- When done: summarize what changed, confirm the §5 matrix passed, and hand back for
  review + deploy.

---

## 7. Quick reference — current sites (as of `a4cd08e`, will drift)

- States assigned: grep `this\.state *=` (~24 sites)
- State values: `ready, intro, playing, feedback, correction, warp, failed, ended`
- Warp: grep `warpState` (init 77, pending 82, →ready 174-178, →spawned 355-356,
  re-arm 1898-1899)
- Asteroid flags: grep `lockedOut|impactPending|IMPACT_GRACE_MS` (IMPACT_GRACE_MS=120)
- Teardown/respawn: grep `this\.(removeAsteroid|spawnAsteroid)\(` (~13 sites)
- Watchdogs: `_tickWatchdog` (def ~1927), `_stuckMs` 1973, `_emptySlotMs` 1984,
  `_bossStuckMs` 1999
- Helpers: `_isOver` 1919, `_inputUnlocked` 826, `_buttonsActive` 834
- `update()` entry ~1945 (keep the `if (this._pauseOpen) return;` gate)
- Neither `setState` nor `teardownAsteroid` exists yet.
