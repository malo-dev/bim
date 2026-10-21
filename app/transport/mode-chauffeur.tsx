import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/app/_layout";
import {
  useGetMyChauffeurQuery,
  useRegisterChauffeurMutation,
  useToggleOnlineMutation,
  useUpdateChauffeurLocationMutation,
} from "@/services/chauffeurService";
import { useAcceptRideMutation, useDeclineRideMutation, useGetChauffeurActiveRideQuery } from "@/services/rideService";
import { getSocket } from "@/services/socketService";

const LIGHT = {
  bg: "#F8FAFC", canvas: "#EEF2F8",
  primary: "#0062FF", text: "#0F172A", textSub: "#475569", textMut: "#64748B",
  glass: "rgba(255,255,255,0.92)", glassBord: "rgba(255,255,255,0.7)",
  iconBtnBg: "rgba(0,98,255,0.08)", iconBtnBord: "rgba(0,98,255,0.15)",
  border: "#E2E8F0", white: "#FFFFFF", green: "#10B981", red: "#EF4444", amber: "#F59E0B",
};
const DARK: typeof LIGHT = {
  bg: "#0B1220", canvas: "#0F1A2E",
  primary: "#3D7DFF", text: "#EAF0FF", textSub: "#A3B4D0", textMut: "#6B7A99",
  glass: "rgba(26,37,64,0.92)", glassBord: "rgba(31,42,68,0.9)",
  iconBtnBg: "rgba(61,125,255,0.14)", iconBtnBord: "rgba(61,125,255,0.22)",
  border: "#1F2A44", white: "#FFFFFF", green: "#34D399", red: "#F87171", amber: "#FBBF24",
};

const TIER_OPTIONS = [
  { label: "Bim Eco", value: "eco" },
  { label: "Bim Confort", value: "confort" },
  { label: "Bim Green", value: "green" },
  { label: "Bim Van", value: "van" },
  { label: "Moto Express", value: "moto" },
];

export default function ModeChauffeurScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router = useRouter();

  const { data, isLoading, error, refetch } = useGetMyChauffeurQuery(undefined);
  const chauffeur = data?.data;
  const notRegistered = (error as any)?.status === 404;

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.title}>Espace Chauffeur</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={C.primary} />
        </View>
      ) : notRegistered ? (
        <RegisterForm C={C} s={s} onDone={refetch} />
      ) : chauffeur ? (
        <OnlineToggle C={C} s={s} chauffeur={chauffeur} onChanged={refetch} />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
          <Text style={s.errorText}>Impossible de charger votre profil chauffeur.</Text>
          <TouchableOpacity
            style={{ marginTop: 16 }}
            onPress={() => router.push("/transport/chauffeur-access" as any)}
          >
            <Text style={{ fontFamily: "NexaBold", fontSize: 13, color: C.primary }}>
              J'ai un code d'accès chauffeur
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* ─── Inscription (pas encore de profil chauffeur) ───────────────────────── */
function RegisterForm({ C, s, onDone }: { C: typeof LIGHT; s: any; onDone: () => void }) {
  const [registerChauffeur, { isLoading: submitting }] = useRegisterChauffeurMutation();
  const [telephone, setTelephone] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleTier, setVehicleTier] = useState("eco");

  const canSubmit = telephone && vehicleMake && vehicleModel && plateNumber;

  const submit = async () => {
    try {
      await registerChauffeur({ telephone, vehicleMake, vehicleModel, vehicleColor, plateNumber, vehicleTier }).unwrap();
      Alert.alert("Demande envoyée", "Votre candidature est en attente de validation par l'équipe BIM.");
      onDone();
    } catch (e: any) {
      Alert.alert("Erreur", e?.data?.message || "Impossible d'envoyer la demande.");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} showsVerticalScrollIndicator={false}>
      <View style={s.introCard}>
        <Ionicons name="car-sport" size={24} color={C.primary} />
        <Text style={s.introTitle}>Devenez chauffeur BIM Transport</Text>
        <Text style={s.introSub}>Renseignez votre véhicule, notre équipe valide votre profil sous peu.</Text>
      </View>

      <Field label="Téléphone" value={telephone} onChangeText={setTelephone} placeholder="+243..." C={C} s={s} />
      <Field label="Marque du véhicule" value={vehicleMake} onChangeText={setVehicleMake} placeholder="Toyota, Tesla…" C={C} s={s} />
      <Field label="Modèle" value={vehicleModel} onChangeText={setVehicleModel} placeholder="Corolla, Model 3…" C={C} s={s} />
      <Field label="Couleur" value={vehicleColor} onChangeText={setVehicleColor} placeholder="Blanc, noir…" C={C} s={s} />
      <Field label="Plaque d'immatriculation" value={plateNumber} onChangeText={setPlateNumber} placeholder="AA-123-BB" C={C} s={s} />

      <Text style={s.fieldLabel}>Gamme</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {TIER_OPTIONS.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[s.tierChip, vehicleTier === t.value && s.tierChipActive]}
            onPress={() => setVehicleTier(t.value)}
          >
            <Text style={[s.tierChipText, vehicleTier === t.value && { color: "#fff" }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[s.ctaBtn, (!canSubmit || submitting) && { opacity: 0.6 }]} disabled={!canSubmit || submitting} onPress={submit}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.ctaText}>Envoyer ma candidature</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, C, s, ...props }: any) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput style={s.input} placeholderTextColor={C.textMut} {...props} />
    </View>
  );
}

type RideOffer = {
  rideNumber: string; pickupAddress: string; destinationAddress: string;
  distanceKm: number; durationMin: number; estimatedFare: number; expiresInSec: number;
};

/* ─── Profil existant : bascule en ligne / hors ligne + partage GPS ──────── */
function OnlineToggle({ C, s, chauffeur, onChanged }: { C: typeof LIGHT; s: any; chauffeur: any; onChanged: () => void }) {
  const router = useRouter();
  const [toggleOnline, { isLoading: toggling }] = useToggleOnlineMutation();
  const [updateLocation] = useUpdateChauffeurLocationMutation();
  const [acceptRide, { isLoading: accepting }] = useAcceptRideMutation();
  const [declineRide] = useDeclineRideMutation();
  const { data: activeRideData, refetch: refetchActive } = useGetChauffeurActiveRideQuery(undefined);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [offer, setOffer] = useState<RideOffer | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const isPending = chauffeur.status === "pending";
  const isOnline = !!chauffeur.isOnline;

  // Reprendre une course déjà en cours (app relancée en plein trajet)
  useFocusEffect(
    useCallback(() => {
      refetchActive();
    }, [])
  );
  useEffect(() => {
    if (activeRideData?.data?.rideNumber) {
      router.replace({ pathname: "/transport/course-en-cours", params: { rideNumber: activeRideData.data.rideNumber } } as any);
    }
  }, [activeRideData]);

  // Offres de course en direct pendant que le chauffeur est en ligne
  useEffect(() => {
    if (!isOnline) { setOffer(null); return; }
    const socket = getSocket();
    if (!socket) return;
    const onIncoming = (payload: RideOffer) => {
      setOffer(payload);
      setSecondsLeft(payload.expiresInSec || 15);
    };
    socket.on("ride:incoming", onIncoming);
    return () => { socket.off("ride:incoming", onIncoming); };
  }, [isOnline]);

  useEffect(() => {
    if (!offer) { if (countdownRef.current) clearInterval(countdownRef.current); return; }
    countdownRef.current = setInterval(() => {
      setSecondsLeft((s2) => {
        if (s2 <= 1) { clearInterval(countdownRef.current!); setOffer(null); return 0; }
        return s2 - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [offer]);

  const respondAccept = async () => {
    if (!offer) return;
    try {
      await acceptRide(offer.rideNumber).unwrap();
      const rn = offer.rideNumber;
      setOffer(null);
      router.push({ pathname: "/transport/course-en-cours", params: { rideNumber: rn } } as any);
    } catch (e: any) {
      Alert.alert("Trop tard", e?.data?.message || "Cette course n'est plus disponible.");
      setOffer(null);
    }
  };

  const respondDecline = () => {
    if (!offer) return;
    declineRide(offer.rideNumber).catch(() => {});
    setOffer(null);
  };

  useEffect(() => {
    if (!isOnline) {
      watchRef.current?.remove();
      watchRef.current = null;
      return;
    }

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGpsError("Autorisation de localisation refusée — impossible de partager votre position.");
        return;
      }
      setGpsError("");
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 8000, distanceInterval: 25 },
        (pos) => {
          updateLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }).catch(() => {});
        }
      );
    })();

    return () => { watchRef.current?.remove(); watchRef.current = null; };
  }, [isOnline]);

  const onToggle = async () => {
    try {
      await toggleOnline(undefined).unwrap();
      onChanged();
    } catch (e: any) {
      Alert.alert("Erreur", e?.data?.message || "Impossible de changer de statut.");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
      {isPending && (
        <View style={s.pendingBanner}>
          <Ionicons name="time-outline" size={16} color={C.amber} />
          <Text style={s.pendingText}>Votre profil est en attente de validation par l'équipe BIM. Vous serez notifié dès l'activation.</Text>
        </View>
      )}

      <View style={s.statusCard}>
        <View style={{ flex: 1 }}>
          <Text style={s.statusTitle}>{isOnline ? "Vous êtes en ligne" : "Vous êtes hors ligne"}</Text>
          <Text style={s.statusSub}>
            {isOnline ? "Votre position est partagée, vous pouvez recevoir des courses." : "Activez pour commencer à recevoir des courses."}
          </Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={onToggle}
          disabled={isPending || toggling}
          trackColor={{ false: C.border, true: C.primary }}
          thumbColor="#fff"
        />
      </View>

      {!!gpsError && <Text style={s.errorText}>{gpsError}</Text>}

      <View style={s.vehicleCard}>
        <Text style={s.vehicleTitle}>{chauffeur.vehicleMake} {chauffeur.vehicleModel}</Text>
        <Text style={s.vehicleSub}>{chauffeur.vehicleColor} · {chauffeur.plateNumber}</Text>
        <View style={s.statsRow}>
          <View style={s.statBox}><Text style={s.statVal}>{Number(chauffeur.rating ?? 5).toFixed(2)}</Text><Text style={s.statLabel}>★ Note</Text></View>
          <View style={s.statBox}><Text style={s.statVal}>{chauffeur.totalRides}</Text><Text style={s.statLabel}>Courses</Text></View>
        </View>
      </View>

      <Modal visible={!!offer} transparent animationType="slide" onRequestClose={respondDecline}>
        <View style={s.offerBackdrop}>
          <View style={s.offerCard}>
            <View style={s.offerHeader}>
              <Text style={s.offerTitle}>Nouvelle course</Text>
              <View style={s.offerTimer}><Text style={s.offerTimerText}>{secondsLeft}s</Text></View>
            </View>

            <View style={s.offerFareRow}>
              <Text style={s.offerFare}>{Number(offer?.estimatedFare ?? 0).toFixed(2)} EC</Text>
              <Text style={s.offerMeta}>{offer?.distanceKm} km · {offer?.durationMin} min</Text>
            </View>

            <View style={s.offerAddr}>
              <Ionicons name="radio-button-on" size={13} color={C.primary} />
              <Text style={s.offerAddrText} numberOfLines={1}>{offer?.pickupAddress}</Text>
            </View>
            <View style={s.offerAddr}>
              <Ionicons name="location" size={13} color={C.text} />
              <Text style={s.offerAddrText} numberOfLines={1}>{offer?.destinationAddress}</Text>
            </View>

            <View style={s.offerBtnRow}>
              <TouchableOpacity style={s.declineBtn} onPress={respondDecline}>
                <Text style={s.declineText}>Refuser</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.acceptBtn, accepting && { opacity: 0.7 }]} onPress={respondAccept} disabled={accepting}>
                {accepting ? <ActivityIndicator color="#fff" /> : <Text style={s.acceptText}>Accepter</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function mkS(C: typeof LIGHT) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.iconBtnBg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.iconBtnBord },
  title: { fontFamily: "NexaBold", fontSize: 16, color: C.text },

  introCard: { alignItems: "center", gap: 8, backgroundColor: C.glass, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.glassBord },
  introTitle: { fontFamily: "NexaBold", fontSize: 15, color: C.text, textAlign: "center" },
  introSub: { fontFamily: "NexaLight", fontSize: 12, color: C.textSub, textAlign: "center" },

  fieldLabel: { fontFamily: "NexaLight", fontSize: 12, color: C.textSub },
  input: { backgroundColor: C.glass, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "NexaLight", fontSize: 14, color: C.text },

  tierChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: C.glass, borderWidth: 1, borderColor: C.border },
  tierChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  tierChipText: { fontFamily: "NexaBold", fontSize: 12, color: C.text },

  ctaBtn: { marginTop: 6, backgroundColor: C.primary, borderRadius: 20, paddingVertical: 15, alignItems: "center", justifyContent: "center" },
  ctaText: { fontFamily: "NexaBold", fontSize: 14, color: "#fff" },

  errorText: { fontFamily: "NexaLight", fontSize: 12, color: C.red, textAlign: "center" },

  pendingBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: `${C.amber}14`, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: `${C.amber}33` },
  pendingText: { flex: 1, fontFamily: "NexaLight", fontSize: 12, color: C.textSub, lineHeight: 18 },

  statusCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.glass, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.glassBord },
  statusTitle: { fontFamily: "NexaBold", fontSize: 14, color: C.text },
  statusSub: { fontFamily: "NexaLight", fontSize: 11.5, color: C.textSub, marginTop: 2 },

  vehicleCard: { backgroundColor: C.glass, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.glassBord, gap: 4 },
  vehicleTitle: { fontFamily: "NexaBold", fontSize: 15, color: C.text },
  vehicleSub: { fontFamily: "NexaLight", fontSize: 12, color: C.textMut },
  statsRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  statBox: { flex: 1, alignItems: "center", backgroundColor: C.canvas, borderRadius: 14, paddingVertical: 12 },
  statVal: { fontFamily: "NexaBold", fontSize: 16, color: C.text },
  statLabel: { fontFamily: "NexaLight", fontSize: 10.5, color: C.textMut, marginTop: 2 },

  offerBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "flex-end" },
  offerCard: { backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, gap: 14 },
  offerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  offerTitle: { fontFamily: "NexaBold", fontSize: 17, color: C.text },
  offerTimer: { backgroundColor: `${C.primary}14`, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 },
  offerTimerText: { fontFamily: "NexaBold", fontSize: 13, color: C.primary },
  offerFareRow: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  offerFare: { fontFamily: "NexaBold", fontSize: 28, color: C.text },
  offerMeta: { fontFamily: "NexaLight", fontSize: 12, color: C.textMut },
  offerAddr: { flexDirection: "row", alignItems: "center", gap: 10 },
  offerAddrText: { flex: 1, fontFamily: "NexaBold", fontSize: 13, color: C.text },
  offerBtnRow: { flexDirection: "row", gap: 12, marginTop: 6 },
  declineBtn: { flex: 1, alignItems: "center", justifyContent: "center", height: 52, borderRadius: 20, backgroundColor: C.glass, borderWidth: 1, borderColor: C.border },
  declineText: { fontFamily: "NexaBold", fontSize: 14, color: C.textSub },
  acceptBtn: { flex: 1.4, alignItems: "center", justifyContent: "center", height: 52, borderRadius: 20, backgroundColor: C.green },
  acceptText: { fontFamily: "NexaBold", fontSize: 14, color: "#fff" },
}); }
