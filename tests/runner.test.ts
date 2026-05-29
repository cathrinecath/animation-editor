import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runAnimation } from "@/lib/animation/runner";
import type { Animation } from "@/lib/animation/types";

let rafCallbacks: ((time: number) => void)[] = [];
let now = 0;

beforeEach(() => {
  rafCallbacks = [];
  now = 0;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    rafCallbacks.push(cb);
    return rafCallbacks.length;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function flushFrame(advanceMs: number) {
  now += advanceMs;
  const cbs = rafCallbacks;
  rafCallbacks = [];
  for (const cb of cbs) cb(now);
}

function makeAnim(): Animation {
  return {
    id: "a",
    elementId: "e",
    motionUnit: "px",
    input: { type: "mount", delay: 0, duration: 1000 },
    tracks: [
      {
        property: "translateX",
        waypoints: [
          { progress: 0, value: 0 },
          { progress: 1, value: 100 },
        ],
        easing: { type: "cubic-bezier", control: [0, 0, 1, 1] },
      },
      {
        property: "translateY",
        waypoints: [
          { progress: 0, value: 0 },
          { progress: 1, value: 0 },
        ],
        easing: { type: "cubic-bezier", control: [0, 0, 1, 1] },
      },
    ],
  };
}

describe("runAnimation", () => {
  it("applies start transform on the first tick", () => {
    const el = document.createElement("div");
    runAnimation(makeAnim(), el);
    flushFrame(0);
    expect(el.style.transform).toMatch(/translate\(0(\.0+)?px,\s*0(\.0+)?px\)/);
  });

  it("interpolates the transform linearly with linear bezier", () => {
    const el = document.createElement("div");
    runAnimation(makeAnim(), el);
    flushFrame(0);
    flushFrame(500); // halfway through 1000ms
    expect(el.style.transform).toMatch(/translate\(50(\.\d+)?px/);
  });

  it("applies the end transform after the duration completes", () => {
    const el = document.createElement("div");
    runAnimation(makeAnim(), el);
    flushFrame(0);
    flushFrame(1100); // past the end
    expect(el.style.transform).toMatch(/translate\(100(\.\d+)?px/);
  });

  it("calls onDone once when the animation completes", () => {
    const el = document.createElement("div");
    const onDone = vi.fn();
    runAnimation(makeAnim(), el, onDone);
    flushFrame(0);
    expect(onDone).not.toHaveBeenCalled();
    flushFrame(1000); // reaches the end
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("moves in a straight line — both axes share one easing (matches the CSS export)", () => {
    const el = document.createElement("div");
    const anim = makeAnim();
    // A diagonal move: X -> 200, Y -> 100.
    anim.tracks[0].waypoints[1].value = 200;
    anim.tracks[1].waypoints[1].value = 100;
    // Give the two axes DIFFERENT easings. The motion must still be a straight
    // line, because the export applies one timing function to the whole transform.
    anim.tracks[0].easing = { type: "cubic-bezier", control: [0.42, 0, 0, 1] };
    anim.tracks[1].easing = { type: "cubic-bezier", control: [0, 0, 0.58, 1] };

    runAnimation(anim, el);
    flushFrame(0);
    flushFrame(500); // mid-animation

    const m = el.style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
    const x = Number(m![1]);
    const y = Number(m![2]);
    // Straight line from (0,0) to (200,100): y must be exactly half of x.
    expect(y).toBeCloseTo(x / 2, 5);
  });

  it("does not call onDone if cancelled before completing", () => {
    const el = document.createElement("div");
    const onDone = vi.fn();
    const cancel = runAnimation(makeAnim(), el, onDone);
    flushFrame(0);
    cancel();
    flushFrame(1000);
    expect(onDone).not.toHaveBeenCalled();
  });
});
