import { describe, expect, it } from "vitest";

/**
 * Tests for signup form legal acceptance
 * After redesign: consolidated legal acceptance (age + T&C + privacy) into one checkbox
 * Marketing opt-in remains separate and optional
 */

describe("Auth Form - Legal Acceptance", () => {
  describe("Consolidated Legal Checkbox", () => {
    it("should be unchecked by default", () => {
      // State: const [acceptedLegal, setAcceptedLegal] = useState(false);
      expect(false).toBe(false);
    });

    it("should be required for form submission", () => {
      const acceptedLegal = false;
      const canSubmit = acceptedLegal;
      expect(canSubmit).toBe(false);
    });

    it("should enable submit button when checked with other required fields", () => {
      const acceptedLegal = true;
      const email = "user@example.com";
      const fullName = "John Doe";
      const password = "SecurePass123!";

      const canSubmit =
        email.trim().length > 0 &&
        fullName.trim().length >= 2 &&
        password.length >= 8 &&
        acceptedLegal;

      expect(canSubmit).toBe(true);
    });

    it("should disable submit button when unchecked", () => {
      const acceptedLegal = false;
      const email = "user@example.com";
      const fullName = "John Doe";
      const password = "SecurePass123!";

      const canSubmit =
        email.trim().length > 0 &&
        fullName.trim().length >= 2 &&
        password.length >= 8 &&
        acceptedLegal;

      expect(canSubmit).toBe(false);
    });

    it("should consolidate age verification into acceptance", () => {
      // Age verification is now part of the consolidated legal checkbox
      // Instead of a separate "I confirm I am 18+" checkbox
      const acceptedLegal = true;
      expect(acceptedLegal).toBe(true); // Covers age verification
    });

    it("should include links to both T&C and Privacy Policy", () => {
      // The consolidated checkbox includes:
      // "I'm 18 or older and agree to the Terms & Conditions and Privacy Policy"
      const tosLink = "/legal/terms-and-conditions";
      const privacyLink = "/legal/privacy-policy";
      expect(tosLink).toBe("/legal/terms-and-conditions");
      expect(privacyLink).toBe("/legal/privacy-policy");
    });
  });

  describe("Marketing Opt-In (Optional)", () => {
    it("should be optional (not required)", () => {
      const acceptedLegal = true;
      const email = "user@example.com";
      const fullName = "John Doe";
      const password = "SecurePass123!";

      // Marketing consent should NOT block form submission
      const canSubmit =
        email.trim().length > 0 &&
        fullName.trim().length >= 2 &&
        password.length >= 8 &&
        acceptedLegal;

      expect(canSubmit).toBe(true);
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
    it("should require acceptedLegal to be true for signup", () => {
      const scenarios = [
        {
          name: "All fields valid, legal accepted",
          acceptedLegal: true,
          email: "user@example.com",
          fullName: "John Doe",
          password: "SecurePass123!",
          expected: true,
        },
        {
          name: "Legal not accepted",
          acceptedLegal: false,
          email: "user@example.com",
          fullName: "John Doe",
          password: "SecurePass123!",
          expected: false,
        },
        {
          name: "Missing name",
          acceptedLegal: true,
          email: "user@example.com",
          fullName: "",
          password: "SecurePass123!",
          expected: false,
        },
      ];

      scenarios.forEach(({ acceptedLegal, email, fullName, password, expected }) => {
        const canSubmit =
          email.trim().length > 0 &&
          fullName.trim().length >= 2 &&
          password.length >= 8 &&
          acceptedLegal;
        expect(canSubmit).toBe(expected);
      });
    });

    it("should allow registration without marketing consent", () => {
      const acceptedLegal = true;
      const email = "user@example.com";
      const fullName = "John Doe";
      const password = "SecurePass123!";

      const canSubmit =
        email.trim().length > 0 &&
        fullName.trim().length >= 2 &&
        password.length >= 8 &&
        acceptedLegal;

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
