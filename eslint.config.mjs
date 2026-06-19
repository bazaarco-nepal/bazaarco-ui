import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    ignores: ["bazaarco-design/**", ".next/**", ".next-prod/**", "node_modules/**"],
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
