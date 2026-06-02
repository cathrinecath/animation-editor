"use client";

import type { ReactNode } from "react";

type FloatingPanelProps = {
  /** Tailwind positioning classes, e.g. "top-16 left-4". Omit when an outer wrapper positions the panel. */
  position?: string;
  className?: string;
  children: ReactNode;
};

export function FloatingPanel({ position = "", className = "", children }: FloatingPanelProps) {
  return (
    <div
      className={[
        "absolute z-20 rounded-xl border border-neutral-600 bg-neutral-800/95",
        "p-4 shadow-2xl backdrop-blur-sm",
        position,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
