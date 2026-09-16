import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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

const SERVICES = [
  { tier: "eco", title: "Bim Ride", sub: "Électrique • 4 pl.", badge: "5 min", price: "12,40 EC", img: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&q=80" },
  { tier: "confort", title: "Bim Berline", sub: "Haut de gamme • 4 pl.", badge: "7 min", price: "18,90 EC", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80" },
  { tier: "moto", title: "Moto Express", sub: "Anti-bouchons • 1 pl.", badge: "3 min", price: "15,00 EC", img: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80" },
  { tier: "van", title: "Bim Van", sub: "Jusqu'à 6 pl.", badge: "8 min", price: "26,00 EC", img: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&q=80" },
];

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

  const goToTiers = () => {
    if (!destination.trim()) return;
    router.push({
      pathname: "/transport/choix-gamme",
      params: { pickup: "Votre position actuelle", destination: destination.trim(), tier: selectedTier },
    } as any);
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
        {/* ── Carte illustrative (pas de carte interactive réelle) ── */}
        <View style={s.mapWrap}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=900&q=70" }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={s.mapOverlay} />
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
          <View style={s.searchRow}>
            <View style={s.searchIconWrap}>
              <Ionicons name="search" size={16} color="#fff" />
            </View>
            <TextInput
              style={s.searchInput}
              placeholder="Où allez-vous ?"
              placeholderTextColor={C.textMut}
              value={destination}
              onChangeText={setDestination}
              returnKeyType="search"
              onSubmitEditing={goToTiers}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 14 }}>
            {QUICK_DESTS.map((d) => (
              <TouchableOpacity key={d.label} style={s.quickChip} onPress={() => setDestination(d.value)} activeOpacity={0.85}>
                <Ionicons name={d.icon as any} size={15} color={C.text} />
                <Text style={s.quickChipText}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

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
            <Text style={s.sectionMeta}>{SERVICES.length} options instantanées</Text>
          </View>

          <View style={s.servicesGrid}>
            {SERVICES.map((svc) => {
              const active = selectedTier === svc.tier;
              return (
                <TouchableOpacity
                  key={svc.tier}
                  style={[s.serviceCard, active && s.serviceCardActive]}
                  onPress={() => setSelectedTier(svc.tier)}
                  activeOpacity={0.9}
                >
                  <View style={s.serviceImgWrap}>
                    <Image source={{ uri: svc.img }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <View style={s.serviceBadge}><Text style={s.serviceBadgeText}>{svc.badge}</Text></View>
                  </View>
                  <View style={{ padding: 12 }}>
                    <Text style={s.serviceTitle} numberOfLines={1}>{svc.title}</Text>
                    <Text style={s.serviceSub} numberOfLines={1}>{svc.sub}</Text>
                    <Text style={s.servicePrice}>{svc.price}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

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
          <Text style={s.ctaText}>Commander un {SERVICES.find(s2 => s2.tier === selectedTier)?.title}</Text>
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

  quickChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, height: 38, borderRadius: 19,
    backgroundColor: C.chipBg, borderWidth: 1, borderColor: C.glassBord,
  },
  quickChipText: { fontFamily: "NexaBold", fontSize: 12, color: C.text },

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
