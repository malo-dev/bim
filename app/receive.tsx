import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useAppTheme } from "@/app/_layout";

/* ─── PALETTE ─────────────────────────────────────────────────────────── */
const LIGHT = {
  bg: "#F5F6FA",
};
const DARK = {
  bg: "#0B1220",
};

function mkS(C: typeof LIGHT) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: {
      paddingBottom: 30,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    headerRow: {
      marginTop: 60,
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: { color: "white", fontSize: 22, fontWeight: "700" },
    card: {
      margin: 20,
      padding: 30,
      borderRadius: 25,
      alignItems: "center",
      overflow: "hidden",
      marginTop: 40,
    },
    qrContainer: { marginTop: 20, alignItems: "center" },
  });
}

export default function QRPage() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);

  const user = {
    id: "USER12345",
    bimAccount: "BIM-908776",
  };

  const qrValue = JSON.stringify({
    userId: user.id,
    bimAccount: user.bimAccount,
  });

  return (
    <View style={s.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ===== HEADER ===== */}
      <LinearGradient colors={["#302E99", "#3906C7"]} style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

          <Text style={s.title}>Montrer QR Code</Text>

          <TouchableOpacity onPress={() => router.push("/notification")}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ===== CARD QR ===== */}
      <BlurView intensity={80} tint="light" style={s.card}>
        <LinearGradient colors={["#302E99", "#3906C7"]} style={StyleSheet.absoluteFillObject} />

        <Ionicons name="qr-code-outline" size={60} color="white" />

        <View style={s.qrContainer}>
          <QRCode value={qrValue} size={220} />
        </View>
      </BlurView>
    </View>
  );
}
