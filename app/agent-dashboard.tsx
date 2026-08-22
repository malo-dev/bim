/* eslint-disable */
import { useGetAgentStatsQuery, useGetAgentRetraitsQuery } from "@/services/agentService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/app/_layout";

const ios = Platform.OS === "ios";

/* ── PALETTE ─────────────────────────────────────────────────────────────── */
const LIGHT = {
  primary: "#0035C5",
  text:    "#1A1C1C",
  textSec: "#434657",
  textMut: "#747688",
  bg:      ios ? "#F9F9F9" : "#F0F4FA",
  surface: "#FFFFFF",
  green:   "#10B981",
  amber:   "#F59E0B",
  red:     "#EF4444",
  border:  ios ? "rgba(196,197,218,0.30)" : "rgba(196,197,218,0.40)",
  topBarBg: ios ? "rgba(255,255,255,0.90)" : "#FFFFFF",
  topBord:  ios ? "rgba(0,0,0,0.06)"       : "rgba(0,0,0,0.10)",
  cardBg:   "#FFFFFF",
  cardBord: "rgba(0,0,0,0.06)",
  skeleton: "#E4E8F0",
  divider:  "rgba(0,0,0,0.06)",
  statBg:   "#F0F4FF",
};
const DARK: typeof LIGHT = {
  primary: "#4D8DFF",
  text:    "#EAF0FF",
  textSec: "#9FB0D0",
  textMut: "#6B7A99",
  bg:      "#0B1220",
  surface: "#111827",
  green:   "#10B981",
  amber:   "#F59E0B",
  red:     "#F87171",
  border:  "rgba(31,42,68,0.80)",
  topBarBg: "#0B1220",
  topBord:  "rgba(31,42,68,0.50)",
  cardBg:   "#1A2540",
  cardBord: "rgba(77,141,255,0.10)",
  skeleton: "#1A2540",
  divider:  "rgba(31,42,68,0.60)",
  statBg:   "rgba(77,141,255,0.10)",
};

/* ── PERIOD FILTERS ───────────────────────────────────────────────────────── */
const PERIODS = [
  { key: "today",  label: "Aujourd'hui" },
  { key: "week",   label: "7 jours" },
  { key: "month",  label: "Ce mois" },
  { key: "year",   label: "Cette année" },
] as const;
type Period = typeof PERIODS[number]["key"];

/* ── FORMAT ───────────────────────────────────────────────────────────────── */
function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ── MAIN COMPONENT ───────────────────────────────────────────────────────── */
export default function AgentDashboard() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router   = useRouter();
  const insets   = useSafeAreaInsets();

  const [period, setPeriod] = useState<Period>("today");
  const [page,   setPage]   = useState(1);

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useGetAgentStatsQuery(undefined);
  const { data: retraitsData, isLoading: retraitsLoading, refetch: refetchRetraits, isFetching } = useGetAgentRetraitsQuery(
    { period, page, pageSize: 20 },
    { refetchOnFocus: true }
  );

  const stats   = statsData?.stats;
  const agent   = statsData?.agent;
  const retraits = retraitsData?.data ?? [];
  const totalRetraits = retraitsData?.total ?? 0;
  const totalPages    = retraitsData?.totalPages ?? 1;

  const onRefresh = async () => {
    await Promise.all([refetchStats(), refetchRetraits()]);
  };

  function changePeriod(p: Period) {
    setPeriod(p);
    setPage(1);
  }

  /* ── current period totals ── */
  const currentTotal = (() => {
    if (!stats) return 0;
    switch (period) {
      case "today": return stats.todayTotal;
      case "week":  return stats.weekTotal;
      case "month": return stats.monthTotal;
      case "year":  return stats.allTimeTotal;
      default:      return stats.todayTotal;
    }
  })();

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

      {/* ── TOP BAR ────────────────────────────────────────────────────── */}
      <SafeAreaView edges={["top"]} style={s.safeBar}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <View style={s.topCenter}>
            <Text style={s.topTitle}>Espace Agent</Text>
            {agent?.accountNumber && (
              <Text style={s.topSub}>{agent.accountNumber}</Text>
            )}
          </View>
          <TouchableOpacity onPress={onRefresh} style={s.backBtn}>
            <Ionicons name="refresh-outline" size={20} color={C.textMut} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} colors={[C.primary]} tintColor={C.primary} />}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* ── HERO — solde actuel ───────────────────────────────────────── */}
        <View style={s.heroCard}>
          <View style={s.heroBg} />
          <View style={s.heroContent}>
            <Text style={s.heroLabel}>Commission disponible</Text>
            {statsLoading ? (
              <ActivityIndicator color={C.primary} style={{ marginVertical: 8 }} />
            ) : (
              <Text style={s.heroBalance}>{fmt(Number(agent?.soldNumber ?? 0))} EC</Text>
            )}
            <Text style={s.heroSub}>Bienvenue, {agent?.username ?? "Agent"}</Text>
          </View>
        </View>

        {/* ── STAT CARDS ───────────────────────────────────────────────── */}
        <View style={s.statsRow}>
          <StatCard
            label="Aujourd'hui"
            value={`${fmt(stats?.todayTotal ?? 0)} EC`}
            sub={`${stats?.todayCount ?? 0} retrait${(stats?.todayCount ?? 0) !== 1 ? "s" : ""}`}
            icon="arrow-down-circle-outline"
            color={C.green}
            C={C} s={s}
            loading={statsLoading}
          />
          <StatCard
            label="Ce mois"
            value={`${fmt(stats?.monthTotal ?? 0)} EC`}
            sub="Retraits traités"
            icon="calendar-outline"
            color={C.primary}
            C={C} s={s}
            loading={statsLoading}
          />
        </View>
        <View style={s.statsRow}>
          <StatCard
            label="7 derniers jours"
            value={`${fmt(stats?.weekTotal ?? 0)} EC`}
            sub="Volume total"
            icon="trending-up-outline"
            color={C.amber}
            C={C} s={s}
            loading={statsLoading}
          />
          <StatCard
            label="Tout le temps"
            value={`${fmt(stats?.allTimeTotal ?? 0)} EC`}
            sub={`${stats?.allTimeCount ?? 0} retraits`}
            icon="stats-chart-outline"
            color={C.primary}
            C={C} s={s}
            loading={statsLoading}
          />
        </View>

        {/* ── PÉRIODE + LISTE RETRAITS ─────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Retraits reçus</Text>

          {/* Période chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[s.chip, period === p.key && s.chipActive]}
                onPress={() => changePeriod(p.key)}
              >
                <Text style={[s.chipLabel, period === p.key && s.chipLabelActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Résumé de la période */}
          {!retraitsLoading && (
            <View style={s.periodSummary}>
              <Text style={s.periodSummaryText}>
                <Text style={[s.periodSummaryVal, { color: C.primary }]}>{totalRetraits}</Text>
                {" retrait"}{totalRetraits !== 1 ? "s" : ""}
                {"  —  "}
                <Text style={[s.periodSummaryVal, { color: C.green }]}>{fmt(currentTotal)} EC</Text>
              </Text>
            </View>
          )}

          {/* Liste */}
          {retraitsLoading ? (
            <ActivityIndicator color={C.primary} style={{ marginTop: 24 }} />
          ) : retraits.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="wallet-outline" size={40} color={C.textMut} style={{ opacity: 0.4 }} />
              <Text style={s.emptyText}>Aucun retrait sur cette période</Text>
            </View>
          ) : (
            <View style={s.list}>
              {retraits.map((tx: any, i: number) => (
                <RetraitRow key={tx.transactionRetraitId ?? i} tx={tx} isLast={i === retraits.length - 1} C={C} s={s} />
              ))}
            </View>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <View style={s.paginationRow}>
              <TouchableOpacity
                style={[s.pageBtn, page === 1 && { opacity: 0.35 }]}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <Ionicons name="chevron-back" size={18} color={C.primary} />
                <Text style={s.pageBtnText}>Préc.</Text>
              </TouchableOpacity>
              <Text style={s.pageInfo}>{page} / {totalPages}</Text>
              <TouchableOpacity
                style={[s.pageBtn, page === totalPages && { opacity: 0.35 }]}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <Text style={s.pageBtnText}>Suiv.</Text>
                <Ionicons name="chevron-forward" size={18} color={C.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ── STAT CARD ────────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, color, C, s, loading }: {
  label: string; value: string; sub: string; icon: string;
  color: string; C: any; s: any; loading: boolean;
}) {
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={s.statLabel}>{label}</Text>
      {loading ? (
        <ActivityIndicator size="small" color={color} style={{ marginVertical: 2 }} />
      ) : (
        <Text style={[s.statValue, { color }]}>{value}</Text>
      )}
      <Text style={s.statSub}>{sub}</Text>
    </View>
  );
}

/* ── RETRAIT ROW ──────────────────────────────────────────────────────────── */
function RetraitRow({ tx, isLast, C, s }: { tx: any; isLast: boolean; C: any; s: any }) {
  const sender = tx.sender;
  return (
    <View style={[s.txRow, !isLast && s.txBorder]}>
      <View style={[s.txIcon, { backgroundColor: `${C.green}18` }]}>
        <Ionicons name="arrow-down-circle-outline" size={20} color={C.green} />
      </View>
      <View style={s.txMid}>
        <Text style={s.txName} numberOfLines={1}>
          {sender?.username ?? "Client BIM"}
        </Text>
        <Text style={s.txDate} numberOfLines={1}>
          {sender?.telephone && `${sender.telephone}  •  `}{fmtDate(tx.createdAt)}
        </Text>
      </View>
      <Text style={[s.txAmount, { color: C.green }]}>+{fmt(Number(tx.amount ?? 0))} EC</Text>
    </View>
  );
}

/* ── STYLES ───────────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },

    /* Top bar */
    safeBar: { backgroundColor: C.topBarBg, zIndex: 50 },
    topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.topBord },
    backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
    topCenter: { flex: 1, alignItems: "center" },
    topTitle: { fontFamily: "NexaBold", fontSize: 17, color: C.text },
    topSub: { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, marginTop: 1 },

    scroll: { paddingTop: 20, paddingHorizontal: 16, gap: 12 },

    /* Hero */
    heroCard: { borderRadius: 20, overflow: "hidden", backgroundColor: C.primary, minHeight: 120, justifyContent: "center", marginBottom: 4 },
    heroBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.10)" },
    heroContent: { padding: 24 },
    heroLabel: { fontFamily: "NexaLight", fontSize: 12, color: "rgba(255,255,255,0.75)", letterSpacing: 0.5, textTransform: "uppercase" },
    heroBalance: { fontFamily: "NexaBold", fontSize: 34, color: "#FFFFFF", marginTop: 4 },
    heroSub: { fontFamily: "NexaLight", fontSize: 13, color: "rgba(255,255,255,0.70)", marginTop: 4 },

    /* Stats */
    statsRow: { flexDirection: "row", gap: 12 },
    statCard: { flex: 1, backgroundColor: C.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBord, gap: 4 },
    statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 4 },
    statLabel: { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, textTransform: "uppercase", letterSpacing: 0.3 },
    statValue: { fontFamily: "NexaBold", fontSize: 16 },
    statSub: { fontFamily: "NexaLight", fontSize: 11, color: C.textMut },

    /* Section */
    section: { backgroundColor: C.cardBg, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.cardBord },
    sectionTitle: { fontFamily: "NexaBold", fontSize: 16, color: C.text, marginBottom: 12 },

    /* Chips */
    chipRow: { flexDirection: "row", marginBottom: 12 },
    chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: "transparent" },
    chipActive: { backgroundColor: C.primary, borderColor: C.primary },
    chipLabel: { fontFamily: "NexaLight", fontSize: 13, color: C.textMut },
    chipLabelActive: { color: "#FFFFFF", fontFamily: "NexaBold" },

    /* Period summary */
    periodSummary: { backgroundColor: C.statBg, borderRadius: 10, padding: 10, marginBottom: 12, alignItems: "center" },
    periodSummaryText: { fontFamily: "NexaLight", fontSize: 13, color: C.textSec },
    periodSummaryVal: { fontFamily: "NexaBold", fontSize: 15 },

    /* List */
    list: { gap: 0 },
    txRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
    txBorder: { borderBottomWidth: 1, borderBottomColor: C.divider },
    txIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    txMid: { flex: 1 },
    txName: { fontFamily: "NexaBold", fontSize: 14, color: C.text },
    txDate: { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, marginTop: 2 },
    txAmount: { fontFamily: "NexaBold", fontSize: 15 },

    /* Empty */
    empty: { alignItems: "center", paddingVertical: 40, gap: 12 },
    emptyText: { fontFamily: "NexaLight", fontSize: 14, color: C.textMut },

    /* Pagination */
    paginationRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.divider },
    pageBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border },
    pageBtnText: { fontFamily: "NexaBold", fontSize: 13, color: C.primary },
    pageInfo: { fontFamily: "NexaLight", fontSize: 13, color: C.textMut },
  });
}
