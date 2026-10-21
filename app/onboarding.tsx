import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Alert,
  Animated,
  DeviceEventEmitter,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "@/constants/theme";
import { useAppTheme } from "@/app/_layout";
import { useQuickAccessMutation, useLoginMutation } from "@/services/authService";
import { persistAuthSession } from "@/utils/authSession.utils";
import BlinkingCursor from "@/components/ui/BlinkingCursor";
import { AFRICA_COUNTRIES } from "@/constants/africaCountries";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

/* ─── PALETTE "MOBILANC" (réf. DESIN NEW/*_style_mobilanc*) ─────────────── */
const MB = {
  bg:        "#F2F4F7",
  card:      "#FFFFFF",
  cardLow:   "#F7F8FA",
  accent:    "#8FAEC7",
  accentDk:  "#7592AB",
  dark:      "#111317",
  muted:     "#717684",
  subtle:    "#E4E7EC",
  border:    "#ECEFF2",
  dotIdle:   "#D2D7DF",
  dotActive: "#14171A",
  green:     "#10B981",
};

/* ─── PALETTES ───────────────────────────────────────────────────────── */
const LIGHT = {
  bg:           "#FFFFFF",
  slideBg:      "#F8F9FF",
  primary:      "#0047FF",
  primaryLight: "rgba(0,71,255,0.08)",
  glow:         "rgba(0,71,255,0.06)",
  text:         "#1A1C1C",
  textSub:      "#363845",
  textMuted:    "#5B5E70",
  border:       "#E2E2E2",
  inputBg:      "#F8FAFE",
  chipBg:       "#FFFFFF",
  dotIdle:      "#C4C5DA",
  cardBg:       "#FFFFFF",
  cardElev:     6,
  cardBord:     "#E2E2E2",
};
const DARK: typeof LIGHT = {
  bg:           "#0B1220",
  slideBg:      "#0B1220",
  primary:      "#4D8DFF",
  primaryLight: "rgba(77,141,255,0.12)",
  glow:         "rgba(77,141,255,0.06)",
  text:         "#EAF0FF",
  textSub:      "#A3B4D0",
  textMuted:    "#6B7A99",
  border:       "rgba(31,42,68,0.80)",
  inputBg:      "#0F1A2E",
  chipBg:       "#1A2540",
  dotIdle:      "#2A3A5A",
  cardBg:       "#1A2540",
  cardElev:     0,
  cardBord:     "rgba(31,42,68,0.90)",
};

/* ─── Petits sous-composants communs aux 3 étapes ───────────────────── */
function Dots({ active, mb }: { active: 0 | 1 | 2; mb: any }) {
  return (
    <View style={mb.dotsRow}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[mb.dot, i === active && mb.dotOn]} />
      ))}
    </View>
  );
}

// Petit point qui "ping" (anneau qui s'étend et s'estompe en boucle) pour
// attirer l'œil sur le libellé "Êtes-vous un nouvel utilisateur ?".
function PingDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opac  = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, { toValue: 2.4, duration: 1200, useNativeDriver: true }),
        Animated.timing(opac,  { toValue: 0,   duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    const reset = setInterval(() => { scale.setValue(1); opac.setValue(1); }, 1200);
    return () => { loop.stop(); clearInterval(reset); };
  }, []);
  return (
    <View style={{ width: 8, height: 8, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={{
        position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: "#0047FF",
        opacity: opac, transform: [{ scale }],
      }} />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#0047FF" }} />
    </View>
  );
}

function StepHeader({ onBack, mb }: { onBack: () => void; mb: any }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[mb.navRow, { paddingTop: insets.top + 6 }]}>
      <TouchableOpacity style={mb.backBtn} onPress={onBack} activeOpacity={0.8}>
        <Ionicons name="chevron-back" size={20} color={MB.dark} />
      </TouchableOpacity>
      <Text style={[mb.brandWordmark, { marginTop: 0 }]}>BIMNEXT</Text>
      <View style={{ width: 36 }} />
    </View>
  );
}

/* ─── ÉTAPE 1 — INTRO ────────────────────────────────────────────────── */
// Photos déjà utilisées ailleurs dans l'app (SECTOR_IMG_MAP de
// app/(tabs)/index.tsx) — réutilisées ici pour rester sur des URLs déjà
// vérifiées en prod plutôt que d'en deviner de nouvelles à l'aveugle.
const INTRO_VISUALS = [
  { uri: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80", label: "Portefeuille" },
  { uri: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80", label: "Scan QR" },
  { uri: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80",    label: "Transferts" },
  { uri: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",    label: "Achats" },
  { uri: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80", label: "Sécurité" },
  { uri: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80", label: "Support" },
] as const;

function IntroStep({
  mb, userType, setUserType, onNext, submitting,
}: { mb: any; userType: "new" | "existing" | null; setUserType: (v: "new" | "existing") => void; onNext: () => void; submitting: boolean }) {
  const insets = useSafeAreaInsets();

  const [visualIdx, setVisualIdx] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => {
        setVisualIdx((i) => (i + 1) % INTRO_VISUALS.length);
        Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    }, 2400);
    return () => clearInterval(id);
  }, []);
  const visual = INTRO_VISUALS[visualIdx];

  return (
    <View style={mb.root}>
      <StatusBar barStyle="dark-content" backgroundColor={MB.bg} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[mb.scrollWrap, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Text style={[mb.brandWordmark, { marginTop: 0 }]}>BIMNEXT</Text>

        <View style={mb.spacer} />

        {/* Illustration : pile de cartes façon Mobilanc (carte avant + 2 cartes
            fantômes derrière), photo avant qui change toutes les ~2,4s. */}
        <View style={mb.stackWrap}>
          <View style={[mb.stackCard, mb.stackCard1]}>
            <Image
              source={{ uri: INTRO_VISUALS[(visualIdx + 2) % INTRO_VISUALS.length].uri }}
              style={mb.stackBackArt}
              contentFit="cover"
            />
          </View>
          <View style={[mb.stackCard, mb.stackCard2]}>
            <Image
              source={{ uri: INTRO_VISUALS[(visualIdx + 1) % INTRO_VISUALS.length].uri }}
              style={mb.stackBackArt}
              contentFit="cover"
            />
          </View>
          <View style={[mb.stackCard, mb.stackCard3]}>
            <Animated.View style={{ flex: 1, opacity: fade, borderRadius: 18, overflow: "hidden" }}>
              <Image source={{ uri: visual.uri }} style={mb.stackArt} contentFit="cover" />
            </Animated.View>
            <View style={mb.stackBadge}>
              <Animated.Text style={[mb.stackBadgeText, { opacity: fade }]}>{visual.label}</Animated.Text>
            </View>
          </View>
        </View>

        <View style={mb.spacerText} />

        <View style={mb.textBlock}>
          <Text style={mb.h1}>Votre argent, vos activités{"\n"}tout-en-un</Text>
          <Text style={mb.p}>
            Rechargez, transférez et payez dans tout un réseau d'entreprises,
            le tout depuis une seule application.
          </Text>
        </View>

        <Dots active={0} mb={mb} />
      </ScrollView>

      <View style={mb.footer}>
        <View style={mb.toggleLabelRow}>
          <PingDot />
          <Text style={mb.toggleLabel}>Avez-vous déjà un compte BIM NEXT ?</Text>
        </View>
        <View style={mb.segmented}>
          <TouchableOpacity
            style={[mb.segmentBtn, userType !== "existing" && mb.segmentBtnOn]}
            onPress={() => setUserType("new")}
            activeOpacity={0.85}
          >
            <Text style={[mb.segmentText, userType !== "existing" && mb.segmentTextOn]}>Non, nouveau client</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[mb.segmentBtn, userType === "existing" && mb.segmentBtnOn]}
            onPress={() => setUserType("existing")}
            activeOpacity={0.85}
          >
            <Text style={[mb.segmentText, userType === "existing" && mb.segmentTextOn]}>Oui, déjà client</Text>
          </TouchableOpacity>
        </View>
        <View style={mb.warningRow}>
          <Ionicons name="warning" size={13} color="#EF4444" />
          <Text style={mb.warningText}>
            Choisissez « Oui, déjà client » si vous avez déjà utilisé ce numéro — sinon votre compte existant ne sera pas retrouvé.
          </Text>
        </View>

        <TouchableOpacity onPress={onNext} activeOpacity={0.9} disabled={submitting}>
          <LinearGradient colors={["#2D6CFF", "#0035C5"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={mb.btn}>
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={mb.btnText}>{userType === "existing" ? "Continuer" : "Commencer"}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── Indicatifs téléphoniques — pays d'Afrique ──────────────────────── */
/* ─── ÉTAPE 2 — TÉLÉPHONE ────────────────────────────────────────────── */
function PhoneStep({
  mb, phone, setPhone, onBack, onSubmit, onSwitchToEmail, submitting,
}: { mb: any; phone: string; setPhone: (v: string) => void; onBack: () => void; onSubmit: (fullPhone: string) => void; onSwitchToEmail: () => void; submitting: boolean }) {
  const router = useRouter();
  const [country, setCountry] = useState<(typeof AFRICA_COUNTRIES)[number]>(
    AFRICA_COUNTRIES.find((c) => c.code === "+243")!
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [zeroWarning, setZeroWarning] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  // Le code pays remplace déjà le "0" de tête qu'on tape habituellement en
  // composant localement (ex: 0999999999) — avec le code pays, on ne garde
  // que 999999999, sinon le numéro final serait invalide (+243 0999999999).
  const handlePhoneChange = (raw: string) => {
    setPhoneError(false);
    if (raw.startsWith("0")) {
      setZeroWarning(true);
      setPhone(raw.replace(/^0+/, ""));
    } else {
      setZeroWarning(false);
      setPhone(raw);
    }
  };

  // Un numéro de téléphone est obligatoire — sans ce verrou, "Continuer"
  // créait un compte "rapide" fictif sans aucun téléphone (jamais
  // retrouvable ensuite). On bloque ici plutôt que de laisser le serveur
  // créer le compte puis réparer après coup.
  const handleContinuePress = () => {
    if (!phone.trim()) {
      setPhoneError(true);
      return;
    }
    onSubmit(`${country.code}${phone.trim()}`);
  };

  return (
    <KeyboardAvoidingView style={mb.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="dark-content" backgroundColor={MB.bg} />
      <StepHeader onBack={onBack} mb={mb} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={mb.scrollWrap} keyboardShouldPersistTaps="handled">
        {/* Carte flottante "Accès sécurisé" (icône, pas de photo) */}
        <View style={mb.heroWrap}>
          <View style={[mb.heroCardBack]} />
          <View style={mb.heroCardFront}>
            <View style={mb.heroIconWrapBrand}>
              <Ionicons name="phone-portrait-outline" size={22} color="#0035C5" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={mb.heroTitle}>Accès sécurisé</Text>
                <Ionicons name="checkmark-circle" size={14} color="#3B82F6" />
              </View>
              <Text style={mb.heroSub}>Connexion rapide par numéro</Text>
            </View>
          </View>
        </View>

        <View style={mb.textBlock}>
          <Text style={mb.h1C}>Connexion à votre compte</Text>
          <Text style={mb.pC}>
            Saisissez le numéro de téléphone utilisé pour vos transactions BIM NEXT.
          </Text>
        </View>

        <View style={[mb.inputCard, phoneFocused && mb.inputCardFocused, phoneError && mb.inputCardError]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <Text style={mb.inputLabel}>NUMÉRO DE TÉLÉPHONE</Text>
            <View style={mb.smsPill}>
              <View style={mb.smsPillDot} />
              <Text style={mb.smsPillText}>Instantané</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity style={mb.flagChip} onPress={() => setPickerOpen(true)} activeOpacity={0.8} disabled={submitting}>
              <Text style={{ fontSize: 15 }}>{country.flag}</Text>
              <Text style={mb.flagChipText}>{country.code}</Text>
              <Ionicons name="chevron-down" size={13} color={MB.muted} />
            </TouchableOpacity>
            <TextInput
              style={mb.plainInput}
              placeholder="8xx xxx xxx"
              placeholderTextColor="rgba(17,19,23,0.25)"
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              editable={!submitting}
              onFocus={() => setPhoneFocused(true)}
              onBlur={() => setPhoneFocused(false)}
            />
          </View>
          {zeroWarning && (
            <Text style={mb.zeroWarning}>Ne mettez pas de 0 devant — le code pays ({country.code}) le remplace déjà.</Text>
          )}
          {phoneError && (
            <Text style={mb.zeroWarning}>Veuillez compléter ce champ.</Text>
          )}
        </View>

        <TouchableOpacity onPress={onSwitchToEmail} disabled={submitting} style={{ alignSelf: "center", marginTop: 20 }}>
          <Text style={[mb.dashedLink, { textAlign: "center" }]}>Ou se connecter avec votre e-mail et mot de passe</Text>
        </TouchableOpacity>

        <Dots active={1} mb={mb} />
      </ScrollView>

      <Modal visible={pickerOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setPickerOpen(false)}>
        <View style={mb.pickerOverlay}>
          <View style={mb.pickerSheet}>
            <View style={mb.pickerHandle} />
            <View style={mb.pickerHeaderRow}>
              <Text style={mb.pickerTitle}>Choisir un pays</Text>
              <TouchableOpacity style={mb.pickerCloseBtn} onPress={() => setPickerOpen(false)} activeOpacity={0.8}>
                <Ionicons name="close" size={18} color={MB.dark} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {AFRICA_COUNTRIES.map((c) => (
                <TouchableOpacity
                  key={c.code + c.name}
                  style={mb.pickerRow}
                  onPress={() => { setCountry(c); setPickerOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 18 }}>{c.flag}</Text>
                  <Text style={mb.pickerRowName}>{c.name}</Text>
                  <Text style={mb.pickerRowCode}>{c.code}</Text>
                  {c.code === country.code && c.name === country.name && (
                    <Ionicons name="checkmark" size={16} color="#0035C5" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={mb.footer}>
        <TouchableOpacity
          onPress={handleContinuePress}
          activeOpacity={0.9}
          disabled={submitting}
        >
          <LinearGradient colors={["#2D6CFF", "#0035C5"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={mb.btn}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={mb.btnText}>Continuer</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <View style={mb.footerLinksRow}>
          <TouchableOpacity onPress={() => router.push("/support" as any)} disabled={submitting}>
            <Text style={mb.dashedText}>Besoin d'aide ?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ─── ÉTAPE "MOT DE PASSE DE SÉCURITÉ" (nouveau compte uniquement) ───── */
function MaskedPasswordField({
  mb, label, value, onChangeText, submitting, focused, setFocused, autoFocus,
}: {
  mb: any; label: string; value: string; onChangeText: (v: string) => void;
  submitting: boolean; focused: boolean; setFocused: (v: boolean) => void; autoFocus?: boolean;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const inputRef = useRef<TextInput>(null);
  return (
    <View style={mb.inputCard}>
      <Text style={mb.inputLabel}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 }}>
        <Ionicons name="key-outline" size={18} color={MB.muted} />
        <TouchableOpacity style={{ flex: 1, alignItems: "flex-start" }} activeOpacity={1} onPress={() => inputRef.current?.focus()}>
          <View style={{ flexDirection: "row", alignSelf: "flex-start", justifyContent: "flex-start", alignItems: "center", flexWrap: "wrap", gap: 5, paddingVertical: 8, minHeight: 22 }}>
            {value.length === 0 && !focused && (
              <Text style={[mb.passwordInput, { color: "rgba(17,19,23,0.25)", paddingVertical: 0 }]}>••••••••••••</Text>
            )}
            {value.length > 0 && (
              showPwd ? (
                <Text style={[mb.passwordInput, { paddingVertical: 0 }]}>{value}</Text>
              ) : (
                Array.from({ length: value.length }).map((_, i) => (
                  <View key={i} style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#111317" }} />
                ))
              )
            )}
            {focused && <BlinkingCursor color="#111317" height={18} />}
          </View>
          <TextInput
            ref={inputRef}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0 }}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoCapitalize="none"
            editable={!submitting}
            autoFocus={autoFocus}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowPwd((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={18} color={MB.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SecurityPasswordStep({
  mb, securityPassword, setSecurityPassword, onBack, onSubmit, submitting,
}: {
  mb: any; securityPassword: string; setSecurityPassword: (v: string) => void;
  onBack: () => void; onSubmit: () => void; submitting: boolean;
}) {
  const [confirm, setConfirm] = useState("");
  const [pwdFocused, setPwdFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    if (securityPassword.trim().length < 4) {
      setError("Votre mot de passe doit contenir au moins 4 caractères.");
      return;
    }
    if (securityPassword !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setError(null);
    onSubmit();
  };

  return (
    <KeyboardAvoidingView style={mb.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="dark-content" backgroundColor={MB.bg} />
      <StepHeader onBack={onBack} mb={mb} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={mb.scrollWrap} keyboardShouldPersistTaps="handled">
        <Dots active={1} mb={mb} />

        <View style={mb.textBlock}>
          <Text style={mb.h1C}>Mot de passe de sécurité</Text>
          <Text style={mb.pC}>
            Choisissez un mot de passe pour protéger votre compte BIM NEXT.
          </Text>
        </View>

        <MaskedPasswordField
          mb={mb} label="MOT DE PASSE" value={securityPassword}
          onChangeText={(v) => { setSecurityPassword(v); setError(null); }}
          submitting={submitting} focused={pwdFocused} setFocused={setPwdFocused} autoFocus
        />

        <View style={{ marginTop: 12 }}>
          <MaskedPasswordField
            mb={mb} label="CONFIRMER LE MOT DE PASSE" value={confirm}
            onChangeText={(v) => { setConfirm(v); setError(null); }}
            submitting={submitting} focused={confirmFocused} setFocused={setConfirmFocused}
          />
        </View>

        {error && <Text style={[mb.zeroWarning, { marginTop: 10 }]}>{error}</Text>}
      </ScrollView>

      <View style={mb.footer}>
        <TouchableOpacity onPress={handleContinue} activeOpacity={0.9} disabled={submitting}>
          <LinearGradient colors={["#2D6CFF", "#0035C5"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={mb.btn}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={mb.btnText}>Suivant</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ─── ÉTAPE 3 — EMAIL + MOT DE PASSE ─────────────────────────────────── */
function EmailStep({
  mb, email, setEmail, password, setPassword, onBack, onSubmit, onSwitchToPhone, submitting,
}: {
  mb: any; email: string; setEmail: (v: string) => void; password: string; setPassword: (v: string) => void;
  onBack: () => void; onSubmit: () => void; onSwitchToPhone: () => void; submitting: boolean;
}) {
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const passwordInputRef = useRef<TextInput>(null);
  return (
    <KeyboardAvoidingView style={mb.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="dark-content" backgroundColor={MB.bg} />
      <StepHeader onBack={onBack} mb={mb} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={mb.scrollWrap} keyboardShouldPersistTaps="handled">
        <Dots active={2} mb={mb} />

        <View style={mb.secureBanner}>
          <View style={mb.secureIconWrap}>
            <Ionicons name="lock-open-outline" size={20} color={MB.accentDk} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <Text style={mb.heroTitle}>Protocole sécurisé</Text>
              <View style={mb.sslPill}><Text style={mb.sslPillText}>SSL 256-bit</Text></View>
            </View>
            <Text style={mb.heroSub}>Session chiffrée de bout en bout</Text>
          </View>
        </View>

        <View style={mb.textBlock}>
          <Text style={mb.h1C}>Connexion par e-mail</Text>
          <Text style={mb.pC}>
            Saisissez votre adresse e-mail et votre mot de passe pour accéder à votre espace BIM NEXT.
          </Text>
        </View>

        <View style={mb.inputCard}>
          <Text style={mb.inputLabel}>ADRESSE E-MAIL</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 }}>
            <Ionicons name="mail-outline" size={18} color={MB.muted} />
            <TextInput
              style={mb.plainInput}
              placeholder="nom@exemple.com"
              placeholderTextColor="rgba(17,19,23,0.25)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!submitting}
              autoFocus
            />
          </View>
        </View>

        <View style={[mb.inputCard, { marginTop: 12 }]}>
          <Text style={mb.inputLabel}>MOT DE PASSE</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 }}>
            <Ionicons name="key-outline" size={18} color={MB.muted} />
            {/* `secureTextEntry` ne masque pas de façon fiable sur certains
                claviers Android (le mot de passe s'affichait en clair malgré
                secureTextEntry). On masque donc nous-mêmes avec des points —
                un TextInput invisible capte la saisie, des points l'affichent
                tant que `showPwd` est faux. */}
            <TouchableOpacity
              style={{ flex: 1, alignItems: "flex-start" }}
              activeOpacity={1}
              onPress={() => passwordInputRef.current?.focus()}
            >
              <View style={{ flexDirection: "row", alignSelf: "flex-start", justifyContent: "flex-start", alignItems: "center", flexWrap: "wrap", gap: 5, paddingVertical: 8, minHeight: 22 }}>
                {password.length === 0 && !pwdFocused && (
                  <Text style={[mb.passwordInput, { color: "rgba(17,19,23,0.25)", paddingVertical: 0 }]}>••••••••••••</Text>
                )}
                {password.length > 0 && (
                  showPwd ? (
                    <Text style={[mb.passwordInput, { paddingVertical: 0 }]}>{password}</Text>
                  ) : (
                    Array.from({ length: password.length }).map((_, i) => (
                      <View key={i} style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#111317" }} />
                    ))
                  )
                )}
                {pwdFocused && <BlinkingCursor color="#111317" height={18} />}
              </View>
              <TextInput
                ref={passwordInputRef}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0 }}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPwdFocused(true)}
                onBlur={() => setPwdFocused(false)}
                autoCapitalize="none"
                editable={!submitting}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPwd((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={18} color={MB.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={{ alignSelf: "flex-end", marginTop: 10 }}
          disabled={submitting}
          onPress={() => setForgotOpen(true)}
        >
          <Text style={mb.forgotLink}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

      </ScrollView>

      <ForgotPasswordModal visible={forgotOpen} onClose={() => setForgotOpen(false)} initialEmail={email} />

      <View style={mb.footer}>
        <TouchableOpacity onPress={onSubmit} activeOpacity={0.9} disabled={submitting}>
          <LinearGradient colors={["#2D6CFF", "#0035C5"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={mb.btn}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={mb.btnText}>Se connecter</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <View style={mb.footerLinksRow}>
          <TouchableOpacity onPress={onSwitchToPhone} disabled={submitting}>
            <Text style={mb.dashedLink}>Se connecter par SMS</Text>
          </TouchableOpacity>
          <View style={mb.footerLinksDivider} />
          <TouchableOpacity onPress={() => router.push("/support" as any)} disabled={submitting}>
            <Text style={mb.dashedText}>Besoin d'aide ?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ─── ONBOARDING — FLUX 3 ÉTAPES (intro → téléphone → email) ────────── */
function OnboardingFlow() {
  const mb = useMemo(() => mkMb(), []);
  const router = useRouter();
  // Après une déconnexion volontaire, on sait déjà que c'est un client
  // existant — autant l'envoyer direct sur l'étape téléphone plutôt que de
  // lui refaire choisir "Nouveau / Déjà client" sur l'écran d'intro.
  const { step: initialStep } = useLocalSearchParams<{ step?: string }>();
  const startOnPhone = initialStep === "phone";

  const [step, setStep] = useState<"intro" | "phone" | "securityPassword" | "email">(startOnPhone ? "phone" : "intro");
  const [userType, setUserType] = useState<"new" | "existing" | null>(startOnPhone ? "existing" : null);

  // Si cet écran était déjà monté dans la pile de navigation (ex: on y revient
  // après une déconnexion depuis une autre page), l'état initial ci-dessus ne
  // se réévalue pas tout seul — sans ce useEffect, on resterait bloqué sur
  // l'étape où on était la dernière fois (souvent "intro") au lieu de sauter
  // direct à "phone" comme demandé par le nouveau paramètre de route.
  useEffect(() => {
    if (startOnPhone) {
      setStep("phone");
      setUserType("existing");
    }
  }, [initialStep]);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityPassword, setSecurityPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [quickAccess] = useQuickAccessMutation();
  const [loginUser] = useLoginMutation();

  // Compte créé juste après l'onboarding. Si `telephone` correspond à un
  // compte existant (client qui revient), on le retrouve au lieu d'en créer
  // un nouveau — `securityPwd` n'est alors pas pris en compte. Pour un
  // nouveau compte, `securityPwd` est le mot de passe de sécurité choisi à
  // l'étape précédente.
  const handleQuickAccess = async (telephone?: string, securityPwd?: string, mustExist?: boolean) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res: any = await quickAccess(
        securityPwd || mustExist ? { telephone, password: securityPwd, mustExist } : telephone
      ).unwrap();
      await AsyncStorage.setItem("onboardingDone", "true");
      await persistAuthSession(res.token, res.refreshToken, { isQuickAccount: res.isQuickAccount });
      if (res.isNewAccount) {
        await AsyncStorage.setItem("firstOrderHintPending", "true");
      }
      DeviceEventEmitter.emit("auth:loggedIn");
      // Ce numéro appartient déjà à un profil chauffeur — on l'envoie
      // directement dans l'Espace Chauffeur plutôt que l'accueil classique.
      router.replace(res.isChauffeur ? "/transport/mode-chauffeur" : "/(tabs)");
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Une erreur est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  // Anciens comptes créés avec email + mot de passe (avant le numéro de
  // téléphone) : pas de numéro à retrouver, donc connexion classique.
  // Les comptes BIM (staff) atterrissent directement dans l'Espace Gestion —
  // plus besoin du code d'accès secret dans les paramètres pour y entrer.
  const handleEmailLogin = async () => {
    if (submitting) return;
    if (!email.trim() || !password) {
      Alert.alert("Erreur", "Entrez votre email et votre mot de passe.");
      return;
    }
    setSubmitting(true);
    try {
      const res: any = await loginUser({ email: email.trim(), password }).unwrap();
      await AsyncStorage.setItem("onboardingDone", "true");
      await persistAuthSession(res.token, res.refreshToken, { isQuickAccount: false });
      DeviceEventEmitter.emit("auth:loggedIn");
      router.replace(res.role === "BIM" ? "/gestion/home" : "/(tabs)");
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Connexion impossible. Vérifiez vos identifiants.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "intro") {
    return (
      <IntroStep
        mb={mb}
        userType={userType}
        setUserType={setUserType}
        submitting={submitting}
        onNext={() => setStep("phone")}
      />
    );
  }

  if (step === "phone") {
    return (
      <PhoneStep
        mb={mb}
        phone={phone}
        setPhone={setPhone}
        submitting={submitting}
        onBack={() => setStep("intro")}
        onSwitchToEmail={() => setStep("email")}
        onSubmit={(fullPhone) => {
          setPhone(fullPhone || "");
          if (userType === "existing") {
            handleQuickAccess(fullPhone || undefined, undefined, true);
          } else {
            setStep("securityPassword");
          }
        }}
      />
    );
  }

  if (step === "securityPassword") {
    return (
      <SecurityPasswordStep
        mb={mb}
        securityPassword={securityPassword}
        setSecurityPassword={setSecurityPassword}
        submitting={submitting}
        onBack={() => setStep("phone")}
        onSubmit={() => handleQuickAccess(phone || undefined, securityPassword)}
      />
    );
  }

  return (
    <EmailStep
      mb={mb}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      submitting={submitting}
      onBack={() => setStep("phone")}
      onSwitchToPhone={() => setStep("phone")}
      onSubmit={handleEmailLogin}
    />
  );
}

/* ─── EXPORT PRINCIPAL ───────────────────────────────────────────────── */
export default function Onboarding() {
  return <OnboardingFlow />;
}

/* ─── STYLE FACTORIES ────────────────────────────────────────────────── */
function mkMb() { return StyleSheet.create({
  root: { flex: 1, backgroundColor: MB.bg },

  /* ── Header (étapes téléphone/email) ── */
  navRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: Platform.OS === "ios" ? 14 : 18, paddingBottom: 4,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(0,0,0,0.05)",
    alignItems: "center", justifyContent: "center",
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  brandWordmark: {
    fontFamily: FONTS.bold, fontSize: 17, color: MB.dark, letterSpacing: 1,
    alignSelf: "center",
  },

  scrollWrap: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 16 },
  spacer: { height: 42 },
  spacerText: { height: 40 },

  /* ── Étape 1 : pile de cartes ── */
  stackWrap: { height: 250, alignItems: "center", justifyContent: "center" },
  stackCard: {
    position: "absolute", borderRadius: 24, backgroundColor: "#DCE3EA", overflow: "hidden",
  },
  stackCard1: {
    width: 200, height: 184, opacity: 0.55,
    transform: [{ rotate: "-16deg" }, { translateX: -28 }, { translateY: 6 }],
  },
  stackCard2: {
    width: 205, height: 188, opacity: 0.80,
    transform: [{ rotate: "-7deg" }, { translateX: -12 }, { translateY: 2 }],
  },
  stackCard3: {
    width: 210, height: 196, padding: 8,
    backgroundColor: MB.card, borderRadius: 26,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.9)",
    elevation: 4, shadowColor: "#16223A", shadowOpacity: 0.16, shadowRadius: 22, shadowOffset: { width: 0, height: 12 },
    transform: [{ rotate: "3deg" }, { translateX: 10 }, { translateY: -4 }],
  },
  stackArt: { width: "100%", height: "100%" },
  stackBackArt: { width: "100%", height: "100%" },
  stackBadge: {
    position: "absolute", bottom: 8, right: 10,
    backgroundColor: "#17191C", borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    elevation: 3, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  stackBadgeText: { fontFamily: FONTS.bold, fontSize: 11, color: "#fff" },

  textBlock: { alignItems: "center", marginTop: 10, marginBottom: 18 },
  h1: { fontFamily: FONTS.bold, fontSize: 23, color: "#11161A", textAlign: "center", lineHeight: 30 },
  p:  { fontFamily: FONTS.light, fontSize: 12.5, color: MB.muted, textAlign: "center", lineHeight: 19, marginTop: 8, maxWidth: 280 },
  h1C: { fontFamily: FONTS.bold, fontSize: 22, color: "#11161A", lineHeight: 28 },
  pC:  { fontFamily: FONTS.light, fontSize: 13, color: MB.muted, lineHeight: 19, marginTop: 8 },

  dotsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: MB.dotIdle },
  dotOn: { width: 20, backgroundColor: MB.dotActive },

  /* ── Étapes 2/3 : carte "accès sécurisé" ── */
  heroWrap: { height: 76, justifyContent: "center", marginTop: 8, marginBottom: 16 },
  heroCardBack: {
    position: "absolute", width: "72%", height: 56, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.6)", top: -8, left: 14,
    transform: [{ rotate: "-5deg" }],
  },
  heroCardFront: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: MB.card, borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: "rgba(0,0,0,0.04)",
    elevation: 3, shadowColor: "#16223A", shadowOpacity: 0.10, shadowRadius: 18, shadowOffset: { width: 0, height: 10 },
  },
  heroIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "#EEF3F7", alignItems: "center", justifyContent: "center",
  },
  heroIconWrapBrand: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(0,53,197,0.08)", alignItems: "center", justifyContent: "center",
  },
  heroTitle: { fontFamily: FONTS.bold, fontSize: 13, color: MB.dark },
  heroSub:   { fontFamily: FONTS.light, fontSize: 11, color: MB.muted, marginTop: 2 },

  secureBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: MB.cardLow, borderRadius: 16, padding: 14,
    marginTop: 10, marginBottom: 26,
  },
  secureIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: MB.card, alignItems: "center", justifyContent: "center",
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  sslPill: { backgroundColor: "rgba(143,174,199,0.18)", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  sslPillText: { fontFamily: FONTS.bold, fontSize: 9, color: MB.accentDk },

  /* ── Champs ── */
  inputCard: {
    backgroundColor: MB.card, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: MB.border, marginTop: 14,
    elevation: 1, shadowColor: "#0F172A", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  inputCardFocused: {
    borderColor: "#0035C5", borderWidth: 1.5,
    elevation: 3, shadowColor: "#0035C5", shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  inputCardError: {
    borderColor: "#EF4444", borderWidth: 1.5,
    elevation: 2, shadowColor: "#EF4444", shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  inputLabel: { fontFamily: FONTS.bold, fontSize: 10, color: MB.muted, letterSpacing: 1 },
  plainInput: { flex: 1, fontFamily: FONTS.bold, fontSize: 15, color: MB.dark },
  // Pas de police custom ici : un fontFamily non-système casse parfois
  // l'affichage des points masqués de secureTextEntry (glyphe manquant).
  passwordInput: { flex: 1, fontSize: 17, fontWeight: "700", color: "#000000" },
  smsPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(16,185,129,0.10)", borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  smsPillDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: MB.green },
  smsPillText: { fontFamily: FONTS.bold, fontSize: 10, color: MB.green },
  helpLink: {
    fontFamily: FONTS.light, fontSize: 12, color: MB.muted,
    textAlign: "center", marginTop: 12,
  },
  forgotLink: { fontFamily: FONTS.bold, fontSize: 12.5, color: MB.accentDk },
  flagChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#F5F6F9", borderWidth: 1, borderColor: "rgba(0,0,0,0.06)",
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8,
  },
  flagChipText: { fontFamily: FONTS.bold, fontSize: 13, color: MB.dark },
  zeroWarning: { fontFamily: FONTS.light, fontSize: 11.5, color: "#EF4444", marginTop: 8 },

  /* ── Sélecteur de pays (modal) ── */
  pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.40)", justifyContent: "flex-end" },
  pickerSheet: {
    backgroundColor: MB.card, borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingTop: 10, paddingBottom: Platform.OS === "ios" ? 24 : 16, paddingHorizontal: 20,
  },
  pickerHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: MB.border, alignSelf: "center", marginBottom: 12 },
  pickerHeaderRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10,
  },
  pickerTitle: { fontFamily: FONTS.bold, fontSize: 16, color: MB.dark },
  pickerCloseBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: MB.cardLow,
    alignItems: "center", justifyContent: "center",
  },
  pickerRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: MB.border,
  },
  pickerRowName: { flex: 1, fontFamily: FONTS.bold, fontSize: 14, color: MB.dark },
  pickerRowCode: { fontFamily: FONTS.light, fontSize: 13, color: MB.muted },

  dashedCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
    marginTop: 4, paddingVertical: 4,
  },
  dashedText: { fontFamily: FONTS.light, fontSize: 12, color: MB.muted },
  dashedLink: { fontFamily: FONTS.bold, fontSize: 12.5, color: MB.dark, textDecorationLine: "underline" },
  footerLinksRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 4 },
  footerLinksDivider: { width: 1, height: 12, backgroundColor: "rgba(0,0,0,0.15)" },

  /* ── Pied de page / CTA ── */
  footer: {
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 10,
  },
  toggleLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 },
  toggleLabel: { fontFamily: FONTS.bold, fontSize: 14, color: MB.dark, textAlign: "center" },
  segmented: {
    flexDirection: "row", backgroundColor: "rgba(226,232,240,0.6)", borderRadius: 18,
    padding: 4, gap: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.6)", marginBottom: 14,
  },
  segmentBtn: { flex: 1, borderRadius: 14, paddingVertical: 10, alignItems: "center" },
  segmentBtnOn: { backgroundColor: "#fff", elevation: 1, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  segmentText: { fontFamily: FONTS.bold, fontSize: 12.5, color: MB.muted },
  segmentTextOn: { color: MB.dark },
  warningRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 10, paddingHorizontal: 4 },
  warningText: { flex: 1, fontFamily: FONTS.light, fontSize: 10.5, color: "#EF4444", lineHeight: 15 },

  btn: {
    alignItems: "center", justifyContent: "center",
    borderRadius: 20, height: 56,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.35)",
    elevation: 8, shadowColor: "#0035C5", shadowOpacity: 0.45, shadowRadius: 22, shadowOffset: { width: 0, height: 10 },
  },
  btnText: { fontFamily: FONTS.bold, fontSize: 15.5, color: "#fff", letterSpacing: 0.2 },
}); }
