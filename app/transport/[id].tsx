/**
 * Taxi BIM NEXT (maquette) — Où allons-nous ? → Détail du véhicule → Course.
 * Le passager voit TOUS les chauffeurs disponibles (sa gamme d'abord, puis par
 * distance) et choisit lui-même ; l'offre lui est envoyée (15 s pour répondre),
 * sinon il en choisit un autre. Une course en cours est reprise à l'ouverture.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Easing, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { SvgXml } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL_BASE } from "@/constants/api";
import { BimIcon } from "@/components/bim/icons";
import { carConfort, carConfortCard, carEco, carEcoCard, taxiMapFor } from "@/components/bim/illustrations";
import { ec, useTh } from "@/components/bim/theme";
import {
  Appear, BLogo, BimBackground, Float, Glass, Glow, Header, Ink, PillButton, PressScale, Pulse, RoundButton,
  SectionLabel, SlideButton, StatusOverlay, T, TextField,
} from "@/components/bim/ui";
import {
  useCancelRideMutation, useEstimateRideMutation, useGetAvailableChauffeursQuery, useGetMyActiveRideQuery, useGetRideByNumberQuery,
  useGetTiersQuery, useOfferRideToChauffeurMutation, useRateRideMutation, useRequestRideMutation, useStartRideMutation,
} from "@/services/rideService";
import { getSocket } from "@/services/socketService";
import { useGetUserByIdQuery } from "@/services/userService";

type Tier = { tierKey: string; label: string; perKm: number; seats: number; etaMin?: number; description?: string };
const DESC: Record<string, string> = {
  eco: "Le trajet malin du quotidien : silencieux, climatisé, payé en EC.",
  confort: "Plus d'espace pour la famille et les bagages, même confort.",
  green: "Un trajet propre et silencieux, au meilleur prix.",
  van: "Spacieux, jusqu'à 6 personnes et leurs bagages.",
  moto: "Anti-bouchons et rapide pour aller à l'essentiel.",
};
const isBig = (k: string) => k === "confort" || k === "van";

/* Échantillonnage du trajet de la carte (chauffeur → toi). */
function routePoints() {
  const cubic = (p0: number[], p1: number[], p2: number[], p3: number[], t: number) => {
    const u = 1 - t;
    return [0, 1].map((i) => u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i]);
  };
  const pts: number[][] = [];
  for (let i = 0; i <= 12; i++) pts.push(cubic([320, 140], [300, 230], [290, 280], [190, 330], i / 12));
  for (let i = 1; i <= 12; i++) pts.push(cubic([190, 330], [90, 380], [120, 470], [60, 560], i / 12));
  return pts;
}
const PTS = routePoints();

export default function TaxiScreen() {
  const th = useTh();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();

  const [step, setStep] = useState<"list" | "detail" | "ride">("list");
  const [dest, setDest] = useState("");
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pickup, setPickup] = useState<{ lat: number; lng: number } | null>(null);
  const [suggest, setSuggest] = useState<{ placeId: string; description: string }[]>([]);
  const skipGeo = useRef(false);
  const [carIdx, setCarIdx] = useState(0);
  const [estimate, setEstimate] = useState<{ distanceKm: number; tiers: { tier: string; price: number }[] } | null>(null);
  const [rideNumber, setRideNumber] = useState<string | null>(null);
  const [stars, setStars] = useState(0);
  // Chauffeur à qui l'offre a été envoyée, secondes restantes, message après un refus.
  const [offeredTo, setOfferedTo] = useState<number | null>(null);
  const [offerLeft, setOfferLeft] = useState(0);
  const [offerNote, setOfferNote] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);
  const { data: me } = useGetUserByIdQuery(userId!, { skip: !userId });
  const firstName = me?.username && !String(me.username).startsWith("quick_") ? String(me.username).split(" ")[0] : "toi";

  const { data: tiersData } = useGetTiersQuery(undefined);
  const tiers: Tier[] = (tiersData?.data ?? []).map((t: any) => ({ tierKey: t.tierKey, label: t.label, perKm: Number(t.perKm ?? 0), seats: Number(t.seats ?? 4), etaMin: t.etaMin, description: t.description }));
  const car = tiers[carIdx] ?? tiers[0];

  const [estimateRide] = useEstimateRideMutation();
  const [requestRide, { isLoading: requesting }] = useRequestRideMutation();
  const [offerRide] = useOfferRideToChauffeurMutation();
  const [cancelRide] = useCancelRideMutation();
  const [rateRide] = useRateRideMutation();
  const [startRide, { isLoading: starting }] = useStartRideMutation();

  /* Reprise d'une course déjà en cours (retour depuis l'accueil, app relancée) */
  const { data: activeData } = useGetMyActiveRideQuery(undefined, { refetchOnMountOrArgChange: true });
  const resumed = useRef(false);
  useEffect(() => {
    const a = activeData?.data;
    if (resumed.current || !a?.rideNumber || rideNumber) return;
    resumed.current = true;
    const idx = tiers.findIndex((t) => t.tierKey === a.vehicleTier);
    if (idx >= 0) setCarIdx(idx);
    setRideNumber(a.rideNumber);
    setStep("ride");
  }, [activeData, tiers.length]);

  /* Position de départ */
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const p = await Location.getCurrentPositionAsync({});
        setPickup({ lat: p.coords.latitude, lng: p.coords.longitude });
      } catch {}
    })();
  }, []);

  /* Suggestions + géocodage de la destination */
  useEffect(() => {
    if (dest.trim().length < 3) { setSuggest([]); setDestCoords(null); return; }
    if (skipGeo.current) { skipGeo.current = false; return; }
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_URL_BASE}/transport/autocomplete`, { params: { input: dest.trim() } });
        setSuggest((res.data?.data || []).slice(0, 4));
      } catch { setSuggest([]); }
      try {
        const g = await axios.get(`${API_URL_BASE}/transport/geocode`, { params: { address: dest.trim() } });
        setDestCoords({ lat: g.data.data.lat, lng: g.data.data.lng });
      } catch { setDestCoords(null); }
    }, 500);
    return () => clearTimeout(t);
  }, [dest]);

  const pickSuggestion = async (s: { placeId: string; description: string }) => {
    skipGeo.current = true;
    setDest(s.description);
    setSuggest([]);
    try {
      const res = await axios.get(`${API_URL_BASE}/transport/place-details`, { params: { placeId: s.placeId } });
      setDestCoords({ lat: res.data.data.lat, lng: res.data.data.lng });
    } catch { setDestCoords(null); }
  };

  /* Estimation des prix */
  useEffect(() => {
    if (dest.trim().length < 3) { setEstimate(null); return; }
    const t = setTimeout(async () => {
      try {
        const res: any = await estimateRide({
          pickupAddress: "Ma position actuelle", destinationAddress: dest.trim(),
          pickupLat: pickup?.lat, pickupLng: pickup?.lng, destinationLat: destCoords?.lat, destinationLng: destCoords?.lng,
        }).unwrap();
        setEstimate(res.data);
      } catch { setEstimate(null); }
    }, 500);
    return () => clearTimeout(t);
  }, [dest, pickup, destCoords]);
  const priceOf = (k?: string) => estimate?.tiers.find((x) => x.tier === k)?.price;

  /* Course */
  const { data: rideData, refetch: refetchRide } = useGetRideByNumberQuery(rideNumber as any, { skip: !rideNumber, pollingInterval: 5000 });
  const ride = rideData?.data;
  const status: string = ride?.status ?? (rideNumber ? "searching" : "");
  const { data: chData, isFetching: chLoading, refetch: refetchCh } = useGetAvailableChauffeursQuery(rideNumber as any, { skip: !rideNumber || status !== "searching", pollingInterval: 8000 });
  const chauffeurs: any[] = chData?.data ?? [];
  // Offre en attente (aussi après une reprise : le serveur marque `pending`).
  const waitingId: number | null = offeredTo ?? chauffeurs.find((c) => c.pending)?.chauffeurId ?? null;
  const waitingCh = chauffeurs.find((c) => c.chauffeurId === waitingId);

  const choose = async (c: any) => {
    if (!rideNumber || waitingId) return;
    setOfferNote(null);
    setOfferedTo(c.chauffeurId);
    try {
      const r: any = await offerRide({ rideNumber, chauffeurId: c.chauffeurId }).unwrap();
      setOfferLeft(Number(r?.expiresInSec ?? 15));
    } catch (e: any) {
      setOfferedTo(null);
      Alert.alert("Chauffeur indisponible", e?.data?.message || "Ce chauffeur n'est plus disponible, choisis-en un autre.");
      refetchCh();
    }
  };

  // Compte à rebours de l'offre ; sans réponse, le serveur la libère (+ marge réseau).
  useEffect(() => {
    if (!offeredTo) return;
    if (offerLeft <= -3) {
      setOfferedTo(null);
      setOfferNote("Le chauffeur n'a pas répondu. Choisis-en un autre.");
      refetchCh();
      return;
    }
    const t = setTimeout(() => setOfferLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [offeredTo, offerLeft]);

  useEffect(() => {
    if (!rideNumber) return;
    const socket = getSocket();
    // Rejoint la « salle » de la course : sans ça, les changements d'état
    // (refus, acceptation…) n'arrivaient que par le rafraîchissement toutes les 5 s.
    socket?.emit("track_ride", rideNumber);
    const h = (p: any) => {
      if (p?.rideNumber && p.rideNumber !== rideNumber) return;
      if (p?.status === "searching") {
        setOfferedTo((prev) => {
          if (prev) setOfferNote(p?.reason ? `${p.reason}. Choisis un autre chauffeur.` : "Le chauffeur n'est pas disponible. Choisis-en un autre.");
          return null;
        });
        refetchCh();
      }
      refetchRide();
    };
    socket?.on("ride:status_updated", h);
    return () => { socket?.off("ride:status_updated", h); };
  }, [rideNumber]);
  useEffect(() => { if (status && status !== "searching") { setOfferedTo(null); setOfferNote(null); } }, [status]);

  const doStart = async () => {
    if (!rideNumber) return;
    try { await startRide(rideNumber).unwrap(); refetchRide(); }
    catch (e: any) { Alert.alert("Impossible de démarrer", e?.data?.message || "Réessaie dans un instant."); }
  };

  useEffect(() => {
    if (status === "cancelled" && rideNumber) {
      Alert.alert("Course annulée", ride?.cancelReason || "La course a été annulée.");
      setRideNumber(null); setStep("list");
    }
  }, [status]);

  const sendRequest = async () => {
    if (!car) return;
    try {
      const res: any = await requestRide({
        pickupAddress: "Ma position actuelle", destinationAddress: dest.trim(),
        pickupLat: pickup?.lat, pickupLng: pickup?.lng, destinationLat: destCoords?.lat, destinationLng: destCoords?.lng,
        vehicleTier: car.tierKey, paymentMethod: "wallet",
      }).unwrap();
      setOfferedTo(null); setOfferNote(null); setStars(0);
      setRideNumber(res.data.rideNumber);
      setStep("ride");
    } catch (e: any) {
      // Une course est déjà en route : on la rouvre au lieu d'en créer une autre.
      if (e?.status === 409 && e?.data?.rideNumber) {
        setRideNumber(e.data.rideNumber); setStep("ride");
        return;
      }
      Alert.alert("Commande impossible", e?.data?.message || "La demande de course a échoué, réessaie.");
    }
  };

  const order = async () => {
    if (!car) return;
    if (dest.trim().length < 3) { Alert.alert("Destination", "Indique où tu vas."); setStep("list"); return; }
    // Paiement en EC à l'arrivée : prévenir si le solde ne couvre pas l'estimation.
    const balance = Number(me?.soldNumber ?? 0);
    if (est != null && balance < est) {
      Alert.alert("Solde insuffisant", `Ton solde (${ec(balance)} EC) ne couvre pas l'estimation (≈ ${ec(est)} EC). Recharge ton compte, ou paie le chauffeur en espèces à l'arrivée.`, [
        { text: "Recharger", onPress: () => router.push("/recharge" as any) },
        { text: "Commander quand même", onPress: sendRequest },
      ]);
      return;
    }
    await sendRequest();
  };

  const cancel = () => {
    if (!rideNumber) { setStep("list"); return; }
    Alert.alert("Annuler la course", "Veux-tu vraiment annuler ?", [
      { text: "Non", style: "cancel" },
      { text: "Oui, annuler", style: "destructive", onPress: async () => {
        try { await cancelRide({ rideNumber, reason: "Annulée par le passager" }).unwrap(); } catch {}
        setRideNumber(null); setStep("list");
      } },
    ]);
  };

  const finishRating = async (n: number) => {
    setStars(n);
    if (rideNumber) { try { await rateRide({ rideNumber, stars: n }).unwrap(); } catch {} }
  };

  /* Animation du taxi sur la carte */
  const drive = useRef(new Animated.Value(0)).current;
  const found = ["accepted", "arriving", "in_progress"].includes(status);
  useEffect(() => {
    if (!found) { drive.setValue(0); return; }
    Animated.timing(drive, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true }).start();
  }, [found]);
  const inR = PTS.map((_, i) => i / (PTS.length - 1));
  const carX = drive.interpolate({ inputRange: inR, outputRange: PTS.map((p) => p[0] * W / 390 - 17) });
  const carY = drive.interpolate({ inputRange: inR, outputRange: PTS.map((p) => p[1] * H / 844 - 10) });

  const est = priceOf(car?.tierKey);
  const km = estimate?.distanceKm;
  const pad = { flexGrow: 1, paddingTop: 28 + insets.top, paddingHorizontal: 20, paddingBottom: 40 + insets.bottom };

  /* ═══ Liste ═══ */
  const renderList = () => (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={pad} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <RoundButton icon="back" label="Retour à l'accueil" onPress={() => router.back()} />
          <PressScale onPress={() => router.push("/transport/historique" as any)} accessibilityLabel="Mes courses" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <BimIcon name="pin" size={16} color={th.fg} />
            <T size={14}>Bunia</T>
          </PressScale>
          <BLogo />
        </View>
        <Appear kind="rise">
          <T style={{ marginTop: 22 }}>
            <T w="light" size={30} style={{ lineHeight: 34 }}>Où allons-nous,{"\n"}</T>
            <T w="bold" size={30} style={{ lineHeight: 34 }}>{firstName} ?</T>
          </T>
        </Appear>
        <View style={{ marginTop: 16 }}>
          <TextField id="tx-dest" label="Destination" hideLabel icon="search" radius={28} value={dest} onChange={setDest} placeholder="Où vas-tu ?" />
          {suggest.length > 0 && (
            <Glass a={0.16} b={0.22} radius={18} style={{ marginTop: 8, overflow: "hidden" }}>
              {suggest.map((s, i) => (
                <PressScale key={s.placeId} onPress={() => pickSuggestion(s)} accessibilityLabel={s.description}
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, minHeight: 48, borderTopWidth: i ? 1 : 0, borderTopColor: th.glass(0.12) }}>
                  <BimIcon name="pin" size={16} color={th.muted} />
                  <T size={14} numberOfLines={2} style={{ flex: 1 }}>{s.description}</T>
                </PressScale>
              ))}
            </Glass>
          )}
        </View>
        <View style={{ marginTop: 10, flexDirection: "row", gap: 8 }}>
          {[["Maison", "Maison"], ["Bureau", "Bureau"], ["Aéroport", "Aéroport de Bunia"]].map(([l, v]) => (
            <PressScale key={l} onPress={() => setDest(v)} accessibilityLabel={l}
              style={{ height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: th.glass(0.22), backgroundColor: th.glassFill(0.1), justifyContent: "center", boxShadow: th.glassFx }}>
              <T size={14}>{l}</T>
            </PressScale>
          ))}
        </View>

        <SectionLabel style={{ marginTop: 20 }}>NOS VÉHICULES</SectionLabel>
        <View style={{ marginTop: 10, gap: 10 }}>
          {tiers.length === 0 && [0, 1].map((n) => <Glass key={n} radius={28} style={{ height: 176, opacity: 0.6 }} />)}
          {tiers.map((t, i) => {
            const first = i === 0;
            const ink = first ? th.onAccent : th.fg;
            const p = priceOf(t.tierKey);
            return (
              <Appear key={t.tierKey} kind="page" delay={i * 80}>
                <PressScale onPress={() => { setCarIdx(i); setStep("detail"); }} accessibilityLabel={`${t.label}, ${ec(t.perKm)} EC par kilomètre`}
                  style={{ height: 176, borderRadius: 28, overflow: "hidden", backgroundColor: first ? th.accent : th.glassFill(0.14), borderWidth: 1, borderColor: th.glass(0.22), padding: 18, boxShadow: th.glassFx }}>
                  <T w="bold" size={22} color={ink}>{t.label}</T>
                  <T w="bold" size={18} color={ink} style={{ marginTop: 4 }}>{ec(t.perKm)} EC <T size={13} color={ink} style={{ opacity: 0.8 }}>/ km</T></T>
                  <T size={13} color={ink} style={{ marginTop: 4, opacity: 0.8 }}>{t.seats} places{p != null ? ` · ≈ ${ec(p)} EC` : ""}</T>
                  <View style={{ position: "absolute", left: 18, bottom: 16, height: 40, paddingHorizontal: 18, borderRadius: 20, justifyContent: "center", backgroundColor: first ? th.ink : th.accent }}>
                    <T w="bold" size={14} color={first ? th.onInk : th.onAccent}>Choisir</T>
                  </View>
                  <View pointerEvents="none" style={{ position: "absolute", right: -24, bottom: 6 }}>
                    <SvgXml xml={isBig(t.tierKey) ? carConfortCard : carEcoCard} width={230} height={128} />
                  </View>
                </PressScale>
              </Appear>
            );
          })}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  /* ═══ Détail ═══ */
  const renderDetail = () => car && (
    <View style={{ flex: 1 }}>
      <View style={{ position: "absolute", top: 28 + insets.top, left: 20, right: 20, zIndex: 2 }}>
        <Header title="Détail du véhicule" onBack={() => setStep("list")} />
      </View>
      <Glow top={120 + insets.top} w={420} h={300} opacity={0.26} />
      <View style={{ position: "absolute", top: 262 + insets.top, alignSelf: "center", width: 300, height: 64, borderRadius: 150, backgroundColor: th.glassFill(0.14), borderWidth: 1, borderColor: th.glass(0.25), boxShadow: th.glassFx }} />
      <View key={car.tierKey} style={{ position: "absolute", top: 120 + insets.top, alignSelf: "center" }}>
        <Appear kind="drive" duration={700}>
          <Float amp={7} duration={4500}><SvgXml xml={isBig(car.tierKey) ? carConfort : carEco} width={340} height={189} /></Float>
        </Appear>
      </View>
      {tiers.length > 1 && (
        <View style={{ position: "absolute", top: 318 + insets.top, alignSelf: "center", flexDirection: "row", gap: 8 }}>
          <PressScale onPress={() => setCarIdx((carIdx + tiers.length - 1) % tiers.length)} accessibilityLabel="Véhicule précédent"
            style={{ width: 42, height: 34, borderRadius: 17, backgroundColor: th.accent, alignItems: "center", justifyContent: "center" }}><T w="bold" size={18} color={th.onAccent}>‹</T></PressScale>
          <PressScale onPress={() => setCarIdx((carIdx + 1) % tiers.length)} accessibilityLabel="Véhicule suivant"
            style={{ width: 42, height: 34, borderRadius: 17, backgroundColor: th.accent, alignItems: "center", justifyContent: "center" }}><T w="bold" size={18} color={th.onAccent}>›</T></PressScale>
        </View>
      )}
      <View style={{ position: "absolute", top: 370 + insets.top, left: 24, right: 24 }}>
        <T w="bold" size={30}>{car.label}</T>
        <T size={14} color={th.muted} style={{ marginTop: 8, lineHeight: 21 }}>{car.description || DESC[car.tierKey] || DESC.eco}</T>
        <View style={{ marginTop: 16, flexDirection: "row", gap: 8 }}>
          {[
            { icon: "seat" as const, label: "Places", value: String(car.seats) },
            { icon: "clock" as const, label: "Arrivée", value: `${car.etaMin ?? 3} min` },
            { icon: "route" as const, label: "Prix / km", value: `${ec(car.perKm)} EC` },
          ].map((s) => (
            <Glass key={s.label} a={0.14} b={0.2} radius={18} style={{ flex: 1, padding: 12 }}>
              <BimIcon name={s.icon} size={20} color={th.fg} />
              <T size={12} color={th.muted} style={{ marginTop: 8 }}>{s.label}</T>
              <T w="bold" size={17}>{s.value}</T>
            </Glass>
          ))}
        </View>
        <Glass a={0.1} b={0.18} radius={18} style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 14 }}>
          <BimIcon name="route" size={18} color={th.fg} />
          {est != null && km != null ? (
            <><T size={14} style={{ flex: 1 }}>Course de {km} km estimée</T><T w="bold" size={14}>≈ {ec(est)} EC</T></>
          ) : <T size={14} style={{ flex: 1 }} color={th.muted}>Indique ta destination pour estimer le prix.</T>}
        </Glass>
      </View>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 18, paddingHorizontal: 24, paddingBottom: 34 + insets.bottom, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: th.ink }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <T size={14} color={th.onInkMuted}>Prix par kilomètre</T>
          <T w="bold" size={24} color={th.onInk}>{ec(car.perKm)} EC <T size={14} color={th.onInkMuted}>/ km</T></T>
        </View>
        <SlideButton variant="accent" loading={requesting} label={`Commander ${car.label}`} onDone={order} />
      </View>
    </View>
  );

  /* ═══ Course ═══ */
  const ch = ride?.chauffeur;
  const chName = ch?.fullname || ch?.user?.username || "Ton chauffeur";
  const chCar = [ch?.vehicleMake, ch?.vehicleModel, ch?.vehicleColor].filter(Boolean).join(" ") || car?.label;
  const eta = status === "in_progress" ? "Course en cours" : status === "arriving" ? "Ton chauffeur est là" : `~ ${ride?.durationMin ? Math.max(2, Math.round(ride.durationMin / 3)) : car?.etaMin ?? 5} min`;
  const fare = ride?.finalFare ?? ride?.estimatedFare ?? est;

  const renderRide = () => (
    <View style={{ flex: 1, backgroundColor: th.base }}>
      <SvgXml xml={taxiMapFor(th.base)} width={W} height={H} preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0 }} />
      {found && (
        <Animated.View style={{ position: "absolute", top: 0, left: 0, transform: [{ translateX: carX }, { translateY: carY }] }}>
          <View style={{ width: 34, height: 20, borderRadius: 6, backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#1E2125", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4, alignItems: "center" }}>
            <View style={{ width: 8, height: 10, borderRadius: 2, backgroundColor: "#1E2125" }} />
            <View style={{ width: 8, height: 10, borderRadius: 2, backgroundColor: "#1E2125" }} />
          </View>
        </Animated.View>
      )}
      <View style={{ position: "absolute", top: 28 + insets.top, left: 20, right: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <RoundButton icon="back" label="Retour à l'accueil" variant="ink" onPress={() => router.replace("/(tabs)" as any)} />
        <View style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 22, backgroundColor: th.accent }}>
          {found ? (
            <><T w="bold" size={17} color={th.onAccent}>{eta}</T><T size={12} color={th.onAccent} style={{ opacity: 0.6 }}>{status === "in_progress" ? "Bonne route avec BIMNEXT" : "Ton chauffeur arrive"}</T></>
          ) : (
            waitingId
              ? <><T w="bold" size={17} color={th.onAccent} numberOfLines={1}>En attente de {waitingCh?.username ?? "ton chauffeur"}…</T><T size={12} color={th.onAccent} style={{ opacity: 0.6 }}>{offerLeft > 0 ? `Réponse sous ${offerLeft} s` : "Réponse imminente"}</T></>
              : <><T w="bold" size={17} color={th.onAccent}>Choisis ton chauffeur</T><T size={12} color={th.onAccent} style={{ opacity: 0.6 }}>{chauffeurs.length} disponible{chauffeurs.length > 1 ? "s" : ""} · {car?.label}</T></>
          )}
        </View>
      </View>

      {!found && (
        <View style={{ position: "absolute", top: 290 * H / 844, alignSelf: "center", width: 180, height: 180, alignItems: "center", justifyContent: "center" }}>
          <Pulse size={180} radar />
          <Pulse size={180} radar delay={800} />
          <Ink size={72} icon="taxi" iconSize={32} />
        </View>
      )}

      <View style={{ position: "absolute", left: 12, right: 12, bottom: 16 + insets.bottom, padding: 16, borderRadius: 30, backgroundColor: th.ink }}>
        {found ? (
          <Appear kind="page" style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: th.accent, alignItems: "center", justifyContent: "center" }}>
              <BimIcon name="user" size={26} color={th.onAccent} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T w="bold" size={16} color={th.onInk} numberOfLines={1}>{chName}</T>
              <T size={13} color={th.onInkMuted} numberOfLines={1}>{chCar}{ch?.plateNumber ? ` · ${ch.plateNumber}` : ""}</T>
            </View>
            <PressScale onPress={() => ch?.telephone && Linking.openURL(`sms:${ch.telephone}`)} disabled={!ch?.telephone} accessibilityLabel="Envoyer un message"
              style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" }}>
              <BimIcon name="message" size={18} color={th.onInk} />
            </PressScale>
            <PressScale onPress={() => ch?.telephone && Linking.openURL(`tel:${ch.telephone}`)} disabled={!ch?.telephone} accessibilityLabel="Appeler le chauffeur"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: th.accent, alignItems: "center", justifyContent: "center" }}>
              <BimIcon name="phone" size={18} color={th.onAccent} />
            </PressScale>
          </Appear>
        ) : (
          <View>
            {!!offerNote && (
              <View style={{ marginBottom: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)" }} accessibilityRole="alert">
                <T size={13} color={th.onInk}>{offerNote}</T>
              </View>
            )}
            {chauffeurs.length === 0 ? (
              <T size={15} color={th.onInkMuted}>{chLoading ? "Recherche des chauffeurs disponibles…" : "Aucun chauffeur en ligne pour le moment. La liste se met à jour toute seule."}</T>
            ) : (
              <ScrollView style={{ maxHeight: H * 0.36 }} contentContainerStyle={{ gap: 8 }} showsVerticalScrollIndicator={false}>
                {chauffeurs.map((c) => {
                  const isWaiting = waitingId === c.chauffeurId;
                  const meta = [c.vehicle, c.vehicleColor, c.plateNumber].filter(Boolean).join(" · ");
                  const where = c.distanceKm != null ? `${c.distanceKm} km · ~${c.etaMin} min` : "Distance inconnue";
                  return (
                    <PressScale key={c.chauffeurId} onPress={() => choose(c)} disabled={!!waitingId}
                      accessibilityLabel={`Choisir ${c.username}, note ${Number(c.rating ?? 5).toFixed(1)}, ${where}`}
                      style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 20, borderWidth: 1.5,
                        borderColor: isWaiting ? th.accent : "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.06)", opacity: waitingId && !isWaiting ? 0.5 : 1 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: th.accent, alignItems: "center", justifyContent: "center" }}>
                        <BimIcon name="user" size={20} color={th.onAccent} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <T w="bold" size={15} color={th.onInk} numberOfLines={1}>{c.username}{c.sameTier ? "" : ` · ${c.vehicleTier}`}</T>
                        <T size={12} color={th.onInkMuted} numberOfLines={1}>★ {Number(c.rating ?? 5).toFixed(1)} · {where}</T>
                        {!!meta && <T size={12} color={th.onInkMuted} numberOfLines={1}>{meta}</T>}
                      </View>
                      <View style={{ height: 34, paddingHorizontal: 14, borderRadius: 17, justifyContent: "center", backgroundColor: isWaiting ? "transparent" : th.accent }}>
                        <T w="bold" size={13} color={isWaiting ? th.onInk : th.onAccent}>{isWaiting ? (offerLeft > 0 ? `${offerLeft} s` : "…") : "Choisir"}</T>
                      </View>
                    </PressScale>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}
        {found && !!ride?.pickupCode && status !== "in_progress" && (
          <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)" }}>
            <T size={13} color={th.onInkMuted}>Code à donner au chauffeur</T>
            <T w="bold" size={20} color={th.onInk} style={{ letterSpacing: 4 }}>{ride.pickupCode}</T>
          </View>
        )}
        <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)", flexDirection: "row", gap: 12 }}>
          <View style={{ alignItems: "center", paddingTop: 4 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: th.accent }} />
            <View style={{ flex: 1, width: 2, marginVertical: 4, backgroundColor: "rgba(255,255,255,0.3)" }} />
            <View style={{ width: 12, height: 12, borderRadius: 3, borderWidth: 2, borderColor: th.onInk }} />
          </View>
          <View style={{ flex: 1, gap: 14 }}>
            <View><T size={12} color={th.onInkMuted}>Départ</T><T w="bold" size={15} color={th.onInk}>Ma position actuelle</T></View>
            <View><T size={12} color={th.onInkMuted}>Arrivée</T><T w="bold" size={15} color={th.onInk} numberOfLines={2}>{ride?.destinationAddress ?? dest}</T></View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <T size={12} color={th.onInkMuted}>Estimation</T>
            <T w="bold" size={18} color={th.onInk}>{fare != null ? ec(fare) : "…"} EC</T>
            <T size={12} color={th.onInkMuted}>{(ride?.distanceKm ?? km) != null ? `${ride?.distanceKm ?? km} km · ` : ""}{car ? ec(car.perKm) : ""} EC/km</T>
          </View>
        </View>
        {status === "arriving" && (
          <PillButton variant="accent" label={starting ? "Démarrage…" : "Je suis à bord — démarrer"} onPress={doStart} style={{ marginTop: 14 }} />
        )}
        {status !== "in_progress" && (
          <PillButton label="Annuler la course" onPress={cancel} style={{ marginTop: 14, borderColor: "rgba(255,255,255,0.3)" }} />
        )}
      </View>
    </View>
  );

  return (
    <BimBackground enter={false}>
      <View key={step} style={{ flex: 1 }}>
        <Appear kind="page" style={{ flex: 1 }}>
          {step === "list" && renderList()}
          {step === "detail" && renderDetail()}
          {step === "ride" && renderRide()}
        </Appear>
      </View>
      {status === "completed" && rideNumber && (
        <StatusOverlay phase="done" title="Course terminée !" text={ride?.paymentStatus === "paid"
          ? `${fare != null ? ec(fare) : ""} EC payés depuis ton solde. Merci d'avoir roulé avec BIMNEXT.`
          : `Ton solde ne suffisait pas : règle ${fare != null ? ec(fare) : ""} EC en espèces au chauffeur.`}>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 6 }} accessibilityLabel="Note ton chauffeur">
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => finishRating(n)} accessibilityRole="button" accessibilityLabel={`${n} étoile${n > 1 ? "s" : ""}`} hitSlop={6}>
                <BimIcon name="star" size={34} color={th.accent} filled={n <= stars} />
              </Pressable>
            ))}
          </View>
          <PillButton variant="accent" label="Retour à l'accueil" onPress={() => router.replace("/(tabs)" as any)} />
          <PillButton label="Nouvelle course" onPress={() => { setRideNumber(null); setStars(0); setOfferedTo(null); setOfferNote(null); setStep("list"); }} />
        </StatusOverlay>
      )}
    </BimBackground>
  );
}
