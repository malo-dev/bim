import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/app/_layout";
import { useEstimateRideMutation, useRequestRideMutation } from "@/services/rideService";
import LiveMap from "@/components/transport/LiveMap";

const LIGHT = {
  bg: "#F8FAFC", canvas: "#EEF2F8",
  primary: "#0062FF", secondary: "#00D2FF",
  text: "#0F172A", textSub: "#475569", textMut: "#64748B",
  glass: "rgba(255,255,255,0.9)", glassBord: "rgba(255,255,255,0.7)",
  iconBtnBg: "rgba(0,98,255,0.08)", iconBtnBord: "rgba(0,98,255,0.15)",
  border: "#E2E8F0", white: "#FFFFFF", green: "#10B981",
};
const DARK: typeof LIGHT = {
  bg: "#0B1220", canvas: "#0F1A2E",
  primary: "#3D7DFF", secondary: "#22D3EE",
  text: "#EAF0FF", textSub: "#A3B4D0", textMut: "#6B7A99",
  glass: "rgba(26,37,64,0.9)", glassBord: "rgba(31,42,68,0.9)",
  iconBtnBg: "rgba(61,125,255,0.14)", iconBtnBord: "rgba(61,125,255,0.22)",
  border: "#1F2A44", white: "#FFFFFF", green: "#34D399",
};

const TIER_META: Record<string, { title: string; sub: string; img: string; badge?: string }> = {
  eco:     { title: "Bim Eco",     sub: "Le plus rapide & économique",       img: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=300&q=80", badge: "Populaire" },
  confort: { title: "Bim Confort", sub: "Berline silencieuse, chauffeur top", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300&q=80", badge: "Recommandé" },
  green:   { title: "Bim Green",   sub: "100% électrique & hybride",         img: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=300&q=80", badge: "Éco-responsable" },
  van:     { title: "Bim Van",     sub: "Spacieux, jusqu'à 6 personnes",     img: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=300&q=80" },
  moto:    { title: "Moto Express",sub: "Anti-bouchons, rapide",             img: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&q=80" },
};

export default function ChoixGammeScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router = useRouter();
  const { pickup, destination, pickupLat, pickupLng, destLat, destLng, tier: initialTier } = useLocalSearchParams<{
    pickup: string; destination: string; pickupLat?: string; pickupLng?: string; destLat?: string; destLng?: string; tier?: string;
  }>();
  const pLat = pickupLat ? parseFloat(pickupLat) : null;
  const pLng = pickupLng ? parseFloat(pickupLng) : null;
  const dLat = destLat ? parseFloat(destLat) : null;
  const dLng = destLng ? parseFloat(destLng) : null;

  const [estimateRide, { isLoading: estimating }] = useEstimateRideMutation();
  const [requestRide, { isLoading: requesting }] = useRequestRideMutation();

  const [estimate, setEstimate] = useState<{ distanceKm: number; durationMin: number; tiers: any[] } | null>(null);
  const [selectedTier, setSelectedTier] = useState(initialTier || "eco");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res: any = await estimateRide({
          pickupAddress: pickup, destinationAddress: destination,
          pickupLat: pLat, pickupLng: pLng,
          destinationLat: dLat, destinationLng: dLng,
        }).unwrap();
        setEstimate(res.data);
      } catch {
        setError("Impossible d'estimer le tarif, réessayez.");
      }
    })();
  }, [pickup, destination]);

  const selected = estimate?.tiers.find((t: any) => t.tier === selectedTier);

  const confirm = async () => {
    if (!selected) return;
    try {
      const res: any = await requestRide({
        pickupAddress: pickup,
        destinationAddress: destination,
        pickupLat: pLat, pickupLng: pLng,
        destinationLat: dLat, destinationLng: dLng,
        vehicleTier: selectedTier,
        paymentMethod: "wallet",
      }).unwrap();
      router.replace({ pathname: "/transport/choix-chauffeur", params: { rideNumber: res.data.rideNumber } } as any);
    } catch (e: any) {
      setError(e?.data?.message || "La demande de course a échoué, réessayez.");
    }
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.title}>Choisir une course</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      {/* ── Aperçu carte ── */}
      {pLat != null && pLng != null && (
        <View style={s.miniMapWrap}>
          <LiveMap style={StyleSheet.absoluteFill} pickupLat={pLat} pickupLng={pLng} destLat={dLat} destLng={dLng} />
        </View>
      )}

      {/* ── Résumé trajet ── */}
      <View style={s.routeCard}>
        <View style={s.routeRow}>
          <View style={s.routeDots}>
            <View style={[s.dot, { backgroundColor: C.primary }]} />
            <View style={s.routeLine} />
            <View style={[s.dot, { backgroundColor: C.text, borderRadius: 2 }]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.routeText} numberOfLines={1}>{pickup}</Text>
            <View style={{ height: 10 }} />
            <Text style={s.routeText} numberOfLines={1}>{destination}</Text>
          </View>
        </View>
        {estimate && (
          <View style={s.routeMetaRow}>
            <Ionicons name="flash-outline" size={13} color={C.primary} />
            <Text style={s.routeMetaText}>{estimate.durationMin} min</Text>
            <Text style={s.routeMetaDot}>•</Text>
            <Text style={s.routeMetaText}>{estimate.distanceKm} km</Text>
            <View style={s.fluideChip}><Text style={s.fluideText}>Fluide</Text></View>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={s.sheetHeader}>
          <View>
            <Text style={s.sheetTitle}>Choisissez votre course</Text>
            <Text style={s.sheetSub}>Prise en charge instantanée en 3 à 8 min</Text>
          </View>
        </View>

        {estimating ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color={C.primary} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {(estimate?.tiers ?? []).map((t: any) => {
              const meta = TIER_META[t.tier] ?? TIER_META.eco;
              const active = selectedTier === t.tier;
              return (
                <TouchableOpacity
                  key={t.tier}
                  style={[s.tierCard, active && s.tierCardActive]}
                  onPress={() => setSelectedTier(t.tier)}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: meta.img }} style={s.tierImg} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={s.tierTitle}>{meta.title}</Text>
                      {meta.badge && <View style={s.tierBadge}><Text style={s.tierBadgeText}>{meta.badge}</Text></View>}
                    </View>
                    <Text style={s.tierSub} numberOfLines={1}>{meta.sub}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <Ionicons name="time-outline" size={12} color={C.textMut} />
                      <Text style={s.tierMeta}>{t.etaMin} min</Text>
                      <Text style={s.tierMeta}>•</Text>
                      <Ionicons name="people-outline" size={12} color={C.textMut} />
                      <Text style={s.tierMeta}>{t.seats}</Text>
                    </View>
                  </View>
                  <Text style={s.tierPrice}>{t.price.toFixed(2)} EC</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {!!error && <Text style={s.errorText}>{error}</Text>}

        <View style={s.payRow}>
          <View style={s.payMethod}>
            <Ionicons name="wallet-outline" size={16} color={C.primary} />
            <Text style={s.payMethodText}>Portefeuille BIM</Text>
          </View>
          <View style={s.promoTag}>
            <Ionicons name="pricetag-outline" size={13} color={C.primary} />
            <Text style={s.promoTagText}>BIM2025 (-10%)</Text>
          </View>
        </View>
      </ScrollView>

      <View style={s.ctaWrap}>
        <TouchableOpacity style={[s.ctaBtn, (!selected || requesting) && { opacity: 0.6 }]} onPress={confirm} activeOpacity={0.88} disabled={!selected || requesting}>
          {requesting ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={s.ctaText}>Confirmer {TIER_META[selectedTier]?.title}</Text>
              <Text style={s.ctaPrice}>{selected ? `${selected.price.toFixed(2)} EC` : ""}</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={s.footerNote}>Courses vérifiées • Annulation gratuite (2 min)</Text>
      </View>
    </View>
  );
}

function mkS(C: typeof LIGHT) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.iconBtnBg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.iconBtnBord },
  title: { fontFamily: "NexaBold", fontSize: 16, color: C.text },

  miniMapWrap: { height: 140, marginHorizontal: 20, marginBottom: 12, borderRadius: 20, overflow: "hidden", backgroundColor: C.canvas },
  routeCard: { marginHorizontal: 20, backgroundColor: C.glass, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.glassBord },
  routeRow: { flexDirection: "row", gap: 12 },
  routeDots: { alignItems: "center", paddingTop: 4 },
  dot: { width: 9, height: 9, borderRadius: 4.5 },
  routeLine: { width: 1, flex: 1, backgroundColor: C.border, marginVertical: 2, minHeight: 14 },
  routeText: { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  routeMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  routeMetaText: { fontFamily: "NexaBold", fontSize: 12, color: C.text },
  routeMetaDot: { color: C.textMut },
  fluideChip: { marginLeft: "auto", backgroundColor: "rgba(16,185,129,0.12)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  fluideText: { fontFamily: "NexaBold", fontSize: 10, color: C.green },

  sheetHeader: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  sheetTitle: { fontFamily: "NexaBold", fontSize: 18, color: C.text },
  sheetSub: { fontFamily: "NexaLight", fontSize: 12, color: C.textSub, marginTop: 2 },

  tierCard: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 12,
    borderRadius: 20, backgroundColor: C.glass, borderWidth: 1.5, borderColor: "transparent",
  },
  tierCardActive: { borderColor: C.primary },
  tierImg: { width: 56, height: 56, borderRadius: 14, backgroundColor: C.canvas },
  tierTitle: { fontFamily: "NexaBold", fontSize: 14, color: C.text },
  tierBadge: { backgroundColor: "rgba(0,98,255,0.10)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  tierBadgeText: { fontFamily: "NexaBold", fontSize: 8.5, color: C.primary },
  tierSub: { fontFamily: "NexaLight", fontSize: 11, color: C.textSub, marginTop: 2 },
  tierMeta: { fontFamily: "NexaLight", fontSize: 10.5, color: C.textMut },
  tierPrice: { fontFamily: "NexaBold", fontSize: 15, color: C.text },

  errorText: { fontFamily: "NexaLight", fontSize: 12, color: "#EF4444", textAlign: "center", marginTop: 12 },

  payRow: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, marginTop: 18 },
  payMethod: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, backgroundColor: C.glass, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.glassBord },
  payMethodText: { fontFamily: "NexaBold", fontSize: 12.5, color: C.text },
  promoTag: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(0,98,255,0.08)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  promoTagText: { fontFamily: "NexaBold", fontSize: 11, color: C.primary },

  ctaWrap: { padding: 20, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.glassBord },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    height: 58, borderRadius: 29, backgroundColor: C.primary,
    elevation: 6, shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
  },
  ctaText: { fontFamily: "NexaBold", fontSize: 14, color: "#fff" },
  ctaPrice: { fontFamily: "NexaBold", fontSize: 14, color: "#fff", marginLeft: 6 },
  footerNote: { fontFamily: "NexaLight", fontSize: 10.5, color: C.textMut, textAlign: "center", marginTop: 10 },
}); }
