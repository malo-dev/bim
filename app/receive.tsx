import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function QRPage() {
  const router = useRouter();

  // Fake user data
  const user = {
    id: "USER12345",
    bimAccount: "BIM-908776"
  };

  const qrValue = JSON.stringify({
    userId: user.id,
    bimAccount: user.bimAccount
  });

  return (
    <View style={styles.container}>
      {/* ===== HEADER ===== */}
      <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

          <Text style={styles.title}>Montrer QR Code</Text>

          {/* Ici tu peux mettre un bouton notification ou scanner si tu veux */}
           <TouchableOpacity onPress={() => router.push('/notification')}>
                      <Ionicons name="notifications-outline" size={24} color="white" />
                    </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ===== CARD QR ===== */}
      <BlurView intensity={80} tint="light" style={styles.card}>
        <LinearGradient colors={["#302E99", "#3906C7"]} style={StyleSheet.absoluteFillObject} />

        <Ionicons name="qr-code-outline" size={60} color="white" />

        <View style={styles.qrContainer}>
          <QRCode value={qrValue} size={220} />
        </View>
      </BlurView>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },

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
