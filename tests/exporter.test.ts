import { describe, it, expect } from "vitest";
import { exportProject, exportFiles } from "@/lib/exporter";
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
