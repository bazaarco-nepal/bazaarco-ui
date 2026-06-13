import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { HeroBannerContent } from "@bazaarco/hero-banner/types";

(globalThis as unknown as { React: typeof React }).React = React;

vi.mock("@/components/ui", () => ({
  Icon: () => null,
  AppLink: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href }, children),
}));

import { BestPicksHero, BestPicksBanner } from "@/features/home/_components/best-picks-hero";
import type { HeroSlide } from "@/services/api/home";

const sampleContent: HeroBannerContent = {
  layout: "image_right",
  blocks: [
    { id: "bg", type: "background", tint: "red" },
    { id: "h1", type: "headline", text: "Mega Dashain Sale", size: "lg", align: "left" },
    { id: "a1", type: "accent", text: "Up to 50% off", size: "lg", align: "left" },
    {
      id: "s1",
      type: "subtitle",
      text: "Verified Nepali sellers",
      size: "md",
      align: "left",
    },
    {
      id: "btn",
      type: "button",
      ctaLabel: "Shop the sale",
      ctaHref: "/store/acme",
      size: "md",
    },
    {
      id: "img",
      type: "image",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/banner.jpg",
      imageAlt: "Dashain sale banner",
    },
  ],
};

function slide(over: Partial<HeroSlide> = {}): HeroSlide {
  return {
    id: "h1",
    content: sampleContent,
    sponsored: false,
    campaignLabel: null,
    sponsorName: null,
    endsAt: null,
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

  it("renders block content + internal CTA link + alt text", () => {
    render(<BestPicksHero slides={[slide()]} />);
    expect(screen.getByText("Mega Dashain Sale")).toBeInTheDocument();
    expect(screen.getByText("Up to 50% off")).toBeInTheDocument();
    expect(screen.getByText("Shop the sale").closest("a")).toHaveAttribute("href", "/store/acme");
    expect(screen.getByAltText("Dashain sale banner")).toBeInTheDocument();
  });

  it("requests a Cloudinary transform (no layout shift, auto format)", () => {
    render(<BestPicksHero slides={[slide()]} />);
    const img = screen.getByAltText("Dashain sale banner") as HTMLImageElement;
    expect(img.src).toContain("/image/upload/");
    expect(img.src).toContain("f_auto");
    expect(img.src).toContain("c_fill");
    expect(img.getAttribute("width")).toBe("320");
    expect(img.getAttribute("height")).toBe("320");
  });

  it("labels a sponsored placement via sponsor_pill context", () => {
    render(
      <BestPicksHero
        slides={[
          slide({
            sponsored: true,
            campaignLabel: "Sponsored",
            content: {
              ...sampleContent,
              blocks: [...sampleContent.blocks, { id: "sp", type: "sponsor_pill" }],
            },
          }),
        ]}
      />,
    );
    expect(screen.getByText("Sponsored")).toBeInTheDocument();
  });

  it("shows carousel dots only when there is more than one slide", () => {
    const { rerender } = render(<BestPicksBanner slides={[slide()]} />);
    expect(screen.queryByLabelText(/Show banner/)).not.toBeInTheDocument();

    rerender(<BestPicksBanner slides={[slide({ id: "a" }), slide({ id: "b" })]} />);
    expect(screen.getByLabelText("Show banner 1 of 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Show banner 2 of 2")).toBeInTheDocument();
  });
});
