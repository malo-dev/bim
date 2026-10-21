import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetAllOrdersQuery, useUpdateOrderStatusMutation, useDeleteorderMutation } from "@/services/orderService";
import { useAppTheme } from "@/app/_layout";
import { QUICK_PERIODS, QuickPeriod, quickPeriodRange, toLocalDateStr } from "@/utils/quickPeriod.util";
import HorizontalFadeScroll from "@/components/ui/HorizontalFadeScroll";

const LIGHT = {
  bg: "#F8F9FF", primary: "#0035C5", text: "#1A1C1C", muted: "#747688",
  border: "#E2E2E2", card: "#FFFFFF",
  amber: "#F59E0B", green: "#10B981", blue: "#0047FF", red: "#EF4444", purple: "#7C3AED",
};
const DARK: typeof LIGHT = {
  bg: "#0B1220", primary: "#4D8DFF", text: "#EAF0FF", muted: "#6B7A99",
  border: "rgba(31,42,68,0.80)", card: "#1A2540",
  amber: "#D97706", green: "#059669", blue: "#4D8DFF", red: "#DC2626", purple: "#7C3AED",
};

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
const STATUS_LABEL: Record<string, string> = {
  pending: "En attente", confirmed: "Confirmée", processing: "En préparation",
  shipped: "En livraison", delivered: "Livrée", cancelled: "Annulée",
};

function statusColor(status: string, C: typeof LIGHT) {
  switch (status) {
    case "pending": return C.amber;
    case "confirmed": return C.primary;
    case "processing": return C.purple;
    case "shipped": return C.blue;
    case "delivered": return C.green;
    case "cancelled": return C.red;
    default: return C.muted;
  }
}

export default function GestionOrdersScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);

  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [quickPeriod, setQuickPeriod] = useState<QuickPeriod>("today");
  const { from: dateFrom, to: dateTo } = quickPeriodRange(quickPeriod);

  const { data, isFetching, refetch } = useGetAllOrdersQuery({
    paginate: "true", page: 1, pageSize: 50,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(search ? { search } : {}),
    ...(dateFrom ? { startDate: toLocalDateStr(dateFrom) } : {}),
    ...(dateTo ? { endDate: toLocalDateStr(dateTo) } : {}),
  });
  const [updateStatus] = useUpdateOrderStatusMutation();
  const [deleteOrder] = useDeleteorderMutation();

  const orders: any[] = data?.data ?? [];

  const openActions = (order: any) => {
    const options = STATUSES.filter(st => st !== order.status).map(st => ({
      text: `→ ${STATUS_LABEL[st]}`,
      onPress: async () => {
        try {
          await updateStatus({ id: order.orderId, status: st }).unwrap();
        } catch (err: any) {
          Alert.alert("Erreur", err?.data?.message || "Impossible de changer le statut.");
        }
      },
    }));
    options.push({
      text: "Supprimer définitivement",
      style: "destructive",
      onPress: () => {
        Alert.alert("Confirmer", "Supprimer définitivement cette commande ?", [
          { text: "Annuler", style: "cancel" },
          { text: "Supprimer", style: "destructive", onPress: () => deleteOrder(order.orderId) },
        ]);
      },
    } as any);
    options.push({ text: "Fermer", style: "cancel" } as any);
    Alert.alert(`Commande ${order.orderNumber}`, `Statut actuel : ${STATUS_LABEL[order.status] ?? order.status}`, options as any);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.bg} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={s.title}>Commandes</Text>
          <TouchableOpacity onPress={() => refetch()}>
            {isFetching ? <ActivityIndicator size="small" color={C.primary} /> : <Ionicons name="refresh-outline" size={22} color={C.primary} />}
          </TouchableOpacity>
        </View>

        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={16} color={C.muted} />
          <TextInput
            style={s.searchInput}
            placeholder="Rechercher un n° de commande…"
            placeholderTextColor={C.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <HorizontalFadeScroll bg={C.bg} contentStyle={s.chipRow}>
          {QUICK_PERIODS.map(p => (
            <TouchableOpacity key={p.value} style={[s.chip, quickPeriod === p.value && s.chipActive]} onPress={() => setQuickPeriod(p.value)}>
              <Text style={[s.chipText, quickPeriod === p.value && s.chipTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[s.chip, quickPeriod === null && s.chipActive]} onPress={() => setQuickPeriod(null)}>
            <Text style={[s.chipText, quickPeriod === null && s.chipTextActive]}>Tout</Text>
          </TouchableOpacity>
        </HorizontalFadeScroll>

        <HorizontalFadeScroll bg={C.bg} contentStyle={s.chipRow}>
          <TouchableOpacity style={[s.chip, !statusFilter && s.chipActive]} onPress={() => setStatusFilter(null)}>
            <Text style={[s.chipText, !statusFilter && s.chipTextActive]}>Tout</Text>
          </TouchableOpacity>
          {STATUSES.map(st => (
            <TouchableOpacity key={st} style={[s.chip, statusFilter === st && s.chipActive]} onPress={() => setStatusFilter(st)}>
              <Text style={[s.chipText, statusFilter === st && s.chipTextActive]}>{STATUS_LABEL[st]}</Text>
            </TouchableOpacity>
          ))}
        </HorizontalFadeScroll>

        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.orderId)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={!isFetching ? <Text style={s.empty}>Aucune commande</Text> : null}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => openActions(item)} activeOpacity={0.85}>
              <View style={{ flex: 1 }}>
                <Text style={s.orderNum}>#{item.orderNumber}</Text>
                <Text style={s.orderInfo} numberOfLines={1}>
                  {item.user?.username ?? "Client"} · {item.product?.name ?? "Produit"}
                </Text>
                <View style={[s.statusBadge, { backgroundColor: statusColor(item.status, C) + "18" }]}>
                  <Text style={[s.statusText, { color: statusColor(item.status, C) }]}>{STATUS_LABEL[item.status] ?? item.status}</Text>
                </View>
              </View>
              <Text style={s.amount}>{Number(item.totalAmount ?? 0).toFixed(2)} EC</Text>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

function mkS(C: typeof LIGHT) { return StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontFamily: "NexaBold", fontSize: 17, color: C.text },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontFamily: "NexaLight", fontSize: 13, color: C.text },
  chipRow: { paddingHorizontal: 16, paddingVertical: 6, gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontFamily: "NexaBold", fontSize: 12, color: C.muted },
  chipTextActive: { color: "#fff" },
  card: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  orderNum: { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  orderInfo: { fontFamily: "NexaLight", fontSize: 12, color: C.muted, marginTop: 2 },
  statusBadge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  statusText: { fontFamily: "NexaBold", fontSize: 10, textTransform: "uppercase" },
  amount: { fontFamily: "NexaBold", fontSize: 14, color: C.primary },
  empty: { textAlign: "center", fontFamily: "NexaLight", color: C.muted, marginTop: 40 },
}); }
