import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@prisma/client",
              message:
                "Import Prisma only in src/server/db, src/server/repositories, or src/server/services.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/server/db/**/*.{ts,tsx}",
      "src/server/repositories/**/*.{ts,tsx}",
      "src/server/services/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    files: [
      "src/app/**/*.{ts,tsx}",
      "src/features/**/*.{ts,tsx}",
      "src/lib/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/server/db",
              message:
                "UI and shared modules must not import the database layer directly.",
            },
            {
              name: "@/server/db/client",
              message:
                "UI and shared modules must not import the database layer directly.",
            },
            {
              name: "@prisma/client",
              message:
                "Prisma is server-only and belongs in repositories/services.",
            },
          ],
          patterns: [
            {
              group: ["@/server/db/*"],
              message:
                "UI and shared modules must not import the database layer directly.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
