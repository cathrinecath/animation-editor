import type { Animation, PropertyTrack } from "./types";
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
  const x = tx ? evalTrack(tx, progress) : 0;
  const y = ty ? evalTrack(ty, progress) : 0;
  element.style.transform = `translate(${x}px, ${y}px)`;
}

function evalTrack(track: PropertyTrack, progress: number): number {
  const easing = track.easing;
  const eased =
    easing.type === "cubic-bezier"
      ? evalCubicBezier(easing.control, progress)
      : progress;
  return interpolateWaypoints(track.waypoints, eased);
}
