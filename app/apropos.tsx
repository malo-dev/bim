import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Apropos() {
  const router = useRouter();

  // Fonction pour ouvrir le site web
  const openWebsite = async () => {
    const url = "https://bimreseau.com/";
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      alert("Impossible d'ouvrir le lien : " + url);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>À propos de BIM</Text>
          <View style={{ width: 28 }} /> {/* Placeholder pour aligner */}
        </View>
      </LinearGradient>

      {/* CONTENT */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>BIM Réseau</Text>
        <Text style={styles.sectionText}>
          BIM est un réseau d'entreprises et de partenaires qui facilite la collaboration et l'innovation à travers le digital. 
          Notre objectif est de connecter les acteurs du secteur et de proposer des solutions numériques performantes pour tous.
        </Text>

        <Text style={styles.sectionText}>
          Pour plus d'informations, visitez notre site web :
        </Text>

        <TouchableOpacity onPress={openWebsite}>
          <Text style={styles.websiteLink}>https://bimreseau.com/</Text>
        </TouchableOpacity>

        <Text style={styles.sectionText}>
          BIM vise à améliorer l'efficacité opérationnelle des entreprises partenaires, à renforcer la visibilité des produits et services, 
          et à créer un écosystème numérique sécurisé et collaboratif.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },

  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },

  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#302E99",
    marginBottom: 10,
  },

  sectionText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
    marginBottom: 12,
  },

  websiteLink: {
    fontSize: 14,
    color: "#3906C7",
    textDecorationLine: "underline",
    marginBottom: 20,
  },
});
