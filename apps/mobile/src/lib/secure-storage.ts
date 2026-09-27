import * as SecureStore from "expo-secure-store";

/** Session storage for Better Auth — Keychain / Keystore. */
export const secureStorage = {
  getItem: SecureStore.getItem,
  setItem: SecureStore.setItem,
  getItemAsync: SecureStore.getItemAsync,
  setItemAsync: SecureStore.setItemAsync,
};
