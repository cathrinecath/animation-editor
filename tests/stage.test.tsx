import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Stage } from "@/components/editor/stage";

describe("Stage", () => {
  it("renders a fixed-size canvas region", () => {
    const { getByTestId } = render(
      <Stage>
        <div data-testid="child" />
      </Stage>,
    );
    expect(getByTestId("stage-canvas")).toBeInTheDocument();
    expect(getByTestId("child")).toBeInTheDocument();
  });
});
