import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { ContainerBox } from "@/components/editor/container-box";
import { useEditorStore } from "@/lib/editor/store";
import { DEFAULT_PROJECT } from "@/lib/animation/types";

describe("ContainerBox", () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: structuredClone(DEFAULT_PROJECT),
      isPlaying: false,
    });
  });

  it("renders a box sized from the store container, centered in the 800x500 stage", () => {
    const { getByTestId } = render(<ContainerBox />);
    const box = getByTestId("container-box");
    expect(box.style.width).toBe("400px");
    expect(box.style.height).toBe("300px");
    // Centered: (800-400)/2 = 200, (500-300)/2 = 100.
    expect(box.style.left).toBe("200px");
    expect(box.style.top).toBe("100px");
  });

  it("reflects an updated container size", () => {
    useEditorStore.getState().setContainerSize(600, 200);
    const { getByTestId } = render(<ContainerBox />);
    const box = getByTestId("container-box");
    expect(box.style.width).toBe("600px");
    expect(box.style.height).toBe("200px");
    expect(box.style.left).toBe("100px"); // (800-600)/2
    expect(box.style.top).toBe("150px"); // (500-200)/2
  });
});
