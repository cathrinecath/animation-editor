import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Controls } from "@/components/editor/controls";
import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_PROJECT } from "@/lib/animation/types";

describe("Controls", () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: structuredClone(DEFAULT_PROJECT),
      isPlaying: false,
    });
  });

  it("Play button sets isPlaying true", () => {
    const { getByText } = render(<Controls onExport={() => {}} />);
    fireEvent.click(getByText("Play"));
    expect(useEditorStore.getState().isPlaying).toBe(true);
  });

  it("Reset button sets isPlaying false", () => {
    useEditorStore.setState({ isPlaying: true });
    const { getByText } = render(<Controls onExport={() => {}} />);
    fireEvent.click(getByText("Reset"));
    expect(useEditorStore.getState().isPlaying).toBe(false);
  });

  it("Export button calls onExport", () => {
    const onExport = vi.fn();
    const { getByText } = render(<Controls onExport={onExport} />);
    fireEvent.click(getByText("Export"));
    expect(onExport).toHaveBeenCalled();
  });
});
