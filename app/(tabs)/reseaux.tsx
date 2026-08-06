import { setSectors } from "@/services/globalApi";
import { useGetAllSectorsQuery } from "@/services/sectorsServices";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppTheme } from "@/app/_layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";

/* ─── Theme ──────────────────────────────────────────────────────────── */
const PALETTE = {
  light: {
    bg:      "#F8F9FC",
    card:    "#FFFFFF",
    text:    "#1A1C1C",
    muted:   "#747688",
    input:   "#F3F3F4",
    border:  "#E2E2E2",
    primary: "#0047FF",
  },
  dark: {
    bg:      "#0F1117",
    card:    "#1A1D2E",
    text:    "#E8EBF0",
    muted:   "#64748B",
    input:   "#1E2235",
    border:  "#2A2D40",
    primary: "#4D7FFF",
  },
};
type Theme = typeof PALETTE.light;


/* ─── Sector images & labels ─────────────────────────────────────────── */
const SECTOR_IMG_MAP: [string, string][] = [
  ["immobilier",   "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80"],
  ["technolog",    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80"],
  ["informatique", "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80"],
  ["alimentaire",  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"],
  ["epicerie",     "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"],
  ["restaurant",   "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80"],
  ["agriculture",  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&q=80"],
  ["transport",    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80"],
  ["logistique",   "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&q=80"],
  ["sante",        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80"],
  ["medic",        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80"],
  ["pharma",       "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80"],
  ["finance",      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80"],
  ["banque",       "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80"],
  ["mode",         "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80"],
  ["vetement",     "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80"],
  ["beaute",       "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80"],
  ["education",    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80"],
  ["sport",        "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&q=80"],
  ["loisir",       "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&q=80"],
  ["energie",      "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&q=80"],
  ["gaz",          "https://images.unsplash.com/photo-1518704618243-b719e5d5f2b8?w=400&q=80"],
  ["carburant",    "https://images.unsplash.com/photo-1545262810-77515befe149?w=400&q=80"],
  ["petrole",      "https://images.unsplash.com/photo-1545262810-77515befe149?w=400&q=80"],
  ["construction", "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80"],
  ["artisanat",    "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&q=80"],
  ["tourisme",     "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80"],
  ["hotel",        "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=400&q=80"],
  ["media",        "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80"],
];
const IMG_DEFAULT = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80";

function getSectorImage(name: string): string {
  const n = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [k, url] of SECTOR_IMG_MAP) {
    if (n.includes(k)) return url;
  }
  return IMG_DEFAULT;
}

function getSectorLabel(name: string): string {
  const n = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (n.includes("sante") || n.includes("medic") || n.includes("pharma")) return "Secteur Prioritaire";
  if (n.includes("transport") || n.includes("logistique"))                 return "Mobilité";
  if (n.includes("gaz") || n.includes("energie") || n.includes("carburant") || n.includes("petrole")) return "Énergie";
  if (n.includes("finance") || n.includes("banque"))                       return "Finance";
  if (n.includes("technolog") || n.includes("informatique"))               return "Innovation";
  if (n.includes("immobilier"))                                             return "Immobilier";
  if (n.includes("alimentaire") || n.includes("restaurant") || n.includes("epicerie")) return "Alimentation";
  if (n.includes("tourisme") || n.includes("hotel"))                       return "Tourisme";
  if (n.includes("education"))                                              return "Éducation";
  if (n.includes("sport") || n.includes("loisir"))                         return "Sport & Loisirs";
  if (n.includes("construction"))                                           return "Construction";
  if (n.includes("mode") || n.includes("vetement"))                        return "Mode";
  if (n.includes("agriculture"))                                            return "Agriculture";
  return "Secteur";
}

/* ─── Types ──────────────────────────────────────────────────────────── */
interface Sector {
  businessId: number;
  name: string;
  description?: string;
  logo?: string;
  companies?: any[];
}

/* ─── FeaturedCard (horizontal large card) ───────────────────────────── */
function FeaturedCard({
  item, index, onPress,
}: { item: Sector; index: number; onPress: () => void }) {
  const slideX = useRef(new Animated.Value(40)).current;
  const opac   = useRef(new Animated.Value(0)).current;
  const scale  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideX, { toValue: 0, duration: 420, delay: index * 80, useNativeDriver: true }),
      Animated.timing(opac,   { toValue: 1, duration: 420, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const pIn  = () => Animated.spring(scale, { toValue: 0.96, friction: 7, useNativeDriver: true }).start();
  const pOut = () => Animated.spring(scale, { toValue: 1,    friction: 6, useNativeDriver: true }).start();

  const count = item.companies?.length ?? 0;
  const hasCo = count > 0;

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={pIn} onPressOut={pOut} onPress={onPress}>
      <Animated.View style={[s.featCard, { opacity: opac, transform: [{ translateX: slideX }, { scale }] }]}>
        <Image source={{ uri: getSectorImage(item.name) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.80)"]}
          style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
        />
        <View style={s.featContent}>
          <View style={s.featBottom}>
            <Text style={s.featLabel}>{getSectorLabel(item.name)}</Text>
            <Text style={s.featTitle} numberOfLines={1}>{item.name}</Text>
            <Text style={s.featDesc} numberOfLines={2}>
              {item.description || "Découvrez nos entreprises partenaires dans ce secteur."}
            </Text>
            <View style={s.featRow}>
              <View style={s.featChip}>
                <Ionicons name="business-outline" size={14} color="#fff" />
                <Text style={s.featChipTxt}>{count} Entreprise{count !== 1 ? "s" : ""}</Text>
              </View>
              <View style={[s.featArrow, hasCo ? s.arrowWhite : s.arrowGlass]}>
                <Ionicons name="chevron-forward" size={20} color={hasCo ? "#0047FF" : "#fff"} />
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ─── ListItem (compact row) ─────────────────────────────────────────── */
function ListItem({
  item, index, onPress, W, isDark,
}: { item: Sector; index: number; onPress: () => void; W: Theme; isDark: boolean }) {
  const slideY = useRef(new Animated.Value(20)).current;
  const opac   = useRef(new Animated.Value(0)).current;
  const scale  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 350, delay: Math.min(index * 50, 300), useNativeDriver: true }),
      Animated.timing(opac,   { toValue: 1, duration: 350, delay: Math.min(index * 50, 300), useNativeDriver: true }),
    ]).start();
  }, []);

  const pIn  = () => Animated.spring(scale, { toValue: 0.97, friction: 8, useNativeDriver: true }).start();
  const pOut = () => Animated.spring(scale, { toValue: 1,    friction: 6, useNativeDriver: true }).start();

  const count = item.companies?.length ?? 0;

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={pIn} onPressOut={pOut} onPress={onPress}>
      <Animated.View style={[
        s.listItem,
        {
          backgroundColor: W.card,
          borderColor: isDark ? W.border : "rgba(255,255,255,0.9)",
          shadowColor: "#000",
          opacity: opac,
          transform: [{ translateY: slideY }, { scale }],
        },
      ]}>
        <View style={s.listThumb}>
          <Image source={{ uri: getSectorImage(item.name) }} style={s.listImg} contentFit="cover" transition={300} />
        </View>
        <View style={s.listBody}>
          <View style={s.listTop}>
            <Text style={[s.listName, { color: W.text }]} numberOfLines={1}>{item.name}</Text>
            <View style={[s.listTag, { backgroundColor: W.input, borderColor: W.border }]}>
              <Text style={[s.listTagTxt, { color: W.muted }]}>SECTEUR</Text>
            </View>
          </View>
          <Text style={[s.listDesc, { color: W.muted }]} numberOfLines={1}>
            {item.description || "Partenaires BIM"}
          </Text>
          <View style={s.listMeta}>
            <Ionicons name="business-outline" size={12} color={W.primary} />
            <Text style={[s.metaMain, { color: W.primary }]}>{count} Entreprise{count !== 1 ? "s" : ""}</Text>
            <View style={[s.metaDot, { backgroundColor: W.border }]} />
            <Text style={[s.metaSub, { color: W.muted }]}>Mis à jour récemment</Text>
          </View>
        </View>
        <View style={[s.listArrow, { borderColor: W.primary + "22" }]}>
          <Ionicons name="chevron-forward" size={18} color={W.primary} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ─── ListHeader (inside FlatList) ──────────────────────────────────── */
function ReseauxListHeader({
  headerH, dataList, W, isDark, onGoto,
}: {
  headerH: number; dataList: Sector[]; W: Theme; isDark: boolean;
  onGoto: (item: Sector) => void;
}) {
  return (
    <View>
      {/* Spacer under fixed header (includes search bar height when open) */}
      <View style={{ height: headerH + 8 }} />

      {/* Hero */}
      <View style={s.hero}>
        <Text style={[s.heroTitle, { color: W.text }]}>RESEAUX BIMNEXT</Text>
        <View style={s.heroRow}>
          <Text style={[s.heroSub, { color: W.muted }]}>Découvrez les partenaires par secteur.</Text>
          <View style={[s.pill, { backgroundColor: W.primary + "18", borderColor: W.primary + "30" }]}>
            <Ionicons name="layers-outline" size={12} color={W.primary} />
            <Text style={[s.pillTxt, { color: W.primary }]}>{dataList.length} SECTEURS</Text>
          </View>
        </View>
      </View>

      {/* Featured horizontal scroll */}
      {dataList.length > 0 && (
        <FlatList
          horizontal
          data={dataList}
          keyExtractor={(item: Sector) => `f-${item.businessId}`}
          renderItem={({ item, index }: { item: Sector; index: number }) => (
            <FeaturedCard item={item} index={index} onPress={() => onGoto(item)} />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 24, paddingRight: 8, paddingBottom: 8 }}
          ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
          nestedScrollEnabled
        />
      )}

      {/* Section header */}
      <View style={s.sectionRow}>
        <Text style={[s.sectionTitle, { color: W.text }]}>Tous les secteurs</Text>
        <TouchableOpacity style={s.seeAll}>
          <Text style={[s.seeAllTxt, { color: W.primary }]}>Voir tout</Text>
          <Ionicons name="arrow-forward" size={14} color={W.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── Main Screen ────────────────────────────────────────────────────── */
export default function Reseaux() {
  const router   = useRouter();
  const dispatch = useDispatch();
  const insets   = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const W = isDark ? PALETTE.dark : PALETTE.light;
  const { unread }   = useUnreadNotifications();

  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [dataList,   setDataList]   = useState<Sector[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBarAnim = useRef(new Animated.Value(0)).current;
  const isFirstPage = useRef(true);

  const toggleSearch = useCallback(() => {
    if (searchOpen) {
      Animated.timing(searchBarAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
      setSearchOpen(false);
      setSearch("");
    } else {
      setSearchOpen(true);
      Animated.timing(searchBarAnim, { toValue: 56, duration: 280, useNativeDriver: false }).start();
    }
  }, [searchOpen, searchBarAnim]);

  const { data, isLoading, isFetching, refetch } = useGetAllSectorsQuery({
    page, pageSize: 10, search, paginate: true,
  });

  useEffect(() => {
    isFirstPage.current = true;
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (data?.data) {
      if (isFirstPage.current) {
        setDataList(data.data);
        isFirstPage.current = false;
      } else {
        setDataList(prev => {
          const ids = new Set(prev.map((s: Sector) => s.businessId));
          return [...prev, ...data.data.filter((s: Sector) => !ids.has(s.businessId))];
        });
      }
    }
  }, [data]);

  const onRefresh = useCallback(async () => {
    isFirstPage.current = true;
    setRefreshing(true);
    setPage(1);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const loadMore = useCallback(() => {
    if (data?.totalPages && page < data.totalPages && !isFetching) {
      setPage(p => p + 1);
    }
  }, [data, page, isFetching]);

  const handleGoto = useCallback((item: Sector) => {
    dispatch(setSectors([item]));
    router.push(`/service/${item.businessId}`);
  }, [dispatch, router]);

  const HEADER_H       = insets.top + 62;
  const SEARCH_BAR_H   = 56;
  const effectiveH     = HEADER_H + (searchOpen ? SEARCH_BAR_H : 0);

  if (isLoading && dataList.length === 0) {
    return (
      <View style={[s.loaderWrap, { backgroundColor: W.bg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color={W.primary} />
        <Text style={[s.loaderTxt, { color: W.muted }]}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: W.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      {/* ── Fixed glass header ── */}
      <View style={[s.header, {
        paddingTop: insets.top,
        backgroundColor: isDark ? "rgba(15,17,23,0.94)" : "rgba(255,255,255,0.93)",
        borderBottomColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(196,197,218,0.4)",
      }]}>
        <View style={s.headerInner}>
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={[s.backBtn, { backgroundColor: W.input, borderColor: W.border }]}>
            <Ionicons name="arrow-back" size={18} color={W.text} />
          </TouchableOpacity>

          {/* Title */}
          <View style={s.logoWrap}>
            <Text style={[s.headerTitle, { color: W.text }]}>RESEAUX BIMNEXT</Text>
          </View>

          {/* Right: search + notif */}
          <View style={s.headerRight}>
            <TouchableOpacity
              onPress={toggleSearch}
              style={[s.iconBtn, {
                backgroundColor: searchOpen ? W.primary + "14" : W.input,
                borderColor:     searchOpen ? W.primary + "40" : W.border,
              }]}
            >
              <Ionicons
                name={searchOpen ? "close-outline" : "search-outline"}
                size={18}
                color={searchOpen ? W.primary : W.text}
              />
            </TouchableOpacity>
            <View style={{ position: "relative" }}>
              <TouchableOpacity
                onPress={() => router.push("/notification")}
                style={[s.iconBtn, { backgroundColor: W.input, borderColor: W.border }]}
              >
                <Ionicons name="notifications-outline" size={18} color={W.text} />
              </TouchableOpacity>
              {unread > 0 && (
                <View style={s.notifBadge}>
                  <Text style={s.notifBadgeTxt}>{unread > 99 ? "99+" : unread}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Animated search bar */}
        <Animated.View style={{ height: searchBarAnim, overflow: "hidden", paddingHorizontal: 16 }}>
          <View style={[s.hSearchBar, { backgroundColor: W.input, borderColor: W.border }]}>
            <Ionicons name="search-outline" size={15} color={W.muted} />
            <TextInput
              placeholder="Rechercher un secteur…"
              placeholderTextColor={W.muted}
              value={search}
              onChangeText={setSearch}
              style={[s.hSearchInput, { color: W.text }]}
              autoFocus={searchOpen}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color={W.muted} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>

      {/* ── Main scrollable list ── */}
      <Animated.FlatList
        data={dataList}
        keyExtractor={(item: Sector) => String(item.businessId)}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, marginBottom: insets.bottom + 84 }}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListHeaderComponent={
          <ReseauxListHeader
            headerH={effectiveH}
            dataList={dataList}
            W={W}
            isDark={isDark}
            onGoto={handleGoto}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[W.primary]}
            tintColor={W.primary}
            progressViewOffset={HEADER_H}
          />
        }
        ListEmptyComponent={
          !isFetching ? (
            <View style={s.empty}>
              <View style={[s.emptyIcon, { backgroundColor: W.primary + "10" }]}>
                <Ionicons name="business-outline" size={36} color={W.primary} />
              </View>
              <Text style={[s.emptyTitle, { color: W.text }]}>Aucun secteur trouvé</Text>
              <Text style={[s.emptySub, { color: W.muted }]}>Essayez un autre terme</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isFetching && page > 1 ? (
            <View style={s.loadMore}>
              <ActivityIndicator size="small" color={W.primary} />
            </View>
          ) : null
        }
        renderItem={({ item, index }: { item: Sector; index: number }) => (
          <ListItem item={item} index={index} isDark={isDark} W={W} onPress={() => handleGoto(item)} />
        )}
      />
    </View>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1 },

  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  loaderTxt:  { fontFamily: "NexaRegular", fontSize: 13 },

  /* Fixed glass header */
  header: {
    position: "absolute", top: 0, left: 0, right: 0,
    zIndex: 20, borderBottomWidth: 1,
    elevation: 8,
    shadowColor: "#000", shadowOpacity: 0.08,
    shadowRadius: 12, shadowOffset: { width: 0, height: 3 },
  },
  headerInner: {
    height: 62,
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoWrap:    { flex: 1, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "NexaRegular", fontSize: 17 },
  hSearchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    height: 44, borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 12, marginBottom: 8,
  },
  hSearchInput: { flex: 1, fontFamily: "NexaRegular", fontSize: 14, height: "100%" },
  notifBadge: {
    position: "absolute", top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: "#FF3B30",
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.94)",
  },
  notifBadgeTxt: { fontFamily: "NexaBold", fontSize: 9, color: "#fff" },

  /* Hero */
  hero: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 },
  heroTitle: { fontFamily: "NexaBold", fontSize: 32, letterSpacing: -0.5, marginBottom: 10 },
  heroRow:   { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  heroSub:   { fontFamily: "NexaRegular", fontSize: 13, opacity: 0.7 },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  pillTxt: { fontFamily: "NexaBold", fontSize: 11, letterSpacing: 0.4 },

  /* Search bar */
  searchBar: {
    flexDirection: "row", alignItems: "center",
    height: 48, borderRadius: 14, borderWidth: 1.5,
  },
  searchInput: { flex: 1, paddingHorizontal: 12, fontFamily: "NexaRegular", fontSize: 14, height: "100%" },

  /* Featured card */
  featCard: { width: 272, height: 360, borderRadius: 24, overflow: "hidden" },
  featContent: { flex: 1, justifyContent: "flex-end" },
  featBottom: { padding: 20 },
  featLabel: {
    fontFamily: "NexaRegular", fontSize: 10, color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 4,
  },
  featTitle: { fontFamily: "NexaBold", fontSize: 22, color: "#fff", marginBottom: 4 },
  featDesc:  {
    fontFamily: "NexaRegular", fontSize: 13, color: "rgba(255,255,255,0.8)",
    lineHeight: 18, marginBottom: 16,
  },
  featRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  featChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  featChipTxt: { fontFamily: "NexaRegular", fontSize: 12, color: "#fff" },
  featArrow:   { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  arrowWhite:  {
    backgroundColor: "#fff",
    elevation: 4, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8,
  },
  arrowGlass: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },

  /* Section */
  sectionRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingVertical: 18,
  },
  sectionTitle: { fontFamily: "NexaBold", fontSize: 18 },
  seeAll:       { flexDirection: "row", alignItems: "center", gap: 4 },
  seeAllTxt:    { fontFamily: "NexaBold", fontSize: 13 },

  /* List item */
  listItem: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 24, marginBottom: 12,
    borderRadius: 18, padding: 14, gap: 12, borderWidth: 1,
    elevation: 3,
    shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  listThumb: { width: 64, height: 64, borderRadius: 14, overflow: "hidden", flexShrink: 0 },
  listImg:   { width: "100%", height: "100%" },
  listBody:  { flex: 1 },
  listTop:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 },
  listName:  { fontFamily: "NexaBold", fontSize: 16, flex: 1, marginRight: 8 },
  listTag:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  listTagTxt: { fontFamily: "NexaBold", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  listDesc:  { fontFamily: "NexaRegular", fontSize: 13, opacity: 0.7, marginBottom: 5 },
  listMeta:  { flexDirection: "row", alignItems: "center", gap: 4 },
  metaMain:  { fontFamily: "NexaBold", fontSize: 11 },
  metaDot:   { width: 3, height: 3, borderRadius: 2 },
  metaSub:   { fontFamily: "NexaRegular", fontSize: 11, opacity: 0.7 },
  listArrow: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },

  /* Empty */
  empty:      { alignItems: "center", paddingTop: 40, paddingHorizontal: 24, gap: 10 },
  emptyIcon:  { width: 80, height: 80, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontFamily: "NexaBold", fontSize: 16 },
  emptySub:   { fontFamily: "NexaRegular", fontSize: 13, opacity: 0.7 },

  loadMore: { paddingVertical: 20, alignItems: "center" },
});
