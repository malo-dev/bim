import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useLoginMutation } from "@/services/authService";
import { useAppTheme } from "@/app/_layout";
import BlinkingCursor from "@/components/ui/BlinkingCursor";

const LIGHT = {
  bg: "#F8F9FF", primary: "#0035C5", deep: "#001257", blue: "#0047FF",
  text: "#1A1C1C", muted: "#747688", border: "#E2E2E2", card: "#FFFFFF",
};
const DARK: typeof LIGHT = {
  bg: "#0B1220", primary: "#4D8DFF", deep: "#001257", blue: "#4D8DFF",
  text: "#EAF0FF", muted: "#6B7A99", border: "rgba(31,42,68,0.80)", card: "#1A2540",
};

export default function GestionLoginScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);
  const passwordInputRef = useRef<TextInput>(null);
  const [login, { isLoading }] = useLoginMutation();

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    try {
      const res: any = await login({ email: email.trim().toLowerCase(), password }).unwrap();
      if (res.role !== "BIM") {
        Alert.alert("Accès refusé", "Ce compte n'a pas accès à l'espace gestion.");
        return;
      }
      await AsyncStorage.multiSet([
        ["token", res.token],
        ["refreshToken", res.refreshToken],
        ["lastActivity", String(Date.now())],
        ["accountType", "traditional"],
      ]);
      const decoded: any = jwtDecode(res.token);
      await AsyncStorage.multiSet([
        ["userId", String(decoded?.userId)],
        ["email", decoded?.email ?? ""],
      ]);
      DeviceEventEmitter.emit("auth:loggedIn");
      router.replace("/gestion/home" as any);
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Email ou mot de passe incorrect.");
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[C.blue, C.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <View style={s.blob1} />
        <View style={s.blob2} />
        <SafeAreaView edges={["top"]}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={s.heroBody}>
            <View style={s.iconWrap}>
              <Ionicons name="shield-checkmark" size={30} color="#fff" />
            </View>
            <Text style={s.title}>Espace Gestion</Text>
            <Text style={s.sub}>Connexion réservée aux administrateurs BIM</Text>
            <View style={s.sslPill}>
              <Ionicons name="lock-closed" size={11} color="#fff" />
              <Text style={s.sslPillText}>Session chiffrée · SSL 256-bit</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={s.formWrap} keyboardShouldPersistTaps="handled">
          <View style={s.card}>
            <Text style={s.label}>ADRESSE E-MAIL</Text>
            <View style={s.inputRow}>
              <Ionicons name="mail-outline" size={17} color={C.muted} />
              <TextInput
                style={s.input}
                placeholder="admin@bimreseau.com"
                placeholderTextColor={C.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
              />
            </View>

            <Text style={[s.label, { marginTop: 18 }]}>MOT DE PASSE</Text>
            {/* `secureTextEntry` + police custom ne masque pas de façon
                fiable sur certains claviers Android (mot de passe affiché en
                clair). Masquage fait maison par points, avec œil pour
                afficher/masquer. */}
            <View style={s.inputRow}>
              <Ionicons name="key-outline" size={17} color={C.muted} />
              <TouchableOpacity
                style={{ flex: 1, alignItems: "flex-start" }}
                activeOpacity={1}
                onPress={() => passwordInputRef.current?.focus()}
              >
                <View style={{ flexDirection: "row", alignSelf: "flex-start", justifyContent: "flex-start", alignItems: "center", flexWrap: "wrap", gap: 5, paddingVertical: 10, minHeight: 20 }}>
                  {password.length === 0 && !pwdFocused && (
                    <Text style={[s.input, { color: C.muted, paddingVertical: 0 }]}>••••••••</Text>
                  )}
                  {password.length > 0 && (
                    showPwd ? (
                      <Text style={[s.input, { paddingVertical: 0 }]}>{password}</Text>
                    ) : (
                      Array.from({ length: password.length }).map((_, i) => (
                        <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.text }} />
                      ))
                    )
                  )}
                  {pwdFocused && <BlinkingCursor color={C.text} height={16} />}
                </View>
                <TextInput
                  ref={passwordInputRef}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0 }}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPwdFocused(true)}
                  onBlur={() => setPwdFocused(false)}
                  autoCapitalize="none"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPwd((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[s.btn, (!email.trim() || !password || isLoading) && { opacity: 0.6 }]}
              onPress={handleLogin}
              activeOpacity={0.9}
              disabled={!email.trim() || !password || isLoading}
            >
              <LinearGradient colors={[C.blue, C.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnGrad}>
                {isLoading
                  ? <ActivityIndicator color="#fff" />
                  : <><Ionicons name="log-in-outline" size={18} color="#fff" /><Text style={s.btnText}>Se connecter</Text></>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={s.infoRow}>
            <Ionicons name="information-circle-outline" size={15} color={C.muted} />
            <Text style={s.infoText}>Compte créé depuis admin-bim · rôle BIM Admin requis</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function mkS(C: typeof LIGHT) { return StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  hero: { paddingBottom: 36, overflow: "hidden" },
  blob1: { position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.08)" },
  blob2: { position: "absolute", bottom: -60, left: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.06)" },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginLeft: 16, marginTop: 4 },
  heroBody: { alignItems: "center", paddingHorizontal: 24, paddingTop: 18 },
  iconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontFamily: "NexaBold", fontSize: 21, color: "#fff" },
  sub: { fontFamily: "NexaLight", fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4, textAlign: "center" },
  sslPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginTop: 14 },
  sslPillText: { fontFamily: "NexaBold", fontSize: 10.5, color: "#fff" },

  formWrap: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  card: {
    backgroundColor: C.card, borderRadius: 24, padding: 20,
    marginTop: -24, borderWidth: 1, borderColor: C.border,
    elevation: 4, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  label: { fontFamily: "NexaBold", fontSize: 11, color: C.muted, letterSpacing: 0.6, marginBottom: 8 },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1.5, borderColor: C.border, borderRadius: 16,
    paddingHorizontal: 14, minHeight: 50,
  },
  input: { flex: 1, fontFamily: "NexaBold", fontSize: 14, color: C.text, paddingVertical: 12 },

  btn: { borderRadius: 18, overflow: "hidden", marginTop: 24, elevation: 4, shadowColor: C.blue, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  btnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  btnText: { fontFamily: "NexaBold", fontSize: 15, color: "#fff" },

  infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20 },
  infoText: { fontFamily: "NexaLight", fontSize: 11.5, color: C.muted },
}); }
