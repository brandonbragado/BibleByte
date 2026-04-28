/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{ts,tsx}", "./index.js", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ivory: "#F6F1E7",
        cream: "#FBF7EF",
        sand: "#EFE7D6",
        parchment: "#FFFDF8",
        deepOlive: "#3F4A2E",
        olive: "#5C6A45",
        sage: "#7E8A66",
        moss: "#3E5040",
        bark: "#2C2A22",
        ink: "#2D3320",
        gold: "#B79061",
        blush: "#D8A38B",
        amber: "#C99A4D",
        border: "#E4DCC9",
        divider: "#EBE3D2"
      },
      fontFamily: {
        serif: ["serif"],
        sans: ["System"]
      },
      borderRadius: {
        xs: "8px",
        sm: "14px",
        md: "20px",
        lg: "28px",
        xl: "36px",
        pill: "999px"
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "40px",
        xxxl: "56px"
      }
    }
  }
};
