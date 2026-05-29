import { describe, it, expect } from "vitest";
import { exportProject } from "@/lib/exporter";
import { DEFAULT_PROJECT, type Project } from "@/lib/animation/types";

function makeProject(): Project {
  const p = structuredClone(DEFAULT_PROJECT);
  p.animations[0].tracks[0].waypoints[1].value = 200;
  p.animations[0].tracks[1].waypoints[1].value = 0;
  return p;
}

describe("exportProject (all-in-one)", () => {
  it("returns a string", () => {
    expect(typeof exportProject(makeProject())).toBe("string");
  });

  it("includes the React component declaration", () => {
    const out = exportProject(makeProject());
    expect(out).toContain("export function Animation");
    expect(out).toContain("children");
  });

  it("emits the @keyframes from translate waypoints", () => {
    const out = exportProject(makeProject());
    expect(out).toContain("@keyframes");
    expect(out).toContain("translate(0px, 0px)");
    expect(out).toContain("translate(200px, 0px)");
  });

  it("emits the cubic-bezier from the easing control points", () => {
    const p = makeProject();
    p.animations[0].tracks[0].easing = {
      type: "cubic-bezier",
      control: [0.25, 0.1, 0.25, 1],
    };
    const out = exportProject(p);
    expect(out).toContain("cubic-bezier(0.25, 0.1, 0.25, 1)");
  });

  it("emits the duration from input.duration in seconds", () => {
    const p = makeProject();
    p.animations[0].input = { type: "mount", delay: 0, duration: 1500 };
    const out = exportProject(p);
    expect(out).toContain("1.5s");
  });
});
