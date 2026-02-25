import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { ThemedText } from "../themed-text";
import { B, Colors } from "@/constants/theme";
import { GradientButtonProps } from "@/types/btnGradient.types";

/* ─── Hook thème ─────────────────────────────────────────────────────── */
function useTheme() {
  const isDark = useColorScheme() === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}



export default function GradientButton({
  title,
  onPress,
  leftIcon,
  rightIcon,
  isLoad   = false,
  disabled = false,
}: GradientButtonProps) {
  const { isDark } = useTheme();

  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const pressAnim   = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  /* Pulse */
  useEffect(() => {
    if (isLoad || disabled) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.025, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,     duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isLoad, disabled, pulseAnim]);

  /* Shimmer */
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 2, duration: 2200, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const pressIn  = () => Animated.spring(pressAnim, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true }).start();

  const combinedScale    = Animated.multiply(pulseAnim, pressAnim);
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange:  [-1, 2],
    outputRange: [-300, 300],
  });

  /* ── Couleurs adaptées au thème ── */
  const gradientColors = isLoad
    ? (isDark ? ["#080C14", "#0A1220"] : ["#6B7DB3", "#4A5FAD"])   // loading dark: très sombre
    : (isDark ? ["#050912", "#08112A"] : [B.deep, B.violet]);       // dark: quasi-noir → bleu nuit sombre

  const shadowColor = isDark ? "#000" : "#3906C7";
  const leftIconBg  = isDark ? "rgba(255,255,255,0.10)" : B.white;  // cercle discret en dark, blanc en light

  return (
    <Animated.View style={[
      s.wrapper,
      { transform: [{ scale: combinedScale }], shadowColor },
      disabled && s.wrapperDisabled,
    ]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
        disabled={isLoad || disabled}
      >
        <LinearGradient
          colors={gradientColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.gradient}
        >
          {/* Shimmer */}
          {!isLoad && !disabled && (
            <Animated.View style={[
              s.shimmer,
              { transform: [{ translateX: shimmerTranslate }],
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.07)"
                  : "rgba(255,255,255,0.12)" },
            ]} />
          )}

          {/* Left icon */}
          {leftIcon && !isLoad && (
            <View style={[s.leftIcon, { backgroundColor: leftIconBg }]}>
              {leftIcon}
            </View>
          )}

          {/* Loader ou texte */}
          {isLoad ? (
            <View style={s.loadingRow}>
              <ActivityIndicator size="small" color={B.white} />
              <ThemedText style={s.loadingText}>Chargement…</ThemedText>
            </View>
          ) : (
            <ThemedText style={s.text}>{title}</ThemedText>
          )}

          {/* Right icon */}
          {rightIcon && !isLoad && (
            <View style={s.rightIcon}>{rightIcon}</View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ─── STYLES ──────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  wrapper: {
    borderRadius: 18,
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius:  12,
    elevation: 8,
  },
  wrapperDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
  },

  gradient: {
    height: 58,
    width: "100%",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    overflow: "hidden",
  },

  shimmer: {
    position: "absolute",
    top: 0, bottom: 0,
    width: 60,
    transform: [{ skewX: "-20deg" }],
  },

  leftIcon: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3,
  },

  rightIcon: { opacity: 0.9 },

  text: {
    color: B.white,
    fontFamily: "NexaLight",
    fontSize: 15,
    letterSpacing: 0.4,
    flex: 1,
    textAlign: "center",
  },

  loadingRow: {
    flex: 1, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 10,
  },
  loadingText: {
    color: B.white,
    fontFamily: "NexaLight",
    fontSize: 14, letterSpacing: 0.3,
  },
});