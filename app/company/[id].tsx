import { sectors } from "@/assets/mockdata/slidersOnboarding.mock";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";


export default function ServiceDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const sector = sectors.find((item) => item?.id === id);

  if (!sector) {
    return (
      <View style={styles.center}>
        <Text>Secteur introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <Image source={{ uri: sector.logo }} style={styles.headerIcon} />
        <Text style={styles.title}>{sector.name}</Text>
        <Text style={styles.subtitle}>{sector.description}</Text>
      </View>

      {/* ===== LISTE ENTREPRISES ===== */}
      <FlatList
        data={sector.companies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <View style={styles.card}>

            <Image source={{ uri: item.logo }} style={styles.logo} />

            <View style={{ flex: 1 }}>
              <Text style={styles.companyName}>{item.name}</Text>
              <Text style={styles.companyDesc}>{item.description}</Text>

              <TouchableOpacity
                style={styles.btn}
                onPress={() =>
                  router.push(`/company/${item.id}`)
                }
              >
                <Text style={styles.btnText}>Lire plus</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}
      />

    </View>
  );
}

// ================== STYLES ==================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
    padding: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 25,
  },

  headerIcon: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },

  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#aaa",
    textAlign: "center",
    marginTop: 5,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#121A2F",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    gap: 12,
  },

  logo: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },

  companyName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  companyDesc: {
    color: "#aaa",
    fontSize: 13,
    marginVertical: 4,
  },

  btn: {
    backgroundColor: "#4F46E5",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
  },

  btnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
