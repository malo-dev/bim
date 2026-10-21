import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAskPasswordResetMutation, useResetPasswordMutation } from "@/services/authService";

// Récupération de mot de passe par e-mail — en 2 étapes : demande du code
// (askPasswordReset envoie un OTP par e-mail), puis code + nouveau mot de
// passe (resetPassword, qui vérifie maintenant ce code côté serveur).
export default function ForgotPasswordModal({
  visible, onClose, initialEmail,
}: { visible: boolean; onClose: () => void; initialEmail?: string }) {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [userId, setUserId] = useState<number | null>(null);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [askPasswordReset, { isLoading: sending }] = useAskPasswordResetMutation();
  const [resetPassword, { isLoading: resetting }] = useResetPasswordMutation();

  const close = () => {
    setStep("email");
    setOtp("");
    setNewPassword("");
    onClose();
  };

  const handleSendCode = async () => {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Email invalide", "Entrez une adresse e-mail valide.");
      return;
    }
    try {
      const res: any = await askPasswordReset({ email: email.trim().toLowerCase() }).unwrap();
      setUserId(res.userId);
      setStep("reset");
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Impossible d'envoyer le code. Vérifiez l'adresse e-mail.");
    }
  };

  const handleResetPassword = async () => {
    if (otp.trim().length !== 6) {
      Alert.alert("Code invalide", "Le code reçu par e-mail contient 6 chiffres.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Mot de passe trop court", "Choisissez un mot de passe d'au moins 6 caractères.");
      return;
    }
    try {
      await resetPassword({ userId, otp: otp.trim(), newPassword }).unwrap();
      Alert.alert("✅ Mot de passe réinitialisé", "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.");
      close();
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Code invalide ou expiré.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={s.card}>
          <TouchableOpacity style={s.closeBtn} onPress={close}>
            <Ionicons name="close" size={18} color="#747688" />
          </TouchableOpacity>

          {step === "email" ? (
            <>
              <Text style={s.title}>Mot de passe oublié</Text>
              <Text style={s.sub}>Entrez votre adresse e-mail, nous vous envoyons un code pour réinitialiser votre mot de passe.</Text>
              <TextInput
                style={s.input}
                placeholder="nom@exemple.com"
                placeholderTextColor="#9496A8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
              <TouchableOpacity style={[s.btn, (!email.trim() || sending) && { opacity: 0.6 }]} onPress={handleSendCode} disabled={!email.trim() || sending}>
                {sending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Envoyer le code</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.title}>Réinitialiser le mot de passe</Text>
              <Text style={s.sub}>Entrez le code reçu par e-mail à {email}, et votre nouveau mot de passe.</Text>
              <TextInput
                style={s.input}
                placeholder="Code à 6 chiffres"
                placeholderTextColor="#9496A8"
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                maxLength={6}
              />
              <View style={s.inputRow}>
                <TextInput
                  style={[s.input, { flex: 1, marginTop: 0 }]}
                  placeholder="Nouveau mot de passe"
                  placeholderTextColor="#9496A8"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPwd}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPwd((v) => !v)}>
                  <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={18} color="#747688" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[s.btn, (otp.length !== 6 || newPassword.length < 6 || resetting) && { opacity: 0.6 }]} onPress={handleResetPassword} disabled={otp.length !== 6 || newPassword.length < 6 || resetting}>
                {resetting ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Réinitialiser</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 12, alignItems: "center" }} onPress={() => setStep("email")} disabled={resetting}>
                <Text style={s.resend}>Renvoyer le code à une autre adresse</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", backgroundColor: "#fff", borderRadius: 22, padding: 22 },
  closeBtn: { position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: 14, backgroundColor: "#F0F0F2", alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "NexaBold", fontSize: 17, color: "#1A1C1C", marginTop: 6 },
  sub: { fontFamily: "NexaLight", fontSize: 12.5, color: "#747688", marginTop: 6, lineHeight: 18 },

  input: { borderWidth: 1.5, borderColor: "#E2E2E8", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontFamily: "NexaBold", fontSize: 14, color: "#1A1C1C", marginTop: 16 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  eyeBtn: { padding: 8 },

  btn: { borderRadius: 14, paddingVertical: 14, alignItems: "center", backgroundColor: "#0035C5", marginTop: 18 },
  btnText: { fontFamily: "NexaBold", fontSize: 14, color: "#fff" },
  resend: { fontFamily: "NexaBold", fontSize: 12, color: "#0035C5" },
});
