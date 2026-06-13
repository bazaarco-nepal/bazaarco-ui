import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Components author JSX with the automatic runtime; the vitest transform emits
// classic React.createElement, so expose React globally.
(globalThis as unknown as { React: typeof React }).React = React;

// The hero only needs Icon + AppLink from the UI kit — stub them so the test
// doesn't drag in the whole component library.
vi.mock("@/components/ui", () => ({
  Icon: () => null,
  AppLink: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href }, children),
}));

import { BestPicksHero, BestPicksBanner } from "@/features/home/_components/best-picks-hero";
import type { HeroSlide } from "@/services/api/home";

function slide(over: Partial<HeroSlide> = {}): HeroSlide {
  return {
    id: "h1",
    title: "Mega Dashain Sale",
    accent: "Up to 50% off",
    subtitle: "Verified Nepali sellers",
    ctaLabel: "Shop the sale",
    ctaHref: "/store/acme",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/banner.jpg",
    imageAlt: "Dashain sale banner",
    tint: "red",
    sponsored: false,
    campaignLabel: null,
    ...over,
  };
}

describe("homepage hero banner", () => {
  it("renders nothing when the API returns no banners (no hardcoded fallback)", () => {
    const { container } = render(<BestPicksHero slides={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when banners are still undefined (loading)", () => {
    const { container } = render(<BestPicksHero slides={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders an admin banner's content + internal CTA link + alt text", () => {
    render(<BestPicksHero slides={[slide()]} />);
    expect(screen.getByText("Mega Dashain Sale")).toBeInTheDocument();
    expect(screen.getByText("Up to 50% off")).toBeInTheDocument();
    expect(screen.getByText("Shop the sale").closest("a")).toHaveAttribute("href", "/store/acme");
    // alt text drives the image — required for a11y + slow connections.
    expect(screen.getByAltText("Dashain sale banner")).toBeInTheDocument();
  });

  it("requests a Cloudinary transform (no layout shift, auto format)", () => {
    render(<BestPicksHero slides={[slide()]} />);
    const img = screen.getByAltText("Dashain sale banner") as HTMLImageElement;
    expect(img.src).toContain("/image/upload/");
    expect(img.src).toContain("f_auto");
    expect(img.src).toContain("c_fill");
    // intrinsic width/height set (1:1) so the slot reserves space → no layout shift
    expect(img.getAttribute("width")).toBe("320");
    expect(img.getAttribute("height")).toBe("320");
  });

  it("labels a sponsored placement", () => {
    render(<BestPicksHero slides={[slide({ sponsored: true, campaignLabel: "Sponsored" })]} />);
    expect(screen.getByText("Sponsored")).toBeInTheDocument();
  });

  it("shows carousel dots only when there is more than one slide", () => {
    const { rerender } = render(<BestPicksBanner slides={[slide()]} />);
    expect(screen.queryByLabelText(/Show banner/)).not.toBeInTheDocument();

    rerender(
      <BestPicksBanner slides={[slide({ id: "a" }), slide({ id: "b", title: "Second" })]} />,
    );
    expect(screen.getByLabelText("Show banner 1 of 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Show banner 2 of 2")).toBeInTheDocument();
  });
});
