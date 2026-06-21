import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Buyer ⇄ seller import boundaries. Buyer and seller are two separate products
// sharing one repo; `shared/` is the only common ground. Rules start at "warn"
// during the migration and flip to "error" once every file has moved (Phase 5).
const SELLER_PATTERNS = ["@/seller", "@/seller/**"];
const BUYER_PATTERNS = ["@/buyer", "@/buyer/**"];
const boundary = (level, patterns, message) => ({
  "no-restricted-imports": [level, { patterns: [{ group: patterns, message }] }],
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    ignores: ["bazaarco-design/**", ".next/**", ".next-prod/**", "node_modules/**"],
  },
  {
    files: ["src/buyer/**", "src/app/(buyer)/**"],
    rules: boundary(
      "warn",
      SELLER_PATTERNS,
      "Buyer code must not import seller code. Put anything shared in src/shared.",
    ),
  },
  {
    files: ["src/seller/**", "src/app/(seller)/**"],
    rules: boundary(
      "warn",
      BUYER_PATTERNS,
      "Seller code must not import buyer code. Put anything shared in src/shared.",
    ),
  },
  {
    files: ["src/shared/**"],
    rules: boundary(
      "warn",
      [...BUYER_PATTERNS, ...SELLER_PATTERNS],
      "Shared code must not import buyer or seller code — invert the dependency instead.",
    ),
  },
  {
    files: ["src/components/ui/**", "src/features/**"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "prefer-const": "off",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-nocheck": "allow-with-description",
          minimumDescriptionLength: 3,
        },
      ],
    },
  },
];

export default eslintConfig;
