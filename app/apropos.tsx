/* eslint-disable @typescript-eslint/no-unused-vars */
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  Linking,
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
   THEME — même pattern que Home / Support / Terms
═══════════════════════════════════════════════════════════════════════ */
const C = {
  primary:   "#0353CC",
  violet:    "#3906C7",
  deep:      "#302E99",
  accent:    "#4D96FF",
  gold:      "#C9A84C",
  goldLight: "#F0D080",
  white:     "#FFFFFF",
  green:     "#22C55E",
};

const TH = {
  light: {
    bg:           "#F4F6FB",
    card:         "#FFFFFF",
    text:         "#0D1B3E",
    muted:        "#7B8DB0",
    border:       "rgba(3,83,204,0.10)",
    inputBg:      "rgba(3,83,204,0.06)",
    iconWrapBg:   "rgba(3,83,204,0.06)",
    mailIconBg:   "#EFF6FF",
    phoneIconBg:  "#F0FDF4",
    callBtnBg:    "rgba(3,83,204,0.06)",
    callBtnBord:  "rgba(3,83,204,0.10)",
    cardBorder:   "transparent",
    cardShadow:   "#000",
    headerGrad:   [C.deep, C.primary] as [string, string],
    shadow:       C.primary,
    version:      "#7B8DB0",
    officeShadow: "#000",
  },
  dark: {
    bg:           "#07091A",
    card:         "#0F1228",
    text:         "#E2E8F0",
    muted:        "#556080",
    border:       "rgba(77,150,255,0.12)",
    inputBg:      "rgba(77,150,255,0.07)",
    iconWrapBg:   "rgba(77,150,255,0.09)",
    mailIconBg:   "rgba(77,150,255,0.09)",
    phoneIconBg:  "rgba(34,197,94,0.10)",
    callBtnBg:    "rgba(77,150,255,0.08)",
    callBtnBord:  "rgba(77,150,255,0.15)",
    cardBorder:   "rgba(77,150,255,0.12)",
    cardShadow:   "#000",
    headerGrad:   ["#05081A", "#0D1535"] as [string, string],
    shadow:       "#000",
    version:      "rgba(255,255,255,0.20)",
    officeShadow: "#000",
  },
};

function useTheme() {
  const isDark = useColorScheme() === "dark";
  return { isDark, t: isDark ? TH.dark : TH.light };
}

/* ═══════════════════════════════════════════════════════════════════════
   DATA — numéros retirés, rôles corrigés
═══════════════════════════════════════════════════════════════════════ */
const STATS = [
  { value: "30+",  label: "Entreprises"   },
  { value: "200+", label: "Entrepreneurs" },
  { value: "10+",  label: "Organisations" },
  { value: "2022", label: "Fondé en"      },
];

const PILIERS = [
  { icon: "star-outline",      title: "Mission",      body: "Mettre en place un réseau d'affaires proactif où les souscripteurs boostent leurs activités grâce à des solutions innovantes." },
  { icon: "telescope-outline", title: "Vision 2030",  body: "Devenir le plus grand réseau d'affaires congolais, figurer dans le top 5 en Afrique et le top 20 mondial." },
  { icon: "diamond-outline",   title: "Nos valeurs",  body: "Professionnalisme, Excellence et Innovation — une équipe dynamique et enthousiasmée de servir ses partenaires." },
  { icon: "globe-outline",     title: "Notre réseau", body: "BIM est un réseau d'affaires congolais créé pour promouvoir le milieu des affaires congolais localement et mondialement." },
];

const TEAM = [
  {
    name:    "BARAKA KPAVURO JERRY",
    role:    "Fondateur — Leader réseau BIM",
    detail:  "Concepteur du projet BIM NEXT",
    avatar:  "BJ",
  },
  {
    name:    "Félicien Mafutala",
    role:    "Co-fondateur — Financier",
    detail:  "Pilier stratégique & financier",
    avatar:  "FM",
  },
  {
    name:    "MUSHIO ATAULWA",
    role:    "Leader réseau",
    detail:  "Développement & partenariats",
    avatar:  "MA",
  },
];

const SOCIALS = [
  { icon: "logo-facebook", label: "Facebook", url: "https://www.facebook.com/share/17svZSm1Xo/" },
  { icon: "logo-twitter",  label: "Twitter",  url: "https://x.com/BIM_Officiel"                 },
  { icon: "logo-linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/business-investment-meeting/" },
];

const OFFICES = [
  { city: "Bukavu",   code: "14235" },
  { city: "Kinshasa", code: "14235" },
];

const SUPPORT_PHONE = "+243 850 846 231";

/* ═══════════════════════════════════════════════════════════════════════
   SVG — BimLogo (couleurs fixes : sur fond gradient)
═══════════════════════════════════════════════════════════════════════ */
function BimLogo({ size = 72 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72">
      <Defs>
        <SvgGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={C.deep} />
          <Stop offset="1" stopColor={C.violet} />
        </SvgGradient>
      </Defs>
      <Rect x={0} y={0} width={72} height={72} rx={22} fill="url(#logoGrad)" />
      <Path d="M18 20h10c4 0 7 2 7 5.5S32 31 32 31c4 0 7 2.5 7 6S36 43 31 43H18V20z" fill={C.white} opacity={0.9} />
      <Rect x={42} y={20} width={5} height={23} rx={2.5} fill={C.gold} opacity={0.9} />
      <Path d="M50 43V20l7 12 7-12v23" stroke={C.white} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.85} />
      <Rect x={14} y={48} width={44} height={3} rx={1.5} fill={C.gold} opacity={0.5} />
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
   AVATAR — initiales sur fond gradient
═══════════════════════════════════════════════════════════════════════ */
function AvatarIcon({ initials }: { initials: string }) {
  return (
    <View style={av.wrap}>
      <Svg width={52} height={52} viewBox="0 0 52 52">
        <Defs>
          <SvgGradient id={`av${initials}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={C.deep} />
            <Stop offset="1" stopColor={C.primary} />
          </SvgGradient>
        </Defs>
        <Circle cx={26} cy={26} r={26} fill={`url(#av${initials})`} />
        <Circle cx={26} cy={21} r={8} fill={C.white} opacity={0.3} />
        <Path d="M10 46c0-10 7-16 16-16s16 6 16 16" fill={C.white} opacity={0.3} />
      </Svg>
      <View style={av.initialsWrap}>
        <Text style={av.initials}>{initials}</Text>
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION LABEL
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
   CARD WRAPPER
═══════════════════════════════════════════════════════════════════════ */
function Card({ children, t, style }: { children: React.ReactNode; t: typeof TH.light; style?: any }) {
  return (
    <View style={[
      s.card,
      {
        backgroundColor: t.card,
        borderColor:     t.cardBorder,
        borderWidth:     t.cardBorder === "transparent" ? 0 : 1,
        shadowColor:     t.cardShadow,
      },
      style,
    ]}>
      {children}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════════════════════════════════════ */
export default function Apropos() {
  const router = useRouter();
  const { isDark, t } = useTheme();

  const openURL = async (url: string) => {
    const ok = await Linking.canOpenURL(url);
    if (ok) Linking.openURL(url);
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
            <DecoCircle size={220} opacity={0.06} />
          </View>
          <View style={{ position: "absolute", bottom: -30, left: -30 }}>
            <DecoCircle size={140} opacity={0.04} />
          </View>
          <View style={{ position: "absolute", top: 60, left: 50, opacity: 0.05 }}>
            <DecoCircle size={80} opacity={1} />
          </View>

          <SafeAreaView edges={["top"]} style={{ width: "100%" }}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={20} color={C.white} />
              </TouchableOpacity>
              <Text style={s.headerTitle}>À propos de BIM</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>

          {/* Hero */}
          <View style={s.hero}>
            <BimLogo size={80} />
            <Text style={s.heroName}>Business Investment Meeting</Text>
            <Text style={s.heroTag}>{"Réseau d'affaires congolais"}</Text>
            <View style={s.foundedBadge}>
              <Ionicons name="calendar-outline" size={12} color={C.gold} />
              <Text style={s.foundedText}>Fondé en 2022 · RDC</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={s.statsBand}>
            {STATS.map((st, i) => (
              <React.Fragment key={i}>
                <View style={s.statItem}>
                  <Text style={s.statValue}>{st.value}</Text>
                  <Text style={s.statLabel}>{st.label}</Text>
                </View>
                {i < STATS.length - 1 && <View style={s.statDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ══ MISSION / VISION / VALEURS ══ */}
        <View style={s.section}>
          <SectionLabel title="Qui sommes-nous" icon="information-circle-outline" t={t} />
          <Card t={t}>
            {isDark && <View style={s.cardShimmer} />}
            {PILIERS.map((p, i) => (
              <View key={i} style={[
                s.pilierRow,
                i < PILIERS.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.border },
              ]}>
                <View style={[s.pilierIcon, { backgroundColor: t.iconWrapBg }]}>
                  <Ionicons name={p.icon as any} size={16} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.pilierTitle, { color: t.text }]}>{p.title}</Text>
                  <Text style={[s.pilierBody, { color: t.muted }]}>{p.body}</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>

        {/* ══ ÉQUIPE ══ */}
        <View style={s.section}>
          <SectionLabel title="Notre équipe" icon="people-outline" t={t} />
          <Card t={t}>
            {isDark && <View style={s.cardShimmer} />}
            {TEAM.map((m, i) => (
              <View key={i} style={[
                s.memberRow,
                i < TEAM.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.border },
              ]}>
                <AvatarIcon initials={m.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.memberName, { color: t.text }]}>{m.name}</Text>
                  <Text style={[s.memberRole, { color: C.primary }]}>{m.role}</Text>
                  <Text style={[s.memberDetail, { color: t.muted }]}>{m.detail}</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>

        {/* ══ BUREAUX ══ */}
        <View style={s.section}>
          <SectionLabel title="Nos bureaux" icon="location-outline" t={t} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            {OFFICES.map((o, i) => (
              <View key={i} style={[s.officeCard, {
                flex: 1,
                backgroundColor: t.card,
                borderColor:     t.cardBorder,
                borderWidth:     t.cardBorder === "transparent" ? 0 : 1,
                shadowColor:     t.officeShadow,
              }]}>
                <View style={[s.officeIcon, { backgroundColor: t.iconWrapBg }]}>
                  <Ionicons name="business-outline" size={18} color={C.primary} />
                </View>
                <Text style={[s.officeCity, { color: t.text }]}>{o.city}</Text>
                <Text style={[s.officeCode, { color: t.muted }]}>Code : {o.code}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ══ CONTACT & RÉSEAUX ══ */}
        <View style={s.section}>
          <SectionLabel title="Contact & Réseaux sociaux" icon="share-social-outline" t={t} />
          <Card t={t}>
            {isDark && <View style={s.cardShimmer} />}

            {/* Email */}
            <TouchableOpacity
              style={[s.contactRow, { borderBottomWidth: 1, borderBottomColor: t.border }]}
              onPress={() => openURL("mailto:contact@bimreseau.com")}
            >
              <View style={[s.pilierIcon, { backgroundColor: t.mailIconBg }]}>
                <Ionicons name="mail-outline" size={16} color={C.primary} />
              </View>
              <Text style={[s.contactText, { color: t.text }]}>contact@bimreseau.com</Text>
              <Ionicons name="open-outline" size={14} color={t.muted} />
            </TouchableOpacity>

            {/* Téléphone support */}
            <TouchableOpacity
              style={[s.contactRow, { borderBottomWidth: 1, borderBottomColor: t.border }]}
              onPress={() => openURL(`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`)}
            >
              <View style={[s.pilierIcon, { backgroundColor: t.phoneIconBg }]}>
                <Ionicons name="call-outline" size={16} color={C.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.contactText, { color: t.text }]}>{SUPPORT_PHONE}</Text>
                <Text style={[s.contactSub, { color: t.muted }]}>Support BIM NEXT</Text>
              </View>
              <Ionicons name="open-outline" size={14} color={t.muted} />
            </TouchableOpacity>

            {/* Site web */}
            <TouchableOpacity
              style={s.contactRow}
              onPress={() => openURL("https://bimreseau.com/")}
            >
              <View style={[s.pilierIcon, { backgroundColor: t.iconWrapBg }]}>
                <Ionicons name="globe-outline" size={16} color={C.primary} />
              </View>
              <Text style={[s.contactText, { color: C.primary, textDecorationLine: "underline" }]}>
                bimreseau.com
              </Text>
              <Ionicons name="open-outline" size={14} color={t.muted} />
            </TouchableOpacity>
          </Card>

          {/* Réseaux sociaux */}
          <View style={s.socialsRow}>
            {SOCIALS.map((soc, i) => (
              <TouchableOpacity key={i} style={s.socialBtn} onPress={() => openURL(soc.url)} activeOpacity={0.8}>
                <LinearGradient
                  colors={[C.deep, C.violet]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={s.socialGrad}
                >
                  <Ionicons name={soc.icon as any} size={18} color={C.white} />
                </LinearGradient>
                <Text style={[s.socialLabel, { color: t.muted }]}>{soc.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ══ CTA SITE WEB ══ */}
        <View style={s.section}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => openURL("https://bimreseau.com/")}>
            <LinearGradient
              colors={[C.gold, "#A07830"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.ctaCard}
            >
              <View style={s.ctaIcon}>
                <Ionicons name="globe-outline" size={20} color={C.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.ctaTitle}>Rejoindre le réseau BIM</Text>
                <Text style={s.ctaSub}>Visitez bimreseau.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
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
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" },
  headerTitle: { color: C.white, fontSize: 17, fontFamily: "NexaLight", letterSpacing: 0.3 },

  hero: { alignItems: "center", paddingTop: 28, paddingBottom: 20 },
  heroName: { color: C.white, fontSize: 18, fontFamily: "NexaLight", letterSpacing: 0.5, marginTop: 14, textAlign: "center" },
  heroTag:  { color: "rgba(255,255,255,0.65)", fontFamily: "NexaLight", fontSize: 12, marginTop: 4 },
  foundedBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10, borderWidth: 1, borderColor: "rgba(201,168,76,0.3)" },
  foundedText:  { color: C.goldLight, fontFamily: "NexaLight", fontSize: 11, letterSpacing: 0.4 },

  statsBand:   { flexDirection: "row", marginHorizontal: 20, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, paddingVertical: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  statItem:    { flex: 1, alignItems: "center" },
  statValue:   { color: C.white, fontFamily: "NexaLight", fontSize: 17, letterSpacing: 0.5 },
  statLabel:   { color: "rgba(255,255,255,0.6)", fontFamily: "NexaLight", fontSize: 10, marginTop: 2, letterSpacing: 0.4 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)" },

  section: { paddingHorizontal: 16, marginBottom: 16 },

  card: {
    borderRadius: 20, overflow: "hidden",
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  cardShimmer: { height: 1, backgroundColor: "rgba(255,255,255,0.06)" },

  pilierRow:   { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  pilierIcon:  { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  pilierTitle: { fontFamily: "NexaLight", fontSize: 14, letterSpacing: 0.2, marginBottom: 4 },
  pilierBody:  { fontFamily: "NexaLight", fontSize: 12, lineHeight: 18 },

  memberRow:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  memberName:   { fontFamily: "NexaLight", fontSize: 13, letterSpacing: 0.2 },
  memberRole:   { fontFamily: "NexaLight", fontSize: 12, marginTop: 2 },
  memberDetail: { fontFamily: "NexaLight", fontSize: 11, marginTop: 2 },

  officeCard: { borderRadius: 16, padding: 14, alignItems: "center", elevation: 2, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  officeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  officeCity: { fontFamily: "NexaLight", fontSize: 14, letterSpacing: 0.3 },
  officeCode: { fontFamily: "NexaLight", fontSize: 11, marginTop: 2 },

  contactRow:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  contactText: { flex: 1, fontFamily: "NexaLight", fontSize: 13 },
  contactSub:  { fontFamily: "NexaLight", fontSize: 10, marginTop: 2 },

  socialsRow: { flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 12 },
  socialBtn:  { alignItems: "center", gap: 5 },
  socialGrad: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", elevation: 4, shadowColor: C.violet, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 },
  socialLabel:{ fontFamily: "NexaLight", fontSize: 10, letterSpacing: 0.3 },

  ctaCard: { flexDirection: "row", alignItems: "center", borderRadius: 18, padding: 16, gap: 14, elevation: 6, shadowColor: C.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  ctaIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  ctaTitle:{ color: C.white, fontFamily: "NexaLight", fontSize: 14, letterSpacing: 0.3 },
  ctaSub:  { color: "rgba(255,255,255,0.7)", fontFamily: "NexaLight", fontSize: 11, marginTop: 2 },

  version: { textAlign: "center", fontFamily: "NexaLight", fontSize: 11, marginTop: 4 },
});

const av = StyleSheet.create({
  wrap:         { width: 52, height: 52, position: "relative" },
  initialsWrap: { position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" },
  initials:     { color: C.white, fontFamily: "NexaLight", fontSize: 15, letterSpacing: 1 },
});

const sl = StyleSheet.create({
  row:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, paddingLeft: 4 },
  text: { fontFamily: "NexaLight", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 },
});