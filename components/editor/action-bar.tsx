"use client";

import { useEditorStore } from "@/lib/editor/store";

type ActionBarProps = {
  onExport: () => void;
};

export function ActionBar({ onExport }: ActionBarProps) {
  const play = useEditorStore((s) => s.play);
  const reset = useEditorStore((s) => s.reset);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={play}
        className="px-3 py-1.5 rounded-md bg-indigo-300 text-indigo-950 text-sm font-medium hover:bg-indigo-200"
      >
        ▶ Play
      </button>
      <button
        onClick={reset}
        className="px-3 py-1.5 rounded-md bg-red-300 text-red-950 text-sm font-medium hover:bg-red-200"
      >
        ↺ Reset
      </button>
      <button
        onClick={onExport}
        className="px-3 py-1.5 rounded-md bg-emerald-300 text-emerald-950 text-sm font-medium hover:bg-emerald-200"
      >
        ⬇ Export
      </button>
    </div>
  );
}
