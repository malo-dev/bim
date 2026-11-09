/**
 * BIM NEXT — 8 thèmes. Par défaut : « BIM NEXT », aux couleurs du logo
 * (beaucoup de bleu #0353CC, du blanc et une touche de rouge #DE0202).
 * Le thème choisi est enregistré sur le téléphone (clé « bimnextTheme »).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemeId = "bim" | "blanc" | "gris" | "clair" | "bleurouge" | "neon" | "royal" | "nuit" | "terre";

type Def = {
  name: string; note: string;
  bg: [string, string, string]; mid: number;
  base: string; ink: string; accent: string; onAccent: string; accentFill: string; dot: string;
  fg?: string; muted?: string; glass?: string; onInk?: string; nav?: string;
  /** Bouton à glisser (rond) et bouton Scanner : couleur forte (rouge pour BIM NEXT). */
  knob?: string; scan?: string;
  /** Halos lumineux du fond (style futuriste) : [haut-droite, bas-gauche]. */
  aura?: [string, string];
  /** Intensité des halos [haut-droite, bas-gauche] (défaut 0.55 / 0.28). */
  auraAlpha?: [number, number];
  /** Verre des cartes : "sat" = bleu vif (maquette BIM NEXT), "white" = verre blanc presque opaque (thème Blanc). */
  fill?: "sat" | "white";
  /** Opacité du fond de la barre du bas (défaut 0.55). */
  navAlpha?: number;
  light?: boolean;
  sw: [string, string, string];
};

export const THEME_DEFS: Record<ThemeId, Def> = {
  bim:       { name: "BIM NEXT",     note: "Bleu du logo, verre et touches de rouge", bg: ["#1F6BFF", "#0B3FC0", "#041659"], mid: 0.48, base: "#041659", ink: "#0A2A7A", accent: "#FFFFFF", onAccent: "#0353CC", accentFill: "#CFE0FF", dot: "#FF2B3A", muted: "#C9DAFF", nav: "6,22,80", knob: "#E01E2B", scan: "#E01E2B", aura: ["#38B6FF", "#FF2B4A"], fill: "sat", sw: ["#0353CC", "#FFFFFF", "#DE0202"] },
  blanc:     { name: "Blanc",        note: "Tout blanc, verre blanc, touches de bleu et de rouge", bg: ["#FFFFFF", "#F4F7FC", "#E8EEF8"], mid: 0.5, base: "#E8EEF8", ink: "#1F5EFF", accent: "#1F5EFF", onAccent: "#FFFFFF", accentFill: "#6E96FF", dot: "#E01E2B", fg: "#0E1A3A", muted: "#5B6B8C", glass: "18,40,90", onInk: "#FFFFFF", nav: "255,255,255", knob: "#E01E2B", scan: "#E01E2B", aura: ["#5B8CFF", "#FF5A6A"], auraAlpha: [0.2, 0.12], fill: "white", navAlpha: 0.72, light: true, sw: ["#FFFFFF", "#1F5EFF", "#E01E2B"] },
  gris:      { name: "Graphite",     note: "Gris, blanc et noir",               bg: ["#646B75", "#535A63", "#444A52"], mid: 0.5,  base: "#444A52", ink: "#1E2125", accent: "#FFFFFF", onAccent: "#1E2125", accentFill: "#D9DDE3", dot: "#FF2E4D", sw: ["#5A616A", "#FFFFFF", "#FF2E4D"] },
  clair:     { name: "Clair",        note: "Blanc, bleu et une touche de rouge", bg: ["#FFFFFF", "#F6F8FC", "#EEF2F9"], mid: 0.55, base: "#EEF2F9", ink: "#12141A", accent: "#1F5EFF", onAccent: "#FFFFFF", accentFill: "#6E96FF", dot: "#E8323C", fg: "#12141A", muted: "#5B6272", glass: "18,40,90", onInk: "#FFFFFF", nav: "255,255,255", sw: ["#FFFFFF", "#1F5EFF", "#E8323C"] },
  bleurouge: { name: "Bleu & Rouge", note: "Bleu vif et boutons rouges",         bg: ["#2D6BFF", "#1647D6", "#0B2C94"], mid: 0.5,  base: "#0B2C94", ink: "#0A1B57", accent: "#E8323C", onAccent: "#FFFFFF", accentFill: "#FF7A82", dot: "#FF3B45", sw: ["#1F5EFF", "#E8323C", "#FFFFFF"] },
  neon:      { name: "Néon",         note: "Bleu, noir et rouge néon",           bg: ["#16204A", "#0B1029", "#05060A"], mid: 0.55, base: "#05060A", ink: "#0A0D18", accent: "#FF2E4D", onAccent: "#FFFFFF", accentFill: "#FF6B80", dot: "#3D8BFF", sw: ["#05060A", "#FF2E4D", "#3D8BFF"] },
  royal:     { name: "Royal",        note: "Aubergine, argent et doré",          bg: ["#6E4A72", "#4A2C4F", "#2E1A33"], mid: 0.5,  base: "#2E1A33", ink: "#1C1020", accent: "#D4AF37", onAccent: "#1C1020", accentFill: "#E8CF7A", dot: "#C9CCD3", sw: ["#4A2C4F", "#D4AF37", "#C9CCD3"] },
  nuit:      { name: "Nuit",         note: "Jaune, noir et violet",              bg: ["#3B2A5C", "#1F1633", "#0E0A16"], mid: 0.55, base: "#0E0A16", ink: "#0E0A16", accent: "#F5C518", onAccent: "#0E0A16", accentFill: "#F9DC6B", dot: "#9B6BFF", sw: ["#0E0A16", "#F5C518", "#9B6BFF"] },
  terre:     { name: "Terre",        note: "Marron, argent et lavande",          bg: ["#7A5C4E", "#5C4237", "#3E2B23"], mid: 0.5,  base: "#3E2B23", ink: "#2A1D17", accent: "#CDB9F0", onAccent: "#2A1D17", accentFill: "#E2D6F7", dot: "#C9CCD3", sw: ["#5C4237", "#CDB9F0", "#C9CCD3"] },
};

export const THEME_ORDER: ThemeId[] = ["bim", "blanc", "gris", "clair", "bleurouge", "neon", "royal", "nuit", "terre"];

export type BimTheme = {
  id: ThemeId; name: string; note: string; light: boolean;
  bg: [string, string, string]; bgLoc: [number, number, number];
  base: string; ink: string; accent: string; onAccent: string; accentFill: string; dot: string;
  fg: string; muted: string; mutedSoft: string; onInk: string; onInkMuted: string; danger: string;
  glassRgb: string; navBg: string;
  knob: string; scan: string; onScan: string; aura: [string, string] | null;
  /** Couleur d'action forte (boutons, accents) lisible avec du texte blanc et visible sur le verre. */
  action: string;
  /** Fond exact de la maquette (CSS, rendu natif par React Native 0.88 : halos + dégradé). */
  bgCss: string;
  /** Effet verre de la maquette : reflet intérieur en haut + ombre douce (box-shadow CSS). */
  glassFx: string;
  /** Verre : couleur du thème à l'opacité a (rgba(var(--bn-glass), a)). */
  glass: (a: number) => string;
  /**
   * Fond d'une surface en verre dépoli. Thème BIM NEXT : reproduit backdrop-filter saturate(150%)
   * + blanc a de la maquette en une seule couleur (verre bleu vif, pas un voile blanc).
   */
  glassFill: (a: number) => string;
};

const rgb = (hex: string) => {
  const h = hex.replace("#", "");
  return `${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)}`;
};

/** Version vive de la couleur dominante d'un thème (milieu du dégradé), pour teinter le verre. */
function vividOf(bg: [string, string, string]): [number, number, number] {
  const h2 = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = h2(bg[1]);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, dl = mx - mn;
  const sat = dl === 0 ? 0 : dl / (1 - Math.abs(2 * l - 1));
  // Couleur neutre (Graphite) : on garde le gris clair du haut du dégradé.
  if (sat < 0.12) return h2(bg[0]).map((x) => Math.round(x * 255)) as [number, number, number];
  let hue = 0;
  if (dl) hue = mx === r ? ((g - b) / dl) % 6 : mx === g ? (b - r) / dl + 2 : (r - g) / dl + 4;
  hue *= 60; if (hue < 0) hue += 360;
  const S = Math.max(sat, 0.62), L = 0.42;
  const C = (1 - Math.abs(2 * L - 1)) * S, X = C * (1 - Math.abs(((hue / 60) % 2) - 1)), m = L - C / 2;
  const [r1, g1, b1] = hue < 60 ? [C, X, 0] : hue < 120 ? [X, C, 0] : hue < 180 ? [0, C, X] : hue < 240 ? [0, X, C] : hue < 300 ? [X, 0, C] : [C, 0, X];
  return [r1, g1, b1].map((x) => Math.round((x + m) * 255)) as [number, number, number];
}

const ACTION: Partial<Record<ThemeId, string>> = {
  bim: "#E01E2B", blanc: "#1F5EFF", gris: "#FF2E4D", clair: "#1F5EFF", bleurouge: "#E8323C",
  neon: "#FF2E4D", royal: "#B8862B", nuit: "#7C4DDB", terre: "#8E6FD6",
};

export function makeTheme(id: ThemeId): BimTheme {
  const d = THEME_DEFS[id] ?? THEME_DEFS.bim;
  const glassRgb = d.glass ?? "255,255,255";
  const light = id === "clair" || !!d.light;
  return {
    id, name: d.name, note: d.note, light,
    bg: d.bg, bgLoc: [0, d.mid, 1],
    base: d.base, ink: d.ink, accent: d.accent, onAccent: d.onAccent, accentFill: d.accentFill, dot: d.dot,
    fg: d.fg ?? "#FFFFFF", muted: d.muted ?? "#D8DCE2", mutedSoft: d.muted ?? "#E9ECF0",
    onInk: d.onInk ?? "#FFFFFF", onInkMuted: "#C9CED5", danger: light ? "#D61F2C" : "#FF6B80",
    glassRgb, navBg: `rgba(${d.nav ?? "30,33,37"},${d.navAlpha ?? 0.55})`,
    action: ACTION[id] ?? d.knob ?? d.dot,
    knob: d.knob ?? d.ink, scan: d.scan ?? d.accent, onScan: d.scan ? "#FFFFFF" : d.onAccent, aura: d.aura ?? null,
    bgCss: (d.aura
      ? `radial-gradient(circle at 88% 6%, rgba(${rgb(d.aura[0])},${d.auraAlpha?.[0] ?? 0.55}) 0%, rgba(${rgb(d.aura[0])},0) 42%), radial-gradient(circle at 6% 104%, rgba(${rgb(d.aura[1])},${d.auraAlpha?.[1] ?? 0.28}) 0%, rgba(${rgb(d.aura[1])},0) 44%), `
      : "") + `linear-gradient(180deg, ${d.bg[0]} 0%, ${d.bg[1]} ${Math.round(d.mid * 100)}%, ${d.bg[2]} 100%)`,
    glassFx: light ? "inset 0 1px 0 rgba(255,255,255,0.9), 0 8px 24px rgba(18,40,90,0.10)" : "inset 0 1px 0 rgba(255,255,255,0.28), 0 10px 30px rgba(2,10,40,0.18)",
    glass: (a: number) => `rgba(${glassRgb},${a})`,
    glassFill: (a: number) => {
      // Thèmes clairs (Blanc, Clair) : verre blanc presque opaque.
      if (d.fill === "white" || light) return `rgba(255,255,255,${Math.min(0.96, 0.62 + a * 1.6).toFixed(2)})`;
      // Thèmes foncés : verre teinté de la couleur dominante du thème, comme le verre bleu de BIM NEXT
      // (couche « saturation » vive à 39 % + blanc a, composées en une seule rgba).
      const B = d.fill === "sat" ? [0, 65, 255] : vividOf(d.bg);
      const k = 0.39, A = 1 - (1 - k) * (1 - a);
      const c = (x: number) => Math.round((x * k * (1 - a) + 255 * a) / A);
      return `rgba(${c(B[0])},${c(B[1])},${c(B[2])},${A.toFixed(3)})`;
    },
  };
}

type Ctx = { th: BimTheme; setTheme: (id: ThemeId) => void; chosen: boolean | null; markChosen: () => void };
const BimCtx = createContext<Ctx>({ th: makeTheme("bim"), setTheme: () => {}, chosen: null, markChosen: () => {} });

/* Nouvelle clé : chaque téléphone repart une fois sur le thème BIM NEXT (bleu du logo). */
export const THEME_KEY = "bimnextTheme2";
const KEY = THEME_KEY;
const CHOSEN_KEY = "bimnextThemeChosen";

export function BimThemeProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<ThemeId>("bim");
  const [chosen, setChosen] = useState<boolean | null>(null);
  useEffect(() => {
    AsyncStorage.multiGet([KEY, CHOSEN_KEY]).then(([[, t], [, c]]) => {
      if (t && (THEME_DEFS as any)[t]) setId(t as ThemeId);
      setChosen(c === "1");
    }).catch(() => setChosen(false));
  }, []);
  const setTheme = useCallback((t: ThemeId) => {
    setId(t);
    AsyncStorage.setItem(KEY, t).catch(() => {});
  }, []);
  const markChosen = useCallback(() => {
    setChosen(true);
    AsyncStorage.setItem(CHOSEN_KEY, "1").catch(() => {});
  }, []);
  const value = useMemo(() => ({ th: makeTheme(id), setTheme, chosen, markChosen }), [id, chosen]);
  return React.createElement(BimCtx.Provider, { value }, children);
}

/** Thème courant + changement de thème. */
export function useBim() { return useContext(BimCtx); }
/** Raccourci : jetons du thème courant. */
export function useTh() { return useContext(BimCtx).th; }

export const F = { light: "LatoLight", regular: "Lato", italic: "LatoItalic", bold: "LatoBold" };

/** Formatage des EC (Ecoins) : 2 décimales. */
export const ec = (n: number | string | null | undefined) => {
  const v = Number(n ?? 0);
  return (Number.isFinite(v) ? v : 0).toFixed(2);
};

export type BimType = "eau" | "gaz" | "carburant";
export const TYPE_META: Record<BimType, { title: string; label: string; sub: string }> = {
  eau: { title: "Eau", label: "EAU", sub: "Livraison à domicile" },
  gaz: { title: "Gaz", label: "GAZ", sub: "Recharge de bouteille" },
  carburant: { title: "Carburant", label: "CARBURANT", sub: "−0,30 $/L chez TRILEX" },
};
