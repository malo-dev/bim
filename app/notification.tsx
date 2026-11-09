/**
 * Notifications (maquette) : non lues mises en avant, point rouge, « Tout marquer comme lu ».
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BimIcon, BimIconName } from "@/components/bim/icons";
import { useTh } from "@/components/bim/theme";
import { Appear, BimBackground, Header, PressScale, T } from "@/components/bim/ui";
import { useGetAllNotificationsQuery, useMarkAllAsReadMutation, useMarkAsReadMutation } from "@/services/notificationService";

type N = { notificationId: number; title?: string; message?: string; type?: string; isRead?: boolean; createdAt?: string };

const iconFor = (n: N): BimIconName => {
  const t = `${n.title ?? ""} ${n.message ?? ""}`.toLowerCase();
  if (t.includes("commande") || t.includes("livr")) return "box";
  if (t.includes("recharge") || t.includes("crédit") || t.includes("paiement") || t.includes("transfert")) return "recharge";
  if (t.includes("offre") || t.includes("promo") || t.includes("réduction") || t.includes("prix")) return "tag";
  if (t.includes("taxi") || t.includes("course") || t.includes("chauffeur")) return "car";
  if (t.includes("connexion") || t.includes("sécurité")) return "shield";
  return "sparkle";
};

// Retire les coches vertes (✅ ✔️ ☑️) des titres et messages, y compris des
// notifications déjà enregistrées : l'icône à gauche suffit.
const clean = (s?: string) => (s ?? "").replace(/[✅✔☑]️?/g, "").replace(/\s{2,}/g, " ").trim();

const ago = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  const m = Math.max(0, Math.round((Date.now() - d) / 60000));
  if (m < 1) return "à l'instant";
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h`;
  const days = Math.round(h / 24);
  if (days === 1) return "Hier";
  if (days < 7) return `${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

export default function NotificationsScreen() {
  const th = useTh();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState<string | null>(null);
  const [localRead, setLocalRead] = useState<Record<number, boolean>>({});
  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);
  const { data, isLoading, isFetching, refetch } = useGetAllNotificationsQuery(
    userId ? { userId, page: 1, pageSize: 60, paginate: "true", sortOrder: "desc" } : (undefined as any), { skip: !userId });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAll, { isLoading: marking }] = useMarkAllAsReadMutation();

  const items: N[] = data?.data ?? [];
  const isRead = (n: N) => !!n.isRead || !!localRead[n.notificationId];
  const unread = items.filter((n) => !isRead(n)).length;

  const read = (n: N) => {
    if (isRead(n)) return;
    setLocalRead((r) => ({ ...r, [n.notificationId]: true }));
    markAsRead(n.notificationId).catch(() => {});
  };
  const readAll = async () => {
    const all: Record<number, boolean> = {};
    items.forEach((n) => { all[n.notificationId] = true; });
    setLocalRead(all);
    try { await markAll(undefined).unwrap(); } catch { items.filter((n) => !n.isRead).forEach((n) => markAsRead(n.notificationId).catch(() => {})); }
  };

  return (
    <BimBackground>
      <View style={{ flex: 1, paddingTop: 28 + insets.top, paddingHorizontal: 20 }}>
        <Header title="Notifications" backLabel="Retour à l'accueil" onBack={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as any))} />
        <View style={{ marginTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <T size={14} color={th.muted}>{unread ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Tout est lu"}</T>
          <PressScale onPress={readAll} disabled={!unread || marking} accessibilityLabel="Tout marquer comme lu"
            style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: th.glass(0.3), justifyContent: "center" }}>
            <T size={13}>Tout marquer comme lu</T>
          </PressScale>
        </View>
        {isLoading ? <ActivityIndicator color={th.fg} style={{ marginTop: 40 }} /> : (
          <FlatList
            data={items}
            keyExtractor={(n) => String(n.notificationId)}
            style={{ marginTop: 14 }}
            contentContainerStyle={{ gap: 8, paddingBottom: 30 + insets.bottom }}
            refreshControl={<RefreshControl refreshing={!isLoading && isFetching} onRefresh={() => { refetch(); }} tintColor={th.fg} />}
            ListEmptyComponent={
              <View style={{ alignItems: "center", marginTop: 60, gap: 10 }}>
                <BimIcon name="bell" size={34} color={th.muted} />
                <T size={15} color={th.muted}>Aucune notification pour le moment.</T>
              </View>
            }
            renderItem={({ item, index }) => {
              const r = isRead(item);
              return (
                <Appear kind="rise" delay={Math.min(index, 8) * 50}>
                  <PressScale onPress={() => read(item)} accessibilityLabel={`${clean(item.title) || "Notification"}${r ? "" : ", non lue"}`}
                    style={{ flexDirection: "row", gap: 12, padding: 14, borderRadius: 22, backgroundColor: th.glassFill(r ? 0.08 : 0.18), borderWidth: 1, borderColor: th.glass(0.18), boxShadow: th.glassFx }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: th.ink, alignItems: "center", justifyContent: "center" }}>
                      <BimIcon name={iconFor(item)} size={20} color={th.onInk} strokeWidth={1.7} />
                      {!r && <View style={{ position: "absolute", top: 0, right: 0, width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: th.base, backgroundColor: th.dot }} />}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                        <T w="bold" size={14} style={{ flexShrink: 1 }} numberOfLines={1}>{clean(item.title) || "BIMNEXT"}</T>
                        <T size={12} color={th.muted}>{ago(item.createdAt)}</T>
                      </View>
                      {!!clean(item.message) && <T size={13} color={th.mutedSoft} style={{ marginTop: 3, lineHeight: 19 }}>{clean(item.message)}</T>}
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
