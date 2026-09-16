import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/app/_layout";
import { API_URL_BASE } from "@/constants/api";
import { useGetRideByNumberQuery, useRateRideMutation } from "@/services/rideService";

const LIGHT = {
  bg: "#F8FAFC", primary: "#0062FF", text: "#0F172A", textSub: "#475569", textMut: "#64748B",
  glass: "#FFFFFF", glassBord: "#E2E8F0", green: "#10B981", amber: "#F59E0B", canvas: "#EEF2F8",
  iconBtnBg: "rgba(0,98,255,0.08)", iconBtnBord: "rgba(0,98,255,0.15)",
};
const DARK: typeof LIGHT = {
  bg: "#0B1220", primary: "#3D7DFF", text: "#EAF0FF", textSub: "#A3B4D0", textMut: "#6B7A99",
  glass: "#1A2540", glassBord: "#1F2A44", green: "#34D399", amber: "#FBBF24", canvas: "#0F1A2E",
  iconBtnBg: "rgba(61,125,255,0.14)", iconBtnBord: "rgba(61,125,255,0.22)",
};

const COMPLIMENTS = [
  { key: "conduite", label: "Conduite agréable", icon: "car-outline" },
  { key: "voiture", label: "Voiture impeccable", icon: "sparkles-outline" },
  { key: "ponctuel", label: "Ponctuel", icon: "time-outline" },
  { key: "musique", label: "Bonne musique", icon: "musical-notes-outline" },
  { key: "conversation", label: "Conversation au top", icon: "chatbubble-outline" },
];
const TIPS = [1, 2, 5];

export default function FinCourseScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router = useRouter();
  const { rideNumber } = useLocalSearchParams<{ rideNumber: string }>();

  const { data } = useGetRideByNumberQuery(rideNumber, { skip: !rideNumber });
  const [rateRide, { isLoading: sending }] = useRateRideMutation();
  const ride = data?.data;
  const chauffeur = ride?.chauffeur;

  const [stars, setStars] = useState(5);
  const [compliments, setCompliments] = useState<string[]>([]);
  const [tip, setTip] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  const toggleCompliment = (key: string) => {
    setCompliments((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const avatarUri = chauffeur?.user?.imageUrl
    ? (chauffeur.user.imageUrl.startsWith("http") ? chauffeur.user.imageUrl : `${API_URL_BASE}${chauffeur.user.imageUrl}`)
    : null;

  const submit = async () => {
    try {
      await rateRide({ rideNumber, stars, compliments, comment, tip: tip ?? 0 }).unwrap();
      setDone(true);
      setTimeout(() => router.replace("/(tabs)" as any), 1400);
    } catch {
      router.replace("/(tabs)" as any);
    }
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.replace("/(tabs)" as any)}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.title}>Détails du trajet</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
        <View style={{ alignItems: "center", marginTop: 8 }}>
          <View style={s.successIconWrap}>
            <Ionicons name="checkmark" size={30} color="#fff" />
          </View>
          <Text style={s.successLabel}>COURSE TERMINÉE</Text>
          <Text style={s.successTitle}>Vous êtes bien arrivé !</Text>
          <Text style={s.successSub}>Merci d'avoir voyagé avec BIM Transport</Text>
        </View>

        <View style={s.tripCard}>
          <View style={s.tripRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.tripAddr} numberOfLines={1}>{ride?.pickupAddress}</Text>
              <View style={{ height: 8 }} />
              <Text style={s.tripAddr} numberOfLines={1}>{ride?.destinationAddress}</Text>
            </View>
          </View>
          <View style={s.tripStatsRow}>
            <View style={s.tripStat}>
              <Text style={s.tripStatLabel}>Distance</Text>
              <Text style={s.tripStatValue}>{ride?.distanceKm ?? "—"} km</Text>
            </View>
            <View style={s.tripStat}>
              <Text style={s.tripStatLabel}>Temps de trajet</Text>
              <Text style={s.tripStatValue}>{ride?.durationMin ?? "—"} min</Text>
            </View>
          </View>
          <View style={s.tripPayRow}>
            <View>
              <Text style={s.tripStatLabel}>PORTEFEUILLE BIM</Text>
              <Text style={s.tripPrice}>{Number(ride?.finalFare ?? ride?.estimatedFare ?? 0).toFixed(2)} EC</Text>
            </View>
          </View>
        </View>

        <View style={s.reviewCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={s.driverAvatarWrap}>
              {avatarUri
                ? <Image source={{ uri: avatarUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                : <Ionicons name="person" size={20} color={C.primary} />}
            </View>
            <View>
              <Text style={s.driverName}>{chauffeur?.user?.username ?? "Chauffeur"}</Text>
              <Text style={s.driverCar}>{chauffeur?.vehicleMake} {chauffeur?.vehicleModel} · {chauffeur?.plateNumber}</Text>
            </View>
          </View>

          <Text style={s.reviewQuestion}>Comment s'est passée votre course ?</Text>
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setStars(n)}>
                <Ionicons name={n <= stars ? "star" : "star-outline"} size={30} color={C.amber} />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.starsHint}>{stars === 5 ? "Parfait ! 5 étoiles" : `${stars} étoile${stars > 1 ? "s" : ""}`}</Text>

          <Text style={s.complimentLabel}>AJOUTER UN COMPLIMENT</Text>
          <View style={s.complimentsWrap}>
            {COMPLIMENTS.map((c) => {
              const active = compliments.includes(c.key);
              return (
                <TouchableOpacity key={c.key} style={[s.complimentChip, active && s.complimentChipActive]} onPress={() => toggleCompliment(c.key)}>
                  <Text style={[s.complimentText, active && { color: "#fff" }]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={s.tipCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="cash-outline" size={16} color={C.primary} />
            <Text style={s.tipTitle}>Ajouter un pourboire</Text>
          </View>
          <Text style={s.tipSub}>Reconnaître un service d'excellence.</Text>
          <View style={s.tipRow}>
            {TIPS.map((v) => (
              <TouchableOpacity key={v} style={[s.tipChip, tip === v && s.tipChipActive]} onPress={() => setTip(v)}>
                <Text style={[s.tipChipText, tip === v && { color: "#fff" }]}>{v},00 EC</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[s.tipChip, tip === 0 && s.tipChipActive]} onPress={() => setTip(0)}>
              <Text style={[s.tipChipText, tip === 0 && { color: "#fff" }]}>Pas cette fois</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.commentBox}>
          <Text style={s.complimentLabel}>LAISSER UN MOT SYMPA (FACULTATIF)</Text>
          <TextInput
            style={s.commentInput}
            placeholder="Ex: Trajet très fluide, merci !"
            placeholderTextColor={C.textMut}
            value={comment}
            onChangeText={setComment}
            multiline
          />
        </View>

        <TouchableOpacity style={[s.ctaBtn, sending && { opacity: 0.7 }]} onPress={submit} disabled={sending || done}>
          {sending ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={s.ctaText}>{done ? "Merci !" : "Envoyer mon avis et terminer"}</Text>
              {!done && <Ionicons name="arrow-forward" size={18} color="#fff" />}
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function mkS(C: typeof LIGHT) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.iconBtnBg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.iconBtnBord },
  title: { fontFamily: "NexaBold", fontSize: 16, color: C.text },

  successIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", elevation: 4, shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 14 },
  successLabel: { fontFamily: "NexaBold", fontSize: 10, color: C.primary, letterSpacing: 1, marginTop: 10 },
  successTitle: { fontFamily: "NexaBold", fontSize: 20, color: C.text, marginTop: 4 },
  successSub: { fontFamily: "NexaLight", fontSize: 12, color: C.textSub, marginTop: 2 },

  tripCard: { backgroundColor: C.glass, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.glassBord, gap: 12 },
  tripRow: { flexDirection: "row" },
  tripAddr: { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  tripStatsRow: { flexDirection: "row", gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.glassBord },
  tripStat: { flex: 1, backgroundColor: C.canvas, borderRadius: 14, padding: 10 },
  tripStatLabel: { fontFamily: "NexaLight", fontSize: 10, color: C.textMut },
  tripStatValue: { fontFamily: "NexaBold", fontSize: 14, color: C.text, marginTop: 2 },
  tripPayRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tripPrice: { fontFamily: "NexaBold", fontSize: 20, color: C.text, marginTop: 2 },

  reviewCard: { backgroundColor: C.glass, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.glassBord },
  driverAvatarWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.canvas, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  driverName: { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  driverCar: { fontFamily: "NexaLight", fontSize: 10.5, color: C.textMut, marginTop: 2 },
  reviewQuestion: { fontFamily: "NexaBold", fontSize: 13, color: C.text, marginTop: 16, textAlign: "center" },
  starsRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 10 },
  starsHint: { fontFamily: "NexaBold", fontSize: 12, color: C.primary, textAlign: "center", marginTop: 8 },

  complimentLabel: { fontFamily: "NexaBold", fontSize: 9.5, color: C.textMut, letterSpacing: 0.5, marginTop: 18, marginBottom: 8 },
  complimentsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  complimentChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: C.canvas, borderWidth: 1, borderColor: C.glassBord },
  complimentChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  complimentText: { fontFamily: "NexaBold", fontSize: 11.5, color: C.text },

  tipCard: { backgroundColor: C.glass, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.glassBord },
  tipTitle: { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  tipSub: { fontFamily: "NexaLight", fontSize: 11, color: C.textSub, marginTop: 2 },
  tipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  tipChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: C.canvas, borderWidth: 1, borderColor: C.glassBord },
  tipChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  tipChipText: { fontFamily: "NexaBold", fontSize: 12, color: C.text },

  commentBox: { backgroundColor: C.glass, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.glassBord },
  commentInput: { fontFamily: "NexaLight", fontSize: 13, color: C.text, minHeight: 60, textAlignVertical: "top" },

  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    height: 56, borderRadius: 28, backgroundColor: C.primary,
    elevation: 5, shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 14,
  },
  ctaText: { fontFamily: "NexaBold", fontSize: 14, color: "#fff" },
}); }
