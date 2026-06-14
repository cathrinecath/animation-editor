import { describe, it, expect, vi, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { DesktopGate } from "@/components/desktop-gate";

type Listener = (event: { matches: boolean }) => void;

// jsdom has no matchMedia. Provide a mock whose `matches` can be flipped and
// that forwards a `change` event to the registered listener.
function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  let listener: Listener | null = null;
  window.matchMedia = vi.fn().mockImplementation(() => ({
    get matches() {
      return matches;
    },
    media: "(min-width: 1024px)",
    addEventListener: (_event: string, cb: Listener) => {
      listener = cb;
    },
    removeEventListener: () => {
      listener = null;
    },
  })) as unknown as typeof window.matchMedia;
  return {
    setMatches(next: boolean) {
      matches = next;
      listener?.({ matches: next });
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DesktopGate", () => {
  it("renders children on desktop (>= 1024px)", () => {
    mockMatchMedia(true);
    const { queryByText } = render(
      <DesktopGate>
        <div>editor</div>
      </DesktopGate>,
    );
    expect(queryByText("editor")).toBeInTheDocument();
  });

  it("hides children and shows the message below 1024px", () => {
    mockMatchMedia(false);
    const { queryByText } = render(
      <DesktopGate>
        <div>editor</div>
      </DesktopGate>,
    );
    expect(queryByText("editor")).not.toBeInTheDocument();
    expect(queryByText("Best on desktop 👋")).toBeInTheDocument();
  });

  it("reacts to viewport changes", () => {
    const mm = mockMatchMedia(true);
    const { queryByText } = render(
      <DesktopGate>
        <div>editor</div>
      </DesktopGate>,
    );
    expect(queryByText("editor")).toBeInTheDocument();
    act(() => {
      mm.setMatches(false);
    });
    expect(queryByText("editor")).not.toBeInTheDocument();
    expect(queryByText("Best on desktop 👋")).toBeInTheDocument();
  });
});
