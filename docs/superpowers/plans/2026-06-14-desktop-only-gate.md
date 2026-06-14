# Desktop-Only Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Block the animation editor on viewports narrower than 1024px, showing a friendly full-screen message instead so the editor never mounts on mobile/tablet.

**Architecture:** A client component `DesktopGate` wraps `children` in the root layout. A `useIsDesktop()` hook tracks the `(min-width: 1024px)` media query via `window.matchMedia`, returning `"unknown" | true | false` so there is no hydration mismatch and no flash of the editor on small screens.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind v4, Vitest + jsdom + @testing-library/react.

---

## File Structure

- Create: `components/desktop-gate.tsx` — the `useIsDesktop` hook and `DesktopGate` component (one focused file; the hook is exported for potential reuse but only consumed here).
- Create: `tests/desktop-gate.test.tsx` — behavior tests for `DesktopGate`.
- Modify: `app/layout.tsx` — wrap `{children}` in `<DesktopGate>`.

---

## Task 1: DesktopGate component + hook

**Files:**
- Create: `components/desktop-gate.tsx`
- Test: `tests/desktop-gate.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/desktop-gate.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { DesktopGate } from "@/components/desktop-gate";

type Listener = (event: { matches: boolean }) => void;

// jsdom has no matchMedia. Provide a mock whose `matches` can be flipped and
// that forwards a `change` event to the registered listener.
function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  let listener: Listener | null = null;
  window.matchMedia = vi.fn().mockImplementation(() => ({
    get matches() {
      return matches;
    },
    media: "(min-width: 1024px)",
    addEventListener: (_event: string, cb: Listener) => {
      listener = cb;
    },
    removeEventListener: () => {
      listener = null;
    },
  })) as unknown as typeof window.matchMedia;
  return {
    setMatches(next: boolean) {
      matches = next;
      listener?.({ matches: next });
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DesktopGate", () => {
  it("renders children on desktop (>= 1024px)", () => {
    mockMatchMedia(true);
    const { queryByText } = render(
      <DesktopGate>
        <div>editor</div>
      </DesktopGate>,
    );
    expect(queryByText("editor")).toBeInTheDocument();
  });

  it("hides children and shows the message below 1024px", () => {
    mockMatchMedia(false);
    const { queryByText } = render(
      <DesktopGate>
        <div>editor</div>
      </DesktopGate>,
    );
    expect(queryByText("editor")).not.toBeInTheDocument();
    expect(queryByText("Best on desktop 👋")).toBeInTheDocument();
  });

  it("reacts to viewport changes", () => {
    const mm = mockMatchMedia(true);
    const { queryByText } = render(
      <DesktopGate>
        <div>editor</div>
      </DesktopGate>,
    );
    expect(queryByText("editor")).toBeInTheDocument();
    act(() => {
      mm.setMatches(false);
    });
    expect(queryByText("editor")).not.toBeInTheDocument();
    expect(queryByText("Best on desktop 👋")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- desktop-gate`
Expected: FAIL — cannot resolve `@/components/desktop-gate` (module does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `components/desktop-gate.tsx`:

```tsx
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
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold">Best on desktop 👋</h1>
        <p className="mt-3 max-w-md text-sm text-neutral-500">
          This animation editor really comes alive on a bigger screen. Pop back
          open on your desktop (or widen this window) and let&apos;s get
          animating!
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- desktop-gate`
Expected: PASS — all three tests green.

- [ ] **Step 5: Stage (user commits)**

Per project rule, do NOT commit — stage and report the title.

```bash
git add components/desktop-gate.tsx tests/desktop-gate.test.tsx
```

Report suggested commit title: `feat(editor): add DesktopGate to block sub-1024px viewports`

---

## Task 2: Wire DesktopGate into the root layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add the import**

In `app/layout.tsx`, add below the existing imports (after line 3, `import "./globals.css";`):

```tsx
import { DesktopGate } from "@/components/desktop-gate";
```

- [ ] **Step 2: Wrap children with the gate**

Replace the body line:

```tsx
      <body className="min-h-full flex flex-col">{children}</body>
```

with:

```tsx
      <body className="min-h-full flex flex-col">
        <DesktopGate>{children}</DesktopGate>
      </body>
```

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: PASS — all existing tests plus the three new DesktopGate tests.

- [ ] **Step 4: Verify the production build compiles**

Run: `npm run build`
Expected: build completes with no type errors.

- [ ] **Step 5: Stage (user commits)**

```bash
git add app/layout.tsx
```

Report suggested commit title: `feat(editor): gate the app behind DesktopGate in the root layout`

---

## Self-Review Notes

- **Spec coverage:** detection via `matchMedia` at 1024px (Task 1 hook), three-state to avoid hydration mismatch / editor flash (Task 1), full-screen centered message with approved copy (Task 1), editor never mounts below breakpoint (Task 1 — `children` not rendered when `false`), app-wide wiring in layout (Task 2), tests for hidden/shown/reacts-to-change (Task 1 test). All covered.
- **No new dependencies** — Tailwind classes only, consistent with zero-dependency direction.
- **No comments in export output** rule is about the exporter, not source files; the explanatory comments in `desktop-gate.tsx` are source comments and are fine.
