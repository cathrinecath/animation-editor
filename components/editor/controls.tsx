"use client";

import { useEditorStore } from "@/lib/editor/store";

type ControlsProps = {
  onExport: () => void;
};

export function Controls({ onExport }: ControlsProps) {
  const play = useEditorStore((s) => s.play);
  const reset = useEditorStore((s) => s.reset);

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={play}
        className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
      >
        Play
      </button>
      <button
        onClick={reset}
        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
      >
        Reset
      </button>
      <button
        onClick={onExport}
        className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
      >
        Export
      </button>
    </div>
  );
}
