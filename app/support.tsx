import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL_BASE } from "@/constants/api";
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
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
import { SafeAreaView } from "react-native-safe-area-context";

/* ═══════════════════════════════════════════════════════════════════════
   THEME — même pattern que Home / Transfer / Recharge
═══════════════════════════════════════════════════════════════════════ */
const C = {
  primary: "#0353CC",
  violet:  "#3906C7",
  deep:    "#302E99",
  accent:  "#4D96FF",
  white:   "#FFFFFF",
  red:     "#EF4444",
  green:   "#22C55E",
};

const TH = {
  light: {
    bg:           C.primary,
    card:         "#FFFFFF",
    text:         "#0D1B3E",
    muted:        "#7B8DB0",
    border:       "rgba(3,83,204,0.10)",
    inputBg:      "rgba(3,83,204,0.06)",
    rowSel:       "rgba(3,83,204,0.07)",
    iconSelBg:    C.primary,
    labelColor:   "rgba(255,255,255,0.70)",
    headerGrad:   [C.deep, C.primary] as [string, string],
    shadow:       C.primary,
    cardBorder:   "transparent",
    versionColor: "rgba(255,255,255,0.35)",
  },
  dark: {
    bg:           "#07091A",
    card:         "#0F1228",
    text:         "#E2E8F0",
    muted:        "#556080",
    border:       "rgba(77,150,255,0.12)",
    inputBg:      "rgba(77,150,255,0.07)",
    rowSel:       "rgba(77,150,255,0.10)",
    iconSelBg:    C.accent,
    labelColor:   "#556080",
    headerGrad:   ["#05081A", "#0D1535"] as [string, string],
    shadow:       "#000",
    cardBorder:   "rgba(77,150,255,0.12)",
    versionColor: "rgba(255,255,255,0.20)",
  },
};

function useTheme() {
  const isDark = useColorScheme() === "dark";
  return { isDark, t: isDark ? TH.dark : TH.light };
}

/* ═══════════════════════════════════════════════════════════════════════
   DATA — built inside component so it can use tr()
═══════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════
   TOPIC ITEM
═══════════════════════════════════════════════════════════════════════ */
function TopicItem({
  item, selected, onPress, t,
}: {
  item: typeof SUPPORT_TOPICS[number];
  selected: boolean;
  onPress: () => void;
  t: typeof TH.light;
}) {
  const scale    = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
      <Animated.View style={[
        ts.row,
        {
          borderBottomColor: t.border,
          backgroundColor:   selected ? t.rowSel : "transparent",
          transform: [{ scale }],
        },
      ]}>
        <View style={[ts.iconWrap, { backgroundColor: selected ? t.iconSelBg : t.inputBg }]}>
          <Ionicons name={item.icon as any} size={16} color={selected ? C.white : C.primary} />
        </View>
        <Text style={[ts.title, { color: selected ? C.primary : t.text }]}>{item.title}</Text>
        {selected && <Ionicons name="checkmark-circle" size={18} color={C.primary} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION LABEL
   Light : fond bleu → label blanc semi-transparent
   Dark  : fond sombre → label muted
═══════════════════════════════════════════════════════════════════════ */
function SectionLabel({ title, icon, t }: { title: string; icon: string; t: typeof TH.light }) {
  return (
    <View style={sl.row}>
      <Ionicons name={icon as any} size={14} color={t.labelColor} />
      <Text style={[sl.text, { color: t.labelColor }]}>{title}</Text>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CARD WRAPPER
═══════════════════════════════════════════════════════════════════════ */
function Card({ children, t }: { children: React.ReactNode; t: typeof TH.light }) {
  return (
    <View style={[
      s.card,
      {
        backgroundColor: t.card,
        borderColor:     t.cardBorder,
        borderWidth:     t.cardBorder === "transparent" ? 0 : 1,
        shadowColor:     t.shadow,
      },
    ]}>
      {children}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════════════════════════════════════ */
export default function SupportScreen() {
  const router = useRouter();
  const { isDark, t } = useTheme();
  const { t: tr } = useTranslation();

  const SUPPORT_TOPICS = [
    { id: "1", title: tr("support.subjectOpts.login"),    icon: "lock-closed-outline"     },
    { id: "2", title: tr("support.subjectOpts.recharge"), icon: "wallet-outline"          },
    { id: "3", title: tr("support.subjectOpts.transfer"), icon: "swap-horizontal-outline" },
    { id: "4", title: tr("support.subjectOpts.other"),    icon: "chatbubble-outline"      },
  ];

  const [userId,        setUserId]        = useState<string | null>(null);
  const [token,         setToken]         = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [message,       setMessage]       = useState("");
  const [email,         setEmail]         = useState("");
  const [image,         setImage]         = useState<string | null>(null);
  const [loading,       setLoading]       = useState(false);

  const cardAnim = useRef(new Animated.Value(40)).current;
  const cardOpac = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem("userId").then(setUserId);
    AsyncStorage.getItem("token").then(setToken);
    Animated.parallel([
      Animated.timing(cardAnim, { toValue: 0, duration: 420, delay: 120, useNativeDriver: true }),
      Animated.timing(cardOpac, { toValue: 1, duration: 420, delay: 120, useNativeDriver: true }),
    ]).start();
  }, []);

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert(tr("common.permDenied"), tr("support.permDenied")); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSend = async () => {
    if (!selectedTopic || !message || !email) {
      Alert.alert("Champs manquants", "Veuillez remplir tous les champs.");
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
        const filename = image.split("/").pop();
        const match    = /\.(\w+)$/.exec(filename || "");
        const type     = match ? `image/${match[1]}` : "image";
        formData.append("image", { uri: image, name: filename, type } as any);
      }
      const response = await fetch(`${API_URL_BASE}/api/v1/support_track/create`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("✅ Succès", "Votre ticket a bien été envoyé !");
        setSelectedTopic(null); setMessage(""); setEmail(""); setImage(null);
      } else {
        Alert.alert("Erreur", data.message || "Erreur lors de l'envoi");
      }
    } catch {
      Alert.alert("Erreur réseau", "Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  /* ════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════ */
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, { backgroundColor: t.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { backgroundColor: t.bg }]}
      >
        {/* ══ HEADER ══ */}
        <View style={[s.header, { shadowColor: t.shadow }]}>
          <LinearGradient
            colors={t.headerGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.deco1} />
          <View style={s.deco2} />

          <SafeAreaView edges={["top"]} style={{ width: "100%" }}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={22} color={C.white} />
              </TouchableOpacity>
              <Text style={s.headerTitle}>Support</Text>
              <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/notification")}>
                <Ionicons name="notifications-outline" size={20} color={C.white} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <View style={s.headerHero}>
            <View style={s.heroIconWrap}>
              <Ionicons name="help-circle-outline" size={36} color={C.white} />
            </View>
            <Text style={s.headerSub}>Nous sommes là pour vous aider</Text>
          </View>
        </View>

        {/* ══ FORM (slide-up) ══ */}
        <Animated.View style={{ opacity: cardOpac, transform: [{ translateY: cardAnim }] }}>

          {/* ── SUJET ── */}
          <View style={s.section}>
            <SectionLabel title="Sujet" icon="list-outline" t={t} />
            <Card t={t}>
              {SUPPORT_TOPICS.map((item) => (
                <TopicItem
                  key={item.id}
                  item={item}
                  selected={selectedTopic === item.title}
                  onPress={() => setSelectedTopic(item.title)}
                  t={t}
                />
              ))}
            </Card>
          </View>

          {/* ── COORDONNÉES ── */}
          <View style={s.section}>
            <SectionLabel title="Coordonnées" icon="person-outline" t={t} />
            <Card t={t}>
              <View style={[s.inputRow, { borderBottomColor: t.border }]}>
                <View style={[s.inputIcon, { backgroundColor: t.inputBg }]}>
                  <Ionicons name="mail-outline" size={16} color={C.primary} />
                </View>
                <TextInput
                  style={[s.input, { color: t.text }]}
                  placeholder="Votre adresse email"
                  placeholderTextColor={t.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </Card>
          </View>

          {/* ── MESSAGE ── */}
          <View style={s.section}>
            <SectionLabel title="Message" icon="chatbubbles-outline" t={t} />
            <Card t={t}>
              <View style={s.messageWrap}>
                <View style={[s.inputIcon, { backgroundColor: t.inputBg, alignSelf: "flex-start", marginTop: 2 }]}>
                  <Ionicons name="create-outline" size={16} color={C.primary} />
                </View>
                <TextInput
                  style={[s.messageInput, { color: t.text }]}
                  placeholder="Décrivez votre problème en détail…"
                  placeholderTextColor={t.muted}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                />
              </View>
            </Card>
          </View>

          {/* ── PIÈCE JOINTE ── */}
          <View style={s.section}>
            <SectionLabel title="Pièce jointe" icon="image-outline" t={t} />
            <Card t={t}>
              <TouchableOpacity
                style={[s.uploadRow, { borderBottomColor: image ? t.border : "transparent" }]}
                onPress={pickImage}
                activeOpacity={0.75}
              >
                <View style={[s.inputIcon, { backgroundColor: image ? C.green + "18" : t.inputBg }]}>
                  <Ionicons
                    name={image ? "checkmark-circle" : "cloud-upload-outline"}
                    size={16}
                    color={image ? C.green : C.primary}
                  />
                </View>
                <Text style={[s.uploadText, { color: image ? C.green : t.text }]}>
                  {image ? "Image sélectionnée — modifier" : "Ajouter une image (optionnel)"}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={t.muted} />
              </TouchableOpacity>

              {image && (
                <View style={s.previewWrap}>
                  <Image source={{ uri: image }} style={s.imagePreview} />
                  <TouchableOpacity style={s.removeBtn} onPress={() => setImage(null)}>
                    <View style={s.removeBtnCircle}>
                      <Ionicons name="close" size={13} color={C.white} />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          </View>

          {/* ── CTA ── */}
          <View style={s.btnWrap}>
            <GradientButton
              isLoad={loading}
              title={loading ? "Envoi en cours…" : "Envoyer le ticket"}
              onPress={handleSend}
              leftIcon={<ArrowIcon width={18} height={12} color={C.violet} />}
              rightIcon={<ArrowRightIcon width={26} height={20} />}
            />
          </View>

          <Text style={[s.version, { color: t.versionColor }]}>BIM NEXT · Support</Text>
        </Animated.View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════════════ */
const s = StyleSheet.create({
  scroll: { paddingBottom: 20 },

  header: {
    height: 210, overflow: "hidden",
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16,
    marginBottom: 20,
  },
  deco1: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.06)", top: -50, right: -40 },
  deco2: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.04)", bottom: -20, left: -20 },

  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" },
  headerTitle: { color: C.white, fontSize: 17, fontFamily: "NexaLight", letterSpacing: 0.3 },

  headerHero: { alignItems: "center", marginTop: 14 },
  heroIconWrap: { width: 66, height: 66, borderRadius: 33, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 10, borderWidth: 2, borderColor: "rgba(255,255,255,0.22)" },
  headerSub: { color: "rgba(255,255,255,0.78)", fontSize: 13, fontFamily: "NexaLight" },

  section: { paddingHorizontal: 16, marginBottom: 16 },

  card: {
    borderRadius: 20, overflow: "hidden",
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8,
  },

  inputRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: 1 },
  inputIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  input:     { flex: 1, fontFamily: "NexaLight", fontSize: 14 },

  messageWrap:  { flexDirection: "row", padding: 16, gap: 12 },
  messageInput: { flex: 1, fontFamily: "NexaLight", fontSize: 14, minHeight: 100, textAlignVertical: "top" },

  uploadRow:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: 1 },
  uploadText:  { flex: 1, fontFamily: "NexaLight", fontSize: 14 },
  previewWrap: { margin: 14, marginTop: 4, borderRadius: 14, overflow: "hidden", position: "relative" },
  imagePreview:{ width: "100%", height: 180, borderRadius: 14 },
  removeBtn:   { position: "absolute", top: 8, right: 8 },
  removeBtnCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.red, alignItems: "center", justifyContent: "center" },

  btnWrap: { paddingHorizontal: 16, marginBottom: 16 },
  version: { textAlign: "center", fontFamily: "NexaLight", fontSize: 11, marginTop: 4 },
});

const ts = StyleSheet.create({
  row:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: 1 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  title:    { flex: 1, fontFamily: "NexaLight", fontSize: 14 },
});

const sl = StyleSheet.create({
  row:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, paddingLeft: 4 },
  text: { fontFamily: "NexaLight", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 },
});