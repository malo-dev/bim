/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Modal from "react-native-modal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetproductByIdQuery } from "@/services/productServices";
import { useCreatePaiementMutation } from "@/services/tsxService";
import { useVerifyPassMutation } from "@/services/authService";
import { API_URL_BASE } from "@/constants/api";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useAppTheme } from "@/app/_layout";

/* ─── PALETTES ───────────────────────────────────────────────────────── */
const LIGHT = {
  primary: "#0035C5",
  blue:    "#0047FF",
  deep:    "#001257",
  white:   "#FFFFFF",
  bg:      "#F9F9F9",
  text:    "#1A1C1C",
  textSec: "#434657",
  textMut: "#747688",
  border:  "rgba(196,197,218,0.25)",
  error:   "#EF4444",
  green:   "#22C55E",
  safeBarBg:  "rgba(255,255,255,0.96)",
  safeBarBord:"rgba(196,197,218,0.20)",
  contentCard:"#FFFFFF",
  imgBg:      "#FFF8F0",
  payBarBg:   "#FFFFFF",
  qtyCardBg:  "rgba(0,53,197,0.04)",
  qtyCardBord:"rgba(0,53,197,0.10)",
  stepBtnBg:  "#FFFFFF",
  qtyDispBg:  "#FFFFFF",
  quickChipBg:"#FFFFFF",
  calcRowBg:  "#FFFFFF",
  tagBg:      "rgba(0,53,197,0.06)",
  modalBg:    "#FFFFFF",
  pinBorder:  "rgba(0,53,197,0.20)",
  pinInputBg: "rgba(0,53,197,0.08)",
  keyBg:      "rgba(0,53,197,0.06)",
  keyBord:    "rgba(0,53,197,0.15)",
  delBg:      "rgba(239,68,68,0.08)",
  delBord:    "rgba(239,68,68,0.20)",
  lockBg:     "rgba(0,53,197,0.08)",
  amountRowBg:"rgba(0,53,197,0.05)",
  amountBord: "rgba(0,53,197,0.15)",
};
const DARK: typeof LIGHT = {
  primary: "#4D8DFF",
  blue:    "#4D8DFF",
  deep:    "#4D8DFF",
  white:   "#FFFFFF",
  bg:      "#0B1220",
  text:    "#EAF0FF",
  textSec: "#A3B4D0",
  textMut: "#6B7A99",
  border:  "rgba(31,42,68,0.80)",
  error:   "#EF4444",
  green:   "#22C55E",
  safeBarBg:  "rgba(11,18,32,0.94)",
  safeBarBord:"rgba(31,42,68,0.80)",
  contentCard:"#1A2540",
  imgBg:      "#1C1208",
  payBarBg:   "#0F1A2E",
  qtyCardBg:  "rgba(77,141,255,0.06)",
  qtyCardBord:"rgba(77,141,255,0.15)",
  stepBtnBg:  "#1A2540",
  qtyDispBg:  "#1A2540",
  quickChipBg:"#1A2540",
  calcRowBg:  "#1A2540",
  tagBg:      "rgba(77,141,255,0.10)",
  modalBg:    "#1A2540",
  pinBorder:  "rgba(77,141,255,0.30)",
  pinInputBg: "rgba(77,141,255,0.12)",
  keyBg:      "rgba(77,141,255,0.08)",
  keyBord:    "rgba(77,141,255,0.20)",
  delBg:      "rgba(239,68,68,0.10)",
  delBord:    "rgba(239,68,68,0.25)",
  lockBg:     "rgba(77,141,255,0.12)",
  amountRowBg:"rgba(77,141,255,0.08)",
  amountBord: "rgba(77,141,255,0.20)",
};

const FALLBACK_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAp3V7v1PH4-0i-IuXrX6GznP1WZjvBPu6ifR-eR5M8bHCeEGuhcC9qpJuQLFoWQ3txH2pbW7EJpCG3r_slGj2Bg7omRlR0iA17qGkbOEo7syMHw_iJFmnDDcD7HpQNHq2Qd-uuMAZGEHug58KAqm9_T-QayXco2ZVNNbO9c2p9Q9T-DZzYvSRBiZuj0a6XO5TcPHPd_KDKc4ZaFjxZOsWunHkbShHfc4vHH3o9-VddalXFWIx4E7ALPdyj9H76cjl_wpjmXsJ2h8s";

/* ─── PIN DOTS ───────────────────────────────────────────────────────── */
function PinDots({ value }: { value: string }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  return (
    <View style={pd.row}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={[pd.dot, {
          backgroundColor: i < value.length ? C.primary : "transparent",
          borderColor:     i < value.length ? C.primary : C.pinBorder,
        }]} />
      ))}
    </View>
  );
}

/* ─── KEYPAD ─────────────────────────────────────────────────────────── */
function Keypad({ onPress, onDelete }: { onPress: (v: string) => void; onDelete: () => void }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return (
    <View style={kp.grid}>
      {keys.map((k, i) => {
        if (k === "") return <View key={i} style={kp.empty} />;
        const isDel = k === "⌫";
        return (
          <TouchableOpacity
            key={i}
            activeOpacity={0.7}
            style={[kp.key, {
              backgroundColor: isDel ? C.delBg  : C.keyBg,
              borderColor:     isDel ? C.delBord : C.keyBord,
            }]}
            onPress={() => isDel ? onDelete() : onPress(k)}
          >
            <Text style={[kp.keyText, { color: isDel ? C.error : C.text }]}>{k}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────── */
export default function GazProductDetail() {
  const router                   = useRouter();
  const { productId, companyId } = useLocalSearchParams<{ productId: string; companyId: string }>();
  const { unread }               = useUnreadNotifications();
  const { isDark }               = useAppTheme();
  const C                        = isDark ? DARK : LIGHT;
  const s                        = useMemo(() => mkS(C), [isDark]);
  const m                        = useMemo(() => mkM(C), [isDark]);
  const r                        = useMemo(() => mkR(C), [isDark]);

  const { data, isLoading }  = useGetproductByIdQuery(productId, { skip: !productId });
  const [createPaiement]     = useCreatePaiementMutation();
  const [verifyPass]         = useVerifyPassMutation();

  const product   = data?.data ?? data;
  const imageUri  = product?.imageUrl ? `${API_URL_BASE}${product.imageUrl}` : FALLBACK_IMAGE;
  const priceEach = Number(product?.price ?? 0);
  const currency  = product?.currency?.code ?? "EC";

  const [qty,          setQty]          = useState(1);
  const [userId,       setUserId]       = useState<string | null>(null);
  const [showPin,      setShowPin]      = useState(false);
  const [pinValue,     setPinValue]     = useState("");
  const [pinError,     setPinError]     = useState("");
  const [loadingVerify,setLoadingVerify]= useState(false);
  const [loadingPay,   setLoadingPay]   = useState(false);
  const [showResult,   setShowResult]   = useState(false);
  const [resultData,   setResultData]   = useState<{ type: "success" | "error"; description: string } | null>(null);

  const pinShake   = useRef(new Animated.Value(0)).current;
  const totalPrice = qty * priceEach;

  useEffect(() => {
    AsyncStorage.getItem("userId").then(setUserId);
  }, []);

  const openPin = () => {
    if (!userId) return;
    setPinValue(""); setPinError(""); setShowPin(true);
  };

  const shakePin = () =>
    Animated.sequence([
      Animated.timing(pinShake, { toValue:  10, duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue:   8, duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue:  -8, duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue:   0, duration: 60, useNativeDriver: true }),
    ]).start();

  const handlePinKey    = (k: string) => { if (pinValue.length >= 6) return; setPinError(""); setPinValue(p => p + k); };
  const handlePinDelete = () => setPinValue(p => p.slice(0, -1));

  const handleConfirmPin = async () => {
    if (pinValue.length < 6) { setPinError("Code PIN incomplet"); return; }
    if (!userId) return;
    try {
      setLoadingVerify(true);
      await verifyPass({ userId, password: pinValue }).unwrap();
    } catch {
      shakePin();
      setPinError("Code PIN incorrect");
      setPinValue("");
      setLoadingVerify(false);
      return;
    }
    setLoadingVerify(false);
    setShowPin(false);
    await new Promise(res => setTimeout(res, 400));
    try {
      setLoadingPay(true);
      await createPaiement({
        amount:          totalPrice,
        companyId:       Number(companyId),
        shippingAddress: "Vers BIM, adresse officielle",
        notes:           `Paiement gaz — ${qty} bouteille${qty > 1 ? "s" : ""}`,
        paymentMethod:   "BIM NEXT APP",
        id:              Number(userId),
        productId:       Number(productId),
      }).unwrap();
      setResultData({
        type: "success",
        description: `${qty} bouteille${qty > 1 ? "s" : ""} payée${qty > 1 ? "s" : ""} avec succès pour ${totalPrice.toFixed(2)} ${currency}.`,
      });
    } catch (err: any) {
      setResultData({ type: "error", description: err?.data?.message || "Une erreur est survenue." });
    } finally {
      setLoadingPay(false);
      setShowResult(true);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* TOP BAR */}
      <SafeAreaView edges={["top"]} style={s.safeBar}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.primary} />
          </TouchableOpacity>
          <Text style={s.topTitle} numberOfLines={1}>Détail du produit</Text>
          <TouchableOpacity style={s.iconBtnRel} onPress={() => router.push("/notification" as any)}>
            <Ionicons name="notifications-outline" size={22} color={C.textSec} />
            {unread > 0 && (
              <View style={s.badge}><Text style={s.badgeText}>{unread > 99 ? "99+" : unread}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : !product ? (
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={40} color={C.textMut} />
          <Text style={s.emptyText}>Produit introuvable</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

          {/* IMAGE HERO */}
          <View style={[s.imageWrap, { backgroundColor: C.imgBg }]}>
            <Image source={{ uri: imageUri }} style={s.image} contentFit="contain" transition={300} />
            <View style={s.badgeCat}>
              <Text style={s.badgeCatText}>Gaz</Text>
            </View>
            <View style={s.priceWrap}>
              <Text style={s.priceValue}>{priceEach.toFixed(2)}</Text>
              <Text style={s.priceCur}> {currency}/bouteille</Text>
            </View>
          </View>

          {/* CONTENT CARD */}
          <View style={s.contentCard}>
            <Text style={s.name}>{product.name}</Text>

            <View style={s.availRow}>
              <View style={s.availDot} />
              <Text style={s.availText}>Disponible maintenant</Text>
            </View>

            <View style={s.divider} />

            <Text style={s.sectionLabel}>Quantité souhaitée</Text>

            <View style={s.qtyCard}>
              <View style={s.stepperRow}>
                <TouchableOpacity style={s.stepBtn} onPress={() => setQty(q => Math.max(1, q - 1))} activeOpacity={0.7}>
                  <Ionicons name="remove" size={20} color={C.primary} />
                </TouchableOpacity>

                <View style={s.qtyDisplay}>
                  <Text style={s.qtyNum}>{qty}</Text>
                  <Text style={s.qtyUnit}>bouteille{qty > 1 ? "s" : ""}</Text>
                </View>

                <TouchableOpacity style={s.stepBtn} onPress={() => setQty(q => q + 1)} activeOpacity={0.7}>
                  <Ionicons name="add" size={20} color={C.primary} />
                </TouchableOpacity>
              </View>

              <View style={s.quickRow}>
                {[1, 2, 3, 5].map(v => (
                  <TouchableOpacity
                    key={v}
                    style={[s.quickChip, qty === v && s.quickChipActive]}
                    onPress={() => setQty(v)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.quickText, qty === v && s.quickTextActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.calcRow}>
                <View style={s.calcItem}>
                  <Text style={s.calcLabel}>Prix / bouteille</Text>
                  <Text style={s.calcValue}>{priceEach.toFixed(2)} {currency}</Text>
                </View>
                <Ionicons name="close-outline" size={18} color={C.textMut} />
                <View style={s.calcItem}>
                  <Text style={s.calcLabel}>Quantité</Text>
                  <Text style={s.calcValue}>{qty}</Text>
                </View>
                <Ionicons name="remove-outline" size={18} color={C.textMut} />
                <View style={[s.calcItem, { alignItems: "flex-end" }]}>
                  <Text style={s.calcLabel}>Total</Text>
                  <Text style={[s.calcValue, { color: C.primary, fontSize: 18 }]}>
                    {totalPrice.toFixed(2)} {currency}
                  </Text>
                </View>
              </View>
            </View>

            <View style={s.divider} />
            <Text style={s.sectionLabel}>Description</Text>
            <Text style={s.desc}>{product.description ?? "Aucune description disponible."}</Text>

            <View style={s.tags}>
              <View style={s.tag}>
                <Ionicons name="flame-outline" size={11} color={C.primary} />
                <Text style={s.tagText}>GAZ</Text>
              </View>
              <View style={[s.tag, s.tagGray]}>
                <Ionicons name="card-outline" size={11} color={C.textSec} />
                <Text style={[s.tagText, { color: C.textSec }]}>{currency}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* BARRE DE PAIEMENT FIXE */}
      {!isLoading && product && (
        <View style={s.payBar}>
          <View style={s.payInfo}>
            <Text style={s.payLabel}>Total à payer</Text>
            <Text style={s.payAmount}>
              {totalPrice.toFixed(2)} <Text style={s.payAmountCur}>{currency}</Text>
            </Text>
          </View>
          <TouchableOpacity style={s.payBtnWrap} onPress={openPin} activeOpacity={0.88} disabled={loadingPay}>
            <LinearGradient colors={[C.blue, C.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.payBtn}>
              {loadingPay ? (
                <ActivityIndicator color={C.white} size="small" />
              ) : (
                <>
                  <Ionicons name="flame-outline" size={18} color={C.white} />
                  <Text style={s.payBtnText}>Payer maintenant</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* ══ MODAL PIN ══ */}
      <Modal
        isVisible={showPin}
        onBackdropPress={() => { if (!loadingVerify) setShowPin(false); }}
        animationIn="slideInUp" animationOut="slideOutDown"
        style={m.slide} useNativeDriverForBackdrop avoidKeyboard
      >
        <View style={m.sheet}>
          <View style={m.handle} />
          <View style={m.lockWrap}>
            <Ionicons name="lock-closed" size={26} color={C.primary} />
          </View>
          <Text style={m.title}>Code PIN requis</Text>
          <Text style={m.sub}>Confirmez votre identité pour payer</Text>
          <View style={m.amountRow}>
            <Ionicons name="flame-outline" size={14} color={C.primary} />
            <Text style={m.amountText}>
              {qty} bouteille{qty > 1 ? "s" : ""} · {totalPrice.toFixed(2)} {currency}
            </Text>
          </View>
          <Animated.View style={{ transform: [{ translateX: pinShake }] }}>
            <PinDots value={pinValue} />
          </Animated.View>
          {pinError.length > 0 && (
            <View style={m.errRow}>
              <Ionicons name="alert-circle-outline" size={14} color={C.error} />
              <Text style={m.errText}>{pinError}</Text>
            </View>
          )}
          <Keypad onPress={handlePinKey} onDelete={handlePinDelete} />
          <TouchableOpacity
            style={[m.confirmBtn, { opacity: pinValue.length === 6 && !loadingVerify ? 1 : 0.45 }]}
            onPress={handleConfirmPin}
            disabled={loadingVerify || pinValue.length < 6}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[C.blue, C.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={m.confirmGrad}>
              {loadingVerify ? (
                <><ActivityIndicator color={C.white} size="small" /><Text style={m.confirmText}>Vérification...</Text></>
              ) : (
                <><Ionicons name="checkmark-circle-outline" size={18} color={C.white} /><Text style={m.confirmText}>Confirmer</Text></>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { if (!loadingVerify) setShowPin(false); }} style={m.cancelBtn}>
            <Text style={m.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ══ MODAL RÉSULTAT ══ */}
      <Modal
        isVisible={showResult}
        onBackdropPress={() => { setShowResult(false); if (resultData?.type === "success") router.replace("/(tabs)" as any); }}
        animationIn="zoomIn" animationOut="zoomOut" useNativeDriverForBackdrop
      >
        <View style={r.modal}>
          <View style={[r.iconWrap, {
            backgroundColor: resultData?.type === "success" ? "rgba(34,197,94,0.14)" : "rgba(239,68,68,0.14)",
          }]}>
            <Ionicons
              name={resultData?.type === "success" ? "checkmark-circle" : "close-circle"}
              size={56}
              color={resultData?.type === "success" ? C.green : C.error}
            />
          </View>
          <Text style={[r.title, { color: resultData?.type === "success" ? C.green : C.error }]}>
            {resultData?.type === "success" ? "Paiement réussi !" : "Paiement échoué"}
          </Text>
          <Text style={r.desc}>{resultData?.description}</Text>
          {resultData?.type === "success" ? (
            <TouchableOpacity style={r.btnWrap} onPress={() => { setShowResult(false); router.replace("/(tabs)" as any); }}>
              <LinearGradient colors={[C.blue, C.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={r.btnGrad}>
                <Ionicons name="home-outline" size={16} color={C.white} />
                <Text style={r.btnText}>Accueil</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={r.btnRow}>
              <TouchableOpacity style={[r.btnErr, { backgroundColor: C.error }]} onPress={() => setShowResult(false)}>
                <Text style={r.btnErrText}>Réessayer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[r.btnErr, { backgroundColor: C.textMut }]} onPress={() => { setShowResult(false); router.back(); }}>
                <Text style={r.btnErrText}>Retour</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  safeBar:   { backgroundColor: C.safeBarBg, borderBottomWidth: 1, borderBottomColor: C.safeBarBord },
  topBar:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn:   { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  iconBtnRel:{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  topTitle:  { flex: 1, fontFamily: "NexaBold", fontSize: 17, color: C.text, textAlign: "center" },
  badge:     { position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.error, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { fontFamily: "NexaBold", fontSize: 9, color: C.white },
  center:    { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontFamily: "NexaLight", fontSize: 14, color: C.textMut },

  imageWrap:    { height: 260, position: "relative", alignItems: "center", justifyContent: "center" },
  image:        { width: "70%", height: "80%" },
  badgeCat:     { position: "absolute", top: 14, right: 14, backgroundColor: "rgba(255,255,255,0.90)", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(0,53,197,0.10)" },
  badgeCatText: { fontFamily: "NexaBold", fontSize: 12, color: "#1A1C1C" },
  priceWrap:    { position: "absolute", bottom: 14, left: 14, flexDirection: "row", alignItems: "baseline", backgroundColor: "rgba(0,53,197,0.90)", borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8 },
  priceValue:   { fontFamily: "NexaBold", fontSize: 22, color: C.white },
  priceCur:     { fontFamily: "NexaLight", fontSize: 12, color: "rgba(255,255,255,0.80)" },

  contentCard:  { backgroundColor: C.contentCard, marginHorizontal: 16, marginTop: -20, borderRadius: 28, padding: 24, elevation: 4, shadowColor: "#0047FF", shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  name:         { fontFamily: "NexaBold", fontSize: 20, color: C.primary, marginBottom: 8 },
  availRow:     { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  availDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  availText:    { fontFamily: "NexaLight", fontSize: 12, color: "#16A34A" },
  divider:      { height: 1, backgroundColor: C.border, marginVertical: 16 },
  sectionLabel: { fontFamily: "NexaBold", fontSize: 11, color: C.textMut, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 },
  desc:         { fontFamily: "NexaLight", fontSize: 14, color: C.textSec, lineHeight: 22 },

  qtyCard:    { backgroundColor: C.qtyCardBg, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.qtyCardBord, gap: 14 },
  stepperRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  stepBtn:    { width: 48, height: 48, borderRadius: 16, backgroundColor: C.stepBtnBg, borderWidth: 1.5, borderColor: C.qtyCardBord, alignItems: "center", justifyContent: "center", elevation: 2, shadowColor: C.primary, shadowOpacity: 0.10, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  qtyDisplay: { flex: 1, alignItems: "center", backgroundColor: C.qtyDispBg, borderRadius: 16, borderWidth: 1.5, borderColor: C.primary, height: 56, justifyContent: "center", elevation: 2, shadowColor: C.primary, shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  qtyNum:     { fontFamily: "NexaBold", fontSize: 32, color: C.primary },
  qtyUnit:    { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, marginTop: -4 },

  quickRow:        { flexDirection: "row", gap: 8 },
  quickChip:       { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 12, backgroundColor: C.quickChipBg, borderWidth: 1, borderColor: C.qtyCardBord },
  quickChipActive: { backgroundColor: C.primary },
  quickText:       { fontFamily: "NexaBold", fontSize: 13, color: C.textSec },
  quickTextActive: { color: C.white },

  calcRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6, backgroundColor: C.calcRowBg, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.qtyCardBord },
  calcItem:  { flex: 1, alignItems: "center", gap: 4 },
  calcLabel: { fontFamily: "NexaLight", fontSize: 10, color: C.textMut, textTransform: "uppercase" },
  calcValue: { fontFamily: "NexaBold", fontSize: 14, color: C.text },

  tags:    { flexDirection: "row", gap: 8, marginTop: 16 },
  tag:     { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.tagBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  tagGray: { backgroundColor: "rgba(196,197,218,0.20)" },
  tagText: { fontFamily: "NexaBold", fontSize: 10, color: C.primary, letterSpacing: 0.5 },

  payBar:      { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.payBarBg, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, borderTopWidth: 1, borderTopColor: C.border, flexDirection: "row", alignItems: "center", gap: 16, elevation: 12, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } },
  payInfo:     { flex: 1 },
  payLabel:    { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, textTransform: "uppercase", letterSpacing: 0.8 },
  payAmount:   { fontFamily: "NexaBold", fontSize: 22, color: C.text, marginTop: 2 },
  payAmountCur:{ fontFamily: "NexaLight", fontSize: 14, color: C.textSec },
  payBtnWrap:  { flex: 2, borderRadius: 18, overflow: "hidden", elevation: 6, shadowColor: C.blue, shadowOpacity: 0.30, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  payBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  payBtnText:  { fontFamily: "NexaBold", fontSize: 15, color: C.white },
}); }

function mkM(C: typeof LIGHT) { return StyleSheet.create({
  slide:      { justifyContent: "flex-end", margin: 0 },
  sheet:      { backgroundColor: C.modalBg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 36, alignItems: "center", elevation: 20 },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.10)", marginBottom: 20 },
  lockWrap:   { width: 64, height: 64, borderRadius: 32, backgroundColor: C.lockBg, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title:      { fontFamily: "NexaBold", fontSize: 18, color: C.text, marginBottom: 6 },
  sub:        { fontFamily: "NexaLight", fontSize: 12, color: C.textSec, textAlign: "center", marginBottom: 18 },
  amountRow:  { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, borderWidth: 1, borderColor: C.amountBord, backgroundColor: C.amountRowBg, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 22 },
  amountText: { fontFamily: "NexaBold", fontSize: 15, color: C.text },
  errRow:     { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  errText:    { fontFamily: "NexaLight", fontSize: 12, color: C.error },
  confirmBtn: { width: "100%", borderRadius: 16, overflow: "hidden", marginTop: 20 },
  confirmGrad:{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15 },
  confirmText:{ color: C.white, fontFamily: "NexaBold", fontSize: 15 },
  cancelBtn:  { marginTop: 14, paddingVertical: 8 },
  cancelText: { fontFamily: "NexaLight", fontSize: 13, color: C.textMut },
}); }

function mkR(C: typeof LIGHT) { return StyleSheet.create({
  modal:      { backgroundColor: C.modalBg, borderRadius: 28, padding: 28, alignItems: "center", marginHorizontal: 16 },
  iconWrap:   { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  title:      { fontFamily: "NexaBold", fontSize: 22, marginBottom: 10, textAlign: "center" },
  desc:       { fontFamily: "NexaLight", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 26, color: C.textMut },
  btnWrap:    { width: "100%", borderRadius: 16, overflow: "hidden" },
  btnGrad:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  btnText:    { color: C.white, fontFamily: "NexaBold", fontSize: 15 },
  btnRow:     { flexDirection: "row", gap: 12, width: "100%" },
  btnErr:     { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  btnErrText: { color: C.white, fontFamily: "NexaBold", fontSize: 14 },
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
