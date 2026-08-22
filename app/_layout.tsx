import "@/i18n";
import React from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { store, persistor } from "@/store/store";
import { PersistGate } from "redux-persist/integration/react";
import "react-native-reanimated";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, createContext, useContext, useState } from "react";
import { Animated, AppState, AppStateStatus, Image, StyleSheet, View, ActivityIndicator, Appearance, DeviceEventEmitter } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SocketProvider from "@/components/SocketProvider";
import logo from "@/assets/images/logo.jpeg";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Constants from "expo-constants";

/* ─── Config notifications (foreground + Android channel) ───────────── */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

const BASE_URL = Constants.expoConfig?.extra?.API_URL as string;

export const unstable_settings = { anchor: "(tabs)" };

SplashScreen.preventAutoHideAsync();

const COLORS = { primary: "#0353CC" };

/* ─── THEME CONTEXT ──────────────────────────────────────────────────── */
type ThemeContextType = {
  isDark:          boolean;
  followSystem:    boolean;
  toggleTheme:     () => void;
  setFollowSystem: (v: boolean) => void;
};

export const AppThemeContext = createContext<ThemeContextType>({
  isDark:          false,
  followSystem:    true,
  toggleTheme:     () => {},
  setFollowSystem: () => {},
});

export function useAppTheme() {
  return useContext(AppThemeContext);
}

/* ─── AUTH GUARD ─────────────────────────────────────────────────────── */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("auth:forceLogout", async () => {
      await AsyncStorage.multiRemove(["token", "refreshToken", "userId", "email"]);
      router.replace("/login");
    });
    return () => sub.remove();
  }, [router]);

  return <>{children}</>;
}

/* ─── ROOT LAYOUT ────────────────────────────────────────────────────── */
export default function RootLayout() {
  /* ── Theme state ── */
  const [isDark,       setIsDark]       = useState<boolean>(Appearance.getColorScheme() === "dark");
  const [followSystem, setFollowSystemState] = useState<boolean>(true);
  const [themeLoaded,  setThemeLoaded]  = useState(false);

  /* ── Ref synchrone pour éviter closure périmée dans le listener ── */
  const followSystemRef = useRef(true);

  /* ── Écran de reprise (arrière-plan → premier plan) ── */
  const [showResume,   setShowResume]   = useState(false);
  const resumeOpacity  = useRef(new Animated.Value(1)).current;
  const appStateRef    = useRef<AppStateStatus>(AppState.currentState);
  const backgroundedAt = useRef<number | null>(null); // timestamp ms quand l'app passe en background

  const pathname    = usePathname();
  const pathnameRef = useRef(pathname);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  const AUTH_RECOVERY_ROUTES = ["/forgot-password", "/check-pwd", "/reset-password"];

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (next: AppStateStatus) => {
      if (next === "background" || next === "inactive") {
        // Mémoriser quand l'app part en background
        if (appStateRef.current === "active") backgroundedAt.current = Date.now();
      }

      if (appStateRef.current === "background" && next === "active") {
        // N'afficher le splash de reprise que si l'app était vraiment en background ≥ 2 s
        // Évite les faux déclenchements pendant la navigation ou la fermeture du clavier
        const bgDuration = backgroundedAt.current ? Date.now() - backgroundedAt.current : 0;
        backgroundedAt.current = null;

        if (bgDuration >= 2000) {
          resumeOpacity.setValue(1);
          setShowResume(true);
          Animated.timing(resumeOpacity, {
            toValue: 0,
            duration: 500,
            delay: 800,
            useNativeDriver: true,
          }).start(() => setShowResume(false));
        }

        // Ne pas vérifier le token pendant le flux de récupération de mot de passe
        if (!AUTH_RECOVERY_ROUTES.includes(pathnameRef.current)) {
          try {
            const [[, token], [, refreshToken]] = await AsyncStorage.multiGet(["token", "refreshToken"]);
            if (!token || !refreshToken) {
              appStateRef.current = next;
              return;
            }

            const decoded = jwtDecode<{ exp: number }>(token);
            const isExpiredOrSoon = decoded.exp * 1000 < Date.now() + 5 * 60 * 1000;

            if (isExpiredOrSoon) {
              const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });
              await AsyncStorage.setItem("token", data.token);
            }
          } catch {
            // refresh échoué → déconnexion propre
            await AsyncStorage.multiRemove(["token", "refreshToken", "userId", "email"]);
            DeviceEventEmitter.emit("auth:forceLogout");
          }
        }
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [resumeOpacity]);

  /* ── Listener Appearance : source unique de vérité pour les changements système ── */
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      if (followSystemRef.current) {
        setIsDark(colorScheme === "dark");
      }
    });
    return () => sub.remove();
  }, []);

  /* ── Charger les préférences sauvegardées ── */
  useEffect(() => {
    AsyncStorage.getItem("themeMode").then((themeVal) => {
      if (themeVal === "dark") {
        followSystemRef.current = false;
        setFollowSystemState(false);
        setIsDark(true);
      } else if (themeVal === "light") {
        followSystemRef.current = false;
        setFollowSystemState(false);
        setIsDark(false);
      } else {
        followSystemRef.current = true;
        setFollowSystemState(true);
        setIsDark(Appearance.getColorScheme() === "dark");
      }
      setThemeLoaded(true);
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem("themeMode", next ? "dark" : "light");
  };

  const setFollowSystem = async (v: boolean) => {
    followSystemRef.current = v;
    setFollowSystemState(v);
    if (v) {
      await AsyncStorage.setItem("themeMode", "system");
      setIsDark(Appearance.getColorScheme() === "dark");
    } else {
      await AsyncStorage.setItem("themeMode", isDark ? "dark" : "light");
    }
  };

  /* ── Fonts ── */
  const [fontsLoaded] = useFonts({
    Gobold:      require("@/assets/fonts/Gobold Bold.otf"),
    NexaLight:   require("@/assets/fonts/Nexa-ExtraLight.ttf"),
    NexaRegular: require("@/assets/fonts/Nexa-ExtraLight.ttf"),
    NexaBold:    require("@/assets/fonts/Nexa-Heavy.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  /* ── Android notification channel (requis pour les push sur Android ≥ 8) ── */
  useEffect(() => {
    Notifications.setNotificationChannelAsync("default", {
      name:             "BIM NEXT",
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       "#0047FF",
      sound:            "default",
    });
  }, []);

  /* ── Loading ── */
  if (!fontsLoaded || !themeLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  /* ── App ── */
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <AppThemeContext.Provider value={{ isDark, followSystem, toggleTheme, setFollowSystem }}>
      <Provider store={store}>
        <PersistGate
          persistor={persistor}
          loading={
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.primary }}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          }
        >
          <SocketProvider>
            <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
              <AuthGuard>
              <Stack>
                <Stack.Screen name="onboarding"       options={{ headerShown: false }} />
                <Stack.Screen name="login"            options={{ headerShown: false }} />
                <Stack.Screen name="forgot-password"  options={{ headerShown: false }} />
                <Stack.Screen name="retrait"          options={{ headerShown: false }} />
                <Stack.Screen name="history"          options={{ headerShown: false }} />
                <Stack.Screen name="bim-carburant"    options={{ headerShown: false }} />
                <Stack.Screen name="bim-energie"      options={{ headerShown: false }} />
                <Stack.Screen name="hotellerie"       options={{ headerShown: false }} />
                <Stack.Screen name="bim-gaz"          options={{ headerShown: false }} />
                <Stack.Screen name="bim-supermarche" options={{ headerShown: false }} />
                <Stack.Screen name="company-portal"  options={{ headerShown: false }} />
                <Stack.Screen name="apropos"          options={{ headerShown: false }} />
                <Stack.Screen name="terms"            options={{ headerShown: false }} />
                <Stack.Screen name="transfert"        options={{ headerShown: false }} />
                <Stack.Screen name="profile"          options={{ headerShown: false }} />
                <Stack.Screen name="support"          options={{ headerShown: false }} />
                <Stack.Screen name="faqs"             options={{ headerShown: false }} />
                <Stack.Screen name="recharge"         options={{ headerShown: false }} />
                <Stack.Screen name="check-pwd"        options={{ headerShown: false }} />
                <Stack.Screen name="reset-password"   options={{ headerShown: false }} />
                <Stack.Screen name="mes-commandes"    options={{ headerShown: false }} />
                <Stack.Screen name="verify-code"      options={{ headerShown: false }} />
                <Stack.Screen name="register"         options={{ headerShown: false }} />
                <Stack.Screen name="transport"        options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)"           options={{ headerShown: false }} />
                <Stack.Screen name="receive"          options={{ headerShown: false }} />
                <Stack.Screen name="service"          options={{ headerShown: false }} />
                <Stack.Screen name="notification"     options={{ headerShown: false }} />
                <Stack.Screen name="sante"            options={{ headerShown: false }} />
                <Stack.Screen name="payment"          options={{ headerShown: false }} />
                <Stack.Screen name="qrcode"           options={{ headerShown: false }} />
                <Stack.Screen name="livreur"          options={{ headerShown: false }} />
                <Stack.Screen name="bim-sos"          options={{ headerShown: false }} />
                <Stack.Screen name="agent-dashboard"  options={{ headerShown: false }} />
                <Stack.Screen name="formation"        options={{ headerShown: false }} />
                <Stack.Screen name="favorites"        options={{ headerShown: false }} />
                <Stack.Screen name="recommended"      options={{ headerShown: false }} />
                <Stack.Screen name="modal"            options={{ presentation: "modal", title: "Modal" }} />
              </Stack>

              </AuthGuard>
              <StatusBar style={isDark ? "light" : "dark"} />

              {/* Écran de reprise — logo + dégradé, 800ms puis fondu */}
              {showResume && (
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    { opacity: resumeOpacity, zIndex: 9999, justifyContent: "center", alignItems: "center" },
                  ]}
                  pointerEvents="none"
                >
                  <LinearGradient
                    colors={["#060D1F", "#091528", "#0353CC"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={{
                    width: 96, height: 96, borderRadius: 26,
                    backgroundColor: "rgba(255,255,255,0.12)",
                    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)",
                    alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                    elevation: 14,
                    shadowColor: "#000", shadowOpacity: 0.3,
                    shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
                  }}>
                    <Image source={logo} style={{ width: 78, height: 78 }} resizeMode="contain" />
                  </View>
                </Animated.View>
              )}
            </ThemeProvider>
          </SocketProvider>
        </PersistGate>
      </Provider>
    </AppThemeContext.Provider>
    </GestureHandlerRootView>
  );
}