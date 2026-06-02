"use client";

import { useEditorStore } from "@/lib/editor/store";
import { DraftNumberInput } from "./draft-number-input";
import { ModeToggle } from "./mode-toggle";

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
    <div data-testid="container-panel" className="flex flex-col gap-3 text-xs text-neutral-200">
      <h2 className="text-sm font-semibold text-neutral-100">Container</h2>

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

      <ModeToggle
        options={[
          { value: "container", label: "Responsive" },
          { value: "px", label: "Fixed" },
        ]}
        value={unit}
        onChange={(v) => setMotionUnit(animationId, v as "container" | "px")}
      />
      <p className="text-neutral-400">
        {unit === "container"
          ? "Motion scales with the frame — resize the frame and the animation scales to match."
          : "Motion stays a fixed size — the frame size doesn't affect it."}
      </p>
    </div>
  );
}
