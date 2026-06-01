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

  it("shake uses RAW progress, not eased (translate stays eased)", () => {
    // Non-linear (ease-in) easing so eased(0.5) != 0.5. Translate is held at 0
    // on both axes so x is PURELY the shake offset. At raw progress 0.5 with
    // frequency 1, sin(2π·1·0.5)=sin(π)=0, so a raw-progress shake => x≈0.
    // A buggy eased-progress shake would use eased(0.5)≈0.31 => x≈9, not 0.
    const anim = makeAnim({
      tracks: [
        {
          property: "translateX",
          waypoints: [{ progress: 0, value: 0 }, { progress: 1, value: 0 }],
          easing: { type: "cubic-bezier", control: [0.42, 0, 1, 1] }, // ease-in
        },
        {
          property: "translateY",
          waypoints: [{ progress: 0, value: 0 }, { progress: 1, value: 0 }],
          easing: { type: "cubic-bezier", control: [0.42, 0, 1, 1] },
        },
      ],
      shake: { amplitudeX: 10, amplitudeY: 0, amplitudeRotate: 0, frequency: 1, decay: 0 },
    });
    expect(computeTransform(anim, 0.5).x).toBeCloseTo(0, 5);
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
