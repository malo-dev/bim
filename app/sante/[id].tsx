import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";
// Données des paquets santé avec sous-paquets
const healthPackages = [
  {
    id: "1",
    name: "Famille Basique",
    description: "Couvre jusqu'à 3 personnes avec soins de base.",
    persons: 3,
    price: 30,
    benefits: ["Consultation", "Médicaments génériques"],
    icon: "medkit-outline",
    packages: [
      { title: "Paquet 1", description: "Couvre jusqu'à 3 personnes avec soins de base. et Consultation, Médicaments génériques", priceUSD: 30, priceEcoins: 30, discount: 0, icon: "medkit-outline" },
      { title: "Paquet 2", description: "Soins + vaccination", priceUSD: 35, priceEcoins: 35, discount: 10, icon: "medkit-outline" },
      { title: "Paquet 3", description: "Soins + consultation illimitée", priceUSD: 40, priceEcoins: 40, discount: 0, icon: "medkit-outline" },
    ],
  },
  {
    id: "2",
    name: "Famille Premium",
    description: "Couvre jusqu'à 5 personnes avec soins avancés.",
    persons: 5,
    price: 60,
    benefits: ["Consultation", "Médicaments avancés", "Analyse médicale"],
    icon: "heart-outline",
    packages: [
      { title: "Paquet 1", description: "Consultation + analyses", priceUSD: 60, priceEcoins: 60, discount: 0, icon: "heart-outline" },
      { title: "Paquet 2", description: "Consultation + analyses + médicaments", priceUSD: 70, priceEcoins: 70, discount: 5, icon: "heart-outline" },
    ],
  },
  {
    id: "3",
    name: "Famille VIP",
    description: "Couvre jusqu'à 8 personnes avec services complets.",
    persons: 8,
    price: 120,
    benefits: ["Consultation", "Médicaments premium", "Analyse complète", "Urgence 24/7"],
    icon: "shield-checkmark-outline",
    packages: [
      { title: "Paquet 1", description: "VIP Essentiel", priceUSD: 120, priceEcoins: 120, discount: 0, icon: "shield-checkmark-outline" },
      { title: "Paquet 2", description: "VIP Premium", priceUSD: 130, priceEcoins: 130, discount: 10, icon: "shield-checkmark-outline" },
    ],
  },
];

export default function HealthPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<string>("");
  const [modalMessage, setModalMessage] = useState<{type: "success" | "error", text: string} | null>(null);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const packageItem = healthPackages.find((p) => p.id === id);

  if (!packageItem) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16 }}>Paquet introuvable</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Ionicons name="arrow-back-circle-outline" size={40} color="#302E99" />
        </TouchableOpacity>
      </View>
    );
  }

  // Ouvre drawer avec le sous-paquet sélectionné
  const openDrawer = (pkg: any) => {
    setSelectedPackage(pkg);
    setPayAmount(pkg.discount ? `${pkg.priceEcoins - (pkg.priceEcoins * pkg.discount / 100)}` : `${pkg.priceEcoins}`);
    setDrawerVisible(true);
  };

  // Simule paiement
  const handlePay = () => {
    const amount = Number(payAmount);
    if (isNaN(amount) || amount <= 0) {
      setModalMessage({ type: "error", text: "Montant invalide" });
      return;
    }
    // Ici tu peux intégrer paiement réel
    setDrawerVisible(false);
    setModalMessage({ type: "success", text: `Paiement réussi de ${amount} eCoins !` });
  };

  return (
    <View style={styles.container}>
      {/* HEADER FIXE */}
      <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paquet Santé</Text>
          <TouchableOpacity onPress={() => router.push('/notification')}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.headerSubtitle}>{packageItem.name}</Text>
      </LinearGradient>

      {/* SCROLL DES SOUS-PAQUETS */}
      <FlatList
        data={packageItem.packages}
        keyExtractor={(item, index) => `${item.title}-${index}`}
        contentContainerStyle={{ padding: 16, paddingTop: 10 }}
        renderItem={({ item }) => (
          <BlurView intensity={80} tint="light" style={styles.card}>
            <LinearGradient
              colors={["#302E99", "#3906C7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name={item.icon} size={40} color="white" style={{ marginBottom: 8 }} />
            <Text style={styles.packageName}>{item.title}</Text>
            <Text style={styles.packageDesc}>{item.description}</Text>
            <Text style={styles.packageDetails}>
              Prix initial: ${item.priceUSD} | eCoins: {item.priceEcoins} {item.discount ? `( -${item.discount}% )` : ""}
            </Text>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity style={styles.btn} onPress={() => openDrawer(item)}>
                <Ionicons name="arrow-forward-circle-outline" size={28} color="white" />
              </TouchableOpacity>
            </Animated.View>
          </BlurView>
        )}
      />

        <Modal
        isVisible={drawerVisible}
        onBackdropPress={() => setDrawerVisible(false)}
        style={styles.drawer}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.drawerContainer}
        >
          <View style={styles.drawerContent}>
            <Text style={styles.drawerTitle}>{selectedPackage?.title}</Text>
            <Text style={styles.drawerDesc}>{selectedPackage?.description}</Text>

            {selectedPackage?.discount ? (
              <Text style={styles.priceText}>
                Prix avec réduction: {Number(selectedPackage.priceEcoins - (selectedPackage.priceEcoins * selectedPackage.discount / 100))} eCoins
              </Text>
            ) : (
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Entrez le montant en eCoins"
                value={payAmount}
                onChangeText={setPayAmount}
              />
            )}

            <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
              <Text style={{ color: "white", fontWeight: "700" }}>PAYER</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL SUCCESS / ERROR */}
      <Modal
        isVisible={!!modalMessage}
        onBackdropPress={() => setModalMessage(null)}
      >
        <View style={styles.modalContent}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: modalMessage?.type === "success" ? "green" : "red" }}>
            {modalMessage?.text}
          </Text>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
    zIndex: 10,
  },

  headerTop: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  headerTitle: { color: "white", fontSize: 24, fontWeight: "700", marginTop: 10 },
  headerSubtitle: { color: "white", opacity: 0.9, fontSize: 14, textAlign: "center", marginTop: 4 },

  card: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    position: "relative",
  },

  packageName: { color: "white", fontSize: 20, fontWeight: "700", marginBottom: 4, textAlign: "center" },
  packageDesc: { color: "#E0E0E0", fontSize: 14, textAlign: "center", marginBottom: 6 },
  packageDetails: { color: "white", fontWeight: "600", marginBottom: 10 },

  btn: {
    backgroundColor: "rgba(255,255,255,0.25)",
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  drawer: { justifyContent: "flex-end", margin: 0 },
  drawerContainer: { flex: 1, justifyContent: "flex-end" },
  drawerContent: {
    backgroundColor: "#FFF",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  drawerTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  drawerDesc: { fontSize: 14, marginBottom: 10, color: "#555" },
  priceText: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 10, marginBottom: 10 },
  payBtn: { backgroundColor: "#302E99", padding: 12, borderRadius: 12, alignItems: "center" },

  modalContent: { backgroundColor: "#FFF", padding: 20, borderRadius: 12, alignItems: "center" },
});
