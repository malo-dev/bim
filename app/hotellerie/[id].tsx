// app/hotellerie/[id].tsx
import { companiesHotellerie } from "@/assets/mockdata/bimHotel.mok";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function BimHotelDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // 🔍 Trouver hôtel via ID
  const company = companiesHotellerie.find((item) => item.id === id);

  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("nuit");
  const [number, setNumber] = useState("");

  if (!company) {
    return (
      <View style={styles.center}>
        <Text>Hôtel introuvable</Text>
      </View>
    );
  }

  const total = selectedRoom ? Number(quantity) * selectedRoom.price : 0;

  const handlePay = () => {
    if (!number) {
      Alert.alert("Erreur", "Entrez un numéro valide");
      return;
    }

    setModalVisible(false);

    setTimeout(() => {
      const success = Math.random() > 0.3;

      if (success) {
        Alert.alert("Succès 🎉", "Réservation réussie !");
      } else {
        Alert.alert("Échec ❌", "Réservation refusée");
      }
    }, 1000);
  };

  return (
    <ScrollView style={styles.container}>
      {/* ===== HEADER ===== */}
      <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

          <Text style={styles.title}>{company.name}</Text>

          <TouchableOpacity onPress={() => router.push("/notification")}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <Image source={{ uri: company.logo }} style={styles.logo} />
        <Text style={styles.desc}>{company.description}</Text>
      </LinearGradient>

      {/* ===== LISTE CHAMBRES ===== */}
      <View style={styles.list}>
        <FlatList
          data={company.products}
          keyExtractor={(item) => item.id}
          numColumns={1} // 1 colonne pour hôtel
          scrollEnabled={false}
          renderItem={({ item }) => (
            <BlurView intensity={50} tint="light" style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>{item.price} Ecoins / nuit</Text>

              <TouchableOpacity
                style={styles.reserveBtn}
                onPress={() => {
                  setSelectedRoom(item);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.reserveText}>Réserver</Text>
              </TouchableOpacity>
            </BlurView>
          )}
        />
      </View>

      {/* ===== MODAL RÉSERVATION ===== */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{selectedRoom?.name}</Text>

            <TextInput
              placeholder="Nombre de nuits"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
              style={styles.input}
            />

            <TextInput
              placeholder="Unités (nuit)"
              value={unit}
              onChangeText={setUnit}
              style={styles.input}
            />

            <TextInput
              placeholder="Numéro BIM / Téléphone"
              value={number}
              onChangeText={setNumber}
              style={styles.input}
            />

            <Text style={styles.total}>Total : {total} Ecoins</Text>

            <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
              <Text style={styles.payText}>Payer & Réserver</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancel}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    alignItems: "center",
    paddingVertical: 35,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: "center",
  },

  logo: { width: 90, height: 90, marginVertical: 20, borderRadius: 45 },

  title: { color: "#fff", fontSize: 22, fontWeight: "700" },

  desc: { color: "#ddd", marginTop: 6, textAlign: "center", paddingHorizontal: 20 },

  list: { padding: 16 },

  card: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    marginBottom: 16,
    backdropFilter: "blur(10px)",
  },

  image: { width: "100%", height: 150, borderRadius: 12 },

  name: { fontWeight: "600", textAlign: "center", marginTop: 8, fontSize: 16 },

  price: { color: "#302E99", marginVertical: 4, fontWeight: "700" },

  reserveBtn: {
    backgroundColor: "#302E99",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 8,
  },

  reserveText: { color: "#fff", fontWeight: "700" },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 20,
    padding: 20,
  },

  modalTitle: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 10 },

  input: {
    backgroundColor: "#F1F1F1",
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginTop: 10,
  },

  total: { fontWeight: "700", marginTop: 10, textAlign: "center" },

  payBtn: {
    backgroundColor: "#302E99",
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },

  payText: { color: "#fff", fontWeight: "700" },

  cancel: { color: "red", textAlign: "center", marginTop: 10 },
});
