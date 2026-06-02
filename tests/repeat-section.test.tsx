import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { RepeatSection } from "@/components/editor/repeat-section";
import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_PROJECT } from "@/lib/animation/types";

describe("RepeatSection", () => {
  beforeEach(() => {
    useEditorStore.setState({ project: structuredClone(DEFAULT_PROJECT), isPlaying: false });
  });

  it("clicking Loop while Off turns repeat On and selects loop", () => {
    const { getByTestId } = render(<RepeatSection animationId="anim-1" />);
    fireEvent.click(getByTestId("repeat-loop"));
    const repeat = useEditorStore.getState().project.animations[0].repeat;
    expect(repeat.enabled).toBe(true);
    expect(repeat.mode).toBe("loop");
  });

  it("clicking Bounce while Off turns repeat On and selects bounce", () => {
    const { getByTestId } = render(<RepeatSection animationId="anim-1" />);
    fireEvent.click(getByTestId("repeat-bounce"));
    const repeat = useEditorStore.getState().project.animations[0].repeat;
    expect(repeat.enabled).toBe(true);
    expect(repeat.mode).toBe("bounce");
  });

  it("toggling Off preserves the chosen mode", () => {
    const { getByTestId } = render(<RepeatSection animationId="anim-1" />);
    fireEvent.click(getByTestId("repeat-bounce")); // On + bounce
    fireEvent.click(getByTestId("repeat-off"));
    const repeat = useEditorStore.getState().project.animations[0].repeat;
    expect(repeat.enabled).toBe(false);
    expect(repeat.mode).toBe("bounce"); // remembered
  });

  it("∞ toggle switches times between infinite and a finite count", () => {
    const { getByTestId } = render(<RepeatSection animationId="anim-1" />);
    fireEvent.click(getByTestId("repeat-loop")); // enable; times stays "infinite"
    expect(useEditorStore.getState().project.animations[0].repeat.times).toBe("infinite");
    fireEvent.click(getByTestId("repeat-forever")); // infinite -> 1
    expect(useEditorStore.getState().project.animations[0].repeat.times).toBe(1);
  });

  it("commits a finite count via the times input", () => {
    const { getByTestId } = render(<RepeatSection animationId="anim-1" />);
    fireEvent.click(getByTestId("repeat-loop"));
    fireEvent.click(getByTestId("repeat-forever")); // -> 1, reveals the numeric input
    fireEvent.change(getByTestId("repeat-times"), { target: { value: "5" } });
    fireEvent.blur(getByTestId("repeat-times"));
    expect(useEditorStore.getState().project.animations[0].repeat.times).toBe(5);
  });
});
