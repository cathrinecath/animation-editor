"use client";

import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_SHAKE, type Shake } from "@/lib/animation/types";
import { DraftNumberInput } from "./draft-number-input";

const FIELDS: { key: keyof Shake; testid: string; label: string; unit: string; min?: number }[] = [
  { key: "amplitudeX", testid: "shake-x", label: "Left / Right", unit: "px" },
  { key: "amplitudeY", testid: "shake-y", label: "Up / Down", unit: "px" },
  { key: "amplitudeRotate", testid: "shake-rotate", label: "Rotate", unit: "deg" },
  { key: "frequency", testid: "shake-frequency", label: "Speed", unit: "shakes", min: 0 },
  { key: "decay", testid: "shake-decay", label: "Settle", unit: "0–1", min: 0 },
];

export function ShakeSection({ animationId }: { animationId: string }) {
  const shake = useEditorStore((s) => {
    const anim = s.project.animations.find((a) => a.id === animationId);
    return anim?.shake ?? DEFAULT_SHAKE;
  });
  const setShake = useEditorStore((s) => s.setShake);

  return (
    <div className="flex flex-col gap-2">
      {FIELDS.map((f) => (
        <label key={f.key} className="flex items-center justify-between gap-2 text-xs text-neutral-300">
          <span>{f.label}</span>
          <span className="flex items-center gap-1.5">
            <DraftNumberInput
              testid={f.testid}
              value={shake[f.key]}
              onCommit={(v) => setShake(animationId, { [f.key]: v })}
              min={f.min}
              step={f.key === "decay" ? 0.1 : 1}
            />
            <span className="w-10 text-neutral-500">{f.unit}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
