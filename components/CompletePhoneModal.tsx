import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AFRICA_COUNTRIES } from "@/constants/africaCountries";
import { useUpdateUserMutation } from "@/services/userService";

// Les comptes "rapides" créés via le bouton "Commencer" de l'onboarding
// n'ont jamais de numéro de téléphone (aucun n'est demandé sur ce chemin) —
// cette fiche bloquante le fait compléter depuis l'intérieur de l'app, sans
// possibilité de la fermer avant d'avoir renseigné un numéro. Ce numéro
// devient alors à la fois leur identifiant de connexion ET d'inscription :
// le retaper via /auth/quick-access retrouvera ce même compte.
export default function CompletePhoneModal({
  userId, telephone, onSaved,
}: { userId: string; telephone?: string | null; onSaved?: () => void }) {
  const router = useRouter();
  const [country, setCountry] = useState<(typeof AFRICA_COUNTRIES)[number]>(
    AFRICA_COUNTRIES.find((c) => c.code === "+243")!
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [zeroWarning, setZeroWarning] = useState(false);
  const [updateUser, { isLoading: saving }] = useUpdateUserMutation();

  // Le code pays remplace déjà le "0" de tête qu'on tape habituellement en
  // composant localement (ex: 0999999999) — avec le code pays, on ne garde
  // que 999999999, sinon le numéro final serait invalide (+243 0999999999).
  const handlePhoneChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    if (digits.startsWith("0")) {
      setZeroWarning(true);
      setPhone(digits.replace(/^0+/, ""));
    } else {
      setZeroWarning(false);
      setPhone(digits);
    }
  };

  const missingPhone = !telephone || telephone.trim().length === 0;
  if (!missingPhone) return null;

  const handleSave = async () => {
    const digits = phone.trim();
    if (digits.length < 6) {
      Alert.alert("Numéro invalide", "Entrez un numéro de téléphone valide.");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("telephone", `${country.code}${digits}`);
      await updateUser({ id: userId, formData: fd }).unwrap();
      setPhone("");
      onSaved?.();
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Impossible d'enregistrer ce numéro.");
    }
  };

  // Échappatoire si l'utilisateur ne veut/peut pas compléter son numéro
  // maintenant — déconnecte et renvoie vers la connexion par téléphone,
  // plutôt que de le laisser bloqué sur cette fiche sans issue.
  const handleCancel = () => {
    Alert.alert(
      "Annuler",
      "Vous allez être déconnecté et renvoyé vers la connexion par téléphone.",
      [
        { text: "Retour", style: "cancel" },
        {
          text: "Déconnecter",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace({ pathname: "/onboarding", params: { step: "phone" } } as any);
          },
        },
      ]
    );
  };

  return (
    <>
      {/* Pas de `onRequestClose` qui ferme réellement : tant qu'il n'y a pas
          de numéro enregistré, cette fiche reste affichée (bouton retour
          Android neutralisé, pas de tape-en-dehors pour fermer). */}
      <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
        <KeyboardAvoidingView
          style={s.overlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={s.card}>
            <View style={s.iconWrap}>
              <Ionicons name="call-outline" size={26} color="#fff" />
            </View>
            <Text style={s.cardTitle}>Complétez votre numéro</Text>
            <Text style={s.cardSub}>
              Il sert à sécuriser votre compte et à vous reconnecter si vous changez d'appareil.
            </Text>

            <View style={s.inputRow}>
              <TouchableOpacity style={s.countryBtn} onPress={() => setPickerOpen(true)}>
                <Text style={s.flag}>{country.flag}</Text>
                <Text style={s.code}>{country.code}</Text>
                <Ionicons name="chevron-down" size={12} color="#747688" />
              </TouchableOpacity>
              <TextInput
                style={s.phoneInput}
                placeholder="8xx xxx xxx"
                placeholderTextColor="#9496A8"
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                autoFocus
              />
            </View>
            {zeroWarning && (
              <Text style={s.zeroWarning}>Ne mettez pas de 0 devant — le code pays ({country.code}) le remplace déjà.</Text>
            )}

            <TouchableOpacity style={[s.saveBtn, (!phone || saving) && { opacity: 0.6 }]} onPress={handleSave} disabled={!phone || saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>Valider</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={handleCancel} disabled={saving}>
              <Text style={s.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={s.overlay}>
          <View style={[s.card, { maxHeight: "70%", paddingBottom: 8 }]}>
            <Text style={s.cardTitle}>Choisir un pays</Text>
            <FlatList
              data={AFRICA_COUNTRIES}
              keyExtractor={(item) => item.code + item.name}
              style={{ marginTop: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.countryRow}
                  onPress={() => { setCountry(item); setPickerOpen(false); }}
                >
                  <Text style={s.flag}>{item.flag}</Text>
                  <Text style={s.countryName}>{item.name}</Text>
                  <Text style={s.code}>{item.code}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", backgroundColor: "#fff", borderRadius: 22, padding: 22, alignItems: "center" },
  iconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#0035C5", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  cardTitle: { fontFamily: "NexaBold", fontSize: 17, color: "#1A1C1C", textAlign: "center" },
  cardSub: { fontFamily: "NexaLight", fontSize: 12.5, color: "#747688", marginTop: 6, textAlign: "center", lineHeight: 18 },

  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20, width: "100%", borderWidth: 1.5, borderColor: "#E2E2E8", borderRadius: 14, paddingHorizontal: 4 },
  countryBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 14, borderRightWidth: 1, borderRightColor: "#E2E2E8" },
  flag: { fontSize: 16 },
  code: { fontFamily: "NexaBold", fontSize: 13, color: "#1A1C1C" },
  phoneInput: { flex: 1, fontFamily: "NexaBold", fontSize: 14, color: "#1A1C1C", paddingVertical: 14, paddingRight: 12 },

  zeroWarning: { fontFamily: "NexaLight", fontSize: 11.5, color: "#EF4444", marginTop: 6, alignSelf: "flex-start" },
  saveBtn: { width: "100%", borderRadius: 14, paddingVertical: 14, alignItems: "center", backgroundColor: "#0035C5", marginTop: 18 },
  saveText: { fontFamily: "NexaBold", fontSize: 14, color: "#fff" },
  cancelBtn: { width: "100%", paddingVertical: 12, alignItems: "center", marginTop: 4 },
  cancelText: { fontFamily: "NexaLight", fontSize: 13, color: "#747688" },

  countryRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F0F0F2" },
  countryName: { flex: 1, fontFamily: "NexaBold", fontSize: 13, color: "#1A1C1C" },
});
