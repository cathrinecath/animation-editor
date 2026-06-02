import type { Animation } from "./types";
import { computeTransform, transformString } from "./transform";

/**
 * Plays a single animation on a DOM element. v0 input type is `mount` — starts
 * after `delay`, runs for `duration`. With `repeat.enabled` it loops (Loop =
 * restart, Bounce = alternate), finitely (`times`) or forever (`"infinite"`).
 * Returns a cancel function.
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
  const repeat = anim.repeat;

  function apply(progress: number) {
    element.style.transform = transformString(computeTransform(anim, progress));
  }

  function tick(now: number) {
    if (cancelled) return;
    const elapsed = now - start - delay;

    if (elapsed < 0) {
      apply(0);
      requestAnimationFrame(tick);
      return;
    }

    if (repeat.enabled) {
      const iter = Math.floor(elapsed / duration);
      const finished = repeat.times !== "infinite" && iter >= repeat.times;
      if (finished) {
        // Settle on the last completed iteration's end frame. With alternate
        // (Bounce), an ODD count ends on a forward pass (progress 1); an EVEN
        // count ends on a reverse pass (progress 0). Loop always ends at 1.
        // This matches CSS `alternate ... forwards`, keeping preview == export.
        const endsReversed = repeat.mode === "bounce" && (repeat.times as number) % 2 === 0;
        apply(endsReversed ? 0 : 1);
        onDone?.();
        return;
      }
      const local = (elapsed % duration) / duration;
      const reversed = repeat.mode === "bounce" && iter % 2 === 1;
      apply(reversed ? 1 - local : local);
      requestAnimationFrame(tick);
      return;
    }

    const t = Math.min(elapsed / duration, 1);
    apply(t);
    if (t < 1) requestAnimationFrame(tick);
    else onDone?.();
  }

  requestAnimationFrame(tick);
  return () => {
    cancelled = true;
  };
}
