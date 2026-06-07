import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { Colors } from "@/constants/theme";
import { useSendUserSOSMutation } from "@/services/authService";

function useTheme() {
  const isDark = useColorScheme() === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

const R = {
  deep:   "#7F1D1D",
  mid:    "#991B1B",
  bright: "#DC2626",
  orange: "#F97316",
  yellow: "#EAB308",
  white:  "#FFFFFF",
};

const SECURITY_OPTIONS = [
  {
    type: "suspect" as const,
    icon: "eye-outline" as const,
    label: "Suspect",
    sub: "Je remarque quelque chose d'anormal",
    color: R.orange,
    bg: "rgba(249,115,22,0.10)",
    bgDark: "rgba(249,115,22,0.16)",
  },
  {
    type: "urgence" as const,
    icon: "alert-circle-outline" as const,
    label: "Urgence",
    sub: "Problème sérieux — j'ai besoin d'aide",
    color: R.bright,
    bg: "rgba(220,38,38,0.10)",
    bgDark: "rgba(220,38,38,0.16)",
  },
  {
    type: "secours" as const,
    icon: "megaphone-outline" as const,
    label: "Au secours",
    sub: "Cas grave — intervention immédiate requise",
    color: R.deep,
    bg: "rgba(127,29,29,0.10)",
    bgDark: "rgba(127,29,29,0.20)",
  },
];

const HEALTH_SUBTYPES = [
  { key: "ebola" as const,       icon: "bug-outline" as const,          label: "Ebola",                  color: R.bright },
  { key: "cas_suspect" as const, icon: "warning-outline" as const,      label: "Cas suspect de maladie", color: R.orange },
  { key: "autre" as const,       icon: "medkit-outline" as const,       label: "Autre urgence médicale", color: "#7C3AED" },
];

export default function BimSOSScreen() {
  const router = useRouter();
  const { isDark, t } = useTheme();
  const [sendUserSOS, { isLoading }] = useSendUserSOSMutation();

  const [tab, setTab] = useState<"securite" | "sante">("securite");
  const [healthSubType, setHealthSubType] = useState<"ebola" | "cas_suspect" | "autre" | null>(null);
  const [caseLocation, setCaseLocation] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [sending, setSending] = useState(false);

  /* ── Header shrink (same as profile) ── */
  const scrollAnim  = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollAnim.interpolate({ inputRange: [0, 80], outputRange: [200, 120], extrapolate: "clamp" });
  const badgeScale   = scrollAnim.interpolate({ inputRange: [0, 80], outputRange: [1,   0.65], extrapolate: "clamp" });
  const badgeTop     = scrollAnim.interpolate({ inputRange: [0, 80], outputRange: [118, 72],   extrapolate: "clamp" });
  const subtitleOp   = scrollAnim.interpolate({ inputRange: [0, 50], outputRange: [1,   0],    extrapolate: "clamp" });

  /* ── GPS ── */
  const getPosition = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return { latitude: null, longitude: null };
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch {
      return { latitude: null, longitude: null };
    }
  };

  /* ── Sécurité ── */
  const handleSecurite = (type: "suspect" | "urgence" | "secours") => {
    const LABELS: Record<string, string> = {
      suspect: "Suspect",
      urgence: "Urgence",
      secours: "Au secours",
    };
    Alert.alert(
      "Confirmer l'alerte SOS",
      `Envoyer une alerte "${LABELS[type]}" à BIM NEXT ?\nVotre position GPS sera jointe.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Envoyer",
          style: "destructive",
          onPress: async () => {
            setSending(true);
            const { latitude, longitude } = await getPosition();
            try {
              await sendUserSOS({ category: "securite", type, latitude, longitude }).unwrap();
              setSending(false);
              Alert.alert("✅ Alerte envoyée", "BIM NEXT a été notifié. Restez en sécurité.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch {
              setSending(false);
              Alert.alert("Erreur", "Impossible d'envoyer l'alerte SOS.");
            }
          },
        },
      ]
    );
  };

  /* ── Santé ── */
  const handleSante = async () => {
    if (!healthSubType) {
      Alert.alert("Type requis", "Veuillez sélectionner le type d'urgence médicale.");
      return;
    }
    if (!caseLocation.trim() && !contactPhone.trim()) {
      Alert.alert("Information requise", "Veuillez indiquer la localisation du cas ou votre numéro de contact.");
      return;
    }
    Alert.alert(
      "Confirmer l'alerte sanitaire",
      "Envoyer cette alerte SOS Santé à BIM NEXT ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Envoyer",
          style: "destructive",
          onPress: async () => {
            setSending(true);
            const { latitude, longitude } = await getPosition();
            try {
              await sendUserSOS({
                category: "sante",
                type: "sante",
                subType: healthSubType,
                caseLocation: caseLocation.trim() || null,
                contactPhone: contactPhone.trim() || null,
                latitude,
                longitude,
              }).unwrap();
              setSending(false);
              Alert.alert("✅ Alerte envoyée", "BIM NEXT a été notifié et va intervenir rapidement.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch {
              setSending(false);
              Alert.alert("Erreur", "Impossible d'envoyer l'alerte.");
            }
          },
        },
      ]
    );
  };

  const bg      = isDark ? t.background : "#FFF8F8";
  const card    = isDark ? t.card       : R.white;
  const textClr = isDark ? t.text       : "#1A0000";
  const subClr  = isDark ? t.textSecondary : "#6B7280";

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="light-content" />

      <View style={[s.root, { backgroundColor: bg }]}>

        {/* ══ ANIMATED HEADER ══ */}
        <Animated.View style={[s.header, { height: headerHeight }]}>
          <LinearGradient
            colors={[R.deep, R.bright]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Décors */}
          <View style={s.deco1} />
          <View style={s.deco2} />

          {/* TopBar */}
          <View style={s.topBar}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={R.white} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>BIM SOS</Text>
            <View style={s.iconBtn}>
              <Ionicons name="shield-checkmark" size={22} color="rgba(255,255,255,0.7)" />
            </View>
          </View>
        </Animated.View>

        {/* ══ FLOATING SOS BADGE ══ */}
        <Animated.View style={[s.badgeOuter, { top: badgeTop, transform: [{ scale: badgeScale }] }]}>
          <View style={s.badgeRing}>
            <Ionicons name="warning" size={40} color={R.white} />
          </View>
          <Animated.Text style={[s.badgeTitle, { opacity: subtitleOp }]}>Urgences & Santé</Animated.Text>
          <Animated.Text style={[s.badgeSub,   { opacity: subtitleOp }]}>
            BIM NEXT intervient immédiatement
          </Animated.Text>
        </Animated.View>

        {/* ══ SCROLL CONTENT ══ */}
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[s.scrollContent]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollAnim } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {/* ── Tabs ── */}
          <View style={[s.tabRow, {
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(220,38,38,0.06)",
            borderColor:     isDark ? "rgba(220,38,38,0.25)"  : "rgba(220,38,38,0.18)",
          }]}>
            {/* Sécurité tab */}
            <TouchableOpacity
              style={[s.tab, tab === "securite" && { backgroundColor: R.bright }]}
              onPress={() => setTab("securite")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="shield-checkmark"
                size={16}
                color={tab === "securite" ? R.white : subClr}
              />
              <Text style={[s.tabTxt, { color: tab === "securite" ? R.white : subClr }]}>
                Sécurité
              </Text>
            </TouchableOpacity>

            {/* Santé tab */}
            <TouchableOpacity
              style={[s.tab, tab === "sante" && { backgroundColor: "#7C3AED" }]}
              onPress={() => setTab("sante")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="heart-circle"
                size={16}
                color={tab === "sante" ? R.white : subClr}
              />
              <Text style={[s.tabTxt, { color: tab === "sante" ? R.white : subClr }]}>
                Santé
              </Text>
            </TouchableOpacity>
          </View>

          {/* ══ SOS SÉCURITÉ ══ */}
          {tab === "securite" && (
            <View>
              <Text style={[s.sectionDesc, { color: subClr }]}>
                Appuyez sur un bouton pour envoyer une alerte immédiate. Votre position GPS est jointe automatiquement.
              </Text>

              {SECURITY_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.type}
                  style={[s.sosCard, {
                    borderColor:     opt.color,
                    backgroundColor: isDark ? opt.bgDark : opt.bg,
                  }]}
                  onPress={() => handleSecurite(opt.type)}
                  disabled={isLoading}
                  activeOpacity={0.82}
                >
                  <View style={[s.sosCardIcon, { backgroundColor: opt.color + "22" }]}>
                    <Ionicons name={opt.icon} size={24} color={opt.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.sosCardLabel, { color: opt.color }]}>{opt.label}</Text>
                    <Text style={[s.sosCardSub,   { color: subClr }]}>{opt.sub}</Text>
                  </View>
                  <Ionicons name="send" size={18} color={opt.color} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ══ SOS SANTÉ ══ */}
          {tab === "sante" && (
            <View>
              <Text style={[s.sectionDesc, { color: subClr }]}>
                Signalez une urgence médicale. BIM NEXT contactera les autorités sanitaires et interviendra rapidement.
              </Text>

              {/* Type de cas */}
              <Text style={[s.fieldLabel, { color: textClr }]}>Type d'urgence médicale</Text>
              {HEALTH_SUBTYPES.map(h => (
                <TouchableOpacity
                  key={h.key}
                  style={[s.healthOption, {
                    borderColor:     healthSubType === h.key ? h.color : (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.09)"),
                    borderWidth:     healthSubType === h.key ? 2 : 1,
                    backgroundColor: healthSubType === h.key
                      ? h.color + (isDark ? "28" : "12")
                      : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"),
                  }]}
                  onPress={() => setHealthSubType(h.key)}
                  activeOpacity={0.82}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                    <View style={[s.healthIcon, { backgroundColor: h.color + "20" }]}>
                      <Ionicons name={h.icon} size={20} color={h.color} />
                    </View>
                    <Text style={[s.healthOptionLabel, { color: healthSubType === h.key ? h.color : textClr }]}>
                      {h.label}
                    </Text>
                  </View>
                  {healthSubType === h.key && (
                    <Ionicons name="checkmark-circle" size={22} color={h.color} />
                  )}
                </TouchableOpacity>
              ))}

              {/* Localisation */}
              <Text style={[s.fieldLabel, { color: textClr, marginTop: 20 }]}>
                Localisation du cas
                <Text style={{ color: subClr, fontWeight: "400", textTransform: "none", letterSpacing: 0 }}>
                  {" "}(où vous êtes ou où se trouve le cas)
                </Text>
              </Text>
              <View style={[s.inputBox, {
                borderColor:     isDark ? "rgba(220,38,38,0.35)" : "rgba(220,38,38,0.28)",
                backgroundColor: isDark ? "rgba(220,38,38,0.07)" : "rgba(220,38,38,0.04)",
              }]}>
                <Ionicons name="location-outline" size={18} color={R.bright} />
                <TextInput
                  style={[s.input, { color: textClr }]}
                  value={caseLocation}
                  onChangeText={setCaseLocation}
                  placeholder="Ex : Quartier Sébénikoro, Bamako…"
                  placeholderTextColor={subClr}
                  multiline
                />
              </View>

              {/* Téléphone */}
              <Text style={[s.fieldLabel, { color: textClr, marginTop: 14 }]}>
                Numéro de contact
                <Text style={{ color: subClr, fontWeight: "400", textTransform: "none", letterSpacing: 0 }}>
                  {" "}(pour vous joindre rapidement)
                </Text>
              </Text>
              <View style={[s.inputBox, {
                borderColor:     isDark ? "rgba(220,38,38,0.35)" : "rgba(220,38,38,0.28)",
                backgroundColor: isDark ? "rgba(220,38,38,0.07)" : "rgba(220,38,38,0.04)",
              }]}>
                <Ionicons name="call-outline" size={18} color={R.bright} />
                <TextInput
                  style={[s.input, { color: textClr }]}
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  placeholder="Ex : +223 70 00 00 00"
                  placeholderTextColor={subClr}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[s.submitBtn, isLoading && { opacity: 0.6 }]}
                onPress={handleSante}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[R.deep, R.bright]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.submitGradient}
                >
                  <Ionicons name="heart-circle" size={20} color={R.white} />
                  <Text style={s.submitTxt}>
                    {isLoading ? "Envoi en cours…" : "Envoyer l'alerte sanitaire"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Info footer */}
          <View style={[s.infoBox, {
            borderColor:     isDark ? "rgba(220,38,38,0.22)" : "rgba(220,38,38,0.18)",
            backgroundColor: isDark ? "rgba(220,38,38,0.07)" : "rgba(220,38,38,0.04)",
          }]}>
            <Ionicons name="information-circle-outline" size={16} color={R.bright} />
            <Text style={[s.infoTxt, { color: subClr }]}>
              BIM NEXT reçoit votre alerte en temps réel et peut vous localiser ou vous contacter immédiatement.
            </Text>
          </View>

          <View style={{ height: 48 }} />
        </Animated.ScrollView>

        {/* ── Loader overlay pendant l'envoi ── */}
        <Modal visible={sending} transparent animationType="fade">
          <View style={s.loaderOverlay}>
            <View style={s.loaderBox}>
              <ActivityIndicator size="large" color={R.bright} />
              <Text style={s.loaderTxt}>Envoi en cours…</Text>
            </View>
          </View>
        </Modal>

      </View>
    </KeyboardAvoidingView>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1 },

  /* Header */
  header: {
    width: "100%",
    overflow: "hidden",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 12,
    shadowColor: "#7F1D1D",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  deco1: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    top: -60, right: -50,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  deco2: {
    position: "absolute", width: 140, height: 140, borderRadius: 70,
    bottom: -30, left: -20,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  topBar: {
    marginTop: Platform.OS === "ios" ? 48 : 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: "#FFFFFF", fontSize: 18,
    fontFamily: "NexaLight", letterSpacing: 0.4, fontWeight: "700",
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },

  /* Floating badge */
  badgeOuter: {
    position: "absolute", left: 0, right: 0,
    alignItems: "center", zIndex: 10,
  },
  badgeRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#DC2626",
    alignItems: "center", justifyContent: "center",
    borderWidth: 4, borderColor: "#FFF",
    elevation: 10,
    shadowColor: "#DC2626", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 12,
  },
  badgeTitle: {
    marginTop: 8, fontSize: 15,
    fontFamily: "NexaLight", fontWeight: "700",
    color: "#1A0000",
    letterSpacing: 0.2,
  },
  badgeSub: {
    fontSize: 11, marginTop: 2,
    fontFamily: "NexaLight", color: "#6B7280",
  },

  /* Scroll */
  scrollContent: { paddingTop: 150, paddingHorizontal: 16 },

  /* Tabs */
  tabRow: {
    flexDirection: "row",
    borderRadius: 16, borderWidth: 1,
    padding: 4, marginBottom: 20,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 12,
  },
  tabTxt: { fontFamily: "NexaLight", fontSize: 13, fontWeight: "700" },

  /* Section desc */
  sectionDesc: {
    fontSize: 12, fontFamily: "NexaLight", lineHeight: 18, marginBottom: 16,
  },

  /* Sécurité cards */
  sosCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderWidth: 1.5, borderRadius: 20,
    padding: 16, marginBottom: 12,
  },
  sosCardIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  sosCardLabel: { fontSize: 16, fontFamily: "NexaLight", fontWeight: "700", marginBottom: 3 },
  sosCardSub:   { fontSize: 12, fontFamily: "NexaLight" },

  /* Santé options */
  fieldLabel: {
    fontSize: 11, fontFamily: "NexaLight", fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10,
  },
  healthOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 16, padding: 14, marginBottom: 8,
  },
  healthIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  healthOptionLabel: { fontSize: 14, fontFamily: "NexaLight", fontWeight: "600" },

  /* Input */
  inputBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: 12, minHeight: 50,
  },
  input: { flex: 1, fontSize: 13, fontFamily: "NexaLight" },

  /* Submit */
  submitBtn: { marginTop: 22, borderRadius: 18, overflow: "hidden" },
  submitGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16,
  },
  submitTxt: { color: "#FFF", fontSize: 15, fontFamily: "NexaLight", fontWeight: "700" },

  /* Info box */
  infoBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    borderWidth: 1, borderRadius: 14,
    padding: 14, marginTop: 24,
  },
  infoTxt: { flex: 1, fontSize: 11, fontFamily: "NexaLight", lineHeight: 16 },

  loaderOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center", justifyContent: "center",
  },
  loaderBox: {
    backgroundColor: "#FFF", borderRadius: 20,
    paddingVertical: 28, paddingHorizontal: 36,
    alignItems: "center", gap: 14,
    elevation: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 12,
  },
  loaderTxt: {
    fontSize: 14, fontFamily: "NexaLight", fontWeight: "700", color: "#1A0000",
  },
});
