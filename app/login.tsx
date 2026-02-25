import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Application from "expo-application";
import * as Device from "expo-device";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useState, useRef, useEffect } from "react";
import { C, Colors} from "@/constants/theme";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Animated,
  Dimensions,
  Text,
  StatusBar,
   useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import logo from "@/assets/images/logo.jpeg";
import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { API_URL_BASE } from "@/constants/api";
import { useLoginMutation } from "@/services/authService";
import { useCreateHistoryMutation } from "@/services/historyService";
import { useCreateNotificationMutation } from "@/services/notificationService";
import {
  registerForPushNotificationsAsync,
  sendLocalNotification,
} from "@/services/pushNotifications";

const {height } = Dimensions.get("window");

function useTheme() {
  const scheme = useColorScheme();
  const isDark  = scheme === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}



/* ─── LOGIN SCREEN ───────────────────────────────────────────────────── */
export default function LoginScreen() {
  const router = useRouter();

  const [login, { isLoading }] = useLoginMutation();
  const [createHistory]        = useCreateHistoryMutation();
  const [createNotification]   = useCreateNotificationMutation();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [focusedInput, setFocusedInput] = useState<"email" | "password" | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  /* ── Animations ── */
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
        Animated.timing(floatY, { toValue: -8, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0,  duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, [cardOpac, cardSlide, floatY, logoOpac, logoScale]);

   const { isDark,t }             = useTheme();

  /* ── Handlers ── */
  const handleLogin = async () => {

    console.log(API_URL_BASE)
    try {
      const deviceName = Device.deviceName || "Unknown device";
      const osName     = Device.osName || Platform.OS;
      const osVersion  = Device.osVersion || "";
      const appVersion = Application.nativeApplicationVersion || "";

      let locationName = "Inconnue";
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        locationName = `${loc.coords.latitude}, ${loc.coords.longitude}`;
      }

      const response = await login({
        email, password,
        device: `${deviceName} - ${osName} ${osVersion}`,
        location: locationName,
        appVersion,
      }).unwrap();

      if (!response) return;

      await AsyncStorage.multiSet([
        ["token", response.token],
        ["refreshToken", response.refreshToken],
      ]);

      const decoded: any = jwtDecode(response.token);
      await AsyncStorage.multiSet([
        ["userId", String(decoded?.userId)],
        ["email", decoded?.email],
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
          action: "Échec de la connexion ❌",
        });
        await createNotification({
          title: "Échec de connexion",
          message: "Une tentative de connexion a échoué.",
          type: "ERREUR",
          userId: userId || null,
        });
        await sendLocalNotification("Échec de connexion ❌", "Une tentative de connexion a échoué.");
      } catch {
        Alert.alert("Une erreur est survenue");
      }
      Alert.alert(dataMess?.data?.message || "Une erreur est survenue");
    }
  };

  /* ── Render ── */
  return (
    <View style={[{ flex: 1 }, { backgroundColor: t.gradientEnd }]}>
      <StatusBar barStyle="light-content" />

      {/* Gradient bg — même que FullScreenLoader du home */}
      <LinearGradient
        colors={
          isDark
            ? ["#060D1F", "#091528", "#0D1F3C"]
            : [t.gradientStart, t.gradientEnd, t.accent]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Cercles décoratifs — pattern home */}
      <View style={[s.circle, s.circle1]} />
      <View style={[s.circle, s.circle2]} />
      <View style={[s.circle, s.circle3]} />
      <View style={[s.circle, s.circle4]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Logo flottant ── */}
          <Animated.View
            style={[
              s.logoArea,
              { opacity: logoOpac, transform: [{ scale: logoScale }, { translateY: floatY }] },
            ]}
          >
            <View style={s.logoWrap}>
              <Image source={logo} style={s.logo} resizeMode="contain" />
            </View>

            {/* Barre accent tricolore — même pattern que sectorAccent du home */}
            <View style={s.logoAccentBar}>
              <View style={[s.logoAccentSeg, { backgroundColor: C.primary, flex: 2 }]} />
              <View style={[s.logoAccentSeg, { backgroundColor: C.red,     flex: 1 }]} />
              <View style={[s.logoAccentSeg, { backgroundColor: C.violet,  flex: 1 }]} />
            </View>
          </Animated.View>

          {/* ── Card (même ombre / rayon que quickCard du home) ── */}
          <Animated.View
            style={[s.cardWrap, { opacity: cardOpac, transform: [{ translateY: cardSlide }] }]}
          >

            {/* Section header — copie exacte du home */}
            <View style={s.sectionHeader}>
              <View style={[s.sectionDot, { backgroundColor: C.accent }]} />
              <Text style={s.sectionLabel}>CONNEXION</Text>
            </View>

            <Text style={s.title}>Bon retour parmi nous !</Text>
            <Text style={s.subtitle}>
              Connectez-vous et plongez dans une expérience unique
            </Text>

            {/* ── EMAIL ── */}
            <Text style={s.label}>Adresse email</Text>
            <View style={[s.inputRow, focusedInput === "email" && s.inputFocused]}>
              {/* iconCircle — copie de home */}
              <View style={[s.iconCircle, { backgroundColor: focusedInput === "email" ? C.primary + "18" : C.f4 }]}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={focusedInput === "email" ? C.primary : C.muted}
                />
              </View>
              <TextInput
                style={s.input}
                placeholder="exemple@gmail.com"
                placeholderTextColor={C.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedInput("email")}
                onBlur={() => setFocusedInput(null)}
              />
              {email.length > 0 && (
                <Ionicons name="checkmark-circle" size={18} color="#22C55E" style={{ marginRight: 12 }} />
              )}
            </View>

            {/* ── PASSWORD ── */}
            <Text style={s.label}>Mot de passe</Text>
            <View style={[s.inputRow, focusedInput === "password" && s.inputFocused]}>
              <View style={[s.iconCircle, { backgroundColor: focusedInput === "password" ? C.primary + "18" : C.f4 }]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={focusedInput === "password" ? C.primary : C.muted}
                />
              </View>
              <TextInput
                style={s.input}
                placeholder="Votre mot de passe"
                placeholderTextColor={C.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={s.eyeBtn}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={C.muted}
                />
              </TouchableOpacity>
            </View>

            {/* Forgot */}
            <TouchableOpacity
              onPress={() => router.push("/forgot-password")}
              style={s.forgotRow}
            >
              <FontAwesome6 name="circle-question" size={12} color={C.red} />
              <Text style={s.forgot}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {/* Login button */}
            <GradientButton
              isLoad={isLoading}
              title="Se connecter"
              onPress={handleLogin}
              leftIcon={<ArrowIcon width={20} height={14} />}
              rightIcon={<ArrowRightIcon width={30} height={24} />}
            />

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.line} />
              <View style={s.dividerBadge}>
                <Text style={s.dividerText}>OU</Text>
              </View>
              <View style={s.line} />
            </View>

            {/* Register — même btn style que ActionButton du home */}
            <TouchableOpacity
              style={s.registerBtn}
              onPress={() => router.push("/register")}
              activeOpacity={0.85}
            >
              <View style={[s.iconCircle, { backgroundColor: C.violet + "18" }]}>
                <FontAwesome6 name="user-plus" size={16} color={C.violet} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.registerMain}>Créer un compte</Text>
                <Text style={s.registerSub}>Rejoignez-nous en quelques secondes</Text>
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

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: C.deep,
  },

  /* Cercles décoratifs */
  circle: {
    position: "absolute",
    borderRadius: 999,
  },
  circle1: {
    width: 320, height: 320,
    top: -140, right: -130,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  circle2: {
    width: 160, height: 160,
    top: 80, right: -40,
    backgroundColor: "rgba(220,3,2,0.12)",
  },
  circle3: {
    width: 200, height: 200,
    bottom: 160, left: -90,
    backgroundColor: "rgba(57,6,199,0.15)",
  },
  circle4: {
    width: 70, height: 70,
    top: height * 0.32, left: 24,
    backgroundColor: "rgba(77,150,255,0.13)",
  },

  /* Logo */
  logoArea: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 72 : 52,
    marginBottom: 22,
  },
  logoWrap: {
    width: 96, height: 96,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    elevation: 14,
    shadowColor: C.black,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  logo: {
    width: 78, height: 78,
  },
  logoAccentBar: {
    flexDirection: "row",
    width: 56, height: 3,
    borderRadius: 2,
    marginTop: 14,
    overflow: "hidden",
    gap: 2,
  },
  logoAccentSeg: {
    height: "100%",
    borderRadius: 2,
  },

  /* Card — même ombre que quickCard du home */
  cardWrap: {
    marginHorizontal: 16,
    backgroundColor: C.white,
    borderRadius: 28,
    padding: 22,
    elevation: 10,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },

  /* Section header — copie exacte du home */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionDot: {
    width: 4, height: 16,
    borderRadius: 2,
  },
  sectionLabel: {
    fontFamily: "NexaLight",
    fontSize: 11,
    color: C.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  title: {
    fontFamily: "NexaLight",
    fontSize: 23,
    fontWeight: "700",
    color: C.text,
    marginBottom: 5,
  },
  subtitle: {
    fontFamily: "NexaLight",
    fontSize: 13,
    color: C.muted,
    lineHeight: 19,
    marginBottom: 24,
  },

  label: {
    fontFamily: "NexaLight",
    fontSize: 11,
    color: C.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },

  /* Input row — même forme arrondie que btn du home */
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E8EDF5",
    borderRadius: 18,
    height: 54,
    backgroundColor: C.f4,
    marginBottom: 16,
    overflow: "hidden",
    paddingRight: 12,
  },
  inputFocused: {
    borderColor: C.primary,
    backgroundColor: "#EEF4FF",
  },

  /* iconCircle — copie exacte du home */
  iconCircle: {
    width: 44, height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
  },

  input: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: C.text,
    fontFamily: "NexaLight",
  },
  eyeBtn: {
    padding: 4,
  },

  forgotRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 5,
    marginBottom: 20,
    marginTop: -4,
  },
  forgot: {
    fontFamily: "NexaLight",
    fontSize: 13,
    color: C.red,
    fontWeight: "600",
  },

  /* Divider */
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E8EDF5",
  },
  dividerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: C.f4,
    borderWidth: 1,
    borderColor: "#E8EDF5",
  },
  dividerText: {
    fontFamily: "NexaLight",
    fontSize: 11,
    color: C.muted,
    fontWeight: "700",
    letterSpacing: 1,
  },

  /* Register — ActionButton style du home */
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.f4,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  registerMain: {
    fontFamily: "NexaLight",
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
  },
  registerSub: {
    fontFamily: "NexaLight",
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
});