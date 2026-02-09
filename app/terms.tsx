import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Terms() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Termes et Politique</Text>
          <View style={{ width: 28 }} /> {/* Placeholder pour aligner */}
        </View>
      </LinearGradient>

      {/* CONTENT */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>1. Acceptation des termes</Text>
        <Text style={styles.sectionText}>
          En utilisant l'application BIM, vous acceptez de respecter les termes et conditions décrits dans ce document.
        </Text>

        <Text style={styles.sectionTitle}>2. Politique de confidentialité</Text>
        <Text style={styles.sectionText}>
          Vos données personnelles sont collectées et traitées conformément à notre politique de confidentialité. Nous ne partageons jamais vos informations sans votre consentement.
        </Text>

        <Text style={styles.sectionTitle}>3. Utilisation de l'application</Text>
        <Text style={styles.sectionText}>
          Vous vous engagez à utiliser l'application uniquement à des fins légales et conformément aux lois en vigueur. Toute utilisation abusive pourra entraîner la suspension ou la suppression de votre compte.
        </Text>

        <Text style={styles.sectionTitle}>4. Propriété intellectuelle</Text>
        <Text style={styles.sectionText}>
          Tous les contenus, logos et marques présents dans l'application sont la propriété de BIM ou de ses partenaires. Toute reproduction ou utilisation non autorisée est interdite.
        </Text>

        <Text style={styles.sectionTitle}>5. Modifications des termes</Text>
        <Text style={styles.sectionText}>
          BIM se réserve le droit de modifier ces termes à tout moment. Les modifications seront effectives dès leur publication dans l'application.
        </Text>

        <Text style={styles.sectionTitle}>6. Limitation de responsabilité</Text>
        <Text style={styles.sectionText}>
          BIM ne pourra être tenu responsable des dommages directs ou indirects liés à l'utilisation de l'application.
        </Text>

        <Text style={styles.sectionTitle}>7. Contact</Text>
        <Text style={styles.sectionText}>
          Pour toute question concernant ces termes et notre politique, veuillez nous contacter via la section support de l'application.
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
    fontSize: 16,
    fontWeight: "700",
    color: "#302E99",
    marginBottom: 6,
    marginTop: 15,
  },

  sectionText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
});
