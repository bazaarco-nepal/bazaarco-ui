import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// The component relies on the automatic JSX runtime (no `import React`), but the
// vitest transform compiles its JSX to classic `React.createElement`. Expose
// React on the global so that unqualified reference resolves during the test.
(globalThis as unknown as { React: typeof React }).React = React;

// REGRESSION: seller "Add video" upload form (src/components/common/video-upload-form.tsx).
// What this pins after the redesign:
//  1. The file picker is a real, sized upload button — the native <input type=file>
//     is hidden, not the tiny default "Choose File / no file selected" control.
//  2. Hashtags were removed entirely — no Hashtags label, no "Add tags" button.
//  3. There is NO free-text Title field; the reel is labelled by its product.
//  4. Product is chosen from a dropdown of the seller's own products.
//  5. The header close button calls onCancel (so the sheet can be dismissed).
//
// The hooks are mocked so the component renders without a react-query provider
// or real network — we only assert the rendered UI contract.

// Button (from the UI kit) supports `href` and reads the Next router on render.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/seller/videos",
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/shared/hooks/use-media-upload", () => ({
  useUploadVideo: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useCreateSellerVideo: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock("@/seller/hooks/use-seller", () => ({
  useSellerOrganization: () => ({ data: { sellerId: "sel_1" } }),
  useSellerInventory: () => ({
    data: [
      { id: "prod-1", name: "Chunky Bracelet" },
      { id: "prod-2", name: "Pashmina Shawl" },
    ],
    isLoading: false,
  }),
}));

vi.mock("@/shared/hooks/use-catalog", () => ({
  useSellerProducts: () => ({
    data: [
      { id: "prod-1", name: "Chunky Bracelet" },
      { id: "prod-2", name: "Pashmina Shawl" },
    ],
    isLoading: false,
  }),
}));

import { VideoUploadForm } from "@/components/common/video-upload-form";

describe("VideoUploadForm (redesign)", () => {
  it("renders a real upload button backed by a hidden native file input", () => {
    render(<VideoUploadForm onSuccess={() => {}} onCancel={() => {}} />);

    expect(screen.getByRole("button", { name: /choose a video to upload/i })).toBeInTheDocument();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    // Hidden — the styled button is the visible control, not the OS default.
    expect(input!.style.display).toBe("none");
  });

  it("renders no hashtags UI at all", () => {
    render(<VideoUploadForm onSuccess={() => {}} onCancel={() => {}} />);

    expect(screen.queryByText(/hashtag/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /add tags/i })).toBeNull();
  });

  it("has no free-text Title field and picks the product from a dropdown", () => {
    render(<VideoUploadForm onSuccess={() => {}} onCancel={() => {}} />);

    // No "Title" label anymore.
    expect(screen.queryByText(/^title$/i)).toBeNull();

    // Product is a <select> listing the seller's products.
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Chunky Bracelet" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Pashmina Shawl" })).toBeInTheDocument();
  });

  it("keeps Publish video and Save draft actions", () => {
    render(<VideoUploadForm onSuccess={() => {}} onCancel={() => {}} />);

    expect(screen.getByRole("button", { name: /publish video/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save draft/i })).toBeInTheDocument();
  });

  it("close button invokes onCancel", () => {
    const onCancel = vi.fn();
    render(<VideoUploadForm onSuccess={() => {}} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
