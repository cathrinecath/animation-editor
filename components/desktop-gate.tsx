"use client";

import { useEffect, useState } from "react";

const DESKTOP_QUERY = "(min-width: 1024px)";

type DesktopState = "unknown" | boolean;

export function useIsDesktop(): DesktopState {
  const [state, setState] = useState<DesktopState>("unknown");

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    setState(mql.matches);
    const onChange = (event: MediaQueryListEvent) => setState(event.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return state;
}

export function DesktopGate({ children }: { children: React.ReactNode }) {
  const isDesktop = useIsDesktop();

  // Before the effect resolves we cannot know the viewport size. Render
  // nothing for one tick rather than risk mounting the editor on a phone.
  if (isDesktop === "unknown") return null;

  if (isDesktop === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-700 px-6 text-center">
        <div className="max-w-md rounded-xl border border-neutral-600 bg-neutral-800/95 p-8 shadow-2xl backdrop-blur-sm">
          <p className="text-[10px] font-bold tracking-widest text-indigo-300">
            ANIMATION EDITOR
          </p>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-neutral-100">
            Best on desktop 👋
          </h1>
          <p className="mt-3 text-sm text-neutral-400">
            This animation editor really comes alive on a bigger screen. Pop
            back open on your desktop, or widen this window.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
