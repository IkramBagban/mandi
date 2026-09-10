/** Jest config for Expo SDK 57 — `jest-expo` preset, pure-logic unit tests only.
 *  No device/RN-render tests (no Detox/Maestro). See README "Testing". */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/tests/setup.ts'],
};
