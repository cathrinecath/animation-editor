"use client";

import type { ReactNode } from "react";
import { useEditorStore } from "@/lib/editor/store";
import { Section } from "./section";
import { EasingEditor } from "./easing-editor";
import { DraftNumberInput } from "./draft-number-input";
import { ShakeSection } from "./shake-section";
import { RepeatSection } from "./repeat-section";

const MIN_DURATION_SEC = 0.1;

function DurationControl({ animationId }: { animationId: string }) {
  const durationMs = useEditorStore((s) => {
    const anim = s.project.animations.find((a) => a.id === animationId);
    return anim && anim.input.type === "mount" ? anim.input.duration : 1000;
  });
  const setDuration = useEditorStore((s) => s.setDuration);
  const seconds = durationMs / 1000;

  return (
    <label className="flex items-center gap-2 text-xs text-neutral-300">
      <DraftNumberInput
        testid="duration-seconds"
        value={seconds}
        onCommit={(s) =>
          // DraftNumberInput already clamps to min before committing; the Math.max
          // is belt-and-suspenders so the ms conversion never depends on that contract.
          setDuration(animationId, Math.round(Math.max(MIN_DURATION_SEC, s) * 1000))
        }
        min={MIN_DURATION_SEC}
        step={0.1}
      />
      <span className="text-neutral-500">seconds</span>
    </label>
  );
}

// Open/Closed seam: add a feature by appending here (and writing its render).
const SECTIONS: { key: string; title: string; render: (animationId: string) => ReactNode }[] = [
  {
    key: "easing",
    title: "Easing",
    render: (id) => <EasingEditor animationId={id} trackIndex={0} />,
  },
  {
    key: "duration",
    title: "Duration",
    render: (id) => <DurationControl animationId={id} />,
  },
  {
    key: "shake",
    title: "Shake",
    render: (id) => <ShakeSection animationId={id} />,
  },
  {
    key: "repeat",
    title: "Repeat",
    render: (id) => <RepeatSection animationId={id} />,
  },
];

const COMING_SOON = ["Stagger"];

type AnimationInspectorProps = {
  animationId: string;
};

export function AnimationInspector({ animationId }: AnimationInspectorProps) {
  return (
    <div data-testid="animation-inspector" className="flex flex-col">
      {SECTIONS.map((s) => (
        <Section key={s.key} title={s.title} defaultOpen>
          {s.render(animationId)}
        </Section>
      ))}
      {COMING_SOON.map((label) => (
        <div
          key={label}
          className="flex items-center justify-between border-t border-neutral-700 py-2.5 px-1 text-xs font-bold tracking-wide text-neutral-600"
        >
          <span>{label}</span>
          <span className="rounded bg-neutral-700 px-1.5 py-0.5 text-[10px] text-neutral-400">
            SOON
          </span>
        </div>
      ))}
    </div>
  );
}
