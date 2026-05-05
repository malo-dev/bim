/**
 * VoiceNavigator — Bouton mic flottant
 *
 * - Actif seulement quand voiceEnabled = true (toggle Paramètres)
 * - En Expo Go : affiche une alerte informative
 * - En development build : reconnaissance vocale complète
 */
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGetAllSectorsQuery } from "@/services/sectorsServices";
import {
  useVoiceNavigation,
  SPEECH_RECOGNITION_AVAILABLE,
  VoiceState,
} from "@/hooks/useVoiceNavigation";
import { useAppTheme } from "@/app/_layout";

/* ─── Palette ────────────────────────────────────────────────────────── */
const PRIMARY = "#0353CC";
const DANGER  = "#EF4444";
const ORANGE  = "#F97316";

/* ─── Pulse ring behind button ───────────────────────────────────────── */
function PulseRing({ state }: { state: VoiceState }) {
  const scale = useRef(new Animated.Value(1)).current;
  const anim  = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    anim.current?.stop();
    if (state === "listening") {
      anim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.4, duration: 600, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1,   duration: 600, useNativeDriver: true }),
        ])
      );
      anim.current.start();
    } else {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    }
    return () => anim.current?.stop();
  }, [state]);

  const color =
    state === "listening"  ? DANGER  :
    state === "processing" ? ORANGE  :
    state === "error"      ? DANGER  : PRIMARY;

  return (
    <Animated.View
      style={[ring.circle, { backgroundColor: color, transform: [{ scale }] }]}
    />
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */
export default function VoiceNavigator() {
  const { isDark } = useAppTheme();
  const [showBubble, setShowBubble] = useState(false);

  /* Sectors pour la résolution des commandes */
  const { data: sectorsData } = useGetAllSectorsQuery({
    page: 1, pageSize: 20, search: "", paginate: false,
  });
  const sectors = (sectorsData?.data as any[] | undefined) ?? [];

  const {
    voiceState,
    transcript,
    feedback,
    startListening,
    stopListening,
    onSpeechResult,
    onSpeechError,
  } = useVoiceNavigation(sectors);

  /* ── Attacher les listeners natifs seulement si le module est dispo ── */
  useEffect(() => {
    if (!SPEECH_RECOGNITION_AVAILABLE) return;

    let sub1: { remove?: () => void } | null = null;
    let sub2: { remove?: () => void } | null = null;

    try {
      const mod = require("expo-speech-recognition");
      const emitter = mod.ExpoSpeechRecognitionModule;

      sub1 = emitter?.addListener?.("result", (e: any) => {
        const text: string = e?.results?.[0]?.transcript ?? "";
        if (text) onSpeechResult(text);
      }) ?? null;

      sub2 = emitter?.addListener?.("error", () => {
        onSpeechError();
      }) ?? null;
    } catch {
      // module non disponible — pas de crash
    }

    return () => {
      sub1?.remove?.();
      sub2?.remove?.();
    };
  }, [onSpeechResult, onSpeechError]);

  /* ── Bulle visible pendant 5 s après chaque transcript / feedback ─── */
  useEffect(() => {
    if (transcript || feedback) {
      setShowBubble(true);
      const t = setTimeout(() => setShowBubble(false), 5000);
      return () => clearTimeout(t);
    }
  }, [transcript, feedback]);

  const isListening = voiceState === "listening";
  const btnColor    = isListening ? DANGER : PRIMARY;
  const micIcon     = isListening ? "stop" : "mic";

  return (
    <View style={st.root} pointerEvents="box-none">

      {/* ── Badge "Expo Go" si module absent ── */}
      {!SPEECH_RECOGNITION_AVAILABLE && (
        <View style={[st.badge, { backgroundColor: isDark ? "#1E2A3A" : "#FFF7ED" }]}>
          <Text style={[st.badgeText, { color: ORANGE }]}>Dev build requis</Text>
        </View>
      )}

      {/* ── Bulle transcript / feedback ── */}
      {showBubble && (transcript || feedback) ? (
        <View style={[st.bubble, { backgroundColor: isDark ? "#1E2A3A" : "#FFFFFF" }]}>
          {transcript ? (
            <View style={st.bubbleRow}>
              <Ionicons name="mic-outline" size={11} color={PRIMARY} />
              <Text
                style={[st.bubbleText, { color: isDark ? "#CBD5E1" : "#0D1B3E" }]}
                numberOfLines={2}
              >
                {transcript}
              </Text>
            </View>
          ) : null}
          {feedback ? (
            <View style={st.bubbleRow}>
              <Ionicons name="volume-high-outline" size={11} color={ORANGE} />
              <Text
                style={[st.feedbackText, { color: isDark ? "#94A3B8" : "#64748B" }]}
                numberOfLines={3}
              >
                {feedback}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ── Label d'état ── */}
      {voiceState !== "idle" ? (
        <Text style={st.statusLabel}>
          {voiceState === "listening"  ? "Écoute…"      :
           voiceState === "processing" ? "Traitement…"  :
           voiceState === "error"      ? "Erreur"       : ""}
        </Text>
      ) : null}

      {/* ── Bouton mic ── */}
      <View style={st.btnWrap}>
        <PulseRing state={voiceState} />
        <TouchableOpacity
          onPress={isListening ? stopListening : startListening}
          activeOpacity={0.85}
          style={[st.btn, { backgroundColor: btnColor }]}
        >
          <Ionicons name={micIcon as any} size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────── */
const st = StyleSheet.create({
  root: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 105 : 85,
    right: 18,
    alignItems: "flex-end",
    gap: 6,
    zIndex: 9999,
  },

  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: ORANGE + "40",
  },
  badgeText: {
    fontFamily: "NexaLight",
    fontSize: 10,
  },

  bubble: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 220,
    gap: 4,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
  },
  bubbleText: {
    fontFamily: "NexaLight",
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  feedbackText: {
    fontFamily: "NexaLight",
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
    fontStyle: "italic",
  },

  statusLabel: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: "NexaLight",
    fontSize: 11,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  btnWrap: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  btn: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
});

const ring = StyleSheet.create({
  circle: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    opacity: 0.35,
  },
});
