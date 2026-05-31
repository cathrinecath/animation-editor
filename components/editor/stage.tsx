"use client";

import type { ReactNode } from "react";

import { STAGE_WIDTH, STAGE_HEIGHT } from "@/lib/editor/stage-dimensions";

type StageProps = {
  children?: ReactNode;
};

export function Stage({ children }: StageProps) {
  return (
    <div
      data-testid="stage-canvas"
      className="relative overflow-hidden bg-neutral-50 border border-neutral-200 rounded-md"
      style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
    >
      {children}
    </div>
  );
}
