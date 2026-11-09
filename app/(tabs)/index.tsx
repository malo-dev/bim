/**
 * Accueil BIM NEXT (maquette) : économies + solde, actions rapides, COMMANDER.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { BimIcon, BimIconName } from "@/components/bim/icons";
import { TYPE_META, ec, useTh } from "@/components/bim/theme";
import { Appear, BLogo, BimBackground, Glass, Glow, Ink, PressScale, RoundButton, SectionLabel, Swap, T } from "@/components/bim/ui";
import { useTabBarScroll } from "@/components/bim/tabBlur";
import { useEnsureLocation } from "@/hooks/useEnsureLocation";
import { useOtaUpdate } from "@/hooks/useOtaUpdate";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { OrderArt, orderArtItem, orderStatus } from "@/components/bim/orders";
import { useGetMySavingsQuery, useGetUserOrdersQuery } from "@/services/orderService";
import { useGetAllSectorsQuery } from "@/services/sectorsServices";
import { useGetUserByIdQuery } from "@/services/userService";
import { useGetMyActiveRideQuery } from "@/services/rideService";

const RIDE_LABEL: Record<string, string> = {
  searching: "🚖 Choisis ton chauffeur",
  accepted: "🚖 Ton chauffeur arrive",
  arriving: "📍 Ton chauffeur est là",
  in_progress: "🚖 Course en cours",
};
const APP_ICON = require("@/assets/images/icon.png");

function CountUp({ value, size, hidden }: { value: number; size: number; hidden?: boolean }) {
  const a = useRef(new Animated.Value(0)).current;
  const [txt, setTxt] = useState(ec(0));
  useEffect(() => {
    const id = a.addListener(({ value: v }) => setTxt(ec(v)));
    Animated.timing(a, { toValue: value, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => a.removeListener(id);
  }, [value]);
  return <T w="bold" size={size} style={{ letterSpacing: -size * 0.02, lineHeight: size * 1.08 }}>{hidden ? "••••" : txt}</T>;
}

function QuickAction({ icon, label, onPress, accent, delay }: { icon: BimIconName; label: string; onPress: () => void; accent?: boolean; delay: number }) {
  const th = useTh();
  return (
    <Appear kind="rise" delay={delay} style={{ flex: 1 }}>
      <PressScale onPress={onPress} accessibilityLabel={label} style={{ alignItems: "center", gap: 6 }}>
        <View style={{ width: 58, height: 58, borderRadius: 19, alignItems: "center", justifyContent: "center",
          backgroundColor: accent ? th.accent : th.glassFill(0.14), borderWidth: accent ? 0 : 1, borderColor: th.glass(0.2), boxShadow: th.glassFx }}>
          <BimIcon name={icon} size={24} color={accent ? th.onAccent : th.fg} strokeWidth={accent ? 1.9 : 1.8} />
        </View>
        <T size={12}>{label}</T>
      </PressScale>
    </Appear>
  );
}

function OrderRow({ icon, title, sub, onPress, delay, lead, titleSize = 17 }: { icon: BimIconName; title: string; sub: string; onPress: () => void; delay: number; lead?: React.ReactNode; titleSize?: number }) {
  const th = useTh();
  return (
    <Appear kind="page" delay={delay}>
      <PressScale onPress={onPress} accessibilityLabel={`${title}, ${sub}`}
        style={{ height: 62, borderRadius: 31, backgroundColor: th.glassFill(0.14), borderWidth: 1, borderColor: th.glass(0.2), flexDirection: "row", alignItems: "center", gap: 14, paddingLeft: 7, paddingRight: 20, boxShadow: th.glassFx }}>
        {lead ?? <Ink size={48} icon={icon} iconSize={22} />}
        <View style={{ flex: 1 }}>
          <T w="bold" size={titleSize} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ letterSpacing: titleSize < 17 ? 0.3 : 0.7 }}>{title}</T>
          <T size={12} color={th.muted}>{sub}</T>
        </View>
        <Swap><T size={14} color={th.muted} style={{ letterSpacing: 2 }}>›››</T></Swap>
      </PressScale>
    </Appear>
  );
}

export default function HomeScreen() {
  const th = useTh();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unread } = useUnreadNotifications();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet(["userId", "bim_hide_balance"]).then(([[, id], [, hide]]) => { setUserId(id); setHidden(hide === "1"); setReady(true); });
  }, []);
  useEffect(() => { if (ready && !userId) router.replace("/onboarding"); }, [ready, userId]);

  const { data: user, refetch } = useGetUserByIdQuery(userId!, { skip: !userId });
  const { data: savings, refetch: refetchSavings } = useGetMySavingsQuery(undefined, { skip: !userId });
  const { data: ordersData, refetch: refetchOrders } = useGetUserOrdersQuery({}, { skip: !userId, pollingInterval: 20000 });
  const activeOrders: any[] = (ordersData?.data ?? []).filter((o: any) => orderStatus(o.status).active);
  const liveOrder = activeOrders[0];
  const { data: sectorsData } = useGetAllSectorsQuery({ page: 1, pageSize: 30, search: "", paginate: false });
  useEnsureLocation();
  const ota = useOtaUpdate();

  // Course de taxi en cours → raccourci pour la rouvrir directement.
  const { data: activeRideData, refetch: refetchRide } = useGetMyActiveRideQuery(undefined, { skip: !userId, pollingInterval: 15000 });
  const activeRide = activeRideData?.data ?? null;

  useFocusEffect(useCallback(() => { if (userId) { refetch(); refetchSavings(); refetchOrders(); refetchRide(); } }, [userId]));

  const barScroll = useTabBarScroll("index", 130 + insets.bottom);
  const onRefresh = async () => {
    setRefreshing(true);
    try { await Promise.all([refetch(), refetchSavings(), refetchOrders()]); } finally { setRefreshing(false); }
  };
  const toggle = () => setHidden((h) => { AsyncStorage.setItem("bim_hide_balance", h ? "0" : "1").catch(() => {}); return !h; });

  const rawName: string = user?.username ?? "";
  const name = !rawName ? "…" : rawName.startsWith("quick_") ? "toi" : rawName.split(" ")[0];
  // Initiales de la personne connectée (ex. « Malo Leader » → « ML »)
  const initials = (!rawName || rawName.startsWith("quick_") ? "" : rawName.trim().split(/\s+/).slice(0, 2).map((w: string) => w[0]).join("")).toUpperCase();
  const sectors: any[] = sectorsData?.data ?? [];
  const transport = sectors.find((x) => String(x.name ?? "").toLowerCase().includes("transport"));

  return (
    <BimBackground enter={false}>
      <Glow top={-60} w={460} h={380} opacity={0.16} />
      <ScrollView {...barScroll} contentContainerStyle={{ paddingTop: 18 + insets.top, paddingHorizontal: 20, paddingBottom: 130 + insets.bottom }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={th.fg} colors={[th.ink]} />}>
        <Appear kind="fade" duration={500} style={{ height: 46, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <PressScale onPress={() => router.navigate("/(tabs)/profil" as any)} accessibilityLabel="Mon profil"
            style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: initials ? th.accent : "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: th.glass(0.35), overflow: "hidden" }}>
            {initials ? <T w="bold" size={17} color={th.onAccent} style={{ letterSpacing: 0.5 }}>{initials}</T>
              : <Image source={APP_ICON} style={{ width: 38, height: 38 }} contentFit="contain" />}
          </PressScale>
          <View style={{ flex: 1, minWidth: 0 }}>
            <T size={13} color={th.muted}>Salut,</T>
            <T w="bold" size={19} numberOfLines={1}>{name}</T>
          </View>
          <RoundButton icon="bell" label={`Notifications${unread ? `, ${unread} nouvelles` : ""}`} badge={unread} onPress={() => router.push("/notification" as any)} />
        </Appear>

        {ota.available && (
          <Appear kind="rise">
            <PressScale onPress={ota.apply} accessibilityLabel="Installer la mise à jour" style={{ marginTop: 14, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 18, backgroundColor: th.accent }}>
              <BimIcon name="download" size={18} color={th.onAccent} />
              <T w="bold" size={14} color={th.onAccent} style={{ flex: 1 }}>{ota.applying ? "Mise à jour…" : "Nouvelle version disponible — toucher pour installer"}</T>
            </PressScale>
          </Appear>
        )}

        {activeRide && (
          <Appear kind="rise">
            <PressScale onPress={() => router.push(`/transport/${transport?.businessId ?? 2}` as any)} accessibilityLabel={`${RIDE_LABEL[activeRide.status] ?? "Course en cours"}, voir la course`}
              style={{ marginTop: 14, flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 18, backgroundColor: th.ink }}>
              <Ink size={40} icon="taxi" iconSize={18} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <T w="bold" size={14} color={th.onInk} numberOfLines={1}>{RIDE_LABEL[activeRide.status] ?? "Course en cours"}</T>
                <T size={12} color={th.onInkMuted} numberOfLines={1}>Vers {activeRide.destinationAddress}</T>
              </View>
              <T w="bold" size={13} color={th.onInk}>Voir ›</T>
            </PressScale>
          </Appear>
        )}

        <Appear kind="rise" delay={80}>
          <Glass style={{ marginTop: 14, paddingVertical: 16, paddingHorizontal: 20 }} a={0.14} b={0.22}>
            <T size={14} color={th.mutedSoft}>Tu as économisé ce mois-ci</T>
            <View style={{ marginTop: 4, flexDirection: "row", alignItems: "baseline", gap: 8 }}>
              <CountUp value={Number(savings?.saved ?? 0)} size={40} />
              <T w="light" size={18}>EC</T>
            </View>
            <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: th.glass(0.18), flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <T size={12} color={th.muted}>Solde disponible</T>
                  <PressScale onPress={toggle} accessibilityLabel={hidden ? "Afficher le solde" : "Cacher le solde"}
                    style={{ width: 36, height: 36, marginVertical: -6, borderRadius: 18, backgroundColor: th.glass(0.18), alignItems: "center", justifyContent: "center" }}>
                    <BimIcon name={hidden ? "eyeOff" : "eye"} size={18} color={th.fg} />
                  </PressScale>
                </View>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 5, marginTop: 4 }}>
                  <CountUp value={Number(user?.soldNumber ?? 0)} size={20} hidden={hidden} />
                  <T w="light" size={20}>EC</T>
                </View>
              </View>
              <PressScale onPress={() => router.push("/recharge" as any)} accessibilityLabel="Recharger"
                style={{ height: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: th.accent, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <BimIcon name="plus" size={16} color={th.onAccent} strokeWidth={2.4} />
                <T w="bold" size={14} color={th.onAccent}>Recharger</T>
              </PressScale>
            </View>
          </Glass>
        </Appear>

        <SectionLabel style={{ marginTop: 16 }}>ACTIONS RAPIDES</SectionLabel>
        <View style={{ marginTop: 10, flexDirection: "row", gap: 10 }}>
          <QuickAction icon="recharge" label="Recharge" delay={160} onPress={() => router.push("/recharge" as any)} />
          <QuickAction icon="transfer" label="Transfert" delay={220} onPress={() => router.push("/transfert" as any)} />
          <QuickAction icon="scan" label="Scanner" delay={280} onPress={() => router.push("/(tabs)/scan" as any)} />
          <QuickAction icon="qr" label="Mon QR" accent delay={340} onPress={() => router.push("/qrcode" as any)} />
        </View>

        <SectionLabel style={{ marginTop: 16 }}>COMMANDER</SectionLabel>
        <View style={{ marginTop: 10, gap: 10 }}>
          <OrderRow icon="bike" title="EAU, GAZ, CARBURANT" titleSize={15} sub="Livrés chez toi à Bunia" delay={380} onPress={() => router.push("/commande" as any)} />
          <OrderRow icon="taxi" title="TAXI" sub="Commander un taxi" delay={450} onPress={() => router.push(`/transport/${transport?.businessId ?? 2}` as any)} />
          <OrderRow icon="box" title="MES COMMANDES" sub={activeOrders.length ? `${activeOrders.length} en cours · voir et suivre` : "Voir et suivre toutes mes commandes"} delay={520} onPress={() => router.push("/commandes" as any)} />
        </View>
        {/* Le bloc « commande en cours » reste retiré de l'accueil. */}
      </ScrollView>
    </BimBackground>
  );
}
