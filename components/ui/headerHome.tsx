import { checkAbonnementAndExpiry } from "@/utils/checkAbonnementAndExpiry.util";
import { formatNumber } from "@/utils/formatNUmber.util";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const W = {
  bg:      "#F8F9FF",
  primary: "#0047FF",
  text:    "#1A1C1C",
  muted:   "#747688",
  border:  "#E8EDF5",
  white:   "#FFFFFF",
  green:   "#22C55E",
};

type HeaderOFpageProps = {
  username?:       string;
  avatar?:         string;
  soldNumber?:     string;
  accountNumber?:  string;
  tokenAbonement?: string;
};

const HeaderOFpage: React.FC<HeaderOFpageProps> = ({
  username       = "Utilisateur",
  avatar,
  accountNumber,
  soldNumber,
  tokenAbonement,
}) => {
  const router     = useRouter();
  const unread     = useUnreadNotifications();
  const scaleNotif = useRef(new Animated.Value(1)).current;

  const press   = () => Animated.spring(scaleNotif, { toValue: 0.88, useNativeDriver: true }).start();
  const release = () => Animated.spring(scaleNotif, { toValue: 1,    useNativeDriver: true }).start();

  const avatarUri =
    avatar && typeof avatar === "string" && avatar.startsWith("http")
      ? avatar
      : "https://www.w3schools.com/howto/img_avatar.png";

  const expiry  = checkAbonnementAndExpiry(tokenAbonement ?? "");
  const balance = formatNumber(Number(soldNumber) ?? 0);

  const maskedAccount = accountNumber
    ? `•••• •••• •••• ${accountNumber.slice(-4)}`
    : "•••• •••• •••• 0000";

  return (
    <View style={s.wrapper}>
      {/* Top Bar */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: W.white }}>
        <View style={s.topBar}>
          <TouchableOpacity
            style={s.avatarArea}
            onPress={() => router.push("/profile")}
            activeOpacity={0.85}
          >
            <View style={s.avatarWrap}>
              <Image
                source={{ uri: avatarUri }}
                style={s.avatar}
                contentFit="cover"
                transition={200}
              />
              <View style={s.onlineDot} />
            </View>
            <View style={s.greetWrap}>
              <Text style={s.premiumLabel}>Premium Tier</Text>
              <Text style={s.greetName} numberOfLines={1}>
                Salut, {username.slice(0, 14)}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={1}
            onPressIn={press}
            onPressOut={release}
            onPress={() => router.push("/notification")}
          >
            <Animated.View style={[s.notifBtn, { transform: [{ scale: scaleNotif }] }]}>
              <Ionicons name="notifications-outline" size={20} color={W.text} />
              {unread > 0 && (
                <View style={s.notifBadge}>
                  <Text style={s.notifBadgeTxt}>{unread > 99 ? "99+" : unread}</Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Balance Card */}
      <View style={s.card}>
        <View style={s.deco1} />
        <View style={s.deco2} />

        {/* Top: balance + brand */}
        <View style={s.cardTopRow}>
          <View>
            <Text style={s.balanceLabel}>Solde Disponible</Text>
            <View style={s.balanceRow}>
              <Text style={s.balanceNum}>{balance}</Text>
              <Text style={s.balanceEC}>EC</Text>
            </View>
          </View>
          <Text style={s.brandTag}>BIMNext</Text>
        </View>

        {/* Bottom: card number + expire + status */}
        <View style={s.cardBottomRow}>
          <View>
            <Text style={s.cardNumber}>{maskedAccount}</Text>
            <View style={s.cardMeta}>
              <View>
                <Text style={s.metaLabel}>Expire</Text>
                <Text style={s.metaValue}>{expiry}</Text>
              </View>
              <View style={s.metaSep} />
              <View>
                <Text style={s.metaLabel}>Statut</Text>
                <View style={s.statusRow}>
                  <View style={s.statusDot} />
                  <Text style={s.statusText}>Actif</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={s.circles}>
            <View style={s.circle1} />
            <View style={s.circle2} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default HeaderOFpage;

const s = StyleSheet.create({
  wrapper: {
    backgroundColor: W.white,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 18,
  },

  avatarArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#0047FF08",
    borderWidth: 1, borderColor: "#00000008",
    overflow: "hidden",
  },
  avatar: { width: "100%", height: "100%" },
  onlineDot: {
    position: "absolute", bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: W.green,
    borderWidth: 1.5, borderColor: W.white,
  },

  greetWrap: { flex: 1 },
  premiumLabel: {
    fontFamily: "NexaRegular",
    fontSize: 9,
    color: "#0047FF55",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 1,
  },
  greetName: {
    fontFamily: "NexaBold",
    fontSize: 16,
    color: W.text,
  },

  notifBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: W.white,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: W.border,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.06,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  notifBadge: {
    position: "absolute", top: -3, right: -3,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: "#FF3B30",
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 2, borderColor: W.white,
  },
  notifBadgeTxt: {
    fontFamily: "NexaBold",
    fontSize: 9,
    color: W.white,
  },

  card: {
    borderRadius: 28,
    backgroundColor: W.white,
    borderWidth: 1.5,
    borderColor: W.border,
    padding: 24,
    minHeight: 168,
    justifyContent: "space-between",
    overflow: "hidden",
    elevation: 4,
    shadowColor: W.primary,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  deco1: {
    position: "absolute",
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: "#0047FF05",
    top: -90, right: -70,
  },
  deco2: {
    position: "absolute",
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: "#93C5FD07",
    bottom: -70, left: -50,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  balanceLabel: {
    fontFamily: "NexaRegular",
    fontSize: 10,
    color: W.muted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  balanceRow: { flexDirection: "row", alignItems: "baseline", gap: 7 },
  balanceNum: {
    fontFamily: "NexaBold",
    fontSize: 44,
    color: W.text,
    lineHeight: 50,
  },
  balanceEC: {
    fontFamily: "NexaBold",
    fontSize: 24,
    color: W.primary,
  },
  brandTag: {
    fontFamily: "NexaBold",
    fontSize: 18,
    color: "#0047FF28",
    fontStyle: "italic",
  },

  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 16,
  },
  cardNumber: {
    fontFamily: "NexaRegular",
    fontSize: 13,
    color: W.muted,
    letterSpacing: 3,
    marginBottom: 10,
  },
  cardMeta: { flexDirection: "row", gap: 18, alignItems: "center" },
  metaLabel: {
    fontFamily: "NexaRegular",
    fontSize: 9,
    color: "#AAB4C8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  metaValue: {
    fontFamily: "NexaBold",
    fontSize: 13,
    color: W.text,
  },
  metaSep: { width: 1, height: 26, backgroundColor: W.border },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: W.green,
  },
  statusText: {
    fontFamily: "NexaBold",
    fontSize: 12,
    color: W.green,
  },

  circles: { flexDirection: "row", alignItems: "center" },
  circle1: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "#0047FF10",
    borderWidth: 1, borderColor: W.white,
    elevation: 1,
  },
  circle2: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "#93C5FD15",
    borderWidth: 1, borderColor: W.white,
    marginLeft: -20,
    elevation: 1,
  },
});
