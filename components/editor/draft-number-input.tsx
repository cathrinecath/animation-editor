"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_CLASS =
  "w-16 px-1 py-0.5 border border-neutral-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500";

type DraftNumberInputProps = {
  testid: string;
  /** Canonical value from the store. */
  value: number;
  /**
   * Receives the committed number, already clamped to `min`/`max` by the
   * component. Callers may apply additional validation if needed.
   */
  onCommit: (value: number) => void;
  /** "blur" commits on blur/Enter (default). "change" commits live as the user types. */
  commitMode?: "blur" | "change";
  /** Lower bound; the component clamps the committed value to this (enforced, not just a native attr). */
  min?: number;
  /** Upper bound; the component clamps the committed value to this (enforced, not just a native attr). */
  max?: number;
  step?: number;
  className?: string;
};

export function DraftNumberInput({
  testid,
  value,
  onCommit,
  commitMode = "blur",
  min,
  max,
  step,
  className = DEFAULT_CLASS,
}: DraftNumberInputProps) {
  const [text, setText] = useState(() => String(value));
  const focusedRef = useRef(false);

  // Sync the displayed text from the canonical value, but never while focused so
  // an in-progress entry ("0." / "60") isn't clobbered mid-type.
  useEffect(() => {
    if (!focusedRef.current) setText(String(value));
  }, [value]);

  const tryCommit = (raw: string): number | null => {
    if (raw.trim() === "") return null;
    let parsed = Number(raw);
    if (Number.isNaN(parsed)) return null;
    if (min !== undefined) parsed = Math.max(min, parsed);
    if (max !== undefined) parsed = Math.min(max, parsed);
    onCommit(parsed);
    return parsed;
  };

  return (
    <input
      data-testid={testid}
      type="number"
      min={min}
      max={max}
      step={step}
      value={text}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (commitMode === "change") tryCommit(raw);
      }}
      onBlur={() => {
        focusedRef.current = false;
        if (commitMode === "blur") {
          // On a failed parse revert; on success normalize the text to the
          // committed (clamped) value, since the value prop may not change.
          const committed = tryCommit(text);
          setText(committed === null ? String(value) : String(committed));
        } else {
          // change-mode: snap text back to the canonical value
          setText(String(value));
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && commitMode === "blur") {
          const committed = tryCommit(text);
          setText(committed === null ? String(value) : String(committed));
        }
      }}
      className={className}
    />
  );
}
