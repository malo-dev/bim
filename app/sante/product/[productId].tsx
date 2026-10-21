/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetproductByIdQuery } from "@/services/productServices";
import { useCreatePaiementMutation } from "@/services/tsxService";
import { useCreateOrderMutation } from "@/services/orderService";
import { useGetUserByIdQuery } from "@/services/userService";
import { getLastKnownLocation } from "@/hooks/useEnsureLocation";
import { API_URL_BASE } from "@/constants/api";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useAppTheme } from "@/app/_layout";

/* ─── PALETTE ────────────────────────────────────────────────────────── */
const LIGHT = {
  primary:    "#0035C5",
  blue:       "#0047FF",
  deep:       "#001257",
  white:      "#FFFFFF",
  bg:         "#F9F9F9",
  text:       "#1A1C1C",
  textSec:    "#434657",
  textMut:    "#747688",
  border:     "rgba(196,197,218,0.25)",
  error:      "#EF4444",
  gold:       "#F59E0B",
  success:    "#22C55E",
  navBg:      "#FFFFFF",
  navBord:    "rgba(196,197,218,0.20)",
  iconBtnBg:  "rgba(0,53,197,0.06)",
  cardBg:     "#FFFFFF",
  payBarBg:   "#FFFFFF",
  tagBg:      "rgba(0,53,197,0.05)",
  tagGrayBg:  "rgba(219,226,250,0.80)",
  tagGrayTxt: "#3F4759",
  imgFallA:   "#DDE4F5",
  imgFallB:   "#EEF2FF",
  pinBorder:  "rgba(3,83,204,0.20)",
  pinInputBg: "rgba(3,83,204,0.06)",
  pinKeyBord: "rgba(3,83,204,0.15)",
  pinText:    "#0D1B3E",
  pinTextSec: "#7B8DB0",
  pinRecapBg: "rgba(3,83,204,0.05)",
  lockBg:     "rgba(3,83,204,0.08)",
  handleBg:   "rgba(0,0,0,0.10)",
};
const DARK: typeof LIGHT = {
  primary:    "#4D8DFF",
  blue:       "#4D8DFF",
  deep:       "#4D8DFF",
  white:      "#FFFFFF",
  bg:         "#0B1220",
  text:       "#EAF0FF",
  textSec:    "#A3B4D0",
  textMut:    "#6B7A99",
  border:     "rgba(31,42,68,0.80)",
  error:      "#EF4444",
  gold:       "#F59E0B",
  success:    "#22C55E",
  navBg:      "rgba(11,18,32,0.94)",
  navBord:    "rgba(31,42,68,0.80)",
  iconBtnBg:  "rgba(77,141,255,0.08)",
  cardBg:     "#1A2540",
  payBarBg:   "#0F1A2E",
  tagBg:      "rgba(77,141,255,0.08)",
  tagGrayBg:  "rgba(77,141,255,0.12)",
  tagGrayTxt: "#A3B4D0",
  imgFallA:   "#0F1A2E",
  imgFallB:   "#1A2540",
  pinBorder:  "rgba(77,141,255,0.30)",
  pinInputBg: "rgba(77,141,255,0.08)",
  pinKeyBord: "rgba(77,141,255,0.15)",
  pinText:    "#EAF0FF",
  pinTextSec: "#A3B4D0",
  pinRecapBg: "rgba(77,141,255,0.05)",
  lockBg:     "rgba(77,141,255,0.10)",
  handleBg:   "rgba(255,255,255,0.12)",
};

/* ─── MAIN ───────────────────────────────────────────────────────────── */
export default function ProductDetail() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const m = useMemo(() => mkM(C), [isDark]);
  const r = useMemo(() => mkR(C), [isDark]);

  const router                         = useRouter();
  const { productId, companyId }       = useLocalSearchParams<{ productId: string; companyId: string }>();
  const { unread }                     = useUnreadNotifications();

  const { data, isLoading }            = useGetproductByIdQuery(productId, { skip: !productId });
  const [createPaiement] = useCreatePaiementMutation();
  const [createOrder, { isLoading: ordering }] = useCreateOrderMutation();

  const product  = data?.data ?? data;
  const imageUri = product?.imageUrl ? `${API_URL_BASE}${product.imageUrl}` : null;
  const price    = Number(product?.price ?? 0).toFixed(2);
  const currency = product?.currency?.code ?? "EC";

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);

  const { data: user } = useGetUserByIdQuery(userId!, { skip: !userId });
  const [address,     setAddress]     = useState("");
  const [phone,       setPhone]       = useState("");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  useEffect(() => {
    setAddress(user?.adresse || "");
    setPhone(user?.telephone || "");
  }, [user?.adresse, user?.telephone]);

  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<{ type: "success"|"error"; description: string } | null>(null);
  const [loadingPay, setLoadingPay] = useState(false);

  const handlePay = async () => {
    if (!userId) return;
    if (!address.trim() || !phone.trim()) {
      Alert.alert("Informations manquantes", "Veuillez compléter votre adresse et votre numéro de téléphone.");
      return;
    }
    try {
      setLoadingPay(true);
      await createPaiement({
        amount:          Number(price),
        companyId:       Number(companyId),
        shippingAddress: address.trim(),
        clientPhone:     phone.trim(),
        notes:           "Paiement produit santé",
        paymentMethod:   "BIM NEXT APP",
        id:              Number(userId),
        productId:       Number(productId),
      }).unwrap();
      setResultData({ type: "success", description: `Paiement de ${price} ${currency} effectué avec succès.` });
    } catch (err: any) {
      setResultData({ type: "error", description: err?.data?.message || "Une erreur est survenue lors du paiement." });
    } finally {
      setLoadingPay(false);
      setShowResult(true);
    }
  };

  /* ── Commander — paiement à la livraison, suivi via order-tracking ── */
  const commanderDirectement = () => {
    if (!userId) return;
    if (!address.trim()) { Alert.alert("Adresse requise", "Veuillez saisir une adresse de livraison."); return; }
    if (!phone.trim())   { Alert.alert("Téléphone requis", "Veuillez saisir votre numéro de téléphone."); return; }
    Alert.alert(
      "Confirmer la commande",
      `Commander ${product.name} pour ${price} ${currency} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Commander",
          onPress: async () => {
            try {
              const destination = await getLastKnownLocation();
              const res: any = await createOrder({
                items: [{ productId: Number(productId), qty: 1, unitPrice: Number(price) }],
                paymentMethod: "delivery",
                shippingAddress: address.trim(),
                clientPhone: phone.trim(),
                destinationLat: destination?.lat,
                destinationLng: destination?.lng,
                ...(companyId && { companyId: Number(companyId) }),
              }).unwrap();
              setOrderNumber(res.orderNumber);
            } catch (err: any) {
              Alert.alert("Erreur", err?.data?.message || "La commande n'a pas pu être envoyée, réessayez.");
            }
          },
        },
      ]
    );
  };

  const suivreLaCommande = () => {
    if (!orderNumber) return;
    router.replace({ pathname: "/bim-supermarche/order-tracking", params: { orderNumber } } as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ── TOP BAR ── */}
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
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : !product ? (
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={40} color={C.textMut} />
          <Text style={s.emptyText}>Produit introuvable</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

          {/* ── IMAGE HERO ── */}
          <View style={s.imageWrap}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={s.image} contentFit="cover" transition={300} />
            ) : (
              <LinearGradient colors={[C.imgFallA, C.imgFallB]} style={s.image}>
                <Ionicons name="medical-outline" size={72} color={C.primary + "38"} />
              </LinearGradient>
            )}
            <LinearGradient
              colors={["transparent", "rgba(0,18,87,0.40)"]}
              start={{ x: 0, y: 0.3 }} end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.badgeIcon}>
              <Ionicons name="add-circle" size={28} color={C.white} />
            </View>
            <View style={s.badgeCat}>
              <Ionicons name="medical-outline" size={15} color={C.primary} />
              <Text style={s.badgeCatText}>Santé</Text>
            </View>
            <View style={s.priceWrap}>
              <Text style={s.priceValue}>{price}</Text>
              <Text style={s.priceCur}>{currency}</Text>
            </View>
          </View>

          {/* ── CONTENU ── */}
          <View style={s.contentCard}>
            <Text style={s.name}>{product.name}</Text>
            <View style={s.divider} />

            <View style={s.infoGrid}>
              <View style={s.infoItem}>
                <Ionicons name="pricetag-outline" size={16} color={C.primary} />
                <View>
                  <Text style={s.infoLabel}>Prix</Text>
                  <Text style={s.infoValue}>{price} {currency}</Text>
                </View>
              </View>
              {product.duration && (
                <View style={s.infoItem}>
                  <Ionicons name="calendar-outline" size={16} color={C.primary} />
                  <View>
                    <Text style={s.infoLabel}>Durée</Text>
                    <Text style={s.infoValue}>{product.duration}</Text>
                  </View>
                </View>
              )}
              {product.coverage && (
                <View style={s.infoItem}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={C.primary} />
                  <View>
                    <Text style={s.infoLabel}>Couverture</Text>
                    <Text style={s.infoValue}>{product.coverage}</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={s.divider} />

            <Text style={s.sectionLabel}>Description</Text>
            <Text style={s.desc}>{product.description ?? "Aucune description disponible."}</Text>

            <View style={s.tags}>
              <View style={s.tag}>
                <Ionicons name="star-outline" size={11} color={C.primary} />
                <Text style={s.tagText}>SANTÉ</Text>
              </View>
              <View style={[s.tag, s.tagGray]}>
                <Ionicons name="card-outline" size={11} color={C.tagGrayTxt} />
                <Text style={[s.tagText, { color: C.tagGrayTxt }]}>{currency}</Text>
              </View>
            </View>

            {/* ── Livraison (nécessaire pour "Commander") ── */}
            <View style={s.divider} />
            <Text style={s.sectionLabel}>Livraison (si vous commandez)</Text>
            <View style={s.deliveryField}>
              <Ionicons name="location-outline" size={16} color={C.textMut} />
              <TextInput
                style={s.deliveryInput}
                placeholder="Adresse de livraison"
                placeholderTextColor={C.textMut}
                value={address}
                onChangeText={setAddress}
              />
            </View>
            <View style={s.deliveryField}>
              <Ionicons name="call-outline" size={16} color={C.textMut} />
              <TextInput
                style={s.deliveryInput}
                placeholder="Numéro de téléphone"
                placeholderTextColor={C.textMut}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* ── Confirmation de commande ── */}
            {orderNumber && (
              <View style={s.orderConfirm}>
                <Ionicons name="checkmark-circle" size={28} color={C.success} />
                <Text style={s.orderConfirmTitle}>Commande envoyée</Text>
                <Text style={s.orderConfirmSub}>Réf. {orderNumber}</Text>
                <TouchableOpacity style={s.orderTrackBtn} onPress={suivreLaCommande} activeOpacity={0.88}>
                  <Text style={s.orderTrackBtnText}>Suivre la commande</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* ── BOUTONS D'ACTION FIXES EN BAS ── */}
      {!isLoading && product && !orderNumber && (
        <View style={s.payBar}>
          <View style={s.payInfo}>
            <Text style={s.payLabel}>Total</Text>
            <Text style={s.payAmount}>{price} <Text style={s.payAmountCur}>{currency}</Text></Text>
          </View>

          <TouchableOpacity style={s.orderBtnWrap} onPress={commanderDirectement} activeOpacity={0.88} disabled={ordering}>
            {ordering ? (
              <ActivityIndicator color={C.primary} size="small" />
            ) : (
              <>
                <Ionicons name="bag-handle-outline" size={16} color={C.primary} />
                <Text style={s.orderBtnText}>Commander</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={s.payBtnWrap} onPress={handlePay} activeOpacity={0.88} disabled={loadingPay}>
            <LinearGradient colors={[C.blue, C.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.payBtn}>
              {loadingPay ? (
                <ActivityIndicator color={C.white} size="small" />
              ) : (
                <>
                  <Ionicons name="card-outline" size={16} color={C.white} />
                  <Text style={s.payBtnText}>Payer</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* ── MODAL RÉSULTAT ── */}
      <Modal
        isVisible={showResult}
        onBackdropPress={() => {
          setShowResult(false);
          if (resultData?.type === "success") router.replace("/(tabs)" as any);
        }}
        animationIn="zoomIn"
        animationOut="zoomOut"
        useNativeDriverForBackdrop
      >
        <View style={r.modal}>
          <View style={[r.iconWrap, {
            backgroundColor: resultData?.type === "success" ? "rgba(34,197,94,0.14)" : "rgba(239,68,68,0.14)",
          }]}>
            <Ionicons
              name={resultData?.type === "success" ? "checkmark-circle" : "close-circle"}
              size={56}
              color={resultData?.type === "success" ? C.success : C.error}
            />
          </View>
          <Text style={[r.title, { color: resultData?.type === "success" ? C.success : C.error }]}>
            {resultData?.type === "success" ? "Paiement réussi !" : "Paiement échoué"}
          </Text>
          <Text style={r.desc}>{resultData?.description}</Text>

          {resultData?.type === "success" ? (
            <TouchableOpacity style={r.btnWrap} onPress={() => { setShowResult(false); router.replace("/(tabs)" as any); }}>
              <LinearGradient colors={[C.deep, C.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={r.btnGrad}>
                <Ionicons name="home-outline" size={16} color={C.white} />
                <Text style={r.btnText}>Accueil</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={r.btnRow}>
              <TouchableOpacity style={[r.btnErr, { backgroundColor: C.error }]} onPress={() => setShowResult(false)}>
                <Text style={r.btnErrText}>Réessayer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[r.btnErr, { backgroundColor: "#6B7280" }]} onPress={() => { setShowResult(false); router.back(); }}>
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
  safeBar:    { backgroundColor: C.navBg, borderBottomWidth: 1, borderBottomColor: C.navBord },
  topBar:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: C.iconBtnBg, alignItems: "center", justifyContent: "center" },
  iconBtnRel: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  topTitle:   { flex: 1, fontFamily: "NexaBold", fontSize: 17, color: C.text, textAlign: "center" },
  badge:      { position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.error, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText:  { fontFamily: "NexaBold", fontSize: 9, color: C.white },
  center:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText:  { fontFamily: "NexaLight", fontSize: 14, color: C.textMut },

  imageWrap:    { height: 280, position: "relative", alignItems: "center", justifyContent: "center" },
  image:        { width: "100%", height: "100%" },
  badgeIcon:    { position: "absolute", top: 14, left: 14, width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.30)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.45)" },
  badgeCat:     { position: "absolute", top: 14, right: 14, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.82)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.50)" },
  badgeCatText: { fontFamily: "NexaBold", fontSize: 12, color: "#1A1C1C" },
  priceWrap:    { position: "absolute", bottom: 14, left: 14, flexDirection: "row", alignItems: "baseline", gap: 8, backgroundColor: "rgba(255,255,255,0.82)", borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.28)" },
  priceValue:   { fontFamily: "NexaBold", fontSize: 26, color: C.primary },
  priceCur:     { fontFamily: "NexaLight", fontSize: 14, color: C.textSec },

  contentCard:  { backgroundColor: C.cardBg, marginHorizontal: 16, marginTop: -24, borderRadius: 28, padding: 24, elevation: 4, shadowColor: "#0047FF", shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  name:         { fontFamily: "NexaBold", fontSize: 20, color: C.primary, marginBottom: 16 },
  divider:      { height: 1, backgroundColor: C.border, marginVertical: 16 },
  sectionLabel: { fontFamily: "NexaBold", fontSize: 11, color: C.textMut, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 },
  desc:         { fontFamily: "NexaLight", fontSize: 14, color: C.textSec, lineHeight: 22 },

  infoGrid:  { gap: 14 },
  infoItem:  { flexDirection: "row", alignItems: "center", gap: 12 },
  infoLabel: { fontFamily: "NexaLight", fontSize: 11, color: C.textMut },
  infoValue: { fontFamily: "NexaBold", fontSize: 14, color: C.text },

  tags:    { flexDirection: "row", gap: 8, marginTop: 16 },
  tag:     { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.tagBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  tagGray: { backgroundColor: C.tagGrayBg },
  tagText: { fontFamily: "NexaBold", fontSize: 10, color: C.primary, letterSpacing: 0.5 },

  payBar:      { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.payBarBg, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, borderTopWidth: 1, borderTopColor: C.border, flexDirection: "row", alignItems: "center", gap: 10, elevation: 12, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } },
  payInfo:     { flex: 1 },
  payLabel:    { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, textTransform: "uppercase", letterSpacing: 0.8 },
  payAmount:   { fontFamily: "NexaBold", fontSize: 20, color: C.text, marginTop: 2 },
  payAmountCur:{ fontFamily: "NexaLight", fontSize: 14, color: C.textSec },
  payBtnWrap:  { flex: 1.3, borderRadius: 16, overflow: "hidden", elevation: 6, shadowColor: C.blue, shadowOpacity: 0.30, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  payBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 },
  payBtnText:  { fontFamily: "NexaBold", fontSize: 14, color: C.white },

  orderBtnWrap: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: C.primary },
  orderBtnText: { fontFamily: "NexaBold", fontSize: 13, color: C.primary },

  deliveryField: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.pinInputBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, height: 46, marginBottom: 10 },
  deliveryInput: { flex: 1, fontFamily: "NexaLight", fontSize: 13, color: C.text },

  orderConfirm:      { alignItems: "center", gap: 4, marginTop: 20, paddingVertical: 20, backgroundColor: C.tagBg, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  orderConfirmTitle: { fontFamily: "NexaBold", fontSize: 15, color: C.text, marginTop: 4 },
  orderConfirmSub:   { fontFamily: "NexaLight", fontSize: 12, color: C.textMut },
  orderTrackBtn:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.success, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 20, marginTop: 10 },
  orderTrackBtnText: { fontFamily: "NexaBold", fontSize: 13, color: "#fff" },
}); }

function mkM(C: typeof LIGHT) { return StyleSheet.create({
  slide:       { justifyContent: "flex-end", margin: 0 },
  sheet:       { backgroundColor: C.cardBg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 36, alignItems: "center", elevation: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.18, shadowRadius: 20 },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: C.handleBg, marginBottom: 20 },
  lockWrap:    { width: 66, height: 66, borderRadius: 33, backgroundColor: C.lockBg, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title:       { fontFamily: "NexaBold", fontSize: 18, color: C.pinText, marginBottom: 6, letterSpacing: 0.2 },
  sub:         { fontFamily: "NexaLight", fontSize: 12, color: C.pinTextSec, textAlign: "center", lineHeight: 18, marginBottom: 18, paddingHorizontal: 10 },
  amountRow:   { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, borderWidth: 1, borderColor: C.pinBorder, backgroundColor: C.pinRecapBg, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 22 },
  amountText:  { fontFamily: "NexaBold", fontSize: 15, color: C.pinText },
  errRow:      { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  errText:     { fontFamily: "NexaLight", fontSize: 12, color: C.error },
  confirmBtn:  { width: "100%", borderRadius: 16, overflow: "hidden", marginTop: 20 },
  confirmGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15 },
  confirmText: { color: C.white, fontFamily: "NexaBold", fontSize: 15 },
  cancelBtn:   { marginTop: 14, paddingVertical: 8 },
  cancelText:  { fontFamily: "NexaLight", fontSize: 13, color: C.pinTextSec },
}); }

function mkR(C: typeof LIGHT) { return StyleSheet.create({
  modal:    { backgroundColor: C.cardBg, borderRadius: 28, padding: 28, alignItems: "center", marginHorizontal: 16 },
  iconWrap: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  title:    { fontFamily: "NexaBold", fontSize: 22, marginBottom: 10, textAlign: "center" },
  desc:     { fontFamily: "NexaLight", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 26, color: C.pinTextSec },
  btnWrap:  { width: "100%", borderRadius: 16, overflow: "hidden" },
  btnGrad:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  btnText:  { color: C.white, fontFamily: "NexaBold", fontSize: 15 },
  btnRow:   { flexDirection: "row", gap: 12, width: "100%" },
  btnErr:   { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  btnErrText: { color: C.white, fontFamily: "NexaBold", fontSize: 14 },
}); }

/* ─── STATIC STYLES (pas de palette) ────────────────────────────────── */
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
