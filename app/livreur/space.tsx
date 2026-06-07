import { C, Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useGetMyLivreurProfileQuery,
  useToggleLivreurOnlineMutation,
  useUpdateLivreurLocationMutation,
  useGetAvailableOrdersQuery,
  useGetMyDeliveriesQuery,
  useAcceptOrderMutation,
  useCancelDeliveryMutation,
  useGetMyEarningsQuery,
  useSendSOSMutation,
  useGetMyRatingsQuery,
} from "@/services/livreurService";
import axiosInstance from "@/services/axiosInstance";
import { getSocket } from "@/services/socketService";

function useTheme() {
  const isDark = useColorScheme() === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

const STAR = "★";

const ORDER_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "En attente",     color: "#F97316", bg: "#FFF7ED" },
  confirmed:  { label: "Confirmée",      color: "#0353CC", bg: "#EFF6FF" },
  processing: { label: "En préparation", color: "#8B5CF6", bg: "#F5F3FF" },
  shipped:    { label: "En livraison",   color: "#4D96FF", bg: "#EFF8FF" },
};

export default function LivreurSpaceScreen() {
  const router = useRouter();
  const { isDark, t } = useTheme();

  const { data: livreur, refetch: refetchProfile } = useGetMyLivreurProfileQuery(undefined);
  const { data: availableData, refetch: refetchAvailable, isFetching: loadingAvailable } = useGetAvailableOrdersQuery(undefined);
  const { data: myDelivData,   refetch: refetchMine }    = useGetMyDeliveriesQuery(undefined);
  const { data: earningsData,  refetch: refetchEarnings } = useGetMyEarningsQuery(undefined);

  const [toggleOnline, { isLoading: togglingOnline }] = useToggleLivreurOnlineMutation();
  const [updateLocation]                              = useUpdateLivreurLocationMutation();
  const [acceptOrder,  { isLoading: accepting }]      = useAcceptOrderMutation();
  const [cancelDelivery]                              = useCancelDeliveryMutation();
  const [sendSOS, { isLoading: sendingSOS }]          = useSendSOSMutation();

  const [gpsGranted, setGpsGranted] = useState(false);
  const [gpsChecked, setGpsChecked] = useState(false);
  const [livreurInfo, setLivreurInfo] = useState<any>(null);
  const [tab, setTab] = useState<"available" | "mine" | "earnings" | "avis">("available");
  const [ratingPeriod, setRatingPeriod] = useState<string | undefined>(undefined);

  const { data: ratingsData, refetch: refetchRatings } = useGetMyRatingsQuery(ratingPeriod);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const sosPulse = useRef(new Animated.Value(1)).current;
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const availableOrders: any[] = availableData?.data ?? [];
  const myDeliveries:    any[] = myDelivData?.data   ?? [];

  useEffect(() => {
    AsyncStorage.getItem("livreurUser").then((raw) => {
      if (raw) setLivreurInfo(JSON.parse(raw));
      else router.replace("/livreur/login");
    });
    AsyncStorage.getItem("livreurToken").then((token) => {
      if (token) axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    });
    requestGps();
    return () => { if (locationInterval.current) clearInterval(locationInterval.current); };
  }, []);

  // Écouter nouvelles commandes et mises à jour de statut via Socket.io
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const newOrderHandler = () => { refetchAvailable(); };
    const statusHandler = () => { refetchMine(); };
    if (livreur?.companyId) {
      socket.on(`company:new_order:${livreur.companyId}`, newOrderHandler);
    }
    socket.on("order:status_updated", statusHandler);
    return () => {
      if (livreur?.companyId) socket.off(`company:new_order:${livreur.companyId}`, newOrderHandler);
      socket.off("order:status_updated", statusHandler);
    };
  }, [livreur?.companyId]);

  useEffect(() => {
    if (!gpsGranted) return;
    if (livreur?.isOnline) startBroadcast();
    else { if (locationInterval.current) clearInterval(locationInterval.current); }
    return () => { if (locationInterval.current) clearInterval(locationInterval.current); };
  }, [livreur?.isOnline, gpsGranted]);

  async function requestGps() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("GPS requis", "Activez le GPS pour pouvoir livrer.", [
        { text: "Paramètres", onPress: () => Linking.openSettings() },
        { text: "Plus tard", style: "cancel" },
      ]);
    }
    setGpsGranted(status === "granted");
    setGpsChecked(true);
  }

  function startBroadcast() {
    if (locationInterval.current) clearInterval(locationInterval.current);
    locationInterval.current = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await updateLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch {}
    }, 15000);
  }

  async function handleToggleOnline() {
    if (!gpsGranted) { await requestGps(); return; }
    await toggleOnline();
    refetchProfile();
  }

  async function handleAccept(orderNumber: string) {
    const res = await acceptOrder(orderNumber);
    if ((res as any).error) {
      const msg = (res as any).error?.data?.message || "Cette commande n'est plus disponible";
      Alert.alert("Déjà prise", msg);
    } else {
      Alert.alert("✅ Commande acceptée !", "Rendez-vous chez le client pour la livraison.");
      refetchAvailable();
      refetchMine();
    }
  }

  async function handleCancel(orderNumber: string) {
    Alert.alert("Annuler la livraison ?", "La commande redeviendra disponible pour d'autres livreurs.", [
      { text: "Non", style: "cancel" },
      {
        text: "Oui, annuler", style: "destructive",
        onPress: async () => {
          await cancelDelivery(orderNumber);
          refetchAvailable();
          refetchMine();
        },
      },
    ]);
  }

  async function handleLogout() {
    Alert.alert("Déconnexion", "Quitter l'espace livreur ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Quitter", style: "destructive",
        onPress: async () => {
          if (locationInterval.current) clearInterval(locationInterval.current);
          await AsyncStorage.multiRemove(["livreurToken", "livreurId", "livreurUser"]);
          router.replace("/login");
        },
      },
    ]);
  }

  function openClientMap(lat: number, lng: number) {
    Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
  }

  // SOS pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(sosPulse, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(sosPulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  async function handleSendSOS(type: "suspect" | "urgence" | "secours") {
    setShowSOSModal(false);
    let latitude: number | null = null;
    let longitude: number | null = null;
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      latitude  = loc.coords.latitude;
      longitude = loc.coords.longitude;
    } catch {}
    try {
      await sendSOS({ type, latitude, longitude }).unwrap();
      Alert.alert(
        "🆘 Alerte envoyée",
        "Les équipes BIM NEXT ont été notifiées de votre alerte et votre position a été transmise. Restez en sécurité.",
        [{ text: "OK" }]
      );
    } catch {
      Alert.alert("Erreur", "Impossible d'envoyer l'alerte. Appelez le support directement.");
    }
  }

  function confirmSOS(type: "suspect" | "urgence" | "secours") {
    const labels: Record<string, string> = {
      suspect: "🟠 Signaler un comportement suspect",
      urgence: "🔴 Signaler une urgence personnelle",
      secours: "🆘 Appel au secours — situation grave",
    };
    Alert.alert(
      "Confirmer l'alerte SOS",
      `${labels[type]}\n\nVotre position GPS sera transmise immédiatement aux équipes BIM NEXT.`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Envoyer maintenant", style: "destructive", onPress: () => handleSendSOS(type) },
      ]
    );
  }

  const isOnline    = livreur?.isOnline ?? false;
  const rating      = parseFloat(livreur?.rating ?? 0) || 0;
  const ratingCount = livreur?.ratingCount ?? 0;
  const company     = livreur?.company;

  return (
    <View style={[s.root, { backgroundColor: t.background }]}>
      <View style={s.header}>
        <LinearGradient colors={["#302E99", "#0353CC"]} style={StyleSheet.absoluteFill} />
        <View style={s.deco1} />
        <View style={s.deco2} />
        <SafeAreaView edges={["top"]}>
          <View style={s.topBar}>
            <View style={s.bikeWrap}><Ionicons name="bicycle" size={22} color={C.white} /></View>
            <Text style={s.headerTitle}>Espace Livreur</Text>
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={C.white} />
            </TouchableOpacity>
          </View>
          <View style={s.headerBody}>
            <Text style={s.userName}>{livreurInfo?.username ?? "Livreur"}</Text>
            {company && <Text style={s.companyName}>{company.name}</Text>}
            <View style={s.ratingRow}>
              {[1,2,3,4,5].map(i => (
                <Text key={i} style={{ fontSize: 16, color: i <= Math.round(rating) ? "#FFD700" : "rgba(255,255,255,0.3)" }}>{STAR}</Text>
              ))}
              <Text style={s.ratingTxt}>{rating.toFixed(1)} ({ratingCount} avis)</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={s.body}
        refreshControl={<RefreshControl refreshing={loadingAvailable} onRefresh={() => { refetchAvailable(); refetchMine(); refetchEarnings(); }} />}
      >
        {/* GPS warning */}
        {gpsChecked && !gpsGranted && (
          <TouchableOpacity style={s.gpsWarn} onPress={requestGps} activeOpacity={0.8}>
            <Ionicons name="location-outline" size={20} color="#fff" />
            <Text style={s.gpsWarnTxt}>GPS non activé — Appuyez pour activer</Text>
          </TouchableOpacity>
        )}

        {/* Online toggle */}
        <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={[s.onlineDot, { backgroundColor: isOnline ? "#22C55E" : C.muted }]} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[s.onlineTitle, { color: t.text }]}>{isOnline ? "Vous êtes en ligne" : "Vous êtes hors ligne"}</Text>
              <Text style={[s.onlineSub, { color: C.muted }]}>{isOnline ? "Position partagée • Nouvelles commandes visibles" : "Activez pour voir les commandes"}</Text>
            </View>
            <Switch value={isOnline} onValueChange={handleToggleOnline}
              disabled={togglingOnline || !gpsGranted}
              trackColor={{ false: t.border, true: "#22C55E" }} thumbColor={C.white} />
          </View>
        </View>

        {/* Tabs */}
        <View style={[s.tabRow, { backgroundColor: t.card, borderColor: t.border }]}>
          {([
            ["available", "Disponibles", availableOrders.length],
            ["mine",      "En cours",    myDeliveries.length],
            ["earnings",  "Gains",       0],
            ["avis",      "Avis",        0],
          ] as const).map(([key, label, count]) => (
            <TouchableOpacity
              key={key}
              style={[s.tabBtn, tab === key && { backgroundColor: C.primary }]}
              onPress={() => setTab(key)}
              activeOpacity={0.8}
            >
              <Text style={[s.tabTxt, { color: tab === key ? C.white : C.muted }]}>{label}</Text>
              {(count as number) > 0 && (
                <View style={[s.badge, { backgroundColor: tab === key ? "rgba(255,255,255,0.25)" : C.primary }]}>
                  <Text style={s.badgeTxt}>{count as number}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Liste commandes disponibles */}
        {tab === "available" && (
          <>
            {availableOrders.length === 0 ? (
              <View style={[s.empty, { backgroundColor: t.card, borderColor: t.border }]}>
                <Ionicons name="bicycle-outline" size={40} color={C.muted} />
                <Text style={[s.emptyTxt, { color: C.muted }]}>Aucune commande disponible</Text>
                <Text style={[s.emptySub, { color: C.muted }]}>Passez en ligne et attendez une commande</Text>
              </View>
            ) : availableOrders.map((o: any) => (
              <View key={o.orderNumber} style={[s.orderCard, { backgroundColor: t.card, borderColor: t.border }]}>
                <View style={[s.orderStripe, { backgroundColor: "#F97316" }]} />
                <View style={{ flex: 1, padding: 12 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={[s.orderNum, { color: t.text }]}>{o.orderNumber}</Text>
                    <Text style={[s.orderTotal, { color: C.primary }]}>{o.grandTotal?.toFixed(2)} EC</Text>
                  </View>
                  {o.commissionRate != null && (
                    <View style={[s.commissionBadge]}>
                      <Ionicons name="cash-outline" size={11} color="#16A34A" />
                      <Text style={s.commissionTxt}>
                        Commission {o.commissionRate}% — vous gagnez {((o.grandTotal ?? 0) * o.commissionRate / 100).toFixed(2)} EC
                      </Text>
                    </View>
                  )}
                  {o.user && <Text style={[s.orderClient, { color: C.muted }]}>Client : {o.user.username}</Text>}
                  {o.shippingAddress && <Text style={[s.orderAddr, { color: C.muted }]} numberOfLines={1}>📍 {o.shippingAddress}</Text>}
                  {o.clientPhone && (
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${o.clientPhone}`)}>
                      <Text style={[s.orderPhone, { color: "#22C55E" }]}>📞 {o.clientPhone}</Text>
                    </TouchableOpacity>
                  )}
                  <View style={s.itemsList}>
                    {(o.items ?? []).slice(0, 2).map((it: any, i: number) => (
                      <Text key={i} style={[s.itemTxt, { color: C.muted }]}>• {it.product?.name} × {it.qty}</Text>
                    ))}
                    {(o.items ?? []).length > 2 && <Text style={[s.itemTxt, { color: C.muted }]}>+{o.items.length - 2} autre(s)</Text>}
                  </View>
                  <TouchableOpacity
                    style={[s.acceptBtn, { opacity: accepting ? 0.7 : 1 }]}
                    onPress={() => handleAccept(o.orderNumber)}
                    disabled={accepting}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={["#16A34A", "#22C55E"]} style={s.acceptGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={s.acceptTxt}>Accepter la livraison</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Mes livraisons en cours */}
        {tab === "mine" && (
          <>
            {myDeliveries.length === 0 ? (
              <View style={[s.empty, { backgroundColor: t.card, borderColor: t.border }]}>
                <Ionicons name="bag-check-outline" size={40} color={C.muted} />
                <Text style={[s.emptyTxt, { color: C.muted }]}>Aucune livraison en cours</Text>
              </View>
            ) : myDeliveries.map((o: any) => {
              const statusMeta = ORDER_STATUS[o.status] ?? ORDER_STATUS.pending;
              return (
                <View key={o.orderNumber} style={[s.orderCard, { backgroundColor: t.card, borderColor: t.border }]}>
                  <View style={[s.orderStripe, { backgroundColor: statusMeta.color }]} />
                  <View style={{ flex: 1, padding: 12 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={[s.orderNum, { color: t.text }]}>{o.orderNumber}</Text>
                      <Text style={[s.orderTotal, { color: C.primary }]}>{o.grandTotal?.toFixed(2)} EC</Text>
                    </View>
                    {/* Statut de préparation */}
                    <View style={[s.statusBadge, { backgroundColor: statusMeta.bg }]}>
                      <View style={[s.statusDot, { backgroundColor: statusMeta.color }]} />
                      <Text style={[s.statusBadgeTxt, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                    </View>
                    {o.user && (
                      <TouchableOpacity onPress={() => o.user.telephone && Linking.openURL(`tel:${o.user.telephone}`)}>
                        <Text style={[s.orderClient, { color: C.muted }]}>Client : {o.user.username}
                          {o.user.telephone ? `  📞 ${o.user.telephone}` : ""}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {o.clientPhone && (
                      <TouchableOpacity onPress={() => Linking.openURL(`tel:${o.clientPhone}`)}>
                        <Text style={[s.orderPhone, { color: "#22C55E" }]}>📞 {o.clientPhone}</Text>
                      </TouchableOpacity>
                    )}
                    {o.shippingAddress && <Text style={[s.orderAddr, { color: C.muted }]} numberOfLines={2}>📍 {o.shippingAddress}</Text>}
                    <TouchableOpacity style={s.cancelBtn} onPress={() => handleCancel(o.orderNumber)} activeOpacity={0.85}>
                      <Ionicons name="close-circle-outline" size={14} color={C.red} style={{ marginRight: 4 }} />
                      <Text style={[s.cancelTxt, { color: C.red }]}>Annuler ma livraison</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Gains & commissions */}
        {tab === "earnings" && (
          <>
            {!earningsData ? (
              <View style={[s.empty, { backgroundColor: t.card, borderColor: t.border }]}>
                <Ionicons name="cash-outline" size={40} color={C.muted} />
                <Text style={[s.emptyTxt, { color: C.muted }]}>Aucune donnée disponible</Text>
              </View>
            ) : (
              <>
                {/* Résumé par période */}
                <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
                  <Text style={[s.earningsTitle, { color: t.text }]}>Mes revenus (commissions)</Text>
                  {[
                    ["Aujourd'hui",  earningsData.periods?.day],
                    ["Cette semaine", earningsData.periods?.week],
                    ["Ce mois",      earningsData.periods?.month],
                    ["Ce trimestre", earningsData.periods?.quarter],
                    ["Ce semestre",  earningsData.periods?.semester],
                    ["Cette année",  earningsData.periods?.year],
                  ].map(([label, val]) => (
                    <View key={label as string} style={s.earningsRow}>
                      <Text style={[s.earningsLabel, { color: C.muted }]}>{label as string}</Text>
                      <Text style={[s.earningsVal, { color: "#22C55E" }]}>{(val as number)?.toFixed(2) ?? "0.00"} EC</Text>
                    </View>
                  ))}
                  <View style={[s.earningsRow, { borderTopWidth: 1, borderTopColor: t.border, marginTop: 8, paddingTop: 10 }]}>
                    <Text style={[s.earningsLabel, { color: t.text, fontFamily: "NexaBold" }]}>Livraisons totales</Text>
                    <Text style={[s.earningsVal, { color: C.primary }]}>{earningsData.totalDeliveries ?? 0}</Text>
                  </View>
                </View>

                {/* Historique récent */}
                {(earningsData.recent ?? []).length > 0 && (
                  <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
                    <Text style={[s.earningsTitle, { color: t.text }]}>Dernières commissions</Text>
                    {(earningsData.recent ?? []).map((r: any, i: number) => (
                      <View key={i} style={[s.recentRow, i < earningsData.recent.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.recentOrder, { color: t.text }]}>{r.orderNumber}</Text>
                          <Text style={[s.recentCompany, { color: C.muted }]}>{r.company} · {r.rate}%</Text>
                        </View>
                        <Text style={[s.recentAmt, { color: "#22C55E" }]}>+{r.commission?.toFixed(2)} EC</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* ═══ ONGLET AVIS ═══ */}
        {tab === "avis" && (
          <>
            {/* Filtre période */}
            <View style={s.periodRow}>
              {([
                [undefined,   "Tout"],
                ["day",       "Jour"],
                ["week",      "Semaine"],
                ["month",     "Mois"],
                ["quarter",   "Trimestre"],
                ["semester",  "Semestre"],
                ["year",      "Année"],
              ] as const).map(([p, label]) => (
                <TouchableOpacity
                  key={label}
                  style={[s.periodBtn, ratingPeriod === p && { backgroundColor: C.primary, borderColor: C.primary }]}
                  onPress={() => { setRatingPeriod(p as any); refetchRatings(); }}
                  activeOpacity={0.8}
                >
                  <Text style={[s.periodTxt, { color: ratingPeriod === p ? C.white : C.muted }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Card résumé */}
            {ratingsData && (
              <View style={[s.card, { backgroundColor: t.card, borderColor: t.border, alignItems: "center" }]}>
                {/* Moyenne + classification */}
                <Text style={{ fontSize: 48, fontFamily: "NexaBold", color: ratingsData.classColor ?? C.primary }}>
                  {ratingsData.avg?.toFixed(1) ?? "—"}
                </Text>
                <View style={{ flexDirection: "row", gap: 4, marginVertical: 6 }}>
                  {[1,2,3,4,5].map(star => (
                    <Text key={star} style={{ fontSize: 22, color: star <= Math.round(ratingsData.avg ?? 0) ? "#FFD700" : (isDark ? "#374151" : "#D1D5DB") }}>★</Text>
                  ))}
                </View>
                <View style={[s.classBadge, { backgroundColor: (ratingsData.classColor ?? "#6B7280") + "22", borderColor: ratingsData.classColor ?? "#6B7280" }]}>
                  <Text style={[s.classTxt, { color: ratingsData.classColor ?? "#6B7280" }]}>{ratingsData.classification}</Text>
                </View>
                <Text style={[s.ratingCount, { color: C.muted }]}>{ratingsData.count} avis sur cette période</Text>

                {/* Distribution */}
                {ratingsData.count > 0 && (
                  <View style={s.distrib}>
                    {[...ratingsData.distribution].reverse().map(({ star, count: cnt }: any) => (
                      <View key={star} style={s.distribRow}>
                        <Text style={[s.distribStar, { color: "#FFD700" }]}>{star}★</Text>
                        <View style={[s.distribBar, { backgroundColor: isDark ? "#1F2937" : "#E5E7EB" }]}>
                          <View style={[s.distribFill, {
                            backgroundColor: star >= 4 ? "#22C55E" : star === 3 ? "#F97316" : "#EF4444",
                            width: `${ratingsData.count > 0 ? (cnt / ratingsData.count) * 100 : 0}%` as any,
                          }]} />
                        </View>
                        <Text style={[s.distribCount, { color: C.muted }]}>{cnt}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Liste des avis */}
            {(ratingsData?.ratings ?? []).length === 0 ? (
              <View style={[s.empty, { backgroundColor: t.card, borderColor: t.border }]}>
                <Ionicons name="star-outline" size={40} color={C.muted} />
                <Text style={[s.emptyTxt, { color: C.muted }]}>Aucun avis sur cette période</Text>
              </View>
            ) : (
              <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
                <Text style={[s.earningsTitle, { color: t.text }]}>Détail des avis</Text>
                {(ratingsData?.ratings ?? []).map((r: any, i: number) => (
                  <View key={r.ratingId} style={[s.reviewRow, i > 0 && { borderTopWidth: 1, borderTopColor: t.border }]}>
                    <View style={s.reviewTop}>
                      <View style={{ flexDirection: "row", gap: 2 }}>
                        {[1,2,3,4,5].map(star => (
                          <Text key={star} style={{ fontSize: 13, color: star <= r.score ? "#FFD700" : (isDark ? "#374151" : "#D1D5DB") }}>★</Text>
                        ))}
                      </View>
                      <Text style={[s.reviewDate, { color: C.muted }]}>{new Date(r.createdAt).toLocaleDateString("fr-FR")}</Text>
                    </View>
                    <Text style={[s.reviewUser, { color: t.text }]}>{r.rater}</Text>
                    {r.comment ? (
                      <Text style={[s.reviewComment, { color: C.muted }]}>"{r.comment}"</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={[s.card, s.linkCard, { backgroundColor: t.card, borderColor: t.border, marginTop: 8 }]}
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.8}
        >
          <Ionicons name="home-outline" size={20} color={C.primary} />
          <Text style={[s.linkText, { color: t.text }]}>Retour à l'application</Text>
          <Ionicons name="chevron-forward" size={16} color={C.muted} />
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── SOS Button (flottant) ── */}
      <Animated.View style={[s.sosFloat, { transform: [{ scale: sosPulse }] }]}>
        <TouchableOpacity
          style={s.sosBtn}
          onPress={() => setShowSOSModal(true)}
          disabled={sendingSOS}
          activeOpacity={0.85}
        >
          <Text style={s.sosBtnTxt}>🆘 SOS</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Modal SOS ── */}
      <Modal
        visible={showSOSModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSOSModal(false)}
      >
        <View style={s.sosOverlay}>
          <View style={[s.sosSheet, { backgroundColor: t.card }]}>
            <View style={s.sosHandleWrap}>
              <View style={[s.sosHandle, { backgroundColor: t.border }]} />
            </View>
            <Text style={[s.sosSheetTitle, { color: t.text }]}>Envoyer une alerte SOS</Text>
            <Text style={[s.sosSheetSub, { color: C.muted }]}>
              Votre position GPS sera transmise immédiatement aux équipes BIM NEXT.
            </Text>

            {/* Option Suspect */}
            <TouchableOpacity style={[s.sosOption, { borderColor: "#F97316" }]} onPress={() => { setShowSOSModal(false); confirmSOS("suspect"); }} activeOpacity={0.85}>
              <View style={[s.sosOptionIcon, { backgroundColor: "#FFF7ED" }]}>
                <Text style={{ fontSize: 22 }}>🟠</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.sosOptionTitle, { color: "#F97316" }]}>Suspect</Text>
                <Text style={[s.sosOptionDesc, { color: C.muted }]}>Je vois quelque chose ou quelqu'un de suspect autour de moi</Text>
              </View>
            </TouchableOpacity>

            {/* Option Urgence */}
            <TouchableOpacity style={[s.sosOption, { borderColor: "#EF4444" }]} onPress={() => { setShowSOSModal(false); confirmSOS("urgence"); }} activeOpacity={0.85}>
              <View style={[s.sosOptionIcon, { backgroundColor: "#FEF2F2" }]}>
                <Text style={{ fontSize: 22 }}>🔴</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.sosOptionTitle, { color: "#EF4444" }]}>Urgence</Text>
                <Text style={[s.sosOptionDesc, { color: C.muted }]}>J'ai un problème sérieux — accident, vol, agression légère</Text>
              </View>
            </TouchableOpacity>

            {/* Option Au secours */}
            <TouchableOpacity style={[s.sosOption, { borderColor: "#7C0000" }]} onPress={() => { setShowSOSModal(false); confirmSOS("secours"); }} activeOpacity={0.85}>
              <View style={[s.sosOptionIcon, { backgroundColor: "#FFF0F0" }]}>
                <Text style={{ fontSize: 22 }}>🆘</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.sosOptionTitle, { color: "#7C0000" }]}>Au secours</Text>
                <Text style={[s.sosOptionDesc, { color: C.muted }]}>Situation grave — danger immédiat, besoin d'aide d'urgence</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={s.sosCancelBtn} onPress={() => setShowSOSModal(false)}>
              <Text style={[s.sosCancelTxt, { color: C.muted }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const C_red = "#EF4444";
const s = StyleSheet.create({
  root: { flex: 1 },
  header: { overflow: "hidden", borderBottomLeftRadius: 32, borderBottomRightRadius: 32, elevation: 12, shadowColor: "#0353CC", shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  deco1: { position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.06)", top: -40, right: -30 },
  deco2: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.04)", bottom: -10, left: 20 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  bikeWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  logoutBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontFamily: "NexaBold", fontSize: 18, color: C.white, textAlign: "center" },
  headerBody: { alignItems: "center", paddingBottom: 20, paddingTop: 4 },
  userName: { fontFamily: "NexaBold", fontSize: 22, color: C.white },
  companyName: { fontFamily: "NexaLight", fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 6 },
  ratingTxt: { fontFamily: "NexaLight", fontSize: 12, color: "rgba(255,255,255,0.75)", marginLeft: 4 },
  body: { padding: 14, gap: 10 },
  gpsWarn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#DC0302", borderRadius: 14, padding: 14 },
  gpsWarnTxt: { fontFamily: "NexaBold", fontSize: 13, color: "#fff", flex: 1 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14 },
  onlineDot: { width: 14, height: 14, borderRadius: 7 },
  onlineTitle: { fontFamily: "NexaBold", fontSize: 14 },
  onlineSub: { fontFamily: "NexaLight", fontSize: 12, marginTop: 2 },
  tabRow: { flexDirection: "row", borderRadius: 14, borderWidth: 1, overflow: "hidden", padding: 4, gap: 4 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10, gap: 6 },
  tabTxt: { fontFamily: "NexaBold", fontSize: 13 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeTxt: { fontFamily: "NexaBold", fontSize: 10, color: "#fff" },
  empty: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: "center", gap: 8 },
  emptyTxt: { fontFamily: "NexaBold", fontSize: 14 },
  emptySub: { fontFamily: "NexaLight", fontSize: 12, textAlign: "center" },
  orderCard: { flexDirection: "row", borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  orderStripe: { width: 5 },
  orderNum: { fontFamily: "NexaBold", fontSize: 12 },
  orderTotal: { fontFamily: "NexaBold", fontSize: 14 },
  orderClient: { fontFamily: "NexaLight", fontSize: 12, marginTop: 4 },
  orderAddr: { fontFamily: "NexaLight", fontSize: 11, marginTop: 3 },
  orderPhone: { fontFamily: "NexaBold", fontSize: 12, marginTop: 4 },
  itemsList: { marginTop: 6, gap: 2 },
  itemTxt: { fontFamily: "NexaLight", fontSize: 11 },
  acceptBtn: { marginTop: 10, borderRadius: 10, overflow: "hidden" },
  acceptGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  acceptTxt: { fontFamily: "NexaBold", fontSize: 13, color: "#fff" },
  cancelBtn: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  cancelTxt: { fontFamily: "NexaBold", fontSize: 12 },
  statusBadge:   { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginTop: 6, gap: 5 },
  statusDot:     { width: 7, height: 7, borderRadius: 3.5 },
  statusBadgeTxt:{ fontFamily: "NexaBold", fontSize: 11 },
  commissionBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F0FDF4", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginTop: 5 },
  commissionTxt: { fontFamily: "NexaBold", fontSize: 11, color: "#16A34A" },
  earningsTitle: { fontFamily: "NexaBold", fontSize: 14, marginBottom: 12 },
  earningsRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  earningsLabel: { fontFamily: "NexaLight", fontSize: 13 },
  earningsVal:   { fontFamily: "NexaBold", fontSize: 14 },
  recentRow:     { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  recentOrder:   { fontFamily: "NexaBold", fontSize: 12 },
  recentCompany: { fontFamily: "NexaLight", fontSize: 11, marginTop: 2 },
  recentAmt:     { fontFamily: "NexaBold", fontSize: 14, minWidth: 70, textAlign: "right" },

  // Avis & évaluations
  periodRow:     { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  periodBtn:     { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "rgba(3,83,204,0.25)" },
  periodTxt:     { fontFamily: "NexaLight", fontSize: 11, fontWeight: "700" },
  classBadge:    { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 4, marginTop: 4 },
  classTxt:      { fontFamily: "NexaBold", fontSize: 13 },
  ratingCount:   { fontFamily: "NexaLight", fontSize: 11, marginTop: 6, marginBottom: 10 },
  distrib:       { width: "100%", gap: 6, marginTop: 6 },
  distribRow:    { flexDirection: "row", alignItems: "center", gap: 8 },
  distribStar:   { fontFamily: "NexaBold", fontSize: 12, width: 22 },
  distribBar:    { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  distribFill:   { height: "100%", borderRadius: 4 },
  distribCount:  { fontFamily: "NexaLight", fontSize: 11, width: 20, textAlign: "right" },
  reviewRow:     { paddingVertical: 12 },
  reviewTop:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  reviewDate:    { fontFamily: "NexaLight", fontSize: 11 },
  reviewUser:    { fontFamily: "NexaBold", fontSize: 12, marginBottom: 3 },
  reviewComment: { fontFamily: "NexaLight", fontSize: 12, fontStyle: "italic", lineHeight: 17 },

  // SOS flottant
  sosFloat:      { position: "absolute", bottom: 28, right: 20 },
  sosBtn:        { width: 70, height: 70, borderRadius: 35, backgroundColor: "#DC2626", alignItems: "center", justifyContent: "center", elevation: 12, shadowColor: "#DC2626", shadowOpacity: 0.6, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
  sosBtnTxt:     { fontFamily: "NexaBold", fontSize: 11, color: "#fff", textAlign: "center" },

  // SOS Modal
  sosOverlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sosSheet:      { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 36 },
  sosHandleWrap: { alignItems: "center", paddingVertical: 12 },
  sosHandle:     { width: 40, height: 4, borderRadius: 2 },
  sosSheetTitle: { fontFamily: "NexaBold", fontSize: 18, textAlign: "center", marginBottom: 6 },
  sosSheetSub:   { fontFamily: "NexaLight", fontSize: 12, textAlign: "center", marginBottom: 20, lineHeight: 18 },
  sosOption:     { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1.5, borderRadius: 16, padding: 14, marginBottom: 12 },
  sosOptionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  sosOptionTitle:{ fontFamily: "NexaBold", fontSize: 15, marginBottom: 2 },
  sosOptionDesc: { fontFamily: "NexaLight", fontSize: 12, lineHeight: 16 },
  sosCancelBtn:  { marginTop: 4, alignItems: "center", paddingVertical: 14 },
  sosCancelTxt:  { fontFamily: "NexaBold", fontSize: 14 },
  linkCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  linkText: { flex: 1, fontFamily: "NexaBold", fontSize: 14 },
});
