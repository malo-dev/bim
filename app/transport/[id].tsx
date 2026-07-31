import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { useAppTheme } from "@/app/_layout";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Modal from "react-native-modal";

const transports = [
  { id: "1", title: "Taxi", icon: "car-outline" },
  { id: "2", title: "Moto", icon: "bicycle-outline" },
  { id: "3", title: "Bus", icon: "bus-outline" },
];

export default function TransportPage() {
  const { isDark } = useAppTheme();
  const [showPopup, setShowPopup] = useState(true);

  // Popup s'ouvre automatiquement
  useEffect(() => {
    setShowPopup(true);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#0B1220" : "#F5F6FA" }]}>

      {/* HEADER */}
      <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>
        <Text style={styles.headerTitle}>Transport</Text>
      </LinearGradient>

      {/* LISTE */}
      <FlatList
        data={transports}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <BlurView intensity={80} tint="light" style={styles.card}>
            <LinearGradient
              colors={["#302E99", "#3906C7"]}
              style={StyleSheet.absoluteFill}
            />

            <Ionicons name={item.icon} size={38} color="white" />
            <Text style={styles.cardTitle}>{item.title}</Text>
          </BlurView>
        )}
      />

      {/* POPUP AUTOMATIQUE */}
      <Modal isVisible={showPopup}>
        <View style={[styles.popupBox, { backgroundColor: isDark ? "#1A2540" : "white" }]}>

          <Text style={[styles.popupTitle, { color: isDark ? "#EAF0FF" : "#1A1C1C" }]}>
            Que voulez-vous faire ?
          </Text>

          <TouchableOpacity
            style={styles.optionBtn}
            onPress={() => setShowPopup(false)}
          >
            <Ionicons name="car-sport-outline" size={22} color="white" />
            <Text style={styles.optionText}>Louer un véhicule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionBtn}
            onPress={() => setShowPopup(false)}
          >
            <Ionicons name="navigate-outline" size={22} color="white" />
            <Text style={styles.optionText}>Commander un taxi</Text>
          </TouchableOpacity>

        </View>
      </Modal>

    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },

  header: {
    padding: 35,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
  },

  headerTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
  },

  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    alignItems: "center",
    overflow: "hidden",
  },

  cardTitle: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
  },

  popupBox: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 25,
  },

  popupTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },

  optionBtn: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#302E99",
    padding: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  optionText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
});
