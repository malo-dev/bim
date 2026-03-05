import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const screenWidth = Dimensions.get("window").width;

// Fake historique complet
const allHistory = [
  { id: "1", type: "Transaction", amount: 50, date: "2026-01-25", status: "réussi", description: "Paiement reçu" },
  { id: "2", type: "Transaction", amount: 120, date: "2026-01-25", status: "échoué", description: "Paiement échoué" },
  { id: "3", type: "Profil", action: "Modification de profil", date: "2026-01-24", status: "réussi" },
  { id: "4", type: "Connexion", action: "Connexion réussie", date: "2026-01-23", status: "réussi" },
  { id: "5", type: "Transaction", amount: 45, date: "2026-01-22", status: "échoué", description: "Paiement échoué" },
  { id: "6", type: "Recharge", amount: 70, date: "2026-01-21", status: "réussi", description: "Recharge Ecoins" },
  { id: "7", type: "Retrait", amount: 90, date: "2026-01-20", status: "réussi", description: "Retrait Ecoins" },
  { id: "8", type: "Connexion", action: "Déconnexion", date: "2026-01-19", status: "réussi" },
  { id: "9", type: "Transaction", amount: 110, date: "2026-01-18", status: "réussi", description: "Paiement reçu" },
  { id: "10", type: "Transaction", amount: 35, date: "2026-01-17", status: "réussi", description: "Paiement reçu" },
];

export default function Historique() {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"Toutes" | "Transaction" | "Profil" | "Connexion" | "Recharge" | "Retrait">("Toutes");
  const [filterStatus, setFilterStatus] = useState<"toutes" | "réussi" | "échoué">("toutes");

  const filteredHistory = allHistory
    .filter((h) => filterType === "Toutes" ? true : h.type === filterType)
    .filter((h) => filterStatus === "toutes" ? true : h.status === filterStatus)
    .filter((h) => (h.description?.toLowerCase() || h.action?.toLowerCase() || "").includes(search.toLowerCase()))
    .sort((a,b) => a.date < b.date ? 1 : -1);

  const ListHeader = () => (
    <View>
      {/* HEADER */}
      <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>
        <View style={styles.headerRow}>
          <Ionicons name="arrow-back" size={26} color="white" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>{tr("history.title")}</Text>
          <View style={{ width: 26 }} />
        </View>
      </LinearGradient>

      {/* RECHERCHE */}
      <View style={styles.filterBox}>
        <TextInput
          placeholder={tr("history.searchPH")}
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* FILTRE TYPE */}
      <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  }}
>
  {(
    [
      { value: "Toutes",      label: tr("history.all")         },
      { value: "Transaction", label: tr("history.transaction")  },
      { value: "Profil",      label: tr("history.profile")      },
      { value: "Connexion",   label: tr("history.connection")   },
      { value: "Recharge",    label: tr("history.recharge")     },
      { value: "Retrait",     label: tr("history.retrait")      },
    ] as { value: typeof filterType; label: string }[]
  ).map(({ value, label }) => (
    <TouchableOpacity
      key={value}
      onPress={() => setFilterType(value)}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: filterType === value ? "#302E99" : "#EEE",
      }}
    >
      <Text
        style={{
          color: filterType === value ? "white" : "#333",
          fontWeight: "600",
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>

      {/* FILTRE STATUS */}
      <View style={{display:'flex', flexDirection:'row',alignItems:'center'}}>

        {/* <View style={[styles.filterButtons, { marginTop: 10 }]}>
        {["toutes","réussi","échoué"].map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => setFilterStatus(status as any)}
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  filterStatus === status
                    ? status === "réussi"
                      ? "green"
                      : status === "échoué"
                      ? "red"
                      : "#302E99"
                    : "#EEE",
              },
            ]}
          >
            <Text
              style={{
                color:
                  filterStatus === status
                    ? "white"
                    : status === "réussi"
                    ? "green"
                    : status === "échoué"
                    ? "red"
                    : "#333",
                fontWeight: "600",
              }}
            >
              {status === "toutes" ? "Toutes" : status === "réussi" ? "Réussi" : "Échoué"}
            </Text>
          </TouchableOpacity>
        ))}
      </View> */}

       {/* <AntDesign name="filter" size={24} color="black" /> */}
      </View>

    </View>
  );

  return (
    <FlatList
      data={filteredHistory}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={ListHeader}
      contentContainerStyle={{ paddingBottom: 40}}
      renderItem={({ item }) => (
        <View style={styles.historyItem}>
          <View>
            <Text style={styles.historyType}>{item.type}</Text>
            <Text style={styles.historyDesc}>{item.description || item.action}</Text>
            <Text style={styles.historyDate}>{item.date}</Text>
          </View>
          {item.amount && (
            <Text
              style={{
                color: item.status === "réussi" ? "green" : "red",
                fontWeight: "700",
              }}
            >
              {item.amount} Ecoins
            </Text>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },
  header: { paddingTop: 60, paddingBottom: 30,paddingHorizontal:15,  borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { color: "white", fontSize: 22, fontWeight: "700" },
  filterBox: { marginTop: 20,paddingHorizontal:10 },
  searchInput: { backgroundColor: "#EEE", borderRadius: 12, paddingHorizontal: 15, height: 45, marginBottom: 10, color: "#000" },
  filterButtons: { flexDirection: "row", justifyContent: "space-between", overflowX:'scroll' },
  filterButton: { flex: 1, paddingVertical: 10, margin: 5, borderRadius: 12, alignItems: "center" },
  historyItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12,paddingHorizontal:12, borderBottomWidth: 1, borderBottomColor: "#EEE" },
  historyType: { fontSize: 14, fontWeight: "700", color: "#302E99" },
  historyDesc: { fontSize: 15, fontWeight: "600", marginTop: 2 },
  historyDate: { fontSize: 13, color: "#888", marginTop: 2 },
});
