import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/app/_layout";
import { useChauffeurAccessMutation } from "@/services/chauffeurService";
import { persistAuthSession } from "@/utils/authSession.utils";

const LIGHT = {
  bg: "#F8FAFC", primary: "#0062FF", primaryDeep: "#004ECC",
  text: "#0F172A", textSub: "#475569", textMut: "#64748B",
  card: "#FFFFFF", border: "#E2E8F0", white: "#FFFFFF",
  iconBtnBg: "rgba(0,98,255,0.08)",
};
const DARK: typeof LIGHT = {
  bg: "#0B1220", primary: "#3D7DFF", primaryDeep: "#0062FF",
  text: "#EAF0FF", textSub: "#A3B4D0", textMut: "#6B7A99",
  card: "#1A2540", border: "#1F2A44", white: "#FFFFFF",
  iconBtnBg: "rgba(61,125,255,0.14)",
};

export default function ChauffeurAccessScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const router = useRouter();

  const [code, setCode] = useState("");
  const [chauffeurAccess, { isLoading }] = useChauffeurAccessMutation();

  const handleSubmit = async () => {
    if (code.trim().length < 4) {
      Alert.alert("Code invalide", "Entrez le code à 6 chiffres donné par l'administration BIM.");
      return;
    }
    try {
      const res: any = await chauffeurAccess(code.trim()).unwrap();
      await persistAuthSession(res.token, res.refreshToken, { isQuickAccount: false });
      DeviceEventEmitter.emit("auth:loggedIn");
      router.replace("/transport/mode-chauffeur" as any);
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Code d'accès invalide.");
    }
  };

  return (
    <KeyboardAvoidingView style={[s.screen, { backgroundColor: C.bg }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={s.topBar}>
          <TouchableOpacity style={[s.iconBtn, { backgroundColor: C.iconBtnBg }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={s.body}>
        <View style={[s.iconWrap, { backgroundColor: C.primary }]}>
          <Ionicons name="key-outline" size={28} color="#fff" />
        </View>
        <Text style={[s.title, { color: C.text }]}>Code d'accès chauffeur</Text>
        <Text style={[s.sub, { color: C.textSub }]}>
          Entrez le code personnel donné par l'administration BIM pour accéder à l'Espace Chauffeur.
        </Text>

        <TextInput
          style={[s.input, { backgroundColor: C.card, borderColor: C.border, color: C.text }]}
          placeholder="••••••"
          placeholderTextColor={C.textMut}
          keyboardType="number-pad"
          maxLength={10}
          value={code}
          onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ""))}
          autoFocus
        />

        <TouchableOpacity
          style={[s.btn, { backgroundColor: C.primary, opacity: isLoading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.88}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Accéder</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, alignItems: "center", paddingHorizontal: 28, paddingTop: 40 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontFamily: "NexaBold", fontSize: 19, textAlign: "center" },
  sub: { fontFamily: "NexaLight", fontSize: 13, textAlign: "center", lineHeight: 19, marginTop: 8, marginBottom: 30, paddingHorizontal: 10 },
  input: { width: "100%", borderWidth: 1.5, borderRadius: 16, paddingVertical: 16, textAlign: "center", fontFamily: "NexaBold", fontSize: 22, letterSpacing: 6, marginBottom: 20 },
  btn: { width: "100%", borderRadius: 16, paddingVertical: 15, alignItems: "center" },
  btnText: { fontFamily: "NexaBold", fontSize: 15, color: "#fff" },
});
