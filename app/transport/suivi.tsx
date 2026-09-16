import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
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
import { useGetRideByNumberQuery, useCancelRideMutation } from "@/services/rideService";
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
  searching: "Recherche d'un chauffeur…",
  accepted: "Chauffeur en route vers vous",
  arriving: "Chauffeur en route vers vous",
  in_progress: "En route vers votre destination",
};

export default function SuiviCourseScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router = useRouter();
  const { rideNumber } = useLocalSearchParams<{ rideNumber: string }>();

  const { data, refetch } = useGetRideByNumberQuery(rideNumber, { skip: !rideNumber, pollingInterval: 6000 });
  const [cancelRide, { isLoading: cancelling }] = useCancelRideMutation();
  const ride = data?.data;

  useEffect(() => {
    if (!rideNumber) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit("track_ride", rideNumber);
    const handler = () => refetch();
    socket.on("ride:status_updated", handler);
    return () => { socket.off("ride:status_updated", handler); };
  }, [rideNumber]);

  useEffect(() => {
    if (ride?.status === "completed") {
      router.replace({ pathname: "/transport/fin-course", params: { rideNumber } } as any);
    } else if (ride?.status === "cancelled") {
      Alert.alert("Course annulée", ride?.cancelReason || "Aucun chauffeur n'a pu être trouvé.", [
        { text: "Retour", onPress: () => router.replace("/(tabs)" as any) },
      ]);
    }
  }, [ride?.status]);

  const doCancel = () => {
    Alert.alert("Annuler la course ?", "Vous pouvez annuler gratuitement.", [
      { text: "Non", style: "cancel" },
      { text: "Oui, annuler", style: "destructive", onPress: () => cancelRide({ rideNumber }).then(() => router.replace("/(tabs)" as any)) },
    ]);
  };

  const chauffeur = ride?.chauffeur;
  const avatarUri = chauffeur?.user?.imageUrl
    ? (chauffeur.user.imageUrl.startsWith("http") ? chauffeur.user.imageUrl : `${API_URL_BASE}${chauffeur.user.imageUrl}`)
    : null;

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.title} numberOfLines={1}>Suivi de course</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      {/* ── Carte illustrative ── */}
      <View style={s.mapWrap}>
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=900&q=70" }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <View style={s.mapOverlay} />
        <View style={s.etaChip}>
          <Ionicons name="navigate" size={13} color="#fff" />
          <Text style={s.etaChipText}>{ride?.durationMin ?? "…"} min ({ride?.distanceKm ?? "…"} km)</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={s.sheet}>
          <View style={s.statusRow}>
            <Ionicons name="navigate-outline" size={16} color={C.primary} />
            <Text style={s.statusText}>{STATUS_LABEL[ride?.status] ?? "Chargement…"}</Text>
            <View style={s.verifiedChip}><Text style={s.verifiedText}>VÉRIFIÉ</Text></View>
          </View>

          {chauffeur ? (
            <View style={s.driverCard}>
              <View style={s.driverAvatarWrap}>
                {avatarUri
                  ? <Image source={{ uri: avatarUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                  : <Ionicons name="person" size={22} color={C.primary} />
                }
                <View style={s.ratingPill}><Text style={s.ratingPillText}>★ {Number(chauffeur.rating ?? 5).toFixed(2)}</Text></View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.driverName}>{chauffeur.user?.username ?? "Chauffeur"}</Text>
                <Text style={s.driverMeta}>{chauffeur.totalRides} courses</Text>
                <Text style={s.driverCar}>{chauffeur.vehicleMake} {chauffeur.vehicleModel} · {chauffeur.vehicleColor}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.plateLabel}>IMMAT.</Text>
                <View style={s.platePill}><Text style={s.plateText}>{chauffeur.plateNumber}</Text></View>
              </View>
            </View>
          ) : (
            <View style={[s.driverCard, { justifyContent: "center" }]}>
              <Text style={s.driverMeta}>Recherche du chauffeur le plus proche…</Text>
            </View>
          )}

          {!!ride?.pickupCode && (
            <View style={s.codeRow}>
              <View style={s.codeBox}>
                <Text style={s.codeLabel}>CODE DE DÉPART</Text>
                <Text style={s.codeValue}>{ride.pickupCode}</Text>
                <Text style={s.codeHint}>Donnez-le au chauffeur</Text>
              </View>
              <TouchableOpacity style={s.actionBtn} onPress={() => chauffeur?.telephone && Linking.openURL(`tel:${chauffeur.telephone}`)}>
                <Ionicons name="call" size={18} color={C.primary} />
                <Text style={s.actionText}>Appel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtn} onPress={() => router.push("/support" as any)}>
                <Ionicons name="chatbubble" size={18} color={C.primary} />
                <Text style={s.actionText}>Message</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={s.addrCard}>
            <View style={s.addrHeader}>
              <Ionicons name="radio-button-on" size={14} color={C.primary} />
              <Text style={s.addrLabel}>POINT DE PRISE EN CHARGE</Text>
            </View>
            <Text style={s.addrText} numberOfLines={1}>{ride?.pickupAddress}</Text>
          </View>

          {ride?.status !== "in_progress" && (
            <TouchableOpacity style={s.sosBtn} onPress={doCancel} disabled={cancelling}>
              <Ionicons name="close-circle-outline" size={16} color={C.red} />
              <Text style={s.sosText}>Annuler la course</Text>
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
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.iconBtnBg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.iconBtnBord },
  title: { fontFamily: "NexaBold", fontSize: 16, color: C.text, flex: 1, textAlign: "center" },

  mapWrap: { height: 200, marginHorizontal: 20, borderRadius: 24, overflow: "hidden", backgroundColor: C.canvas },
  mapOverlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(15,23,42,0.2)" },
  etaChip: { position: "absolute", top: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  etaChipText: { fontFamily: "NexaBold", fontSize: 11, color: "#fff" },

  sheet: { padding: 20, gap: 16 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusText: { fontFamily: "NexaBold", fontSize: 15, color: C.text, flex: 1 },
  verifiedChip: { backgroundColor: "rgba(0,98,255,0.1)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  verifiedText: { fontFamily: "NexaBold", fontSize: 9, color: C.primary },

  driverCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.glass, borderRadius: 22, padding: 14, borderWidth: 1, borderColor: C.glassBord, minHeight: 74 },
  driverAvatarWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.canvas, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  ratingPill: { position: "absolute", bottom: -4, alignSelf: "center", backgroundColor: "#F59E0B", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  ratingPillText: { fontFamily: "NexaBold", fontSize: 8.5, color: "#fff" },
  driverName: { fontFamily: "NexaBold", fontSize: 14, color: C.text },
  driverMeta: { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, marginTop: 1 },
  driverCar: { fontFamily: "NexaBold", fontSize: 11, color: C.primary, marginTop: 2 },
  plateLabel: { fontFamily: "NexaBold", fontSize: 8, color: C.textMut, letterSpacing: 0.5 },
  platePill: { backgroundColor: C.canvas, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginTop: 3, borderWidth: 1, borderColor: C.border },
  plateText: { fontFamily: "NexaBold", fontSize: 12, color: C.text },

  codeRow: { flexDirection: "row", gap: 10 },
  codeBox: { flex: 1.4, backgroundColor: "rgba(0,98,255,0.06)", borderRadius: 18, padding: 12, borderWidth: 1, borderColor: "rgba(0,98,255,0.15)" },
  codeLabel: { fontFamily: "NexaBold", fontSize: 8.5, color: C.primary, letterSpacing: 0.5 },
  codeValue: { fontFamily: "NexaBold", fontSize: 24, color: C.primary, marginTop: 2 },
  codeHint: { fontFamily: "NexaLight", fontSize: 9.5, color: C.textMut, marginTop: 2 },
  actionBtn: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: C.glass, borderRadius: 18, borderWidth: 1, borderColor: C.glassBord },
  actionText: { fontFamily: "NexaBold", fontSize: 10.5, color: C.text },

  addrCard: { backgroundColor: C.glass, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: C.glassBord, gap: 6 },
  addrHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  addrLabel: { fontFamily: "NexaBold", fontSize: 9.5, color: C.textMut, letterSpacing: 0.5 },
  addrText: { fontFamily: "NexaBold", fontSize: 13, color: C.text },

  sosBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(239,68,68,0.08)", borderRadius: 18, paddingVertical: 14 },
  sosText: { fontFamily: "NexaBold", fontSize: 13, color: C.red },
}); }
