import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Application from "expo-application";
import * as Device from "expo-device";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useEffect, useMemo, useRef, useState } from "react";
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
} from "react-native";

import logo from "@/assets/images/logo.jpeg";
import { useAppTheme } from "@/app/_layout";
import { API_URL_BASE } from "@/constants/api";
import { useLoginMutation } from "@/services/authService";
import { useCreateHistoryMutation } from "@/services/historyService";
import { registerForPushNotificationsAsync } from "@/services/pushNotifications";
import { useTranslation } from "react-i18next";

const LIGHT = {
  bg:      "#F8F9FF",
  primary: "#0047FF",
  text:    "#1A1C1C",
  muted:   "#747688",
  input:   "#F4F6FF",
  border:  "#E8EDF5",
  red:     "#DC0302",
  green:   "#22C55E",
  white:   "#FFFFFF",
  cardBg:  "#FFFFFF",
  cardElev: 6,
  cardBord: "transparent",
};

const DARK: typeof LIGHT = {
  bg:      "#0B1220",
  primary: "#4D8DFF",
  text:    "#EAF0FF",
  muted:   "#9FB0D0",
  input:   "#182033",
  border:  "#1F2A44",
  red:     "#FF5A5A",
  green:   "#22C55E",
  white:   "#FFFFFF",
  cardBg:  "#1A2540",
  cardElev: 0,
  cardBord: "rgba(31,42,68,0.90)",
};

function mkS(C: typeof LIGHT) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: C.bg,
    },

    logoArea: {
      alignItems: "center",
      paddingTop: Platform.OS === "ios" ? 72 : 52,
      marginBottom: 24,
    },
    logoWrap: {
      width: 96, height: 96,
      borderRadius: 26,
      backgroundColor: C.white,
      borderWidth: 2,
      borderColor: "#C8D8FF",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      elevation: 8,
      shadowColor: C.primary,
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    logo: { width: 78, height: 78 },
    brand: {
      fontFamily: "NexaBold",
      fontSize: 20,
      color: C.primary,
      marginTop: 12,
      letterSpacing: 0.5,
    },

    card: {
      marginHorizontal: 16,
      backgroundColor: C.cardBg,
      borderRadius: 28,
      padding: 22,
      elevation: C.cardElev,
      borderWidth: 1.5,
      borderColor: C.cardBord,
      shadowColor: C.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 16,
    },

    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    dot:           { width: 4, height: 16, borderRadius: 2, backgroundColor: C.primary },
    sectionLabel:  { fontFamily: "NexaRegular", fontSize: 11, color: C.muted, letterSpacing: 1.2, textTransform: "uppercase" },

    title:    { fontFamily: "NexaBold", fontSize: 22, color: C.text, marginBottom: 5 },
    subtitle: { fontFamily: "NexaRegular", fontSize: 13, color: C.muted, lineHeight: 19, marginBottom: 22 },

    label: {
      fontFamily: "NexaRegular", fontSize: 11,
      color: C.muted, letterSpacing: 0.8,
      textTransform: "uppercase", marginBottom: 8,
    },

    inputRow: {
      flexDirection: "row", alignItems: "center",
      borderWidth: 1.5, borderColor: C.border,
      borderRadius: 18, height: 54,
      backgroundColor: C.input,
      marginBottom: 16,
      overflow: "hidden",
      paddingRight: 12,
    },
    inputFocused: { borderColor: C.primary, backgroundColor: C.input },

    iconBox: {
      width: 44, height: 44,
      borderRadius: 22,
      justifyContent: "center", alignItems: "center",
      marginHorizontal: 6,
      backgroundColor: "transparent",
    },
    iconBoxFocused: { backgroundColor: "#0047FF12" },
    trailIcon: { marginRight: 0 },

    input: {
      flex: 1, height: "100%",
      fontSize: 14, color: C.text,
      fontFamily: "NexaRegular",
    },
    eyeBtn: { padding: 4 },

    forgotRow: {
      flexDirection: "row", alignItems: "center",
      alignSelf: "flex-end", gap: 5,
      marginBottom: 20, marginTop: -4,
    },
    forgot: { fontFamily: "NexaRegular", fontSize: 13, color: C.muted },

    btn: {
      backgroundColor: C.primary,
      borderRadius: 18,
      height: 54,
      alignItems: "center",
      justifyContent: "center",
      elevation: 4,
      shadowColor: C.primary,
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    btnText: { fontFamily: "NexaBold", fontSize: 15, color: C.white, letterSpacing: 0.5 },

    divider: {
      flexDirection: "row", alignItems: "center",
      marginVertical: 20, gap: 12,
    },
    line:        { flex: 1, height: 1, backgroundColor: C.border },
    dividerText: { fontFamily: "NexaRegular", fontSize: 11, color: C.muted, fontWeight: "700" },

    outlineBtn: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: C.input,
      borderRadius: 18,
      paddingVertical: 12, paddingHorizontal: 14,
      gap: 12,
      borderWidth: 1, borderColor: C.border,
    },
    outlineBtnMain: { fontFamily: "NexaBold", fontSize: 14, color: C.text },
    outlineBtnSub:  { fontFamily: "NexaRegular", fontSize: 11, color: C.muted, marginTop: 2 },
  });
}

export default function LoginScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);

  const router = useRouter();
  const { t: tr } = useTranslation();

  const [login]           = useLoginMutation();
  const [createHistory]   = useCreateHistoryMutation();

  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [focused,     setFocused]     = useState<"email" | "password" | null>(null);
  const [showPwd,     setShowPwd]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);

  const cardSlide = useRef(new Animated.Value(60)).current;
  const cardOpac  = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpac  = useRef(new Animated.Value(0)).current;
  const floatY    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(logoOpac,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: 0, duration: 600, delay: 200, useNativeDriver: true }),
      Animated.timing(cardOpac,  { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -10, duration: 2800, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0,   duration: 2800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleLogin = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const deviceName = Device.deviceName || "Unknown device";
      const osName     = Device.osName || Platform.OS;
      const osVersion  = Device.osVersion || "";
      const appVersion = Application.nativeApplicationVersion || "";

      let locationName = "Inconnue";
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getLastKnownPositionAsync();
          if (loc) locationName = `${loc.coords.latitude}, ${loc.coords.longitude}`;
        }
      } catch {}

      const response = await login({
        email, password,
        device: `${deviceName} - ${osName} ${osVersion}`,
        location: locationName,
        appVersion,
      }).unwrap();

      if (!response) return;

      await AsyncStorage.multiSet([
        ["token",        response.token],
        ["refreshToken", response.refreshToken],
        ["lastActivity", String(Date.now())],
      ]);

      const decoded: any = jwtDecode(response.token);
      await AsyncStorage.multiSet([
        ["userId", String(decoded?.userId)],
        ["email",  decoded?.email],
      ]);

      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) {
        await axios.post(
          `${API_URL_BASE}/api/v1/auth/users/${decoded?.userId}/expoPushToken`,
          { tokenPush: pushToken }
        );
      }

      router.replace("/(tabs)");
    } catch (err) {
      const dataMess = err as any;
      const userId = await AsyncStorage.getItem("userId");
      try {
        await createHistory({
          type: "connexion",
          description: "Une tentative de connexion a été détectée, mais elle a échoué.",
          userId: userId || null,
          action: "Échec de la connexion",
        });
      } catch {}
      Alert.alert(dataMess?.data?.message || "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.bg} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo flottant */}
          <Animated.View style={[s.logoArea, { opacity: logoOpac, transform: [{ scale: logoScale }, { translateY: floatY }] }]}>
            <View style={s.logoWrap}>
              <Image source={logo} style={s.logo} resizeMode="contain" />
            </View>
            <Text style={s.brand}>BIMNext</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View style={[s.card, { opacity: cardOpac, transform: [{ translateY: cardSlide }] }]}>

            <View style={s.sectionHeader}>
              <View style={s.dot} />
              <Text style={s.sectionLabel}>{tr("auth.loginSection")}</Text>
            </View>

            <Text style={s.title}>{tr("auth.loginWelcome")}</Text>
            <Text style={s.subtitle}>{tr("auth.loginSub")}</Text>

            {/* Email */}
            <Text style={s.label}>{tr("auth.email")}</Text>
            <View style={[s.inputRow, focused === "email" && s.inputFocused]}>
              <View style={[s.iconBox, focused === "email" && s.iconBoxFocused]}>
                <Ionicons name="mail-outline" size={18} color={focused === "email" ? C.primary : C.muted} />
              </View>
              <TextInput
                style={s.input}
                placeholder={tr("auth.emailPH")}
                placeholderTextColor={C.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
              />
              {email.length > 0 && <Ionicons name="checkmark-circle" size={18} color={C.green} style={s.trailIcon} />}
            </View>

            {/* Password */}
            <Text style={s.label}>{tr("auth.password")}</Text>
            <View style={[s.inputRow, focused === "password" && s.inputFocused]}>
              <View style={[s.iconBox, focused === "password" && s.iconBoxFocused]}>
                <Ionicons name="lock-closed-outline" size={18} color={focused === "password" ? C.primary : C.muted} />
              </View>
              <TextInput
                style={s.input}
                placeholder={tr("auth.passwordPH")}
                placeholderTextColor={C.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
              />
              <TouchableOpacity onPress={() => setShowPwd(p => !p)} style={s.eyeBtn}>
                <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Mot de passe oublié */}
            <TouchableOpacity onPress={() => router.push("/forgot-password")} style={s.forgotRow}>
              <Ionicons name="help-circle-outline" size={14} color={C.muted} />
              <Text style={s.forgot}>{tr("auth.forgotPwd")}</Text>
            </TouchableOpacity>

            {/* Bouton connexion */}
            <TouchableOpacity style={s.btn} onPress={handleLogin} activeOpacity={0.88} disabled={submitting}>
              {submitting
                ? <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Ionicons name="reload-outline" size={18} color={C.white} />
                    <Text style={s.btnText}>Connexion...</Text>
                  </View>
                : <Text style={s.btnText}>{tr("auth.loginBtn")}</Text>}
            </TouchableOpacity>

            {/* Séparateur */}
            <View style={s.divider}>
              <View style={s.line} />
              <Text style={s.dividerText}>{tr("common.or")}</Text>
              <View style={s.line} />
            </View>

            {/* Créer un compte */}
            <TouchableOpacity style={s.outlineBtn} onPress={() => router.push("/register")} activeOpacity={0.85}>
              <View style={[s.iconBox, { backgroundColor: "#0047FF18" }]}>
                <FontAwesome6 name="user-plus" size={16} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.outlineBtnMain}>{tr("auth.registerBtn")}</Text>
                <Text style={s.outlineBtnSub}>{tr("auth.joinUs")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </TouchableOpacity>

            {/* Espace Livreur */}
            <TouchableOpacity style={[s.outlineBtn, { marginTop: 8 }]} onPress={() => router.push("/livreur/login")} activeOpacity={0.85}>
              <View style={[s.iconBox, { backgroundColor: "#22C55E18" }]}>
                <Ionicons name="bicycle" size={18} color={C.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.outlineBtnMain}>Espace Livreur</Text>
                <Text style={s.outlineBtnSub}>Accéder à votre espace de livraison</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </TouchableOpacity>

          </Animated.View>
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
