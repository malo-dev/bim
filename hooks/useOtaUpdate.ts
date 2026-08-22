import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as Updates from "expo-updates";

/**
 * Détecte les mises à jour OTA publiées via `eas update` (bundle JS, pas
 * besoin de repasser par le PlayStore). Vérifie au lancement ET à chaque
 * retour au premier plan (ex: l'utilisateur revient du PlayStore après avoir
 * cliqué sur "Nouvelle version disponible") — si un bundle est trouvé à ce
 * moment-là, il est appliqué automatiquement (l'app se recharge toute seule).
 * `available`/`apply` restent exposés pour la bannière manuelle si l'utilisateur
 * est resté dans l'app.
 */
export function useOtaUpdate() {
  const [available, setAvailable] = useState(false);
  const [applying, setApplying] = useState(false);
  const applyingRef = useRef(false);

  const apply = useCallback(async () => {
    if (applyingRef.current) return;
    applyingRef.current = true;
    try {
      setApplying(true);
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch {
      applyingRef.current = false;
      setApplying(false);
    }
  }, []);

  const checkNow = useCallback(async (autoApply: boolean) => {
    if (!Updates.isEnabled || __DEV__) return;
    try {
      const result = await Updates.checkForUpdateAsync();
      setAvailable(result.isAvailable);
      if (result.isAvailable && autoApply) await apply();
    } catch {}
  }, [apply]);

  useEffect(() => {
    checkNow(false);

    const sub = AppState.addEventListener("change", (state) => {
      // Retour au premier plan (ex: après le PlayStore) : on revérifie et on
      // applique directement s'il y a un nouveau bundle, sans attendre un clic.
      if (state === "active") checkNow(true);
    });

    return () => sub.remove();
  }, [checkNow]);

  return { available, applying, apply };
}
