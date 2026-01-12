import tseslint from "@typescript-eslint/eslint-plugin";
import expoConfig from "eslint-config-expo/flat.js";
import tsparser from "@typescript-eslint/parser";
import eslintreact from "eslint-react";

export default [
  ...expoConfig,
  {
    ignores: [
      "dist/*",
      "__tests__/*",
      "node_modules/*",
      ".old_components/*",
      ".expo/*",
      "assets/*",
      "android/*",
      "ios/*",
    ],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "eslint-react": eslintreact,
    },
    rules: {
      "no-unused-vars": ["warn", { varsIgnorePattern: "^_" }],
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": ["warn", { ignoreRestArgs: true }],
    },
  },
];
