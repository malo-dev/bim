/**
 * Palette « héritée » : fait passer les anciens écrans (espaces gestion, livreur, chauffeur)
 * sur le thème BIM NEXT choisi, sans toucher à leur logique.
 * Chaque ancienne clé de couleur (bg, card, text, primary…) est reliée au thème actif :
 * fond transparent (dégradé du thème derrière), cartes en verre teinté, textes du thème,
 * couleur d'action du thème. Les couleurs d'état (vert, rouge, ambre…) restent fixes.
 */
import { useMemo } from "react";
import { useTh } from "./theme";

export function useBimPalette() {
  const th = useTh();
  return useMemo(() => {
    const card = th.glassFill(0.14);
    const border = th.glass(0.22);
    return {
      // fonds
      bg: "transparent", canvas: "transparent", topBarBg: "transparent",
      card, surface: card, cardBg: card, dropdownBg: th.light ? "#FFFFFF" : th.base, introBg: card, textareaBg: th.glassFill(0.12),
      photoSlotBg: th.glassFill(0.12), input: th.glassFill(0.12), inputBg: th.glassFill(0.12), inputFocusBg: th.glassFill(0.18),
      glass: card, glassBord: border, border, introBord: border, cardBord: border,
      iconBtnBg: th.glass(0.16), iconBtnBord: border, skeleton: th.glass(0.14),
      introIconBg: th.glass(0.18), iconFocusBg: th.glass(0.2), cameraCircle: th.glass(0.18), photoBadge: th.action,
      commBg: th.glass(0.16), statusBg: th.glass(0.16),
      // textes
      text: th.fg, onSurface: th.fg, textSec: th.mutedSoft, textSub: th.muted, textMut: th.muted, muted: th.muted, outline: th.muted,
      // accents
      primary: th.action, blue: th.action, col: th.action, commText: th.fg, deep: th.ink, accent: th.action,
      headerFrom: th.bg[0], headerTo: th.bg[2],
      // couleurs d'état (fixes)
      white: "#FFFFFF", green: "#22C55E", greenDark: "#16A34A", onlineGreen: "#22C55E", success: "#22C55E",
      amber: "#F59E0B", warning: "#F59E0B", red: "#FF5A66", error: "#FF5A66", purple: "#A78BFA",
      // effets
      glassFx: th.glassFx, isDark: !th.light,
    };
  }, [th]);
}
