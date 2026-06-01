import { describe, it, expect } from "vitest";
import { exportProject, exportFiles } from "@/lib/exporter";
import {
  shakeActive,
  keyframeBlock,
  timingFunction,
  animationShorthand,
} from "@/lib/exporter/shared";
import { DEFAULT_PROJECT, type Project } from "@/lib/animation/types";

// Default project is container mode, container 400x300. X=200 -> 50cqw, Y=0 -> 0cqh.
function makeProject(): Project {
  const p = structuredClone(DEFAULT_PROJECT);
  p.animations[0].tracks[0].waypoints[1].value = 200;
  p.animations[0].tracks[1].waypoints[1].value = 0;
  return p;
}

function makePxProject(): Project {
  const p = makeProject();
  p.animations[0].motionUnit = "px";
  return p;
}

describe("exportProject (all-in-one)", () => {
  it("returns a string", () => {
    expect(typeof exportProject(makeProject())).toBe("string");
  });

  it("includes the React component declaration with the parent wrapper", () => {
    const out = exportProject(makeProject());
    expect(out).toContain("export function Animation");
    expect(out).toContain("children");
    expect(out).toContain('className="animation-parent"');
    expect(out).toContain('className="animation-anim"');
  });

  it("container mode emits cqw/cqh keyframes and a size container", () => {
    const out = exportProject(makeProject());
    expect(out).toContain("@keyframes");
    expect(out).toContain("translate(0cqw, 0cqh)");
    expect(out).toContain("translate(50cqw, 0cqh)");
    expect(out).toContain("container-type: size");
    expect(out).toContain("aspect-ratio: 400 / 300");
  });

  it("px mode emits px keyframes and a fixed-size parent", () => {
    const out = exportProject(makePxProject());
    expect(out).toContain("translate(0px, 0px)");
    expect(out).toContain("translate(200px, 0px)");
    expect(out).not.toContain("cqw");
    expect(out).toContain("width: 400px");
    expect(out).toContain("height: 300px");
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

describe("exportFiles", () => {
  it("single-file mode returns one self-contained Animation.tsx (with inline style)", () => {
    const files = exportFiles(makeProject(), "single-file");
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe("Animation.tsx");
    expect(files[0].language).toBe("tsx");
    expect(files[0].code).toContain("export function Animation");
    expect(files[0].code).toContain("<style>");
    expect(files[0].code).toContain("@keyframes");
  });

  it("multi-file mode returns a .tsx component file and a .css file", () => {
    const files = exportFiles(makeProject(), "multi-file");
    const names = files.map((f) => f.name);
    expect(names).toContain("Animation.tsx");
    expect(names).toContain("animation.css");
  });

  it("multi-file component imports the css, renders the parent + anim classes, no inline style", () => {
    const files = exportFiles(makeProject(), "multi-file");
    const tsx = files.find((f) => f.name === "Animation.tsx")!;
    expect(tsx.language).toBe("tsx");
    expect(tsx.code).toContain('import "./animation.css"');
    expect(tsx.code).toContain('className="animation-parent"');
    expect(tsx.code).toContain('className="animation-anim"');
    expect(tsx.code).toContain("export function Animation");
    expect(tsx.code).not.toContain("<style>");
    expect(tsx.code).not.toContain("@keyframes");
  });

  it("multi-file css holds the parent rule, cqw/cqh keyframes, easing and duration", () => {
    const p = makeProject();
    p.animations[0].input = { type: "mount", delay: 0, duration: 1500 };
    p.animations[0].tracks[0].easing = {
      type: "cubic-bezier",
      control: [0.25, 0.1, 0.25, 1],
    };
    const files = exportFiles(p, "multi-file");
    const css = files.find((f) => f.name === "animation.css")!;
    expect(css.language).toBe("css");
    expect(css.code).toContain(".animation-parent");
    expect(css.code).toContain("container-type: size");
    expect(css.code).toContain("@keyframes");
    expect(css.code).toContain("translate(0cqw, 0cqh)");
    expect(css.code).toContain("translate(50cqw, 0cqh)");
    expect(css.code).toContain("cubic-bezier(0.25, 0.1, 0.25, 1)");
    expect(css.code).toContain("1.5s");
  });
});

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
