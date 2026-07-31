import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
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
import { SafeAreaView } from "react-native-safe-area-context";

import logo from "@/assets/images/logo.jpeg";
import { useLoginLivreurMutation } from "@/services/livreurService";
import { useAppTheme } from "@/app/_layout";

/* ─── PALETTES ───────────────────────────────────────────────────────── */
const LIGHT = {
  bg:             "#F8F9FF",
  primary:        "#0047FF",
  text:           "#1A1C1C",
  muted:          "#747688",
  input:          "#F4F6FF",
  border:         "#E8EDF5",
  white:          "#FFFFFF",
  cardBg:         "#FFFFFF",
  backBtnBg:      "#FFFFFF",
  inputFocusBg:   "#EEF4FF",
  iconFocusBg:    "#0047FF12",
  bikeTagBg:      "#0047FF12",
  logoBord:       "#C8D8FF",
  cardElev:       6,
  cardBord:       "transparent",
};
const DARK: typeof LIGHT = {
  bg:             "#0B1220",
  primary:        "#4D8DFF",
  text:           "#EAF0FF",
  muted:          "#6B7A99",
  input:          "#0F1A2E",
  border:         "rgba(31,42,68,0.80)",
  white:          "#FFFFFF",
  cardBg:         "#1A2540",
  backBtnBg:      "#1A2540",
  inputFocusBg:   "rgba(77,141,255,0.10)",
  iconFocusBg:    "rgba(77,141,255,0.15)",
  bikeTagBg:      "rgba(77,141,255,0.12)",
  logoBord:       "rgba(77,141,255,0.30)",
  cardElev:       0,
  cardBord:       "rgba(31,42,68,0.90)",
};

export default function LivreurLoginScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);

  const [loginLivreur, { isLoading }] = useLoginLivreurMutation();

  const [email,    setEmail]    = useState("");
  const [pass,     setPass]     = useState("");
  const [showPass, setShowPass] = useState(false);
  const [focused,  setFocused]  = useState<"email" | "pass" | null>(null);

  async function handleLogin() {
    if (!email.trim() || !pass.trim()) {
      Alert.alert("Champs requis", "Veuillez renseigner votre email et mot de passe livreur.");
      return;
    }
    const res = await loginLivreur({ email: email.trim().toLowerCase(), password: pass });
    if (res.error) {
      const msg = (res.error as any).data?.message || "Identifiants incorrects";
      Alert.alert("Connexion échouée", msg);
      return;
    }
    const { token, user, livreur } = res.data as any;
    await AsyncStorage.setItem("livreurToken", token);
    await AsyncStorage.setItem("livreurId", String(livreur.livreurId));
    await AsyncStorage.setItem("livreurUser", JSON.stringify({ ...user, livreur }));
    await AsyncStorage.setItem("livreurLastActivity", String(Date.now()));
    router.replace("/livreur/space");
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.bg} />

      <SafeAreaView style={s.topBar} edges={["top"]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo + titre */}
          <View style={s.logoArea}>
            <View style={s.logoWrap}>
              <Image source={logo} style={s.logo} resizeMode="contain" />
            </View>
            <View style={s.bikeTag}>
              <Ionicons name="bicycle" size={14} color={C.primary} />
              <Text style={s.bikeTagText}>Espace Livreur</Text>
            </View>
            <Text style={s.title}>Connexion Livreur</Text>
            <Text style={s.subtitle}>Connectez-vous avec votre mot de passe livreur</Text>
          </View>

          {/* Card */}
          <View style={s.card}>

            <Text style={s.label}>Email BIM NEXT</Text>
            <View style={[s.inputRow, focused === "email" && s.inputFocused]}>
              <View style={[s.iconBox, focused === "email" && s.iconBoxFocused]}>
                <Ionicons name="mail-outline" size={18} color={focused === "email" ? C.primary : C.muted} />
              </View>
              <TextInput
                style={s.input}
                placeholder="votre@email.com"
                placeholderTextColor={C.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
              />
            </View>

            <Text style={s.label}>Mot de passe livreur</Text>
            <View style={[s.inputRow, focused === "pass" && s.inputFocused]}>
              <View style={[s.iconBox, focused === "pass" && s.iconBoxFocused]}>
                <Ionicons name="lock-closed-outline" size={18} color={focused === "pass" ? C.primary : C.muted} />
              </View>
              <TextInput
                style={s.input}
                placeholder="Mot de passe reçu par email"
                placeholderTextColor={C.muted}
                value={pass}
                onChangeText={setPass}
                secureTextEntry={!showPass}
                onFocus={() => setFocused("pass")}
                onBlur={() => setFocused(null)}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={{ paddingRight: 12 }}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={isLoading} activeOpacity={0.88}>
              <Ionicons name="bicycle" size={18} color={C.white} />
              <Text style={s.btnText}>{isLoading ? "Connexion…" : "Accéder à mon espace"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.applyLink} onPress={() => router.push("/livreur/apply")}>
              <Text style={s.applyTxt}>Pas encore livreur ? Soumettre ma candidature</Text>
            </TouchableOpacity>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function mkS(C: typeof LIGHT) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  topBar:  { paddingHorizontal: 16, paddingTop: 4 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.backBtnBg,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.border,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.06,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },

  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },

  logoArea: { alignItems: "center", paddingTop: 24, marginBottom: 28 },
  logoWrap: {
    width: 90, height: 90, borderRadius: 24,
    backgroundColor: C.white,
    borderWidth: 2, borderColor: C.logoBord,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", elevation: 8,
    shadowColor: C.primary, shadowOpacity: 0.18,
    shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  logo: { width: 74, height: 74 },

  bikeTag: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.bikeTagBg, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    marginTop: 14,
  },
  bikeTagText: { fontFamily: "NexaBold", fontSize: 12, color: C.primary },

  title:    { fontFamily: "NexaBold", fontSize: 22, color: C.text, marginTop: 12, textAlign: "center" },
  subtitle: { fontFamily: "NexaRegular", fontSize: 13, color: C.muted, marginTop: 5, textAlign: "center" },

  card: {
    backgroundColor: C.cardBg,
    borderRadius: 28, padding: 22,
    elevation: C.cardElev,
    borderWidth: 1.5,
    borderColor: C.cardBord,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 16,
  },

  label: {
    fontFamily: "NexaRegular", fontSize: 11,
    color: C.muted, letterSpacing: 0.8,
    textTransform: "uppercase", marginBottom: 8,
  },

  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 18, height: 54,
    backgroundColor: C.input, marginBottom: 16,
    paddingRight: 4,
  },
  inputFocused: { borderColor: C.primary, backgroundColor: C.inputFocusBg },

  iconBox: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center",
    marginHorizontal: 6, backgroundColor: "transparent",
  },
  iconBoxFocused: { backgroundColor: C.iconFocusBg },

  input: { flex: 1, height: "100%", fontSize: 14, color: C.text, fontFamily: "NexaRegular" },

  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: C.primary, borderRadius: 18, height: 54,
    marginTop: 8,
    elevation: 4,
    shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  btnText: { fontFamily: "NexaBold", fontSize: 15, color: C.white, letterSpacing: 0.5 },

  applyLink: { alignItems: "center", marginTop: 16, padding: 6 },
  applyTxt:  { fontFamily: "NexaRegular", fontSize: 13, color: C.primary },
}); }
