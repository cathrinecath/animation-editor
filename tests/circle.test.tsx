import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { Circle } from "@/components/editor/circle";
import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_PROJECT } from "@/lib/animation/types";
import { runAnimation } from "@/lib/animation/runner";

vi.mock("@/lib/animation/runner", () => ({
  runAnimation: vi.fn(() => () => {}),
}));

describe("Circle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEditorStore.setState({
      project: structuredClone(DEFAULT_PROJECT),
      isPlaying: false,
    });
  });

  it("renders a circle element at its home position", () => {
    const { getByTestId } = render(<Circle elementId="circle-1" />);
    const el = getByTestId("editor-circle-circle-1");
    expect(el).toBeInTheDocument();
    expect(el.style.left).toBe("380px");
    expect(el.style.top).toBe("230px");
    expect(el.style.borderRadius).toBe("9999px");
  });

  it("updates the translateEnd in the store when dragged", () => {
    const { getByTestId } = render(<Circle elementId="circle-1" />);
    const el = getByTestId("editor-circle-circle-1");
    fireEvent.pointerDown(el, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(el, { clientX: 150, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(el, { clientX: 150, clientY: 50, pointerId: 1 });

    const anim = useEditorStore.getState().project.animations[0];
    expect(anim.tracks[0].waypoints[1].value).toBe(150);
    expect(anim.tracks[1].waypoints[1].value).toBe(50);
  });

  it("shows a live landing preview while dragging", () => {
    const { getByTestId } = render(<Circle elementId="circle-1" />);
    const el = getByTestId("editor-circle-circle-1");

    fireEvent.pointerDown(el, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(el, { clientX: 150, clientY: 50, pointerId: 1 });

    // The real circle follows the pointer (its prospective landing spot).
    expect(el.style.transform).toBe("translate(150px, 50px)");
    // A ghost marks the home position while dragging.
    const ghost = getByTestId("circle-ghost-circle-1");
    expect(ghost.style.left).toBe("380px");
    expect(ghost.style.top).toBe("230px");
    // A dashed path connects home and the landing spot.
    expect(getByTestId("circle-path-circle-1")).toBeInTheDocument();
  });

  it("persists the end-position marker at rest after releasing", () => {
    const { getByTestId } = render(<Circle elementId="circle-1" />);
    const el = getByTestId("editor-circle-circle-1");

    fireEvent.pointerDown(el, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(el, { clientX: 150, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(el, { clientX: 150, clientY: 50, pointerId: 1 });

    // Circle returns home (no live transform once the drag ends).
    expect(el.style.transform).toBe("");
    // The ghost now marks the configured end (home + committed delta).
    const ghost = getByTestId("circle-ghost-circle-1");
    expect(ghost.style.left).toBe("530px");
    expect(ghost.style.top).toBe("280px");
    expect(getByTestId("circle-path-circle-1")).toBeInTheDocument();
  });

  it("shows the ghost and path at rest even before any drag, anchored at home", () => {
    const { getByTestId } = render(<Circle elementId="circle-1" />);
    const ghost = getByTestId("circle-ghost-circle-1");
    expect(ghost.style.left).toBe("380px");
    expect(ghost.style.top).toBe("230px");
    expect(getByTestId("circle-path-circle-1")).toBeInTheDocument();
  });

  it("hides the ghost and path while playing", () => {
    useEditorStore.setState({ isPlaying: true });
    const { queryByTestId } = render(<Circle elementId="circle-1" />);
    expect(queryByTestId("circle-ghost-circle-1")).toBeNull();
    expect(queryByTestId("circle-path-circle-1")).toBeNull();
  });

  it("returns the circle to the starting position when play stops (reset)", () => {
    const { getByTestId } = render(<Circle elementId="circle-1" />);
    const el = getByTestId("editor-circle-circle-1");

    act(() => {
      useEditorStore.getState().play();
    });
    // Simulate the runner having moved the circle to the end during playback.
    el.style.transform = "translate(150px, 50px)";

    act(() => {
      useEditorStore.getState().reset();
    });
    expect(el.style.transform).toBe("");
  });

  it("restarts the animation when Play is pressed again while still playing", () => {
    render(<Circle elementId="circle-1" />);
    act(() => {
      useEditorStore.getState().play();
    });
    act(() => {
      useEditorStore.getState().play();
    });
    expect(vi.mocked(runAnimation)).toHaveBeenCalledTimes(2);
  });

  it("returns to the pre-play view (start position + overlay) when the animation finishes", () => {
    // Simulate the runner reaching completion by invoking its onDone callback.
    vi.mocked(runAnimation).mockImplementation((_anim, _el, onDone) => {
      onDone?.();
      return () => {};
    });
    const { getByTestId } = render(<Circle elementId="circle-1" />);
    const el = getByTestId("editor-circle-circle-1");

    act(() => {
      useEditorStore.getState().play();
    });

    // Playback ended -> back to the resting view: not playing, no live
    // transform, and the ghost + path overlay visible again.
    expect(useEditorStore.getState().isPlaying).toBe(false);
    expect(el.style.transform).toBe("");
    expect(getByTestId("circle-ghost-circle-1")).toBeInTheDocument();
    expect(getByTestId("circle-path-circle-1")).toBeInTheDocument();
  });

  it("keeps the dragged end position when the animation finishes (finish != reset)", () => {
    vi.mocked(runAnimation).mockImplementation((_anim, _el, onDone) => {
      onDone?.();
      return () => {};
    });
    act(() => {
      useEditorStore.getState().setTranslateEnd("anim-1", 150, 50);
    });
    render(<Circle elementId="circle-1" />);

    act(() => {
      useEditorStore.getState().play();
    });

    // Finishing playback must not wipe the user's design.
    const anim = useEditorStore.getState().project.animations[0];
    expect(anim.tracks[0].waypoints[1].value).toBe(150);
    expect(anim.tracks[1].waypoints[1].value).toBe(50);
  });
});
