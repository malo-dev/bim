import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useUpdateUserMutation } from "@/services/userService";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Les comptes créés par /auth/quick-access reçoivent un e-mail généré
// (quick_<hex>@bimreseau.com) qui ne leur sert à rien — cette fiche bloquante
// le remplace par leur vraie adresse, rattachée définitivement au compte.
const GENERATED_EMAIL_RE = /^quick_[0-9a-f]+@bimreseau\.com$/i;

export default function CompleteEmailModal({
  userId, email, onSaved,
}: { userId: string; email?: string | null; onSaved?: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [updateUser, { isLoading: saving }] = useUpdateUserMutation();

  const missingEmail = !email || GENERATED_EMAIL_RE.test(email.trim());
  if (!missingEmail) return null;

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Entrez une adresse e-mail valide.");
      return;
    }
    setError(null);
    try {
      const fd = new FormData();
      fd.append("email", trimmed);
      await updateUser({ id: userId, formData: fd }).unwrap();
      onSaved?.();
    } catch (err: any) {
      setError(err?.data?.message || "Impossible d'enregistrer cet e-mail.");
    }
  };

  return (
    // Aucune échappatoire (pas de bouton annuler/déconnexion) : l'e-mail est
    // obligatoire une fois arrivé sur l'accueil, `onRequestClose` neutralisé.
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={s.card}>
          <View style={s.iconWrap}>
            <Ionicons name="mail-outline" size={26} color="#fff" />
          </View>
          <Text style={s.cardTitle}>Ajoutez votre e-mail</Text>
          <Text style={s.cardSub}>
            Il sera rattaché à votre compte pour les notifications et la récupération d'accès.
          </Text>

          <View style={s.inputRow}>
            <Ionicons name="mail-outline" size={16} color="#747688" style={{ marginLeft: 12 }} />
            <TextInput
              style={s.input}
              placeholder="nom@exemple.com"
              placeholderTextColor="#9496A8"
              value={value}
              onChangeText={(v) => { setValue(v); setError(null); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
              editable={!saving}
            />
          </View>
          {error && <Text style={s.errorText}>{error}</Text>}

          <TouchableOpacity style={[s.saveBtn, (!value || saving) && { opacity: 0.6 }]} onPress={handleSave} disabled={!value || saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>Valider</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", backgroundColor: "#fff", borderRadius: 22, padding: 22, alignItems: "center" },
  iconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#0035C5", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  cardTitle: { fontFamily: "NexaBold", fontSize: 17, color: "#1A1C1C", textAlign: "center" },
  cardSub: { fontFamily: "NexaLight", fontSize: 12.5, color: "#747688", marginTop: 6, textAlign: "center", lineHeight: 18 },

  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20, width: "100%", borderWidth: 1.5, borderColor: "#E2E2E8", borderRadius: 14 },
  input: { flex: 1, fontFamily: "NexaBold", fontSize: 14, color: "#1A1C1C", paddingVertical: 14, paddingRight: 12 },

  errorText: { fontFamily: "NexaLight", fontSize: 11.5, color: "#EF4444", marginTop: 6, alignSelf: "flex-start" },
  saveBtn: { width: "100%", borderRadius: 14, paddingVertical: 14, alignItems: "center", backgroundColor: "#0035C5", marginTop: 18 },
  saveText: { fontFamily: "NexaBold", fontSize: 14, color: "#fff" },
});
