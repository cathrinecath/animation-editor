"use client";

import type { ReactNode } from "react";

type StageProps = {
  children?: ReactNode;
};

export function Stage({ children }: StageProps) {
  return (
    <div
      data-testid="stage-canvas"
      className="relative overflow-hidden bg-neutral-50 border border-neutral-200 rounded-md"
      style={{ width: 800, height: 500 }}
    >
      {children}
    </div>
  );
}
