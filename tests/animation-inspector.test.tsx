import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { AnimationInspector } from "@/components/editor/animation-inspector";
import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_PROJECT } from "@/lib/animation/types";

describe("AnimationInspector", () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: structuredClone(DEFAULT_PROJECT),
      isPlaying: false,
    });
  });

  it("renders Easing and Duration sections plus coming-soon placeholders", () => {
    const { getByText } = render(<AnimationInspector animationId="anim-1" />);
    expect(getByText("Easing")).toBeTruthy();
    expect(getByText("Duration")).toBeTruthy();
    expect(getByText("Stagger")).toBeTruthy();
    expect(getByText("Shake")).toBeTruthy();
  });

  it("shows the duration in seconds and writes ms back to the store on blur", () => {
    const { getByTestId } = render(<AnimationInspector animationId="anim-1" />);
    // DEFAULT_PROJECT duration is 1000ms => 1 second displayed.
    expect((getByTestId("duration-seconds") as HTMLInputElement).value).toBe("1");
    fireEvent.change(getByTestId("duration-seconds"), { target: { value: "2.5" } });
    fireEvent.blur(getByTestId("duration-seconds"));
    const anim = useEditorStore.getState().project.animations[0];
    expect(anim.input.type).toBe("mount");
    if (anim.input.type === "mount") expect(anim.input.duration).toBe(2500);
  });

  it("clamps duration to a 0.1s minimum", () => {
    const { getByTestId } = render(<AnimationInspector animationId="anim-1" />);
    fireEvent.change(getByTestId("duration-seconds"), { target: { value: "0" } });
    fireEvent.blur(getByTestId("duration-seconds"));
    const anim = useEditorStore.getState().project.animations[0];
    expect(anim.input.type).toBe("mount");
    if (anim.input.type === "mount") expect(anim.input.duration).toBe(100);
  });
});
