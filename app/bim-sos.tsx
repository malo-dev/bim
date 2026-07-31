import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSendUserSOSMutation } from "@/services/authService";
import { useAppTheme } from "@/app/_layout";

/* ─── PALETTE ─────────────────────────────────────────────────────── */
const LIGHT = {
  bg:      "#F9F9F9",
  card:    "#FFFFFF",
  text:    "#1A1C1C",
  textSec: "#434657",
  textMut: "#747688",
  border:  "rgba(196,197,218,0.30)",
  navBg:   "rgba(249,249,249,0.96)",
  inputBg: "#F3F3F4",
  primary: "#0035C5",
  blue:    "#0047FF",
  deep:    "#001257",
  white:   "#FFFFFF",
};
const DARK: typeof LIGHT = {
  bg:      "#0B1220",
  card:    "#1A2540",
  text:    "#EAF0FF",
  textSec: "#A3B4D0",
  textMut: "#6B7A99",
  border:  "rgba(31,42,68,0.80)",
  navBg:   "rgba(11,18,32,0.94)",
  inputBg: "#0F1A2E",
  primary: "#4D8DFF",
  blue:    "#4D8DFF",
  deep:    "#001257",
  white:   "#FFFFFF",
};

const SECURITY_OPTIONS = [
  {
    type:  "suspect" as const,
    icon:  "eye-outline" as const,
    label: "Suspect",
    sub:   "Je remarque quelque chose d'anormal",
    grad:  ["#0035C5", "#0047FF"] as [string, string],
  },
  {
    type:  "urgence" as const,
    icon:  "alert-circle-outline" as const,
    label: "Urgence",
    sub:   "Probleme serieux — j'ai besoin d'aide",
    grad:  ["#1D4ED8", "#3B82F6"] as [string, string],
  },
  {
    type:  "secours" as const,
    icon:  "megaphone-outline" as const,
    label: "Au secours !",
    sub:   "Cas grave — intervention immediate requise",
    grad:  ["#001257", "#0035C5"] as [string, string],
  },
];

const HEALTH_SUBTYPES = [
  { key: "ebola" as const,       icon: "bug-outline" as const,     label: "Ebola",                  color: "#0035C5" },
  { key: "cas_suspect" as const, icon: "warning-outline" as const, label: "Cas suspect de maladie", color: "#1D4ED8" },
  { key: "autre" as const,       icon: "medkit-outline" as const,  label: "Autre urgence medicale", color: "#3B82F6" },
];

/* ─── Pulsing ring ────────────────────────────────────────────────── */
function PulseRing({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0,    useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{
      position: "absolute", width: 72, height: 72, borderRadius: 36,
      borderWidth: 2, borderColor: "#0047FF",
      transform: [{ scale: anim.interpolate({ inputRange: [0,1], outputRange: [1, 2.5] }) }],
      opacity:          anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.3, 0] }),
    }} />
  );
}

/* ─── MAIN ─────────────────────────────────────────────────────────── */
export default function BimSOSScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);

  const [sendUserSOS, { isLoading }] = useSendUserSOSMutation();
  const [tab,           setTab]           = useState<"securite" | "sante">("securite");
  const [healthSubType, setHealthSubType] = useState<"ebola" | "cas_suspect" | "autre" | null>(null);
  const [caseLocation,  setCaseLocation]  = useState("");
  const [contactPhone,  setContactPhone]  = useState("");
  const [sending,       setSending]       = useState(false);

  const getPosition = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return { latitude: null, longitude: null };
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch { return { latitude: null, longitude: null }; }
  };

  const handleSecurite = (type: "suspect" | "urgence" | "secours") => {
    const LABELS: Record<string, string> = { suspect: "Suspect", urgence: "Urgence", secours: "Au secours" };
    Alert.alert("Confirmer l'alerte SOS",
      `Envoyer une alerte "${LABELS[type]}" a BIM NEXT ?\nVotre position GPS sera jointe.`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Envoyer", style: "destructive", onPress: async () => {
          setSending(true);
          const { latitude, longitude } = await getPosition();
          try {
            await sendUserSOS({ category: "securite", type, latitude, longitude }).unwrap();
            setSending(false);
            Alert.alert("Alerte envoyee", "BIM NEXT a ete notifie. Restez en securite.", [
              { text: "OK", onPress: () => router.back() },
            ]);
          } catch { setSending(false); Alert.alert("Erreur", "Impossible d'envoyer l'alerte SOS."); }
        }},
      ]
    );
  };

  const handleSante = async () => {
    if (!healthSubType) { Alert.alert("Type requis", "Veuillez selectionner le type d'urgence medicale."); return; }
    Alert.alert("Confirmer l'alerte sanitaire", "Envoyer cette alerte SOS Sante a BIM NEXT ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Envoyer", style: "destructive", onPress: async () => {
          setSending(true);
          const { latitude, longitude } = await getPosition();
          try {
            await sendUserSOS({ category: "sante", type: "sante", subType: healthSubType,
              caseLocation: caseLocation.trim() || null, contactPhone: contactPhone.trim() || null,
              latitude, longitude }).unwrap();
            setSending(false);
            Alert.alert("Alerte envoyee", "BIM NEXT va intervenir rapidement.", [
              { text: "OK", onPress: () => router.back() },
            ]);
          } catch { setSending(false); Alert.alert("Erreur", "Impossible d'envoyer l'alerte."); }
        }},
      ]
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={[s.root, { paddingTop: insets.top }]}>

        {/* ── TOP BAR ── */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <View style={s.topCenter}>
            <Text style={s.topTitle}>BIM SOS</Text>
            <Text style={s.topSub}>Service d'urgence</Text>
          </View>
          <View style={s.iconBtn}>
            <Ionicons name="shield-checkmark-outline" size={20} color={C.primary} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── HERO ── */}
          <View style={s.heroWrap}>
            {/* Pulse rings */}
            <View style={{ width: 100, height: 100, alignItems: "center", justifyContent: "center" }}>
              <PulseRing delay={0} />
              <PulseRing delay={500} />
              <PulseRing delay={1000} />
              {/* Circle with gradient */}
              <LinearGradient
                colors={[C.primary, C.blue]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.sosCircle}
              >
                <Ionicons name="shield-checkmark" size={30} color={C.white} />
              </LinearGradient>
            </View>
            <Text style={s.heroTitle}>Urgences & Sante</Text>
            <Text style={s.heroSub}>BIM NEXT intervient immediatement</Text>

            {/* GPS badge */}
            <View style={s.gpsBadge}>
              <Ionicons name="location-outline" size={12} color={C.primary} />
              <Text style={s.gpsTxt}>Position GPS automatique</Text>
            </View>
          </View>

          {/* ── TABS ── */}
          <View style={s.tabRow}>
            <TouchableOpacity
              style={[s.tabBtn, tab === "securite" && s.tabBtnActive]}
              onPress={() => setTab("securite")} activeOpacity={0.82}
            >
              <Ionicons name="shield-checkmark" size={15}
                color={tab === "securite" ? C.white : C.textMut} />
              <Text style={[s.tabTxt, { color: tab === "securite" ? C.white : C.textMut }]}>
                Securite
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tabBtn, tab === "sante" && s.tabBtnActive]}
              onPress={() => setTab("sante")} activeOpacity={0.82}
            >
              <Ionicons name="heart-circle" size={15}
                color={tab === "sante" ? C.white : C.textMut} />
              <Text style={[s.tabTxt, { color: tab === "sante" ? C.white : C.textMut }]}>
                Sante
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── SECURITE ── */}
          {tab === "securite" && (
            <View style={{ gap: 12 }}>
              <Text style={s.hint}>
                Appuyez sur un bouton pour envoyer une alerte immediate avec votre position GPS.
              </Text>
              {SECURITY_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.type} onPress={() => handleSecurite(opt.type)}
                  disabled={isLoading} activeOpacity={0.88}>
                  <LinearGradient
                    colors={opt.grad}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.sosCard}
                  >
                    <View style={s.sosIcon}>
                      <Ionicons name={opt.icon} size={24} color={C.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.sosLabel}>{opt.label}</Text>
                      <Text style={s.sosSub}>{opt.sub}</Text>
                    </View>
                    <View style={s.sendBadge}>
                      <Ionicons name="send" size={13} color={C.white} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── SANTE ── */}
          {tab === "sante" && (
            <View style={{ gap: 0 }}>
              <Text style={s.hint}>
                Signalez une urgence medicale. BIM NEXT contactera les autorites et interviendra rapidement.
              </Text>

              <Text style={s.fieldLabel}>Type d'urgence medicale</Text>
              <View style={{ gap: 8, marginBottom: 20 }}>
                {HEALTH_SUBTYPES.map(h => {
                  const sel = healthSubType === h.key;
                  return (
                    <TouchableOpacity key={h.key}
                      style={[s.healthOpt,
                        sel && { borderColor: h.color, backgroundColor: h.color + (isDark ? "22" : "0E") },
                      ]}
                      onPress={() => setHealthSubType(h.key)} activeOpacity={0.82}
                    >
                      <View style={[s.healthIcon, { backgroundColor: h.color + "18" }]}>
                        <Ionicons name={h.icon} size={20} color={h.color} />
                      </View>
                      <Text style={[s.healthLabel, { color: sel ? h.color : C.text }]}>{h.label}</Text>
                      {sel && <Ionicons name="checkmark-circle" size={22} color={h.color} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={s.fieldLabel}>Localisation du cas</Text>
              <View style={s.inputBox}>
                <Ionicons name="location-outline" size={18} color={C.primary} />
                <TextInput style={[s.input, { color: C.text }]} value={caseLocation}
                  onChangeText={setCaseLocation}
                  placeholder="Ex : Quartier Selembao, Kinshasa..."
                  placeholderTextColor={C.textMut} multiline />
              </View>

              <Text style={[s.fieldLabel, { marginTop: 14 }]}>Numero de contact</Text>
              <View style={s.inputBox}>
                <Ionicons name="call-outline" size={18} color={C.primary} />
                <TextInput style={[s.input, { color: C.text }]} value={contactPhone}
                  onChangeText={setContactPhone} placeholder="Ex : +243 81 000 0000"
                  placeholderTextColor={C.textMut} keyboardType="phone-pad" />
              </View>

              <TouchableOpacity
                style={[s.submitBtn, isLoading && { opacity: 0.6 }]}
                onPress={handleSante} disabled={isLoading} activeOpacity={0.85}
              >
                <LinearGradient colors={[C.primary, C.blue]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitGrad}>
                  {isLoading
                    ? <ActivityIndicator size="small" color={C.white} />
                    : <><Ionicons name="heart-circle" size={20} color={C.white} />
                        <Text style={s.submitTxt}>Envoyer l'alerte sanitaire</Text></>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ── INFO ── */}
          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={C.primary} />
            <Text style={s.infoTxt}>
              BIM NEXT recoit votre alerte en temps reel et peut vous localiser ou vous contacter immediatement.
            </Text>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>

        {/* ── LOADER ── */}
        <Modal visible={sending} transparent animationType="fade">
          <View style={s.loaderOverlay}>
            <View style={s.loaderBox}>
              <ActivityIndicator size="large" color={C.primary} />
              <Text style={[s.loaderTxt, { color: C.text }]}>Envoi en cours...</Text>
            </View>
          </View>
        </Modal>

      </View>
    </KeyboardAvoidingView>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.navBg, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  topCenter: { alignItems: "center" },
  topTitle:  { fontFamily: "NexaBold", fontSize: 17, color: C.text },
  topSub:    { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, marginTop: 1 },

  scroll: { paddingHorizontal: 16, paddingTop: 28 },

  heroWrap: { alignItems: "center", marginBottom: 28, gap: 10 },
  sosCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
    elevation: 8,
    shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 5 },
  },
  heroTitle: { fontFamily: "NexaBold", fontSize: 20, color: C.text, marginTop: 4 },
  heroSub:   { fontFamily: "NexaLight", fontSize: 13, color: C.textMut },
  gpsBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.primary + "12", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: C.primary + "25",
  },
  gpsTxt: { fontFamily: "NexaBold", fontSize: 11, color: C.primary },

  tabRow: {
    flexDirection: "row", gap: 8, marginBottom: 20,
    backgroundColor: C.card, borderRadius: 18,
    padding: 5, borderWidth: 1, borderColor: C.border,
  },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 7, paddingVertical: 11, borderRadius: 13,
  },
  tabBtnActive: { backgroundColor: C.primary },
  tabTxt: { fontFamily: "NexaBold", fontSize: 13 },

  hint: { fontFamily: "NexaLight", fontSize: 12, color: C.textMut, lineHeight: 18, marginBottom: 14 },

  sosCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 20, padding: 18, overflow: "hidden",
    elevation: 4,
    shadowColor: C.primary, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  sosIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.28)",
  },
  sosLabel: { fontFamily: "NexaBold", fontSize: 16, color: "#FFFFFF", marginBottom: 2 },
  sosSub:   { fontFamily: "NexaLight", fontSize: 11, color: "rgba(255,255,255,0.78)" },
  sendBadge: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },

  fieldLabel: {
    fontFamily: "NexaBold", fontSize: 11, color: C.textMut,
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 10,
  },
  healthOpt: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1.5, borderRadius: 16, padding: 14,
    backgroundColor: C.card, borderColor: C.border,
  },
  healthIcon:  { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  healthLabel: { flex: 1, fontFamily: "NexaBold", fontSize: 14 },

  inputBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderRadius: 16, borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 13, minHeight: 52,
    marginBottom: 4, backgroundColor: C.inputBg,
  },
  input: { flex: 1, fontSize: 13, fontFamily: "NexaLight" },

  submitBtn: {
    marginTop: 22, borderRadius: 18, overflow: "hidden",
    elevation: 4,
    shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  submitGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17 },
  submitTxt:  { color: "#FFFFFF", fontSize: 15, fontFamily: "NexaBold" },

  infoBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 24,
    backgroundColor: C.card, borderColor: C.border,
  },
  infoTxt: { flex: 1, fontSize: 11, fontFamily: "NexaLight", color: C.textMut, lineHeight: 16 },

  loaderOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  loaderBox: {
    backgroundColor: C.card, borderRadius: 20,
    paddingVertical: 28, paddingHorizontal: 36,
    alignItems: "center", gap: 14,
    elevation: 12,
  },
  loaderTxt: { fontSize: 14, fontFamily: "NexaBold" },
}); }
