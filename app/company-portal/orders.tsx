import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
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
import { useGetCompanyOrdersQuery, useUpdateOrderStatusMutation } from "@/services/orderService";
import { useAppTheme } from "@/app/_layout";

/* ─── THEME ──────────────────────────────────────────────────────────── */
const C = {
  primary: "#0353CC", violet: "#3906C7", deep: "#302E99",
  accent: "#4D96FF", gold: "#FFD700", green: "#22C55E",
  red: "#EF4444", orange: "#F97316", white: "#FFFFFF",
  text: "#0D1B3E", muted: "#7B8DB0", f4: "#F4F6FB",
};
const TH = {
  light: { bg: "#F0F4FF", card: "#FFFFFF", text: "#0D1B3E", sub: "#7B8DB0", border: "rgba(3,83,204,0.10)", headerGrad: [C.deep, C.primary] as [string, string] },
  dark:  { bg: "#0A0F1E", card: "#111827", text: "#E2E8F0", sub: "#64748B", border: "rgba(255,255,255,0.08)", headerGrad: ["#060B18", "#0D1B3E"] as [string, string] },
};

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

const STATUS_META: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  pending:    { label: "En attente",     color: C.orange,  icon: "time-outline" },
  confirmed:  { label: "Confirmée",      color: C.primary, icon: "checkmark-circle-outline" },
  processing: { label: "En préparation", color: C.violet,  icon: "construct-outline" },
  shipped:    { label: "En livraison",   color: C.accent,  icon: "bicycle-outline" },
  delivered:  { label: "Livrée",         color: C.green,   icon: "bag-check-outline" },
  cancelled:  { label: "Annulée",        color: C.red,     icon: "close-circle-outline" },
};

const STATUS_FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all",       label: "Toutes" },
  { key: "pending",   label: "En attente" },
  { key: "confirmed", label: "Confirmées" },
  { key: "processing",label: "En prépa." },
  { key: "shipped",   label: "Livraison" },
  { key: "delivered", label: "Livrées" },
  { key: "cancelled", label: "Annulées" },
];

/* Next actions available per status */
const NEXT_ACTIONS: Partial<Record<OrderStatus, { status: OrderStatus; label: string; color: string }[]>> = {
  pending:    [
    { status: "confirmed", label: "Accepter",  color: C.green },
    { status: "cancelled", label: "Refuser",   color: C.red },
  ],
  confirmed:  [{ status: "processing", label: "En préparation", color: C.violet }],
  processing: [{ status: "shipped",    label: "Expédier",       color: C.accent }],
  shipped:    [{ status: "delivered",  label: "Marquer livré",  color: C.green }],
};

/* ─── ORDER CARD ─────────────────────────────────────────────────────── */
function OrderCard({
  order, t, isDark, onAction,
}: {
  order: any; t: typeof TH.light; isDark: boolean;
  onAction: (orderId: number, status: OrderStatus) => void;
}) {
  const status: OrderStatus = order.status ?? "pending";
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  const actions = NEXT_ACTIONS[status] ?? [];
  const items: any[] = order.items || [];
  const date = new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <View style={[oc.card, { backgroundColor: t.card, borderColor: t.border }]}>
      {/* Header */}
      <View style={oc.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[oc.orderNum, { color: t.text }]} numberOfLines={1}>{order.orderNumber}</Text>
          <Text style={[oc.date, { color: t.sub }]}>{date}</Text>
        </View>
        <View style={[oc.statusChip, { backgroundColor: meta.color + "18" }]}>
          <Ionicons name={meta.icon as any} size={13} color={meta.color} />
          <Text style={[oc.statusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      {/* Client */}
      {order.user && (
        <View style={[oc.clientRow, { borderColor: t.border }]}>
          <Ionicons name="person-outline" size={14} color={C.primary} />
          <Text style={[oc.clientText, { color: t.text }]}>
            {order.user.username || order.user.email}
          </Text>
        </View>
      )}

      {/* Items */}
      <View style={[oc.itemsWrap, { borderColor: t.border }]}>
        {items.slice(0, 3).map((item, i) => (
          <View key={i} style={oc.itemRow}>
            <Text style={[oc.itemName, { color: t.sub }]} numberOfLines={1}>{item.product?.name || "Produit"}</Text>
            <Text style={oc.itemQty}>×{item.qty}</Text>
            <Text style={[oc.itemPrice, { color: t.text }]}>{parseFloat(item.totalAmount).toFixed(2)} EC</Text>
          </View>
        ))}
        {items.length > 3 && (
          <Text style={[oc.moreItems, { color: t.sub }]}>+ {items.length - 3} autre{items.length - 3 > 1 ? "s" : ""}</Text>
        )}
      </View>

      {/* Total */}
      <View style={oc.totalRow}>
        <Text style={[oc.totalLabel, { color: t.sub }]}>Total</Text>
        <Text style={oc.totalVal}>{order.grandTotal?.toFixed(2) ?? "—"} EC</Text>
      </View>

      {/* Adresse */}
      {order.shippingAddress && (
        <View style={oc.addrRow}>
          <Ionicons name="location-outline" size={13} color={C.muted} />
          <Text style={[oc.addrText, { color: t.sub }]} numberOfLines={2}>{order.shippingAddress}</Text>
        </View>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <View style={oc.actionsRow}>
          {actions.map(action => (
            <TouchableOpacity
              key={action.status}
              style={[oc.actionBtn, { backgroundColor: action.color + "15", borderColor: action.color + "40" }]}
              onPress={() => onAction(order.orderId, action.status)}
              activeOpacity={0.8}
            >
              <Text style={[oc.actionText, { color: action.color }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function CompanyOrders() {
  const router         = useRouter();
  const { isDark } = useAppTheme();
  const t = isDark ? TH.dark : TH.light;
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  const { data, isLoading, refetch, isFetching } = useGetCompanyOrdersQuery({ paginate: false });
  const [updateStatus, { isLoading: updating }]  = useUpdateOrderStatusMutation();

  const allOrders: any[] = data?.data || [];
  const orders = filter === "all" ? allOrders : allOrders.filter(o => o.status === filter);

  /* Group by orderNumber to show per-order stats */
  const grouped = Object.values(
    allOrders.reduce((acc: any, o: any) => {
      if (!acc[o.orderNumber]) {
        acc[o.orderNumber] = { ...o, items: [] };
      }
      if (o.product) acc[o.orderNumber].items.push({ product: o.product, qty: o.quantity, totalAmount: o.totalAmount });
      return acc;
    }, {})
  );

  const filteredGroups = filter === "all" ? grouped : (grouped as any[]).filter((o: any) => o.status === filter);

  const handleAction = (orderId: number, status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      confirmed:  "Accepter cette commande ?",
      cancelled:  "Refuser / annuler cette commande ?",
      processing: "Marquer comme en préparation ?",
      shipped:    "Marquer comme expédiée ?",
      delivered:  "Marquer comme livrée ?",
      pending:    "",
    };
    Alert.alert(labels[status] || "Changer le statut", "", [
      { text: "Annuler", style: "cancel" },
      { text: "Confirmer", onPress: async () => {
        try {
          await updateStatus({ id: orderId, status }).unwrap();
          refetch();
        } catch {
          Alert.alert("Erreur", "Impossible de mettre à jour le statut");
        }
      }},
    ]);
  };

  const pendingCount = allOrders.filter(o => o.status === "pending").length;

  return (
    <SafeAreaView style={[s.flex, { backgroundColor: t.bg }]} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={t.headerGrad} style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={C.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Portail entreprise</Text>
          <Text style={s.headerSub}>Gestion des commandes</Text>
        </View>
        {pendingCount > 0 && (
          <View style={s.pendingBadge}>
            <Text style={s.pendingText}>{pendingCount} en attente</Text>
          </View>
        )}
        <TouchableOpacity style={s.refreshBtn} onPress={() => refetch()} disabled={isFetching}>
          {isFetching
            ? <ActivityIndicator size="small" color={C.white} />
            : <Ionicons name="refresh" size={20} color={C.white} />
          }
        </TouchableOpacity>
      </LinearGradient>

      {/* Filter tabs */}
      <FlatList
        data={STATUS_FILTERS}
        keyExtractor={f => f.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterList}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[s.filterTab, filter === f.key && s.filterTabActive]}
            onPress={() => setFilter(f.key as any)}
          >
            <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        )}
      />

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : filteredGroups.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="receipt-outline" size={48} color={C.muted} />
          <Text style={[s.emptyText, { color: t.sub }]}>Aucune commande</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item: any) => item.orderNumber}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              t={t}
              isDark={isDark}
              onAction={handleAction}
            />
          )}
          contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={C.primary} />}
        />
      )}
    </SafeAreaView>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  flex:   { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  headerTitle: { color: C.white, fontFamily: "NexaLight", fontSize: 15, fontWeight: "700" },
  headerSub:   { color: "rgba(255,255,255,0.65)", fontFamily: "NexaLight", fontSize: 11 },
  pendingBadge: { backgroundColor: C.gold, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  pendingText:  { color: C.text, fontFamily: "NexaLight", fontSize: 11, fontWeight: "700" },
  refreshBtn:   { padding: 8 },

  filterList: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: "rgba(3,83,204,0.08)", borderWidth: 1, borderColor: "rgba(3,83,204,0.12)",
  },
  filterTabActive:  { backgroundColor: C.primary, borderColor: C.primary },
  filterText:       { fontFamily: "NexaLight", fontSize: 12, color: C.muted },
  filterTextActive: { color: C.white, fontWeight: "700" },

  emptyText: { fontFamily: "NexaLight", fontSize: 14 },
});

const oc = StyleSheet.create({
  card: {
    borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 12,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  orderNum:   { fontFamily: "NexaLight", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  date:       { fontFamily: "NexaLight", fontSize: 11, marginTop: 2 },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontFamily: "NexaLight", fontSize: 11, fontWeight: "700" },

  clientRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, borderTopWidth: 1, marginBottom: 8 },
  clientText: { fontFamily: "NexaLight", fontSize: 12, flex: 1 },

  itemsWrap: { borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 8, marginBottom: 8, gap: 4 },
  itemRow:   { flexDirection: "row", alignItems: "center", gap: 6 },
  itemName:  { flex: 1, fontFamily: "NexaLight", fontSize: 12 },
  itemQty:   { fontFamily: "NexaLight", fontSize: 11, color: C.muted },
  itemPrice: { fontFamily: "NexaLight", fontSize: 12, fontWeight: "600", minWidth: 60, textAlign: "right" },
  moreItems: { fontFamily: "NexaLight", fontSize: 11, marginTop: 2 },

  totalRow:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  totalLabel: { fontFamily: "NexaLight", fontSize: 12 },
  totalVal:   { fontFamily: "NexaLight", fontSize: 14, fontWeight: "700", color: C.primary },

  addrRow:  { flexDirection: "row", gap: 6, alignItems: "flex-start", marginBottom: 10 },
  addrText: { fontFamily: "NexaLight", fontSize: 11, flex: 1, lineHeight: 16 },

  actionsRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  actionBtn: {
    flex: 1, borderRadius: 12, borderWidth: 1,
    paddingVertical: 9, alignItems: "center",
  },
  actionText: { fontFamily: "NexaLight", fontSize: 12, fontWeight: "700" },
});
