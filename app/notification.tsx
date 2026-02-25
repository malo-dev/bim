import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Animated,
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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/themed-text";
import { useGetAllNotificationsQuery } from "@/services/notificationService";
import HomeSkeleton from "@/components/skeleton/HomeSkeleton";
import NotFound from "@/components/ui/noData";
import { Colors } from "@/constants/theme";

/* ─── Hook thème (même pattern) ─────────────────────────────────────── */
function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

/* ─── PALETTE BRAND (fixe) ───────────────────────────────────────────── */
const B = {
  primary: "#0353CC",
  violet:  "#3906C7",
  deep:    "#302E99",
  accent:  "#4D96FF",
  gold:    "#FFD700",
  white:   "#FFFFFF",
  muted:   "#7B8DB0",
};

/* ─── BADGE TYPE ─────────────────────────────────────────────────────── */
const TYPE_META: Record<string, { icon: any; color: string }> = {
  SUCCESS: { icon: "checkmark-circle",   color: "#22C55E" },
  ERREUR:  { icon: "close-circle",       color: "#EF4444" },
  INFO:    { icon: "information-circle", color: B.accent  },
  DEFAULT: { icon: "notifications",      color: B.primary },
};

function typeMeta(type?: string) {
  return TYPE_META[type ?? ""] ?? TYPE_META.DEFAULT;
}

/* ─── NOTIFICATION CARD ──────────────────────────────────────────────── */
function NotifCard({ item, isDark, t }: { item: any; isDark: boolean; t: any }) {
  const meta  = typeMeta(item.type);
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  /* Couleurs carte selon thème + état lu/non lu */
  const cardBg = item.isRead
    ? isDark ? "rgba(30,42,60,0.70)" : "rgba(255,255,255,0.75)"
    : isDark ? "#1E2D45"             : "#E8F0FF";

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[
        s.card,
        { backgroundColor: cardBg },
        isDark && {
          borderWidth: 1,
          borderColor: item.isRead
            ? "rgba(77,150,255,0.08)"
            : "rgba(77,150,255,0.18)",
        },
        { transform: [{ scale }] },
      ]}>
        <View style={[s.iconWrap, { backgroundColor: meta.color + "22" }]}>
          <Ionicons name={meta.icon} size={24} color={meta.color} />
        </View>

        <View style={s.cardContent}>
          <View style={s.cardTop}>
            <Text
              style={[
                s.cardTitle,
                { color: isDark ? t.text : "#0D1B3E" },
                { opacity: item.isRead ? 0.65 : 1 },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {!item.isRead && (
              <View style={[s.unreadDot, { backgroundColor: isDark ? B.accent : B.primary }]} />
            )}
          </View>

          <Text style={[s.cardMsg, { color: isDark ? t.textSecondary : B.muted }]} numberOfLines={2}>
            {item.message}
          </Text>

          <Text style={[s.cardDate, { color: isDark ? "rgba(148,163,184,0.6)" : "#AAB4C8" }]}>
            {new Date(item.createdAt || item.date).toLocaleString("fr-FR", {
              day: "2-digit", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ─── FOOTER LOADER ──────────────────────────────────────────────────── */
function FooterLoader({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return <View style={{ paddingVertical: 16 }}><HomeSkeleton /></View>;
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────────── */
export default function NotificationPage() {
  const router = useRouter();
  const { isDark, t } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [userId,     setUserId]     = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [allItems,   setAllItems]   = useState<any[]>([]);

  const isRefreshingRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem("userId").then((id) => { if (id) setUserId(id); });
  }, []);

  useEffect(() => {
    setPage(1);
    setAllItems([]);
  }, [search]);

  const { data, isLoading, isFetching, refetch } = useGetAllNotificationsQuery(
    userId ? { userId, search, page, pageSize: 20, paginate: "true" } : null,
    { skip: !userId }
  );

  const totalPages  = data?.totalPages || 1;
  const unreadCount = allItems.filter((n: any) => !n.isRead).length;

  /* ── accumulate pages ── */
  useEffect(() => {
    if (!data?.data) return;
    if (page === 1 || isRefreshingRef.current) {
      setAllItems(data.data);
    } else {
      setAllItems((prev) => {
        const existingIds = new Set(prev.map((n: any) => n.notificationId));
        const newItems = data.data.filter((n: any) => !existingIds.has(n.notificationId));
        return [...prev, ...newItems];
      });
    }
  }, [data]);

  /* ── pull-to-refresh ── */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    isRefreshingRef.current = true;
    setPage(1);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, [refetch]);

  /* ── infinite scroll ── */
  const loadMore = useCallback(() => {
    if (!isFetching && page < totalPages) setPage((p) => p + 1);
  }, [isFetching, page, totalPages]);

  /* ── header animations ── */
  const headerH = scrollY.interpolate({ inputRange: [0, 80], outputRange: [220, 130], extrapolate: "clamp" });
  const titleOp = scrollY.interpolate({ inputRange: [0, 60], outputRange: [1, 0],     extrapolate: "clamp" });
  const subOp   = scrollY.interpolate({ inputRange: [0, 40], outputRange: [1, 0],     extrapolate: "clamp" });

  /* ── gradients selon thème ── */
  const headerGradient: [string, string] = isDark
    ? ["#1A1F3A", "#0A1628"]
    : [B.deep, B.primary];

  const rootBg    = isDark ? t.background : B.primary;
  const searchBg  = isDark ? "#1E2A3A"    : B.white;
  const searchText = isDark ? t.text      : "#0D1B3E";
  const searchPh   = isDark ? "rgba(148,163,184,0.5)" : B.muted;
  const searchIcon = isDark ? "#93C5FD"   : B.muted;

  return (
    <View style={[s.root, { backgroundColor: rootBg }]}>
      <StatusBar barStyle="light-content" />

      {/* ── ANIMATED HEADER ── */}
      <Animated.View style={[s.headerWrap, {
        height: headerH,
        shadowColor: isDark ? "#000" : B.primary,
      }]}>
        <LinearGradient
          colors={headerGradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Déco circles */}
        <View style={[s.deco1, {
          backgroundColor: isDark ? "rgba(77,150,255,0.10)" : "rgba(255,255,255,0.06)",
          borderWidth: isDark ? 1 : 0,
          borderColor: "rgba(77,150,255,0.15)",
        }]} />
        <View style={[s.deco2, {
          backgroundColor: isDark ? "rgba(57,6,199,0.18)" : "rgba(255,255,255,0.04)",
        }]} />

        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={B.white} />
          </TouchableOpacity>

          <Text style={s.headerTitle}>Notifications</Text>

          {unreadCount > 0 ? (
            <View style={[s.badge, { backgroundColor: isDark ? B.accent : B.gold }]}>
              <Text style={[s.badgeText, { color: isDark ? B.white : B.deep }]}>
                {unreadCount}
              </Text>
            </View>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* Subtitle */}
        <Animated.View style={{ opacity: subOp, paddingHorizontal: 20, marginTop: 2 }}>
          <Text style={s.headerSub}>Toutes vos notifications BIM</Text>
        </Animated.View>

        {/* Search */}
        <Animated.View style={[s.searchWrap, { opacity: titleOp }]}>
          <View style={[s.searchBox, {
            backgroundColor: searchBg,
            borderWidth: isDark ? 1 : 0,
            borderColor: "rgba(77,150,255,0.20)",
          }]}>
            <Ionicons name="search" size={18} color={searchIcon} />
            <TextInput
              placeholder="Rechercher une notification…"
              placeholderTextColor={searchPh}
              value={search}
              onChangeText={setSearch}
              style={[s.searchInput, { color: searchText }]}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color={searchIcon} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </Animated.View>

      {/* ── CONTENT ── */}
      {isLoading && page === 1 && !refreshing ? (
        <HomeSkeleton />
      ) : allItems.length === 0 && !isFetching ? (
        <Animated.ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={B.white}
              colors={[B.white]}
            />
          }
        >
          <NotFound />
        </Animated.ScrollView>
      ) : (
        <Animated.FlatList
          data={allItems}
          keyExtractor={(item: any) => item.notificationId.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}

          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={B.white}
              colors={[B.white]}
              progressBackgroundColor={isDark ? "#1A1F3A" : B.primary}
            />
          }

          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={<FooterLoader visible={isFetching && page > 1} />}

          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}

          renderItem={({ item }: { item: any }) => (
            <NotifCard item={item} isDark={isDark} t={t} />
          )}
        />
      )}
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1 },

  headerWrap: {
    width: "100%",
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    zIndex: 10,
  },

  deco1: {
    position: "absolute", width: 180, height: 180,
    borderRadius: 90,
    top: -50, right: -40,
  },
  deco2: {
    position: "absolute", width: 120, height: 120,
    borderRadius: 60,
    bottom: -20, left: -20,
  },

  topBar: {
    marginTop: Platform.OS === "ios" ? 52 : 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },

  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },

  headerTitle: {
    color: B.white, fontSize: 18,
    fontFamily: "NexaLight", letterSpacing: 0.3,
  },

  badge: {
    minWidth: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 13, fontFamily: "NexaLight" },

  headerSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13, fontFamily: "NexaLight",
  },

  searchWrap: { paddingHorizontal: 20, marginTop: 14 },

  searchBox: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, paddingHorizontal: 14,
    height: 46, gap: 10,
  },

  searchInput: {
    flex: 1, fontFamily: "NexaLight", fontSize: 13,
  },

  list: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 40 },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },

  iconWrap: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },

  cardContent: { flex: 1 },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  cardTitle: {
    fontSize: 14, fontFamily: "NexaLight", flex: 1,
  },

  unreadDot: {
    width: 8, height: 8, borderRadius: 4, marginLeft: 6,
  },

  cardMsg: {
    fontSize: 13, fontFamily: "NexaLight",
    marginBottom: 6, lineHeight: 18,
  },

  cardDate: {
    fontSize: 11, fontFamily: "NexaLight",
  },
});