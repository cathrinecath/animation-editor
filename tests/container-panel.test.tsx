import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ContainerPanel } from "@/components/editor/container-panel";
import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_PROJECT } from "@/lib/animation/types";

describe("ContainerPanel", () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: structuredClone(DEFAULT_PROJECT),
      isPlaying: false,
    });
  });

  it("shows the current container width and height", () => {
    const { getByTestId } = render(<ContainerPanel animationId="anim-1" />);
    expect((getByTestId("container-width") as HTMLInputElement).value).toBe("400");
    expect((getByTestId("container-height") as HTMLInputElement).value).toBe("300");
  });

  it("updates the container width in the store", () => {
    const { getByTestId } = render(<ContainerPanel animationId="anim-1" />);
    // With the blur-commit model, change only updates the local draft; the store
    // is written on blur.  Fire both to exercise the full commit path.
    fireEvent.change(getByTestId("container-width"), { target: { value: "600" } });
    fireEvent.blur(getByTestId("container-width"));
    expect(useEditorStore.getState().project.container.width).toBe(600);
  });

  it("toggles to Fixed (px) and back to Responsive (container)", () => {
    const { getByText } = render(<ContainerPanel animationId="anim-1" />);
    fireEvent.click(getByText("Fixed"));
    expect(useEditorStore.getState().project.animations[0].motionUnit).toBe("px");
    fireEvent.click(getByText("Responsive"));
    expect(useEditorStore.getState().project.animations[0].motionUnit).toBe("container");
  });
});
