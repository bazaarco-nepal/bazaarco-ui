import React from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { VideoFeedResponse } from "@/types/video";

const mocks = vi.hoisted(() => ({
  feed: null as VideoFeedResponse | null,
  searchParams: new URLSearchParams("product=prod-1"),
  setQueryData: vi.fn(),
  scrollTo: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
  useSearchParams: () => mocks.searchParams,
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ setQueryData: mocks.setQueryData }),
}));

vi.mock("@/buyer/hooks/use-video-feed", () => ({
  useVideoFeed: () => ({
    data: mocks.feed,
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("@/components/common", () => ({
  useBz: () => ({
    nav: vi.fn(),
    openProduct: vi.fn(),
    savedProducts: [],
    toggleSaved: vi.fn(),
  }),
}));

vi.mock("@/buyer/features/pdp/_components/product-actions", () => ({
  PdpAddToCartButton: () => <button type="button">Add to cart</button>,
  PdpMakeOfferButton: () => <button type="button">Make offer</button>,
  PdpViewProductLink: () => <button type="button">View product</button>,
  PdpWishlistButton: () => <button type="button">Save</button>,
}));

vi.mock("@/components/ui", () => ({
  AppLink: ({
    href,
    children,
    className,
    ariaLabel,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    ariaLabel?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
  Button: ({ href, children }: { href?: string; children: React.ReactNode }) =>
    href ? <a href={href}>{children}</a> : <button type="button">{children}</button>,
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
  Icon: ({ name }: { name: string }) => <span>{name}</span>,
  IconButton: ({
    label,
    onClick,
    disabled,
  }: {
    label: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
  }) => (
    <button type="button" aria-label={label} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
  Spinner: () => <span>Loading</span>,
}));

import { VideoTheater } from "@/buyer/features/video/video";

function feedWithViews(views: number): VideoFeedResponse {
  return {
    tab: "foryou",
    items: [
      {
        id: "prod-1",
        productId: "prod-1",
        videoId: "vid-1",
        name: "Red Kurta",
        caption: "Red Kurta",
        price: 1200,
        original: 1500,
        allowBargaining: true,
        outOfStock: false,
        cat: "fashion",
        sellerId: "store-1",
        img: "",
        icon: "video",
        tint: "#f5f5f5",
        hasVideo: true,
        videoUrl: "https://cdn.example.com/kurta.mp4",
        videoThumb: "",
        uploadedAt: "2026-01-01T00:00:00.000Z",
        rating: 4.5,
        reviews: 8,
        seller: {
          id: "store-1",
          name: "Kathmandu Fits",
          url: "/store/store-1",
          rating: 4.5,
          reviewsCount: 8,
          avatar: "",
        },
        engagement: { views, comments: 0, shares: 0, saves: 0 },
      },
      {
        id: "prod-2",
        productId: "prod-2",
        videoId: "vid-2",
        name: "Blue Shawl",
        caption: "Blue Shawl",
        price: 900,
        original: null,
        allowBargaining: true,
        outOfStock: false,
        cat: "fashion",
        sellerId: "store-2",
        img: "",
        icon: "video",
        tint: "#f5f5f5",
        hasVideo: true,
        videoUrl: "https://cdn.example.com/shawl.mp4",
        videoThumb: "",
        uploadedAt: "2026-01-01T00:00:00.000Z",
        rating: 0,
        reviews: 0,
        seller: {
          id: "store-2",
          name: "Pokhara Looms",
          url: "/store/store-2",
          rating: 0,
          reviewsCount: 0,
          avatar: "",
        },
        engagement: { views: 20, comments: 0, shares: 0, saves: 0 },
      },
    ],
  };
}

describe("Watch feed scroll position", () => {
  beforeEach(() => {
    mocks.feed = feedWithViews(10);
    mocks.searchParams = new URLSearchParams("product=prod-1");
    mocks.scrollTo.mockClear();
    mocks.setQueryData.mockClear();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      value: mocks.scrollTo,
      configurable: true,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      value: vi.fn().mockResolvedValue(undefined),
      configurable: true,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
      value: vi.fn(),
      configurable: true,
    });
  });

  it("does not re-apply the initial product scroll after the feed data refreshes", async () => {
    const { rerender } = render(<VideoTheater />);

    await waitFor(() => expect(mocks.scrollTo).toHaveBeenCalledTimes(1));

    mocks.feed = feedWithViews(11);
    rerender(<VideoTheater />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mocks.scrollTo).toHaveBeenCalledTimes(1);
  });
});
