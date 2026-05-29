import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Circle } from "@/components/editor/circle";
import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_PROJECT } from "@/lib/animation/types";

describe("Circle", () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: structuredClone(DEFAULT_PROJECT),
      isPlaying: false,
    });
  });

  it("renders a circle element at its home position", () => {
    const { getByTestId } = render(<Circle elementId="circle-1" />);
    const el = getByTestId("editor-circle-circle-1");
    expect(el).toBeInTheDocument();
    expect(el.style.left).toBe("80px");
    expect(el.style.top).toBe("200px");
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
});
