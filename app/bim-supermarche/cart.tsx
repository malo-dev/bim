/* eslint-disable */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useVerifyPassMutation } from "@/services/authService";
import { useCreatePaiementMutation } from "@/services/tsxService";
import { useCreateOrderMutation } from "@/services/orderService";
import { useGetAllProductsQuery } from "@/services/productServices";
import { normalizeDecimal } from "@/utils/normalizeDecimal.util";
import { API_URL_BASE } from "@/constants/api";
import type { CartItem } from "./[id]";
import { useAppTheme } from "@/app/_layout";

/* ─── PALETTE ────────────────────────────────────────────────────────── */
const LIGHT = {
  primary: "#0035C5", blue: "#0047FF", deep: "#001257",
  white:   "#FFFFFF", bg: "#F9F9F9", surface: "#F3F3F4",
  surfLow: "#EEEEEE", text: "#1A1C1C", textSec: "#434657",
  textMut: "#747688", border: "rgba(196,197,218,0.30)",
  green:   "#10B981", amber: "#F59E0B", red: "#EF4444",
  card:    "#FFFFFF", navBg: "rgba(255,255,255,0.96)",
};
const DARK: typeof LIGHT = {
  primary: "#0035C5", blue: "#4D8DFF", deep: "#001257",
  white:   "#FFFFFF", bg: "#0B1220", surface: "#1A2540",
  surfLow: "#0F1A2E", text: "#EAF0FF", textSec: "#A3B4D0",
  textMut: "#6B7A99", border: "rgba(31,42,68,0.80)",
  green:   "#059669", amber: "#D97706", red: "#DC2626",
  card:    "#1A2540", navBg: "rgba(11,18,32,0.94)",
};

const CART_KEY        = "bim_supermarche_cart";
const FRAIS_LIVRAISON = 1.00;

const FALLBACK_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDQ8nSucgb7yIGmUn1cusxX94lbpaxYyprHKjsWtHr1-PmNuB2pITmGLL7hKeWazbuBIcmzH5Uqvlr2app0EUk_8yThBZZPyU7UQ6r9uy3Hhg_ouIB_BZjJ4XOAoS8cfQI1i1gnHGjIk2z3ZXHMLbCVLqXm6WV5AgVKArXFXFX7sFgRxpHpvn2IrbjZWpdrJCltiV9vkcaZUa7LfZxfk-ALEdScpBwXQmkODBs_aC-kwthBlFbRJgRmVJWtfq-Iw37VhfhSCFYZ_1w";

function getImgUri(imageUrl: string | null | undefined): string {
  if (!imageUrl) return FALLBACK_IMG;
  return imageUrl.startsWith("http") ? imageUrl : `${API_URL_BASE}${imageUrl}`;
}

/* ─── PIN NUMPAD ─────────────────────────────────────────────────────── */
function PinPad({
  value, onChange, onDelete,
}: { value: string; onChange: (k: string) => void; onDelete: () => void }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const pp = useMemo(() => mkPp(C), [isDark]);
  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return (
    <View style={pp.grid}>
      {keys.map((k, i) =>
        k === "" ? <View key={i} style={pp.key} /> :
        k === "⌫" ? (
          <TouchableOpacity key={i} style={pp.key} onPress={onDelete}>
            <Ionicons name="backspace-outline" size={22} color={C.textMut} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity key={i} style={pp.key} onPress={() => onChange(k)} disabled={value.length >= 6}>
            <Text style={pp.keyText}>{k}</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
}

/* ─── CART ITEM CARD ─────────────────────────────────────────────────── */
function CartCard({
  item, onInc, onDec, onRemove,
}: {
  item: CartItem; onInc: () => void; onDec: () => void; onRemove: () => void;
}) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const cc = useMemo(() => mkCc(C), [isDark]);
  const uri   = getImgUri(item.imageUrl);
  const total = (item.unitPrice * item.qty).toFixed(2);

  return (
    <View style={cc.card}>
      <View style={cc.imgWrap}>
        <Image source={{ uri }} style={cc.img} contentFit="contain" transition={200} />
      </View>
      <View style={cc.info}>
        <View style={cc.topRow}>
          <Text style={cc.name} numberOfLines={2}>{item.name}</Text>
          <TouchableOpacity style={cc.trashBtn} onPress={onRemove} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Ionicons name="trash-outline" size={16} color={C.textMut} />
          </TouchableOpacity>
        </View>
        <Text style={cc.unitPrice}>{item.unitPrice.toFixed(2)} EC / unité</Text>
        <View style={cc.bottomRow}>
          <View style={cc.stepper}>
            <TouchableOpacity
              style={[cc.stepBtn, item.qty <= 1 && cc.stepBtnDim]}
              onPress={item.qty <= 1 ? onRemove : onDec}
              activeOpacity={0.85}
            >
              <Ionicons name={item.qty <= 1 ? "trash-outline" : "remove"} size={14} color={item.qty <= 1 ? C.red : C.primary} />
            </TouchableOpacity>
            <Text style={cc.qty}>{item.qty}</Text>
            <TouchableOpacity style={cc.stepBtn} onPress={onInc} activeOpacity={0.85}>
              <Ionicons name="add" size={14} color={C.primary} />
            </TouchableOpacity>
          </View>
          <Text style={cc.total}>{total} EC</Text>
        </View>
      </View>
    </View>
  );
}

/* ─── SUGGESTION CARD ────────────────────────────────────────────────── */
function SuggestionCard({ item, onAdd }: { item: any; onAdd: () => void }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const sc = useMemo(() => mkSc(C), [isDark]);
  const price = parseFloat(item.price ?? 0);
  const pct   = parseFloat(item.reduction ?? 0);
  const effectivePrice = (pct > 0 && pct <= 100) ? +(price * (1 - pct / 100)).toFixed(2) : price;
  const discount = pct > 0 && pct <= 100;

  return (
    <View style={sc.card}>
      {discount && (
        <View style={sc.discBadge}>
          <Text style={sc.discBadgeText}>-{Math.round(pct)}%</Text>
        </View>
      )}
      <View style={sc.imgWrap}>
        <Image source={{ uri: getImgUri(item.imageUrl) }} style={sc.img} contentFit="contain" transition={200} />
      </View>
      <Text style={sc.name} numberOfLines={2}>{item.name}</Text>
      {discount && (
        <Text style={sc.origPrice}>{price.toFixed(2)} EC</Text>
      )}
      <Text style={sc.price}>{effectivePrice.toFixed(2)} EC</Text>
      <TouchableOpacity style={sc.addBtn} activeOpacity={0.85} onPress={onAdd}>
        <Ionicons name="add" size={14} color={C.white} />
        <Text style={sc.addText}>AJOUTER</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function CartScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const { companyId, companyName } = useLocalSearchParams<{ companyId: string; companyName: string }>();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [cart,   setCart]   = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [mode,   setMode]   = useState<"idle" | "cash" | "order">("idle");

  const [pin,      setPin]      = useState("");
  const [pinError, setPinError] = useState("");
  const pinShake = useRef(new Animated.Value(0)).current;

  const [address, setAddress] = useState("");
  const [phone,   setPhone]   = useState("");
  const [notes,   setNotes]   = useState("");

  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [verifyPass,     { isLoading: verifying }] = useVerifyPassMutation();
  const [createPaiement, { isLoading: paying }]    = useCreatePaiementMutation();
  const [createOrder,    { isLoading: ordering }]  = useCreateOrderMutation();

  const { data: upsellData } = useGetAllProductsQuery({ isUpselling: "true", paginate: "false" });
  const upselling: any[] = upsellData?.data || upsellData || [];

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then(raw => { if (raw) setCart(JSON.parse(raw)); });
    AsyncStorage.getItem("userId").then(setUserId);
  }, []);

  const saveCart = useCallback(async (items: CartItem[]) => {
    setCart(items);
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
  }, []);

  const inc    = (id: number) => saveCart(cart.map(c => c.productId === id ? { ...c, qty: c.qty + 1 } : c));
  const dec    = (id: number) => saveCart(cart.map(c => c.productId === id ? { ...c, qty: Math.max(1, c.qty - 1) } : c));
  const remove = (id: number) => saveCart(cart.filter(c => c.productId !== id));
  const clearCart = async () => { await AsyncStorage.removeItem(CART_KEY); setCart([]); };

  const subtotal      = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const totalCommande = subtotal + FRAIS_LIVRAISON;
  const totalCaisse   = subtotal;

  const shakePin = () => {
    Animated.sequence([
      Animated.timing(pinShake, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleCashPay = async () => {
    if (pin.length < 6) { setPinError("Entrez votre code à 6 chiffres"); return; }
    if (!userId) return;
    try {
      await verifyPass({ userId, password: pin }).unwrap();
    } catch {
      shakePin(); setPinError("Code incorrect"); setPin(""); return;
    }
    try {
      await createPaiement({
        amount:          Number(normalizeDecimal(String(totalCaisse.toFixed(2)))),
        companyId:       Number(companyId),
        productId:       cart[0]?.productId ?? null,
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

  const handleOrder = async () => {
    if (!address.trim()) { Alert.alert("Adresse requise", "Veuillez saisir une adresse de livraison."); return; }
    if (!phone.trim())   { Alert.alert("Téléphone requis", "Veuillez saisir votre numéro de téléphone."); return; }
    try {
      const res = await createOrder({
        items:           cart.map(c => ({ productId: c.productId, qty: c.qty, unitPrice: c.unitPrice })),
        companyId:       Number(companyId),
        shippingAddress: address.trim(),
        notes:           notes.trim() || undefined,
        paymentMethod:   "delivery",
        clientPhone:     phone.trim(),
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
      <SafeAreaView style={[s.flex, { backgroundColor: C.bg }]}>
        <View style={s.resultWrap}>
          <View style={[s.resultIcon, { backgroundColor: result.type === "success" ? C.green + "22" : C.red + "22" }]}>
            <Ionicons
              name={result.type === "success" ? "checkmark-circle" : "close-circle"}
              size={56}
              color={result.type === "success" ? C.green : C.red}
            />
          </View>
          <Text style={s.resultTitle}>{result.type === "success" ? "Succès !" : "Erreur"}</Text>
          <Text style={s.resultText}>{result.text}</Text>
          <TouchableOpacity style={s.confirmBtn} onPress={() => { setResult(null); router.replace("/(tabs)"); }}>
            <LinearGradient colors={[C.blue, C.deep]} style={s.gradBtn}>
              <Text style={s.gradBtnText}>Retour à l'accueil</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ── CASH MODE ── */
  if (mode === "cash") {
    return (
      <View style={[s.flex, { backgroundColor: C.bg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <SafeAreaView style={s.subHeader} edges={["top"]}>
          <View style={s.subTopBar}>
            <TouchableOpacity style={s.backBtn} onPress={() => setMode("idle")}>
              <Ionicons name="arrow-back" size={22} color={C.text} />
            </TouchableOpacity>
            <Text style={s.subTitle}>Paiement en caisse</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={s.recapCard}>
            <Text style={s.recapLabel}>Montant à payer en caisse</Text>
            <Text style={s.recapAmount}>{totalCaisse.toFixed(2)} EC</Text>
            <Text style={s.recapSub}>{cart.length} article{cart.length > 1 ? "s" : ""} — {companyName}</Text>
          </View>
          <Text style={s.pinLabel}>Entrez votre code PIN (6 chiffres)</Text>
          <Animated.View style={[s.pinDots, { transform: [{ translateX: pinShake }] }]}>
            {[0,1,2,3,4,5].map(i => (
              <View key={i} style={[s.dot, { borderColor: pinError ? C.red : C.primary }, i < pin.length && { backgroundColor: C.primary }]} />
            ))}
          </Animated.View>
          {pinError ? <Text style={s.pinError}>{pinError}</Text> : null}
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
            <LinearGradient colors={[C.blue, C.deep]} style={s.gradBtn}>
              {(verifying || paying)
                ? <Text style={s.gradBtnText}>Traitement…</Text>
                : <><Ionicons name="checkmark-circle-outline" size={18} color={C.white} /><Text style={s.gradBtnText}>Confirmer le paiement</Text></>
              }
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  /* ── ORDER MODE ── */
  if (mode === "order") {
    return (
      <View style={[s.flex, { backgroundColor: C.bg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <SafeAreaView style={s.subHeader} edges={["top"]}>
          <View style={s.subTopBar}>
            <TouchableOpacity style={s.backBtn} onPress={() => setMode("idle")}>
              <Ionicons name="arrow-back" size={22} color={C.text} />
            </TouchableOpacity>
            <Text style={s.subTitle}>Livraison</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <View style={s.recapCard}>
              <Text style={s.recapLabel}>Total commande (avec livraison)</Text>
              <Text style={s.recapAmount}>{totalCommande.toFixed(2)} EC</Text>
              <Text style={s.recapSub}>{cart.length} article{cart.length > 1 ? "s" : ""} + {FRAIS_LIVRAISON.toFixed(2)} EC livraison</Text>
            </View>
            <Text style={s.fieldLabel}>Votre numéro de téléphone *</Text>
            <View style={s.inputWrap}>
              <Ionicons name="call-outline" size={16} color={C.textMut} style={{ marginLeft: 12 }} />
              <TextInput style={s.input} placeholder="+243 8xx xxx xxx" placeholderTextColor={C.textMut} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
            <Text style={s.fieldLabel}>Adresse de livraison *</Text>
            <View style={s.inputWrap}>
              <Ionicons name="location-outline" size={16} color={C.textMut} style={{ marginLeft: 12 }} />
              <TextInput style={s.input} placeholder="Quartier, avenue, numéro…" placeholderTextColor={C.textMut} value={address} onChangeText={setAddress} multiline numberOfLines={2} />
            </View>
            <Text style={s.fieldLabel}>Note (optionnel)</Text>
            <View style={s.inputWrap}>
              <Ionicons name="chatbubble-outline" size={16} color={C.textMut} style={{ marginLeft: 12, marginTop: 4 }} />
              <TextInput style={s.input} placeholder="Instructions particulières…" placeholderTextColor={C.textMut} value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
            </View>
            <TouchableOpacity
              style={[s.confirmBtn, (ordering || !address.trim() || !phone.trim()) && { opacity: 0.6 }]}
              onPress={handleOrder}
              disabled={ordering || !address.trim() || !phone.trim()}
            >
              <LinearGradient colors={[C.blue, C.deep]} style={s.gradBtn}>
                {ordering
                  ? <Text style={s.gradBtnText}>Envoi…</Text>
                  : <><Ionicons name="send-outline" size={18} color={C.white} /><Text style={s.gradBtnText}>Passer la commande</Text></>
                }
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  /* ── IDLE MODE ── */
  return (
    <View style={[s.flex, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ── */}
      <SafeAreaView style={s.header} edges={["top"]}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <View style={s.titleBlock}>
            <Text style={s.headerTitle}>Mon Panier</Text>
            <Text style={s.headerSub}>
              {companyName || "Supermarché"} · {cart.length} article{cart.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarText}>BN</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── EMPTY ── */}
      {cart.length === 0 && (
        <View style={s.emptyWrap}>
          <View style={s.emptyIcon}>
            <Ionicons name="cart-outline" size={48} color={C.primary} />
          </View>
          <Text style={s.emptyTitle}>Panier vide</Text>
          <Text style={s.emptySub}>Ajoutez des produits depuis le catalogue</Text>
          <TouchableOpacity style={s.confirmBtn} onPress={() => router.back()}>
            <LinearGradient colors={[C.blue, C.deep]} style={s.gradBtn}>
              <Text style={s.gradBtnText}>Voir les produits</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* ── CART CONTENT ── */}
      {cart.length > 0 && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* Items */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>
            {cart.map(item => (
              <CartCard
                key={item.productId}
                item={item}
                onInc={() => inc(item.productId)}
                onDec={() => dec(item.productId)}
                onRemove={() => remove(item.productId)}
              />
            ))}
          </View>

          {/* Complétez votre panier */}
          {upselling.length > 0 && (
            <View style={s.suggestSection}>
              <Text style={s.suggestTitle}>Complétez votre panier</Text>
              <Text style={s.suggestSub}>Ventes croisées · {upselling.length} produit{upselling.length > 1 ? "s" : ""}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.suggestScroll}>
                {upselling.map((item: any) => (
                  <SuggestionCard
                    key={item.productId}
                    item={item}
                    onAdd={() => {
                      const pct       = parseFloat(item.reduction ?? 0);
                      const base      = parseFloat(item.price ?? 0);
                      const unitPrice = (pct > 0 && pct <= 100) ? +(base * (1 - pct / 100)).toFixed(2) : base;
                      const idx       = cart.findIndex(c => c.productId === item.productId);
                      if (idx >= 0) {
                        saveCart(cart.map((c, i) => i === idx ? { ...c, qty: c.qty + 1 } : c));
                      } else {
                        saveCart([...cart, { productId: item.productId, name: item.name, unitPrice, qty: 1, imageUrl: item.imageUrl ?? null }]);
                      }
                    }}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Récapitulatif */}
          <View style={s.summaryCard}>
            <View style={s.sumRow}>
              <Text style={s.sumLabel}>Sous-total</Text>
              <Text style={s.sumVal}>{subtotal.toFixed(2)} EC</Text>
            </View>
            <View style={s.sumRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.sumLabel}>Frais de livraison</Text>
                <Text style={s.sumNote}>Applicable si vous commandez</Text>
              </View>
              <Text style={s.sumVal}>{FRAIS_LIVRAISON.toFixed(2)} EC</Text>
            </View>
            <View style={s.sumDivider} />
            <View style={s.sumRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.sumTotalLabel}>Total livraison</Text>
                <Text style={s.sumNote}>Paiement caisse : {subtotal.toFixed(2)} EC</Text>
              </View>
              <Text style={s.sumTotal}>{totalCommande.toFixed(2)} EC</Text>
            </View>
          </View>

          {/* Boutons action */}
          <View style={s.actionsWrap}>
            <TouchableOpacity
              style={s.commanderBtn}
              onPress={() => { setAddress(""); setNotes(""); setMode("order"); }}
              activeOpacity={0.9}
            >
              <LinearGradient colors={[C.blue, C.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.commanderGrad}>
                <Ionicons name="bicycle-outline" size={20} color={C.white} />
                <Text style={s.commanderText}>Commander</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.caisseBtn}
              onPress={() => { setPin(""); setPinError(""); setMode("cash"); }}
              activeOpacity={0.9}
            >
              <Ionicons name="qr-code-outline" size={20} color={C.primary} />
              <Text style={s.caisseText}>Payer en caisse</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ── BOTTOM NAV ── */}
      <View style={[s.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TouchableOpacity style={s.navItem} onPress={() => router.replace("/(tabs)" as any)} activeOpacity={0.7}>
          <Ionicons name="home-outline" size={22} color={C.textMut} />
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} activeOpacity={0.7}>
          <Ionicons name="globe-outline" size={22} color={C.textMut} />
        </TouchableOpacity>
        <View style={s.navCenter}>
          <TouchableOpacity style={s.navCenterBtn} activeOpacity={0.85}>
            <Ionicons name="qr-code-outline" size={24} color={C.white} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.navItem} activeOpacity={0.7}>
          <Ionicons name="stats-chart-outline" size={22} color={C.textMut} />
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => router.push("/profile" as any)} activeOpacity={0.7}>
          <Ionicons name="person-outline" size={22} color={C.textMut} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  flex: { flex: 1 },

  header:      { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  topBar:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surfLow, alignItems: "center", justifyContent: "center" },
  titleBlock:  { flex: 1, alignItems: "center" },
  headerTitle: { fontFamily: "NexaBold", fontSize: 20, color: C.text },
  headerSub:   { fontFamily: "NexaLight", fontSize: 12, color: C.textMut, marginTop: 2 },
  avatar:      { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  avatarText:  { fontFamily: "NexaBold", fontSize: 14, color: C.white },

  emptyWrap:   { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyIcon:   { width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(0,53,197,0.07)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle:  { fontFamily: "NexaBold", fontSize: 20, color: C.text },
  emptySub:    { fontFamily: "NexaLight", fontSize: 13, color: C.textMut, textAlign: "center" },

  suggestSection: { paddingTop: 24, paddingBottom: 8 },
  suggestTitle:   { fontFamily: "NexaBold", fontSize: 17, color: C.text, paddingHorizontal: 16, marginBottom: 2 },
  suggestSub:     { fontFamily: "NexaLight", fontSize: 12, color: C.textMut, paddingHorizontal: 16, marginBottom: 12 },
  suggestScroll:  { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },

  summaryCard: {
    marginHorizontal: 16, marginTop: 20, backgroundColor: C.card,
    borderRadius: 24, padding: 20, gap: 10,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 3 },
  },
  sumRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sumLabel:      { fontFamily: "NexaLight", fontSize: 14, color: C.textSec },
  sumVal:        { fontFamily: "NexaBold", fontSize: 14, color: C.text },
  sumDivider:    { height: 1, backgroundColor: C.border, marginVertical: 4 },
  sumTotalLabel: { fontFamily: "NexaBold", fontSize: 16, color: C.text },
  sumTotal:      { fontFamily: "NexaBold", fontSize: 20, color: C.primary },
  sumNote:       { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, marginTop: 1 },

  actionsWrap:   { paddingHorizontal: 16, paddingTop: 20, gap: 12 },
  commanderBtn:  { borderRadius: 56, overflow: "hidden", elevation: 4, shadowColor: C.blue, shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  commanderGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18 },
  commanderText: { fontFamily: "NexaBold", fontSize: 16, color: C.white },
  caisseBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 56, borderWidth: 2, borderColor: C.primary, paddingVertical: 16 },
  caisseText:    { fontFamily: "NexaBold", fontSize: 16, color: C.primary },

  bottomNav:     { position: "absolute", bottom: 0, left: 0, right: 0, height: 72, backgroundColor: C.navBg, borderTopWidth: 1, borderTopColor: C.border, flexDirection: "row", alignItems: "center", justifyContent: "space-around", elevation: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: -3 } },
  navItem:       { flex: 1, alignItems: "center", justifyContent: "center", height: 48 },
  navCenter:     { flex: 1, alignItems: "center", justifyContent: "center" },
  navCenterBtn:  { width: 52, height: 52, borderRadius: 26, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", elevation: 8, shadowColor: C.primary, shadowOpacity: 0.38, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, marginBottom: 16 },

  subHeader:   { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  subTopBar:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  subTitle:    { fontFamily: "NexaBold", fontSize: 18, color: C.text, flex: 1, textAlign: "center" },

  recapCard:   { backgroundColor: C.card, borderRadius: 24, padding: 24, alignItems: "center", marginBottom: 24, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 3 } },
  recapLabel:  { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, textTransform: "uppercase", letterSpacing: 1 },
  recapAmount: { fontFamily: "NexaBold", fontSize: 32, color: C.primary, marginVertical: 6 },
  recapSub:    { fontFamily: "NexaLight", fontSize: 12, color: C.textMut },

  pinLabel:    { fontFamily: "NexaLight", fontSize: 13, color: C.text, textAlign: "center", marginBottom: 16 },
  pinDots:     { flexDirection: "row", justifyContent: "center", gap: 14, marginBottom: 8 },
  dot:         { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  pinError:    { fontFamily: "NexaLight", fontSize: 12, color: C.red, textAlign: "center", marginBottom: 12 },

  confirmBtn:  { borderRadius: 56, overflow: "hidden", marginTop: 24 },

  fieldLabel:  { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  inputWrap:   { flexDirection: "row", alignItems: "flex-start", borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, minHeight: 50, paddingVertical: 10 },
  input:       { flex: 1, fontFamily: "NexaLight", fontSize: 13, color: C.text, paddingHorizontal: 10, paddingTop: 2 },

  gradBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  gradBtnText: { fontFamily: "NexaBold", fontSize: 15, color: C.white },

  resultWrap:  { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 14 },
  resultIcon:  { width: 96, height: 96, borderRadius: 48, justifyContent: "center", alignItems: "center" },
  resultTitle: { fontFamily: "NexaBold", fontSize: 22, color: C.text },
  resultText:  { fontFamily: "NexaLight", fontSize: 14, color: C.textSec, textAlign: "center", lineHeight: 20 },
}); }

/* ─── CART CARD STYLES ───────────────────────────────────────────────── */
function mkCc(C: typeof LIGHT) { return StyleSheet.create({
  card:      { backgroundColor: C.card, borderRadius: 24, padding: 14, flexDirection: "row", gap: 14, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
  imgWrap:   { width: 80, height: 80, borderRadius: 18, backgroundColor: C.surfLow, alignItems: "center", justifyContent: "center", padding: 8, flexShrink: 0 },
  img:       { width: "100%", height: "100%" },
  info:      { flex: 1, justifyContent: "space-between", gap: 4 },
  topRow:    { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  name:      { flex: 1, fontFamily: "NexaBold", fontSize: 14, color: C.text, lineHeight: 20 },
  trashBtn:  { padding: 4 },
  unitPrice: { fontFamily: "NexaLight", fontSize: 11, color: C.textMut },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepper:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.surfLow, borderRadius: 99, paddingHorizontal: 6, paddingVertical: 4 },
  stepBtn:   { width: 30, height: 30, borderRadius: 15, backgroundColor: C.card, alignItems: "center", justifyContent: "center", elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  stepBtnDim:{ opacity: 0.6 },
  qty:       { fontFamily: "NexaBold", fontSize: 15, color: C.text, minWidth: 22, textAlign: "center" },
  total:     { fontFamily: "NexaBold", fontSize: 16, color: C.primary },
}); }

/* ─── SUGGESTION CARD STYLES ─────────────────────────────────────────── */
function mkSc(C: typeof LIGHT) { return StyleSheet.create({
  card:         { width: 140, backgroundColor: C.card, borderRadius: 22, padding: 12, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
  imgWrap:      { width: "100%", height: 96, borderRadius: 16, backgroundColor: C.surfLow, alignItems: "center", justifyContent: "center", padding: 8, marginBottom: 10 },
  img:          { width: "100%", height: "100%" },
  name:         { fontFamily: "NexaBold", fontSize: 12, color: C.text, marginBottom: 4, lineHeight: 17 },
  origPrice:    { fontFamily: "NexaLight", fontSize: 10, color: C.textMut, textDecorationLine: "line-through", marginBottom: 1 },
  price:        { fontFamily: "NexaBold", fontSize: 13, color: C.primary, marginBottom: 8 },
  addBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: C.primary, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 12 },
  addText:      { fontFamily: "NexaBold", fontSize: 11, color: C.white, letterSpacing: 0.6 },
  discBadge:    { position: "absolute", top: 8, right: 8, backgroundColor: C.green, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, zIndex: 1 },
  discBadgeText:{ fontFamily: "NexaBold", fontSize: 9, color: C.white },
}); }

/* ─── PIN PAD STYLES ─────────────────────────────────────────────────── */
function mkPp(C: typeof LIGHT) { return StyleSheet.create({
  grid:    { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginVertical: 8 },
  key:     { width: "30%", aspectRatio: 1.8, justifyContent: "center", alignItems: "center", margin: "1.5%" },
  keyText: { fontFamily: "NexaLight", fontSize: 22, fontWeight: "700", color: C.text },
}); }
