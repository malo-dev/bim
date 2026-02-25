import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useLogOutMutation } from "@/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/theme";

/* ─── Hook thème (même pattern) ─────────────────────────────────────── */
function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

/* ─── PALETTE BRAND (fixe) ───────────────────────────────────────────── */
const B = {
  primary: "#0353CC",
  violet:  "#3906C7",
  deep:    "#302E99",
  accent:  "#4D96FF",
  gold:    "#FFD700",
  white:   "#FFFFFF",
  red:     "#EF4444",
};

/* ─── DATA ───────────────────────────────────────────────────────────── */
const MENU_ITEMS = [
  { id: "profile",       title: "Mon profil",                  icon: "person-outline",             route: "/profile"      },
  { id: "notifications", title: "Notifications",               icon: "notifications-outline",       route: "/notification" },
  { id: "history",       title: "Historique des transactions", icon: "time-outline",                route: "/scan"         },
  { id: "support",       title: "Support",                     icon: "help-circle-outline",         route: "/support"      },
  { id: "terms",         title: "Termes d'utilisation",        icon: "document-text-outline",       route: "/terms"        },
  { id: "about",         title: "À propos de BIM",             icon: "information-circle-outline",  route: "/apropos"      },
];

const FAQS = [
  { q: "Comment envoyer de l'argent ?",            a: "Scannez simplement le QR code du bénéficiaire pour envoyer instantanément."       },
  { q: "Comment recevoir un paiement ?",           a: "Partagez votre QR code personnel avec vos clients via l'onglet Transactions."     },
  { q: "Mes transactions sont-elles sécurisées ?", a: "Oui, toutes les opérations sont protégées par des protocoles de sécurité avancés." },
];

/* ─── SECTION LABEL ──────────────────────────────────────────────────── */
function SectionLabel({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={sl.row}>
      <Ionicons name={icon as any} size={14} color="rgba(255,255,255,0.7)" />
      <Text style={sl.text}>{title}</Text>
    </View>
  );
}

/* ─── MENU ITEM ──────────────────────────────────────────────────────── */
function MenuItem({
  item, onPress, isLast, isDark, t,
}: {
  item: typeof MENU_ITEMS[number]; onPress: () => void;
  isLast: boolean; isDark: boolean; t: any;
}) {
  const scale    = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
      <Animated.View style={[
        ms.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: isDark ? "rgba(77,150,255,0.10)" : "rgba(3,83,204,0.10)" },
        { transform: [{ scale }] },
      ]}>
        <View style={[ms.iconWrap, {
          backgroundColor: isDark ? "rgba(77,150,255,0.12)" : "rgba(3,83,204,0.06)",
        }]}>
          <Ionicons name={item.icon as any} size={18} color={isDark ? "#93C5FD" : B.primary} />
        </View>
        <Text style={[ms.title, { color: isDark ? t.text : "#0D1B3E" }]}>
          {item.title}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={isDark ? t.textSecondary : "#7B8DB0"} />
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ─── FAQ ITEM ───────────────────────────────────────────────────────── */
function FaqItem({
  item, index, active, onToggle, isDark, t,
}: {
  item: typeof FAQS[number]; index: number; active: boolean;
  onToggle: () => void; isDark: boolean; t: any;
}) {
  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
      <View style={[
        fs.item,
        index < FAQS.length - 1 && {
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "rgba(77,150,255,0.10)" : "rgba(3,83,204,0.10)",
        },
      ]}>
        <View style={fs.row}>
          <View style={[fs.qIcon, {
            backgroundColor: isDark ? "rgba(77,150,255,0.15)" : B.primary + "15",
          }]}>
            <Text style={[fs.qLetter, { color: isDark ? "#93C5FD" : B.primary }]}>Q</Text>
          </View>
          <Text style={[fs.question, { color: isDark ? t.text : "#0D1B3E" }]} numberOfLines={active ? undefined : 2}>
            {item.q}
          </Text>
          <Ionicons
            name={active ? "chevron-up" : "chevron-down"}
            size={16}
            color={isDark ? t.textSecondary : "#7B8DB0"}
          />
        </View>
        {active && (
          <View style={[fs.answerBox, {
            backgroundColor: isDark ? "rgba(30,42,60,0.80)" : "rgba(3,83,204,0.06)",
            borderLeftColor: isDark ? "#4D96FF" : B.primary,
          }]}>
            <Text style={[fs.answer, { color: isDark ? t.textSecondary : "#7B8DB0" }]}>
              {item.a}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function Params() {
  const router = useRouter();
  const { isDark, t } = useTheme();
  const [logOut, { isLoading }] = useLogOutMutation();

  const [language,  setLanguage]  = useState("fr");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (i: number) => {
    LayoutAnimation.easeInEaseOut();
    setActiveFaq(activeFaq === i ? null : i);
  };

  const handleLogout = async () => {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vraiment vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnecter", style: "destructive",
          onPress: async () => {
            try {
              const email = await AsyncStorage.getItem("email");
              const res   = await logOut({ email: String(email) });
              if (res) {
                await AsyncStorage.clear();
                if (email) await AsyncStorage.setItem("email", email);
                router.replace("/login");
              }
            } catch (err: any) {
              Alert.alert(err?.data?.error || "Une erreur est survenue");
            }
          },
        },
      ]
    );
  };

  const headerGradient: [string, string] = isDark
    ? ["#1A1F3A", "#0A1628"]
    : [B.deep, B.primary];

  const cardBg      = isDark ? t.card    : "#FFFFFF";
  const dividerColor = isDark ? "rgba(77,150,255,0.10)" : "rgba(3,83,204,0.10)";

  return (
    <View style={[s.root, { backgroundColor: isDark ? t.background : B.primary }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── HEADER ── */}
        <View style={[s.header, { shadowColor: isDark ? "#000" : B.primary }]}>
          <LinearGradient
            colors={headerGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[s.deco1, {
            backgroundColor: isDark ? "rgba(77,150,255,0.10)" : "rgba(255,255,255,0.06)",
            borderWidth: isDark ? 1 : 0,
            borderColor: "rgba(77,150,255,0.15)",
          }]} />
          <View style={[s.deco2, {
            backgroundColor: isDark ? "rgba(57,6,199,0.18)" : "rgba(255,255,255,0.04)",
          }]} />

          <View style={s.topBar}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={B.white} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Paramètres</Text>
            <View style={{ width: 40 }} />
          </View>

          <Text style={s.headerSub}>Gérez votre compte et préférences</Text>
        </View>

        {/* ── PREFERENCES CARD ── */}
        <View style={s.section}>
          <SectionLabel title="Préférences" icon="settings-outline" />

          <View style={[s.card, {
            backgroundColor: cardBg,
            borderWidth: isDark ? 1 : 0,
            borderColor: "rgba(77,150,255,0.15)",
          }]}>
            {/* Langue */}
            <View style={s.prefRow}>
              <View style={s.prefLeft}>
                <View style={[s.prefIcon, {
                  backgroundColor: isDark ? "rgba(77,150,255,0.15)" : B.primary + "15",
                }]}>
                  <Ionicons name="language-outline" size={16} color={isDark ? "#93C5FD" : B.primary} />
                </View>
                <Text style={[s.prefLabel, { color: isDark ? t.text : "#0D1B3E" }]}>Langue</Text>
              </View>
              <TouchableOpacity
                style={[s.langBtn, {
                  backgroundColor: isDark ? "rgba(77,150,255,0.10)" : "rgba(3,83,204,0.06)",
                  borderColor:     isDark ? "rgba(77,150,255,0.20)" : "rgba(3,83,204,0.10)",
                }]}
                onPress={() => setLanguage(language === "fr" ? "en" : "fr")}
              >
                <Ionicons name="globe-outline" size={13} color={isDark ? "#93C5FD" : B.primary} />
                <Text style={[s.langText, { color: isDark ? "#93C5FD" : B.primary }]}>
                  {language === "fr" ? "🇫🇷 Français" : "🇬🇧 English"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[s.divider, { backgroundColor: dividerColor }]} />

            {/* Mode sombre (informatif — système) */}
            <View style={s.prefRow}>
              <View style={s.prefLeft}>
                <View style={[s.prefIcon, {
                  backgroundColor: isDark ? "rgba(139,92,246,0.18)" : "#8B5CF615",
                }]}>
                  <Ionicons
                    name={isDark ? "moon" : "sunny-outline"}
                    size={16}
                    color="#8B5CF6"
                  />
                </View>
                <Text style={[s.prefLabel, { color: isDark ? t.text : "#0D1B3E" }]}>
                  Mode sombre
                </Text>
              </View>
              {/* Reflect actual system theme — read only indicator */}
              <View style={[s.themeIndicator, {
                backgroundColor: isDark ? "rgba(139,92,246,0.18)" : "#8B5CF615",
                borderColor:     isDark ? "rgba(139,92,246,0.35)" : "#8B5CF630",
              }]}>
                <Text style={[s.themeIndicatorText, { color: "#8B5CF6" }]}>
                  {isDark ? "Activé" : "Désactivé"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── MENU ── */}
        <View style={s.section}>
          <SectionLabel title="Navigation" icon="grid-outline" />
          <View style={[s.card, {
            backgroundColor: cardBg,
            borderWidth: isDark ? 1 : 0,
            borderColor: "rgba(77,150,255,0.15)",
          }]}>
            {MENU_ITEMS.map((item, i) => (
              <MenuItem
                key={item.id}
                item={item}
                isLast={i === MENU_ITEMS.length - 1}
                isDark={isDark}
                t={t}
                onPress={() => router.push(item.route as any)}
              />
            ))}
          </View>
        </View>

        {/* ── FAQ ── */}
        <View style={s.section}>
          <SectionLabel title="FAQ" icon="help-buoy-outline" />
          <View style={[s.card, {
            backgroundColor: cardBg,
            borderWidth: isDark ? 1 : 0,
            borderColor: "rgba(77,150,255,0.15)",
          }]}>
            {FAQS.map((item, i) => (
              <FaqItem
                key={i}
                item={item}
                index={i}
                active={activeFaq === i}
                onToggle={() => toggleFaq(i)}
                isDark={isDark}
                t={t}
              />
            ))}
          </View>
        </View>

        {/* ── LOGOUT ── */}
        <View style={s.logoutWrap}>
          <GradientButton
            isLoad={isLoading}
            title="Déconnexion"
            onPress={handleLogout}
            leftIcon={<ArrowIcon width={18} height={12} color={B.violet} />}
            rightIcon={<ArrowRightIcon width={26} height={20} />}
          />
        </View>

        <Text style={s.version}>BIM NEXT · v1.0.0</Text>
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingBottom: 20 },

  header: {
    height: 180, overflow: "hidden",
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16,
    marginBottom: 20,
  },
  deco1: {
    position: "absolute", width: 180, height: 180,
    borderRadius: 90, top: -50, right: -40,
  },
  deco2: {
    position: "absolute", width: 120, height: 120,
    borderRadius: 60, bottom: -20, left: -20,
  },
  topBar: {
    marginTop: Platform.OS === "ios" ? 52 : 36,
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 20,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: B.white, fontSize: 17, fontFamily: "NexaLight", letterSpacing: 0.3 },
  headerSub: {
    color: "rgba(255,255,255,0.7)", fontSize: 12,
    fontFamily: "NexaLight", paddingHorizontal: 20, marginTop: 8,
  },

  section: { paddingHorizontal: 16, marginBottom: 16 },

  card: {
    borderRadius: 20, overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },

  prefRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  prefLeft:  { flexDirection: "row", alignItems: "center", gap: 10 },
  prefIcon:  { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  prefLabel: { fontFamily: "NexaLight", fontSize: 14 },

  divider: { height: 1, marginHorizontal: 16 },

  langBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1,
  },
  langText: { fontFamily: "NexaLight", fontSize: 12 },

  /* Indicateur mode sombre (système) */
  themeIndicator: {
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1,
  },
  themeIndicatorText: { fontFamily: "NexaLight", fontSize: 12 },

  logoutWrap: { paddingHorizontal: 16, marginBottom: 16 },

  version: {
    textAlign: "center", fontFamily: "NexaLight",
    fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4,
  },
});

const ms = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  title: { flex: 1, fontFamily: "NexaLight", fontSize: 14 },
});

const fs = StyleSheet.create({
  item:       { paddingHorizontal: 16, paddingVertical: 14 },
  row:        { flexDirection: "row", alignItems: "center", gap: 10 },
  qIcon:      { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  qLetter:    { fontFamily: "NexaLight", fontSize: 13 },
  question:   { flex: 1, fontFamily: "NexaLight", fontSize: 13 },
  answerBox:  { marginTop: 10, marginLeft: 38, borderRadius: 12, padding: 12, borderLeftWidth: 3 },
  answer:     { fontFamily: "NexaLight", fontSize: 12, lineHeight: 18 },
});

const sl = StyleSheet.create({
  row:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, paddingLeft: 4 },
  text: { fontFamily: "NexaLight", fontSize: 11, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.8 },
});