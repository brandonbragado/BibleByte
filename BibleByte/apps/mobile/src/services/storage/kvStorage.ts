import { MMKV } from "react-native-mmkv";

/**
 * Cross-platform key/value storage. The native build uses MMKV (fast,
 * synchronous, encrypted-at-rest on device). The web build is shimmed in
 * `kvStorage.web.ts` to use `window.localStorage`.
 *
 * All consumers should depend ONLY on this `KvStorage` interface so feature
 * code stays portable across iOS / Android / Web.
 */

export type KvStorage = {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
};

export function createKvStorage(id?: string): KvStorage {
  const mmkv = id ? new MMKV({ id }) : new MMKV();
  return {
    getString: (key) => mmkv.getString(key),
    set: (key, value) => mmkv.set(key, value),
    delete: (key) => mmkv.delete(key)
  };
}
