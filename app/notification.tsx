import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetAllNotificationsQuery, useMarkAsReadMutation } from "@/services/notificationService";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useAppTheme } from "@/app/_layout";

/* ─── Skeleton card ─────────────────────────────────────────────────────── */
function SkeletonCard() {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[sk.card, { opacity: anim }]}>
      <View style={sk.icon} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={[sk.line, { width: "55%" }]} />
        <View style={[sk.line, { width: "85%" }]} />
        <View style={[sk.line, { width: "35%" }]} />
      </View>
    </Animated.View>
  );
}

const sk = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: "#fff", borderRadius: 20,
    padding: 14, marginBottom: 12,
    marginHorizontal: 20, gap: 12,
    borderWidth: 1, borderColor: "#E2E2E2",
  },
  icon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#F0F0F5" },
  line: { height: 11, borderRadius: 6, backgroundColor: "#EBEBF0" },
});

/* ─── Palette ──────────────────────────────────────────────────────────── */
const LIGHT = {
  bg:          "#F9F9F9",
  card:        "#FFFFFF",
  text:        "#1A1C1C",
  muted:       "#747688",
  input:       "#F3F3F4",
  border:      "#E2E2E2",
  primary:     "#0047FF",
  green:       "#059669",
  red:         "#DC2626",
  navBg:       "rgba(249,249,249,0.94)",
  unreadBg:    "#F0F4FF",
  unreadBorder:"rgba(0,71,255,0.12)",
};
const DARK: typeof LIGHT = {
  bg:          "#0B1220",
  card:        "#121A2B",
  text:        "#EAF0FF",
  muted:       "#9FB0D0",
  input:       "#182033",
  border:      "#1F2A44",
  primary:     "#4D8DFF",
  green:       "#22C55E",
  red:         "#FF5A5A",
  navBg:       "rgba(11,18,32,0.94)",
  unreadBg:    "rgba(77,141,255,0.08)",
  unreadBorder:"rgba(77,141,255,0.18)",
};

/* ─── Filters ──────────────────────────────────────────────────────────── */
const FILTERS = ["tout", "non lu", "lu"] as const;
type Filter = typeof FILTERS[number];

type SortOrder = "desc" | "asc";

/* ─── Strip old DB emoji from displayed text ───────────────────────────── */
const EMOJI_RE = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}️\u{1FA00}-\u{1FFFF}✅❌⚠️💸💳📦🚀]+/gu;
function stripEmoji(text: string) {
  return (text ?? "").replace(EMOJI_RE, "").trim();
}

/* ─── Type → icon + color ──────────────────────────────────────────────── */
function getTypeStyle(type?: string, title?: string, isDark?: boolean) {
  const t   = (type  ?? "").toUpperCase();
  const ttl = (title ?? "").toLowerCase();
  const W   = isDark ? DARK : LIGHT;
  if (t === "ERREUR" || ttl.includes("échec") || ttl.includes("annul") || ttl.includes("refus"))
    return { color: W.red,     bg: isDark ? "rgba(255,90,90,0.12)"   : "#FEF2F2", icon: "alert-circle-outline"    as any };
  if (ttl.includes("commission") || ttl.includes("reçu") || ttl.includes("activé") || ttl.includes("confirmé"))
    return { color: W.green,   bg: isDark ? "rgba(34,197,94,0.12)"   : "#ECFDF5", icon: "checkmark-circle-outline" as any };
  if (ttl.includes("transfert") || ttl.includes("envoyé") || ttl.includes("paiement"))
    return { color: W.primary, bg: isDark ? "rgba(77,141,255,0.12)"  : "#EEF2FF", icon: "send-outline"             as any };
  if (t === "SUCCESS")
    return { color: W.green,   bg: isDark ? "rgba(34,197,94,0.12)"   : "#ECFDF5", icon: "checkmark-circle-outline" as any };
  return   { color: W.primary, bg: isDark ? "rgba(77,141,255,0.12)"  : "#EEF2FF", icon: "notifications-outline"    as any };
}

/* ─── Notification Card ─────────────────────────────────────────────────── */
function NotifCardBase({
  item,
  index,
  onRead,
}: {
  item: any;
  index: number;
  onRead: (id: number) => void;
}) {
  const { isDark } = useAppTheme();
  const W = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(W), [isDark]);
  const scale  = useRef(new Animated.Value(1)).current;
  const opac   = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opac,   { toValue: 1, duration: 260, delay: Math.min(index * 35, 280), useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 260, delay: Math.min(index * 35, 280), useNativeDriver: true }),
    ]).start();
  }, []);

  const pIn  = () => Animated.spring(scale, { toValue: 0.975, friction: 8, useNativeDriver: true }).start();
  const pOut = () => Animated.spring(scale, { toValue: 1,     friction: 6, useNativeDriver: true }).start();

  const { color, bg, icon } = getTypeStyle(item.type, item.title, isDark);
  const isUnread = !item.isRead;
  const title    = stripEmoji(item.title);
  const message  = stripEmoji(item.message);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={pIn}
      onPressOut={pOut}
      onPress={() => isUnread && onRead(item.notificationId)}
    >
      <Animated.View style={[
        s.card,
        isUnread && s.cardUnread,
        { opacity: opac, transform: [{ translateY: slideY }, { scale }] },
      ]}>
        <View style={[s.iconWrap, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>

        <View style={s.cardBody}>
          <View style={s.cardTop}>
            <Text style={[s.cardTitle, isUnread && s.cardTitleBold]} numberOfLines={1}>
              {title}
            </Text>
            {isUnread && <View style={[s.unreadDot, { backgroundColor: W.primary }]} />}
          </View>
          <Text style={s.cardMsg} numberOfLines={2}>{message}</Text>
          <Text style={s.cardDate}>
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
const NotifCard = memo(NotifCardBase);

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function NotificationPage() {
  const { isDark } = useAppTheme();
  const W = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(W), [isDark]);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [userId,    setUserId]    = useState<string | null>(null);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState<Filter>("tout");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page,      setPage]      = useState(1);
  const [allItems,  setAllItems]  = useState<any[]>([]);
  const isRefreshingRef = useRef(false);

  const [markAsRead]  = useMarkAsReadMutation();
  const { unread: unreadBadge } = useUnreadNotifications();

  useEffect(() => {
    AsyncStorage.getItem("userId").then(id => { if (id) setUserId(id); });
  }, []);

  const isReadParam =
    filter === "non lu" ? "false" :
    filter === "lu"     ? "true"  : undefined;

  // reset list when filter/search/sort changes
  useEffect(() => {
    setPage(1);
    setAllItems([]);
  }, [search, filter, sortOrder]);

  const { data, isLoading, isFetching, refetch } = useGetAllNotificationsQuery(
    userId
      ? { userId, search, page, pageSize: 20, paginate: "true", isRead: isReadParam, sortOrder }
      : null,
    { skip: !userId }
  );

  const totalPages = data?.totalPages || 1;

  // true pendant que la 1re page charge (init ou changement de filtre)
  const showSkeleton = (isLoading || isFetching) && page === 1 && allItems.length === 0;

  useEffect(() => {
    if (!data?.data) return;
    if (page === 1 || isRefreshingRef.current) {
      setAllItems(data.data);
      isRefreshingRef.current = false;
    } else {
      setAllItems(prev => {
        const existing = new Set(prev.map((n: any) => n.notificationId));
        return [...prev, ...data.data.filter((n: any) => !existing.has(n.notificationId))];
      });
    }
  }, [data]);

  const onRefresh = useCallback(async () => {
    isRefreshingRef.current = true;
    setPage(1);
    await refetch();
  }, [refetch]);

  const loadMore = useCallback(() => {
    if (!isFetching && page < totalPages) setPage(p => p + 1);
  }, [isFetching, page, totalPages]);

  const handleRead = useCallback(async (id: number) => {
    await markAsRead(id);
    setAllItems(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
  }, [markAsRead]);

  const HEADER_H = insets.top + 62;

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

      {/* ── Fixed glass header ── */}
      <View style={[s.header, { paddingTop: insets.top }]}>
        <View style={s.headerInner}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[s.iconBtn, { backgroundColor: W.input, borderColor: W.border }]}
          >
            <Ionicons name="arrow-back" size={18} color={W.text} />
          </TouchableOpacity>

          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Notifications</Text>
          </View>

          <View style={s.notifWrap}>
            <View style={[s.iconBtn, { backgroundColor: W.input, borderColor: W.border }]}>
              <Ionicons name="notifications-outline" size={18} color={W.text} />
            </View>
            {unreadBadge > 0 && (
              <View style={s.notifBadge}>
                <Text style={s.notifBadgeTxt}>{unreadBadge > 99 ? "99+" : unreadBadge}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── Content ── */}
      {showSkeleton ? (
        <View style={{ flex: 1, marginTop: HEADER_H + 16 }}>
          <View style={{ height: 16 }} />
          {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={allItems}
          keyExtractor={(item: any) => `notif-${item.notificationId}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && page === 1}
              onRefresh={onRefresh}
              colors={[W.primary]}
              tintColor={W.primary}
              progressViewOffset={HEADER_H}
            />
          }
          ListHeaderComponent={
            <View>
              <View style={{ height: HEADER_H + 16 }} />

              {/* Search bar */}
              <View style={s.searchBar}>
                <Ionicons name="search-outline" size={18} color={W.muted} />
                <TextInput
                  placeholder="Rechercher une notification..."
                  placeholderTextColor={W.muted}
                  value={search}
                  onChangeText={setSearch}
                  style={s.searchInput}
                  autoCorrect={false}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch("")}>
                    <Ionicons name="close-circle" size={18} color={W.muted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filters row */}
              <View style={s.filtersRow}>
                {/* Filter chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.chipRow}
                >
                  {FILTERS.map(f => {
                    const active = filter === f;
                    return (
                      <TouchableOpacity
                        key={f}
                        style={[s.chip, {
                          backgroundColor: active ? W.primary : W.card,
                          borderColor:     active ? W.primary : W.border,
                        }]}
                        onPress={() => setFilter(f)}
                        activeOpacity={0.82}
                      >
                        <Text style={[s.chipTxt, { color: active ? "#fff" : W.muted }]}>
                          {f === "tout" ? "Tout" : f === "non lu" ? "Non lu" : "Lu"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Sort toggle */}
                <TouchableOpacity
                  style={s.sortBtn}
                  onPress={() => setSortOrder(o => o === "desc" ? "asc" : "desc")}
                  activeOpacity={0.82}
                >
                  <Ionicons
                    name={sortOrder === "desc" ? "arrow-down-outline" : "arrow-up-outline"}
                    size={14}
                    color={W.primary}
                  />
                  <Text style={s.sortTxt}>
                    {sortOrder === "desc" ? "Récent" : "Ancien"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Count */}
              <View style={s.countRow}>
                <Text style={s.countTxt}>
                  {allItems.length} NOTIFICATION{allItems.length !== 1 ? "S" : ""}
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            (!isLoading && !isFetching) ? (
              <View style={s.empty}>
                <View style={s.emptyIcon}>
                  <Ionicons name="notifications-off-outline" size={36} color={W.muted} />
                </View>
                <Text style={s.emptyTitle}>Aucune notification</Text>
                <Text style={s.emptyDesc}>
                  {filter === "non lu" ? "Vous avez tout lu !" : "Vous n'avez pas encore de notifications"}
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            isFetching && page > 1 ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color={W.primary} />
              </View>
            ) : null
          }
          renderItem={({ item, index }: any) => (
            <NotifCard item={item} index={index} onRead={handleRead} />
          )}
        />
      )}
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
function mkS(W: typeof LIGHT) { return StyleSheet.create({
  root:       { flex: 1, backgroundColor: W.bg },
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center" },

  /* Header */
  header: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
    backgroundColor: W.navBg,
    borderBottomWidth: 1, borderBottomColor: W.border,
    elevation: 6, shadowColor: "#000", shadowOpacity: 0.05,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  headerInner: {
    height: 62, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 20,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle:  { fontFamily: "NexaRegular", fontSize: 17, color: W.text },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  notifWrap:    { position: "relative" },
  notifBadge: {
    position: "absolute", top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: W.primary,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 2, borderColor: W.navBg,
  },
  notifBadgeTxt: { fontFamily: "NexaBold", fontSize: 9, color: "#fff" },

  /* Search */
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    height: 52, backgroundColor: W.card,
    borderRadius: 18, paddingHorizontal: 16,
    marginHorizontal: 20, marginBottom: 14,
    borderWidth: 1, borderColor: W.border,
    elevation: 2, shadowColor: "#000",
    shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  searchInput: { flex: 1, fontFamily: "NexaRegular", fontSize: 14, color: W.text },

  /* Filters row */
  filtersRow: {
    flexDirection: "row", alignItems: "center",
    paddingRight: 20, marginBottom: 10,
  },
  chipRow: { paddingLeft: 20, gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1,
  },
  chipTxt: { fontFamily: "NexaBold", fontSize: 12 },
  sortBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1,
    borderColor: W.primary + "40",
    backgroundColor: W.primary + "0A",
    flexShrink: 0,
  },
  sortTxt: { fontFamily: "NexaBold", fontSize: 11, color: W.primary },

  /* Count */
  countRow: { paddingHorizontal: 20, marginBottom: 10 },
  countTxt: { fontFamily: "NexaRegular", fontSize: 11, color: W.muted, letterSpacing: 0.4 },

  /* List */
  listContent: { paddingBottom: 110 },

  /* Card */
  card: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: W.card, borderRadius: 20,
    padding: 14, marginBottom: 12,
    marginHorizontal: 20, gap: 12,
    borderWidth: 1, borderColor: W.border,
    overflow: "hidden",
    elevation: 2, shadowColor: "#000",
    shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardUnread: {
    backgroundColor: W.unreadBg,
    borderColor: W.unreadBorder,
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardBody:       { flex: 1 },
  cardTop:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  cardTitle:      { fontFamily: "NexaRegular", fontSize: 14, color: W.text, flex: 1 },
  cardTitleBold:  { fontFamily: "NexaBold" },
  unreadDot:      { width: 8, height: 8, borderRadius: 4, marginLeft: 6, flexShrink: 0 },
  cardMsg:        { fontFamily: "NexaRegular", fontSize: 13, color: W.muted, lineHeight: 18, marginBottom: 6 },
  cardDate:       { fontFamily: "NexaRegular", fontSize: 11, color: "#AAB4C8" },

  /* Empty */
  empty:      { alignItems: "center", paddingTop: 60, gap: 10, paddingHorizontal: 24 },
  emptyIcon:  { width: 72, height: 72, borderRadius: 24, backgroundColor: W.input, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontFamily: "NexaBold", fontSize: 15, color: W.text },
  emptyDesc:  { fontFamily: "NexaRegular", fontSize: 13, color: W.muted, textAlign: "center" },
}); }
