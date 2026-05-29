import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ExportPanel } from "@/components/editor/export-panel";
import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_PROJECT } from "@/lib/animation/types";

describe("ExportPanel", () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: structuredClone(DEFAULT_PROJECT),
      isPlaying: false,
    });
  });

  it("renders nothing when closed", () => {
    const { container } = render(<ExportPanel open={false} onClose={() => {}} />);
    expect(container.querySelector("[data-testid='export-modal']")).toBeNull();
  });

  it("renders the export modal when open", () => {
    const { getByTestId } = render(<ExportPanel open={true} onClose={() => {}} />);
    expect(getByTestId("export-modal")).toBeInTheDocument();
    expect(getByTestId("export-code")).toBeInTheDocument();
  });

  it("includes the exported code text in the modal", () => {
    const { getByTestId } = render(<ExportPanel open={true} onClose={() => {}} />);
    expect(getByTestId("export-code").textContent).toContain("export function Animation");
  });

  it("shows Multi-file and Single file tabs", () => {
    const { getByText } = render(<ExportPanel open={true} onClose={() => {}} />);
    expect(getByText("Multi-file")).toBeInTheDocument();
    expect(getByText("Single file")).toBeInTheDocument();
  });

  it("defaults to the multi-file tab (component imports the css file)", () => {
    const { getByTestId } = render(<ExportPanel open={true} onClose={() => {}} />);
    const text = getByTestId("export-code").textContent ?? "";
    expect(text).toContain('import "./animation.css"');
    expect(text).toContain("animation.css");
    expect(text).not.toContain("<style>");
  });

  it("switches to the single-file tab and shows the self-contained component", () => {
    const { getByText, getByTestId } = render(
      <ExportPanel open={true} onClose={() => {}} />,
    );
    fireEvent.click(getByText("Single file"));
    expect(getByTestId("export-code").textContent).toContain("<style>");
  });
});
