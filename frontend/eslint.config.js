import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import hooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist", "coverage", "src/lib/api/generated.ts"] },
  js.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: 2022, sourceType: "module", ecmaFeatures: { jsx: true } },
      globals: {
        document: "readonly",
        window: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        Blob: "readonly",
        File: "readonly",
        FormData: "readonly",
        Headers: "readonly",
        RequestInit: "readonly",
        BodyInit: "readonly",
        Response: "readonly",
        fetch: "readonly",
        navigator: "readonly",
        HTMLInputElement: "readonly",
        HTMLButtonElement: "readonly",
        HTMLTextAreaElement: "readonly",
        HTMLSelectElement: "readonly",
        HTMLLabelElement: "readonly",
        KeyboardEvent: "readonly",
      },
    },
    plugins: { "@typescript-eslint": tseslint, "react-hooks": hooks },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...hooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
