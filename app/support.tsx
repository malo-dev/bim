import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL_BASE } from "@/constants/api";
import { useAppTheme } from "@/app/_layout";
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ─── PALETTE ─────────────────────────────────────────────────────────── */
const LIGHT = {
  primary:    "#0035C5",
  bg:         "#F9F9F9",
  surface:    "#FFFFFF",
  onSurface:  "#1A1C1C",
  onSurfVar:  "#434657",
  secondary:  "#5C5E63",
  outline:    "#747688",
  outlineVar: "#C4C5DA",
  green:      "#22C55E",
  red:        "#EF4444",
  navBord:    "rgba(196,197,218,0.18)",
  cardBg:     "rgba(255,255,255,0.85)",
  cardBord:   "rgba(196,197,218,0.25)",
  iconBg:     "rgba(0,53,197,0.05)",
  iconBgSel:  "rgba(0,53,197,0.10)",
  selBg:      "rgba(0,53,197,0.04)",
  uploadBg:   "rgba(0,53,197,0.06)",
  iconColor:  "rgba(0,53,197,0.45)",
  footer:     "rgba(67,70,87,0.5)",
};
const DARK: typeof LIGHT = {
  primary:    "#4D8DFF",
  bg:         "#0B1220",
  surface:    "#1A2540",
  onSurface:  "#EAF0FF",
  onSurfVar:  "#9FB0D0",
  secondary:  "#9FB0D0",
  outline:    "#6B7A99",
  outlineVar: "rgba(31,42,68,0.80)",
  green:      "#22C55E",
  red:        "#EF4444",
  navBord:    "rgba(31,42,68,0.80)",
  cardBg:     "rgba(26,37,64,0.85)",
  cardBord:   "rgba(31,42,68,0.80)",
  iconBg:     "rgba(77,141,255,0.08)",
  iconBgSel:  "rgba(77,141,255,0.14)",
  selBg:      "rgba(77,141,255,0.08)",
  uploadBg:   "rgba(77,141,255,0.08)",
  iconColor:  "rgba(77,141,255,0.55)",
  footer:     "rgba(163,180,208,0.5)",
};

/* ─── SUJETS ─────────────────────────────────────────────────────────── */
const TOPICS = [
  { id: "1", label: "Problème de connexion",  icon: "lock-closed-outline"     },
  { id: "2", label: "Recharger mon compte",   icon: "wallet-outline"          },
  { id: "3", label: "Transfert Ecoins",        icon: "swap-horizontal-outline" },
  { id: "4", label: "Autres questions",        icon: "chatbubble-outline"      },
] as const;

/* ─── SECTION LABEL ──────────────────────────────────────────────────── */
function SLabel({ icon, title }: { icon: string; title: string }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const sl = useMemo(() => mkSl(C), [isDark]);
  return (
    <View style={sl.row}>
      <Ionicons name={icon as any} size={18} color={C.primary} />
      <Text style={sl.text}>{title}</Text>
    </View>
  );
}

/* ─── SUBJECT CARD ────────────────────────────────────────────────────── */
function SubjectCard({
  item, selected, onPress,
}: { item: typeof TOPICS[number]; selected: boolean; onPress: () => void }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const sc = useMemo(() => mkSc(C), [isDark]);
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start()}
      onPress={onPress}
    >
      <Animated.View style={[
        sc.card,
        selected && sc.cardSel,
        { transform: [{ scale }] },
      ]}>
        <View style={[sc.iconBox, selected && sc.iconBoxSel]}>
          <Ionicons name={item.icon as any} size={22} color={C.primary} />
        </View>
        <Text style={[sc.label, selected && { color: C.primary }]}>{item.label}</Text>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={selected ? C.primary : C.outlineVar}
          style={{ opacity: selected ? 1 : 0.4 }}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ─── MAIN ────────────────────────────────────────────────────────────── */
export default function SupportScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const fb = useMemo(() => mkFb(C), [isDark]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t }  = useTranslation();

  const [userId,         setUserId]         = useState<string | null>(null);
  const [token,          setToken]          = useState<string | null>(null);
  const [selectedTopic,  setSelectedTopic]  = useState<string | null>(null);
  const [email,          setEmail]          = useState("");
  const [message,        setMessage]        = useState("");
  const [image,          setImage]          = useState<string | null>(null);
  const [loading,        setLoading]        = useState(false);
  const [feedback,       setFeedback]       = useState<"success" | "error" | null>(null);
  const [feedbackMsg,    setFeedbackMsg]    = useState("");
  const feedbackScale = useRef(new Animated.Value(0.85)).current;
  const feedbackOpac  = useRef(new Animated.Value(0)).current;

  const fadeY = useRef(new Animated.Value(30)).current;
  const fadeO = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem("userId").then(setUserId);
    AsyncStorage.getItem("token").then(setToken);
    Animated.parallel([
      Animated.timing(fadeY, { toValue: 0, duration: 420, delay: 100, useNativeDriver: true }),
      Animated.timing(fadeO, { toValue: 1, duration: 420, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert(t("common.permDenied"), t("support.permDenied")); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedbackMsg(msg);
    setFeedback(type);
    feedbackScale.setValue(0.85);
    feedbackOpac.setValue(0);
    Animated.parallel([
      Animated.spring(feedbackScale, { toValue: 1, friction: 7, useNativeDriver: true }),
      Animated.timing(feedbackOpac, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeFeedback = () => {
    Animated.parallel([
      Animated.spring(feedbackScale, { toValue: 0.85, useNativeDriver: true }),
      Animated.timing(feedbackOpac, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setFeedback(null));
  };

  const handleSend = async () => {
    if (!selectedTopic || !message || !email) {
      showFeedback("error", "Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("email",       email);
      formData.append("description", message);
      formData.append("id",          String(userId));
      formData.append("sujet",       selectedTopic);
      if (image) {
        const filename = image.split("/").pop() ?? `photo_${Date.now()}.jpg`;
        const ext      = /\.(\w+)$/.exec(filename)?.[1];
        formData.append("image", { uri: image, name: filename, type: `image/${ext ?? "jpeg"}` } as any);
      }
      const response = await fetch(`${API_URL_BASE}/api/v1/support_track/create`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        showFeedback("success", "Votre ticket a bien été envoyé. Notre équipe vous répondra par email.");
        setSelectedTopic(null); setMessage(""); setEmail(""); setImage(null);
      } else {
        showFeedback("error", data.message || "Erreur lors de l'envoi du ticket.");
      }
    } catch {
      showFeedback("error", "Erreur réseau. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const TOP_H = (Platform.OS === "ios" ? insets.top : StatusBar.currentHeight ?? 0) + 56;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.surface} />

      {/* ── FIXED TOP BAR ── */}
      <View style={[s.topBar, {
        paddingTop: Platform.OS === "ios" ? insets.top : (StatusBar.currentHeight ?? 0) + 8,
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.topBtn}>
          <Ionicons name="arrow-back" size={22} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Support</Text>
        <TouchableOpacity onPress={() => router.push("/notification")} style={s.topBtn}>
          <Ionicons name="notifications-outline" size={22} color={C.onSurface} />
        </TouchableOpacity>
      </View>

      {/* ── FEEDBACK MODAL ── */}
      <Modal visible={!!feedback} transparent animationType="none" onRequestClose={closeFeedback}>
        <Pressable style={fb.overlay} onPress={closeFeedback}>
          <Animated.View style={[fb.sheet, { opacity: feedbackOpac, transform: [{ scale: feedbackScale }] }]}>
            {/* Icône */}
            <View style={[fb.iconWrap, feedback === "success" ? fb.iconSuccess : fb.iconError]}>
              <Ionicons
                name={feedback === "success" ? "checkmark" : "close"}
                size={32}
                color="#FFFFFF"
              />
            </View>
            {/* Titre */}
            <Text style={fb.title}>
              {feedback === "success" ? "Ticket envoyé !" : "Oups !"}
            </Text>
            {/* Message */}
            <Text style={fb.msg}>{feedbackMsg}</Text>
            {/* Bouton */}
            <TouchableOpacity
              style={[fb.btn, feedback === "success" ? fb.btnSuccess : fb.btnError]}
              onPress={closeFeedback}
            >
              <Text style={fb.btnTxt}>
                {feedback === "success" ? "Parfait" : "Réessayer"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* ── SCROLL ── */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingTop: TOP_H + 16 }]}
      >
        {/* ── HERO ── */}
        <View style={s.hero}>
          <Text style={s.heroSub}>Nous sommes là pour vous aider</Text>
        </View>

        <Animated.View style={{ opacity: fadeO, transform: [{ translateY: fadeY }] }}>

          {/* ── SUJET ── */}
          <View style={s.section}>
            <SLabel icon="list-outline" title="SUJET" />
            <View style={s.topicList}>
              {TOPICS.map(item => (
                <SubjectCard
                  key={item.id}
                  item={item}
                  selected={selectedTopic === item.label}
                  onPress={() => setSelectedTopic(item.label)}
                />
              ))}
            </View>
          </View>

          {/* ── COORDONNÉES ── */}
          <View style={s.section}>
            <SLabel icon="person-outline" title="COORDONNÉES" />
            <View style={s.glassCard}>
              <Ionicons name="mail-outline" size={20} color={C.iconColor} />
              <TextInput
                style={s.glassInput}
                placeholder="Votre adresse email"
                placeholderTextColor={C.outline}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* ── MESSAGE ── */}
          <View style={s.section}>
            <SLabel icon="create-outline" title="MESSAGE" />
            <View style={[s.glassCard, s.glassArea]}>
              <Ionicons name="pencil-outline" size={20} color={C.iconColor} style={{ marginTop: 2 }} />
              <TextInput
                style={[s.glassInput, s.areaInput]}
                placeholder="Décrivez votre problème en détail…"
                placeholderTextColor={C.outline}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* ── PIÈCE JOINTE ── */}
          <View style={s.section}>
            <SLabel icon="image-outline" title="PIÈCE JOINTE" />
            <TouchableOpacity style={s.glassCard} onPress={pickImage} activeOpacity={0.8}>
              <View style={s.uploadIconBox}>
                <Ionicons
                  name={image ? "checkmark-circle" : "cloud-upload-outline"}
                  size={20}
                  color={image ? C.green : C.primary}
                />
              </View>
              <Text style={[s.uploadTxt, image && { color: C.green }]}>
                {image ? "Image sélectionnée — modifier" : "Ajouter une image (optionnel)"}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={C.outlineVar} />
            </TouchableOpacity>

            {image && (
              <View style={s.previewWrap}>
                <Image source={{ uri: image }} style={s.preview} />
                <TouchableOpacity style={s.removeBtn} onPress={() => setImage(null)}>
                  <View style={s.removeBadge}>
                    <Ionicons name="close" size={12} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── BOUTON ENVOYER ── */}
          <View style={s.section}>
            <TouchableOpacity
              style={[s.submitWrap, loading && { opacity: 0.7 }]}
              onPress={handleSend}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#0047FF", "#7000FF"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.submitGrad}
              >
                {/* Cercle gauche */}
                <View style={s.submitCircle}>
                  <Ionicons
                    name={loading ? "hourglass-outline" : "arrow-forward"}
                    size={20}
                    color={C.primary}
                  />
                </View>
                {/* Texte centré */}
                <Text style={s.submitTxt}>
                  {loading ? "Envoi en cours…" : "Envoyer le ticket"}
                </Text>
                {/* Double chevrons décoratifs */}
                <View style={s.submitChevrons}>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" style={{ marginLeft: -10 }} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={s.footer}>BIM NEXT · Support</Text>
          <View style={{ height: insets.bottom + 80 }} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  /* top bar */
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.navBord,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12,
    elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  topBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  topTitle: { fontFamily: "NexaBold", fontSize: 17, color: C.onSurface },

  scroll: { paddingHorizontal: 20 },

  /* hero */
  hero: { alignItems: "center", marginBottom: 32, marginTop: 8 },
  heroTitle: { fontFamily: "NexaBold", fontSize: 36, color: C.primary, letterSpacing: -0.5 },
  heroSub:   { fontFamily: "NexaLight", fontSize: 16, color: C.onSurfVar, marginTop: 4, opacity: 0.8 },

  section: { marginBottom: 24 },

  topicList: { gap: 10 },

  /* glass card (input wrapper) */
  glassCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.cardBg,
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 16,
    borderWidth: 1, borderColor: C.cardBord,
    elevation: 2,
    shadowColor: "rgba(0,71,255,0.06)",
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12,
  },
  glassArea: { alignItems: "flex-start" },
  glassInput: {
    flex: 1, fontFamily: "NexaLight", fontSize: 15, color: C.onSurface,
  },
  areaInput: { minHeight: 110, textAlignVertical: "top" },

  /* upload */
  uploadIconBox: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.uploadBg,
    alignItems: "center", justifyContent: "center",
  },
  uploadTxt: {
    flex: 1, fontFamily: "NexaLight", fontSize: 14, color: C.onSurface,
  },

  /* preview */
  previewWrap: { marginTop: 12, borderRadius: 16, overflow: "hidden", position: "relative" },
  preview:     { width: "100%", height: 180 },
  removeBtn:   { position: "absolute", top: 8, right: 8 },
  removeBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.red, alignItems: "center", justifyContent: "center",
  },

  /* submit pill button */
  submitWrap: { borderRadius: 999, overflow: "hidden" },
  submitGrad: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 6, paddingLeft: 6, paddingRight: 20,
    elevation: 6,
    shadowColor: "#0047FF", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16,
  },
  submitCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
    elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  submitTxt: {
    flex: 1, textAlign: "center",
    fontFamily: "NexaBold", fontSize: 16, color: "#FFFFFF",
  },
  submitChevrons: { flexDirection: "row" },

  footer: {
    textAlign: "center", fontFamily: "NexaLight",
    fontSize: 10, color: C.footer,
    textTransform: "uppercase", letterSpacing: 1.5,
    marginBottom: 8, marginTop: 4,
  },
}); }

/* ─── SUBJECT CARD STYLES ─────────────────────────────────────────────── */
function mkSc(C: typeof LIGHT) { return StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.cardBg,
    borderRadius: 20, padding: 16,
    borderWidth: 1.5, borderColor: C.cardBord,
    elevation: 2,
    shadowColor: "rgba(0,71,255,0.06)",
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12,
  },
  cardSel: {
    borderColor: C.primary,
    backgroundColor: C.selBg,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: C.iconBg,
    alignItems: "center", justifyContent: "center",
  },
  iconBoxSel: { backgroundColor: C.iconBgSel },
  label: { flex: 1, fontFamily: "NexaLight", fontSize: 15, color: C.onSurface },
}); }

/* ─── SECTION LABEL STYLES ────────────────────────────────────────────── */
function mkSl(C: typeof LIGHT) { return StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginBottom: 12,
  },
  text: {
    fontFamily: "NexaLight", fontSize: 11, color: C.onSurfVar,
    textTransform: "uppercase", letterSpacing: 1.5,
  },
}); }

/* ─── FEEDBACK MODAL STYLES ───────────────────────────────────────────── */
function mkFb(C: typeof LIGHT) { return StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center",
  },
  sheet: {
    width: "80%", backgroundColor: C.surface,
    borderRadius: 28, padding: 28,
    alignItems: "center",
    elevation: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 24,
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center", marginBottom: 18,
  },
  iconSuccess: { backgroundColor: "#22C55E" },
  iconError:   { backgroundColor: C.red },
  title: {
    fontFamily: "NexaBold", fontSize: 20, color: C.onSurface,
    marginBottom: 10, textAlign: "center",
  },
  msg: {
    fontFamily: "NexaLight", fontSize: 14, color: C.secondary,
    textAlign: "center", lineHeight: 21, marginBottom: 24,
  },
  btn: {
    width: "100%", paddingVertical: 14,
    borderRadius: 16, alignItems: "center",
  },
  btnSuccess: { backgroundColor: "#22C55E" },
  btnError:   { backgroundColor: C.red },
  btnTxt: { fontFamily: "NexaBold", fontSize: 15, color: "#FFFFFF" },
}); }
