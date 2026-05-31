"use client";

import { useEditorStore } from "@/lib/editor/store";
import { DraftNumberInput } from "./draft-number-input";

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
          <DraftNumberInput
            testid="container-width"
            value={container.width}
            onCommit={(v) => setContainerSize(v, container.height)}
            min={1}
          />
        </label>
        <label className="flex items-center gap-1">
          <span className="text-neutral-400">H</span>
          <DraftNumberInput
            testid="container-height"
            value={container.height}
            onCommit={(v) => setContainerSize(container.width, v)}
            min={1}
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
