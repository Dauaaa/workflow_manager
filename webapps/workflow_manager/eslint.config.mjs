import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"]},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    rules: 
      { 
          "react/prop-types": "off",
          "@typescript-eslint/no-explicit-any": "off",
          "@typescript-eslint/no-namespace": "off",
          "@typescript-eslint/no-empty-object-type": "off",
      },
  }
];
