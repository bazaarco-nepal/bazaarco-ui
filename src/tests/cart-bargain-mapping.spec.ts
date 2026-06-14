import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock only the transport — the mapping under test is real.
vi.mock("@/services/api/http", () => ({
  getData: vi.fn(),
  postData: vi.fn(),
  patchData: vi.fn(),
  deleteData: vi.fn(),
}));
vi.mock("@/services/api/catalog", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapProduct: (r: any) => ({ id: r.id, name: r.name, price: r.price }),
}));

import { getData, postData } from "@/services/api/http";
import { cartApi } from "@/services/api/cart";

const mockedGet = getData as unknown as ReturnType<typeof vi.fn>;
const mockedPost = postData as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("cart line mapping — server bargain overlay", () => {
  it("prefers the server line price and carries the bargain flags through", async () => {
    mockedGet.mockResolvedValue({
      items: [
        {
          id: "p1",
          name: "Tee",
          price: 1000,
          qty: 1,
          variantId: "v1",
          variantName: "L",
          unitPrice: 800,
          bargained: true,
          bargainExpiresAt: "2026-06-11T10:00:00.000Z",
        },
      ],
    });

    const cart = await cartApi.get();

    // The bargained amount the server will charge wins over the listed price.
    expect(cart.items[0]!.price).toBe(800);
    expect(cart.items[0]!.bargained).toBe(true);
    expect(cart.items[0]!.bargainExpiresAt).toBe("2026-06-11T10:00:00.000Z");
  });

  it("falls back to the listed price on lines with no overlay", async () => {
    mockedGet.mockResolvedValue({
      items: [{ id: "p1", name: "Tee", price: 1000, qty: 1 }],
    });

    const cart = await cartApi.get();

    expect(cart.items[0]!.price).toBe(1000);
    expect(cart.items[0]!.bargained).toBe(false);
    expect(cart.items[0]!.bargainExpiresAt).toBeNull();
  });

  it("addItem never sends a price — the server owns bargained pricing", async () => {
    mockedPost.mockResolvedValue({ items: [] });

    await cartApi.addItem("p1", 1, "v1");

    expect(mockedPost).toHaveBeenCalledWith("/cart/items", {
      productId: "p1",
      quantity: 1,
      variantId: "v1",
    });
  });
});
