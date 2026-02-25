import { slides } from "@/assets/mockdata/slidersOnboarding.mock";
import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useRef, useEffect } from "react";
import logo from "@/assets/images/logo.jpeg";
import  {Image} from 'expo-image'
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
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, Colors, FONTS } from "@/constants/theme";
import { PRIVACY_SECTIONS } from "@/assets/mockdata/privacyPolicy";

/* ─── Hook thème local ───────────────────────────────────────────────── */
function useTheme() {
  const scheme = useColorScheme();
  const isDark  = scheme === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

const { width, height } = Dimensions.get("window");

/* ─── PALETTE BRAND (constantes non thémées) ─────────────────────────── */
const B = {
  violet: "#3906C7",
  deep:   "#302E99",
  accent: "#4D96FF",
  gold:   "#FFD700",
};



/* ─── PRIVACY MODAL ──────────────────────────────────────────────────── */
function PrivacyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { isDark, t } = useTheme();

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={pm.overlay}>
        <View style={[pm.sheet, { backgroundColor: isDark ? t.card : "#F4F6FB" }]}>

          {/* Header gradient */}
          <LinearGradient
            colors={[t.gradientStart, t.gradientEnd]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={pm.header}
          >
            <View style={pm.headerRow}>
              <View style={pm.headerIcon}>
                <Ionicons name="shield-checkmark" size={20} color="#fff" />
              </View>
              <Text style={pm.headerTitle}>Politique de confidentialité</Text>
              <TouchableOpacity style={pm.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={pm.headerSub}>Dernière mise à jour : Mars 2026</Text>
          </LinearGradient>

          {/* Content */}
          <ScrollView
            style={pm.scroll}
            contentContainerStyle={pm.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[pm.intro, { color: t.textSecondary }]}>
              Chez BIMNEXT, la protection de vos données personnelles est une priorité absolue.
              Ce document explique comment nous collectons, utilisons et protégeons vos informations.
            </Text>

            {PRIVACY_SECTIONS.map((section, i) => (
              <View key={i} style={[pm.sectionCard, {
                backgroundColor: t.card,
                shadowColor: isDark ? "#000" : "#0D1B3E",
              }]}>
                <View style={pm.sectionHeader}>
                  <View style={[pm.sectionIcon, { backgroundColor: t.primary + "15" }]}>
                    <Ionicons name={section.icon as any} size={16} color={t.primary} />
                  </View>
                  <Text style={[pm.sectionTitle, { color: t.text }]}>{section.title}</Text>
                </View>
                <Text style={[pm.sectionBody, { color: t.textSecondary }]}>{section.body}</Text>
              </View>
            ))}

            <Text style={[pm.footer, { color: t.textSecondary }]}>
              Pour toute question : support@bim.app
            </Text>
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Bouton fermer */}
          <View style={[pm.btnWrap, {
            backgroundColor: isDark ? t.card : "#F4F6FB",
            borderTopColor: t.border,
          }]}>
            <TouchableOpacity
              style={[pm.closeFullBtn, { backgroundColor: t.primary }]}
              onPress={onClose}
            >
              <Text style={pm.closeFullText}>{"J'ai compris"} </Text>
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
    const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpac = useRef(new Animated.Value(0)).current;
   
  const floatY    = useRef(new Animated.Value(0)).current;
  const { isDark, t } = useTheme();
  const [checked,      setChecked]      = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };



   useEffect(() => {
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(logoOpac,  { toValue: 1, duration: 500, useNativeDriver: true })
      ]).start();
  
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatY, { toValue: -8, duration: 2500, useNativeDriver: true }),
          Animated.timing(floatY, { toValue: 0,  duration: 2500, useNativeDriver: true }),
        ])
      ).start();
    }, [floatY, logoOpac, logoScale]);

  const handleContinuer = () => {
    if (!checked) { shake(); return; }
    onAccept();
  };

  return (
    <View style={pg.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Background — brand en light, nuit profonde en dark */}
      <LinearGradient
        colors={
          isDark
            ? ["#060D1F", "#091528", "#0D1F3C"]
            : [t.gradientStart, t.gradientEnd, t.accent]
        }
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Cercles décoratifs — visibles en light ET dark */}
      <View style={[pg.deco1, {
        backgroundColor: isDark ? "rgba(77,150,255,0.10)" : "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: isDark ? "rgba(77,150,255,0.15)" : "rgba(255,255,255,0.08)",
      }]} />
      <View style={[pg.deco2, {
        backgroundColor: isDark ? "rgba(57,6,199,0.20)" : "rgba(255,255,255,0.04)",
      }]} />
      <View style={[pg.deco3, {
        backgroundColor: isDark ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.06)",
      }]} />
      {/* Cercle supplémentaire bas droite en dark */}
      {isDark && (
        <View style={{
          position: "absolute", width: 120, height: 120,
          borderRadius: 60, bottom: 180, right: -30,
          backgroundColor: "rgba(77,150,255,0.08)",
          borderWidth: 1, borderColor: "rgba(77,150,255,0.12)",
        }} />
      )}

      {/* Hero */}
      <View style={pg.hero}>
         <Animated.View
                    style={[
                      s.logoArea,
                      { opacity: logoOpac, transform: [{ scale: logoScale }, { translateY: floatY }] },
                    ]}
                  >
                    <View style={s.logoWrap}>
                      <Image source={logo} style={s.logo} contentFit="contain" />
                    </View>
        
                    {/* Barre accent tricolore — même pattern que sectorAccent du home */}
                    <View style={s.logoAccentBar}>
                      <View style={[s.logoAccentSeg, { backgroundColor: C.primary, flex: 2 }]} />
                      <View style={[s.logoAccentSeg, { backgroundColor: C.red,     flex: 1 }]} />
                      <View style={[s.logoAccentSeg, { backgroundColor: C.violet,  flex: 1 }]} />
                    </View>
                  </Animated.View>
    
       
        <Text style={pg.tagline}>Bienvenue dans un réseau digital où tout ce qui est réel devient numérique</Text>
      </View>

      {/* Card consentement */}
      <View style={[pg.card, {
        backgroundColor: t.card,
        shadowColor: isDark ? "#000" : t.gradientStart,
      }]}>
        <Text style={[pg.cardTitle, { color: t.text }]}>Avant de commencer</Text>
        <Text style={[pg.cardSub, { color: t.textSecondary }]}>
          {"Merci de lire et d'accepter notre politique de confidentialité pour utiliser BIM en toute sécurité."}
        </Text>

        {/* Bouton lire politique */}
        <TouchableOpacity
          style={[pg.policyBtn, {
            backgroundColor: isDark ? t.surface : t.primary + "0A",
            borderColor: t.border,
          }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.75}
        >
          <View style={[pg.policyBtnIcon, { backgroundColor: t.primary + "18" }]}>
            <Ionicons name="document-text-outline" size={16} color={t.primary} />
          </View>
          <Text style={[pg.policyBtnText, { color: t.text }]}>
            Lire la politique de confidentialité
          </Text>
          <Ionicons name="open-outline" size={14} color={t.textSecondary} />
        </TouchableOpacity>

        {/* Checkbox */}
        <Animated.View style={[pg.checkRow, { transform: [{ translateX: shakeAnim }] }]}>
          <TouchableOpacity
            style={[
              pg.checkbox,
              { borderColor: t.primary },
              checked && { backgroundColor: t.primary, borderColor: t.primary },
            ]}
            onPress={() => setChecked(!checked)}
            activeOpacity={0.75}
          >
            {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
          </TouchableOpacity>
          <Text style={[pg.checkLabel, { color: t.text }]}>
            {" J'ai lu et j'accepte la  "}
            <Text style={[pg.checkLabelLink, { color: t.primary }]}
              onPress={() => setModalVisible(true)}>
              politique de confidentialité
            </Text>{" "}
            {"et les conditions d'utilisation de BIM NEXT."}
          </Text>
        </Animated.View>

        {!checked && (
          <Text style={[pg.hintText, { color: t.danger }]}>
            ☝️ Veuillez cocher la case pour continuer
          </Text>
        )}

        <View style={{ height: 20 }} />

        <GradientButton
          title="Continuer"
          onPress={handleContinuer}
          leftIcon={<ArrowIcon width={18} height={12} color={B.violet} />}
          rightIcon={<ArrowRightIcon width={26} height={20} />}
        />
      </View>

      <Text style={pg.version}>BIM NEXT · v1.0.0</Text>

      <PrivacyModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

/* ─── VIDEO SLIDE ────────────────────────────────────────────────────── */
function VideoSlide({ source }: { source: any }) {
  const player = useVideoPlayer(source, (p) => {
    p.loop  = true;
    p.muted = true;
    p.play();
  });
  return <VideoView player={player} style={ob.media} contentFit="cover" />;
}

/* ─── IMAGE SLIDE ────────────────────────────────────────────────────── */
function ImageSlide({ source }: { source: any }) {
  return <Image source={source} style={ob.media} contentFit="cover" />;
}

/* ─── SLIDE ITEM ─────────────────────────────────────────────────────── */
function SlideItem({ item }: any) {
  const router     = useRouter();
  const { isDark, t } = useTheme();

  return (
    <View style={ob.slideContainer}>
      {item.type === "video"
        ? <VideoSlide source={item.source} />
        : <ImageSlide source={item.source} />
      }

      <LinearGradient
        colors={["rgba(21,97,204,0.15)", "rgba(21,97,204,0.45)", "rgba(3,83,204,0.85)"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[ob.bottomCard, {
        /* En dark mode, la card est légèrement plus sombre et plus opaque */
        backgroundColor: isDark ? "rgba(18,26,43,0.97)" : "rgba(255,255,255,0.96)",
        shadowColor: isDark ? "#000" : t.gradientStart,
      }]}>
        <View style={[ob.pill, { backgroundColor: isDark ? t.border : t.border }]} />

        <Text style={[ob.title, { color: t.text, fontFamily: FONTS.light }]}>
          {item.title}
        </Text>
        <Text style={[ob.description, { color: t.textSecondary, fontFamily: FONTS.light }]}>
          {item.description}
        </Text>

        <View style={{ height: 20 }} />

        <GradientButton
          title="Commencer"
          onPress={() => router.push("/login")}
          leftIcon={<ArrowIcon width={20} height={14} color={B.violet} />}
          rightIcon={<ArrowRightIcon width={30} height={24} />}
        />
      </View>
    </View>
  );
}

/* ─── ONBOARDING SLIDES ──────────────────────────────────────────────── */
function OnboardingSlides() {
  const [index, setIndex] = useState(0);
  const { t }             = useTheme();

  return (
    <View style={[{ flex: 1 }, { backgroundColor: t.gradientEnd }]}>
      <StatusBar translucent barStyle="light-content" />

      <FlatList
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(i);
        }}
        renderItem={({ item }) => <SlideItem item={item} />}
      />

      {/* Pagination */}
      <View style={ob.pagination}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[ob.dot, {
              width:           index === i ? 24 : 8,
              backgroundColor: index === i ? "#fff" : "rgba(255,255,255,0.35)",
            }]}
          />
        ))}
      </View>
    </View>
  );
}

/* ─── MAIN EXPORT ────────────────────────────────────────────────────── */
export default function Onboarding() {
  const [accepted, setAccepted] = useState(false);

  if (!accepted) return <PrivacyGate onAccept={() => setAccepted(true)} />;
  return <OnboardingSlides />;
}

/* ─── STYLES STATIQUES (formes, layout — pas les couleurs) ───────────── */
const pg = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  deco1: {
    position: "absolute", width: 260, height: 260,
    borderRadius: 130, backgroundColor: "rgba(255,255,255,0.06)",
    top: -80, right: -60,
  },
  deco2: {
    position: "absolute", width: 160, height: 160,
    borderRadius: 80, backgroundColor: "rgba(255,255,255,0.04)",
    bottom: 120, left: -50,
  },
  deco3: {
    position: "absolute", width: 80, height: 80,
    borderRadius: 40, backgroundColor: "rgba(255,255,255,0.06)",
    top: 180, left: 30,
  },

  hero: { alignItems: "center", marginBottom: 32 },
  logoWrap: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  appName: {
    color: "#fff", fontSize: 36,
    fontFamily: FONTS.light, letterSpacing: 6,
  },
  tagline: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13, fontFamily: FONTS.light,
    marginTop: 6, textAlign: "center",
    paddingHorizontal: 40,
  },

  card: {
    width: width - 32,
    borderRadius: 24,
    padding: 24,
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 20,
  },
  cardTitle: {
    fontFamily: FONTS.light,
    fontSize: 20,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  cardSub: {
    fontFamily: FONTS.light,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },

  policyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  policyBtnIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  policyBtnText: {
    flex: 1, fontFamily: FONTS.light,
    fontSize: 13,
  },

  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 4,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginTop: 1,
  },
  checkLabel: {
    flex: 1, fontFamily: FONTS.light,
    fontSize: 12, lineHeight: 18,
  },
  checkLabelLink: {
    textDecorationLine: "underline",
  },

  hintText: {
    fontFamily: FONTS.light,
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
  },

  version: {
    position: "absolute",
    bottom: 24,
    color: "rgba(255,255,255,0.35)",
    fontFamily: FONTS.light,
    fontSize: 11,
  },
});

const pm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(3,40,100,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: height * 0.88,
    flexDirection: "column",
  },

  header: {
    paddingTop: 24, paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6,
  },
  headerIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    flex: 1, color: "#fff",
    fontFamily: FONTS.light, fontSize: 16, letterSpacing: 0.3,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerSub: {
    color: "rgba(255,255,255,0.65)",
    fontFamily: FONTS.light, fontSize: 11,
  },

  scroll: { flex: 1, minHeight: 0 },
  scrollContent: { padding: 16 },

  intro: {
    fontFamily: FONTS.light,
    fontSize: 13, lineHeight: 20,
    marginBottom: 16, textAlign: "center",
  },

  sectionCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6,
  },
  sectionHeader: {
    flexDirection: "row", alignItems: "center",
    gap: 10, marginBottom: 8,
  },
  sectionIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  sectionTitle: {
    fontFamily: FONTS.light,
    fontSize: 14, letterSpacing: 0.2,
  },
  sectionBody: {
    fontFamily: FONTS.light,
    fontSize: 12, lineHeight: 18,
  },

  footer: {
    fontFamily: FONTS.light,
    fontSize: 11, textAlign: "center", marginTop: 8,
  },

  btnWrap: {
    padding: 16,
    borderTopWidth: 1,
  },
  closeFullBtn: {
    flexDirection: "row",
    alignItems: "center", justifyContent: "center",
    gap: 8,
    borderRadius: 16, paddingVertical: 14,
  },
  closeFullText: {
    color: "#fff", fontFamily: FONTS.light,
    fontSize: 14, letterSpacing: 0.3,
  },
});

const ob = StyleSheet.create({
  media: { width, height },
  slideContainer: { width, height },

  bottomCard: {
    position: "absolute",
    bottom: 48, left: 16, right: 16,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowOpacity: 0.2, shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },

  pill: {
    width: 36, height: 4, borderRadius: 2,
    marginBottom: 16,
  },

  title: {
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  description: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },

  pagination: {
    position: "absolute",
    bottom: 24,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    height: 8, borderRadius: 4,
    marginHorizontal: 4,
  },
});



const s = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: C.deep,
  },

  /* Cercles décoratifs */
  circle: {
    position: "absolute",
    borderRadius: 999,
  },
  circle1: {
    width: 320, height: 320,
    top: -140, right: -130,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  circle2: {
    width: 160, height: 160,
    top: 80, right: -40,
    backgroundColor: "rgba(220,3,2,0.12)",
  },
  circle3: {
    width: 200, height: 200,
    bottom: 160, left: -90,
    backgroundColor: "rgba(57,6,199,0.15)",
  },
  circle4: {
    width: 70, height: 70,
    top: height * 0.32, left: 24,
    backgroundColor: "rgba(77,150,255,0.13)",
  },

  /* Logo */
  logoArea: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 72 : 52,
    marginBottom: 22,
  },
  logoWrap: {
    width: 96, height: 96,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    elevation: 14,
    shadowColor: C.black,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  logo: {
    width: 78, height: 78,
  },
  logoAccentBar: {
    flexDirection: "row",
    width: 56, height: 3,
    borderRadius: 2,
    marginTop: 14,
    overflow: "hidden",
    gap: 2,
  },
  logoAccentSeg: {
    height: "100%",
    borderRadius: 2,
  },




});