// app/carburant/[id].tsx
import { companiesCarburant } from "@/assets/mockdata/bimCarb.mock";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function BimCarburantDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const company = companiesCarburant.find((item) => item.id === id);

  const [liters, setLiters] = useState("1");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [fuelType, setFuelType] = useState(company?.defaultFuel || "Essence");

  useEffect(() => {
    if (company) {
      const pricePerLiter = company.pricePerLiter || 1;
      setAmount((Number(liters) * pricePerLiter).toFixed(2));
    }
  }, [company, liters]);

  if (!company) {
    return (
      <View style={styles.center}>
        <Text>Station introuvable</Text>
      </View>
    );
  }

  const handlePay = () => {
    if (!liters || !amount || !phone || !fuelType) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setTimeout(() => {
      const success = Math.random() > 0.3;
      if (success) {
        Alert.alert("Succès 🎉", `Paiement de ${amount} Ecoins effectué !`);
        setLiters("1");
        setPhone("");
      } else {
        Alert.alert("Échec ❌", "Paiement refusé");
      }
    }, 1000);
  };

  // Liste déroulante de litres
  const litersOptions = Array.from({ length: 100 }, (_, i) => i + 1);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ===== HEADER ===== */}
        <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>{company.name}</Text>
            <TouchableOpacity onPress={() => router.push("/notification")}>
              <Ionicons name="notifications-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Image source={{ uri: company.logo }} style={styles.logo} />
          <Text style={styles.desc}>{company.description}</Text>
        </LinearGradient>

        {/* ===== FORMULAIRE ===== */}
        <BlurView intensity={70} tint="light" style={styles.formCard}>
          <Text style={styles.formTitle}>Acheter du carburant</Text>

          <Text style={styles.label}>Type de carburant</Text>
          <TextInput
            placeholder="Essence / Diesel"
            value={fuelType}
            onChangeText={setFuelType}
            style={styles.input}
          />

          <Text style={styles.label}>Nombre de litres</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={liters}
              onValueChange={(itemValue) => setLiters(String(itemValue))}
              style={styles.picker}
            >
              {litersOptions.map((l) => (
                <Picker.Item key={l} label={`${l} L`} value={`${l}`} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Montant à payer</Text>
          <TextInput
            value={amount}
            editable={false}
            style={[styles.input, { backgroundColor: "#E0E0E0" }]}
          />

          <Text style={styles.label}>Numéro BIM </Text>
          <TextInput
            placeholder="Ex: 099XXXXXXX"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
          />

          <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
            <Text style={styles.payText}>
              Payer {amount} Ecoins
            </Text>
          </TouchableOpacity>
        </BlurView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    alignItems: "center",
    paddingVertical: 35,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: "center",
  },
  logo: { width: 90, height: 90, marginVertical: 20, borderRadius: 45 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  desc: { color: "#ddd", marginTop: 6, textAlign: "center", paddingHorizontal: 20 },
  formCard: {
    margin: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  formTitle: { fontSize: 18, fontWeight: "700", marginBottom: 15 },
  label: { fontWeight: "600", marginTop: 10 },
  input: {
    backgroundColor: "#F1F1F1",
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginTop: 5,
    width: "100%",
  },
  pickerWrapper: {
    backgroundColor: "#F1F1F1",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 5,
  },
  picker: { height: 50, width: "100%" },
  payBtn: {
    backgroundColor: "#302E99",
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  payText: { color: "#fff", fontWeight: "700" },
});
