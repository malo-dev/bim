import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/app/_layout";

const LIGHT = {
  bg:      "#F8F9FF",
  primary: "#0047FF",
  text:    "#1A1C1C",
  muted:   "#747688",
  input:   "#F4F6FF",
  border:  "#E8EDF5",
  white:   "#FFFFFF",
  green:   "#22C55E",
};
const DARK: typeof LIGHT = {
  bg:      "#0B1220",
  primary: "#4D8DFF",
  text:    "#EAF0FF",
  muted:   "#9FB0D0",
  input:   "#182033",
  border:  "#1F2A44",
  white:   "#FFFFFF",
  green:   "#22C55E",
};

const TERMS = [
  { id: 1, icon: "checkmark-circle-outline",   title: "Acceptation des termes",       body: "En utilisant l'application BIM, vous acceptez de respecter les termes et conditions décrits dans ce document. Cette acceptation est requise pour accéder à l'ensemble des fonctionnalités de la plateforme." },
  { id: 2, icon: "shield-checkmark-outline",    title: "Politique de confidentialité", body: "Vos données personnelles sont collectées et traitées conformément à notre politique de confidentialité. Nous ne partageons jamais vos informations sans votre consentement explicite et préalable." },
  { id: 3, icon: "phone-portrait-outline",      title: "Utilisation de l'application", body: "Vous vous engagez à utiliser l'application uniquement à des fins légales et conformément aux lois en vigueur. Toute utilisation abusive pourra entraîner la suspension ou la suppression de votre compte." },
  { id: 4, icon: "ribbon-outline",              title: "Propriété intellectuelle",     body: "Tous les contenus, logos et marques présents dans l'application sont la propriété de BIM ou de ses partenaires. Toute reproduction ou utilisation non autorisée est strictement interdite." },
  { id: 5, icon: "refresh-circle-outline",      title: "Modifications des termes",     body: "BIM se réserve le droit de modifier ces termes à tout moment. Les modifications seront effectives dès leur publication dans l'application. Nous vous encourageons à les consulter régulièrement." },
  { id: 6, icon: "alert-circle-outline",        title: "Limitation de responsabilité", body: "BIM ne pourra être tenu responsable des dommages directs ou indirects liés à l'utilisation de l'application, dans les limites permises par la législation applicable." },
  { id: 7, icon: "chatbubble-ellipses-outline", title: "Contact",                      body: "Pour toute question concernant ces termes et notre politique de confidentialité, veuillez nous contacter via la section Support de l'application. Notre équipe vous répondra dans les meilleurs délais." },
];

function TermItem({
  item, index, active, onToggle, isLast,
}: {
  item: typeof TERMS[number];
  index: number;
  active: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  const { isDark } = useAppTheme();
  const W = isDark ? DARK : LIGHT;
  const ti = useMemo(() => mkTi(W), [isDark]);
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(rotateAnim, { toValue: active ? 1 : 0, useNativeDriver: true }).start();
  }, [active]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
      <View style={[
        ti.wrap,
        !isLast && { borderBottomWidth: 1, borderBottomColor: W.border },
        active && { backgroundColor: "#EEF4FF" },
      ]}>
        <View style={ti.row}>
          <View style={[ti.iconWrap, { backgroundColor: active ? "#0047FF18" : W.input }]}>
            <Ionicons name={item.icon as any} size={16} color={active ? W.primary : W.muted} />
          </View>
          <Text style={[ti.num, { color: W.muted }]}>{String(index + 1).padStart(2, "0")}</Text>
          <Text style={[ti.title, { color: active ? W.primary : W.text }]} numberOfLines={active ? undefined : 1}>
            {item.title}
          </Text>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="chevron-down" size={16} color={active ? W.primary : W.muted} />
          </Animated.View>
        </View>

        {active && (
          <View style={ti.body}>
            <Text style={ti.bodyText}>{item.body}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function Terms() {
  const { isDark } = useAppTheme();
  const W = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(W), [isDark]);
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    LayoutAnimation.easeInEaseOut();
    setActiveIndex(activeIndex === i ? null : i);
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={W.bg} />

      <SafeAreaView style={s.safeTop} edges={["top"]}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={W.text} />
          </TouchableOpacity>
          <Text style={s.topTitle}>Termes & Politique</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroIconWrap}>
            <Ionicons name="document-text-outline" size={32} color={W.primary} />
          </View>
          <Text style={s.heroTitle}>{"Conditions d'utilisation"}</Text>
          <Text style={s.heroSub}>Dernière mise à jour : Janvier 2025</Text>

          {/* Bandeau stats */}
          <View style={s.statsBand}>
            <View style={s.statItem}>
              <Text style={s.statNum}>7</Text>
              <Text style={s.statLabel}>Articles</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statNum}>100%</Text>
              <Text style={s.statLabel}>Transparent</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statNum}>RGPD</Text>
              <Text style={s.statLabel}>Conforme</Text>
            </View>
          </View>
        </View>

        {/* Intro */}
        <View style={s.section}>
          <View style={s.infoBubble}>
            <View style={s.infoIcon}>
              <Ionicons name="information-circle-outline" size={16} color={W.primary} />
            </View>
            <Text style={s.infoText}>
              Merci de lire attentivement ces conditions avant d'utiliser BIM. En vous inscrivant, vous acceptez l'ensemble des termes ci-dessous.
            </Text>
          </View>
        </View>

        {/* Articles */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.dot} />
            <Text style={s.sectionLabel}>ARTICLES</Text>
          </View>
          <View style={s.card}>
            {TERMS.map((item, i) => (
              <TermItem
                key={item.id}
                item={item}
                index={i}
                active={activeIndex === i}
                onToggle={() => toggle(i)}
                isLast={i === TERMS.length - 1}
              />
            ))}
          </View>
        </View>

        {/* CTA Support */}
        <View style={s.section}>
          <TouchableOpacity style={s.ctaBtn} activeOpacity={0.85} onPress={() => router.push("/support")}>
            <View style={s.ctaIconWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={W.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.ctaTitle}>Une question ?</Text>
              <Text style={s.ctaSub}>Contactez notre support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        <Text style={s.version}>BIM NEXT · v1.0.0</Text>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

function mkS(W: typeof LIGHT) { return StyleSheet.create({
  screen:  { flex: 1, backgroundColor: W.bg },
  safeTop: { backgroundColor: W.bg },
  scroll:  { paddingBottom: 20 },

  topBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: W.white,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: W.border,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.06,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  topTitle: { fontFamily: "NexaBold", fontSize: 16, color: W.text },

  hero: {
    alignItems: "center",
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24,
  },
  heroIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: W.white,
    borderWidth: 2, borderColor: "#C8D8FF",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
    elevation: 6,
    shadowColor: W.primary, shadowOpacity: 0.15,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  heroTitle: { fontFamily: "NexaBold", fontSize: 20, color: W.text, textAlign: "center", marginBottom: 4 },
  heroSub:   { fontFamily: "NexaRegular", fontSize: 12, color: W.muted, textAlign: "center", marginBottom: 20 },

  statsBand: {
    flexDirection: "row",
    backgroundColor: W.white,
    borderRadius: 18, paddingVertical: 14,
    borderWidth: 1, borderColor: W.border,
    width: "100%",
    elevation: 3,
    shadowColor: W.primary, shadowOpacity: 0.08,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  statItem:    { flex: 1, alignItems: "center" },
  statNum:     { fontFamily: "NexaBold", fontSize: 16, color: W.primary },
  statLabel:   { fontFamily: "NexaRegular", fontSize: 10, color: W.muted, marginTop: 2, letterSpacing: 0.4 },
  statDivider: { width: 1, backgroundColor: W.border },

  section: { paddingHorizontal: 16, marginBottom: 14 },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, paddingLeft: 4 },
  dot:           { width: 4, height: 14, borderRadius: 2, backgroundColor: W.primary },
  sectionLabel:  { fontFamily: "NexaRegular", fontSize: 11, color: W.muted, letterSpacing: 1.2 },

  infoBubble: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: "#0047FF08", borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: "#0047FF15",
  },
  infoIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#0047FF12",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginTop: 1,
  },
  infoText: { flex: 1, fontFamily: "NexaRegular", fontSize: 12, color: W.muted, lineHeight: 18 },

  card: {
    backgroundColor: W.white, borderRadius: 20, overflow: "hidden",
    elevation: 4,
    shadowColor: W.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09, shadowRadius: 12,
  },

  ctaBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: W.primary, borderRadius: 18,
    padding: 16, gap: 14,
    elevation: 5,
    shadowColor: W.primary, shadowOpacity: 0.3,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  ctaIconWrap: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  ctaTitle: { fontFamily: "NexaBold", fontSize: 14, color: W.white },
  ctaSub:   { fontFamily: "NexaRegular", fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 },

  version: { textAlign: "center", fontFamily: "NexaRegular", fontSize: 11, color: W.muted, marginTop: 4 },
}); }

function mkTi(W: typeof LIGHT) { return StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 14 },
  row:  { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  num:   { fontFamily: "NexaRegular", fontSize: 10, color: "#AAB4C8", letterSpacing: 0.5, minWidth: 20 },
  title: { flex: 1, fontFamily: "NexaRegular", fontSize: 13, letterSpacing: 0.1 },
  body: {
    marginTop: 10, marginLeft: 42,
    borderRadius: 12, padding: 12,
    backgroundColor: "#F0F5FF",
    borderLeftWidth: 3, borderLeftColor: W.primary,
  },
  bodyText: { fontFamily: "NexaRegular", fontSize: 12, color: W.muted, lineHeight: 18 },
}); }
