import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

// ToastContainer relies on the automatic JSX runtime (no `import React`), but the
// vitest transform compiles its JSX to classic `React.createElement` — expose
// React on the global so the unqualified reference resolves.
(globalThis as unknown as { React: typeof React }).React = React;

// The one app-wide toast system: a white card with a status rail + chip, fired
// from the `toast` singleton and rendered by <ToastContainer/>. These pin the
// behaviour every feature relies on — the right a11y role per variant, an
// optional action button (e.g. Undo), keyboard/close dismissal, and dedupe of
// repeat fires. If any regress, toasts break across cart, checkout, auth, etc.

import { ToastContainer } from "@/shared/ui/toast";
import { toast, useToastStore } from "@/shared/lib/toast";

beforeEach(() => {
  useToastStore.getState().clear();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("Toast system", () => {
  it("renders no toast card while the store is empty", () => {
    render(<ToastContainer />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a polite status toast with title and message for success", () => {
    render(<ToastContainer />);
    act(() => void toast.success("Added to cart", { message: "Pixel 9 · 1 item" }));
    const card = screen.getByRole("status");
    expect(card).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Added to cart")).toBeInTheDocument();
    expect(screen.getByText("Pixel 9 · 1 item")).toBeInTheDocument();
  });

  it("uses an assertive alert role for errors and still shows a countdown bar", () => {
    const { container } = render(<ToastContainer />);
    act(() => void toast.error("Couldn't place order"));
    const card = screen.getByRole("alert");
    expect(card).toHaveAttribute("aria-live", "assertive");
    // Errors now auto-dismiss within the 6s cap, so they render the flowing bar.
    expect(container.querySelector(".bz-toast__progress")).not.toBeNull();
  });

  it("caps any toast duration at the 6s ceiling", () => {
    render(<ToastContainer />);
    act(() => void toast.info("Heads up", { duration: 99000 }));
    expect(useToastStore.getState().toasts[0]?.duration).toBe(6000);
  });

  it("renders an action button that runs its handler", () => {
    render(<ToastContainer />);
    const onClick = vi.fn();
    act(() => void toast.success("Saved to wishlist", { action: { label: "Undo", onClick } }));
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("dismisses on the close button after the exit animation", () => {
    vi.useFakeTimers();
    render(<ToastContainer />);
    act(() => void toast.error("Network error"));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    act(() => void vi.advanceTimersByTime(200));
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("dedupes a repeated fire instead of stacking", () => {
    render(<ToastContainer />);
    act(() => void toast.success("Added to cart"));
    act(() => void toast.success("Added to cart"));
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it("keeps at most three cards visible, newest first", () => {
    render(<ToastContainer />);
    act(() => {
      toast.info("First");
      toast.info("Second");
      toast.info("Third");
      toast.info("Fourth");
    });
    const cards = screen.getAllByRole("status");
    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveTextContent("Fourth");
  });
});
