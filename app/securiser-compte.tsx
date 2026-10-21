import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/app/_layout";
import { useSecureMyAccountMutation } from "@/services/authService";

const LIGHT = { bg: "#FFFFFF", card: "#F8FAFE", text: "#1A1C1C", textSub: "#5B5E70", border: "#E2E2E2", primary: "#0035C5", red: "#EF4444" };
const DARK: typeof LIGHT = { bg: "#0B1220", card: "#0F1A2E", text: "#EAF0FF", textSub: "#A3B4D0", border: "rgba(31,42,68,0.8)", primary: "#4D8DFF", red: "#F87171" };

export default function SecuriserCompteScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [secureMyAccount, { isLoading }] = useSecureMyAccountMutation();

  const handleSubmit = async () => {
    if (password.trim().length < 4) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 4 caractères.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Erreur", "Les deux mots de passe ne correspondent pas.");
      return;
    }
    try {
      await secureMyAccount(password.trim()).unwrap();
      Alert.alert("✅ Compte sécurisé", "Votre mot de passe a été changé.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Erreur", e?.data?.message || "Impossible de changer le mot de passe.");
    }
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.title}>Sécuriser mon compte</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <View style={s.body}>
        <View style={s.iconWrap}>
          <Ionicons name="shield-checkmark" size={28} color={C.red} />
        </View>
        <Text style={s.heading}>Protégez votre compte</Text>
        <Text style={s.sub}>
          Choisissez un nouveau mot de passe. Il vous sera demandé pour vous connecter avec votre email, en plus de votre numéro de téléphone.
        </Text>

        <View style={s.inputCard}>
          <Text style={s.label}>NOUVEAU MOT DE PASSE</Text>
          <TextInput
            style={s.input}
            placeholder="••••••••"
            placeholderTextColor={C.textSub}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoFocus
          />
        </View>

        <View style={[s.inputCard, { marginTop: 12 }]}>
          <Text style={s.label}>CONFIRMER LE MOT DE PASSE</Text>
          <TextInput
            style={s.input}
            placeholder="••••••••"
            placeholderTextColor={C.textSub}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity style={[s.submitBtn, isLoading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Changer le mot de passe</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function mkS(C: typeof LIGHT) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },
    topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
    title: { fontFamily: "NexaBold", fontSize: 16, color: C.text },
    body: { flex: 1, padding: 24, alignItems: "center" },
    iconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(239,68,68,0.1)", alignItems: "center", justifyContent: "center", marginTop: 10 },
    heading: { fontFamily: "NexaBold", fontSize: 18, color: C.text, marginTop: 14, textAlign: "center" },
    sub: { fontFamily: "NexaLight", fontSize: 12.5, color: C.textSub, textAlign: "center", marginTop: 8, lineHeight: 19, paddingHorizontal: 10 },
    inputCard: { width: "100%", backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, marginTop: 24 },
    label: { fontFamily: "NexaBold", fontSize: 10, color: C.textSub, letterSpacing: 1 },
    input: { fontFamily: "NexaBold", fontSize: 15, color: C.text, marginTop: 6, padding: 0 },
    submitBtn: { width: "100%", height: 54, borderRadius: 18, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", marginTop: 26 },
    submitText: { fontFamily: "NexaBold", fontSize: 14, color: "#fff" },
  });
}
