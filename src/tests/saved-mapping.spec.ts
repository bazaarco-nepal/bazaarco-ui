import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock only the transport — the real mapProduct/mapSeller run so we assert the
// v3 -> UI field translation actually happens for saved payloads.
vi.mock("@/services/api/http", () => ({
  getData: vi.fn(),
  postData: vi.fn(),
  patchData: vi.fn(),
  deleteData: vi.fn(),
}));

import { getData, postData, deleteData } from "@/services/api/http";
import { savedApi } from "@/services/api/saved";

const mockedGet = getData as unknown as ReturnType<typeof vi.fn>;
const mockedPost = postData as unknown as ReturnType<typeof vi.fn>;
const mockedDelete = deleteData as unknown as ReturnType<typeof vi.fn>;

// The shape the API actually returns for saved entries (raw v3 fields).
const rawResponse = {
  productIds: ["p1"],
  sellerIds: ["s1"],
  products: [
    {
      id: "p1",
      name: "Kurtha set",
      price: 2500,
      original: 3000,
      coverImageUrl: "https://cdn/img.jpg",
      reviewsCount: 7,
      rating: 4.5,
      storeId: "s1",
    },
  ],
  sellers: [{ id: "s1", name: "Shop", reviewsCount: 12, rating: 4.2 }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("savedApi field mapping", () => {
  it("maps raw product fields to the UI shape on get()", async () => {
    mockedGet.mockResolvedValue(rawResponse);

    const result = await savedApi.get();
    const product = result.products[0]!;

    expect(product.price).toBe(2500); // rupees, passed through
    expect(product.original).toBe(3000);
    expect(product.img).toBe("https://cdn/img.jpg"); // coverImageUrl -> img
    expect(product.reviews).toBe(7); // reviewsCount -> reviews
    expect(result.sellers[0]!.reviews).toBe(12); // seller reviewsCount -> reviews
  });

  it("maps products on addProduct() too (mutations return the full list)", async () => {
    mockedPost.mockResolvedValue(rawResponse);

    const result = await savedApi.addProduct("p1");
    expect(result.products[0]!.price).toBe(2500);
    expect(result.products[0]!.img).toBe("https://cdn/img.jpg");
  });

  it("maps products on removeProduct() too", async () => {
    mockedDelete.mockResolvedValue(rawResponse);

    const result = await savedApi.removeProduct("p1");
    expect(result.products[0]!.price).toBe(2500);
  });

  it("tolerates an empty saved", async () => {
    mockedGet.mockResolvedValue({
      productIds: [],
      sellerIds: [],
      products: [],
      sellers: [],
    });

    const result = await savedApi.get();
    expect(result.products).toEqual([]);
    expect(result.sellers).toEqual([]);
  });
});
