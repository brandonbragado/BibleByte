// BibleByte design tokens
// Warm, nature-inspired palette: soft ivory background, deep olive text,
// and a rounded card system tuned for a calm, premium reading experience.

export const uiTheme = {
  brand: {
    name: "BibleByte",
    tagline: "A small daily scripture, beautifully delivered."
  },
  colors: {
    // Surfaces
    ivory: "#F6F1E7",
    cream: "#FBF7EF",
    sand: "#EFE7D6",
    parchment: "#FFFDF8",

    // Text and ink
    deepOlive: "#3F4A2E",
    olive: "#5C6A45",
    sage: "#7E8A66",
    moss: "#3E5040",
    bark: "#2C2A22",
    ink: "#2D3320",

    // Accents
    gold: "#B79061",
    blush: "#D8A38B",
    amber: "#C99A4D",

    // Semantic
    success: "#5A7A4A",
    danger: "#A94A3F",
    warning: "#C58B3A",

    // Borders & dividers
    border: "#E4DCC9",
    divider: "#EBE3D2",

    // Aliases (preserve back-compat with existing screens)
    warmWhite: "#F6F1E7",
    deepNavy: "#3F4A2E",
    softGold: "#B79061",
    mutedSage: "#7E8A66",
    mist: "#EFE7D6",
    fern: "#5C6A45",
    card: "#FFFDF8",
    textPrimary: "#3F4A2E",
    textSecondary: "#5C6A45",
    textMuted: "#7E8A66"
  },
  radius: {
    xs: 8,
    sm: 14,
    md: 20,
    lg: 28,
    xl: 36,
    pill: 999
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
    xxxl: 56
  },
  typography: {
    display: 36,
    h1: 30,
    h2: 24,
    title: 20,
    body: 16,
    bodySmall: 14,
    caption: 12,
    overline: 11,
    lineHeight: {
      tight: 22,
      normal: 26,
      relaxed: 30,
      verse: 32
    },
    letterSpacing: {
      tight: -0.2,
      normal: 0,
      wide: 0.4,
      overline: 1.6
    },
    fontFamily: {
      // Use platform serif for verses to feel elegant; system sans for UI.
      // Custom fonts (e.g. Cormorant Garamond, Inter) can be wired via expo-font.
      serif: undefined as string | undefined,
      sans: undefined as string | undefined
    }
  },
  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    heavy: "800"
  },
  shadows: {
    card: {
      shadowColor: "#5C4A1F",
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2
    },
    raised: {
      shadowColor: "#5C4A1F",
      shadowOpacity: 0.12,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4
    }
  }
} as const;

export type UITheme = typeof uiTheme;

export const shellTabs = ["Today", "Bible", "Growth", "Saved", "Profile"] as const;
