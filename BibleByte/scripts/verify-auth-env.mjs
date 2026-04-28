import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const checks = [
  {
    file: "apps/mobile/.env",
    keys: ["EXPO_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_ANON_KEY"]
  },
  {
    file: "apps/api/.env",
    keys: [
      "SUPABASE_URL",
      "SUPABASE_JWKS_URL",
      "SUPABASE_JWT_ISSUER",
      "SUPABASE_JWT_AUDIENCE",
      "SUPABASE_SERVICE_ROLE_KEY"
    ]
  }
];

function parseEnvFile(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .reduce((acc, line) => {
      const separator = line.indexOf("=");
      if (separator === -1) {
        return acc;
      }

      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

let hasFailure = false;

for (const check of checks) {
  const absolutePath = path.join(root, check.file);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Missing file: ${check.file}`);
    hasFailure = true;
    continue;
  }

  const envMap = parseEnvFile(fs.readFileSync(absolutePath, "utf8"));
  for (const key of check.keys) {
    const value = envMap[key];
    if (!value || value.includes("YOUR_PROJECT_REF") || value.includes("YOUR_")) {
      console.error(`Missing or placeholder value in ${check.file}: ${key}`);
      hasFailure = true;
    }
  }
}

if (hasFailure) {
  console.error("Auth environment validation failed.");
  process.exit(1);
}

console.log("Auth environment validation passed.");
