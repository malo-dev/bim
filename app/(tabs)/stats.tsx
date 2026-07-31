import { API_URL_BASE } from "@/constants/api";
import { useGetAllTransactionsQuery } from "@/services/tsxService";
import { useGetUserByIdQuery } from "@/services/userService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useAppTheme } from "@/app/_layout";

/* ─── PALETTE ─────────────────────────────────────────────────────────── */
const LIGHT = {
  primary:    "#0035C5",
  primaryMd:  "#0047FF",
  primaryDp:  "#0026A3",
  white:      "#FFFFFF",
  bg:         "#FFFFFF",
  surface:    "#F8F9FC",
  text:       "#1A1C1C",
  muted:      "#747688",
  border:     "rgba(196,197,218,0.4)",
  success:    "#22C55E",
  error:      "#EF4444",
  warning:    "#F59E0B",
  neutral:    "#64748B",
  skeleton:   "#F0F1F5",
  headerBg:   "rgba(255,255,255,0.94)",
  headerBord: "rgba(196,197,218,0.15)",
  backBtnBg:  "rgba(248,249,252,0.8)",
  avatarBord: "rgba(0,69,255,0.08)",
  chipBg:     "rgba(248,249,252,0.9)",
  chipBord:   "rgba(196,197,218,0.3)",
  cardIconBg: "rgba(0,69,255,0.05)",
  emptyBg:    "rgba(0,53,197,0.05)",
  sectionBg:  "rgba(0,53,197,0.06)",
};
const DARK: typeof LIGHT = {
  primary:    "#4D8DFF",
  primaryMd:  "#4D8DFF",
  primaryDp:  "#1A5AE5",
  white:      "#FFFFFF",
  bg:         "#0B1220",
  surface:    "#1A2540",
  text:       "#EAF0FF",
  muted:      "#6B7A99",
  border:     "rgba(31,42,68,0.80)",
  success:    "#22C55E",
  error:      "#EF4444",
  warning:    "#F59E0B",
  neutral:    "#64748B",
  skeleton:   "#1A2540",
  headerBg:   "rgba(11,18,32,0.94)",
  headerBord: "rgba(31,42,68,0.50)",
  backBtnBg:  "rgba(26,37,64,0.80)",
  avatarBord: "rgba(77,150,255,0.12)",
  chipBg:     "rgba(26,37,64,0.90)",
  chipBord:   "rgba(31,42,68,0.80)",
  cardIconBg: "rgba(77,150,255,0.06)",
  emptyBg:    "rgba(77,150,255,0.05)",
  sectionBg:  "rgba(77,150,255,0.08)",
};

/* ─── PERIODS ─────────────────────────────────────────────────────────── */
const PERIODS = [
  { key: "all",     label: "Tout"    },
  { key: "daily",   label: "Auj."   },
  { key: "weekly",  label: "Semaine" },
  { key: "monthly", label: "Mois"   },
] as const;
type PeriodKey = typeof PERIODS[number]["key"];

function getStartDate(p: PeriodKey): Date | null {
  const now = new Date();
  switch (p) {
    case "daily":   return new Date(new Date().setHours(0, 0, 0, 0));
    case "weekly":  return new Date(now.getTime() - 7 * 86400000);
    case "monthly": return new Date(now.getFullYear(), now.getMonth(), 1);
    default:        return null;
  }
}

/* ─── HELPERS ─────────────────────────────────────────────────────────── */
function getTypeIcon(type: string): any {
  switch (type) {
    case "retrait":   return "trending-up-outline";
    case "recharge":  return "wallet-outline";
    case "transfert": return "swap-horizontal-outline";
    case "paiement":  return "cube-outline";
    default:          return "cash-outline";
  }
}
function getTypeLabel(type: string): string {
  switch (type) {
    case "retrait":   return "Retrait";
    case "recharge":  return "Recharge";
    case "transfert": return "Transfert";
    case "paiement":  return "Paiement";
    default:          return type ?? "—";
  }
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtAmount(n: number): string {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

/* ─── SPARKLINE ───────────────────────────────────────────────────────── */
function Sparkline() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 1600, useNativeDriver: false }).start();
  }, []);
  return (
    <Svg width={120} height={24} fill="none">
      <Path
        d="M0 20C10 20 15 4 25 4C35 4 40 18 50 18C60 18 65 2 75 2C85 2 90 15 100 15C110 15 115 10 120 10"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.6}
      />
    </Svg>
  );
}

/* ─── STAT CELL ───────────────────────────────────────────────────────── */
function StatCell({ icon, color, value, label }: {
  icon: string; color: string; value: number; label: string;
}) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  return (
    <View style={s.statCell}>
      <View style={[s.statIconWrap, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

/* ─── TRANSACTION CARD ─────────────────────────────────────────────────── */
function TxCard({ item, index }: { item: any; index: number }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const slideY = useRef(new Animated.Value(14)).current;
  const opac   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 260, delay: Math.min(index * 40, 320), useNativeDriver: true }),
      Animated.timing(opac,   { toValue: 1, duration: 260, delay: Math.min(index * 40, 320), useNativeDriver: true }),
    ]).start();
  }, []);

  const amount = fmtAmount(item.amount || 0);
  const isPos  = (item.transactionType === "recharge" || item.transactionType === "paiement");
  const amtColor = item.status === "réussi" ? C.success : item.status === "échoué" ? C.error : C.muted;

  return (
    <Animated.View style={[s.card, { opacity: opac, transform: [{ translateY: slideY }] }]}>
      <View style={s.cardIcon}>
        <Ionicons name={getTypeIcon(item.transactionType)} size={22} color={C.primary} />
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={1}>
          {item.description || "Transaction"}
        </Text>
        <View style={s.cardMeta}>
          <Text style={s.cardType}>{getTypeLabel(item.transactionType)}</Text>
          <View style={s.metaDot} />
          <Text style={s.cardDate}>{fmtDate(item.createdAt)}</Text>
        </View>
      </View>
      <View style={s.cardRight}>
        <Text style={[s.cardAmount, { color: amtColor }]}>{amount}</Text>
        <Text style={s.cardUnit}>EC</Text>
      </View>
    </Animated.View>
  );
}

/* ─── SKELETON ────────────────────────────────────────────────────────── */
function SkeletonCard() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const breathe = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[s.card, { opacity: breathe }]}>
      <View style={[s.cardIcon, { backgroundColor: C.skeleton }]} />
      <View style={s.cardBody}>
        <View style={{ height: 13, borderRadius: 6, backgroundColor: C.skeleton, width: "70%", marginBottom: 8 }} />
        <View style={{ height: 10, borderRadius: 5, backgroundColor: C.skeleton, width: "45%" }} />
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <View style={{ height: 16, borderRadius: 6, backgroundColor: C.skeleton, width: 40, marginBottom: 4 }} />
        <View style={{ height: 10, borderRadius: 5, backgroundColor: C.skeleton, width: 20 }} />
      </View>
    </Animated.View>
  );
}

/* ─── MAIN ─────────────────────────────────────────────────────────────── */
export default function Stats() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const HEADER_H = insets.top + 64;

  const [userId,     setUserId]     = useState<string | null>(null);
  const [period,     setPeriod]     = useState<PeriodKey>("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);

  const { data: userData } = useGetUserByIdQuery(userId!, { skip: !userId });
  const avatarUri = useMemo(() => {
    const img = userData?.imageUrl;
    if (!img) return "https://www.w3schools.com/howto/img_avatar.png";
    return img.startsWith("http") ? img : `${API_URL_BASE}${img}`;
  }, [userData]);

  const { data, isLoading, refetch } = useGetAllTransactionsQuery(
    { page: 1, pageSize: 1000, paginate: true, id: userId },
    { skip: !userId }
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await refetch(); setRefreshing(false);
  }, [refetch]);

  const byPeriod = useMemo(() => {
    const txs   = data?.data || [];
    const start = getStartDate(period);
    if (!start) return txs;
    return txs.filter((tx: any) => new Date(tx.createdAt) >= start);
  }, [data, period]);

  const counts = useMemo(() => ({
    réussi:       byPeriod.filter((tx: any) => tx.status === "réussi").length,
    échoué:       byPeriod.filter((tx: any) => tx.status === "échoué").length,
    "en attente": byPeriod.filter((tx: any) => tx.status === "en attente").length,
    annuler:      byPeriod.filter((tx: any) => tx.status === "annuler").length,
    total:        byPeriod.length,
  }), [byPeriod]);

  const totalReceived = useMemo(() =>
    byPeriod
      .filter((tx: any) => tx.status === "réussi")
      .reduce((s: number, tx: any) => s + (tx.amount || 0), 0),
    [byPeriod]
  );

  const sorted = useMemo(() =>
    [...byPeriod].sort((a: any, b: any) => (a.createdAt < b.createdAt ? 1 : -1)),
    [byPeriod]
  );

  const periodLabel = PERIODS.find(p => p.key === period)?.label ?? "Tout";

  /* ─── LIST HEADER ─── */
  const ListHeader = (
    <View style={{ paddingTop: HEADER_H }}>
      {/* Period chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipScroll}
        style={{ marginBottom: 20 }}
      >
        {PERIODS.map((p) => {
          const active = period === p.key;
          return (
            <TouchableOpacity
              key={p.key}
              style={[s.periodChip, active && s.periodChipActive]}
              onPress={() => setPeriod(p.key)}
              activeOpacity={0.8}
            >
              <Text style={[s.periodChipText, active && s.periodChipTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Hero card */}
      <View style={s.heroWrap}>
        <LinearGradient
          colors={["#0052FF", C.primary, C.primaryDp]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          {/* Decoration blobs */}
          <View style={s.heroBlobTop} />
          <View style={s.heroBlobBottom} />

          {/* Period badge */}
          <View style={s.heroBadgeWrap}>
            <View style={s.heroBadge}>
              <Ionicons name="trending-up-outline" size={13} color="rgba(255,255,255,0.85)" />
              <Text style={s.heroBadgeText}>{periodLabel.toUpperCase()}</Text>
            </View>
          </View>

          {/* Amount */}
          <Text style={s.heroLabel}>Total Ecoins reçus</Text>
          <Text style={s.heroAmount}>{fmtAmount(totalReceived)}</Text>
          <Text style={s.heroUnit}>Ecoins</Text>

          {/* Sparkline */}
          <View style={{ marginTop: 12, alignItems: "center" }}>
            <Sparkline />
          </View>

          {/* Tx count badge */}
          <View style={s.heroFooter}>
            <View style={s.heroTxBadge}>
              <Ionicons name="checkmark-circle-outline" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={s.heroTxText}>{counts.réussi} transactions réussies</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* 2×2 summary grid */}
      <View style={s.grid}>
        <StatCell icon="checkmark-circle-outline" color={C.success} value={counts.réussi}        label="RÉUSSI"  />
        <StatCell icon="close-circle-outline"     color={C.error}   value={counts.échoué}        label="ÉCHOUÉ"  />
        <StatCell icon="time-outline"             color={C.warning} value={counts["en attente"]} label="ATTENTE" />
        <StatCell icon="ban-outline"              color={C.neutral} value={counts.annuler}       label="ANNULÉ"  />
      </View>

      {/* Section header */}
      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>PAR TYPE DE TRANSACTION</Text>
        <View style={s.sectionBadge}>
          <Text style={s.sectionBadgeText}>{counts.total} TOTAL</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.bg} />

      {/* Fixed glass header */}
      <View style={[s.header, { paddingTop: insets.top, height: HEADER_H }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Statistiques</Text>
          <Text style={s.headerSub}>VUE D'ENSEMBLE</Text>
        </View>

        <View style={s.avatarWrap}>
          <Image
            source={{ uri: avatarUri }}
            style={s.avatar}
            contentFit="cover"
          />
        </View>
      </View>

      {/* List */}
      <FlatList
        data={isLoading ? [] : sorted}
        keyExtractor={(item: any) => item.transactionId?.toString() ?? Math.random().toString()}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.primary]}
            tintColor={C.primary}
            progressViewOffset={HEADER_H}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingHorizontal: 20, gap: 10 }}>
              {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
            </View>
          ) : (
            <View style={s.empty}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="bar-chart-outline" size={32} color={C.muted} />
              </View>
              <Text style={s.emptyTitle}>Aucune transaction</Text>
              <Text style={s.emptySub}>Aucune transaction pour cette période</Text>
            </View>
          )
        }
        renderItem={({ item, index }: any) => (
          <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
            <TxCard item={item} index={index} />
          </View>
        )}
      />
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* Header */
  header: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: C.headerBg,
    borderBottomWidth: 1, borderBottomColor: C.headerBord,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.backBtnBg,
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { alignItems: "center" },
  headerTitle:  { fontFamily: "NexaBold", fontSize: 17, color: C.primary, letterSpacing: 0.2 },
  headerSub:    { fontFamily: "NexaRegular", fontSize: 10, color: C.muted, letterSpacing: 2, marginTop: 1 },
  avatarWrap: {
    width: 38, height: 38, borderRadius: 19,
    overflow: "hidden",
    borderWidth: 1, borderColor: C.avatarBord,
  },
  avatar: { width: "100%", height: "100%" },

  /* List */
  listContent: { paddingBottom: 120 },

  /* Period chips */
  chipScroll:         { paddingHorizontal: 20, gap: 10 },
  periodChip:         { paddingHorizontal: 22, paddingVertical: 9, borderRadius: 999, backgroundColor: C.chipBg, borderWidth: 1, borderColor: C.chipBord },
  periodChipActive:   { backgroundColor: C.primary, borderColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  periodChipText:     { fontFamily: "NexaBold", fontSize: 12, color: C.muted, letterSpacing: 0.5 },
  periodChipTextActive: { color: C.white },

  /* Hero */
  heroWrap:  { marginHorizontal: 20, marginBottom: 20 },
  hero: {
    borderRadius: 24, padding: 22, alignItems: "center", overflow: "hidden",
    shadowColor: C.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 20,
    elevation: 10,
  },
  heroBlobTop:    { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.08)", top: -60, left: -40 },
  heroBlobBottom: { position: "absolute", width: 140, height: 140, borderRadius: 70,  backgroundColor: "rgba(0,0,0,0.07)", bottom: -50, right: -30 },

  heroBadgeWrap: { marginBottom: 14 },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  heroBadgeText: { fontFamily: "NexaBold", fontSize: 9, color: "rgba(255,255,255,0.85)", letterSpacing: 2 },

  heroLabel:  { fontFamily: "NexaRegular", fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4, letterSpacing: 0.3 },
  heroAmount: { fontFamily: "NexaBold", fontSize: 50, color: C.white, lineHeight: 56 },
  heroUnit:   { fontFamily: "NexaRegular", fontSize: 13, color: "rgba(255,255,255,0.85)", letterSpacing: 4, textTransform: "uppercase", marginBottom: 4 },

  heroFooter: { marginTop: 16 },
  heroTxBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  heroTxText: { fontFamily: "NexaBold", fontSize: 12, color: C.white, letterSpacing: 0.3 },

  /* 2×2 grid */
  grid: {
    flexDirection: "row", flexWrap: "wrap", gap: 12,
    paddingHorizontal: 20, marginBottom: 28,
  },
  statCell: {
    flex: 1, minWidth: "44%",
    backgroundColor: C.bg, borderRadius: 20,
    padding: 20, alignItems: "center",
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10,
    elevation: 2,
  },
  statIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  statValue:    { fontFamily: "NexaBold", fontSize: 26, color: C.text, marginBottom: 2 },
  statLabel:    { fontFamily: "NexaBold", fontSize: 9, color: C.muted, letterSpacing: 2 },

  /* Section header */
  sectionRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, marginBottom: 14,
  },
  sectionTitle: { fontFamily: "NexaBold", fontSize: 10, color: C.text, letterSpacing: 1.5 },
  sectionBadge: { backgroundColor: C.sectionBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  sectionBadgeText: { fontFamily: "NexaBold", fontSize: 9, color: C.primary, letterSpacing: 1.2 },

  /* Transaction card */
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.bg, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10,
    elevation: 2,
  },
  cardIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: C.cardIconBg,
    alignItems: "center", justifyContent: "center",
  },
  cardBody:   { flex: 1 },
  cardTitle:  { fontFamily: "NexaBold", fontSize: 14, color: C.text, marginBottom: 6, lineHeight: 18 },
  cardMeta:   { flexDirection: "row", alignItems: "center", gap: 8 },
  cardType:   { fontFamily: "NexaBold", fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" },
  metaDot:    { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.border },
  cardDate:   { fontFamily: "NexaRegular", fontSize: 11, color: C.muted },
  cardRight:  { alignItems: "flex-end" },
  cardAmount: { fontFamily: "NexaBold", fontSize: 20, lineHeight: 24 },
  cardUnit:   { fontFamily: "NexaBold", fontSize: 8, color: C.muted, letterSpacing: 1.5, marginTop: 2 },

  /* Empty */
  empty:        { alignItems: "center", paddingTop: 50, paddingHorizontal: 40, gap: 10 },
  emptyIconWrap:{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.emptyBg, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle:   { fontFamily: "NexaBold", fontSize: 15, color: C.text },
  emptySub:     { fontFamily: "NexaRegular", fontSize: 13, color: C.muted, textAlign: "center" },
}); }
