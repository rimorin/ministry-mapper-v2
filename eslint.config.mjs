import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintReact from "@eslint-react/eslint-plugin";
import globals from "globals";

export default defineConfig(
  { ignores: ["**/*.md", "build/**"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  eslintReact.configs["recommended"],
  {
    languageOptions: {
      globals: {
        ...globals.browser
      },
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {
      // Advisory/style rules from @eslint-react recommended — not enforced yet
      "@eslint-react/jsx-no-children-prop": "off",
      "@eslint-react/set-state-in-effect": "off",
      "@eslint-react/use-state": "off",
      "@eslint-react/naming-convention-ref-name": "off",
      "@eslint-react/no-array-index-key": "off",
      "@eslint-react/no-context-provider": "off",
      "@eslint-react/purity": "off",
      "@eslint-react/no-unnecessary-use-prefix": "off",
      "@eslint-react/web-api-no-leaked-timeout": "off",
      "@eslint-react/no-use-context": "off"
    }
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest
      }
    },
    rules: {
      "@eslint-react/rules-of-hooks": "off"
    }
  }
);
