/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCreateRetraitMutation } from "@/services/tsxService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeDecimal } from "@/utils/normalizeDecimal.util";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useAppTheme } from "@/app/_layout";

/* ─── PALETTE ────────────────────────────────────────────────────────── */
const LIGHT = {
  primary:  "#0035C5",
  deep:     "#001257",
  blue:     "#0047FF",
  red:      "#DC0302",
  white:    "#FFFFFF",
  error:    "#EF4444",
  success:  "#22C55E",
  bg:       "#F9F9F9",
  surface:  "#FFFFFF",
  text:     "#1A1C1C",
  textSec:  "#434657",
  textMut:  "#747688",
  border:   "rgba(196,197,218,0.40)",
  green:    "#10B981",
  topBarBg: "rgba(255,255,255,0.90)",
  topBord:  "rgba(196,197,218,0.18)",
  inputBg:  "#F9F9F9",
  amtBg:    "#F3F3F4",
  keyBg:    "rgba(0,53,197,0.05)",
  cardBord: "rgba(196,197,218,0.10)",
  chipBg:   "#FFFFFF",
  agtBord:  "rgba(196,197,218,0.30)",
  recapBg:  "rgba(0,53,197,0.03)",
  recapBord:"rgba(0,53,197,0.08)",
  infoBg:   "rgba(0,53,197,0.05)",
  infoBord: "rgba(0,53,197,0.10)",
  reminderBg:"rgba(0,53,197,0.04)",
  dragBg:   "rgba(0,0,0,0.10)",
};
const DARK: typeof LIGHT = {
  primary:  "#4D8DFF",
  deep:     "#0B1220",
  blue:     "#4D8DFF",
  red:      "#DC0302",
  white:    "#FFFFFF",
  error:    "#EF4444",
  success:  "#22C55E",
  bg:       "#0B1220",
  surface:  "#1A2540",
  text:     "#EAF0FF",
  textSec:  "#9FB0D0",
  textMut:  "#6B7A99",
  border:   "rgba(31,42,68,0.80)",
  green:    "#10B981",
  topBarBg: "#1A2540",
  topBord:  "rgba(31,42,68,0.80)",
  inputBg:  "#0F1A2E",
  amtBg:    "#0F1A2E",
  keyBg:    "rgba(77,150,255,0.06)",
  cardBord: "rgba(31,42,68,0.80)",
  chipBg:   "#0F1A2E",
  agtBord:  "rgba(31,42,68,0.80)",
  recapBg:  "rgba(77,150,255,0.05)",
  recapBord:"rgba(77,150,255,0.12)",
  infoBg:   "rgba(77,150,255,0.05)",
  infoBord: "rgba(77,150,255,0.12)",
  reminderBg:"rgba(77,150,255,0.06)",
  dragBg:   "rgba(255,255,255,0.12)",
};

const SHORTCUTS = ["500", "1000", "2500", "5000"];

/* ─── SCREEN ─────────────────────────────────────────────────────────── */
export default function RetraitScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s  = useMemo(() => mkS(C), [isDark]);
  const fb = useMemo(() => mkFb(C), [isDark]);
  const { unread } = useUnreadNotifications();

  const [amount,        setAmount]        = useState("");
  const [agentSelected, setAgentSelected] = useState(false);
  const [phone,         setPhone]         = useState("");
  const [userId,        setUserId]        = useState<string | null>(null);

  const [loadingPay, setLoadingPay] = useState(false);

  const [feedback,    setFeedback]    = useState<"success" | "error" | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const fbScale = useRef(new Animated.Value(0.85)).current;
  const fbOpac  = useRef(new Animated.Value(0)).current;

  const [createRetrait] = useCreateRetraitMutation();

  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedbackMsg(msg); setFeedback(type);
    fbScale.setValue(0.85); fbOpac.setValue(0);
    Animated.parallel([
      Animated.spring(fbScale, { toValue: 1, friction: 7, useNativeDriver: true }),
      Animated.timing(fbOpac,  { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const hideFeedback = () => {
    const wasSuccess = feedback === "success";
    Animated.timing(fbOpac, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setFeedback(null);
      if (wasSuccess) { setAmount(""); setPhone(""); setAgentSelected(false); }
    });
  };

  const handleConfirmPress = async () => {
    if (!amount || !agentSelected || !phone) {
      showFeedback("error", "Veuillez remplir tous les champs."); return;
    }
    if (!userId) {
      showFeedback("error", "Utilisateur introuvable. Veuillez vous reconnecter."); return;
    }
    try {
      setLoadingPay(true);
      const res: any = await createRetrait({ amount: normalizeDecimal(amount), accountNumber: phone, id: userId }).unwrap();
      if (res) showFeedback("success", `Retrait de ${amount} EC effectué avec succès !`);
      else     showFeedback("error", "Retrait échoué, veuillez réessayer.");
    } catch (err: any) {
      showFeedback("error", err?.data?.message || "Une erreur est survenue lors du retrait.");
    } finally { setLoadingPay(false); }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ── TOP BAR ──────────────────────────────────────────────────── */}
      <SafeAreaView edges={["top"]} style={s.safeTop}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={s.topBarTitle}>
            Faire un retrait
          </Text>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/notification" as any)}>
            <Ionicons name="notifications-outline" size={22} color={C.primary} />
            {unread > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{unread > 99 ? "99+" : unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── HERO ─────────────────────────────────────────────────── */}
          <View style={s.hero}>
            <View style={s.heroIconWrap}>
              <Ionicons name="wallet-outline" size={36} color={C.primary} />
            </View>
            <Text style={s.heroSub}>
              Retirez vos Ecoins via un agent BIM agréé en quelques secondes.
            </Text>
          </View>

          {/* ── INFO BANNER ──────────────────────────────────────────── */}
          <View style={s.infoBanner}>
            <Ionicons name="information-circle-outline" size={18} color={C.primary} />
            <Text style={s.infoText}>
              Présentez-vous chez un agent BIM agréé avec votre numéro de compte pour valider l'opération.
            </Text>
          </View>

          {/* ── FORM CARD ────────────────────────────────────────────── */}
          <View style={s.card}>

            {/* Amount section */}
            <View style={s.sectionHead}>
              <Ionicons name="cash-outline" size={17} color={C.primary} />
              <Text style={s.sectionLabel}>MONTANT À RETIRER</Text>
            </View>
            <View style={s.amountWrap}>
              <Text style={s.ecPrefix}>EC</Text>
              <TextInput
                placeholder="0"
                placeholderTextColor="rgba(0,53,197,0.20)"
                keyboardType="numeric"
                style={s.amountInput}
                value={amount}
                onChangeText={setAmount}
                returnKeyType="done"
              />
            </View>
            <View style={s.shortcuts}>
              {SHORTCUTS.map((v) => {
                const active = amount === v;
                return (
                  <TouchableOpacity
                    key={v}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => setAmount(v)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.chipText, active && s.chipTextActive]}>{v} EC</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Method section */}
            <View style={[s.sectionHead, { marginTop: 6 }]}>
              <Ionicons name="person-circle-outline" size={17} color={C.primary} />
              <Text style={s.sectionLabel}>MÉTHODE DE RETRAIT</Text>
            </View>
            <TouchableOpacity
              style={[s.agentCard, agentSelected && s.agentCardActive]}
              onPress={() => setAgentSelected(v => !v)}
              activeOpacity={0.85}
            >
              <View style={s.agentLogoWrap}>
                <Image
                  source={{ uri: "https://www.cit.fr/uploads/media/20944196.jpg" }}
                  style={s.agentLogo}
                  contentFit="contain"
                />
              </View>
              <View style={s.agentInfo}>
                <Text style={s.agentName}>AgentBim</Text>
                <View style={s.agentStatusRow}>
                  <View style={s.greenDot} />
                  <Text style={s.agentStatusText}>AGENT OFFICIEL</Text>
                </View>
              </View>
              <Ionicons
                name={agentSelected ? "checkmark-circle" : "checkmark-circle-outline"}
                size={24}
                color={agentSelected ? C.primary : "rgba(0,53,197,0.25)"}
              />
            </TouchableOpacity>

            {/* Account number (shown when agent selected) */}
            {agentSelected && (
              <View style={s.phoneWrap}>
                <View style={s.sectionHead}>
                  <Ionicons name="card-outline" size={17} color={C.primary} />
                  <Text style={s.sectionLabel}>NUMÉRO DE COMPTE AGENT</Text>
                </View>
                <View style={s.phoneInput}>
                  <Ionicons name="card-outline" size={16} color={C.textMut} />
                  <TextInput
                    placeholder="Numéro de compte de l'agent"
                    placeholderTextColor={C.textMut}
                    keyboardType="numeric"
                    style={s.phoneField}
                    value={phone}
                    onChangeText={setPhone}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  {phone.length > 0 && (
                    <TouchableOpacity onPress={() => setPhone("")}>
                      <Ionicons name="close-circle" size={18} color={C.textMut} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Recap */}
            {amount && agentSelected && (
              <View style={s.recap}>
                <View style={[s.recapRow, { borderBottomWidth: 1, borderBottomColor: C.border }]}>
                  <Text style={s.recapLabel}>Via</Text>
                  <Text style={s.recapVal}>AgentBim</Text>
                </View>
                <View style={s.recapRow}>
                  <Text style={s.recapLabel}>Montant</Text>
                  <Text style={[s.recapVal, { color: C.primary, fontFamily: "NexaBold" }]}>{amount} EC</Text>
                </View>
              </View>
            )}

            {/* CTA */}
            <TouchableOpacity
              style={[s.ctaBtn, { opacity: loadingPay ? 0.72 : 1 }]}
              onPress={handleConfirmPress}
              disabled={loadingPay}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={[C.blue, C.deep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.ctaGrad}
              >
                {loadingPay
                  ? <ActivityIndicator size="small" color={C.white} />
                  : <>
                      <Ionicons name="checkmark-circle-outline" size={22} color={C.white} />
                      <Text style={s.ctaText}>Confirmer le retrait</Text>
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Secure footer */}
            <View style={s.secureRow}>
              <Ionicons name="lock-closed-outline" size={12} color={C.textMut} />
              <Text style={s.secureText}>Opération sécurisée par BIMNext</Text>
            </View>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* ─── FEEDBACK MODAL ─────────────────────────────────────────────── */}
      <Modal transparent visible={feedback !== null} animationType="none" onRequestClose={hideFeedback}>
        <TouchableOpacity style={fb.overlay} activeOpacity={1} onPress={hideFeedback}>
          <Animated.View style={[fb.sheet, { opacity: fbOpac, transform: [{ scale: fbScale }] }]}>
            <View style={[fb.iconWrap, {
              backgroundColor: feedback === "success" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
            }]}>
              <Ionicons
                name={feedback === "success" ? "checkmark-circle" : "close-circle"}
                size={56}
                color={feedback === "success" ? C.success : C.error}
              />
            </View>
            <Text style={fb.title}>{feedback === "success" ? "Retrait réussi !" : "Opération échouée"}</Text>
            <Text style={fb.msg}>{feedbackMsg}</Text>
            <TouchableOpacity
              style={[fb.btn, { backgroundColor: feedback === "success" ? C.success : C.error }]}
              onPress={hideFeedback}
              activeOpacity={0.85}
            >
              <Text style={fb.btnText}>OK</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  safeTop: {
    backgroundColor: Platform.OS === "android" ? C.surface : C.topBarBg,
  },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Platform.OS === "android" ? C.surface : C.topBarBg,
    borderBottomWidth: 1, borderBottomColor: C.topBord,
  },
  iconBtn:     { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  topBarTitle: { fontFamily: "NexaBold", fontSize: 17, color: C.primary, flex: 1, textAlign: "center" },
  badge:     { position: "absolute", top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#DC0302", alignItems: "center", justifyContent: "center", paddingHorizontal: 3, borderWidth: 1.5, borderColor: "#FFFFFF" },
  badgeText: { color: "#FFFFFF", fontSize: 9, fontFamily: "NexaBold" },

  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  hero:         { alignItems: "center", paddingVertical: 24, gap: 12 },
  heroIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.infoBg,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12,
    elevation: 2,
  },
  heroSub: { fontFamily: "NexaLight", fontSize: 14, color: C.textSec, textAlign: "center", maxWidth: 280, lineHeight: 20 },

  infoBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: C.infoBg,
    borderRadius: 16, borderWidth: 1, borderColor: C.infoBord,
    padding: 14, marginBottom: 16,
  },
  infoText: { flex: 1, fontFamily: "NexaLight", fontSize: 13, color: C.primary, lineHeight: 19 },

  card: {
    backgroundColor: C.surface, borderRadius: 28, padding: 20,
    borderWidth: 1, borderColor: C.cardBord,
    elevation: 4, shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20,
  },

  sectionHead:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  sectionLabel: { fontFamily: "NexaBold", fontSize: 11, color: C.primary, letterSpacing: 1.2, textTransform: "uppercase" },

  amountWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.amtBg,
    borderRadius: 18, paddingHorizontal: 20, paddingVertical: 14,
    marginBottom: 14,
  },
  ecPrefix:    { fontFamily: "NexaBold", fontSize: 20, color: "rgba(0,53,197,0.35)", marginRight: 10 },
  amountInput: { flex: 1, fontFamily: "NexaBold", fontSize: 34, color: C.primary },

  shortcuts:      { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  chip:           { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: C.chipBg, borderWidth: 1, borderColor: C.border },
  chipActive:     { backgroundColor: C.primary, borderColor: C.primary },
  chipText:       { fontFamily: "NexaBold", fontSize: 12, color: C.textSec },
  chipTextActive: { color: "#FFFFFF" },

  agentCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.surface, borderRadius: 24, padding: 16,
    borderWidth: 1.5, borderColor: C.agtBord,
    marginBottom: 16,
    elevation: 2, shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10,
  },
  agentCardActive: { borderColor: C.primary, borderWidth: 2 },
  agentLogoWrap: {
    width: 54, height: 54, borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.agtBord,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
    elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  agentLogo:       { width: "100%", height: "100%" },
  agentInfo:       { flex: 1 },
  agentName:       { fontFamily: "NexaBold", fontSize: 17, color: C.text, marginBottom: 4 },
  agentStatusRow:  { flexDirection: "row", alignItems: "center", gap: 6 },
  greenDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
  agentStatusText: { fontFamily: "NexaBold", fontSize: 10, color: C.textMut, letterSpacing: 0.6 },

  phoneWrap:  { marginBottom: 16 },
  phoneInput: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.inputBg, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, height: 50,
  },
  phoneField: { flex: 1, fontSize: 14, fontFamily: "NexaLight", color: C.text },

  recap: {
    borderRadius: 14, overflow: "hidden",
    backgroundColor: C.recapBg,
    borderWidth: 1, borderColor: C.recapBord,
    marginBottom: 16,
  },
  recapRow:   { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  recapLabel: { fontFamily: "NexaLight", fontSize: 13, color: C.textSec },
  recapVal:   { fontFamily: "NexaLight", fontSize: 13, color: C.text },

  ctaBtn:  { borderRadius: 18, overflow: "hidden", marginTop: 4 },
  ctaGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18 },
  ctaText: { color: "#FFFFFF", fontFamily: "NexaBold", fontSize: 17 },

  secureRow:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 14, opacity: 0.40 },
  secureText: { fontFamily: "NexaBold", fontSize: 10, color: C.text, textTransform: "uppercase", letterSpacing: 0.6 },

  modalSlide: { justifyContent: "flex-end", margin: 0 },
  pinModal: {
    backgroundColor: C.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: 36, alignItems: "center",
    elevation: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.10, shadowRadius: 20,
  },
  dragHandle:           { width: 40, height: 4, borderRadius: 2, marginBottom: 20, backgroundColor: C.dragBg },
  lockIconWrap:         { width: 66, height: 66, borderRadius: 33, backgroundColor: "rgba(220,3,2,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  pinTitle:             { fontFamily: "NexaBold", fontSize: 18, color: C.text, marginBottom: 6, letterSpacing: 0.2 },
  pinSub:               { fontFamily: "NexaLight", fontSize: 12, color: C.textSec, textAlign: "center", lineHeight: 18, marginBottom: 18, paddingHorizontal: 10 },
  amountReminder:       { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, borderWidth: 1, backgroundColor: C.reminderBg, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 22 },
  amountReminderText:   { fontFamily: "NexaBold", fontSize: 15, color: C.text },
  amountReminderMethod: { fontFamily: "NexaLight", fontSize: 13, color: C.textSec },
  pinErrorRow:          { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  pinErrorText:         { fontFamily: "NexaLight", fontSize: 12, color: "#EF4444" },
  confirmBtn:           { width: "100%", borderRadius: 16, overflow: "hidden", marginTop: 20 },
  confirmGrad:          { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15 },
  confirmText:          { color: "#FFFFFF", fontFamily: "NexaBold", fontSize: 15 },
  cancelBtn:            { marginTop: 14, paddingVertical: 8 },
  cancelText:           { fontFamily: "NexaLight", fontSize: 13, color: C.textSec },
}); }

const pd = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, marginBottom: 10 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
});

const kp = StyleSheet.create({
  grid:    { flexDirection: "row", flexWrap: "wrap", width: 280, gap: 12, justifyContent: "center", marginTop: 10 },
  key:     { width: 78, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  empty:   { width: 78, height: 56 },
  keyText: { fontSize: 20, fontFamily: "NexaLight", fontWeight: "600" },
});

function mkFb(C: typeof LIGHT) { return StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: 32 },
  sheet:   { backgroundColor: C.surface, borderRadius: 28, padding: 28, alignItems: "center", width: "100%", elevation: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20 },
  iconWrap:{ width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title:   { fontFamily: "NexaBold", fontSize: 20, color: C.text, marginBottom: 10, textAlign: "center" },
  msg:     { fontFamily: "NexaLight", fontSize: 13, color: C.textSec, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  btn:     { paddingHorizontal: 40, paddingVertical: 13, borderRadius: 14 },
  btnText: { color: "#FFFFFF", fontFamily: "NexaBold", fontSize: 15 },
}); }
