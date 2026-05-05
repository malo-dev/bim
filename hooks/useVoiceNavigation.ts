/**
 * useVoiceNavigation — Navigation vocale complète pour BIM
 *
 * Fonctionne avec expo-speech-recognition + expo-speech (déjà installés).
 * Nécessite un development build (pas Expo Go) pour le module natif STT.
 * Si le module natif est absent, affiche une alerte informative.
 *
 * Commandes vocales (fr/en) :
 *   Secteurs  : "santé", "carburant", "énergie", "gaz", "hôtellerie", "transport"
 *   Finance   : "payer [montant]", "retirer [montant]", "transférer [montant]", "recharger"
 *   Navigation: "accueil", "retour", "aide"
 */
import { useState, useCallback } from "react";
import { Alert, NativeModules } from "react-native";
import { router } from "expo-router";
import { useDispatch } from "react-redux";
import { setSectors } from "@/services/globalApi";

/* ─── Availability check (sync, no import needed) ───────────────────── */
export const SPEECH_RECOGNITION_AVAILABLE = !!NativeModules.ExpoSpeechRecognition;

/* ─── Types ──────────────────────────────────────────────────────────── */
export type VoiceState = "idle" | "listening" | "processing" | "error";

export interface SectorLike {
  businessId: number;
  name: string;
}

/* ─── Mots-clés par catégorie de secteur ─────────────────────────────── */
const SECTOR_KEYWORDS: Record<string, string[]> = {
  santé:      ["santé", "sante", "clinique", "médical", "medical", "hôpital", "hopital", "health", "pharmacie"],
  carburant:  ["carburant", "essence", "fuel", "station", "pétrole", "petrole"],
  énergie:    ["énergie", "energie", "energy", "électricité", "electricite", "solaire", "courant"],
  gaz:        ["gaz", "gas", "bouteille", "butane", "propane"],
  hôtellerie: ["hôtel", "hotel", "hotellerie", "hôtellerie", "hébergement", "hebergement", "séjour"],
  transport:  ["transport", "taxi", "bus", "trajet", "voyage", "déplacement"],
  fun:        ["fun", "divertissement", "loisir", "entertainment", "sport"],
};

/* ─── TTS helper (expo-speech est disponible dans Expo Go) ────────────── */
async function speakText(text: string): Promise<void> {
  try {
    const Speech = require("expo-speech");
    Speech.speak(text, { language: "fr-FR", rate: 0.9 });
  } catch {
    // expo-speech indisponible
  }
}

/* ─── Hook principal ─────────────────────────────────────────────────── */
export function useVoiceNavigation(sectors: SectorLike[]) {
  const dispatch = useDispatch();
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [feedback, setFeedback]     = useState<string>("");

  const speak = useCallback((text: string) => {
    speakText(text);
    setFeedback(text);
    setTimeout(() => setFeedback(""), 4500);
  }, []);

  /* ── Command processor ─────────────────────────────────────────────── */
  const processCommand = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();
    setTranscript(lower);
    setVoiceState("processing");

    /* — Navigation générale — */
    if (lower.includes("accueil") || lower.includes("home")) {
      speak("Navigation vers l'accueil");
      setTimeout(() => router.replace("/(tabs)" as any), 600);
      setVoiceState("idle");
      return;
    }

    if (lower.includes("retour") || lower.includes("back")) {
      speak("Retour");
      setTimeout(() => router.back(), 400);
      setVoiceState("idle");
      return;
    }

    if (
      lower.includes("paramètre") ||
      lower.includes("parametre") ||
      lower.includes("setting")
    ) {
      speak("Paramètres");
      setTimeout(() => router.push("/(tabs)/params" as any), 600);
      setVoiceState("idle");
      return;
    }

    if (lower.includes("aide") || lower.includes("help")) {
      speak(
        "Commandes disponibles : accueil, retour, santé, carburant, énergie, gaz, " +
        "hôtellerie, transport, payer, retirer, transférer, ou recharger."
      );
      setVoiceState("idle");
      return;
    }

    /* — Secteurs — */
    for (const [, keywords] of Object.entries(SECTOR_KEYWORDS)) {
      if (keywords.some((kw) => lower.includes(kw))) {
        const matched = sectors.find((s) => {
          const sn = s.name.toLowerCase();
          return keywords.some((kw) =>
            sn.includes(kw.replace(/[éèê]/g, "e").replace(/[ôo]/g, "o"))
          );
        });

        if (matched) {
          speak(`Navigation vers ${matched.name}`);
          dispatch(setSectors([matched as any]));
          setTimeout(() => router.push(`/service/${matched.businessId}` as any), 600);
        } else {
          speak("Secteur non disponible pour le moment.");
        }
        setVoiceState("idle");
        return;
      }
    }

    /* — Transactions financières — */
    const amountMatch = lower.match(/\b(\d+)\b/);
    const amount = amountMatch ? amountMatch[1] : null;

    if (lower.includes("payer") || lower.includes("pay") || lower.includes("paiement")) {
      speak(amount ? `Paiement de ${amount} Ecoins` : "Paiement");
      setTimeout(() => router.push("/payment" as any), 600);
      setVoiceState("idle");
      return;
    }

    if (lower.includes("retirer") || lower.includes("retrait") || lower.includes("withdraw")) {
      speak(amount ? `Retrait de ${amount} Ecoins` : "Retrait");
      setTimeout(() => router.push("/retrait" as any), 600);
      setVoiceState("idle");
      return;
    }

    if (
      lower.includes("transférer") ||
      lower.includes("transferer") ||
      lower.includes("transfer") ||
      lower.includes("transfert")
    ) {
      speak(amount ? `Transfert de ${amount} Ecoins` : "Transfert");
      setTimeout(() => router.push("/transfert" as any), 600);
      setVoiceState("idle");
      return;
    }

    if (lower.includes("recharger") || lower.includes("recharge")) {
      speak(amount ? `Recharge de ${amount} Ecoins` : "Recharge");
      setTimeout(() => router.push("/recharge" as any), 600);
      setVoiceState("idle");
      return;
    }

    speak("Commande non reconnue. Dites aide pour la liste des commandes.");
    setVoiceState("idle");
  }, [dispatch, sectors, speak]);

  /* ── Start listening ────────────────────────────────────────────────── */
  const startListening = useCallback(async () => {
    if (!SPEECH_RECOGNITION_AVAILABLE) {
      Alert.alert(
        "Navigation vocale",
        "Cette fonctionnalité nécessite un development build.\n\n" +
        "Lancez l'app avec :\n  npx expo run:android\n  npx expo run:ios",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const mod = require("expo-speech-recognition");
      const { granted } = await mod.ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        speak("Permission microphone refusée. Activez-la dans les paramètres.");
        return;
      }
      setTranscript("");
      setFeedback("");
      setVoiceState("listening");
      mod.ExpoSpeechRecognitionModule.start({ lang: "fr-FR", interimResults: false });
    } catch (e) {
      speak("Erreur lors du démarrage de l'écoute.");
      setVoiceState("error");
      setTimeout(() => setVoiceState("idle"), 2000);
    }
  }, [speak]);

  /* ── Stop listening ─────────────────────────────────────────────────── */
  const stopListening = useCallback(() => {
    if (!SPEECH_RECOGNITION_AVAILABLE) return;
    try {
      const mod = require("expo-speech-recognition");
      mod.ExpoSpeechRecognitionModule.stop();
    } catch {
      // ignore
    }
    setVoiceState("idle");
  }, []);

  /* ── Event handlers (appelés depuis VoiceNavigator) ─────────────────── */
  const onSpeechResult = useCallback((text: string) => {
    processCommand(text);
  }, [processCommand]);

  const onSpeechError = useCallback(() => {
    speak("Erreur d'écoute. Réessayez.");
    setVoiceState("idle");
  }, [speak]);

  return {
    voiceState,
    transcript,
    feedback,
    startListening,
    stopListening,
    onSpeechResult,
    onSpeechError,
  };
}
