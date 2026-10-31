import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      // Data loading sets state after the request resolves. The rule treats that as a render cascade.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
