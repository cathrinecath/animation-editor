import { describe, it, expect } from "vitest";
import { evalCubicBezier } from "@/lib/animation/bezier";

describe("evalCubicBezier", () => {
  it("returns 0 at t=0", () => {
    expect(evalCubicBezier([0.42, 0, 0.58, 1], 0)).toBeCloseTo(0, 5);
  });

  it("returns 1 at t=1", () => {
    expect(evalCubicBezier([0.42, 0, 0.58, 1], 1)).toBeCloseTo(1, 5);
  });

  it("returns 0.5 at t=0.5 for symmetric ease-in-out", () => {
    expect(evalCubicBezier([0.42, 0, 0.58, 1], 0.5)).toBeCloseTo(0.5, 3);
  });

  it("is monotonically increasing", () => {
    const control: [number, number, number, number] = [0.25, 0.1, 0.25, 1];
    let prev = -Infinity;
    for (let i = 0; i <= 100; i++) {
      const v = evalCubicBezier(control, i / 100);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it("matches CSS linear curve when controls form a straight line", () => {
    // linear-equivalent bezier: controls on the diagonal
    expect(evalCubicBezier([0, 0, 1, 1], 0.3)).toBeCloseTo(0.3, 3);
  });
});
