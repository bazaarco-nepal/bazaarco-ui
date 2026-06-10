import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Toast } from "@/components/ui/kit";

// The toast is the app-wide acknowledgement pill (navy, above the tab bar).
// These pin the behaviour the redesign promised: a compact message, an optional
// Undo for reversible actions (wishlist save), tap-to-dismiss, and the right
// a11y role per variant. If any of these regress the toast stops doing its job
// across every feature that fires one (auth, checkout, address, wishlist, ...).

function toast(over: Partial<{ msg: string; variant: string; undo: () => void }> = {}) {
  return { msg: "Saved to wishlist", id: 1, variant: "success", ...over };
}

describe("Toast pill", () => {
  it("renders nothing when there is no toast", () => {
    const { container } = render(<Toast toast={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows the message and a polite status role for success", () => {
    render(<Toast toast={toast()} />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Saved to wishlist")).toBeInTheDocument();
  });

  it("uses an assertive alert role for errors", () => {
    render(<Toast toast={toast({ msg: "Could not save address", variant: "error" })} />);
    const region = screen.getByRole("alert");
    expect(region).toHaveAttribute("aria-live", "assertive");
  });

  it("offers Undo only when an undo handler is provided, and runs it on click", () => {
    const undo = vi.fn();
    const { rerender } = render(<Toast toast={toast({ undo })} />);

    const btn = screen.getByRole("button", { name: /undo save to wishlist/i });
    fireEvent.click(btn);
    expect(undo).toHaveBeenCalledTimes(1);

    // A plain toast (no undo) must not render the button.
    rerender(<Toast toast={toast({ msg: "Removed from wishlist", undo: undefined })} />);
    expect(screen.queryByRole("button", { name: /undo/i })).not.toBeInTheDocument();
  });

  it("does not trigger undo when the body (not the button) is tapped", () => {
    const undo = vi.fn();
    render(<Toast toast={toast({ undo })} />);
    fireEvent.click(screen.getByText("Saved to wishlist"));
    expect(undo).not.toHaveBeenCalled();
  });
});
