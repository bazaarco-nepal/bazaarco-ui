import { describe, it, expect } from "vitest";
import { displayName, userInitial, maskEmail } from "@/shared/lib/display";

describe("displayName", () => {
  it("uses the trimmed name when present", () => {
    expect(displayName({ name: "  Asha  " })).toBe("Asha");
  });

  it("falls back when name is missing/blank/null", () => {
    expect(displayName(null)).toBe("there");
    expect(displayName({ name: "   " })).toBe("there");
    expect(displayName({ name: null }, "friend")).toBe("friend");
  });
});

describe("userInitial", () => {
  it("uppercases the first letter of the name", () => {
    expect(userInitial({ name: "asha" })).toBe("A");
  });

  it("falls back to email, then '?'", () => {
    expect(userInitial({ email: "zed@x.com" })).toBe("Z");
    expect(userInitial(null)).toBe("?");
    expect(userInitial({})).toBe("?");
  });
});

describe("maskEmail", () => {
  it("masks the local part keeping first 2 and last char", () => {
    expect(maskEmail("abcdef@bazaar.co")).toBe("ab…f@bazaar.co");
  });

  it("handles a very short local part", () => {
    expect(maskEmail("ab@x.com")).toBe("ab…@x.com");
  });

  it("returns a dash for null/empty and passes through malformed input", () => {
    expect(maskEmail(null)).toBe("—");
    expect(maskEmail("")).toBe("—");
    expect(maskEmail("not-an-email")).toBe("not-an-email");
  });
});
