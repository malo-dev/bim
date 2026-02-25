import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  useColorScheme,
  ScrollView,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useGetAllTransactionsQuery } from "@/services/tsxService";

const W = Dimensions.get("window").width;

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
  success: "#22C55E",
  error:   "#EF4444",
  warning: "#F59E0B",
  neutral: "#6B7280",
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

/* ─── PERIOD FILTER ──────────────────────────────────────────────────── */
const PERIODS = [
  { key: "all",        label: "Tout",       icon: "infinite-outline"     },
  { key: "daily",      label: "Auj.",       icon: "sunny-outline"        },
  { key: "weekly",     label: "Semaine",    icon: "calendar-outline"     },
  { key: "monthly",    label: "Mois",       icon: "calendar-number-outline" },
  { key: "quarterly",  label: "Trimestre",  icon: "stats-chart-outline"  },
  { key: "semiannual", label: "Semestre",   icon: "bar-chart-outline"    },
  { key: "annual",     label: "Année",      icon: "trending-up-outline"  },
] as const;
type PeriodKey = typeof PERIODS[number]["key"];

function getStartDate(period: PeriodKey): Date | null {
  const now = new Date();
  switch (period) {
    case "daily":      return new Date(new Date().setHours(0, 0, 0, 0));
    case "weekly":     return new Date(new Date().setDate(now.getDate() - 7));
    case "monthly":    return new Date(now.getFullYear(), now.getMonth(), 1);
    case "quarterly":  return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    case "semiannual": return new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);
    case "annual":     return new Date(now.getFullYear(), 0, 1);
    default:           return null;
  }
}

/* ─── STATUS ─────────────────────────────────────────────────────────── */
const STATUS_FILTERS = ["toutes", "réussi", "échoué", "en attente", "annuler"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const getStatusColor = (status: string) => {
  switch (status) {
    case "réussi":      return C.success;
    case "échoué":      return C.error;
    case "en attente":  return C.warning;
    case "annuler":     return C.neutral;
    default:            return C.muted;
  }
};
const getStatusIcon = (status: string): any => {
  switch (status) {
    case "réussi":      return "checkmark-circle";
    case "échoué":      return "close-circle";
    case "en attente":  return "time";
    case "annuler":     return "ban";
    default:            return "ellipse-outline";
  }
};

/* ─── STAT CHIP ─────────────────────────────────────────────────────── */
function StatChip({ label, value, color, icon, isDark }: {
  label: string; value: number; color: string; icon: string; isDark: boolean;
}) {
  const t = isDark ? Colors.dark : Colors.light;
  return (
    <View style={[sc.chip, {
      backgroundColor: isDark ? t.card : color + "12",
      borderColor: color + (isDark ? "40" : "25"),
    }]}>
      <View style={[sc.chipIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon as any} size={15} color={color} />
      </View>
      <Text style={[sc.chipVal, { color }]}>{value}</Text>
      <Text style={[sc.chipLabel, { color: t.textSecondary }]}>{label}</Text>
    </View>
  );
}

/* ─── TRANSACTION ROW ────────────────────────────────────────────────── */
function TrxRow({ item, index, isDark }: { item: any; index: number; isDark: boolean }) {
  const t      = isDark ? Colors.dark : Colors.light;
  const slideY = useRef(new Animated.Value(16)).current;
  const opac   = useRef(new Animated.Value(0)).current;
  const color  = getStatusColor(item.status);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 280, delay: Math.min(index * 35, 350), useNativeDriver: true }),
      Animated.timing(opac,   { toValue: 1, duration: 280, delay: Math.min(index * 35, 350), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[sc.trxRow, {
      backgroundColor: t.rowBg,
      borderColor: t.border,
      opacity: opac,
      transform: [{ translateY: slideY }],
    }]}>
      {/* Barre colorée gauche */}
      <View style={[sc.trxAccent, { backgroundColor: color }]} />

      <View style={[sc.trxIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={getStatusIcon(item.status)} size={18} color={color} />
      </View>

      <View style={sc.trxInfo}>
        <Text style={[sc.trxDesc, { color: t.text }]} numberOfLines={1}>
          {item.description || "Aucune description"}
        </Text>
        <View style={sc.trxMeta}>
          <Ionicons name="calendar-outline" size={10} color={t.textSecondary} />
          <Text style={[sc.trxDate, { color: t.textSecondary }]}>
            {new Date(item.createdAt).toLocaleDateString("fr-FR", {
              day: "2-digit", month: "short", year: "numeric",
            })}
          </Text>
        </View>
      </View>

      <View style={sc.trxRight}>
        <View style={[sc.trxBadge, { backgroundColor: color + "15" }]}>
          <Text style={[sc.trxAmount, { color }]}>
            {(item.amount || 0).toLocaleString("fr-FR")}
          </Text>
          <Text style={[sc.trxUnit, { color: color + "AA" }]}>EC</Text>
        </View>
      </View>
    </Animated.View>
  );
}

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function Stats() {
  const router    = useRouter();
  const scrollY   = useRef(new Animated.Value(0)).current;
  const { isDark, t } = useTheme();

  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState<StatusFilter>("toutes");
  const [filterPeriod,  setFilterPeriod]  = useState<PeriodKey>("all");
  const [refreshing,    setRefreshing]    = useState(false);

  const { data, isLoading, isError, refetch } = useGetAllTransactionsQuery({
    page: 1, pageSize: 1000, paginate: true,
  });

  const transactions = data?.data || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await refetch(); setRefreshing(false);
  }, [refetch]);

  /* ── FILTRE PAR PÉRIODE ── */
  const byPeriod = useMemo(() => {
    const start = getStartDate(filterPeriod);
    if (!start) return transactions;
    return transactions.filter((t: any) => new Date(t.createdAt) >= start);
  }, [transactions, filterPeriod]);

  /* ── STATS ── */
  const counts = useMemo(() => ({
    réussi:       byPeriod.filter((t: any) => t.status === "réussi").length,
    échoué:       byPeriod.filter((t: any) => t.status === "échoué").length,
    "en attente": byPeriod.filter((t: any) => t.status === "en attente").length,
    annuler:      byPeriod.filter((t: any) => t.status === "annuler").length,
  }), [byPeriod]);

  const totalReceived = useMemo(() =>
    byPeriod.filter((t: any) => t.status === "réussi")
      .reduce((s: number, t: any) => s + (t.amount || 0), 0),
    [byPeriod]
  );

  /* ── FILTERED LIST ── */
  const filtered = useMemo(() =>
    byPeriod
      .filter((t: any) => filterStatus === "toutes" || t.status === filterStatus)
      .filter((t: any) => (t.description || "").toLowerCase().includes(search.toLowerCase()))
      .sort((a: any, b: any) => (a.createdAt < b.createdAt ? 1 : -1)),
    [byPeriod, filterStatus, search]
  );

  /* ── PIE ── */
  const pieData = [
    { name: "Réussi",     population: counts.réussi,          color: C.success, legendFontColor: t.text, legendFontSize: 11 },
    { name: "Échoué",     population: counts.échoué,          color: C.error,   legendFontColor: t.text, legendFontSize: 11 },
    { name: "En attente", population: counts["en attente"],   color: C.warning, legendFontColor: t.text, legendFontSize: 11 },
    { name: "Annulé",     population: counts.annuler,         color: C.neutral, legendFontColor: t.text, legendFontSize: 11 },
  ].filter(d => d.population > 0);

  /* ── HEADER SHRINK ── */
  const headerH = scrollY.interpolate({ inputRange: [0, 80], outputRange: [180, 120], extrapolate: "clamp" });
  const subOp   = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0],     extrapolate: "clamp" });

  /* ── LOADER / ERROR ── */
  if (isLoading) return (
    <View style={[sc.loader, { backgroundColor: t.background }]}>
      <LinearGradient colors={isDark ? ["#060B18", "#0D1B3E"] : [C.deep, C.primary]} style={StyleSheet.absoluteFill} />
      <ActivityIndicator size="large" color={C.white} />
      <Text style={sc.loaderText}>Chargement…</Text>
    </View>
  );

  if (isError) return (
    <View style={[sc.loader, { backgroundColor: t.background }]}>
      <LinearGradient colors={isDark ? ["#060B18", "#0D1B3E"] : [C.deep, C.primary]} style={StyleSheet.absoluteFill} />
      <Ionicons name="cloud-offline-outline" size={48} color="rgba(255,255,255,0.4)" />
      <Text style={sc.loaderText}>Erreur lors du chargement</Text>
    </View>
  );

  /* ── LIST HEADER ── */
  const ListHeader = (
    <View style={[sc.listHeader, { paddingTop: 192 }]}>

      {/* ── PÉRIODE FILTER ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={sc.periodScroll}
        style={{ marginBottom: 14 }}
      >
        {PERIODS.map((p) => {
          const active = filterPeriod === p.key;
          return (
            <TouchableOpacity
              key={p.key}
              style={[
                sc.periodChip,
                {
                  backgroundColor: active ? C.primary : (isDark ? t.card : C.white),
                  borderColor: active ? C.primary : t.border,
                  shadowColor: active ? C.primary : "transparent",
                },
              ]}
              onPress={() => setFilterPeriod(p.key)}
            >
              <Ionicons
                name={p.icon as any}
                size={13}
                color={active ? C.white : t.textSecondary}
              />
              <Text style={[sc.periodText, { color: active ? C.white : t.textSecondary }]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── TOTAL BANNER ── */}
      <View style={[sc.totalCard, { shadowColor: isDark ? "#000" : C.deep }]}>
        <LinearGradient
          colors={isDark ? ["#1A1060", "#0D1B3E"] : [C.violet, C.deep]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={sc.totalDeco1} />
        <View style={sc.totalDeco2} />

        {/* Période active badge */}
        <View style={sc.activePeriodBadge}>
          <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.6)" />
          <Text style={sc.activePeriodText}>
            {PERIODS.find(p => p.key === filterPeriod)?.label || "Tout"}
          </Text>
        </View>

        <Text style={sc.totalLabel}>Total Ecoins reçus</Text>
        <Text style={sc.totalValue}>{totalReceived.toLocaleString("fr-FR")}</Text>
        <Text style={sc.totalUnit}>Ecoins</Text>

        <View style={sc.totalBadge}>
          <Ionicons name="trending-up" size={12} color={C.gold} />
          <Text style={sc.totalBadgeText}>{counts.réussi} transactions réussies</Text>
        </View>
      </View>

      {/* ── STAT CHIPS ── */}
      <View style={sc.chips}>
        <StatChip isDark={isDark} label="Réussi"   value={counts.réussi}          color={C.success} icon="checkmark-circle" />
        <StatChip isDark={isDark} label="Échoué"   value={counts.échoué}          color={C.error}   icon="close-circle"     />
        <StatChip isDark={isDark} label="Attente"  value={counts["en attente"]}   color={C.warning} icon="time"             />
        <StatChip isDark={isDark} label="Annulé"   value={counts.annuler}         color={C.neutral} icon="ban"              />
      </View>

      {/* ── PIE CHART ── */}
      {pieData.length > 0 && (
        <View style={[sc.pieCard, {
          backgroundColor: t.card,
          borderColor: t.border,
          shadowColor: isDark ? "#000" : "#000",
        }]}>
          <View style={sc.pieHeader}>
            <View style={[sc.sectionDot, { backgroundColor: C.accent }]} />
            <Text style={[sc.pieTitle, { color: t.textSecondary }]}>Répartition par statut</Text>
          </View>
          <PieChart
            data={pieData}
            width={W - 64}
            height={170}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="10"
            absolute
            chartConfig={{
              backgroundColor: t.card,
              backgroundGradientFrom: t.card,
              backgroundGradientTo: t.card,
              color: () => t.text,
            }}
          />
        </View>
      )}

      {/* ── SEARCH ── */}
      <View style={[sc.searchBox, {
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
          style={[sc.searchInput, { color: t.text }]}
          blurOnSubmit={false}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={17} color={t.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── STATUS FILTERS ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={sc.filterScroll}
        style={{ marginBottom: 10 }}
      >
        {STATUS_FILTERS.map((f) => {
          const active = filterStatus === f;
          const color  =
            f === "réussi"      ? C.success :
            f === "échoué"      ? C.error   :
            f === "en attente"  ? C.warning :
            f === "annuler"     ? C.neutral : C.primary;
          return (
            <TouchableOpacity
              key={f}
              style={[
                sc.filterChip,
                {
                  backgroundColor: active ? color + "18" : (isDark ? t.card : C.white),
                  borderColor: active ? color : t.border,
                },
              ]}
              onPress={() => setFilterStatus(f)}
            >
              {active && <View style={[sc.filterDot, { backgroundColor: color }]} />}
              <Text style={[sc.filterText, {
                color: active ? color : t.textSecondary,
                fontFamily: active ? "NexaLight" : "NexaLight",
              }]}>
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── COUNT ── */}
      <View style={sc.countRow}>
        <Text style={[sc.countText, { color: t.textSecondary }]}>
          {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
        </Text>
        {(filterPeriod !== "all" || filterStatus !== "toutes" || search) && (
          <TouchableOpacity
            onPress={() => { setFilterPeriod("all"); setFilterStatus("toutes"); setSearch(""); }}
            style={[sc.resetBtn, { borderColor: t.border }]}
          >
            <Ionicons name="refresh-outline" size={12} color={t.textSecondary} />
            <Text style={[sc.resetText, { color: t.textSecondary }]}>Réinitialiser</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[sc.root, { backgroundColor: t.background }]}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER ANIMÉ ── */}
      <Animated.View style={[sc.header, { height: headerH }]}>
        <LinearGradient
          colors={t.headerGrad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={sc.deco1} />
        <View style={sc.deco2} />

        <View style={sc.topBar}>
          <TouchableOpacity style={sc.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.white} />
          </TouchableOpacity>
          <Text style={sc.headerTitle}>Statistiques</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View style={{ opacity: subOp, paddingHorizontal: 20, marginTop: 6 }}>
          <Text style={sc.headerSub}>Vue d'ensemble de vos transactions</Text>
        </Animated.View>
      </Animated.View>

      {/* ── FLAT LIST ── */}
      <Animated.FlatList
        data={filtered}
        keyExtractor={(item: any) => item.transactionId?.toString() || Math.random().toString()}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={sc.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.white}
            colors={[C.primary]}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={sc.empty}>
            <View style={[sc.emptyIcon, { backgroundColor: isDark ? Colors.dark.card : "rgba(3,83,204,0.08)" }]}>
              <Ionicons name="bar-chart-outline" size={36} color={isDark ? "rgba(255,255,255,0.2)" : C.muted} />
            </View>
            <Text style={[sc.emptyText, { color: t.textSecondary }]}>Aucune transaction trouvée</Text>
            <Text style={[sc.emptySubText, { color: t.textSecondary }]}>
              Essayez de changer la période ou le filtre
            </Text>
          </View>
        }
        renderItem={({ item, index }: any) => (
          <TrxRow item={item} index={index} isDark={isDark} />
        )}
      />
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const sc = StyleSheet.create({
  root:   { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { color: C.white, fontFamily: "NexaLight", marginTop: 12, fontSize: 13 },

  /* Header */
  header: {
    position: "absolute", top: 0, left: 0, right: 0,
    overflow: "hidden",
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    elevation: 12, zIndex: 10,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16,
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
    marginTop: Platform.OS === "ios" ? 52 : 36,
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 20,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: C.white, fontSize: 17, fontFamily: "NexaLight", letterSpacing: 0.3 },
  headerSub:   { color: "rgba(255,255,255,0.65)", fontSize: 12, fontFamily: "NexaLight" },

  /* List */
  list:       { paddingBottom: 120 },
  listHeader: { paddingHorizontal: 16, paddingBottom: 4 },

  /* Period filter */
  periodScroll: { paddingHorizontal: 0, gap: 8 },
  periodChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4,
  },
  periodText: { fontFamily: "NexaLight", fontSize: 12 },

  /* Total card */
  totalCard: {
    borderRadius: 24, padding: 22,
    marginBottom: 14, overflow: "hidden",
    alignItems: "center",
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14,
  },
  totalDeco1: {
    position: "absolute", width: 160, height: 160,
    borderRadius: 80, backgroundColor: "rgba(255,255,255,0.05)",
    top: -50, right: -40,
  },
  totalDeco2: {
    position: "absolute", width: 100, height: 100,
    borderRadius: 50, backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -20, left: 10,
  },
  activePeriodBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  activePeriodText: { color: "rgba(255,255,255,0.6)", fontFamily: "NexaLight", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  totalLabel: { color: "rgba(255,255,255,0.65)", fontFamily: "NexaLight", fontSize: 13, marginBottom: 4 },
  totalValue: { color: C.white, fontSize: 40, fontFamily: "NexaLight", letterSpacing: 0.5 },
  totalUnit:  { color: "rgba(255,255,255,0.5)", fontFamily: "NexaLight", fontSize: 13, marginBottom: 12 },
  totalBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,215,0,0.15)",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  totalBadgeText: { color: C.gold, fontFamily: "NexaLight", fontSize: 11 },

  /* Stat chips */
  chips: { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  chip: {
    flex: 1, minWidth: "45%",
    borderRadius: 16, padding: 12, borderWidth: 1,
    alignItems: "center", gap: 4,
  },
  chipIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  chipVal:  { fontSize: 22, fontFamily: "NexaLight" },
  chipLabel:{ fontSize: 10, fontFamily: "NexaLight", textTransform: "uppercase", letterSpacing: 0.5 },

  /* Pie card */
  pieCard: {
    borderRadius: 22, padding: 16, marginBottom: 14,
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8,
  },
  pieHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  sectionDot: { width: 4, height: 16, borderRadius: 2 },
  pieTitle: { fontFamily: "NexaLight", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 },

  /* Search */
  searchBox: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, paddingHorizontal: 14,
    height: 48, gap: 8, marginBottom: 12,
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6,
  },
  searchInput: { flex: 1, fontFamily: "NexaLight", fontSize: 13 },

  /* Status filters */
  filterScroll: { paddingHorizontal: 0, gap: 8 },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
  },
  filterDot:  { width: 6, height: 6, borderRadius: 3 },
  filterText: { fontFamily: "NexaLight", fontSize: 12 },

  /* Count + reset */
  countRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 10,
  },
  countText: { fontFamily: "NexaLight", fontSize: 12 },
  resetBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12, borderWidth: 1,
  },
  resetText: { fontFamily: "NexaLight", fontSize: 11 },

  /* Transaction row */
  trxRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, padding: 14,
    marginHorizontal: 16, marginBottom: 8,
    gap: 12, overflow: "hidden",
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  trxAccent: {
    position: "absolute", left: 0, top: 0, bottom: 0,
    width: 3, borderTopLeftRadius: 16, borderBottomLeftRadius: 16,
  },
  trxIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  trxInfo: { flex: 1 },
  trxDesc: { fontSize: 13, fontFamily: "NexaLight", marginBottom: 4 },
  trxMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  trxDate: { fontSize: 10, fontFamily: "NexaLight" },
  trxRight: { alignItems: "flex-end" },
  trxBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, alignItems: "center" },
  trxAmount:{ fontSize: 14, fontFamily: "NexaLight" },
  trxUnit:  { fontSize: 10, fontFamily: "NexaLight" },

  /* Empty */
  empty: { alignItems: "center", paddingTop: 50, gap: 10, paddingHorizontal: 40 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyText: { fontFamily: "NexaLight", fontSize: 14, textAlign: "center" },
  emptySubText: { fontFamily: "NexaLight", fontSize: 12, textAlign: "center", opacity: 0.7 },
});