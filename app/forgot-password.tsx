import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Animated,
  Image,
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

import logo from "@/assets/images/logo.jpeg";
import { useAppTheme } from "@/app/_layout";
import { useAskPasswordResetMutation } from "@/services/authService";

const LIGHT = {
  bg:      "#F8F9FF",
  primary: "#0047FF",
  text:    "#1A1C1C",
  muted:   "#747688",
  input:   "#F4F6FF",
  border:  "#E8EDF5",
  white:   "#FFFFFF",
  cardBg:  "#FFFFFF",
  cardElev: 6,
  cardBord: "transparent",
};
const DARK: typeof LIGHT = {
  bg:      "#0B1220",
  primary: "#4D8DFF",
  text:    "#EAF0FF",
  muted:   "#9FB0D0",
  input:   "#182033",
  border:  "#1F2A44",
  white:   "#FFFFFF",
  cardBg:  "#1A2540",
  cardElev: 0,
  cardBord: "rgba(31,42,68,0.90)",
};

const STEPS = [
  { icon: "mail-outline"      as const },
  { icon: "keypad-outline"    as const },
  { icon: "lock-open-outline" as const },
];

function Steps({ labels }: { labels: string[] }) {
  const { isDark } = useAppTheme();
  const W = isDark ? DARK : LIGHT;
  const st = useMemo(() => mkSt(W), [isDark]);
  return (
    <View style={st.row}>
      {STEPS.map((step, i) => (
        <View key={i} style={st.stepWrap}>
          {i > 0 && <View style={st.line} />}
          <View style={[st.circle, i === 0 && st.circleActive]}>
            <Ionicons name={step.icon} size={13} color={i === 0 ? W.white : W.muted} />
          </View>
          <Text style={[st.label, i === 0 && st.labelActive]}>{labels[i]}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ForgotPasswordScreen() {
  const { isDark } = useAppTheme();
  const W = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(W), [isDark]);
  const { t: tr } = useTranslation();
  const router = useRouter();
  const [askPasswordReset, { isLoading }] = useAskPasswordResetMutation();

  const [email,   setEmail]   = useState("");
  const [focused, setFocused] = useState(false);

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
        Animated.timing(floatY, { toValue: -10, duration: 2800, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0,   duration: 2800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

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
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={W.bg} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo flottant */}
          <Animated.View style={[s.logoArea, { opacity: logoOpac, transform: [{ scale: logoScale }, { translateY: floatY }] }]}>
            <View style={s.logoWrap}>
              <Image source={logo} style={s.logo} resizeMode="contain" />
            </View>
            <Text style={s.brand}>BIMNext</Text>
            <Text style={s.heroTitle}>{tr("auth.forgotTitle")}</Text>
            <Text style={s.heroSub}>{tr("auth.forgotSub")}</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View style={[s.card, { opacity: cardOpac, transform: [{ translateY: cardSlide }, { translateX: shakeAnim }] }]}>

            <View style={s.sectionHeader}>
              <View style={s.dot} />
              <Text style={s.sectionLabel}>{tr("auth.resetSection")}</Text>
            </View>

            {/* Steps + mail icon */}
            <View style={s.stepsRow}>
              <View style={s.mailIconBox}>
                <Ionicons name="mail-outline" size={22} color={W.primary} />
                <View style={s.goldDot} />
              </View>
              <Steps labels={[tr("auth.emailStep"), tr("auth.codeStep"), tr("auth.resetStep")]} />
            </View>

            <View style={s.sep} />

            <Text style={s.label}>{tr("auth.email")}</Text>
            <View style={[s.inputRow, focused && s.inputFocused]}>
              <View style={[s.iconBox, focused && s.iconBoxFocused]}>
                <Ionicons name="mail-outline" size={17} color={focused ? W.primary : W.muted} />
              </View>
              <TextInput
                style={s.input}
                placeholder={tr("auth.emailPH")}
                placeholderTextColor={W.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
              {email.length > 0 && (
                <TouchableOpacity onPress={() => setEmail("")} style={{ marginRight: 12 }}>
                  <Ionicons name="close-circle" size={18} color={W.muted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Info bulle */}
            <View style={s.infoBubble}>
              <View style={s.infoIcon}>
                <Ionicons name="information-circle-outline" size={15} color={W.primary} />
              </View>
              <Text style={s.infoText}>{tr("auth.emailCodeHint")}</Text>
            </View>

            {/* CTA */}
            <TouchableOpacity style={[s.btn, { marginTop: 22 }]} onPress={handleSend} activeOpacity={0.88} disabled={isLoading}>
              <Text style={s.btnText}>{isLoading ? "Envoi en cours..." : tr("auth.sendCode")}</Text>
            </TouchableOpacity>

            {/* Retour */}
            <TouchableOpacity style={s.backBtn} onPress={() => router.push("/login")} activeOpacity={0.85}>
              <View style={[s.iconBox, { backgroundColor: W.input, width: 36, height: 36, borderRadius: 18 }]}>
                <FontAwesome6 name="arrow-left" size={13} color={W.muted} />
              </View>
              <Text style={s.backText}>{tr("auth.backToLogin")}</Text>
            </TouchableOpacity>

          </Animated.View>

          <Text style={s.version}>BIM NEXT · v1.0.0</Text>
          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

ForgotPasswordScreen.options = { headerShown: false };

function mkS(W: typeof LIGHT) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: W.bg },

  logoArea: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 65 : 46,
    marginBottom: 22,
  },
  logoWrap: {
    width: 90, height: 90, borderRadius: 24,
    backgroundColor: W.white,
    borderWidth: 2, borderColor: "#C8D8FF",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", elevation: 8,
    shadowColor: W.primary, shadowOpacity: 0.18,
    shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  logo: { width: 74, height: 74 },
  brand: { fontFamily: "NexaBold", fontSize: 18, color: W.primary, marginTop: 10, letterSpacing: 0.5 },
  heroTitle: {
    fontFamily: "NexaBold", fontSize: 20, color: W.text,
    textAlign: "center", marginTop: 14, marginBottom: 6,
  },
  heroSub: {
    fontFamily: "NexaRegular", fontSize: 13, color: W.muted,
    textAlign: "center", lineHeight: 20, paddingHorizontal: 24,
  },

  card: {
    backgroundColor: W.cardBg, borderRadius: 28, padding: 22,
    elevation: W.cardElev,
    borderWidth: 1.5,
    borderColor: W.cardBord,
    shadowColor: W.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 16,
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  dot:           { width: 4, height: 16, borderRadius: 2, backgroundColor: W.primary },
  sectionLabel:  { fontFamily: "NexaRegular", fontSize: 11, color: W.muted, letterSpacing: 1.2, textTransform: "uppercase" },

  stepsRow: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 },

  mailIconBox: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#0047FF12",
    position: "relative",
  },
  goldDot: {
    position: "absolute", top: 6, right: 6,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: "#F59E0B",
    borderWidth: 1.5, borderColor: W.white,
  },

  sep: { height: 1, backgroundColor: W.border, marginBottom: 20 },

  label: {
    fontFamily: "NexaRegular", fontSize: 11, color: W.muted,
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8,
  },

  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: W.border,
    borderRadius: 18, height: 54,
    backgroundColor: W.input, overflow: "hidden", paddingRight: 4,
  },
  inputFocused: { borderColor: W.primary, backgroundColor: "#EEF4FF" },

  iconBox: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center",
    marginHorizontal: 6, backgroundColor: "transparent",
  },
  iconBoxFocused: { backgroundColor: "#0047FF12" },

  input: { flex: 1, height: "100%", fontSize: 14, color: W.text, fontFamily: "NexaRegular" },

  infoBubble: {
    flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12,
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

  backBtn: {
    flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18,
    backgroundColor: W.input, borderRadius: 18,
    paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: W.border,
  },
  backText: { fontFamily: "NexaRegular", fontSize: 13, color: W.muted, flex: 1 },

  version: { textAlign: "center", fontFamily: "NexaRegular", fontSize: 11, color: W.muted, marginTop: 22 },
}); }

function mkSt(W: typeof LIGHT) { return StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", flex: 1, gap: 4 },
  stepWrap: { alignItems: "center", flex: 1, position: "relative" },
  line: {
    position: "absolute", top: 15, right: "50%",
    width: "100%", height: 1,
    backgroundColor: W.border, zIndex: -1,
  },
  circle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: W.input,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: W.border,
  },
  circleActive: { backgroundColor: W.primary, borderColor: W.primary },
  label: { fontFamily: "NexaRegular", fontSize: 10, color: W.muted, marginTop: 5, letterSpacing: 0.3 },
  labelActive: { color: W.primary },
}); }
