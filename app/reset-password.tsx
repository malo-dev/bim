import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useResetPasswordMutation } from "@/services/authService";
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
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import logo from "@/assets/images/logo.jpeg";
import { C, Colors} from "@/constants/theme";

/* ─── FORCE INDICATOR ────────────────────────────────────────────────── */
function StrengthBar({ password }: { password: string }) {
  const getStrength = () => {
    if (password.length === 0) return { level: 0, label: "", color: "#E8EDF5" };
    if (password.length < 6)  return { level: 1, label: "Trop court", color: C.red };
    if (password.length < 8)  return { level: 2, label: "Faible",     color: "#F59E0B" };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password))
                               return { level: 4, label: "Fort",       color: "#22C55E" };
    return                            { level: 3, label: "Moyen",      color: C.accent };
  };
  const { level, label, color } = getStrength();
  if (password.length === 0) return null;
  return (
    <View style={sb.wrap}>
      <View style={sb.bars}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={[sb.bar, { backgroundColor: i <= level ? color : "#E8EDF5" }]} />
        ))}
      </View>
      <Text style={[sb.label, { color }]}>{label}</Text>
    </View>
  );
}

/* ─── MAIN SCREEN ─────────────────────────────────────────────────────── */
export default function ResetPassword() {
  function useTheme() {
      const scheme = useColorScheme();
      const isDark  = scheme === "dark";
      return { isDark, t: isDark ? Colors.dark : Colors.light };
    }
    const { isDark,t }             = useTheme();
  const router = useRouter();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [focusedInput,    setFocusedInput]    = useState<"pwd" | "confirm" | null>(null);

  /* ── Animations ── */
  const cardSlide  = useRef(new Animated.Value(60)).current;
  const cardOpac   = useRef(new Animated.Value(0)).current;
  const logoScale  = useRef(new Animated.Value(0.7)).current;
  const logoOpac   = useRef(new Animated.Value(0)).current;
  const floatY     = useRef(new Animated.Value(0)).current;
  const shakeAnim  = useRef(new Animated.Value(0)).current;

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

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 9,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      shake(); Alert.alert("Veuillez remplir tous les champs"); return;
    }
    if (password.length < 6) {
      shake(); Alert.alert("Le mot de passe doit contenir au moins 6 caractères"); return;
    }
    if (password !== confirmPassword) {
      shake(); Alert.alert("Les mots de passe ne correspondent pas"); return;
    }
    try {
      const userId  = await AsyncStorage.getItem("userId");
      const response = await resetPassword({ newPassword: String(password), userId }).unwrap();
      if (response) router.replace("/login");
    } catch (err) {
      shake();
      const dataMess = err as any;
      Alert.alert(dataMess?.data?.error || "Une erreur est survenue");
    }
  };

  const match   = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const noMatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <View style={[{ flex: 1 }, { backgroundColor: t.gradientEnd }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
          colors={
          isDark
            ? ["#060D1F", "#091528", "#0D1F3C"]
            : [t.gradientStart, t.gradientEnd, t.accent]
        }
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Cercles décoratifs */}
      <View style={[s.circle, s.circle1]} />
      <View style={[s.circle, s.circle2]} />
      <View style={[s.circle, s.circle3]} />
      <View style={[s.circle, s.circle4]} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 16 }}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Logo flottant ── */}
          <Animated.View style={[s.logoArea, { opacity: logoOpac, transform: [{ scale: logoScale }, { translateY: floatY }] }]}>
            <View style={s.logoWrap}>
              <Image source={logo} style={s.logo} resizeMode="contain" />
            </View>
            {/* Barre accent tricolore */}
            <View style={s.logoAccentBar}>
              <View style={[s.logoAccentSeg, { backgroundColor: C.violet,  flex: 2 }]} />
              <View style={[s.logoAccentSeg, { backgroundColor: C.primary, flex: 1 }]} />
              <View style={[s.logoAccentSeg, { backgroundColor: C.gold,    flex: 1 }]} />
            </View>
            <Text style={s.heroTitle}>Nouveau mot de passe</Text>
            <Text style={s.heroSub}>Créez un mot de passe fort et sécurisé</Text>
          </Animated.View>

          {/* ── Card ── */}
          <Animated.View style={[s.cardWrap, { opacity: cardOpac, transform: [{ translateY: cardSlide }, { translateX: shakeAnim }] }]}>

            {/* Section header — pattern home */}
            <View style={s.sectionHeader}>
              <View style={[s.sectionDot, { backgroundColor: C.violet }]} />
              <Text style={s.sectionLabel}>RÉINITIALISATION · ÉTAPE 3/3</Text>
            </View>

            {/* Steps indicator */}
            <View style={s.stepsRow}>
              {[C.primary, C.primary, C.violet].map((color, i) => (
                <View key={i} style={[s.stepPill, { backgroundColor: color }]} />
              ))}
            </View>

            <View style={s.sep} />

            {/* Mot de passe */}
            <Text style={s.label}>Nouveau mot de passe</Text>
            <View style={[s.inputRow, focusedInput === "pwd" && s.inputFocused]}>
              <View style={[s.iconCircle, { backgroundColor: focusedInput === "pwd" ? C.violet + "18" : C.f4 }]}>
                <Ionicons name="lock-closed-outline" size={17} color={focusedInput === "pwd" ? C.violet : C.muted} />
              </View>
              <TextInput
                style={s.input}
                placeholder="Nouveau mot de passe"
                placeholderTextColor={C.muted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedInput("pwd")}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={s.eyeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Barre de force */}
            <StrengthBar password={password} />

            {/* Confirmation */}
            <Text style={[s.label, { marginTop: 14 }]}>Confirmer le mot de passe</Text>
            <View style={[s.inputRow, focusedInput === "confirm" && s.inputFocused, noMatch && s.inputError, match && s.inputSuccess]}>
              <View style={[s.iconCircle, { backgroundColor: match ? "#22C55E18" : focusedInput === "confirm" ? C.violet + "18" : C.f4 }]}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={17}
                  color={match ? "#22C55E" : focusedInput === "confirm" ? C.violet : C.muted}
                />
              </View>
              <TextInput
                style={s.input}
                placeholder="Confirmez votre mot de passe"
                placeholderTextColor={C.muted}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleReset}
                onFocus={() => setFocusedInput("confirm")}
                onBlur={() => setFocusedInput(null)}
              />
              {match && <Ionicons name="checkmark-circle" size={18} color="#22C55E" style={{ marginRight: 12 }} />}
              {!match && confirmPassword.length > 0 && (
                <TouchableOpacity onPress={() => setShowConfirm(p => !p)} style={s.eyeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={18} color={C.muted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Match indicator */}
            {confirmPassword.length > 0 && (
              <View style={[s.matchRow, { borderLeftColor: match ? "#22C55E" : C.red }]}>
                <Ionicons
                  name={match ? "checkmark-circle-outline" : "close-circle-outline"}
                  size={13}
                  color={match ? "#22C55E" : C.red}
                />
                <Text style={[s.matchText, { color: match ? "#22C55E" : C.red }]}>
                  {match ? "Les mots de passe correspondent" : "Les mots de passe ne correspondent pas"}
                </Text>
              </View>
            )}

            {/* Info bulle */}
            <View style={s.infoBubble}>
              <View style={[s.iconCircle, { backgroundColor: C.violet + "12", width: 32, height: 32, borderRadius: 16 }]}>
                <Ionicons name="information-circle-outline" size={15} color={C.violet} />
              </View>
              <Text style={s.infoText}>
                Minimum 8 caractères avec majuscule et chiffre pour un mot de passe{" "}
                <Text style={{ color: "#22C55E", fontWeight: "700" }}>fort</Text>
              </Text>
            </View>

            {/* CTA */}
            <View style={{ marginTop: 22 }}>
              <GradientButton
                title="Réinitialiser le mot de passe"
                onPress={handleReset}
                isLoad={isLoading}
                leftIcon={<ArrowIcon width={20} height={14} />}
                rightIcon={<ArrowRightIcon width={30} height={24} />}
              />
            </View>

            {/* Retour login */}
            <TouchableOpacity style={s.backBtn} onPress={() => router.push("/login")} activeOpacity={0.85}>
              <View style={[s.iconCircle, { backgroundColor: C.f4, width: 36, height: 36, borderRadius: 18 }]}>
                <FontAwesome6 name="arrow-left" size={13} color={C.muted} />
              </View>
              <Text style={s.backText}>Retour à la connexion</Text>
            </TouchableOpacity>

          </Animated.View>

          <Text style={s.version}>BIM NEXT · v1.0.0</Text>
          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

ResetPassword.options = { headerShown: false };

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: C.deep },

  circle: { position: "absolute", borderRadius: 999 },
  circle1: {
    width: 300, height: 300, top: -130, right: -120,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
  },
  circle2: { width: 140, height: 140, top: 100, right: -40, backgroundColor: "rgba(57,6,199,0.15)" },
  circle3: { width: 190, height: 190, bottom: 140, left: -80, backgroundColor: "rgba(77,150,255,0.1)" },
  circle4: { width: 65,  height: 65,  top: "35%", left: 20,  backgroundColor: "rgba(255,215,0,0.08)" },

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
    color: C.white, fontFamily: "NexaLight", fontSize: 20,
    letterSpacing: 0.3, textAlign: "center", marginTop: 16, marginBottom: 7,
  },
  heroSub: {
    color: "rgba(255,255,255,0.6)", fontFamily: "NexaLight",
    fontSize: 13, textAlign: "center", lineHeight: 20, paddingHorizontal: 24,
  },

  cardWrap: {
    backgroundColor: C.white, borderRadius: 28, padding: 22,
    elevation: 10, shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 20,
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionDot:   { width: 4, height: 16, borderRadius: 2 },
  sectionLabel: {
    fontFamily: "NexaLight", fontSize: 11,
    color: C.muted, letterSpacing: 1.2, textTransform: "uppercase",
  },

  /* Progress pills */
  stepsRow: { flexDirection: "row", gap: 6, marginBottom: 16 },
  stepPill: { flex: 1, height: 3, borderRadius: 2 },

  sep: { height: 1, backgroundColor: "#E8EDF5", marginBottom: 20 },

  label: {
    fontFamily: "NexaLight", fontSize: 11, color: C.muted,
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8,
  },

  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#E8EDF5",
    borderRadius: 18, height: 54, backgroundColor: C.f4,
  },
  inputFocused: { borderColor: C.violet, backgroundColor: "#F5F0FF" },
  inputError:   { borderColor: C.red,    backgroundColor: "#FFF5F5" },
  inputSuccess: { borderColor: "#22C55E", backgroundColor: "#F0FFF4" },

  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center", marginHorizontal: 6,
  },
  input: {
    flex: 1, height: "100%",
    fontSize: 14, color: C.text, fontFamily: "NexaLight", paddingRight: 4,
  },
  eyeBtn: { padding: 4, marginRight: 8 },

  matchRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 6, marginBottom: 4,
    paddingLeft: 10, borderLeftWidth: 2, borderRadius: 2,
  },
  matchText: { fontFamily: "NexaLight", fontSize: 12 },

  infoBubble: {
    flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14,
    backgroundColor: C.violet + "08", borderRadius: 14, padding: 10,
    borderWidth: 1, borderColor: C.violet + "15",
  },
  infoText: { flex: 1, fontFamily: "NexaLight", fontSize: 12, color: C.muted, lineHeight: 17 },

  backBtn: {
    flexDirection: "row", alignItems: "center",
    gap: 10, marginTop: 18,
    backgroundColor: C.f4, borderRadius: 18,
    paddingVertical: 12, paddingHorizontal: 14,
  },
  backText: { fontFamily: "NexaLight", fontSize: 13, color: C.muted, flex: 1 },

  version: {
    textAlign: "center", fontFamily: "NexaLight",
    fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 22,
  },
});

/* ─── STRENGTH BAR STYLES ────────────────────────────────────────────── */
const sb = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 4 },
  bars: { flexDirection: "row", gap: 4, flex: 1 },
  bar:  { flex: 1, height: 3, borderRadius: 2 },
  label: { fontFamily: "NexaLight", fontSize: 11, fontWeight: "700", minWidth: 60, textAlign: "right" },
});