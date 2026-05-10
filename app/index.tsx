import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [[, token], [, refreshToken], [, onboardingDone]] =
        await AsyncStorage.multiGet(["token", "refreshToken", "onboardingDone"]);

      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          const expired = decoded.exp * 1000 < Date.now();

          if (!expired) {
            setTarget("/(tabs)");
            return;
          }
          // token expiré mais refresh présent → intercepteur axios renouvellera
          if (refreshToken) {
            setTarget("/(tabs)");
            return;
          }
          // token expiré + pas de refresh → nettoyer
          await AsyncStorage.multiRemove(["token", "refreshToken", "userId", "email"]);
        } catch {
          await AsyncStorage.multiRemove(["token", "refreshToken", "userId", "email"]);
        }
      }

      setTarget(onboardingDone ? "/login" : "/onboarding");
    })();
  }, []);

  if (!target) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#302E99", "#0353CC"]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return <Redirect href={target as any} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
