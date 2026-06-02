"use client";

import { useRef } from "react";
import { useEditorStore } from "@/lib/editor/store";
import { useDrag } from "@/lib/editor/drag";
import { DraftNumberInput } from "./draft-number-input";

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

  // Dragging produces noisy floats, so round to 2 decimals for clean values.
  const update = (i: 0 | 1, x: number, y: number) => {
    const cx = round2(clamp01(x));
    const cy = round2(clamp01(y));
    const next = i === 0 ? [cx, cy, x2, y2] : [x1, y1, cx, cy];
    setEasingControl(animationId, trackIndex, next as [number, number, number, number]);
  };

  // Typed values are taken as-is (clamped only) so the user can enter an exact
  // number rather than being snapped to the diagram's rounding.
  const setControlAt = (i: number, value: number) => {
    const next: [number, number, number, number] = [x1, y1, x2, y2];
    next[i] = clamp01(value);
    setEasingControl(animationId, trackIndex, next);
  };

  return (
    <div className="flex flex-col gap-2">
      <svg
        data-testid="easing-graph"
        viewBox={`0 0 ${GRAPH_SIZE} ${GRAPH_SIZE}`}
        width={GRAPH_SIZE}
        height={GRAPH_SIZE}
        style={{ background: "#171717", border: "1px solid #404040", borderRadius: 4 }}
      >
        <line x1={0} y1={GRAPH_SIZE} x2={GRAPH_SIZE} y2={0} stroke="#525252" strokeDasharray="3 3" />
        <path
          d={`M 0 ${GRAPH_SIZE} C ${x1 * GRAPH_SIZE} ${(1 - y1) * GRAPH_SIZE}, ${x2 * GRAPH_SIZE} ${(1 - y2) * GRAPH_SIZE}, ${GRAPH_SIZE} 0`}
          stroke="#60a5fa"
          strokeWidth={2}
          fill="none"
        />
        <ControlPoint
          testid="easing-control-p1"
          label="P1"
          x={x1 * GRAPH_SIZE}
          y={(1 - y1) * GRAPH_SIZE}
          onMove={(px, py) => update(0, px / GRAPH_SIZE, 1 - py / GRAPH_SIZE)}
        />
        <ControlPoint
          testid="easing-control-p2"
          label="P2"
          x={x2 * GRAPH_SIZE}
          y={(1 - y2) * GRAPH_SIZE}
          onMove={(px, py) => update(1, px / GRAPH_SIZE, 1 - py / GRAPH_SIZE)}
        />
      </svg>
      <div
        data-testid="easing-inputs"
        className="flex flex-col gap-3 text-xs text-neutral-200"
      >
        <ControlPointInputs
          label="Control point 1"
          xTestid="easing-input-x1"
          yTestid="easing-input-y1"
          x={x1}
          y={y1}
          onCommitX={(n) => setControlAt(0, n)}
          onCommitY={(n) => setControlAt(1, n)}
        />
        <ControlPointInputs
          label="Control point 2"
          xTestid="easing-input-x2"
          yTestid="easing-input-y2"
          x={x2}
          y={y2}
          onCommitX={(n) => setControlAt(2, n)}
          onCommitY={(n) => setControlAt(3, n)}
        />
      </div>
    </div>
  );
}

type ControlPointProps = {
  testid: string;
  label: string;
  x: number;
  y: number;
  onMove: (x: number, y: number) => void;
};

function ControlPoint({ testid, label, x, y, onMove }: ControlPointProps) {
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

  // Label sits above the dot, but flips below when the handle is near the top
  // edge so it never clips outside the graph. Children don't receive pointer
  // events, so the whole group is the single drag target.
  const labelY = y > 24 ? y - 12 : y + 20;
  return (
    <g data-testid={testid} style={{ cursor: "grab", touchAction: "none" }} {...handlers}>
      <circle cx={x} cy={y} r={6} fill="#60a5fa" />
      <text
        x={x}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
        fill="#93c5fd"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {label}
      </text>
    </g>
  );
}

type ControlPointInputsProps = {
  label: string;
  xTestid: string;
  yTestid: string;
  x: number;
  y: number;
  onCommitX: (value: number) => void;
  onCommitY: (value: number) => void;
};

function ControlPointInputs({
  label,
  xTestid,
  yTestid,
  x,
  y,
  onCommitX,
  onCommitY,
}: ControlPointInputsProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-neutral-300">{label}</span>
      <div className="flex gap-3">
        <label className="flex items-center gap-1">
          <span className="text-neutral-400">X</span>
          <DraftNumberInput
            testid={xTestid}
            value={x}
            onCommit={onCommitX}
            commitMode="change"
            min={0}
            max={1}
            step={0.01}
            className="w-12 px-1 py-0.5 border border-neutral-600 bg-neutral-900 text-neutral-100 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>
        <label className="flex items-center gap-1">
          <span className="text-neutral-400">Y</span>
          <DraftNumberInput
            testid={yTestid}
            value={y}
            onCommit={onCommitY}
            commitMode="change"
            min={0}
            max={1}
            step={0.01}
            className="w-12 px-1 py-0.5 border border-neutral-600 bg-neutral-900 text-neutral-100 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>
      </div>
    </div>
  );
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
