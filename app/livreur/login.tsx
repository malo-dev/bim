import { C, Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLoginLivreurMutation } from "@/services/livreurService";

function useTheme() {
  const isDark = useColorScheme() === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

export default function LivreurLoginScreen() {
  const router = useRouter();
  const { isDark, t } = useTheme();
  const [loginLivreur, { isLoading }] = useLoginLivreurMutation();

  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !pass.trim()) {
      Alert.alert("Champs requis", "Veuillez renseigner votre email et mot de passe livreur.");
      return;
    }
    const res = await loginLivreur({ email: email.trim().toLowerCase(), password: pass });
    if (res.error) {
      const msg = res.error.data?.message || "Identifiants incorrects";
      Alert.alert("Connexion échouée", msg);
      return;
    }
    const { token, user, livreur } = res.data;
    await AsyncStorage.setItem("livreurToken", token);
    await AsyncStorage.setItem("livreurId", String(livreur.livreurId));
    await AsyncStorage.setItem("livreurUser", JSON.stringify({ ...user, livreur }));
    router.replace("/livreur/space");
  }

  return (
    <View style={[s.root, { backgroundColor: t.background }]}>
      {/* Header */}
      <View style={s.header}>
        <LinearGradient colors={["#302E99", "#0353CC"]} style={StyleSheet.absoluteFill} />
        <View style={s.deco1} />
        <View style={s.deco2} />
        <SafeAreaView edges={["top"]}>
          <View style={s.topBar}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={C.white} />
            </TouchableOpacity>
          </View>
          <View style={s.headerBody}>
            <View style={s.bikeIcon}>
              <Ionicons name="bicycle" size={34} color={C.white} />
            </View>
            <Text style={s.headerTitle}>Espace Livreur</Text>
            <Text style={s.headerSub}>Connectez-vous avec votre mot de passe livreur</Text>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">

          <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>

            <Text style={[s.label, { color: t.text }]}>Email BIM NEXT</Text>
            <View style={[s.inputWrap, { backgroundColor: isDark ? "#1E2A3A" : "#F4F6FA", borderColor: t.border }]}>
              <Ionicons name="mail-outline" size={18} color={C.muted} style={{ marginRight: 8 }} />
              <TextInput
                style={[s.input, { color: t.text }]}
                placeholder="votre@email.com"
                placeholderTextColor={C.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={[s.label, { color: t.text, marginTop: 16 }]}>Mot de passe livreur</Text>
            <View style={[s.inputWrap, { backgroundColor: isDark ? "#1E2A3A" : "#F4F6FA", borderColor: t.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={C.muted} style={{ marginRight: 8 }} />
              <TextInput
                style={[s.input, { color: t.text }]}
                placeholder="Mot de passe reçu par email"
                placeholderTextColor={C.muted}
                value={pass}
                onChangeText={setPass}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[s.btn, { opacity: isLoading ? 0.7 : 1 }]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient colors={["#302E99", "#0353CC"]} style={s.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="bicycle" size={18} color={C.white} style={{ marginRight: 8 }} />
                <Text style={s.btnText}>{isLoading ? "Connexion…" : "Accéder à mon espace"}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={s.applyLink} onPress={() => router.push("/livreur/apply")}>
              <Text style={[s.applyTxt, { color: C.primary }]}>
                Pas encore livreur ? Soumettre ma candidature
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    overflow: "hidden",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 12,
    shadowColor: "#0353CC",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  deco1: {
    position: "absolute", width: 180, height: 180,
    borderRadius: 90, backgroundColor: "rgba(255,255,255,0.06)",
    top: -50, right: -40,
  },
  deco2: {
    position: "absolute", width: 120, height: 120,
    borderRadius: 60, backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -20, left: 20,
  },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  headerBody: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8 },
  bikeIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  headerTitle: { fontFamily: "NexaBold", fontSize: 26, color: C.white, letterSpacing: 1 },
  headerSub: { fontFamily: "NexaLight", fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4, textAlign: "center" },
  body: { padding: 20, paddingTop: 24 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, elevation: 2 },
  label: { fontFamily: "NexaBold", fontSize: 13, marginBottom: 8 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  input: { flex: 1, fontFamily: "NexaLight", fontSize: 14 },
  btn: { marginTop: 24, borderRadius: 14, overflow: "hidden" },
  btnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16 },
  btnText: { fontFamily: "NexaBold", fontSize: 15, color: C.white },
  applyLink: { alignItems: "center", marginTop: 16 },
  applyTxt: { fontFamily: "NexaLight", fontSize: 13 },
});
