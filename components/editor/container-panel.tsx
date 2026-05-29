"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/lib/editor/store";

type ContainerPanelProps = {
  animationId: string;
};

export function ContainerPanel({ animationId }: ContainerPanelProps) {
  const container = useEditorStore((s) => s.project.container);
  const motionUnit = useEditorStore(
    (s) => s.project.animations.find((a) => a.id === animationId)?.motionUnit,
  );
  const setContainerSize = useEditorStore((s) => s.setContainerSize);
  const setMotionUnit = useEditorStore((s) => s.setMotionUnit);

  // Fix 2: treat undefined motionUnit as "container" so the UI stays coherent
  // when animationId isn't found in the store.
  const unit = motionUnit ?? "container";

  return (
    <div data-testid="container-panel" className="flex flex-col gap-3 text-xs text-neutral-700">
      <h2 className="text-sm font-semibold text-neutral-900">Container</h2>

      <div className="flex gap-3">
        <label className="flex items-center gap-1">
          <span className="text-neutral-400">W</span>
          {/* Fix 1: draft-state input — commits to store on blur only */}
          <SizeInput
            testid="container-width"
            storeValue={container.width}
            onCommit={(v) => setContainerSize(v, container.height)}
          />
        </label>
        <label className="flex items-center gap-1">
          <span className="text-neutral-400">H</span>
          <SizeInput
            testid="container-height"
            storeValue={container.height}
            onCommit={(v) => setContainerSize(container.width, v)}
          />
        </label>
      </div>

      <div className="flex gap-2">
        <ModeButton
          label="Responsive"
          active={unit === "container"}
          onClick={() => setMotionUnit(animationId, "container")}
        />
        <ModeButton
          label="Fixed"
          active={unit === "px"}
          onClick={() => setMotionUnit(animationId, "px")}
        />
      </div>
      <p className="text-neutral-400">
        {unit === "container"
          ? "Motion scales with the container (cqw/cqh)."
          : "Motion is a fixed pixel size (px)."}
      </p>
    </div>
  );
}

// ── SizeInput ──────────────────────────────────────────────────────────────────
// Mirrors the BezierInput pattern from easing-editor.tsx:
//   • local string draft for in-progress typing
//   • syncs from store value while not focused (via focusedRef + useEffect)
//   • commits to store on blur (and on Enter keydown)
//   • on commit: if blank/NaN → revert draft to store value; else clamp ≥1

type SizeInputProps = {
  testid: string;
  storeValue: number;
  onCommit: (value: number) => void;
};

function SizeInput({ testid, storeValue, onCommit }: SizeInputProps) {
  const [draft, setDraft] = useState(() => String(storeValue));
  const focusedRef = useRef(false);

  // Sync the displayed draft from the store whenever the store changes, but not
  // while the field is focused — same guard BezierInput uses so an in-progress
  // entry like "60" isn't clobbered mid-type.
  useEffect(() => {
    if (!focusedRef.current) setDraft(String(storeValue));
  }, [storeValue]);

  const commit = () => {
    focusedRef.current = false;
    const parsed = Number(draft);
    if (draft.trim() === "" || Number.isNaN(parsed)) {
      // Revert to current store value — don't write invalid input.
      setDraft(String(storeValue));
      return;
    }
    const clamped = Math.max(1, parsed);
    setDraft(String(clamped));
    onCommit(clamped);
  };

  return (
    <input
      data-testid={testid}
      type="number"
      min={1}
      value={draft}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
      }}
      onChange={(e) => setDraft(e.target.value)}
      className="w-16 px-1 py-0.5 border border-neutral-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  );
}

// ── ModeButton ─────────────────────────────────────────────────────────────────

type ModeButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function ModeButton({ label, active, onClick }: ModeButtonProps) {
  return (
    // Fix 3: type="button" prevents accidental form submission
    // Fix 4: aria-pressed for toggle accessibility
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        active
          ? "px-3 py-1 rounded bg-blue-600 text-white"
          : "px-3 py-1 rounded border border-neutral-300 hover:bg-neutral-100"
      }
    >
      {label}
    </button>
  );
}
