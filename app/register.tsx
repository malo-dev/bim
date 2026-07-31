import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { useTranslation } from "react-i18next";

import logo from "@/assets/images/logo.jpeg";
import { useAppTheme } from "@/app/_layout";
import { useRegisterMutation } from "@/services/authService";
import { generateUsername } from "@/utils/generateUsername.utils";

const LIGHT = {
  bg:           "#F8F9FF",
  primary:      "#0047FF",
  text:         "#1A1C1C",
  muted:        "#747688",
  input:        "#F4F6FF",
  inputFocusBg: "#EEF4FF",
  border:       "#E8EDF5",
  red:          "#DC0302",
  green:        "#22C55E",
  white:        "#FFFFFF",
  cardBg:       "#FFFFFF",
  cardElev:     6,
  cardBord:     "transparent",
};
const DARK: typeof LIGHT = {
  bg:           "#0B1220",
  primary:      "#4D8DFF",
  text:         "#EAF0FF",
  muted:        "#9FB0D0",
  input:        "#182033",
  inputFocusBg: "rgba(77,141,255,0.10)",
  border:       "#1F2A44",
  red:          "#FF5A5A",
  green:        "#22C55E",
  white:        "#FFFFFF",
  cardBg:       "#1A2540",
  cardElev:     0,
  cardBord:     "rgba(31,42,68,0.90)",
};

type FocusedField = "email" | "password" | "confirmPassword" | null;

export default function RegisterScreen() {
  const { isDark } = useAppTheme();
  const W = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(W), [isDark]);

  const { t: tr } = useTranslation();
  const router = useRouter();
  const [register, { isLoading }] = useRegisterMutation();

  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [focused,         setFocused]         = useState<FocusedField>(null);
  const [showPwd,         setShowPwd]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);

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

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert(tr("common.error"), tr("auth.pwdNoMatch"));
      return;
    }
    try {
      const privacyAcceptedAt = await AsyncStorage.getItem("privacyAcceptedAt");
      const response = await register({ username: generateUsername(), email, password, privacyAcceptedAt }).unwrap();
      if (response) router.push("/verify-code");
    } catch (err) {
      const dataMess = err as any;
      Alert.alert(dataMess?.data?.error || tr("common.error"));
    }
  };

  const confirmBorderColor =
    confirmPassword.length > 0
      ? password === confirmPassword ? W.green : W.red
      : W.border;

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={W.bg} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo flottant */}
          <Animated.View style={[s.logoArea, { opacity: logoOpac, transform: [{ scale: logoScale }, { translateY: floatY }] }]}>
            <View style={s.logoWrap}>
              <Image source={logo} style={s.logo} resizeMode="contain" />
            </View>
            <Text style={s.brand}>BIMNext</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View style={[s.card, { opacity: cardOpac, transform: [{ translateY: cardSlide }] }]}>

            <View style={s.sectionHeader}>
              <View style={s.dot} />
              <Text style={s.sectionLabel}>{tr("auth.registerSection")}</Text>
            </View>

            <Text style={s.title}>{tr("auth.registerWelcome")}</Text>
            <Text style={s.subtitle}>{tr("auth.registerSub")}</Text>

            {/* Email */}
            <Text style={s.label}>{tr("auth.email")}</Text>
            <View style={[s.inputRow, focused === "email" && s.inputFocused]}>
              <View style={[s.iconBox, focused === "email" && s.iconBoxFocused]}>
                <Ionicons name="mail-outline" size={18} color={focused === "email" ? W.primary : W.muted} />
              </View>
              <TextInput
                style={s.input}
                placeholder={tr("auth.emailPH")}
                placeholderTextColor={W.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
              />
              {email.length > 0 && <Ionicons name="checkmark-circle" size={18} color={W.green} style={s.trailIcon} />}
            </View>

            {/* Password */}
            <Text style={s.label}>{tr("auth.password")}</Text>
            <View style={[s.inputRow, focused === "password" && s.inputFocused]}>
              <View style={[s.iconBox, focused === "password" && s.iconBoxFocused]}>
                <Ionicons name="lock-closed-outline" size={18} color={focused === "password" ? W.primary : W.muted} />
              </View>
              <TextInput
                style={s.input}
                placeholder={tr("auth.passwordPH")}
                placeholderTextColor={W.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
              />
              <TouchableOpacity onPress={() => setShowPwd(p => !p)} style={s.eyeBtn}>
                <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={18} color={W.muted} />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <Text style={s.label}>{tr("auth.confirmPassword")}</Text>
            <View style={[s.inputRow, { borderColor: confirmBorderColor }, focused === "confirmPassword" && s.inputFocused]}>
              <View style={[
                s.iconBox,
                confirmPassword.length > 0
                  ? { backgroundColor: password === confirmPassword ? "#22C55E18" : W.red + "18" }
                  : focused === "confirmPassword" ? s.iconBoxFocused : null,
              ]}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color={
                    confirmPassword.length > 0
                      ? password === confirmPassword ? W.green : W.red
                      : focused === "confirmPassword" ? W.primary : W.muted
                  }
                />
              </View>
              <TextInput
                style={s.input}
                placeholder={tr("auth.confirmPH")}
                placeholderTextColor={W.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                onFocus={() => setFocused("confirmPassword")}
                onBlur={() => setFocused(null)}
              />
              {confirmPassword.length > 0 && password === confirmPassword
                ? <Ionicons name="checkmark-circle" size={18} color={W.green} style={s.trailIcon} />
                : <TouchableOpacity onPress={() => setShowConfirm(p => !p)} style={s.eyeBtn}>
                    <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={18} color={W.muted} />
                  </TouchableOpacity>
              }
            </View>

            {/* Match indicator */}
            {password.length > 0 && confirmPassword.length > 0 && (
              <View style={[s.matchRow, { borderLeftColor: password === confirmPassword ? W.green : W.red }]}>
                <Ionicons
                  name={password === confirmPassword ? "checkmark-circle-outline" : "close-circle-outline"}
                  size={14}
                  color={password === confirmPassword ? W.green : W.red}
                />
                <Text style={[s.matchText, { color: password === confirmPassword ? W.green : W.red }]}>
                  {password === confirmPassword ? tr("auth.pwdMatch") : tr("auth.pwdNoMatch")}
                </Text>
              </View>
            )}

            {/* Bouton inscription */}
            <TouchableOpacity style={[s.btn, { marginTop: 8 }]} onPress={handleRegister} activeOpacity={0.88} disabled={isLoading}>
              <Text style={s.btnText}>
                {isLoading ? "Création..." : tr("auth.registerBtn")}
              </Text>
            </TouchableOpacity>

            {/* Séparateur */}
            <View style={s.divider}>
              <View style={s.line} />
              <Text style={s.dividerText}>{tr("common.or")}</Text>
              <View style={s.line} />
            </View>

            {/* Retour login */}
            <TouchableOpacity style={s.outlineBtn} onPress={() => router.push("/login")} activeOpacity={0.85}>
              <View style={[s.iconBox, { backgroundColor: "#0047FF18" }]}>
                <FontAwesome6 name="arrow-right-to-bracket" size={15} color={W.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.outlineBtnMain}>{tr("auth.alreadyAccount")}</Text>
                <Text style={s.outlineBtnSub}>{tr("auth.loginSpace")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={W.muted} />
            </TouchableOpacity>

          </Animated.View>
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function mkS(W: typeof LIGHT) { return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: W.bg,
  },

  logoArea: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 65 : 46,
    marginBottom: 22,
  },
  logoWrap: {
    width: 96, height: 96,
    borderRadius: 26,
    backgroundColor: W.white,
    borderWidth: 2,
    borderColor: "#C8D8FF",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", elevation: 8,
    shadowColor: W.primary, shadowOpacity: 0.18,
    shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  logo: { width: 78, height: 78 },
  brand: {
    fontFamily: "NexaBold",
    fontSize: 20, color: W.primary,
    marginTop: 12, letterSpacing: 0.5,
  },

  card: {
    marginHorizontal: 16,
    backgroundColor: W.cardBg,
    borderRadius: 28, padding: 22,
    elevation: W.cardElev,
    borderWidth: 1.5,
    borderColor: W.cardBord,
    shadowColor: W.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 16,
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  dot:           { width: 4, height: 16, borderRadius: 2, backgroundColor: W.primary },
  sectionLabel:  { fontFamily: "NexaRegular", fontSize: 11, color: W.muted, letterSpacing: 1.2, textTransform: "uppercase" },

  title:    { fontFamily: "NexaBold", fontSize: 22, color: W.text, marginBottom: 5 },
  subtitle: { fontFamily: "NexaRegular", fontSize: 13, color: W.muted, lineHeight: 19, marginBottom: 22 },

  label: {
    fontFamily: "NexaRegular", fontSize: 11,
    color: W.muted, letterSpacing: 0.8,
    textTransform: "uppercase", marginBottom: 8,
  },

  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: W.border,
    borderRadius: 18, height: 54,
    backgroundColor: W.input,
    marginBottom: 14,
    paddingRight: 12,
  },
  inputFocused: { borderColor: W.primary, backgroundColor: W.inputFocusBg },

  iconBox: {
    width: 44, height: 44,
    borderRadius: 22,
    justifyContent: "center", alignItems: "center",
    marginHorizontal: 6,
    backgroundColor: "transparent",
  },
  iconBoxFocused: { backgroundColor: "#0047FF12" },
  trailIcon: { marginRight: 0 },

  input: { flex: 1, height: "100%", fontSize: 14, color: W.text, fontFamily: "NexaRegular" },
  eyeBtn: { padding: 4 },

  matchRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: -4, marginBottom: 12,
    paddingLeft: 10, borderLeftWidth: 2, borderRadius: 2,
  },
  matchText: { fontFamily: "NexaRegular", fontSize: 12 },

  btn: {
    backgroundColor: W.primary,
    borderRadius: 18, height: 54,
    alignItems: "center", justifyContent: "center",
    elevation: 4,
    shadowColor: W.primary,
    shadowOpacity: 0.3, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  btnText: { fontFamily: "NexaBold", fontSize: 15, color: W.white, letterSpacing: 0.5 },

  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 12 },
  line:        { flex: 1, height: 1, backgroundColor: W.border },
  dividerText: { fontFamily: "NexaRegular", fontSize: 11, color: W.muted, fontWeight: "700" },

  outlineBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: W.input,
    borderRadius: 18,
    paddingVertical: 12, paddingHorizontal: 14, gap: 12,
    borderWidth: 1, borderColor: W.border,
  },
  outlineBtnMain: { fontFamily: "NexaBold", fontSize: 14, color: W.text },
  outlineBtnSub:  { fontFamily: "NexaRegular", fontSize: 11, color: W.muted, marginTop: 2 },
}); }
