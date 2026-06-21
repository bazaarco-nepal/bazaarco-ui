import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { tintForName } from "@/shared/lib/store-tint";
import { StoreAvatar } from "@/components/ui";

// The store brand tint is hashed from the NAME so the same shop is always the
// same colour everywhere it appears, and a grid of them looks intentional rather
// than like a random crayon box.
describe("tintForName", () => {
  it("maps names to stable tint keys (pinned)", () => {
    expect(tintForName("Bhimsen Naturals")).toBe("blue");
    expect(tintForName("Everest Gadgets")).toBe("purple");
    expect(tintForName("Himalayan Threads")).toBe("slate");
  });

  it("is case/whitespace-insensitive — the same shop is always the same colour", () => {
    expect(tintForName("Bhimsen Naturals")).toBe(tintForName("  bhimsen naturals "));
  });

  it("always returns one of the known tint keys, even for empty/odd input", () => {
    const keys = new Set(["blue", "red", "green", "saffron", "gold", "slate", "teal", "purple"]);
    for (const n of ["", "x", "Store 123", "ÜñïçodeShop", null, undefined]) {
      expect(keys.has(tintForName(n))).toBe(true);
    }
  });
});

describe("StoreAvatar rendering technique", () => {
  it("renders the logo image when a src is given", () => {
    const { container } = render(
      <StoreAvatar src="https://cdn/logo.png" name="Everest Gadgets" size={48} />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", "https://cdn/logo.png");
  });

  it("falls back to the first letter (uppercased) of the name when there is no logo", () => {
    const { container, getByText } = render(
      <StoreAvatar src={null} name="everest gadgets" size={36} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(getByText("E")).toBeInTheDocument();
  });

  it("uses the first whole grapheme cluster for non-Latin names (Devanagari)", () => {
    // The consonant + vowel sign (म + े) form one akshara and must stay
    // together — a code-point split would orphan the matra into a broken glyph.
    const { getByText } = render(<StoreAvatar name="मेरो पसल" size={48} />);
    expect(getByText("मे")).toBeInTheDocument();
  });

  it("shows '?' when the name is empty", () => {
    const { getByText } = render(<StoreAvatar name="   " size={48} />);
    expect(getByText("?")).toBeInTheDocument();
  });

  it("is a soft squircle (brand tile), not a circle", () => {
    const { container } = render(<StoreAvatar name="Shop" size={56} />);
    const tile = container.firstChild as HTMLElement;
    // 30% radius gives the same squircle at every size — never 50% (a circle).
    expect(tile.style.borderRadius).toBe("30%");
    expect(tile.style.borderRadius).not.toBe("50%");
  });

  it("labels the tile with the store name for assistive tech", () => {
    const { container } = render(<StoreAvatar name="Everest Gadgets" size={56} />);
    const tile = container.firstChild as HTMLElement;
    expect(tile).toHaveAttribute("role", "img");
    expect(tile).toHaveAttribute("aria-label", "Everest Gadgets");
  });
});
