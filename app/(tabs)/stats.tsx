import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const allTransactions = [
  { id: "1", amount: 50, date: "2026-01-25", status: "réussi", description: "Paiement reçu" },
  { id: "2", amount: 120, date: "2026-01-25", status: "échoué", description: "Paiement échoué" },
  { id: "3", amount: 30, date: "2026-01-24", status: "réussi", description: "Paiement reçu" },
  { id: "4", amount: 80, date: "2026-01-23", status: "réussi", description: "Paiement reçu" },
  { id: "5", amount: 45, date: "2026-01-22", status: "échoué", description: "Paiement échoué" },
  { id: "6", amount: 70, date: "2026-01-21", status: "réussi", description: "Paiement reçu" },
  { id: "7", amount: 90, date: "2026-01-20", status: "réussi", description: "Paiement reçu" },
  { id: "8", amount: 20, date: "2026-01-19", status: "échoué", description: "Paiement échoué" },
  { id: "9", amount: 110, date: "2026-01-18", status: "réussi", description: "Paiement reçu" },
  { id: "10", amount: 35, date: "2026-01-17", status: "réussi", description: "Paiement reçu" },
];

export default function Stats() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"toutes" | "réussi" | "échoué">("toutes");

  const filteredTransactions = allTransactions
    .filter((t) => (filterStatus === "toutes" ? true : t.status === filterStatus))
    .filter((t) => t.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const totalReceived = allTransactions
    .filter((t) => t.status === "réussi")
    .reduce((sum, t) => sum + t.amount, 0);

  const pieData = [
    {
      name: "Réussies",
      population: allTransactions.filter((t) => t.status === "réussi").length,
      color: "green",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Échouées",
      population: allTransactions.filter((t) => t.status === "échoué").length,
      color: "red",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
  ];

  const monthData: Record<string, number> = {};
  allTransactions.forEach((t) => {
    const month = t.date.slice(0, 7);
    if (!monthData[month]) monthData[month] = 0;
    monthData[month] += t.amount;
  });
  const barLabels = Object.keys(monthData);
  const barValues = Object.values(monthData);

  // On met les charts et filtres dans le header du FlatList
  const ListHeader = () => (
    <>
      {/* HEADER */}
      <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>
        <View style={styles.headerRow}>
          <Ionicons
            name="arrow-back"
            size={26}
            color="white"
            onPress={() => router.back()}
          />
          <Text style={styles.headerTitle}>Statistiques</Text>
          <View style={{ width: 26 }} />
        </View>
      </LinearGradient>

      {/* TOTAL ECoins */}
      <View style={styles.statsBox}>
        <Text style={styles.statsLabel}>Total Ecoins reçus</Text>
        <Text style={styles.statsValue}>{totalReceived} Ecoins</Text>
      </View>

      {/* PIE CHART */}
      <View style={styles.chartBox}>
        <Text style={styles.chartTitle}>Transactions Réussies / Échouées</Text>
        <PieChart
          data={pieData}
          width={screenWidth - 40}
          height={200}
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            color: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>

      {/* BAR CHART */}
      <View style={styles.chartBox}>
        <Text style={styles.chartTitle}>Transactions par mois</Text>
        <BarChart
          data={{ labels: barLabels, datasets: [{ data: barValues }] }}
          width={screenWidth - 40}
          height={220}  yAxisLabel=""
          yAxisSuffix=""
          
          fromZero
          chartConfig={{
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(48,46,153, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
            style: { borderRadius: 16 },
          }}
          style={{ borderRadius: 16 }}
        />
      </View>

      {/* FILTRE ET RECHERCHE */}
      <View style={styles.filterBox}>
        <TextInput
          placeholder="Rechercher une transaction..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />

        <View style={styles.filterButtons}>
          {["toutes", "réussi", "échoué"].map((status) => (
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
        </View>
      </View>
    </>
  );

  return (
    <FlatList
      data={filteredTransactions}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 140 }}
      ListHeaderComponent={ListHeader}
      renderItem={({ item }) => (
        <View style={styles.transactionItem}>
          <View>
            <Text style={styles.transactionDesc}>{item.description}</Text>
            <Text style={styles.transactionDate}>{item.date}</Text>
          </View>
          <Text
            style={{
              color: item.status === "réussi" ? "green" : "red",
              fontWeight: "700",
            }}
          >
            {item.amount} Ecoins
          </Text>
        </View>
      )}
    />
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { color: "white", fontSize: 22, fontWeight: "700" },
  statsBox: { backgroundColor: "white", margin: 20, borderRadius: 18, padding: 20, alignItems: "center", elevation: 4 },
  statsLabel: { color: "#555", fontSize: 16 },
  statsValue: { fontSize: 28, fontWeight: "700", marginTop: 5, color: "#302E99" },
  chartBox: { backgroundColor: "white", marginHorizontal: 20, marginVertical: 10, borderRadius: 18, padding: 15, alignItems: "center", elevation: 4 },
  chartTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  filterBox: { marginHorizontal: 12, marginTop: 20 },
  searchInput: { backgroundColor: "#EEE", borderRadius: 12, paddingHorizontal: 12, height: 45, marginBottom: 10, color: "#000" },
  filterButtons: { flexDirection: "row", justifyContent: "space-between" },
  filterButton: { flex: 1, paddingVertical: 10, marginHorizontal: 5, borderRadius: 12, alignItems: "center" },
  transactionItem: { flexDirection: "row", justifyContent: "space-between", padding: 12, borderBottomWidth: 1, borderBottomColor: "#EEE" },
  transactionDesc: { fontSize: 15, fontWeight: "600" },
  transactionDate: { fontSize: 13, color: "#888", marginTop: 3 },
});
