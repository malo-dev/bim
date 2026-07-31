import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCreatePaiementMutation } from "@/services/tsxService";
import { useVerifyPassMutation } from "@/services/authService";
import { normalizeDecimal } from "@/utils/normalizeDecimal.util";
import { useAppTheme } from "@/app/_layout";

/* ─── THEME ──────────────────────────────────────────────────────────── */
const C = {
  primary: "#0353CC",
  violet:  "#3906C7",
  deep:    "#302E99",
  accent:  "#4D96FF",
  white:   "#FFFFFF",
  success: "#22C55E",
  error:   "#EF4444",
  gold:    "#C9A84C",
};

const Colors = {
  light: {
    bg:            "#F0F4FF",
    card:          "#FFFFFF",
    text:          "#0D1B3E",
    textSecondary: "#7B8DB0",
    border:        "rgba(3,83,204,0.15)",
    inputBg:       "rgba(3,83,204,0.06)",
    headerGrad:    [C.deep, C.primary] as [string, string],
    shadow:        "#000",
    modalBg:       "#FFFFFF",
    recapBg:       "rgba(3,83,204,0.05)",
    pinBorder:     "rgba(3,83,204,0.20)",
    pinFilled:     C.primary,
    pinFilledBg:   "rgba(3,83,204,0.10)",
  },
  dark: {
    bg:            "#07091A",
    card:          "#0F1228",
    text:          "#E2E8F0",
    textSecondary: "#556080",
    border:        "rgba(77,150,255,0.12)",
    inputBg:       "rgba(77,150,255,0.07)",
    headerGrad:    ["#05081A", "#0D1535"] as [string, string],
    shadow:        "#000",
    modalBg:       "#0F1228",
    recapBg:       "rgba(77,150,255,0.06)",
    pinBorder:     "rgba(77,150,255,0.20)",
    pinFilled:     C.accent,
    pinFilledBg:   "rgba(77,150,255,0.15)",
  },
};

const SHORTCUTS      = ["500", "1000", "2500", "5000", "10000"];
const SHORTCUT_LABELS = ["500", "1 000", "2 500", "5 000", "10 000"];

/* ─── PIN DOTS ───────────────────────────────────────────────────────── */
function PinDots({ value, t }: { value: string; t: typeof Colors.light }) {
  return (
    <View style={pd.row}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={[pd.dot, {
          backgroundColor: i < value.length ? t.pinFilled : "transparent",
          borderColor:     i < value.length ? t.pinFilled : t.pinBorder,
        }]} />
      ))}
    </View>
  );
}

/* ─── KEYPAD ─────────────────────────────────────────────────────────── */
function Keypad({ onPress, onDelete, t, isDark }: {
  onPress: (v: string) => void;
  onDelete: () => void;
  t: typeof Colors.light;
  isDark: boolean;
}) {
  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return (
    <View style={kp.grid}>
      {keys.map((k, i) => {
        if (k === "") return <View key={i} style={kp.empty} />;
        const isDel = k === "⌫";
        return (
          <TouchableOpacity key={i} activeOpacity={0.7}
            style={[kp.key, {
              backgroundColor: isDel ? (isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)") : t.inputBg,
              borderColor:     isDel ? "rgba(239,68,68,0.20)" : t.border,
            }]}
            onPress={() => isDel ? onDelete() : onPress(k)}
          >
            <Text style={[kp.keyText, { color: isDel ? C.error : t.text }]}>{k}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────── */
export default function Payment() {
  const router = useRouter();
  const { productId, companyId } = useLocalSearchParams();
  const { isDark } = useAppTheme();
  const t = isDark ? Colors.dark : Colors.light;
  const { t: tr } = useTranslation();

  const [payAmount,      setPayAmount]      = useState("");
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [loadingVerify,  setLoadingVerify]  = useState(false);
  const [userId,         setUserId]         = useState<string | null>(null);

  /* ── Modals — séparés pour éviter tout conflit d'état ── */
  const [showPassModal,  setShowPassModal]  = useState(false);
  const [showResultModal,setShowResultModal]= useState(false);
  const [resultData,     setResultData]     = useState<{
    type: "success" | "error"; text: string; description?: string;
  } | null>(null);

  /* ── PIN ── */
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");
  const pinShake = useRef(new Animated.Value(0)).current;

  /* ── Animations card ── */
  const cardAnim = useRef(new Animated.Value(60)).current;
  const cardOpac = useRef(new Animated.Value(0)).current;
  const scaleBtn = useRef(new Animated.Value(1)).current;
  const inputFoc = useRef(new Animated.Value(0)).current;

  const [createPaiement] = useCreatePaiementMutation();
  const [verifyPass]     = useVerifyPassMutation();

  useEffect(() => {
    AsyncStorage.getItem("userId").then(setUserId);
    Animated.parallel([
      Animated.timing(cardAnim, { toValue: 0, duration: 450, delay: 120, useNativeDriver: true }),
      Animated.timing(cardOpac, { toValue: 1, duration: 450, delay: 120, useNativeDriver: true }),
    ]).start();
  }, []);

  const focusIn  = () => Animated.timing(inputFoc, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  const focusOut = () => Animated.timing(inputFoc, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  const pressIn  = () => Animated.spring(scaleBtn, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scaleBtn, { toValue: 1,    useNativeDriver: true }).start();

  const borderColor = inputFoc.interpolate({ inputRange: [0, 1], outputRange: [t.border, C.primary] });
  const bgColor     = inputFoc.interpolate({ inputRange: [0, 1], outputRange: [t.inputBg, isDark ? "rgba(77,150,255,0.12)" : "rgba(3,83,204,0.10)"] });
  const cleanAmount = (v: string) => v.replace(/\s/g, "");

  /* ─── ÉTAPE 1 : valider montant → ouvrir modal PIN ───────────────── */
  const handlePayPress = () => {
    const amount = Number(normalizeDecimal(payAmount));
    if (isNaN(amount) || amount <= 0) {
      showResult("error", tr("common.error"), "Veuillez entrer un montant valide.");
      return;
    }
    if (!userId) {
      showResult("error", tr("common.error"), "Veuillez vous reconnecter.");
      return;
    }
    setPinValue("");
    setPinError("");
    setShowPassModal(true);
  };

  /* ─── Shake PIN ──────────────────────────────────────────────────── */
  const shakePin = () =>
    Animated.sequence([
      Animated.timing(pinShake, { toValue:  10, duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue:  8,  duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue:  0,  duration: 60, useNativeDriver: true }),
    ]).start();

  const handlePinKey    = (k: string) => { if (pinValue.length >= 6) return; setPinError(""); setPinValue(p => p + k); };
  const handlePinDelete = () => setPinValue(p => p.slice(0, -1));

  /* ─── Helper : afficher le modal résultat ────────────────────────── */
  const showResult = (type: "success" | "error", text: string, description?: string) => {
    setResultData({ type, text, description });
    setShowResultModal(true);
  };

  /* ─── ÉTAPE 2 : vérifier PIN → ÉTAPE 3 : paiement ───────────────── */
  const handleConfirmPin = async () => {
    if (pinValue.length < 6) { setPinError(tr("common.pinInvalid")); return; }
    if (!userId) return;

    /* ── Vérification mot de passe ── */
    try {
      setLoadingVerify(true);
      await verifyPass({ userId, password: pinValue }).unwrap();
    } catch {
      shakePin();
      setPinError(tr("common.pinWrong"));
      setPinValue("");
      setLoadingVerify(false);
      return;
    }

    /* PIN OK → fermer le modal PIN AVANT de lancer le paiement */
    setLoadingVerify(false);
    setShowPassModal(false);

    /* Petit délai pour que l'animation slideOut du modal se finisse
       avant d'afficher le loader + le modal résultat */
    await new Promise(r => setTimeout(r, 400));

    /* ── Paiement ── */
    try {
      setLoadingPayment(true);
      await createPaiement({
        amount:          Number(normalizeDecimal(payAmount)),
        companyId:       Number(companyId),
        shippingAddress: "Vers BIM, adresse officielle",
        notes:           "Paiement produit",
        paymentMethod:   "BIM NEXT APP",
        id:              Number(userId),
        productId:       Number(productId),
      }).unwrap();

      /* ✅ Succès */
      showResult("success", tr("payment.successTitle"), tr("payment.successMsg", { amount: payAmount }));
    } catch (err: any) {
      /* ❌ Erreur paiement */
      showResult(
        "error",
        tr("payment.failedTitle"),
        err?.data?.message || tr("common.error")
      );
    } finally {
      setLoadingPayment(false);
    }
  };

  const formatDisplay = (v: any) => Number(v).toLocaleString("fr-FR");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[s.root, { backgroundColor: t.bg }]}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={[s.scrollContent, { backgroundColor: t.bg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── HEADER ── */}
        <View style={[s.header, { shadowColor: t.shadow }]}>
          <LinearGradient colors={t.headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={s.deco1} />
          <View style={s.deco2} />
          <SafeAreaView edges={["top"]} style={{ width: "100%" }}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={22} color={C.white} />
              </TouchableOpacity>
              <Text style={s.headerTitle}>{tr("payment.title")}</Text>
              <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/notification")}>
                <Ionicons name="notifications-outline" size={22} color={C.white} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <View style={s.headerIcon}>
            <Ionicons name="wallet-outline" size={32} color={C.white} />
          </View>
          <Text style={s.headerSub}>{tr("payment.enterAmount")}</Text>
        </View>

        {/* ── CARD ── */}
        <Animated.View style={[s.card, {
          backgroundColor: t.card,
          shadowColor: t.shadow,
          borderColor: isDark ? t.border : "transparent",
          borderWidth: isDark ? 1 : 0,
          opacity: cardOpac,
          transform: [{ translateY: cardAnim }],
        }]}>
          {isDark && <View style={s.cardShimmer} />}

          <View style={s.labelRow}>
            <Ionicons name="cash-outline" size={16} color={C.primary} />
            <Text style={[s.label, { color: C.primary }]}>{tr("payment.amountLabel")}</Text>
          </View>

          <Animated.View style={[s.inputBox, { borderColor, backgroundColor: bgColor }]}>
            <Text style={[s.currency, { color: C.primary }]}>EC</Text>
            <TextInput
              style={[s.input, { color: t.text }]}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={t.textSecondary}
              value={payAmount}
              onChangeText={setPayAmount}
              editable={!loadingPayment}
              onFocus={focusIn}
              onBlur={focusOut}
            />
            {payAmount.length > 0 && (
              <TouchableOpacity onPress={() => setPayAmount("")}>
                <Ionicons name="close-circle" size={20} color={t.textSecondary} />
              </TouchableOpacity>
            )}
          </Animated.View>

          <Text style={[s.shortcutLabel, { color: t.textSecondary }]}>{tr("payment.quickAmounts")}</Text>
          <View style={s.shortcuts}>
            {SHORTCUTS.map((v, i) => {
              const active = cleanAmount(payAmount) === v;
              return (
                <TouchableOpacity key={v}
                  style={[s.chip, { backgroundColor: active ? C.primary : t.inputBg, borderColor: active ? C.primary : t.border }]}
                  onPress={() => setPayAmount(v)}
                >
                  <Text style={[s.chipText, { color: active ? C.white : t.textSecondary }]}>{SHORTCUT_LABELS[i]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {payAmount.length > 0 && Number(cleanAmount(payAmount)) > 0 && (
            <View style={[s.recap, { backgroundColor: t.recapBg, borderColor: t.border }]}>
              <View style={[s.recapRow, { borderBottomColor: t.border }]}>
                <Text style={[s.recapLabel, { color: t.textSecondary }]}>{tr("payment.amount")}</Text>
                <Text style={[s.recapVal,   { color: t.text }]}>{formatDisplay(cleanAmount(payAmount))} EC</Text>
              </View>
              <View style={[s.recapRow, { borderBottomColor: t.border }]}>
                <Text style={[s.recapLabel, { color: t.textSecondary }]}>{tr("payment.method")}</Text>
                <Text style={[s.recapVal,   { color: t.text }]}>BIM NEXT APP</Text>
              </View>
              <View style={[s.recapRow, { borderBottomWidth: 0 }]}>
                <Text style={[s.recapLabel, { color: t.text }]}>{tr("payment.total")}</Text>
                <Text style={[s.recapVal,   { color: C.primary }]}>{formatDisplay(cleanAmount(payAmount))} EC</Text>
              </View>
            </View>
          )}

          {/* ── Bouton principal ── */}
          <TouchableOpacity activeOpacity={1} onPressIn={pressIn} onPressOut={pressOut} onPress={handlePayPress} disabled={loadingPayment}>
            <Animated.View style={[s.payBtn, { transform: [{ scale: scaleBtn }] }]}>
              <LinearGradient colors={[C.deep, C.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.payGrad}>
                {loadingPayment ? (
                  <>
                    <ActivityIndicator color={C.white} size="small" />
                    <Text style={s.payText}>{tr("common.processing")}</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="shield-checkmark-outline" size={18} color={C.white} />
                    <Text style={s.payText}>{tr("payment.confirm")}</Text>
                  </>
                )}
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          <View style={s.secureRow}>
            <Ionicons name="lock-closed-outline" size={12} color={t.textSecondary} />
            <Text style={[s.secureText, { color: t.textSecondary }]}>{tr("payment.secured")}</Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ════════════════════════════════════════════
          MODAL 1 — PIN / Mot de passe
      ════════════════════════════════════════════ */}
      <Modal
        isVisible={showPassModal}
        onBackdropPress={() => { if (!loadingVerify) { setShowPassModal(false); } }}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={s.modalSlide}
        avoidKeyboard
        /* useNativeDriver pour des animations fluides */
        useNativeDriverForBackdrop
      >
        <View style={[s.passModal, {
          backgroundColor: t.modalBg,
          borderColor: isDark ? t.border : "transparent",
          borderWidth: isDark ? 1 : 0,
        }]}>
          <View style={[s.dragHandle, { backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)" }]} />

          <View style={[s.lockIconWrap, { backgroundColor: isDark ? "rgba(3,83,204,0.18)" : "rgba(3,83,204,0.08)" }]}>
            <Ionicons name="lock-closed" size={28} color={C.primary} />
          </View>

          <Text style={[s.passTitle, { color: t.text }]}>{tr("common.pinRequired")}</Text>
          <Text style={[s.passSub, { color: t.textSecondary }]}>
            {tr("payment.pinTitle")}
          </Text>

          {payAmount.length > 0 && (
            <View style={[s.amountReminder, { backgroundColor: t.recapBg, borderColor: t.border }]}>
              <Ionicons name="cash-outline" size={14} color={C.primary} />
              <Text style={[s.amountReminderText, { color: t.text }]}>
                {formatDisplay(normalizeDecimal(payAmount))} EC
              </Text>
            </View>
          )}

          <Animated.View style={{ transform: [{ translateX: pinShake }] }}>
            <PinDots value={pinValue} t={t} />
          </Animated.View>

          {pinError.length > 0 && (
            <View style={s.pinErrorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={C.error} />
              <Text style={s.pinErrorText}>{pinError}</Text>
            </View>
          )}

          <Keypad onPress={handlePinKey} onDelete={handlePinDelete} t={t} isDark={isDark} />

          <TouchableOpacity
            style={[s.confirmBtn, { opacity: pinValue.length === 6 && !loadingVerify ? 1 : 0.5 }]}
            onPress={handleConfirmPin}
            disabled={loadingVerify || pinValue.length < 6}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[C.deep, C.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.confirmGrad}>
              {loadingVerify ? (
                <>
                  <ActivityIndicator color={C.white} size="small" />
                  <Text style={s.confirmText}>{tr("common.processing")}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color={C.white} />
                  <Text style={s.confirmText}>{tr("common.confirm")}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { if (!loadingVerify) setShowPassModal(false); }} style={s.cancelBtn}>
            <Text style={[s.cancelText, { color: t.textSecondary }]}>{tr("common.cancel")}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ════════════════════════════════════════════
          MODAL 2 — RÉSULTAT (succès ou erreur)
          Complètement séparé du modal PIN
      ════════════════════════════════════════════ */}
      <Modal
        isVisible={showResultModal}
        onBackdropPress={() => {
          // Sur succès : retour accueil. Sur erreur : juste fermer.
          if (resultData?.type === "success") {
            setShowResultModal(false);
            router.replace("/(tabs)");
          } else {
            setShowResultModal(false);
          }
        }}
        animationIn="zoomIn"
        animationOut="zoomOut"
        useNativeDriverForBackdrop
      >
        <View style={[s.resultModal, {
          backgroundColor: t.modalBg,
          borderColor: isDark ? t.border : "transparent",
          borderWidth: isDark ? 1 : 0,
        }]}>
          {/* Icône */}
          <View style={[s.resultIcon, {
            backgroundColor: resultData?.type === "success"
              ? "rgba(34,197,94,0.14)"
              : "rgba(239,68,68,0.14)",
          }]}>
            <Ionicons
              name={resultData?.type === "success" ? "checkmark-circle" : "close-circle"}
              size={56}
              color={resultData?.type === "success" ? C.success : C.error}
            />
          </View>

          {/* Titre */}
          <Text style={[s.resultTitle, {
            color: resultData?.type === "success" ? C.success : C.error,
          }]}>
            {resultData?.type === "success" ? tr("payment.successTitle") : tr("payment.failedTitle")}
          </Text>

          {/* Description */}
          <Text style={[s.resultDesc, { color: t.textSecondary }]}>
            {resultData?.description || resultData?.text}
          </Text>

          {/* Boutons */}
          {resultData?.type === "success" ? (
            <TouchableOpacity
              style={s.resultBtnWrap}
              onPress={() => { setShowResultModal(false); router.replace("/(tabs)"); }}
            >
              <LinearGradient colors={[C.deep, C.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.resultBtnGrad}>
                <Ionicons name="home-outline" size={16} color={C.white} />
                <Text style={s.resultBtnText}>{tr("common.back")}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={s.resultBtnRow}>
              <TouchableOpacity
                style={[s.resultBtnErr, { backgroundColor: C.error }]}
                onPress={() => { setShowResultModal(false); router.back(); }}
              >
                <Text style={s.resultBtnErrText}>{tr("common.back")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.resultBtnErr, { backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "#6B7280" }]}
                onPress={() => setShowResultModal(false)}
              >
                <Text style={s.resultBtnErrText}>{tr("payment.errorMsg")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root:          { flex: 1 },
  scrollContent: { alignItems: "center", paddingBottom: 60 },

  header: {
    width: "100%", height: 230, overflow: "hidden",
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    alignItems: "center", elevation: 12,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16,
  },
  deco1: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.06)", top: -50, right: -40 },
  deco2: { position: "absolute", width: 120, height: 120, borderRadius: 60,  backgroundColor: "rgba(255,255,255,0.04)", bottom: -20, left: -20 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" },
  headerTitle: { color: C.white, fontSize: 17, fontFamily: "NexaLight", letterSpacing: 0.3 },
  headerIcon:  { width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginTop: 16, borderWidth: 2, borderColor: "rgba(255,255,255,0.22)" },
  headerSub:   { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "NexaLight", marginTop: 10 },

  card: { borderRadius: 28, padding: 22, width: "92%", marginTop: -28, elevation: 8, overflow: "hidden", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 14 },
  cardShimmer: { position: "absolute", top: 0, left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.07)" },

  labelRow:      { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  label:         { fontSize: 11, fontFamily: "NexaLight", letterSpacing: 0.8, textTransform: "uppercase" },
  inputBox:      { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, height: 56, gap: 10, marginBottom: 16 },
  currency:      { fontFamily: "NexaLight", fontSize: 16, fontWeight: "600" },
  input:         { flex: 1, fontSize: 22, fontFamily: "NexaLight" },
  shortcutLabel: { fontFamily: "NexaLight", fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 },
  shortcuts:     { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  chip:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  chipText:      { fontFamily: "NexaLight", fontSize: 12 },
  recap:         { borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1 },
  recapRow:      { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1 },
  recapLabel:    { fontFamily: "NexaLight", fontSize: 13 },
  recapVal:      { fontFamily: "NexaLight", fontSize: 13 },
  payBtn:        { borderRadius: 16, overflow: "hidden" },
  payGrad:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  payText:       { color: C.white, fontFamily: "NexaLight", fontSize: 15, letterSpacing: 0.3 },
  secureRow:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 12 },
  secureText:    { fontFamily: "NexaLight", fontSize: 11 },

  /* ── Modal PIN ── */
  modalSlide: { justifyContent: "flex-end", margin: 0 },
  passModal:  { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 36, alignItems: "center", elevation: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.18, shadowRadius: 20 },
  dragHandle: { width: 40, height: 4, borderRadius: 2, marginBottom: 20 },
  lockIconWrap:      { width: 66, height: 66, borderRadius: 33, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  passTitle:         { fontFamily: "NexaLight", fontSize: 18, marginBottom: 6, letterSpacing: 0.2 },
  passSub:           { fontFamily: "NexaLight", fontSize: 12, textAlign: "center", lineHeight: 18, marginBottom: 18, paddingHorizontal: 10 },
  amountReminder:    { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 22 },
  amountReminderText:{ fontFamily: "NexaLight", fontSize: 15, fontWeight: "600" },
  confirmBtn:        { width: "100%", borderRadius: 16, overflow: "hidden", marginTop: 20 },
  confirmGrad:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15 },
  confirmText:       { color: C.white, fontFamily: "NexaLight", fontSize: 15 },
  cancelBtn:         { marginTop: 14, paddingVertical: 8 },
  cancelText:        { fontFamily: "NexaLight", fontSize: 13 },
  pinErrorRow:       { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  pinErrorText:      { fontFamily: "NexaLight", fontSize: 12, color: C.error },

  /* ── Modal Résultat ── */
  resultModal:   { borderRadius: 28, padding: 28, alignItems: "center", marginHorizontal: 16 },
  resultIcon:    { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  resultTitle:   { fontFamily: "NexaLight", fontSize: 22, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  resultDesc:    { fontFamily: "NexaLight", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 26 },
  resultBtnWrap: { width: "100%", borderRadius: 16, overflow: "hidden" },
  resultBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  resultBtnText: { color: C.white, fontFamily: "NexaLight", fontSize: 15 },
  resultBtnRow:  { flexDirection: "row", gap: 12, width: "100%" },
  resultBtnErr:  { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  resultBtnErrText: { color: C.white, fontFamily: "NexaLight", fontSize: 14 },
});

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