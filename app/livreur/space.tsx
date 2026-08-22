/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { useAppTheme } from "@/app/_layout";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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

/* ─── PALETTE ─────────────────────────────────────────────────────────── */
const LIGHT = {
  primary:   "#0035C5",
  blue:      "#0047FF",
  bg:        "#F7F8FC",
  card:      "#FFFFFF",
  surface:   "#F3F5FC",
  text:      "#1A1C1C",
  textSec:   "#434657",
  textMut:   "#747688",
  border:    "rgba(196,197,218,0.35)",
  green:     "#10B981",
  greenDark: "#059669",
  amber:     "#F59E0B",
  red:       "#EF4444",
  white:     "#FFFFFF",
  onlineGreen:  "#22C55E",
  commBg:    "#F0FDF4",
  commText:  "#16A34A",
  statusBg:  (col: string) => col + "18",
  headerFrom: "#302E99",
  headerTo:   "#0353CC",
};
const DARK: typeof LIGHT = {
  primary:   "#4D8DFF",
  blue:      "#4D8DFF",
  bg:        "#0B1220",
  card:      "#1A2540",
  surface:   "#0F1A2E",
  text:      "#EAF0FF",
  textSec:   "#A3B4D0",
  textMut:   "#6B7A99",
  border:    "rgba(31,42,68,0.80)",
  green:     "#10B981",
  greenDark: "#059669",
  amber:     "#D97706",
  red:       "#DC2626",
  white:     "#FFFFFF",
  onlineGreen:  "#22C55E",
  commBg:    "rgba(16,185,129,0.12)",
  commText:  "#4ADE80",
  statusBg:  (col: string) => col + "20",
  headerFrom: "#1A1860",
  headerTo:   "#0353CC",
};

/* ─── CUSTOM CROSS-PLATFORM TOGGLE ──────────────────────────────────── */
// Le Switch natif de React Native a des problèmes sur Android (disabled, thumb color…)
// Ce composant est 100% Animated, même comportement iOS & Android.
function OnlineSwitch({
  value, onPress, disabled,
}: { value: boolean; onPress: () => void; disabled: boolean }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      bounciness: 5,
      speed: 18,
    }).start();
  }, [value]);

  const trackBg = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: ["rgba(196,197,218,0.45)", "#22C55E"],
  });
  const thumbLeft = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [3, 29],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={{ opacity: disabled ? 0.45 : 1 }}
    >
      <Animated.View style={{
        width: 58, height: 32, borderRadius: 16,
        backgroundColor: trackBg,
        justifyContent: "center",
      }}>
        <Animated.View style={{
          position:  "absolute",
          width:     26, height: 26, borderRadius: 13,
          backgroundColor: "#FFFFFF",
          left: thumbLeft,
          elevation: 3,
          shadowColor: "#000", shadowOpacity: 0.22,
          shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
        }} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pending:    { label: "En attente",     color: "#F97316" },
  confirmed:  { label: "Confirmée",      color: "#0353CC" },
  processing: { label: "En préparation", color: "#8B5CF6" },
  shipped:    { label: "En livraison",   color: "#4D96FF" },
};

const STAR = "★";

export default function LivreurSpaceScreen() {
  const router     = useRouter();
  const { isDark } = useAppTheme();
  const C          = isDark ? DARK : LIGHT;
  const insets     = useSafeAreaInsets();
  const s          = useMemo(() => mkS(C), [isDark]);

  const { data: livreur, refetch: refetchProfile } = useGetMyLivreurProfileQuery(undefined);
  const { data: availableData, refetch: refetchAvailable, isFetching: loadingAvailable } = useGetAvailableOrdersQuery(undefined);
  const { data: myDelivData,   refetch: refetchMine }     = useGetMyDeliveriesQuery(undefined);
  const { data: earningsData,  refetch: refetchEarnings }  = useGetMyEarningsQuery(undefined);

  const [toggleOnline, { isLoading: togglingOnline }] = useToggleLivreurOnlineMutation();
  const [updateLocation]                              = useUpdateLivreurLocationMutation();
  const [acceptOrder,  { isLoading: accepting }]      = useAcceptOrderMutation();
  const [cancelDelivery]                              = useCancelDeliveryMutation();
  const [sendSOS,      { isLoading: sendingSOS }]     = useSendSOSMutation();

  const [gpsGranted,  setGpsGranted]  = useState(false);
  const [gpsChecked,  setGpsChecked]  = useState(false);
  const [livreurInfo, setLivreurInfo] = useState<any>(null);
  const [tab, setTab]                 = useState<"available" | "mine" | "earnings" | "avis">("available");
  const [ratingPeriod, setRatingPeriod] = useState<string | undefined>(undefined);

  const { data: ratingsData, refetch: refetchRatings } = useGetMyRatingsQuery(ratingPeriod);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const sosPulse        = useRef(new Animated.Value(1)).current;
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const availableOrders: any[] = availableData?.data ?? [];
  const myDeliveries:    any[] = myDelivData?.data   ?? [];

  /* ── Auth check ── */
  useEffect(() => {
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    AsyncStorage.multiGet(["livreurUser", "livreurToken", "livreurLastActivity"]).then(
      ([[, rawUser], [, token], [, lastActivity]]) => {
        if (!rawUser || !token) { router.replace("/livreur/login"); return; }
        const now      = Date.now();
        const inactive = lastActivity && (now - Number(lastActivity)) > SEVEN_DAYS;
        if (inactive) {
          AsyncStorage.multiRemove(["livreurToken", "livreurId", "livreurUser", "livreurLastActivity"]);
          router.replace("/livreur/login");
          return;
        }
        AsyncStorage.setItem("livreurLastActivity", String(now));
        setLivreurInfo(JSON.parse(rawUser));
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
    );
    requestGps();
    return () => { if (locationInterval.current) clearInterval(locationInterval.current); };
  }, []);

  /* ── Socket listeners ── */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const newOrderHandler = () => { refetchAvailable(); };
    const statusHandler   = () => { refetchMine(); };
    if (livreur?.companyId) socket.on(`company:new_order:${livreur.companyId}`, newOrderHandler);
    socket.on("order:status_updated", statusHandler);
    return () => {
      if (livreur?.companyId) socket.off(`company:new_order:${livreur.companyId}`, newOrderHandler);
      socket.off("order:status_updated", statusHandler);
    };
  }, [livreur?.companyId]);

  /* ── GPS broadcast ── */
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
        { text: "Plus tard",  style: "cancel" },
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
      refetchAvailable(); refetchMine();
    }
  }

  async function handleCancel(orderNumber: string) {
    Alert.alert("Annuler la livraison ?", "La commande redeviendra disponible pour d'autres livreurs.", [
      { text: "Non", style: "cancel" },
      { text: "Oui, annuler", style: "destructive", onPress: async () => {
          await cancelDelivery(orderNumber);
          refetchAvailable(); refetchMine();
        },
      },
    ]);
  }

  async function handleLogout() {
    Alert.alert("Déconnexion", "Quitter l'espace livreur ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Quitter", style: "destructive", onPress: async () => {
          if (locationInterval.current) clearInterval(locationInterval.current);
          await AsyncStorage.multiRemove(["livreurToken", "livreurId", "livreurUser"]);
          router.replace("/login");
        },
      },
    ]);
  }

  /* ── SOS pulse ── */
  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(sosPulse, { toValue: 1.08, duration: 700, useNativeDriver: true }),
      Animated.timing(sosPulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, []);

  async function handleSendSOS(type: "suspect" | "urgence" | "secours") {
    setShowSOSModal(false);
    let latitude: number | null = null; let longitude: number | null = null;
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      latitude = loc.coords.latitude; longitude = loc.coords.longitude;
    } catch {}
    try {
      await sendSOS({ type, latitude, longitude }).unwrap();
      Alert.alert("🆘 Alerte envoyée", "Les équipes BIM NEXT ont été notifiées. Restez en sécurité.", [{ text: "OK" }]);
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

  /* ─── TAB DATA ─── */
  const tabs = [
    { key: "available", label: "Dispo",    count: availableOrders.length },
    { key: "mine",      label: "En cours", count: myDeliveries.length },
    { key: "earnings",  label: "Gains",    count: 0 },
    { key: "avis",      label: "Avis",     count: 0 },
  ] as const;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.headerFrom} />

      {/* ── HEADER ── */}
      <View style={s.header}>
        <LinearGradient colors={[C.headerFrom, C.headerTo]} style={StyleSheet.absoluteFill} />
        <View style={s.deco1} />
        <View style={s.deco2} />
        <SafeAreaView edges={["top"]}>
          <View style={s.topBar}>
            <View style={s.bikeWrap}>
              <Ionicons name="bicycle" size={22} color={C.white} />
            </View>
            <Text style={s.headerTitle}>Espace Livreur</Text>
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={20} color={C.white} />
            </TouchableOpacity>
          </View>

          {/* Profile info */}
          <View style={s.headerBody}>
            <View style={s.avatarCircle}>
              <Ionicons name="person" size={26} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={s.userName}>{livreurInfo?.username ?? "Livreur"}</Text>
            {company && <Text style={s.companyName}>{company.name}</Text>}
            <View style={s.ratingRow}>
              {[1,2,3,4,5].map(i => (
                <Text key={i} style={{ fontSize: 16, color: i <= Math.round(rating) ? "#FFD700" : "rgba(255,255,255,0.28)" }}>
                  {STAR}
                </Text>
              ))}
              <Text style={s.ratingTxt}>{rating.toFixed(1)} ({ratingCount} avis)</Text>
            </View>
          </View>

          {/* Online status pill */}
          <View style={s.statusPill}>
            <Animated.View style={[s.statusDotPill, {
              backgroundColor: isOnline ? "#22C55E" : "rgba(255,255,255,0.40)",
            }]} />
            <Text style={s.statusPillTxt}>
              {togglingOnline ? "Mise à jour…" : isOnline ? "En ligne — Commandes visibles" : "Hors ligne"}
            </Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loadingAvailable}
            onRefresh={() => { refetchAvailable(); refetchMine(); refetchEarnings(); }}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {/* GPS warning */}
        {gpsChecked && !gpsGranted && (
          <TouchableOpacity style={s.gpsWarn} onPress={requestGps} activeOpacity={0.85}>
            <Ionicons name="location-outline" size={20} color="#fff" />
            <Text style={s.gpsWarnTxt}>GPS non activé — Appuyez pour activer</Text>
          </TouchableOpacity>
        )}

        {/* Online toggle card */}
        <TouchableOpacity
          style={[s.toggleCard, isOnline && s.toggleCardOnline]}
          onPress={(!togglingOnline && gpsGranted) ? handleToggleOnline : undefined}
          activeOpacity={0.92}
        >
          {/* Fond coloré subtil quand online */}
          {isOnline && (
            <View style={s.toggleCardGlow} />
          )}
          <View style={s.toggleRow}>
            {/* Dot animé */}
            <View style={[s.onlineDotWrap, { backgroundColor: isOnline ? "rgba(34,197,94,0.15)" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)") }]}>
              <View style={[s.onlineDot, { backgroundColor: isOnline ? C.onlineGreen : C.textMut }]} />
            </View>
            {/* Texte */}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[s.onlineTitle, isOnline && { color: C.onlineGreen }]}>
                {togglingOnline ? "Mise à jour…" : isOnline ? "Vous êtes en ligne" : "Vous êtes hors ligne"}
              </Text>
              <Text style={s.onlineSub}>
                {isOnline
                  ? "Position partagée • Commandes visibles"
                  : gpsGranted ? "Appuyez pour recevoir des commandes" : "GPS requis — appuyez pour activer"}
              </Text>
            </View>
            {/* Switch custom */}
            <OnlineSwitch
              value={isOnline}
              onPress={handleToggleOnline}
              disabled={togglingOnline || !gpsGranted}
            />
          </View>
        </TouchableOpacity>

        {/* Tabs */}
        <View style={s.tabWrap}>
          {tabs.map(({ key, label, count }) => (
            <TouchableOpacity
              key={key}
              style={[s.tabBtn, tab === key && s.tabBtnActive]}
              onPress={() => setTab(key as any)}
              activeOpacity={0.8}
            >
              <Text style={[s.tabTxt, { color: tab === key ? C.white : C.textMut }]}>{label}</Text>
              {count > 0 && (
                <View style={[s.badge, { backgroundColor: tab === key ? "rgba(255,255,255,0.28)" : C.primary }]}>
                  <Text style={s.badgeTxt}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Commandes disponibles ── */}
        {tab === "available" && (
          <>
            {availableOrders.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="bicycle-outline" size={44} color={C.textMut} />
                <Text style={s.emptyTxt}>Aucune commande disponible</Text>
                <Text style={s.emptySub}>Passez en ligne et attendez une commande</Text>
              </View>
            ) : availableOrders.map((o: any) => (
              <View key={o.orderNumber} style={s.orderCard}>
                <View style={[s.orderStripe, { backgroundColor: "#F97316" }]} />
                <View style={s.orderBody}>
                  {/* Header row */}
                  <View style={s.orderHeadRow}>
                    <Text style={s.orderNum}>{o.orderNumber}</Text>
                    <Text style={s.orderTotal}>{o.grandTotal?.toFixed(2)} EC</Text>
                  </View>


                  {/* Client & address */}
                  {o.user && (
                    <View style={s.infoRow}>
                      <Ionicons name="person-outline" size={14} color={C.textMut} />
                      <Text style={s.infoTxt}>{o.user.username}</Text>
                    </View>
                  )}
                  {o.clientPhone && (
                    <TouchableOpacity style={s.infoRow} onPress={() => Linking.openURL(`tel:${o.clientPhone}`)}>
                      <Ionicons name="call-outline" size={14} color={C.green} />
                      <Text style={[s.infoTxt, { color: C.green, fontFamily: "NexaBold" }]}>{o.clientPhone}</Text>
                    </TouchableOpacity>
                  )}
                  {o.shippingAddress && (
                    <View style={s.infoRow}>
                      <Ionicons name="location-outline" size={14} color={C.textMut} />
                      <Text style={s.infoTxt} numberOfLines={2}>{o.shippingAddress}</Text>
                    </View>
                  )}

                  {/* Items */}
                  {(o.items ?? []).length > 0 && (
                    <View style={s.itemsList}>
                      {(o.items ?? []).slice(0, 2).map((it: any, i: number) => (
                        <Text key={i} style={s.itemTxt}>• {it.product?.name} × {it.qty}</Text>
                      ))}
                      {(o.items ?? []).length > 2 && (
                        <Text style={s.itemTxt}>+{o.items.length - 2} autre(s)</Text>
                      )}
                    </View>
                  )}

                  {/* Accept button */}
                  <TouchableOpacity
                    style={[s.acceptBtn, { opacity: accepting ? 0.7 : 1 }]}
                    onPress={() => handleAccept(o.orderNumber)}
                    disabled={accepting}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={[C.greenDark, C.onlineGreen]} style={s.acceptGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Ionicons name="checkmark-circle" size={18} color={C.white} />
                      <Text style={s.acceptTxt}>Accepter la livraison</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── Mes livraisons en cours ── */}
        {tab === "mine" && (
          <>
            {myDeliveries.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="bag-check-outline" size={44} color={C.textMut} />
                <Text style={s.emptyTxt}>Aucune livraison en cours</Text>
              </View>
            ) : myDeliveries.map((o: any) => {
              const statusMeta = ORDER_STATUS[o.status] ?? ORDER_STATUS.pending;
              return (
                <View key={o.orderNumber} style={s.orderCard}>
                  <View style={[s.orderStripe, { backgroundColor: statusMeta.color }]} />
                  <View style={s.orderBody}>
                    <View style={s.orderHeadRow}>
                      <Text style={s.orderNum}>{o.orderNumber}</Text>
                      <Text style={s.orderTotal}>{o.grandTotal?.toFixed(2)} EC</Text>
                    </View>

                    {/* Status badge */}
                    <View style={[s.statusBadge, { backgroundColor: C.statusBg(statusMeta.color) }]}>
                      <View style={[s.statusDot, { backgroundColor: statusMeta.color }]} />
                      <Text style={[s.statusBadgeTxt, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                    </View>

                    {o.user && (
                      <TouchableOpacity style={s.infoRow} onPress={() => o.user.telephone && Linking.openURL(`tel:${o.user.telephone}`)}>
                        <Ionicons name="person-outline" size={14} color={C.textMut} />
                        <Text style={s.infoTxt}>
                          {o.user.username}{o.user.telephone ? `   📞 ${o.user.telephone}` : ""}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {o.clientPhone && (
                      <TouchableOpacity style={s.infoRow} onPress={() => Linking.openURL(`tel:${o.clientPhone}`)}>
                        <Ionicons name="call-outline" size={14} color={C.green} />
                        <Text style={[s.infoTxt, { color: C.green, fontFamily: "NexaBold" }]}>{o.clientPhone}</Text>
                      </TouchableOpacity>
                    )}
                    {o.shippingAddress && (
                      <View style={s.infoRow}>
                        <Ionicons name="location-outline" size={14} color={C.textMut} />
                        <Text style={s.infoTxt} numberOfLines={2}>{o.shippingAddress}</Text>
                      </View>
                    )}

                    <TouchableOpacity style={s.cancelBtn} onPress={() => handleCancel(o.orderNumber)} activeOpacity={0.85}>
                      <Ionicons name="close-circle-outline" size={16} color={C.red} />
                      <Text style={[s.cancelTxt, { color: C.red }]}>Annuler ma livraison</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* ── Gains & commissions ── */}
        {tab === "earnings" && (
          <>
            {!earningsData ? (
              <View style={s.empty}>
                <Ionicons name="cash-outline" size={44} color={C.textMut} />
                <Text style={s.emptyTxt}>Aucune donnée disponible</Text>
              </View>
            ) : (
              <>
                <View style={s.card}>
                  <Text style={s.cardTitle}>Mes revenus (commissions)</Text>
                  {[
                    ["Aujourd'hui",    earningsData.periods?.day],
                    ["Cette semaine",  earningsData.periods?.week],
                    ["Ce mois",        earningsData.periods?.month],
                    ["Ce trimestre",   earningsData.periods?.quarter],
                    ["Ce semestre",    earningsData.periods?.semester],
                    ["Cette année",    earningsData.periods?.year],
                  ].map(([label, val]) => (
                    <View key={label as string} style={s.earningsRow}>
                      <Text style={s.earningsLabel}>{label as string}</Text>
                      <Text style={[s.earningsVal, { color: C.onlineGreen }]}>{(val as number)?.toFixed(2) ?? "0.00"} EC</Text>
                    </View>
                  ))}
                  <View style={[s.earningsRow, s.earningsTotalRow]}>
                    <Text style={[s.earningsLabel, { fontFamily: "NexaBold", color: C.text }]}>Livraisons totales</Text>
                    <Text style={[s.earningsVal, { color: C.primary }]}>{earningsData.totalDeliveries ?? 0}</Text>
                  </View>
                </View>

                {(earningsData.recent ?? []).length > 0 && (
                  <View style={s.card}>
                    <Text style={s.cardTitle}>Dernières commissions</Text>
                    {(earningsData.recent ?? []).map((r: any, i: number) => (
                      <View key={i} style={[s.recentRow, i < earningsData.recent.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.recentOrder}>{r.orderNumber}</Text>
                          <Text style={s.recentCompany}>{r.company} · {r.rate}%</Text>
                        </View>
                        <Text style={[s.recentAmt, { color: C.onlineGreen }]}>+{r.commission?.toFixed(2)} EC</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* ── Avis & évaluations ── */}
        {tab === "avis" && (
          <>
            {/* Period filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.periodScroll}>
              {([
                [undefined,  "Tout"],
                ["day",      "Aujourd'hui"],
                ["week",     "Semaine"],
                ["month",    "Mois"],
                ["quarter",  "Trimestre"],
                ["semester", "Semestre"],
                ["year",     "Année"],
              ] as const).map(([p, label]) => (
                <TouchableOpacity
                  key={label}
                  style={[s.periodBtn, ratingPeriod === p && { backgroundColor: C.primary, borderColor: C.primary }]}
                  onPress={() => { setRatingPeriod(p as any); refetchRatings(); }}
                  activeOpacity={0.8}
                >
                  <Text style={[s.periodTxt, { color: ratingPeriod === p ? C.white : C.textMut }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {ratingsData && (
              <View style={[s.card, { alignItems: "center" }]}>
                <Text style={[s.bigScore, { color: ratingsData.classColor ?? C.primary }]}>
                  {ratingsData.avg?.toFixed(1) ?? "—"}
                </Text>
                <View style={s.starsRow}>
                  {[1,2,3,4,5].map(star => (
                    <Text key={star} style={{ fontSize: 24, color: star <= Math.round(ratingsData.avg ?? 0) ? "#FFD700" : (isDark ? "#374151" : "#D1D5DB") }}>★</Text>
                  ))}
                </View>
                <View style={[s.classBadge, { backgroundColor: (ratingsData.classColor ?? "#6B7280") + "22", borderColor: ratingsData.classColor ?? "#6B7280" }]}>
                  <Text style={[s.classTxt, { color: ratingsData.classColor ?? "#6B7280" }]}>{ratingsData.classification}</Text>
                </View>
                <Text style={s.ratingCount}>{ratingsData.count} avis sur cette période</Text>

                {ratingsData.count > 0 && (
                  <View style={s.distrib}>
                    {[...ratingsData.distribution].reverse().map(({ star, count: cnt }: any) => (
                      <View key={star} style={s.distribRow}>
                        <Text style={s.distribStar}>{star}★</Text>
                        <View style={[s.distribBar, { backgroundColor: isDark ? "#1F2937" : "#E5E7EB" }]}>
                          <View style={[s.distribFill, {
                            backgroundColor: star >= 4 ? C.onlineGreen : star === 3 ? C.amber : C.red,
                            width: `${ratingsData.count > 0 ? (cnt / ratingsData.count) * 100 : 0}%` as any,
                          }]} />
                        </View>
                        <Text style={s.distribCount}>{cnt}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {(ratingsData?.ratings ?? []).length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="star-outline" size={44} color={C.textMut} />
                <Text style={s.emptyTxt}>Aucun avis sur cette période</Text>
              </View>
            ) : (
              <View style={s.card}>
                <Text style={s.cardTitle}>Détail des avis</Text>
                {(ratingsData?.ratings ?? []).map((r: any, i: number) => (
                  <View key={r.ratingId} style={[s.reviewRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
                    <View style={s.reviewTop}>
                      <View style={{ flexDirection: "row", gap: 2 }}>
                        {[1,2,3,4,5].map(star => (
                          <Text key={star} style={{ fontSize: 14, color: star <= r.score ? "#FFD700" : (isDark ? "#374151" : "#D1D5DB") }}>★</Text>
                        ))}
                      </View>
                      <Text style={s.reviewDate}>{new Date(r.createdAt).toLocaleDateString("fr-FR")}</Text>
                    </View>
                    <Text style={s.reviewUser}>{r.rater}</Text>
                    {r.comment ? <Text style={s.reviewComment}>"{r.comment}"</Text> : null}
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Back to app */}
        <TouchableOpacity style={s.homeCard} onPress={() => router.replace("/(tabs)")} activeOpacity={0.8}>
          <Ionicons name="home-outline" size={20} color={C.primary} />
          <Text style={s.homeCardText}>Retour à l'application</Text>
          <Ionicons name="chevron-forward" size={16} color={C.textMut} />
        </TouchableOpacity>
      </ScrollView>

      {/* SOS floating button */}
      <Animated.View style={[s.sosFloat, { bottom: insets.bottom + 24, transform: [{ scale: sosPulse }] }]}>
        <TouchableOpacity style={s.sosBtn} onPress={() => setShowSOSModal(true)} disabled={sendingSOS} activeOpacity={0.85}>
          <Ionicons name="warning-outline" size={20} color="#fff" />
          <Text style={s.sosBtnTxt}>SOS</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* SOS Modal */}
      <Modal visible={showSOSModal} transparent animationType="slide" onRequestClose={() => setShowSOSModal(false)}>
        <View style={s.sosOverlay}>
          <View style={[s.sosSheet, { backgroundColor: C.card }]}>
            <View style={s.sosHandleWrap}>
              <View style={[s.sosHandle, { backgroundColor: C.border }]} />
            </View>
            <Text style={[s.sosSheetTitle, { color: C.text }]}>Envoyer une alerte SOS</Text>
            <Text style={[s.sosSheetSub, { color: C.textMut }]}>
              Votre position GPS sera transmise immédiatement aux équipes BIM NEXT.
            </Text>

            <TouchableOpacity style={[s.sosOption, { borderColor: "#F97316" }]} onPress={() => { setShowSOSModal(false); confirmSOS("suspect"); }} activeOpacity={0.85}>
              <View style={[s.sosOptionIcon, { backgroundColor: "#FFF7ED" }]}>
                <Text style={{ fontSize: 24 }}>🟠</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.sosOptionTitle, { color: "#F97316" }]}>Comportement suspect</Text>
                <Text style={[s.sosOptionDesc, { color: C.textMut }]}>Je vois quelque chose ou quelqu'un de suspect autour de moi</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[s.sosOption, { borderColor: "#EF4444" }]} onPress={() => { setShowSOSModal(false); confirmSOS("urgence"); }} activeOpacity={0.85}>
              <View style={[s.sosOptionIcon, { backgroundColor: "#FEF2F2" }]}>
                <Text style={{ fontSize: 24 }}>🔴</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.sosOptionTitle, { color: "#EF4444" }]}>Urgence personnelle</Text>
                <Text style={[s.sosOptionDesc, { color: C.textMut }]}>Accident, vol, agression légère</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[s.sosOption, { borderColor: "#7C0000" }]} onPress={() => { setShowSOSModal(false); confirmSOS("secours"); }} activeOpacity={0.85}>
              <View style={[s.sosOptionIcon, { backgroundColor: "#FFF0F0" }]}>
                <Text style={{ fontSize: 24 }}>🆘</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.sosOptionTitle, { color: "#7C0000" }]}>Au secours</Text>
                <Text style={[s.sosOptionDesc, { color: C.textMut }]}>Situation grave — danger immédiat, besoin d'aide d'urgence</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={s.sosCancelBtn} onPress={() => setShowSOSModal(false)}>
              <Text style={[s.sosCancelTxt, { color: C.textMut }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ─── STYLES ──────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* Header */
  header: {
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  deco1: { position: "absolute", width: 170, height: 170, borderRadius: 85, backgroundColor: "rgba(255,255,255,0.06)", top: -50, right: -30 },
  deco2: { position: "absolute", width: 110, height: 110, borderRadius: 55, backgroundColor: "rgba(255,255,255,0.04)", bottom: -10, left: 20 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  bikeWrap:   { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" },
  logoutBtn:  { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" },
  headerTitle:{ flex: 1, fontFamily: "NexaBold", fontSize: 18, color: "#FFFFFF", textAlign: "center" },

  headerBody: { alignItems: "center", paddingBottom: 8, paddingTop: 2 },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.30)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 10,
  },
  userName:   { fontFamily: "NexaBold", fontSize: 22, color: "#FFFFFF" },
  companyName:{ fontFamily: "NexaLight", fontSize: 14, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  ratingRow:  { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 8 },
  ratingTxt:  { fontFamily: "NexaLight", fontSize: 13, color: "rgba(255,255,255,0.75)", marginLeft: 6 },

  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.20)",
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    marginBottom: 16, marginTop: 6,
  },
  statusDotPill: { width: 8, height: 8, borderRadius: 4 },
  statusPillTxt: { fontFamily: "NexaBold", fontSize: 13, color: "rgba(255,255,255,0.90)" },

  /* Body */
  body: { padding: 14, gap: 12 },

  /* GPS warning */
  gpsWarn:    { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#DC2626", borderRadius: 14, padding: 14 },
  gpsWarnTxt: { fontFamily: "NexaBold", fontSize: 14, color: "#fff", flex: 1, lineHeight: 19 },

  /* Card */
  card: {
    backgroundColor: C.card, borderRadius: 18,
    borderWidth: 1, borderColor: C.border,
    padding: 16,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: { fontFamily: "NexaBold", fontSize: 15, color: C.text, marginBottom: 14 },

  /* Toggle card */
  toggleCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1, borderColor: C.border,
    padding: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  toggleCardOnline: {
    borderColor: "rgba(34,197,94,0.35)",
  },
  toggleCardGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(34,197,94,0.05)",
  },
  toggleRow:    { flexDirection: "row", alignItems: "center" },
  onlineDotWrap:{ width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  onlineDot:    { width: 14, height: 14, borderRadius: 7 },
  onlineTitle:  { fontFamily: "NexaBold", fontSize: 15, color: C.text },
  onlineSub:    { fontFamily: "NexaLight", fontSize: 12, color: C.textMut, marginTop: 3, lineHeight: 17 },

  /* Tabs */
  tabWrap: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    padding: 4, gap: 4,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 11, borderRadius: 10, gap: 5 },
  tabBtnActive: { backgroundColor: C.primary },
  tabTxt:  { fontFamily: "NexaBold", fontSize: 12 },
  badge:   { minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeTxt:{ fontFamily: "NexaBold", fontSize: 10, color: "#fff" },

  /* Order cards */
  orderCard: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderRadius: 16, borderWidth: 1, borderColor: C.border,
    overflow: "hidden",
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  orderStripe: { width: 5 },
  orderBody:   { flex: 1, padding: 14, gap: 6 },
  orderHeadRow:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  orderNum:    { fontFamily: "NexaBold", fontSize: 14, color: C.text },
  orderTotal:  { fontFamily: "NexaBold", fontSize: 16, color: C.primary },

  /* Commission badge */
  commBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 2 },
  commTxt:   { fontFamily: "NexaBold", fontSize: 12, lineHeight: 16 },

  /* Info rows */
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 2 },
  infoTxt: { flex: 1, fontFamily: "NexaLight", fontSize: 13, color: C.textSec, lineHeight: 18 },

  /* Items list */
  itemsList: { marginTop: 4, gap: 3 },
  itemTxt:   { fontFamily: "NexaLight", fontSize: 12, color: C.textMut, lineHeight: 17 },

  /* Status badge */
  statusBadge:   { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, gap: 6, marginBottom: 4 },
  statusDot:     { width: 7, height: 7, borderRadius: 3.5 },
  statusBadgeTxt:{ fontFamily: "NexaBold", fontSize: 12 },

  /* Accept / Cancel buttons */
  acceptBtn:  { marginTop: 8, borderRadius: 12, overflow: "hidden" },
  acceptGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  acceptTxt:  { fontFamily: "NexaBold", fontSize: 14, color: "#fff" },
  cancelBtn:  { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, alignSelf: "flex-start", borderWidth: 1, borderColor: C.red + "40", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  cancelTxt:  { fontFamily: "NexaBold", fontSize: 13 },

  /* Empty state */
  empty:    { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 36, alignItems: "center", gap: 10 },
  emptyTxt: { fontFamily: "NexaBold", fontSize: 15, color: C.textMut },
  emptySub: { fontFamily: "NexaLight", fontSize: 13, color: C.textMut, textAlign: "center", lineHeight: 18 },

  /* Earnings */
  earningsRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  earningsTotalRow:{ borderBottomWidth: 0, marginTop: 4, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border },
  earningsLabel:   { fontFamily: "NexaLight", fontSize: 14, color: C.textSec },
  earningsVal:     { fontFamily: "NexaBold", fontSize: 15 },
  recentRow:       { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  recentOrder:     { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  recentCompany:   { fontFamily: "NexaLight", fontSize: 12, color: C.textMut, marginTop: 2 },
  recentAmt:       { fontFamily: "NexaBold", fontSize: 15, minWidth: 76, textAlign: "right" },

  /* Ratings */
  periodScroll: { paddingHorizontal: 0, paddingBottom: 4, gap: 8 },
  periodBtn:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: C.border },
  periodTxt:    { fontFamily: "NexaBold", fontSize: 12 },
  bigScore:     { fontSize: 52, fontFamily: "NexaBold", lineHeight: 60 },
  starsRow:     { flexDirection: "row", gap: 4, marginVertical: 6 },
  classBadge:   { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 5, marginTop: 4, marginBottom: 4 },
  classTxt:     { fontFamily: "NexaBold", fontSize: 13 },
  ratingCount:  { fontFamily: "NexaLight", fontSize: 13, color: C.textMut, marginBottom: 10 },
  distrib:      { width: "100%", gap: 7, marginTop: 8 },
  distribRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  distribStar:  { fontFamily: "NexaBold", fontSize: 13, width: 26, color: "#FFD700" },
  distribBar:   { flex: 1, height: 9, borderRadius: 5, overflow: "hidden" },
  distribFill:  { height: "100%", borderRadius: 5 },
  distribCount: { fontFamily: "NexaLight", fontSize: 12, width: 22, textAlign: "right", color: C.textMut },
  reviewRow:    { paddingVertical: 14 },
  reviewTop:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  reviewDate:   { fontFamily: "NexaLight", fontSize: 12, color: C.textMut },
  reviewUser:   { fontFamily: "NexaBold", fontSize: 14, color: C.text, marginBottom: 4 },
  reviewComment:{ fontFamily: "NexaLight", fontSize: 13, fontStyle: "italic", color: C.textSec, lineHeight: 18 },

  /* Home card */
  homeCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    padding: 16,
  },
  homeCardText: { flex: 1, fontFamily: "NexaBold", fontSize: 15, color: C.text },

  /* SOS */
  sosFloat: { position: "absolute", right: 20 },
  sosBtn:   {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: "#DC2626",
    alignItems: "center", justifyContent: "center",
    elevation: 10, shadowColor: "#DC2626", shadowOpacity: 0.55, shadowRadius: 14, shadowOffset: { width: 0, height: 4 },
  },
  sosBtnTxt: { fontFamily: "NexaBold", fontSize: 12, color: "#fff", marginTop: 2 },

  sosOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sosSheet:     { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 36 },
  sosHandleWrap:{ alignItems: "center", paddingVertical: 12 },
  sosHandle:    { width: 40, height: 4, borderRadius: 2 },
  sosSheetTitle:{ fontFamily: "NexaBold", fontSize: 20, textAlign: "center", marginBottom: 6 },
  sosSheetSub:  { fontFamily: "NexaLight", fontSize: 13, textAlign: "center", marginBottom: 20, lineHeight: 19, color: C.textMut },
  sosOption:    { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1.5, borderRadius: 16, padding: 14, marginBottom: 12 },
  sosOptionIcon:{ width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  sosOptionTitle:{ fontFamily: "NexaBold", fontSize: 15, marginBottom: 3 },
  sosOptionDesc: { fontFamily: "NexaLight", fontSize: 13, lineHeight: 17, color: C.textMut },
  sosCancelBtn: { marginTop: 4, alignItems: "center", paddingVertical: 14 },
  sosCancelTxt: { fontFamily: "NexaBold", fontSize: 15 },
}); }
