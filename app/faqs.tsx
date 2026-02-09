import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    FlatList,
    LayoutAnimation,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from "react-native";

// Activation animation pour Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Liste améliorée de 10 FAQs
const faqs = [
  { id: "1", question: "Comment recharger mon compte Ecoins ?", answer: "Vous pouvez recharger votre compte via Airtel, Orange, Vodacom ou Africell en choisissant le montant et le moyen de paiement." },
  { id: "2", question: "Comment transférer des Ecoins à un ami ?", answer: "Allez dans Transfert, sélectionnez l'utilisateur et entrez le montant à transférer." },
  { id: "3", question: "Comment contacter le support ?", answer: "Vous pouvez contacter le support via la page Support ou en envoyant un email à support@ecoins.com." },
  { id: "4", question: "Puis-je annuler une transaction ?", answer: "Une fois la transaction confirmée, elle ne peut pas être annulée. Veuillez vérifier les détails avant de confirmer." },
  { id: "5", question: "Comment créer un compte Ecoins ?", answer: "Téléchargez l'application, cliquez sur 'Créer un compte' et remplissez vos informations personnelles." },
  { id: "6", question: "Comment sécuriser mon compte ?", answer: "Activez l'authentification à deux facteurs et ne partagez jamais votre mot de passe." },
  { id: "7", question: "Quels sont les frais de transaction ?", answer: "Les frais dépendent du montant et du mode de transfert, généralement de 1 à 2%." },
  { id: "8", question: "Comment consulter mon historique ?", answer: "Allez dans 'Historique' pour voir toutes vos transactions passées." },
  { id: "9", question: "Comment mettre à jour mes informations ?", answer: "Dans votre profil, cliquez sur 'Modifier' pour changer vos informations personnelles." },
  { id: "10", question: "Puis-je lier plusieurs comptes bancaires ?", answer: "Oui, vous pouvez ajouter jusqu'à 3 comptes bancaires pour vos transactions." },
];

export default function FAQScreen() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={styles.container}>
      {/* ===== HEADER ===== */}
      <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

          <Text style={styles.title}>FAQ</Text>

          <TouchableOpacity onPress={() => router.push("/notification")}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <Ionicons name="help-circle-outline" size={60} color="white" style={{ marginTop: 10 }} />
        <Text style={styles.subtitle}>Questions fréquentes</Text>
      </LinearGradient>

      {/* ===== LISTE DES FAQ ===== */}
      <FlatList
        data={faqs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggleExpand(item.id)} activeOpacity={0.9}>
            <BlurView intensity={80} tint="light" style={styles.faqCard}>
              <LinearGradient
                colors={["#302E99", "#3906C7"]}
                style={{ ...StyleSheet.absoluteFillObject, borderRadius: 18 }}
              />

              <View style={styles.questionRow}>
                <Text style={styles.question}>{item.question}</Text>
                <Ionicons
                  name={expandedId === item.id ? "remove-circle-outline" : "add-circle-outline"}
                  size={22}
                  color="#FFD700"
                />
              </View>

              {expandedId === item.id && <Text style={styles.answer}>{item.answer}</Text>}
            </BlurView>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },

  header: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
  },

  headerRow: {
    marginTop: 60,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: { color: "white", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "white", opacity: 0.9, marginTop: 8 },

  faqCard: {
    marginBottom: 12,
    borderRadius: 18,
    padding: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  questionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  question: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },

  answer: {
    color: "#FFD700",
    fontWeight: "500",
    fontSize: 14,
    marginTop: 8,
  },
});
