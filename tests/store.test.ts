import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_PROJECT } from "@/lib/animation/types";

describe("editor store", () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: structuredClone(DEFAULT_PROJECT),
      isPlaying: false,
    });
  });

  it("initializes with the default project", () => {
    const state = useEditorStore.getState();
    expect(state.project.elements).toHaveLength(1);
    expect(state.project.animations).toHaveLength(1);
    expect(state.isPlaying).toBe(false);
  });

  it("sets a translate-end value via setTranslateEnd", () => {
    useEditorStore.getState().setTranslateEnd("anim-1", 250, 0);
    const anim = useEditorStore.getState().project.animations[0];
    expect(anim.tracks[0].waypoints[1].value).toBe(250);
    expect(anim.tracks[1].waypoints[1].value).toBe(0);
  });

  it("sets easing control via setEasingControl", () => {
    useEditorStore
      .getState()
      .setEasingControl("anim-1", 0, [0.1, 0.2, 0.3, 0.4]);
    const easing = useEditorStore.getState().project.animations[0].tracks[0]
      .easing;
    expect(easing.type).toBe("cubic-bezier");
    if (easing.type === "cubic-bezier") {
      expect(easing.control).toEqual([0.1, 0.2, 0.3, 0.4]);
    }
  });

  it("toggles isPlaying via play/reset", () => {
    useEditorStore.getState().play();
    expect(useEditorStore.getState().isPlaying).toBe(true);
    useEditorStore.getState().reset();
    expect(useEditorStore.getState().isPlaying).toBe(false);
  });

  it("loadProject replaces the entire project", () => {
    const replacement = structuredClone(DEFAULT_PROJECT);
    replacement.elements[0].position.x = 999;
    useEditorStore.getState().loadProject(replacement);
    expect(useEditorStore.getState().project.elements[0].position.x).toBe(999);
  });
});
