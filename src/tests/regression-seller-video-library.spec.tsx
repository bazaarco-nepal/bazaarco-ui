import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// The component relies on the automatic JSX runtime (no `import React`), but the
// vitest transform compiles its JSX to classic `React.createElement`. Expose
// React on the global so that unqualified reference resolves during the test.
(globalThis as unknown as { React: typeof React }).React = React;

// REGRESSION: seller Videos page (src/components/seller/seller-video-library.tsx).
// What this pins after the redesign:
//  1. A 3-up card grid — one card per video, no analytics panel.
//  2. Each card shows ONLY "For: {product}" + Edit + Delete (no title, no
//     view/like counts, no status badge).
//  3. The clip is handed to the shared VideoPlayer with its streaming props
//     (src + Cloudinary publicId) so it plays over the same HLS path the buyer
//     watch feed uses.
//
// Hooks and the heavy VideoPlayer are mocked so the component renders without a
// react-query provider, Cloudinary SDK, or real network — we only assert the
// rendered UI contract.

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/seller/videos",
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/shared/hooks/use-media-upload", () => ({
  useDeleteSellerVideo: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUpdateSellerVideo: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock("@/seller/hooks/use-seller", () => ({
  useSellerInventory: () => ({ data: [], isLoading: false }),
}));

// Capture the props the player receives so we can assert the streaming wiring
// without booting the real Cloudinary HLS player.
const videoPlayerProps: Array<Record<string, unknown>> = [];
vi.mock("@/components/ui", async () => {
  const actual = await vi.importActual<typeof import("@/components/ui")>("@/components/ui");
  return {
    ...actual,
    VideoPlayer: (props: Record<string, unknown>) => {
      videoPlayerProps.push(props);
      return React.createElement("div", { "data-testid": "video-player" });
    },
  };
});

import { SellerVideoLibrary } from "@/seller/components/seller-video-library";
import type { SellerVideoItem } from "@/services/api/media";

const VIDEOS: SellerVideoItem[] = [
  {
    id: "v1",
    productLabel: "Green Cotton Kurta",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/kurta.mp4",
    videoPublicId: "kurta",
    thumb: "https://img/kurta.jpg",
    views: 1240,
    likesCount: 87,
    tint: "blue",
    icon: "shirt",
    productId: "p1",
    status: "published",
  },
  {
    id: "v2",
    productLabel: "Pashmina Shawl",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/shawl.mp4",
    videoPublicId: "shawl",
    thumb: "https://img/shawl.jpg",
    views: 980,
    likesCount: 64,
    tint: "saffron",
    icon: "shirt",
    productId: "p2",
    status: "draft",
  },
];

function renderLibrary() {
  return render(
    <SellerVideoLibrary
      videos={VIDEOS}
      showUpload={false}
      onToggleUpload={() => {}}
      onRefetch={() => {}}
    />,
  );
}

describe("SellerVideoLibrary (redesign)", () => {
  it("renders one card per video labelled by product, with Edit and Delete", () => {
    renderLibrary();

    expect(screen.getByText("Green Cotton Kurta")).toBeInTheDocument();
    expect(screen.getByText("Pashmina Shawl")).toBeInTheDocument();
    // Two "For:" labels — one per card.
    expect(screen.getAllByText(/^For:/)).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /edit/i })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(2);
  });

  it("shows the per-video view count", () => {
    renderLibrary();

    // Localised counts from the backend (en-IN grouping).
    expect(screen.getByText(/1,240 views/)).toBeInTheDocument();
    expect(screen.getByText(/980 views/)).toBeInTheDocument();
  });

  it("shows no analytics panel, like counts, or status badges on the cards", () => {
    renderLibrary();

    expect(screen.queryByText(/analytics/i)).toBeNull();
    // Likes are not surfaced (87 / 64 from the fixtures).
    expect(screen.queryByText("87")).toBeNull();
    expect(screen.queryByText("64")).toBeNull();
    expect(screen.queryByText(/^Live$/)).toBeNull();
    expect(screen.queryByText(/^Draft$/)).toBeNull();
  });

  it("keeps the Add video button", () => {
    renderLibrary();
    expect(screen.getByRole("button", { name: /add video/i })).toBeInTheDocument();
  });

  it("Delete opens an in-app confirmation modal (no browser window.confirm)", () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    renderLibrary();

    // No dialog until Delete is pressed.
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: /^delete$/i })[0]!);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/delete this video\?/i)).toBeInTheDocument();
    // The product the clip belongs to is named in the confirmation copy.
    expect(screen.getByRole("dialog")).toHaveTextContent("Green Cotton Kurta");
    // Native confirm is never used.
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("streams each clip through VideoPlayer with its src + Cloudinary publicId", () => {
    videoPlayerProps.length = 0;
    renderLibrary();

    expect(videoPlayerProps).toHaveLength(2);
    expect(videoPlayerProps[0]).toMatchObject({
      src: VIDEOS[0]!.videoUrl,
      publicId: VIDEOS[0]!.videoPublicId,
    });
    expect(videoPlayerProps[1]).toMatchObject({
      src: VIDEOS[1]!.videoUrl,
      publicId: VIDEOS[1]!.videoPublicId,
    });
  });
});
