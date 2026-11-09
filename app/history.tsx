/**
 * Historique des transactions (design BIM NEXT) : recherche, tri, filtres, liste par jour.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import { RefreshControl, SectionList, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BimIcon, BimIconName } from "@/components/bim/icons";
import { F, ec, useTh } from "@/components/bim/theme";
import { Appear, BimBackground, EmptyState, FilterChips, Header, PressScale, T } from "@/components/bim/ui";
import { useGetAllTransactionsQuery } from "@/services/tsxService";
import { useRouter } from "expo-router";

type Filter = "Tout" | "Reçu" | "Envoyé" | "Retrait" | "Recharge" | "Paiement";
type Sort = "recent" | "ancien" | "montant_desc" | "montant_asc";
const FILTERS: { key: Filter; label: string }[] = ["Tout", "Recharge", "Reçu", "Envoyé", "Retrait", "Paiement"].map((k) => ({ key: k as Filter, label: k }));
const SORTS: { key: Sort; label: string }[] = [
  { key: "recent", label: "Plus récent" }, { key: "ancien", label: "Plus ancien" },
  { key: "montant_desc", label: "Montant ↓" }, { key: "montant_asc", label: "Montant ↑" },
];

function txType(tx: any): Filter {
  const t = (tx.type ?? "").toLowerCase();
  if (t === "recharge") return "Recharge";
  if (t === "retrait") return "Retrait";
  if (t === "reception") return "Reçu";
  if (t === "transfert") return "Envoyé";
  if (t === "paiement" || t === "payment") return "Paiement";
  if (tx.amount > 0 && (tx.description ?? "").toLowerCase().includes("reçu")) return "Reçu";
  return "Paiement";
}
const ICON: Record<Filter, BimIconName> = { Tout: "transfer", Reçu: "arrowDown", Envoyé: "arrowUp", Retrait: "download", Recharge: "plus", Paiement: "tag" };
const dayLabel = (iso: string) => {
  const d = new Date(iso); const today = new Date(); const y = new Date(); y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === y.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};

export default function HistoryScreen() {
  const th = useTh();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("Tout");
  const [sort, setSort] = useState<Sort>("recent");
  const [search, setSearch] = useState("");
  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);
  const { data, isLoading, isFetching, refetch } = useGetAllTransactionsQuery({ userId, page: 1, pageSize: 100 }, { skip: !userId });

  const list = useMemo(() => {
    let l: any[] = [...(data?.data ?? [])];
    if (search.trim().length >= 2) { const q = search.toLowerCase(); l = l.filter((tx) => `${tx.description ?? ""} ${tx.type ?? ""}`.toLowerCase().includes(q)); }
    if (filter !== "Tout") l = l.filter((tx) => txType(tx) === filter);
    const amt = (x: any) => Number(x.amount ?? x.montant ?? 0);
    l.sort((a, b) => sort === "recent" ? +new Date(b.createdAt) - +new Date(a.createdAt) : sort === "ancien" ? +new Date(a.createdAt) - +new Date(b.createdAt)
      : sort === "montant_desc" ? amt(b) - amt(a) : amt(a) - amt(b));
    return l;
  }, [data, filter, sort, search]);

  const sections = useMemo(() => {
    if (sort !== "recent" && sort !== "ancien") return [{ title: SORTS.find((s) => s.key === sort)!.label, data: list }];
    const map = new Map<string, any[]>();
    list.forEach((tx) => { const k = dayLabel(tx.createdAt); map.set(k, [...(map.get(k) ?? []), tx]); });
    return [...map.entries()].map(([title, d]) => ({ title, data: d }));
  }, [list, sort]);

  const header = (
    <View>
      <Header title="Historique" onBack={() => router.back()} />
      <View style={{ marginTop: 18, flexDirection: "row", alignItems: "center", gap: 10, height: 52, borderRadius: 26, paddingHorizontal: 16,
        backgroundColor: th.glassFill(0.12), borderWidth: 1, borderColor: th.glass(0.22), boxShadow: th.glassFx }}>
        <BimIcon name="search" size={18} color={th.muted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Rechercher une transaction" placeholderTextColor={th.glass(0.55)} returnKeyType="search"
          accessibilityLabel="Rechercher une transaction" style={{ flex: 1, color: th.fg, fontFamily: F.regular, fontSize: 15, includeFontPadding: false }} />
        {!!search && <PressScale onPress={() => setSearch("")} accessibilityLabel="Effacer"><BimIcon name="close" size={16} color={th.muted} /></PressScale>}
      </View>
      <View style={{ marginTop: 12 }}><FilterChips items={FILTERS} value={filter} onChange={setFilter} /></View>
      <View style={{ marginTop: 8 }}><FilterChips items={SORTS} value={sort} onChange={setSort} /></View>
    </View>
  );

  return (
    <BimBackground>
      {isLoading ? <View style={{ flex: 1, paddingTop: 28 + insets.top, paddingHorizontal: 20 }}>{header}<EmptyState loading title="Chargement…" /></View> : (
        <SectionList
          sections={sections}
          keyExtractor={(tx, i) => `${tx.id ?? "tx"}-${i}`}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingTop: 28 + insets.top, paddingHorizontal: 20, paddingBottom: 40 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={!isLoading && isFetching} onRefresh={() => { refetch(); }} tintColor={th.fg} />}
          ListEmptyComponent={<EmptyState icon="clock" title="Aucune transaction" text={search || filter !== "Tout" ? "Aucun résultat pour ce filtre." : "Tes recharges, transferts et paiements apparaîtront ici."} />}
          renderSectionHeader={({ section }) => <T w="bold" size={13} color={th.muted} style={{ marginTop: 18, marginBottom: 8, letterSpacing: 0.6, textTransform: "uppercase" }}>{section.title}</T>}
          renderItem={({ item: tx, index }) => {
            const type = txType(tx);
            const isIn = type === "Reçu" || type === "Recharge";
            const ok = (tx.status ?? "success") !== "failed";
            const amount = Number(tx.amount ?? tx.montant ?? 0);
            return (
              <Appear kind="rise" delay={Math.min(index, 6) * 40}>
                <View style={{ marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 20,
                  backgroundColor: th.glassFill(0.12), borderWidth: 1, borderColor: th.glass(0.18), boxShadow: th.glassFx }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isIn ? "rgba(34,197,94,0.22)" : th.ink, alignItems: "center", justifyContent: "center" }}>
                    <BimIcon name={ICON[type]} size={20} color={isIn ? "#4ADE80" : th.onInk} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T w="bold" size={14} numberOfLines={1}>{tx.description || (isIn ? "Transfert reçu" : type)}</T>
                    <T size={12} color={th.muted}>{type} · {new Date(tx.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</T>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <T w="bold" size={15} color={isIn ? "#4ADE80" : th.fg}>{isIn ? "+" : "−"}{ec(amount)} EC</T>
                    <T size={11} color={ok ? th.muted : "#FF5A66"}>{ok ? "Réussie" : "Échouée"}</T>
                  </View>
                </View>
              </Appear>
            );
          }}
        />
      )}
    </BimBackground>
  );
}
