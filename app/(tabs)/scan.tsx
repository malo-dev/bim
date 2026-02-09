import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import QRCode from "react-native-qrcode-svg";

export default function IMTransport() {
  const router = useRouter();

  const user = {
    id: "USER12345",
    bimAccount: "BIM-908776",
  };

  const transactions = [
    { id: "1", name: "Jean Paul", amount: "50 Ecoins", date: "2026-01-25", status: "réussi" },
    { id: "2", name: "Sarah M.", amount: "120 Ecoins", date: "2026-01-25", status: "échoué" },
    { id: "3", name: "Patrick K.", amount: "30 Ecoins", date: "2026-01-24", status: "réussi" },
    { id: "4", name: "Aline B.", amount: "80 Ecoins", date: "2026-01-23", status: "réussi" },
    { id: "5", name: "David T.", amount: "45 Ecoins", date: "2026-01-22", status: "échoué" },
    { id: "6", name: "Grace L.", amount: "70 Ecoins", date: "2026-01-21", status: "réussi" },
    { id: "7", name: "Mickael P.", amount: "90 Ecoins", date: "2026-01-20", status: "réussi" },
    { id: "8", name: "Rose K.", amount: "20 Ecoins", date: "2026-01-19", status: "échoué" },
    { id: "9", name: "Eric M.", amount: "110 Ecoins", date: "2026-01-18", status: "réussi" },
    { id: "10", name: "Linda A.", amount: "35 Ecoins", date: "2026-01-17", status: "réussi" },
  ];

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"tout" | "réussi" | "échoué">("tout");
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<"success" | "error" | null>(null);

  const qrValue = JSON.stringify({
    userId: user.id,
    bimAccount: user.bimAccount,
  });

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "tout" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusFilters = ["tout", "réussi", "échoué"];

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="white" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Mes transactions</Text>

          <TouchableOpacity onPress={() => router.push("/notification")}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* QR CODE CARD */}
      <BlurView intensity={80} tint="light" style={styles.qrCard}>
        <LinearGradient
          colors={["#302E99", "#3906C7"]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.qrTitle}>Mon QR Code</Text>
        <QRCode value={qrValue} size={190} />
      </BlurView>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          placeholder="Rechercher..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* STATUS FILTER */}
      <View style={styles.filterRow}>
        {statusFilters.map((item) => {
          const isActive = filterStatus === item;
          return (
            <TouchableOpacity
              key={item}
              onPress={() => setFilterStatus(item as any)}
              style={[
                styles.filterBtn,
                {
                  backgroundColor: isActive ? (item === "réussi" ? "green" : item === "échoué" ? "red" : "#302E99") : "#DDD",
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isActive ? "white" : "#000" },
                ]}
              >
                {item === "tout" ? "Tout" : item === "réussi" ? "Réussi" : "Échoué"}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* BOUTON ANNULER */}
        <TouchableOpacity
          onPress={() => setFilterStatus("tout")}
          style={[styles.filterBtn, { backgroundColor: "#AAA" }]}
        >
          <Text style={[styles.filterText, { color: "white" }]}>Annuler</Text>
        </TouchableOpacity>
      </View>

      {/* TRANSACTIONS */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <View style={styles.trxItem}>
            <View>
              <Text style={styles.trxName}>{item.name}</Text>
              <Text style={styles.trxDate}>{item.date}</Text>
            </View>

            <Text
              style={[
                styles.trxAmount,
                { color: item.status === "réussi" ? "green" : "red" },
              ]}
            >
              {item.amount}
            </Text>
          </View>
        )}
      />

      {/* RESULT MODAL */}
      <Modal isVisible={!!result} onBackdropPress={() => setResult(null)}>
        <View style={styles.modalBox}>
          <Ionicons
            name={result === "success" ? "checkmark-circle" : "close-circle"}
            size={60}
            color={result === "success" ? "green" : "red"}
          />
          <Text style={styles.resultText}>
            {result === "success"
              ? "Paiement reçu avec succès"
              : "Erreur de paiement"}
          </Text>
        </View>
      </Modal>
         <View style={{height:100}}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },

  header: {
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  headerRow: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: { color: "white", fontSize: 20, fontWeight: "700" },

  qrCard: {
    margin: 20,
    padding: 25,
    borderRadius: 25,
    alignItems: "center",
    overflow: "hidden",
  },

  qrTitle: { color: "white", fontWeight: "700", marginBottom: 12 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  searchInput: { marginLeft: 8, flex: 1 },

  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
    marginHorizontal: 20,
  },

  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  filterText: { fontWeight: "600" },

  trxItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#EEE",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },

  trxName: { fontWeight: "700" },

  trxDate: { color: "#777", fontSize: 12 },

  trxAmount: { fontWeight: "700" },

  modalBox: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
  },

  resultText: { marginTop: 10, fontWeight: "600" },
});
