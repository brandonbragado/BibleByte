import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

describe("scriptureApiBibleModeGuard", () => {
  const OLD = process.env.SCRIPTURE_PROVIDER_MODE;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.SCRIPTURE_PROVIDER_MODE = OLD;
  });

  it("returns 503 JSON when mode is not api_bible", async () => {
    process.env.SCRIPTURE_PROVIDER_MODE = "mock";
    const { scriptureApiBibleModeGuard } = await import(
      "@/lib/scripture/api-bible-mode-guard"
    );
    const res = scriptureApiBibleModeGuard();
    expect(res).not.toBeNull();
    expect(res?.status).toBe(503);
    const json = await res!.json();
    expect(json.code).toBe("scripture_mode_required");
  });

  it("returns null when mode is api_bible", async () => {
    process.env.SCRIPTURE_PROVIDER_MODE = "api_bible";
    const { scriptureApiBibleModeGuard } = await import(
      "@/lib/scripture/api-bible-mode-guard"
    );
    expect(scriptureApiBibleModeGuard()).toBeNull();
  });
});
