import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Section } from "@/components/editor/section";

describe("Section", () => {
  it("renders the title and shows children when open by default", () => {
    const { getByText } = render(
      <Section title="Easing" defaultOpen>
        <p>body</p>
      </Section>,
    );
    expect(getByText("Easing")).toBeTruthy();
    expect(getByText("body")).toBeTruthy();
  });

  it("hides children when not open by default", () => {
    const { queryByText } = render(
      <Section title="Duration">
        <p>body</p>
      </Section>,
    );
    expect(queryByText("body")).toBeNull();
  });

  it("toggles open/closed when the header is clicked", () => {
    const { getByText, queryByText } = render(
      <Section title="Duration">
        <p>body</p>
      </Section>,
    );
    fireEvent.click(getByText("Duration"));
    expect(queryByText("body")).toBeTruthy();
    fireEvent.click(getByText("Duration"));
    expect(queryByText("body")).toBeNull();
  });
});
