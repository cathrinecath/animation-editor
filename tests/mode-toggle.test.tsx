import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ModeToggle } from "@/components/editor/mode-toggle";

const OPTS: [{ value: string; label: string }, { value: string; label: string }] = [
  { value: "container", label: "Responsive" },
  { value: "px", label: "Fixed" },
];

describe("ModeToggle", () => {
  it("marks the active option with aria-pressed", () => {
    const { getByText } = render(
      <ModeToggle options={OPTS} value="container" onChange={() => {}} />,
    );
    expect(getByText("Responsive").getAttribute("aria-pressed")).toBe("true");
    expect(getByText("Fixed").getAttribute("aria-pressed")).toBe("false");
  });

  it("calls onChange with the option value when clicked", () => {
    const onChange = vi.fn();
    const { getByText } = render(
      <ModeToggle options={OPTS} value="container" onChange={onChange} />,
    );
    fireEvent.click(getByText("Fixed"));
    expect(onChange).toHaveBeenCalledWith("px");
  });
});
