import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/app/_layout";
import {
  useGetAvailableChauffeursQuery,
  useOfferRideToChauffeurMutation,
  useGetRideByNumberQuery,
  useCancelRideMutation,
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

export default function ChoixChauffeurScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router = useRouter();
  const { rideNumber } = useLocalSearchParams<{ rideNumber: string }>();

  const { data: rideData } = useGetRideByNumberQuery(rideNumber, { skip: !rideNumber, pollingInterval: 5000 });
  const ride = rideData?.data;
  const { data, isFetching, refetch } = useGetAvailableChauffeursQuery(rideNumber, { skip: !rideNumber, pollingInterval: 8000 });
  const chauffeurs: any[] = data?.data ?? [];

  const [offerRide, { isLoading: offering }] = useOfferRideToChauffeurMutation();
  const [cancelRide, { isLoading: cancelling }] = useCancelRideMutation();
  const [waitingFor, setWaitingFor] = useState<number | null>(null);

  useEffect(() => {
    if (!rideNumber) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit("track_ride", rideNumber);
    const handler = (payload: any) => {
      if (payload?.status === "accepted") {
        router.replace({ pathname: "/transport/suivi", params: { rideNumber } } as any);
      } else if (payload?.status === "searching") {
        setWaitingFor(null);
        refetch();
      } else if (payload?.status === "cancelled") {
        Alert.alert("Course annulée", payload?.reason || "La course a été annulée.", [
          { text: "Retour", onPress: () => router.replace("/(tabs)" as any) },
        ]);
      }
    };
    socket.on("ride:status_updated", handler);
    return () => socket.off("ride:status_updated", handler);
  }, [rideNumber]);

  const handleSelect = async (chauffeurId: number) => {
    setWaitingFor(chauffeurId);
    try {
      await offerRide({ rideNumber, chauffeurId }).unwrap();
    } catch (e: any) {
      setWaitingFor(null);
      Alert.alert("Erreur", e?.data?.message || "Impossible de contacter ce chauffeur, choisissez-en un autre.");
      refetch();
    }
  };

  const doCancel = () => {
    Alert.alert("Annuler la course ?", "Vous pouvez annuler gratuitement.", [
      { text: "Non", style: "cancel" },
      { text: "Oui, annuler", style: "destructive", onPress: () => cancelRide({ rideNumber }).then(() => router.replace("/(tabs)" as any)) },
    ]);
  };

  const busy = ride?.status !== "searching";

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={doCancel} disabled={cancelling}>
            <Ionicons name="close" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.title}>Choisissez votre chauffeur</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      {isFetching && chauffeurs.length === 0 ? (
        <View style={s.center}><ActivityIndicator color={C.primary} /></View>
      ) : chauffeurs.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="car-outline" size={40} color={C.textMut} />
          <Text style={s.emptyText}>Aucun chauffeur disponible pour le moment</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
            <Text style={s.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chauffeurs}
          keyExtractor={(item) => String(item.chauffeurId)}
          contentContainerStyle={{ padding: 20, gap: 10 }}
          renderItem={({ item }) => {
            const isWaiting = waitingFor === item.chauffeurId;
            return (
              <TouchableOpacity
                style={[s.driverRow, isWaiting && s.driverRowActive]}
                onPress={() => handleSelect(item.chauffeurId)}
                disabled={offering || busy}
                activeOpacity={0.88}
              >
                <View style={s.avatarWrap}>
                  <Ionicons name="person" size={20} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.driverName}>{item.username}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <Ionicons name="star" size={11} color="#F59E0B" />
                    <Text style={s.driverMeta}>{Number(item.rating ?? 5).toFixed(2)}</Text>
                    {item.distanceKm != null && (
                      <>
                        <Text style={s.driverMeta}>•</Text>
                        <Text style={s.driverMeta}>{item.distanceKm.toFixed(1)} km</Text>
                      </>
                    )}
                  </View>
                </View>
                {isWaiting ? (
                  <View style={{ alignItems: "center", gap: 2 }}>
                    <ActivityIndicator size="small" color={C.primary} />
                    <Text style={s.waitingLabel}>En attente…</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={C.textMut} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

function mkS(C: typeof LIGHT) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.iconBtnBg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.iconBtnBord },
  title: { fontFamily: "NexaBold", fontSize: 16, color: C.text },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 30 },
  emptyText: { fontFamily: "NexaLight", fontSize: 13, color: C.textMut, textAlign: "center" },
  retryBtn: { backgroundColor: C.primary, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { fontFamily: "NexaBold", fontSize: 13, color: "#fff" },

  driverRow: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 14,
    borderRadius: 18, backgroundColor: C.glass, borderWidth: 1.5, borderColor: "transparent",
  },
  driverRowActive: { borderColor: C.primary },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.canvas, alignItems: "center", justifyContent: "center" },
  driverName: { fontFamily: "NexaBold", fontSize: 14, color: C.text },
  driverMeta: { fontFamily: "NexaLight", fontSize: 11.5, color: C.textMut },
  waitingLabel: { fontFamily: "NexaLight", fontSize: 9, color: C.primary },
}); }
