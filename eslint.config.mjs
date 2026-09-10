// ESLint flat config: Expo defaults (incl. React Native + TS rules) with
// Prettier as the formatter (disables conflicting stylistic rules).
import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import eslintConfigPrettier from 'eslint-config-prettier';

export default defineConfig([
  ...expoConfig,
  eslintConfigPrettier,
  {
    ignores: ['dist/*', 'web-build/*'],
  },
]);
