/** Shared motion for post-login home welcome and bottom-tab switches. */
export const MAIN_SHELL_ENTRANCE_DURATION_S = 1.6;
export const MAIN_SHELL_ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const;
export const MAIN_SHELL_ENTRANCE_Y_PX = 20;

/** Stable key per bottom-nav tab; nested routes keep the parent tab key. */
export function mainTabKeyFromPathname(pathname: string): string {
  if (pathname.startsWith("/home")) return "home";
  if (pathname.startsWith("/bible")) return "bible";
  if (pathname.startsWith("/journal")) return "journal";
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.startsWith("/settings")) return "settings";
  return "main";
}
