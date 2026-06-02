# Shake & Repeat — Design

> **Status:** approved for planning · **Date:** 2026-06-01
> **Depends on:** v0 (Tasks 1–17 complete) · **Related:** [TECH-SPEC §9 Extension Points](../../TECH-SPEC.md), [floating-editor reskin](./2026-05-30-floating-editor-reskin-design.md)

## 1. Summary

Add two per-element motion features to the animation editor, both **zero-dependency**
(no Motion / Framer Motion — pure CSS `@keyframes`):

- **Shake** — an oscillation layered on top of the eased translate. The user dials
  amplitude on X (px), Y (px), and rotation (deg), plus frequency and decay. Any
  combination is valid; this single parameter set covers horizontal, vertical, 2D,
  and rotational shake without presets.
- **Repeat** — a toggle that replays whatever animation is active (easing, shake, or
  both). Modes: **Loop** (restart from start) and **Bounce** (forward then backward).
  Count is a number or ∞ (forever).

Both compose with easing and with each other. The editor remains the single source of
truth: **the export reproduces exactly what is active in the editor and nothing more.**

Stagger is explicitly **out of scope** (it requires multiple elements — a separate
future project). Its inspector "SOON" placeholder stays.

## 2. Goals / Non-goals

**Goals**
- Shake and easing compose on the single circle; the preview shows the combination.
- Repeat replays the active animation, Loop or Bounce, finite count or forever.
- WYSIWYG: preview runtime and exported CSS are driven by the **same** transform math,
  so they cannot disagree.
- Output reflects only what is adjusted: no shake → no shake code; repeat off → no
  repeat keywords; both off → byte-for-byte today's export.
- Every change is **additive** (new union fields, new switch cases, new helpers). No
  existing case logic is modified.

**Non-goals**
- Stagger / multi-element editing.
- A separate Shake on/off toggle — "all amplitudes zero" *is* off (KISS).
- Springs, gestures, scroll-linked, exit/layout animation (these would cross into
  needing Motion — see §9).
- New export modes. The two existing emitters (single-file, multi-file) gain shake &
  repeat through shared helpers; no third emitter.

## 3. Principles upheld

- **KISS** — Shake is one parameter object, not per-type variants. Repeat is one object.
  "Shake active" = any amplitude ≠ 0; no extra enable flag for shake.
- **DRY / no repeat** — one `computeTransform(anim, progress)` is the single source of
  the eased+shaken transform, called by **both** the runner (per frame) and the baked
  exporter (per sample). The `@keyframes` block and the `animation:` shorthand are each
  built by **one** helper in `shared.ts`, called by both emitters.
- **SOLID / Open–Closed** — `shake?` and `repeat` are new optional/added fields on
  `Animation`; existing fields untouched. The exporter *branches* (shake active →
  baked path; else → today's waypoint path) by adding a case, not editing the existing
  one. New store setters are added; existing setters are untouched.

## 4. Data model (`lib/animation/types.ts`)

Additive. Absent/`enabled:false` ⇒ today's behavior exactly.

```ts
export type Animation = {
  /* ...existing fields... */
  shake?: Shake;     // omitted ⇒ no shake
  repeat: Repeat;    // always present; enabled:false ⇒ plays once
};

export type Shake = {
  amplitudeX: number;       // px, left/right
  amplitudeY: number;       // px, up/down
  amplitudeRotate: number;  // deg, wobble
  frequency: number;        // oscillations across one play of the duration (≥ 0)
  decay: number;            // 0 = constant amplitude … 1 = fully settled by the end
};

export type Repeat = {
  enabled: boolean;             // the On/Off toggle
  mode: "loop" | "bounce";      // remembered even while enabled:false
  times: number | "infinite";   // ∞ = forever
};

export const DEFAULT_SHAKE: Shake = {
  amplitudeX: 0, amplitudeY: 0, amplitudeRotate: 0, frequency: 3, decay: 0,
};

export const DEFAULT_REPEAT: Repeat = {
  enabled: false, mode: "loop", times: "infinite",
};
```

`DEFAULT_PROJECT.animations[0]` gains `repeat: { ...DEFAULT_REPEAT }`. `shake` stays
absent in the default (so a fresh project exports clean).

**Backfill** (`store.ts` `normalizeProject`): older persisted projects lack `repeat`;
backfill `repeat: { ...DEFAULT_REPEAT }`. `shake` needs no backfill (absent = off).

## 5. Runtime (`lib/animation/`)

### 5.1 New shared transform function

Add `computeTransform(anim, progress) → { x, y, rotate }` (new file
`lib/animation/transform.ts`, or exported from `runner.ts`; one home only):

1. **Ease** progress once via the shared track easing (today's logic moved here).
2. **Translate** — `interpolateWaypoints` for X and Y at the eased progress (unchanged).
3. **Shake** — if `anim.shake`, add per channel:
   `offset(amp) = amp * sin(2π · frequency · progress) · (1 − decay · progress)`
   applied to x, y, and `rotate` (deg). `progress` here is the *raw* play progress
   (shake oscillates in real time, not eased time).
4. Return `{ x, y, rotate }`.

A second tiny helper `transformString({x, y, rotate})` builds the CSS string,
omitting `rotate(...)` when rotate is 0. Used by runner and baked exporter ⇒ identical
output (DRY).

### 5.2 Runner repeat loop (`runner.ts`)

`runAnimation` currently clamps `t` to 1 and calls `onDone`. Extend the tick:

- Compute `elapsed` after delay (unchanged).
- If `repeat.enabled`: `iter = floor(elapsed / duration)`,
  `local = (elapsed % duration) / duration`. **Bounce**: on odd `iter`, use
  `1 − local`. Stop (call `onDone`) when `times !== "infinite"` and `iter >= times`;
  otherwise keep requesting frames (∞ never calls `onDone`).
- If repeat disabled: today's single play (clamp to 1, `onDone`).
- Each frame: `element.style.transform = transformString(computeTransform(anim, p))`.

`applyTransform` is replaced by the `computeTransform` + `transformString` pair (the
old inline easing/interpolation moves into `computeTransform` — no behavior change when
shake/repeat are inactive).

## 6. Exporter (`lib/exporter/`)

Centralize in `shared.ts` so both emitters stay DRY:

- **`shakeActive(project): boolean`** — `shake` present and any amplitude ≠ 0.
- **`keyframeBlock(project): string[]`** — the keyframe statement lines:
  - shake **inactive** → today's `keyframeStatements` (2 waypoints, unchanged).
  - shake **active** → **baked**: sample `computeTransform` at fixed `%` steps and emit
    `N% { transform: ...; }` lines. Step count
    `steps = clamp(ceil(frequency · 16), 24, 120)` (≥16 samples/oscillation, capped),
    plus an explicit `100%`. Values use existing `cssLength` for px/container units;
    rotation always emitted as `deg`.
- **`timingFunction(project): string`** — `linear` when shake active (easing is baked
  into the sampled positions), else today's `cubic-bezier(...)` (`easingString`).
- **`animationShorthand(project): string`** — assembles
  `${ANIM_NAME} ${durationSec}s ${timingFunction} ${iterations} ${direction} forwards`
  where, from `repeat`: `iterations` = `""` when disabled, else `infinite` or the count;
  `direction` = `""`/`normal` for Loop, `alternate` for Bounce.

`emitAllInOne` and `emitMultiFile` are reduced to call `keyframeBlock` and
`animationShorthand` instead of hand-assembling `keyframeStatements` + `easingString` +
`durationSec`. No emitter contains shake/repeat logic of its own.

**Output fidelity:** shake off + repeat off ⇒ identical bytes to today. Repeat only ⇒
today's clean `cubic-bezier` keyframes + repeat keywords. Shake on ⇒ baked keyframes
(+ repeat keywords if on).

## 7. Inspector UI (`components/editor/`)

The `SECTIONS` descriptor list (Open/Closed seam) gains two entries; the Shake "SOON"
placeholder is removed (Stagger's stays).

- **`ShakeSection`** (`shake-section.tsx`) — five `DraftNumberInput`s reusing the
  existing component: Left/Right (px), Up/Down (px), Rotate (deg), Frequency, Decay.
  Friendly labels, no jargon. All default 0 except frequency. Writes via `setShake`.
- **`RepeatSection`** (`repeat-section.tsx`) — On/Off toggle (reuse the Responsive/Fixed
  pill style), and when On: a pick-one **Loop / Bounce** control + a **Times** field
  (number or ∞). Interaction:
  - Clicking **Loop** or **Bounce** while Off → sets `enabled:true` **and** `mode` in one
    action (`setRepeat({ enabled: true, mode })`).
  - Toggling **Off** → `setRepeat({ enabled: false })`; `mode`/`times` are preserved, so
    the last pick stays highlighted-but-inactive and survives reload.
  - Turning On via the toggle with no prior pick → defaults to `mode:"loop"`.

Both sections read/write only through new store actions (no reaching into store
internals).

## 8. Store (`lib/editor/store.ts`)

Two new setters (additive; existing setters untouched):

- **`setShake(animationId, patch: Partial<Shake>)`** — merges `patch` into the
  animation's shake, initializing from `DEFAULT_SHAKE` when absent. Persists.
- **`setRepeat(animationId, patch: Partial<Repeat>)`** — merges into `repeat`. Persists.

Both follow the existing `structuredClone` → mutate → `saveToStorage` → `set` pattern.

## 9. Edge cases & decisions

- **Decay + Loop (restart):** each iteration resets amplitude (pops to full, settles
  again). Intended and documented.
- **Decay + Bounce:** the baked sequence reverses on alternate iterations, so a settled
  shake "un-settles" on the backward pass — also a direct consequence of sampling the
  same sequence; consistent between preview and export.
- **`times: 0`** is not offered in the UI; the field minimum is 1 (or ∞).
- **Rotation pivot:** `rotate()` spins about the element's center (default
  `transform-origin`); acceptable for v0.
- **Sampling resolution:** capped at 120 steps to keep exports bounded; the cap is
  logged-as-design here, not silently truncated — at extreme frequencies the wobble is
  approximated. (Frequencies that high are not a realistic editor input.)

## 10. Motion boundary (for the record)

Everything here is a pure function of time, so it bakes into CSS — no library. The line
where Motion *would* be needed, for when the editor grows later: interruptible springs
(velocity continuity), gesture/drag-following, exit/presence animation, layout (FLIP),
and broad-compat scroll-linked motion. None are in scope now.

## 11. Testing

- `computeTransform`: at `progress 0` equals the start translate with zero shake offset;
  `sin` phase correct at known progresses; decay scales amplitude to ~0 at `progress 1`
  when `decay:1`; rotate channel populated only when `amplitudeRotate ≠ 0`.
- `shakeActive`: false for absent shake and for all-zero amplitudes; true otherwise.
- `keyframeBlock`: unchanged 2-line output when shake inactive; baked multi-line with a
  `100%` line and bounded step count when active.
- `animationShorthand`: no iteration/direction tokens when `repeat.enabled:false`;
  `infinite`/count and `alternate` for Bounce when on.
- Exporter golden: shake-off + repeat-off output is byte-identical to the pre-change
  snapshot (guards the "reflects only what's active" requirement).
- Store: `setShake`/`setRepeat` merge semantics; `normalizeProject` backfills `repeat`.
- Inspector: clicking Loop/Bounce while Off flips it On; toggling Off preserves mode.

## 12. File-by-file change list

| File | Change |
|---|---|
| `lib/animation/types.ts` | Add `Shake`, `Repeat`, `DEFAULT_SHAKE`, `DEFAULT_REPEAT`; add `shake?`/`repeat` to `Animation`; add `repeat` to `DEFAULT_PROJECT`. |
| `lib/animation/transform.ts` *(new)* | `computeTransform`, `transformString` (shared by runner + exporter). |
| `lib/animation/runner.ts` | Use `computeTransform`/`transformString`; add repeat loop (Loop/Bounce, finite/∞). |
| `lib/exporter/shared.ts` | Add `shakeActive`, `keyframeBlock` (baked vs waypoint), `timingFunction`, `animationShorthand`. |
| `lib/exporter/all-in-one.ts` | Call `keyframeBlock` + `animationShorthand`. |
| `lib/exporter/multi-file.ts` | Same. |
| `lib/editor/store.ts` | Add `setShake`, `setRepeat`; backfill `repeat` in `normalizeProject`. |
| `components/editor/shake-section.tsx` *(new)* | Shake inputs. |
| `components/editor/repeat-section.tsx` *(new)* | Repeat toggle + Loop/Bounce + Times. |
| `components/editor/animation-inspector.tsx` | Add Shake & Repeat to `SECTIONS`; remove Shake from `COMING_SOON` (keep Stagger). |
| `tests/*` | Per §11. |
