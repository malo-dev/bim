/**
 * Global theme — basé sur la palette HomeScreen
 */

import { Platform } from "react-native";

/* ───────── PALETTE BASE APP ───────── */
const BRAND = {
  primary: "#0353CC",
  red: "#DC0302",
  violet: "#3906C7",
  deep: "#302E99",
  accent: "#4D96FF",
  gold: "#FFD700",
  white: "#FFFFFF",
  black: "#000000",
  text: "#0D1B3E",
  muted: "#7B8DB0",
  gray: "#F4F6FA",
};

/* ───────── COLORS LIGHT / DARK ───────── */
export const Colors = {
  light: {
    /* background */
    background: BRAND.gray,
    card: BRAND.white,
    surface: BRAND.white,

    /* text */
    text: BRAND.text,
    textSecondary: BRAND.muted,

    /* brand */
    primary: BRAND.primary,
    accent: BRAND.accent,
    danger: BRAND.red,

    /* icons */
    icon: "#5E6A85",

    /* tabs */
    tabIconDefault: "#7B8DB0",
    tabIconSelected: BRAND.primary,

    /* borders */
    border: "#E6EAF2",

    /* gradients */
    gradientStart: BRAND.deep,
    gradientEnd: BRAND.primary,
  },

  dark: {
    /* background */
    background: "#0B1220",
    card: "#121A2B",
    surface: "#182033",

    /* text */
    text: "#EAF0FF",
    textSecondary: "#9FB0D0",

    /* brand */
    primary: "#4D8DFF",
    accent: "#6AA8FF",
    danger: "#FF5A5A",

    /* icons */
    icon: "#A8B3CF",

    /* tabs */
    tabIconDefault: "#6B7AA6",
    tabIconSelected: "#4D8DFF",

    /* borders */
    border: "#1F2A44",

    /* gradients */
    gradientStart: "#1A2A6C",
    gradientEnd: "#0353CC",
  },
};

/* ───────── QUICK ACCESS COLORS ───────── */
export const COLORS = {
  primary: BRAND.primary,
  primaryLight: "#1561CC",
  red: BRAND.red,
  white: BRAND.white,
  black: BRAND.black,
  gray: BRAND.gray,
};

/* ───────── FONTS APP (TES FONTS) ───────── */
export const FONTS = {
  light: "NexaLight",
  regular: "NexaRegular",
  bold: "NexaBold",
};

/* ───────── SYSTEM FONTS FALLBACK ───────── */
export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:
      "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});



export const B = {
  violet: "#3906C7",
  deep:   "#0353CC",
  white:  "#FFFFFF",
};


export const C = {
  primary: "#0353CC",
  red:     "#DC0302",
  violet:  "#3906C7",
  deep:    "#302E99",
  accent:  "#4D96FF",
  gold:    "#FFD700",
  white:   "#FFFFFF",
  black:   "#000000",
  bg:      "#0353CC",
  card:    "#FFFFFF",
  text:    "#0D1B3E",
  muted:   "#7B8DB0",
  f4:      "#F4F6FA",
};