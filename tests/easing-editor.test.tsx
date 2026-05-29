import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { EasingEditor } from "@/components/editor/easing-editor";
import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_PROJECT } from "@/lib/animation/types";

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

  it("shows the current cubic-bezier string", () => {
    const { getByTestId } = render(<EasingEditor animationId="anim-1" trackIndex={0} />);
    expect(getByTestId("easing-string").textContent).toContain("cubic-bezier(0.42, 0, 0.58, 1)");
  });
});
