import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState, useEffect } from "react";
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
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Rect,
  Circle,
  Path,
  Polygon,
} from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetAllProductsQuery } from "@/services/productServices";
import NoData from "@/components/ui/noData";
import { API_URL_BASE } from "@/constants/api";

/* ─── THEME ──────────────────────────────────────────────────────────── */
const C = {
  primary:   "#0353CC",
  violet:    "#3906C7",
  deep:      "#302E99",
  accent:    "#4D96FF",
  gold:      "#C9A84C",
  goldLight: "#F0D080",
  white:     "#FFFFFF",
};

const Colors = {
  light: {
    bg:            "#F0F4FF",
    card:          "#FFFFFF",
    text:          "#0D1B3E",
    textSecondary: "#7B8DB0",
    border:        "rgba(3,83,204,0.10)",
    inputBg:       "rgba(3,83,204,0.05)",
    searchBg:      "#FFFFFF",
    imageFallback: ["#EEF1FA", "#DDE3F5"] as [string, string],
    headerGrad:    [C.deep, C.primary] as [string, string],
    shadow:        C.primary,
    ratingBg:      "rgba(255,255,255,0.92)",
    divider:       "rgba(3,83,204,0.08)",
  },
  dark: {
    bg:            "#07091A",
    card:          "#0F1228",
    text:          "#E2E8F0",
    textSecondary: "#556080",
    border:        "rgba(77,150,255,0.10)",
    inputBg:       "rgba(77,150,255,0.07)",
    searchBg:      "#0F1228",
    imageFallback: ["#111827", "#1a2040"] as [string, string],
    headerGrad:    ["#05081A", "#0D1535"] as [string, string],
    shadow:        "#000000",
    ratingBg:      "rgba(15,18,40,0.90)",
    divider:       "rgba(255,255,255,0.06)",
  },
};

function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

/* ─── SVG COMPONENTS ─────────────────────────────────────────────────── */
function HotelBadge() {
  return (
    <Svg width={44} height={44} viewBox="0 0 48 48">
      <Defs>
        <SvgGradient id="hotelBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={C.deep} />
          <Stop offset="1" stopColor={C.violet} />
        </SvgGradient>
      </Defs>
      <Rect x={0} y={0} width={48} height={48} rx={14} fill="url(#hotelBg)" />
      <Circle cx={18} cy={20} r={7} stroke={C.gold} strokeWidth={3} fill="none" />
      <Circle cx={18} cy={20} r={3} fill={C.gold} opacity={0.6} />
      <Path d="M23 24l12 12" stroke={C.gold} strokeWidth={3} strokeLinecap="round" />
      <Path d="M30 31v4M34 33v3" stroke={C.gold} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function StarRating({ count = 4 }: { count?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 3 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Svg key={i} width={12} height={12} viewBox="0 0 24 24">
          <Polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill={i < count ? C.gold : "rgba(201,168,76,0.2)"}
            stroke={i < count ? C.gold : "rgba(201,168,76,0.3)"}
            strokeWidth={1}
          />
        </Svg>
      ))}
    </View>
  );
}

function MoonIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill={C.gold} opacity={0.85} />
    </Svg>
  );
}

function ArrowIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 18 18">
      <Path
        d="M3 9h12M11 5l4 4-4 4"
        stroke={C.white} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </Svg>
  );
}

function DecoCircle({ size, opacity }: { size: number; opacity: number }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={C.white} opacity={opacity} />
    </Svg>
  );
}

function DecoStar({ size, opacity }: { size: number; opacity: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill={C.white} opacity={opacity}
      />
    </Svg>
  );
}

/* ─── AMENITY CHIP ───────────────────────────────────────────────────── */
function AmenityChip({
  icon, label, isDark, t,
}: {
  icon: string; label: string; isDark: boolean; t: typeof Colors.light;
}) {
  return (
    <View style={[
      ac.chip,
      {
        backgroundColor: t.inputBg,
        borderColor: t.border,
      },
    ]}>
      <Ionicons name={icon as any} size={11} color={C.primary} />
      <Text style={[ac.label, { color: C.primary }]}>{label}</Text>
    </View>
  );
}

/* ─── HOTEL CARD ─────────────────────────────────────────────────────── */
function HotelCard({
  item, onPress, isDark, t, index,
}: {
  item: any; onPress: () => void; isDark: boolean; t: typeof Colors.light; index: number;
}) {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const slideY    = useRef(new Animated.Value(24)).current;
  const opac      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 380, delay: Math.min(index * 80, 400), useNativeDriver: true }),
      Animated.timing(opac,   { toValue: 1, duration: 380, delay: Math.min(index * 80, 400), useNativeDriver: true }),
    ]).start();
  }, []);

  const pressIn  = () => Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true }).start();

  const stars    = item.productId ? ((item.productId % 3) + 3) : 4;
  const imageUri = item.imageUrl ? `${API_URL_BASE}${item.imageUrl}` : null;

  return (
    <Animated.View style={[
      cs.wrapper,
      {
        backgroundColor: t.card,
        borderColor: isDark ? t.border : "transparent",
        borderWidth: isDark ? 1 : 0,
        shadowColor: t.shadow,
        opacity: opac,
        transform: [{ translateY: slideY }, { scale: pressAnim }],
      },
      isDark && cs.wrapperDark,
    ]}>
      <TouchableOpacity activeOpacity={1} onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>

        {/* ── Image ── */}
        <View style={cs.imageWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={cs.image} contentFit="cover" transition={300} />
          ) : (
            <LinearGradient colors={t.imageFallback} style={cs.imageFallback}>
              <Svg width={72} height={72} viewBox="0 0 48 48">
                <Rect x={8} y={16} width={32} height={28} rx={2} fill={C.primary} opacity={isDark ? 0.3 : 0.15} />
                <Polygon points="24,6 6,18 42,18" fill={C.primary} opacity={isDark ? 0.35 : 0.2} />
                <Rect x={20} y={32} width={8} height={12} rx={1} fill={C.primary} opacity={isDark ? 0.4 : 0.25} />
                <Rect x={11} y={22} width={6} height={5} rx={1} fill={C.primary} opacity={isDark ? 0.3 : 0.2} />
                <Rect x={21} y={22} width={6} height={5} rx={1} fill={C.primary} opacity={isDark ? 0.3 : 0.2} />
                <Rect x={31} y={22} width={6} height={5} rx={1} fill={C.primary} opacity={isDark ? 0.3 : 0.2} />
              </Svg>
            </LinearGradient>
          )}

          {imageUri && (
            <LinearGradient
              colors={["transparent", isDark ? "rgba(7,9,26,0.80)" : "rgba(13,27,62,0.62)"]}
              style={cs.imageOverlay}
            />
          )}

          <View style={cs.badgePos}>
            <HotelBadge />
          </View>

          <View style={[cs.ratingPos, { backgroundColor: t.ratingBg }]}>
            <StarRating count={stars} />
          </View>

          <View style={cs.imageNameWrap}>
            <Text style={cs.imageName} numberOfLines={1}>{item.name}</Text>
          </View>
        </View>

        {/* ── Content ── */}
        <View style={cs.content}>
          <Text style={[cs.desc, { color: t.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={cs.amenities}>
            <AmenityChip icon="wifi-outline"       label="Wi-Fi"      isDark={isDark} t={t} />
            <AmenityChip icon="restaurant-outline" label="Restaurant" isDark={isDark} t={t} />
            <AmenityChip icon="car-outline"        label="Parking"    isDark={isDark} t={t} />
          </View>

          <View style={[cs.divider, { backgroundColor: t.divider }]} />

          <View style={cs.footer}>
            <View style={cs.priceBlock}>
              <MoonIcon />
              <View>
                <Text style={[cs.price, { color: t.text }]}>
                  {item.price}{" "}
                  <Text style={cs.priceCurrency}>{item.currency?.code || "EC"}</Text>
                </Text>
                <Text style={[cs.priceLabel, { color: t.textSecondary }]}>par nuit</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
              <LinearGradient
                colors={[C.deep, C.violet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={cs.btn}
              >
                <Text style={cs.btnText}>Réserver</Text>
                <ArrowIcon />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function HotelsList() {
  const router   = useRouter();
  const { id }   = useLocalSearchParams();
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

  const loadMore = () => {
    if (data?.totalPages && page < data.totalPages && !isFetching) setPage(page + 1);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await refetch();
    setRefreshing(false);
  };

  const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const handleSearchClear  = () => { setSearch(""); setPage(1); };

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER ── */}
      <View style={[s.header, { shadowColor: t.shadow }]}>
        <LinearGradient
          colors={t.headerGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Gold warmth overlay for hotel theme */}
        <View style={s.goldOverlay} />

        {/* Décos */}
        <View style={{ position: "absolute", top: -40, right: -40 }}>
          <DecoCircle size={200} opacity={0.06} />
        </View>
        <View style={{ position: "absolute", bottom: -30, left: -30 }}>
          <DecoCircle size={130} opacity={0.04} />
        </View>
        <View style={{ position: "absolute", top: 48, right: 80 }}>
          <DecoStar size={20} opacity={0.12} />
        </View>
        <View style={{ position: "absolute", top: 72, right: 50 }}>
          <DecoStar size={12} opacity={0.08} />
        </View>
        <View style={{ position: "absolute", top: 56, left: 100 }}>
          <DecoStar size={16} opacity={0.07} />
        </View>

        <SafeAreaView edges={["top"]}>
          <View style={s.topBar}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={C.white} />
            </TouchableOpacity>

            <View style={s.titleWrap}>
              <Svg width={14} height={14} viewBox="0 0 48 48" style={{ marginRight: 6 }}>
                <Circle cx={18} cy={20} r={9} stroke={C.goldLight} strokeWidth={4} fill="none" />
                <Path d="M24 26l14 14M33 35v5M37 37v4" stroke={C.goldLight} strokeWidth={3.5} strokeLinecap="round" />
              </Svg>
              <Text style={s.headerTitle}>BIM HÔTELLERIE</Text>
            </View>

            <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/notification")}>
              <Ionicons name="notifications-outline" size={20} color={C.white} />
            </TouchableOpacity>
          </View>

          <Text style={s.headerSub}>Séjournez dans les meilleurs établissements</Text>

          {/* Search */}
          <View style={[s.searchWrap, { backgroundColor: t.searchBg, borderColor: t.border, shadowColor: t.shadow }]}>
            <View style={[s.searchIconWrap, { backgroundColor: t.inputBg }]}>
              <Ionicons name="search-outline" size={14} color={C.primary} />
            </View>
            <TextInput
              style={[s.searchInput, { color: t.text }]}
              placeholder="Rechercher un hôtel ou destination…"
              placeholderTextColor={t.textSecondary}
              value={search}
              onChangeText={handleSearchChange}
              autoCorrect={false}
              blurOnSubmit={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={handleSearchClear}>
                <Ionicons name="close-circle" size={17} color={t.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </View>

      {/* ── LIST ── */}
      {dataList.length === 0 && !isFetching ? (
        <View style={s.noData}>
          <NoData />
        </View>
      ) : (
        <FlatList
          data={dataList}
          keyExtractor={(item) => `${item.productId}`}
          contentContainerStyle={[s.list, { backgroundColor: t.bg }]}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? C.accent : C.violet}
              colors={[C.violet]}
            />
          }
          ListFooterComponent={
            isFetching ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <Ionicons name="ellipsis-horizontal" size={24} color={isDark ? C.accent : C.primary} />
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <HotelCard
              item={item}
              index={index}
              isDark={isDark}
              t={t}
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
    paddingBottom: 20,
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },

  /* Subtle gold warmth to reinforce hotel luxury feel */
  goldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(201,168,76,0.04)",
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 8,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  titleWrap: { flexDirection: "row", alignItems: "center" },
  headerTitle: {
    color: C.white, fontSize: 16,
    fontFamily: "NexaLight", letterSpacing: 1.5,
  },
  headerSub: {
    color: "rgba(255,255,255,0.60)",
    fontFamily: "NexaLight", fontSize: 12,
    paddingHorizontal: 20, marginTop: 8, marginBottom: 14,
    textAlign: "center",
  },

  searchWrap: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, marginHorizontal: 16,
    paddingHorizontal: 12, paddingVertical: 10,
    gap: 10, elevation: 4, borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 10,
  },
  searchIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  searchInput: {
    flex: 1, fontFamily: "NexaLight", fontSize: 13,
  },

  list:   { padding: 16, paddingBottom: 60 },
  noData: { flex: 1, justifyContent: "center", alignItems: "center" },
});

const cs = StyleSheet.create({
  wrapper: {
    borderRadius: 22,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 12,
  },
  wrapperDark: {
    elevation: 8,
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },

  imageWrap:     { width: "100%", height: 200, position: "relative" },
  image:         { width: "100%", height: "100%" },
  imageFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  imageOverlay:  { ...StyleSheet.absoluteFillObject, top: "30%" },

  badgePos: {
    position: "absolute", top: 12, left: 12,
    elevation: 4,
    shadowColor: C.deep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35, shadowRadius: 6,
  },
  ratingPos: {
    position: "absolute", top: 16, right: 12,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    flexDirection: "row", alignItems: "center",
  },
  imageNameWrap: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  imageName: {
    color: C.white, fontFamily: "NexaLight",
    fontSize: 19, letterSpacing: 0.3,
  },

  content: { padding: 16 },

  desc: {
    fontFamily: "NexaLight", fontSize: 13,
    lineHeight: 19, marginBottom: 12,
  },

  amenities: {
    flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 12,
  },

  divider: { height: 1, marginBottom: 12 },

  footer: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  priceBlock: {
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  price: {
    fontFamily: "NexaLight", fontSize: 18,
  },
  priceCurrency: { fontSize: 12, color: C.gold },
  priceLabel: {
    fontFamily: "NexaLight", fontSize: 10,
    letterSpacing: 0.3, marginTop: -2,
  },

  btn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 14, elevation: 4,
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.30, shadowRadius: 8,
  },
  btnText: {
    color: C.white, fontFamily: "NexaLight",
    fontSize: 13, letterSpacing: 0.3,
  },
});

const ac = StyleSheet.create({
  chip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  label: {
    fontFamily: "NexaLight", fontSize: 10, letterSpacing: 0.3,
  },
});