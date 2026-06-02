"use client";

import { useState, type ReactNode } from "react";

type SectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function Section({ title, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-neutral-700 first:border-t-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-2.5 px-1 text-xs font-bold tracking-wide text-neutral-200"
      >
        <span>{title}</span>
        <span className="text-neutral-500">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="pb-3 px-1">{children}</div>}
    </div>
  );
}
