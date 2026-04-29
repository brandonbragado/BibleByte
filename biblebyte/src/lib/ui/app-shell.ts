/**
 * Shared layout tokens so primary content and the fixed bottom nav stay the same width
 * at every breakpoint.
 */
export const appShellGutterClass =
  "px-4 sm:px-5 md:px-8 lg:px-10 xl:px-12";

export const appShellMaxWidthClass =
  "max-w-lg sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl";

export const appShellContentClass = [
  "relative z-10 mx-auto w-full",
  appShellMaxWidthClass,
  appShellGutterClass,
].join(" ");
