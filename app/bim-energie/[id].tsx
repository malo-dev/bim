import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState, useEffect, useCallback, memo } from "react";
import { Image } from "expo-image";
import {
  Animated,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect, Circle, Path } from "react-native-svg";
import { useGetAllProductsQuery } from "@/services/productServices";
import NoData from "@/components/ui/noData";
import { API_URL_BASE } from "@/constants/api";

/* ─── THEME ──────────────────────────────────────────────────────────── */
const C = {
  primary: "#0353CC",
  violet:  "#3906C7",
  deep:    "#302E99",
  accent:  "#4D96FF",
  gold:    "#FFD700",
  white:   "#FFFFFF",
  text:    "#0D1B3E",
  muted:   "#7B8DB0",
  border:  "rgba(3,83,204,0.10)",
  inputBg: "rgba(3,83,204,0.06)",
};

const Colors = {
  light: {
    background:    "#F0F4FF",
    card:          "#FFFFFF",
    text:          "#0D1B3E",
    textSecondary: "#7B8DB0",
    border:        "rgba(3,83,204,0.10)",
    inputBg:       "#FFFFFF",
    divider:       "rgba(3,83,204,0.08)",
    headerGrad:    [C.deep, C.primary] as [string, string],
    shadow:        C.primary,
  },
  dark: {
    background:    "#0A0F1E",
    card:          "#111827",
    text:          "#E2E8F0",
    textSecondary: "#64748B",
    border:        "rgba(255,255,255,0.08)",
    inputBg:       "#111827",
    divider:       "rgba(255,255,255,0.07)",
    headerGrad:    ["#060B18", "#0D1B3E"] as [string, string],
    shadow:        "#000",
  },
};

function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

/* ─── SVG STABLES ────────────────────────────────────────────────────── */
const EnergyBadge = memo(() => (
  <Svg width={44} height={44} viewBox="0 0 48 48">
    <Defs>
      <SvgGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={C.deep} />
        <Stop offset="1" stopColor={C.violet} />
      </SvgGradient>
    </Defs>
    <Rect x={0} y={0} width={48} height={48} rx={14} fill="url(#bg2)" />
    <Path d="M27 6L14 26h12l-3 16 17-20H28z" fill={C.gold} opacity={0.95} />
  </Svg>
));
EnergyBadge.displayName = "EnergyBadge";

const CoinIcon = memo(() => (
  <Svg width={18} height={18} viewBox="0 0 20 20">
    <Circle cx={10} cy={10} r={10} fill={C.primary} opacity={0.1} />
    <Path
      d="M10 4.5v1M10 14.5V16M7.5 7.5C7.5 6.12 8.62 5 10 5s2.5 1.12 2.5 2.5c0 2-2.5 2.5-2.5 4.5M7.5 12.5C7.5 13.88 8.62 15 10 15s2.5-1.12 2.5-2.5"
      stroke={C.primary} strokeWidth={1.3} strokeLinecap="round" fill="none"
    />
  </Svg>
));
CoinIcon.displayName = "CoinIcon";

const ArrowSvg = memo(() => (
  <Svg width={15} height={15} viewBox="0 0 18 18">
    <Path
      d="M3 9h12M11 5l4 4-4 4"
      stroke={C.white} strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" fill="none"
    />
  </Svg>
));
ArrowSvg.displayName = "ArrowSvg";

/* ─── PRODUCT CARD ───────────────────────────────────────────────────── */
type ProductCardProps = { item: any; onPress: () => void; isDark: boolean };

function ProductCardBase({ item, onPress, isDark }: ProductCardProps) {
  const t         = isDark ? Colors.dark : Colors.light;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const slideY    = useRef(new Animated.Value(20)).current;
  const opac      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.timing(opac,   { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const pressIn  = () => Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true }).start();

  const imageUri = item.imageUrl ? `${API_URL_BASE}${item.imageUrl}` : null;

  return (
    <Animated.View style={[
      cs.wrapper,
      {
        backgroundColor: t.card,
        borderColor: t.border,
        shadowColor: t.shadow,
        opacity: opac,
        transform: [{ translateY: slideY }, { scale: pressAnim }],
      },
    ]}>
      <TouchableOpacity activeOpacity={1} onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>

        {/* ── IMAGE ── */}
        <View style={cs.imageWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={cs.image} contentFit="cover" transition={300} />
          ) : (
            <LinearGradient
              colors={isDark ? ["#1E2A3A", "#111827"] : ["#DDE4F5", "#EEF2FF"]}
              style={cs.imageFallback}
            >
              <Svg width={64} height={64} viewBox="0 0 48 48">
                <Path d="M27 6L14 26h12l-3 16 17-20H28z" fill={C.primary} opacity={isDark ? 0.15 : 0.2} />
              </Svg>
            </LinearGradient>
          )}

          {imageUri && (
            <LinearGradient
              colors={["transparent", isDark ? "rgba(0,0,0,0.75)" : "rgba(13,27,62,0.55)"]}
              style={cs.imageOverlay}
            />
          )}

          <View style={cs.badgePos}>
            <EnergyBadge />
          </View>

          <View style={[cs.tagPos, { backgroundColor: isDark ? "rgba(17,24,39,0.9)" : "rgba(255,255,255,0.92)" }]}>
            <Text style={[cs.tagText, { color: t.text }]}>⚡ Énergie</Text>
          </View>

          {/* Prix flottant sur image */}
          <View style={[cs.priceOverlay, {
            backgroundColor: imageUri
              ? "rgba(255,255,255,0.15)"
              : (isDark ? "rgba(3,83,204,0.22)" : "rgba(3,83,204,0.10)"),
            borderColor: imageUri
              ? "transparent"
              : (isDark ? "rgba(77,150,255,0.22)" : "rgba(3,83,204,0.15)"),
          }]}>
            <CoinIcon />
            <Text style={[cs.priceOverlayText, {
              color: imageUri ? C.white : (isDark ? "#93C5FD" : C.primary),
            }]}>
              {item.price}{" "}
              <Text style={[cs.priceOverlayCurrency, {
                color: imageUri ? "rgba(255,255,255,0.7)" : (isDark ? "rgba(147,197,253,0.65)" : "rgba(3,83,204,0.60)"),
              }]}>{item.currency?.code || "EC"}</Text>
            </Text>
          </View>
        </View>

        {/* ── CONTENU ── */}
        <View style={cs.content}>
          <Text style={[cs.name, { color: t.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[cs.desc, { color: t.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={[cs.divider, { backgroundColor: t.divider }]} />

          <View style={cs.footer}>
            {/* Meta chips */}
            <View style={cs.metaRow}>
              <View style={[cs.metaChip, { backgroundColor: isDark ? "rgba(3,83,204,0.2)" : "rgba(3,83,204,0.08)" }]}>
                <Ionicons name="flash-outline" size={11} color={C.primary} />
                <Text style={[cs.metaText, { color: C.primary }]}>Énergie</Text>
              </View>
              {item.currency?.code && (
                <View style={[cs.metaChip, { backgroundColor: isDark ? "rgba(255,215,0,0.12)" : "rgba(255,215,0,0.15)" }]}>
                  <Ionicons name="cash-outline" size={11} color={C.gold} />
                  <Text style={[cs.metaText, { color: C.gold }]}>{item.currency.code}</Text>
                </View>
              )}
              {!imageUri && (
                <View style={[cs.metaChip, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(3,83,204,0.05)" }]}>
                  <Ionicons name="image-outline" size={11} color={t.textSecondary} />
                  <Text style={[cs.metaText, { color: t.textSecondary }]}>Sans image</Text>
                </View>
              )}
            </View>

            {/* CTA */}
            <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
              <LinearGradient
                colors={[C.deep, C.violet]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={cs.btn}
              >
                <Text style={cs.btnText}>Payer</Text>
                <ArrowSvg />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const ProductCard = memo(ProductCardBase);
ProductCard.displayName = "ProductCard";

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function EnergyProductsPayList() {
  const router        = useRouter();
  const { id }        = useLocalSearchParams();
  const { isDark, t } = useTheme();

  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState("");
  const [dataList,   setDataList]   = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isFetching, refetch } = useGetAllProductsQuery({
    page, pageSize: 10, search, paginate: true, companyId: id,
  });

  useEffect(() => {
    if (data?.data) {
      if (page === 1) setDataList(data.data);
      else setDataList((prev) => [...prev, ...data.data]);
    }
  }, [data, page]);

  const loadMore = useCallback(() => {
    if (data?.totalPages && page < data.totalPages && !isFetching) setPage(p => p + 1);
  }, [data, page, isFetching]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); setPage(1); await refetch(); setRefreshing(false);
  }, [refetch]);

  const handleSearchChange = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const handleSearchClear  = useCallback(() => { setSearch(""); setPage(1); }, []);

  return (
    <View style={[s.root, { backgroundColor: t.background }]}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER PLEINE LARGEUR ── */}
      <View style={[s.header, { shadowColor: isDark ? "#000" : C.primary }]}>
        <LinearGradient
          colors={t.headerGrad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.deco1} />
        <View style={s.deco2} />
        <View style={s.deco3} />

        <SafeAreaView edges={["top"]}>
          <View style={s.topBar}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={C.white} />
            </TouchableOpacity>

            <View style={s.titleWrap}>
              <View style={s.titleBadge}>
                <Svg width={13} height={13} viewBox="0 0 48 48">
                  <Path d="M27 6L14 26h12l-3 16 17-20H28z" fill={C.gold} />
                </Svg>
              </View>
              <Text style={s.headerTitle}>BIM ÉNERGIE</Text>
            </View>

            <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/notification")}>
              <Ionicons name="notifications-outline" size={20} color={C.white} />
            </TouchableOpacity>
          </View>

          <Text style={s.headerSub}>Sélectionnez et payez votre offre</Text>

          {/* Search */}
          <View style={[s.searchWrap, {
            backgroundColor: t.inputBg,
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent",
            shadowColor: isDark ? "#000" : "#000",
          }]}>
            <View style={[s.searchIconWrap, { backgroundColor: isDark ? "rgba(3,83,204,0.25)" : C.inputBg }]}>
              <Ionicons name="search-outline" size={14} color={C.primary} />
            </View>
            <TextInput
              style={[s.searchInput, { color: t.text }]}
              placeholder="Rechercher un produit…"
              placeholderTextColor={t.textSecondary}
              value={search}
              onChangeText={handleSearchChange}
              blurOnSubmit={false}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={handleSearchClear}>
                <Ionicons name="close-circle" size={16} color={t.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </View>

      {/* ── LISTE ── */}
      {dataList.length === 0 && !isFetching ? (
        <View style={s.noData}>
          <NoData />
        </View>
      ) : (
        <FlatList
          data={dataList}
          keyExtractor={(item) => `${item.productId}`}
          contentContainerStyle={[s.list, { backgroundColor: t.background }]}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.violet}
              colors={[C.violet]}
            />
          }
          ListHeaderComponent={
            <View style={s.countRow}>
              <View style={[s.countDot, { backgroundColor: C.accent }]} />
              <Text style={[s.countText, { color: t.textSecondary }]}>
                {dataList.length} produit{dataList.length !== 1 ? "s" : ""}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              isDark={isDark}
              onPress={() => router.push(`/payment?productId=${item.productId}&companyId=${id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1 },

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
  deco3: { position: "absolute", width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,215,0,0.07)", bottom: 30, right: 80 },

  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  titleWrap:  { flexDirection: "row", alignItems: "center", gap: 8 },
  titleBadge: { width: 26, height: 26, borderRadius: 8, backgroundColor: "rgba(255,215,0,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: C.white, fontSize: 15, fontFamily: "NexaLight", letterSpacing: 2 },
  headerSub: { color: "rgba(255,255,255,0.6)", fontFamily: "NexaLight", fontSize: 12, paddingHorizontal: 20, marginTop: 6, marginBottom: 14 },

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

  countRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4, paddingTop: 16, paddingBottom: 8 },
  countDot: { width: 4, height: 16, borderRadius: 2 },
  countText: { fontFamily: "NexaLight", fontSize: 12 },

  list:   { padding: 16, paddingTop: 4, paddingBottom: 60 },
  noData: { flex: 1, justifyContent: "center", alignItems: "center" },
});

/* ─── CARD STYLES ────────────────────────────────────────────────────── */
const cs = StyleSheet.create({
  wrapper: {
    borderRadius: 22, marginBottom: 18,
    overflow: "hidden", borderWidth: 1,
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 12,
  },
  imageWrap:     { width: "100%", height: 200, position: "relative" },
  image:         { width: "100%", height: "100%" },
  imageFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  imageOverlay:  { ...StyleSheet.absoluteFillObject, top: "40%" },

  badgePos: { position: "absolute", top: 12, left: 12, elevation: 4, shadowColor: C.deep, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6 },
  tagPos:   { position: "absolute", top: 14, right: 12, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagText:  { fontFamily: "NexaLight", fontSize: 11, letterSpacing: 0.3 },

  priceOverlay: { position: "absolute", bottom: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  priceOverlayText:     { fontFamily: "NexaLight", fontSize: 15 },
  priceOverlayCurrency: { fontSize: 11 },

  content: { padding: 16 },
  name:    { fontFamily: "NexaLight", fontSize: 16, letterSpacing: 0.2, marginBottom: 5 },
  desc:    { fontFamily: "NexaLight", fontSize: 12, lineHeight: 18, marginBottom: 12 },
  divider: { height: 1, marginBottom: 12 },

  footer:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metaRow:  { flexDirection: "row", gap: 8 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  metaText: { fontFamily: "NexaLight", fontSize: 11 },

  btn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, elevation: 4, shadowColor: C.violet, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.28, shadowRadius: 6 },
  btnText: { color: C.white, fontFamily: "NexaLight", fontSize: 13, letterSpacing: 0.3 },
});