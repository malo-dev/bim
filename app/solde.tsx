/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetUserByIdQuery } from "@/services/userService";
import { useGetUserOrdersQuery } from "@/services/orderService";
import { useAppTheme } from "@/app/_layout";

const ios = Platform.OS === "ios";

const LIGHT = {
  primary: "#0035C5",
  blue:    "#0047FF",
  text:    "#1A1C1C",
  textMut: "#747688",
  bg:      ios ? "#F9F9F9" : "#F0F4FA",
  white:   "#FFFFFF",
  heroBg:   ios ? "rgba(255,255,255,0.40)" : "#FFFFFF",
  heroBord: ios ? "rgba(255,255,255,0.50)" : "rgba(0,53,197,0.10)",
  labelMut: ios ? "rgba(67,70,87,0.50)" : "rgba(67,70,87,0.55)",
  metaLbl:  ios ? "rgba(67,70,87,0.40)" : "rgba(67,70,87,0.45)",
  heroAccNum: ios ? "rgba(26,28,28,0.60)" : "rgba(26,28,28,0.65)",
  topBord:  ios ? "rgba(0,0,0,0.03)" : "rgba(0,0,0,0.07)",
};
const DARK: typeof LIGHT = {
  primary: "#4D8DFF",
  blue:    "#4D8DFF",
  text:    "#EAF0FF",
  textMut: "#6B7A99",
  bg:      "#0B1220",
  white:   "#FFFFFF",
  heroBg:   "rgba(26,37,64,0.60)",
  heroBord: "rgba(77,150,255,0.12)",
  labelMut: "rgba(159,176,208,0.50)",
  metaLbl:  "rgba(159,176,208,0.40)",
  heroAccNum: "rgba(234,240,255,0.60)",
  topBord:  "rgba(31,42,68,0.50)",
};

function maskAccount(acc: string | undefined): string {
  if (!acc) return "••••  ••••  ••••  ????";
  const last4 = String(acc).slice(-4);
  return `••••  ••••  ••••  ${last4}`;
}

function getStatusStyle(status: string, C: typeof LIGHT): { color: string; bg: string; label: string; icon: any } {
  switch ((status ?? "").toLowerCase()) {
    case "delivered":
    case "completed":  return { color: "#10B981", bg: "rgba(16,185,129,0.08)",  label: "Livré",        icon: "checkmark-circle-outline" };
    case "pending":    return { color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  label: "En attente",   icon: "time-outline"             };
    case "processing": return { color: C.primary, bg: "rgba(0,53,197,0.07)",    label: "En cours",     icon: "cube-outline"             };
    case "shipped":    return { color: C.blue,    bg: "rgba(0,71,255,0.08)",    label: "En livraison", icon: "bicycle-outline"          };
    case "cancelled":  return { color: "#EF4444", bg: "rgba(239,68,68,0.07)",   label: "Annulé",       icon: "close-circle-outline"     };
    default:           return { color: C.textMut, bg: "rgba(116,118,136,0.07)", label: status ?? "—",  icon: "ellipse-outline"          };
  }
}

function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function SoldeScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);
  const { data: user, isLoading, refetch } = useGetUserByIdQuery(userId!, { skip: !userId });

  const { data: ordersData } = useGetUserOrdersQuery({ page: 1, pageSize: 5 }, { skip: !userId });
  const recentOrders: any[] = useMemo(() => {
    const list: any[] = ordersData?.data || ordersData || [];
    return [...list]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [ordersData]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={s.topTitle}>Mon solde</Text>
          <TouchableOpacity style={s.iconBtn} onPress={() => refetch()}>
            <Ionicons name="refresh-outline" size={20} color={C.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isLoading && !user ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={s.heroCard}>
            <View style={s.blob1} />
            <View style={s.blob2} />

            <View style={s.heroTop}>
              <View>
                <Text style={s.heroLabel}>SOLDE DISPONIBLE</Text>
                <View style={s.heroBalRow}>
                  <Text style={s.heroBal}>{Number(user?.soldNumber ?? 0).toFixed(2)}</Text>
                  <Text style={s.heroEC}>EC</Text>
                </View>
              </View>
              <Text style={s.heroBrand}>BIMNEXT</Text>
            </View>

            <View style={s.heroBot}>
              <View style={{ gap: 8 }}>
                <Text style={s.heroAccNum}>{maskAccount(user?.accountNumber)}</Text>
                <View style={s.heroMetaRow}>
                  <View>
                    <Text style={s.heroMetaLabel}>STATUT</Text>
                    <View style={s.activeRow}>
                      <View style={s.greenDot} />
                      <Text style={s.activeText}>Actif</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={s.circleGroup}>
                <View style={[s.circle, { zIndex: 2 }]} />
                <View style={[s.circle, { marginLeft: -20, zIndex: 1, backgroundColor: "rgba(147,197,253,0.12)" }]} />
              </View>
            </View>
          </View>

          {/* ── DERNIÈRES COMMANDES ─────────────────────────────────── */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Dernières commandes</Text>
            <TouchableOpacity onPress={() => router.push("/mes-commandes" as any)}>
              <Text style={s.seeAll}>Voir tout →</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <View style={s.emptyBox}>
              <Ionicons name="receipt-outline" size={24} color={C.textMut} />
              <Text style={s.emptyText}>Aucune commande pour le moment</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {recentOrders.map((order: any, i: number) => {
                const st = getStatusStyle(order.status, C);
                const total = Number(order.totalAmount ?? order.total ?? 0).toFixed(2);
                const ref = order.orderNumber ? `#BIM-${order.orderNumber}` : `#${order.id}`;
                return (
                  <TouchableOpacity
                    key={order.orderNumber ?? order.id ?? i}
                    style={s.orderRow}
                    activeOpacity={0.85}
                    onPress={() => order.orderNumber && router.push({ pathname: "/bim-supermarche/order-tracking", params: { orderNumber: order.orderNumber } } as any)}
                  >
                    <View style={[s.orderIcon, { backgroundColor: st.bg }]}>
                      <Ionicons name={st.icon} size={18} color={st.color} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={s.orderRef} numberOfLines={1}>{ref}</Text>
                        <Text style={[s.orderStatus, { color: st.color }]}>{st.label}</Text>
                      </View>
                      <Text style={s.orderDate}>{formatDate(order.createdAt)}</Text>
                    </View>
                    <Text style={s.orderTotal}>{total} EC</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function mkS(C: typeof LIGHT) { return StyleSheet.create({
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.topBord,
  },
  iconBtn:  { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  topTitle: { fontFamily: "NexaBold", fontSize: 17, color: C.text },

  heroCard: {
    borderRadius: 36, padding: 28, height: 220,
    backgroundColor: C.heroBg,
    borderWidth: 1, borderColor: C.heroBord,
    elevation: 3, shadowColor: ios ? C.blue : "#000",
    shadowOpacity: 0.05, shadowRadius: 50, shadowOffset: { width: 0, height: 20 },
    justifyContent: "space-between", overflow: "hidden",
  },
  blob1: { position: "absolute", right: -70, top: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: "rgba(0,53,197,0.04)" },
  blob2: { position: "absolute", left: -70, bottom: -70, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(147,197,253,0.04)" },
  heroTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", zIndex: 1 },
  heroLabel:  { fontFamily: "NexaBold", fontSize: 9, color: C.labelMut, letterSpacing: 2 },
  heroBalRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 6 },
  heroBal:    { fontFamily: "NexaBold", fontSize: 44, color: C.text, letterSpacing: -1 },
  heroEC:     { fontFamily: "NexaBold", fontSize: 22, color: C.primary },
  heroBrand:  { fontFamily: "NexaBold", fontSize: 20, color: "rgba(0,53,197,0.35)" },
  heroBot:    { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", zIndex: 1 },
  heroAccNum: { fontFamily: "NexaLight", fontSize: 13, color: C.heroAccNum, letterSpacing: 3 },
  heroMetaRow:{ flexDirection: "row", gap: 24, marginTop: 4 },
  heroMetaLabel: { fontFamily: "NexaBold", fontSize: 8, color: C.metaLbl, letterSpacing: 1.5 },
  activeRow:  { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  greenDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" },
  activeText: { fontFamily: "NexaBold", fontSize: 11, color: "#059669" },
  circleGroup:{ flexDirection: "row", alignItems: "center" },
  circle:     { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(0,53,197,0.08)", borderWidth: 2, borderColor: C.heroBord },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 28, marginBottom: 14 },
  sectionTitle:  { fontFamily: "NexaBold", fontSize: 16, color: C.text },
  seeAll:        { fontFamily: "NexaBold", fontSize: 12, color: C.primary },

  emptyBox:  { alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 28, backgroundColor: C.heroBg, borderRadius: 20, borderWidth: 1, borderColor: C.heroBord },
  emptyText: { fontFamily: "NexaLight", fontSize: 13, color: C.textMut },

  orderRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.heroBg, borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: C.heroBord,
  },
  orderIcon:   { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  orderRef:    { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  orderStatus: { fontFamily: "NexaBold", fontSize: 10 },
  orderDate:   { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, marginTop: 2 },
  orderTotal:  { fontFamily: "NexaBold", fontSize: 13, color: C.primary },
}); }
