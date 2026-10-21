import { Ionicons } from "@expo/vector-icons";
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
import {
  useGetAllUsersQuery,
  useToggleUserBlockMutation,
  useToggleUserActiveMutation,
  useAdminRechargeUserMutation,
} from "@/services/userService";
import { useAppTheme } from "@/app/_layout";
import { QUICK_PERIODS, QuickPeriod, quickPeriodRange, toLocalDateStr } from "@/utils/quickPeriod.util";
import HorizontalFadeScroll from "@/components/ui/HorizontalFadeScroll";

const LIGHT = { bg: "#F8F9FF", primary: "#0035C5", text: "#1A1C1C", muted: "#747688", border: "#E2E2E2", card: "#FFFFFF", green: "#10B981", red: "#EF4444" };
const DARK: typeof LIGHT = { bg: "#0B1220", primary: "#4D8DFF", text: "#EAF0FF", muted: "#6B7A99", border: "rgba(31,42,68,0.80)", card: "#1A2540", green: "#059669", red: "#DC2626" };

export default function GestionUsersScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const [quickPeriod, setQuickPeriod] = useState<QuickPeriod>("today");
  const { from: dateFrom, to: dateTo } = quickPeriodRange(quickPeriod);

  const { data, isFetching, refetch } = useGetAllUsersQuery({
    paginate: false,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(dateFrom ? { createdAtFrom: toLocalDateStr(dateFrom) } : {}),
    ...(dateTo ? { createdAtTo: toLocalDateStr(dateTo) } : {}),
  });
  const [toggleBlock] = useToggleUserBlockMutation();
  const [toggleActive] = useToggleUserActiveMutation();
  const [adminRecharge, { isLoading: recharging }] = useAdminRechargeUserMutation();

  const [rechargeTarget, setRechargeTarget] = useState<any | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState("");

  const users: any[] = data?.data ?? [];

  const confirmRecharge = async () => {
    const amount = Number(rechargeAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Erreur", "Montant invalide.");
      return;
    }
    try {
      await adminRecharge({ id: rechargeTarget.id, amount }).unwrap();
      setRechargeTarget(null);
      setRechargeAmount("");
      Alert.alert("✅", "Recharge effectuée.");
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Recharge impossible.");
    }
  };

  const openActions = (user: any) => {
    Alert.alert(
      user.username,
      `${user.email}\nSolde : ${Number(user.soldNumber ?? 0).toFixed(2)} EC`,
      [
        { text: user.isBlocked ? "Débloquer" : "Bloquer", onPress: () => toggleBlock(user.id) },
        { text: user.isActive ? "Désactiver" : "Activer", onPress: () => toggleActive(user.id) },
        { text: "Recharger…", onPress: () => setRechargeTarget(user) },
        { text: "Fermer", style: "cancel" },
      ]
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.bg} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={s.title}>Utilisateurs</Text>
          <TouchableOpacity onPress={() => refetch()}>
            {isFetching ? <ActivityIndicator size="small" color={C.primary} /> : <Ionicons name="refresh-outline" size={22} color={C.primary} />}
          </TouchableOpacity>
        </View>

        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={16} color={C.muted} />
          <TextInput
            style={s.searchInput}
            placeholder="Rechercher par nom ou email…"
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

        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={!isFetching ? <Text style={s.empty}>Aucun utilisateur</Text> : null}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => openActions(item)} activeOpacity={0.85}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.username}</Text>
                <Text style={s.email} numberOfLines={1}>{item.email}</Text>
                <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                  {item.isBlocked && (
                    <View style={[s.badge, { backgroundColor: C.red + "18" }]}><Text style={[s.badgeText, { color: C.red }]}>Bloqué</Text></View>
                  )}
                  {!item.isActive && (
                    <View style={[s.badge, { backgroundColor: C.muted + "18" }]}><Text style={[s.badgeText, { color: C.muted }]}>Inactif</Text></View>
                  )}
                </View>
              </View>
              <Text style={s.amount}>{Number(item.soldNumber ?? 0).toFixed(2)} EC</Text>
            </TouchableOpacity>
          )}
        />
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
  name: { fontFamily: "NexaBold", fontSize: 14, color: C.text },
  email: { fontFamily: "NexaLight", fontSize: 12, color: C.muted, marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: "NexaBold", fontSize: 10, textTransform: "uppercase" },
  amount: { fontFamily: "NexaBold", fontSize: 14, color: C.primary },
  empty: { textAlign: "center", fontFamily: "NexaLight", color: C.muted, marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", backgroundColor: C.card, borderRadius: 20, padding: 20 },
  modalTitle: { fontFamily: "NexaBold", fontSize: 15, color: C.text, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "NexaLight", fontSize: 14, color: C.text },
  modalBtn: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  modalBtnText: { fontFamily: "NexaBold", fontSize: 14 },
}); }
