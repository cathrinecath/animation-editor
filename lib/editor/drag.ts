"use client";

import { useCallback, useRef } from "react";

export type UseDragOptions = {
  onStart?: () => void;
  onMove?: (dx: number, dy: number) => void;
  onEnd?: (totalDx: number, totalDy: number) => void;
};

type Origin = { x: number; y: number; pointerId: number } | null;

/**
 * Pointer-event based drag hook. Reports deltas from the pointer's starting
 * position (i.e. delta is total displacement from pointer-down, not since the
 * last move). Consumers that update parent state on each move should capture
 * their initial state in `onStart` and apply incoming deltas to that snapshot,
 * not to their currently-rendered props.
 *
 * Used by both Circle and EasingEditor control points.
 *
 * Returns handlers to spread on the draggable element.
 */
export function useDrag(options: UseDragOptions = {}) {
  const originRef = useRef<Origin>(null);
  const { onStart, onMove, onEnd } = options;

  const onPointerDown = useCallback(
    (e: React.PointerEvent<Element>) => {
      originRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
      onStart?.();
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [onStart],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<Element>) => {
      const origin = originRef.current;
      if (!origin || origin.pointerId !== e.pointerId) return;
      onMove?.(e.clientX - origin.x, e.clientY - origin.y);
    },
    [onMove],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<Element>) => {
      const origin = originRef.current;
      if (!origin || origin.pointerId !== e.pointerId) return;
      onEnd?.(e.clientX - origin.x, e.clientY - origin.y);
      originRef.current = null;
      e.currentTarget.releasePointerCapture(e.pointerId);
    },
    [onEnd],
  );

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp },
  };
}
