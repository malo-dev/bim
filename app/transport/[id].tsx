import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import axios from "axios";
import { useAppTheme } from "@/app/_layout";
import { API_URL_BASE } from "@/constants/api";
import LiveMap from "@/components/transport/LiveMap";
import { useGetTiersQuery, useEstimateRideMutation } from "@/services/rideService";

/* ─── Palette "Luminous Precision Ride" adaptée au thème BIM NEXT ───────── */
const LIGHT = {
  bg: "#F8FAFC", canvas: "#EEF2F8",
  primary: "#0062FF", primaryDeep: "#004ECC", secondary: "#00D2FF",
  text: "#0F172A", textSub: "#475569", textMut: "#64748B",
  glass: "rgba(255,255,255,0.85)", glassBord: "rgba(255,255,255,0.7)",
  chipBg: "rgba(255,255,255,0.75)", white: "#FFFFFF",
  success: "#10B981",
  // Fond des boutons ronds (retour, icônes) sur fond uni — teinté, pas translucide,
  // pour rester visible même hors de la carte (contrairement à `glass`/`chipBg`).
  iconBtnBg: "rgba(0,98,255,0.08)", iconBtnBord: "rgba(0,98,255,0.15)",
};
const DARK: typeof LIGHT = {
  bg: "#0B1220", canvas: "#0F1A2E",
  primary: "#3D7DFF", primaryDeep: "#0062FF", secondary: "#22D3EE",
  text: "#EAF0FF", textSub: "#A3B4D0", textMut: "#6B7A99",
  glass: "rgba(26,37,64,0.85)", glassBord: "rgba(31,42,68,0.9)",
  chipBg: "rgba(26,37,64,0.75)", white: "#FFFFFF",
  success: "#34D399",
  iconBtnBg: "rgba(61,125,255,0.14)", iconBtnBord: "rgba(61,125,255,0.22)",
};

// Visuels uniquement (le backend ne stocke pas d'image par gamme) — le reste
// (nom, prix de base, places, ETA) vient de /ride-tiers, éditable en admin.
const TIER_IMG: Record<string, string> = {
  eco:     "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&q=80",
  confort: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80",
  green:   "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&q=80",
  van:     "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&q=80",
  moto:    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80",
};

const QUICK_DESTS = [
  { label: "Maison", icon: "home-outline", value: "Domicile" },
  { label: "Bureau", icon: "briefcase-outline", value: "Bureau" },
  { label: "Aéroport", icon: "airplane-outline", value: "Aéroport" },
];

export default function TransportBookingScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router = useRouter();

  const [destination, setDestination] = useState("");
  const [selectedTier, setSelectedTier] = useState("eco");
  const [requestedSeats, setRequestedSeats] = useState(1);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [suggestions, setSuggestions] = useState<{ placeId: string; description: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const skipNextGeocode = useRef(false);
  const destInputRef = useRef<TextInput>(null);
  const { data: tiersData, isLoading: loadingTiers, isError: tiersError, refetch: refetchTiers } = useGetTiersQuery(undefined);
  const allServices = tiersData?.data ?? [];
  const [estimateRide] = useEstimateRideMutation();
  const [tierPrices, setTierPrices] = useState<Record<string, number>>({});
  // Seuls les véhicules ayant assez de places pour le nombre demandé sont
  // proposés — le prix affiché correspond donc déjà automatiquement au
  // nombre de places choisi (chaque gamme a son propre tarif en base).
  const services = allServices.filter((svc: any) => (svc.seats ?? 4) >= requestedSeats);

  useEffect(() => {
    if (services.length > 0 && !services.some((svc: any) => svc.tierKey === selectedTier)) {
      setSelectedTier(services[0].tierKey);
    }
  }, [requestedSeats, allServices.length]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const pos = await Location.getCurrentPositionAsync({});
        setPickupCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {}
    })();
  }, []);

  // Suggestions d'adresses pendant la saisie — l'utilisateur peut choisir
  // dans la liste proposée, ou continuer à taper librement si son adresse
  // n'y figure pas (le géocodage ci-dessous prend alors le relais).
  useEffect(() => {
    if (destination.trim().length < 3) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_URL_BASE}/transport/autocomplete`, {
          params: { input: destination.trim() },
        });
        setSuggestions(res.data?.data || []);
      } catch {
        setSuggestions([]);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [destination]);

  const handleSelectSuggestion = async (s: { placeId: string; description: string }) => {
    skipNextGeocode.current = true;
    setDestination(s.description);
    setSuggestions([]);
    setShowSuggestions(false);
    setGeocoding(true);
    try {
      const res = await axios.get(`${API_URL_BASE}/transport/place-details`, {
        params: { placeId: s.placeId },
      });
      setDestCoords({ lat: res.data.data.lat, lng: res.data.data.lng });
    } catch {
      setDestCoords(null);
    } finally {
      setGeocoding(false);
    }
  };

  // Géocodage de la destination tapée librement (sans passer par une
  // suggestion) — sans ça, le pin destination (et donc la vraie distance) ne
  // peut jamais apparaître sur la carte. Debounce pour ne pas spammer l'API
  // à chaque lettre. Sauté juste après le choix d'une suggestion : on a déjà
  // les coordonnées exactes via /place-details, pas besoin de re-géocoder.
  useEffect(() => {
    if (skipNextGeocode.current) { skipNextGeocode.current = false; return; }
    if (destination.trim().length < 3) { setDestCoords(null); return; }
    const timer = setTimeout(async () => {
      setGeocoding(true);
      try {
        const res = await axios.get(`${API_URL_BASE}/transport/geocode`, {
          params: { address: destination.trim() },
        });
        setDestCoords({ lat: res.data.data.lat, lng: res.data.data.lng });
      } catch {
        setDestCoords(null);
      } finally {
        setGeocoding(false);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [destination]);

  // Prix réel par gamme dès qu'une destination est saisie — remplace
  // l'ancien affichage statique du tarif de base (supprimé, voir migration
  // 20261021000001 : il n'y a plus de frais fixe, seulement un prix/km).
  useEffect(() => {
    if (destination.trim().length < 3) { setTierPrices({}); return; }
    const timer = setTimeout(async () => {
      try {
        const res: any = await estimateRide({
          pickupAddress: "Votre position actuelle",
          destinationAddress: destination.trim(),
          pickupLat: pickupCoords?.lat, pickupLng: pickupCoords?.lng,
          destinationLat: destCoords?.lat, destinationLng: destCoords?.lng,
        }).unwrap();
        const map: Record<string, number> = {};
        for (const t of res.data?.tiers ?? []) map[t.tier] = t.price;
        setTierPrices(map);
      } catch {
        setTierPrices({});
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [destination, pickupCoords, destCoords]);

  const goToTiersWith = (tierKey: string) => {
    if (!destination.trim()) return;
    router.push({
      pathname: "/transport/choix-gamme",
      params: {
        pickup: "Votre position actuelle",
        destLat: destCoords ? String(destCoords.lat) : undefined,
        destLng: destCoords ? String(destCoords.lng) : undefined,
        pickupLat: pickupCoords ? String(pickupCoords.lat) : undefined,
        pickupLng: pickupCoords ? String(pickupCoords.lng) : undefined,
        destination: destination.trim(),
        tier: tierKey,
      },
    } as any);
  };
  const goToTiers = () => goToTiersWith(selectedTier);

  // Tap sur un véhicule de la liste : le sélectionne, et si l'adresse est déjà
  // écrite, enchaîne directement sur sa fiche (estimation + présentation +
  // commande) au lieu de se contenter de le surligner. Sinon, on ramène le
  // focus sur le champ adresse pour guider l'étape suivante.
  const handleTierPress = (tierKey: string) => {
    setSelectedTier(tierKey);
    if (destination.trim()) {
      goToTiersWith(tierKey);
    } else {
      destInputRef.current?.focus();
    }
  };

  return (
    <View style={[s.screen]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.brand}>BIM Transport</Text>
            <Text style={s.brandSub}>Comme un Uber, en EC</Text>
          </View>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/transport/historique" as any)}>
            <Ionicons name="time-outline" size={18} color={C.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ── Carte en direct (position GPS réelle si autorisée) ── */}
        <View style={s.mapWrap}>
          {pickupCoords ? (
            <LiveMap
              style={StyleSheet.absoluteFill}
              pickupLat={pickupCoords.lat}
              pickupLng={pickupCoords.lng}
              destLat={destCoords?.lat}
              destLng={destCoords?.lng}
            />
          ) : (
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=900&q=70" }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          )}
          <View style={s.mapOverlay} pointerEvents="none" />
          <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={s.youAreHere}>
            <View style={s.youAreHereDot} />
            <Text style={s.youAreHereText}>Vous êtes ici</Text>
          </BlurView>
          <View style={s.mapChipsRow}>
            <BlurView intensity={50} tint={isDark ? "dark" : "light"} style={s.mapChip}>
              <Ionicons name="flash-outline" size={12} color={C.primary} />
              <Text style={s.mapChipText}>100% flotte électrique</Text>
            </BlurView>
            <BlurView intensity={50} tint={isDark ? "dark" : "light"} style={s.mapChip}>
              <View style={[s.dot, { backgroundColor: C.success }]} />
              <Text style={s.mapChipText}>Trafic fluide</Text>
            </BlurView>
          </View>
        </View>

        <View style={s.body}>
          <Text style={s.greeting}>Bonjour 👋</Text>
          <Text style={s.greetingSub}>Prêt pour votre prochain trajet urbain ?</Text>

          {/* ── Recherche destination ── */}
          <View>
            <View style={s.searchRow}>
              <View style={s.searchIconWrap}>
                <Ionicons name="search" size={16} color="#fff" />
              </View>
              <TextInput
                ref={destInputRef}
                style={s.searchInput}
                placeholder="Où allez-vous ?"
                placeholderTextColor={C.textMut}
                value={destination}
                onChangeText={setDestination}
                onFocus={() => setShowSuggestions(true)}
                returnKeyType="search"
                onSubmitEditing={() => { setShowSuggestions(false); goToTiers(); }}
              />
              {geocoding && <ActivityIndicator size="small" color={C.primary} style={{ marginRight: 14 }} />}
              {!geocoding && destCoords && (
                <Ionicons name="checkmark-circle" size={18} color={C.success} style={{ marginRight: 14 }} />
              )}
            </View>

            {showSuggestions && suggestions.length > 0 && (
              <View style={s.suggestBox}>
                {suggestions.map((sug) => (
                  <TouchableOpacity
                    key={sug.placeId}
                    style={s.suggestRow}
                    onPress={() => handleSelectSuggestion(sug)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location-outline" size={15} color={C.textMut} />
                    <Text style={s.suggestText} numberOfLines={1}>{sug.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 14 }}>
            {QUICK_DESTS.map((d) => (
              <TouchableOpacity key={d.label} style={s.quickChip} onPress={() => setDestination(d.value)} activeOpacity={0.85}>
                <Ionicons name={d.icon as any} size={15} color={C.text} />
                <Text style={s.quickChipText}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Nombre de places — filtre les véhicules proposés et donc le prix affiché ── */}
          <View style={s.seatsRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="people-outline" size={16} color={C.textSub} />
              <Text style={s.seatsLabel}>Nombre de places</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <TouchableOpacity
                style={s.seatsBtn}
                onPress={() => setRequestedSeats((n) => Math.max(1, n - 1))}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={16} color={C.primary} />
              </TouchableOpacity>
              <Text style={s.seatsValue}>{requestedSeats}</Text>
              <TouchableOpacity
                style={s.seatsBtn}
                onPress={() => setRequestedSeats((n) => Math.min(7, n + 1))}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color={C.primary} />
              </TouchableOpacity>
            </View>
          </View>
          {services.length === 0 && (
            <Text style={s.seatsWarning}>Aucun véhicule disponible pour {requestedSeats} place{requestedSeats > 1 ? "s" : ""}.</Text>
          )}

          {/* ── Bannière BIM PASS ── */}
          <View style={s.promoBanner}>
            <View style={s.promoIconWrap}>
              <Ionicons name="pricetag" size={18} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.promoTitle}>BIM PASS CLUB <Text style={{ color: C.primary }}>-20%</Text></Text>
              <Text style={s.promoSub}>Réduction active sur vos 5 prochaines courses</Text>
            </View>
          </View>

          {/* ── Services ── */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Services Bim</Text>
            <Text style={s.sectionMeta}>{services.length} options instantanées</Text>
          </View>

          {loadingTiers ? (
            <View style={s.tiersStateBox}>
              <ActivityIndicator size="small" color={C.primary} />
            </View>
          ) : tiersError || services.length === 0 ? (
            <View style={s.tiersStateBox}>
              <Ionicons name="alert-circle-outline" size={22} color={C.textMut} />
              <Text style={s.tiersStateText}>
                {tiersError ? "Impossible de charger les véhicules." : "Aucun véhicule disponible pour le moment."}
              </Text>
              <TouchableOpacity style={s.tiersRetryBtn} onPress={() => refetchTiers()} activeOpacity={0.85}>
                <Ionicons name="refresh" size={14} color={C.primary} />
                <Text style={s.tiersRetryText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.servicesGrid}>
              {services.map((svc: any) => {
                const active = selectedTier === svc.tierKey;
                return (
                  <TouchableOpacity
                    key={svc.tierKey}
                    style={[s.serviceCard, active && s.serviceCardActive]}
                    onPress={() => handleTierPress(svc.tierKey)}
                    activeOpacity={0.9}
                  >
                    <View style={s.serviceImgWrap}>
                      <Image
                        source={{ uri: svc.imageUrl ? `${API_URL_BASE}${svc.imageUrl}` : (TIER_IMG[svc.tierKey] ?? TIER_IMG.eco) }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                      />
                      <View style={s.serviceBadge}><Text style={s.serviceBadgeText}>{svc.etaMin} min</Text></View>
                    </View>
                    <View style={{ padding: 12 }}>
                      <Text style={s.serviceTitle} numberOfLines={1}>{svc.label}</Text>
                      <Text style={s.serviceSub} numberOfLines={1}>{svc.seats} place{svc.seats > 1 ? "s" : ""}</Text>
                      <Text style={s.servicePrice}>
                        {tierPrices[svc.tierKey] != null
                          ? `${tierPrices[svc.tierKey].toFixed(2)} EC`
                          : `${Number(svc.perKm).toFixed(2)} EC/km`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={s.infoRow}>
            <View style={s.infoIconWrap}>
              <Ionicons name="shield-checkmark-outline" size={16} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.infoTitle}>Chauffeurs vérifiés</Text>
              <Text style={s.infoSub}>Notation moyenne 4.9/5 · Courses assurées</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={s.ctaWrap}>
        <TouchableOpacity style={[s.ctaBtn, !destination.trim() && { opacity: 0.5 }]} onPress={goToTiers} activeOpacity={0.88} disabled={!destination.trim()}>
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text style={s.ctaText}>Commander un {services.find((s2: any) => s2.tierKey === selectedTier)?.label ?? "véhicule"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function mkS(C: typeof LIGHT) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.iconBtnBg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.iconBtnBord },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.iconBtnBg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.iconBtnBord },
  brand: { fontFamily: "NexaBold", fontSize: 16, color: C.text },
  brandSub: { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, marginTop: 1 },

  mapWrap: { height: 230, marginHorizontal: 20, borderRadius: 28, overflow: "hidden", backgroundColor: C.canvas },
  mapOverlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(15,23,42,0.18)" },
  youAreHere: {
    position: "absolute", top: "42%", left: "50%", transform: [{ translateX: -55 }],
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.5)",
  },
  youAreHereDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  youAreHereText: { fontFamily: "NexaBold", fontSize: 11, color: "#fff" },
  mapChipsRow: { position: "absolute", bottom: 12, left: 12, right: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mapChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  mapChipText: { fontFamily: "NexaBold", fontSize: 10, color: "#fff" },
  dot: { width: 6, height: 6, borderRadius: 3 },

  body: { paddingHorizontal: 20, paddingTop: 20 },
  greeting: { fontFamily: "NexaBold", fontSize: 22, color: C.text },
  greetingSub: { fontFamily: "NexaLight", fontSize: 13, color: C.textSub, marginTop: 2 },

  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18,
    backgroundColor: C.glass, borderRadius: 20, padding: 8, paddingLeft: 8,
    borderWidth: 1, borderColor: C.glassBord,
    elevation: 3, shadowColor: C.primary, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  searchIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  searchInput: { flex: 1, fontFamily: "NexaBold", fontSize: 14, color: C.text, paddingVertical: 10 },
  suggestBox: { marginTop: 6, backgroundColor: C.glass, borderRadius: 16, borderWidth: 1, borderColor: C.glassBord, overflow: "hidden" },
  suggestRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.glassBord },
  suggestText: { flex: 1, fontFamily: "NexaLight", fontSize: 13, color: C.text },

  quickChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, height: 38, borderRadius: 19,
    backgroundColor: C.chipBg, borderWidth: 1, borderColor: C.glassBord,
  },
  quickChipText: { fontFamily: "NexaBold", fontSize: 12, color: C.text },
  seatsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.glass, borderRadius: 16, borderWidth: 1, borderColor: C.glassBord, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  seatsLabel: { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  seatsBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.iconBtnBg, borderWidth: 1, borderColor: C.iconBtnBord, alignItems: "center", justifyContent: "center" },
  seatsValue: { fontFamily: "NexaBold", fontSize: 14, color: C.text, minWidth: 16, textAlign: "center" },
  seatsWarning: { fontFamily: "NexaLight", fontSize: 12, color: C.textMut, marginBottom: 12, marginTop: -6 },

  promoBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: isLightPrimary(C) ? "rgba(0,98,255,0.08)" : "rgba(61,125,255,0.14)",
    borderRadius: 20, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: "rgba(0,98,255,0.15)",
  },
  promoIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  promoTitle: { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  promoSub: { fontFamily: "NexaLight", fontSize: 11, color: C.textSub, marginTop: 2 },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22, marginBottom: 12 },
  sectionTitle: { fontFamily: "NexaBold", fontSize: 17, color: C.text },
  sectionMeta: { fontFamily: "NexaLight", fontSize: 11, color: C.textMut },

  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tiersStateBox: { alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 28 },
  tiersStateText: { fontFamily: "NexaLight", fontSize: 13, color: C.textMut, textAlign: "center" },
  tiersRetryBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: C.primary, marginTop: 4 },
  tiersRetryText: { fontFamily: "NexaBold", fontSize: 12, color: C.primary },
  serviceCard: {
    width: "48%", borderRadius: 22, overflow: "hidden",
    backgroundColor: C.glass, borderWidth: 1.5, borderColor: "transparent",
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  serviceCardActive: { borderColor: C.primary },
  serviceImgWrap: { height: 90, backgroundColor: C.canvas },
  serviceBadge: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(15,23,42,0.55)", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  serviceBadgeText: { fontFamily: "NexaBold", fontSize: 9, color: "#fff" },
  serviceTitle: { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  serviceSub: { fontFamily: "NexaLight", fontSize: 10, color: C.textMut, marginTop: 2 },
  servicePrice: { fontFamily: "NexaBold", fontSize: 13, color: C.primary, marginTop: 6 },

  infoRow: {
    flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18,
    backgroundColor: C.glass, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: C.glassBord,
  },
  infoIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: isLightPrimary(C) ? "rgba(0,98,255,0.08)" : "rgba(61,125,255,0.14)", alignItems: "center", justifyContent: "center" },
  infoTitle: { fontFamily: "NexaBold", fontSize: 12.5, color: C.text },
  infoSub: { fontFamily: "NexaLight", fontSize: 10.5, color: C.textMut, marginTop: 1 },

  ctaWrap: { padding: 20, paddingBottom: 28, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.glassBord },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    height: 56, borderRadius: 28, backgroundColor: C.primary,
    elevation: 6, shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
  },
  ctaText: { fontFamily: "NexaBold", fontSize: 15, color: "#fff" },
}); }

function isLightPrimary(C: typeof LIGHT) { return C.primary === "#0062FF"; }
