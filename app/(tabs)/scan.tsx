import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetAllTransactionsQuery } from "@/services/tsxService";
import { useGetUserByIdQuery } from "@/services/userService";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { Ionicons } from "@expo/vector-icons";
import { useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
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
import { useAppTheme } from "@/app/_layout";

/* ─── Palette ─────────────────────────────────────────────────────────── */
const LIGHT = {
  bg:       "#F9F9F9",
  card:     "#FFFFFF",
  text:     "#1A1C1C",
  muted:    "#747688",
  input:    "#F3F3F4",
  border:   "#E2E2E2",
  primary:  "#0047FF",
  green:    "#059669",
  red:      "#DC2626",
  amber:    "#D97706",
  headerBg: "rgba(249,249,249,0.94)",
  qrBg:     "rgba(255,255,255,0.85)",
  qrBord:   "rgba(255,255,255,0.70)",
  bgRed:    "#FEF2F2",
  bgAmber:  "#FFFBEB",
  bgGreen:  "#ECFDF5",
  bgBlue:   "#EEF2FF",
  skeleton: "#E4E8F0",
};
const DARK: typeof LIGHT = {
  bg:       "#0B1220",
  card:     "#1A2540",
  text:     "#EAF0FF",
  muted:    "#6B7A99",
  input:    "#0F1A2E",
  border:   "rgba(31,42,68,0.80)",
  primary:  "#4D8DFF",
  green:    "#059669",
  red:      "#DC2626",
  amber:    "#D97706",
  headerBg: "rgba(11,18,32,0.94)",
  qrBg:     "rgba(26,37,64,0.85)",
  qrBord:   "rgba(31,42,68,0.80)",
  bgRed:    "#2D1515",
  bgAmber:  "#2D2510",
  bgGreen:  "#0F2D1E",
  bgBlue:   "#0F1E3D",
  skeleton: "#1A2540",
};

/* ─── Filters ─────────────────────────────────────────────────────────── */
const FILTERS = ["tout", "réussi", "échoué", "en attente"] as const;
type Filter = typeof FILTERS[number];

/* ─── Transaction style helper ─────────────────────────────────────────── */
function getTxStyle(status: string, amount: number, C: typeof LIGHT) {
  if (status === "échoué")
    return { color: C.red,     bgIcon: C.bgRed,   icon: "close-circle"     as any };
  if (status === "en attente")
    return { color: C.amber,   bgIcon: C.bgAmber, icon: "time"             as any };
  if ((amount ?? 0) >= 0)
    return { color: C.green,   bgIcon: C.bgGreen, icon: "checkmark-circle" as any };
  return    { color: C.primary, bgIcon: C.bgBlue,  icon: "send"             as any };
}

/* ─── Transaction Card ─────────────────────────────────────────────────── */
function TrxCardBase({ item, index }: { item: any; index: number }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const slideY = useRef(new Animated.Value(20)).current;
  const opac   = useRef(new Animated.Value(0)).current;
  const scale  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 340, delay: Math.min(index * 45, 350), useNativeDriver: true }),
      Animated.timing(opac,   { toValue: 1, duration: 340, delay: Math.min(index * 45, 350), useNativeDriver: true }),
    ]).start();
  }, []);

  const pIn  = () => Animated.spring(scale, { toValue: 0.97, friction: 8, useNativeDriver: true }).start();
  const pOut = () => Animated.spring(scale, { toValue: 1,    friction: 6, useNativeDriver: true }).start();

  const { color, bgIcon, icon } = getTxStyle(item.status, item.amount, C);
  const amt     = item.amount ?? 0;
  const amtText = `${amt >= 0 ? "+" : ""}${amt.toLocaleString("fr-FR")} EC`;

  const statusLabel =
    item.status === "réussi"     ? "réussi"     :
    item.status === "échoué"     ? "échoué"     :
    item.status === "en attente" ? "en attente" : (item.status ?? "");

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={pIn} onPressOut={pOut}>
      <Animated.View style={[s.txCard, { opacity: opac, transform: [{ translateY: slideY }, { scale }] }]}>

        <View style={[s.txIcon, { backgroundColor: bgIcon }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>

        <View style={s.txBody}>
          <Text style={s.txName} numberOfLines={1}>
            {item?.user?.username || item?.receiver?.username || "Utilisateur"}
          </Text>
          <Text style={s.txDesc} numberOfLines={1}>
            {item.description || "Aucune description"}
          </Text>
          <View style={s.txDateRow}>
            <Ionicons name="calendar-outline" size={11} color={C.muted} />
            <Text style={s.txDate}>
              {new Date(item.createdAt).toLocaleDateString("fr-FR", {
                day: "2-digit", month: "short", year: "numeric",
              })}
            </Text>
          </View>
        </View>

        <View style={s.txRight}>
          <Text style={[s.txAmount, { color }]}>{amtText}</Text>
          <View style={[s.txBadge, { backgroundColor: bgIcon }]}>
            <Text style={[s.txBadgeTxt, { color }]}>{statusLabel}</Text>
          </View>
        </View>

      </Animated.View>
    </TouchableOpacity>
  );
}
const TrxCard = memo(TrxCardBase);

/* ─── Skeleton helpers ───────────────────────────────────────────────── */
function SkS({ w, h, r = 6, bg }: { w: number | string; h: number; r?: number; bg: string }) {
  return <View style={{ width: w as any, height: h, borderRadius: r, backgroundColor: bg }} />;
}

function ScanSkeleton({ C, insets }: { C: typeof LIGHT; insets: { top: number; bottom: number } }) {
  const sk = C.skeleton;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar translucent backgroundColor="transparent" />
      {/* Fake glass header */}
      <View style={{
        paddingTop: insets.top + 14,
        paddingBottom: 14,
        paddingHorizontal: 16,
        backgroundColor: C.card,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: sk }} />
        <SkS w={120} h={14} r={6} bg={sk} />
        <View style={{ flex: 1 }} />
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: sk }} />
      </View>
      {/* Fake QR card */}
      <View style={{
        margin: 16,
        borderRadius: 20,
        backgroundColor: C.card,
        padding: 24,
        alignItems: "center",
        gap: 16,
      }}>
        <View style={{ width: 160, height: 160, borderRadius: 16, backgroundColor: sk }} />
        <SkS w={100} h={12} r={5} bg={sk} />
        <SkS w={160} h={10} r={5} bg={sk} />
      </View>
      {/* Fake filter pills */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 12 }}>
        {[60, 70, 55, 80].map((w, i) => (
          <View key={i} style={{ width: w, height: 30, borderRadius: 15, backgroundColor: sk }} />
        ))}
      </View>
      {/* Fake transaction rows */}
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={{
          flexDirection: "row",
          alignItems: "center",
          marginHorizontal: 16,
          marginBottom: 10,
          backgroundColor: C.card,
          borderRadius: 14,
          padding: 14,
          gap: 12,
        }}>
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: sk }} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkS w="55%" h={12} r={5} bg={sk} />
            <SkS w="35%" h={9} r={4} bg={sk} />
          </View>
          <SkS w={52} h={14} r={5} bg={sk} />
        </View>
      ))}
    </View>
  );
}

/* ─── Main Screen ──────────────────────────────────────────────────────── */
export default function ScanScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { unread }  = useUnreadNotifications();

  const [userId,       setUserId]       = useState<string | null>(null);
  const [page,         setPage]         = useState(1);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search,       setSearch]       = useState("");
  const [filter,       setFilter]       = useState<Filter>("tout");
  const [showQR,       setShowQR]       = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);

  const pulse        = useRef(new Animated.Value(1)).current;
  const searchBarAnim = useRef(new Animated.Value(0)).current;

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
  const [, requestPermission] = useCameraPermissions();

  useEffect(() => {
    AsyncStorage.getItem("userId").then(setUserId);
    requestPermission();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.025, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,      duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const { data: user } = useGetUserByIdQuery(userId!, { skip: !userId });

  const { data: txData, isLoading, isFetching, refetch } = useGetAllTransactionsQuery(
    { id: userId, page, pageSize: 10, paginate: true },
    { skip: !userId }
  );

  useEffect(() => {
    if (txData?.data) {
      if (page === 1) setTransactions(txData.data);
      else setTransactions(prev => [...prev, ...txData.data]);
    }
  }, [txData]);

  const loadMore = useCallback(() => {
    if (!isFetching && txData?.data?.length === 10) setPage(p => p + 1);
  }, [isFetching, txData]);

  const onRefresh = useCallback(() => { setPage(1); refetch(); }, [refetch]);

  const filtered = transactions.filter(tx => {
    const name = (tx?.user?.username || tx?.receiver?.username || "").toLowerCase();
    const desc = (tx.description || "").toLowerCase();
    const q    = search.toLowerCase();
    return (name.includes(q) || desc.includes(q)) && (filter === "tout" || tx.status === filter);
  });

  const qrValue        = user ? JSON.stringify({ userId: user.id, accountNumber: user.accountNumber }) : "BIMNext";
  const HEADER_H       = insets.top + 62;
  const SEARCH_BAR_H   = 56;
  const effectiveH     = HEADER_H + (searchOpen ? SEARCH_BAR_H : 0);
  const initial        = ((user?.username || user?.email || "U")[0] ?? "U").toUpperCase();

  /* ── List header ── */
  const ListHeader = (
    <View>
      <View style={{ height: effectiveH + 16 }} />

      <View style={s.hero}>
        <Text style={s.heroTitle}>Scanner & Payer</Text>
        <Text style={s.heroSub}>Scannez un QR code pour payer ou recevoir</Text>
      </View>

      {/* QR glass card */}
      <Animated.View style={[s.qrCard, { transform: [{ scale: pulse }] }]}>
        <View style={s.qrRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.qrTitle}>Mon QR Code</Text>
            <Text style={s.qrSub}>Scannez pour me payer</Text>

            {user?.accountNumber && (
              <View style={s.accountChip}>
                <Ionicons name="card-outline" size={12} color={C.muted} />
                <Text style={s.accountTxt} numberOfLines={1}>{user.accountNumber}</Text>
              </View>
            )}

            <TouchableOpacity style={s.showBtn} onPress={() => setShowQR(v => !v)} activeOpacity={0.85}>
              <Ionicons name={showQR ? "eye-off-outline" : "eye-outline"} size={15} color={C.text} />
              <Text style={s.showBtnTxt}>{showQR ? "Masquer" : "Afficher"}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.qrBox}>
            {showQR && user ? (
              <QRCode value={qrValue} size={96} backgroundColor="transparent" color={C.text} />
            ) : (
              <View style={s.qrPlaceholder}>
                <Ionicons name="qr-code-outline" size={32} color={C.primary + "70"} />
              </View>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
        style={{ marginBottom: 14 }}
      >
        {FILTERS.map(f => {
          const active = filter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[s.chip, {
                backgroundColor: active ? C.primary : C.card,
                borderColor:     active ? C.primary : C.border,
              }]}
              onPress={() => setFilter(f)}
              activeOpacity={0.82}
            >
              <Text style={[s.chipTxt, { color: active ? "#fff" : C.muted }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Count */}
      <View style={s.countRow}>
        <Text style={s.countTxt}>
          {filtered.length} TRANSACTION{filtered.length !== 1 ? "S" : ""}
        </Text>
        <Text style={s.seeAllTxt}>Voir tout</Text>
      </View>
    </View>
  );

  if (isLoading && page === 1) {
    return <ScanSkeleton C={C} insets={insets} />;
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

      {/* ── Fixed glass header ── */}
      <View style={[s.header, { paddingTop: insets.top }]}>
        <View style={s.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color={C.text} />
          </TouchableOpacity>

          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Scan</Text>
          </View>

          <View style={s.headerRight}>
            <TouchableOpacity
              onPress={toggleSearch}
              style={[s.iconBtn, {
                backgroundColor: searchOpen ? C.primary + "15" : C.input,
                borderColor: searchOpen ? C.primary + "40" : C.border,
              }]}
            >
              <Ionicons
                name={searchOpen ? "close-outline" : "search-outline"}
                size={18}
                color={searchOpen ? C.primary : C.text}
              />
            </TouchableOpacity>
            <View style={{ position: "relative" }}>
              <TouchableOpacity
                style={[s.iconBtn, { backgroundColor: C.input, borderColor: C.border }]}
                onPress={() => router.push("/notification")}
              >
                <Ionicons name="notifications-outline" size={18} color={C.text} />
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
          <View style={[s.hSearchBar, { backgroundColor: C.input, borderColor: C.border }]}>
            <Ionicons name="search-outline" size={15} color={C.muted} />
            <TextInput
              placeholder="Rechercher une transaction…"
              value={search}
              onChangeText={setSearch}
              style={[s.hSearchInput, { color: C.text }]}
              placeholderTextColor={C.muted}
              autoFocus={searchOpen}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color={C.muted} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>

      {/* ── Main FlatList ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item: any, index: number) => `tx-${item.transactionId ?? "x"}-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={ListHeader}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && page === 1}
            onRefresh={onRefresh}
            colors={[C.primary]}
            tintColor={C.primary}
            progressViewOffset={effectiveH}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="receipt-outline" size={36} color={C.muted} />
              </View>
              <Text style={s.emptyTitle}>Aucune transaction</Text>
              <Text style={s.emptyDesc}>Votre historique de paiements apparaîtra ici</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isFetching && page > 1 ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator size="small" color={C.primary} />
            </View>
          ) : null
        }
        renderItem={({ item, index }: any) => (
          <TrxCard item={item} index={index} />
        )}
      />
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  loaderWrap: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", gap: 14 },
  loaderTxt:  { fontFamily: "NexaRegular", fontSize: 13, color: C.muted },

  /* Header */
  header: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
    backgroundColor: C.headerBg,
    borderBottomWidth: 1, borderBottomColor: C.border,
    elevation: 6, shadowColor: "#000", shadowOpacity: 0.05,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  headerInner: {
    height: 62, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.input, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle:  { fontFamily: "NexaRegular", fontSize: 17, color: C.text },
  headerRight:  { flexDirection: "row", alignItems: "center", gap: 8 },
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
    borderWidth: 2, borderColor: C.headerBg,
  },
  notifBadgeTxt: { fontFamily: "NexaBold", fontSize: 9, color: "#fff" },

  /* Hero */
  hero: { paddingHorizontal: 24, marginBottom: 20 },
  heroTitle: { fontFamily: "NexaBold", fontSize: 26, color: C.primary, marginBottom: 4 },
  heroSub:   { fontFamily: "NexaRegular", fontSize: 13, color: C.muted },

  /* QR card */
  qrCard: {
    marginHorizontal: 24, marginBottom: 20,
    backgroundColor: C.qrBg,
    borderRadius: 32, padding: 20,
    borderWidth: 1, borderColor: C.qrBord,
    elevation: 6,
    shadowColor: C.primary, shadowOpacity: 0.07,
    shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  qrRow:    { flexDirection: "row", alignItems: "center", gap: 16 },
  qrTitle:  { fontFamily: "NexaBold", fontSize: 18, color: C.text, marginBottom: 3 },
  qrSub:    { fontFamily: "NexaRegular", fontSize: 12, color: C.muted, marginBottom: 12 },
  accountChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.input, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: C.border,
    alignSelf: "flex-start", marginBottom: 14,
  },
  accountTxt: { fontFamily: "NexaRegular", fontSize: 11, color: C.muted, maxWidth: 140 },
  showBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#FBBF24",
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    alignSelf: "flex-start",
  },
  showBtnTxt: { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  qrBox: {
    width: 120, height: 120, borderRadius: 20, padding: 10,
    backgroundColor: C.card,
    alignItems: "center", justifyContent: "center",
    elevation: 4,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  qrPlaceholder: {
    flex: 1, width: "100%", borderRadius: 10,
    backgroundColor: C.input, opacity: 0.7,
    borderWidth: 2, borderStyle: "dashed", borderColor: C.primary + "30",
    alignItems: "center", justifyContent: "center",
  },

  /* Filter chips */
  filterRow: { paddingHorizontal: 24, gap: 10, paddingBottom: 2 },
  chip: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1,
  },
  chipTxt: { fontFamily: "NexaBold", fontSize: 13 },

  /* Count */
  countRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, marginBottom: 14,
  },
  countTxt:   { fontFamily: "NexaRegular", fontSize: 11, color: C.muted, letterSpacing: 0.5 },
  seeAllTxt:  { fontFamily: "NexaBold", fontSize: 11, color: C.primary },

  /* List */
  listContent: { paddingBottom: 110 },

  /* Transaction card */
  txCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.card, borderRadius: 24,
    padding: 14, marginBottom: 12,
    marginHorizontal: 24, gap: 12,
    borderWidth: 1, borderColor: C.border,
    elevation: 3,
    shadowColor: "#000", shadowOpacity: 0.05,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  txIcon:   { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  txBody:   { flex: 1 },
  txName:   { fontFamily: "NexaBold", fontSize: 14, color: C.text, marginBottom: 2 },
  txDesc:   { fontFamily: "NexaRegular", fontSize: 12, color: C.muted, marginBottom: 4 },
  txDateRow:{ flexDirection: "row", alignItems: "center", gap: 4 },
  txDate:   { fontFamily: "NexaRegular", fontSize: 11, color: C.muted },
  txRight:  { alignItems: "flex-end", gap: 6 },
  txAmount: { fontFamily: "NexaBold", fontSize: 15 },
  txBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  txBadgeTxt: { fontFamily: "NexaBold", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.3 },

  /* Empty */
  empty:      { alignItems: "center", paddingTop: 50, gap: 10, paddingHorizontal: 24 },
  emptyIcon:  { width: 72, height: 72, borderRadius: 24, backgroundColor: C.input, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontFamily: "NexaBold", fontSize: 15, color: C.text },
  emptyDesc:  { fontFamily: "NexaRegular", fontSize: 13, color: C.muted, textAlign: "center" },
}); }
