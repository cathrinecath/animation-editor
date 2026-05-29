"use client";

import { useRef } from "react";
import { useEditorStore } from "@/lib/editor/store";
import { useDrag } from "@/lib/editor/drag";

const GRAPH_SIZE = 200;

type EasingEditorProps = {
  animationId: string;
  trackIndex: number;
};

export function EasingEditor({ animationId, trackIndex }: EasingEditorProps) {
  const easing = useEditorStore((s) => {
    const anim = s.project.animations.find((a) => a.id === animationId);
    return anim?.tracks[trackIndex]?.easing;
  });
  const setEasingControl = useEditorStore((s) => s.setEasingControl);

  if (!easing || easing.type !== "cubic-bezier") return null;
  const [x1, y1, x2, y2] = easing.control;

  const update = (i: 0 | 1, x: number, y: number) => {
    const cx = clamp01(x);
    const cy = clamp01(y);
    const next = i === 0 ? [cx, cy, x2, y2] : [x1, y1, cx, cy];
    setEasingControl(animationId, trackIndex, next as [number, number, number, number]);
  };

  return (
    <div className="flex flex-col gap-2">
      <svg
        data-testid="easing-graph"
        viewBox={`0 0 ${GRAPH_SIZE} ${GRAPH_SIZE}`}
        width={GRAPH_SIZE}
        height={GRAPH_SIZE}
        style={{ background: "#fafafa", border: "1px solid #e5e7eb", borderRadius: 4 }}
      >
        <line x1={0} y1={GRAPH_SIZE} x2={GRAPH_SIZE} y2={0} stroke="#d1d5db" strokeDasharray="3 3" />
        <path
          d={`M 0 ${GRAPH_SIZE} C ${x1 * GRAPH_SIZE} ${(1 - y1) * GRAPH_SIZE}, ${x2 * GRAPH_SIZE} ${(1 - y2) * GRAPH_SIZE}, ${GRAPH_SIZE} 0`}
          stroke="#3b82f6"
          strokeWidth={2}
          fill="none"
        />
        <ControlPoint
          testid="easing-control-p1"
          x={x1 * GRAPH_SIZE}
          y={(1 - y1) * GRAPH_SIZE}
          onMove={(px, py) => update(0, px / GRAPH_SIZE, 1 - py / GRAPH_SIZE)}
        />
        <ControlPoint
          testid="easing-control-p2"
          x={x2 * GRAPH_SIZE}
          y={(1 - y2) * GRAPH_SIZE}
          onMove={(px, py) => update(1, px / GRAPH_SIZE, 1 - py / GRAPH_SIZE)}
        />
      </svg>
      <code data-testid="easing-string" className="text-xs font-mono text-neutral-700">
        cubic-bezier({x1}, {y1}, {x2}, {y2})
      </code>
    </div>
  );
}

type ControlPointProps = {
  testid: string;
  x: number;
  y: number;
  onMove: (x: number, y: number) => void;
};

function ControlPoint({ testid, x, y, onMove }: ControlPointProps) {
  // Capture the position at pointer-down so each pointer-move delta is applied
  // to the original anchor, not to the live-updating prop value. Without this,
  // the parent's state update mid-drag causes the next delta to be added to an
  // already-shifted position, doubling the apparent speed.
  const startRef = useRef<{ x: number; y: number }>({ x, y });

  const { handlers } = useDrag({
    onStart: () => {
      startRef.current = { x, y };
    },
    onMove: (dx, dy) => onMove(startRef.current.x + dx, startRef.current.y + dy),
  });

  return (
    <circle
      data-testid={testid}
      cx={x}
      cy={y}
      r={6}
      fill="#3b82f6"
      style={{ cursor: "grab", touchAction: "none" }}
      {...handlers}
    />
  );
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
