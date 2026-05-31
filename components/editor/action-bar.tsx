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
        className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500"
      >
        ▶ Play
      </button>
      <button
        onClick={reset}
        className="px-3 py-1.5 rounded-md bg-neutral-700 text-neutral-100 text-sm font-medium hover:bg-neutral-600"
      >
        ↺ Reset
      </button>
      <button
        onClick={onExport}
        className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500"
      >
        ⬇ Export
      </button>
    </div>
  );
}
