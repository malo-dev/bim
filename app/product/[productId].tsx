/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL_BASE } from "@/constants/api";
import { useGetproductByIdQuery } from "@/services/productServices";
import { useCreateOrderMutation } from "@/services/orderService";
import { useCreatePaiementMutation } from "@/services/tsxService";
import { useGetUserByIdQuery } from "@/services/userService";
import { getLastKnownLocation } from "@/hooks/useEnsureLocation";
import { useAppTheme } from "@/app/_layout";

const { width } = Dimensions.get("window");

const LIGHT = {
  bg: "#F8FAFC", card: "#FFFFFF", cardLow: "#F8FAFC",
  primary: "#0035C5", blue: "#0047FF", text: "#0F172A", textSub: "#434657", textMut: "#64748B",
  border: "rgba(15,23,42,0.08)", imgFallA: "#DDE4F5", imgFallB: "#EEF2FF",
  green: "#10B981", amber: "#F59E0B", red: "#EF4444", white: "#FFFFFF",
};
const DARK: typeof LIGHT = {
  bg: "#0B1220", card: "#1A2540", cardLow: "#0F1A2E",
  primary: "#4D8DFF", blue: "#4D8DFF", text: "#EAF0FF", textSub: "#A3B4D0", textMut: "#6B7A99",
  border: "rgba(31,42,68,0.80)", imgFallA: "#0F1A2E", imgFallB: "#1A2540",
  green: "#22C55E", amber: "#D97706", red: "#FF5A5A", white: "#FFFFFF",
};

function resolveImg(url?: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_URL_BASE}${url}`;
}

export default function ProductDetail() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { productId } = useLocalSearchParams<{ productId: string }>();

  const { data, isLoading } = useGetproductByIdQuery(productId, { skip: !productId });
  const product = data?.data ?? data;

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);
  const { data: user } = useGetUserByIdQuery(userId!, { skip: !userId });

  const [createOrder, { isLoading: ordering }] = useCreateOrderMutation();
  const [createPaiement] = useCreatePaiementMutation();
  const [loadingPay, setLoadingPay] = useState(false);

  const gallery: string[] = useMemo(() => {
    if (!product) return [];
    return [
      ...(product.imageUrl ? [product.imageUrl] : []),
      ...(Array.isArray(product.images) ? product.images : []),
    ];
  }, [product]);
  const [imgIndex, setImgIndex] = useState(0);

  const [qty, setQty] = useState(1);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    setAddress(user?.adresse || "");
    setPhone(user?.telephone || "");
  }, [user?.adresse, user?.telephone]);

  const price = Number(product?.price ?? 0);
  const total = (price * qty).toFixed(2);

  const handleShare = () => {
    if (!product) return;
    Share.share({
      message: product.priceOnRequest
        ? `${product.name} — Prix à discuter · BIM NEXT`
        : `${product.name} — ${price.toFixed(2)} EC · BIM NEXT`,
    }).catch(() => {});
  };

  const commanderDirectement = () => {
    if (!address.trim()) { Alert.alert("Adresse requise", "Veuillez saisir une adresse de livraison."); return; }
    if (!phone.trim())   { Alert.alert("Téléphone requis", "Veuillez saisir votre numéro de téléphone."); return; }
    Alert.alert(
      "Confirmer la commande",
      product.priceOnRequest
        ? `Commander ${qty} × ${product.name} ? Le prix sera discuté à la livraison.`
        : `Commander ${qty} × ${product.name} pour ${total} EC ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Commander",
          onPress: async () => {
            try {
              const destination = await getLastKnownLocation();
              const res: any = await createOrder({
                items: [{ productId: product.productId, qty, unitPrice: price }],
                paymentMethod: "delivery",
                shippingAddress: address.trim(),
                clientPhone: phone.trim(),
                destinationLat: destination?.lat,
                destinationLng: destination?.lng,
                ...(product.companyId && { companyId: product.companyId }),
                ...(product.priceOnRequest && { notes: "Prix à discuter à la livraison" }),
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

  /* ── Payer directement — débite le compte immédiatement, pas de suivi de livraison ── */
  const payerDirectement = async () => {
    if (!userId || product.priceOnRequest) return;
    if (!address.trim() || !phone.trim()) {
      Alert.alert("Informations manquantes", "Veuillez compléter votre adresse et votre numéro de téléphone.");
      return;
    }
    try {
      setLoadingPay(true);
      await createPaiement({
        amount:          Number(total),
        ...(product.companyId && { companyId: product.companyId }),
        shippingAddress: address.trim(),
        notes:           `Paiement direct — ${qty} × ${product.name}`,
        paymentMethod:   "BIM NEXT APP",
        id:              Number(userId),
        productId:       product.productId,
      }).unwrap();
      Alert.alert("Paiement réussi", `${qty} × ${product.name} payé(s) avec succès pour ${total} EC.`, [
        { text: "OK", onPress: () => router.replace("/(tabs)" as any) },
      ]);
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Le paiement n'a pas pu être effectué, réessayez.");
    } finally {
      setLoadingPay(false);
    }
  };

  const suivreLaCommande = () => {
    if (!orderNumber) return;
    router.replace({ pathname: "/bim-supermarche/order-tracking", params: { orderNumber } } as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <SafeAreaView edges={["top"]} style={s.safeBar}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.topTitle} numberOfLines={1}>Détail Produit</Text>
          <TouchableOpacity style={s.iconBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={C.text} />
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 14 }}>
          {/* ── GALERIE ── */}
          <View style={s.galleryCard}>
            <View style={s.mainImgWrap}>
              {gallery.length > 0 ? (
                <Image source={{ uri: resolveImg(gallery[imgIndex])! }} style={s.mainImg} contentFit="cover" transition={250} />
              ) : (
                <View style={[s.mainImg, { backgroundColor: C.imgFallB, alignItems: "center", justifyContent: "center" }]}>
                  <Ionicons name="cube-outline" size={56} color={C.primary} style={{ opacity: 0.35 }} />
                </View>
              )}
            </View>
            {gallery.length > 1 && (
              <View style={s.thumbRow}>
                {gallery.map((img, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.thumb, i === imgIndex && { borderColor: C.primary, borderWidth: 2 }]}
                    onPress={() => setImgIndex(i)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: resolveImg(img)! }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── TITRE / PRIX ── */}
          <View style={s.card}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              {!!product.categories?.[0]?.name && (
                <Text style={s.category} numberOfLines={1}>{product.categories[0].name}</Text>
              )}
              <View style={s.certifiedPill}>
                <Ionicons name="checkmark-circle" size={13} color={C.primary} />
                <Text style={s.certifiedText}>Certifié BIM NEXT</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginTop: 6 }}>
              <Text style={s.name}>{product.name}</Text>
              <View style={{ alignItems: "flex-end" }}>
                {product.priceOnRequest ? (
                  <Text style={s.priceOnRequest}>Prix à discuter</Text>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                    <Text style={s.price}>{price.toFixed(2)}</Text>
                    <Text style={s.priceEC}>EC</Text>
                  </View>
                )}
              </View>
            </View>
            {!!product.description && (
              <Text style={s.desc}>{product.description}</Text>
            )}
          </View>

          {/* ── QUANTITÉ ── */}
          {!orderNumber && (
            <View style={s.card}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={s.cardLabel}>Quantité d'unités</Text>
                <View style={s.qtyStepper}>
                  <TouchableOpacity style={s.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
                    <Ionicons name="remove" size={16} color={C.primary} />
                  </TouchableOpacity>
                  <Text style={s.qtyValue}>{qty}</Text>
                  <TouchableOpacity style={s.qtyBtn} onPress={() => setQty((q) => q + 1)}>
                    <Ionicons name="add" size={16} color={C.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* ── LIVRAISON ── */}
          {!orderNumber && (
            <View style={s.card}>
              <Text style={s.cardLabel}>Informations de livraison</Text>
              <View style={{ gap: 10, marginTop: 10 }}>
                <View>
                  <Text style={s.fieldLabel}>Téléphone <Text style={s.fieldRequired}>· obligatoire</Text></Text>
                  <View style={s.inputWrap}>
                    <Ionicons name="call-outline" size={16} color={C.textMut} />
                    <TextInput
                      style={s.input}
                      placeholder="+243 8xx xxx xxx"
                      placeholderTextColor={C.textMut}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
                <View>
                  <Text style={s.fieldLabel}>Adresse <Text style={s.fieldRequired}>· obligatoire</Text></Text>
                  <View style={s.inputWrap}>
                    <Ionicons name="location-outline" size={16} color={C.textMut} />
                    <TextInput
                      style={s.input}
                      placeholder="Quartier, avenue…"
                      placeholderTextColor={C.textMut}
                      value={address}
                      onChangeText={setAddress}
                      multiline
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ── CONFIANCE ── */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={[s.trustCard, { flex: 1 }]}>
              <View style={s.trustIconWrap}><Ionicons name="shield-checkmark-outline" size={18} color={C.primary} /></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.trustTitle}>Paiement Garanti</Text>
                <Text style={s.trustSub}>Protocole EC sécurisé</Text>
              </View>
            </View>
            <View style={[s.trustCard, { flex: 1 }]}>
              <View style={s.trustIconWrap}><Ionicons name="headset-outline" size={18} color={C.primary} /></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.trustTitle}>Support 7j/7</Text>
                <Text style={s.trustSub}>Accompagnement</Text>
              </View>
            </View>
          </View>

          {/* ── CONFIRMATION ── */}
          {orderNumber && (
            <View style={[s.card, { alignItems: "center", gap: 6 }]}>
              <Ionicons name="checkmark-circle" size={32} color={C.green} />
              <Text style={s.successTitle}>Commande envoyée</Text>
              <Text style={s.successSub}>Réf. {orderNumber}</Text>
              <TouchableOpacity style={s.trackBtn} onPress={suivreLaCommande} activeOpacity={0.88}>
                <Text style={s.trackBtnText}>Suivre la commande</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── BARRE FIXE ── */}
      {!isLoading && product && !orderNumber && (
        <View style={[s.bottomBar, { paddingBottom: insets.bottom + 14 }]}>
          <View>
            <Text style={s.bottomLabel}>Prix total</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
              {product.priceOnRequest ? (
                <Text style={s.bottomAmount}>À discuter</Text>
              ) : (
                <>
                  <Text style={s.bottomAmount}>{total}</Text>
                  <Text style={s.bottomAmountEC}>EC</Text>
                </>
              )}
            </View>
          </View>
          {!product.priceOnRequest && (
            <TouchableOpacity style={s.payDirectBtn} onPress={payerDirectement} activeOpacity={0.88} disabled={loadingPay}>
              {loadingPay ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="flash-outline" size={16} color="#fff" />
                  <Text style={s.payDirectBtnText}>Payer</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.commandBtn} onPress={commanderDirectement} activeOpacity={0.88} disabled={ordering}>
            {ordering ? (
              <ActivityIndicator color={C.primary} size="small" />
            ) : (
              <>
                <Ionicons name="bag-handle-outline" size={16} color={C.primary} />
                <Text style={s.commandBtnText}>Commander</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function mkS(C: typeof LIGHT) { return StyleSheet.create({
  safeBar: { backgroundColor: C.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.cardLow, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  topTitle: { flex: 1, fontFamily: "NexaBold", fontSize: 16, color: C.text, textAlign: "center" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontFamily: "NexaLight", fontSize: 14, color: C.textMut },

  galleryCard: { backgroundColor: C.card, borderRadius: 20, padding: 10, borderWidth: 1, borderColor: C.border, gap: 10 },
  mainImgWrap: { width: "100%", height: 260, borderRadius: 14, overflow: "hidden", backgroundColor: C.imgFallA },
  mainImg: { width: "100%", height: "100%" },
  thumbRow: { flexDirection: "row", gap: 8 },
  thumb: { width: 56, height: 56, borderRadius: 12, overflow: "hidden", backgroundColor: C.imgFallA, borderWidth: 1, borderColor: C.border },

  card: { backgroundColor: C.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border, gap: 4 },
  category: { fontFamily: "NexaBold", fontSize: 10, color: C.primary, letterSpacing: 0.6, textTransform: "uppercase" },
  certifiedPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.cardLow, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  certifiedText: { fontFamily: "NexaBold", fontSize: 10, color: C.primary },
  name: { flex: 1, fontFamily: "NexaBold", fontSize: 20, color: C.text, lineHeight: 26 },
  price: { fontFamily: "NexaBold", fontSize: 22, color: C.text },
  priceEC: { fontFamily: "NexaBold", fontSize: 13, color: C.primary },
  priceOnRequest: { fontFamily: "NexaBold", fontSize: 14, color: C.amber },
  desc: { fontFamily: "NexaLight", fontSize: 13, color: C.textSub, lineHeight: 20, marginTop: 10 },

  cardLabel: { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  qtyStepper: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: C.cardLow },
  qtyValue: { fontFamily: "NexaBold", fontSize: 15, color: C.text, minWidth: 20, textAlign: "center" },

  fieldLabel: { fontFamily: "NexaBold", fontSize: 11, color: C.text, marginBottom: 4 },
  fieldRequired: { fontFamily: "NexaBold", fontSize: 10, color: C.red },
  inputWrap: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.cardLow, paddingHorizontal: 12, paddingVertical: 10,
  },
  input: { flex: 1, fontFamily: "NexaLight", fontSize: 13, color: C.text, paddingTop: 0 },

  trustCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.border },
  trustIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.cardLow, alignItems: "center", justifyContent: "center" },
  trustTitle: { fontFamily: "NexaBold", fontSize: 12, color: C.text },
  trustSub: { fontFamily: "NexaLight", fontSize: 10, color: C.textMut, marginTop: 1 },

  successTitle: { fontFamily: "NexaBold", fontSize: 16, color: C.text, marginTop: 4 },
  successSub: { fontFamily: "NexaLight", fontSize: 12, color: C.textMut },
  trackBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.green, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24, marginTop: 10 },
  trackBtnText: { fontFamily: "NexaBold", fontSize: 14, color: "#fff" },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    paddingHorizontal: 18, paddingTop: 14,
    elevation: 12, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -4 },
  },
  bottomLabel: { fontFamily: "NexaLight", fontSize: 10, color: C.textMut, textTransform: "uppercase", letterSpacing: 0.6 },
  bottomAmount: { fontFamily: "NexaBold", fontSize: 20, color: C.text },
  bottomAmountEC: { fontFamily: "NexaBold", fontSize: 13, color: C.primary },
  commandBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderRadius: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: C.primary,
  },
  commandBtnText: { fontFamily: "NexaBold", fontSize: 13, color: C.primary },
  payDirectBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: C.primary, borderRadius: 16, paddingVertical: 14,
    elevation: 6, shadowColor: C.blue, shadowOpacity: 0.30, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  payDirectBtnText: { fontFamily: "NexaBold", fontSize: 14, color: "#fff" },
}); }
