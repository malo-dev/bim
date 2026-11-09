/**
 * Composants partagés du design BIM NEXT — suivent le thème choisi (7 thèmes).
 */
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Animated, Easing, FlatList, KeyboardAvoidingView, LayoutChangeEvent, Modal, Platform, Pressable, ScrollView, StatusBar,
  StyleProp, StyleSheet, Text, TextInput, TextProps, TextStyle, View, ViewStyle,
} from "react-native";
import Svg, { Circle, Defs, Path, RadialGradient, Stop, SvgXml } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AFRICA_COUNTRIES } from "@/constants/africaCountries";
import BlinkingCursor from "@/components/ui/BlinkingCursor";
import { BimIcon, BimIconName } from "./icons";
import { F, THEME_DEFS, THEME_ORDER, useBim, useTh } from "./theme";

/* ─── Textes ─── */
type TProps = TextProps & { w?: "light" | "regular" | "bold" | "italic"; size?: number; color?: string; style?: StyleProp<TextStyle> };
export function T({ w = "regular", size = 15, color, style, ...rest }: TProps) {
  const th = useTh();
  // includeFontPadding: false → mêmes hauteurs de texte sur Android que sur iPhone.
  return <Text {...rest} style={[{ fontFamily: F[w], fontSize: size, color: color ?? th.fg, includeFontPadding: false }, style]} />;
}

/* ─── Fond ─── */
/** Entrée de page de la maquette (bnPage) : fondu + glissé de 70 px + léger zoom, 0,5 s. */
export const PAGE_EASE = Easing.bezier(0.2, 0.8, 0.2, 1);
/**
 * enter : true = entrée de page (bnPage, 0,5 s, 70 px + zoom) ;
 *         "slide" = entrée du parcours d'ouverture (bnEnter, 0,55 s, 60 px) ; false = aucune.
 */
export function BimBackground({ children, style, colors, enter = true }: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; colors?: readonly [string, string, string]; enter?: boolean | "slide" }) {
  const th = useTh();
  const v = useRef(new Animated.Value(enter ? 0 : 1)).current;
  const dx = enter === "slide" ? 60 : 70;
  const sc = enter === "slide" ? 1 : 0.98;
  useEffect(() => {
    if (enter) Animated.timing(v, { toValue: 1, duration: enter === "slide" ? 550 : 500, easing: PAGE_EASE, useNativeDriver: true }).start();
  }, []);
  return (
    <View style={[{ flex: 1, backgroundColor: th.base, backgroundImage: colors ? `linear-gradient(180deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)` : th.bgCss }, style]}>
      <StatusBar barStyle={th.light ? "dark-content" : "light-content"} />
      <Animated.View style={{ flex: 1, opacity: v, transform: [
        { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [dx, 0] }) },
        { scale: v.interpolate({ inputRange: [0, 1], outputRange: [sc, 1] }) },
      ] }}>
        {children}
      </Animated.View>
    </View>
  );
}

/** Halos de lumière du fond (thème BIM NEXT) : bleu ciel en haut, rouge discret en bas, qui respirent. */
export function Aura({ colors }: { colors: [string, string] }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  const blob = (id: string, c: string, o: number, s: number) => (
    <Svg width={s} height={s}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={c} stopOpacity={o} />
          <Stop offset="1" stopColor={c} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={s / 2} cy={s / 2} r={s / 2} fill={`url(#${id})`} />
    </Svg>
  );
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, overflow: "hidden" }}>
      <Animated.View style={{ position: "absolute", top: -140, right: -160, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }] }}>
        {blob("auraA", colors[0], 0.55, 480)}
      </Animated.View>
      <Animated.View style={{ position: "absolute", bottom: -200, left: -200, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -24] }) }] }}>
        {blob("auraB", colors[1], 0.22, 520)}
      </Animated.View>
    </View>
  );
}

/** Petit retour tactile à l'appui (silencieux si indisponible). */
export const tap = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };

/** Halo radial (radial-gradient de la maquette). */
export function Glow({ size = 440, top = 60, opacity = 0.22, offsetX = 0, pulse = false, w, h }: { size?: number; top?: number; opacity?: number; offsetX?: number; pulse?: boolean; w?: number; h?: number }) {
  const th = useTh();
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!pulse) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const W = w ?? size, H = h ?? size;
  const [r, g, b] = th.glassRgb.split(",").map((x) => Number(x));
  const col = `rgb(${r},${g},${b})`;
  return (
    <Animated.View pointerEvents="none" style={{ position: "absolute", top, alignSelf: "center", marginLeft: offsetX, width: W, height: H,
      opacity: pulse ? a.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }) : 1,
      transform: [{ scale: pulse ? a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) : 1 }] }}>
      <Svg width={W} height={H}>
        <Defs>
          <RadialGradient id="g" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={col} stopOpacity={opacity} />
            <Stop offset="0.64" stopColor={col} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Path d={`M0 0H${W}V${H}H0z`} fill="url(#g)" />
      </Svg>
    </Animated.View>
  );
}

export function BottomFade({ height = 420, color }: { height?: number; color?: string }) {
  const th = useTh();
  const c = color ?? th.base;
  return <LinearGradient pointerEvents="none" colors={["rgba(0,0,0,0)", c, c]} locations={[0, 0.6, 1]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height }} />;
}

/* ─── Verre ─── */
export function Glass({ children, style, a = 0.14, b = 0.2, radius = 26 }: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; a?: number; b?: number; radius?: number }) {
  const th = useTh();
  // Verre exactement comme la maquette (identique Android / iPhone) :
  // fond rgba(blanc, a) + bord 1 px rgba(blanc, b) + reflet intérieur en haut + ombre douce.
  return (
    <View style={[{ borderRadius: radius, borderWidth: 1, borderColor: th.glass(b), backgroundColor: th.glassFill(a), boxShadow: th.glassFx }, style]}>
      {children}
    </View>
  );
}

/** Pastille sombre (var(--bn-ink)) avec icône claire. */
export function Ink({ size, icon, iconSize, radius, children, style }: { size: number; icon?: BimIconName; iconSize?: number; radius?: number; children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const th = useTh();
  return (
    <View style={[{ width: size, height: size, borderRadius: radius ?? size / 2, backgroundColor: th.ink, alignItems: "center", justifyContent: "center" }, style]}>
      {icon ? <BimIcon name={icon} size={iconSize ?? Math.round(size * 0.46)} color={th.onInk} strokeWidth={1.7} /> : children}
    </View>
  );
}

/* ─── Logo « B. » ─── */
/** Logo BIM NEXT : la vraie icône de l'app (bleu, cravate rouge) dans une tuile blanche arrondie. */
const APP_ICON = require("@/assets/images/icon.png");
export function BLogo({ size = 46 }: { size?: number; font?: number }) {
  const th = useTh();
  return (
    <View accessibilityLabel="BIM NEXT" style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", overflow: "hidden",
      borderWidth: 1, borderColor: th.glass(0.3), boxShadow: "0 8px 22px rgba(0,0,0,0.22)" }}>
      <Image source={APP_ICON} style={{ width: size * 0.92, height: size * 0.92 }} contentFit="contain" />
    </View>
  );
}

/* ─── Pressable qui rétrécit au toucher ─── */
const OUTER_KEYS = ["flex", "flexGrow", "flexShrink", "flexBasis", "alignSelf", "width", "minWidth", "maxWidth",
  "margin", "marginTop", "marginBottom", "marginLeft", "marginRight", "marginHorizontal", "marginVertical",
  "position", "top", "left", "right", "bottom", "zIndex"] as const;
function splitPressStyle(style?: StyleProp<ViewStyle>) {
  const flat: any = StyleSheet.flatten(style) || {};
  const outer: any = {}; const inner: any = {};
  Object.keys(flat).forEach((k) => { ((OUTER_KEYS as readonly string[]).includes(k) ? outer : inner)[k] = flat[k]; });
  // Le contenu remplit la zone tactile quand celle-ci est étirée.
  if (outer.flex != null || outer.flexGrow != null) inner.flexGrow = 1;
  if (outer.width != null || outer.flex != null || outer.flexGrow != null || outer.alignSelf === "stretch") inner.alignSelf = "stretch";
  return { outer, inner };
}

/** Bouton animé : s'enfonce à l'appui, rebondit au relâchement, avec vibration légère. */
export function PressScale({ children, onPress, style, disabled, accessibilityLabel, hitSlop, scaleTo = 0.94, haptic = true }: { children?: React.ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle>; disabled?: boolean; accessibilityLabel?: string; hitSlop?: number; scaleTo?: number; haptic?: boolean }) {
  const p = useRef(new Animated.Value(0)).current;
  const down = () => {
    if (haptic) tap();
    Animated.timing(p, { toValue: 1, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };
  const up = () => Animated.spring(p, { toValue: 0, friction: 4, tension: 180, useNativeDriver: true }).start();
  // Les styles de placement (flex, largeur, marges, position) vont sur la zone tactile :
  // sinon un bouton « flex: 1 » dans une rangée se tasse (puces de montant, etc.).
  const { outer, inner } = splitPressStyle(style);
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop} onPressIn={down} onPressOut={up} style={outer}>
      <Animated.View style={[inner, {
        transform: [{ scale: p.interpolate({ inputRange: [0, 1], outputRange: [1, scaleTo] }) }],
        opacity: disabled ? 0.5 : p.interpolate({ inputRange: [0, 1], outputRange: [1, 0.82] }),
      }]}>{children}</Animated.View>
    </Pressable>
  );
}

/* ─── Bouton rond ─── */
export function RoundButton({ icon, onPress, size = 46, variant = "glass", label, badge, disabled }: { icon: BimIconName; onPress?: () => void; size?: number; variant?: "glass" | "accent" | "ink"; label: string; badge?: number; disabled?: boolean }) {
  const th = useTh();
  const bg = variant === "accent" ? th.accent : variant === "ink" ? th.ink : th.glassFill(0.16);
  const fg = variant === "accent" ? th.onAccent : variant === "ink" ? th.onInk : th.fg;
  return (
    <PressScale onPress={onPress} disabled={disabled} accessibilityLabel={label}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center", backgroundColor: bg, borderWidth: variant === "glass" ? 1 : 0, borderColor: th.glass(0.2), boxShadow: variant === "glass" ? th.glassFx : undefined }}>
      <BimIcon name={icon} size={20} color={fg} />
      {!!badge && badge > 0 && (
        <View style={{ position: "absolute", top: -3, right: -3, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, backgroundColor: "#D61F2C", borderWidth: 2, borderColor: th.base, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: F.bold, fontSize: 10, color: "#FFF" }}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      )}
    </PressScale>
  );
}

/** En-tête : retour · titre · (droite). */
export function Header({ title, onBack, backLabel = "Retour", right, backVariant }: { title: React.ReactNode; onBack: () => void; backLabel?: string; right?: React.ReactNode; backVariant?: "glass" | "ink" }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <RoundButton icon="back" label={backLabel} onPress={onBack} variant={backVariant} />
      {typeof title === "string" ? <T w="bold" size={17} numberOfLines={1} style={{ flexShrink: 1, textAlign: "center" }}>{title}</T> : title}
      {right ?? <View style={{ width: 46 }} />}
    </View>
  );
}

/* ─── Chevrons ››› clignotants ─── */
export function Chevrons({ color, size = 14 }: { color?: string; size?: number }) {
  const th = useTh();
  const vals = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];
  useEffect(() => {
    const loops = vals.map((v, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 200),
      Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      Animated.delay((2 - i) * 200),
    ])));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, []);
  return (
    <View style={{ flexDirection: "row", gap: 3 }}>
      {vals.map((v, i) => <Animated.Text key={i} style={{ opacity: v, color: color ?? th.muted, fontSize: size, fontFamily: F.regular }}>›</Animated.Text>)}
    </View>
  );
}

/* ─── Bouton glissant (signature du design) ─── */
export function SlideButton({ label, onDone, variant = "glass", icon = "arrow", loading, disabled, style }: {
  label: string; onDone: () => void | Promise<any>; variant?: "glass" | "accent"; icon?: BimIconName; loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const th = useTh();
  const [w, setW] = useState(0);
  const p = useRef(new Animated.Value(0)).current;
  const nudge = useRef(new Animated.Value(0)).current;
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(1400),
      Animated.timing(nudge, { toValue: 1, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.timing(nudge, { toValue: 0, duration: 240, easing: Easing.in(Easing.quad), useNativeDriver: false }),
      Animated.delay(500),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const press = () => {
    if (busy.current || disabled || loading) return;
    busy.current = true;
    tap();
    nudge.stopAnimation(); nudge.setValue(0);
    Animated.timing(p, { toValue: 1, duration: 800, easing: Easing.bezier(0.65, 0, 0.25, 1), useNativeDriver: false })
      .start(({ finished }) => { if (finished) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); });
    setTimeout(async () => {
      try { await onDone(); } catch {} finally {
        setTimeout(() => {
          if (!mounted.current) return;
          Animated.timing(p, { toValue: 0, duration: 450, easing: Easing.bezier(0.65, 0, 0.25, 1), useNativeDriver: false })
            .start(() => { busy.current = false; });
        }, 500);
      }
    }, 1000);
  };

  const accent = variant === "accent";
  const knob = 46, pad = 7;
  const travel = Math.max(0, w - knob - pad * 2);
  const knobX = Animated.add(p.interpolate({ inputRange: [0, 1], outputRange: [0, travel] }), nudge.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }));
  const fillW = p.interpolate({ inputRange: [0, 1], outputRange: [60, Math.max(60, w)] });
  const labelOp = p.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 0, 0] });

  return (
    <Pressable onPress={press} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}
      onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
      style={[{ height: 60, borderRadius: 30, overflow: "hidden", justifyContent: "center",
        backgroundColor: accent ? th.accent : th.glass(0.16), borderWidth: accent ? 0 : 1, borderColor: th.glass(0.2), opacity: disabled ? 0.55 : 1 }, style]}>
      <Animated.View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: fillW, borderRadius: 30, backgroundColor: accent ? th.accentFill : th.glass(0.3) }} />
      <Animated.View style={{ position: "absolute", left: 76, right: 22, top: 0, bottom: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", opacity: labelOp }}>
        <T w={accent ? "bold" : "regular"} size={15} color={accent ? th.onAccent : th.fg} numberOfLines={1} style={{ flexShrink: 1 }}>{label}</T>
        <View style={{ opacity: accent ? 0.6 : 1 }}><Chevrons color={accent ? th.onAccent : th.muted} /></View>
      </Animated.View>
      <Animated.View style={{ position: "absolute", left: pad, width: knob, height: knob, borderRadius: knob / 2, backgroundColor: th.knob,
        alignItems: "center", justifyContent: "center", transform: [{ translateX: knobX }],
        boxShadow: "0 6px 14px rgba(0,0,0,0.35)" }}>
        {loading ? <ActivityIndicator color={th.onInk} size="small" /> : <BimIcon name={icon} size={18} color={th.onInk} strokeWidth={2} />}
      </Animated.View>
    </Pressable>
  );
}

/** Bouton plein (« Retour à l'accueil ») ou contour (« Nouveau transfert »). */
export function PillButton({ label, onPress, variant = "outline", icon, style, disabled }: { label: string; onPress: () => void; variant?: "outline" | "accent"; icon?: BimIconName; style?: StyleProp<ViewStyle>; disabled?: boolean }) {
  const th = useTh();
  const accent = variant === "accent";
  return (
    <PressScale onPress={onPress} disabled={disabled} accessibilityLabel={label}
      style={[{ height: accent ? 56 : 50, borderRadius: 28, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8,
        backgroundColor: accent ? th.accent : "transparent", borderWidth: accent ? 0 : 1, borderColor: th.glass(0.3) }, style]}>
      {icon && <BimIcon name={icon} size={18} color={accent ? th.onAccent : th.fg} />}
      <T w={accent ? "bold" : "regular"} size={15} color={accent ? th.onAccent : th.fg}>{label}</T>
    </PressScale>
  );
}

/* ─── Animations d'entrée ─── */
type Kind = "rise" | "fade" | "pop" | "page" | "left" | "right" | "up" | "drive";
export function Appear({ children, kind = "rise", delay = 0, duration, style }: { children?: React.ReactNode; kind?: Kind; delay?: number; duration?: number; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const d = duration ?? ({ rise: 800, fade: 800, pop: 900, page: 500, left: 1000, right: 1000, up: 1000, drive: 1100 } as const)[kind];
    Animated.timing(v, { toValue: 1, duration: d, delay, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }).start();
  }, []);
  const tr: any[] = [];
  if (kind === "rise") tr.push({ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) });
  if (kind === "page") tr.push({ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [70, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) });
  if (kind === "pop") tr.push({ scale: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 1.06, 1] }) }, { rotate: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: ["-8deg", "0deg", "0deg"] }) });
  if (kind === "left") tr.push({ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-110, 0] }) }, { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) });
  if (kind === "right") tr.push({ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [110, 0] }) }, { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) });
  if (kind === "up") tr.push({ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [90, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) });
  if (kind === "drive") tr.push({ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-260, 0] }) });
  return <Animated.View style={[style, { opacity: v, transform: tr }]}>{children}</Animated.View>;
}

export function Float({ children, amp = 8, duration = 5500, offset = 0, style }: { children?: React.ReactNode; amp?: number; duration?: number; offset?: number; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    const t = setTimeout(() => loop.start(), offset);
    return () => { clearTimeout(t); loop.stop(); };
  }, []);
  return <Animated.View style={[style, { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -amp] }) }] }]}>{children}</Animated.View>;
}

/** Respiration (bn-breath). */
export function Breath({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  return <Animated.View style={[style, { transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }] }]}>{children}</Animated.View>;
}

/** Va-et-vient horizontal (bn-swap). */
export function Swap({ children, amp = 6 }: { children?: React.ReactNode; amp?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  return <Animated.View style={{ transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, amp] }) }] }}>{children}</Animated.View>;
}

/** Anneau qui s'étend (bn-pulse) ou radar (bn-radar). */
export function Pulse({ size, color, radius, delay = 0, radar = false }: { size: number; color?: string; radius?: number; delay?: number; radar?: boolean }) {
  const th = useTh();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }));
    const t = setTimeout(() => loop.start(), delay);
    return () => { clearTimeout(t); loop.stop(); };
  }, []);
  return (
    <Animated.View pointerEvents="none" style={{ position: "absolute", width: size, height: size, borderRadius: radius ?? size / 2, borderWidth: radar ? 2 : 3, borderColor: color ?? th.glass(radar ? 0.7 : 0.55),
      opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: radar ? [0.4, 1.4] : [1, 1.4] }) }] }} />
  );
}

export function DrawLine({ delay = 2200, width = 60 }: { delay?: number; width?: number }) {
  const th = useTh();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 700, delay, easing: Easing.bezier(0.6, 0, 0.2, 1), useNativeDriver: true }).start(); }, []);
  return (
    <View style={{ width, height: 3, overflow: "hidden" }}>
      <Animated.View style={{ width, height: 3, borderRadius: 2, backgroundColor: th.fg, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) }] }} />
    </View>
  );
}

/** Ligne de scan qui monte et descend (bn-scan). */
export function ScanLine({ travel, inset = 14, top = 10 }: { travel: number; inset?: number; top?: number }) {
  const th = useTh();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);
  return (
    <Animated.View pointerEvents="none" style={{ position: "absolute", left: inset, right: inset, top, height: 3, borderRadius: 3, backgroundColor: th.accent,
      boxShadow: `0 0 12px ${th.accent}`,
      transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, travel] }) }] }} />
  );
}

/* ─── Divers ─── */
export function Steps({ total, active, width = 30 }: { total: number; active: number; width?: number }) {
  const th = useTh();
  return (
    <View style={{ flexDirection: "row", gap: 8 }} accessibilityLabel={`Étape ${active + 1} sur ${total}`}>
      {Array.from({ length: total }).map((_, i) => <View key={i} style={{ width, height: 3, borderRadius: 3, backgroundColor: i <= active ? th.fg : th.glass(0.35) }} />)}
    </View>
  );
}

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const th = useTh();
  return <T size={13} color={th.muted} style={[{ letterSpacing: 1 }, style]}>{children}</T>;
}

export function ProductArt({ uri, xml, size }: { uri?: string | null; xml: string; size: number }) {
  const [failed, setFailed] = useState(false);
  if (uri && !failed) return <Image source={{ uri }} style={{ width: size, height: size }} contentFit="contain" transition={200} onError={() => setFailed(true)} />;
  return <SvgXml xml={xml} width={size} height={size} />;
}

/** Sélecteur segmenté (EAU/GAZ/CARBURANT, USD/CDF). */
export function Segmented<K extends string>({ items, value, onChange, height = 44 }: { items: { key: K; label: string }[]; value: K; onChange: (k: K) => void; height?: number }) {
  const th = useTh();
  return (
    <View style={{ flexDirection: "row", gap: 6, padding: 5, borderRadius: 27, backgroundColor: th.glassFill(0.1), borderWidth: 1, borderColor: th.glass(0.18), boxShadow: th.glassFx }}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <PressScale key={it.key} onPress={() => onChange(it.key)} accessibilityLabel={it.label} style={{ flex: 1 }}>
            <View style={{ height, borderRadius: height / 2, alignItems: "center", justifyContent: "center", backgroundColor: on ? th.accent : "transparent" }}>
              <T w="bold" size={13} color={on ? th.onAccent : th.fg} numberOfLines={1}>{it.label}</T>
            </View>
          </PressScale>
        );
      })}
    </View>
  );
}

/** Puces de montant (5 · 10 · 20 · 50). */
export function AmountChips({ values, value, onPick }: { values: number[]; value: number; onPick: (n: number) => void }) {
  const th = useTh();
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {values.map((n) => {
        const on = n === value;
        return (
          <PressScale key={n} onPress={() => onPick(n)} accessibilityLabel={`${n}`} style={{ flex: 1 }}>
            <View style={{ height: 44, borderRadius: 22, borderWidth: 1, borderColor: th.glass(0.24), backgroundColor: on ? th.accent : th.glassFill(0.1), alignItems: "center", justifyContent: "center", boxShadow: th.glassFx }}>
              <T w="bold" size={15} color={on ? th.onAccent : th.fg}>{n}</T>
            </View>
          </PressScale>
        );
      })}
    </View>
  );
}

/** Choix avec point radio (moyens de paiement, opérateurs). */
export function RadioRow({ title, sub, on, onPress, lead, height = 52 }: { title: string; sub?: string; on: boolean; onPress: () => void; lead?: React.ReactNode; height?: number }) {
  const th = useTh();
  return (
    <PressScale onPress={onPress} accessibilityLabel={title}
      style={{ minHeight: height, borderRadius: height / 2, borderWidth: 1, borderColor: on ? th.fg : th.glass(0.2), backgroundColor: on ? th.glassFill(0.2) : th.glassFill(0.1),
        flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: lead ? 5 : 16, paddingRight: 16, boxShadow: th.glassFx }}>
      {lead}
      <View style={{ flex: 1 }}>
        <T w="bold" size={15}>{title}</T>
        {!!sub && <T size={12} color={th.muted}>{sub}</T>}
      </View>
      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: th.fg, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: on ? th.fg : "transparent" }} />
      </View>
    </PressScale>
  );
}

/* ─── Champs ─── */
type Country = (typeof AFRICA_COUNTRIES)[number];
export const DEFAULT_COUNTRY: Country = AFRICA_COUNTRIES.find((c) => c.code === "+243") ?? AFRICA_COUNTRIES[0];

function useInputStyle() {
  const th = useTh();
  return (focus: boolean, error?: boolean) => ({
    height: 56, paddingHorizontal: 18, borderRadius: 18, backgroundColor: th.glassFill(focus ? 0.18 : 0.12), borderWidth: 1,
    borderColor: error ? th.danger : focus ? th.fg : th.glass(0.24), color: th.fg, fontFamily: F.regular, fontSize: 16, boxShadow: th.glassFx,
  });
}

export function PhoneField({ id, label = "Numéro de téléphone", value, onChange, country, setCountry, error }: {
  id: string; label?: string; value: string; onChange: (v: string) => void; country: Country; setCountry: (c: Country) => void; error?: string | null;
}) {
  const th = useTh();
  const inputStyle = useInputStyle();
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  return (
    <View>
      <T size={13} color={th.muted} style={{ marginBottom: 8 }} nativeID={id}>{label}</T>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <PressScale onPress={() => setOpen(true)} accessibilityLabel={`Indicatif ${country.code}, changer de pays`}
          style={{ width: 78, height: 56, borderRadius: 18, backgroundColor: th.glassFill(0.12), borderWidth: 1, borderColor: th.glass(0.24), alignItems: "center", justifyContent: "center", boxShadow: th.glassFx }}>
          <T w="bold" size={16}>{country.code}</T>
        </PressScale>
        <TextInput accessibilityLabelledBy={id} accessibilityLabel={label} value={value}
          onChangeText={(t) => onChange(t.replace(/[^\d ]/g, "").replace(/^0+/, ""))}
          keyboardType="phone-pad" placeholder="81 234 5678" placeholderTextColor={th.glass(0.55)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} style={[inputStyle(focus, !!error), { flex: 1 }]} />
      </View>
      {!!error && <T size={13} color={th.danger} style={{ marginTop: 8 }}>{error}</T>}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={() => setOpen(false)} accessibilityLabel="Fermer" />
        <View style={{ maxHeight: "65%", backgroundColor: th.base, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 18, paddingHorizontal: 16 }}>
          <T w="bold" size={17} style={{ textAlign: "center", marginBottom: 12 }}>Choisir le pays</T>
          <FlatList data={AFRICA_COUNTRIES} keyExtractor={(c) => c.code + c.name} contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => { setCountry(item); setOpen(false); }} accessibilityRole="button"
                style={{ flexDirection: "row", alignItems: "center", gap: 12, height: 52, paddingHorizontal: 14, borderRadius: 16, marginBottom: 6, backgroundColor: item.code === country.code ? th.glass(0.2) : th.glass(0.08) }}>
                <T size={20}>{item.flag}</T>
                <T size={15} style={{ flex: 1 }}>{item.name}</T>
                <T w="bold" size={15}>{item.code}</T>
              </Pressable>
            )} />
        </View>
      </Modal>
    </View>
  );
}

export function TextField({ id, label, value, onChange, placeholder, secure, keyboardType, autoComplete, letterSpacing, icon, radius, hideLabel, autoFocus, maxLength }: {
  id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; secure?: boolean;
  keyboardType?: any; autoComplete?: any; letterSpacing?: number; icon?: BimIconName; radius?: number; hideLabel?: boolean; autoFocus?: boolean; maxLength?: number;
}) {
  const th = useTh();
  const inputStyle = useInputStyle();
  const [focus, setFocus] = useState(false);
  const [reveal, setReveal] = useState(false);
  const ref = useRef<any>(null);
  if (secure) {
    // Mot de passe : masquage par points fait maison (secureTextEntry + police Lato affiche le texte
    // en clair sur certains claviers Android) + œil pour afficher / masquer.
    return (
      <View>
        {!hideLabel && <T size={13} color={th.muted} style={{ marginBottom: 8 }} nativeID={id}>{label}</T>}
        <Pressable onPress={() => ref.current?.focus()} accessibilityLabel={label}
          style={[inputStyle(focus) as any, { flexDirection: "row", alignItems: "center", gap: 6 }, icon ? { paddingLeft: 48 } : null, radius ? { borderRadius: radius } : null]}>
          {icon && <View style={{ position: "absolute", left: 18 }}><BimIcon name={icon} size={18} color={th.muted} strokeWidth={2} /></View>}
          {value.length === 0 && !focus && <T size={16} color={th.glass(0.55)}>{placeholder ?? "••••••"}</T>}
          {value.length > 0 && (reveal
            ? <T size={16} style={{ letterSpacing: 0.5 }}>{value}</T>
            : Array.from({ length: Math.min(value.length, 24) }).map((_, i) => <View key={i} style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: th.fg }} />))}
          {focus && <BlinkingCursor color={th.fg} height={18} />}
          <View style={{ flex: 1 }} />
          <Pressable onPress={() => setReveal((r) => !r)} hitSlop={10} accessibilityLabel={reveal ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
            <BimIcon name={reveal ? "eyeOff" : "eye"} size={18} color={th.muted} />
          </Pressable>
          <TextInput ref={ref} value={value} onChangeText={onChange} autoFocus={autoFocus} maxLength={maxLength} keyboardType={keyboardType}
            autoCapitalize="none" autoCorrect={false} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} caretHidden
            style={{ position: "absolute", opacity: 0, width: 1, height: 1 }} />
        </Pressable>
      </View>
    );
  }
  return (
    <View>
      {!hideLabel && <T size={13} color={th.muted} style={{ marginBottom: 8 }} nativeID={id}>{label}</T>}
      <View>
        {icon && <View style={{ position: "absolute", left: 18, top: 19, zIndex: 1 }}><BimIcon name={icon} size={18} color={th.muted} strokeWidth={2} /></View>}
        <TextInput accessibilityLabelledBy={hideLabel ? undefined : id} accessibilityLabel={label}
          value={value} onChangeText={onChange} placeholder={placeholder} secureTextEntry={secure} autoFocus={autoFocus} maxLength={maxLength}
          keyboardType={keyboardType} autoComplete={autoComplete} autoCapitalize={autoComplete === "name" ? "words" : "none"}
          placeholderTextColor={th.glass(0.55)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={[inputStyle(focus), secure ? { fontSize: 18 } : null, letterSpacing ? { letterSpacing } : null,
            icon ? { paddingLeft: 48 } : null, radius ? { borderRadius: radius } : null]} />
      </View>
    </View>
  );
}

/* ─── Écran d'état : envoi en cours → validé (cercle + coche dessinés) ─── */
const ACircle = Animated.createAnimatedComponent(Circle);
const APath = Animated.createAnimatedComponent(Path);

export function StatusOverlay({ phase, title, text, children }: { phase: "proc" | "done"; title: string; text: string; children?: React.ReactNode }) {
  const th = useTh();
  const fade = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const drawC = useRef(new Animated.Value(327)).current;
  const drawK = useRef(new Animated.Value(80)).current;
  const burst = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start(); }, []);
  useEffect(() => {
    if (phase === "proc") {
      const l = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }));
      l.start(); return () => l.stop();
    }
    Animated.sequence([
      Animated.timing(drawC, { toValue: 0, duration: 700, easing: Easing.bezier(0.65, 0, 0.35, 1), useNativeDriver: false }),
    ]).start();
    Animated.timing(drawK, { toValue: 0, duration: 450, delay: 550, easing: Easing.bezier(0.65, 0, 0.35, 1), useNativeDriver: false }).start();
    Animated.timing(burst, { toValue: 1, duration: 900, delay: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [phase]);
  const done = phase === "done";
  return (
    <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: fade, zIndex: 50 }}>
      <BimBackground>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }} accessibilityLiveRegion="polite">
          <View style={{ width: 120, height: 120, alignItems: "center", justifyContent: "center" }}>
            {done && <Animated.View pointerEvents="none" style={{ position: "absolute", width: 160, height: 160, borderRadius: 80, borderWidth: 2, borderColor: th.accent,
              opacity: burst.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 0] }), transform: [{ scale: burst.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.5] }) }] }} />}
            <Svg width={120} height={120} viewBox="0 0 120 120" accessibilityLabel={title}>
              <Circle cx={60} cy={60} r={52} fill="none" stroke={th.glass(0.18)} strokeWidth={6} />
              {done && <ACircle cx={60} cy={60} r={52} fill="none" stroke={th.accent} strokeWidth={6} strokeLinecap="round" strokeDasharray="327" strokeDashoffset={drawC as any} transform="rotate(-90 60 60)" />}
              {done && <APath d="M38 62 L53 77 L84 45" fill="none" stroke={th.fg} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="80" strokeDashoffset={drawK as any} />}
            </Svg>
            {!done && (
              <Animated.View style={{ position: "absolute", transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }}>
                <Svg width={120} height={120} viewBox="0 0 120 120">
                  <Circle cx={60} cy={60} r={52} fill="none" stroke={th.accent} strokeWidth={6} strokeLinecap="round" strokeDasharray="90 240" />
                </Svg>
              </Animated.View>
            )}
          </View>
          <T w="bold" size={26} style={{ marginTop: 28, textAlign: "center" }}>{title}</T>
          <T size={15} color={th.muted} style={{ marginTop: 10, lineHeight: 23, textAlign: "center" }}>{text}</T>
          {done && <Appear kind="fade" delay={900} style={{ width: "100%", marginTop: 30, gap: 10 }}>{children}</Appear>}
        </View>
      </BimBackground>
    </Animated.View>
  );
}

/* ─── Ligne de menu (Profil, Réglages) ─── */
export function MenuRow({ icon, label, value, onPress, last, badge }: { icon: BimIconName; label: string; value?: string; onPress: () => void; last?: boolean; badge?: number }) {
  const th = useTh();
  return (
    <PressScale onPress={onPress} accessibilityLabel={label} scaleTo={0.97}
      style={{ height: 50, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, borderBottomWidth: last ? 0 : 1, borderBottomColor: th.glass(0.12) }}>
      <BimIcon name={icon} size={20} color={th.fg} />
      <T size={15} style={{ flex: 1 }}>{label}</T>
      {!!badge && badge > 0 && (
        <View style={{ minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: "#D61F2C", alignItems: "center", justifyContent: "center" }}>
          <T w="bold" size={11} color="#FFFFFF">{badge > 99 ? "99+" : badge}</T>
        </View>
      )}
      {value ? <T size={14} color={th.muted}>{value} ›</T> : <T size={16} color={th.muted}>›</T>}
    </PressScale>
  );
}


/* ─── Couleurs de l'app : les 7 thèmes (Profil et Réglages) ─── */
export function ThemeList() {
  const { th, setTheme } = useBim();
  return (
    <View style={{ marginTop: 8, gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel="Couleurs de l'app">
      {THEME_ORDER.map((id) => {
        const d = THEME_DEFS[id];
        const on = id === th.id;
        return (
          <PressScale key={id} onPress={() => setTheme(id)} accessibilityLabel={`Thème ${d.name}`} scaleTo={0.97}
            style={{ height: 58, borderRadius: 20, borderWidth: on ? 2 : 1, borderColor: on ? th.fg : th.glass(0.2), backgroundColor: on ? th.glassFill(0.2) : th.glassFill(0.08),
              flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, boxShadow: th.glassFx }}>
            <View style={{ flexDirection: "row" }}>
              {d.sw.map((c, i) => <View key={i} style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c, borderWidth: 2, borderColor: "rgba(127,127,127,0.5)", marginLeft: i ? -6 : 0 }} />)}
            </View>
            <View style={{ flex: 1 }}>
              <T w="bold" size={14}>{d.name}</T>
              <T size={12} color={th.muted} numberOfLines={1}>{d.note}</T>
            </View>
            <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: th.fg, alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: on ? th.fg : "transparent" }} />
            </View>
          </PressScale>
        );
      })}
    </View>
  );
}

/* ─── Cadre commun des pages (Réglages, aide, argent…) ─── */
export function BimPage({ title, backLabel = "Retour", onBack, right, children, scroll = true, refreshControl, padBottom = 40, overlay }: {
  title: string; backLabel?: string; onBack?: () => void; right?: React.ReactNode; children: React.ReactNode;
  scroll?: boolean; refreshControl?: React.ReactElement<any>; padBottom?: number; overlay?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as any)));
  const head = <Header title={title} backLabel={backLabel} onBack={back} right={right} />;
  return (
    <BimBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {scroll ? (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} refreshControl={refreshControl as any}
            contentContainerStyle={{ flexGrow: 1, paddingTop: 28 + insets.top, paddingHorizontal: 20, paddingBottom: padBottom + insets.bottom }}>
            {head}
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, paddingTop: 28 + insets.top, paddingHorizontal: 20 }}>
            {head}
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
      {overlay}
    </BimBackground>
  );
}

/** Grand titre de page en deux lignes (léger + gras), comme la maquette. */
export function PageTitle({ light, bold, text, style }: { light: string; bold: string; text?: string; style?: StyleProp<ViewStyle> }) {
  const th = useTh();
  return (
    <Appear kind="rise" delay={60} style={style}>
      <T style={{ marginTop: 22 }}><T w="light" size={30} style={{ lineHeight: 35 }}>{light}{"\n"}</T><T w="bold" size={30} style={{ lineHeight: 35 }}>{bold}</T></T>
      {!!text && <T size={15} color={th.muted} style={{ marginTop: 8, lineHeight: 22 }}>{text}</T>}
    </Appear>
  );
}

/** État vide / chargement / erreur. */
export function EmptyState({ icon = "info", title, text, loading, action }: { icon?: BimIconName; title: string; text?: string; loading?: boolean; action?: { label: string; onPress: () => void } }) {
  const th = useTh();
  return (
    <Appear kind="rise" style={{ alignItems: "center", marginTop: 50, gap: 12, paddingHorizontal: 10 }}>
      <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: th.glassFill(0.14), borderWidth: 1, borderColor: th.glass(0.24), alignItems: "center", justifyContent: "center", boxShadow: th.glassFx }}>
        {loading ? <ActivityIndicator color={th.fg} /> : <BimIcon name={icon} size={34} color={th.fg} strokeWidth={1.6} />}
      </View>
      <T w="bold" size={18} style={{ textAlign: "center" }}>{title}</T>
      {!!text && <T size={14} color={th.muted} style={{ textAlign: "center", lineHeight: 21 }}>{text}</T>}
      {action && <PillButton variant="accent" label={action.label} onPress={action.onPress} style={{ alignSelf: "stretch", marginTop: 10 }} />}
    </Appear>
  );
}

/** Ligne libellé / valeur (récapitulatifs, détails). */
export function InfoRow({ label, value, last, strong }: { label: string; value: React.ReactNode; last?: boolean; strong?: boolean }) {
  const th = useTh();
  return (
    <View style={{ minHeight: 46, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: th.glass(0.12) }}>
      <T size={14} color={th.muted}>{label}</T>
      {typeof value === "string" || typeof value === "number"
        ? <T w={strong ? "bold" : "regular"} size={14} style={{ flexShrink: 1, textAlign: "right" }}>{value}</T> : value}
    </View>
  );
}

/** Pastille de statut colorée. */
export function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, height: 24, borderRadius: 12, backgroundColor: color + "22", alignSelf: "flex-start" }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <T w="bold" size={11} color={color}>{label}</T>
    </View>
  );
}

/** Puces de filtre défilantes (Tout / Recharges / …). */
export function FilterChips<K extends string>({ items, value, onChange }: { items: { key: K; label: string }[]; value: K; onChange: (k: K) => void }) {
  const th = useTh();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <PressScale key={it.key} onPress={() => onChange(it.key)} accessibilityLabel={it.label} scaleTo={0.95}
            style={{ height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: th.glass(0.22), backgroundColor: on ? th.accent : th.glassFill(0.12), justifyContent: "center", boxShadow: on ? undefined : th.glassFx }}>
            <T w="bold" size={14} color={on ? th.onAccent : th.fg}>{it.label}</T>
          </PressScale>
        );
      })}
    </ScrollView>
  );
}

/** En-tête des espaces professionnels : icône BIM + badge de l'espace + titre. */
export function StaffHero({ icon, badge, title, text }: { icon: BimIconName; badge: string; title: string; text: string }) {
  const th = useTh();
  return (
    <Appear kind="pop" delay={60} style={{ alignItems: "center", marginTop: 26 }}>
      <View style={{ width: 96, height: 96, alignItems: "center", justifyContent: "center" }}>
        <BLogo size={88} />
        <View style={{ position: "absolute", right: -6, bottom: -6, width: 40, height: 40, borderRadius: 20, backgroundColor: th.action, borderWidth: 3, borderColor: th.base, alignItems: "center", justifyContent: "center" }}>
          <BimIcon name={icon} size={18} color="#FFFFFF" strokeWidth={2} />
        </View>
      </View>
      <View style={{ marginTop: 16, paddingHorizontal: 12, height: 26, borderRadius: 13, backgroundColor: th.glass(0.16), justifyContent: "center" }}>
        <T w="bold" size={11} style={{ letterSpacing: 1.2 }}>{badge.toUpperCase()}</T>
      </View>
      <T w="bold" size={26} style={{ marginTop: 10, textAlign: "center" }}>{title}</T>
      <T size={14} color={th.muted} style={{ marginTop: 6, textAlign: "center", lineHeight: 21, paddingHorizontal: 10 }}>{text}</T>
    </Appear>
  );
}
