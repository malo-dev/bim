import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
} from "react-native";

import { useAskPasswordResetMutation, useVerifyOtpMutation } from "@/services/authService";
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

function OtpDisplay({ code, onPress }: { code: string; onPress: () => void }) {
  const { isDark } = useAppTheme();
  const W = isDark ? DARK : LIGHT;
  const otp = useMemo(() => mkOtp(W), [isDark]);
  const digits = Array(6).fill("").map((_, i) => code[i] || "");
  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} style={otp.row}>
      {digits.map((d, i) => {
        const filled  = d !== "";
        const current = i === code.length && code.length < 6;
        return (
          <View key={i} style={[otp.box, filled && otp.boxFilled, current && otp.boxCurrent]}>
            <Text style={[otp.digit, filled && otp.digitFilled]}>{filled ? d : "·"}</Text>
            {current && <View style={otp.cursor} />}
          </View>
        );
      })}
    </TouchableOpacity>
  );
}

export default function CheckPwd() {
  const { isDark } = useAppTheme();
  const W = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(W), [isDark]);
  const router = useRouter();
  const [verifyOtp,        { isLoading }]          = useVerifyOtpMutation();
  const [askPasswordReset, { isLoading: isResend }] = useAskPasswordResetMutation();

  const [code, setCode] = useState("");
  const inputRef = useRef<TextInput>(null);

  const cardSlide  = useRef(new Animated.Value(60)).current;
  const cardOpac   = useRef(new Animated.Value(0)).current;
  const logoScale  = useRef(new Animated.Value(0.7)).current;
  const logoOpac   = useRef(new Animated.Value(0)).current;
  const floatY     = useRef(new Animated.Value(0)).current;
  const shakeAnim  = useRef(new Animated.Value(0)).current;
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
        Animated.timing(floatY, { toValue: -10, duration: 2800, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0,   duration: 2800, useNativeDriver: true }),
      ])
    ).start();

    setTimeout(() => inputRef.current?.focus(), 600);
  }, []);

  useEffect(() => {
    if (code.length === 6) {
      Animated.sequence([
        Animated.spring(pulseScale, { toValue: 1.1, friction: 4, useNativeDriver: true }),
        Animated.spring(pulseScale, { toValue: 1,   friction: 4, useNativeDriver: true }),
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
      if (response) router.replace("/reset-password");
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
        Alert.alert("Code renvoyé", "Vérifiez votre boîte email.");
      }
    } catch (err) {
      const dataMess = err as any;
      Alert.alert(dataMess?.data?.error || "Une erreur est survenue");
    }
  };

  const complete = code.length === 6;

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={W.bg} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 16 }}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <Animated.View style={[s.logoArea, { opacity: logoOpac, transform: [{ scale: logoScale }, { translateY: floatY }] }]}>
            <Animated.View style={[s.heroIconWrap, { transform: [{ scale: pulseScale }] }]}>
              <View style={[s.heroIcon, complete && s.heroIconComplete]}>
                <Ionicons name="lock-open-outline" size={32} color={complete ? W.green : W.primary} />
              </View>
              {complete && (
                <View style={s.checkBadge}>
                  <Ionicons name="checkmark" size={11} color={W.white} />
                </View>
              )}
            </Animated.View>
            <Text style={s.heroTitle}>Vérification du code</Text>
            <Text style={s.heroSub}>Entrez le code à 6 chiffres envoyé à votre adresse email</Text>
          </Animated.View>

          {/* Étape indicator */}
          <View style={s.stepsRow}>
            {[W.primary, W.primary, W.border].map((color, i) => (
              <View key={i} style={[s.stepPill, { backgroundColor: color }]} />
            ))}
          </View>

          {/* Card */}
          <Animated.View style={[s.card, { opacity: cardOpac, transform: [{ translateY: cardSlide }, { translateX: shakeAnim }] }]}>

            <View style={s.sectionHeader}>
              <View style={[s.dot, { backgroundColor: complete ? W.green : W.primary }]} />
              <Text style={s.sectionLabel}>{complete ? "CODE COMPLET ✓" : "ÉTAPE 2/3 — SAISIE DU CODE"}</Text>
            </View>

            <OtpDisplay code={code} onPress={() => inputRef.current?.focus()} />

            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={v => setCode(v.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={handleVerify}
              style={s.hiddenInput}
              caretHidden
            />

            <View style={s.sep} />

            <View style={s.infoBubble}>
              <View style={s.infoIcon}>
                <Ionicons name="shield-checkmark-outline" size={15} color={W.primary} />
              </View>
              <Text style={s.infoText}>
                Le code expire dans{" "}
                <Text style={{ color: W.primary, fontWeight: "700" }}>10 minutes</Text>.{" "}
                Vérifiez aussi vos spams.
              </Text>
            </View>

            <TouchableOpacity
              style={[s.btn, { marginTop: 22 }, !complete && { opacity: 0.6 }]}
              onPress={handleVerify}
              disabled={isLoading || !complete}
              activeOpacity={0.88}
            >
              {isLoading
                ? <ActivityIndicator color={W.white} />
                : <Text style={s.btnText}>Vérifier le code</Text>
              }
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={s.line} />
              <Text style={s.dividerText}>OU</Text>
              <View style={s.line} />
            </View>

            <TouchableOpacity
              style={[s.resendBtn, isResend && { opacity: 0.7 }]}
              onPress={handleResend}
              disabled={isResend}
              activeOpacity={0.85}
            >
              <View style={s.resendIcon}>
                {isResend
                  ? <ActivityIndicator size="small" color={W.primary} />
                  : <FontAwesome6 name="rotate-right" size={14} color={W.primary} />
                }
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.resendMain}>Renvoyer le code</Text>
                <Text style={s.resendSub}>Vous n'avez pas reçu le code ?</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={W.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={s.backBtn} onPress={() => router.push("/forgot-password")} activeOpacity={0.85}>
              <View style={[s.backIcon]}>
                <FontAwesome6 name="arrow-left" size={13} color={W.muted} />
              </View>
              <Text style={s.backText}>Retour</Text>
            </TouchableOpacity>

          </Animated.View>

          <Text style={s.version}>BIM NEXT · v1.0.0</Text>
          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

CheckPwd.options = { headerShown: false };

function mkS(W: typeof LIGHT) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: W.bg },

  logoArea: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 65 : 46,
    marginBottom: 16,
  },
  heroIconWrap: { position: "relative", marginBottom: 14 },
  heroIcon: {
    width: 88, height: 88, borderRadius: 26,
    backgroundColor: W.white,
    borderWidth: 2, borderColor: "#C8D8FF",
    alignItems: "center", justifyContent: "center",
    elevation: 8,
    shadowColor: W.primary, shadowOpacity: 0.18,
    shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  heroIconComplete: { borderColor: W.green + "88", backgroundColor: "#F0FFF4" },
  checkBadge: {
    position: "absolute", top: -4, right: -4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: W.green,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: W.white,
  },
  heroTitle: { fontFamily: "NexaBold", fontSize: 20, color: W.text, textAlign: "center", marginBottom: 6 },
  heroSub:   { fontFamily: "NexaRegular", fontSize: 13, color: W.muted, textAlign: "center", lineHeight: 20, paddingHorizontal: 24 },

  stepsRow: { flexDirection: "row", gap: 6, marginHorizontal: 16, marginBottom: 16 },
  stepPill: { flex: 1, height: 3, borderRadius: 2 },

  card: {
    backgroundColor: W.white, borderRadius: 28, padding: 22,
    marginHorizontal: 0,
    elevation: 6,
    shadowColor: W.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 16,
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  dot:           { width: 4, height: 16, borderRadius: 2 },
  sectionLabel:  { fontFamily: "NexaRegular", fontSize: 11, color: W.muted, letterSpacing: 1.2, textTransform: "uppercase" },

  hiddenInput: { position: "absolute", width: "100%", height: 72, top: 52, opacity: 0 },

  sep: { height: 1, backgroundColor: W.border, marginVertical: 20 },

  infoBubble: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#0047FF08", borderRadius: 14, padding: 10,
    borderWidth: 1, borderColor: "#0047FF15",
  },
  infoIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#0047FF12",
    alignItems: "center", justifyContent: "center",
  },
  infoText: { flex: 1, fontFamily: "NexaRegular", fontSize: 12, color: W.muted, lineHeight: 17 },

  btn: {
    backgroundColor: W.primary, borderRadius: 18, height: 54,
    alignItems: "center", justifyContent: "center",
    elevation: 4,
    shadowColor: W.primary, shadowOpacity: 0.3, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  btnText: { fontFamily: "NexaBold", fontSize: 15, color: W.white, letterSpacing: 0.5 },

  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 12 },
  line:        { flex: 1, height: 1, backgroundColor: W.border },
  dividerText: { fontFamily: "NexaRegular", fontSize: 11, color: W.muted, fontWeight: "700" },

  resendBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: W.input,
    borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14, gap: 12,
    borderWidth: 1, borderColor: W.border,
  },
  resendIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#0047FF12",
    alignItems: "center", justifyContent: "center",
  },
  resendMain: { fontFamily: "NexaBold", fontSize: 14, color: W.text },
  resendSub:  { fontFamily: "NexaRegular", fontSize: 11, color: W.muted, marginTop: 2 },

  backBtn: {
    flexDirection: "row", alignItems: "center",
    gap: 10, marginTop: 14,
    backgroundColor: W.input, borderRadius: 18,
    paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: W.border,
  },
  backIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: W.border,
    alignItems: "center", justifyContent: "center",
  },
  backText: { fontFamily: "NexaRegular", fontSize: 13, color: W.muted, flex: 1 },

  version: { textAlign: "center", fontFamily: "NexaRegular", fontSize: 11, color: W.muted, marginTop: 22 },
}); }

function mkOtp(W: typeof LIGHT) { return StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  box: {
    flex: 1, height: 58, borderRadius: 16,
    borderWidth: 1.5, borderColor: W.border,
    backgroundColor: W.input,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  boxFilled:   { borderColor: W.primary, backgroundColor: "#EEF4FF" },
  boxCurrent:  { borderColor: W.primary, borderWidth: 2, backgroundColor: "#EEF4FF" },
  digit:       { fontFamily: "NexaBold", fontSize: 22, color: W.muted },
  digitFilled: { color: W.primary },
  cursor: {
    position: "absolute", bottom: 8,
    width: 2, height: 18, backgroundColor: W.primary, borderRadius: 1,
  },
}); }
