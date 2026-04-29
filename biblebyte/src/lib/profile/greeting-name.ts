export type ProfileGreetingSource = {
  first_name?: string | null;
  display_name?: string | null;
};

function titleCaseWord(word: string): string {
  if (!word) return word;
  return word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Name shown after “Good morning/afternoon/evening,” — prefers `first_name`,
 * then first token of legacy `display_name`, then email local-part heuristic.
 */
export function resolveGreetingFirstName(
  profile: ProfileGreetingSource | null | undefined,
  email: string | undefined
): string {
  const fromFirst = profile?.first_name?.trim();
  if (fromFirst) {
    return titleCaseWord(fromFirst.split(/\s+/)[0] ?? fromFirst);
  }

  const display = profile?.display_name?.trim();
  if (display) {
    const token = display.split(/\s+/)[0];
    if (token) return titleCaseWord(token);
  }

  if (email) {
    const local = email.split("@")[0] ?? "";
    const chunk = local.split(/[._-]/)[0] ?? local;
    if (chunk) return titleCaseWord(chunk);
  }

  return "Friend";
}
