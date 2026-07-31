/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  ScrollView,
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
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import NoData from "@/components/ui/noData";
import { useAppTheme } from "@/app/_layout";

/* ─── PALETTE ────────────────────────────────────────────────────────── */
const LIGHT = {
  primary:    "#0035C5",
  blue:       "#0047FF",
  deep:       "#001257",
  white:      "#FFFFFF",
  bg:         "#F9F9F9",
  surface:    "#F3F3F4",
  text:       "#1A1C1C",
  textSec:    "#434657",
  textMut:    "#747688",
  border:     "rgba(196,197,218,0.30)",
  gold:       "#F59E0B",
  error:      "#EF4444",
  navBg:      "rgba(255,255,255,0.96)",
  navBord:    "rgba(196,197,218,0.20)",
  iconBtnBg:  "rgba(0,53,197,0.06)",
  cardBg:     "#FFFFFF",
  tagBg:      "rgba(0,53,197,0.05)",
  tagGoldBg:  "rgba(219,226,250,0.80)",
  tagGoldTxt: "#3F4759",
  footBord:   "rgba(196,197,218,0.15)",
  imgFallA:   "#DDE4F5",
  imgFallB:   "#EEF2FF",
};
const DARK: typeof LIGHT = {
  primary:    "#4D8DFF",
  blue:       "#4D8DFF",
  deep:       "#4D8DFF",
  white:      "#FFFFFF",
  bg:         "#0B1220",
  surface:    "#0F1A2E",
  text:       "#EAF0FF",
  textSec:    "#A3B4D0",
  textMut:    "#6B7A99",
  border:     "rgba(31,42,68,0.80)",
  gold:       "#F59E0B",
  error:      "#EF4444",
  navBg:      "rgba(11,18,32,0.94)",
  navBord:    "rgba(31,42,68,0.80)",
  iconBtnBg:  "rgba(77,141,255,0.08)",
  cardBg:     "#1A2540",
  tagBg:      "rgba(77,141,255,0.08)",
  tagGoldBg:  "rgba(77,141,255,0.12)",
  tagGoldTxt: "#A3B4D0",
  footBord:   "rgba(31,42,68,0.60)",
  imgFallA:   "#0F1A2E",
  imgFallB:   "#1A2540",
};

/* ─── FILTRES ────────────────────────────────────────────────────────── */
const FILTERS = ["Tout", "Santé", "Eco-insure", "Prévoyance"];

/* ─── PRODUCT CARD ───────────────────────────────────────────────────── */
function ProductCardBase({ item, onPress, index }: { item: any; onPress: () => void; index: number }) {
  const { isDark } = useAppTheme();
  const C  = isDark ? DARK : LIGHT;
  const pc = useMemo(() => mkPc(C), [isDark]);

  const slideY = useRef(new Animated.Value(28)).current;
  const opac   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 380, delay: Math.min(index * 80, 400), useNativeDriver: true }),
      Animated.timing(opac,   { toValue: 1, duration: 380, delay: Math.min(index * 80, 400), useNativeDriver: true }),
    ]).start();
  }, []);

  const imageUri = item.imageUrl ? `${API_URL_BASE}${item.imageUrl}` : null;
  const price    = Number(item.price ?? 0).toFixed(2);
  const currency = item.currency?.code ?? "EC";

  return (
    <Animated.View style={[pc.card, { opacity: opac, transform: [{ translateY: slideY }] }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.92}>

        {/* ── IMAGE ── */}
        <View style={pc.imageWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={pc.image} contentFit="cover" transition={300} />
          ) : (
            <LinearGradient colors={[C.imgFallA, C.imgFallB]} style={pc.image}>
              <Ionicons name="medical-outline" size={56} color={C.primary + "40"} />
            </LinearGradient>
          )}

          <LinearGradient
            colors={["transparent", "rgba(0,18,87,0.45)"]}
            start={{ x: 0, y: 0.3 }} end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={pc.badgeIcon}>
            <Ionicons name="add-circle" size={28} color={C.white} />
          </View>

          <View style={pc.badgeCat}>
            <Ionicons name="medical-outline" size={15} color={C.primary} />
            <Text style={pc.badgeCatText}>Santé</Text>
          </View>

          <View style={pc.priceWrap}>
            <Text style={pc.priceValue}>{price}</Text>
            <Text style={pc.priceCur}>{currency}</Text>
          </View>
        </View>

        {/* ── CONTENU ── */}
        <View style={pc.content}>
          <Text style={pc.name} numberOfLines={1}>{item.name}</Text>
          <Text style={pc.desc} numberOfLines={3}>{item.description}</Text>

          <View style={pc.footer}>
            <View style={pc.tags}>
              <View style={pc.tag}>
                <Ionicons name="star-outline" size={11} color={C.primary} />
                <Text style={pc.tagText}>SANTÉ</Text>
              </View>
              <View style={[pc.tag, pc.tagGold]}>
                <Ionicons name="card-outline" size={11} color={C.tagGoldTxt} />
                <Text style={[pc.tagText, pc.tagTextGold]}>{currency}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={pc.btnWrap}>
              <LinearGradient
                colors={[C.blue, C.deep]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={pc.btn}
              >
                <Text style={pc.btnText}>Voir</Text>
                <Ionicons name="arrow-forward" size={16} color={C.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

      </TouchableOpacity>
    </Animated.View>
  );
}
const ProductCard = memo(ProductCardBase);

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function SanteProducts() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);

  const router     = useRouter();
  const { id }     = useLocalSearchParams<{ id: string }>();
  const { unread } = useUnreadNotifications();

  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("Tout");
  const [dataList,   setDataList]   = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isFetching, refetch } = useGetAllProductsQuery({
    page, pageSize: 10, search, paginate: true, companyId: id,
  });

  useEffect(() => {
    if (data?.data) {
      if (page === 1) setDataList(data.data);
      else setDataList(prev => [...prev, ...data.data]);
    }
  }, [data, page]);

  const loadMore = useCallback(() => {
    if (data?.totalPages && page < data.totalPages && !isFetching) setPage(p => p + 1);
  }, [data, page, isFetching]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); setPage(1); await refetch(); setRefreshing(false);
  }, [refetch]);

  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);

  const ListHeader = () => (
    <View>
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={C.textMut} />
          <TextInput
            style={s.searchInput}
            placeholder="Rechercher un produit Santé..."
            placeholderTextColor={C.textMut}
            value={search}
            onChangeText={handleSearch}
            autoCorrect={false}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={16} color={C.textMut} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.chip, filter === f && s.chipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[s.chipText, filter === f && s.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={s.countRow}>
        <View style={s.countBar} />
        <Text style={s.countText}>{dataList.length} PRODUIT{dataList.length !== 1 ? "S" : ""} DISPONIBLE{dataList.length !== 1 ? "S" : ""}</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ── TOP BAR ── */}
      <SafeAreaView edges={["top"]} style={s.safeBar}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.primary} />
          </TouchableOpacity>
          <Text style={s.topTitle}>BIM Santé</Text>
          <TouchableOpacity style={s.iconBtnRel} onPress={() => router.push("/notification" as any)}>
            <Ionicons name="notifications-outline" size={22} color={C.textSec} />
            {unread > 0 && (
              <View style={s.badge}><Text style={s.badgeText}>{unread > 99 ? "99+" : unread}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── LISTE ── */}
      {dataList.length === 0 && !isFetching ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <NoData />
        </View>
      ) : (
        <FlatList
          data={dataList}
          keyExtractor={item => `${item.productId}`}
          ListHeaderComponent={<ListHeader />}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />
          }
          ListFooterComponent={isFetching && !refreshing ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator color={C.primary} />
            </View>
          ) : null}
          renderItem={({ item, index }) => (
            <ProductCard
              item={item}
              index={index}
              onPress={() => router.push(`/sante/product/${item.productId}?companyId=${id}` as any)}
            />
          )}
        />
      )}
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  safeBar:    { backgroundColor: C.navBg, borderBottomWidth: 1, borderBottomColor: C.navBord },
  topBar:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: C.iconBtnBg, alignItems: "center", justifyContent: "center" },
  iconBtnRel: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  topTitle:   { fontFamily: "NexaBold", fontSize: 20, color: C.primary, letterSpacing: -0.3 },
  badge:      { position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.error, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText:  { fontFamily: "NexaBold", fontSize: 9, color: C.white },

  searchWrap:    { paddingHorizontal: 20, paddingTop: 16 },
  searchBox:     { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface, borderRadius: 18, paddingHorizontal: 14, height: 50, borderWidth: 1, borderColor: C.border },
  searchInput:   { flex: 1, fontFamily: "NexaLight", fontSize: 14, color: C.text },

  chips:         { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4, gap: 10 },
  chip:          { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 99, backgroundColor: C.surface },
  chipActive:    { backgroundColor: C.blue, shadowColor: C.blue, shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  chipText:      { fontFamily: "NexaBold", fontSize: 12, color: C.textSec },
  chipTextActive:{ color: C.white },

  countRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 },
  countBar: { width: 4, height: 18, borderRadius: 2, backgroundColor: C.blue },
  countText:{ fontFamily: "NexaBold", fontSize: 11, color: C.textMut, letterSpacing: 0.8 },

  list: { paddingHorizontal: 20, paddingBottom: 80 },
}); }

function mkPc(C: typeof LIGHT) { return StyleSheet.create({
  card:      { backgroundColor: C.cardBg, borderRadius: 24, marginBottom: 20, overflow: "hidden", elevation: 4, shadowColor: "rgba(0,71,255,0.06)", shadowOpacity: 1, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  imageWrap: { height: 240, position: "relative", alignItems: "center", justifyContent: "center" },
  image:     { width: "100%", height: "100%" },

  badgeIcon:    { position: "absolute", top: 14, left: 14, width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.30)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.45)" },
  badgeCat:     { position: "absolute", top: 14, right: 14, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.82)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.50)" },
  badgeCatText: { fontFamily: "NexaBold", fontSize: 12, color: "#1A1C1C" },

  priceWrap:  { position: "absolute", bottom: 14, left: 14, flexDirection: "row", alignItems: "baseline", gap: 8, backgroundColor: "rgba(255,255,255,0.82)", borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.28)" },
  priceValue: { fontFamily: "NexaBold", fontSize: 24, color: C.primary },
  priceCur:   { fontFamily: "NexaLight", fontSize: 13, color: "#434657" },

  content: { padding: 24 },
  name:    { fontFamily: "NexaBold", fontSize: 20, color: C.primary, marginBottom: 8 },
  desc:    { fontFamily: "NexaLight", fontSize: 14, color: C.textSec, lineHeight: 21, marginBottom: 20 },

  footer:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.footBord, paddingTop: 18 },
  tags:        { flexDirection: "row", gap: 8, flexWrap: "wrap", flex: 1, marginRight: 12 },
  tag:         { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.tagBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  tagGold:     { backgroundColor: C.tagGoldBg },
  tagText:     { fontFamily: "NexaBold", fontSize: 10, color: C.primary, letterSpacing: 0.5 },
  tagTextGold: { color: C.tagGoldTxt },

  btnWrap: { borderRadius: 18, overflow: "hidden", elevation: 4, shadowColor: C.primary, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  btn:     { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 28, paddingVertical: 13 },
  btnText: { fontFamily: "NexaBold", fontSize: 13, color: C.white },
}); }
