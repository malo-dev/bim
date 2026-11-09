/**
 * Flou de la barre d'onglets (backdrop-filter de la maquette).
 *  - Chaque onglet est une cible de flou (BlurTargetView) : la barre floute ce qui défile dessous.
 *  - Le flou n'apparaît que si du contenu passe réellement sous la barre (fondu animé),
 *    sinon il disparaît : chaque écran le signale avec useTabBarScroll().
 */
import React, { createContext, useContext, useEffect, useRef, useState, type ComponentRef, type RefObject } from "react";
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type BlurTargetRef = RefObject<ComponentRef<typeof View> | null>;
type Targets = Record<string, BlurTargetRef>;
type Ctx = {
  targets: Targets; register: (name: string, ref: BlurTargetRef) => void;
  covered: Record<string, boolean>; setCovered: (name: string, v: boolean) => void;
};
const TabBlurCtx = createContext<Ctx>({ targets: {}, register: () => {}, covered: {}, setCovered: () => {} });

export function TabBlurProvider({ children }: { children: React.ReactNode }) {
  const [targets, setTargets] = useState<Targets>({});
  const [covered, setCov] = useState<Record<string, boolean>>({});
  const register = (name: string, ref: BlurTargetRef) => setTargets((t) => (t[name] === ref ? t : { ...t, [name]: ref }));
  const setCovered = (name: string, v: boolean) => setCov((c) => (c[name] === v ? c : { ...c, [name]: v }));
  return <TabBlurCtx.Provider value={{ targets, register, covered, setCovered }}>{children}</TabBlurCtx.Provider>;
}

export const useTabBlur = () => useContext(TabBlurCtx);

/** Hauteur occupée par la barre (barre 70 + marge 18 + zone système). */
export const TAB_BAR_ZONE = 88;

/**
 * À brancher sur le ScrollView d'un onglet : indique à la barre si du contenu passe dessous.
 * bottomPad = le paddingBottom du contenu (espace vide sous le dernier élément).
 */
export function useTabBarScroll(name: string, bottomPad: number) {
  const { setCovered } = useContext(TabBlurCtx);
  const insets = useSafeAreaInsets();
  const m = useRef({ y: 0, h: 0, ch: 0 });
  const update = () => {
    const { y, h, ch } = m.current;
    if (!h || !ch) return;
    const zone = TAB_BAR_ZONE + (insets.bottom > 0 ? insets.bottom : 0);
    // bas du dernier élément réel (sans l'espace vide du bas), comparé au haut de la barre
    const lastItemBottom = ch - bottomPad - y;
    setCovered(name, lastItemBottom > h - zone + 4);
  };
  useEffect(() => () => setCovered(name, false), []);
  return {
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => { m.current.y = e.nativeEvent.contentOffset.y; update(); },
    onLayout: (e: LayoutChangeEvent) => { m.current.h = e.nativeEvent.layout.height; update(); },
    onContentSizeChange: (_w: number, hgt: number) => { m.current.ch = hgt; update(); },
    scrollEventThrottle: 32,
  };
}
