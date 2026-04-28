import { createKvStorage } from "./storage/kvStorage";

const storage = createKvStorage("biblebyte.cache");

export function cacheTodaySnippet(dateKey: string, snippet: string) {
  storage.set(`snippet:${dateKey}`, snippet);
}

export function getCachedSnippet(dateKey: string): string | undefined {
  return storage.getString(`snippet:${dateKey}`);
}
