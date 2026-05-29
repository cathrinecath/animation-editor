import type { Animation } from "./types";
import { interpolateWaypoints } from "./interpolate";
import { evalCubicBezier } from "./bezier";

/**
 * Plays a single animation on a given DOM element. v0 supports only the
 * `mount` input type — when called, starts immediately (plus `delay`) and
 * runs for `duration`. Returns a cancel function.
 */
export function runAnimation(
  anim: Animation,
  element: HTMLElement,
  onDone?: () => void,
): () => void {
  let cancelled = false;

  const start = performance.now();
  const delay = anim.input.type === "mount" ? anim.input.delay : 0;
  const duration = anim.input.type === "mount" ? anim.input.duration : 1000;

  function tick(now: number) {
    if (cancelled) return;
    const elapsed = now - start - delay;

    if (elapsed < 0) {
      applyTransform(element, 0, anim);
      requestAnimationFrame(tick);
      return;
    }

    const t = Math.min(elapsed / duration, 1);
    applyTransform(element, t, anim);

    if (t < 1) requestAnimationFrame(tick);
    else onDone?.();
  }

  requestAnimationFrame(tick);
  return () => {
    cancelled = true;
  };
}

function applyTransform(
  element: HTMLElement,
  progress: number,
  anim: Animation,
) {
  const tx = anim.tracks.find((t) => t.property === "translateX");
  const ty = anim.tracks.find((t) => t.property === "translateY");

  // Ease the progress ONCE with a single shared easing, then drive both axes
  // from it. This keeps the motion a straight line from start to end and matches
  // the CSS export, which applies one timing function to the whole transform.
  // (Per-axis easing would bow the path and disagree with the exported code.)
  const easing = tx?.easing ?? ty?.easing;
  const eased =
    easing && easing.type === "cubic-bezier"
      ? evalCubicBezier(easing.control, progress)
      : progress;

  const x = tx ? interpolateWaypoints(tx.waypoints, eased) : 0;
  const y = ty ? interpolateWaypoints(ty.waypoints, eased) : 0;
  element.style.transform = `translate(${x}px, ${y}px)`;
}
