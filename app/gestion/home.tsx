import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/app/_layout";
import { useGetAllOrdersQuery, useUpdateOrderStatusMutation, useDeleteorderMutation } from "@/services/orderService";
import {
  useGetAllUsersQuery,
  useToggleUserBlockMutation,
  useToggleUserActiveMutation,
  useAdminRechargeUserMutation,
  useAdminResetUserPasswordMutation,
  useAdminDeleteUserMutation,
} from "@/services/userService";
import { useAdminGetAllLivreursQuery, useUpdateLivreurStatusMutation } from "@/services/livreurService";
import { useAdminListAgentsQuery, useAdminToggleAgentMutation } from "@/services/agentService";
import {
  useGetAllTransactionsQuery,
  useGetRechargesQuery,
  useApproveRechargeMutation,
  useRejectRechargeMutation,
  useVerifyPaymentMutation,
} from "@/services/tsxService";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
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

const TABS = [
  { key: "commande", label: "Commande", icon: "receipt-outline" },
  { key: "livreur", label: "Livreur", icon: "bicycle-outline" },
  { key: "utilisateur", label: "Utilisateur", icon: "people-outline" },
  { key: "transaction", label: "Transaction", icon: "swap-horizontal-outline" },
  { key: "recharge", label: "Recharges", icon: "cash-outline" },
  { key: "agent", label: "Agents", icon: "briefcase-outline" },
] as const;
type TabKey = typeof TABS[number]["key"];

const RECHARGE_STATUS_FILTERS = [
  { value: "pending", label: "En attente" },
  { value: "success", label: "Approuvées" },
  { value: "failed", label: "Rejetées" },
  { value: "", label: "Toutes" },
] as const;
const RECHARGE_STATUS_LABEL: Record<string, string> = { pending: "En attente", success: "Approuvée", failed: "Rejetée" };
function rechargeStatusColor(status: string, C: typeof LIGHT) {
  if (status === "success") return C.green;
  if (status === "failed") return C.red;
  return C.amber;
}

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "En attente", confirmed: "Confirmée", processing: "En préparation",
  shipped: "En livraison", delivered: "Livrée", cancelled: "Annulée",
};
function orderStatusColor(status: string, C: typeof LIGHT) {
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

const TRX_SEVERITY: Record<string, string> = { "réussi": "green", "échoué": "red", "en attente": "amber", "annuler": "muted" };

const LIVREUR_STATUSES = ["pending", "approved", "rejected", "suspended"] as const;

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export default function GestionHomeScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const { unread } = useUnreadNotifications();

  const [activeTab, setActiveTab] = useState<TabKey>("commande");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const [quickPeriod, setQuickPeriod] = useState<QuickPeriod>("today");
  const { from: dateFrom, to: dateTo } = quickPeriodRange(quickPeriod);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string | null>(null);

  // ── KPI (indépendants de l'onglet actif) ──────────────────────────────────
  const { data: ordersKpi } = useGetAllOrdersQuery({ paginate: "true", page: 1, pageSize: 1 });
  const { data: usersKpi } = useGetAllUsersQuery({ paginate: "true", page: 1, pageSize: 1 });
  const ordersCount = ordersKpi?.total ?? 0;
  const usersCount = usersKpi?.pagination?.total ?? 0;

  // ── Requêtes par onglet (seul l'onglet actif interroge réellement, les
  //    autres sont `skip` pour ne pas tout charger en même temps) ───────────
  const commandeQuery = useGetAllOrdersQuery(
    {
      paginate: "true", page: 1, pageSize: 50,
      ...(orderStatusFilter ? { status: orderStatusFilter } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(dateFrom ? { startDate: toLocalDateStr(dateFrom) } : {}),
      ...(dateTo ? { endDate: toLocalDateStr(dateTo) } : {}),
    },
    { skip: activeTab !== "commande" }
  );
  const livreurQuery = useAdminGetAllLivreursQuery(
    { page: 1, pageSize: 50, ...(debouncedSearch ? { search: debouncedSearch } : {}) },
    { skip: activeTab !== "livreur" }
  );
  const utilisateurQuery = useGetAllUsersQuery(
    {
      paginate: "true", page: 1, pageSize: 50,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(dateFrom ? { createdAtFrom: toLocalDateStr(dateFrom) } : {}),
      ...(dateTo ? { createdAtTo: toLocalDateStr(dateTo) } : {}),
    },
    { skip: activeTab !== "utilisateur" }
  );
  const transactionQuery = useGetAllTransactionsQuery(
    {
      paginate: "true", page: 1, pageSize: 50,
      ...(dateFrom ? { createdAtFrom: toLocalDateStr(dateFrom) } : {}),
      ...(dateTo ? { createdAtTo: toLocalDateStr(dateTo) } : {}),
    },
    { skip: activeTab !== "transaction" }
  );
  const [rechargeStatusFilter, setRechargeStatusFilter] = useState<string>("pending");
  const rechargeQuery = useGetRechargesQuery(
    {
      page: 1, pageSize: 50,
      ...(rechargeStatusFilter ? { status: rechargeStatusFilter } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    },
    { skip: activeTab !== "recharge" }
  );
  const agentQuery = useAdminListAgentsQuery(
    { page: 1, pageSize: 50, ...(debouncedSearch ? { search: debouncedSearch } : {}) },
    { skip: activeTab !== "agent" }
  );

  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [deleteOrder] = useDeleteorderMutation();
  const [toggleBlock] = useToggleUserBlockMutation();
  const [toggleActive] = useToggleUserActiveMutation();
  const [adminRecharge, { isLoading: recharging }] = useAdminRechargeUserMutation();
  const [adminResetPassword, { isLoading: resettingPwd }] = useAdminResetUserPasswordMutation();
  const [adminDeleteUser] = useAdminDeleteUserMutation();
  const [updateLivreurStatus] = useUpdateLivreurStatusMutation();
  const [approveRecharge, { isLoading: approvingRecharge }] = useApproveRechargeMutation();
  const [rejectRecharge] = useRejectRechargeMutation();
  const [verifyPayment, { isLoading: verifyingPayment }] = useVerifyPaymentMutation();
  const [toggleAgent] = useAdminToggleAgentMutation();

  const [rechargeTarget, setRechargeTarget] = useState<any | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [detailItem, setDetailItem] = useState<{ type: TabKey; data: any } | null>(null);

  const orders: any[] = commandeQuery.data?.data ?? [];
  const livreurs: any[] = livreurQuery.data?.data ?? [];
  const users: any[] = utilisateurQuery.data?.data ?? [];
  const rechargeRequests: any[] = rechargeQuery.data?.data ?? [];
  const transactions: any[] = transactionQuery.data?.data ?? [];
  const agents: any[] = agentQuery.data?.data ?? [];

  const activeQuery = { commande: commandeQuery, livreur: livreurQuery, utilisateur: utilisateurQuery, transaction: transactionQuery, recharge: rechargeQuery, agent: agentQuery }[activeTab];
  const isFetching = activeQuery.isFetching;
  const refetchActive = () => activeQuery.refetch();

  const handleLogout = () => {
    Alert.alert("Quitter l'espace gestion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion", style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["token", "refreshToken", "userId", "email", "accountType", "lastActivity"]);
          router.replace("/gestion/login" as any);
        },
      },
    ]);
  };

  const confirmRecharge = async () => {
    const amount = Number(rechargeAmount);
    if (!amount || amount <= 0) { Alert.alert("Erreur", "Montant invalide."); return; }
    try {
      await adminRecharge({ id: rechargeTarget.id, amount }).unwrap();
      setRechargeTarget(null);
      setRechargeAmount("");
      Alert.alert("✅", "Recharge effectuée.");
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Recharge impossible.");
    }
  };

  const confirmDeleteOrder = (order: any) => {
    Alert.alert("Confirmer", "Supprimer définitivement cette commande ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => { deleteOrder(order.orderId); setDetailItem(null); } },
    ]);
  };

  const rechargeRowId = (r: any) => r.transactionRechargeId ?? r.id;

  const confirmApproveRecharge = (r: any) => {
    Alert.alert(
      "Approuver la recharge",
      `Approuver la recharge de ${Number(r.amount ?? 0).toFixed(2)} EC pour ${r.user?.username ?? "cet utilisateur"} ? Son compte sera immédiatement crédité.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Approuver",
          onPress: async () => {
            try { await approveRecharge(rechargeRowId(r)).unwrap(); }
            catch (err: any) { Alert.alert("Erreur", err?.data?.message || "Approbation impossible."); }
          },
        },
      ]
    );
  };

  const confirmRejectRecharge = (r: any) => {
    Alert.alert(
      "Rejeter la demande",
      `Rejeter la demande de recharge de ${Number(r.amount ?? 0).toFixed(2)} EC pour ${r.user?.username ?? "cet utilisateur"} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Rejeter", style: "destructive",
          onPress: async () => {
            try { await rejectRecharge({ id: rechargeRowId(r), reason: "Demande refusée par l'administrateur" }).unwrap(); }
            catch (err: any) { Alert.alert("Erreur", err?.data?.message || "Rejet impossible."); }
          },
        },
      ]
    );
  };

  // FlexPay confirme le paiement via un webhook — si ce webhook n'arrive
  // jamais (réseau, URL de callback indisponible au mauvais moment...), la
  // recharge reste "en attente" dans notre base MÊME SI FlexPay a bien
  // confirmé le paiement de son côté. "Approuver" à l'aveugle créditerait
  // sans certitude ; "Vérifier avec FlexPay" interroge directement FlexPay
  // pour confirmer avant de créditer (ou de rejeter si FlexPay dit non).
  const handleVerifyPayment = async (r: any) => {
    if (!r.reference) {
      Alert.alert("Impossible", "Cette demande n'a pas de référence FlexPay.");
      return;
    }
    try {
      const res: any = await verifyPayment({ reference: r.reference }).unwrap();
      const soldeLine = res.solde != null ? `\nSolde actuel : ${Number(res.solde).toFixed(2)} EC` : "";
      const messages: Record<string, string> = {
        already_done: `Ce paiement était déjà crédité.${soldeLine}`,
        success: `✅ FlexPay confirme le paiement — compte crédité.${soldeLine}`,
        cancelled: "FlexPay indique que ce paiement a été refusé/annulé.",
        pending: "FlexPay n'a pas encore confirmé ce paiement, réessayez plus tard.",
      };
      Alert.alert("Vérification FlexPay", messages[res.status] ?? res.message ?? "Statut inconnu.");
      rechargeQuery.refetch();
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Impossible de vérifier ce paiement — ce n'est peut-être pas une recharge FlexPay automatique.");
    }
  };

  const confirmDeleteUser = (user: any) => {
    Alert.alert("Confirmer", `Supprimer définitivement le compte de « ${user.username} » ? Cette action est irréversible.`, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => { adminDeleteUser(user.id); setDetailItem(null); } },
    ]);
  };

  const handleToggleAgent = (agent: any, action: "block" | "unblock" | "remove") => {
    const labels: Record<string, string> = {
      block: "Bloquer cet agent ?", unblock: "Débloquer cet agent ?", remove: "Retirer le statut d'agent ?",
    };
    Alert.alert(labels[action], agent.username, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Confirmer", style: action === "block" || action === "remove" ? "destructive" : "default",
        onPress: async () => {
          try {
            await toggleAgent({ id: agent.id, action }).unwrap();
            if (action === "remove") setDetailItem(null);
          } catch (err: any) {
            Alert.alert("Erreur", err?.data?.message || "Action impossible.");
          }
        },
      },
    ]);
  };

  const handleResetPassword = async (user: any) => {
    try {
      const res: any = await adminResetPassword(user.id).unwrap();
      Alert.alert("✅ Mot de passe réinitialisé", `Nouveau mot de passe généré pour ${user.username} : ${res?.newPassword ?? res?.password ?? "(voir email)"}`);
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Réinitialisation impossible.");
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.bg} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.profileIcon}>
            <Ionicons name="shield-checkmark" size={20} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Espace Gestion</Text>
            <Text style={s.subtitle}>Tableau de bord administrateur</Text>
          </View>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/notification" as any)}>
            <Ionicons name="notifications-outline" size={20} color={C.muted} />
            {unread > 0 && (
              <View style={s.badge}><Text style={s.badgeText}>{unread > 99 ? "99+" : unread}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={C.muted} />
          </TouchableOpacity>
        </View>

        {/* ── KPI ── */}
        <View style={s.kpiRow}>
          <View style={s.kpiCard}>
            <Ionicons name="receipt-outline" size={18} color={C.primary} />
            <Text style={s.kpiValue}>{ordersCount}</Text>
            <Text style={s.kpiLabel}>Commandes</Text>
          </View>
          <View style={s.kpiCard}>
            <Ionicons name="people-outline" size={18} color={C.primary} />
            <Text style={s.kpiValue}>{usersCount}</Text>
            <Text style={s.kpiLabel}>Utilisateurs</Text>
          </View>
        </View>

        {/* ── TAB BAR ── */}
        <HorizontalFadeScroll bg={C.bg} contentStyle={s.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[s.tabChip, activeTab === t.key && s.tabChipActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Ionicons name={t.icon as any} size={13} color={activeTab === t.key ? "#fff" : C.muted} />
              <Text style={[s.tabChipText, activeTab === t.key && s.tabChipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </HorizontalFadeScroll>

        {/* ── RECHERCHE ── */}
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={16} color={C.muted} />
          <TextInput
            style={s.searchInput}
            placeholder="Rechercher…"
            placeholderTextColor={C.muted}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity onPress={refetchActive}>
            {isFetching ? <ActivityIndicator size="small" color={C.primary} /> : <Ionicons name="refresh-outline" size={18} color={C.primary} />}
          </TouchableOpacity>
        </View>

        {/* ── FILTRE STATUT (Recharges uniquement) ── */}
        {activeTab === "recharge" && (
          <HorizontalFadeScroll bg={C.bg} contentStyle={s.chipRow}>
            {RECHARGE_STATUS_FILTERS.map(f => (
              <TouchableOpacity key={f.value} style={[s.chip, rechargeStatusFilter === f.value && s.chipActive]} onPress={() => setRechargeStatusFilter(f.value)}>
                <Text style={[s.chipText, rechargeStatusFilter === f.value && s.chipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </HorizontalFadeScroll>
        )}

        {/* ── FILTRE PÉRIODE (sauf Livreur / Recharges) ── */}
        {activeTab !== "livreur" && activeTab !== "recharge" && (
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
        )}

        {/* ── FILTRE STATUT (Commande uniquement) ── */}
        {activeTab === "commande" && (
          <HorizontalFadeScroll bg={C.bg} contentStyle={s.chipRow}>
            <TouchableOpacity style={[s.chip, !orderStatusFilter && s.chipActive]} onPress={() => setOrderStatusFilter(null)}>
              <Text style={[s.chipText, !orderStatusFilter && s.chipTextActive]}>Tout statut</Text>
            </TouchableOpacity>
            {ORDER_STATUSES.map(st => (
              <TouchableOpacity key={st} style={[s.chip, orderStatusFilter === st && s.chipActive]} onPress={() => setOrderStatusFilter(st)}>
                <Text style={[s.chipText, orderStatusFilter === st && s.chipTextActive]}>{ORDER_STATUS_LABEL[st]}</Text>
              </TouchableOpacity>
            ))}
          </HorizontalFadeScroll>
        )}

        {/* ── LISTE (compacte) ── */}
        {activeTab === "commande" && (
          <FlatList
            data={orders}
            keyExtractor={(item) => String(item.orderId)}
            contentContainerStyle={s.list}
            ListEmptyComponent={!isFetching ? <Text style={s.empty}>Aucune commande</Text> : null}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.rowCard} onPress={() => setDetailItem({ type: "commande", data: item })} activeOpacity={0.85}>
                <View style={[s.dot, { backgroundColor: orderStatusColor(item.status, C) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle} numberOfLines={1}>#{item.orderNumber} · {item.user?.username ?? "Client"}</Text>
                  <Text style={s.rowSub} numberOfLines={1}>{ORDER_STATUS_LABEL[item.status] ?? item.status} · {item.product?.name ?? "Produit"}</Text>
                </View>
                <Text style={s.rowAmount}>{Number(item.totalAmount ?? 0).toFixed(2)} EC</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {activeTab === "livreur" && (
          <FlatList
            data={livreurs}
            keyExtractor={(item) => String(item.livreurId)}
            contentContainerStyle={s.list}
            ListEmptyComponent={!isFetching ? <Text style={s.empty}>Aucun livreur</Text> : null}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.rowCard} onPress={() => setDetailItem({ type: "livreur", data: item })} activeOpacity={0.85}>
                <View style={[s.dot, { backgroundColor: item.isOnline ? C.green : C.muted }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle} numberOfLines={1}>{item.user?.username ?? "Livreur"}</Text>
                  <Text style={s.rowSub} numberOfLines={1}>{item.status} · {item.company?.name ?? "Indépendant"}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.muted} />
              </TouchableOpacity>
            )}
          />
        )}

        {activeTab === "utilisateur" && (
          <FlatList
            data={users}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={s.list}
            ListEmptyComponent={!isFetching ? <Text style={s.empty}>Aucun utilisateur</Text> : null}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.rowCard} onPress={() => setDetailItem({ type: "utilisateur", data: item })} activeOpacity={0.85}>
                <View style={[s.dot, { backgroundColor: item.isBlocked ? C.red : item.isActive ? C.green : C.muted }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle} numberOfLines={1}>{item.username}</Text>
                  <Text style={s.rowSub} numberOfLines={1}>{item.email}</Text>
                </View>
                <Text style={s.rowAmount}>{Number(item.soldNumber ?? 0).toFixed(2)} EC</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {activeTab === "transaction" && (
          <FlatList
            data={transactions}
            keyExtractor={(item, i) => String(item.id ?? i)}
            contentContainerStyle={s.list}
            ListEmptyComponent={!isFetching ? <Text style={s.empty}>Aucune transaction</Text> : null}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.rowCard} onPress={() => setDetailItem({ type: "transaction", data: item })} activeOpacity={0.85}>
                <View style={[s.dot, { backgroundColor: (C as any)[TRX_SEVERITY[item.status]] ?? C.muted }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle} numberOfLines={1}>{item.user?.username ?? "—"}</Text>
                  <Text style={s.rowSub} numberOfLines={1}>{item.transactionType} · {item.status}</Text>
                </View>
                <Text style={s.rowAmount}>{Number(item.amount ?? 0).toFixed(2)} EC</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {activeTab === "recharge" && (
          <FlatList
            data={rechargeRequests}
            keyExtractor={(item, i) => String(rechargeRowId(item) ?? i)}
            contentContainerStyle={s.list}
            ListEmptyComponent={!isFetching ? <Text style={s.empty}>Aucune demande de recharge</Text> : null}
            renderItem={({ item }) => (
              <View style={s.rowCard}>
                <View style={[s.dot, { backgroundColor: rechargeStatusColor(item.status, C) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle} numberOfLines={1}>{item.user?.username ?? "—"} · {Number(item.amount ?? 0).toFixed(2)} EC</Text>
                  <Text style={s.rowSub} numberOfLines={1}>{item.telephone ?? item.orderNumber ?? "—"} · {RECHARGE_STATUS_LABEL[item.status] ?? item.status}</Text>
                </View>
                {item.status === "pending" ? (
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <TouchableOpacity style={s.rowIconBtnBlue} onPress={() => handleVerifyPayment(item)} disabled={verifyingPayment}>
                      {verifyingPayment ? <ActivityIndicator size="small" color={C.primary} /> : <Ionicons name="sync-outline" size={15} color={C.primary} />}
                    </TouchableOpacity>
                    <TouchableOpacity style={s.rowIconBtnGreen} onPress={() => confirmApproveRecharge(item)} disabled={approvingRecharge}>
                      <Ionicons name="checkmark" size={16} color={C.green} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.rowIconBtnRed} onPress={() => confirmRejectRecharge(item)}>
                      <Ionicons name="close" size={16} color={C.red} />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            )}
          />
        )}

        {activeTab === "agent" && (
          <FlatList
            data={agents}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={s.list}
            ListEmptyComponent={!isFetching ? <Text style={s.empty}>Aucun agent</Text> : null}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.rowCard} onPress={() => setDetailItem({ type: "agent", data: item })} activeOpacity={0.85}>
                <View style={[s.dot, { backgroundColor: item.isBlocked ? C.red : C.green }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle} numberOfLines={1}>{item.username}</Text>
                  <Text style={s.rowSub} numberOfLines={1}>{item.telephone ?? "—"} · {item.accountNumber ?? "—"}</Text>
                </View>
                <Text style={s.rowAmount}>{Number(item.soldNumber ?? 0).toFixed(2)} EC</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>

      {/* ── MODALE RECHARGE ── */}
      <Modal visible={!!rechargeTarget} transparent animationType="fade" onRequestClose={() => setRechargeTarget(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Recharger {rechargeTarget?.username}</Text>
            <TextInput
              style={s.input}
              placeholder="Montant en EC"
              placeholderTextColor={C.muted}
              value={rechargeAmount}
              onChangeText={setRechargeAmount}
              keyboardType="numeric"
              autoFocus
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: C.border }]} onPress={() => setRechargeTarget(null)}>
                <Text style={[s.modalBtnText, { color: C.text }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: C.primary }]} onPress={confirmRecharge} disabled={recharging}>
                {recharging ? <ActivityIndicator color="#fff" /> : <Text style={[s.modalBtnText, { color: "#fff" }]}>Confirmer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── FICHE DÉTAIL (Commande / Livreur / Utilisateur / Transaction) ── */}
      <Modal visible={!!detailItem} transparent animationType="slide" onRequestClose={() => setDetailItem(null)}>
        <View style={s.sheetOverlay}>
          <View style={s.sheetCard}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeaderRow}>
              <Text style={s.sheetTitle}>
                {detailItem?.type === "commande" && `Commande #${detailItem.data.orderNumber}`}
                {detailItem?.type === "livreur" && (detailItem.data.user?.username ?? "Livreur")}
                {detailItem?.type === "utilisateur" && detailItem.data.username}
                {detailItem?.type === "transaction" && "Détail transaction"}
                {detailItem?.type === "agent" && detailItem.data.username}
              </Text>
              <TouchableOpacity style={s.iconBtn} onPress={() => setDetailItem(null)}>
                <Ionicons name="close" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
              {detailItem?.type === "commande" && (() => {
                const order = detailItem.data;
                return (
                  <>
                    <View style={[s.sheetBadge, { backgroundColor: orderStatusColor(order.status, C) + "18" }]}>
                      <View style={[s.dot, { backgroundColor: orderStatusColor(order.status, C) }]} />
                      <Text style={[s.sheetBadgeText, { color: orderStatusColor(order.status, C) }]}>
                        {ORDER_STATUS_LABEL[order.status] ?? order.status}
                      </Text>
                    </View>

                    <Text style={s.sectionLabel}>CLIENT</Text>
                    <Text style={s.sheetRowText}>{order.user?.username ?? "—"}</Text>
                    <Text style={s.sheetRowSub}>{order.user?.email ?? ""}</Text>
                    {!!order.user?.telephone && <Text style={s.sheetRowSub}>📞 {order.user.telephone}</Text>}
                    {!!order.clientPhone && order.clientPhone !== order.user?.telephone && (
                      <Text style={s.sheetRowSub}>📞 (commande) {order.clientPhone}</Text>
                    )}

                    {!!order.shippingAddress && (
                      <>
                        <Text style={s.sectionLabel}>ADRESSE DE LIVRAISON</Text>
                        <Text style={s.sheetRowText}>{order.shippingAddress}</Text>
                      </>
                    )}

                    <Text style={s.sectionLabel}>PRODUIT</Text>
                    <Text style={s.sheetRowText}>{order.product?.name ?? "—"}</Text>
                    <Text style={s.sheetRowSub}>
                      {order.quantity} × {Number(order.unitPrice ?? 0).toFixed(2)} EC
                    </Text>
                    <Text style={s.sheetAmount}>{Number(order.totalAmount ?? 0).toFixed(2)} EC</Text>

                    {order.livreur && (
                      <>
                        <Text style={s.sectionLabel}>LIVREUR</Text>
                        <Text style={s.sheetRowText}>{order.livreur.user?.username ?? "—"}</Text>
                        <Text style={s.sheetRowSub}>{order.livreur.telephone ?? ""} · {order.livreur.isOnline ? "En ligne" : "Hors ligne"}</Text>
                      </>
                    )}

                    <Text style={s.sectionLabel}>CRÉÉE LE</Text>
                    <Text style={s.sheetRowSub}>{formatDate(order.createdAt)}</Text>

                    <Text style={s.sectionLabel}>CHANGER LE STATUT</Text>
                    <View style={s.sheetChipWrap}>
                      {ORDER_STATUSES.map(st => (
                        <TouchableOpacity
                          key={st}
                          style={[s.chip, order.status === st && s.chipActive]}
                          onPress={() => updateOrderStatus({ id: order.orderId, status: st })}
                        >
                          <Text style={[s.chipText, order.status === st && s.chipTextActive]}>{ORDER_STATUS_LABEL[st]}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity style={s.destructiveBtn} onPress={() => confirmDeleteOrder(order)}>
                      <Ionicons name="trash-outline" size={16} color={C.red} />
                      <Text style={s.destructiveBtnText}>Supprimer la commande</Text>
                    </TouchableOpacity>
                  </>
                );
              })()}

              {detailItem?.type === "livreur" && (() => {
                const l = detailItem.data;
                return (
                  <>
                    <View style={[s.sheetBadge, { backgroundColor: (l.isOnline ? C.green : C.muted) + "18" }]}>
                      <View style={[s.dot, { backgroundColor: l.isOnline ? C.green : C.muted }]} />
                      <Text style={[s.sheetBadgeText, { color: l.isOnline ? C.green : C.muted }]}>{l.isOnline ? "En ligne" : "Hors ligne"}</Text>
                    </View>

                    <Text style={s.sectionLabel}>CONTACT</Text>
                    <Text style={s.sheetRowText}>{l.user?.username ?? "—"}</Text>
                    <Text style={s.sheetRowSub}>{l.user?.email ?? ""} · {l.telephone ?? ""}</Text>

                    <Text style={s.sectionLabel}>ENTREPRISE</Text>
                    <Text style={s.sheetRowText}>{l.company?.name ?? "Indépendant"}</Text>

                    <Text style={s.sectionLabel}>NOTE</Text>
                    <Text style={s.sheetRowText}>{l.rating ?? "—"} / 5</Text>

                    <Text style={s.sectionLabel}>STATUT ACTUEL</Text>
                    <Text style={s.sheetRowSub}>{l.status}</Text>

                    <Text style={s.sectionLabel}>CHANGER LE STATUT</Text>
                    <View style={s.sheetChipWrap}>
                      {LIVREUR_STATUSES.map(st => (
                        <TouchableOpacity
                          key={st}
                          style={[s.chip, l.status === st && s.chipActive]}
                          onPress={() => updateLivreurStatus({ id: l.livreurId, status: st })}
                        >
                          <Text style={[s.chipText, l.status === st && s.chipTextActive]}>{st}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                );
              })()}

              {detailItem?.type === "utilisateur" && (() => {
                const user = detailItem.data;
                return (
                  <>
                    <Text style={s.sectionLabel}>EMAIL</Text>
                    <Text style={s.sheetRowText}>{user.email}</Text>

                    <Text style={s.sectionLabel}>N° COMPTE</Text>
                    <Text style={s.sheetRowText}>{user.accountNumber ?? "—"}</Text>

                    <Text style={s.sectionLabel}>SOLDE</Text>
                    <Text style={s.sheetAmount}>{Number(user.soldNumber ?? 0).toFixed(2)} EC</Text>

                    <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                      <View style={[s.sheetBadge, { backgroundColor: (user.isActive ? C.green : C.muted) + "18" }]}>
                        <Text style={[s.sheetBadgeText, { color: user.isActive ? C.green : C.muted }]}>{user.isActive ? "Actif" : "Inactif"}</Text>
                      </View>
                      <View style={[s.sheetBadge, { backgroundColor: (user.isBlocked ? C.red : C.muted) + "18" }]}>
                        <Text style={[s.sheetBadgeText, { color: user.isBlocked ? C.red : C.muted }]}>{user.isBlocked ? "Bloqué" : "Normal"}</Text>
                      </View>
                    </View>

                    <Text style={s.sectionLabel}>ACTIONS</Text>
                    <View style={{ gap: 8 }}>
                      <TouchableOpacity style={s.actionBtn} onPress={() => toggleActive(user.id)}>
                        <Ionicons name={user.isActive ? "power-outline" : "checkmark-circle-outline"} size={16} color={C.primary} />
                        <Text style={s.actionBtnText}>{user.isActive ? "Désactiver le compte" : "Activer le compte"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.actionBtn} onPress={() => toggleBlock(user.id)}>
                        <Ionicons name={user.isBlocked ? "lock-open-outline" : "ban-outline"} size={16} color={C.primary} />
                        <Text style={s.actionBtnText}>{user.isBlocked ? "Débloquer" : "Bloquer"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.actionBtn} onPress={() => { setDetailItem(null); setRechargeTarget(user); }}>
                        <Ionicons name="wallet-outline" size={16} color={C.primary} />
                        <Text style={s.actionBtnText}>Recharger le compte</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.actionBtn} onPress={() => handleResetPassword(user)} disabled={resettingPwd}>
                        {resettingPwd ? <ActivityIndicator size="small" color={C.primary} /> : <Ionicons name="key-outline" size={16} color={C.primary} />}
                        <Text style={s.actionBtnText}>Générer un nouveau mot de passe</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.destructiveBtn} onPress={() => confirmDeleteUser(user)}>
                        <Ionicons name="trash-outline" size={16} color={C.red} />
                        <Text style={s.destructiveBtnText}>Supprimer le compte</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                );
              })()}

              {detailItem?.type === "transaction" && (() => {
                const trx = detailItem.data;
                return (
                  <>
                    <Text style={s.sheetAmount}>{Number(trx.amount ?? 0).toFixed(2)} EC</Text>

                    <Text style={s.sectionLabel}>UTILISATEUR</Text>
                    <Text style={s.sheetRowText}>{trx.user?.username ?? "—"}</Text>
                    <Text style={s.sheetRowSub}>{trx.user?.email ?? ""}</Text>

                    <Text style={s.sectionLabel}>TYPE</Text>
                    <Text style={s.sheetRowText}>{trx.transactionType}</Text>

                    <Text style={s.sectionLabel}>STATUT</Text>
                    <Text style={s.sheetRowText}>{trx.status}</Text>

                    <Text style={s.sectionLabel}>DESCRIPTION</Text>
                    <Text style={s.sheetRowSub}>{trx.description ?? "—"}</Text>

                    <Text style={s.sectionLabel}>DATE</Text>
                    <Text style={s.sheetRowSub}>{formatDate(trx.createdAt)}</Text>
                  </>
                );
              })()}

              {detailItem?.type === "agent" && (() => {
                const agent = detailItem.data;
                return (
                  <>
                    <View style={[s.sheetBadge, { backgroundColor: (agent.isBlocked ? C.red : C.green) + "18" }]}>
                      <View style={[s.dot, { backgroundColor: agent.isBlocked ? C.red : C.green }]} />
                      <Text style={[s.sheetBadgeText, { color: agent.isBlocked ? C.red : C.green }]}>{agent.isBlocked ? "Bloqué" : "Actif"}</Text>
                    </View>

                    <Text style={s.sectionLabel}>TÉLÉPHONE</Text>
                    <Text style={s.sheetRowText}>{agent.telephone ?? "—"}</Text>

                    <Text style={s.sectionLabel}>EMAIL</Text>
                    <Text style={s.sheetRowText}>{agent.email ?? "—"}</Text>

                    <Text style={s.sectionLabel}>N° COMPTE</Text>
                    <Text style={s.sheetRowText}>{agent.accountNumber ?? "—"}</Text>

                    <Text style={s.sectionLabel}>SOLDE</Text>
                    <Text style={s.sheetAmount}>{Number(agent.soldNumber ?? 0).toFixed(2)} EC</Text>

                    <Text style={s.sectionLabel}>RETRAITS AUJOURD'HUI</Text>
                    <Text style={s.sheetRowSub}>{agent.todayCount ?? 0} retrait(s) · {Number(agent.todaySum ?? 0).toFixed(2)} EC</Text>

                    <Text style={s.sectionLabel}>MEMBRE DEPUIS</Text>
                    <Text style={s.sheetRowSub}>{formatDate(agent.createdAt)}</Text>

                    <Text style={s.sectionLabel}>ACTIONS</Text>
                    <View style={{ gap: 8 }}>
                      <TouchableOpacity style={s.actionBtn} onPress={() => handleToggleAgent(agent, agent.isBlocked ? "unblock" : "block")}>
                        <Ionicons name={agent.isBlocked ? "lock-open-outline" : "ban-outline"} size={16} color={C.primary} />
                        <Text style={s.actionBtnText}>{agent.isBlocked ? "Débloquer" : "Bloquer"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.destructiveBtn} onPress={() => handleToggleAgent(agent, "remove")}>
                        <Ionicons name="close-circle-outline" size={16} color={C.red} />
                        <Text style={s.destructiveBtnText}>Retirer le statut d'agent</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function mkS(C: typeof LIGHT) { return StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  profileIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primary + "15", alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "NexaBold", fontSize: 16, color: C.text },
  subtitle: { fontFamily: "NexaLight", fontSize: 11, color: C.muted, marginTop: 1 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 2, right: 2, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 2 },
  badgeText: { fontFamily: "NexaBold", fontSize: 8, color: "#fff" },

  kpiRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
  kpiCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, paddingVertical: 10, alignItems: "center", gap: 2,
    elevation: 1, shadowColor: "#0F172A", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  kpiValue: { fontFamily: "NexaBold", fontSize: 18, color: C.text },
  kpiLabel: { fontFamily: "NexaLight", fontSize: 11, color: C.muted },

  tabRow: { paddingHorizontal: 16, paddingVertical: 6, gap: 6 },
  tabChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  tabChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabChipText: { fontFamily: "NexaBold", fontSize: 12, color: C.muted },
  tabChipTextActive: { color: "#fff" },

  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontFamily: "NexaLight", fontSize: 13, color: C.text },

  chipRow: { paddingHorizontal: 16, paddingVertical: 6, gap: 6 },
  chip: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontFamily: "NexaBold", fontSize: 11, color: C.muted },
  chipTextActive: { color: "#fff" },

  list: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 24, gap: 6 },
  rowCard: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: C.border,
    elevation: 1, shadowColor: "#0F172A", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowTitle: { fontFamily: "NexaBold", fontSize: 12.5, color: C.text },
  rowSub: { fontFamily: "NexaLight", fontSize: 11, color: C.muted, marginTop: 1 },
  rowAmount: { fontFamily: "NexaBold", fontSize: 12.5, color: C.primary },
  rowIconBtnBlue: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.primary + "18", alignItems: "center", justifyContent: "center" },
  rowIconBtnGreen: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.green + "18", alignItems: "center", justifyContent: "center" },
  rowIconBtnRed: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.red + "18", alignItems: "center", justifyContent: "center" },
  empty: { textAlign: "center", fontFamily: "NexaLight", color: C.muted, marginTop: 40 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", backgroundColor: C.card, borderRadius: 20, padding: 20 },
  modalTitle: { fontFamily: "NexaBold", fontSize: 15, color: C.text, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "NexaLight", fontSize: 14, color: C.text },
  modalBtn: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  modalBtnText: { fontFamily: "NexaBold", fontSize: 14 },

  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheetCard: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24, maxHeight: "85%" },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginBottom: 14 },
  sheetHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sheetTitle: { fontFamily: "NexaBold", fontSize: 17, color: C.text, flex: 1 },

  sheetBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 4 },
  sheetBadgeText: { fontFamily: "NexaBold", fontSize: 11 },

  sectionLabel: { fontFamily: "NexaBold", fontSize: 10.5, color: C.muted, letterSpacing: 0.5, marginTop: 16, marginBottom: 4 },
  sheetRowText: { fontFamily: "NexaBold", fontSize: 14, color: C.text },
  sheetRowSub: { fontFamily: "NexaLight", fontSize: 12.5, color: C.muted, marginTop: 1 },
  sheetAmount: { fontFamily: "NexaBold", fontSize: 22, color: C.primary, marginTop: 2 },

  sheetChipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },

  actionBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.border },
  actionBtnText: { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  destructiveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: C.red + "40" },
  destructiveBtnText: { fontFamily: "NexaBold", fontSize: 13, color: C.red },
}); }
