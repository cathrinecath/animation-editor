import { describe, it, expect } from "vitest";
import { interpolateWaypoints } from "@/lib/animation/interpolate";

describe("interpolateWaypoints", () => {
  it("returns first waypoint's value before any progress", () => {
    expect(
      interpolateWaypoints(
        [{ progress: 0, value: 10 }, { progress: 1, value: 100 }],
        0,
      ),
    ).toBe(10);
  });

  it("returns last waypoint's value at full progress", () => {
    expect(
      interpolateWaypoints(
        [{ progress: 0, value: 10 }, { progress: 1, value: 100 }],
        1,
      ),
    ).toBe(100);
  });

  it("linearly interpolates between two waypoints", () => {
    expect(
      interpolateWaypoints(
        [{ progress: 0, value: 0 }, { progress: 1, value: 200 }],
        0.5,
      ),
    ).toBe(100);
  });

  it("handles 3 waypoints by selecting the right segment", () => {
    const wp = [
      { progress: 0, value: 0 },
      { progress: 0.5, value: 200 },
      { progress: 1, value: 100 },
    ];
    expect(interpolateWaypoints(wp, 0.25)).toBe(100);
    expect(interpolateWaypoints(wp, 0.5)).toBe(200);
    expect(interpolateWaypoints(wp, 0.75)).toBe(150);
  });

  it("clamps progress beyond bounds", () => {
    const wp = [{ progress: 0, value: 5 }, { progress: 1, value: 15 }];
    expect(interpolateWaypoints(wp, -1)).toBe(5);
    expect(interpolateWaypoints(wp, 2)).toBe(15);
  });
});
