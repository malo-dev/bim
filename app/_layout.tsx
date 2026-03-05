import "@/i18n";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { store, persistor } from "@/store/store";
import { PersistGate } from "redux-persist/integration/react";
import "react-native-reanimated";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, createContext, useContext, useState } from "react";
import { View, ActivityIndicator, Appearance } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SocketProvider from "@/components/SocketProvider";

export const unstable_settings = { anchor: "(tabs)" };

SplashScreen.preventAutoHideAsync();

const COLORS = { primary: "#0353CC" };

/* ─── THEME CONTEXT ──────────────────────────────────────────────────── */
type ThemeContextType = {
  isDark:      boolean;
  toggleTheme: () => void;
};

export const AppThemeContext = createContext<ThemeContextType>({
  isDark:      false,
  toggleTheme: () => {},
});

export function useAppTheme() {
  return useContext(AppThemeContext);
}

/* ─── ROOT LAYOUT ────────────────────────────────────────────────────── */
export default function RootLayout() {
  const systemScheme = useColorScheme();

  /* ── Dark mode state (manuel ou système) ── */
  const [isDark, setIsDark] = useState<boolean>(systemScheme === "dark");
  const [themeLoaded, setThemeLoaded] = useState(false);

  /* ── Charger la préférence sauvegardée ── */
  useEffect(() => {
    AsyncStorage.getItem("themeMode").then((val) => {
      if (val === "dark")  setIsDark(true);
      else if (val === "light") setIsDark(false);
      else setIsDark(systemScheme === "dark"); // fallback système
      setThemeLoaded(true);
    });
  }, [systemScheme]);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    Appearance.setColorScheme(next ? "dark" : "light");
    await AsyncStorage.setItem("themeMode", next ? "dark" : "light");
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
    <AppThemeContext.Provider value={{ isDark, toggleTheme }}>
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
          {/* ThemeProvider react-navigation branché sur isDark */}
          <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
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

            <StatusBar style={isDark ? "light" : "dark"} />
          </ThemeProvider>
          </SocketProvider>
        </PersistGate>
      </Provider>
    </AppThemeContext.Provider>
  );
}