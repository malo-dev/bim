import { useAppTheme } from "@/app/_layout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTh } from "@/components/bim/theme";
import { BLogo, Breath } from "@/components/bim/ui";

const LIGHT = { bg: "#041659" };
const DARK  = { bg: "#041659" };

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
  const th = useTh();
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);

  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [[, token], [, onboardingDone], [, lastActivity], [, accountType], [, homeSpace], [, livreurToken]] =
        await AsyncStorage.multiGet(["token", "onboardingDone", "lastActivity", "accountType", "homeSpace", "livreurToken"]);

      // Espace choisi à la connexion par e-mail (voir finish() dans onboarding).
      if (homeSpace === "livreur" && livreurToken) { setTarget("/livreur/space"); return; }

      if (token) {
        const now = Date.now();
        if (homeSpace === "gestion") { await AsyncStorage.setItem("lastActivity", String(now)); setTarget("/gestion/home"); return; }
        if (homeSpace === "chauffeur") { await AsyncStorage.setItem("lastActivity", String(now)); setTarget("/transport/mode-chauffeur"); return; }

        // Comptes "rapides" (créés sans email/mot de passe à la fin de
        // l'onboarding) : jamais de déconnexion forcée pour inactivité —
        // n'existe pas pour les comptes traditionnels (clé jamais écrite).
        if (accountType === "quick") {
          await AsyncStorage.setItem("lastActivity", String(now));
          setTarget("/(tabs)");
          return;
        }

        // Une fois connecté, on ne se reconnecte plus jamais (plus de déconnexion
        // après 7 jours d'inactivité) : seule une déconnexion volontaire, la suppression
        // du compte ou une connexion sur un autre téléphone ferme la session.
        await AsyncStorage.setItem("lastActivity", String(now));
        setTarget("/(tabs)");
        return;
      }

      setTarget("/onboarding");
    })();
  }, []);

  if (!target) {
    // Écran de lancement : icône BIM NEXT sur le fond du thème (comme un splash screen).
    return (
      <View style={[s.container, { backgroundColor: th.base, backgroundImage: th.bgCss }]}>
        <Breath><BLogo size={104} /></Breath>
        <ActivityIndicator size="small" color={th.fg} style={{ marginTop: 28 }} />
      </View>
    );
  }

  return <Redirect href={target as any} />;
}
