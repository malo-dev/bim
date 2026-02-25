/* eslint-disable @typescript-eslint/no-unused-vars */
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  LayoutAnimation,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Rect,
  Circle,
  Path,
  Polygon,
} from "react-native-svg";

/* ═══════════════════════════════════════════════════════════════════════
   THEME — même pattern que Home / Support / Transfer
═══════════════════════════════════════════════════════════════════════ */
const C = {
  primary: "#0353CC",
  violet:  "#3906C7",
  deep:    "#302E99",
  accent:  "#4D96FF",
  gold:    "#C9A84C",
  white:   "#FFFFFF",
};

const TH = {
  light: {
    bg:           "#F4F6FB",
    card:         "#FFFFFF",
    text:         "#0D1B3E",
    muted:        "#7B8DB0",
    border:       "rgba(3,83,204,0.10)",
    inputBg:      "rgba(3,83,204,0.06)",
    introCardBg:  "rgba(3,83,204,0.06)",
    introBorder:  "rgba(3,83,204,0.10)",
    iconWrapBg:   "rgba(3,83,204,0.06)",
    bodyBg:       "rgba(3,83,204,0.05)",
    bodyBorder:   C.primary,
    labelColor:   "rgba(255,255,255,0.70)",
    headerGrad:   [C.deep, C.primary] as [string, string],
    shadow:       C.primary,
    cardShadow:   "#000",
    cardBorder:   "transparent",
    version:      "#7B8DB0",
  },
  dark: {
    bg:           "#07091A",
    card:         "#0F1228",
    text:         "#E2E8F0",
    muted:        "#556080",
    border:       "rgba(77,150,255,0.12)",
    inputBg:      "rgba(77,150,255,0.07)",
    introCardBg:  "rgba(77,150,255,0.07)",
    introBorder:  "rgba(77,150,255,0.14)",
    iconWrapBg:   "rgba(77,150,255,0.09)",
    bodyBg:       "rgba(77,150,255,0.07)",
    bodyBorder:   "#4D96FF",
    labelColor:   "#556080",
    headerGrad:   ["#05081A", "#0D1535"] as [string, string],
    shadow:       "#000",
    cardShadow:   "#000",
    cardBorder:   "rgba(77,150,255,0.12)",
    version:      "rgba(255,255,255,0.20)",
  },
};

function useTheme() {
  const isDark = useColorScheme() === "dark";
  return { isDark, t: isDark ? TH.dark : TH.light };
}

/* ═══════════════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════════════ */
const TERMS = [
  { id: 1, icon: "checkmark-circle-outline",      title: "Acceptation des termes",       body: "En utilisant l'application BIM, vous acceptez de respecter les termes et conditions décrits dans ce document. Cette acceptation est requise pour accéder à l'ensemble des fonctionnalités de la plateforme." },
  { id: 2, icon: "shield-checkmark-outline",       title: "Politique de confidentialité", body: "Vos données personnelles sont collectées et traitées conformément à notre politique de confidentialité. Nous ne partageons jamais vos informations sans votre consentement explicite et préalable." },
  { id: 3, icon: "phone-portrait-outline",         title: "Utilisation de l'application", body: "Vous vous engagez à utiliser l'application uniquement à des fins légales et conformément aux lois en vigueur. Toute utilisation abusive pourra entraîner la suspension ou la suppression de votre compte." },
  { id: 4, icon: "ribbon-outline",                 title: "Propriété intellectuelle",     body: "Tous les contenus, logos et marques présents dans l'application sont la propriété de BIM ou de ses partenaires. Toute reproduction ou utilisation non autorisée est strictement interdite." },
  { id: 5, icon: "refresh-circle-outline",         title: "Modifications des termes",     body: "BIM se réserve le droit de modifier ces termes à tout moment. Les modifications seront effectives dès leur publication dans l'application. Nous vous encourageons à les consulter régulièrement." },
  { id: 6, icon: "alert-circle-outline",           title: "Limitation de responsabilité", body: "BIM ne pourra être tenu responsable des dommages directs ou indirects liés à l'utilisation de l'application, dans les limites permises par la législation applicable." },
  { id: 7, icon: "chatbubble-ellipses-outline",    title: "Contact",                      body: "Pour toute question concernant ces termes et notre politique de confidentialité, veuillez nous contacter via la section Support de l'application. Notre équipe vous répondra dans les meilleurs délais." },
];

/* ═══════════════════════════════════════════════════════════════════════
   SVG — DocBadge (inchangé, couleurs fixes car sur fond gradient)
═══════════════════════════════════════════════════════════════════════ */
function DocBadge() {
  return (
    <Svg width={52} height={52} viewBox="0 0 48 48">
      <Defs>
        <SvgGradient id="docBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={C.deep} />
          <Stop offset="1" stopColor={C.violet} />
        </SvgGradient>
      </Defs>
      <Rect x={0} y={0} width={48} height={48} rx={16} fill="url(#docBg)" />
      <Rect x={13} y={8} width={22} height={28} rx={3} fill="rgba(255,255,255,0.15)" />
      <Rect x={13} y={8} width={22} height={28} rx={3} stroke={C.white} strokeWidth={1.5} fill="none" opacity={0.5} />
      <Path d="M28 8 L35 15 L28 15 Z" fill={C.white} opacity={0.25} />
      <Path d="M17 20h14M17 24h14M17 28h9" stroke={C.white} strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
      <Circle cx={34} cy={36} r={7} fill={C.gold} opacity={0.95} />
      <Polygon
        points="34,31 35.5,34.5 39,34.5 36.5,36.5 37.5,40 34,37.8 30.5,40 31.5,36.5 29,34.5 32.5,34.5"
        fill={C.white} opacity={0.9} scale={0.55} originX={34} originY={36}
      />
    </Svg>
  );
}

function DecoCircle({ size, opacity }: { size: number; opacity: number }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={C.white} opacity={opacity} />
    </Svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TERM ITEM (accordéon)
═══════════════════════════════════════════════════════════════════════ */
function TermItem({
  item, index, active, onToggle, isLast, t,
}: {
  item: typeof TERMS[number];
  index: number;
  active: boolean;
  onToggle: () => void;
  isLast: boolean;
  t: typeof TH.light;
}) {
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(rotateAnim, { toValue: active ? 1 : 0, useNativeDriver: true }).start();
  }, [active]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
      <View style={[
        ti.wrap,
        !isLast && { borderBottomWidth: 1, borderBottomColor: t.border },
        active && { backgroundColor: t.inputBg },
      ]}>
        {/* Header row */}
        <View style={ti.row}>
          <View style={[ti.iconWrap, { backgroundColor: active ? C.primary + "22" : t.iconWrapBg }]}>
            <Ionicons name={item.icon as any} size={16} color={active ? C.primary : t.muted} />
          </View>
          <View style={ti.numWrap}>
            <Text style={[ti.num, { color: t.muted }]}>{String(index + 1).padStart(2, "0")}</Text>
          </View>
          <Text style={[ti.title, { color: active ? C.primary : t.text }]} numberOfLines={active ? undefined : 1}>
            {item.title}
          </Text>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="chevron-down" size={16} color={active ? C.primary : t.muted} />
          </Animated.View>
        </View>

        {/* Body */}
        {active && (
          <View style={[ti.body, { backgroundColor: t.bodyBg, borderLeftColor: t.bodyBorder }]}>
            <Text style={[ti.bodyText, { color: t.muted }]}>{item.body}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION LABEL
   Light : fond clair → label muted  |  Dark : fond sombre → label muted
   (ici le SectionLabel est au-dessus de la card, pas dans le header)
═══════════════════════════════════════════════════════════════════════ */
function SectionLabel({ title, icon, t }: { title: string; icon: string; t: typeof TH.light }) {
  return (
    <View style={sl.row}>
      <Ionicons name={icon as any} size={14} color={t.muted} />
      <Text style={[sl.text, { color: t.muted }]}>{title}</Text>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════════════════════════════════════ */
export default function Terms() {
  const router = useRouter();
  const { isDark, t } = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    LayoutAnimation.easeInEaseOut();
    setActiveIndex(activeIndex === i ? null : i);
  };

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ══ HEADER ══ */}
        <View style={[s.header, { shadowColor: t.shadow }]}>
          <LinearGradient
            colors={t.headerGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ position: "absolute", top: -40, right: -40 }}>
            <DecoCircle size={200} opacity={0.06} />
          </View>
          <View style={{ position: "absolute", bottom: -30, left: -30 }}>
            <DecoCircle size={130} opacity={0.04} />
          </View>

          <SafeAreaView edges={["top"]} style={{ width: "100%" }}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={20} color={C.white} />
              </TouchableOpacity>
              <Text style={s.headerTitle}>Termes & Politique</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>

          {/* Hero */}
          <View style={s.hero}>
            <DocBadge />
            <Text style={s.heroTitle}>{"Conditions d'utilisation"} </Text>
            <Text style={s.heroSub}>Dernière mise à jour : Janvier 2025</Text>
          </View>

          {/* Bandeau stats */}
          <View style={s.summaryBand}>
            <View style={s.summaryItem}>
              <Text style={s.summaryNum}>7</Text>
              <Text style={s.summaryLabel}>Articles</Text>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryItem}>
              <Text style={s.summaryNum}>100%</Text>
              <Text style={s.summaryLabel}>Transparent</Text>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryItem}>
              <Text style={s.summaryNum}>RGPD</Text>
              <Text style={s.summaryLabel}>Conforme</Text>
            </View>
          </View>
        </View>

        {/* ══ INTRO ══ */}
        <View style={s.section}>
          <View style={[s.introCard, {
            backgroundColor: t.introCardBg,
            borderColor:     t.introBorder,
          }]}>
            <Ionicons name="information-circle-outline" size={18} color={C.primary} />
            <Text style={[s.introText, { color: t.muted }]}>
              {"Merci de lire attentivement ces conditions avant d'utiliser BIM. En vous inscrivant, vous acceptez l'ensemble des termes ci-dessous."}
            </Text>
          </View>
        </View>

        {/* ══ ARTICLES ══ */}
        <View style={s.section}>
          <SectionLabel title="Articles" icon="document-text-outline" t={t} />
          <View style={[s.card, {
            backgroundColor: t.card,
            borderColor:     t.cardBorder,
            borderWidth:     isDark ? 1 : 0,
            shadowColor:     t.cardShadow,
          }]}>
            {/* Shimmer top en dark */}
            {isDark && <View style={s.cardShimmer} />}
            {TERMS.map((item, i) => (
              <TermItem
                key={item.id}
                item={item}
                index={i}
                active={activeIndex === i}
                onToggle={() => toggle(i)}
                isLast={i === TERMS.length - 1}
                t={t}
              />
            ))}
          </View>
        </View>

        {/* ══ CTA SUPPORT ══ */}
        <View style={s.section}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/support")}>
            <LinearGradient
              colors={[C.deep, C.violet]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.ctaCard}
            >
              <View style={s.ctaIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={C.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.ctaTitle}>Une question ?</Text>
                <Text style={s.ctaSub}>Contactez notre support</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={[s.version, { color: t.version }]}>BIM NEXT · v1.0.0</Text>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════════════ */
const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingBottom: 20 },

  header: {
    overflow: "hidden",
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30, shadowRadius: 16,
    marginBottom: 20, paddingBottom: 20,
  },
  topBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 8,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  headerTitle: { color: C.white, fontSize: 17, fontFamily: "NexaLight", letterSpacing: 0.3 },

  hero: { alignItems: "center", paddingTop: 24, paddingBottom: 20 },
  heroTitle: { color: C.white, fontSize: 20, fontFamily: "NexaLight", letterSpacing: 0.5, marginTop: 14, marginBottom: 4 },
  heroSub:   { color: "rgba(255,255,255,0.6)", fontFamily: "NexaLight", fontSize: 11 },

  summaryBand: {
    flexDirection: "row", marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  summaryItem:    { flex: 1, alignItems: "center" },
  summaryNum:     { color: C.white, fontFamily: "NexaLight", fontSize: 16, letterSpacing: 0.5 },
  summaryLabel:   { color: "rgba(255,255,255,0.6)", fontFamily: "NexaLight", fontSize: 10, letterSpacing: 0.5, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)" },

  section: { paddingHorizontal: 16, marginBottom: 16 },

  introCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, padding: 14, borderWidth: 1 },
  introText: { flex: 1, fontFamily: "NexaLight", fontSize: 12, lineHeight: 18 },

  card: {
    borderRadius: 20, overflow: "hidden",
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  cardShimmer: {
    height: 1, backgroundColor: "rgba(255,255,255,0.06)",
  },

  ctaCard: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 18, padding: 16, gap: 14,
    elevation: 6,
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10,
  },
  ctaIcon: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  ctaTitle: { color: C.white, fontFamily: "NexaLight", fontSize: 14, letterSpacing: 0.3 },
  ctaSub:   { color: "rgba(255,255,255,0.65)", fontFamily: "NexaLight", fontSize: 11, marginTop: 2 },

  version: { textAlign: "center", fontFamily: "NexaLight", fontSize: 11, marginTop: 4 },
});

const ti = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 14 },
  row:  { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  numWrap:  { flexShrink: 0 },
  num:      { fontFamily: "NexaLight", fontSize: 10, letterSpacing: 0.5 },
  title:    { flex: 1, fontFamily: "NexaLight", fontSize: 13, letterSpacing: 0.2 },
  body: {
    marginTop: 10, marginLeft: 42,
    borderRadius: 12, padding: 12,
    borderLeftWidth: 3,
  },
  bodyText: { fontFamily: "NexaLight", fontSize: 12, lineHeight: 18 },
});

const sl = StyleSheet.create({
  row:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, paddingLeft: 4 },
  text: { fontFamily: "NexaLight", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 },
});