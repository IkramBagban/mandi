/**
 * Global Jest setup — runs before every test file.
 *
 * Replaces AsyncStorage with its official in-memory mock so repository tests
 * exercise the real offline-mirror logic (`src/lib/offline.ts`) with zero
 * native modules and zero network. Tests reset it with `AsyncStorage.clear()`
 * in `beforeEach` to stay order-independent.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
