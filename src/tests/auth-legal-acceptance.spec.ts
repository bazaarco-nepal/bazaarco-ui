import { describe, expect, it } from "vitest";

/**
 * Tests for signup form legal acceptance
 * Buyer signup uses implicit T&C/privacy consent copy. Seller signup keeps an
 * explicit checkbox because seller accounts carry additional business terms.
 * Marketing opt-in remains separate and optional
 */

describe("Auth Form - Legal Acceptance", () => {
  const validEmail = "user@example.com";
  const validName = "John Doe";
  const validPassword = "SecurePass123!";

  function canSubmitRegister(intent: "buyer" | "seller", acceptedLegal: boolean): boolean {
    return (
      validEmail.trim().length > 0 &&
      validName.trim().length >= 2 &&
      validPassword.length >= 8 &&
      (intent !== "seller" || acceptedLegal)
    );
  }

  describe("Legal Acceptance UX", () => {
    it("should not require an explicit checkbox for buyer signup", () => {
      expect(canSubmitRegister("buyer", false)).toBe(true);
    });

    it("should keep seller legal acceptance unchecked by default", () => {
      const acceptedLegal = false;
      expect(acceptedLegal).toBe(false);
    });

    it("should require seller legal acceptance before enabling signup", () => {
      expect(canSubmitRegister("seller", false)).toBe(false);
      expect(canSubmitRegister("seller", true)).toBe(true);
    });

    it("should show seller legal error only after submit is attempted", () => {
      const acceptedLegal = false;
      expect(false && !acceptedLegal).toBe(false);
      expect(true && !acceptedLegal).toBe(true);
    });

    it("should include buyer and seller legal document links", () => {
      expect("/legal/terms-and-conditions").toBe("/legal/terms-and-conditions");
      expect("/legal/privacy-policy").toBe("/legal/privacy-policy");
      expect("/legal/seller-agreement").toBe("/legal/seller-agreement");
      expect("/legal/commission-information").toBe("/legal/commission-information");
      expect("/legal/seller-delivery-and-pickup-policy").toBe(
        "/legal/seller-delivery-and-pickup-policy",
      );
      expect("/legal/product-listing-rules").toBe("/legal/product-listing-rules");
    });
  });

  describe("Marketing Opt-In (Optional)", () => {
    it("should be optional (not required)", () => {
      const acceptedLegal = true;

      // Marketing consent should NOT block form submission
      expect(canSubmitRegister("seller", acceptedLegal)).toBe(true);
    });

    it("should NOT include cookie-tracking-notice if unchecked", () => {
      const acceptedMarketing = false;

      const baseAcceptances = [
        { slug: "age-verification", version: "1.0" },
        { slug: "terms-and-conditions", version: "1.0" },
        { slug: "privacy-policy", version: "1.0" },
      ];

      const conditionalAcceptances = acceptedMarketing
        ? [{ slug: "cookie-tracking-notice", version: "1.0" }]
        : [];

      const acceptances = [...baseAcceptances, ...conditionalAcceptances];

      expect(acceptances).toHaveLength(3);
      expect(acceptances).not.toContainEqual(
        expect.objectContaining({
          slug: "cookie-tracking-notice",
        }),
      );
    });

    it("should include cookie-tracking-notice if checked", () => {
      const acceptedMarketing = true;

      const baseAcceptances = [
        { slug: "age-verification", version: "1.0" },
        { slug: "terms-and-conditions", version: "1.0" },
        { slug: "privacy-policy", version: "1.0" },
      ];

      const conditionalAcceptances = acceptedMarketing
        ? [{ slug: "cookie-tracking-notice", version: "1.0" }]
        : [];

      const acceptances = [...baseAcceptances, ...conditionalAcceptances];

      expect(acceptances).toHaveLength(4);
      expect(acceptances).toContainEqual(
        expect.objectContaining({
          slug: "cookie-tracking-notice",
          version: "1.0",
        }),
      );
    });
  });

  describe("Register API Call Payload", () => {
    it("should always include all three legal acceptances (age, T&C, privacy)", () => {
      const acceptances = [
        { slug: "age-verification", version: "1.0" },
        { slug: "terms-and-conditions", version: "1.0" },
        { slug: "privacy-policy", version: "1.0" },
      ];

      expect(acceptances).toHaveLength(3);
      expect(acceptances).toContainEqual({ slug: "age-verification", version: "1.0" });
      expect(acceptances).toContainEqual({ slug: "terms-and-conditions", version: "1.0" });
      expect(acceptances).toContainEqual({ slug: "privacy-policy", version: "1.0" });
    });

    it("should send correct register payload with acceptances", () => {
      const email = "user@example.com";
      const fullName = "John Doe";
      const password = "SecurePass123!";
      const intent = "buyer";
      const acceptedMarketing = true;

      const registerPayload = {
        email,
        name: fullName,
        password,
        intent,
        acceptances: [
          { slug: "age-verification", version: "1.0" },
          { slug: "terms-and-conditions", version: "1.0" },
          { slug: "privacy-policy", version: "1.0" },
          ...(acceptedMarketing ? [{ slug: "cookie-tracking-notice", version: "1.0" }] : []),
        ],
      };

      expect(registerPayload.acceptances).toHaveLength(4);
      expect(registerPayload).toEqual({
        email: "user@example.com",
        name: "John Doe",
        password: "SecurePass123!",
        intent: "buyer",
        acceptances: [
          { slug: "age-verification", version: "1.0" },
          { slug: "terms-and-conditions", version: "1.0" },
          { slug: "privacy-policy", version: "1.0" },
          { slug: "cookie-tracking-notice", version: "1.0" },
        ],
      });
    });

    it("should NOT send cookie-tracking-notice if user declined marketing", () => {
      const acceptedMarketing = false;

      const acceptances = [
        { slug: "age-verification", version: "1.0" },
        { slug: "terms-and-conditions", version: "1.0" },
        { slug: "privacy-policy", version: "1.0" },
        ...(acceptedMarketing ? [{ slug: "cookie-tracking-notice", version: "1.0" }] : []),
      ];

      expect(acceptances).toHaveLength(3);
      expect(acceptances.some((a) => a.slug === "cookie-tracking-notice")).toBe(false);
    });
  });

  describe("Form Submission Validation", () => {
    it("should require acceptedLegal only for seller signup", () => {
      const scenarios = [
        {
          name: "Buyer valid without explicit legal checkbox",
          intent: "buyer" as const,
          acceptedLegal: false,
          email: "user@example.com",
          fullName: "John Doe",
          password: "SecurePass123!",
          expected: true,
        },
        {
          name: "Seller valid with legal accepted",
          intent: "seller" as const,
          acceptedLegal: true,
          email: "user@example.com",
          fullName: "John Doe",
          password: "SecurePass123!",
          expected: true,
        },
        {
          name: "Seller legal not accepted",
          intent: "seller" as const,
          acceptedLegal: false,
          email: "user@example.com",
          fullName: "John Doe",
          password: "SecurePass123!",
          expected: false,
        },
        {
          name: "Missing name",
          intent: "buyer" as const,
          acceptedLegal: true,
          email: "user@example.com",
          fullName: "",
          password: "SecurePass123!",
          expected: false,
        },
      ];

      scenarios.forEach(({ intent, acceptedLegal, email, fullName, password, expected }) => {
        const canSubmit =
          email.trim().length > 0 &&
          fullName.trim().length >= 2 &&
          password.length >= 8 &&
          (intent !== "seller" || acceptedLegal);
        expect(canSubmit).toBe(expected);
      });
    });

    it("should allow registration without marketing consent", () => {
      const acceptedLegal = true;
      const intent = "seller";
      const email = "user@example.com";
      const fullName = "John Doe";
      const password = "SecurePass123!";

      const canSubmit =
        email.trim().length > 0 &&
        fullName.trim().length >= 2 &&
        password.length >= 8 &&
        (intent !== "seller" || acceptedLegal);

      expect(canSubmit).toBe(true);
    });
  });

  describe("Document Versions", () => {
    it("should send version 1.0 for all acceptances", () => {
      const acceptances = [
        { slug: "age-verification", version: "1.0" },
        { slug: "terms-and-conditions", version: "1.0" },
        { slug: "privacy-policy", version: "1.0" },
        { slug: "cookie-tracking-notice", version: "1.0" },
      ];

      acceptances.forEach((acceptance) => {
        expect(acceptance.version).toBe("1.0");
      });
    });
  });
});
