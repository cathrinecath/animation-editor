import type { MotionUnit, Project, PropertyTrack, Waypoint } from "@/lib/animation/types";
import type { Animation } from "@/lib/animation/types";
import { computeTransform } from "@/lib/animation/transform";

/** The generated @keyframes name and matching CSS class, shared by both export modes. */
export const ANIM_NAME = "animation-anim";

/** The generated parent/container class, shared by both export modes. */
export const PARENT_CLASS = "animation-parent";

/** Animation duration in seconds, derived from the mount input (defaults to 1s). */
export function durationSec(project: Project): number {
  const anim = project.animations[0];
  return anim && anim.input.type === "mount" ? anim.input.duration / 1000 : 1;
}

/** The CSS timing-function string, e.g. `cubic-bezier(0.42, 0, 0.58, 1)`. */
export function easingString(project: Project): string {
  const anim = project.animations[0];
  const tx = anim?.tracks.find((t) => t.property === "translateX");
  const ty = anim?.tracks.find((t) => t.property === "translateY");
  const easing = tx?.easing ?? ty?.easing;
  return easing && easing.type === "cubic-bezier"
    ? `cubic-bezier(${easing.control.join(", ")})`
    : "linear";
}

/**
 * Format a stored px waypoint value as a CSS length for the given axis & unit.
 * - "px" → the px verbatim.
 * - "container" → a percentage of the container in that axis, as cqw (x) / cqh (y).
 */
export function cssLength(
  value: number,
  unit: MotionUnit,
  axis: "x" | "y",
  container: { width: number; height: number },
): string {
  if (unit === "px") return `${value}px`;
  const dim = axis === "x" ? container.width : container.height;
  const pct = dim === 0 ? 0 : round3((value / dim) * 100);
  return `${pct}${axis === "x" ? "cqw" : "cqh"}`;
}

/**
 * Keyframe statements as bare strings, e.g. `0% { transform: translate(0cqw, 0cqh); }`.
 * Callers indent them to taste. For v0 both tracks share the same 2-point progress set.
 */
export function keyframeStatements(project: Project): string[] {
  const anim = project.animations[0];
  const unit: MotionUnit = anim?.motionUnit ?? "px";
  const tx = anim?.tracks.find((t) => t.property === "translateX");
  const ty = anim?.tracks.find((t) => t.property === "translateY");

  const fallback: Waypoint[] = [
    { progress: 0, value: 0 },
    { progress: 1, value: 0 },
  ];
  const txWaypoints: Waypoint[] = pick(tx) ?? fallback;
  const tyWaypoints: Waypoint[] = pick(ty) ?? fallback;

  const count = Math.max(txWaypoints.length, tyWaypoints.length);
  const lines: string[] = [];
  for (let i = 0; i < count; i++) {
    const txWp = txWaypoints[Math.min(i, txWaypoints.length - 1)];
    const tyWp = tyWaypoints[Math.min(i, tyWaypoints.length - 1)];
    const pct = Math.round(txWp.progress * 100);
    const xL = cssLength(txWp.value, unit, "x", project.container);
    const yL = cssLength(tyWp.value, unit, "y", project.container);
    lines.push(`${pct}% { transform: translate(${xL}, ${yL}); }`);
  }
  return lines;
}

/**
 * The `.animation-parent` rule. In container mode it is a size-container with
 * definite px dimensions (the design's container size) so cqw/cqh resolve and
 * the export renders correctly anywhere on paste. In px mode it is a fixed-size
 * relative box. `overflow: visible` so motion designed beyond the box still shows.
 */
export function parentCss(project: Project): string {
  const anim = project.animations[0];
  const unit: MotionUnit = anim?.motionUnit ?? "px";
  const { width, height } = project.container;
  if (unit === "container") {
    return [
      `.${PARENT_CLASS} {`,
      `  /* Sized to your design so it renders correctly anywhere on paste.`,
      `     To fill the parent fluidly instead, set width:100% (the element`,
      `     you place this in must have a definite width). */`,
      `  container-type: size;`,
      `  position: relative;`,
      `  width: ${width}px;`,
      `  height: ${height}px;`,
      `  overflow: visible;`,
      `}`,
    ].join("\n");
  }
  return [
    `.${PARENT_CLASS} {`,
    `  position: relative;`,
    `  width: ${width}px;`,
    `  height: ${height}px;`,
    `  overflow: visible;`,
    `}`,
  ].join("\n");
}

function pick(track: PropertyTrack | undefined): Waypoint[] | undefined {
  return track?.waypoints;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

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
