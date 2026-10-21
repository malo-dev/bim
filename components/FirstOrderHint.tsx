import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppTheme } from "@/app/_layout";

const LIGHT = { bg: "#0035C5", text: "#FFFFFF", sub: "rgba(255,255,255,0.85)" };
const DARK  = { bg: "#4D8DFF", text: "#FFFFFF", sub: "rgba(255,255,255,0.85)" };

// Affiché une seule fois, juste après la création d'un nouveau compte
// "rapide" (jamais après une récupération de compte existant) — pour guider
// vers la première commande sans ajouter d'étape supplémentaire.
export default function FirstOrderHint() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("firstOrderHintPending").then(v => setVisible(v === "true"));
  }, []);

  const dismiss = async () => {
    await AsyncStorage.removeItem("firstOrderHintPending");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <View style={s.banner}>
      <Ionicons name="sparkles-outline" size={20} color={C.text} />
      <View style={{ flex: 1 }}>
        <Text style={s.title}>Tu viens de terminer la première étape ! 🎉</Text>
        <Text style={s.sub}>Touche un produit ci-dessous pour passer ta première commande.</Text>
      </View>
      <TouchableOpacity onPress={dismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={18} color={C.text} />
      </TouchableOpacity>
    </View>
  );
}

function mkS(C: typeof LIGHT) { return StyleSheet.create({
  banner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: C.bg, borderRadius: 18,
    marginHorizontal: 20, marginBottom: 14, padding: 14,
  },
  title: { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  sub:   { fontFamily: "NexaLight", fontSize: 12, color: C.sub, marginTop: 2, lineHeight: 16 },
}); }
