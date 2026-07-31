import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useGetUserOrdersQuery } from "@/services/orderService";
import { useAppTheme } from "@/app/_layout";

/* ─── THEME ──────────────────────────────────────────────────────────── */
const C = {
  primary: "#0353CC", violet: "#3906C7", deep: "#302E99",
  accent: "#4D96FF", gold: "#FFD700", green: "#22C55E",
  red: "#EF4444", orange: "#F97316", white: "#FFFFFF",
  text: "#0D1B3E", muted: "#7B8DB0", f4: "#F4F6FB",
};
const TH = {
  light: {
    bg: "#F0F4FF", card: "#FFFFFF", text: "#0D1B3E", sub: "#5A6A8A",
    border: "rgba(3,83,204,0.12)",
    filterBg: "#FFFFFF", filterBorder: "rgba(3,83,204,0.18)", filterText: "#3D4F70",
    headerGrad: [C.deep, C.primary] as [string, string],
    primary: C.primary,
  },
  dark: {
    bg: "#0A0F1E", card: "#111827", text: "#E2E8F0", sub: "#94A3B8",
    border: "rgba(255,255,255,0.10)",
    filterBg: "#1E2A3A", filterBorder: "rgba(255,255,255,0.14)", filterText: "#CBD5E1",
    headerGrad: ["#060B18", "#0D1B3E"] as [string, string],
    primary: "#4D8DFF",
  },
};

/* ─── STATUS META ─────────────────────────────────────────────────────── */
type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

const STATUS_META: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  pending:    { label: "En attente",     color: C.orange,  icon: "time-outline" },
  confirmed:  { label: "Confirmée",      color: C.primary, icon: "checkmark-circle-outline" },
  processing: { label: "En préparation", color: C.violet,  icon: "construct-outline" },
  shipped:    { label: "En livraison",   color: C.accent,  icon: "bicycle-outline" },
  delivered:  { label: "Livrée",         color: C.green,   icon: "bag-check-outline" },
  cancelled:  { label: "Annulée",        color: C.red,     icon: "close-circle-outline" },
};

const STATUS_FILTERS: { key: OrderStatus | "all"; label: string; color: string }[] = [
  { key: "all",        label: "Toutes",         color: C.primary },
  { key: "pending",    label: "En attente",      color: C.orange },
  { key: "confirmed",  label: "Confirmées",      color: C.primary },
  { key: "processing", label: "En préparation",  color: C.violet },
  { key: "shipped",    label: "En livraison",    color: C.accent },
  { key: "delivered",  label: "Livrées",         color: C.green },
  { key: "cancelled",  label: "Annulées",        color: C.red },
];

/* ─── ORDER CARD ─────────────────────────────────────────────────────── */
function OrderCard({
  order, t, isDark, onPress,
}: {
  order: any; t: typeof TH.light; isDark: boolean; onPress: () => void;
}) {
  const status: OrderStatus = order.status ?? "pending";
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  const items: any[] = order.items || [];
  const isActive = !["delivered", "cancelled"].includes(status);

  const date = (() => {
    try {
      return new Date(order.createdAt).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return "—"; }
  })();

  return (
    <TouchableOpacity
      style={[oc.card, { backgroundColor: t.card, borderColor: t.border }]}
      onPress={onPress}
      activeOpacity={0.80}
    >
      {/* Bande colorée gauche */}
      <View style={[oc.stripe, { backgroundColor: meta.color }]} />

      <View style={oc.body}>
        {/* Header : numéro + statut */}
        <View style={oc.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[oc.orderNum, { color: t.text }]} numberOfLines={1}>
              {order.orderNumber}
            </Text>
            <Text style={[oc.date, { color: t.sub }]}>{date}</Text>
          </View>
          <View style={[oc.statusChip, { backgroundColor: meta.color + "20" }]}>
            <Ionicons name={meta.icon as any} size={13} color={meta.color} />
            <Text style={[oc.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        {/* Articles */}
        {items.length > 0 && (
          <View style={[oc.itemsBox, { borderColor: t.border }]}>
            {items.slice(0, 2).map((item, i) => (
              <View key={i} style={oc.itemRow}>
                <View style={[oc.itemDot, { backgroundColor: t.primary }]} />
                <Text style={[oc.itemName, { color: t.text }]} numberOfLines={1}>
                  {item.product?.name || "Produit"}
                </Text>
                <Text style={[oc.itemQty, { color: t.sub }]}>  ×{item.qty ?? 1}</Text>
              </View>
            ))}
            {items.length > 2 && (
              <Text style={[oc.more, { color: t.sub }]}>
                + {items.length - 2} autre{items.length - 2 > 1 ? "s" : ""}
              </Text>
            )}
          </View>
        )}

        {/* Footer : total + bouton */}
        <View style={oc.footer}>
          <Text style={[oc.totalVal, { color: t.primary }]}>
            {order.grandTotal?.toFixed(2) ?? "—"} EC
          </Text>
          <View style={[oc.trackBtn, { backgroundColor: isActive ? t.primary + "12" : t.border }]}>
            <Text style={[oc.trackText, { color: isActive ? t.primary : t.sub }]}>
              {isActive ? "Suivre" : "Détails"}
            </Text>
            <Ionicons name="chevron-forward" size={13} color={isActive ? t.primary : t.sub} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ─── MAIN SCREEN ─────────────────────────────────────────────────────── */
export default function MyOrders() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const t = isDark ? TH.dark : TH.light;
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  const { data, isLoading, isFetching, refetch } = useGetUserOrdersQuery({});

  const allOrders: any[] = Array.isArray(data) ? data : (data?.data ?? []);
  const orders = filter === "all"
    ? allOrders
    : allOrders.filter(o => o.status === filter);

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER ── */}
      <View style={[s.header, { shadowColor: isDark ? "#000" : C.primary }]}>
        <LinearGradient
          colors={t.headerGrad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.deco1} />
        <View style={s.deco2} />

        <SafeAreaView edges={["top"]}>
          <View style={s.topBar}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={C.white} />
            </TouchableOpacity>

            <View style={s.titleWrap}>
              <View style={s.titleBadge}>
                <Ionicons name="receipt-outline" size={13} color={C.gold} />
              </View>
              <Text style={s.headerTitle}>MES COMMANDES</Text>
            </View>

            <TouchableOpacity style={s.iconBtn} onPress={() => refetch()} disabled={isFetching}>
              {isFetching
                ? <ActivityIndicator size="small" color={C.white} />
                : <Ionicons name="refresh" size={19} color={C.white} />
              }
            </TouchableOpacity>
          </View>

          <Text style={s.headerSub}>
            {allOrders.length} commande{allOrders.length !== 1 ? "s" : ""} au total
          </Text>
        </SafeAreaView>
      </View>

      {/* ── FILTRES ── */}
      <View style={s.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterScroll}
        >
          {STATUS_FILTERS.map(f => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  s.filterTab,
                  { backgroundColor: active ? f.color : t.filterBg, borderColor: active ? f.color : t.filterBorder },
                ]}
                onPress={() => setFilter(f.key as any)}
                activeOpacity={0.75}
              >
                {active && (
                  <View style={[s.filterDot, { backgroundColor: C.white }]} />
                )}
                <Text style={[
                  s.filterText,
                  { color: active ? C.white : t.filterText },
                ]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── CONTENU ── */}
      <View style={{ flex: 1 }}>
        {isLoading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={[s.loadingText, { color: t.sub }]}>Chargement…</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={s.center}>
            <View style={[s.emptyIconWrap, { backgroundColor: C.primary + "12" }]}>
              <Ionicons name="receipt-outline" size={36} color={C.primary} />
            </View>
            <Text style={[s.emptyTitle, { color: t.text }]}>Aucune commande</Text>
            <Text style={[s.emptySub, { color: t.sub }]}>
              {filter === "all"
                ? "Vous n'avez pas encore passé de commande."
                : "Aucune commande avec ce statut."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={item => item.orderNumber}
            renderItem={({ item }) => (
              <OrderCard
                order={item}
                t={t}
                isDark={isDark}
                onPress={() =>
                  router.push({
                    pathname: "/bim-supermarche/order-tracking",
                    params: { orderNumber: item.orderNumber },
                  })
                }
              />
            )}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={C.primary} />
            }
          />
        )}
      </View>
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 14, padding: 32 },

  /* Header */
  header: {
    overflow: "hidden",
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    paddingBottom: 18,
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16,
  },
  deco1: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(255,255,255,0.05)", top: -70, right: -60 },
  deco2: { position: "absolute", width: 130, height: 130, borderRadius: 65,  backgroundColor: "rgba(255,255,255,0.04)", bottom: -30, left: -30 },

  topBar:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 8 },
  iconBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  titleWrap:  { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, justifyContent: "center" },
  titleBadge: { width: 28, height: 28, borderRadius: 9, backgroundColor: "rgba(255,215,0,0.22)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: C.white, fontSize: 14, fontFamily: "NexaLight", letterSpacing: 2, fontWeight: "700" },
  headerSub:   { color: "rgba(255,255,255,0.65)", fontFamily: "NexaLight", fontSize: 12, paddingHorizontal: 20, marginTop: 6 },

  /* Filtres */
  filterWrapper: { paddingVertical: 10 },
  filterScroll:  { paddingHorizontal: 16, gap: 8 },
  filterTab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 22, borderWidth: 1.5,
    elevation: 1,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  filterDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: C.white },
  filterText: { fontFamily: "NexaLight", fontSize: 13, fontWeight: "600" },

  /* Empty */
  emptyIconWrap: { width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontFamily: "NexaLight", fontSize: 16, fontWeight: "700" },
  emptySub:   { fontFamily: "NexaLight", fontSize: 13, textAlign: "center", lineHeight: 20 },
  loadingText: { fontFamily: "NexaLight", fontSize: 13 },

  /* List */
  list: { padding: 14, paddingBottom: 30 },
});

const oc = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 18, borderWidth: 1, marginBottom: 12, overflow: "hidden",
    elevation: 3, shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
  },
  stripe: { width: 5 },
  body:   { flex: 1, padding: 14 },

  row:        { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  orderNum:   { fontFamily: "NexaLight", fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
  date:       { fontFamily: "NexaLight", fontSize: 11, marginTop: 3 },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontFamily: "NexaLight", fontSize: 11, fontWeight: "700" },

  itemsBox:  { borderTopWidth: 1, paddingTop: 8, marginBottom: 10, gap: 6 },
  itemRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  itemDot:   { width: 5, height: 5, borderRadius: 2.5 },
  itemName:  { flex: 1, fontFamily: "NexaLight", fontSize: 12, fontWeight: "600" },
  itemQty:   { fontFamily: "NexaLight", fontSize: 12 },
  more:      { fontFamily: "NexaLight", fontSize: 11, marginTop: 2, paddingLeft: 13 },

  footer:    { flexDirection: "row", alignItems: "center", marginTop: 2 },
  totalVal:  { fontFamily: "NexaLight", fontSize: 15, fontWeight: "700", flex: 1 },
  trackBtn:  { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  trackText: { fontFamily: "NexaLight", fontSize: 12, fontWeight: "700" },
});
