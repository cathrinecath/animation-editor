import type { Project, PropertyTrack, Waypoint } from "@/lib/animation/types";

/** The generated @keyframes name and matching CSS class, shared by both export modes. */
export const ANIM_NAME = "animation-anim";

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
 * Keyframe statements as bare strings, e.g. `0% { transform: translate(0px, 0px); }`.
 * Callers indent them to taste. For v0 both tracks are assumed to share the same
 * 2-point progress set; merging differing progress sets (arcs) is deferred.
 */
export function keyframeStatements(project: Project): string[] {
  const anim = project.animations[0];
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
    lines.push(`${pct}% { transform: translate(${txWp.value}px, ${tyWp.value}px); }`);
  }
  return lines;
}

function pick(track: PropertyTrack | undefined): Waypoint[] | undefined {
  return track?.waypoints;
}
