import { describe, it, expect } from "vitest";
import { formatStoreAddress, emptyStoreAddress, type StoreAddress } from "@/lib/store-address";

// ---------------------------------------------------------------------------
// formatStoreAddress
// ---------------------------------------------------------------------------
describe("formatStoreAddress", () => {
  it("returns city only when no area or landmark", () => {
    expect(formatStoreAddress({ city: "Kathmandu" })).toBe("Kathmandu");
  });

  it("builds full 'landmark, area, city' string", () => {
    const addr: StoreAddress = {
      city: "Kathmandu",
      area: "Thamel",
      landmark: "Near Pumpernickel",
    };
    expect(formatStoreAddress(addr)).toBe("Near Pumpernickel, Thamel, Kathmandu");
  });

  it("skips blank area and landmark segments", () => {
    expect(formatStoreAddress({ city: "Pokhara", area: "", landmark: "  " })).toBe("Pokhara");
  });

  it("builds 'area, city' when landmark is absent", () => {
    expect(formatStoreAddress({ city: "Lalitpur", area: "Patan" })).toBe("Patan, Lalitpur");
  });

  it("falls back to cityFallback when address is null", () => {
    expect(formatStoreAddress(null, "Bhaktapur")).toBe("Bhaktapur");
  });

  it("falls back to cityFallback when address is undefined", () => {
    expect(formatStoreAddress(undefined, "Bhaktapur")).toBe("Bhaktapur");
  });

  it("returns empty string when both address and fallback are absent", () => {
    expect(formatStoreAddress(null)).toBe("");
    expect(formatStoreAddress(null, "")).toBe("");
    expect(formatStoreAddress(null, null)).toBe("");
  });

  it("prefers structured address over the fallback", () => {
    expect(formatStoreAddress({ city: "Pokhara", area: "Lakeside" }, "Kathmandu")).toBe(
      "Lakeside, Pokhara",
    );
  });

  it("trims whitespace in the city fallback", () => {
    expect(formatStoreAddress(null, "  Bhaktapur  ")).toBe("Bhaktapur");
  });
});

// ---------------------------------------------------------------------------
// emptyStoreAddress
// ---------------------------------------------------------------------------
describe("emptyStoreAddress", () => {
  it("returns an object with empty strings and null coords", () => {
    const addr = emptyStoreAddress();
    expect(addr.city).toBe("");
    expect(addr.area).toBe("");
    expect(addr.landmark).toBe("");
    expect(addr.lat).toBeNull();
    expect(addr.lng).toBeNull();
  });

  it("returns a new object each call (no shared reference)", () => {
    const a = emptyStoreAddress();
    const b = emptyStoreAddress();
    a.city = "Modified";
    expect(b.city).toBe("");
  });
});
