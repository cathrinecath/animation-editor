import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ShakeSection } from "@/components/editor/shake-section";
import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_PROJECT } from "@/lib/animation/types";

describe("ShakeSection", () => {
  beforeEach(() => {
    useEditorStore.setState({ project: structuredClone(DEFAULT_PROJECT), isPlaying: false });
  });

  it("writes horizontal amplitude to the store on blur", () => {
    const { getByTestId } = render(<ShakeSection animationId="anim-1" />);
    fireEvent.change(getByTestId("shake-x"), { target: { value: "12" } });
    fireEvent.blur(getByTestId("shake-x"));
    expect(useEditorStore.getState().project.animations[0].shake?.amplitudeX).toBe(12);
  });

  it("writes rotation amplitude to the store on blur", () => {
    const { getByTestId } = render(<ShakeSection animationId="anim-1" />);
    fireEvent.change(getByTestId("shake-rotate"), { target: { value: "15" } });
    fireEvent.blur(getByTestId("shake-rotate"));
    expect(useEditorStore.getState().project.animations[0].shake?.amplitudeRotate).toBe(15);
  });
});
