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
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLogOutMutation } from "@/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/theme";
import { useAppTheme } from "@/app/_layout";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/i18n";

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

const LANGUAGES = [
  { code: "fr", label: "🇫🇷 Français"  },
  { code: "en", label: "🇬🇧 English"   },
  { code: "ln", label: "🇨🇩 Lingala"   },
  { code: "sw", label: "🇹🇿 Swahili"   },
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
  item, onPress, isLast, isDark, theme,
}: {
  item: { id: string; title: string; icon: string; route: string };
  onPress: () => void;
  isLast: boolean; isDark: boolean; theme: any;
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
        <Text style={[ms.title, { color: isDark ? theme.text : "#0D1B3E" }]}>
          {item.title}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={isDark ? theme.textSecondary : "#7B8DB0"} />
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ─── FAQ ITEM ───────────────────────────────────────────────────────── */
function FaqItem({
  item, index, total, active, onToggle, isDark, theme,
}: {
  item: { q: string; a: string }; index: number; total: number; active: boolean;
  onToggle: () => void; isDark: boolean; theme: any;
}) {
  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
      <View style={[
        fs.item,
        index < total - 1 && {
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
          <Text style={[fs.question, { color: isDark ? theme.text : "#0D1B3E" }]} numberOfLines={active ? undefined : 2}>
            {item.q}
          </Text>
          <Ionicons
            name={active ? "chevron-up" : "chevron-down"}
            size={16}
            color={isDark ? theme.textSecondary : "#7B8DB0"}
          />
        </View>
        {active && (
          <View style={[fs.answerBox, {
            backgroundColor: isDark ? "rgba(30,42,60,0.80)" : "rgba(3,83,204,0.06)",
            borderLeftColor: isDark ? "#4D96FF" : B.primary,
          }]}>
            <Text style={[fs.answer, { color: isDark ? theme.textSecondary : "#7B8DB0" }]}>
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
  const { isDark, toggleTheme } = useAppTheme();
  const theme = isDark ? Colors.dark : Colors.light;
  const { t, i18n } = useTranslation();
  const [logOut, { isLoading }] = useLogOutMutation();

  const [langModalVisible, setLangModalVisible] = useState(false);
  const [activeFaq, setActiveFaq]               = useState<number | null>(null);

  const currentLang = i18n.language ?? "fr";
  const currentLangLabel = LANGUAGES.find(l => l.code === currentLang)?.label ?? "🇫🇷 Français";

  const MENU_ITEMS = [
    { id: "profile",       title: t("params.profile"),       icon: "person-outline",            route: "/profile"      },
    { id: "notifications", title: t("params.notifications"), icon: "notifications-outline",      route: "/notification" },
    { id: "history",       title: t("params.history"),       icon: "time-outline",               route: "/scan"         },
    { id: "support",       title: t("params.support"),       icon: "help-circle-outline",        route: "/support"      },
    { id: "terms",         title: t("params.terms"),         icon: "document-text-outline",      route: "/terms"        },
    { id: "about",         title: t("params.about"),         icon: "information-circle-outline", route: "/apropos"      },
  ];

  const FAQS = [
    { q: t("params.faq1q"), a: t("params.faq1a") },
    { q: t("params.faq2q"), a: t("params.faq2a") },
    { q: t("params.faq3q"), a: t("params.faq3a") },
  ];

  const toggleFaq = (i: number) => {
    LayoutAnimation.easeInEaseOut();
    setActiveFaq(activeFaq === i ? null : i);
  };

  const handleSelectLanguage = async (code: string) => {
    setLangModalVisible(false);
    await changeLanguage(code);
  };

  const handleLogout = async () => {
    Alert.alert(
      t("params.logoutTitle"),
      t("params.logoutMsg"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("params.logoutConfirm"), style: "destructive",
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
              Alert.alert(err?.data?.error || t("common.error"));
            }
          },
        },
      ]
    );
  };

  const headerGradient: [string, string] = isDark
    ? ["#1A1F3A", "#0A1628"]
    : [B.deep, B.primary];

  const cardBg       = isDark ? theme.card    : "#FFFFFF";
  const dividerColor = isDark ? "rgba(77,150,255,0.10)" : "rgba(3,83,204,0.10)";

  return (
    <View style={[s.root, { backgroundColor: isDark ? theme.background : B.primary }]}>
      <StatusBar barStyle="light-content" />

      {/* ── LANGUAGE PICKER MODAL ── */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setLangModalVisible(false)}>
          <Pressable style={[s.modalBox, { backgroundColor: isDark ? "#1A2340" : "#FFFFFF" }]}>
            <Text style={[s.modalTitle, { color: isDark ? "#FFFFFF" : "#0D1B3E" }]}>
              {t("language.select")}
            </Text>
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLang;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[s.langOption, {
                    backgroundColor: isSelected
                      ? (isDark ? "rgba(77,150,255,0.15)" : "rgba(3,83,204,0.08)")
                      : "transparent",
                    borderColor: isSelected
                      ? (isDark ? "#4D96FF" : B.primary)
                      : (isDark ? "rgba(77,150,255,0.12)" : "rgba(3,83,204,0.10)"),
                  }]}
                  onPress={() => handleSelectLanguage(lang.code)}
                >
                  <Text style={[s.langOptionText, { color: isDark ? "#FFFFFF" : "#0D1B3E" }]}>
                    {lang.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color={isDark ? "#4D96FF" : B.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

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
            <Text style={s.headerTitle}>{t("params.title")}</Text>
            <View style={{ width: 40 }} />
          </View>

          <Text style={s.headerSub}>{t("params.subtitle")}</Text>
        </View>

        {/* ── PREFERENCES CARD ── */}
        <View style={s.section}>
          <SectionLabel title={t("params.preferences")} icon="settings-outline" />

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
                <Text style={[s.prefLabel, { color: isDark ? theme.text : "#0D1B3E" }]}>
                  {t("params.language")}
                </Text>
              </View>
              <TouchableOpacity
                style={[s.langBtn, {
                  backgroundColor: isDark ? "rgba(77,150,255,0.10)" : "rgba(3,83,204,0.06)",
                  borderColor:     isDark ? "rgba(77,150,255,0.20)" : "rgba(3,83,204,0.10)",
                }]}
                onPress={() => setLangModalVisible(true)}
              >
                <Ionicons name="globe-outline" size={13} color={isDark ? "#93C5FD" : B.primary} />
                <Text style={[s.langText, { color: isDark ? "#93C5FD" : B.primary }]}>
                  {currentLangLabel}
                </Text>
                <Ionicons name="chevron-down" size={12} color={isDark ? "#93C5FD" : B.primary} />
              </TouchableOpacity>
            </View>

            <View style={[s.divider, { backgroundColor: dividerColor }]} />

            {/* Mode sombre — Switch interactif */}
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
                <Text style={[s.prefLabel, { color: isDark ? theme.text : "#0D1B3E" }]}>
                  {t("params.darkMode")}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: "rgba(139,92,246,0.20)", true: "#8B5CF6" }}
                thumbColor={isDark ? "#FFFFFF" : "#8B5CF6"}
                ios_backgroundColor="rgba(139,92,246,0.20)"
              />
            </View>
          </View>
        </View>

        {/* ── MENU ── */}
        <View style={s.section}>
          <SectionLabel title={t("params.navigation")} icon="grid-outline" />
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
                theme={theme}
                onPress={() => router.push(item.route as any)}
              />
            ))}
          </View>
        </View>

        {/* ── FAQ ── */}
        <View style={s.section}>
          <SectionLabel title={t("params.faq")} icon="help-buoy-outline" />
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
                total={FAQS.length}
                active={activeFaq === i}
                onToggle={() => toggleFaq(i)}
                isDark={isDark}
                theme={theme}
              />
            ))}
          </View>
        </View>

        {/* ── LOGOUT ── */}
        <View style={s.logoutWrap}>
          <GradientButton
            isLoad={isLoading}
            title={t("params.logout")}
            onPress={handleLogout}
            leftIcon={<ArrowIcon width={18} height={12} color={B.violet} />}
            rightIcon={<ArrowRightIcon width={26} height={20} />}
          />
        </View>

        <Text style={s.version}>{t("common.version")}</Text>
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

  logoutWrap: { paddingHorizontal: 16, marginBottom: 16 },

  version: {
    textAlign: "center", fontFamily: "NexaLight",
    fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4,
  },

  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center",
  },
  modalBox: {
    width: "80%", borderRadius: 20,
    padding: 20, gap: 8,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16,
  },
  modalTitle: {
    fontFamily: "NexaLight", fontSize: 15,
    marginBottom: 8, textAlign: "center",
  },
  langOption: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  langOptionText: { fontFamily: "NexaLight", fontSize: 14 },
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
