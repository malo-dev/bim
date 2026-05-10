import "@/i18n";
import React from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { store, persistor } from "@/store/store";
import { PersistGate } from "redux-persist/integration/react";
import "react-native-reanimated";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, createContext, useContext, useState } from "react";
import { Animated, AppState, AppStateStatus, Image, StyleSheet, View, ActivityIndicator, Appearance, DeviceEventEmitter } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SocketProvider from "@/components/SocketProvider";
import logo from "@/assets/images/logo.jpeg";

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
  const systemScheme = useColorScheme();

  /* ── Theme state ── */
  const [isDark,       setIsDark]       = useState<boolean>(systemScheme === "dark");
  const [followSystem, setFollowSystemState] = useState<boolean>(true);
  const [themeLoaded,  setThemeLoaded]  = useState(false);

  /* ── Écran de reprise (arrière-plan → premier plan) ── */
  const [showResume, setShowResume] = useState(false);
  const resumeOpacity = useRef(new Animated.Value(1)).current;
  const appStateRef   = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (appStateRef.current === "background" && next === "active") {
        resumeOpacity.setValue(1);
        setShowResume(true);
        Animated.timing(resumeOpacity, {
          toValue: 0,
          duration: 500,
          delay: 800,
          useNativeDriver: true,
        }).start(() => setShowResume(false));
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [resumeOpacity]);

  /* ── Charger les préférences sauvegardées ── */
  useEffect(() => {
    AsyncStorage.getItem("themeMode").then((themeVal) => {
      if (themeVal === "dark") {
        setFollowSystemState(false);
        setIsDark(true);
      } else if (themeVal === "light") {
        setFollowSystemState(false);
        setIsDark(false);
      } else {
        // "system" ou null (premier lancement) → suivre le système
        setFollowSystemState(true);
        setIsDark(systemScheme === "dark");
      }
      setThemeLoaded(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Quand le système change et que followSystem est actif ── */
  useEffect(() => {
    if (followSystem) {
      setIsDark(systemScheme === "dark");
      // Ne pas appeler Appearance.setColorScheme ici :
      // on laisse le système piloter — tout appel ici verrouille la valeur
    }
  }, [systemScheme, followSystem]);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    Appearance.setColorScheme(next ? "dark" : "light");
    await AsyncStorage.setItem("themeMode", next ? "dark" : "light");
  };

  const setFollowSystem = async (v: boolean) => {
    setFollowSystemState(v);
    if (v) {
      await AsyncStorage.setItem("themeMode", "system");
      // Libérer le contrôle au système (null = reset override)
      Appearance.setColorScheme(null);
      setIsDark(systemScheme === "dark");
    } else {
      // Figer sur le thème actuel
      await AsyncStorage.setItem("themeMode", isDark ? "dark" : "light");
      Appearance.setColorScheme(isDark ? "dark" : "light");
    }
  };

  /* ── Fonts ── */
  const [fontsLoaded] = useFonts({
    Gobold:    require("@/assets/fonts/Gobold Bold.otf"),
    NexaLight: require("@/assets/fonts/Nexa-ExtraLight.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

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
                <Stack.Screen name="apropos"          options={{ headerShown: false }} />
                <Stack.Screen name="terms"            options={{ headerShown: false }} />
                <Stack.Screen name="transfert"        options={{ headerShown: false }} />
                <Stack.Screen name="profile"          options={{ headerShown: false }} />
                <Stack.Screen name="support"          options={{ headerShown: false }} />
                <Stack.Screen name="faqs"             options={{ headerShown: false }} />
                <Stack.Screen name="recharge"         options={{ headerShown: false }} />
                <Stack.Screen name="check-pwd"        options={{ headerShown: false }} />
                <Stack.Screen name="reset-password"   options={{ headerShown: false }} />
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
  );
}