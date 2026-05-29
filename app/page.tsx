"use client";

import { useEffect, useState } from "react";
import { Stage } from "@/components/editor/stage";
import { Circle } from "@/components/editor/circle";
import { EasingEditor } from "@/components/editor/easing-editor";
import { Controls } from "@/components/editor/controls";
import { ExportPanel } from "@/components/editor/export-panel";
import { useEditorStore } from "@/lib/editor/store";

export default function EditorPage() {
  const [exportOpen, setExportOpen] = useState(false);

  // Apply any persisted project after mount. The store initializes with the
  // default project so the first client render matches the server; hydrating
  // here avoids a localStorage-driven hydration mismatch.
  useEffect(() => {
    useEditorStore.getState().hydrate();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-5xl flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold text-neutral-900">Animation Editor</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Drag the circle to set its end position. Drag the bezier handles to
            tune the easing. Press Play to preview. Export when ready.
          </p>
        </header>

        <Controls onExport={() => setExportOpen(true)} />

        <div className="flex gap-6 items-start">
          <Stage>
            <Circle elementId="circle-1" />
          </Stage>

          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-neutral-900">Easing</h2>
            <EasingEditor animationId="anim-1" trackIndex={0} />
          </div>
        </div>

        <ExportPanel open={exportOpen} onClose={() => setExportOpen(false)} />
      </div>
    </main>
  );
}
