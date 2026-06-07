import { C, Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useApplyAsLivreurMutation } from "@/services/livreurService";
import { useGetAllHistoriesQuery } from "@/services/companyService";

const MAX_IMAGE_BYTES = 300 * 1024; // 300 KB

function useTheme() {
  const isDark = useColorScheme() === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

export default function LivreurApplyScreen() {
  const router = useRouter();
  const { isDark, t } = useTheme();
  const [applyLivreur, { isLoading }] = useApplyAsLivreurMutation();
  const { data: companiesData } = useGetAllHistoriesQuery({});

  const companies = companiesData?.data ?? [];

  const [telephone, setTelephone]     = useState("");
  const [motivation, setMotivation]   = useState("");
  const [companyId, setCompanyId]     = useState<number | null>(null);
  const [showCompanies, setShowCompanies] = useState(false);
  const [recto, setRecto]             = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [verso, setVerso]             = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [userId, setUserId]           = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("userId").then(setUserId);
  }, []);

  async function pickImage(side: "recto" | "verso") {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission requise", "Autorisez l'accès à la galerie pour sélectionner une image.");
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
      Alert.alert("Image trop lourde", "L'image ne doit pas dépasser 300 Ko. Veuillez en choisir une plus légère.");
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

    const mime = (uri: string) => {
      const ext = uri.split(".").pop()?.toLowerCase();
      return ext === "png" ? "image/png" : "image/jpeg";
    };

    formData.append("idCardRecto", {
      uri: recto.uri,
      name: `recto.${recto.uri.split(".").pop() ?? "jpg"}`,
      type: mime(recto.uri),
    });
    formData.append("idCardVerso", {
      uri: verso.uri,
      name: `verso.${verso.uri.split(".").pop() ?? "jpg"}`,
      type: mime(verso.uri),
    });

    const res = await applyLivreur(formData);
    if (res.error) {
      const msg = res.error.data?.message || "Erreur lors de la soumission.";
      Alert.alert("Erreur", msg);
      return;
    }
    Alert.alert(
      "Candidature envoyée !",
      "Votre candidature a bien été reçue. Vous serez notifié par email dès qu'elle sera examinée.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  }

  return (
    <View style={[s.root, { backgroundColor: t.background }]}>
      {/* Header */}
      <View style={s.header}>
        <LinearGradient colors={["#302E99", "#0353CC"]} style={StyleSheet.absoluteFill} />
        <View style={s.deco1} />
        <View style={s.deco2} />
        <SafeAreaView edges={["top"]}>
          <View style={s.topBar}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={C.white} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={s.headerTitle}>Devenir livreur</Text>
            </View>
            <View style={{ width: 38 }} />
          </View>
          <Text style={s.headerSub}>Soumettez votre candidature ci-dessous</Text>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">

          {/* Infos personnelles */}
          <SectionCard t={t} title="Informations personnelles">

            <FieldLabel t={t}>Numéro de téléphone *</FieldLabel>
            <InputRow t={t} isDark={isDark}>
              <Ionicons name="call-outline" size={18} color={C.muted} style={{ marginRight: 8 }} />
              <TextInput
                style={[s.input, { color: t.text }]}
                placeholder="+243 XXX XXX XXX"
                placeholderTextColor={C.muted}
                value={telephone}
                onChangeText={setTelephone}
                keyboardType="phone-pad"
              />
            </InputRow>

            <FieldLabel t={t} top={16}>Entreprise visée (optionnel)</FieldLabel>
            <TouchableOpacity
              style={[s.inputWrap, { backgroundColor: isDark ? "#1E2A3A" : "#F4F6FA", borderColor: t.border }]}
              onPress={() => setShowCompanies(v => !v)}
              activeOpacity={0.8}
            >
              <Ionicons name="business-outline" size={18} color={C.muted} style={{ marginRight: 8 }} />
              <Text style={[s.input, { color: selectedCompany ? t.text : C.muted, flex: 1 }]}>
                {selectedCompany ? selectedCompany.name : "Choisir une entreprise"}
              </Text>
              <Ionicons name={showCompanies ? "chevron-up" : "chevron-down"} size={16} color={C.muted} />
            </TouchableOpacity>

            {showCompanies && (
              <View style={[s.dropdown, { backgroundColor: t.card, borderColor: t.border }]}>
                {companies.length === 0 && (
                  <Text style={[s.dropItem, { color: C.muted }]}>Aucune entreprise</Text>
                )}
                {companies.map((c: any) => (
                  <TouchableOpacity
                    key={c.companyId}
                    style={[s.dropItem, { borderBottomColor: t.border }]}
                    onPress={() => { setCompanyId(c.companyId); setShowCompanies(false); }}
                  >
                    <Text style={{ color: c.companyId === companyId ? C.primary : t.text, fontFamily: "NexaBold", fontSize: 14 }}>
                      {c.name}
                    </Text>
                    {c.commissionRate != null && (
                      <Text style={{ color: "#16A34A", fontFamily: "NexaLight", fontSize: 11, marginTop: 2 }}>
                        Commission livreur : {c.commissionRate}%
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[s.dropItem, { borderBottomWidth: 0 }]}
                  onPress={() => { setCompanyId(null); setShowCompanies(false); }}
                >
                  <Text style={{ color: C.muted, fontFamily: "NexaLight", fontSize: 14 }}>Aucune (candidature générale)</Text>
                </TouchableOpacity>
              </View>
            )}
          </SectionCard>

          {/* Pièce d'identité */}
          <SectionCard t={t} title="Pièce d'identité" style={{ marginTop: 16 }}>
            <Text style={[s.hint, { color: C.muted }]}>Photo de votre CNI ou passeport — max 300 Ko par image (JPEG/PNG)</Text>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
              <PhotoSlot label="Recto" asset={recto} onPress={() => pickImage("recto")} t={t} isDark={isDark} />
              <PhotoSlot label="Verso" asset={verso} onPress={() => pickImage("verso")} t={t} isDark={isDark} />
            </View>
          </SectionCard>

          {/* Expérience & motivation */}
          <SectionCard t={t} title="Expérience & motivation" style={{ marginTop: 16 }}>
            <Text style={[s.hint, { color: C.muted }]}>Décrivez votre expérience en livraison et pourquoi vous souhaitez rejoindre BIM NEXT</Text>
            <View style={[s.textareaWrap, { backgroundColor: isDark ? "#1E2A3A" : "#F4F6FA", borderColor: t.border, marginTop: 10 }]}>
              <TextInput
                style={[s.textarea, { color: t.text }]}
                placeholder="Ex: 2 ans d'expérience en livraison, permis B, véhicule personnel, disponible 6j/7…"
                placeholderTextColor={C.muted}
                value={motivation}
                onChangeText={setMotivation}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </SectionCard>

          {/* Bouton soumettre */}
          <TouchableOpacity
            style={[s.submitBtn, { opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient colors={["#302E99", "#0353CC"]} style={s.submitGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="paper-plane-outline" size={18} color={C.white} style={{ marginRight: 8 }} />
              <Text style={s.submitText}>{isLoading ? "Envoi en cours…" : "Soumettre ma candidature"}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[s.footNote, { color: C.muted }]}>
            Un abonnement BIM NEXT annuel actif est requis pour postuler.
          </Text>
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function SectionCard({ children, t, title, style }: any) {
  return (
    <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }, style]}>
      <Text style={[s.sectionTitle, { color: t.text }]}>{title}</Text>
      {children}
    </View>
  );
}
function FieldLabel({ children, t, top }: any) {
  return <Text style={[s.label, { color: t.text, marginTop: top ?? 0 }]}>{children}</Text>;
}
function InputRow({ children, t, isDark }: any) {
  return (
    <View style={[s.inputWrap, { backgroundColor: isDark ? "#1E2A3A" : "#F4F6FA", borderColor: t.border }]}>
      {children}
    </View>
  );
}
function PhotoSlot({ label, asset, onPress, t, isDark }: any) {
  return (
    <TouchableOpacity
      style={[s.photoSlot, { backgroundColor: isDark ? "#1E2A3A" : "#F4F6FA", borderColor: asset ? C.primary : t.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {asset ? (
        <Image source={{ uri: asset.uri }} style={s.photoPreview} resizeMode="cover" />
      ) : (
        <View style={{ alignItems: "center" }}>
          <Ionicons name="camera-outline" size={28} color={C.muted} />
          <Text style={[s.photoLabel, { color: C.muted }]}>{label}</Text>
        </View>
      )}
      {asset && (
        <View style={s.photoBadge}>
          <Text style={s.photoBadgeTxt}>{label} ✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    overflow: "hidden",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 12,
    shadowColor: "#0353CC",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  deco1: { position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.06)", top: -40, right: -30 },
  deco2: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.04)", bottom: -10, left: 20 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "NexaBold", fontSize: 20, color: C.white, letterSpacing: 1 },
  headerSub: { fontFamily: "NexaLight", fontSize: 13, color: "rgba(255,255,255,0.75)", textAlign: "center", paddingBottom: 20, paddingHorizontal: 24 },
  body: { padding: 16 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16 },
  sectionTitle: { fontFamily: "NexaBold", fontSize: 15, marginBottom: 14 },
  label: { fontFamily: "NexaBold", fontSize: 13, marginBottom: 8 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  input: { flex: 1, fontFamily: "NexaLight", fontSize: 14 },
  hint: { fontFamily: "NexaLight", fontSize: 12, lineHeight: 18 },
  dropdown: { borderRadius: 12, borderWidth: 1, marginTop: 4, overflow: "hidden" },
  dropItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  photoSlot: {
    flex: 1, aspectRatio: 4 / 3, borderRadius: 14, borderWidth: 1.5,
    borderStyle: "dashed", alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  photoPreview: { width: "100%", height: "100%" },
  photoLabel: { fontFamily: "NexaBold", fontSize: 12, marginTop: 6 },
  photoBadge: { position: "absolute", bottom: 6, left: 6, right: 6, backgroundColor: "rgba(3,83,204,0.85)", borderRadius: 8, paddingVertical: 4, alignItems: "center" },
  photoBadgeTxt: { fontFamily: "NexaBold", fontSize: 11, color: C.white },
  textareaWrap: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  textarea: { fontFamily: "NexaLight", fontSize: 14, minHeight: 120 },
  submitBtn: { marginTop: 20, borderRadius: 14, overflow: "hidden" },
  submitGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16 },
  submitText: { fontFamily: "NexaBold", fontSize: 15, color: C.white },
  footNote: { fontFamily: "NexaLight", fontSize: 12, textAlign: "center", marginTop: 10, lineHeight: 18 },
});
