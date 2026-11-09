/**
 * Espace agent (design BIM NEXT) : commission disponible, statistiques, retraits reçus par période (paginés).
 */
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, RefreshControl, View } from "react-native";
import { BimIcon, BimIconName } from "@/components/bim/icons";
import { ec, useTh } from "@/components/bim/theme";
import { Appear, BimPage, FilterChips, Glass, PressScale, SectionLabel, T } from "@/components/bim/ui";
import { useGetAgentRetraitsQuery, useGetAgentStatsQuery } from "@/services/agentService";

const PERIODS = [
  { key: "today", label: "Aujourd'hui" }, { key: "week", label: "7 jours" }, { key: "month", label: "Ce mois" }, { key: "year", label: "Cette année" },
] as const;
type Period = (typeof PERIODS)[number]["key"];

export default function AgentDashboard() {
  const th = useTh();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("today");
  const [page, setPage] = useState(1);
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useGetAgentStatsQuery(undefined);
  const { data: rData, isLoading: rLoading, isFetching, refetch: refetchR } = useGetAgentRetraitsQuery({ period, page, pageSize: 20 }, { refetchOnFocus: true });
  const stats = statsData?.stats;
  const agent = statsData?.agent;
  const retraits: any[] = rData?.data ?? [];
  const total = rData?.total ?? 0;
  const pages = rData?.totalPages ?? 1;
  const periodTotal = !stats ? 0 : period === "today" ? stats.todayTotal : period === "week" ? stats.weekTotal : period === "month" ? stats.monthTotal : stats.allTimeTotal;

  const cards: { label: string; value: number; sub: string; icon: BimIconName }[] = [
    { label: "Aujourd'hui", value: stats?.todayTotal ?? 0, sub: `${stats?.todayCount ?? 0} retrait${(stats?.todayCount ?? 0) > 1 ? "s" : ""}`, icon: "arrowDown" },
    { label: "7 derniers jours", value: stats?.weekTotal ?? 0, sub: "Volume total", icon: "chart" },
    { label: "Ce mois", value: stats?.monthTotal ?? 0, sub: "Retraits traités", icon: "calendar" },
    { label: "Depuis le début", value: stats?.allTimeTotal ?? 0, sub: `${stats?.allTimeCount ?? 0} retraits`, icon: "star" },
  ];

  return (
    <BimPage title="Espace agent" refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refetchStats(); refetchR(); }} tintColor={th.fg} />}>
      <Appear kind="rise" delay={60}>
        <Glass a={0.16} b={0.24} radius={28} style={{ marginTop: 20, padding: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <T size={13} color={th.muted}>Commission disponible</T>
            {!!agent?.accountNumber && <T size={12} color={th.muted}>Compte {agent.accountNumber}</T>}
          </View>
          {statsLoading ? <ActivityIndicator color={th.fg} style={{ marginVertical: 14, alignSelf: "flex-start" }} /> : (
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 4 }}>
              <T w="bold" size={42} style={{ letterSpacing: -0.8 }}>{ec(agent?.soldNumber)}</T>
              <T w="light" size={18}>EC</T>
            </View>
          )}
          <T size={14} style={{ marginTop: 6 }}>Bienvenue, <T w="bold" size={14}>{agent?.username ?? "Agent"}</T></T>
        </Glass>
      </Appear>

      <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {cards.map((c, i) => (
          <Appear key={c.label} kind="rise" delay={120 + i * 50} style={{ width: "48%", flexGrow: 1 }}>
            <Glass a={0.12} b={0.2} radius={22} style={{ padding: 14 }}>
              <BimIcon name={c.icon} size={18} color={th.fg} strokeWidth={2} />
              <T size={12} color={th.muted} style={{ marginTop: 8 }}>{c.label}</T>
              <T w="bold" size={18} style={{ marginTop: 2 }}>{statsLoading ? "…" : `${ec(c.value)} EC`}</T>
              <T size={11} color={th.muted}>{c.sub}</T>
            </Glass>
          </Appear>
        ))}
      </View>

      <SectionLabel style={{ marginTop: 22 }}>RETRAITS REÇUS</SectionLabel>
      <View style={{ marginTop: 8 }}><FilterChips items={PERIODS as any} value={period} onChange={(k) => { setPeriod(k as Period); setPage(1); }} /></View>
      {!rLoading && <T size={13} color={th.muted} style={{ marginTop: 10 }}>{total} retrait{total > 1 ? "s" : ""} · {ec(periodTotal)} EC</T>}

      {rLoading ? <ActivityIndicator color={th.fg} style={{ marginTop: 24 }} /> : retraits.length === 0 ? (
        <Glass a={0.1} b={0.18} radius={22} style={{ marginTop: 10, padding: 20, alignItems: "center", gap: 8 }}>
          <BimIcon name="wallet" size={28} color={th.muted} />
          <T size={14} color={th.muted}>Aucun retrait sur cette période</T>
        </Glass>
      ) : (
        <View style={{ marginTop: 10, gap: 8, opacity: isFetching ? 0.6 : 1 }}>
          {retraits.map((tx, i) => (
            <View key={tx.transactionRetraitId ?? i} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 20,
              backgroundColor: th.glassFill(0.12), borderWidth: 1, borderColor: th.glass(0.18), boxShadow: th.glassFx }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(34,197,94,0.22)", alignItems: "center", justifyContent: "center" }}>
                <BimIcon name="arrowDown" size={19} color="#4ADE80" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T w="bold" size={14} numberOfLines={1}>{tx.sender?.username ?? "Client BIM"}</T>
                <T size={12} color={th.muted} numberOfLines={1}>{tx.sender?.telephone ? `${tx.sender.telephone} · ` : ""}{new Date(tx.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</T>
              </View>
              <T w="bold" size={14} color="#4ADE80">+{ec(tx.amount)} EC</T>
            </View>
          ))}
        </View>
      )}

      {pages > 1 && (
        <View style={{ marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <PressScale onPress={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} accessibilityLabel="Page précédente"
            style={{ height: 42, paddingHorizontal: 16, borderRadius: 21, backgroundColor: th.glass(0.14), flexDirection: "row", alignItems: "center", gap: 6 }}>
            <BimIcon name="back" size={16} color={th.fg} /><T size={13}>Préc.</T>
          </PressScale>
          <T w="bold" size={14}>{page} / {pages}</T>
          <PressScale onPress={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} accessibilityLabel="Page suivante"
            style={{ height: 42, paddingHorizontal: 16, borderRadius: 21, backgroundColor: th.glass(0.14), flexDirection: "row", alignItems: "center", gap: 6 }}>
            <T size={13}>Suiv.</T><BimIcon name="chevron" size={16} color={th.fg} />
          </PressScale>
        </View>
      )}
    </BimPage>
  );
}
