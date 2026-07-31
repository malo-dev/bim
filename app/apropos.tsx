import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import logoImg from "@/assets/images/logo.jpeg";
import React, { useMemo } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/app/_layout";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

/* ─── PALETTE ─────────────────────────────────────────────────────────── */
const LIGHT = {
  primary:    "#0035C5",
  violet:     "#3906C7",
  deep:       "#302E99",
  bg:         "#F9F9F9",
  surface:    "#FFFFFF",
  onSurface:  "#1A1C1C",
  secondary:  "#5C5E63",
  outlineVar: "#C4C5DA",
  outline:    "#747688",
  gold:       "#C9A84C",
  goldLight:  "#F0D080",
  green:      "#22C55E",
  white:      "#FFFFFF",
};
const DARK: typeof LIGHT = {
  primary:    "#4D8DFF",
  violet:     "#6B4FFF",
  deep:       "#302E99",
  bg:         "#0B1220",
  surface:    "#1A2540",
  onSurface:  "#EAF0FF",
  secondary:  "#9FB0D0",
  outlineVar: "rgba(31,42,68,0.80)",
  outline:    "#6B7A99",
  gold:       "#C9A84C",
  goldLight:  "#F0D080",
  green:      "#22C55E",
  white:      "#FFFFFF",
};

/* ─── DATA ────────────────────────────────────────────────────────────── */
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
  { name: "BARAKA KPAVURO JERRY",     role: "Co-fondateur de BIM NEXT",  detail: "Concepteur & visionnaire du projet BIM NEXT", initials: "BJ" },
  { name: "MUSHIO ATAULWA",           role: "Co-fondateur de BIM NEXT",  detail: "Responsable technique — BIM NEXT",            initials: "MA" },
  { name: "Félicien MAFUTALA",        role: "Directeur financier",       detail: "Pilier stratégique & financier",              initials: "FM" },
  { name: "David RAHARI RGAMBWA",     role: "Membre de l'équipe",        detail: "Membre opérationnel",   initials: "DR" },
  { name: "JOEL SIVASIMIRE KATEMBO",  role: "Livreur",                   detail: "Membre opérationnel",   initials: "JK" },
  { name: "Moïse LUPETE SADIKI",      role: "Logistique",                detail: "Membre opérationnel",   initials: "MS" },
  { name: "NEYMAR THEM'S MBIKAMBOLI", role: "Superviseur",               detail: "Membre opérationnel",   initials: "NM" },
];

const OFFICES = [
  { city: "Bunia",        icon: "business-outline" },
  { city: "Kinshasa",     icon: "business-outline" },
  { city: "Nord-Kivu",    icon: "business-outline" },
  { city: "Lubumbashi",   icon: "business-outline" },
];

const SOCIALS = [
  { icon: "logo-facebook", label: "Facebook", url: "https://www.facebook.com/share/17svZSm1Xo/" },
  { icon: "logo-twitter",  label: "Twitter",  url: "https://x.com/BIM_Officiel"                 },
  { icon: "logo-linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/business-investment-meeting/" },
];

/* ─── BIM LOGO SVG ────────────────────────────────────────────────────── */
function BimLogo({ size = 72 }: { size?: number }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72">
      <Defs>
        <SvgGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={C.deep} />
          <Stop offset="1" stopColor={C.violet} />
        </SvgGradient>
      </Defs>
      <Rect x={0} y={0} width={72} height={72} rx={22} fill="url(#lg)" />
      <Path d="M18 20h10c4 0 7 2 7 5.5S32 31 32 31c4 0 7 2.5 7 6S36 43 31 43H18V20z" fill={C.white} opacity={0.9} />
      <Rect x={42} y={20} width={5} height={23} rx={2.5} fill={C.gold} opacity={0.9} />
      <Path d="M50 43V20l7 12 7-12v23" stroke={C.white} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.85} />
      <Rect x={14} y={48} width={44} height={3} rx={1.5} fill={C.gold} opacity={0.5} />
    </Svg>
  );
}

/* ─── AVATAR INITIALES ────────────────────────────────────────────────── */
function Avatar({ initials }: { initials: string }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const av = useMemo(() => mkAv(C), [isDark]);
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
        <Circle cx={26} cy={21} r={8} fill={C.white} opacity={0.25} />
        <Path d="M10 46c0-10 7-16 16-16s16 6 16 16" fill={C.white} opacity={0.25} />
      </Svg>
      <View style={av.over}>
        <Text style={av.txt}>{initials}</Text>
      </View>
    </View>
  );
}

/* ─── SECTION LABEL ──────────────────────────────────────────────────── */
function SLabel({ icon, title }: { icon: string; title: string }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const sl = useMemo(() => mkSl(C), [isDark]);
  return (
    <View style={sl.row}>
      <Ionicons name={icon as any} size={14} color={C.primary} />
      <Text style={sl.text}>{title}</Text>
    </View>
  );
}

/* ─── CARD ────────────────────────────────────────────────────────────── */
function Card({ children }: { children: React.ReactNode }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const cd = useMemo(() => mkCd(C), [isDark]);
  return <View style={cd.card}>{children}</View>;
}

/* ─── MAIN ────────────────────────────────────────────────────────────── */
export default function Apropos() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const cd = useMemo(() => mkCd(C), [isDark]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openURL = async (url: string) => {
    if (await Linking.canOpenURL(url)) Linking.openURL(url);
  };

  const TOP_H = (Platform.OS === "ios" ? insets.top : StatusBar.currentHeight ?? 0) + 56;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.surface} />

      {/* ── FIXED TOP BAR ── */}
      <View style={[s.topBar, {
        paddingTop: Platform.OS === "ios" ? insets.top : (StatusBar.currentHeight ?? 0) + 8,
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.topBtn}>
          <Ionicons name="arrow-back" size={22} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={s.topTitle}>À propos de BIM</Text>
        <TouchableOpacity onPress={() => router.push("/notification")} style={s.topBtn}>
          <Ionicons name="notifications-outline" size={22} color={C.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingTop: TOP_H + 8 }]}
      >
        {/* ── HERO CARD ── */}
        <View style={s.section}>
          <View style={s.heroCard}>
            <Image source={logoImg} style={{ width: 110, height: 110 }} contentFit="contain" />
            <Text style={s.heroName}>Business Investment Meeting</Text>
            <Text style={s.heroTag}>Réseau d'affaires congolais · RDC</Text>
            <View style={s.foundedBadge}>
              <Ionicons name="calendar-outline" size={11} color={C.primary} />
              <Text style={s.foundedTxt}>Fondé en 2022</Text>
            </View>
          </View>
        </View>

        {/* ── STATS ── */}
        <View style={[s.section, { marginTop: -8 }]}>
          <View style={s.statsRow}>
            {STATS.map((st, i) => (
              <React.Fragment key={i}>
                <View style={s.statItem}>
                  <Text style={s.statVal}>{st.value}</Text>
                  <Text style={s.statLbl}>{st.label}</Text>
                </View>
                {i < STATS.length - 1 && <View style={s.statDiv} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── MISSION / VISION / VALEURS ── */}
        <View style={s.section}>
          <SLabel icon="information-circle-outline" title="QUI SOMMES-NOUS" />
          <Card>
            {PILIERS.map((p, i) => (
              <View key={i} style={[cd.row, i < PILIERS.length - 1 && cd.divider]}>
                <View style={cd.iconBox}>
                  <Ionicons name={p.icon as any} size={18} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={cd.rowTitle}>{p.title}</Text>
                  <Text style={cd.rowBody}>{p.body}</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>

        {/* ── ÉQUIPE ── */}
        <View style={s.section}>
          <SLabel icon="people-outline" title="NOTRE ÉQUIPE" />
          <Card>
            {TEAM.map((m, i) => (
              <View key={i} style={[cd.row, i < TEAM.length - 1 && cd.divider, { alignItems: "center" }]}>
                <Avatar initials={m.initials} />
                <View style={{ flex: 1 }}>
                  <Text style={cd.memberName}>{m.name}</Text>
                  <Text style={cd.memberRole}>{m.role}</Text>
                  <Text style={cd.memberDetail}>{m.detail}</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>

        {/* ── BUREAUX ── */}
        <View style={s.section}>
          <SLabel icon="location-outline" title="NOS BUREAUX" />
          <View style={s.officesGrid}>
            {OFFICES.map((o, i) => (
              <View key={i} style={s.officeCard}>
                <View style={s.officeIcon}>
                  <Ionicons name="business-outline" size={20} color={C.primary} />
                </View>
                <Text style={s.officeCity}>{o.city}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── CONTACT ── */}
        <View style={s.section}>
          <SLabel icon="share-social-outline" title="CONTACT & RÉSEAUX" />
          <Card>
            <TouchableOpacity style={[cd.row, cd.divider]} onPress={() => openURL("mailto:contact@bimreseau.com")}>
              <View style={[cd.iconBox, { backgroundColor: "rgba(0,53,197,0.08)" }]}>
                <Ionicons name="mail-outline" size={18} color={C.primary} />
              </View>
              <Text style={[cd.contactTxt, { flex: 1 }]}>contact@bimreseau.com</Text>
              <Ionicons name="open-outline" size={15} color={C.outline} />
            </TouchableOpacity>

            <TouchableOpacity style={[cd.row, cd.divider]} onPress={() => openURL("tel:+243861166469")}>
              <View style={[cd.iconBox, { backgroundColor: "rgba(34,197,94,0.08)" }]}>
                <Ionicons name="call-outline" size={18} color={C.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={cd.contactTxt}>+243 861 166 469</Text>
                <Text style={cd.contactSub}>Support BIM NEXT</Text>
              </View>
              <Ionicons name="open-outline" size={15} color={C.outline} />
            </TouchableOpacity>

            <TouchableOpacity style={cd.row} onPress={() => openURL("https://bimreseau.com/")}>
              <View style={[cd.iconBox, { backgroundColor: "rgba(0,53,197,0.08)" }]}>
                <Ionicons name="globe-outline" size={18} color={C.primary} />
              </View>
              <Text style={[cd.contactTxt, { flex: 1, color: C.primary, textDecorationLine: "underline" }]}>bimreseau.com</Text>
              <Ionicons name="open-outline" size={15} color={C.outline} />
            </TouchableOpacity>
          </Card>

          {/* Réseaux sociaux */}
          <View style={s.socialsRow}>
            {SOCIALS.map((soc, i) => (
              <TouchableOpacity key={i} style={s.socialBtn} onPress={() => openURL(soc.url)} activeOpacity={0.82}>
                <LinearGradient
                  colors={[C.deep, C.violet]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={s.socialGrad}
                >
                  <Ionicons name={soc.icon as any} size={20} color={C.white} />
                </LinearGradient>
                <Text style={s.socialLbl}>{soc.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── CTA REJOINDRE ── */}
        <View style={s.section}>
          <TouchableOpacity activeOpacity={0.88} onPress={() => openURL("https://bimreseau.com/")}>
            <LinearGradient
              colors={[C.deep, C.primary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.ctaCard}
            >
              <View style={s.ctaIcon}>
                <Ionicons name="globe-outline" size={22} color={C.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.ctaTitle}>Rejoindre le réseau BIM</Text>
                <Text style={s.ctaSub}>Visitez bimreseau.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>BIM NEXT · v1.0.0</Text>
        <View style={{ height: insets.bottom + 80 }} />
      </ScrollView>
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  /* top bar */
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: "rgba(196,197,218,0.18)",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12,
    elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  topBtn:  { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  topTitle:{ fontFamily: "NexaBold", fontSize: 17, color: C.onSurface },

  scroll: { paddingHorizontal: 16 },
  section: { marginBottom: 20 },

  /* hero card */
  heroCard: {
    borderRadius: 24, overflow: "hidden",
    alignItems: "center", paddingVertical: 28, paddingHorizontal: 20,
    backgroundColor: C.surface,
    elevation: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12,
    borderWidth: 1, borderColor: "rgba(196,197,218,0.20)",
  },
  heroName: { color: C.onSurface, fontFamily: "NexaBold", fontSize: 17, marginTop: 14, textAlign: "center", letterSpacing: 0.3 },
  heroTag:  { color: C.secondary, fontFamily: "NexaLight", fontSize: 12, marginTop: 4 },
  foundedBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,53,197,0.06)", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, marginTop: 12,
    borderWidth: 1, borderColor: "rgba(0,53,197,0.15)",
  },
  foundedTxt: { color: C.primary, fontFamily: "NexaLight", fontSize: 11, letterSpacing: 0.4 },

  /* stats */
  statsRow: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderRadius: 18, paddingVertical: 14,
    elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
    borderWidth: 1, borderColor: "rgba(196,197,218,0.15)",
  },
  statItem: { flex: 1, alignItems: "center" },
  statVal:  { fontFamily: "NexaBold", fontSize: 18, color: C.primary },
  statLbl:  { fontFamily: "NexaLight", fontSize: 10, color: C.secondary, marginTop: 2, letterSpacing: 0.4 },
  statDiv:  { width: 1, backgroundColor: C.outlineVar, opacity: 0.4 },

  /* offices grid */
  officesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  officeCard: {
    width: "47.5%", backgroundColor: C.surface,
    borderRadius: 16, padding: 16, alignItems: "center",
    elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6,
    borderWidth: 1, borderColor: "rgba(196,197,218,0.15)",
  },
  officeIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(0,53,197,0.06)",
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  officeCity: { fontFamily: "NexaBold", fontSize: 13, color: C.onSurface, textAlign: "center" },

  /* socials */
  socialsRow: { flexDirection: "row", justifyContent: "center", gap: 20, marginTop: 16 },
  socialBtn:  { alignItems: "center", gap: 6 },
  socialGrad: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    elevation: 4,
    shadowColor: C.violet, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6,
  },
  socialLbl: { fontFamily: "NexaLight", fontSize: 10, color: C.secondary, letterSpacing: 0.3 },

  /* cta */
  ctaCard: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 20, padding: 18, gap: 14,
    elevation: 6,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10,
  },
  ctaIcon:  { width: 46, height: 46, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  ctaTitle: { fontFamily: "NexaBold", fontSize: 15, color: C.white },
  ctaSub:   { fontFamily: "NexaLight", fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 },

  footer: {
    textAlign: "center", fontFamily: "NexaLight",
    fontSize: 10, color: "rgba(67,70,87,0.45)",
    textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8,
  },
}); }

/* ─── CARD INNER STYLES ───────────────────────────────────────────────── */
function mkCd(C: typeof LIGHT) { return StyleSheet.create({
  card: {
    backgroundColor: C.surface, borderRadius: 20, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(196,197,218,0.15)",
    elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8,
  },
  row:    { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  divider:{ borderBottomWidth: 1, borderBottomColor: "rgba(196,197,218,0.15)" },
  iconBox:{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(0,53,197,0.05)", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  rowTitle: { fontFamily: "NexaBold", fontSize: 14, color: C.onSurface, marginBottom: 3 },
  rowBody:  { fontFamily: "NexaLight", fontSize: 12, color: C.secondary, lineHeight: 18 },
  memberName:   { fontFamily: "NexaBold", fontSize: 13, color: C.onSurface },
  memberRole:   { fontFamily: "NexaLight", fontSize: 12, color: C.primary, marginTop: 2 },
  memberDetail: { fontFamily: "NexaLight", fontSize: 11, color: C.secondary, marginTop: 1 },
  contactTxt: { fontFamily: "NexaLight", fontSize: 13, color: C.onSurface },
  contactSub: { fontFamily: "NexaLight", fontSize: 10, color: C.secondary, marginTop: 2 },
}); }

/* ─── AVATAR STYLES ───────────────────────────────────────────────────── */
function mkAv(C: typeof LIGHT) { return StyleSheet.create({
  wrap: { width: 52, height: 52, position: "relative" },
  over: { position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" },
  txt:  { color: C.white, fontFamily: "NexaBold", fontSize: 15, letterSpacing: 1 },
}); }

/* ─── SECTION LABEL STYLES ────────────────────────────────────────────── */
function mkSl(C: typeof LIGHT) { return StyleSheet.create({
  row:  { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10 },
  text: { fontFamily: "NexaLight", fontSize: 10, color: C.outline, textTransform: "uppercase", letterSpacing: 1.5 },
}); }
