"use client";

type Option = { value: string; label: string };

type ModeToggleProps = {
  options: [Option, Option];
  value: string;
  onChange: (value: string) => void;
};

export function ModeToggle({ options, value, onChange }: ModeToggleProps) {
  const activeIndex = options.findIndex((o) => o.value === value);
  return (
    <div className="relative flex rounded-full bg-neutral-900 border border-neutral-700 p-1">
      {/* sliding knob */}
      <div
        className="absolute top-1 bottom-1 rounded-full bg-indigo-300 transition-transform"
        style={{
          width: "calc(50% - 4px)",
          left: 4,
          transform: activeIndex === 1 ? "translateX(100%)" : "translateX(0)",
        }}
      />
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={
              "relative z-10 flex-1 rounded-full py-1.5 text-xs font-semibold transition-colors " +
              (active ? "text-indigo-950" : "text-neutral-400 hover:text-neutral-200")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
