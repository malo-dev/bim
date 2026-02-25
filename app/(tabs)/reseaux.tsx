import { useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { useGetAllSectorsQuery } from "@/services/sectorsServices";
import { setSectors } from "@/services/globalApi";
import { Image } from "expo-image";
import {
  Animated,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
};

const Colors = {
  light: {
    background:    "#F0F4FF",
    card:          "#FFFFFF",
    text:          "#0D1B3E",
    textSecondary: "#7B8DB0",
    border:        "rgba(3,83,204,0.10)",
    inputBg:       "#FFFFFF",
    countText:     "rgba(255,255,255,0.85)",
    headerGrad:    [C.deep, C.primary] as [string, string],
    shadow:        "#000",
  },
  dark: {
    background:    "#0A0F1E",
    card:          "#111827",
    text:          "#E2E8F0",
    textSecondary: "#64748B",
    border:        "rgba(255,255,255,0.08)",
    inputBg:       "#111827",
    countText:     "rgba(255,255,255,0.55)",
    headerGrad:    ["#060B18", "#0D1B3E"] as [string, string],
    shadow:        "#000",
  },
};

function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

const ACCENTS = ["#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899"];
const accent  = (i: number) => ACCENTS[i % ACCENTS.length];

/* ─── TYPES ──────────────────────────────────────────────────────────── */
interface Sector {
  businessId: number;
  name: string;
  description?: string;
  logo?: string;
  companies?: any[];
}

/* ─── SECTOR CARD ─────────────────────────────────────────────────────── */
function SectorCardBase({
  item, index, onPress, isDark,
}: { item: Sector; index: number; onPress: () => void; isDark: boolean }) {
  const t      = isDark ? Colors.dark : Colors.light;
  const color  = accent(index);
  const slideY = useRef(new Animated.Value(30)).current;
  const opac   = useRef(new Animated.Value(0)).current;
  const scale  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 350, delay: Math.min(index * 55, 400), useNativeDriver: true }),
      Animated.timing(opac,   { toValue: 1, duration: 350, delay: Math.min(index * 55, 400), useNativeDriver: true }),
    ]).start();
  }, []);

  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  const count = item.companies?.length ?? 0;

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
      <Animated.View style={[
        s.card,
        {
          backgroundColor: t.card,
          borderColor: isDark ? t.border : "transparent",
          shadowColor: t.shadow,
          opacity: opac,
          transform: [{ translateY: slideY }, { scale }],
        },
      ]}>
        {/* Bande couleur gauche */}
        <View style={[s.cardStripe, { backgroundColor: color }]} />

        {/* Logo */}
        <View style={[s.logoBox, { backgroundColor: color + "18" }]}>
          {item.logo ? (
            <Image source={{ uri: item.logo }} style={s.logo} contentFit="cover" transition={200} />
          ) : (
            <View style={[s.logoFallback, { backgroundColor: color + "25" }]}>
              <Ionicons name="business-outline" size={22} color={color} />
            </View>
          )}
        </View>

        {/* Contenu */}
        <View style={s.cardContent}>
          <View style={s.cardTop}>
            <Text style={[s.cardName, { color: t.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            {count > 0 && (
              <View style={[s.countBadge, { backgroundColor: color + "20", borderColor: color + "35" }]}>
                <Ionicons name="business-outline" size={10} color={color} />
                <Text style={[s.countBadgeText, { color }]}>{count}</Text>
              </View>
            )}
          </View>

          <Text style={[s.cardDesc, { color: t.textSecondary }]} numberOfLines={2}>
            {item.description || "Découvrez nos entreprises partenaires"}
          </Text>

          {/* Footer */}
          <View style={s.cardFooter}>
            <View style={[s.chipRow, { backgroundColor: color + "12", borderColor: color + "25" }]}>
              <Ionicons name="layers-outline" size={11} color={color} />
              <Text style={[s.chipText, { color }]}>
                {count} entreprise{count !== 1 ? "s" : ""}
              </Text>
            </View>
            <View style={[s.arrowBtn, { backgroundColor: color + "18" }]}>
              <Ionicons name="arrow-forward" size={14} color={color} />
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}
const SectorCard = memo(SectorCardBase);
SectorCard.displayName = "SectorCard";

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function Reseaux() {
  const router   = useRouter();
  const dispatch = useDispatch();
  const scrollY  = useRef(new Animated.Value(0)).current;
  const { isDark, t } = useTheme();

  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [dataList, setDataList] = useState<Sector[]>([]);

  const { data, isLoading, isFetching } = useGetAllSectorsQuery({
    page, pageSize: 10, search, paginate: true,
  });

  useEffect(() => {
    if (data?.data) {
      if (page === 1) setDataList(data.data);
      else setDataList((prev) => [...prev, ...data.data]);
    }
  }, [data, page]);

  useEffect(() => { setPage(1); }, [search]);

  const loadMore = useCallback(() => {
    if (data?.totalPages && page < data.totalPages && !isFetching) setPage(p => p + 1);
  }, [data, page, isFetching]);

  const handleGoto = useCallback((item: any) => {
    dispatch(setSectors([item]));
    router.push(`/service/${item.businessId}`);
  }, [dispatch, router]);

  const handleSearchClear = useCallback(() => setSearch(""), []);

  /* header shrink */
  const headerH = scrollY.interpolate({ inputRange: [0, 70], outputRange: [Platform.OS === "ios" ? 180 : 160, Platform.OS === "ios" ? 110 : 96], extrapolate: "clamp" });
  const subOp   = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });

  /* ── LOADER ── */
  if (isLoading && page === 1) return (
    <View style={[s.loader, { backgroundColor: t.background }]}>
      <LinearGradient colors={isDark ? ["#060B18", "#0D1B3E"] : [C.deep, C.primary]} style={StyleSheet.absoluteFill} />
      <ActivityIndicator size="large" color={C.white} />
      <Text style={s.loaderText}>Chargement…</Text>
    </View>
  );

  const ListHeader = (
    <View style={{ paddingTop: Platform.OS === "ios" ? 188 : 168 }}>
      {/* Search flottant */}
      <View style={[s.searchBox, {
        backgroundColor: t.inputBg,
        borderColor: t.border,
        shadowColor: t.shadow,
      }]}>
        <View style={[s.searchIconWrap, { backgroundColor: isDark ? "rgba(3,83,204,0.2)" : "rgba(3,83,204,0.08)" }]}>
          <Ionicons name="search-outline" size={16} color={C.primary} />
        </View>
        <TextInput
          placeholder="Rechercher un secteur…"
          placeholderTextColor={t.textSecondary}
          value={search}
          onChangeText={setSearch}
          style={[s.searchInput, { color: t.text }]}
          blurOnSubmit={false}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={handleSearchClear}>
            <Ionicons name="close-circle" size={17} color={t.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Count */}
      <View style={s.countRow}>
        <View style={s.countLeft}>
          <View style={[s.countDot, { backgroundColor: C.accent }]} />
          <Text style={[s.countText, { color: t.countText }]}>
            {dataList.length} secteur{dataList.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[s.root, { backgroundColor: t.background }]}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER FIXE PLEINE LARGEUR ── */}
      <Animated.View style={[s.header, { height: headerH }]}>
        <LinearGradient
          colors={t.headerGrad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.deco1} />
        <View style={s.deco2} />
        <View style={[s.deco3, { backgroundColor: C.accent + "10" }]} />

        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          <View style={s.topBar}>
            <View style={{ width: 40 }} />
            <View style={s.titleWrap}>
              <Text style={s.headerTitle}>Réseaux BIM</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <Animated.View style={{ opacity: subOp, alignItems: "center", marginTop: 6, paddingHorizontal: 20 }}>
            <Text style={s.headerSub}>Découvrez les entreprises partenaires</Text>
            {/* Stat pills */}
            <View style={s.headerPills}>
              <View style={s.headerPill}>
                <Ionicons name="layers-outline" size={12} color={C.gold} />
                <Text style={s.headerPillText}>{dataList.length} secteurs</Text>
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>

      {/* ── LIST ── */}
      {dataList.length === 0 && !isFetching ? (
        <>
          {ListHeader}
          <View style={s.empty}>
            <View style={[s.emptyIcon, { backgroundColor: isDark ? Colors.dark.card : "rgba(3,83,204,0.08)" }]}>
              <Ionicons name="business-outline" size={34} color={isDark ? "rgba(255,255,255,0.2)" : C.muted} />
            </View>
            <Text style={[s.emptyText, { color: t.textSecondary }]}>Aucun secteur trouvé</Text>
            <Text style={[s.emptySubText, { color: t.textSecondary }]}>Essayez un autre terme de recherche</Text>
          </View>
        </>
      ) : (
        <Animated.FlatList
          data={dataList}
          keyExtractor={(item, index) => `${item.businessId}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.list, { backgroundColor: t.background }]}
          ListHeaderComponent={ListHeader}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          ListFooterComponent={
            isFetching ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color={isDark ? C.accent : C.primary} />
              </View>
            ) : null
          }
          renderItem={({ item, index }: { item: Sector; index: number }) => (
            <SectorCard item={item} index={index} isDark={isDark} onPress={() => handleGoto(item)} />
          )}
        />
      )}

      <View style={{ height: 100 }} />
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root:       { flex: 1 },
  loader:     { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { color: C.white, fontFamily: "NexaLight", marginTop: 12, fontSize: 13 },

  /* Header — position absolute, pleine largeur */
  header: {
    position: "absolute", top: 0, left: 0, right: 0,
    zIndex: 10, overflow: "hidden",
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    elevation: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16,
  },
  deco1: {
    position: "absolute", width: 220, height: 220,
    borderRadius: 110, backgroundColor: "rgba(255,255,255,0.05)",
    top: -70, right: -60,
  },
  deco2: {
    position: "absolute", width: 130, height: 130,
    borderRadius: 65, backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -30, left: -30,
  },
  deco3: {
    position: "absolute", width: 60, height: 60,
    borderRadius: 30,
    bottom: 20, right: 80,
  },
  topBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 20,
    marginTop: 8,
  },
  titleWrap: { alignItems: "center" },
  headerTitle: {
    color: C.white, fontSize: 18,
    fontFamily: "NexaLight", letterSpacing: 0.4,
  },
  headerSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12, fontFamily: "NexaLight", marginBottom: 8,
  },
  headerPills: { flexDirection: "row", gap: 8 },
  headerPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  headerPillText: { color: C.gold, fontFamily: "NexaLight", fontSize: 11 },

  /* Search */
  searchBox: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, paddingHorizontal: 12, paddingRight: 14,
    height: 50, gap: 10,
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    borderWidth: 1,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8,
  },
  searchIconWrap: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  searchInput: { flex: 1, fontFamily: "NexaLight", fontSize: 13 },

  /* Count */
  countRow: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  countLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  countDot:  { width: 4, height: 16, borderRadius: 2 },
  countText: { fontFamily: "NexaLight", fontSize: 12, letterSpacing: 0.3 },

  /* List */
  list: { paddingHorizontal: 16, paddingBottom: 40 },

  /* Empty */
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyText:    { fontFamily: "NexaLight", fontSize: 14, textAlign: "center" },
  emptySubText: { fontFamily: "NexaLight", fontSize: 12, textAlign: "center", opacity: 0.7 },

  /* Card */
  card: {
    flexDirection: "row",
    borderRadius: 20, marginBottom: 12,
    overflow: "hidden", borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  cardStripe: { width: 4 },
  logoBox: {
    width: 70, alignItems: "center", justifyContent: "center",
  },
  logoFallback: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  logo: { width: 40, height: 40, borderRadius: 10 },

  cardContent: { flex: 1, padding: 14, paddingLeft: 10 },
  cardTop: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 5,
  },
  cardName: {
    fontSize: 14, fontFamily: "NexaLight",
    flex: 1, marginRight: 8,
  },
  countBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1,
  },
  countBadgeText: { fontSize: 11, fontFamily: "NexaLight" },
  cardDesc: {
    fontSize: 12, fontFamily: "NexaLight",
    lineHeight: 17, marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
  },
  chipRow: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 11, fontFamily: "NexaLight" },
  arrowBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
});