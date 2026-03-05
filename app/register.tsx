import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Animated,
  Text,
  StatusBar,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { useRegisterMutation } from "@/services/authService";
import { generateUsername } from "@/utils/generateUsername.utils";
import logo from "@/assets/images/logo.jpeg";
import { C, Colors } from "@/constants/theme";

/* ─── Hook thème ─────────────────────────────────────────────────────── */
function useTheme() {
  const scheme = useColorScheme();
  const isDark  = scheme === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

type FocusedField = "email" | "password" | "confirmPassword" | null;

export default function RegisterScreen() {
  const { t: tr } = useTranslation();
  const router = useRouter();
  const [register, { isLoading }] = useRegisterMutation();
  const { isDark, t } = useTheme();

  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [focusedInput,    setFocusedInput]    = useState<FocusedField>(null);
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);

  /* ── Animations ── */
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
  }, []);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert(tr("common.error"), tr("auth.pwdNoMatch"));
      return;
    }
    try {
      const response = await register({ username: generateUsername(), email, password }).unwrap();
      if (response) router.push("/verify-code");
    } catch (err) {
      const dataMess = err as any;
      Alert.alert(dataMess?.data?.error || tr("common.error"));
    }
  };

  /* ── Couleurs dynamiques ── */
  const inputBg      = isDark ? t.surface  : C.f4;
  const inputBgFocus = isDark ? "#0F1F42" : "#EEF4FF";
  const inputBorder  = isDark ? t.border   : "#E8EDF5";
  const dividerColor = isDark ? t.border   : "#E8EDF5";

  /* Couleur bordure champ confirm */
  const confirmBorderColor =
    confirmPassword.length > 0
      ? password === confirmPassword ? "#22C55E" : t.danger
      : inputBorder;

  return (
    <View style={{ flex: 1, backgroundColor: t.gradientEnd }}>
      <StatusBar barStyle="light-content" />

      {/* Background gradient */}
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

      {/* Cercles décoratifs */}
      <View style={[s.circle, s.circle1]} />
      <View style={[s.circle, s.circle2]} />
      <View style={[s.circle, s.circle3]} />
      <View style={[s.circle, s.circle4]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo flottant ── */}
          <Animated.View
            style={[
              s.logoArea,
              { opacity: logoOpac, transform: [{ scale: logoScale }, { translateY: floatY }] },
            ]}
          >
            <View style={s.logoWrap}>
              <Image source={logo} style={s.logo} resizeMode="contain" />
            </View>
            <View style={s.logoAccentBar}>
              <View style={[s.logoAccentSeg, { backgroundColor: C.violet, flex: 2 }]} />
              <View style={[s.logoAccentSeg, { backgroundColor: C.accent, flex: 1 }]} />
              <View style={[s.logoAccentSeg, { backgroundColor: C.red,    flex: 1 }]} />
            </View>
          </Animated.View>

          {/* ── Card ── */}
          <Animated.View
            style={[
              s.cardWrap,
              {
                opacity: cardOpac,
                transform: [{ translateY: cardSlide }],
                backgroundColor: t.card,
                shadowColor: isDark ? "#000" : C.primary,
              },
            ]}
          >
            {/* Section header */}
            <View style={s.sectionHeader}>
              <View style={[s.sectionDot, { backgroundColor: C.violet }]} />
              <Text style={[s.sectionLabel, { color: t.textSecondary }]}>{tr("auth.registerSection")}</Text>
            </View>

            <Text style={[s.title, { color: t.text }]}>{tr("auth.registerWelcome")}</Text>
            <Text style={[s.subtitle, { color: t.textSecondary }]}>
              {tr("auth.registerSub")}
            </Text>

            {/* ── EMAIL ── */}
            <Text style={[s.label, { color: t.textSecondary }]}>{tr("auth.email")}</Text>
            <View style={[
              s.inputRow,
              { backgroundColor: inputBg, borderColor: inputBorder },
              focusedInput === "email" && { borderColor: t.primary, backgroundColor: inputBgFocus },
            ]}>
              <View style={[
                s.iconCircle,
                { backgroundColor: focusedInput === "email" ? t.primary + "18" : inputBg },
              ]}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={focusedInput === "email" ? t.primary : t.textSecondary}
                />
              </View>
              <TextInput
                style={[s.input, { color: t.text }]}
                placeholder={tr("auth.emailPH")}
                placeholderTextColor={t.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedInput("email")}
                onBlur={() => setFocusedInput(null)}
              />
              {email.length > 0 && (
                <Ionicons name="checkmark-circle" size={18} color="#22C55E" style={{ marginRight: 12 }} />
              )}
            </View>

            {/* ── PASSWORD ── */}
            <Text style={[s.label, { color: t.textSecondary }]}>{tr("auth.password")}</Text>
            <View style={[
              s.inputRow,
              { backgroundColor: inputBg, borderColor: inputBorder },
              focusedInput === "password" && { borderColor: t.primary, backgroundColor: inputBgFocus },
            ]}>
              <View style={[
                s.iconCircle,
                { backgroundColor: focusedInput === "password" ? t.primary + "18" : inputBg },
              ]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={focusedInput === "password" ? t.primary : t.textSecondary}
                />
              </View>
              <TextInput
                style={[s.input, { color: t.text }]}
                placeholder={tr("auth.passwordPH")}
                placeholderTextColor={t.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={s.eyeBtn}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={t.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* ── CONFIRM PASSWORD ── */}
            <Text style={[s.label, { color: t.textSecondary }]}>{tr("auth.confirmPassword")}</Text>
            <View style={[
              s.inputRow,
              { backgroundColor: inputBg, borderColor: confirmBorderColor },
              focusedInput === "confirmPassword" && {
                backgroundColor: inputBgFocus,
                borderColor: confirmPassword.length > 0 ? confirmBorderColor : t.primary,
              },
            ]}>
              <View style={[
                s.iconCircle,
                {
                  backgroundColor:
                    confirmPassword.length > 0
                      ? password === confirmPassword ? "#22C55E18" : t.danger + "18"
                      : focusedInput === "confirmPassword" ? t.primary + "18" : inputBg,
                },
              ]}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color={
                    confirmPassword.length > 0
                      ? password === confirmPassword ? "#22C55E" : t.danger
                      : focusedInput === "confirmPassword" ? t.primary : t.textSecondary
                  }
                />
              </View>
              <TextInput
                style={[s.input, { color: t.text }]}
                placeholder={tr("auth.confirmPH")}
                placeholderTextColor={t.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                onFocus={() => setFocusedInput("confirmPassword")}
                onBlur={() => setFocusedInput(null)}
              />
              {/* Checkmark si match, sinon œil */}
              {confirmPassword.length > 0 && password === confirmPassword ? (
                <Ionicons name="checkmark-circle" size={18} color="#22C55E" style={{ marginRight: 12 }} />
              ) : (
                <TouchableOpacity onPress={() => setShowConfirm(p => !p)} style={s.eyeBtn}>
                  <Ionicons
                    name={showConfirm ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={t.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Indicateur correspondance */}
            {password.length > 0 && confirmPassword.length > 0 && (
              <View style={[
                s.matchRow,
                { borderLeftColor: password === confirmPassword ? "#22C55E" : t.danger },
              ]}>
                <Ionicons
                  name={password === confirmPassword ? "checkmark-circle-outline" : "close-circle-outline"}
                  size={14}
                  color={password === confirmPassword ? "#22C55E" : t.danger}
                />
                <Text style={[s.matchText, {
                  color: password === confirmPassword ? "#22C55E" : t.danger,
                }]}>
                  {password === confirmPassword
                    ? tr("auth.pwdMatch")
                    : tr("auth.pwdNoMatch")}
                </Text>
              </View>
            )}

            <View style={{ marginTop: 6 }}>
              <GradientButton
                isLoad={isLoading}
                title={tr("auth.registerBtn")}
                onPress={handleRegister}
                leftIcon={<ArrowIcon width={20} height={14} />}
                rightIcon={<ArrowRightIcon width={30} height={24} />}
              />
            </View>

            {/* Divider */}
            <View style={s.divider}>
              <View style={[s.line, { backgroundColor: dividerColor }]} />
              <View style={[s.dividerBadge, {
                backgroundColor: isDark ? t.surface : C.f4,
                borderColor: dividerColor,
              }]}>
                <Text style={[s.dividerText, { color: t.textSecondary }]}>{tr("common.or")}</Text>
              </View>
              <View style={[s.line, { backgroundColor: dividerColor }]} />
            </View>

            {/* Bouton Login */}
            <TouchableOpacity
              style={[s.loginBtn, { backgroundColor: isDark ? t.surface : C.f4 }]}
              onPress={() => router.push("/login")}
              activeOpacity={0.85}
            >
              <View style={[s.iconCircle, { backgroundColor: C.primary + "18" }]}>
                <FontAwesome6 name="arrow-right-to-bracket" size={15} color={t.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.loginMain, { color: t.text }]}>{tr("auth.alreadyAccount")}</Text>
                <Text style={[s.loginSub, { color: t.textSecondary }]}>
                  {tr("auth.loginSpace")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={t.textSecondary} />
            </TouchableOpacity>

          </Animated.View>
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ─── STYLES — uniquement layout/formes, 0 couleur hardcodée ─────────── */
const s = StyleSheet.create({
  circle: { position: "absolute", borderRadius: 999 },
  circle1: {
    width: 300, height: 300, top: -130, right: -120,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  circle2: {
    width: 150, height: 150, top: 90, right: -40,
    backgroundColor: "rgba(57,6,199,0.18)",
  },
  circle3: {
    width: 200, height: 200, bottom: 180, left: -90,
    backgroundColor: "rgba(77,150,255,0.13)",
  },
  circle4: {
    width: 70, height: 70, top: "28%", left: 24,
    backgroundColor: "rgba(220,3,2,0.10)",
  },

  logoArea: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 65 : 46,
    marginBottom: 20,
  },
  logoWrap: {
    width: 90, height: 90, borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", elevation: 14,
    shadowColor: "#000", shadowOpacity: 0.3,
    shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
  },
  logo: { width: 74, height: 74 },
  logoAccentBar: {
    flexDirection: "row", width: 56, height: 3,
    borderRadius: 2, marginTop: 12, overflow: "hidden", gap: 2,
  },
  logoAccentSeg: { height: "100%", borderRadius: 2 },

  cardWrap: {
    marginHorizontal: 16, borderRadius: 28, padding: 22,
    elevation: 10, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 20,
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionDot:   { width: 4, height: 16, borderRadius: 2 },
  sectionLabel: { fontFamily: "NexaLight", fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" },

  title:    { fontFamily: "NexaLight", fontSize: 23, fontWeight: "700", marginBottom: 5 },
  subtitle: { fontFamily: "NexaLight", fontSize: 13, lineHeight: 19, marginBottom: 22 },

  label: {
    fontFamily: "NexaLight", fontSize: 11,
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8,
  },

  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderRadius: 18, height: 54,
    marginBottom: 14, paddingRight: 12,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center",
    marginHorizontal: 6,
  },
  input: { flex: 1, height: "100%", fontSize: 14, fontFamily: "NexaLight" },
  eyeBtn: { padding: 4 },

  matchRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: -6, marginBottom: 14,
    paddingLeft: 10, borderLeftWidth: 2, borderRadius: 2,
  },
  matchText: { fontFamily: "NexaLight", fontSize: 12 },

  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 10 },
  line: { flex: 1, height: 1 },
  dividerBadge: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  dividerText: { fontFamily: "NexaLight", fontSize: 11, fontWeight: "700", letterSpacing: 1 },

  loginBtn: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14, gap: 12,
  },
  loginMain: { fontFamily: "NexaLight", fontSize: 14, fontWeight: "700" },
  loginSub:  { fontFamily: "NexaLight", fontSize: 11, marginTop: 2 },
});