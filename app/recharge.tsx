import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
   KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";




import {
  useCreateRechargeMutation,
  useRechargeMutation, 
} from "@/services/tsxService";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeDecimal } from "@/utils/normalizeDecimal.util";

const methods = [
  { id: "airtel", name: "AirtelMoney", logo: "https://images.africanfinancials.com/797d4617-ng-airtel-logo.png" },
  { id: "orange", name: "OrangeMoney", logo: "https://c.woopic.com/logo-orange.png" },
  { id: "vodacom", name: "M-Pesa", logo: "https://www.vodacom.co.za/themes/custom/blip/img/menu/vodacom-logo.png" },
  { id: "africell", name: "AfriMoney", logo: "https://upload.wikimedia.org/wikipedia/commons/c/c9/AfricellLogo.png" },
];

export default function RechargeEcoinsScreen() {

  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [btnAnim] = useState(new Animated.Value(1));
  const [userId, setUserId] = useState<string | null>(null);

  const [createRecharge, { isLoading }] = useCreateRechargeMutation();
  const [recharge] = useRechargeMutation(); // ✅

  useEffect(() => {
    const loadUser = async () => {
      const id = await AsyncStorage.getItem("userId");
      setUserId(id);
    };
    loadUser();
  }, []);

  const handleConfirm = async () => {

    Animated.sequence([
      Animated.timing(btnAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(btnAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    if (!amount || !selectedMethod || !phone) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs !");
      return;
    }

    if (!phone.startsWith("243")) {
      Alert.alert("Erreur", "Le numéro de téléphone doit commencer par 243");
      return;
    }

    try {

   
      const rechargeResponse: any = await createRecharge({
        amount:normalizeDecimal(amount),
        telephone: phone,
        id: userId,
        PayTypeValue : selectedMethod
      }).unwrap();

      if (rechargeResponse) {

      
        await recharge({
          amount:normalizeDecimal(amount),
          userId: userId,
        }).unwrap();

        Alert.alert("Succès", `Recharge de ${amount} Ecoins réussie !`);

      } else {

        Alert.alert(
          "Échec",
          `Recharge échouée : "Erreur inconnue"}`
        );

      }

    } catch (err: any) {

      console.log(err);
      Alert.alert(
        "Erreur",
        err?.data?.message || "Une erreur est survenue lors de la recharge."
      );
    }
  };

 return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* ===== HEADER ===== */}
          <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={28} color="white" />
              </TouchableOpacity>

              <Text style={styles.title}>Recharge Ecoins</Text>

              <TouchableOpacity onPress={() => router.push("/notification")}>
                <Ionicons name="notifications-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <Ionicons name="wallet-outline" size={60} color="white" />
            <Text style={styles.subtitle}>
              Choisissez un moyen de recharge
            </Text>
          </LinearGradient>

          {/* ===== FORMULAIRE ===== */}
          <View style={{ padding: 16 }}>
            {/* Montant */}
            <Text style={styles.label}>Montant à recharger</Text>
            <View style={styles.inputBox}>
              <Ionicons name="cash-outline" size={20} color="#888" />
              <TextInput
                placeholder="Ex: 50 Ecoins"
                keyboardType="numeric"
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                returnKeyType="done"

              />
            </View>

            {/* Méthodes */}
            <Text style={styles.label}>Méthode de recharge</Text>
            <View style={styles.methodsWrapper}>
              {methods.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedMethod(item.name)}
                  style={{ width: "48%", marginBottom: 12 }}
                >
                  <BlurView
                    intensity={90}
                    tint="light"
                    style={{
                      borderRadius: 18,
                      paddingVertical: 20,
                      alignItems: "center",
                      borderWidth:
                        selectedMethod === item.name ? 2 : 0,
                      borderColor:
                        selectedMethod === item.name
                          ? "#FFD700"
                          : "transparent",
                    }}
                  >
                    <LinearGradient
                      colors={["#302E99", "#3906C7"]}
                      style={StyleSheet.absoluteFillObject}
                    />

                    <Image
                      source={{ uri: item.logo }}
                      style={{ width: 50, height: 50 }}
                    />
                    <Text style={styles.methodName}>
                      {item.name}
                    </Text>
                  </BlurView>
                </TouchableOpacity>
              ))}
            </View>

            {/* Téléphone */}
            {selectedMethod && (
              <>
                <Text style={styles.label}>
                  Numéro de téléphone ({selectedMethod})
                </Text>

                <View style={styles.inputBox}>
                  <Ionicons name="call-outline" size={20} color="#888" />
                  <TextInput
                    placeholder="Ex: 0812345678"
                    keyboardType="numeric"
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}

                  />
                </View>
              </>
            )}

            {/* Bouton */}
            <View style={{ marginTop: 30 }}>
              <GradientButton
                title={
                  isLoading
                    ? "Processing..."
                    : "Confirmer la recharge"
                }
                onPress={handleConfirm}
                leftIcon={
                  <ArrowIcon width={20} height={14} color="#3906C7" />
                }
                rightIcon={
                  <ArrowRightIcon width={30} height={24} />
                }
                isLoad={isLoading}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
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
  },
  title: { color: "white", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "white", opacity: 0.9, marginTop: 8 },
  label: { marginTop: 20, marginBottom: 6, fontWeight: "600", color: "#333" },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEE",
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: { flex: 1, paddingVertical: 10, color: "#000" },
  methodsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  methodName: { color: "#fff", fontWeight: "600", textAlign: "center" },
});
