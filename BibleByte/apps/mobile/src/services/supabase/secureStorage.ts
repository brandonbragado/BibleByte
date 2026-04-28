import * as SecureStore from "expo-secure-store";

const storagePrefix = "biblebites.auth.";

function keyFor(key: string) {
  return `${storagePrefix}${key}`;
}

export const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return SecureStore.getItemAsync(keyFor(key));
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(keyFor(key), value);
  },
  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(keyFor(key));
  }
};
