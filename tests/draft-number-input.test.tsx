import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { DraftNumberInput } from "@/components/editor/draft-number-input";

describe("DraftNumberInput", () => {
  it("commit mode 'blur' commits the parsed number on blur, not on change", () => {
    const onCommit = vi.fn();
    const { getByTestId } = render(
      <DraftNumberInput testid="n" value={400} onCommit={onCommit} commitMode="blur" />,
    );
    fireEvent.change(getByTestId("n"), { target: { value: "600" } });
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.blur(getByTestId("n"));
    expect(onCommit).toHaveBeenCalledWith(600);
  });

  it("commit mode 'blur' reverts to the value on blank/NaN blur", () => {
    const onCommit = vi.fn();
    const { getByTestId } = render(
      <DraftNumberInput testid="n" value={400} onCommit={onCommit} commitMode="blur" />,
    );
    fireEvent.change(getByTestId("n"), { target: { value: "" } });
    fireEvent.blur(getByTestId("n"));
    expect(onCommit).not.toHaveBeenCalled();
    expect((getByTestId("n") as HTMLInputElement).value).toBe("400");
  });

  it("commit mode 'change' commits live as the user types valid numbers", () => {
    const onCommit = vi.fn();
    const { getByTestId } = render(
      <DraftNumberInput testid="n" value={0.42} onCommit={onCommit} commitMode="change" />,
    );
    fireEvent.change(getByTestId("n"), { target: { value: "0.5" } });
    expect(onCommit).toHaveBeenCalledWith(0.5);
  });

  it("blur mode clamps to min before committing and normalizes the displayed text", () => {
    const onCommit = vi.fn();
    const { getByTestId } = render(
      <DraftNumberInput testid="n" value={1} onCommit={onCommit} commitMode="blur" min={1} />,
    );
    fireEvent.change(getByTestId("n"), { target: { value: "0.5" } });
    fireEvent.blur(getByTestId("n"));
    expect(onCommit).toHaveBeenCalledWith(1);
    expect((getByTestId("n") as HTMLInputElement).value).toBe("1");
  });

  it("commits on Enter in blur mode", () => {
    const onCommit = vi.fn();
    const { getByTestId } = render(
      <DraftNumberInput testid="n" value={400} onCommit={onCommit} commitMode="blur" />,
    );
    fireEvent.change(getByTestId("n"), { target: { value: "600" } });
    fireEvent.keyDown(getByTestId("n"), { key: "Enter" });
    expect(onCommit).toHaveBeenCalledWith(600);
  });

  it("syncs the displayed text from the value prop when not focused", () => {
    const { getByTestId, rerender } = render(
      <DraftNumberInput testid="n" value={400} onCommit={() => {}} />,
    );
    rerender(<DraftNumberInput testid="n" value={600} onCommit={() => {}} />);
    expect((getByTestId("n") as HTMLInputElement).value).toBe("600");
  });
});
