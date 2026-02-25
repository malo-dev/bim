import { Ionicons } from "@expo/vector-icons";
import { useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetUserByIdQuery } from "@/services/userService";
import { useGetAllTransactionsQuery } from "@/services/tsxService";
import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";

/* ─── THEME (même pattern que HomeScreen) ────────────────────────────── */
const C = {
  primary: "#0353CC",
  violet:  "#3906C7",
  deep:    "#302E99",
  accent:  "#4D96FF",
  gold:    "#FFD700",
  white:   "#FFFFFF",
  text:    "#0D1B3E",
  muted:   "#7B8DB0",
  success: "#16A34A",
  error:   "#DC2626",
  warning: "#F59E0B",
};

const Colors = {
  light: {
    background:    "#F0F4FF",
    card:          "#FFFFFF",
    cardAlt:       "#F8FAFF",
    text:          "#0D1B3E",
    textSecondary: "#7B8DB0",
    border:        "rgba(3,83,204,0.10)",
    inputBg:       "rgba(3,83,204,0.04)",
    rowBg:         "#FFFFFF",
    headerGrad:    [C.deep, C.primary] as [string, string],
  },
  dark: {
    background:    "#0A0F1E",
    card:          "#111827",
    cardAlt:       "#1E2A3A",
    text:          "#E2E8F0",
    textSecondary: "#64748B",
    border:        "rgba(255,255,255,0.08)",
    inputBg:       "rgba(255,255,255,0.05)",
    rowBg:         "#111827",
    headerGrad:    ["#060B18", "#0D1B3E"] as [string, string],
  },
};

function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

/* ─── STATUS ─────────────────────────────────────────────────────────── */
const STATUS_FILTERS = ["tout", "réussi", "échoué", "en attente"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const getStatusColor = (status: string) => {
  switch (status) {
    case "réussi":     return C.success;
    case "échoué":     return C.error;
    case "en attente": return C.warning;
    default:           return C.muted;
  }
};
const getStatusIcon = (status: string): any => {
  switch (status) {
    case "réussi":     return "checkmark-circle";
    case "échoué":     return "close-circle";
    case "en attente": return "time";
    default:           return "ellipse-outline";
  }
};

/* ─── TRANSACTION CARD ───────────────────────────────────────────────── */
function TrxCardBase({ item, index, isDark }: { item: any; index: number; isDark: boolean }) {
  const t      = isDark ? Colors.dark : Colors.light;
  const slideY = useRef(new Animated.Value(24)).current;
  const opac   = useRef(new Animated.Value(0)).current;
  const color  = getStatusColor(item.status);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 300, delay: Math.min(index * 45, 400), useNativeDriver: true }),
      Animated.timing(opac,   { toValue: 1, duration: 300, delay: Math.min(index * 45, 400), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      s.trxCard,
      {
        backgroundColor: t.rowBg,
        borderColor: t.border,
        opacity: opac,
        transform: [{ translateY: slideY }],
      },
    ]}>
      {/* Barre colorée gauche */}
      <View style={[s.trxAccent, { backgroundColor: color }]} />

      <View style={[s.trxIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={getStatusIcon(item.status)} size={20} color={color} />
      </View>

      <View style={s.trxContent}>
        <Text style={[s.trxName, { color: t.text }]} numberOfLines={1}>
          {item?.user?.username || "Utilisateur"}
        </Text>
        <Text style={[s.trxDesc, { color: t.textSecondary }]} numberOfLines={1}>
          {item.description || "Aucune description"}
        </Text>
        <View style={s.trxDateRow}>
          <Ionicons name="calendar-outline" size={10} color={t.textSecondary} />
          <Text style={[s.trxDate, { color: t.textSecondary }]}>
            {new Date(item.createdAt).toLocaleDateString("fr-FR", {
              day: "2-digit", month: "short", year: "numeric",
            })}
          </Text>
        </View>
      </View>

      <View style={s.trxRight}>
        <View style={[s.amountBadge, { backgroundColor: color + "15" }]}>
          <Text style={[s.trxAmount, { color }]}>
            {item.amount > 0 ? "+" : ""}{(item.amount || 0).toLocaleString("fr-FR")}
          </Text>
          <Text style={[s.trxCurrency, { color: color + "AA" }]}>EC</Text>
        </View>
        <View style={[s.statusPill, { backgroundColor: color + "12", borderColor: color + "30" }]}>
          <Text style={[s.statusText, { color }]}>{item.status}</Text>
        </View>
      </View>
    </Animated.View>
  );
}
const TrxCard = memo(TrxCardBase);
TrxCard.displayName = "TrxCard";

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function IMTransport() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { isDark, t } = useTheme();

  const [userId,       setUserId]       = useState<string | null>(null);
  const [page,         setPage]         = useState(1);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("tout");
  const [showQR,       setShowQR]       = useState(false);

  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    AsyncStorage.getItem("userId").then(setUserId);
  }, []);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const { data: user } = useGetUserByIdQuery(userId!, { skip: !userId });

  const { data: transactionsData, isLoading, isFetching, refetch } = useGetAllTransactionsQuery(
    { id: userId, page, pageSize: 10, paginate: true },
    { skip: !userId }
  );

  useEffect(() => {
    if (transactionsData?.data) {
      if (page === 1) setTransactions(transactionsData.data);
      else setTransactions((prev) => [...prev, ...transactionsData.data]);
    }
  }, [transactionsData]);

  const loadMore = useCallback(() => {
    if (!isFetching && transactionsData?.data?.length === 10) setPage((p) => p + 1);
  }, [isFetching, transactionsData]);

  const onRefresh = useCallback(() => { setPage(1); refetch(); }, [refetch]);
  const handleSearchClear = useCallback(() => setSearch(""), []);
  const handleToggleQR    = useCallback(() => setShowQR(v => !v), []);

  const filtered = transactions.filter((tx: any) => {
    const name        = tx?.user?.username || "";
    const matchSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "tout" || tx.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const qrValue = JSON.stringify({ userId: user?.id, accountNumber: user?.accountNumber });

  /* header shrink */
  const headerH = scrollY.interpolate({ inputRange: [0, 60], outputRange: [Platform.OS === "ios" ? 140 : 120, Platform.OS === "ios" ? 100 : 88], extrapolate: "clamp" });
  const subOp   = scrollY.interpolate({ inputRange: [0, 40], outputRange: [1, 0], extrapolate: "clamp" });

  /* ── LOADER ── */
  if (isLoading && page === 1) return (
    <View style={[s.loader, { backgroundColor: t.background }]}>
      <LinearGradient colors={isDark ? ["#060B18", "#0D1B3E"] : [C.deep, C.primary]} style={StyleSheet.absoluteFill} />
      <ActivityIndicator size="large" color={C.white} />
      <Text style={s.loaderText}>Chargement…</Text>
    </View>
  );

  const ListHeader = (
    <View style={{ paddingTop: Platform.OS === "ios" ? 148 : 128 }}>

      {/* ── QR CARD ── */}
      <View style={[s.qrCard, { shadowColor: isDark ? "#000" : C.deep }]}>
        <LinearGradient
          colors={isDark ? ["#1A1060", "#0D1B3E"] : [C.deep, C.violet]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.qrDeco1} />
        <View style={s.qrDeco2} />

        <View style={s.qrRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.qrLabel}>Mon QR Code</Text>
            <Text style={s.qrSub}>Scannez pour me payer</Text>
            {user?.accountNumber && (
              <View style={s.accountChip}>
                <Ionicons name="card-outline" size={12} color={C.white} />
                <Text style={s.accountText}>{user.accountNumber}</Text>
              </View>
            )}
            <TouchableOpacity style={s.shareBtn} onPress={handleToggleQR}>
              <Ionicons name={showQR ? "eye-off-outline" : "eye-outline"} size={14} color={C.deep} />
              <Text style={s.shareBtnText}>{showQR ? "Masquer" : "Afficher"}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.qrBox}>
            {showQR && user ? (
              <QRCode value={qrValue} size={100} backgroundColor="transparent" color={C.deep} />
            ) : (
              <View style={s.qrHidden}>
                <Ionicons name="qr-code-outline" size={40} color="rgba(255,255,255,0.4)" />
                <Text style={s.qrHiddenText}>Appuyez pour afficher</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── SEARCH ── */}
      <View style={[s.searchBox, {
        backgroundColor: t.card,
        borderColor: t.border,
        shadowColor: isDark ? "#000" : "#000",
      }]}>
        <Ionicons name="search-outline" size={17} color={t.textSecondary} />
        <TextInput
          placeholder="Rechercher une transaction…"
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

      {/* ── FILTRES ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterScroll}
        style={{ marginBottom: 10 }}
      >
        {STATUS_FILTERS.map((f) => {
          const active = filterStatus === f;
          const color  =
            f === "réussi"     ? C.success :
            f === "échoué"     ? C.error   :
            f === "en attente" ? C.warning : C.primary;
          return (
            <TouchableOpacity
              key={f}
              style={[
                s.filterChip,
                {
                  backgroundColor: active ? color + "18" : (isDark ? t.card : C.white),
                  borderColor: active ? color : t.border,
                },
              ]}
              onPress={() => setFilterStatus(f)}
            >
              {active && <View style={[s.filterDot, { backgroundColor: color }]} />}
              <Text style={[s.filterText, { color: active ? color : t.textSecondary }]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── COUNT ── */}
      <View style={s.countRow}>
        <Text style={[s.countText, { color: t.textSecondary }]}>
          {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
        </Text>
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

        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          <View style={s.topBar}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={C.white} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Mes transactions</Text>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/notification")}>
              <Ionicons name="notifications-outline" size={22} color={C.white} />
            </TouchableOpacity>
          </View>

          <Animated.View style={{ opacity: subOp, paddingHorizontal: 20, marginTop: 4 }}>
            <Text style={s.headerSub}>Historique de vos paiements</Text>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>

      {/* ── LIST ── */}
      <Animated.FlatList
        data={filtered}
        keyExtractor={(item: any) => item.transactionId?.toString() || Math.random().toString()}
        contentContainerStyle={[s.list, { backgroundColor: t.background }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        refreshing={isFetching && page === 1}
        onRefresh={onRefresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <View style={[s.emptyIcon, { backgroundColor: isDark ? Colors.dark.card : "rgba(3,83,204,0.08)" }]}>
                <Ionicons name="receipt-outline" size={36} color={isDark ? "rgba(255,255,255,0.2)" : C.muted} />
              </View>
              <Text style={[s.emptyText, { color: t.textSecondary }]}>Aucune transaction trouvée</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isFetching && page > 1 ? (
            <ActivityIndicator size="small" color={C.primary} style={{ marginVertical: 16 }} />
          ) : null
        }
        renderItem={({ item, index }: any) => (
          <TrxCard item={item} index={index} isDark={isDark} />
        )}
      />
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
    zIndex: 10,
    overflow: "hidden",
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    elevation: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16,
  },
  deco1: {
    position: "absolute", width: 200, height: 200,
    borderRadius: 100, backgroundColor: "rgba(255,255,255,0.05)",
    top: -60, right: -50,
  },
  deco2: {
    position: "absolute", width: 120, height: 120,
    borderRadius: 60, backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -30, left: -20,
  },
  topBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 8,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: C.white, fontSize: 17, fontFamily: "NexaLight", letterSpacing: 0.3 },
  headerSub:   { color: "rgba(255,255,255,0.65)", fontSize: 12, fontFamily: "NexaLight" },

  /* QR Card */
  qrCard: {
    marginHorizontal: 16, marginTop: 12,
    borderRadius: 24, padding: 20,
    overflow: "hidden",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12,
  },
  qrDeco1: {
    position: "absolute", width: 140, height: 140,
    borderRadius: 70, backgroundColor: "rgba(255,255,255,0.06)",
    top: -40, right: -30,
  },
  qrDeco2: {
    position: "absolute", width: 90, height: 90,
    borderRadius: 45, backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -20, left: 20,
  },
  qrRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  qrLabel:  { color: C.white, fontSize: 16, fontFamily: "NexaLight", marginBottom: 4 },
  qrSub:    { color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "NexaLight", marginBottom: 10 },
  accountChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: "flex-start", marginBottom: 12,
  },
  accountText: { color: C.white, fontSize: 11, fontFamily: "NexaLight" },
  shareBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.gold,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    alignSelf: "flex-start",
  },
  shareBtnText: { color: C.deep, fontSize: 12, fontFamily: "NexaLight" },
  qrBox: {
    width: 120, height: 120,
    backgroundColor: C.white,
    borderRadius: 16, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
  },
  qrHidden:     { alignItems: "center", padding: 8 },
  qrHiddenText: { color: "rgba(255,255,255,0.4)", fontSize: 9, fontFamily: "NexaLight", textAlign: "center", marginTop: 4 },

  /* Search */
  searchBox: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, paddingHorizontal: 14,
    height: 48, gap: 8,
    marginHorizontal: 16, marginTop: 14, marginBottom: 12,
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6,
  },
  searchInput: { flex: 1, fontFamily: "NexaLight", fontSize: 13 },

  /* Filters */
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
  },
  filterDot:  { width: 6, height: 6, borderRadius: 3 },
  filterText: { fontFamily: "NexaLight", fontSize: 12 },

  countRow:  { paddingHorizontal: 20, paddingBottom: 6 },
  countText: { fontFamily: "NexaLight", fontSize: 12 },

  /* List */
  list: { paddingHorizontal: 16, paddingBottom: 100 },

  /* Empty */
  empty:     { alignItems: "center", paddingTop: 50, gap: 10 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyText: { fontFamily: "NexaLight", fontSize: 13, textAlign: "center" },

  /* Transaction card */
  trxCard: {
    flexDirection: "row",
    borderRadius: 18,
    padding: 14, marginBottom: 10,
    alignItems: "center", gap: 12,
    overflow: "hidden", borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 5,
  },
  trxAccent: {
    position: "absolute", left: 0, top: 0, bottom: 0,
    width: 3, borderTopLeftRadius: 18, borderBottomLeftRadius: 18,
  },
  trxIcon:    { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  trxContent: { flex: 1 },
  trxName:    { fontSize: 13, fontFamily: "NexaLight", marginBottom: 2 },
  trxDesc:    { fontSize: 11, fontFamily: "NexaLight", marginBottom: 3 },
  trxDateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  trxDate:    { fontSize: 10, fontFamily: "NexaLight" },
  trxRight:   { alignItems: "flex-end", gap: 5 },
  amountBadge:{ borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignItems: "center" },
  trxAmount:  { fontSize: 14, fontFamily: "NexaLight" },
  trxCurrency:{ fontSize: 10, fontFamily: "NexaLight" },
  statusPill: {
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1,
  },
  statusText: { fontSize: 10, fontFamily: "NexaLight" },
});