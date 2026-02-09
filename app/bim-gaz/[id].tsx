
import { companiesGaz } from "@/assets/mockdata/bimGaz.mock";
import { Ionicons } from "@expo/vector-icons";
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

export default function BimEnergieDetails() {

  const { id } = useLocalSearchParams();
const router = useRouter()
  // 🔍 Trouver entreprise via ID
  const company = companiesGaz.find(
    (item) => item.id === id
  );

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("pièce");
  const [number, setNumber] = useState("");

  if (!company) {
    return (
      <View style={styles.center}>
        <Text>Entreprise introuvable</Text>
      </View>
    );
  }

  const total =
    selectedProduct ? Number(quantity) * selectedProduct.price : 0;

  const handlePay = () => {
    if (!number) {
      Alert.alert("Erreur", "Entrez un numéro valide");
      return;
    }

    setModalVisible(false);

    setTimeout(() => {
      const success = Math.random() > 0.3;

      if (success) {
        Alert.alert("Succès 🎉", "Paiement réussi !");
      } else {
        Alert.alert("Échec ❌", "Paiement refusé");
      }
    }, 1000);
  };

  return (
    <ScrollView style={styles.container}>

      {/* ===== HEADER ===== */}
      <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>

         <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal:20, marginTop:20 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

           <Text style={styles.title}>{company.name}</Text>

          <TouchableOpacity onPress={() => router.push('/notification')}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <Image source={{ uri: company.logo }} style={styles.logo} />
        {/* <Text style={styles.title}>{company.name}</Text> */}
        <Text style={styles.desc}>{company.description}</Text>
      </LinearGradient>

      {/* ===== LISTE PRODUITS ===== */}
      <View style={styles.list}>
        <FlatList
          data={company.products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ gap: 12 }}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>{item.price}Ecoins</Text>

              <TouchableOpacity
                style={styles.buyBtn}
                onPress={() => {
                  setSelectedProduct(item);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.buyText}>Recharger</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {/* ===== MODAL PAIEMENT ===== */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>

            <Text style={styles.modalTitle}>
              {selectedProduct?.name}
            </Text>

            <TextInput
              placeholder="Quantité"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
              style={styles.input}
            />

            <TextInput
              placeholder="Unité (pièce, litre, kg...)"
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

            <Text style={styles.total}>Total : {total}Ecoins</Text>

            <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
              <Text style={styles.payText}>Payer avec eCoins</Text>
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

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    alignItems: "center",
    paddingVertical: 35,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    
  },

  logo: { width: 90, height: 90, marginVertical: 20 },

  title: { color: "#fff", fontSize: 22, fontWeight: "700" },

  desc: { color: "#ddd", marginTop: 6 },

  list: { padding: 16 },

  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },

  image: { width: 80, height: 80 },

  name: { fontWeight: "600", textAlign: "center", marginTop: 6 },

  price: { color: "#302E99", marginVertical: 4 },

  buyBtn: {
    backgroundColor: "#302E99",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },

  buyText: { color: "#fff", fontWeight: "600" },

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

  modalTitle: { fontSize: 18, fontWeight: "700" },

  input: {
    backgroundColor: "#F1F1F1",
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginTop: 10,
  },

  total: { fontWeight: "700", marginTop: 10 },

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
