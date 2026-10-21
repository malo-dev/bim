import { useAppTheme } from "@/app/_layout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

const LIGHT = { bg: "#FFFFFF" };
const DARK  = { bg: "#0B1220" };

function mkS(C: typeof LIGHT) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: C.bg,
    },
  });
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export default function Index() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);

  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [[, token], [, onboardingDone], [, lastActivity], [, accountType]] =
        await AsyncStorage.multiGet(["token", "onboardingDone", "lastActivity", "accountType"]);

      if (token) {
        const now = Date.now();

        // Comptes "rapides" (créés sans email/mot de passe à la fin de
        // l'onboarding) : jamais de déconnexion forcée pour inactivité —
        // n'existe pas pour les comptes traditionnels (clé jamais écrite).
        if (accountType === "quick") {
          await AsyncStorage.setItem("lastActivity", String(now));
          setTarget("/(tabs)");
          return;
        }

        const inactive = lastActivity && (now - Number(lastActivity)) > SEVEN_DAYS;

        if (inactive) {
          // 7 jours sans ouvrir l'app → déconnexion automatique
          await AsyncStorage.multiRemove(["token", "refreshToken", "userId", "email", "lastActivity", "accountType"]);
        } else {
          // Session active → mettre à jour lastActivity et aller à l'accueil
          await AsyncStorage.setItem("lastActivity", String(now));
          setTarget("/(tabs)");
          return;
        }
      }

      setTarget("/onboarding");
    })();
  }, []);

  if (!target) {
    return (
      <View style={s.container}>
        <ActivityIndicator size="large" color="#0047FF" />
      </View>
    );
  }

  return <Redirect href={target as any} />;
}
