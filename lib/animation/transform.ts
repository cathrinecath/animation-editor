import type { Animation } from "./types";
import { interpolateWaypoints } from "./interpolate";
import { evalCubicBezier } from "./bezier";

export type Transform = { x: number; y: number; rotate: number };

/**
 * The single source of the eased + shaken transform at a given raw play
 * progress in [0, 1]. The translate is eased once (shared easing across both
 * axes, matching the CSS export); shake oscillates in REAL time (raw progress),
 * layered on top. Both the preview runner and the baked exporter call this, so
 * they cannot disagree.
 */
export function computeTransform(anim: Animation, progress: number): Transform {
  const tx = anim.tracks.find((t) => t.property === "translateX");
  const ty = anim.tracks.find((t) => t.property === "translateY");

  const easing = tx?.easing ?? ty?.easing;
  const eased =
    easing && easing.type === "cubic-bezier"
      ? evalCubicBezier(easing.control, progress)
      : progress;

  let x = tx ? interpolateWaypoints(tx.waypoints, eased) : 0;
  let y = ty ? interpolateWaypoints(ty.waypoints, eased) : 0;
  let rotate = 0;

  const s = anim.shake;
  if (s) {
    const wave = Math.sin(2 * Math.PI * s.frequency * progress);
    const damp = 1 - s.decay * progress;
    const env = wave * damp;
    x += s.amplitudeX * env;
    y += s.amplitudeY * env;
    rotate += s.amplitudeRotate * env;
  }

  return { x, y, rotate };
}

/** Build the CSS transform string, omitting rotate when it is exactly 0. */
export function transformString({ x, y, rotate }: Transform): string {
  const base = `translate(${x}px, ${y}px)`;
  return rotate !== 0 ? `${base} rotate(${rotate}deg)` : base;
}
