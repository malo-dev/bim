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
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Rect,
  Circle,
  Path,
} from "react-native-svg";
import { useGetAllProductsQuery } from "@/services/productServices";
import NoData from "@/components/ui/noData";

/* ─── THEME ──────────────────────────────────────────────────────────── */
const C = {
  primary: "#0353CC",
  violet:  "#3906C7",
  deep:    "#302E99",
  accent:  "#4D96FF",
  gold:    "#FFD700",
  orange:  "#F97316",
  white:   "#FFFFFF",
  text:    "#0D1B3E",
  muted:   "#7B8DB0",
  green:   "#22C55E",
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
    fallbackGrad:  ["#EEF1FA", "#DDE3F5"] as [string, string],
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
    fallbackGrad:  ["#1E2A3A", "#111827"] as [string, string],
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
const FuelBadge = memo(() => (
  <Svg width={44} height={44} viewBox="0 0 48 48">
    <Defs>
      <SvgGradient id="fuelBg" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={C.deep} />
        <Stop offset="1" stopColor={C.violet} />
      </SvgGradient>
    </Defs>
    <Rect x={0} y={0} width={48} height={48} rx={14} fill="url(#fuelBg)" />
    <Rect x={13} y={14} width={16} height={22} rx={3} fill={C.orange} opacity={0.9} />
    <Rect x={16} y={17} width={10} height={6} rx={1.5} fill={C.white} opacity={0.85} />
    <Path d="M29 18 Q36 18 36 24 Q36 30 32 30" stroke={C.gold} strokeWidth={2.5} strokeLinecap="round" fill="none" />
    <Rect x={29} y={28} width={5} height={3} rx={1.5} fill={C.gold} />
    <Rect x={11} y={34} width={20} height={3} rx={1.5} fill={C.white} opacity={0.5} />
  </Svg>
));
FuelBadge.displayName = "FuelBadge";

const FuelCoinIcon = memo(() => (
  <Svg width={18} height={18} viewBox="0 0 20 20">
    <Circle cx={10} cy={10} r={10} fill={C.orange} opacity={0.12} />
    <Path
      d="M10 4.5v1M10 14.5V16M7.5 7.5C7.5 6.12 8.62 5 10 5s2.5 1.12 2.5 2.5c0 2-2.5 2.5-2.5 4.5M7.5 12.5C7.5 13.88 8.62 15 10 15s2.5-1.12 2.5-2.5"
      stroke={C.orange} strokeWidth={1.3} strokeLinecap="round" fill="none"
    />
  </Svg>
));
FuelCoinIcon.displayName = "FuelCoinIcon";

const ArrowSvg = memo(() => (
  <Svg width={15} height={15} viewBox="0 0 18 18">
    <Path d="M3 9h12M11 5l4 4-4 4" stroke={C.white} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
));
ArrowSvg.displayName = "ArrowSvg";

/* ─── FUEL CARD ──────────────────────────────────────────────────────── */
type FuelCardProps = { item: any; onPress: () => void; isDark: boolean };

function FuelCardBase({ item, onPress, isDark }: FuelCardProps) {
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
          {item.image ? (
            <Image source={{ uri: item.image }} style={cs.image} contentFit="cover" />
          ) : (
            <LinearGradient colors={t.fallbackGrad} style={cs.imageFallback}>
              <Svg width={72} height={72} viewBox="0 0 48 48">
                <Rect x={10} y={10} width={20} height={30} rx={4} fill={C.orange} opacity={isDark ? 0.12 : 0.18} />
                <Rect x={13} y={13} width={14} height={8} rx={2} fill={C.orange} opacity={isDark ? 0.15 : 0.22} />
                <Path d="M30 15 Q38 15 38 22 Q38 29 33 29" stroke={C.orange} strokeWidth={3} strokeLinecap="round" fill="none" opacity={isDark ? 0.2 : 0.3} />
                <Rect x={30} y={27} width={6} height={4} rx={2} fill={C.orange} opacity={isDark ? 0.2 : 0.3} />
              </Svg>
            </LinearGradient>
          )}

          <LinearGradient
            colors={["transparent", isDark ? "rgba(0,0,0,0.75)" : "rgba(13,27,62,0.58)"]}
            style={cs.imageOverlay}
          />

          <View style={cs.badgePos}>
            <FuelBadge />
          </View>

          {/* Tag */}
          <View style={[cs.tagPos, { backgroundColor: isDark ? "rgba(17,24,39,0.9)" : "rgba(255,255,255,0.92)" }]}>
            <Svg width={10} height={10} viewBox="0 0 24 24">
              <Path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z" fill={C.orange} opacity={0.85} />
            </Svg>
            <Text style={[cs.tagText, { color: t.text }]}>Carburant</Text>
          </View>

          {/* Prix flottant sur image */}
          <View style={cs.priceOverlay}>
            <FuelCoinIcon />
            <Text style={cs.priceOverlayText}>
              {item.price}{" "}
              <Text style={cs.priceOverlayCurrency}>{item.currency?.code || "FC"}</Text>
            </Text>
          </View>
        </View>

        {/* ── CONTENU ── */}
        <View style={cs.content}>
          <Text style={[cs.name, { color: t.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[cs.desc, { color: t.textSecondary }]} numberOfLines={2}>{item.description}</Text>

          {/* Disponibilité */}
          <View style={[cs.availRow, { backgroundColor: isDark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.08)", borderColor: isDark ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.2)" }]}>
            <View style={cs.availDot} />
            <Text style={cs.availText}>Disponible maintenant</Text>
          </View>

          <View style={[cs.divider, { backgroundColor: t.divider }]} />

          {/* Footer */}
          <View style={cs.footer}>
            {/* Meta chips */}
            <View style={cs.metaRow}>
              <View style={[cs.metaChip, { backgroundColor: isDark ? "rgba(249,115,22,0.15)" : "rgba(249,115,22,0.10)" }]}>
                <Svg width={11} height={11} viewBox="0 0 24 24">
                  <Path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z" fill={C.orange} />
                </Svg>
                <Text style={[cs.metaText, { color: C.orange }]}>Carburant</Text>
              </View>
              {item.currency?.code && (
                <View style={[cs.metaChip, { backgroundColor: isDark ? "rgba(255,215,0,0.12)" : "rgba(255,215,0,0.15)" }]}>
                  <Ionicons name="cash-outline" size={11} color={C.gold} />
                  <Text style={[cs.metaText, { color: C.gold }]}>{item.currency.code}</Text>
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
                <Text style={cs.btnText}>Voir</Text>
                <ArrowSvg />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const FuelCard = memo(FuelCardBase);
FuelCard.displayName = "FuelCard";

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function FuelProductsList() {
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
        {/* Goutte déco */}
        <View style={[s.decoDrop, { opacity: isDark ? 0.05 : 0.07 }]}>
          <Svg width={40} height={40} viewBox="0 0 24 24">
            <Path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z" fill={C.white} />
          </Svg>
        </View>

        <SafeAreaView edges={["top"]}>
          <View style={s.topBar}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={C.white} />
            </TouchableOpacity>

            <View style={s.titleWrap}>
              <View style={s.titleBadge}>
                <Svg width={14} height={14} viewBox="0 0 24 24">
                  <Path d="M3 22V8l5-5h9l5 5v14M9 22v-6h6v6" stroke={C.orange} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              </View>
              <Text style={s.headerTitle}>BIM CARBURANT</Text>
            </View>

            <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/notification")}>
              <Ionicons name="notifications-outline" size={20} color={C.white} />
            </TouchableOpacity>
          </View>

          <Text style={s.headerSub}>Trouvez votre station la plus proche</Text>

          {/* Search */}
          <View style={[s.searchWrap, {
            backgroundColor: t.inputBg,
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "transparent",
            shadowColor: isDark ? "#000" : "#000",
          }]}>
            <View style={[s.searchIconWrap, { backgroundColor: isDark ? "rgba(249,115,22,0.2)" : "rgba(249,115,22,0.1)" }]}>
              <Ionicons name="search-outline" size={14} color={C.orange} />
            </View>
            <TextInput
              style={[s.searchInput, { color: t.text }]}
              placeholder="Rechercher une station ou carburant…"
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
        <View style={s.noData}><NoData /></View>
      ) : (
        <FlatList
          data={dataList}
          keyExtractor={(item) => `${item.productId}`}
          contentContainerStyle={[s.list, { backgroundColor: t.background }]}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.orange} colors={[C.orange]} />
          }
          ListHeaderComponent={
            <View style={s.countRow}>
              <View style={[s.countDot, { backgroundColor: C.orange }]} />
              <Text style={[s.countText, { color: t.textSecondary }]}>
                {dataList.length} produit{dataList.length !== 1 ? "s" : ""}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <FuelCard
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
  root:   { flex: 1 },
  noData: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    overflow: "hidden",
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    paddingBottom: 20,
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16,
  },
  deco1:    { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(255,255,255,0.05)", top: -70, right: -60 },
  deco2:    { position: "absolute", width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,255,255,0.04)", bottom: -30, left: -30 },
  decoDrop: { position: "absolute", top: 50, left: 60 },

  topBar:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 8 },
  iconBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  titleWrap:  { flexDirection: "row", alignItems: "center", gap: 8 },
  titleBadge: { width: 28, height: 28, borderRadius: 9, backgroundColor: "rgba(249,115,22,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: C.white, fontSize: 15, fontFamily: "NexaLight", letterSpacing: 2 },
  headerSub:   { color: "rgba(255,255,255,0.6)", fontFamily: "NexaLight", fontSize: 12, paddingHorizontal: 20, marginTop: 6, marginBottom: 14 },

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
  searchInput:    { flex: 1, fontFamily: "NexaLight", fontSize: 13 },

  countRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4, paddingTop: 16, paddingBottom: 8 },
  countDot: { width: 4, height: 16, borderRadius: 2 },
  countText: { fontFamily: "NexaLight", fontSize: 12 },

  list: { padding: 16, paddingTop: 4, paddingBottom: 60 },
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
  tagPos:   { position: "absolute", top: 14, right: 12, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagText:  { fontFamily: "NexaLight", fontSize: 11, letterSpacing: 0.3 },

  priceOverlay:         { position: "absolute", bottom: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  priceOverlayText:     { color: C.white, fontFamily: "NexaLight", fontSize: 15 },
  priceOverlayCurrency: { color: "rgba(255,255,255,0.7)", fontSize: 11 },

  content: { padding: 16 },
  name:    { fontFamily: "NexaLight", fontSize: 16, letterSpacing: 0.2, marginBottom: 5 },
  desc:    { fontFamily: "NexaLight", fontSize: 12, lineHeight: 18, marginBottom: 10 },

  availRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, alignSelf: "flex-start" },
  availDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  availText: { fontFamily: "NexaLight", fontSize: 11, color: C.green, letterSpacing: 0.3 },

  divider:  { height: 1, marginBottom: 12 },
  footer:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metaRow:  { flexDirection: "row", gap: 8 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  metaText: { fontFamily: "NexaLight", fontSize: 11 },

  btn:     { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, elevation: 4, shadowColor: C.violet, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.28, shadowRadius: 6 },
  btnText: { color: C.white, fontFamily: "NexaLight", fontSize: 13, letterSpacing: 0.3 },
});