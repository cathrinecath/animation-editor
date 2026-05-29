"use client";

import { useEditorStore } from "@/lib/editor/store";

const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 500;

/**
 * The visible reference frame for motion: the exported container, drawn centered
 * in the stage. Its size comes from the store and is edited via ContainerPanel.
 * Purely a design aid — it is not interactive in Phase 1 (resize via the panel).
 */
export function ContainerBox() {
  const container = useEditorStore((s) => s.project.container);
  const left = (STAGE_WIDTH - container.width) / 2;
  const top = (STAGE_HEIGHT - container.height) / 2;

  return (
    <div
      data-testid="container-box"
      style={{
        position: "absolute",
        left,
        top,
        width: container.width,
        height: container.height,
        border: "1px dashed #93c5fd",
        borderRadius: 4,
        background: "rgba(59, 130, 246, 0.04)",
        pointerEvents: "none",
      }}
    />
  );
}
