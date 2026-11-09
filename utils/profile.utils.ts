/**
 * Nom affiché, initiales et photo de profil.
 *
 * La photo de profil reste sur le téléphone : elle est copiée dans le dossier
 * Documents de l'app (le cache du sélecteur peut être vidé par le système) et
 * son chemin est rangé dans AsyncStorage sous `profilePhoto:<userId>`.
 * Elle n'est jamais envoyée au serveur.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Paths } from "expo-file-system";
import { useCallback, useEffect, useState } from "react";
import { DeviceEventEmitter } from "react-native";
import { API_URL_BASE } from "@/constants/api";

const isAuto = (v?: string | null) => !v || String(v).startsWith("quick_");

/** Nom complet saisi à l'inscription (fullname), sinon le nom d'utilisateur s'il n'est pas automatique. */
export function displayName(user: any): string {
  const full = String(user?.fullname ?? "").trim();
  if (full) return full;
  const u = String(user?.username ?? "").trim();
  return isAuto(u) ? "" : u;
}

export function firstName(user: any): string {
  return displayName(user).split(/\s+/)[0] ?? "";
}

/** « Mushio Ataulwa » → « MA » ; « B » tant qu'aucun nom n'est connu. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return (parts.map((w) => w[0]).join("") || "B").toUpperCase();
}

const key = (userId: string) => `profilePhoto:${userId}`;
export const PROFILE_PHOTO_KEY_PREFIX = "profilePhoto:";
const EVENT = "profile:photoChanged";

/** Photo enregistrée sur ce téléphone, sinon l'ancienne photo serveur (comptes existants). */
export function useProfilePhoto(userId: string | null, serverImageUrl?: string | null) {
  const [local, setLocal] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setLocal(null); return; }
    let alive = true;
    AsyncStorage.getItem(key(userId)).then((uri) => {
      if (!alive) return;
      if (uri && new File(uri).exists) setLocal(uri);
      else setLocal(null);
    }).catch(() => {});
    const sub = DeviceEventEmitter.addListener(EVENT, (e: { userId: string; uri: string | null }) => {
      if (e.userId === userId) setLocal(e.uri);
    });
    return () => { alive = false; sub.remove(); };
  }, [userId]);

  const server = serverImageUrl
    ? (String(serverImageUrl).startsWith("http") ? serverImageUrl : `${API_URL_BASE}${serverImageUrl}`)
    : null;

  const save = useCallback(async (pickedUri: string) => {
    if (!userId) return;
    const ext = (pickedUri.split("?")[0].split(".").pop() || "jpg").toLowerCase();
    // Nom unique à chaque changement : sinon expo-image garde l'ancienne image en cache.
    const dest = new File(Paths.document, `profile_${userId}_${Date.now()}.${ext === "png" ? "png" : "jpg"}`);
    await new File(pickedUri).copy(dest);
    const previous = await AsyncStorage.getItem(key(userId));
    await AsyncStorage.setItem(key(userId), dest.uri);
    if (previous && previous !== dest.uri) {
      try { const f = new File(previous); if (f.exists) f.delete(); } catch {}
    }
    setLocal(dest.uri);
    DeviceEventEmitter.emit(EVENT, { userId, uri: dest.uri });
  }, [userId]);

  return { photo: local ?? server, save };
}

/** Efface la photo locale (suppression du compte). */
export async function removeProfilePhoto(userId: string | null) {
  if (!userId) return;
  const uri = await AsyncStorage.getItem(key(userId));
  if (uri) { try { const f = new File(uri); if (f.exists) f.delete(); } catch {} }
  await AsyncStorage.removeItem(key(userId));
  DeviceEventEmitter.emit(EVENT, { userId, uri: null });
}
