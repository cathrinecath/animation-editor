import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { EditorLayout } from "@/components/editor/editor-layout";
import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_PROJECT } from "@/lib/animation/types";

describe("EditorLayout", () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: structuredClone(DEFAULT_PROJECT),
      isPlaying: false,
    });
  });

  it("renders the stage, the container panel, and the animation inspector", () => {
    const { getByTestId, getByText } = render(<EditorLayout />);
    expect(getByTestId("stage-canvas")).toBeTruthy();
    expect(getByTestId("container-panel")).toBeTruthy();
    expect(getByTestId("animation-inspector")).toBeTruthy();
    // action bar present
    expect(getByText(/Export/)).toBeTruthy();
  });

  it("opens the export modal when Export is clicked", () => {
    const { getByText, getByTestId, queryByTestId } = render(<EditorLayout />);
    expect(queryByTestId("export-modal")).toBeNull();
    fireEvent.click(getByText(/Export/));
    expect(getByTestId("export-modal")).toBeTruthy();
  });
});
