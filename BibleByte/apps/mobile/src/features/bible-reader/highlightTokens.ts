import type { HighlightColor } from "@biblebites/contracts";
import { uiTheme } from "@biblebites/ui";

export type HighlightToken = {
  color: HighlightColor;
  label: string;
  swatch: string;
  tint: string;
  bar: string;
};

export const HIGHLIGHT_TOKENS: HighlightToken[] = [
  {
    color: "sage",
    label: "Sage",
    swatch: "#7E8A66",
    tint: "rgba(126, 138, 102, 0.18)",
    bar: uiTheme.colors.sage
  },
  {
    color: "amber",
    label: "Amber",
    swatch: "#C99A4D",
    tint: "rgba(201, 154, 77, 0.20)",
    bar: uiTheme.colors.amber
  },
  {
    color: "blush",
    label: "Blush",
    swatch: "#D8A38B",
    tint: "rgba(216, 163, 139, 0.22)",
    bar: uiTheme.colors.blush
  },
  {
    color: "sky",
    label: "Sky",
    swatch: "#7C9BB4",
    tint: "rgba(124, 155, 180, 0.22)",
    bar: "#7C9BB4"
  }
];

export function highlightTokenFor(color: HighlightColor): HighlightToken {
  const token = HIGHLIGHT_TOKENS.find((t) => t.color === color);
  if (!token) {
    throw new Error(`Unknown highlight color: ${color}`);
  }
  return token;
}
