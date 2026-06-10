import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { ProductPhotoPicker, type ProductPhoto } from "@/components/seller/product-photo-picker";

// Feature: sellers can pick MULTIPLE product photos at once instead of one at a
// time. Selecting several files should queue them and walk the seller through
// the existing crop step one-by-one ("Photo X of Y"), capped at the remaining
// slots and skipping duplicate file names.
//
// The crop step itself relies on <canvas>.toBlob + real image decoding, neither
// of which jsdom implements, so these tests cover the selection/queue/validation
// logic and the multiple-vs-replace input wiring — not the pixel cropping.

let urlSeq = 0;
beforeEach(() => {
  urlSeq = 0;
  // jsdom doesn't implement object URLs; the picker mints one per chosen file.
  URL.createObjectURL = vi.fn(() => `blob:mock/${++urlSeq}`);
  URL.revokeObjectURL = vi.fn();
});

function imageFile(name: string) {
  return new File(["x"], name, { type: "image/jpeg" });
}

function fileInput(container: HTMLElement) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  expect(input).toBeTruthy();
  return input;
}

function remotePhoto(name: string): ProductPhoto {
  // A photo already saved on the CDN (edit flow) — no local file/objectURL.
  return {
    id: name,
    previewUrl: `https://cdn/${name}`,
    sourceName: name,
    remoteUrl: `https://cdn/${name}`,
  };
}

describe("ProductPhotoPicker — multi-select", () => {
  it("enables multiple selection when adding new photos", () => {
    const { container } = render(<ProductPhotoPicker photos={[]} onChange={() => {}} />);
    fireEvent.click(screen.getByText("Add photo"));
    expect(fileInput(container).multiple).toBe(true);
  });

  it("forces single selection when replacing one photo", () => {
    const { container } = render(
      <ProductPhotoPicker photos={[remotePhoto("a.jpg")]} onChange={() => {}} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Replace photo 1" }));
    expect(fileInput(container).multiple).toBe(false);
  });

  it("queues several picked files and opens the cropper at photo 1 of N", () => {
    const { container } = render(<ProductPhotoPicker photos={[]} onChange={() => {}} max={5} />);
    fireEvent.change(fileInput(container), {
      target: { files: [imageFile("a.jpg"), imageFile("b.jpg"), imageFile("c.jpg")] },
    });
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Photo 1 of 3/)).toBeInTheDocument();
  });

  it("never queues more than the remaining slots and warns the seller", () => {
    // 3 already saved, max 5 -> only 2 slots left. Pick 4 -> cropper caps at 2.
    const existing = [remotePhoto("x1.jpg"), remotePhoto("x2.jpg"), remotePhoto("x3.jpg")];
    const { container } = render(
      <ProductPhotoPicker photos={existing} onChange={() => {}} max={5} />,
    );
    fireEvent.change(fileInput(container), {
      target: {
        files: [imageFile("a.jpg"), imageFile("b.jpg"), imageFile("c.jpg"), imageFile("d.jpg")],
      },
    });
    expect(within(screen.getByRole("dialog")).getByText(/Photo 1 of 2/)).toBeInTheDocument();
    expect(screen.getByText(/up to 5 photos/)).toBeInTheDocument();
  });

  it("skips files whose name duplicates an already-added photo", () => {
    const { container } = render(
      <ProductPhotoPicker photos={[remotePhoto("a.jpg")]} onChange={() => {}} max={5} />,
    );
    fireEvent.change(fileInput(container), { target: { files: [imageFile("a.jpg")] } });
    // Only duplicate selected -> nothing to crop, error surfaced instead.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/same photo twice/i);
  });
});
