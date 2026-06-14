# Desktop-Only Gate — Design

**Date:** 2026-06-14
**Status:** Approved

## Goal

Prevent the animation editor from being used on mobile and tablet. Only
desktop-sized viewports may access the editor. Smaller viewports see a
full-screen message instead, and the editor never mounts behind it.

## Decisions

- **Detection:** viewport width via `window.matchMedia`, not user-agent
  sniffing. The editor needs screen real estate; gating on width also blocks
  small desktop windows and reacts to resize/orientation changes.
- **Breakpoint:** `1024px`. Below this, access is blocked; at or above it, the
  editor renders.
- **Blocked view:** a clean full-screen message. No editor markup renders
  behind it.

## Architecture

A single new client component plus a small hook, wired into the root layout.

### `useIsDesktop()` hook

Owns the breakpoint logic. Returns one of three states:

- `"unknown"` — initial render, before we can read the viewport (server render
  and first client paint).
- `true` — viewport is `>= 1024px`.
- `false` — viewport is `< 1024px`.

Implementation:

- Initialize state to `"unknown"`.
- In `useEffect`, create `window.matchMedia("(min-width: 1024px)")`, set state
  from `mql.matches`, and subscribe to its `change` event to keep state current
  on resize/orientation change. Clean up the listener on unmount.

The three-state design avoids a React hydration mismatch (the server cannot
know the width) and avoids flashing the editor on a phone before the gate
resolves.

### `DesktopGate` component

`components/desktop-gate.tsx` — a client component that wraps `children`.

- `unknown` → render nothing (blank). Lasts one tick until the effect runs.
- `false` → render the full-screen blocked message. Children are **not**
  rendered, so the editor never mounts.
- `true` → render `children`.

### Wiring

In `app/layout.tsx`, wrap `{children}` in `<DesktopGate>` inside `<body>`. This
applies the gate app-wide rather than per-page.

### Blocked view

Full-screen layout, centered both horizontally and vertically, using the
existing Tailwind v4 setup. No new dependencies, consistent with the project's
zero-dependency direction. The view matches the editor's dark palette rather
than the page default: a `bg-neutral-700` canvas with the message in a
floating-panel-style card (`bg-neutral-800/95`, `border-neutral-600`,
`rounded-xl`, `shadow-2xl`, `backdrop-blur-sm`), an indigo eyebrow label
(`text-indigo-300`) echoing the editor's section headers, light heading
(`text-neutral-100`) and muted body (`text-neutral-400`). Copy:

- **Heading:** "Best on desktop 👋"
- **Body:** "This animation editor really comes alive on a bigger screen. Pop
  back open on your desktop, or widen this window."

## Testing

Vitest + jsdom test for `DesktopGate`:

- Mock `window.matchMedia`.
- `matches: false` (< 1024px) → editor/children content is not in the document;
  the blocked message is shown.
- `matches: true` (>= 1024px) → children are rendered.
- Dispatching a `change` event flips the rendered output (reacts to resize).

## Out of scope

- User-agent detection.
- Persisting or remembering a user's override (no "continue anyway" escape hatch).
- Any change to editor behavior on desktop.
