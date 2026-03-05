import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Alert,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Modal from "react-native-modal";
import { useCreateRechargeMutation, useRechargeMutation } from "@/services/tsxService";
import { useVerifyPassMutation } from "@/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeDecimal } from "@/utils/normalizeDecimal.util";

/* ─── THEME ──────────────────────────────────────────────────────────── */
const C = {
  primary: "#0353CC",
  violet:  "#3906C7",
  deep:    "#302E99",
  accent:  "#4D96FF",
  gold:    "#FFD700",
  white:   "#FFFFFF",
  error:   "#EF4444",
  success: "#22C55E",
};

const Colors = {
  light: {
    bg:            "#F0F4FF",
    card:          "#FFFFFF",
    text:          "#0D1B3E",
    textSecondary: "#7B8DB0",
    border:        "rgba(3,83,204,0.12)",
    inputBg:       "rgba(3,83,204,0.06)",
    inputFocBg:    "rgba(3,83,204,0.10)",
    headerGrad:    [C.deep, C.primary] as [string, string],
    shadow:        "#000",
    recapBg:       "rgba(3,83,204,0.05)",
    prefixBorder:  "rgba(3,83,204,0.12)",
    modalBg:       "#FFFFFF",
    pinBorder:     "rgba(3,83,204,0.20)",
    pinFilled:     C.primary,
    lockIconBg:    "rgba(3,83,204,0.08)",
    keyBg:         "rgba(3,83,204,0.06)",
    keyDelBg:      "rgba(239,68,68,0.08)",
  },
  dark: {
    bg:            "#07091A",
    card:          "#0F1228",
    text:          "#E2E8F0",
    textSecondary: "#556080",
    border:        "rgba(77,150,255,0.12)",
    inputBg:       "rgba(77,150,255,0.07)",
    inputFocBg:    "rgba(77,150,255,0.13)",
    headerGrad:    ["#05081A", "#0D1535"] as [string, string],
    shadow:        "#000",
    recapBg:       "rgba(77,150,255,0.06)",
    prefixBorder:  "rgba(77,150,255,0.15)",
    modalBg:       "#0F1228",
    pinBorder:     "rgba(77,150,255,0.20)",
    pinFilled:     C.accent,
    lockIconBg:    "rgba(3,83,204,0.18)",
    keyBg:         "rgba(77,150,255,0.07)",
    keyDelBg:      "rgba(239,68,68,0.12)",
  },
};

function useTheme() {
  const isDark = useColorScheme() === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

/* ─── METHODS ────────────────────────────────────────────────────────── */
const METHODS = [
  { id: "airtel",   name: "AirtelMoney", logo: "https://images.africanfinancials.com/797d4617-ng-airtel-logo.png",  color: "#E4002B" },
  { id: "orange",   name: "OrangeMoney", logo: "https://c.woopic.com/logo-orange.png",                              color: "#FF6900" },
  { id: "vodacom",  name: "M-Pesa",      logo: "https://www.vodacom.co.za/themes/custom/blip/img/menu/vodacom-logo.png", color: "#E60000" },
  { id: "africell", name: "AfriMoney",   logo: "https://upload.wikimedia.org/wikipedia/commons/c/c9/AfricellLogo.png",  color: "#0077C8" },
];

const SHORTCUTS       = ["1 000", "2 500", "5 000", "10 000"];
const SHORTCUTS_CLEAN = ["1000",  "2500",  "5000",  "10000"];

/* ─── METHOD CARD ────────────────────────────────────────────────────── */
function MethodCard({
  item, selected, onPress,
}: { item: typeof METHODS[number]; selected: boolean; onPress: () => void }) {
  const scale    = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
      <Animated.View style={[
        ms.card,
        selected && { borderColor: C.gold, borderWidth: 2.5 },
        { transform: [{ scale }] },
      ]}>
        <LinearGradient
          colors={[C.deep, item.color + "CC"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={ms.deco} />
        {selected && (
          <View style={ms.checkBadge}>
            <Ionicons name="checkmark" size={10} color={C.deep} />
          </View>
        )}
        <Image source={{ uri: item.logo }} style={ms.logo} contentFit="contain" transition={200} />
        <Text style={ms.name}>{item.name}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ─── SECTION LABEL ──────────────────────────────────────────────────── */
function SectionLabel({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={sl.row}>
      <Ionicons name={icon as any} size={14} color={C.primary} style={{ opacity: 0.7 }} />
      <Text style={sl.text}>{title}</Text>
    </View>
  );
}

/* ─── PIN DOTS ───────────────────────────────────────────────────────── */
function PinDots({ value, t }: { value: string; t: typeof Colors.light }) {
  return (
    <View style={pd.row}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={i}
          style={[
            pd.dot,
            {
              backgroundColor: i < value.length ? t.pinFilled : "transparent",
              borderColor:     i < value.length ? t.pinFilled : t.pinBorder,
            },
          ]}
        />
      ))}
    </View>
  );
}

/* ─── KEYPAD ─────────────────────────────────────────────────────────── */
function Keypad({
  onPress, onDelete, t, isDark,
}: {
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
          <TouchableOpacity
            key={i}
            style={[
              kp.key,
              {
                backgroundColor: isDel ? t.keyDelBg : t.keyBg,
                borderColor:     isDel ? "rgba(239,68,68,0.20)" : t.border,
              },
            ]}
            onPress={() => isDel ? onDelete() : onPress(k)}
            activeOpacity={0.7}
          >
            <Text style={[kp.keyText, { color: isDel ? C.error : t.text }]}>{k}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function RechargeEcoinsScreen() {
  const router = useRouter();
  const { isDark, t } = useTheme();
  const { t: tr } = useTranslation();

  const [amount,         setAmount]         = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [phone,          setPhone]          = useState("");
  const [userId,         setUserId]         = useState<string | null>(null);

  /* PIN modal */
  const [showPinModal,  setShowPinModal]  = useState(false);
  const [pinValue,      setPinValue]      = useState("");
  const [pinError,      setPinError]      = useState("");
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingPay,    setLoadingPay]    = useState(false);
  const pinShake = useRef(new Animated.Value(0)).current;

  const inputFocAmt = useRef(new Animated.Value(0)).current;
  const inputFocPh  = useRef(new Animated.Value(0)).current;
  const cardAnim    = useRef(new Animated.Value(50)).current;
  const cardOpac    = useRef(new Animated.Value(0)).current;

  const [createRecharge, { isLoading }] = useCreateRechargeMutation();
  const [recharge]                      = useRechargeMutation();
  const [verifyPass]                    = useVerifyPassMutation();

  useEffect(() => {
    AsyncStorage.getItem("userId").then(setUserId);
    Animated.parallel([
      Animated.timing(cardAnim, { toValue: 0, duration: 420, delay: 100, useNativeDriver: true }),
      Animated.timing(cardOpac, { toValue: 1, duration: 420, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const focusAnim = (anim: Animated.Value, v: number) =>
    Animated.timing(anim, { toValue: v, duration: 200, useNativeDriver: false }).start();

  const borderAmt = inputFocAmt.interpolate({ inputRange: [0, 1], outputRange: [t.border, C.primary] });
  const bgAmt     = inputFocAmt.interpolate({ inputRange: [0, 1], outputRange: [t.inputBg, t.inputFocBg] });
  const borderPh  = inputFocPh.interpolate({  inputRange: [0, 1], outputRange: [t.border, C.primary] });
  const bgPh      = inputFocPh.interpolate({  inputRange: [0, 1], outputRange: [t.inputBg, t.inputFocBg] });

  const cleanAmount = (v: string) => v.replace(/\s/g, "");

  /* ── Step 1 : validate fields → open PIN modal ── */
  const handleConfirmPress = () => {
    if (!amount || !selectedMethod || !phone) {
      Alert.alert(tr("common.missingFields"), tr("common.fillAllFields"));
      return;
    }
    if (!phone.startsWith("243")) {
      Alert.alert(tr("recharge.invalidNumber"), tr("recharge.numberHint"));
      return;
    }
    if (!userId) {
      Alert.alert(tr("common.error"), "Utilisateur introuvable. Veuillez vous reconnecter.");
      return;
    }
    setPinValue("");
    setPinError("");
    setShowPinModal(true);
  };

  /* Shake on wrong PIN */
  const shakePin = () => {
    Animated.sequence([
      Animated.timing(pinShake, { toValue:  10, duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue:  8,  duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue:  0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handlePinKey    = (k: string) => { if (pinValue.length >= 6) return; setPinError(""); setPinValue(p => p + k); };
  const handlePinDelete = () => setPinValue(p => p.slice(0, -1));

  /* ── Step 2 : verifyPass → Step 3 : recharge ── */
  const handleConfirmPin = async () => {
    if (pinValue.length < 6) { setPinError("Veuillez entrer vos 6 chiffres."); return; }
    if (!userId) return;

    try {
      setLoadingVerify(true);
      await verifyPass({ userId, password: pinValue }).unwrap();
    } catch {
      shakePin();
      setPinError("Mot de passe incorrect. Réessayez.");
      setPinValue("");
      setLoadingVerify(false);
      return;
    }
    setLoadingVerify(false);
    setShowPinModal(false);

    /* ── Step 3 : proceed ── */
    try {
      setLoadingPay(true);
      const res: any = await createRecharge({
        amount:       normalizeDecimal(cleanAmount(amount)),
        telephone:    phone,
        id:           userId,
        PayTypeValue: selectedMethod,
      }).unwrap();

      if (res) {
        await recharge({ amount: normalizeDecimal(cleanAmount(amount)), userId }).unwrap();
        Alert.alert("✅ Succès", `Recharge de ${amount} Ecoins réussie !`);
      } else {
        Alert.alert("Échec", "Recharge échouée, veuillez réessayer.");
      }
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Une erreur est survenue lors de la recharge.");
    } finally {
      setLoadingPay(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, { backgroundColor: t.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[s.scroll, { backgroundColor: t.bg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── HEADER ── */}
          <View style={[s.header, { shadowColor: t.shadow }]}>
            <LinearGradient
              colors={t.headerGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.deco1} />
            <View style={s.deco2} />

            <SafeAreaView edges={["top"]} style={{ width: "100%" }}>
              <View style={s.topBar}>
                <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
                  <Ionicons name="arrow-back" size={22} color={C.white} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Recharge Ecoins</Text>
                <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/notification")}>
                  <Ionicons name="notifications-outline" size={22} color={C.white} />
                </TouchableOpacity>
              </View>
            </SafeAreaView>

            <View style={s.headerIcon}>
              <Ionicons name="wallet-outline" size={32} color={C.white} />
            </View>
            <Text style={s.headerSub}>Choisissez un moyen de recharge</Text>
          </View>

          {/* ── FORM CARD ── */}
          <Animated.View style={[
            s.card,
            {
              backgroundColor: t.card,
              shadowColor: t.shadow,
              borderColor: isDark ? t.border : "transparent",
              borderWidth: isDark ? 1 : 0,
              opacity: cardOpac,
              transform: [{ translateY: cardAnim }],
            },
          ]}>
            {isDark && <View style={s.cardShimmer} />}

            {/* Montant */}
            <SectionLabel title="MONTANT À RECHARGER" icon="cash-outline" />
            <Animated.View style={[s.inputBox, { borderColor: borderAmt, backgroundColor: bgAmt }]}>
              <Text style={[s.currency, { color: C.primary }]}>EC</Text>
              <TextInput
                placeholder="0"
                placeholderTextColor={t.textSecondary}
                keyboardType="numeric"
                style={[s.input, { color: t.text }]}
                value={amount}
                onChangeText={setAmount}
                onFocus={() => focusAnim(inputFocAmt, 1)}
                onBlur={() => focusAnim(inputFocAmt, 0)}
                returnKeyType="done"
              />
             {(String(normalizeDecimal(amount ?? '')) ?? '').length > 0 && (
  <TouchableOpacity onPress={() => setAmount("")}>
    <Ionicons name="close-circle" size={18} color={t.textSecondary} />
  </TouchableOpacity>
)}
            </Animated.View>

            {/* Raccourcis */}
            <View style={s.shortcuts}>
              {SHORTCUTS.map((v, i) => {
                const clean  = SHORTCUTS_CLEAN[i];
                const active = amount === clean;
                return (
                  <TouchableOpacity
                    key={v}
                    style={[s.chip, { backgroundColor: active ? C.primary : t.inputBg, borderColor: active ? C.primary : t.border }]}
                    onPress={() => setAmount(clean)}
                  >
                    <Text style={[s.chipText, { color: active ? C.white : t.textSecondary }]}>{v}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Méthodes */}
            <SectionLabel title="SELECTIONNE UNE MÉTHODE DE RECHARGE" icon="phone-portrait-outline" />
            <View style={s.methodsGrid}>
              {METHODS.map((item) => (
                <View key={item.id} style={s.methodWrap}>
                  <MethodCard
                    item={item}
                    selected={selectedMethod === item.name}
                    onPress={() => setSelectedMethod(item.name)}
                  />
                </View>
              ))}
            </View>

            {/* Téléphone */}
            {selectedMethod && (
              <>
                <SectionLabel title={`NUMÉRO (${selectedMethod})`} icon="call-outline" />
                <Animated.View style={[s.inputBox, { borderColor: borderPh, backgroundColor: bgPh }]}>
                  <Text style={[s.prefixBadge, { color: C.primary, borderRightColor: t.prefixBorder }]}>+</Text>
                  <TextInput
                    placeholder="243812 345 678"
                    placeholderTextColor={t.textSecondary}
                    keyboardType="numeric"
                    style={[s.input, { color: t.text }]}
                    value={phone}
                    onChangeText={setPhone}
                    onFocus={() => focusAnim(inputFocPh, 1)}
                    onBlur={() => focusAnim(inputFocPh, 0)}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  {phone.length > 0 && (
                    <TouchableOpacity onPress={() => setPhone("")}>
                      <Ionicons name="close-circle" size={18} color={t.textSecondary} />
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </>
            )}

            {/* Récap */}
            {amount && selectedMethod && (
              <View style={[s.recap, { backgroundColor: t.recapBg, borderColor: t.border }]}>
                <View style={[s.recapRow, { borderBottomColor: t.border }]}>
                  <Text style={[s.recapLabel, { color: t.textSecondary }]}>Méthode</Text>
                  <Text style={[s.recapVal, { color: t.text }]}>{selectedMethod}</Text>
                </View>
                <View style={[s.recapRow, { borderBottomWidth: 0 }]}>
                  <Text style={[s.recapLabel, { color: t.textSecondary }]}>Montant</Text>
                  <Text style={[s.recapVal, { color: C.primary }]}>{amount} EC</Text>
                </View>
              </View>
            )}

            {/* CTA */}
            <View style={s.cta}>
              <GradientButton
                title={loadingPay ? "Traitement…" : "Confirmer la recharge"}
                onPress={handleConfirmPress}
                leftIcon={<ArrowIcon width={18} height={12} color={C.violet} />}
                rightIcon={<ArrowRightIcon width={26} height={20} />}
                isLoad={loadingPay}
              />
            </View>

            <View style={s.secureRow}>
              <Ionicons name="lock-closed-outline" size={12} color={t.textSecondary} />
              <Text style={[s.secureText, { color: t.textSecondary }]}>Paiement sécurisé par BIM</Text>
            </View>
          </Animated.View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* ══════════════════════════════════════════════
          ── PIN MODAL ──
      ══════════════════════════════════════════════ */}
      <Modal
        isVisible={showPinModal}
        onBackdropPress={() => { if (!loadingVerify) setShowPinModal(false); }}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={s.modalSlide}
        avoidKeyboard
      >
        <View style={[
          s.pinModal,
          {
            backgroundColor: t.modalBg,
            borderColor: isDark ? t.border : "transparent",
            borderWidth: isDark ? 1 : 0,
          },
        ]}>
          {/* Drag handle */}
          <View style={[s.dragHandle, { backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)" }]} />

          {/* Lock icon */}
          <View style={[s.lockIconWrap, { backgroundColor: t.lockIconBg }]}>
            <Ionicons name="lock-closed" size={28} color={C.primary} />
          </View>

          <Text style={[s.pinTitle, { color: t.text }]}>Mot de passe requis</Text>
          <Text style={[s.pinSub, { color: t.textSecondary }]}>
            Entrez votre code à 6 chiffres pour confirmer la recharge
          </Text>

          {/* Amount reminder */}
          {amount.length > 0 && (
            <View style={[s.amountReminder, { backgroundColor: t.recapBg, borderColor: t.border }]}>
              <Ionicons name="wallet-outline" size={14} color={C.primary} />
              <Text style={[s.amountReminderText, { color: t.text }]}>
                {Number(normalizeDecimal(cleanAmount(amount))).toLocaleString("fr-FR")} EC
              </Text>
              {selectedMethod && (
                <Text style={[s.amountReminderMethod, { color: t.textSecondary }]}>
                  · {selectedMethod}
                </Text>
              )}
            </View>
          )}

          {/* PIN dots */}
          <Animated.View style={{ transform: [{ translateX: pinShake }] }}>
            <PinDots value={pinValue} t={t} />
          </Animated.View>

          {/* Error */}
          {pinError.length > 0 && (
            <View style={s.pinErrorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={C.error} />
              <Text style={s.pinErrorText}>{pinError}</Text>
            </View>
          )}

          {/* Keypad */}
          <Keypad onPress={handlePinKey} onDelete={handlePinDelete} t={t} isDark={isDark} />

          {/* Confirm */}
          <TouchableOpacity
            style={[s.confirmBtn, { opacity: pinValue.length === 6 ? 1 : 0.5 }]}
            onPress={handleConfirmPin}
            disabled={loadingVerify || pinValue.length < 6}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[C.deep, C.primary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.confirmGrad}
            >
              {loadingVerify
                ? <Ionicons name="sync" size={18} color={C.white} />
                : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color={C.white} />
                    <Text style={s.confirmText}>Valider</Text>
                  </>
                )
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowPinModal(false)}
            style={s.cancelBtn}
            disabled={loadingVerify}
          >
            <Text style={[s.cancelText, { color: t.textSecondary }]}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  scroll: { paddingBottom: 20 },

  header: {
    height: 220, overflow: "hidden",
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    alignItems: "center", elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16,
  },
  deco1: {
    position: "absolute", width: 180, height: 180,
    borderRadius: 90, backgroundColor: "rgba(255,255,255,0.06)",
    top: -50, right: -40,
  },
  deco2: {
    position: "absolute", width: 120, height: 120,
    borderRadius: 60, backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -20, left: -20,
  },
  topBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 8,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 17, fontFamily: "NexaLight", letterSpacing: 0.3 },
  headerIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    marginTop: 12, borderWidth: 2, borderColor: "rgba(255,255,255,0.25)",
  },
  headerSub: { color: "rgba(255,255,255,0.80)", fontSize: 12, fontFamily: "NexaLight", marginTop: 8 },

  card: {
    borderRadius: 28, padding: 20,
    marginHorizontal: 16, marginTop: -28,
    overflow: "hidden", elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 14,
  },
  cardShimmer: {
    position: "absolute", top: 0, left: 0, right: 0, height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  inputBox: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, height: 50, gap: 10, marginBottom: 12,
  },
  currency:    { fontFamily: "NexaLight", fontSize: 15 },
  prefixBadge: { fontFamily: "NexaLight", fontSize: 13, paddingRight: 4, borderRightWidth: 1 },
  input:       { flex: 1, fontSize: 15, fontFamily: "NexaLight" },

  shortcuts: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 18 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontFamily: "NexaLight", fontSize: 12 },

  methodsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 4 },
  methodWrap:  { width: "48%", marginBottom: 12 },

  recap: { borderRadius: 14, padding: 14, marginBottom: 16, marginTop: 4, borderWidth: 1 },
  recapRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1 },
  recapLabel: { fontFamily: "NexaLight", fontSize: 12 },
  recapVal:   { fontFamily: "NexaLight", fontSize: 12 },

  cta: { marginTop: 4 },
  secureRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 12 },
  secureText: { fontFamily: "NexaLight", fontSize: 11 },

  /* ── PIN modal ── */
  modalSlide: { justifyContent: "flex-end", margin: 0 },
  pinModal: {
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: 36, alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18, shadowRadius: 20,
  },
  dragHandle: { width: 40, height: 4, borderRadius: 2, marginBottom: 20 },
  lockIconWrap: {
    width: 66, height: 66, borderRadius: 33,
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  pinTitle: { fontFamily: "NexaLight", fontSize: 18, marginBottom: 6, letterSpacing: 0.2 },
  pinSub: {
    fontFamily: "NexaLight", fontSize: 12,
    textAlign: "center", lineHeight: 18,
    marginBottom: 18, paddingHorizontal: 10,
  },
  amountReminder: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 8, marginBottom: 22,
  },
  amountReminderText:   { fontFamily: "NexaLight", fontSize: 15, fontWeight: "600" },
  amountReminderMethod: { fontFamily: "NexaLight", fontSize: 13 },

  pinErrorRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  pinErrorText: { fontFamily: "NexaLight", fontSize: 12, color: C.error },

  confirmBtn: { width: "100%", borderRadius: 16, overflow: "hidden", marginTop: 20 },
  confirmGrad: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 10, paddingVertical: 15,
  },
  confirmText: { color: "#FFFFFF", fontFamily: "NexaLight", fontSize: 15 },

  cancelBtn: { marginTop: 14, paddingVertical: 8 },
  cancelText: { fontFamily: "NexaLight", fontSize: 13 },
});

const ms = StyleSheet.create({
  card: {
    borderRadius: 18, paddingVertical: 18,
    alignItems: "center", overflow: "hidden",
    borderWidth: 2, borderColor: "transparent",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6,
  },
  deco: {
    position: "absolute", width: 80, height: 80,
    borderRadius: 40, backgroundColor: "rgba(255,255,255,0.07)",
    top: -20, right: -20,
  },
  checkBadge: {
    position: "absolute", top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.gold, alignItems: "center", justifyContent: "center",
  },
  logo: { width: 48, height: 48, marginBottom: 8 },
  name: { color: "#FFFFFF", fontFamily: "NexaLight", fontSize: 11, textAlign: "center" },
});

const sl = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, marginTop: 4 },
  text: { fontFamily: "NexaLight", fontSize: 11, color: C.primary, textTransform: "uppercase", letterSpacing: 0.8 },
});

const pd = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, marginBottom: 10 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
});

const kp = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", width: 280, gap: 12, justifyContent: "center", marginTop: 10 },
  key:  { width: 78, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  empty:   { width: 78, height: 56 },
  keyText: { fontSize: 20, fontFamily: "NexaLight", fontWeight: "600" },
});