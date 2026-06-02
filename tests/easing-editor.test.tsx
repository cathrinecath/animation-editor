import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { EasingEditor } from "@/components/editor/easing-editor";
import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_PROJECT } from "@/lib/animation/types";

function track0Control(): [number, number, number, number] {
  const easing =
    useEditorStore.getState().project.animations[0].tracks[0].easing;
  if (easing.type !== "cubic-bezier") throw new Error("expected cubic-bezier");
  return easing.control;
}

describe("EasingEditor", () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: structuredClone(DEFAULT_PROJECT),
      isPlaying: false,
    });
  });

  it("renders an SVG curve graph", () => {
    const { getByTestId } = render(<EasingEditor animationId="anim-1" trackIndex={0} />);
    expect(getByTestId("easing-graph")).toBeInTheDocument();
  });

  it("renders two draggable control points", () => {
    const { getByTestId } = render(<EasingEditor animationId="anim-1" trackIndex={0} />);
    expect(getByTestId("easing-control-p1")).toBeInTheDocument();
    expect(getByTestId("easing-control-p2")).toBeInTheDocument();
  });

  it("renders four bezier inputs showing the current control values", () => {
    const { getByTestId } = render(<EasingEditor animationId="anim-1" trackIndex={0} />);
    expect((getByTestId("easing-input-x1") as HTMLInputElement).value).toBe("0.42");
    expect((getByTestId("easing-input-y1") as HTMLInputElement).value).toBe("0");
    expect((getByTestId("easing-input-x2") as HTMLInputElement).value).toBe("0.58");
    expect((getByTestId("easing-input-y2") as HTMLInputElement).value).toBe("1");
  });

  it("updates the store when an exact value is typed into an input", () => {
    const { getByTestId } = render(<EasingEditor animationId="anim-1" trackIndex={0} />);
    fireEvent.change(getByTestId("easing-input-x1"), { target: { value: "0.3" } });
    expect(track0Control()[0]).toBe(0.3);
  });

  it("clamps typed values to the 0..1 range", () => {
    const { getByTestId } = render(<EasingEditor animationId="anim-1" trackIndex={0} />);
    fireEvent.change(getByTestId("easing-input-x1"), { target: { value: "5" } });
    expect(track0Control()[0]).toBe(1);
    fireEvent.change(getByTestId("easing-input-y1"), { target: { value: "-2" } });
    expect(track0Control()[1]).toBe(0);
  });

  it("rounds dragged values to 2 decimals", () => {
    const { getByTestId } = render(<EasingEditor animationId="anim-1" trackIndex={0} />);
    const p1 = getByTestId("easing-control-p1");
    // p1 home is at cx = 0.42*200 = 84; a +3px drag maps to x = 87/200 = 0.435,
    // which must be rounded (to 0.44) rather than stored as a long float.
    fireEvent.pointerDown(p1, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(p1, { clientX: 3, clientY: 0, pointerId: 1 });
    fireEvent.pointerUp(p1, { clientX: 3, clientY: 0, pointerId: 1 });

    const v = track0Control()[0];
    expect(v).toBe(Number(v.toFixed(2))); // carries at most 2 decimals
    expect(v).not.toBe(0.435); // the unrounded value
  });
});
