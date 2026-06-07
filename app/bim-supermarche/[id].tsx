import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
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
import Svg, { Path, Rect, Defs, LinearGradient as SvgGrad, Stop } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetAllProductsQuery } from "@/services/productServices";
import { API_URL_BASE } from "@/constants/api";
import NoData from "@/components/ui/noData";

/* ─── THEME ──────────────────────────────────────────────────────────── */
const C = {
  primary: "#0353CC", violet: "#3906C7", deep: "#302E99",
  accent: "#4D96FF", gold: "#FFD700", green: "#22C55E",
  red: "#EF4444", white: "#FFFFFF", text: "#0D1B3E", muted: "#7B8DB0",
  f4: "#F4F6FB",
};
const TH = {
  light: {
    bg: "#F0F4FF", card: "#FFFFFF", text: "#0D1B3E",
    sub: "#7B8DB0", border: "rgba(3,83,204,0.10)",
    drawer: "#FFFFFF", headerGrad: [C.deep, C.primary] as [string, string],
  },
  dark: {
    bg: "#0A0F1E", card: "#111827", text: "#E2E8F0",
    sub: "#64748B", border: "rgba(255,255,255,0.08)",
    drawer: "#111827", headerGrad: ["#060B18", "#0D1B3E"] as [string, string],
  },
};
function useTheme() {
  const isDark = useColorScheme() === "dark";
  return { isDark, t: isDark ? TH.dark : TH.light };
}

const CART_KEY = "bim_supermarche_cart";

export type CartItem = {
  productId: number;
  name: string;
  unitPrice: number;
  qty: number;
  imageUrl: string | null;
};

/* ─── PRODUCT CARD ───────────────────────────────────────────────────── */
function ProductCard({
  item, isDark, t, onPress,
}: {
  item: any; isDark: boolean; t: typeof TH.light; onPress: () => void;
}) {
  const imgUri = item.imageUrl
    ? item.imageUrl.startsWith("http")
      ? item.imageUrl
      : `${API_URL_BASE}${item.imageUrl}`
    : null;

  const price = parseFloat(item.price ?? 0);
  const hasStock = (item.qty ?? 0) > 0;

  return (
    <TouchableOpacity
      style={[pc.card, { backgroundColor: t.card, borderColor: t.border }]}
      onPress={onPress}
      activeOpacity={0.82}
      disabled={!hasStock}
    >
      <View style={pc.imgWrap}>
        {imgUri ? (
          <Image source={{ uri: imgUri }} style={pc.img} resizeMode="cover" />
        ) : (
          <View style={[pc.imgPlaceholder, { backgroundColor: isDark ? "#1E2A3A" : C.f4 }]}>
            <FontAwesome6 name="box-open" size={28} color={C.muted} />
          </View>
        )}
        {!hasStock && (
          <View style={pc.outBadge}>
            <Text style={pc.outText}>Épuisé</Text>
          </View>
        )}
      </View>

      <View style={pc.info}>
        <Text style={[pc.name, { color: t.text }]} numberOfLines={2}>{item.name}</Text>
        <Text style={[pc.desc, { color: t.sub }]} numberOfLines={2}>{item.description}</Text>

        <View style={pc.footer}>
          <Text style={pc.price}>{price.toFixed(2)} EC</Text>
          {hasStock && (
            <View style={[pc.stockChip, { backgroundColor: C.green + "18" }]}>
              <Text style={[pc.stockText, { color: C.green }]}>{item.qty} dispo</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[pc.arrow, { backgroundColor: hasStock ? C.primary + "12" : C.muted + "18" }]}>
        <Ionicons name="add" size={18} color={hasStock ? C.primary : C.muted} />
      </View>
    </TouchableOpacity>
  );
}

/* ─── BOTTOM DRAWER ──────────────────────────────────────────────────── */
function ProductDrawer({
  visible, product, isDark, t, onClose, onAddToCart,
}: {
  visible: boolean; product: any | null;
  isDark: boolean; t: typeof TH.light;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}) {
  const slideY = useRef(new Animated.Value(500)).current;
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (visible) {
      setQty(1);
      Animated.spring(slideY, { toValue: 0, friction: 7, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideY, { toValue: 500, duration: 260, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!product) return null;

  const price = parseFloat(product.price ?? 0);
  const total = (price * qty).toFixed(2);
  const maxQty = product.qty ?? 99;

  const imgUri = product.imageUrl
    ? product.imageUrl.startsWith("http")
      ? product.imageUrl
      : `${API_URL_BASE}${product.imageUrl}`
    : null;

  const handleAdd = () => {
    onAddToCart({
      productId: product.productId,
      name: product.name,
      unitPrice: price,
      qty,
      imageUrl: product.imageUrl,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={dr.overlay} activeOpacity={1} onPress={onClose} />
      <Animated.View
        style={[dr.sheet, { backgroundColor: t.drawer, transform: [{ translateY: slideY }] }]}
      >
        <View style={[dr.handle, { backgroundColor: t.border }]} />

        {/* Header */}
        <LinearGradient
          colors={t.headerGrad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={dr.header}
        >
          <View style={{ flex: 1 }}>
            <Text style={dr.headerTitle} numberOfLines={2}>{product.name}</Text>
            <Text style={dr.headerPrice}>{price.toFixed(2)} EC / unité</Text>
          </View>
          <TouchableOpacity style={dr.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={18} color={C.white} />
          </TouchableOpacity>
        </LinearGradient>

        <View style={dr.body}>
          {/* Image */}
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={dr.img} resizeMode="contain" />
          ) : (
            <View style={[dr.imgPlaceholder, { backgroundColor: isDark ? "#1E2A3A" : C.f4 }]}>
              <FontAwesome6 name="box-open" size={40} color={C.muted} />
            </View>
          )}

          {/* Description */}
          {product.description ? (
            <Text style={[dr.desc, { color: t.sub }]}>{product.description}</Text>
          ) : null}

          {/* Qty selector */}
          <View style={[dr.qtyRow, { backgroundColor: isDark ? "#1A2235" : C.f4, borderColor: t.border }]}>
            <TouchableOpacity
              style={[dr.qtyBtn, qty <= 1 && dr.qtyBtnDisabled]}
              onPress={() => setQty(q => Math.max(1, q - 1))}
              disabled={qty <= 1}
            >
              <Ionicons name="remove" size={20} color={qty <= 1 ? C.muted : C.primary} />
            </TouchableOpacity>

            <View style={dr.qtyVal}>
              <Text style={[dr.qtyNum, { color: t.text }]}>{qty}</Text>
            </View>

            <TouchableOpacity
              style={[dr.qtyBtn, qty >= maxQty && dr.qtyBtnDisabled]}
              onPress={() => setQty(q => Math.min(maxQty, q + 1))}
              disabled={qty >= maxQty}
            >
              <Ionicons name="add" size={20} color={qty >= maxQty ? C.muted : C.primary} />
            </TouchableOpacity>
          </View>

          {/* Total line */}
          <View style={dr.totalRow}>
            <Text style={[dr.totalLabel, { color: t.sub }]}>Total</Text>
            <Text style={dr.totalVal}>{total} EC</Text>
          </View>

          {/* CTA */}
          <TouchableOpacity style={dr.addBtn} onPress={handleAdd} activeOpacity={0.85}>
            <LinearGradient
              colors={[C.deep, C.primary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={dr.addGrad}
            >
              <Ionicons name="cart-outline" size={18} color={C.white} />
              <Text style={dr.addText}>Ajouter au panier</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function SupermarcheDetail() {
  const { id }         = useLocalSearchParams<{ id: string }>();
  const router         = useRouter();
  const { isDark, t }  = useTheme();
  const insets         = useSafeAreaInsets();

  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState<any>(null);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [cart, setCart]               = useState<CartItem[]>([]);
  const [refreshing, setRefreshing]   = useState(false);
  const cartScale                      = useRef(new Animated.Value(1)).current;

  const { data, isLoading, refetch } = useGetAllProductsQuery({
    companyId: id,
    paginate: false,
  }, { skip: !id });

  /* Charger le panier depuis AsyncStorage */
  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then(raw => {
      if (raw) setCart(JSON.parse(raw));
    });
  }, []);

  /* Sauvegarder le panier */
  const saveCart = useCallback(async (items: CartItem[]) => {
    setCart(items);
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
  }, []);

  const handleAddToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.productId === item.productId);
      let next: CartItem[];
      if (idx >= 0) {
        next = prev.map((c, i) => i === idx ? { ...c, qty: c.qty + item.qty } : c);
      } else {
        next = [...prev, item];
      }
      AsyncStorage.setItem(CART_KEY, JSON.stringify(next));
      return next;
    });

    Animated.sequence([
      Animated.spring(cartScale, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(cartScale, { toValue: 1,   useNativeDriver: true }),
    ]).start();
  }, [cartScale]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const products: any[] = data?.data || data || [];
  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const company = products[0]?.company ?? null;
  const companyName = company?.name ?? "Supermarché";
  const companyLogo = company?.logo ?? null;

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
            <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={C.white} />
            </TouchableOpacity>

            <View style={s.titleWrap}>
              <View style={s.titleBadge}>
                <FontAwesome6 name="store" size={12} color={C.gold} />
              </View>
              <Text style={s.headerTitle} numberOfLines={1}>BIM SUPERMARCHÉ</Text>
            </View>

            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => router.push({ pathname: "/bim-supermarche/cart", params: { companyId: id, companyName } })}
            >
              <Animated.View style={{ transform: [{ scale: cartScale }] }}>
                <Ionicons name="cart-outline" size={20} color={C.white} />
                {cartCount > 0 && (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{cartCount > 99 ? "99+" : cartCount}</Text>
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>

          <Text style={s.headerSub}>{companyName} · {filtered.length} produit{filtered.length !== 1 ? "s" : ""}</Text>

          <View style={[s.searchWrap, {
            backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.92)",
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent",
            shadowColor: "#000",
          }]}>
            <View style={[s.searchIconWrap, { backgroundColor: "rgba(3,83,204,0.12)" }]}>
              <Ionicons name="search-outline" size={14} color={C.primary} />
            </View>
            <TextInput
              style={[s.searchInput, { color: t.text }]}
              placeholder="Rechercher un produit…"
              placeholderTextColor={t.sub}
              value={search}
              onChangeText={setSearch}
              blurOnSubmit={false}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color={t.sub} />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </View>

      {/* ── Product list ── */}
      {isLoading ? (
        <View style={s.center}>
          <LinearGradient colors={[C.deep, C.primary]} style={StyleSheet.absoluteFill} />
        </View>
      ) : filtered.length === 0 ? (
        <NoData />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.productId)}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              isDark={isDark}
              t={t}
              onPress={() => { setSelected(item); setDrawerOpen(true); }}
            />
          )}
          contentContainerStyle={{ padding: 14, paddingBottom: cartCount > 0 ? 90 : 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        />
      )}

      {/* ── Floating cart bar ── */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={[s.floatingCart, { bottom: Math.max(insets.bottom, 12) + 8 }]}
          onPress={() => router.push({ pathname: "/bim-supermarche/cart", params: { companyId: id, companyName } })}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[C.deep, C.primary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.floatingGrad}
          >
            <View style={s.floatingLeft}>
              <View style={s.floatingBadge}>
                <Text style={s.floatingBadgeText}>{cartCount}</Text>
              </View>
              <Text style={s.floatingText}>Voir le panier</Text>
            </View>
            <Text style={s.floatingTotal}>
              {cart.reduce((s, i) => s + i.unitPrice * i.qty, 0).toFixed(2)} EC
            </Text>
            <Ionicons name="arrow-forward" size={18} color={C.white} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* ── Product drawer ── */}
      <ProductDrawer
        visible={drawerOpen}
        product={selected}
        isDark={isDark}
        t={t}
        onClose={() => setDrawerOpen(false)}
        onAddToCart={handleAddToCart}
      />
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    overflow: "hidden",
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    paddingBottom: 20,
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
  headerTitle: { color: C.white, fontSize: 15, fontFamily: "NexaLight", letterSpacing: 2 },
  headerSub:   { color: "rgba(255,255,255,0.6)", fontFamily: "NexaLight", fontSize: 12, paddingHorizontal: 20, marginTop: 6, marginBottom: 14 },

  badge: {
    position: "absolute", top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: C.gold, justifyContent: "center", alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: C.text, fontSize: 10, fontWeight: "700" },

  searchWrap: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, marginHorizontal: 16,
    paddingHorizontal: 10, paddingVertical: 9,
    gap: 10, borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  searchIconWrap: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  searchInput: { flex: 1, fontFamily: "NexaLight", fontSize: 13 },

  floatingCart: {
    position: "absolute", left: 16, right: 16,
    borderRadius: 20, overflow: "hidden", elevation: 8,
    shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  floatingGrad: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 18, gap: 12,
  },
  floatingLeft:      { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  floatingBadge:     { backgroundColor: C.gold, borderRadius: 12, minWidth: 24, height: 24, justifyContent: "center", alignItems: "center", paddingHorizontal: 6 },
  floatingBadgeText: { color: C.text, fontSize: 12, fontWeight: "700" },
  floatingText:      { color: C.white, fontFamily: "NexaLight", fontSize: 14, fontWeight: "700" },
  floatingTotal:     { color: C.white, fontFamily: "NexaLight", fontSize: 14, fontWeight: "700", marginRight: 6 },
});

const pc = StyleSheet.create({
  card: {
    flexDirection: "row", borderRadius: 18, marginBottom: 12,
    borderWidth: 1, overflow: "hidden",
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  imgWrap: { width: 100, height: 100, position: "relative" },
  img:     { width: "100%", height: "100%" },
  imgPlaceholder: {
    width: "100%", height: "100%",
    justifyContent: "center", alignItems: "center",
  },
  outBadge: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.55)", paddingVertical: 3,
    alignItems: "center",
  },
  outText: { color: C.white, fontSize: 10, fontWeight: "700" },

  info:  { flex: 1, padding: 10, justifyContent: "space-between" },
  name:  { fontFamily: "NexaLight", fontSize: 13, fontWeight: "700", marginBottom: 4 },
  desc:  { fontFamily: "NexaLight", fontSize: 11, lineHeight: 15 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  price: { fontFamily: "NexaLight", fontSize: 14, fontWeight: "700", color: C.primary },
  stockChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  stockText: { fontSize: 10, fontWeight: "700" },

  arrow: {
    width: 36, justifyContent: "center", alignItems: "center",
    alignSelf: "stretch",
  },
});

const dr = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: "center", marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 18, paddingVertical: 16, gap: 10,
  },
  headerTitle: { color: C.white, fontFamily: "NexaLight", fontSize: 16, fontWeight: "700", lineHeight: 22 },
  headerPrice: { color: "rgba(255,255,255,0.7)", fontFamily: "NexaLight", fontSize: 13, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },

  body: { padding: 18 },
  img:  { width: "100%", height: 180, borderRadius: 16, marginBottom: 14 },
  imgPlaceholder: {
    width: "100%", height: 140, borderRadius: 16,
    justifyContent: "center", alignItems: "center", marginBottom: 14,
  },
  desc: { fontFamily: "NexaLight", fontSize: 13, lineHeight: 19, marginBottom: 18 },

  qtyRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 18, borderWidth: 1,
    marginBottom: 14, overflow: "hidden",
  },
  qtyBtn: {
    width: 52, height: 52,
    justifyContent: "center", alignItems: "center",
  },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyVal: { flex: 1, justifyContent: "center", alignItems: "center" },
  qtyNum: { fontFamily: "NexaLight", fontSize: 22, fontWeight: "700" },

  totalRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 18,
  },
  totalLabel: { fontFamily: "NexaLight", fontSize: 13 },
  totalVal:   { fontFamily: "NexaLight", fontSize: 20, fontWeight: "700", color: C.primary },

  addBtn: { borderRadius: 18, overflow: "hidden" },
  addGrad: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16,
  },
  addText: { color: C.white, fontFamily: "NexaLight", fontSize: 15, fontWeight: "700" },
});
