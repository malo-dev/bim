import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/app/_layout";
import { API_URL_BASE } from "@/constants/api";
import LiveMap from "@/components/transport/LiveMap";
import {
  useGetRideByNumberQuery,
  useArrivedRideMutation,
  useCompleteRideMutation,
  useCancelRideByChauffeurMutation,
} from "@/services/rideService";
import { getSocket } from "@/services/socketService";

const LIGHT = {
  bg: "#F8FAFC", canvas: "#EEF2F8",
  primary: "#0062FF", text: "#0F172A", textSub: "#475569", textMut: "#64748B",
  glass: "rgba(255,255,255,0.92)", glassBord: "rgba(255,255,255,0.7)",
  iconBtnBg: "rgba(0,98,255,0.08)", iconBtnBord: "rgba(0,98,255,0.15)",
  border: "#E2E8F0", white: "#FFFFFF", green: "#10B981", red: "#EF4444",
};
const DARK: typeof LIGHT = {
  bg: "#0B1220", canvas: "#0F1A2E",
  primary: "#3D7DFF", text: "#EAF0FF", textSub: "#A3B4D0", textMut: "#6B7A99",
  glass: "rgba(26,37,64,0.92)", glassBord: "rgba(31,42,68,0.9)",
  iconBtnBg: "rgba(61,125,255,0.14)", iconBtnBord: "rgba(61,125,255,0.22)",
  border: "#1F2A44", white: "#FFFFFF", green: "#34D399", red: "#F87171",
};

const STATUS_LABEL: Record<string, string> = {
  accepted: "Direction : point de prise en charge",
  arriving: "Vous êtes arrivé — en attente du passager",
  in_progress: "Course en cours vers la destination",
};

export default function CourseEnCoursScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router = useRouter();
  const { rideNumber } = useLocalSearchParams<{ rideNumber: string }>();

  const { data, refetch } = useGetRideByNumberQuery(rideNumber, { skip: !rideNumber, pollingInterval: 8000 });
  const [arrivedRide, { isLoading: arriving }] = useArrivedRideMutation();
  const [completeRide, { isLoading: completing }] = useCompleteRideMutation();
  const [cancelRideByChauffeur, { isLoading: cancelling }] = useCancelRideByChauffeurMutation();
  const ride = data?.data;

  // Compteur kilométrique/prix en direct — mis à jour à chaque position reçue
  // pendant que la course est "in_progress" (voir chauffeur.controller.updateLocation).
  const [liveTrip, setLiveTrip] = useState<{ distanceKm: number; fare: number } | null>(null);

  useEffect(() => {
    if (!rideNumber) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit("track_ride", rideNumber);
    const handler = () => refetch();
    const onLocation = (payload: any) => {
      if (payload?.distanceKm != null && payload?.liveFare != null) {
        setLiveTrip({ distanceKm: payload.distanceKm, fare: payload.liveFare });
      }
    };
    socket.on("ride:status_updated", handler);
    socket.on("ride:chauffeur_location", onLocation);
    return () => {
      socket.off("ride:status_updated", handler);
      socket.off("ride:chauffeur_location", onLocation);
    };
  }, [rideNumber]);

  useEffect(() => { if (ride?.status !== "in_progress") setLiveTrip(null); }, [ride?.status]);

  useEffect(() => {
    if (ride?.status === "completed") {
      Alert.alert("Course terminée", "Merci pour votre travail !", [
        { text: "OK", onPress: () => router.replace("/transport/mode-chauffeur" as any) },
      ]);
    } else if (ride?.status === "cancelled") {
      Alert.alert("Course annulée", ride?.cancelReason || "Cette course a été annulée.", [
        { text: "OK", onPress: () => router.replace("/transport/mode-chauffeur" as any) },
      ]);
    }
  }, [ride?.status]);

  const passenger = ride?.passenger;
  const avatarUri = passenger?.imageUrl
    ? (passenger.imageUrl.startsWith("http") ? passenger.imageUrl : `${API_URL_BASE}${passenger.imageUrl}`)
    : null;

  const doArrived = () => arrivedRide(rideNumber).catch((e: any) => Alert.alert("Erreur", e?.data?.message || "Action impossible."));
  const doComplete = () => completeRide(rideNumber).catch((e: any) => Alert.alert("Erreur", e?.data?.message || "Action impossible."));
  const doCancel = () => {
    Alert.alert("Annuler la course ?", "Le passager sera notifié immédiatement.", [
      { text: "Non", style: "cancel" },
      { text: "Oui, annuler", style: "destructive", onPress: () => cancelRideByChauffeur({ rideNumber }).catch(() => {}) },
    ]);
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={s.topBar}>
          <View style={{ width: 38 }} />
          <Text style={s.title} numberOfLines={1}>Course en cours</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      <View style={s.mapWrap}>
        <LiveMap
          style={StyleSheet.absoluteFill}
          pickupLat={ride?.pickupLat ? Number(ride.pickupLat) : null}
          pickupLng={ride?.pickupLng ? Number(ride.pickupLng) : null}
          destLat={ride?.destinationLat ? Number(ride.destinationLat) : null}
          destLng={ride?.destinationLng ? Number(ride.destinationLng) : null}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={s.sheet}>
          <View style={s.statusRow}>
            <Ionicons name="navigate-outline" size={16} color={C.primary} />
            <Text style={s.statusText}>{ride ? STATUS_LABEL[ride.status] : "Chargement…"}</Text>
          </View>

          {passenger && (
            <View style={s.driverCard}>
              <View style={s.driverAvatarWrap}>
                {avatarUri
                  ? <Image source={{ uri: avatarUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                  : <Ionicons name="person" size={22} color={C.primary} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.driverName}>{passenger.username ?? "Passager"}</Text>
                {!!ride?.pickupCode && <Text style={s.driverMeta}>Code : {ride.pickupCode}</Text>}
              </View>
              {!!passenger.telephone && (
                <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL(`tel:${passenger.telephone}`)}>
                  <Ionicons name="call" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={s.addrCard}>
            <View style={s.addrHeader}>
              <Ionicons name="radio-button-on" size={14} color={C.primary} />
              <Text style={s.addrLabel}>PRISE EN CHARGE</Text>
            </View>
            <Text style={s.addrText} numberOfLines={1}>{ride?.pickupAddress}</Text>
            <View style={[s.addrHeader, { marginTop: 10 }]}>
              <Ionicons name="location" size={14} color={C.text} />
              <Text style={s.addrLabel}>DESTINATION</Text>
            </View>
            <Text style={s.addrText} numberOfLines={1}>{ride?.destinationAddress}</Text>
          </View>

          <View style={s.fareCard}>
            <Text style={s.fareLabel}>
              {liveTrip ? "Compteur en cours" : "Montant de la course"}
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.fareVal}>{Number(liveTrip?.fare ?? ride?.estimatedFare ?? 0).toFixed(2)} EC</Text>
              {liveTrip && (
                <Text style={s.fareSub}>{liveTrip.distanceKm.toFixed(2)} km parcourus</Text>
              )}
            </View>
          </View>

          {ride?.status === "accepted" && (
            <TouchableOpacity style={s.primaryBtn} onPress={doArrived} disabled={arriving}>
              {arriving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Je suis arrivé</Text>}
            </TouchableOpacity>
          )}
          {ride?.status === "arriving" && (
            <View style={s.waitingNote}>
              <Ionicons name="hourglass-outline" size={14} color={C.textMut} />
              <Text style={s.waitingNoteText}>En attente que le passager démarre la course</Text>
            </View>
          )}
          {ride?.status === "in_progress" && (
            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: C.green }]} onPress={doComplete} disabled={completing}>
              {completing ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Terminer la course</Text>}
            </TouchableOpacity>
          )}

          {ride?.status !== "in_progress" && (
            <TouchableOpacity style={s.cancelBtn} onPress={doCancel} disabled={cancelling}>
              <Ionicons name="close-circle-outline" size={16} color={C.red} />
              <Text style={s.cancelText}>Annuler la course</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function mkS(C: typeof LIGHT) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontFamily: "NexaBold", fontSize: 16, color: C.text, flex: 1, textAlign: "center" },

  mapWrap: { height: 200, marginHorizontal: 20, borderRadius: 24, overflow: "hidden", backgroundColor: C.canvas },

  sheet: { padding: 20, gap: 14 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusText: { fontFamily: "NexaBold", fontSize: 14, color: C.text, flex: 1 },

  driverCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.glass, borderRadius: 22, padding: 14, borderWidth: 1, borderColor: C.glassBord },
  driverAvatarWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.canvas, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  driverName: { fontFamily: "NexaBold", fontSize: 14, color: C.text },
  driverMeta: { fontFamily: "NexaLight", fontSize: 11.5, color: C.textMut, marginTop: 2 },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },

  addrCard: { backgroundColor: C.glass, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: C.glassBord },
  addrHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  addrLabel: { fontFamily: "NexaBold", fontSize: 9.5, color: C.textMut, letterSpacing: 0.5 },
  addrText: { fontFamily: "NexaBold", fontSize: 13, color: C.text, marginTop: 4, marginLeft: 20 },

  fareCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.glass, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.glassBord },
  fareLabel: { fontFamily: "NexaLight", fontSize: 12.5, color: C.textSub },
  fareVal: { fontFamily: "NexaBold", fontSize: 18, color: C.primary },
  fareSub: { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, marginTop: 2 },

  primaryBtn: { alignItems: "center", justifyContent: "center", height: 54, borderRadius: 20, backgroundColor: C.primary },
  primaryBtnText: { fontFamily: "NexaBold", fontSize: 14, color: "#fff" },
  waitingNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 54, borderRadius: 20, backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBord },
  waitingNoteText: { fontFamily: "NexaLight", fontSize: 12.5, color: C.textMut },

  cancelBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(239,68,68,0.08)", borderRadius: 18, paddingVertical: 14 },
  cancelText: { fontFamily: "NexaBold", fontSize: 13, color: C.red },
}); }
