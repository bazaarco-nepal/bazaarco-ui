import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Badge, OptionChip, RatingInline } from "@/components/ui";
import { TrustChips } from "@/features/pdp/_components/trust-chips";
import type { Product } from "@/types";

// The PDP consistency refactor pulls badges, option chips and the compact rating
// into shared kit components. These guard the behaviour those components are
// responsible for — not their pixel styling.

describe("Badge", () => {
  it("renders a leading status dot only when asked", () => {
    const { rerender, container } = render(<Badge tone="success">In stock</Badge>);
    expect(screen.getByText("In stock")).toBeInTheDocument();
    expect(container.querySelector("span[aria-hidden]")).toBeNull();

    rerender(
      <Badge tone="success" dot>
        In stock
      </Badge>,
    );
    expect(container.querySelector("span[aria-hidden]")).not.toBeNull();
  });
});

describe("RatingInline — rating honesty", () => {
  it("shows 'No reviews yet' (no gold star) when there are zero reviews", () => {
    const { container } = render(<RatingInline rating={0} count={0} />);
    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    // No filled gold star is rendered for an unrated product.
    expect(container.querySelector('[fill="var(--gold)"]')).toBeNull();
  });

  it("shows the score and review count once there are real reviews", () => {
    const { container } = render(<RatingInline rating={4.6} count={128} />);
    expect(screen.queryByText("No reviews yet")).toBeNull();
    expect(screen.getByText("4.6")).toBeInTheDocument();
    expect(screen.getByText("(128)")).toBeInTheDocument();
    expect(container.querySelector('[fill="var(--gold)"]')).not.toBeNull();
  });

  it("never renders a filled score for a rating that has no reviews", () => {
    // A product can carry a stale rating number with no reviews — still honest.
    render(<RatingInline rating={5} count={0} />);
    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    expect(screen.queryByText("5.0")).toBeNull();
  });
});

describe("OptionChip — unified selectable option", () => {
  it("reflects the selected state via aria-pressed", () => {
    const { rerender } = render(<OptionChip label="Red" onClick={() => {}} />);
    expect(screen.getByRole("button", { name: /Red/ })).toHaveAttribute("aria-pressed", "false");
    rerender(<OptionChip label="Red" selected onClick={() => {}} />);
    expect(screen.getByRole("button", { name: /Red/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("disables an unavailable option and does not fire onClick", () => {
    const onClick = vi.fn();
    render(<OptionChip label="XL" unavailable onClick={onClick} />);
    const btn = screen.getByRole("button", { name: /XL/ });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("marks a sold-out option but keeps it selectable", () => {
    const onClick = vi.fn();
    render(<OptionChip label="Blue" soldOut onClick={onClick} />);
    const btn = screen.getByRole("button", { name: /Blue/ });
    expect(btn).not.toBeDisabled();
    expect(screen.getByText("sold out")).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("TrustChips", () => {
  const base = { stockStatus: "in_stock" } as unknown as Product;

  it("shows an 'In stock' badge for an in-stock product", () => {
    render(<TrustChips product={base} />);
    expect(screen.getByText("In stock")).toBeInTheDocument();
    expect(screen.queryByText("Out of stock")).toBeNull();
  });

  it("never duplicates the 'Verified seller' fact (it lives in the seller card)", () => {
    render(<TrustChips product={base} />);
    expect(screen.queryByText(/verified seller/i)).toBeNull();
  });

  it("shows an out-of-stock badge when the product is out of stock", () => {
    render(<TrustChips product={{ stockStatus: "out_of_stock" } as unknown as Product} />);
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.queryByText("In stock")).toBeNull();
  });
});
