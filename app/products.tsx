/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetAllProductsQuery } from "@/services/productServices";
import { API_URL_BASE } from "@/constants/api";
import NoData from "@/components/ui/noData";
import { useAppTheme } from "@/app/_layout";

/* ─── PALETTE ─────────────────────────────────────────────────────────── */
const LIGHT = {
  primary: "#0035C5", blue: "#0047FF",
  white:   "#FFFFFF", bg: "#F9F9F9", surface: "#F3F3F4",
  surfLow: "#EEEEEE", text: "#1A1C1C", textMut: "#747688",
  border: "rgba(196,197,218,0.30)", green: "#10B981", card: "#FFFFFF",
};
const DARK: typeof LIGHT = {
  primary: "#4D8DFF", blue: "#4D8DFF",
  white:   "#FFFFFF", bg: "#0B1220", surface: "#1A2540",
  surfLow: "#0F1A2E", text: "#EAF0FF", textMut: "#6B7A99",
  border: "rgba(31,42,68,0.80)", green: "#10B981", card: "#1A2540",
};

const FALLBACK_IMG = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80";

function getImgUri(item: any): string {
  if (item.imageUrl) {
    return item.imageUrl.startsWith("http") ? item.imageUrl : `${API_URL_BASE}${item.imageUrl}`;
  }
  return FALLBACK_IMG;
}

function effectivePrice(product: any): number {
  const base = parseFloat(product.price ?? 0);
  const pct  = parseFloat(product.reduction ?? 0);
  if (pct > 0 && pct <= 100) return +(base * (1 - pct / 100)).toFixed(2);
  return base;
}

function hasDiscount(product: any): boolean {
  const pct = parseFloat(product.reduction ?? 0);
  return pct > 0 && pct <= 100;
}

/* ─── PRODUCT ROW (même disposition que l'accueil) ───────────────────── */
function ProductCard({ item, onPress }: { item: any; onPress: () => void }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const c = useMemo(() => mkC(C), [isDark]);
  const imgUri   = getImgUri(item);
  const price    = effectivePrice(item);
  const discount = hasDiscount(item);
  const company  = item.company?.name ?? item.categories?.[0]?.name ?? "";

  return (
    <TouchableOpacity style={c.row} activeOpacity={0.9} onPress={onPress}>
      <View style={c.imgWrap}>
        <Image source={{ uri: imgUri }} style={c.img} contentFit="cover" transition={200} />
        {discount && (
          <View style={c.discBadge}>
            <Text style={c.discBadgeText}>-{Math.round(parseFloat(item.reduction))}%</Text>
          </View>
        )}
      </View>
      <View style={c.info}>
        <View>
          {company ? <Text style={c.company} numberOfLines={1}>{company}</Text> : null}
          <Text style={c.name} numberOfLines={1}>{item.name}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <View>
            <Text style={c.priceLabel}>Prix unitaire</Text>
            {item.priceOnRequest ? (
              <Text style={c.price}>Prix à discuter</Text>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                {discount && (
                  <Text style={c.origPrice}>{parseFloat(item.price ?? 0).toFixed(2)}</Text>
                )}
                <Text style={c.price}>{price.toFixed(2)} <Text style={c.priceEC}>EC</Text></Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={c.orderBtn} onPress={onPress} activeOpacity={0.85}>
            <Text style={c.orderBtnText}>Commander</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ─── MAIN SCREEN ──────────────────────────────────────────────────────── */
export default function ProductsScreen() {
  const router   = useRouter();
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const { data, isFetching } = useGetAllProductsQuery({
    paginate: "true", page, pageSize: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  useEffect(() => {
    if (!data) return;
    const rows = data.data ?? [];
    setItems(prev => (page === 1 ? rows : [...prev, ...rows]));
  }, [data]);

  const hasMore = (data?.currentPage ?? 1) < (data?.totalPages ?? 1);
  const loadMore = () => { if (hasMore && !isFetching) setPage(p => p + 1); };

  const openProduct = (item: any) => {
    router.push({ pathname: "/product/[productId]", params: { productId: String(item.productId) } } as any);
  };

  return (
    <>
      {/* Hide expo-router default header */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.surface} />

        {/* ── HEADER ── */}
        <SafeAreaView edges={["top"]} style={s.headerWrap}>
          <View style={s.topBar}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={C.text} />
            </TouchableOpacity>
            <View style={s.titleBlock}>
              <Text style={s.title}>Tous nos produits</Text>
              <Text style={s.subtitle}>
                {data?.total != null ? `${data.total} produit${data.total !== 1 ? "s" : ""}` : "Chargement…"}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Search bar */}
          <View style={s.searchWrap}>
            <Ionicons name="search-outline" size={16} color={C.textMut} />
            <TextInput
              style={s.searchInput}
              placeholder="Rechercher un produit, une enseigne…"
              placeholderTextColor={C.textMut}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color={C.textMut} />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>

        {/* ── CONTENT ── */}
        {isFetching && items.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={{ fontFamily: "NexaLight", color: C.textMut, marginTop: 12, fontSize: 13 }}>
              Chargement des produits…
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item, i) => `${item.productId ?? item.id ?? i}`}
            contentContainerStyle={s.list}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 60 }}>
                <NoData />
                <Text style={{ fontFamily: "NexaBold", color: C.text, marginTop: 12, fontSize: 15 }}>
                  Aucun produit trouvé
                </Text>
                <Text style={{ fontFamily: "NexaLight", color: C.textMut, marginTop: 4, fontSize: 13, textAlign: "center", paddingHorizontal: 32 }}>
                  Essayez une autre recherche.
                </Text>
              </View>
            }
            ListFooterComponent={
              isFetching && items.length > 0 ? (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={C.primary} />
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <ProductCard item={item} onPress={() => openProduct(item)} />
            )}
          />
        )}
      </View>
    </>
  );
}

/* ─── STYLES ───────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  headerWrap:  { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  topBar:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, gap: 12 },
  backBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  titleBlock:  { flex: 1 },
  title:       { fontFamily: "NexaBold", fontSize: 19, color: C.text },
  subtitle:    { fontFamily: "NexaLight", fontSize: 12, color: C.textMut, marginTop: 2 },
  searchWrap:  { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 12, backgroundColor: C.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11, gap: 8 },
  searchInput: { flex: 1, fontFamily: "NexaLight", fontSize: 14, color: C.text },
  list:        { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 16 },
}); }

function mkC(C: typeof LIGHT) { return StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 20, padding: 14,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 20, shadowOffset: { width: 0, height: 6 },
  },
  imgWrap: {
    width: 88, height: 88, borderRadius: 16, flexShrink: 0,
    backgroundColor: C.surfLow, alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  img: { width: "100%", height: "100%" },
  info: { flex: 1, minWidth: 0, justifyContent: "space-between", gap: 10, height: 88, paddingVertical: 1 },
  name:    { fontFamily: "NexaBold", fontSize: 15, color: C.text, marginTop: 2 },
  company: { fontFamily: "NexaBold", fontSize: 10, color: C.primary, letterSpacing: 0.6, textTransform: "uppercase" },
  priceLabel: { fontFamily: "NexaLight", fontSize: 10, color: C.textMut },
  origPrice:  { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, textDecorationLine: "line-through" },
  price:      { fontFamily: "NexaBold", fontSize: 14, color: C.text, marginTop: 1 },
  priceEC:    { fontFamily: "NexaBold", fontSize: 11, color: C.primary },
  orderBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: C.primary, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  orderBtnText: { fontFamily: "NexaBold", fontSize: 12, color: "#fff" },
  discBadge:    { position: "absolute", top: 4, left: 4, backgroundColor: C.green, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, zIndex: 1 },
  discBadgeText:{ fontFamily: "NexaBold", fontSize: 9, color: C.white },
}); }
