import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useVerifyPassMutation } from "@/services/authService";
import { useCreatePaiementMutation } from "@/services/tsxService";
import { useCreateOrderMutation } from "@/services/orderService";
import { normalizeDecimal } from "@/utils/normalizeDecimal.util";
import type { CartItem } from "./[id]";

/* ─── THEME ──────────────────────────────────────────────────────────── */
const C = {
  primary: "#0353CC", violet: "#3906C7", deep: "#302E99",
  accent: "#4D96FF", gold: "#FFD700", green: "#22C55E",
  red: "#EF4444", white: "#FFFFFF", text: "#0D1B3E", muted: "#7B8DB0", f4: "#F4F6FB",
};
const TH = {
  light: {
    bg: "#F0F4FF", card: "#FFFFFF", text: "#0D1B3E", sub: "#7B8DB0",
    border: "rgba(3,83,204,0.10)", input: "#F4F6FB",
    headerGrad: [C.deep, C.primary] as [string, string],
  },
  dark: {
    bg: "#0A0F1E", card: "#111827", text: "#E2E8F0", sub: "#64748B",
    border: "rgba(255,255,255,0.08)", input: "#1E2A3A",
    headerGrad: ["#060B18", "#0D1B3E"] as [string, string],
  },
};
function useTheme() {
  const isDark = useColorScheme() === "dark";
  return { isDark, t: isDark ? TH.dark : TH.light };
}

const CART_KEY = "bim_supermarche_cart";

/* ─── PIN NUMPAD ─────────────────────────────────────────────────────── */
function PinPad({
  value, onChange, onDelete,
}: { value: string; onChange: (k: string) => void; onDelete: () => void }) {
  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return (
    <View style={pp.grid}>
      {keys.map((k, i) => (
        k === "" ? <View key={i} style={pp.key} /> :
        k === "⌫" ? (
          <TouchableOpacity key={i} style={pp.key} onPress={onDelete}>
            <Ionicons name="backspace-outline" size={22} color={C.muted} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            key={i} style={pp.key}
            onPress={() => onChange(k)}
            disabled={value.length >= 6}
          >
            <Text style={pp.keyText}>{k}</Text>
          </TouchableOpacity>
        )
      ))}
    </View>
  );
}

/* ─── CART ITEM ROW ──────────────────────────────────────────────────── */
function CartRow({
  item, t, isDark, onInc, onDec, onRemove,
}: {
  item: CartItem; t: typeof TH.light; isDark: boolean;
  onInc: () => void; onDec: () => void; onRemove: () => void;
}) {
  return (
    <View style={[cr.row, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={cr.info}>
        <Text style={[cr.name, { color: t.text }]} numberOfLines={2}>{item.name}</Text>
        <Text style={cr.price}>{item.unitPrice.toFixed(2)} EC / unité</Text>
      </View>

      <View style={cr.controls}>
        <TouchableOpacity
          style={[cr.btn, item.qty <= 1 && cr.btnDisabled]}
          onPress={item.qty <= 1 ? onRemove : onDec}
        >
          <Ionicons
            name={item.qty <= 1 ? "trash-outline" : "remove"}
            size={16}
            color={item.qty <= 1 ? C.red : C.primary}
          />
        </TouchableOpacity>
        <Text style={[cr.qty, { color: t.text }]}>{item.qty}</Text>
        <TouchableOpacity style={cr.btn} onPress={onInc}>
          <Ionicons name="add" size={16} color={C.primary} />
        </TouchableOpacity>
      </View>

      <Text style={cr.subtotal}>{(item.unitPrice * item.qty).toFixed(2)} EC</Text>
    </View>
  );
}

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function CartScreen() {
  const { companyId, companyName } = useLocalSearchParams<{ companyId: string; companyName: string }>();
  const router   = useRouter();
  const { isDark, t } = useTheme();
  const insets   = useSafeAreaInsets();

  const [cart,    setCart]    = useState<CartItem[]>([]);
  const [userId,  setUserId]  = useState<string | null>(null);
  const [mode,    setMode]    = useState<"idle" | "cash" | "order">("idle");

  /* Cash PIN state */
  const [pin,         setPin]         = useState("");
  const [pinError,    setPinError]    = useState("");
  const pinShake = useRef(new Animated.Value(0)).current;

  /* Order form state */
  const [address,     setAddress]     = useState("");
  const [phone,       setPhone]       = useState("");
  const [notes,       setNotes]       = useState("");

  /* Result */
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [verifyPass,    { isLoading: verifying }]  = useVerifyPassMutation();
  const [createPaiement, { isLoading: paying }]    = useCreatePaiementMutation();
  const [createOrder,    { isLoading: ordering }]  = useCreateOrderMutation();

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then(raw => { if (raw) setCart(JSON.parse(raw)); });
    AsyncStorage.getItem("userId").then(setUserId);
  }, []);

  const saveCart = useCallback(async (items: CartItem[]) => {
    setCart(items);
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
  }, []);

  const inc = (productId: number) => {
    const next = cart.map(c => c.productId === productId ? { ...c, qty: c.qty + 1 } : c);
    saveCart(next);
  };
  const dec = (productId: number) => {
    const next = cart.map(c => c.productId === productId ? { ...c, qty: Math.max(1, c.qty - 1) } : c);
    saveCart(next);
  };
  const remove = (productId: number) => {
    saveCart(cart.filter(c => c.productId !== productId));
  };
  const clearCart = async () => {
    await AsyncStorage.removeItem(CART_KEY);
    setCart([]);
  };

  const total = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  /* ── Shake PIN ── */
  const shakePin = () => {
    Animated.sequence([
      Animated.timing(pinShake, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  /* ── Payer en caisse ── */
  const handleCashPay = async () => {
    if (pin.length < 6) { setPinError("Entrez votre code à 6 chiffres"); return; }
    if (!userId) return;
    try {
      await verifyPass({ userId, password: pin }).unwrap();
    } catch {
      shakePin(); setPinError("Code incorrect"); setPin(""); return;
    }

    const firstProduct = cart[0];
    try {
      await createPaiement({
        amount:          Number(normalizeDecimal(String(total.toFixed(2)))),
        companyId:       Number(companyId),
        productId:       firstProduct?.productId ?? null,
        paymentMethod:   "BIM NEXT APP",
        notes:           `Panier supermarché — ${cart.length} article(s)`,
        shippingAddress: "Paiement en caisse",
        id:              Number(userId),
      }).unwrap();
      await clearCart();
      setMode("idle");
      setResult({ type: "success", text: "Paiement réussi ! Votre achat a été validé." });
    } catch (err: any) {
      setResult({ type: "error", text: err?.data?.message || "Erreur lors du paiement" });
    }
  };

  /* ── Commander (livraison) ── */
  const handleOrder = async () => {
    if (!address.trim()) { Alert.alert("Adresse requise", "Veuillez saisir une adresse de livraison."); return; }
    if (!phone.trim()) { Alert.alert("Téléphone requis", "Veuillez saisir votre numéro de téléphone."); return; }
    try {
      const res = await createOrder({
        items: cart.map(c => ({
          productId: c.productId,
          qty: c.qty,
          unitPrice: c.unitPrice,
        })),
        companyId: Number(companyId),
        shippingAddress: address.trim(),
        notes: notes.trim() || undefined,
        paymentMethod: "delivery",
        clientPhone: phone.trim(),
      }).unwrap();

      await clearCart();
      setMode("idle");
      router.replace({
        pathname: "/bim-supermarche/order-tracking",
        params: { orderNumber: res.orderNumber },
      });
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Impossible de passer la commande");
    }
  };

  /* ── Result screen ── */
  if (result) {
    return (
      <SafeAreaView style={[s.flex, { backgroundColor: t.bg }]}>
        <View style={s.resultWrap}>
          <View style={[s.resultIcon, { backgroundColor: result.type === "success" ? C.green + "18" : C.red + "18" }]}>
            <Ionicons
              name={result.type === "success" ? "checkmark-circle" : "close-circle"}
              size={56}
              color={result.type === "success" ? C.green : C.red}
            />
          </View>
          <Text style={[s.resultTitle, { color: t.text }]}>
            {result.type === "success" ? "Succès" : "Erreur"}
          </Text>
          <Text style={[s.resultText, { color: t.sub }]}>{result.text}</Text>
          <TouchableOpacity
            style={s.resultBtn}
            onPress={() => { setResult(null); router.replace("/(tabs)"); }}
          >
            <LinearGradient colors={[C.deep, C.primary]} style={s.resultGrad}>
              <Text style={s.resultBtnText}>Retour à l'accueil</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER ── */}
      <View style={[s.header, { shadowColor: isDark ? "#000" : C.primary }]}>
        <LinearGradient
          colors={t.headerGrad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.deco1} />
        <View style={s.deco2} />

        <SafeAreaView edges={["top"]}>
          <View style={s.topBar}>
            <TouchableOpacity style={s.iconBtn} onPress={() => mode === "idle" ? router.back() : setMode("idle")}>
              <Ionicons name="arrow-back" size={20} color={C.white} />
            </TouchableOpacity>

            <View style={s.titleWrap}>
              <View style={s.titleBadge}>
                <Ionicons name="cart-outline" size={12} color={C.gold} />
              </View>
              <Text style={s.headerTitle}>
                {mode === "cash" ? "PAIEMENT EN CAISSE" : mode === "order" ? "LIVRAISON" : "MON PANIER"}
              </Text>
            </View>

            {mode === "idle" && cart.length > 0 ? (
              <TouchableOpacity style={s.iconBtn} onPress={() => Alert.alert("Vider le panier", "Supprimer tous les articles ?", [
                { text: "Annuler", style: "cancel" },
                { text: "Vider", style: "destructive", onPress: clearCart },
              ])}>
                <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          <Text style={s.headerSub}>
            {mode === "idle"
              ? `${companyName || "Supermarché"} · ${cart.length} article${cart.length !== 1 ? "s" : ""}`
              : mode === "cash" ? "Vérification du code PIN"
              : "Détails de livraison"}
          </Text>
        </SafeAreaView>
      </View>

      {/* ── Empty cart ── */}
      {cart.length === 0 && mode === "idle" && (
        <View style={s.emptyWrap}>
          <FontAwesome6 name="cart-shopping" size={56} color={C.muted} />
          <Text style={[s.emptyTitle, { color: t.text }]}>Panier vide</Text>
          <Text style={[s.emptySub, { color: t.sub }]}>Ajoutez des produits depuis le catalogue</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={() => router.back()}>
            <LinearGradient colors={[C.deep, C.primary]} style={s.emptyGrad}>
              <Text style={s.emptyBtnText}>Voir les produits</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* ── CART LIST ── */}
      {mode === "idle" && cart.length > 0 && (
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 200 }}>
            {/* Company chip */}
            <View style={[s.companyChip, { backgroundColor: t.card, borderColor: t.border }]}>
              <FontAwesome6 name="store" size={14} color={C.primary} />
              <Text style={[s.companyName, { color: t.text }]} numberOfLines={1}>{companyName}</Text>
            </View>

            {/* Items */}
            {cart.map(item => (
              <CartRow
                key={item.productId}
                item={item}
                t={t}
                isDark={isDark}
                onInc={() => inc(item.productId)}
                onDec={() => dec(item.productId)}
                onRemove={() => remove(item.productId)}
              />
            ))}

            {/* Total */}
            <View style={[s.totalCard, { backgroundColor: t.card, borderColor: t.border }]}>
              <View style={s.totalRow}>
                <Text style={[s.totalLabel, { color: t.sub }]}>Sous-total</Text>
                <Text style={[s.totalVal, { color: t.text }]}>{total.toFixed(2)} EC</Text>
              </View>
              <View style={[s.sep, { backgroundColor: t.border }]} />
              <View style={s.totalRow}>
                <Text style={[s.totalLabel, { color: t.text, fontWeight: "700" }]}>Total</Text>
                <Text style={s.grandTotal}>{total.toFixed(2)} EC</Text>
              </View>
            </View>
          </ScrollView>

          {/* ── CTA buttons ── */}
          <View style={[s.ctaBar, { backgroundColor: t.card, borderTopColor: t.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TouchableOpacity style={s.cashBtn} onPress={() => { setPin(""); setPinError(""); setMode("cash"); }} activeOpacity={0.85}>
              <LinearGradient colors={[C.green, "#16A34A"]} style={s.ctaGrad}>
                <Ionicons name="wallet-outline" size={18} color={C.white} />
                <Text style={s.ctaBtnText}>Payer en caisse</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={s.orderBtn} onPress={() => { setAddress(""); setNotes(""); setMode("order"); }} activeOpacity={0.85}>
              <LinearGradient colors={[C.deep, C.primary]} style={s.ctaGrad}>
                <Ionicons name="bicycle-outline" size={18} color={C.white} />
                <Text style={s.ctaBtnText}>Commander</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ── CASH PAYMENT ── */}
      {mode === "cash" && (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Recap */}
          <View style={[s.recapCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={[s.recapTitle, { color: t.sub }]}>Montant total à payer</Text>
            <Text style={s.recapAmount}>{total.toFixed(2)} EC</Text>
            <Text style={[s.recapSub, { color: t.sub }]}>
              {cart.length} article{cart.length > 1 ? "s" : ""} — {companyName}
            </Text>
          </View>

          {/* PIN dots */}
          <Text style={[s.pinLabel, { color: t.text }]}>Entrez votre code PIN (6 chiffres)</Text>
          <Animated.View style={[s.pinDots, { transform: [{ translateX: pinShake }] }]}>
            {[0,1,2,3,4,5].map(i => (
              <View
                key={i}
                style={[
                  s.dot,
                  { borderColor: pinError ? C.red : C.primary },
                  i < pin.length && { backgroundColor: C.primary },
                ]}
              />
            ))}
          </Animated.View>
          {pinError ? <Text style={s.pinError}>{pinError}</Text> : null}

          {/* Numpad */}
          <PinPad
            value={pin}
            onChange={k => { setPinError(""); setPin(p => p.length < 6 ? p + k : p); }}
            onDelete={() => setPin(p => p.slice(0, -1))}
          />

          <TouchableOpacity
            style={[s.confirmBtn, (verifying || paying || pin.length < 6) && { opacity: 0.6 }]}
            onPress={handleCashPay}
            disabled={verifying || paying || pin.length < 6}
          >
            <LinearGradient colors={[C.green, "#16A34A"]} style={s.ctaGrad}>
              {(verifying || paying)
                ? <Text style={s.ctaBtnText}>Traitement…</Text>
                : <>
                    <Ionicons name="checkmark-circle-outline" size={18} color={C.white} />
                    <Text style={s.ctaBtnText}>Confirmer le paiement</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── ORDER FORM ── */}
      {mode === "order" && (
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            {/* Recap */}
            <View style={[s.recapCard, { backgroundColor: t.card, borderColor: t.border }]}>
              <Text style={[s.recapTitle, { color: t.sub }]}>Total commande</Text>
              <Text style={s.recapAmount}>{total.toFixed(2)} EC</Text>
              <Text style={[s.recapSub, { color: t.sub }]}>
                {cart.length} article{cart.length > 1 ? "s" : ""} — {companyName}
              </Text>
            </View>

            {/* Téléphone */}
            <Text style={[s.fieldLabel, { color: t.text }]}>Votre numéro de téléphone *</Text>
            <View style={[s.inputWrap, { backgroundColor: t.input, borderColor: t.border }]}>
              <Ionicons name="call-outline" size={16} color={C.muted} style={{ marginLeft: 12 }} />
              <TextInput
                style={[s.input, { color: t.text }]}
                placeholder="+243 8xx xxx xxx"
                placeholderTextColor={C.muted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
            <Text style={[s.fieldHint, { color: t.sub }]}>On vous appellera sur ce numéro en cas de problème avec la livraison.</Text>

            {/* Address */}
            <Text style={[s.fieldLabel, { color: t.text }]}>Adresse de livraison *</Text>
            <View style={[s.inputWrap, { backgroundColor: t.input, borderColor: t.border }]}>
              <Ionicons name="location-outline" size={16} color={C.muted} style={{ marginLeft: 12 }} />
              <TextInput
                style={[s.input, { color: t.text }]}
                placeholder="Quartier, avenue, numéro…"
                placeholderTextColor={C.muted}
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Notes */}
            <Text style={[s.fieldLabel, { color: t.text }]}>Note (optionnel)</Text>
            <View style={[s.inputWrap, { backgroundColor: t.input, borderColor: t.border }]}>
              <Ionicons name="chatbubble-outline" size={16} color={C.muted} style={{ marginLeft: 12, marginTop: 4 }} />
              <TextInput
                style={[s.input, { color: t.text }]}
                placeholder="Instructions particulières…"
                placeholderTextColor={C.muted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[s.confirmBtn, (ordering || !address.trim() || !phone.trim()) && { opacity: 0.6 }]}
              onPress={handleOrder}
              disabled={ordering || !address.trim() || !phone.trim()}
            >
              <LinearGradient colors={[C.deep, C.primary]} style={s.ctaGrad}>
                {ordering
                  ? <Text style={s.ctaBtnText}>Envoi…</Text>
                  : <>
                      <Ionicons name="send-outline" size={18} color={C.white} />
                      <Text style={s.ctaBtnText}>Passer la commande</Text>
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },

  header: {
    overflow: "hidden",
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    paddingBottom: 16,
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16,
  },
  deco1: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(255,255,255,0.05)", top: -70, right: -60 },
  deco2: { position: "absolute", width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,255,255,0.04)", bottom: -30, left: -30 },

  topBar:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 8 },
  iconBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  titleWrap:  { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, justifyContent: "center" },
  titleBadge: { width: 28, height: 28, borderRadius: 9, backgroundColor: "rgba(255,215,0,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: C.white, fontSize: 14, fontFamily: "NexaLight", letterSpacing: 1.5 },
  headerSub:   { color: "rgba(255,255,255,0.6)", fontFamily: "NexaLight", fontSize: 12, paddingHorizontal: 20, marginTop: 6 },

  emptyWrap:    { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
  emptyTitle:   { fontFamily: "NexaLight", fontSize: 20, fontWeight: "700", marginTop: 8 },
  emptySub:     { fontFamily: "NexaLight", fontSize: 13, textAlign: "center" },
  emptyBtn:     { borderRadius: 18, overflow: "hidden", marginTop: 8, width: "100%" },
  emptyGrad:    { paddingVertical: 16, alignItems: "center" },
  emptyBtnText: { color: C.white, fontFamily: "NexaLight", fontSize: 15, fontWeight: "700" },

  companyChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 12,
  },
  companyName: { fontFamily: "NexaLight", fontSize: 13, fontWeight: "600", flex: 1 },

  totalCard: {
    borderRadius: 18, borderWidth: 1, padding: 16, marginTop: 8,
  },
  totalRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  totalLabel: { fontFamily: "NexaLight", fontSize: 13 },
  totalVal:   { fontFamily: "NexaLight", fontSize: 14 },
  sep:        { height: 1, marginVertical: 6 },
  grandTotal: { fontFamily: "NexaLight", fontSize: 20, fontWeight: "700", color: C.primary },

  ctaBar: {
    flexDirection: "row", gap: 10, padding: 14,
    borderTopWidth: 1,
  },
  // paddingBottom appliqué dynamiquement via insets
  cashBtn:  { flex: 1, borderRadius: 16, overflow: "hidden" },
  orderBtn: { flex: 1, borderRadius: 16, overflow: "hidden" },
  ctaGrad:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  ctaBtnText: { color: C.white, fontFamily: "NexaLight", fontSize: 13, fontWeight: "700" },

  recapCard: {
    borderRadius: 18, borderWidth: 1, padding: 20,
    alignItems: "center", marginBottom: 24,
  },
  recapTitle:  { fontFamily: "NexaLight", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  recapAmount: { fontFamily: "NexaLight", fontSize: 32, fontWeight: "700", color: C.primary, marginVertical: 6 },
  recapSub:    { fontFamily: "NexaLight", fontSize: 12 },

  pinLabel: { fontFamily: "NexaLight", fontSize: 13, textAlign: "center", marginBottom: 16 },
  pinDots:  { flexDirection: "row", justifyContent: "center", gap: 14, marginBottom: 8 },
  dot: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 2,
  },
  pinError: { color: C.red, fontFamily: "NexaLight", fontSize: 12, textAlign: "center", marginBottom: 12 },

  confirmBtn: { borderRadius: 18, overflow: "hidden", marginTop: 24 },

  fieldLabel: { fontFamily: "NexaLight", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  fieldHint:  { fontFamily: "NexaLight", fontSize: 11, lineHeight: 16, marginBottom: 4, marginTop: 4, paddingHorizontal: 4 },
  inputWrap: {
    flexDirection: "row", alignItems: "flex-start",
    borderRadius: 16, borderWidth: 1, minHeight: 50, paddingVertical: 10,
  },
  input: { flex: 1, fontFamily: "NexaLight", fontSize: 13, paddingHorizontal: 10, paddingTop: 2 },

  resultWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 14 },
  resultIcon: { width: 96, height: 96, borderRadius: 48, justifyContent: "center", alignItems: "center" },
  resultTitle: { fontFamily: "NexaLight", fontSize: 22, fontWeight: "700" },
  resultText: { fontFamily: "NexaLight", fontSize: 14, textAlign: "center", lineHeight: 20 },
  resultBtn: { borderRadius: 18, overflow: "hidden", width: "100%", marginTop: 8 },
  resultGrad: { paddingVertical: 16, alignItems: "center" },
  resultBtnText: { color: C.white, fontFamily: "NexaLight", fontSize: 15, fontWeight: "700" },
});

const cr = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 10, gap: 10,
  },
  info: { flex: 1 },
  name: { fontFamily: "NexaLight", fontSize: 13, fontWeight: "600", marginBottom: 3 },
  price: { fontFamily: "NexaLight", fontSize: 11, color: C.muted },
  controls: { flexDirection: "row", alignItems: "center", gap: 8 },
  btn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.primary + "12",
    justifyContent: "center", alignItems: "center",
  },
  btnDisabled: { backgroundColor: C.red + "12" },
  qty: { fontFamily: "NexaLight", fontSize: 15, fontWeight: "700", minWidth: 22, textAlign: "center" },
  subtotal: { fontFamily: "NexaLight", fontSize: 13, fontWeight: "700", color: C.primary, minWidth: 72, textAlign: "right" },
});

const pp = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginVertical: 8 },
  key: {
    width: "30%", aspectRatio: 1.8,
    justifyContent: "center", alignItems: "center",
    margin: "1.5%",
  },
  keyText: { fontFamily: "NexaLight", fontSize: 22, fontWeight: "700", color: C.text },
});
