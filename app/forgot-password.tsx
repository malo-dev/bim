import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C, Colors} from "@/constants/theme";
import logo from "@/assets/images/logo.jpeg";
import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { useAskPasswordResetMutation } from "@/services/authService";



/* ─── ÉTAPES — pattern sectionHeader du home ─────────────────────────── */
const STEPS = [
  { icon: "mail-outline",      key: "email"  },
  { icon: "keypad-outline",    key: "code"   },
  { icon: "lock-open-outline", key: "reset"  },
];

function Steps({ labels }: { labels: string[] }) {
  return (
    <View style={st.row}>
      {STEPS.map((step, i) => (
        <View key={step.key} style={st.stepWrap}>
          {/* line before */}
          {i > 0 && <View style={st.line} />}

          <View style={[st.iconCircle, i === 0 && st.iconCircleActive]}>
            <Ionicons
              name={step.icon as any}
              size={13}
              color={i === 0 ? C.white : C.muted}
            />
          </View>
          <Text style={[st.label, i === 0 && st.labelActive]}>{labels[i]}</Text>
        </View>
      ))}
    </View>
  );
}

/* ─── MAIN SCREEN ─────────────────────────────────────────────────────── */
export default function ForgotPasswordScreen() {
  const { t: tr } = useTranslation();
  function useTheme() {
    const scheme = useColorScheme();
    const isDark  = scheme === "dark";
    return { isDark, t: isDark ? Colors.dark : Colors.light };
  }
  const { isDark,t }             = useTheme();
  const router = useRouter();
  const [askPasswordReset, { isLoading }] = useAskPasswordResetMutation();

  const [email,   setEmail]   = useState("");
  const [focused, setFocused] = useState(false);

  /* ── Animations ── */
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(60)).current;
  const cardOpac  = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpac  = useRef(new Animated.Value(0)).current;
  const floatY    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(logoOpac,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: 0, duration: 600, delay: 200, useNativeDriver: true }),
      Animated.timing(cardOpac,  { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -8, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0,  duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, [cardOpac, cardSlide, floatY, logoOpac, logoScale]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 9,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const handleSend = async () => {
    if (!email) { shake(); return; }
    try {
      const response = await askPasswordReset({ email }).unwrap();
      if (response) {
        await AsyncStorage.setItem("userId", String(response.userId));
        router.push("/check-pwd");
      }
    } catch (err) {
      shake();
      const dataMess = err as any;
      Alert.alert(tr("common.error"), dataMess?.data?.error || tr("common.error"));
    }
  };

  return (
    <View style={[{ flex: 1 }, { backgroundColor: t.gradientEnd }]}>
      <StatusBar barStyle="light-content" />

      {/* Gradient — même que LoginScreen / HomeScreen loader */}
      <LinearGradient
        colors={
          isDark
            ? ["#060D1F", "#091528", "#0D1F3C"]
            : [t.gradientStart, t.gradientEnd, t.accent]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Cercles décoratifs — pattern home */}
      <View style={[s.circle, s.circle1]} />
      <View style={[s.circle, s.circle2]} />
      <View style={[s.circle, s.circle3]} />
      <View style={[s.circle, s.circle4]} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Logo flottant ── */}
          <Animated.View style={[s.logoArea, { opacity: logoOpac, transform: [{ scale: logoScale }, { translateY: floatY }] }]}>
            <View style={s.logoWrap}>
              <Image source={logo} style={s.logo} resizeMode="contain" />
            </View>
            {/* Barre accent tricolore — même sectorAccent pattern */}
            <View style={s.logoAccentBar}>
              <View style={[s.logoAccentSeg, { backgroundColor: C.primary, flex: 2 }]} />
              <View style={[s.logoAccentSeg, { backgroundColor: C.gold,    flex: 1 }]} />
              <View style={[s.logoAccentSeg, { backgroundColor: C.violet,  flex: 1 }]} />
            </View>

            <Text style={s.heroTitle}>{tr("auth.forgotTitle")}</Text>
            <Text style={s.heroSub}>
              {tr("auth.forgotSub")}
            </Text>
          </Animated.View>

          {/* ── Card ── */}
          <Animated.View style={[s.cardWrap, { opacity: cardOpac, transform: [{ translateY: cardSlide }, { translateX: shakeAnim }] }]}>

            {/* Section header — copie exacte du home */}
            <View style={s.sectionHeader}>
              <View style={[s.sectionDot, { backgroundColor: C.gold }]} />
              <Text style={s.sectionLabel}>{tr("auth.resetSection")}</Text>
            </View>

            {/* Étapes + icône mail */}
            <View style={s.stepsRow}>
              {/* Mail icon box — même iconCircle du home */}
              <View style={[s.mailIconBox, { backgroundColor: C.primary + "18" }]}>
                <Ionicons name="mail-outline" size={22} color={C.primary} />
                {/* Point doré — badge style home */}
                <View style={s.goldDot} />
              </View>
              <Steps labels={[tr("auth.emailStep"), tr("auth.codeStep"), tr("auth.resetStep")]} />
            </View>

            {/* Séparateur */}
            <View style={s.sep} />

            {/* Label */}
            <Text style={s.label}>{tr("auth.email")}</Text>

            {/* Input row — même style LoginScreen / RegisterScreen */}
            <View style={[s.inputRow, focused && s.inputFocused]}>
              <View style={[s.iconCircle, { backgroundColor: focused ? C.primary + "18" : C.f4 }]}>
                <Ionicons name="mail-outline" size={17} color={focused ? C.primary : C.muted} />
              </View>
              <TextInput
                style={s.input}
                placeholder={tr("auth.emailPH")}
                placeholderTextColor={C.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
              {email.length > 0 && (
                <TouchableOpacity onPress={() => setEmail("")} style={{ marginRight: 12 }}>
                  <Ionicons name="close-circle" size={18} color={C.muted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Info bulle — même chip style dividerBadge */}
            <View style={s.infoBubble}>
              <View style={[s.iconCircle, { backgroundColor: C.primary + "12", width: 32, height: 32, borderRadius: 16 }]}>
                <Ionicons name="information-circle-outline" size={15} color={C.primary} />
              </View>
              <Text style={s.infoText}>
                {tr("auth.emailCodeHint")}
              </Text>
            </View>

            {/* CTA */}
            <View style={{ marginTop: 22 }}>
              <GradientButton
                isLoad={isLoading}
                title={tr("auth.sendCode")}
                onPress={handleSend}
                leftIcon={<ArrowIcon width={18} height={12} />}
                rightIcon={<ArrowRightIcon width={26} height={20} />}
              />
            </View>

            {/* Retour — même loginBtn du RegisterScreen */}
            <TouchableOpacity style={s.backBtn} onPress={() => router.push("/login")} activeOpacity={0.85}>
              <View style={[s.iconCircle, { backgroundColor: C.f4, width: 36, height: 36, borderRadius: 18 }]}>
                <FontAwesome6 name="arrow-left" size={13} color={C.muted} />
              </View>
              <Text style={s.backText}>{tr("auth.backToLogin")}</Text>
            </TouchableOpacity>

          </Animated.View>

          {/* Version */}
          <Text style={s.version}>BIM NEXT · v1.0.0</Text>
          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

ForgotPasswordScreen.options = { headerShown: false };

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: C.deep },

  /* Cercles décoratifs */
  circle: { position: "absolute", borderRadius: 999 },
  circle1: {
    width: 300, height: 300, top: -130, right: -120,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
  },
  circle2: {
    width: 140, height: 140, top: 100, right: -40,
    backgroundColor: "rgba(255,215,0,0.08)",
  },
  circle3: {
    width: 190, height: 190, bottom: 140, left: -80,
    backgroundColor: "rgba(57,6,199,0.13)",
  },
  circle4: {
    width: 65, height: 65, top: "35%", left: 20,
    backgroundColor: "rgba(77,150,255,0.1)",
  },

  /* Logo */
  logoArea: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 65 : 46,
    marginBottom: 22,
  },
  logoWrap: {
    width: 90, height: 90, borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", elevation: 14,
    shadowColor: C.black, shadowOpacity: 0.3,
    shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
  },
  logo: { width: 74, height: 74 },
  logoAccentBar: {
    flexDirection: "row", width: 56, height: 3,
    borderRadius: 2, marginTop: 12, overflow: "hidden", gap: 2,
  },
  logoAccentSeg: { height: "100%", borderRadius: 2 },
  heroTitle: {
    color: C.white, fontFamily: "NexaLight",
    fontSize: 20, letterSpacing: 0.3,
    textAlign: "center", marginTop: 16, marginBottom: 7,
  },
  heroSub: {
    color: "rgba(255,255,255,0.6)",
    fontFamily: "NexaLight", fontSize: 13,
    textAlign: "center", lineHeight: 20,
    paddingHorizontal: 24,
  },

  /* Card */
  cardWrap: {
    backgroundColor: C.white,
    borderRadius: 28, padding: 22,
    elevation: 10,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 20,
  },

  /* Section header — home pattern */
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionDot:   { width: 4, height: 16, borderRadius: 2 },
  sectionLabel: {
    fontFamily: "NexaLight", fontSize: 11,
    color: C.muted, letterSpacing: 1.2, textTransform: "uppercase",
  },

  /* Steps row */
  stepsRow: {
    flexDirection: "row", alignItems: "center",
    marginBottom: 20, gap: 12,
  },

  /* Mail icon box */
  mailIconBox: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  goldDot: {
    position: "absolute", top: 6, right: 6,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.gold,
    borderWidth: 1.5, borderColor: C.white,
  },

  sep: { height: 1, backgroundColor: "#E8EDF5", marginBottom: 20 },

  label: {
    fontFamily: "NexaLight", fontSize: 11, color: C.muted,
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8,
  },

  /* Input — même pattern Login/Register */
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#E8EDF5",
    borderRadius: 18, height: 54,
    backgroundColor: C.f4, overflow: "hidden",
    paddingRight: 4,
  },
  inputFocused: { borderColor: C.primary, backgroundColor: "#EEF4FF" },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center",
    marginHorizontal: 6,
  },
  input: {
    flex: 1, height: "100%",
    fontSize: 14, color: C.text, fontFamily: "NexaLight",
  },

  /* Info bulle */
  infoBubble: {
    flexDirection: "row", alignItems: "center",
    gap: 10, marginTop: 12,
    backgroundColor: C.primary + "08",
    borderRadius: 14, padding: 10,
    borderWidth: 1, borderColor: C.primary + "15",
  },
  infoText: {
    flex: 1, fontFamily: "NexaLight",
    fontSize: 12, color: C.muted, lineHeight: 17,
  },

  /* Back btn */
  backBtn: {
    flexDirection: "row", alignItems: "center",
    gap: 10, marginTop: 18,
    backgroundColor: C.f4, borderRadius: 18,
    paddingVertical: 12, paddingHorizontal: 14,
  },
  backText: {
    fontFamily: "NexaLight", fontSize: 13,
    color: C.muted, flex: 1,
  },

  version: {
    textAlign: "center", fontFamily: "NexaLight",
    fontSize: 11, color: "rgba(255,255,255,0.28)",
    marginTop: 22,
  },
});

/* ─── Steps styles — pattern sectionHeader du home ───────────────────── */
const st = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "flex-start",
    flex: 1, gap: 4,
  },
  stepWrap: {
    alignItems: "center", flex: 1,
    position: "relative",
  },
  line: {
    position: "absolute",
    top: 15, right: "50%",
    width: "100%", height: 1,
    backgroundColor: "#E8EDF5",
    zIndex: -1,
  },
  iconCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.f4,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#E8EDF5",
  },
  iconCircleActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  label: {
    fontFamily: "NexaLight", fontSize: 10,
    color: C.muted, marginTop: 5, letterSpacing: 0.3,
  },
  labelActive: { color: C.primary },
});