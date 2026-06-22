import React from "react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

import { useInfiniteScroll } from "@/shared/hooks/use-infinite-scroll";

// jsdom ships no IntersectionObserver — stub one we can drive by hand.
let triggerIntersect: (isIntersecting: boolean) => void;
let observedCount = 0;
let disconnectedCount = 0;

class MockIntersectionObserver {
  constructor(private cb: IntersectionObserverCallback) {
    triggerIntersect = (isIntersecting) =>
      this.cb(
        [{ isIntersecting } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
  }
  observe() {
    observedCount += 1;
  }
  disconnect() {
    disconnectedCount += 1;
  }
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function Probe({ enabled, onReach }: { enabled: boolean; onReach: () => void }) {
  const ref = useInfiniteScroll(onReach, { enabled });
  return <div ref={ref} />;
}

beforeEach(() => {
  observedCount = 0;
  disconnectedCount = 0;
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useInfiniteScroll", () => {
  it("fires onReach when the sentinel intersects while enabled", () => {
    const onReach = vi.fn();
    render(<Probe enabled onReach={onReach} />);
    expect(observedCount).toBe(1);
    triggerIntersect(true);
    expect(onReach).toHaveBeenCalledTimes(1);
  });

  it("ignores a non-intersecting entry", () => {
    const onReach = vi.fn();
    render(<Probe enabled onReach={onReach} />);
    triggerIntersect(false);
    expect(onReach).not.toHaveBeenCalled();
  });

  it("does not observe while disabled", () => {
    const onReach = vi.fn();
    render(<Probe enabled={false} onReach={onReach} />);
    expect(observedCount).toBe(0);
  });

  it("disconnects on unmount", () => {
    const { unmount } = render(<Probe enabled onReach={vi.fn()} />);
    unmount();
    expect(disconnectedCount).toBe(1);
  });
});
