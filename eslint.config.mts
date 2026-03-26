import js from "@eslint/js";
import security from "eslint-plugin-security";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    // Ignore all .js files
    ignores: ["**/*.js"],
  },
  {
    files: ["**/*.{ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  tseslint.configs.recommended,
  {
    plugins: {
      // eslint-plugin-security is not typed, so we have to cast it to any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      security: security as any,
    },
    extends: [
      "security/recommended",
    ],
    rules: {
      'security/detect-bidi-characters': 'warn',
      'security/detect-buffer-noassert': 'warn',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'warn',
      'security/detect-eval-with-expression': 'warn',
      'security/detect-new-buffer': 'warn',
      'security/detect-no-csrf-before-method-override': 'warn',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-object-injection': 'off',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'warn',
      'security/detect-unsafe-regex': 'warn',
    },
  }
]);