import { useTranslation } from "react-i18next";
import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
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
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useAskPasswordResetMutation, useVerifyOtpMutation } from "@/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ─── PALETTE identique au HomeScreen ──────────────────────────────── */
const C = {
  primary: "#0353CC",
  red:     "#DC0302",
  violet:  "#3906C7",
  deep:    "#302E99",
  accent:  "#4D96FF",
  gold:    "#FFD700",
  white:   "#FFFFFF",
  black:   "#000000",
  text:    "#0D1B3E",
  muted:   "#7B8DB0",
  f4:      "#F4F6FA",
};

/* ─── OTP DIGIT BOX ─────────────────────────────────────────────────── */
const OtpDisplay = ({ code }: { code: string }) => {
  const digits = Array(6).fill("").map((_, i) => code[i] || "");
  return (
    <View style={otp.row}>
      {digits.map((d, i) => {
        const filled  = d !== "";
        const current = i === code.length;
        return (
          <View
            key={i}
            style={[
              otp.box,
              filled  && otp.boxFilled,
              current && otp.boxCurrent,
            ]}
          >
            <Text style={[otp.digit, filled && otp.digitFilled]}>
              {filled ? d : "·"}
            </Text>
            {current && <View style={otp.cursor} />}
          </View>
        );
      })}
    </View>
  );
};

/* ─── MAIN SCREEN ─────────────────────────────────────────────────────── */
export default function VerifyCode() {
  const { t: tr } = useTranslation();
  const router = useRouter();
  const [verifyOtp,       { isLoading }]           = useVerifyOtpMutation();
  const [askPasswordReset, { isLoading: isValue }] = useAskPasswordResetMutation();

  const [code, setCode] = useState("");
  const inputRef = useRef<TextInput>(null);

  /* ── Animations ── */
  const cardSlide = useRef(new Animated.Value(60)).current;
  const cardOpac  = useRef(new Animated.Value(0)).current;
  const logoOpac  = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const floatY    = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  /* pulse for the icon when code is complete */
  const pulseScale = useRef(new Animated.Value(1)).current;

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

    // Auto-focus pour ouvrir le clavier dès l'arrivée sur l'écran
    setTimeout(() => inputRef.current?.focus(), 600);
  }, []);

  useEffect(() => {
    if (code.length === 6) {
      Animated.sequence([
        Animated.spring(pulseScale, { toValue: 1.12, friction: 4, useNativeDriver: true }),
        Animated.spring(pulseScale, { toValue: 1,    friction: 4, useNativeDriver: true }),
      ]).start();
    }
  }, [code.length]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 9,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const handleVerify = async () => {
    if (code.length !== 6) { shake(); Alert.alert("Veuillez entrer un code valide"); return; }
    try {
      const response = await verifyOtp({ otp: String(code) }).unwrap();
      if (response) router.replace("/login");
    } catch (err) {
      shake();
      const dataMess = err as any;
      Alert.alert(dataMess?.data?.error || "Une erreur est survenue");
    }
  };

  const handleResend = async () => {
    try {
      const email    = await AsyncStorage.getItem("email");
      const response = await askPasswordReset({ email }).unwrap();
      if (response) {
        await AsyncStorage.setItem("userId", String(response.userId));
        router.push("/login");
      }
    } catch (err) {
      const dataMess = err as any;
      Alert.alert(dataMess?.data?.error || "Une erreur est survenue");
    }
  };

  const complete = code.length === 6;

  return (
    <View style={s.bg}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[C.deep, C.primary]}
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

          {/* ── Hero flottant ── */}
          <Animated.View style={[s.logoArea, { opacity: logoOpac, transform: [{ scale: logoScale }, { translateY: floatY }] }]}>

            {/* Icône principale — même mailIconBox du ForgotScreen */}
            <Animated.View style={[s.heroIconWrap, { transform: [{ scale: pulseScale }] }]}>
              <LinearGradient
                colors={[C.violet, C.primary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.heroIconGrad}
              >
                <Ionicons name="keypad-outline" size={30} color={C.white} />
              </LinearGradient>
              {/* Badge doré */}
              {complete && (
                <View style={s.checkBadge}>
                  <Ionicons name="checkmark" size={11} color={C.deep} />
                </View>
              )}
            </Animated.View>

            {/* Barre accent tricolore */}
            <View style={s.logoAccentBar}>
              <View style={[s.logoAccentSeg, { backgroundColor: C.violet,  flex: 2 }]} />
              <View style={[s.logoAccentSeg, { backgroundColor: C.accent,  flex: 1 }]} />
              <View style={[s.logoAccentSeg, { backgroundColor: C.gold,    flex: 1 }]} />
            </View>

            <Text style={s.heroTitle}>Vérification du code</Text>
            <Text style={s.heroSub}>
              Entrez le code à 6 chiffres envoyé à votre adresse email
            </Text>
          </Animated.View>

          {/* ── Card ── */}
          <Animated.View style={[s.cardWrap, { opacity: cardOpac, transform: [{ translateY: cardSlide }, { translateX: shakeAnim }] }]}>

            {/* Section header — copie exacte du home */}
            <View style={s.sectionHeader}>
              <View style={[s.sectionDot, { backgroundColor: complete ? "#22C55E" : C.accent }]} />
              <Text style={s.sectionLabel}>
                {complete ? "CODE COMPLET ✓" : "SAISIE DU CODE"}
              </Text>
            </View>

            {/* OTP visual display — tap anywhere to focus */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => inputRef.current?.focus()}
            >
              <OtpDisplay code={code} />
            </TouchableOpacity>

            {/* Input invisible — reçoit la saisie */}
            <TextInput
              ref={inputRef}
              style={s.hiddenInput}
              value={code}
              onChangeText={v => setCode(v.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              caretHidden
              returnKeyType="done"
              onSubmitEditing={handleVerify}
            />

            {/* Séparateur */}
            <View style={s.sep} />

            {/* Info bulle */}
            <View style={s.infoBubble}>
              <View style={[s.iconCircle, { backgroundColor: C.primary + "12", width: 32, height: 32, borderRadius: 16 }]}>
                <Ionicons name="shield-checkmark-outline" size={15} color={C.primary} />
              </View>
              <Text style={s.infoText}>
                Le code expire dans <Text style={{ color: C.primary, fontWeight: "700" }}>10 minutes</Text>. Vérifiez aussi vos spams.
              </Text>
            </View>

            {/* CTA */}
            <View style={{ marginTop: 22 }}>
              <GradientButton
                isLoad={isLoading}
                title="Vérifier le code"
                onPress={handleVerify}
                leftIcon={<ArrowIcon width={20} height={14} />}
                rightIcon={<ArrowRightIcon width={30} height={24} />}
              />
            </View>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.line} />
              <View style={s.dividerBadge}>
                <Text style={s.dividerText}>OU</Text>
              </View>
              <View style={s.line} />
            </View>

            {/* Renvoyer — même ActionButton style */}
            <TouchableOpacity
              style={[s.resendBtn, isValue && { opacity: 0.7 }]}
              onPress={handleResend}
              disabled={isValue}
              activeOpacity={0.85}
            >
              <View style={[s.iconCircle, { backgroundColor: C.accent + "18" }]}>
                {isValue
                  ? <ActivityIndicator size="small" color={C.accent} />
                  : <FontAwesome6 name="rotate-right" size={14} color={C.accent} />
                }
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.resendMain}>Renvoyer le code</Text>
                <Text style={s.resendSub}>{"Vous n'avez pas reçu le code ?"}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.muted} />
            </TouchableOpacity>

          </Animated.View>

          <Text style={s.version}>BIM NEXT · v1.0.0</Text>
          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: C.deep },

  circle: { position: "absolute", borderRadius: 999 },
  circle1: {
    width: 300, height: 300, top: -130, right: -120,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
  },
  circle2: {
    width: 140, height: 140, top: 100, right: -40,
    backgroundColor: "rgba(57,6,199,0.15)",
  },
  circle3: {
    width: 190, height: 190, bottom: 140, left: -80,
    backgroundColor: "rgba(77,150,255,0.1)",
  },
  circle4: {
    width: 65, height: 65, top: "35%", left: 20,
    backgroundColor: "rgba(255,215,0,0.08)",
  },

  /* Hero */
  logoArea: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 65 : 46,
    marginBottom: 22,
  },
  heroIconWrap: { position: "relative", marginBottom: 12 },
  heroIconGrad: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    elevation: 14,
    shadowColor: C.violet, shadowOpacity: 0.35,
    shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
  },
  checkBadge: {
    position: "absolute", top: -4, right: -4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.gold, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.white,
  },
  logoAccentBar: {
    flexDirection: "row", width: 56, height: 3,
    borderRadius: 2, marginTop: 14, overflow: "hidden", gap: 2,
  },
  logoAccentSeg: { height: "100%", borderRadius: 2 },
  heroTitle: {
    color: C.white, fontFamily: "NexaLight",
    fontSize: 20, letterSpacing: 0.3,
    textAlign: "center", marginTop: 14, marginBottom: 7,
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

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  sectionDot:   { width: 4, height: 16, borderRadius: 2 },
  sectionLabel: {
    fontFamily: "NexaLight", fontSize: 11,
    color: C.muted, letterSpacing: 1.2, textTransform: "uppercase",
  },

  /* Hidden input overlay */
  hiddenInput: {
    position: "absolute",
    width: "100%", height: 64,
    opacity: 0,
    top: 70,
  },

  sep: { height: 1, backgroundColor: "#E8EDF5", marginVertical: 20 },

  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center",
    marginHorizontal: 6,
  },

  /* Info bulle */
  infoBubble: {
    flexDirection: "row", alignItems: "center",
    gap: 10,
    backgroundColor: C.primary + "08",
    borderRadius: 14, padding: 10,
    borderWidth: 1, borderColor: C.primary + "15",
  },
  infoText: {
    flex: 1, fontFamily: "NexaLight",
    fontSize: 12, color: C.muted, lineHeight: 17,
  },

  /* Divider */
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: "#E8EDF5" },
  dividerBadge: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, backgroundColor: C.f4,
    borderWidth: 1, borderColor: "#E8EDF5",
  },
  dividerText: {
    fontFamily: "NexaLight", fontSize: 11,
    color: C.muted, fontWeight: "700", letterSpacing: 1,
  },

  /* Resend btn — ActionButton style */
  resendBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.f4, borderRadius: 18,
    paddingVertical: 12, paddingHorizontal: 8, gap: 4,
  },
  resendMain: { fontFamily: "NexaLight", fontSize: 14, fontWeight: "700", color: C.text },
  resendSub:  { fontFamily: "NexaLight", fontSize: 11, color: C.muted, marginTop: 2 },

  version: {
    textAlign: "center", fontFamily: "NexaLight",
    fontSize: 11, color: "rgba(255,255,255,0.28)",
    marginTop: 22,
  },
});

/* ─── OTP BOX STYLES ─────────────────────────────────────────────────── */
const otp = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  box: {
    flex: 1, height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E8EDF5",
    backgroundColor: C.f4,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  boxFilled: {
    borderColor: C.primary,
    backgroundColor: C.primary + "0E",
  },
  boxCurrent: {
    borderColor: C.accent,
    borderWidth: 2,
    backgroundColor: "#EEF4FF",
  },
  digit: {
    fontFamily: "NexaLight",
    fontSize: 22, color: C.muted,
    fontWeight: "700",
  },
  digitFilled: {
    color: C.primary,
  },
  cursor: {
    position: "absolute",
    bottom: 10, width: 2, height: 18,
    backgroundColor: C.accent,
    borderRadius: 1,
  },
});