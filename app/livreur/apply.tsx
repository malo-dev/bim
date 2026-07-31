import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useApplyAsLivreurMutation } from "@/services/livreurService";
import { useGetAllHistoriesQuery } from "@/services/companyService";
import { useAppTheme } from "@/app/_layout";

const MAX_IMAGE_BYTES = 300 * 1024;

/* ─── PALETTES ───────────────────────────────────────────────────────── */
const LIGHT = {
  bg:           "#F8F9FF",
  primary:      "#0047FF",
  text:         "#1A1C1C",
  muted:        "#747688",
  input:        "#F4F6FF",
  border:       "#E8EDF5",
  white:        "#FFFFFF",
  green:        "#16A34A",
  cardBg:       "#FFFFFF",
  topBarBg:     "#FFFFFF",
  introBg:      "#0047FF08",
  introBord:    "#0047FF18",
  introIconBg:  "#0047FF12",
  inputFocusBg: "#EEF4FF",
  iconFocusBg:  "#0047FF12",
  dropdownBg:   "#FFFFFF",
  photoSlotBg:  "#F4F6FF",
  cameraCircle: "#0047FF12",
  photoBadge:   "rgba(0,71,255,0.88)",
  textareaBg:   "#F4F6FF",
};
const DARK: typeof LIGHT = {
  bg:           "#0B1220",
  primary:      "#4D8DFF",
  text:         "#EAF0FF",
  muted:        "#6B7A99",
  input:        "#0F1A2E",
  border:       "rgba(31,42,68,0.80)",
  white:        "#FFFFFF",
  green:        "#16A34A",
  cardBg:       "#1A2540",
  topBarBg:     "#0F1A2E",
  introBg:      "rgba(77,141,255,0.08)",
  introBord:    "rgba(77,141,255,0.18)",
  introIconBg:  "rgba(77,141,255,0.12)",
  inputFocusBg: "rgba(77,141,255,0.10)",
  iconFocusBg:  "rgba(77,141,255,0.15)",
  dropdownBg:   "#1A2540",
  photoSlotBg:  "#0F1A2E",
  cameraCircle: "rgba(77,141,255,0.12)",
  photoBadge:   "rgba(77,141,255,0.88)",
  textareaBg:   "#0F1A2E",
};

export default function LivreurApplyScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);

  const [applyLivreur, { isLoading }] = useApplyAsLivreurMutation();
  const { data: companiesData } = useGetAllHistoriesQuery({});

  const companies = companiesData?.data ?? [];

  const [telephone,     setTelephone]     = useState("");
  const [motivation,    setMotivation]    = useState("");
  const [companyId,     setCompanyId]     = useState<number | null>(null);
  const [showCompanies, setShowCompanies] = useState(false);
  const [recto,         setRecto]         = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [verso,         setVerso]         = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [focused,       setFocused]       = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("userId");
  }, []);

  async function pickImage(side: "recto" | "verso") {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission requise", "Autorisez l'accès à la galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      Alert.alert("Image trop lourde", "L'image ne doit pas dépasser 300 Ko.");
      return;
    }
    if (side === "recto") setRecto(asset);
    else setVerso(asset);
  }

  const selectedCompany = companies.find((c: any) => c.companyId === companyId);

  async function handleSubmit() {
    if (!telephone.trim()) return Alert.alert("Champ requis", "Veuillez entrer votre numéro de téléphone.");
    if (!motivation.trim()) return Alert.alert("Champ requis", "Veuillez renseigner votre expérience / motivation.");
    if (!recto) return Alert.alert("Photo manquante", "Veuillez joindre le recto de votre pièce d'identité.");
    if (!verso) return Alert.alert("Photo manquante", "Veuillez joindre le verso de votre pièce d'identité.");

    const formData = new FormData() as any;
    formData.append("telephone", telephone.trim());
    formData.append("motivation", motivation.trim());
    if (companyId) formData.append("companyId", String(companyId));

    const mime = (uri: string) => uri.split(".").pop()?.toLowerCase() === "png" ? "image/png" : "image/jpeg";

    formData.append("idCardRecto", { uri: recto.uri, name: `recto.${recto.uri.split(".").pop() ?? "jpg"}`, type: mime(recto.uri) });
    formData.append("idCardVerso", { uri: verso.uri, name: `verso.${verso.uri.split(".").pop() ?? "jpg"}`, type: mime(verso.uri) });

    const res = await applyLivreur(formData);
    if (res.error) {
      Alert.alert("Erreur", (res.error as any).data?.message || "Erreur lors de la soumission.");
      return;
    }
    Alert.alert(
      "Candidature envoyée !",
      "Votre candidature a bien été reçue. Vous serez notifié par email dès qu'elle sera examinée.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.bg} />

      {/* Top bar */}
      <SafeAreaView style={s.topBar} edges={["top"]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={s.pageTitle}>Devenir livreur</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Intro */}
          <View style={s.introCard}>
            <View style={s.introIcon}>
              <Ionicons name="bicycle" size={24} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.introTitle}>Rejoignez l'équipe BIMNext</Text>
              <Text style={s.introSub}>Soumettez votre candidature ci-dessous pour devenir livreur partenaire.</Text>
            </View>
          </View>

          {/* ─── Infos personnelles ─── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.sectionDot} />
              <Text style={s.sectionTitle}>Informations personnelles</Text>
            </View>

            <Text style={s.label}>Numéro de téléphone *</Text>
            <View style={[s.inputRow, focused === "tel" && s.inputFocused]}>
              <View style={[s.iconBox, focused === "tel" && s.iconFocused]}>
                <Ionicons name="call-outline" size={18} color={focused === "tel" ? C.primary : C.muted} />
              </View>
              <TextInput
                style={s.input}
                placeholder="+243 XXX XXX XXX"
                placeholderTextColor={C.muted}
                value={telephone}
                onChangeText={setTelephone}
                keyboardType="phone-pad"
                onFocus={() => setFocused("tel")}
                onBlur={() => setFocused(null)}
              />
            </View>

            <Text style={s.label}>Entreprise visée <Text style={s.optional}>(optionnel)</Text></Text>
            <TouchableOpacity
              style={[s.inputRow, showCompanies && s.inputFocused]}
              onPress={() => setShowCompanies(v => !v)}
              activeOpacity={0.8}
            >
              <View style={[s.iconBox, showCompanies && s.iconFocused]}>
                <Ionicons name="business-outline" size={18} color={showCompanies ? C.primary : C.muted} />
              </View>
              <Text style={[s.input, { color: selectedCompany ? C.text : C.muted, lineHeight: 54 }]}>
                {selectedCompany ? selectedCompany.name : "Choisir une entreprise"}
              </Text>
              <Ionicons name={showCompanies ? "chevron-up" : "chevron-down"} size={16} color={C.muted} style={{ marginRight: 14 }} />
            </TouchableOpacity>

            {showCompanies && (
              <View style={s.dropdown}>
                {companies.length === 0 && (
                  <Text style={[s.dropItem, { color: C.muted }]}>Aucune entreprise disponible</Text>
                )}
                {companies.map((c: any) => (
                  <TouchableOpacity
                    key={c.companyId}
                    style={[s.dropItem, s.dropItemBorder]}
                    onPress={() => { setCompanyId(c.companyId); setShowCompanies(false); }}
                  >
                    <Text style={{ fontFamily: "NexaBold", fontSize: 14, color: c.companyId === companyId ? C.primary : C.text }}>
                      {c.name}
                    </Text>
                    {c.commissionRate != null && (
                      <Text style={{ fontFamily: "NexaRegular", fontSize: 11, color: C.green, marginTop: 2 }}>
                        Commission livreur : {c.commissionRate}%
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={s.dropItem}
                  onPress={() => { setCompanyId(null); setShowCompanies(false); }}
                >
                  <Text style={{ fontFamily: "NexaRegular", fontSize: 14, color: C.muted }}>Candidature générale</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ─── Pièce d'identité ─── */}
          <View style={[s.section, { marginTop: 16 }]}>
            <View style={s.sectionHeader}>
              <View style={s.sectionDot} />
              <Text style={s.sectionTitle}>Pièce d'identité</Text>
            </View>
            <Text style={s.hint}>CNI ou passeport — max 300 Ko par image (JPEG / PNG)</Text>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
              <PhotoSlot label="Recto" asset={recto} onPress={() => pickImage("recto")} />
              <PhotoSlot label="Verso" asset={verso} onPress={() => pickImage("verso")} />
            </View>
          </View>

          {/* ─── Motivation ─── */}
          <View style={[s.section, { marginTop: 16 }]}>
            <View style={s.sectionHeader}>
              <View style={s.sectionDot} />
              <Text style={s.sectionTitle}>Expérience & motivation</Text>
            </View>
            <Text style={s.hint}>Décrivez votre expérience en livraison et pourquoi vous souhaitez rejoindre BIM NEXT</Text>
            <View style={[s.textareaWrap, focused === "motivation" && s.inputFocused, { marginTop: 12 }]}>
              <TextInput
                style={s.textarea}
                placeholder="Ex: 2 ans d'expérience en livraison, permis B, véhicule personnel, disponible 6j/7…"
                placeholderTextColor={C.muted}
                value={motivation}
                onChangeText={setMotivation}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                onFocus={() => setFocused("motivation")}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          {/* Bouton soumettre */}
          <TouchableOpacity
            style={[s.submitBtn, { opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.88}
          >
            <Ionicons name="paper-plane-outline" size={18} color={C.white} />
            <Text style={s.submitText}>{isLoading ? "Envoi en cours…" : "Soumettre ma candidature"}</Text>
          </TouchableOpacity>

          <Text style={s.footNote}>Un abonnement BIM NEXT annuel actif est requis pour postuler.</Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function PhotoSlot({ label, asset, onPress }: { label: string; asset: ImagePicker.ImagePickerAsset | null; onPress: () => void }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  return (
    <TouchableOpacity
      style={[
        ph.slot,
        { backgroundColor: C.photoSlotBg, borderColor: asset ? C.primary : C.border },
        asset && ph.slotFilled,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {asset ? (
        <>
          <Image source={{ uri: asset.uri }} style={ph.preview} resizeMode="cover" />
          <View style={[ph.badge, { backgroundColor: C.photoBadge }]}>
            <Ionicons name="checkmark-circle" size={13} color={C.white} />
            <Text style={ph.badgeTxt}>{label} ✓</Text>
          </View>
        </>
      ) : (
        <View style={{ alignItems: "center", gap: 6 }}>
          <View style={[ph.cameraCircle, { backgroundColor: C.cameraCircle }]}>
            <Ionicons name="camera-outline" size={24} color={C.primary} />
          </View>
          <Text style={[ph.photoLabel, { color: C.text }]}>{label}</Text>
          <Text style={[ph.photoHint, { color: C.muted }]}>Appuyer pour choisir</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const ph = StyleSheet.create({
  slot:       { flex: 1, aspectRatio: 4 / 3, borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  slotFilled: { borderStyle: "solid", borderWidth: 2 },
  preview:    { width: "100%", height: "100%" },
  cameraCircle:{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  photoLabel: { fontFamily: "NexaBold", fontSize: 13 },
  photoHint:  { fontFamily: "NexaRegular", fontSize: 10 },
  badge:      { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 6 },
  badgeTxt:   { fontFamily: "NexaBold", fontSize: 11, color: "#FFFFFF" },
});

function mkS(C: typeof LIGHT) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.topBarBg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.bg,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.border,
  },
  pageTitle: { flex: 1, fontFamily: "NexaBold", fontSize: 17, color: C.text, textAlign: "center" },

  scroll: { padding: 16, paddingTop: 20 },

  introCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.introBg,
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: C.introBord,
    marginBottom: 20,
  },
  introIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: C.introIconBg,
    alignItems: "center", justifyContent: "center",
  },
  introTitle: { fontFamily: "NexaBold", fontSize: 14, color: C.text },
  introSub:   { fontFamily: "NexaRegular", fontSize: 12, color: C.muted, lineHeight: 17, marginTop: 3 },

  section: {
    backgroundColor: C.cardBg,
    borderRadius: 24, padding: 20,
    elevation: 4,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 12,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  sectionDot:    { width: 4, height: 16, borderRadius: 2, backgroundColor: C.primary },
  sectionTitle:  { fontFamily: "NexaBold", fontSize: 15, color: C.text },

  label: {
    fontFamily: "NexaRegular", fontSize: 12,
    color: C.muted, letterSpacing: 0.5,
    textTransform: "uppercase", marginBottom: 8,
  },
  optional: { fontFamily: "NexaRegular", fontSize: 11, color: C.muted, textTransform: "none" },

  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 16, height: 54,
    backgroundColor: C.input, marginBottom: 16,
    paddingRight: 4,
  },
  inputFocused: { borderColor: C.primary, backgroundColor: C.inputFocusBg },

  iconBox: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center",
    marginHorizontal: 6, backgroundColor: "transparent",
  },
  iconFocused: { backgroundColor: C.iconFocusBg },

  input: { flex: 1, height: "100%", fontSize: 14, color: C.text, fontFamily: "NexaRegular" },

  hint: { fontFamily: "NexaRegular", fontSize: 12, color: C.muted, lineHeight: 18 },

  dropdown: {
    backgroundColor: C.dropdownBg,
    borderRadius: 16, borderWidth: 1, borderColor: C.border,
    marginTop: -8, marginBottom: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: C.primary, shadowOpacity: 0.08,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  dropItem:       { paddingHorizontal: 16, paddingVertical: 14 },
  dropItemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },

  textareaWrap: {
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 16, padding: 14,
    backgroundColor: C.textareaBg,
  },
  textarea: {
    fontFamily: "NexaRegular", fontSize: 14,
    color: C.text, minHeight: 120,
  },

  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: C.primary,
    borderRadius: 18, height: 56,
    marginTop: 24,
    elevation: 4,
    shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  submitText: { fontFamily: "NexaBold", fontSize: 15, color: C.white, letterSpacing: 0.5 },

  footNote: {
    fontFamily: "NexaRegular", fontSize: 12,
    color: C.muted, textAlign: "center",
    marginTop: 12, lineHeight: 18,
  },
}); }
