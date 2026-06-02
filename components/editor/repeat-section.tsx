"use client";

import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_REPEAT } from "@/lib/animation/types";
import { DraftNumberInput } from "./draft-number-input";

function modeButton(active: boolean): string {
  return (
    "flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors " +
    (active ? "bg-indigo-300 text-indigo-950" : "bg-neutral-900 text-neutral-400 hover:text-neutral-200")
  );
}

export function RepeatSection({ animationId }: { animationId: string }) {
  const repeat = useEditorStore((s) => {
    const anim = s.project.animations.find((a) => a.id === animationId);
    return anim?.repeat ?? DEFAULT_REPEAT;
  });
  const setRepeat = useEditorStore((s) => s.setRepeat);

  const forever = repeat.times === "infinite";

  return (
    <div className="flex flex-col gap-3">
      {/* On/Off + mode: clicking a mode while Off flips it On in one action. */}
      <div className="flex gap-2">
        <button
          type="button"
          data-testid="repeat-off"
          aria-pressed={!repeat.enabled}
          onClick={() => setRepeat(animationId, { enabled: false })}
          className={modeButton(!repeat.enabled)}
        >
          Off
        </button>
        <button
          type="button"
          data-testid="repeat-loop"
          aria-pressed={repeat.enabled && repeat.mode === "loop"}
          onClick={() => setRepeat(animationId, { enabled: true, mode: "loop" })}
          className={modeButton(repeat.enabled && repeat.mode === "loop")}
        >
          Loop
        </button>
        <button
          type="button"
          data-testid="repeat-bounce"
          aria-pressed={repeat.enabled && repeat.mode === "bounce"}
          onClick={() => setRepeat(animationId, { enabled: true, mode: "bounce" })}
          className={modeButton(repeat.enabled && repeat.mode === "bounce")}
        >
          Bounce
        </button>
      </div>

      {repeat.enabled && (
        <p className="text-[11px] text-neutral-500">
          {repeat.mode === "bounce" ? "Plays forward, then backward." : "Plays again from the start."}
        </p>
      )}

      {repeat.enabled && (
        <label className="flex items-center gap-2 text-xs text-neutral-300">
          <span>Times</span>
          <button
            type="button"
            data-testid="repeat-forever"
            aria-pressed={forever}
            onClick={() => setRepeat(animationId, { times: forever ? 1 : "infinite" })}
            className={
              "rounded px-2 py-0.5 text-xs " +
              (forever ? "bg-indigo-300 text-indigo-950" : "bg-neutral-900 text-neutral-400")
            }
          >
            ∞
          </button>
          {!forever && (
            <DraftNumberInput
              testid="repeat-times"
              value={typeof repeat.times === "number" ? repeat.times : 1}
              onCommit={(v) => setRepeat(animationId, { times: Math.max(1, Math.round(v)) })}
              min={1}
              step={1}
            />
          )}
        </label>
      )}
    </div>
  );
}
