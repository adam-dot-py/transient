// Global Jest setup for Transient.
//
// Registers the official AsyncStorage mock so any module that transitively
// imports '@react-native-async-storage/async-storage' (e.g. ThemeContext /
// RoleContext via useColorScheme) works under Jest without each test having to
// mock it inline. This is the library's documented Jest integration:
// https://react-native-async-storage.github.io/async-storage/docs/advanced/jest
jest.mock(
  '@react-native-async-storage/async-storage',
  () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
