import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { useDrag } from "@/lib/editor/drag";

function TestComponent({ onMove }: { onMove: (dx: number, dy: number) => void }) {
  const { handlers } = useDrag({ onMove });
  return <div data-testid="target" {...handlers} style={{ width: 100, height: 100 }} />;
}

describe("useDrag", () => {
  it("calls onMove with deltas during pointer drag", () => {
    const onMove = vi.fn();
    const { getByTestId } = render(<TestComponent onMove={onMove} />);
    const target = getByTestId("target");

    fireEvent.pointerDown(target, { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(target, { clientX: 80, clientY: 60, pointerId: 1 });
    fireEvent.pointerUp(target, { clientX: 80, clientY: 60, pointerId: 1 });

    expect(onMove).toHaveBeenCalledWith(30, 10);
  });

  it("does not call onMove before pointer down", () => {
    const onMove = vi.fn();
    const { getByTestId } = render(<TestComponent onMove={onMove} />);
    const target = getByTestId("target");

    fireEvent.pointerMove(target, { clientX: 80, clientY: 60, pointerId: 1 });
    expect(onMove).not.toHaveBeenCalled();
  });

  it("stops calling onMove after pointer up", () => {
    const onMove = vi.fn();
    const { getByTestId } = render(<TestComponent onMove={onMove} />);
    const target = getByTestId("target");

    fireEvent.pointerDown(target, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerUp(target, { clientX: 0, clientY: 0, pointerId: 1 });
    onMove.mockClear();
    fireEvent.pointerMove(target, { clientX: 50, clientY: 50, pointerId: 1 });

    expect(onMove).not.toHaveBeenCalled();
  });

  it("calls onStart on pointer down before any move", () => {
    const onStart = vi.fn();
    function Comp() {
      const { handlers } = useDrag({ onStart });
      return <div data-testid="t" {...handlers} />;
    }
    const { getByTestId } = render(<Comp />);
    fireEvent.pointerDown(getByTestId("t"), { clientX: 0, clientY: 0, pointerId: 1 });
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
