import { ThemedText } from "@/components/themed-text";
import { checkAbonnementAndExpiry } from "@/utils/checkAbonnementAndExpiry.util";
import { formatNumber } from "@/utils/formatNUmber.util";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import React, { useRef } from "react";
import {
  Animated,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  useColorScheme,
  Text,
} from "react-native";
import { Colors } from "@/constants/theme";

/* ─── Hook thème (même pattern) ─────────────────────────────────────── */
function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

/* ─── PALETTE BRAND (fixe — le gradient reste bleu en dark ET light) ── */
const B = {
  primary: "#0353CC",
  violet:  "#3906C7",
  deep:    "#302E99",
  accent:  "#4D96FF",
  gold:    "#FFD700",
  white:   "#FFFFFF",
  muted:   "rgba(255,255,255,0.6)",
};

/* ─── TYPES ──────────────────────────────────────────────────────────── */
type HeaderOFpageProps = {
  username?:       string;
  avatar?:         string;
  soldNumber?:     string;
  accountNumber?:  string;
  tokenAbonement?: string;
};

/* ─── COMPONENT ──────────────────────────────────────────────────────── */
const HeaderOFpage: React.FC<HeaderOFpageProps> = ({
  username       = "Utilisateur",
  avatar,
  accountNumber,
  soldNumber,
  tokenAbonement,
}) => {
  const router = useRouter();
  const { isDark } = useTheme();

  const scaleAvatar = useRef(new Animated.Value(1)).current;
  const scaleNotif  = useRef(new Animated.Value(1)).current;

  const press   = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 0.88, useNativeDriver: true }).start();
  const release = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 1,    useNativeDriver: true }).start();

  const avatarUri =
    avatar && typeof avatar === "string" && avatar.startsWith("http")
      ? avatar
      : "https://www.w3schools.com/howto/img_avatar.png";

  const expiry  = checkAbonnementAndExpiry(tokenAbonement ?? "");
  const balance = formatNumber(Number(soldNumber) ?? 0);

  const maskedAccount = accountNumber
    ? `•••• •••• ${accountNumber.slice(-4)}`
    : "•••• •••• 0000";

  /* En dark mode le gradient est légèrement plus profond/foncé */
  const gradientColors: [string, string] = isDark
    ? ["#1A1F3A", "#0A1628"]
    : [B.deep, B.primary];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.wrapper}
    >
      {/* Déco circles — plus visibles en dark */}
      <View style={[s.deco1, {
        backgroundColor: isDark
          ? "rgba(77,150,255,0.10)"
          : "rgba(255,255,255,0.05)",
        borderWidth: isDark ? 1 : 0,
        borderColor: isDark ? "rgba(77,150,255,0.15)" : "transparent",
      }]} />
      <View style={[s.deco2, {
        backgroundColor: isDark
          ? "rgba(57,6,199,0.18)"
          : "rgba(255,255,255,0.03)",
      }]} />

      {/* ── TOP BAR ── */}
      <View style={s.topBar}>

        {/* Avatar */}
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => press(scaleAvatar)}
          onPressOut={() => release(scaleAvatar)}
          onPress={() => router.push("/profile")}
        >
          <Animated.View style={[
            s.avatarWrap,
            {
              transform: [{ scale: scaleAvatar }],
              borderColor: isDark ? B.accent : B.gold,
            },
          ]}>
            <Image
              source={{ uri: avatarUri }}
              style={s.avatar}
              contentFit="cover"
              transition={200}
            />
            <View style={[s.onlineDot, {
              borderColor: isDark ? "#1A1F3A" : B.deep,
            }]} />
          </Animated.View>
        </TouchableOpacity>

        {/* Greeting */}
        <View style={s.greetWrap}>
          <Text style={[s.greetSub, {
            color: isDark ? "rgba(147,197,253,0.7)" : B.muted,
          }]}>
            Bonjour 👋
          </Text>
          <Text style={s.greetName} numberOfLines={1}>
            {username.slice(0, 18)}
          </Text>
        </View>

        {/* Notif */}
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => press(scaleNotif)}
          onPressOut={() => release(scaleNotif)}
          onPress={() => router.push("/notification")}
        >
          <Animated.View style={[
            s.notifBtn,
            {
              transform: [{ scale: scaleNotif }],
              backgroundColor: isDark
                ? "rgba(77,150,255,0.20)"
                : "rgba(255,255,255,0.15)",
              borderWidth: isDark ? 1 : 0,
              borderColor: "rgba(77,150,255,0.25)",
            },
          ]}>
            <Ionicons name="notifications-outline" size={20} color={B.white} />
            <View style={[s.notifBadge, {
              borderColor: isDark ? "#1A1F3A" : B.deep,
            }]} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* ── BIM CARD ── */}
      <View style={[s.card, {
        // En dark : card plus sombre avec bordure subtile
        borderWidth: isDark ? 1 : 0,
        borderColor: isDark ? "rgba(77,150,255,0.20)" : "transparent",
        shadowColor: isDark ? "#000" : "#000",
        shadowOpacity: isDark ? 0.5 : 0.35,
      }]}>
        <LinearGradient
          colors={isDark ? ["#2D1B8A", "#1A1560"] : ["#4C3AFF", B.deep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Card déco */}
        <View style={[s.cardDeco1, {
          backgroundColor: isDark
            ? "rgba(77,150,255,0.08)"
            : "rgba(255,255,255,0.05)",
        }]} />
        <View style={[s.cardDeco2, {
          backgroundColor: isDark
            ? "rgba(255,215,0,0.05)"
            : "rgba(255,255,255,0.04)",
        }]} />

        {/* Card top */}
        <View style={s.cardTop}>
          <View>
            <Text style={s.cardBrand}>BIM</Text>
            <Text style={[s.cardTier, { color: isDark ? "#93C5FD" : B.gold }]}>
              STANDARD
            </Text>
          </View>

          {/* Chip décoratif */}
          <View style={[s.chipWrap, {
            backgroundColor: isDark ? "rgba(147,197,253,0.15)" : B.gold + "30",
            borderColor:     isDark ? "rgba(147,197,253,0.30)" : B.gold + "50",
          }]}>
            <View style={[s.chipInner, {
              backgroundColor: isDark ? "rgba(147,197,253,0.10)" : B.gold + "20",
              borderColor:     isDark ? "rgba(147,197,253,0.25)" : B.gold + "40",
            }]} />
          </View>

          <Ionicons name="card" size={32} color="rgba(255,255,255,0.3)" />
        </View>

        {/* Account number */}
        <Text style={s.cardNumber}>{maskedAccount}</Text>

        {/* Card bottom */}
        <View style={s.cardBottom}>

          {/* Expiry */}
          <View>
            <Text style={s.cardLabel}>EXPIRE</Text>
            <TouchableOpacity onPress={() => router.push("/recharge")}>
              <Text style={s.cardValue}>{expiry}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.cardDivider} />

          {/* Balance */}
          <View style={s.balanceCol}>
            <Text style={s.cardLabel}>SOLDE DISPONIBLE</Text>
            <View style={s.balanceRow}>
              <Text style={s.balanceValue}>{balance}</Text>
              <View style={[s.ecoinsBadge, {
                backgroundColor: isDark ? "rgba(147,197,253,0.15)" : B.gold + "25",
                borderColor:     isDark ? "rgba(147,197,253,0.30)" : B.gold + "40",
              }]}>
                <Text style={[s.ecoinsText, {
                  color: isDark ? "#93C5FD" : B.gold,
                }]}>EC</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contactless */}
        <View style={s.contactless}>
          <Ionicons
            name="wifi"
            size={18}
            color="rgba(255,255,255,0.25)"
            style={{ transform: [{ rotate: "90deg" }] }}
          />
        </View>
      </View>
    </LinearGradient>
  );
};

export default HeaderOFpage;

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  wrapper: {
    paddingTop: Platform.OS === "ios" ? 26 : 32,
    paddingHorizontal: 20,
    paddingBottom: 52,
    overflow: "hidden",
  },

  deco1: {
    position: "absolute", width: 220, height: 220,
    borderRadius: 110,
    top: -70, right: -60,
  },
  deco2: {
    position: "absolute", width: 140, height: 140,
    borderRadius: 70,
    bottom: 20, left: -40,
  },

  topBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 24,
  },

  avatarWrap: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2.5,
    overflow: "hidden",
  },
  avatar: { width: "100%", height: "100%" },

  onlineDot: {
    position: "absolute", bottom: 2, right: 2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: "#22C55E",
    borderWidth: 2,
  },

  greetWrap: { flex: 1, paddingHorizontal: 14 },
  greetSub: {
    fontSize: 11,
    fontFamily: "NexaLight",
  },
  greetName: {
    color: B.white,
    fontSize: 16,
    fontFamily: "NexaLight",
    letterSpacing: 0.2,
  },

  notifBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
  },
  notifBadge: {
    position: "absolute", top: 9, right: 9,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: B.gold,
    borderWidth: 1.5,
  },

  /* BIM Card */
  card: {
    borderRadius: 22, padding: 20,
    overflow: "hidden",
    elevation: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    minHeight: 170,
  },

  cardDeco1: {
    position: "absolute", width: 160, height: 160,
    borderRadius: 80,
    top: -40, right: -30,
  },
  cardDeco2: {
    position: "absolute", width: 100, height: 100,
    borderRadius: 50,
    bottom: -20, left: 20,
  },

  cardTop: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 18,
  },

  cardBrand: {
    color: B.white, fontSize: 20,
    fontFamily: "NexaLight", letterSpacing: 3,
  },
  cardTier: {
    fontSize: 10, fontFamily: "NexaLight",
    letterSpacing: 2, marginTop: 2,
  },

  chipWrap: {
    width: 36, height: 28, borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center", alignItems: "center",
  },
  chipInner: {
    width: 20, height: 16, borderRadius: 3,
    borderWidth: 1,
  },

  cardNumber: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 16, fontFamily: "NexaLight",
    letterSpacing: 3, marginBottom: 18,
  },

  cardBottom: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
  },

  cardLabel: {
    color: B.muted, fontSize: 9,
    fontFamily: "NexaLight", letterSpacing: 1,
    marginBottom: 4,
  },
  cardValue: {
    color: B.white, fontSize: 14,
    fontFamily: "NexaLight",
  },

  cardDivider: {
    width: 1, height: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  balanceCol: { alignItems: "flex-end" },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  balanceValue: {
    color: B.white, fontSize: 18,
    fontFamily: "NexaLight",
  },

  ecoinsBadge: {
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1,
  },
  ecoinsText: {
    fontSize: 10, fontFamily: "NexaLight",
  },

  contactless: {
    position: "absolute", top: 20, right: 56,
  },
});