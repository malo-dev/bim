import { sectors } from "@/assets/mockdata/slidersOnboarding.mock";
import { ThemedText } from "@/components/themed-text";
import CompanyCard from "@/components/ui/CompanyCard";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  View,
} from "react-native";







export default function Reseaux() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredCompanies = sectors.filter((c) =>
    c?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* ===== HEADER ===== */}
      <LinearGradient
        colors={["#302E99", "#3906C7"]}
        style={styles.header}
      >
        <ThemedText style={styles.headerTitle}>
          Réseaux BIM
        </ThemedText>

        <ThemedText style={styles.headerSubtitle}>
          Découvrez les entreprises partenaires
        </ThemedText>

        {/* SEARCH BAR */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#777" />
          <TextInput
            placeholder="Rechercher une entreprise..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
            style={styles.input}
          />
        </View>
      </LinearGradient>

      {/* ===== LIST ===== */}
      <FlatList
        data={filteredCompanies}
        keyExtractor={(item) => String(item?.id)+String(item?.name)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CompanyCard
            name={String(item?.name)}
            description={String(item?.description)}
            logo={String(item?.logo)}
            onPress={() =>
                  router.push(`/service/${item?.id}`)
                }
          />
        )}
      />

         <View style={{height:100}}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },

  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  headerTitle: {
    color: "white",
    fontSize: 26,
    fontFamily: "InterSemiBold",
  },

  headerSubtitle: {
    color: "#DDD",
    marginTop: 5,
    marginBottom: 20,
  },
  

  searchBox: {
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    marginLeft: 10,
    flex: 1,
    color: "#000",
  },

  list: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
});
