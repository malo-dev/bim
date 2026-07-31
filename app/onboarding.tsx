import AsyncStorage from "@react-native-async-storage/async-storage";
import { slides } from "@/assets/mockdata/slidersOnboarding.mock";
import { useRouter } from "expo-router";
import React, { useState, useRef, useEffect, useMemo } from "react";
import logo from "@/assets/images/logo.jpeg";
import { Image } from "expo-image";
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FONTS } from "@/constants/theme";
import { PRIVACY_SECTIONS } from "@/assets/mockdata/privacyPolicy";
import { useAppTheme } from "@/app/_layout";

const { width, height } = Dimensions.get("window");

/* ─── PALETTES ───────────────────────────────────────────────────────── */
const LIGHT = {
  bg:           "#FFFFFF",
  slideBg:      "#F8F9FF",
  primary:      "#0047FF",
  primaryLight: "rgba(0,71,255,0.08)",
  glow:         "rgba(0,71,255,0.06)",
  text:         "#1A1C1C",
  textSub:      "#434657",
  textMuted:    "#747688",
  border:       "#E2E2E2",
  inputBg:      "#F8FAFE",
  chipBg:       "#FFFFFF",
  dotIdle:      "#C4C5DA",
  cardBg:       "#FFFFFF",
  cardElev:     6,
  cardBord:     "#E2E2E2",
};
const DARK: typeof LIGHT = {
  bg:           "#0B1220",
  slideBg:      "#0B1220",
  primary:      "#4D8DFF",
  primaryLight: "rgba(77,141,255,0.12)",
  glow:         "rgba(77,141,255,0.06)",
  text:         "#EAF0FF",
  textSub:      "#A3B4D0",
  textMuted:    "#6B7A99",
  border:       "rgba(31,42,68,0.80)",
  inputBg:      "#0F1A2E",
  chipBg:       "#1A2540",
  dotIdle:      "#2A3A5A",
  cardBg:       "#1A2540",
  cardElev:     0,
  cardBord:     "rgba(31,42,68,0.90)",
};

/* ─── PRIVACY MODAL ──────────────────────────────────────────────────── */
function PrivacyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const pm = useMemo(() => mkPm(C), [isDark]);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={pm.overlay}>
        <View style={pm.sheet}>
          <View style={pm.handle} />

          <View style={pm.headerRow}>
            <View style={pm.headerIcon}>
              <Ionicons name="shield-checkmark" size={17} color={C.primary} />
            </View>
            <Text style={pm.headerTitle}>Politique de confidentialité</Text>
            <TouchableOpacity style={pm.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={17} color={C.textSub} />
            </TouchableOpacity>
          </View>
          <Text style={pm.headerSub}>Dernière mise à jour : Mars 2026</Text>

          <ScrollView style={pm.scroll} contentContainerStyle={pm.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={pm.intro}>
              Chez BIM NEXT, la protection de vos données personnelles est une priorité absolue.
              Ce document explique comment nous collectons, utilisons et protégeons vos informations.
            </Text>

            {PRIVACY_SECTIONS.map((section, i) => (
              <View key={i} style={pm.sectionCard}>
                <View style={pm.sectionHeader}>
                  <View style={pm.sectionIcon}>
                    <Ionicons name={section.icon as any} size={14} color={C.primary} />
                  </View>
                  <Text style={pm.sectionTitle}>{section.title}</Text>
                </View>
                <Text style={pm.sectionBody}>{section.body}</Text>
              </View>
            ))}

            <Text style={pm.footer}>Pour toute question : support@bimreseau.com</Text>
            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={pm.btnWrap}>
            <TouchableOpacity style={pm.acceptBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={pm.acceptText}>J'ai compris</Text>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── PRIVACY GATE ───────────────────────────────────────────────────── */
function PrivacyGate({ onAccept }: { onAccept: () => void }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const pg = useMemo(() => mkPg(C), [isDark]);

  const floatY    = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpac  = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const [checked,      setChecked]      = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.timing(logoOpac,  { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -12, duration: 2800, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0,   duration: 2800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleContinuer = async () => {
    if (!checked) { shake(); return; }
    await AsyncStorage.setItem("privacyAcceptedAt", new Date().toISOString());
    onAccept();
  };

  return (
    <View style={pg.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.bg} />

      <View style={pg.blob1} />
      <View style={pg.blob2} />

      <View style={pg.hero}>
        <Animated.View style={{ opacity: logoOpac, transform: [{ scale: logoScale }, { translateY: floatY }], alignItems: "center" }}>
          <View style={pg.logoGlow} />
          <View style={pg.logoWrap}>
            <Image source={logo} style={pg.logo} contentFit="contain" />
          </View>
        </Animated.View>
        <Text style={pg.appName}>BIMNext</Text>
        <Text style={pg.tagline}>Votre écosystème financier digital au Congo</Text>
      </View>

      <View style={pg.card}>
        <Text style={pg.cardTitle}>Avant de commencer</Text>
        <Text style={pg.cardSub}>
          Lisez et acceptez notre politique de confidentialité pour utiliser BIM NEXT en toute sécurité.
        </Text>

        <TouchableOpacity style={pg.policyBtn} onPress={() => setModalVisible(true)} activeOpacity={0.75}>
          <View style={pg.policyIcon}>
            <Ionicons name="document-text-outline" size={15} color={C.primary} />
          </View>
          <Text style={pg.policyText}>Lire la politique de confidentialité</Text>
          <Ionicons name="open-outline" size={13} color={C.textMuted} />
        </TouchableOpacity>

        <Animated.View style={[pg.checkRow, { transform: [{ translateX: shakeAnim }] }]}>
          <TouchableOpacity style={[pg.checkbox, checked && pg.checkboxOn]} onPress={() => setChecked(!checked)} activeOpacity={0.75}>
            {checked && <Ionicons name="checkmark" size={13} color="#fff" />}
          </TouchableOpacity>
          <Text style={pg.checkLabel}>
            {"J'ai lu et j'accepte la "}
            <Text style={pg.checkLink} onPress={() => setModalVisible(true)}>
              politique de confidentialité
            </Text>
            {" et les conditions d'utilisation de BIM NEXT."}
          </Text>
        </Animated.View>

        {!checked && <Text style={pg.hintText}>Veuillez cocher la case pour continuer</Text>}

        <View style={{ height: 20 }} />

        <TouchableOpacity style={pg.btn} onPress={handleContinuer} activeOpacity={0.85}>
          <Text style={pg.btnText}>Continuer</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={pg.version}>BIM NEXT · v1.0.0</Text>
      <PrivacyModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const CHIPS = [
  { icon: "finger-print-outline",      label: "Biométrie" },
  { icon: "lock-closed-outline",       label: "Chiffrement" },
  { icon: "shield-checkmark-outline",  label: "Protection 2FA" },
  { icon: "checkmark-circle-outline",  label: "Garantie 100%" },
];

/* ─── ONBOARDING SLIDES ──────────────────────────────────────────────── */
function OnboardingSlides() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const ob = useMemo(() => mkOb(C), [isDark]);

  const router  = useRouter();
  const flatRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const floatY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -20, duration: 3000, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0,   duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const goNext = async () => {
    if (index < slides.length - 1) {
      flatRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      await AsyncStorage.setItem("onboardingDone", "true");
      router.replace("/login");
    }
  };

  const skip = async () => {
    await AsyncStorage.setItem("onboardingDone", "true");
    router.replace("/login");
  };

  const isLast = index === slides.length - 1;

  return (
    <View style={[ob.root, { backgroundColor: C.slideBg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.slideBg} />

      <FlatList
        ref={flatRef}
        data={slides}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        onMomentumScrollEnd={(e) => {
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item, index: i }) => (
          <View style={ob.slide}>
            <View style={ob.blob1} />
            <View style={ob.blob2} />

            <View style={ob.cardOuter}>
              <View style={ob.cardShadow} />
              <Animated.View style={[ob.card, { transform: [{ translateY: floatY }] }]}>
                <Image source={item.source} style={ob.img} contentFit="contain" />
              </Animated.View>
            </View>

            <View style={ob.textArea}>
              {i === 0 ? (
                <Text style={ob.slideTitle}>
                  {"Bienvenue sur "}
                  <Text style={{ color: C.primary }}>BIM NEXT</Text>
                </Text>
              ) : (
                <Text style={ob.slideTitle}>{item.title}</Text>
              )}
              <Text style={ob.slideDesc}>{item.description}</Text>

              {i === slides.length - 1 && (
                <View style={ob.chipsGrid}>
                  {CHIPS.map((c) => (
                    <View key={c.label} style={ob.chip}>
                      <Ionicons name={c.icon as any} size={16} color={C.primary} />
                      <Text style={ob.chipText}>{c.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      />

      <View style={ob.bottomBar}>
        <View style={ob.dotsRow}>
          {slides.map((_, i) => (
            <View key={i} style={[ob.dot, i === index ? ob.dotActive : ob.dotIdle]} />
          ))}
        </View>

        <TouchableOpacity style={ob.btn} onPress={goNext} activeOpacity={0.85}>
          <Text style={ob.btnText}>{isLast ? "Commencer" : "Suivant"}</Text>
          <Ionicons name={isLast ? "checkmark" : "chevron-forward"} size={20} color="#fff" />
        </TouchableOpacity>

        {isLast ? (
          <Text style={ob.termsText}>
            En continuant, vous acceptez nos{" "}
            <Text style={ob.termsLink} onPress={() => router.push("/terms" as any)} suppressHighlighting>
              Conditions d'Utilisation
            </Text>
          </Text>
        ) : (
          <TouchableOpacity onPress={skip} style={ob.skipBtn}>
            <Text style={ob.skipText}>Passer l'introduction</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/* ─── EXPORT PRINCIPAL ───────────────────────────────────────────────── */
export default function Onboarding() {
  const [accepted, setAccepted] = useState(false);
  if (!accepted) return <PrivacyGate onAccept={() => setAccepted(true)} />;
  return <OnboardingSlides />;
}

/* ─── STYLE FACTORIES ────────────────────────────────────────────────── */
function mkPg(C: typeof LIGHT) { return StyleSheet.create({
  root: {
    flex: 1, backgroundColor: C.bg,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 24,
  },
  blob1: { position: "absolute", width: 280, height: 280, borderRadius: 140, backgroundColor: C.glow, top: -80, right: -80 },
  blob2: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(0,71,255,0.04)", bottom: 110, left: -60 },

  hero: { alignItems: "center", marginBottom: 36 },
  logoGlow: { position: "absolute", width: 112, height: 112, borderRadius: 56, backgroundColor: C.primaryLight, top: -8, left: -8, zIndex: 0 },
  logoWrap: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: C.inputBg,
    borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", zIndex: 1,
    elevation: 4,
    shadowColor: C.primary, shadowOpacity: 0.15, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
  },
  logo: { width: 76, height: 76 },
  appName: { marginTop: 16, fontFamily: FONTS.bold, fontSize: 26, color: C.primary, letterSpacing: 1 },
  tagline: { fontFamily: FONTS.light, fontSize: 13, color: C.textSub, textAlign: "center", marginTop: 6, lineHeight: 20, paddingHorizontal: 16 },

  card: {
    width: "100%", backgroundColor: C.cardBg, borderRadius: 24, padding: 24,
    borderWidth: 1.5, borderColor: C.cardBord,
    elevation: C.cardElev,
    shadowColor: C.primary, shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
  },
  cardTitle: { fontFamily: FONTS.bold, fontSize: 18, color: C.text, textAlign: "center", marginBottom: 6 },
  cardSub:   { fontFamily: FONTS.light, fontSize: 13, color: C.textSub, textAlign: "center", lineHeight: 20, marginBottom: 18 },

  policyBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border,
    backgroundColor: C.inputBg, marginBottom: 16,
  },
  policyIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center" },
  policyText: { flex: 1, fontFamily: FONTS.light, fontSize: 13, color: C.text },

  checkRow:   { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 4 },
  checkbox:   { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },
  checkboxOn: { backgroundColor: C.primary, borderColor: C.primary },
  checkLabel: { flex: 1, fontFamily: FONTS.light, fontSize: 12, color: C.text, lineHeight: 18 },
  checkLink:  { color: C.primary, textDecorationLine: "underline" },
  hintText:   { fontFamily: FONTS.light, fontSize: 11, color: "#EF4444", textAlign: "center", marginTop: 6 },

  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.primary, borderRadius: 16, height: 58,
    elevation: 5, shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 5 },
  },
  btnText: { fontFamily: FONTS.bold, fontSize: 16, color: "#fff", letterSpacing: 0.3 },
  version: { position: "absolute", bottom: 20, fontFamily: FONTS.light, fontSize: 11, color: C.textMuted },
}); }

function mkPm(C: typeof LIGHT) { return StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet:   { backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, height: height * 0.88 },
  handle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginTop: 12, marginBottom: 4 },

  headerRow:  { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 },
  headerIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontFamily: FONTS.bold, fontSize: 16, color: C.text },
  closeBtn:   { width: 30, height: 30, borderRadius: 15, backgroundColor: C.border, alignItems: "center", justifyContent: "center" },
  headerSub:  { fontFamily: FONTS.light, fontSize: 11, color: C.textMuted, paddingHorizontal: 20, marginBottom: 8 },

  scroll:        { flex: 1 },
  scrollContent: { padding: 16 },
  intro: { fontFamily: FONTS.light, fontSize: 13, color: C.textSub, lineHeight: 20, marginBottom: 14, textAlign: "center" },

  sectionCard:   { backgroundColor: C.inputBg, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  sectionIcon:   { width: 28, height: 28, borderRadius: 8, backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center" },
  sectionTitle:  { fontFamily: FONTS.bold, fontSize: 13, color: C.text },
  sectionBody:   { fontFamily: FONTS.light, fontSize: 12, color: C.textSub, lineHeight: 18 },
  footer:        { fontFamily: FONTS.light, fontSize: 11, color: C.textMuted, textAlign: "center", marginTop: 8 },

  btnWrap:   { padding: 16, borderTopWidth: 1, borderTopColor: C.border },
  acceptBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.primary, borderRadius: 16, height: 54,
    elevation: 4, shadowColor: C.primary, shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  acceptText: { fontFamily: FONTS.bold, fontSize: 15, color: "#fff" },
}); }

function mkOb(C: typeof LIGHT) { return StyleSheet.create({
  root: { flex: 1 },
  slide: {
    width, flex: 1,
    backgroundColor: C.slideBg,
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 190,
  },

  blob1: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: C.glow, top: -60, right: -80 },
  blob2: { position: "absolute", width: 240, height: 240, borderRadius: 120, backgroundColor: "rgba(219,226,250,0.15)", bottom: 180, left: -80 },

  cardOuter:  { width: width * 0.78, height: width * 0.9, alignItems: "center", justifyContent: "center", marginBottom: 32, position: "relative" },
  cardShadow: {
    position: "absolute", width: "90%", height: "90%", borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.05)",
    transform: [{ rotate: "-3deg" }, { translateY: 12 }],
    elevation: 0,
    shadowColor: C.primary, shadowOpacity: 0.08, shadowRadius: 32, shadowOffset: { width: 0, height: 16 },
  },
  card: {
    width: "100%", height: "100%", borderRadius: 36, overflow: "hidden",
    backgroundColor: C.chipBg,
    elevation: 6, shadowColor: C.primary, shadowOpacity: 0.10, shadowRadius: 24, shadowOffset: { width: 0, height: 12 },
  },
  img: { width: "100%", height: "100%" },

  textArea:   { paddingHorizontal: 32, alignItems: "center", width: "100%" },
  slideTitle: { fontFamily: FONTS.bold, fontSize: 26, color: C.text, textAlign: "center", lineHeight: 34, marginBottom: 10 },
  slideDesc:  { fontFamily: FONTS.light, fontSize: 15, color: C.textSub, textAlign: "center", lineHeight: 23, maxWidth: 300 },

  chipsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16, justifyContent: "center" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.chipBg, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: C.border,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  chipText: { fontFamily: FONTS.light, fontSize: 12, color: C.textSub },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 16,
    backgroundColor: C.slideBg,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  dotsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginBottom: 16 },
  dot:      { height: 4, borderRadius: 2 },
  dotActive: { width: 32, backgroundColor: C.primary },
  dotIdle:   { width: 8,  backgroundColor: C.dotIdle },

  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.primary, borderRadius: 16, height: 60, marginBottom: 12,
    elevation: 5, shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 5 },
  },
  btnText: { fontFamily: FONTS.bold, fontSize: 16, color: "#fff", letterSpacing: 0.3 },

  skipBtn:  { alignItems: "center", paddingVertical: 6 },
  skipText: { fontFamily: FONTS.light, fontSize: 13, color: C.textMuted, letterSpacing: 0.5 },
  termsText: { fontFamily: FONTS.light, fontSize: 12, color: C.textMuted, textAlign: "center", lineHeight: 18 },
  termsLink: { color: C.primary, textDecorationLine: "underline" },
}); }
