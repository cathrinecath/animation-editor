import type { Waypoint } from "./types";

/**
 * Linearly interpolate a value across an ordered list of waypoints based on
 * a progress value in [0, 1].
 *
 * Waypoints must be sorted by `progress` ascending. The function clamps
 * out-of-range progress to the first/last value. Works with 2 or more
 * waypoints — the same loop covers both v0 (2-point) and arc (3+).
 */
export function interpolateWaypoints(
  waypoints: Waypoint[],
  progress: number,
): number {
  if (waypoints.length === 0) return 0;
  if (progress <= waypoints[0].progress) return waypoints[0].value;
  if (progress >= waypoints[waypoints.length - 1].progress) {
    return waypoints[waypoints.length - 1].value;
  }

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (progress >= a.progress && progress <= b.progress) {
      const range = b.progress - a.progress;
      if (range === 0) return a.value;
      const localT = (progress - a.progress) / range;
      return a.value + (b.value - a.value) * localT;
    }
  }

  return waypoints[waypoints.length - 1].value;
}
