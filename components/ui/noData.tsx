import React from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

/* ─── THEME ──────────────────────────────────────────────────────────── */
const Colors = {
  light: {
    bg:            "#F0F4FF",
    title:         "#0D1B3E",
    subtitle:      "#7B8DB0",
    iconGrad:      ["#302E99", "#5A57D6"] as [string, string],
    iconGlow:      "#302E99",
    btnBg:         "#302E99",
    ringOuter:     "rgba(48,46,153,0.08)",
    ringInner:     "rgba(48,46,153,0.05)",
  },
  dark: {
    bg:            "#07091A",
    title:         "#E2E8F0",
    subtitle:      "#556080",
    iconGrad:      ["#1a1850", "#3733a0"] as [string, string],
    iconGlow:      "#0353CC",
    btnBg:         "#0353CC",
    ringOuter:     "rgba(77,150,255,0.07)",
    ringInner:     "rgba(77,150,255,0.04)",
  },
};

function useTheme() {
  const isDark = useColorScheme() === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

/* ─── COMPONENT ──────────────────────────────────────────────────────── */
export default function NotFound({ onRetry }: { onRetry?: () => void }) {
  const { isDark, t } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>

      {/* Decorative rings */}
      <View style={[styles.ringOuter, { backgroundColor: t.ringOuter }]}>
        <View style={[styles.ringInner, { backgroundColor: t.ringInner }]}>

          {/* Icon */}
          <LinearGradient
            colors={t.iconGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.iconContainer, { shadowColor: t.iconGlow }]}
          >
            <Svg height={70} width={70} viewBox="0 0 64 64">
              <Defs>
                <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                  <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </RadialGradient>
              </Defs>
              {/* Glow fill */}
              <Circle cx="32" cy="32" r="30" fill="url(#glow)" />
              {/* Outer ring */}
              <Circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.25)" strokeWidth="1" fill="none" />
              {/* X icon */}
              <Path
                d="M22 22 L42 42 M42 22 L22 42"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </Svg>
          </LinearGradient>

        </View>
      </View>

      {/* Text */}
      <Text style={[styles.title, { color: t.title }]}>
        Aucune donnée trouvée
      </Text>

      <Text style={[styles.subtitle, { color: t.subtitle }]}>
        Désolé 😕 nous n'avons trouvé aucune information pour le moment.
        Veuillez réessayer ou revenir plus tard.
      </Text>

      {/* Button */}
      {onRetry && (
        <TouchableOpacity activeOpacity={0.85} onPress={onRetry}>
          <LinearGradient
            colors={isDark ? ["#0353CC", "#3906C7"] : ["#302E99", "#0353CC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.button, { shadowColor: t.btnBg }]}
          >
            <Ionicons name="refresh" size={17} color="white" />
            <Text style={styles.buttonText}>Réessayer</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  /* Decorative pulsing rings */
  ringOuter: {
    width: 230,
    height: 230,
    borderRadius: 115,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  ringInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: "center",
    alignItems: "center",
  },

  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  title: {
    fontSize: 21,
    fontFamily: "NexaLight",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 0.2,
  },

  subtitle: {
    fontSize: 14,
    fontFamily: "NexaLight",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
    shadowOpacity: 0.30,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  buttonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "NexaLight",
    letterSpacing: 0.3,
  },
});