/**
 * Mes statistiques (design BIM NEXT) : période, total reçu, réussies / échouées / en attente / annulées,
 * répartition par type (barres), dernières transactions.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { RefreshControl, View } from "react-native";
import { BimIcon, BimIconName } from "@/components/bim/icons";
import { ec, useTh } from "@/components/bim/theme";
import { Appear, BimPage, EmptyState, FilterChips, Glass, SectionLabel, T } from "@/components/bim/ui";
import { useGetAllTransactionsQuery } from "@/services/tsxService";

const PERIODS = [
  { key: "all", label: "Tout" }, { key: "daily", label: "Aujourd'hui" }, { key: "weekly", label: "7 jours" }, { key: "monthly", label: "Ce mois" },
] as const;
type Period = (typeof PERIODS)[number]["key"];
const start = (p: Period) => {
  const now = new Date();
  if (p === "daily") return new Date(new Date().setHours(0, 0, 0, 0));
  if (p === "weekly") return new Date(now.getTime() - 7 * 86400000);
  if (p === "monthly") return new Date(now.getFullYear(), now.getMonth(), 1);
  return null;
};
const TYPES: { key: string; label: string; icon: BimIconName }[] = [
  { key: "recharge", label: "Recharges", icon: "plus" },
  { key: "transfert", label: "Transferts", icon: "transfer" },
  { key: "paiement", label: "Paiements", icon: "tag" },
  { key: "retrait", label: "Retraits", icon: "download" },
];

export default function Stats() {
  const th = useTh();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("all");
  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);
  const { data, isLoading, isFetching, refetch } = useGetAllTransactionsQuery({ page: 1, pageSize: 1000, paginate: true, id: userId }, { skip: !userId });

  const txs = useMemo(() => {
    const all: any[] = data?.data || [];
    const s = start(period);
    return s ? all.filter((t) => new Date(t.createdAt) >= s) : all;
  }, [data, period]);
  const count = (st: string) => txs.filter((t) => t.status === st).length;
  const ok = txs.filter((t) => t.status === "réussi");
  const total = ok.reduce((s, t) => s + Number(t.amount || 0), 0);
  const byType = TYPES.map((ty) => ({ ...ty, sum: ok.filter((t) => t.transactionType === ty.key).reduce((s, t) => s + Number(t.amount || 0), 0), n: ok.filter((t) => t.transactionType === ty.key).length }));
  const max = Math.max(1, ...byType.map((b) => b.sum));
  const recent = [...txs].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 8);

  const cells: { label: string; value: number; color: string; icon: BimIconName }[] = [
    { label: "Réussies", value: count("réussi"), color: "#22C55E", icon: "check" },
    { label: "Échouées", value: count("échoué"), color: "#FF5A66", icon: "close" },
    { label: "En attente", value: count("en attente"), color: "#F5C518", icon: "clock" },
    { label: "Annulées", value: count("annuler"), color: "#C9DAFF", icon: "minus" },
  ];

  return (
    <BimPage title="Mes statistiques" onBack={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as any))}
      refreshControl={<RefreshControl refreshing={!isLoading && isFetching} onRefresh={() => { refetch(); }} tintColor={th.fg} />}>
      <View style={{ marginTop: 18 }}><FilterChips items={PERIODS as any} value={period} onChange={(k) => setPeriod(k as Period)} /></View>
      {isLoading ? <EmptyState loading title="Chargement…" /> : (
        <>
          <Appear kind="rise" delay={60}>
            <Glass a={0.16} b={0.24} radius={28} style={{ marginTop: 16, padding: 20 }}>
              <T size={13} color={th.muted}>Total d'Ecoins sur la période</T>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                <T w="bold" size={42} style={{ letterSpacing: -0.8 }}>{ec(total)}</T>
                <T w="light" size={18}>EC</T>
              </View>
              <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <BimIcon name="check" size={14} color="#4ADE80" strokeWidth={2.4} />
                <T size={13} color={th.muted}>{ok.length} transaction{ok.length > 1 ? "s" : ""} réussie{ok.length > 1 ? "s" : ""} sur {txs.length}</T>
              </View>
            </Glass>
          </Appear>

          <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {cells.map((c, i) => (
              <Appear key={c.label} kind="rise" delay={120 + i * 50} style={{ width: "48%", flexGrow: 1 }}>
                <Glass a={0.12} b={0.2} radius={22} style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.color + "2A", alignItems: "center", justifyContent: "center" }}>
                    <BimIcon name={c.icon} size={18} color={c.color} strokeWidth={2.4} />
                  </View>
                  <View>
                    <T w="bold" size={22}>{c.value}</T>
                    <T size={12} color={th.muted}>{c.label}</T>
                  </View>
                </Glass>
              </Appear>
            ))}
          </View>

          <SectionLabel style={{ marginTop: 20 }}>PAR TYPE</SectionLabel>
          <Glass a={0.12} b={0.2} radius={24} style={{ marginTop: 8, padding: 16, gap: 14 }}>
            {byType.map((b) => (
              <View key={b.key}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <BimIcon name={b.icon} size={16} color={th.fg} strokeWidth={2} />
                  <T w="bold" size={14} style={{ flex: 1 }}>{b.label} <T size={12} color={th.muted}>· {b.n}</T></T>
                  <T w="bold" size={14}>{ec(b.sum)} EC</T>
                </View>
                <View style={{ marginTop: 8, height: 8, borderRadius: 4, backgroundColor: th.glass(0.16), overflow: "hidden" }}>
                  <View style={{ width: `${Math.max(2, (b.sum / max) * 100)}%`, height: 8, borderRadius: 4, backgroundColor: b.key === "recharge" ? th.accent : th.knob }} />
                </View>
              </View>
            ))}
          </Glass>

          <SectionLabel style={{ marginTop: 20 }}>DERNIÈRES TRANSACTIONS</SectionLabel>
          {recent.length === 0 ? <T size={14} color={th.muted} style={{ marginTop: 10 }}>Aucune transaction sur cette période.</T> : (
            <View style={{ marginTop: 8, gap: 8 }}>
              {recent.map((t, i) => {
                const ty = TYPES.find((x) => x.key === t.transactionType);
                const color = t.status === "réussi" ? "#4ADE80" : t.status === "échoué" ? "#FF5A66" : th.muted;
                return (
                  <View key={`${t.id ?? i}`} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 20, backgroundColor: th.glassFill(0.12), borderWidth: 1, borderColor: th.glass(0.18), boxShadow: th.glassFx }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: th.ink, alignItems: "center", justifyContent: "center" }}>
                      <BimIcon name={ty?.icon ?? "transfer"} size={18} color={th.onInk} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T w="bold" size={14} numberOfLines={1}>{t.description || ty?.label || "Transaction"}</T>
                      <T size={12} color={th.muted}>{new Date(t.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</T>
                    </View>
                    <T w="bold" size={14} color={color}>{ec(t.amount)} EC</T>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </BimPage>
  );
}
