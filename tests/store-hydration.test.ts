import { describe, it, expect, afterEach, vi } from "vitest";
import { DEFAULT_PROJECT, type Project } from "@/lib/animation/types";

const STORAGE_KEY = "animation-editor:project:v0";

function withControl(control: [number, number, number, number]): Project {
  const p = structuredClone(DEFAULT_PROJECT);
  p.animations[0].tracks[0].easing = { type: "cubic-bezier", control };
  return p;
}

afterEach(() => {
  window.localStorage.clear();
  vi.resetModules();
});

describe("editor store — SSR-safe hydration", () => {
  it("initializes deterministically with DEFAULT_PROJECT even when localStorage holds a different project", async () => {
    // Seed storage BEFORE the store module first evaluates. The store must NOT
    // read localStorage at init time — doing so makes the first client render
    // diverge from the server (default) render and causes a hydration mismatch.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(withControl([0.1, 0.9, 0.2, 0.8])),
    );
    vi.resetModules();
    const { useEditorStore } = await import("@/lib/editor/store");

    const easing =
      useEditorStore.getState().project.animations[0].tracks[0].easing;
    expect(easing.type).toBe("cubic-bezier");
    if (easing.type === "cubic-bezier") {
      expect(easing.control).toEqual([0.42, 0, 0.58, 1]); // DEFAULT, not the stored value
    }
  });

  it("hydrate() applies a persisted project from localStorage", async () => {
    vi.resetModules();
    window.localStorage.clear();
    const { useEditorStore } = await import("@/lib/editor/store");

    const persisted = structuredClone(DEFAULT_PROJECT);
    persisted.elements[0].position.x = 555;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));

    useEditorStore.getState().hydrate();

    expect(useEditorStore.getState().project.elements[0].position.x).toBe(555);
  });

  it("hydrate() is a no-op when localStorage is empty", async () => {
    vi.resetModules();
    window.localStorage.clear();
    const { useEditorStore } = await import("@/lib/editor/store");

    useEditorStore.getState().hydrate();

    expect(
      useEditorStore.getState().project.elements[0].position.x,
    ).toBe(DEFAULT_PROJECT.elements[0].position.x);
  });

  it("hydrate() backfills container and legacy motionUnit on older persisted projects", async () => {
    vi.resetModules();
    window.localStorage.clear();
    const { useEditorStore } = await import("@/lib/editor/store");

    // A pre-feature persisted project: no container, no motionUnit.
    const legacy = structuredClone(DEFAULT_PROJECT) as unknown as Record<string, unknown>;
    delete legacy.container;
    delete (legacy.animations as { motionUnit?: unknown }[])[0].motionUnit;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));

    useEditorStore.getState().hydrate();

    const project = useEditorStore.getState().project;
    expect(project.container).toEqual({ width: 400, height: 300 });
    expect(project.animations[0].motionUnit).toBe("px"); // legacy preserved as px
  });
});
