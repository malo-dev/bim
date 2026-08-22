/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCreateManualRechargeMutation } from "@/services/tsxService";
import { normalizeDecimal } from "@/utils/normalizeDecimal.util";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useAppTheme } from "@/app/_layout";

/* ─── PALETTE ─────────────────────────────────────────────────────────── */
const _ios = Platform.OS === "ios";
const LIGHT = {
  primary:  "#0035C5",
  deep:     "#302E99",
  gold:     "#FFD700",
  white:    "#FFFFFF",
  error:    "#EF4444",
  success:  "#22C55E",
  bg:       "#F9F9F9",
  surface:  "#FFFFFF",
  text:     "#1A1C1C",
  textSec:  "#434657",
  textMut:  "#747688",
  border:   "rgba(196,197,218,0.40)",
  // Android : tous les fonds semi-transparents → opaques (pas de backdrop blur natif)
  topBarBg:        _ios ? "rgba(255,255,255,0.92)" : "#FFFFFF",
  topBarBord:      "rgba(196,197,218,0.20)",
  glassBg:         _ios ? "rgba(255,255,255,0.75)" : "#FFFFFF",
  glassBord:       _ios ? "rgba(255,255,255,0.85)" : "rgba(196,197,218,0.35)",
  cardInfoBg:      "rgba(0,53,197,0.05)",
  cardInfoBord:    "rgba(0,53,197,0.12)",
  recapBord:       "rgba(196,197,218,0.30)",
  pmHandle:        "rgba(0,0,0,0.10)",
  pmLockBg:        "rgba(0,53,197,0.08)",
  pmReminderBg:    "rgba(0,53,197,0.04)",
  pmReminderBord:  "rgba(196,197,218,0.40)",
  receiptBg:       "#FFFFFF",
  receiptPerfBg:   "#F9F9F9",
  receiptPerfBord: "rgba(196,197,218,0.35)",
  stepsCardBg:     _ios ? "rgba(255,255,255,0.80)" : "#FFFFFF",
  stepsCardBord:   _ios ? "rgba(255,255,255,0.85)" : "rgba(196,197,218,0.35)",
  infoBannerBg:    "rgba(0,53,197,0.05)",
  infoBannerBord:  "rgba(0,53,197,0.12)",
  stepConnBg:      "rgba(196,197,218,0.40)",
};
const DARK: typeof LIGHT = {
  primary:  "#4D8DFF",
  deep:     "#302E99",
  gold:     "#FFD700",
  white:    "#FFFFFF",
  error:    "#EF4444",
  success:  "#22C55E",
  bg:       "#0B1220",
  surface:  "#1A2540",
  text:     "#EAF0FF",
  textSec:  "#9FB0D0",
  textMut:  "#6B7A99",
  border:   "rgba(31,42,68,0.80)",
  topBarBg:        "#1A2540",
  topBarBord:      "rgba(31,42,68,0.80)",
  glassBg:         "rgba(26,37,64,0.75)",
  glassBord:       "rgba(31,42,68,0.80)",
  cardInfoBg:      "rgba(77,150,255,0.05)",
  cardInfoBord:    "rgba(77,150,255,0.12)",
  recapBord:       "rgba(31,42,68,0.80)",
  pmHandle:        "rgba(255,255,255,0.12)",
  pmLockBg:        "rgba(77,150,255,0.08)",
  pmReminderBg:    "rgba(77,150,255,0.04)",
  pmReminderBord:  "rgba(31,42,68,0.80)",
  receiptBg:       "#1A2540",
  receiptPerfBg:   "#0B1220",
  receiptPerfBord: "rgba(31,42,68,0.80)",
  stepsCardBg:     "rgba(26,37,64,0.80)",
  stepsCardBord:   "rgba(31,42,68,0.80)",
  infoBannerBg:    "rgba(77,150,255,0.05)",
  infoBannerBord:  "rgba(77,150,255,0.12)",
  stepConnBg:      "rgba(31,42,68,0.80)",
};

const METHODS = [
  { id: "airtel",   name: "AirtelMoney", logo: "https://images.africanfinancials.com/797d4617-ng-airtel-logo.png",       color: "#E4002B" },
  { id: "orange",   name: "OrangeMoney", logo: "https://c.woopic.com/logo-orange.png",                                   color: "#FF6900" },
  { id: "vodacom",  name: "M-Pesa",      logo: "https://www.vodacom.co.za/themes/custom/blip/img/menu/vodacom-logo.png", color: "#E60000" },
  { id: "africell", name: "AfriMoney",   logo: "https://upload.wikimedia.org/wikipedia/commons/c/c9/AfricellLogo.png",   color: "#0077C8" },
];

const SHORTCUTS       = ["1 000", "2 500", "5 000", "10 000"];
const SHORTCUTS_CLEAN = ["1000",  "2500",  "5000",  "10000"];

/* ─── TOP BAR ─────────────────────────────────────────────────────────── */
function TopBar({ onBack, onNotif, badge = 0 }: { onBack: () => void; onNotif: () => void; badge?: number }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const tb = useMemo(() => mkTb(C), [isDark]);
  return (
    <SafeAreaView edges={["top"]} style={tb.safe}>
      <View style={tb.bar}>
        <TouchableOpacity style={tb.iconBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={tb.brand}>BIM<Text style={{ color: C.primary }}>Next</Text></Text>
        <TouchableOpacity style={tb.iconBtn} onPress={onNotif} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color={C.primary} />
          {badge > 0 && (
            <View style={tb.badge}>
              <Text style={tb.badgeText}>{badge > 99 ? "99+" : badge}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ─── METHOD CARD ─────────────────────────────────────────────────────── */
function MethodCard({ item, selected, onPress }: { item: typeof METHODS[number]; selected: boolean; onPress: () => void }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const ms = useMemo(() => mkMs(C), [isDark]);
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity activeOpacity={1}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start()}
      onPress={onPress}>
      <Animated.View style={[ms.card, selected && { borderColor: C.primary, borderWidth: 2 }, { transform: [{ scale }] }]}>
        <View style={[ms.logoBox, { backgroundColor: item.color + "14" }]}>
          <Image source={{ uri: item.logo }} style={ms.logo} contentFit="contain" transition={200} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ms.name}>{item.name}</Text>
          <Text style={ms.fee}>Demande traitée par notre équipe</Text>
        </View>
        <View style={[ms.radio, selected && { borderColor: C.primary, backgroundColor: "rgba(0,53,197,0.10)" }]}>
          {selected && <View style={ms.radioDot} />}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ─── PENDING SCREEN ──────────────────────────────────────────────────── */
function PendingScreen({
  amount, contactPhone, method, onBack,
}: { amount: string; contactPhone: string; method: string; onBack: () => void }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const pv = useMemo(() => mkPv(C), [isDark]);
  const slideUp = useRef(new Animated.Value(30)).current;
  const fadeIn  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const ref = `BIM-${Date.now().toString(36).toUpperCase().slice(-8)}`;

  return (
    <Animated.View style={[pv.container, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

      {/* ── RECEIPT CARD ─────────────────────────────────────────── */}
      <View style={pv.receipt}>
        {/* Header */}
        <LinearGradient colors={[C.deep, C.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={pv.receiptHeader}>
          <View style={pv.receiptCheckCircle}>
            <Ionicons name="checkmark" size={28} color={C.primary} />
          </View>
          <Text style={pv.receiptTitle}>Demande envoyée</Text>
          <Text style={pv.receiptSub}>Votre demande de recharge est bien enregistrée</Text>
        </LinearGradient>

        {/* Perforated edge */}
        <View style={pv.perfRow}>
          <View style={pv.perfHalf} />
          {Array.from({ length: 10 }).map((_, i) => <View key={i} style={pv.perfDot} />)}
          <View style={pv.perfHalf} />
        </View>

        {/* Details */}
        <View style={pv.receiptBody}>
          <View style={pv.detailRow}>
            <Text style={pv.detailLabel}>Référence</Text>
            <Text style={pv.detailVal}>{ref}</Text>
          </View>
          <View style={pv.detailRow}>
            <Text style={pv.detailLabel}>Date</Text>
            <Text style={pv.detailVal}>{dateStr}</Text>
          </View>
          <View style={pv.detailRow}>
            <Text style={pv.detailLabel}>Heure</Text>
            <Text style={pv.detailVal}>{timeStr}</Text>
          </View>
          <View style={pv.detailRow}>
            <Text style={pv.detailLabel}>Méthode</Text>
            <Text style={pv.detailVal}>{method}</Text>
          </View>
          {contactPhone ? (
            <View style={pv.detailRow}>
              <Text style={pv.detailLabel}>Contact</Text>
              <Text style={pv.detailVal}>+{contactPhone}</Text>
            </View>
          ) : null}
          <View style={pv.detailDivider} />
          <View style={pv.detailRow}>
            <Text style={[pv.detailLabel, { fontFamily: "NexaBold", color: C.text }]}>Montant</Text>
            <Text style={pv.amountVal}>{amount}</Text>
          </View>
        </View>
      </View>

      {/* ── STEPS ────────────────────────────────────────────────── */}
      <View style={pv.stepsCard}>
        <Text style={pv.stepsTitle}>Prochaines étapes</Text>

        <View style={pv.step}>
          <View style={[pv.stepNum, { backgroundColor: "rgba(0,53,197,0.08)" }]}>
            <Text style={[pv.stepNumText, { color: C.primary }]}>1</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={pv.stepTitle}>Appel de confirmation</Text>
            <Text style={pv.stepDesc}>
              Notre équipe support vous appellera{contactPhone ? ` au +${contactPhone}` : ""} pour confirmer votre recharge.
            </Text>
          </View>
        </View>

        <View style={pv.stepConnector} />

        <View style={pv.step}>
          <View style={[pv.stepNum, { backgroundColor: "rgba(34,197,94,0.08)" }]}>
            <Text style={[pv.stepNumText, { color: C.success }]}>2</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={pv.stepTitle}>Compte crédité</Text>
            <Text style={pv.stepDesc}>Après confirmation, votre compte sera crédité de {amount} et vous recevrez une notification et un email.</Text>
          </View>
        </View>
      </View>

      {/* ── INFO ─────────────────────────────────────────────────── */}
      <View style={pv.infoBanner}>
        <Ionicons name="call-outline" size={16} color={C.primary} />
        <Text style={pv.infoText}>Restez disponible. Notre équipe vous contacte dans les plus brefs délais.</Text>
      </View>

      {/* ── BTN ──────────────────────────────────────────────────── */}
      <TouchableOpacity style={pv.backBtn} onPress={onBack} activeOpacity={0.88}>
        <LinearGradient colors={[C.deep, C.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={pv.backGrad}>
          <Ionicons name="home-outline" size={18} color={C.white} />
          <Text style={pv.backText}>Retour à l'accueil</Text>
        </LinearGradient>
      </TouchableOpacity>

    </Animated.View>
  );
}

/* ─── MAIN SCREEN ─────────────────────────────────────────────────────── */
export default function RechargeEcoinsScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router = useRouter();
  const { unread: notifCount } = useUnreadNotifications();

  const [amount,         setAmount]         = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [phone,          setPhone]          = useState("");
  const [userId,         setUserId]         = useState<string | null>(null);

  /* Card-specific fields */
  const [cardName,      setCardName]      = useState("");
  const [contactPhone,  setContactPhone]  = useState("");
  const [cardRef,       setCardRef]       = useState("");

  type Phase = "idle" | "pending";
  const [phase,       setPhase]       = useState<Phase>("idle");
  const [pendingInfo, setPendingInfo]  = useState({ amount: "", contact: "", method: "" });

  const inputFocAmt  = useRef(new Animated.Value(0)).current;
  const inputFocPh   = useRef(new Animated.Value(0)).current;
  const inputFocName = useRef(new Animated.Value(0)).current;
  const inputFocRef  = useRef(new Animated.Value(0)).current;
  const inputFocCont = useRef(new Animated.Value(0)).current;

  const isCard   = selectedMethod === "Card";
  const isMobile = selectedMethod !== null && !isCard;

  const [createManualRecharge, { isLoading: submitting }] = useCreateManualRechargeMutation();

  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);

  const focusAnim = (anim: Animated.Value, v: number) =>
    Animated.timing(anim, { toValue: v, duration: 200, useNativeDriver: false }).start();

  const borderOf = (anim: Animated.Value) =>
    anim.interpolate({ inputRange: [0,1], outputRange: [C.border, C.primary] });

  const cleanAmount = (v: string) => v.replace(/\s/g, "");

  const handleConfirmPress = async () => {
    if (!amount || !selectedMethod) {
      Alert.alert("Champs manquants", "Veuillez sélectionner un montant et une méthode."); return;
    }
    if (isMobile && !phone) {
      Alert.alert("Champs manquants", "Veuillez entrer votre numéro de téléphone."); return;
    }
    if (isCard && (!cardName || !contactPhone || !cardRef)) {
      Alert.alert("Champs manquants", "Veuillez remplir tous les champs de la carte."); return;
    }
    if (!userId) {
      Alert.alert("Erreur", "Utilisateur introuvable. Veuillez vous reconnecter."); return;
    }
    try {
      await createManualRecharge({
        id:        userId,
        amount:    parseFloat(amount.replace(",", ".")),
        telephone: isMobile ? phone : contactPhone,
        method:    selectedMethod,
      }).unwrap();
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Une erreur est survenue. Réessayez."); return;
    }
    setPendingInfo({
      amount: `${amount} EC`,
      contact: isMobile ? phone : contactPhone,
      method:  selectedMethod ?? "",
    });
    setPhase("pending");
  };

  const topBar = (
    <TopBar
      onBack={() => router.back()}
      onNotif={() => router.push("/notification" as any)}
      badge={notifCount}
    />
  );

  if (phase === "pending") return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />{topBar}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <PendingScreen
          amount={pendingInfo.amount}
          contactPhone={pendingInfo.contact}
          method={pendingInfo.method}
          onBack={() => router.replace("/(tabs)" as any)}
        />
      </ScrollView>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      {topBar}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── TITRE ────────────────────────────────────────────────── */}
          <View style={s.titleSection}>
            <Text style={s.pageTitle}>Recharge</Text>
            <Text style={s.pageSub}>Rechargez vos Ecoins facilement</Text>
          </View>

          {/* ── MONTANT ──────────────────────────────────────────────── */}
          <View style={s.glassCard}>
            <Text style={s.sectionLabel}>Montant à recharger</Text>
            <Animated.View style={[s.amountRow, { borderColor: borderOf(inputFocAmt) }]}>
              <Text style={s.amountCurrency}>EC</Text>
              <TextInput
                placeholder="0" placeholderTextColor={C.textMut} keyboardType="numeric"
                style={s.amountInput} value={amount} onChangeText={setAmount}
                onFocus={() => focusAnim(inputFocAmt, 1)} onBlur={() => focusAnim(inputFocAmt, 0)}
                returnKeyType="done"
              />
              {amount.length > 0 && (
                <TouchableOpacity onPress={() => setAmount("")}>
                  <Ionicons name="close-circle" size={20} color={C.textMut} />
                </TouchableOpacity>
              )}
            </Animated.View>
            <View style={s.shortcuts}>
              {SHORTCUTS.map((v, i) => {
                const clean = SHORTCUTS_CLEAN[i]; const active = amount === clean;
                return (
                  <TouchableOpacity key={v}
                    style={[s.chip, { backgroundColor: active ? C.primary : C.surface, borderColor: active ? C.primary : C.border }]}
                    onPress={() => setAmount(clean)} activeOpacity={0.8}>
                    <Text style={[s.chipText, { color: active ? C.white : C.textSec, fontFamily: active ? "NexaBold" : "NexaLight" }]}>{v}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── MOBILE MONEY ─────────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Mobile Money</Text>
            <View style={s.methodsList}>
              {METHODS.map((item) => (
                <MethodCard key={item.id} item={item}
                  selected={selectedMethod === item.name}
                  onPress={() => setSelectedMethod(item.name)} />
              ))}
            </View>
          </View>

          {/* ── NUMÉRO MOBILE ────────────────────────────────────────── */}
          {isMobile && (
            <View style={s.glassCard}>
              <Text style={s.sectionLabel}>Votre numéro ({selectedMethod})</Text>
              <Animated.View style={[s.inputRow, { borderColor: borderOf(inputFocPh) }]}>
                <Text style={s.prefix}>+</Text>
                <View style={s.prefixDivider} />
                <TextInput
                  placeholder="243812 345 678" placeholderTextColor={C.textMut}
                  keyboardType="numeric" style={s.inputField}
                  value={phone} onChangeText={setPhone}
                  onFocus={() => focusAnim(inputFocPh, 1)} onBlur={() => focusAnim(inputFocPh, 0)}
                  returnKeyType="done" onSubmitEditing={Keyboard.dismiss}
                />
                {phone.length > 0 && (
                  <TouchableOpacity onPress={() => setPhone("")}>
                    <Ionicons name="close-circle" size={18} color={C.textMut} />
                  </TouchableOpacity>
                )}
              </Animated.View>
            </View>
          )}

          {/* ── CARTE BANCAIRE ───────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Carte bancaire</Text>
            <TouchableOpacity activeOpacity={0.88} onPress={() => setSelectedMethod("Card")}>
              <View style={[s.cardOption, isCard && { borderColor: C.primary, borderWidth: 2 }]}>
                <LinearGradient colors={["#0A0E3A", "#0035C5", "#071A6E"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <View style={s.cardDeco1} /><View style={s.cardDeco2} />
                {isCard && (
                  <View style={s.cardCheck}><Ionicons name="checkmark" size={12} color={C.deep} /></View>
                )}
                <View style={s.cardRow}>
                  <Text style={s.cardBank}>BIM BANK</Text>
                  <View style={s.cardChip}><View style={s.cardChipH} /><View style={s.cardChipV} /></View>
                </View>
                <Text style={s.cardNum}>•••• •••• •••• ••••</Text>
                <View style={s.cardBottom}>
                  <View><Text style={s.cardLabel}>TITULAIRE</Text><Text style={s.cardValue}>VOTRE NOM</Text></View>
                  <View><Text style={s.cardLabel}>EXPIRE</Text><Text style={s.cardValue}>12/27</Text></View>
                  <Text style={s.cardVisa}>VISA</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── CHAMPS CARTE ─────────────────────────────────────────── */}
          {isCard && (
            <View style={s.glassCard}>
              <Text style={s.sectionLabel}>Informations de la demande</Text>

              {/* Nom */}
              <Text style={s.fieldLabel}>Nom complet du titulaire</Text>
              <Animated.View style={[s.inputRow, { borderColor: borderOf(inputFocName), marginBottom: 14 }]}>
                <Ionicons name="person-outline" size={16} color={C.textMut} />
                <TextInput
                  placeholder="Votre nom complet" placeholderTextColor={C.textMut}
                  style={s.inputField} value={cardName} onChangeText={setCardName}
                  onFocus={() => focusAnim(inputFocName, 1)} onBlur={() => focusAnim(inputFocName, 0)}
                  returnKeyType="next"
                />
              </Animated.View>

              {/* Numéro de référence carte */}
              <Text style={s.fieldLabel}>Numéro de référence / carte</Text>
              <Animated.View style={[s.inputRow, { borderColor: borderOf(inputFocRef), marginBottom: 14 }]}>
                <Ionicons name="card-outline" size={16} color={C.textMut} />
                <TextInput
                  placeholder="XXXX XXXX XXXX XXXX" placeholderTextColor={C.textMut}
                  keyboardType="numeric" style={s.inputField} value={cardRef} onChangeText={setCardRef}
                  onFocus={() => focusAnim(inputFocRef, 1)} onBlur={() => focusAnim(inputFocRef, 0)}
                  returnKeyType="next"
                />
              </Animated.View>

              {/* Numéro de contact */}
              <Text style={s.fieldLabel}>Numéro de contact (en cas d'erreur)</Text>
              <Animated.View style={[s.inputRow, { borderColor: borderOf(inputFocCont) }]}>
                <Text style={s.prefix}>+</Text>
                <View style={s.prefixDivider} />
                <TextInput
                  placeholder="243812 345 678" placeholderTextColor={C.textMut}
                  keyboardType="numeric" style={s.inputField} value={contactPhone} onChangeText={setContactPhone}
                  onFocus={() => focusAnim(inputFocCont, 1)} onBlur={() => focusAnim(inputFocCont, 0)}
                  returnKeyType="done" onSubmitEditing={Keyboard.dismiss}
                />
              </Animated.View>

              <View style={s.cardInfoNote}>
                <Ionicons name="information-circle-outline" size={14} color={C.primary} />
                <Text style={s.cardInfoText}>Notre équipe vous appellera sur ce numéro pour finaliser la recharge.</Text>
              </View>
            </View>
          )}

          {/* ── RECAP ────────────────────────────────────────────────── */}
          {amount && selectedMethod && (
            <View style={s.recapCard}>
              <View style={s.recapRow}>
                <Text style={s.recapLabel}>Méthode</Text>
                <Text style={s.recapVal}>{selectedMethod}</Text>
              </View>
              {isMobile && phone ? (
                <View style={s.recapRow}>
                  <Text style={s.recapLabel}>Numéro</Text>
                  <Text style={s.recapVal}>+{phone}</Text>
                </View>
              ) : null}
              {isCard && cardName ? (
                <View style={s.recapRow}>
                  <Text style={s.recapLabel}>Titulaire</Text>
                  <Text style={s.recapVal}>{cardName}</Text>
                </View>
              ) : null}
              <View style={[s.recapRow, { borderBottomWidth: 0 }]}>
                <Text style={s.recapLabel}>Montant</Text>
                <Text style={[s.recapVal, { color: C.primary, fontFamily: "NexaBold" }]}>{amount} EC</Text>
              </View>
            </View>
          )}

          {/* ── CTA ──────────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[s.ctaBtn, { opacity: submitting ? 0.7 : 1 }]}
            onPress={handleConfirmPress}
            disabled={submitting}
            activeOpacity={0.88}
          >
            <LinearGradient colors={[C.deep, C.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaGrad}>
              {submitting
                ? <ActivityIndicator size="small" color={C.white} />
                : <><Ionicons name="send-outline" size={18} color={C.white} /><Text style={s.ctaText}>Envoyer la demande</Text></>
              }
            </LinearGradient>
          </TouchableOpacity>

          <View style={s.secureRow}>
            <Ionicons name="lock-closed-outline" size={12} color={C.textMut} />
            <Text style={s.secureText}>Demande traitée manuellement par notre équipe BIM</Text>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </TouchableWithoutFeedback>

    </KeyboardAvoidingView>
  );
}

/* ─── STYLES ──────────────────────────────────────────────────────────── */
function mkTb(C: typeof LIGHT) { return StyleSheet.create({
  safe:      { backgroundColor: Platform.OS === "android" ? C.surface : C.topBarBg, borderBottomWidth: 1, borderBottomColor: C.topBarBord },
  bar:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  iconBtn:   { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  brand:     { fontFamily: "NexaBold", fontSize: 18, color: C.text },
  badge:     { position: "absolute", top: -3, right: -3, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 3, borderWidth: 1.5, borderColor: C.white },
  badgeText: { color: "#FFFFFF", fontSize: 9, fontFamily: "NexaBold", lineHeight: 12 },
}); }

function mkS(C: typeof LIGHT) { return StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  titleSection: { marginBottom: 20, marginTop: 8 },
  pageTitle:    { fontFamily: "NexaBold", fontSize: 28, color: C.text, lineHeight: 34 },
  pageSub:      { fontFamily: "NexaLight", fontSize: 15, color: C.textSec, marginTop: 4 },

  glassCard: { backgroundColor: C.glassBg, borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: C.glassBord, elevation: 2, shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 16 },
  sectionLabel: { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.6 },
  fieldLabel:   { fontFamily: "NexaLight", fontSize: 12, color: C.textSec, marginBottom: 6 },

  amountRow:      { flexDirection: "row", alignItems: "center", borderBottomWidth: 2, paddingBottom: 10, marginBottom: 16 },
  amountCurrency: { fontFamily: "NexaBold", fontSize: 20, color: C.primary, marginRight: 6 },
  amountInput:    { flex: 1, fontSize: 38, fontFamily: "NexaBold", color: C.text, padding: 0 },
  shortcuts:      { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip:           { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, borderWidth: 1.5 },
  chipText:       { fontSize: 12 },

  section:      { marginBottom: 16 },
  sectionTitle: { fontFamily: "NexaBold", fontSize: 14, color: C.text, marginBottom: 10 },
  methodsList:  { gap: 10 },

  inputRow:      { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 16, height: 50, paddingHorizontal: 14, gap: 10 },
  prefix:        { fontFamily: "NexaLight", fontSize: 15, color: C.primary },
  prefixDivider: { width: 1, height: 20, backgroundColor: C.border },
  inputField:    { flex: 1, fontSize: 15, fontFamily: "NexaLight", color: C.text },

  cardOption:  { borderRadius: 20, overflow: "hidden", height: 168, padding: 20, justifyContent: "space-between", borderWidth: 2, borderColor: "transparent", elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
  cardDeco1:   { position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,255,255,0.05)", top: -50, right: -40 },
  cardDeco2:   { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.04)", bottom: -30, left: -20 },
  cardCheck:   { position: "absolute", top: 10, right: 10, zIndex: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: "#FFD700", alignItems: "center", justifyContent: "center" },
  cardRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardBank:    { color: "#FFFFFF", fontFamily: "NexaLight", fontSize: 16, letterSpacing: 3, fontWeight: "700" },
  cardChip:    { width: 34, height: 26, borderRadius: 5, backgroundColor: "#D4A017", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  cardChipH:   { position: "absolute", width: "100%", height: 1, backgroundColor: "rgba(0,0,0,0.2)" },
  cardChipV:   { position: "absolute", width: 1, height: "100%", backgroundColor: "rgba(0,0,0,0.2)" },
  cardNum:     { color: "rgba(255,255,255,0.90)", fontFamily: "NexaLight", fontSize: 18, letterSpacing: 4, textAlign: "center" },
  cardBottom:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  cardLabel:   { color: "rgba(255,255,255,0.50)", fontFamily: "NexaLight", fontSize: 8, letterSpacing: 1, marginBottom: 2 },
  cardValue:   { color: "#FFFFFF", fontFamily: "NexaLight", fontSize: 12, letterSpacing: 1 },
  cardVisa:    { color: "#FFFFFF", fontSize: 22, fontStyle: "italic", fontWeight: "700", letterSpacing: 1 },

  cardInfoNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 14, backgroundColor: C.cardInfoBg, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: C.cardInfoBord },
  cardInfoText: { flex: 1, fontFamily: "NexaLight", fontSize: 12, color: C.textSec, lineHeight: 18 },

  recapCard:   { backgroundColor: C.glassBg, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.glassBord, elevation: 2, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
  recapRow:    { flexDirection: "row", justifyContent: "space-between", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.recapBord },
  recapLabel:  { fontFamily: "NexaLight", fontSize: 13, color: C.textMut },
  recapVal:    { fontFamily: "NexaLight", fontSize: 13, color: C.text },

  ctaBtn:    { borderRadius: 24, overflow: "hidden", marginBottom: 14 },
  ctaGrad:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  ctaText:   { color: "#FFFFFF", fontFamily: "NexaBold", fontSize: 15 },
  secureRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 8 },
  secureText:{ fontFamily: "NexaLight", fontSize: 11, color: C.textMut, textAlign: "center" },
}); }

function mkMs(C: typeof LIGHT) { return StyleSheet.create({
  card:     { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.glassBg, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, paddingVertical: 14, paddingHorizontal: 16, elevation: 2, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
  logoBox:  { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  logo:     { width: 34, height: 34 },
  name:     { fontFamily: "NexaBold", fontSize: 14, color: C.text, marginBottom: 3 },
  fee:      { fontFamily: "NexaLight", fontSize: 11, color: C.textMut },
  radio:    { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
}); }

function mkPv(C: typeof LIGHT) { return StyleSheet.create({
  container: { alignItems: "center", paddingTop: 20, paddingBottom: 20 },

  /* receipt */
  receipt:           { width: "100%", borderRadius: 24, overflow: "hidden", marginBottom: 16, elevation: 4, shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 18 },
  receiptHeader:     { alignItems: "center", paddingTop: 28, paddingBottom: 24, paddingHorizontal: 20 },
  receiptCheckCircle:{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  receiptTitle:      { fontFamily: "NexaBold", fontSize: 20, color: "#FFFFFF", marginBottom: 6 },
  receiptSub:        { fontFamily: "NexaLight", fontSize: 12, color: "rgba(255,255,255,0.80)", textAlign: "center" },
  perfRow:           { flexDirection: "row", alignItems: "center", backgroundColor: C.receiptPerfBg },
  perfHalf:          { flex: 1, height: 1, backgroundColor: C.receiptPerfBord },
  perfDot:           { width: 10, height: 10, borderRadius: 5, backgroundColor: C.receiptPerfBg, borderWidth: 1, borderColor: C.receiptPerfBord, marginHorizontal: 2 },
  receiptBody:       { backgroundColor: C.receiptBg, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  detailRow:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  detailLabel:       { fontFamily: "NexaLight", fontSize: 12, color: C.textMut },
  detailVal:         { fontFamily: "NexaLight", fontSize: 12, color: C.text },
  detailDivider:     { height: 1, backgroundColor: C.border, marginVertical: 8 },
  amountVal:         { fontFamily: "NexaBold", fontSize: 18, color: C.primary },

  /* steps */
  stepsCard:      { width: "100%", backgroundColor: C.stepsCardBg, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: C.stepsCardBord, elevation: 2, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
  stepsTitle:     { fontFamily: "NexaBold", fontSize: 13, color: C.text, marginBottom: 16 },
  step:           { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  stepConnector:  { width: 2, height: 16, backgroundColor: C.stepConnBg, marginLeft: 18, marginVertical: 4 },
  stepNum:        { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  stepNumText:    { fontFamily: "NexaBold", fontSize: 15 },
  stepTitle:      { fontFamily: "NexaBold", fontSize: 13, color: C.text, marginBottom: 3, marginTop: 2 },
  stepDesc:       { fontFamily: "NexaLight", fontSize: 12, color: C.textSec, lineHeight: 18 },

  infoBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, width: "100%", backgroundColor: C.infoBannerBg, borderRadius: 16, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: C.infoBannerBord },
  infoText:   { flex: 1, fontFamily: "NexaLight", fontSize: 12, color: C.textSec, lineHeight: 18 },
  backBtn:    { width: "100%", borderRadius: 24, overflow: "hidden" },
  backGrad:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  backText:   { color: "#FFFFFF", fontFamily: "NexaBold", fontSize: 15 },
}); }
