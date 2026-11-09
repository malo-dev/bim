/**
 * Mes commandes (design BIM NEXT) : toutes les commandes eau / gaz / carburant,
 * filtre En cours / Livrées / Toutes, statut en couleur ; toucher une commande → son suivi.
 */
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BimIcon } from "@/components/bim/icons";
import { OrderArt, orderArtItem, orderStatus } from "@/components/bim/orders";
import { ec, useTh } from "@/components/bim/theme";
import { Appear, BimBackground, Header, PillButton, PressScale, Segmented, T } from "@/components/bim/ui";
import { useGetUserOrdersQuery } from "@/services/orderService";

type Filter = "active" | "done" | "all";

const when = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

export default function MesCommandes() {
  const th = useTh();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("active");
  const { data, isLoading, isFetching, refetch } = useGetUserOrdersQuery({}, { pollingInterval: 15000 });
  useFocusEffect(useCallback(() => { refetch(); }, []));

  const all: any[] = data?.data ?? [];
  const activeCount = all.filter((o) => orderStatus(o.status).active).length;
  const list = useMemo(() => all.filter((o) => {
    const a = orderStatus(o.status).active;
    return filter === "all" ? true : filter === "active" ? a : !a;
  }), [all, filter]);

  return (
    <BimBackground>
      <View style={{ flex: 1, paddingTop: 28 + insets.top, paddingHorizontal: 20 }}>
        <Header title="Mes commandes" backLabel="Retour" onBack={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as any))} />
        <View style={{ marginTop: 18 }}>
          <Segmented height={44} value={filter} onChange={setFilter}
            items={[{ key: "active", label: activeCount ? `En cours (${activeCount})` : "En cours" }, { key: "done", label: "Terminées" }, { key: "all", label: "Toutes" }]} />
        </View>

        {isLoading ? <ActivityIndicator color={th.fg} style={{ marginTop: 40 }} /> : (
          <FlatList
            data={list}
            keyExtractor={(o) => String(o.orderNumber ?? o.orderId)}
            style={{ marginTop: 14 }}
            contentContainerStyle={{ gap: 10, paddingBottom: 30 + insets.bottom, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={!isLoading && isFetching} onRefresh={() => { refetch(); }} tintColor={th.fg} />}
            ListEmptyComponent={
              <Appear kind="rise" style={{ alignItems: "center", marginTop: 50, gap: 12 }}>
                <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: th.glassFill(0.14), borderWidth: 1, borderColor: th.glass(0.24), alignItems: "center", justifyContent: "center", boxShadow: th.glassFx }}>
                  <BimIcon name="box" size={34} color={th.fg} strokeWidth={1.6} />
                </View>
                <T w="bold" size={18}>{filter === "active" ? "Aucune commande en cours" : "Aucune commande"}</T>
                <T size={14} color={th.muted} style={{ textAlign: "center", lineHeight: 21 }}>Commande de l'eau, du gaz ou du carburant depuis l'accueil.</T>
                <PillButton variant="accent" label="Commander" onPress={() => router.replace("/(tabs)" as any)} style={{ alignSelf: "stretch", marginTop: 10 }} />
              </Appear>
            }
            renderItem={({ item: o, index }) => {
              const st = orderStatus(o.status);
              const art = orderArtItem(o);
              const paid = o.paymentStatus === "paid";
              return (
                <Appear kind="rise" delay={Math.min(index, 8) * 50}>
                  <PressScale scaleTo={0.97} onPress={() => router.push(`/commandes/${o.orderNumber}` as any)} accessibilityLabel={`Commande ${art.name}, ${st.label}`}
                    style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 22, backgroundColor: th.glassFill(st.active ? 0.18 : 0.1), borderWidth: 1, borderColor: th.glass(0.2), boxShadow: th.glassFx }}>
                    <OrderArt item={art} size={46} tile={56} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T w="bold" size={15} numberOfLines={1}>{art.name} × {o.quantity ?? 1}</T>
                      <T size={12} color={th.muted} style={{ marginTop: 2 }} numberOfLines={1}>#{o.orderNumber} · {when(o.createdAt)}</T>
                      <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, height: 24, borderRadius: 12, backgroundColor: st.color + "22" }}>
                          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: st.color }} />
                          <T w="bold" size={11} color={st.color}>{st.label}</T>
                        </View>
                        <T size={12} color={th.muted}>{ec(o.totalAmount)} EC{paid ? " · payé" : ""}</T>
                      </View>
                    </View>
                    <View style={{ alignItems: "center", gap: 4 }}>
                      <BimIcon name="chevron" size={18} color={th.muted} />
                      {st.active && <T size={10} color={th.muted}>Suivre</T>}
                    </View>
                  </PressScale>
                </Appear>
              );
            }}
          />
        )}
      </View>
    </BimBackground>
  );
}
