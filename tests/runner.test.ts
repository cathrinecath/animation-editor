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
