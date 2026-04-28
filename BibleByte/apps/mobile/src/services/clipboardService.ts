import { Platform } from "react-native";

/**
 * Cross-platform copy-to-clipboard with graceful degradation.
 *
 * - Web: uses `navigator.clipboard.writeText` when available.
 * - Native: a no-op for now. Users can fall back to the system Share sheet,
 *   which exposes "Copy" on both iOS and Android.
 *
 * TODO[CLIPBOARD_NATIVE]: install `expo-clipboard` (`npx expo install
 * expo-clipboard`) and use `Clipboard.setStringAsync` once we ship a custom
 * dev client. Adding a native dep here today would force a rebuild.
 */
export async function copyText(text: string): Promise<boolean> {
  if (Platform.OS === "web") {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fall through; caller will surface a fallback message.
    }
    return false;
  }
  return false;
}
