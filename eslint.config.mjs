import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // One-off dev/utility scripts, not part of the app bundle
    "tmp/**",
    "seed_notifications.js",
    "fix_pdfs.js",
    "fix_ca.js",
    "check_schema.js",
  ]),
]);

export default eslintConfig;
