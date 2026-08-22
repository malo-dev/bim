/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetUserOrdersQuery } from "@/services/orderService";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useAppTheme } from "@/app/_layout";

/* ─── PALETTE ────────────────────────────────────────────────────────── */
const LIGHT = {
  primary: "#0035C5",
  text:    "#1A1C1C",
  textSec: "#434657",
  textMut: "#747688",
  bg:      "#F9F9F9",
  white:   "#FFFFFF",
  green:   "#10B981",
  amber:   "#F59E0B",
  red:     "#EF4444",
  border:  "rgba(196,197,218,0.30)",
};
const DARK: typeof LIGHT = {
  primary: "#4D8DFF",
  text:    "#EAF0FF",
  textSec: "#9FB0D0",
  textMut: "#6B7A99",
  bg:      "#0B1220",
  white:   "#FFFFFF",
  green:   "#10B981",
  amber:   "#F59E0B",
  red:     "#EF4444",
  border:  "rgba(31,42,68,0.80)",
};

type StatusFilter = "Tout" | "pending" | "processing" | "shipped" | "delivered" | "cancelled";
type SortType     = "recent" | "ancien" | "montant_desc" | "montant_asc";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "Tout",        label: "Tout"         },
  { value: "pending",     label: "En attente"   },
  { value: "processing",  label: "En cours"     },
  { value: "shipped",     label: "En livraison" },
  { value: "delivered",   label: "Livré"        },
  { value: "cancelled",   label: "Annulé"       },
];

const SORTS: { value: SortType; label: string }[] = [
  { value: "recent",       label: "Plus récent" },
  { value: "ancien",       label: "Plus ancien" },
  { value: "montant_desc", label: "Montant ↓"   },
  { value: "montant_asc",  label: "Montant ↑"   },
];

function getStatusStyle(status: string, C: typeof LIGHT): { color: string; bg: string; label: string; icon: any } {
  switch ((status ?? "").toLowerCase()) {
    case "delivered":
    case "completed":  return { color: C.green,   bg: "rgba(16,185,129,0.08)",  label: "Livré",         icon: "checkmark-circle-outline" };
    case "pending":    return { color: C.amber,   bg: "rgba(245,158,11,0.08)",  label: "En attente",    icon: "time-outline"             };
    case "processing": return { color: C.primary, bg: "rgba(0,53,197,0.07)",    label: "En cours",      icon: "cube-outline"             };
    case "shipped":    return { color: "#0047FF",  bg: "rgba(0,71,255,0.08)",   label: "En livraison",  icon: "bicycle-outline"          };
    case "cancelled":  return { color: C.red,     bg: "rgba(239,68,68,0.07)",   label: "Annulé",        icon: "close-circle-outline"     };
    default:           return { color: C.textMut, bg: "rgba(116,118,136,0.07)", label: status ?? "—",   icon: "ellipse-outline"          };
  }
}

function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function OrderCard({ order, onPress }: { order: any; onPress: () => void }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const st = getStatusStyle(order.status, C);
  const total    = Number(order.totalAmount ?? order.total ?? 0).toFixed(2);
  const ref      = order.orderNumber ? `#BIM-${order.orderNumber}` : `#${order.id}`;
  const date     = formatDate(order.createdAt);
  const company  = order.companyName ?? order.company?.name ?? "Commande";
  const items    = order.items?.length ?? order.itemCount ?? 0;

  return (
    <TouchableOpacity style={s.orderCard} onPress={onPress} activeOpacity={0.85}>
      {/* left icon */}
      <View style={[s.orderIcon, { backgroundColor: st.bg }]}>
        <Ionicons name={st.icon} size={22} color={st.color} />
      </View>

      {/* content */}
      <View style={s.orderBody}>
        <View style={s.orderTopRow}>
          <Text style={s.orderRef}>{ref}</Text>
          <Text style={[s.statusPill, { backgroundColor: st.bg, color: st.color }]}>{st.label}</Text>
        </View>
        <Text style={s.orderCompany} numberOfLines={1}>{company}</Text>
        <View style={s.orderMeta}>
          <Text style={s.orderDate}>{date}</Text>
          {items > 0 && <Text style={s.orderDate}> · {items} article{items > 1 ? "s" : ""}</Text>}
        </View>
      </View>

      {/* amount + chevron */}
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={s.orderTotal}>{total} EC</Text>
        <Ionicons name="chevron-forward" size={16} color={C.textMut} />
      </View>
    </TouchableOpacity>
  );
}

export default function MesCommandesScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router = useRouter();
  const { unread } = useUnreadNotifications();
  const [userId,       setUserId]       = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Tout");
  const [sort,         setSort]         = useState<SortType>("recent");
  const [search,       setSearch]       = useState("");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);

  const { data, isLoading, refetch } = useGetUserOrdersQuery(
    { page: 1, pageSize: 100 },
    { skip: !userId }
  );

  const allOrders: any[] = data?.data || data || [];

  const filtered = useMemo(() => {
    let list = [...allOrders];

    if (search.length >= 2) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        (o.orderNumber ?? "").toString().includes(q) ||
        (o.companyName ?? o.company?.name ?? "").toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "Tout") {
      list = list.filter(o => (o.status ?? "").toLowerCase() === statusFilter);
    }

    switch (sort) {
      case "recent":
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "ancien":
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "montant_desc":
        list.sort((a, b) => Number(b.totalAmount ?? b.total ?? 0) - Number(a.totalAmount ?? a.total ?? 0));
        break;
      case "montant_asc":
        list.sort((a, b) => Number(a.totalAmount ?? a.total ?? 0) - Number(b.totalAmount ?? b.total ?? 0));
        break;
    }

    return list;
  }, [allOrders, statusFilter, sort, search]);

  const currentSortLabel = SORTS.find(s => s.value === sort)?.label ?? "Trier";

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ── TOP BAR ──────────────────────────────────────────────────── */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "rgba(255,255,255,0.90)" }}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={s.topTitle}>Mes Commandes</Text>
          <TouchableOpacity style={s.iconBtnRel} onPress={() => router.push("/notification" as any)}>
            <Ionicons name="notifications-outline" size={22} color={C.textSec} />
            {unread > 0 && (
              <View style={s.badge}><Text style={s.badgeText}>{unread > 99 ? "99+" : unread}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── LIST + HEADER ────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => `${item.id ?? "o"}-${i}`}
          ListHeaderComponent={
            <View>
              {/* Search + Sort */}
              <View style={s.searchWrap}>
                <View style={s.searchBox}>
                  <Ionicons name="search-outline" size={16} color={C.textMut} />
                  <TextInput
                    placeholder="Rechercher une commande..."
                    placeholderTextColor={C.textMut}
                    value={search}
                    onChangeText={setSearch}
                    style={s.searchInput}
                  />
                  {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch("")}>
                      <Ionicons name="close-circle" size={16} color={C.textMut} />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity style={s.sortBtn} onPress={() => setShowSortMenu(v => !v)}>
                  <Ionicons name="funnel-outline" size={16} color={C.primary} />
                  <Text style={s.sortBtnText}>{currentSortLabel}</Text>
                  <Ionicons name={showSortMenu ? "chevron-up" : "chevron-down"} size={14} color={C.primary} />
                </TouchableOpacity>
              </View>

              {/* Sort dropdown */}
              {showSortMenu && (
                <View style={s.sortMenu}>
                  {SORTS.map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[s.sortOption, sort === opt.value && s.sortOptionActive]}
                      onPress={() => { setSort(opt.value); setShowSortMenu(false); }}
                    >
                      <Text style={[s.sortOptionText, sort === opt.value && { color: C.white }]}>{opt.label}</Text>
                      {sort === opt.value && <Ionicons name="checkmark" size={14} color={C.white} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Filter pills */}
              <View style={s.pillsWrap}>
                {STATUS_FILTERS.map(f => (
                  <TouchableOpacity
                    key={f.value}
                    style={[s.pill, statusFilter === f.value && s.pillActive]}
                    onPress={() => setStatusFilter(f.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.pillText, statusFilter === f.value && s.pillTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={s.center}>
              <Ionicons name="bag-outline" size={40} color={C.textMut} />
              <Text style={s.emptyText}>Aucune commande trouvée</Text>
            </View>
          }
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() =>
                item.orderNumber
                  ? router.push({ pathname: "/bim-supermarche/order-tracking", params: { orderNumber: item.orderNumber } } as any)
                  : undefined
              }
            />
          )}
        />
      )}
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(196,197,218,0.18)",
  },
  iconBtn:     { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  iconBtnRel:  { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  topTitle:    { fontFamily: "NexaBold", fontSize: 17, color: C.text },
  badge:       { position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText:   { fontFamily: "NexaBold", fontSize: 9, color: "#FFFFFF" },

  searchWrap: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 14 },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.white, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 12, height: 44,
    elevation: 2, shadowColor: "#0035C5", shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: "NexaLight", color: C.text },
  sortBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,53,197,0.06)",
    borderRadius: 12, paddingHorizontal: 10, height: 44,
    borderWidth: 1, borderColor: "rgba(0,53,197,0.10)",
  },
  sortBtnText: { fontFamily: "NexaBold", fontSize: 11, color: C.primary },

  sortMenu: {
    marginHorizontal: 16, marginTop: 6,
    backgroundColor: C.white, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
    elevation: 8, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
  },
  sortOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: "rgba(196,197,218,0.15)",
  },
  sortOptionActive: { backgroundColor: C.primary },
  sortOptionText:   { fontFamily: "NexaBold", fontSize: 13, color: C.text },

  pillsWrap: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, gap: 8 },
  pill:      { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 24, backgroundColor: C.white, borderWidth: 1.5, borderColor: "rgba(100,110,180,0.35)" },
  pillActive:     { backgroundColor: C.primary, borderColor: C.primary },
  pillText:       { fontFamily: "NexaBold", fontSize: 12, color: C.textSec },
  pillTextActive: { color: C.white },

  list: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 4 },

  orderCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "rgba(255,255,255,0.70)",
    borderRadius: 22, padding: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.80)",
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 20, shadowOffset: { width: 0, height: 6 },
  },
  orderIcon:   { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  orderBody:   { flex: 1, gap: 3 },
  orderTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  orderRef:    { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  statusPill:  { fontFamily: "NexaBold", fontSize: 9, letterSpacing: 0.8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  orderCompany:{ fontFamily: "NexaLight", fontSize: 12, color: C.textSec },
  orderMeta:   { flexDirection: "row" },
  orderDate:   { fontFamily: "NexaLight", fontSize: 10, color: C.textMut, textTransform: "uppercase", letterSpacing: 0.5 },
  orderTotal:  { fontFamily: "NexaBold", fontSize: 14, color: C.text },

  center:    { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "NexaLight", fontSize: 14, color: C.textMut },
}); }
