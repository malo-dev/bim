import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_URL_BASE } from "@/constants/api";
import { useCreateOrderMutation } from "@/services/orderService";
import { useAppTheme } from "@/app/_layout";

const { width } = Dimensions.get("window");

function resolveImg(url?: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_URL_BASE}${url}`;
}

export default function RandomProductModal({
  visible,
  product,
  onClose,
}: {
  visible: boolean;
  product: any | null;
  onClose: () => void;
}) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router = useRouter();

  const [qty, setQty] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [createOrder, { isLoading: ordering }] = useCreateOrderMutation();

  if (!product) return null;

  const gallery: string[] = [
    ...(product.imageUrl ? [product.imageUrl] : []),
    ...(Array.isArray(product.images) ? product.images : []),
  ];
  const price = Number(product.price ?? 0);
  const total = (price * qty).toFixed(2);

  const reset = () => { setQty(1); setImgIndex(0); setOrderNumber(null); };
  const handleClose = () => { reset(); onClose(); };

  const commanderDirectement = () => {
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
              const res: any = await createOrder({
                items: [{ productId: product.productId, qty, unitPrice: price }],
                paymentMethod: "delivery",
                ...(product.priceOnRequest && { notes: "Prix à discuter à la livraison" }),
              }).unwrap();
              setOrderNumber(res.orderNumber);
            } catch {
              Alert.alert("Erreur", "La commande n'a pas pu être envoyée, réessayez.");
            }
          },
        },
      ]
    );
  };

  const suivreLaCommande = () => {
    if (!orderNumber) return;
    handleClose();
    router.push({ pathname: "/bim-supermarche/order-tracking", params: { orderNumber } } as any);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={18} color={C.textSub} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Galerie */}
            <View style={s.galleryWrap}>
              {gallery.length > 0 ? (
                <ScrollView
                  horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => setImgIndex(Math.round(e.nativeEvent.contentOffset.x / (width - 40)))}
                >
                  {gallery.map((img, i) => (
                    <Image key={i} source={{ uri: resolveImg(img)! }} style={{ width: width - 40, height: 240 }} contentFit="contain" transition={250} />
                  ))}
                </ScrollView>
              ) : (
                <View style={[s.galleryWrap, { alignItems: "center", justifyContent: "center" }]}>
                  <Ionicons name="cube-outline" size={48} color={C.primary} style={{ opacity: 0.3 }} />
                </View>
              )}
              {gallery.length > 1 && (
                <View style={s.dotsRow}>
                  {gallery.map((_, i) => (
                    <View key={i} style={[s.dot, i === imgIndex && { backgroundColor: C.primary, width: 18 }]} />
                  ))}
                </View>
              )}
            </View>

            <View style={s.body}>
              <Text style={s.name}>{product.name}</Text>
              {product.priceOnRequest ? (
                <View style={s.reqBadge}>
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color={C.amber} />
                  <Text style={s.reqBadgeText}>Prix à discuter à la livraison</Text>
                </View>
              ) : (
                <Text style={s.price}>{price.toFixed(2)} EC</Text>
              )}
              {!!product.description && <Text style={s.desc}>{product.description}</Text>}

              {!orderNumber && (
                <View style={s.qtyRow}>
                  <Text style={s.qtyLabel}>Quantité</Text>
                  <View style={s.qtyStepper}>
                    <TouchableOpacity style={s.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))}>
                      <Ionicons name="remove" size={16} color={C.primary} />
                    </TouchableOpacity>
                    <Text style={s.qtyValue}>{qty}</Text>
                    <TouchableOpacity style={s.qtyBtn} onPress={() => setQty(q => q + 1)}>
                      <Ionicons name="add" size={16} color={C.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {orderNumber ? (
                <View style={s.successBox}>
                  <Ionicons name="checkmark-circle" size={28} color={C.green} />
                  <Text style={s.successTitle}>Commande envoyée</Text>
                  <Text style={s.successSub}>Réf. {orderNumber}</Text>
                  <TouchableOpacity style={s.trackBtn} onPress={suivreLaCommande} activeOpacity={0.88}>
                    <Text style={s.trackBtnText}>Suivre la commande</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={s.orderBtn} onPress={commanderDirectement} activeOpacity={0.88} disabled={ordering}>
                  {ordering
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={s.orderBtnText}>
                        Commander directement{!product.priceOnRequest && ` · ${total} EC`}
                      </Text>}
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const LIGHT = {
  bg: "#FFFFFF", text: "#1A1C1C", textSub: "#434657", textMut: "#747688",
  primary: "#0035C5", green: "#10B981", amber: "#F59E0B", border: "rgba(196,197,218,0.30)",
  dotIdle: "#C4C5DA", reqBg: "rgba(245,158,11,0.10)",
};
const DARK: typeof LIGHT = {
  bg: "#0B1220", text: "#EAF0FF", textSub: "#A3B4D0", textMut: "#6B7A99",
  primary: "#4D8DFF", green: "#059669", amber: "#D97706", border: "rgba(31,42,68,0.80)",
  dotIdle: "#2A3A5A", reqBg: "rgba(217,119,6,0.12)",
};

function mkS(C: typeof LIGHT) { return StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet:   { backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "88%" },
  handle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  closeBtn:{ position: "absolute", top: 14, right: 16, width: 30, height: 30, borderRadius: 15, backgroundColor: C.border, alignItems: "center", justifyContent: "center", zIndex: 2 },

  galleryWrap: { height: 240, backgroundColor: C.reqBg, marginHorizontal: 20, marginTop: 8, borderRadius: 24, overflow: "hidden" },
  dotsRow: { position: "absolute", bottom: 10, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 },
  dot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.6)" },

  body: { padding: 20, gap: 10 },
  name: { fontFamily: "NexaBold", fontSize: 19, color: C.text },
  price:{ fontFamily: "NexaBold", fontSize: 20, color: C.primary },
  desc: { fontFamily: "NexaLight", fontSize: 13, color: C.textSub, lineHeight: 20 },

  reqBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.reqBg, alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  reqBadgeText: { fontFamily: "NexaBold", fontSize: 12, color: C.amber },

  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  qtyLabel: { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  qtyStepper: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: C.reqBg },
  qtyValue: { fontFamily: "NexaBold", fontSize: 15, color: C.text, minWidth: 20, textAlign: "center" },

  orderBtn: { backgroundColor: C.primary, borderRadius: 18, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  orderBtnText: { fontFamily: "NexaBold", fontSize: 15, color: "#fff" },

  successBox: { alignItems: "center", gap: 4, paddingVertical: 12 },
  successTitle: { fontFamily: "NexaBold", fontSize: 16, color: C.text, marginTop: 4 },
  successSub: { fontFamily: "NexaLight", fontSize: 12, color: C.textMut },
  trackBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.green, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24, marginTop: 12 },
  trackBtnText: { fontFamily: "NexaBold", fontSize: 14, color: "#fff" },
}); }
