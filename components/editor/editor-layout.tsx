"use client";

import { useState } from "react";
import { Stage } from "./stage";
import { Circle } from "./circle";
import { ContainerBox } from "./container-box";
import { ContainerPanel } from "./container-panel";
import { AnimationInspector } from "./animation-inspector";
import { ActionBar } from "./action-bar";
import { ExportPanel } from "./export-panel";
import { FloatingPanel } from "./floating-panel";

export function EditorLayout() {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-neutral-700">
      {/* full-bleed dark canvas with the stage centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Stage>
          <ContainerBox />
          <Circle elementId="circle-1" />
        </Stage>
      </div>

      {/* top-center actions */}
      <FloatingPanel position="top-4 left-1/2 -translate-x-1/2" className="!p-2">
        <ActionBar onExport={() => setExportOpen(true)} />
      </FloatingPanel>

      {/* left: frame */}
      <FloatingPanel position="top-20 left-4" className="w-56">
        <ContainerPanel animationId="anim-1" />
      </FloatingPanel>

      {/* right: motion */}
      <FloatingPanel position="top-20 right-4 bottom-4" className="w-60 overflow-y-auto scrollbar-hide">
        <h2 className="mb-2 text-[10px] font-bold tracking-widest text-indigo-300">ANIMATION</h2>
        <AnimationInspector animationId="anim-1" />
      </FloatingPanel>

      <ExportPanel open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
