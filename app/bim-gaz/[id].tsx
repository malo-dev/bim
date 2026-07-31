/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetAllProductsQuery } from "@/services/productServices";
import { useGetAllTransactionsQuery } from "@/services/tsxService";
import { API_URL_BASE } from "@/constants/api";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import NoData from "@/components/ui/noData";
import { useAppTheme } from "@/app/_layout";

const { width: SCREEN_W } = Dimensions.get("window");

/* ─── PALETTES ───────────────────────────────────────────────────────── */
const LIGHT = {
  primary:     "#0035C5",
  blue:        "#0047FF",
  deep:        "#001257",
  white:       "#FFFFFF",
  bg:          "#F9F9F9",
  surface:     "#F3F3F4",
  text:        "#1A1C1C",
  textSec:     "#434657",
  textMut:     "#747688",
  border:      "rgba(196,197,218,0.30)",
  green:       "#22C55E",
  error:       "#EF4444",
  safeBarBg:   "rgba(255,255,255,0.96)",
  safeBarBord: "rgba(196,197,218,0.15)",
  cardGlass:   "rgba(255,255,255,0.80)",
  cardBord:    "rgba(240,242,245,0.50)",
  navBg:       "rgba(249,249,249,0.92)",
  periodPill:  "#FFFFFF",
  contentBg:   "#FFFFFF",
};
const DARK: typeof LIGHT = {
  primary:     "#4D8DFF",
  blue:        "#4D8DFF",
  deep:        "#4D8DFF",
  white:       "#FFFFFF",
  bg:          "#0B1220",
  surface:     "#1A2540",
  text:        "#EAF0FF",
  textSec:     "#A3B4D0",
  textMut:     "#6B7A99",
  border:      "rgba(31,42,68,0.80)",
  green:       "#22C55E",
  error:       "#EF4444",
  safeBarBg:   "rgba(11,18,32,0.94)",
  safeBarBord: "rgba(31,42,68,0.80)",
  cardGlass:   "rgba(26,37,64,0.80)",
  cardBord:    "rgba(31,42,68,0.80)",
  navBg:       "rgba(11,18,32,0.94)",
  periodPill:  "#1A2540",
  contentBg:   "#1A2540",
};

/* ─── IMAGES ─────────────────────────────────────────────────────────── */
const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDj645YxOJpfFxplVgrcv3wICblq8DXXw12XdItEtuc1cG5gFuFoHbKTr0rf-uHwAdbFq5CpaM6Q3GQmZbf6B5xlMRoiywoOQbgbcZAXtT24-r76Xb-KRKDyfqgIV3-qRaGTEwDLVcvDNE8A8d6XIrtupwhCz1Cdo06xK4cI45zK95k6oJswXFkXJlYkqu3R56PfjWaP-3dmHZdOYD__FogHEYgHGNprQzY_NxPjESOyWUsKpRaznDx3TnBmOlkTYUFOvqEcZq5E8A";

const AVATAR_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBx6AMgymqCu7tTq1G2lGinijWIkLzsZzQKIg2k_0aWsEfgZMeIEnst4P741xd7h0r-4WI8zQ1zXAcYW5uJtrFYnzW_0z4R4TWoPWABWYheZyfEo6vxTWS_hEgmx73ZMGhjUlN2MZtNJZOAbTjJpZZgzgvybjU9mN_ISqucZYLLTub032gOZyzN7DjcPEanZkE1Ex6QTeb2bmhU7oKfUkbmnLCpKVfWLVKPpNLpAoN2ozqs8KmJUmL80AOCHKzWC1mJYrbIsW8kT-g";

const FALLBACK_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAp3V7v1PH4-0i-IuXrX6GznP1WZjvBPu6ifR-eR5M8bHCeEGuhcC9qpJuQLFoWQ3txH2pbW7EJpCG3r_slGj2Bg7omRlR0iA17qGkbOEo7syMHw_iJFmnDDcD7HpQNHq2Qd-uuMAZGEHug58KAqm9_T-QayXco2ZVNNbO9c2p9Q9T-DZzYvSRBiZuj0a6XO5TcPHPd_KDKc4ZaFjxZOsWunHkbShHfc4vHH3o9-VddalXFWIx4E7ALPdyj9H76cjl_wpjmXsJ2h8s",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAwmBlN3Z_GRpk4oxDS9Z4rRTmj4qqinT0dTjjrl7Y0CinfjZ0xnGDzuOPSHhHKwtGR7geCvOZvjW43WnS3PqHCOigxIw2QhsCnyzJdyH5nLtzeDZvU4nE_HClsgqmo7JwD6ajAk41lll3izBCOYw1Rx9HfDQFJM2Dlx7di-55uQmx0YpY-Ehnhr2myZULrsqDSq8O4DqSMV8iaOJCiOX2-XOkOW7BfjO5aBcvOU7YAF6EcF_KoYg6onAeo6nyCtF0uuIr1eGdo83I",
];

const CARD_BGS_LIGHT = ["#FFF8F0", "#F4F7FF"];
const CARD_BGS_DARK  = ["#1C1208", "#080F1C"];

/* ─── PERIOD HELPERS ─────────────────────────────────────────────────── */
type Period = "Semaine" | "Mois";

function startOfPeriod(p: Period): number {
  const d = new Date();
  if (p === "Semaine") {
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
  } else {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
  }
  return d.getTime();
}

function filterByPeriod(txs: any[], p: Period) {
  const start = startOfPeriod(p);
  return txs.filter(t => new Date(t.createdAt || t.date || 0).getTime() >= start);
}

/* ─── PRODUCT CARD (portrait) ────────────────────────────────────────── */
function GazCardBase({ item, onPress, index }: { item: any; onPress: () => void; index: number }) {
  const { isDark } = useAppTheme();
  const C          = isDark ? DARK : LIGHT;
  const gc         = useMemo(() => mkGc(C), [isDark]);
  const CARD_BGS   = isDark ? CARD_BGS_DARK : CARD_BGS_LIGHT;

  const slideY = useRef(new Animated.Value(24)).current;
  const opac   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 350, delay: Math.min(index * 60, 300), useNativeDriver: true }),
      Animated.timing(opac,   { toValue: 1, duration: 350, delay: Math.min(index * 60, 300), useNativeDriver: true }),
    ]).start();
  }, []);

  const imageUri = item.imageUrl
    ? `${API_URL_BASE}${item.imageUrl}`
    : FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

  const price    = Number(item.price ?? 0).toFixed(2);
  const currency = item.currency?.code ?? "EC";
  const cardBg   = CARD_BGS[index % CARD_BGS.length];

  return (
    <Animated.View style={[gc.card, { opacity: opac, transform: [{ translateY: slideY }] }]}>

      {/* ── ZONE IMAGE ── */}
      <View style={[gc.imageWrap, { backgroundColor: cardBg }]}>
        <Image source={{ uri: imageUri }} style={gc.image} contentFit="contain" transition={300} />

        <View style={gc.gazBadge}>
          <Text style={gc.gazBadgeText}>Gaz</Text>
        </View>

        <View style={gc.priceBadge}>
          <Text style={gc.priceValue}>{price}</Text>
          <Text style={gc.priceCur}> {currency}</Text>
        </View>
      </View>

      {/* ── ZONE CONTENU ── */}
      <View style={gc.content}>
        <View style={gc.nameRow}>
          <Text style={gc.name} numberOfLines={1}>{item.name}</Text>
          <View style={gc.availBadge}>
            <View style={gc.availDot} />
            <Text style={gc.availText}>Disponible</Text>
          </View>
        </View>

        {!!item.description && (
          <Text style={gc.desc} numberOfLines={2}>{item.description}</Text>
        )}

        <View style={gc.btnRow}>
          <TouchableOpacity style={gc.voirBtn} onPress={onPress} activeOpacity={0.85}>
            <Text style={gc.voirText}>Voir</Text>
            <Ionicons name="arrow-forward" size={18} color={C.white} />
          </TouchableOpacity>
          <TouchableOpacity style={gc.basketBtn} onPress={onPress} activeOpacity={0.85}>
            <Ionicons name="basket-outline" size={22} color={C.textSec} />
          </TouchableOpacity>
        </View>
      </View>

    </Animated.View>
  );
}
const GazCard = memo(GazCardBase);

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function BimGazScreen() {
  const router     = useRouter();
  const { id }     = useLocalSearchParams<{ id: string }>();
  const { unread } = useUnreadNotifications();
  const { isDark } = useAppTheme();
  const C          = isDark ? DARK : LIGHT;
  const s          = useMemo(() => mkS(C), [isDark]);

  const [period,     setPeriod]     = useState<Period>("Semaine");
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState("");
  const [dataList,   setDataList]   = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isFetching, refetch } = useGetAllProductsQuery({
    page, pageSize: 20, search, paginate: true, companyId: id,
  });

  const { data: txData } = useGetAllTransactionsQuery(
    { page: 1, pageSize: 100, companyId: id } as any,
    { skip: !id }
  );

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

  const allTxs     = useMemo(() => txData?.data ?? [], [txData]);
  const periodTxs  = useMemo(() => filterByPeriod(allTxs, period), [allTxs, period]);
  const totalSpent = useMemo(() => periodTxs.reduce((a, t) => a + Number(t.amount || 0), 0), [periodTxs]);
  const txCount    = periodTxs.length;

  const renderHeader = () => (
    <View>

      {/* HERO 16:9 arrondi */}
      <View style={s.hero}>
        <Image source={{ uri: HERO_IMAGE }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.40)"]}
          start={{ x: 0, y: 0.35 }} end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.heroBottom}>
          <View style={s.heroSearch}>
            <Ionicons name="search-outline" size={18} color={LIGHT.primary} />
            <TextInput
              style={s.heroSearchInput}
              placeholder="Rechercher un produit gaz..."
              placeholderTextColor={LIGHT.textMut}
              value={search}
              onChangeText={v => { setSearch(v); setPage(1); }}
              autoCorrect={false}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => { setSearch(""); setPage(1); }}>
                <Ionicons name="close-circle" size={16} color={LIGHT.textMut} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* TABLEAU DE BORD */}
      <View style={s.statsSection}>
        <View style={s.statsTitleRow}>
          <Text style={s.statsTitle}>Tableau de bord</Text>
          <View style={s.periodContainer}>
            {(["Semaine", "Mois"] as Period[]).map(p => (
              <TouchableOpacity
                key={p}
                style={[s.periodPill, period === p && s.periodPillActive]}
                onPress={() => setPeriod(p)}
                activeOpacity={0.8}
              >
                <Text style={[s.periodText, period === p && s.periodTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.cardsRow}>
          <View style={s.statCard}>
            <View style={s.statCardTop}>
              <View style={s.statIcon1}>
                <Ionicons name="speedometer-outline" size={22} color={C.primary} />
              </View>
              <View style={s.trendRow}>
                <Ionicons name="trending-down" size={14} color="#10B981" />
                <Text style={s.trendText}>-4%</Text>
              </View>
            </View>
            <View>
              <Text style={s.statLabel}>Total consommé</Text>
              <View style={s.statValueRow}>
                <Text style={s.statValue}>{txCount}</Text>
                <Text style={s.statUnit}> btl.</Text>
              </View>
            </View>
          </View>

          <View style={[s.statCard, s.statCard2]}>
            <View style={s.statCardTop}>
              <View style={s.statIcon2}>
                <Ionicons name="cash-outline" size={22} color={C.primary} />
              </View>
              <Text style={s.statPeriod}>Ce {period.toLowerCase()}</Text>
            </View>
            <View>
              <Text style={s.statLabel}>Ecoins dépensés</Text>
              <View style={s.statValueRow}>
                <Text style={[s.statValue, { color: C.primary }]}>{totalSpent.toFixed(2)}</Text>
                <Text style={[s.statUnit, { color: C.primary }]}> EC</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* EN-TÊTE SECTION PRODUITS */}
      <View style={s.prodHeader}>
        <View style={s.prodBar} />
        <Text style={s.prodTitle}>Produits disponibles</Text>
        <Text style={s.prodCount}>
          {dataList.length} produit{dataList.length !== 1 ? "s" : ""}
        </Text>
      </View>

    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <SafeAreaView edges={["top"]} style={s.safeBar}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.primary} />
          </TouchableOpacity>
          <Text style={s.topTitle}>BIM Gaz</Text>
          <View style={s.topRight}>
            <TouchableOpacity>
              <Ionicons name="search-outline" size={22} color={C.textSec} />
            </TouchableOpacity>
            <View style={s.avatar}>
              <Image source={{ uri: AVATAR_URL }} style={s.avatarImg} contentFit="cover" />
            </View>
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={dataList}
        keyExtractor={item => `${item.productId}`}
        numColumns={2}
        columnWrapperStyle={s.columnWrapper}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isFetching ? (
          <View style={s.emptyWrap}><NoData /></View>
        ) : null}
        ListFooterComponent={isFetching && !refreshing ? (
          <View style={s.loadMore}><ActivityIndicator color={C.primary} /></View>
        ) : null}
        renderItem={({ item, index }) => (
          <GazCard
            item={item}
            index={index}
            onPress={() => router.push(`/bim-gaz/product/${item.productId}?companyId=${id}` as any)}
          />
        )}
      />

      {/* FAB QR */}
      <TouchableOpacity style={s.fab} activeOpacity={0.85}>
        <Ionicons name="qr-code-outline" size={28} color={C.white} />
      </TouchableOpacity>

      {/* BOTTOM NAV */}
      <View style={s.bottomNav}>
        <TouchableOpacity style={s.navItem} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="home-outline" size={22} color={C.textMut} />
          <Text style={s.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} activeOpacity={0.8}>
          <Ionicons name="language-outline" size={22} color={C.textMut} />
          <Text style={s.navLabel}>Language</Text>
        </TouchableOpacity>
        <View style={s.navCenter}>
          <TouchableOpacity style={s.navCenterBtn} activeOpacity={0.85}>
            <Ionicons name="qr-code-outline" size={30} color={C.white} />
          </TouchableOpacity>
          <Text style={[s.navLabel, { color: C.primary }]}>Pay</Text>
        </View>
        <TouchableOpacity style={s.navItem} activeOpacity={0.8}>
          <Ionicons name="stats-chart-outline" size={22} color={C.textMut} />
          <Text style={s.navLabel}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => router.push("/profile" as any)} activeOpacity={0.8}>
          <Ionicons name="person-outline" size={22} color={C.textMut} />
          <Text style={s.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

/* ─── STYLES PRINCIPAUX ──────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  safeBar:  { backgroundColor: C.safeBarBg, borderBottomWidth: 1, borderBottomColor: C.safeBarBord },
  topBar:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 14 },
  iconBtn:  { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  topTitle: { fontFamily: "NexaBold", fontSize: 22, color: C.primary, letterSpacing: -0.3 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar:   { width: 40, height: 40, borderRadius: 20, overflow: "hidden", borderWidth: 2, borderColor: C.white, elevation: 3, shadowColor: "#000", shadowOpacity: 0.10, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  avatarImg:{ width: "100%", height: "100%" },

  hero:            { height: SCREEN_W * 9 / 16, borderRadius: 32, overflow: "hidden", marginHorizontal: 20, marginTop: 12, marginBottom: 4 },
  heroBottom:      { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16 },
  heroSearch:      { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(255,255,255,0.90)", borderRadius: 20, paddingHorizontal: 16, height: 52, elevation: 4, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  heroSearchInput: { flex: 1, fontFamily: "NexaLight", fontSize: 14, color: "#1A1C1C" },

  statsSection:    { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  statsTitleRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  statsTitle:      { fontFamily: "NexaBold", fontSize: 20, color: C.text },

  periodContainer: { flexDirection: "row", backgroundColor: C.surface, borderRadius: 99, padding: 4 },
  periodPill:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99 },
  periodPillActive:{ backgroundColor: C.periodPill, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  periodText:      { fontFamily: "NexaBold", fontSize: 11, color: C.textMut },
  periodTextActive:{ color: C.primary },

  cardsRow: { flexDirection: "row", gap: 14 },
  statCard: {
    flex: 1,
    backgroundColor: C.cardGlass,
    borderRadius: 24, padding: 16, height: 156,
    borderWidth: 1, borderColor: C.cardBord,
    justifyContent: "space-between",
    elevation: 3,
    shadowColor: "rgba(0,71,255,0.04)", shadowOpacity: 1, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
  },
  statCard2:   { borderLeftWidth: 4, borderLeftColor: C.primary },
  statCardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  statIcon1:   { width: 40, height: 40, borderRadius: 14, backgroundColor: "rgba(221,225,255,0.30)", alignItems: "center", justifyContent: "center" },
  statIcon2:   { width: 40, height: 40, borderRadius: 14, backgroundColor: "rgba(0,53,197,0.10)", alignItems: "center", justifyContent: "center" },
  trendRow:    { flexDirection: "row", alignItems: "center", gap: 3 },
  trendText:   { fontFamily: "NexaBold", fontSize: 11, color: "#10B981" },
  statPeriod:  { fontFamily: "NexaLight", fontSize: 10, color: C.textMut },
  statLabel:   { fontFamily: "NexaBold", fontSize: 9, color: C.textMut, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
  statValueRow:{ flexDirection: "row", alignItems: "baseline" },
  statValue:   { fontFamily: "NexaBold", fontSize: 28, color: C.text },
  statUnit:    { fontFamily: "NexaLight", fontSize: 14, color: C.textSec },

  prodHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
  prodBar:    { width: 6, height: 24, borderRadius: 3, backgroundColor: C.primary },
  prodTitle:  { fontFamily: "NexaBold", fontSize: 20, color: C.text, flex: 1 },
  prodCount:  { fontFamily: "NexaLight", fontSize: 12, color: C.textMut },

  columnWrapper: { gap: 16, paddingHorizontal: 20 },
  listContent:   { paddingBottom: 120 },
  emptyWrap:     { paddingVertical: 48, alignItems: "center" },
  loadMore:      { paddingVertical: 20, alignItems: "center" },

  fab: { position: "absolute", bottom: 88, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", elevation: 8, shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },

  bottomNav:    { position: "absolute", bottom: 0, left: 0, right: 0, height: 80, flexDirection: "row", alignItems: "center", backgroundColor: C.navBg, borderTopWidth: 1, borderTopColor: C.border, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 12, paddingHorizontal: 8, elevation: 16, shadowColor: "rgba(0,71,255,0.06)", shadowOpacity: 1, shadowRadius: 24, shadowOffset: { width: 0, height: -8 } },
  navItem:      { flex: 1, alignItems: "center", gap: 3 },
  navCenter:    { flex: 1, alignItems: "center", marginTop: -30 },
  navCenterBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.blue, alignItems: "center", justifyContent: "center", elevation: 8, shadowColor: C.blue, shadowOpacity: 0.30, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  navLabel:     { fontFamily: "NexaLight", fontSize: 10, color: C.textMut },
}); }

/* ─── CARD STYLES ────────────────────────────────────────────────────── */
function mkGc(C: typeof LIGHT) { return StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.cardGlass,
    borderRadius: 32, overflow: "hidden", marginBottom: 16,
    borderWidth: 1, borderColor: C.cardBord,
    elevation: 5,
    shadowColor: "rgba(0,71,255,0.05)", shadowOpacity: 1, shadowRadius: 24, shadowOffset: { width: 8, height: 12 },
  },

  imageWrap: { aspectRatio: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  image:     { width: "100%", height: "100%" },

  gazBadge:     { position: "absolute", top: 16, right: 16, backgroundColor: "rgba(255,255,255,0.80)", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  gazBadgeText: { fontFamily: "NexaBold", fontSize: 11, color: "#434657" },

  priceBadge: { position: "absolute", bottom: 16, left: 16, flexDirection: "row", alignItems: "baseline", backgroundColor: "rgba(0,53,197,0.90)", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.20)", elevation: 4, shadowColor: C.primary, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  priceValue: { fontFamily: "NexaBold", fontSize: 15, color: "#FFFFFF" },
  priceCur:   { fontFamily: "NexaLight", fontSize: 10, color: "rgba(255,255,255,0.75)" },

  content: { padding: 20, backgroundColor: C.contentBg },

  nameRow:    { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6, gap: 6 },
  name:       { fontFamily: "NexaBold", fontSize: 15, color: C.text, flex: 1 },
  availBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#F0FDF4", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 },
  availDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
  availText:  { fontFamily: "NexaBold", fontSize: 9, color: "#16A34A", textTransform: "uppercase", letterSpacing: 0.4 },

  desc: { fontFamily: "NexaLight", fontSize: 12, color: C.textSec, lineHeight: 17, marginBottom: 16 },

  btnRow:    { flexDirection: "row", gap: 10, alignItems: "center" },
  voirBtn:   { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.primary, borderRadius: 18, paddingVertical: 13 },
  voirText:  { fontFamily: "NexaBold", fontSize: 13, color: "#FFFFFF" },
  basketBtn: { width: 52, height: 52, borderRadius: 18, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
}); }
