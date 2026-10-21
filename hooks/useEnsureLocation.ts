import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useEffect } from "react";

const KEY = "lastKnownLocation";

/* Demande (une fois par session, sans bloquer l'app) l'autorisation de
 * localisation et garde la dernière position connue en cache local —
 * utilisée par BIM Transport, le suivi de livraison, etc. pour toujours
 * avoir une position de départ sans redemander à chaque écran. */
export function useEnsureLocation() {
  useEffect(() => {
    (async () => {
      try {
        const current = await Location.getForegroundPermissionsAsync();
        let granted = current.status === "granted";
        if (!granted) {
          const asked = await Location.requestForegroundPermissionsAsync();
          granted = asked.status === "granted";
        }
        if (!granted) return;

        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await AsyncStorage.setItem(KEY, JSON.stringify({
          lat: pos.coords.latitude, lng: pos.coords.longitude, at: Date.now(),
        }));
      } catch {}
    })();
  }, []);
}

export async function getLastKnownLocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { lat: parsed.lat, lng: parsed.lng };
  } catch {
    return null;
  }
}
