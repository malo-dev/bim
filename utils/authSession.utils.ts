import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

// Utilisé par le nouveau flux "compte rapide" (onboarding) — login.tsx garde
// son propre bloc équivalent intact pour ne prendre aucun risque sur le flux
// de connexion traditionnel existant.
export async function persistAuthSession(
  token: string,
  refreshToken: string,
  opts: { isQuickAccount: boolean }
) {
  await AsyncStorage.multiSet([
    ["token", token],
    ["refreshToken", refreshToken],
    ["lastActivity", String(Date.now())],
    ["accountType", opts.isQuickAccount ? "quick" : "traditional"],
  ]);
  const decoded: any = jwtDecode(token);
  await AsyncStorage.multiSet([
    ["userId", String(decoded?.userId)],
    ["email", decoded?.email ?? ""],
  ]);
  return decoded;
}
