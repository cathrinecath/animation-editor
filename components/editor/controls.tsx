"use client";

import { useEditorStore } from "@/lib/editor/store";
import type { Project } from "@/lib/animation/types";

type ControlsProps = {
  onExport: () => void;
};

export function Controls({ onExport }: ControlsProps) {
  const play = useEditorStore((s) => s.play);
  const reset = useEditorStore((s) => s.reset);
  const project = useEditorStore((s) => s.project);
  const loadProject = useEditorStore((s) => s.loadProject);

  const onSave = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "animation-project.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Project;
        if (parsed.schemaVersion !== 0) {
          alert("Unsupported schema version");
          return;
        }
        loadProject(parsed);
      } catch {
        alert("Invalid project file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

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
        className="px-3 py-1 rounded border border-neutral-300 hover:bg-neutral-100"
      >
        Reset
      </button>
      <button
        onClick={onExport}
        className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
      >
        Export
      </button>
      <span className="w-px h-6 bg-neutral-300 mx-2" />
      <button
        onClick={onSave}
        className="px-3 py-1 rounded border border-neutral-300 hover:bg-neutral-100"
      >
        Save .json
      </button>
      <label className="px-3 py-1 rounded border border-neutral-300 hover:bg-neutral-100 cursor-pointer">
        Load .json
        <input type="file" accept="application/json" hidden onChange={onLoad} />
      </label>
    </div>
  );
}
