# Shake & Repeat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two zero-dependency, per-element motion features — **Shake** (an eased-translate-plus-oscillation on X/Y/rotation) and **Repeat** (Loop or Bounce, finite or infinite) — that compose with each other and with easing, where the exported CSS reproduces exactly what the editor shows.

**Architecture:** One shared pure function `computeTransform(anim, progress)` is the single source of the eased + shaken transform; the runner calls it per frame and the exporter samples it to bake `@keyframes` (only when shake is active). The `@keyframes` block and the `animation:` shorthand are each built by one helper in `lib/exporter/shared.ts`, called by both emitters, so no logic is duplicated. Shake and Repeat are additive fields on `Animation`; absent/disabled means today's behavior, byte-for-byte.

**Tech Stack:** Next.js (App Router), TypeScript, Zustand, Vitest + @testing-library/react. No animation library.

---

## Execution Discipline

This plan inherits the project's discipline from `docs/PLAN.md`: **KISS** (only what the task says), **DRY / no repeat** (shake & repeat logic lives in `computeTransform` + `shared.ts` only), **SOLID / Open–Closed** (new union fields and new switch/case branches; never edit an existing case), **test-first** (write the failing test, run it red, then implement), **no placeholders**, **one task = one commit**. Per the user's standing preference, the **user runs `git commit` themselves** — the executor stages the files and reports the exact commit message; it does not commit. Pause after each task for the user to commit before starting the next.

## File Structure

| Path | Responsibility | Action |
|---|---|---|
| `lib/animation/types.ts` | `Shake`, `Repeat`, defaults; `shake?`/`repeat` on `Animation` | Modify |
| `lib/animation/transform.ts` | `computeTransform`, `transformString` — shared by runner + exporter | Create |
| `lib/animation/runner.ts` | Drive preview via the shared functions; repeat loop | Modify |
| `lib/exporter/shared.ts` | `shakeActive`, `keyframeBlock`, `timingFunction`, `animationShorthand` | Modify |
| `lib/exporter/all-in-one.ts` | Use `keyframeBlock` + `animationShorthand` | Modify |
| `lib/exporter/multi-file.ts` | Same | Modify |
| `lib/editor/store.ts` | `setShake`, `setRepeat`; backfill `repeat` | Modify |
| `components/editor/shake-section.tsx` | Shake inputs | Create |
| `components/editor/repeat-section.tsx` | Repeat toggle + Loop/Bounce + Times | Create |
| `components/editor/animation-inspector.tsx` | Add Shake & Repeat sections; Stagger stays SOON | Modify |

---

## Task 1: Data model — Shake & Repeat types

**Files:**
- Modify: `lib/animation/types.ts`
- Test: `tests/types.test.ts` (Create)

- [ ] **Step 1: Write the failing test**

Create `tests/types.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  DEFAULT_PROJECT,
  DEFAULT_SHAKE,
  DEFAULT_REPEAT,
} from "@/lib/animation/types";

describe("Shake & Repeat defaults", () => {
  it("DEFAULT_SHAKE is all-zero amplitudes (off) with a sane frequency", () => {
    expect(DEFAULT_SHAKE.amplitudeX).toBe(0);
    expect(DEFAULT_SHAKE.amplitudeY).toBe(0);
    expect(DEFAULT_SHAKE.amplitudeRotate).toBe(0);
    expect(DEFAULT_SHAKE.frequency).toBeGreaterThan(0);
    expect(DEFAULT_SHAKE.decay).toBe(0);
  });

  it("DEFAULT_REPEAT is disabled, loop, infinite", () => {
    expect(DEFAULT_REPEAT).toEqual({ enabled: false, mode: "loop", times: "infinite" });
  });

  it("the default project animation carries a disabled repeat and no shake", () => {
    const anim = DEFAULT_PROJECT.animations[0];
    expect(anim.repeat).toEqual({ enabled: false, mode: "loop", times: "infinite" });
    expect(anim.shake).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- types`
Expected: FAIL — `DEFAULT_SHAKE`/`DEFAULT_REPEAT` are not exported.

- [ ] **Step 3: Add the types and defaults**

In `lib/animation/types.ts`, add `shake?`/`repeat` to `Animation`:

```ts
export type Animation = {
  id: string;
  elementId: string;
  motionUnit: MotionUnit;
  input: AnimationInput;
  tracks: PropertyTrack[];
  shake?: Shake;     // omitted ⇒ no shake
  repeat: Repeat;    // always present; enabled:false ⇒ plays once
};
```

Add the new types near `Easing`:

```ts
export type Shake = {
  amplitudeX: number;       // px, left/right
  amplitudeY: number;       // px, up/down
  amplitudeRotate: number;  // deg, wobble
  frequency: number;        // oscillations across one play of the duration (>= 0)
  decay: number;            // 0 = constant amplitude … 1 = fully settled by the end
};

export type Repeat = {
  enabled: boolean;             // the On/Off toggle
  mode: "loop" | "bounce";      // remembered even while enabled:false
  times: number | "infinite";   // "infinite" = forever
};

export const DEFAULT_SHAKE: Shake = {
  amplitudeX: 0,
  amplitudeY: 0,
  amplitudeRotate: 0,
  frequency: 3,
  decay: 0,
};

export const DEFAULT_REPEAT: Repeat = {
  enabled: false,
  mode: "loop",
  times: "infinite",
};
```

In `DEFAULT_PROJECT`, add `repeat` to the animation (leave `shake` absent):

```ts
  animations: [
    {
      id: "anim-1",
      elementId: "circle-1",
      motionUnit: "container",
      input: { type: "mount", delay: 0, duration: 1000 },
      repeat: { enabled: false, mode: "loop", times: "infinite" },
      tracks: [
        // ...unchanged...
      ],
    },
  ],
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- types`
Expected: PASS.

- [ ] **Step 5: Stage and report (user commits)**

```bash
git add lib/animation/types.ts tests/types.test.ts
```
Report commit message: `feat(types): add Shake and Repeat to the animation model`

---

## Task 2: Store — setShake, setRepeat, repeat backfill

**Files:**
- Modify: `lib/editor/store.ts`
- Test: `tests/store.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to the `describe("editor store", ...)` block in `tests/store.test.ts`:

```ts
  it("initializes shake from defaults and merges patches via setShake", () => {
    useEditorStore.getState().setShake("anim-1", { amplitudeX: 12 });
    const shake = useEditorStore.getState().project.animations[0].shake;
    expect(shake).toBeDefined();
    expect(shake?.amplitudeX).toBe(12);
    expect(shake?.amplitudeY).toBe(0);       // from DEFAULT_SHAKE
    expect(shake?.frequency).toBe(3);        // from DEFAULT_SHAKE
  });

  it("merges patches into repeat via setRepeat without losing other fields", () => {
    useEditorStore.getState().setRepeat("anim-1", { enabled: true, mode: "bounce" });
    const repeat = useEditorStore.getState().project.animations[0].repeat;
    expect(repeat).toEqual({ enabled: true, mode: "bounce", times: "infinite" });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- store`
Expected: FAIL — `setShake`/`setRepeat` are not functions.

- [ ] **Step 3: Implement the setters and backfill**

In `lib/editor/store.ts`, import the defaults:

```ts
import {
  DEFAULT_PROJECT,
  DEFAULT_REPEAT,
  DEFAULT_SHAKE,
  type MotionUnit,
  type Project,
  type Repeat,
  type Shake,
} from "@/lib/animation/types";
```

Add to `normalizeProject`, inside the `for (const anim of next.animations)` loop:

```ts
    if (!anim.repeat) anim.repeat = { ...DEFAULT_REPEAT };
```

Add to the `EditorState` type:

```ts
  setShake: (animationId: string, patch: Partial<Shake>) => void;
  setRepeat: (animationId: string, patch: Partial<Repeat>) => void;
```

Add the setters next to `setDuration` (follow the existing clone→mutate→save pattern):

```ts
  setShake: (animationId, patch) => {
    set((state) => {
      const project = structuredClone(state.project);
      const anim = project.animations.find((a) => a.id === animationId);
      if (!anim) return state;
      anim.shake = { ...(anim.shake ?? DEFAULT_SHAKE), ...patch };
      saveToStorage(project);
      return { project };
    });
  },

  setRepeat: (animationId, patch) => {
    set((state) => {
      const project = structuredClone(state.project);
      const anim = project.animations.find((a) => a.id === animationId);
      if (!anim) return state;
      anim.repeat = { ...(anim.repeat ?? DEFAULT_REPEAT), ...patch };
      saveToStorage(project);
      return { project };
    });
  },
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- store`
Expected: PASS.

- [ ] **Step 5: Stage and report (user commits)**

```bash
git add lib/editor/store.ts tests/store.test.ts
```
Report commit message: `feat(store): setShake, setRepeat, and repeat backfill`

---

## Task 3: Shared transform — computeTransform & transformString

**Files:**
- Create: `lib/animation/transform.ts`
- Test: `tests/transform.test.ts` (Create)

- [ ] **Step 1: Write the failing tests**

Create `tests/transform.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeTransform, transformString } from "@/lib/animation/transform";
import type { Animation } from "@/lib/animation/types";

function makeAnim(overrides: Partial<Animation> = {}): Animation {
  return {
    id: "a",
    elementId: "e",
    motionUnit: "px",
    input: { type: "mount", delay: 0, duration: 1000 },
    repeat: { enabled: false, mode: "loop", times: "infinite" },
    tracks: [
      {
        property: "translateX",
        waypoints: [{ progress: 0, value: 0 }, { progress: 1, value: 100 }],
        easing: { type: "cubic-bezier", control: [0, 0, 1, 1] }, // linear
      },
      {
        property: "translateY",
        waypoints: [{ progress: 0, value: 0 }, { progress: 1, value: 0 }],
        easing: { type: "cubic-bezier", control: [0, 0, 1, 1] },
      },
    ],
    ...overrides,
  };
}

describe("computeTransform", () => {
  it("with no shake equals the eased translate (linear here)", () => {
    const t = computeTransform(makeAnim(), 0.5);
    expect(t.x).toBeCloseTo(50, 5);
    expect(t.y).toBe(0);
    expect(t.rotate).toBe(0);
  });

  it("adds a sine shake offset on X at the sine peak", () => {
    // frequency 1, progress 0.25 => sin(2π·0.25)=1, decay 0 => full amplitude
    const anim = makeAnim({
      shake: { amplitudeX: 10, amplitudeY: 0, amplitudeRotate: 0, frequency: 1, decay: 0 },
    });
    const t = computeTransform(anim, 0.25);
    expect(t.x).toBeCloseTo(25 + 10, 5); // eased 25 + shake 10
  });

  it("decay=1 removes all shake at progress 1", () => {
    const anim = makeAnim({
      shake: { amplitudeX: 10, amplitudeY: 7, amplitudeRotate: 5, frequency: 3, decay: 1 },
    });
    const t = computeTransform(anim, 1);
    expect(t.x).toBeCloseTo(100, 5); // endpoint, no shake
    expect(t.y).toBeCloseTo(0, 5);
    expect(t.rotate).toBeCloseTo(0, 5);
  });

  it("populates rotate only when amplitudeRotate is set", () => {
    const anim = makeAnim({
      shake: { amplitudeX: 0, amplitudeY: 0, amplitudeRotate: 8, frequency: 1, decay: 0 },
    });
    expect(computeTransform(anim, 0.25).rotate).toBeCloseTo(8, 5);
  });
});

describe("transformString", () => {
  it("omits rotate when zero", () => {
    expect(transformString({ x: 5, y: 6, rotate: 0 })).toBe("translate(5px, 6px)");
  });
  it("includes rotate when nonzero", () => {
    expect(transformString({ x: 5, y: 6, rotate: 8 })).toBe("translate(5px, 6px) rotate(8deg)");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- transform`
Expected: FAIL — module `@/lib/animation/transform` not found.

- [ ] **Step 3: Implement the shared transform**

Create `lib/animation/transform.ts`:

```ts
import type { Animation } from "./types";
import { interpolateWaypoints } from "./interpolate";
import { evalCubicBezier } from "./bezier";

export type Transform = { x: number; y: number; rotate: number };

/**
 * The single source of the eased + shaken transform at a given raw play
 * progress in [0, 1]. The translate is eased once (shared easing across both
 * axes, matching the CSS export); shake oscillates in REAL time (raw progress),
 * layered on top. Both the preview runner and the baked exporter call this, so
 * they cannot disagree.
 */
export function computeTransform(anim: Animation, progress: number): Transform {
  const tx = anim.tracks.find((t) => t.property === "translateX");
  const ty = anim.tracks.find((t) => t.property === "translateY");

  const easing = tx?.easing ?? ty?.easing;
  const eased =
    easing && easing.type === "cubic-bezier"
      ? evalCubicBezier(easing.control, progress)
      : progress;

  let x = tx ? interpolateWaypoints(tx.waypoints, eased) : 0;
  let y = ty ? interpolateWaypoints(ty.waypoints, eased) : 0;
  let rotate = 0;

  const s = anim.shake;
  if (s) {
    const wave = Math.sin(2 * Math.PI * s.frequency * progress);
    const damp = 1 - s.decay * progress;
    const env = wave * damp;
    x += s.amplitudeX * env;
    y += s.amplitudeY * env;
    rotate += s.amplitudeRotate * env;
  }

  return { x, y, rotate };
}

/** Build the CSS transform string, omitting rotate when it is exactly 0. */
export function transformString({ x, y, rotate }: Transform): string {
  const base = `translate(${x}px, ${y}px)`;
  return rotate !== 0 ? `${base} rotate(${rotate}deg)` : base;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- transform`
Expected: PASS.

- [ ] **Step 5: Stage and report (user commits)**

```bash
git add lib/animation/transform.ts tests/transform.test.ts
```
Report commit message: `feat(animation): shared computeTransform + transformString`

---

## Task 4: Runner — use shared transform + repeat loop

**Files:**
- Modify: `lib/animation/runner.ts`
- Test: `tests/runner.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/runner.test.ts` (the existing `flushFrame`/`makeAnim` helpers are in scope). Add a repeat-aware helper and tests:

```ts
  it("loops position back to start on the second iteration (Loop)", () => {
    const anim = makeAnim();
    anim.repeat = { enabled: true, mode: "loop", times: "infinite" };
    const el = document.createElement("div");
    runAnimation(anim, el);
    flushFrame(0);     // progress 0 -> 0px
    flushFrame(1000);  // exactly one full iteration -> back to start (local 0)
    expect(el.style.transform).toContain("translate(0px, 0px)");
  });

  it("reverses on the second iteration (Bounce)", () => {
    const anim = makeAnim();
    anim.repeat = { enabled: true, mode: "bounce", times: "infinite" };
    const el = document.createElement("div");
    runAnimation(anim, el);
    flushFrame(0);
    flushFrame(1500); // iter 1 (odd), local 0.5 -> reversed progress 0.5 -> 50px
    expect(el.style.transform).toContain("translate(50px, 0px)");
  });

  it("calls onDone after a finite repeat count", () => {
    const anim = makeAnim();
    anim.repeat = { enabled: true, mode: "loop", times: 2 };
    const el = document.createElement("div");
    let done = false;
    runAnimation(anim, el, () => (done = true));
    flushFrame(0);
    flushFrame(2000); // elapsed = 2 * duration -> iter 2 >= times -> done
    expect(done).toBe(true);
  });
```

> Note: `makeAnim()` in this file currently builds an animation without `repeat`. Update it to include `repeat: { enabled: false, mode: "loop", times: "infinite" }` so it matches the type. Existing single-play tests stay green because disabled repeat is the old behavior.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- runner`
Expected: FAIL — repeat is ignored (no looping; transform helper unchanged).

- [ ] **Step 3: Rewrite the runner to use the shared transform and repeat loop**

Replace the body of `lib/animation/runner.ts`:

```ts
import type { Animation } from "./types";
import { computeTransform, transformString } from "./transform";

/**
 * Plays a single animation on a DOM element. v0 input type is `mount` — starts
 * after `delay`, runs for `duration`. With `repeat.enabled` it loops (Loop =
 * restart, Bounce = alternate), finitely (`times`) or forever (`"infinite"`).
 * Returns a cancel function.
 */
export function runAnimation(
  anim: Animation,
  element: HTMLElement,
  onDone?: () => void,
): () => void {
  let cancelled = false;

  const start = performance.now();
  const delay = anim.input.type === "mount" ? anim.input.delay : 0;
  const duration = anim.input.type === "mount" ? anim.input.duration : 1000;
  const repeat = anim.repeat;

  function apply(progress: number) {
    element.style.transform = transformString(computeTransform(anim, progress));
  }

  function tick(now: number) {
    if (cancelled) return;
    const elapsed = now - start - delay;

    if (elapsed < 0) {
      apply(0);
      requestAnimationFrame(tick);
      return;
    }

    if (repeat.enabled) {
      const iter = Math.floor(elapsed / duration);
      const finished = repeat.times !== "infinite" && iter >= repeat.times;
      if (finished) {
        // Settle on the final visual frame: Bounce ends where an even/odd count lands.
        const lastReversed = repeat.mode === "bounce" && (repeat.times as number) % 2 === 1;
        apply(lastReversed ? 0 : 1);
        onDone?.();
        return;
      }
      const local = (elapsed % duration) / duration;
      const reversed = repeat.mode === "bounce" && iter % 2 === 1;
      apply(reversed ? 1 - local : local);
      requestAnimationFrame(tick);
      return;
    }

    const t = Math.min(elapsed / duration, 1);
    apply(t);
    if (t < 1) requestAnimationFrame(tick);
    else onDone?.();
  }

  requestAnimationFrame(tick);
  return () => {
    cancelled = true;
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- runner`
Expected: PASS (new repeat tests + existing single-play tests).

- [ ] **Step 5: Stage and report (user commits)**

```bash
git add lib/animation/runner.ts tests/runner.test.ts
```
Report commit message: `feat(runner): drive preview via shared transform + repeat loop`

---

## Task 5: Exporter shared helpers — shakeActive, keyframeBlock, timingFunction, animationShorthand

**Files:**
- Modify: `lib/exporter/shared.ts`
- Test: `tests/exporter.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/exporter.test.ts`:

```ts
import {
  shakeActive,
  keyframeBlock,
  timingFunction,
  animationShorthand,
} from "@/lib/exporter/shared";

describe("shake & repeat export helpers", () => {
  it("shakeActive is false when shake is absent or all-zero", () => {
    const p = makePxProject();
    expect(shakeActive(p)).toBe(false);
    p.animations[0].shake = { amplitudeX: 0, amplitudeY: 0, amplitudeRotate: 0, frequency: 3, decay: 0 };
    expect(shakeActive(p)).toBe(false);
    p.animations[0].shake.amplitudeX = 4;
    expect(shakeActive(p)).toBe(true);
  });

  it("timingFunction is linear when shake is active, cubic-bezier otherwise", () => {
    const p = makePxProject();
    expect(timingFunction(p)).toContain("cubic-bezier");
    p.animations[0].shake = { amplitudeX: 5, amplitudeY: 0, amplitudeRotate: 0, frequency: 2, decay: 0 };
    expect(timingFunction(p)).toBe("linear");
  });

  it("keyframeBlock bakes many lines (with a 100% line) when shake is active", () => {
    const p = makePxProject();
    expect(keyframeBlock(p).length).toBe(2); // unchanged 2-waypoint path
    p.animations[0].shake = { amplitudeX: 5, amplitudeY: 0, amplitudeRotate: 0, frequency: 2, decay: 0 };
    const lines = keyframeBlock(p);
    expect(lines.length).toBeGreaterThan(2);
    expect(lines[lines.length - 1]).toContain("100%");
  });

  it("animationShorthand omits repeat tokens when disabled and is byte-identical to today", () => {
    const p = makePxProject();
    expect(animationShorthand(p)).toBe("animation-anim 1s cubic-bezier(0.42, 0, 0.58, 1) forwards");
  });

  it("animationShorthand emits infinite + alternate for Bounce forever", () => {
    const p = makePxProject();
    p.animations[0].repeat = { enabled: true, mode: "bounce", times: "infinite" };
    expect(animationShorthand(p)).toBe(
      "animation-anim 1s cubic-bezier(0.42, 0, 0.58, 1) infinite alternate forwards",
    );
  });

  it("animationShorthand emits a finite count for Loop", () => {
    const p = makePxProject();
    p.animations[0].repeat = { enabled: true, mode: "loop", times: 3 };
    expect(animationShorthand(p)).toBe(
      "animation-anim 1s cubic-bezier(0.42, 0, 0.58, 1) 3 forwards",
    );
  });
});
```

> Note: `makePxProject()` uses `DEFAULT_PROJECT`'s easing `[0.42, 0, 0.58, 1]` and duration 1000ms (1s); the expected strings above match that.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- exporter`
Expected: FAIL — the four helpers are not exported.

- [ ] **Step 3: Implement the helpers**

In `lib/exporter/shared.ts`, add imports:

```ts
import type { Animation } from "@/lib/animation/types";
import { computeTransform } from "@/lib/animation/transform";
```

(Keep the existing `MotionUnit, Project, PropertyTrack, Waypoint` import.) Add at the end of the file:

```ts
/** Sampling resolution for baked shake: >=16 samples per oscillation, bounded. */
const SAMPLES_PER_OSC = 16;
const MIN_STEPS = 24;
const MAX_STEPS = 120;

/** True when the animation has a shake with any nonzero amplitude. */
export function shakeActive(project: Project): boolean {
  const s = project.animations[0]?.shake;
  return !!s && (s.amplitudeX !== 0 || s.amplitudeY !== 0 || s.amplitudeRotate !== 0);
}

/** CSS timing function — linear when shake is baked, else the cubic-bezier. */
export function timingFunction(project: Project): string {
  return shakeActive(project) ? "linear" : easingString(project);
}

/**
 * The keyframe statement lines. Shake inactive ⇒ today's 2-waypoint path.
 * Shake active ⇒ baked: sample computeTransform at fixed % steps so the export
 * reproduces the preview exactly (same function drives both).
 */
export function keyframeBlock(project: Project): string[] {
  if (!shakeActive(project)) return keyframeStatements(project);

  const anim = project.animations[0] as Animation;
  const unit: MotionUnit = anim.motionUnit ?? "px";
  const freq = anim.shake?.frequency ?? 0;
  const steps = Math.min(
    MAX_STEPS,
    Math.max(MIN_STEPS, Math.ceil(freq * SAMPLES_PER_OSC)),
  );

  const lines: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const { x, y, rotate } = computeTransform(anim, progress);
    const pct = Math.round(progress * 100);
    const xL = cssLength(x, unit, "x", project.container);
    const yL = cssLength(y, unit, "y", project.container);
    const rot = rotate !== 0 ? ` rotate(${round3(rotate)}deg)` : "";
    lines.push(`${pct}% { transform: translate(${xL}, ${yL})${rot}; }`);
  }
  return lines;
}

/**
 * The full `animation:` shorthand value. Repeat disabled ⇒ no iteration/direction
 * tokens (byte-identical to the original output). Loop ⇒ count/infinite; Bounce ⇒
 * count/infinite + alternate.
 */
export function animationShorthand(project: Project): string {
  const repeat = project.animations[0]?.repeat;
  const iterations =
    repeat?.enabled
      ? repeat.times === "infinite"
        ? "infinite"
        : String(repeat.times)
      : "";
  const direction = repeat?.enabled && repeat.mode === "bounce" ? "alternate" : "";
  return [
    ANIM_NAME,
    `${durationSec(project)}s`,
    timingFunction(project),
    iterations,
    direction,
    "forwards",
  ]
    .filter(Boolean)
    .join(" ");
}
```

> `round3` already exists in this file (private). `keyframeStatements`, `cssLength`, `easingString`, `durationSec`, `ANIM_NAME` are unchanged and reused — no logic duplicated.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- exporter`
Expected: PASS.

- [ ] **Step 5: Stage and report (user commits)**

```bash
git add lib/exporter/shared.ts tests/exporter.test.ts
```
Report commit message: `feat(exporter): shake-baking + repeat shorthand helpers`

---

## Task 6: Wire both emitters to the shared helpers

**Files:**
- Modify: `lib/exporter/all-in-one.ts`
- Modify: `lib/exporter/multi-file.ts`
- Test: `tests/exporter.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/exporter.test.ts`:

```ts
describe("emitters honor shake & repeat", () => {
  it("single-file: shake-off + repeat-off output is unchanged (clean cubic-bezier, no repeat)", () => {
    const p = makePxProject();
    const out = exportProject(p);
    expect(out).toContain("cubic-bezier(0.42, 0, 0.58, 1) forwards");
    expect(out).not.toContain("infinite");
  });

  it("single-file: shake-on bakes keyframes and uses linear", () => {
    const p = makePxProject();
    p.animations[0].shake = { amplitudeX: 8, amplitudeY: 0, amplitudeRotate: 0, frequency: 2, decay: 0 };
    const out = exportProject(p);
    expect(out).toContain("linear");
    expect(out).toContain("100% { transform:");
    expect(out).not.toContain("cubic-bezier");
  });

  it("multi-file: repeat-on emits infinite in the css", () => {
    const p = makePxProject();
    p.animations[0].repeat = { enabled: true, mode: "loop", times: "infinite" };
    const css = exportFiles(p, "multi-file").find((f) => f.name === "animation.css")!.code;
    expect(css).toContain("infinite");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- exporter`
Expected: FAIL — emitters still hand-assemble `easingString` + `forwards` and ignore shake/repeat.

- [ ] **Step 3: Update `all-in-one.ts`**

In `lib/exporter/all-in-one.ts`, change the imports to use the new helpers:

```ts
import {
  ANIM_NAME,
  PARENT_CLASS,
  animationShorthand,
  keyframeBlock,
  parentCss,
} from "./shared";
```

Replace the `keyframes` line and the `.${ANIM_NAME}` rule:

```ts
  const keyframes = keyframeBlock(project)
    .map((s) => `          ${s}`)
    .join("\n");
```

```ts
        .${ANIM_NAME} {
          animation: ${animationShorthand(project)};
        }
```

(Remove the now-unused `durationSec`/`easingString`/`keyframeStatements` imports from this file.)

- [ ] **Step 4: Update `multi-file.ts`**

In `lib/exporter/multi-file.ts`, change imports:

```ts
import {
  ANIM_NAME,
  PARENT_CLASS,
  animationShorthand,
  keyframeBlock,
  parentCss,
} from "./shared";
```

Replace the `keyframes` const and the `.${ANIM_NAME}` rule in the `css` template:

```ts
  const keyframes = keyframeBlock(project)
    .map((s) => `  ${s}`)
    .join("\n");
```

```ts
.${ANIM_NAME} {
  animation: ${animationShorthand(project)};
}
```

- [ ] **Step 5: Run the full exporter suite to verify it passes**

Run: `npm test -- exporter`
Expected: PASS (including the pre-existing golden assertions, which still hold for the shake-off/repeat-off case).

- [ ] **Step 6: Stage and report (user commits)**

```bash
git add lib/exporter/all-in-one.ts lib/exporter/multi-file.ts tests/exporter.test.ts
```
Report commit message: `feat(exporter): emit shake & repeat via shared helpers`

---

## Task 7: ShakeSection component

**Files:**
- Create: `components/editor/shake-section.tsx`
- Test: `tests/shake-section.test.tsx` (Create)

- [ ] **Step 1: Write the failing test**

Create `tests/shake-section.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ShakeSection } from "@/components/editor/shake-section";
import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_PROJECT } from "@/lib/animation/types";

describe("ShakeSection", () => {
  beforeEach(() => {
    useEditorStore.setState({ project: structuredClone(DEFAULT_PROJECT), isPlaying: false });
  });

  it("writes horizontal amplitude to the store on blur", () => {
    const { getByTestId } = render(<ShakeSection animationId="anim-1" />);
    fireEvent.change(getByTestId("shake-x"), { target: { value: "12" } });
    fireEvent.blur(getByTestId("shake-x"));
    expect(useEditorStore.getState().project.animations[0].shake?.amplitudeX).toBe(12);
  });

  it("writes rotation amplitude to the store on blur", () => {
    const { getByTestId } = render(<ShakeSection animationId="anim-1" />);
    fireEvent.change(getByTestId("shake-rotate"), { target: { value: "15" } });
    fireEvent.blur(getByTestId("shake-rotate"));
    expect(useEditorStore.getState().project.animations[0].shake?.amplitudeRotate).toBe(15);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- shake-section`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `components/editor/shake-section.tsx`:

```tsx
"use client";

import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_SHAKE, type Shake } from "@/lib/animation/types";
import { DraftNumberInput } from "./draft-number-input";

const FIELDS: { key: keyof Shake; testid: string; label: string; unit: string; min?: number }[] = [
  { key: "amplitudeX", testid: "shake-x", label: "Left / Right", unit: "px" },
  { key: "amplitudeY", testid: "shake-y", label: "Up / Down", unit: "px" },
  { key: "amplitudeRotate", testid: "shake-rotate", label: "Rotate", unit: "deg" },
  { key: "frequency", testid: "shake-frequency", label: "Speed", unit: "shakes", min: 0 },
  { key: "decay", testid: "shake-decay", label: "Settle", unit: "0–1", min: 0 },
];

export function ShakeSection({ animationId }: { animationId: string }) {
  const shake = useEditorStore((s) => {
    const anim = s.project.animations.find((a) => a.id === animationId);
    return anim?.shake ?? DEFAULT_SHAKE;
  });
  const setShake = useEditorStore((s) => s.setShake);

  return (
    <div className="flex flex-col gap-2">
      {FIELDS.map((f) => (
        <label key={f.key} className="flex items-center justify-between gap-2 text-xs text-neutral-300">
          <span>{f.label}</span>
          <span className="flex items-center gap-1.5">
            <DraftNumberInput
              testid={f.testid}
              value={shake[f.key]}
              onCommit={(v) => setShake(animationId, { [f.key]: v })}
              min={f.min}
              step={f.key === "decay" ? 0.1 : 1}
            />
            <span className="w-10 text-neutral-500">{f.unit}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- shake-section`
Expected: PASS.

- [ ] **Step 5: Stage and report (user commits)**

```bash
git add components/editor/shake-section.tsx tests/shake-section.test.tsx
```
Report commit message: `feat(editor): ShakeSection inspector controls`

---

## Task 8: RepeatSection component

**Files:**
- Create: `components/editor/repeat-section.tsx`
- Test: `tests/repeat-section.test.tsx` (Create)

- [ ] **Step 1: Write the failing tests**

Create `tests/repeat-section.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { RepeatSection } from "@/components/editor/repeat-section";
import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_PROJECT } from "@/lib/animation/types";

describe("RepeatSection", () => {
  beforeEach(() => {
    useEditorStore.setState({ project: structuredClone(DEFAULT_PROJECT), isPlaying: false });
  });

  it("clicking Loop while Off turns repeat On and selects loop", () => {
    const { getByTestId } = render(<RepeatSection animationId="anim-1" />);
    fireEvent.click(getByTestId("repeat-loop"));
    const repeat = useEditorStore.getState().project.animations[0].repeat;
    expect(repeat.enabled).toBe(true);
    expect(repeat.mode).toBe("loop");
  });

  it("clicking Bounce while Off turns repeat On and selects bounce", () => {
    const { getByTestId } = render(<RepeatSection animationId="anim-1" />);
    fireEvent.click(getByTestId("repeat-bounce"));
    const repeat = useEditorStore.getState().project.animations[0].repeat;
    expect(repeat.enabled).toBe(true);
    expect(repeat.mode).toBe("bounce");
  });

  it("toggling Off preserves the chosen mode", () => {
    const { getByTestId } = render(<RepeatSection animationId="anim-1" />);
    fireEvent.click(getByTestId("repeat-bounce")); // On + bounce
    fireEvent.click(getByTestId("repeat-off"));
    const repeat = useEditorStore.getState().project.animations[0].repeat;
    expect(repeat.enabled).toBe(false);
    expect(repeat.mode).toBe("bounce"); // remembered
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- repeat-section`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `components/editor/repeat-section.tsx`:

```tsx
"use client";

import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_REPEAT } from "@/lib/animation/types";
import { DraftNumberInput } from "./draft-number-input";

function modeButton(active: boolean): string {
  return (
    "flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors " +
    (active ? "bg-indigo-300 text-indigo-950" : "bg-neutral-900 text-neutral-400 hover:text-neutral-200")
  );
}

export function RepeatSection({ animationId }: { animationId: string }) {
  const repeat = useEditorStore((s) => {
    const anim = s.project.animations.find((a) => a.id === animationId);
    return anim?.repeat ?? DEFAULT_REPEAT;
  });
  const setRepeat = useEditorStore((s) => s.setRepeat);

  const forever = repeat.times === "infinite";

  return (
    <div className="flex flex-col gap-3">
      {/* On/Off + mode: clicking a mode while Off flips it On in one action. */}
      <div className="flex gap-2">
        <button
          type="button"
          data-testid="repeat-off"
          aria-pressed={!repeat.enabled}
          onClick={() => setRepeat(animationId, { enabled: false })}
          className={modeButton(!repeat.enabled)}
        >
          Off
        </button>
        <button
          type="button"
          data-testid="repeat-loop"
          aria-pressed={repeat.enabled && repeat.mode === "loop"}
          onClick={() => setRepeat(animationId, { enabled: true, mode: "loop" })}
          className={modeButton(repeat.enabled && repeat.mode === "loop")}
        >
          Loop
        </button>
        <button
          type="button"
          data-testid="repeat-bounce"
          aria-pressed={repeat.enabled && repeat.mode === "bounce"}
          onClick={() => setRepeat(animationId, { enabled: true, mode: "bounce" })}
          className={modeButton(repeat.enabled && repeat.mode === "bounce")}
        >
          Bounce
        </button>
      </div>

      <p className="text-[11px] text-neutral-500">
        {repeat.mode === "bounce" ? "Plays forward, then backward." : "Plays again from the start."}
      </p>

      {repeat.enabled && (
        <label className="flex items-center gap-2 text-xs text-neutral-300">
          <span>Times</span>
          <button
            type="button"
            data-testid="repeat-forever"
            aria-pressed={forever}
            onClick={() => setRepeat(animationId, { times: forever ? 1 : "infinite" })}
            className={
              "rounded px-2 py-0.5 text-xs " +
              (forever ? "bg-indigo-300 text-indigo-950" : "bg-neutral-900 text-neutral-400")
            }
          >
            ∞
          </button>
          {!forever && (
            <DraftNumberInput
              testid="repeat-times"
              value={typeof repeat.times === "number" ? repeat.times : 1}
              onCommit={(v) => setRepeat(animationId, { times: Math.max(1, Math.round(v)) })}
              min={1}
              step={1}
            />
          )}
        </label>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- repeat-section`
Expected: PASS.

- [ ] **Step 5: Stage and report (user commits)**

```bash
git add components/editor/repeat-section.tsx tests/repeat-section.test.tsx
```
Report commit message: `feat(editor): RepeatSection inspector controls`

---

## Task 9: Wire Shake & Repeat into the inspector

**Files:**
- Modify: `components/editor/animation-inspector.tsx`
- Test: `tests/animation-inspector.test.tsx`

- [ ] **Step 1: Update the failing test**

Replace the first test in `tests/animation-inspector.test.tsx` (it currently expects "Shake" as a SOON placeholder):

```tsx
  it("renders Easing, Duration, Shake, and Repeat sections; Stagger stays coming-soon", () => {
    const { getByText, getByTestId } = render(<AnimationInspector animationId="anim-1" />);
    expect(getByText("Easing")).toBeTruthy();
    expect(getByText("Duration")).toBeTruthy();
    expect(getByText("Shake")).toBeTruthy();
    expect(getByText("Repeat")).toBeTruthy();
    expect(getByText("Stagger")).toBeTruthy();
    // Shake is now an interactive section, not a placeholder:
    expect(getByTestId("shake-x")).toBeTruthy();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- animation-inspector`
Expected: FAIL — no `shake-x` testid (Shake is still a placeholder; Repeat absent).

- [ ] **Step 3: Add the sections and trim the placeholder list**

In `components/editor/animation-inspector.tsx`, add imports:

```ts
import { ShakeSection } from "./shake-section";
import { RepeatSection } from "./repeat-section";
```

Append two entries to `SECTIONS`:

```ts
  {
    key: "shake",
    title: "Shake",
    render: (id) => <ShakeSection animationId={id} />,
  },
  {
    key: "repeat",
    title: "Repeat",
    render: (id) => <RepeatSection animationId={id} />,
  },
```

Change the placeholder list to leave only Stagger:

```ts
const COMING_SOON = ["Stagger"];
```

- [ ] **Step 4: Run the inspector test and the full suite**

Run: `npm test -- animation-inspector`
Expected: PASS.

Run: `npm test`
Expected: PASS — entire suite green.

- [ ] **Step 5: Stage and report (user commits)**

```bash
git add components/editor/animation-inspector.tsx tests/animation-inspector.test.tsx
```
Report commit message: `feat(editor): add Shake & Repeat sections to the inspector`

---

## Task 10: Manual end-to-end verification

**Files:** none (manual).

- [ ] **Step 1: Build to confirm no type/lint errors**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 2: Run the dev server and exercise the features**

Run: `npm run dev`, open `http://localhost:3000`.
- Set a translate (drag the circle), set Shake → Left/Right 10px, Speed 4. Press Play → the circle travels *and* wobbles. ✅
- Set Repeat → Bounce, ∞. Press Play → it ping-pongs forever. ✅
- Turn Shake back to all-zero and Repeat Off. Open Export → output is the clean `cubic-bezier(...) forwards`, no `infinite`, no baked keyframes. ✅
- Turn Shake on. Open Export → baked `@keyframes` (0%…100%) with `linear` timing; toggle Repeat → `infinite`/`alternate` appears in the `animation:` shorthand. ✅

- [ ] **Step 3: Confirm WYSIWYG**

Paste the exported component into the test consumer project (`/home/cath/Desktop/project/animation-export-test/`) and confirm it plays the same as the editor preview. (This is the user's manual paste/verify step.)

- [ ] **Step 4: Stage docs if any notes were added; report**

No code commit for this task unless a fix was needed. Report completion.

---

## Self-Review (author check against the spec)

- **Spec §4 data model** → Task 1. ✅
- **Spec §5.1 computeTransform / transformString** → Task 3. ✅
- **Spec §5.2 runner repeat loop** → Task 4. ✅
- **Spec §6 exporter (shakeActive, keyframeBlock, timingFunction, animationShorthand; both emitters; conditional fidelity)** → Tasks 5 & 6, with a byte-identical golden assertion for shake-off/repeat-off. ✅
- **Spec §7 inspector UI (Shake + Repeat sections, Loop/Bounce, auto-On, remember mode)** → Tasks 7, 8, 9. ✅
- **Spec §8 store (setShake, setRepeat, backfill)** → Task 2. ✅
- **Spec §9 edge cases** → finite-count settle frame (Task 4), bounded sampling (Task 5). ✅
- **Spec §11 testing** → covered across Tasks 1–9; golden/byte-identical guard in Task 6. ✅
- **Type consistency:** `Shake`/`Repeat` field names (`amplitudeX/Y/Rotate`, `frequency`, `decay`, `enabled`, `mode`, `times`), `computeTransform`/`transformString`/`shakeActive`/`keyframeBlock`/`timingFunction`/`animationShorthand`, and `setShake`/`setRepeat` are used identically across all tasks. ✅
- **No placeholders:** every code step shows full code; no TODO/TBD. ✅
- **Stagger** remains out of scope; its "SOON" row is preserved (Task 9). ✅
