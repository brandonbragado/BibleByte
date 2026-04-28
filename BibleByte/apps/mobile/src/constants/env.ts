import { z } from "zod";

/**
 * BibleByte mobile environment.
 *
 * Only `EXPO_PUBLIC_*` variables are bundled into the client. The Supabase
 * service-role key MUST NEVER be referenced here or anywhere in `apps/mobile`.
 *
 * TODO[ENV_HYGIENE]: When CI is added, fail the build if any non-public
 * Supabase secret accidentally leaks into the mobile bundle (regex check on
 * service_role / sk_ / anon_secret).
 */

const EnvSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z
    .string()
    .url("EXPO_PUBLIC_SUPABASE_URL must be a valid https URL.")
    .refine(
      (url) => {
        try {
          return new URL(url).hostname !== "example.supabase.co";
        } catch {
          return false;
        }
      },
      {
        message:
          "EXPO_PUBLIC_SUPABASE_URL must be your real project URL from Supabase Dashboard → Settings → API (not example.supabase.co)."
      }
    ),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, "EXPO_PUBLIC_SUPABASE_ANON_KEY looks too short."),
  EXPO_PUBLIC_DEEP_LINK_SCHEME: z.string().default("biblebyte"),
  /** Optional BibleByte API base (e.g. http://localhost:3000). No trailing slash. Used for Bible Chat. */
  EXPO_PUBLIC_API_URL: z.string().optional()
});

const parsed = EnvSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_DEEP_LINK_SCHEME: process.env.EXPO_PUBLIC_DEEP_LINK_SCHEME,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n  - ");
  throw new Error(
    `Invalid mobile environment.\nCopy apps/mobile/.env.example to apps/mobile/.env and fill in the values.\n  - ${issues}`
  );
}

const data = parsed.data;

if (data.EXPO_PUBLIC_SUPABASE_ANON_KEY.includes("service_role")) {
  throw new Error(
    "Refusing to start: a service-role key was placed in EXPO_PUBLIC_SUPABASE_ANON_KEY. The mobile bundle must only ship the anon key."
  );
}

function normalizeApiBaseUrl(raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    const url = new URL(trimmed);
    const pathname = url.pathname.replace(/\/$/, "");
    return `${url.origin}${pathname}`;
  } catch {
    throw new Error("EXPO_PUBLIC_API_URL must be a valid absolute URL (e.g. http://localhost:3000).");
  }
}

export const env = {
  supabaseUrl: data.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: data.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  deepLinkScheme: data.EXPO_PUBLIC_DEEP_LINK_SCHEME,
  apiBaseUrl: normalizeApiBaseUrl(data.EXPO_PUBLIC_API_URL)
} as const;
