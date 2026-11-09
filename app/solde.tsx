/**
 * Mon solde (design BIM NEXT) : carte du compte, actions, dernières commandes.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { RefreshControl, View } from "react-native";
import { BimIcon, BimIconName } from "@/components/bim/icons";
import { OrderArt, orderArtItem, orderStatus } from "@/components/bim/orders";
import { ec, useTh } from "@/components/bim/theme";
import { Appear, BimPage, EmptyState, Glass, PressScale, SectionLabel, StatusPill, T } from "@/components/bim/ui";
import { useGetUserOrdersQuery } from "@/services/orderService";
import { useGetUserByIdQuery } from "@/services/userService";

const mask = (acc?: string) => (acc ? `••••  ••••  ${String(acc).slice(-4)}` : "••••  ••••  ••••");
const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "");

export default function SoldeScreen() {
  const th = useTh();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  useEffect(() => { AsyncStorage.multiGet(["userId", "bim_hide_balance"]).then(([[, id], [, h]]) => { setUserId(id); setHidden(h === "1"); }); }, []);
  const { data: user, isLoading, isFetching, refetch } = useGetUserByIdQuery(userId!, { skip: !userId });
  const { data: ordersData, refetch: refetchOrders } = useGetUserOrdersQuery({}, { skip: !userId });
  const recent: any[] = useMemo(() => [...(ordersData?.data ?? [])].slice(0, 5), [ordersData]);

  const actions: { icon: BimIconName; label: string; to: string; accent?: boolean }[] = [
    { icon: "plus", label: "Recharger", to: "/recharge", accent: true },
    { icon: "transfer", label: "Transférer", to: "/transfert" },
    { icon: "download", label: "Retrait", to: "/retrait" },
    { icon: "clock", label: "Historique", to: "/history" },
  ];

  return (
    <BimPage title="Mon solde" refreshControl={<RefreshControl refreshing={!isLoading && isFetching} onRefresh={() => { refetch(); if (userId) refetchOrders(); }} tintColor={th.fg} />}>
      {isLoading && !user ? <EmptyState loading title="Chargement…" /> : (
        <>
          <Appear kind="rise" delay={60}>
            <Glass a={0.16} b={0.24} radius={28} style={{ marginTop: 20, padding: 20, overflow: "hidden" }}>
              <View style={{ position: "absolute", right: -40, top: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: th.glass(0.08) }} />
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <T size={12} color={th.muted} style={{ letterSpacing: 1 }}>SOLDE DISPONIBLE</T>
                <T w="bold" size={13} style={{ letterSpacing: 1.5 }}>BIM<T w="bold" size={13} color={th.dot}>.</T>NEXT</T>
              </View>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 8 }}>
                <T w="bold" size={44} style={{ letterSpacing: -0.9 }}>{hidden ? "••••" : ec(user?.soldNumber)}</T>
                <T w="light" size={20}>EC</T>
                <PressScale onPress={() => { const n = !hidden; setHidden(n); AsyncStorage.setItem("bim_hide_balance", n ? "1" : "0"); }}
                  accessibilityLabel={hidden ? "Afficher le solde" : "Cacher le solde"}
                  style={{ marginLeft: "auto", width: 40, height: 40, borderRadius: 20, backgroundColor: th.glass(0.16), alignItems: "center", justifyContent: "center" }}>
                  <BimIcon name={hidden ? "eyeOff" : "eye"} size={18} color={th.fg} />
                </PressScale>
              </View>
              <View style={{ marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: th.glass(0.16), flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View>
                  <T size={11} color={th.muted} style={{ letterSpacing: 1 }}>COMPTE</T>
                  <T w="bold" size={15} style={{ marginTop: 2, letterSpacing: 1 }}>{mask(user?.accountNumber)}</T>
                </View>
                <StatusPill label="Actif" color="#22C55E" />
              </View>
            </Glass>
          </Appear>

          <View style={{ marginTop: 16, flexDirection: "row", gap: 10 }}>
            {actions.map((a, i) => (
              <Appear key={a.to} kind="rise" delay={120 + i * 60} style={{ flex: 1 }}>
                <PressScale onPress={() => router.push(a.to as any)} accessibilityLabel={a.label} style={{ alignItems: "center", gap: 6 }}>
                  <View style={{ width: 58, height: 58, borderRadius: 19, alignItems: "center", justifyContent: "center",
                    backgroundColor: a.accent ? th.accent : th.glassFill(0.14), borderWidth: a.accent ? 0 : 1, borderColor: th.glass(0.2), boxShadow: th.glassFx }}>
                    <BimIcon name={a.icon} size={22} color={a.accent ? th.onAccent : th.fg} strokeWidth={1.9} />
                  </View>
                  <T size={12}>{a.label}</T>
                </PressScale>
              </Appear>
            ))}
          </View>

          <View style={{ marginTop: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <SectionLabel>DERNIÈRES COMMANDES</SectionLabel>
            <PressScale onPress={() => router.push("/commandes" as any)} accessibilityLabel="Voir toutes mes commandes" style={{ minHeight: 36, justifyContent: "center" }}>
              <T w="bold" size={13}>Voir tout ›</T>
            </PressScale>
          </View>
          {recent.length === 0 ? (
            <Glass a={0.1} b={0.18} radius={22} style={{ marginTop: 8, padding: 18, alignItems: "center", gap: 6 }}>
              <BimIcon name="box" size={26} color={th.muted} />
              <T size={14} color={th.muted}>Aucune commande pour le moment</T>
            </Glass>
          ) : (
            <View style={{ marginTop: 8, gap: 8 }}>
              {recent.map((o, i) => {
                const st = orderStatus(o.status);
                const art = orderArtItem(o);
                return (
                  <Appear key={o.orderNumber ?? i} kind="rise" delay={i * 50}>
                    <PressScale scaleTo={0.97} onPress={() => o.orderNumber && router.push(`/commandes/${o.orderNumber}` as any)} accessibilityLabel={`Commande ${art.name}`}
                      style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 20, backgroundColor: th.glassFill(0.12), borderWidth: 1, borderColor: th.glass(0.18), boxShadow: th.glassFx }}>
                      <OrderArt item={art} size={38} tile={46} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <T w="bold" size={14} numberOfLines={1}>{art.name}</T>
                        <T size={12} color={th.muted}>#{o.orderNumber} · {date(o.createdAt)}</T>
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 4 }}>
                        <T w="bold" size={14}>{ec(o.totalAmount)} EC</T>
                        <StatusPill label={st.label} color={st.color} />
                      </View>
                    </PressScale>
                  </Appear>
                );
              })}
            </View>
          )}
        </>
      )}
    </BimPage>
  );
}
