import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the shared HTTP layer so no network happens; assert the eSewa API calls
// hit the right endpoints with the right payloads.
vi.mock("@/shared/api/http", () => ({
  getData: vi.fn(),
  postData: vi.fn(),
}));

import { getData, postData } from "@/shared/api/http";
import { ordersApi } from "@/buyer/api/orders";
import { paymentsApi } from "@/buyer/api/payments";

const mockedPost = postData as unknown as ReturnType<typeof vi.fn>;
void getData;

describe("eSewa frontend API contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("checkoutEsewa posts to /orders/checkout with paymentMethod esewa", async () => {
    mockedPost.mockResolvedValue({
      order: { id: "BZ-1024", status: "awaiting_payment", total: 1149 },
      payment: { gateway: "esewa", paymentUrl: "https://esewa", fields: {} },
    });

    await ordersApi.checkoutEsewa({ phone: "9800000000", paymentMethod: "esewa" });

    expect(mockedPost).toHaveBeenCalledWith(
      "/orders",
      expect.objectContaining({ paymentMethod: "esewa", phone: "9800000000" }),
    );
  });

  it("COD checkout still posts paymentMethod cod (unchanged)", async () => {
    mockedPost.mockResolvedValue({ id: "BZ-1024", status: "placed" });

    await ordersApi.checkout({ phone: "9800000000", paymentMethod: "cod" });

    expect(mockedPost).toHaveBeenCalledWith(
      "/orders",
      expect.objectContaining({ paymentMethod: "cod" }),
    );
  });

  it("verifyEsewa posts the encoded data + source to the verify endpoint", async () => {
    mockedPost.mockResolvedValue({ status: "captured", orderId: "BZ-1024", message: "ok" });

    const result = await paymentsApi.verifyEsewa("ZW5jb2RlZA==", "success");

    expect(mockedPost).toHaveBeenCalledWith("/payments/esewa/verify", {
      encodedData: "ZW5jb2RlZA==",
      source: "success",
    });
    expect(result.status).toBe("captured");
  });
});
