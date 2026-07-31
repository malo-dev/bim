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

import logo from "@/assets/images/logo.jpeg";
import { useResetPasswordMutation } from "@/services/authService";
import { useAppTheme } from "@/app/_layout";

const LIGHT = {
  bg:      "#F8F9FF",
  primary: "#0047FF",
  text:    "#1A1C1C",
  muted:   "#747688",
  input:   "#F4F6FF",
  border:  "#E8EDF5",
  red:     "#DC0302",
  green:   "#22C55E",
  white:   "#FFFFFF",
};
const DARK: typeof LIGHT = {
  bg:      "#0B1220",
  primary: "#4D8DFF",
  text:    "#EAF0FF",
  muted:   "#9FB0D0",
  input:   "#182033",
  border:  "#1F2A44",
  red:     "#FF6B6B",
  green:   "#22C55E",
  white:   "#FFFFFF",
};

function StrengthBar({ password }: { password: string }) {
  const { isDark } = useAppTheme();
  const W = isDark ? DARK : LIGHT;
  const sb = useMemo(() => mkSb(W), [isDark]);
  const getStrength = () => {
    if (password.length === 0) return { level: 0, label: "", color: W.border };
    if (password.length < 6)  return { level: 1, label: "Trop court", color: W.red };
    if (password.length < 8)  return { level: 2, label: "Faible",     color: "#F59E0B" };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password))
                               return { level: 4, label: "Fort",       color: W.green };
    return                            { level: 3, label: "Moyen",      color: W.primary };
  };
  const { level, label, color } = getStrength();
  if (password.length === 0) return null;
  return (
    <View style={sb.wrap}>
      <View style={sb.bars}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={[sb.bar, { backgroundColor: i <= level ? color : W.border }]} />
        ))}
      </View>
      <Text style={[sb.label, { color }]}>{label}</Text>
    </View>
  );
}

export default function ResetPassword() {
  const { isDark } = useAppTheme();
  const W = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(W), [isDark]);
  const router = useRouter();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [focused,         setFocused]         = useState<"pwd" | "confirm" | null>(null);

  const cardSlide = useRef(new Animated.Value(60)).current;
  const cardOpac  = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpac  = useRef(new Animated.Value(0)).current;
  const floatY    = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

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
      const userId = await AsyncStorage.getItem("userId");
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
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={W.bg} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 16 }}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo flottant */}
          <Animated.View style={[s.logoArea, { opacity: logoOpac, transform: [{ scale: logoScale }, { translateY: floatY }] }]}>
            <View style={s.logoWrap}>
              <Image source={logo} style={s.logo} resizeMode="contain" />
            </View>
            <Text style={s.brand}>BIMNext</Text>
            <Text style={s.heroTitle}>Nouveau mot de passe</Text>
            <Text style={s.heroSub}>Créez un mot de passe fort et sécurisé</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View style={[s.card, { opacity: cardOpac, transform: [{ translateY: cardSlide }, { translateX: shakeAnim }] }]}>

            <View style={s.sectionHeader}>
              <View style={s.dot} />
              <Text style={s.sectionLabel}>RÉINITIALISATION · ÉTAPE 3/3</Text>
            </View>

            {/* Progress pills */}
            <View style={s.stepsRow}>
              {[W.primary, W.primary, W.primary].map((color, i) => (
                <View key={i} style={[s.stepPill, { backgroundColor: color }]} />
              ))}
            </View>

            <View style={s.sep} />

            {/* Nouveau mot de passe */}
            <Text style={s.label}>Nouveau mot de passe</Text>
            <View style={[s.inputRow, focused === "pwd" && s.inputFocused]}>
              <View style={[s.iconBox, focused === "pwd" && s.iconBoxFocused]}>
                <Ionicons name="lock-closed-outline" size={17} color={focused === "pwd" ? W.primary : W.muted} />
              </View>
              <TextInput
                style={s.input}
                placeholder="Nouveau mot de passe"
                placeholderTextColor={W.muted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocused("pwd")}
                onBlur={() => setFocused(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={s.eyeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={W.muted} />
              </TouchableOpacity>
            </View>

            <StrengthBar password={password} />

            {/* Confirmer */}
            <Text style={[s.label, { marginTop: 14 }]}>Confirmer le mot de passe</Text>
            <View style={[
              s.inputRow,
              focused === "confirm" && s.inputFocused,
              noMatch && { borderColor: W.red, backgroundColor: "#FFF5F5" },
              match   && { borderColor: W.green, backgroundColor: "#F0FFF4" },
            ]}>
              <View style={[s.iconBox, { backgroundColor: match ? "#22C55E18" : focused === "confirm" ? "#0047FF12" : "transparent" }]}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={17}
                  color={match ? W.green : focused === "confirm" ? W.primary : W.muted}
                />
              </View>
              <TextInput
                style={s.input}
                placeholder="Confirmez votre mot de passe"
                placeholderTextColor={W.muted}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleReset}
                onFocus={() => setFocused("confirm")}
                onBlur={() => setFocused(null)}
              />
              {match && <Ionicons name="checkmark-circle" size={18} color={W.green} style={{ marginRight: 12 }} />}
              {!match && confirmPassword.length > 0 && (
                <TouchableOpacity onPress={() => setShowConfirm(p => !p)} style={s.eyeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={18} color={W.muted} />
                </TouchableOpacity>
              )}
            </View>

            {confirmPassword.length > 0 && (
              <View style={[s.matchRow, { borderLeftColor: match ? W.green : W.red }]}>
                <Ionicons
                  name={match ? "checkmark-circle-outline" : "close-circle-outline"}
                  size={13}
                  color={match ? W.green : W.red}
                />
                <Text style={[s.matchText, { color: match ? W.green : W.red }]}>
                  {match ? "Les mots de passe correspondent" : "Les mots de passe ne correspondent pas"}
                </Text>
              </View>
            )}

            {/* Info bulle */}
            <View style={s.infoBubble}>
              <View style={s.infoIcon}>
                <Ionicons name="information-circle-outline" size={15} color={W.primary} />
              </View>
              <Text style={s.infoText}>
                Minimum 8 caractères avec majuscule et chiffre pour un mot de passe{" "}
                <Text style={{ color: W.green, fontWeight: "700" }}>fort</Text>
              </Text>
            </View>

            {/* CTA */}
            <TouchableOpacity style={[s.btn, { marginTop: 22 }]} onPress={handleReset} activeOpacity={0.88} disabled={isLoading}>
              <Text style={s.btnText}>{isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}</Text>
            </TouchableOpacity>

            {/* Retour */}
            <TouchableOpacity style={s.backBtn} onPress={() => router.push("/login")} activeOpacity={0.85}>
              <View style={[s.iconBox, { backgroundColor: W.input, width: 36, height: 36, borderRadius: 18 }]}>
                <FontAwesome6 name="arrow-left" size={13} color={W.muted} />
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
    backgroundColor: W.white, borderRadius: 28, padding: 22,
    elevation: 6,
    shadowColor: W.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 16,
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  dot:           { width: 4, height: 16, borderRadius: 2, backgroundColor: W.primary },
  sectionLabel:  { fontFamily: "NexaRegular", fontSize: 11, color: W.muted, letterSpacing: 1.2, textTransform: "uppercase" },

  stepsRow: { flexDirection: "row", gap: 6, marginBottom: 16 },
  stepPill: { flex: 1, height: 3, borderRadius: 2 },

  sep: { height: 1, backgroundColor: W.border, marginBottom: 20 },

  label: {
    fontFamily: "NexaRegular", fontSize: 11, color: W.muted,
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8,
  },

  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: W.border,
    borderRadius: 18, height: 54,
    backgroundColor: W.input,
  },
  inputFocused: { borderColor: W.primary, backgroundColor: "#EEF4FF" },

  iconBox: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center", marginHorizontal: 6,
    backgroundColor: "transparent",
  },
  iconBoxFocused: { backgroundColor: "#0047FF12" },

  input: {
    flex: 1, height: "100%",
    fontSize: 14, color: W.text, fontFamily: "NexaRegular", paddingRight: 4,
  },
  eyeBtn: { padding: 4, marginRight: 8 },

  matchRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 6, marginBottom: 4,
    paddingLeft: 10, borderLeftWidth: 2, borderRadius: 2,
  },
  matchText: { fontFamily: "NexaRegular", fontSize: 12 },

  infoBubble: {
    flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14,
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

function mkSb(W: typeof LIGHT) { return StyleSheet.create({
  wrap:  { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 4 },
  bars:  { flexDirection: "row", gap: 4, flex: 1 },
  bar:   { flex: 1, height: 3, borderRadius: 2 },
  label: { fontFamily: "NexaRegular", fontSize: 11, fontWeight: "700", minWidth: 60, textAlign: "right" },
}); }
