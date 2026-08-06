import React, { useRef, useState, useMemo } from "react";
import {
  Alert,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLogOutMutation } from "@/services/authService";
import { useDeleteAccountMutation } from "@/services/userService";
import { useAppTheme } from "@/app/_layout";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/i18n";

/* ─── PALETTE ─────────────────────────────────────────────────────────── */
const LIGHT = {
  primary:    "#0035C5",
  bg:         "#F9F9F9",
  surface:    "#FFFFFF",
  outline:    "#747688",
  secondary:  "#5C5E63",
  onSurface:  "#1A1C1C",
  outlineVar: "#C4C5DA",
  error:      "#BA1A1A",
  errCont:    "#FFDAD6",
  errOnCont:  "#93000A",
  container:  "#EEEEEE",
};
const DARK = {
  primary:    "#4D8DFF",
  bg:         "#0B1220",
  surface:    "#1A2540",
  outline:    "#6B7A99",
  secondary:  "#A3B4D0",
  onSurface:  "#EAF0FF",
  outlineVar: "rgba(31,42,68,0.80)",
  error:      "#DC2626",
  errCont:    "#3D1010",
  errOnCont:  "#FFAAAA",
  container:  "#0F1A2E",
};


const LANGUAGES = [
  { code: "fr", label: "🇫🇷 Français" },
  { code: "en", label: "🇬🇧 English" },
  { code: "ln", label: "🇨🇩 Lingala" },
  { code: "sw", label: "🇹🇿 Swahili" },
];

/* ─── SECTION LABEL ──────────────────────────────────────────────────── */
function SectionLabel({
  icon, title, danger = false, colors,
}: { icon: string; title: string; danger?: boolean; colors: typeof LIGHT }) {
  const col = danger ? colors.error : colors.primary;
  const textCol = danger ? colors.error : colors.outline;
  return (
    <View style={sl.row}>
      <Ionicons name={icon as any} size={14} color={col} />
      <Text style={[sl.text, { color: textCol }]}>{title}</Text>
    </View>
  );
}

/* ─── MENU ROW ────────────────────────────────────────────────────────── */
function MenuRow({
  icon, label, isLast, onPress, colors,
}: { icon: string; label: string; isLast: boolean; onPress: () => void; colors: typeof LIGHT }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      onPress={onPress}
    >
      <Animated.View style={[mr.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.outlineVar + "40" }, { transform: [{ scale }] }]}>
        <View style={[mr.iconBox, { backgroundColor: colors.primary + "12" }]}>
          <Ionicons name={icon as any} size={20} color={colors.primary} />
        </View>
        <Text style={[mr.label, { color: colors.onSurface }]}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.outline} />
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ─── MAIN ────────────────────────────────────────────────────────────── */
export default function Params() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { followSystem, isDark, toggleTheme, setFollowSystem } = useAppTheme();
  const { unread } = useUnreadNotifications();
  const { t, i18n } = useTranslation();
  const C = isDark ? DARK : LIGHT;
  const s  = useMemo(() => mkS(C), [isDark]);
  const m  = useMemo(() => mkM(C), [isDark]);
  const dm = useMemo(() => mkDm(C), [isDark]);

  const [logOut,        { isLoading }]           = useLogOutMutation();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();

  const [langModal,   setLangModal]   = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deletePwd,   setDeletePwd]   = useState("");
  const [showPwd,     setShowPwd]     = useState(false);

  const currentLang = i18n.language ?? "fr";
  const currentLangLabel = LANGUAGES.find(l => l.code === currentLang)?.label ?? "🇫🇷 Français";

  const NAV = [
    { id: "profile",       icon: "person-outline",            label: t("params.profile"),       route: "/profile"      },
    { id: "notifications", icon: "notifications-outline",     label: t("params.notifications"), route: "/notification" },
    { id: "favorites",     icon: "heart-outline",             label: "Mes Favoris",             route: "/favorites"    },
    { id: "history",       icon: "time-outline",              label: t("params.history"),       route: "/history"      },
    { id: "support",       icon: "help-circle-outline",       label: t("params.support"),       route: "/support"      },
    { id: "faq",           icon: "help-buoy-outline",         label: t("params.faq"),           route: "/faqs"         },
    { id: "about",         icon: "information-circle-outline",label: t("params.about"),         route: "/apropos"      },
  ];

  const handleLogout = () => {
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
              await logOut({ email: String(email) });
              await AsyncStorage.clear();
              if (email) await AsyncStorage.setItem("email", email);
              router.replace("/login");
            } catch (err: any) {
              Alert.alert(err?.data?.error || t("common.error"));
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (!deletePwd.trim()) {
      Alert.alert(t("common.error"), t("params.deleteAccountPwdPlaceholder"));
      return;
    }
    try {
      await deleteAccount({ password: deletePwd }).unwrap();
      setDeleteModal(false);
      setDeletePwd("");
      await AsyncStorage.clear();
      router.replace("/login");
    } catch (err: any) {
      Alert.alert(t("common.error"), err?.data?.message || t("common.error"));
    }
  };

  const HEADER_H = (Platform.OS === "ios" ? insets.top : StatusBar.currentHeight ?? 0) + 64;

  return (
    <View style={[s.root, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.bg} />

      {/* ── FIXED TOP BAR ── */}
      <View style={[s.topBar, { backgroundColor: C.surface, paddingTop: Platform.OS === "ios" ? insets.top : (StatusBar.currentHeight ?? 0) + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.topSide}>
          <Ionicons name="arrow-back" size={22} color={C.onSurface} />
        </TouchableOpacity>

        <Text style={[s.topTitle, { color: C.onSurface }]}>Paramètres</Text>

        <TouchableOpacity onPress={() => router.push("/notification")} style={s.topSide}>
          <View style={{ position: "relative" }}>
            <Ionicons name="notifications-outline" size={22} color={C.onSurface} />
            {unread > 0 && (
              <View style={[s.notifBadge, { backgroundColor: "#DC0302" }]}>
                <Text style={s.notifBadgeText}>{unread > 99 ? "99+" : unread}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* ── LANGUAGE MODAL ── */}
      <Modal visible={langModal} transparent animationType="fade" onRequestClose={() => setLangModal(false)}>
        <Pressable style={m.overlay} onPress={() => setLangModal(false)}>
          <Pressable style={m.box}>
            <Text style={m.title}>{t("language.select")}</Text>
            {LANGUAGES.map(lang => {
              const sel = lang.code === currentLang;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[m.option, sel && m.optionSel]}
                  onPress={async () => { setLangModal(false); await changeLanguage(lang.code); }}
                >
                  <Text style={m.optionText}>{lang.label}</Text>
                  {sel && <Ionicons name="checkmark-circle" size={18} color={C.primary} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── DELETE MODAL ── */}
      <Modal visible={deleteModal} transparent animationType="slide"
        onRequestClose={() => { setDeleteModal(false); setDeletePwd(""); }}>
        <Pressable style={dm.overlay} onPress={() => { setDeleteModal(false); setDeletePwd(""); }}>
          <Pressable style={dm.sheet}>

            {/* Poignée */}
            <View style={dm.handle} />

            {/* Icône */}
            <View style={dm.iconWrap}>
              <Ionicons name="trash" size={26} color={C.error} />
            </View>

            {/* Titre */}
            <Text style={dm.title}>Supprimer le compte</Text>

            {/* Message */}
            <Text style={dm.msg}>
              Entrez votre mot de passe pour confirmer. Cette action est <Text style={dm.bold}>irréversible</Text>.
            </Text>

            {/* Champ mot de passe */}
            <View style={dm.inputRow}>
              <Ionicons name="lock-closed-outline" size={16} color={C.outline} />
              <TextInput
                style={dm.input}
                placeholder="Mot de passe"
                placeholderTextColor={C.outline}
                secureTextEntry={!showPwd}
                value={deletePwd}
                onChangeText={setDeletePwd}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPwd(v => !v)}>
                <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={16} color={C.outline} />
              </TouchableOpacity>
            </View>

            {/* Boutons */}
            <View style={dm.btnRow}>
              <TouchableOpacity style={dm.btnCancel}
                onPress={() => { setDeleteModal(false); setDeletePwd(""); }}>
                <Text style={dm.btnCancelTxt}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[dm.btnDelete, isDeleting && { opacity: 0.6 }]}
                onPress={handleDeleteAccount} disabled={isDeleting}>
                {isDeleting
                  ? <Ionicons name="hourglass-outline" size={16} color="#fff" />
                  : <Text style={dm.btnDeleteTxt}>Supprimer</Text>
                }
              </TouchableOpacity>
            </View>

          </Pressable>
        </Pressable>
      </Modal>

      {/* ── SCROLL ── */}
      <ScrollView
        style={{ flex: 1, marginBottom: insets.bottom + 84 }}
        contentContainerStyle={[s.scroll, { paddingTop: HEADER_H + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page header */}
        <View style={s.pageHeader}>
          <Text style={[s.pageSub, { color: C.secondary }]}>{t("params.subtitle")}</Text>
        </View>

        {/* ── PRÉFÉRENCES ── */}
        <View style={s.section}>
          <SectionLabel icon="settings-outline" title={t("params.preferences")} colors={C} />
          <View style={[s.card, { backgroundColor: C.surface }]}>
            {/* Langue */}
            <View style={[s.prefRow]}>
              <View style={s.prefLeft}>
                <View style={[s.prefIcon, { backgroundColor: C.primary + "12" }]}>
                  <Ionicons name="language-outline" size={20} color={C.primary} />
                </View>
                <Text style={[s.prefLabel, { color: C.onSurface }]}>{t("params.language")}</Text>
              </View>
              <TouchableOpacity style={[s.langPill, { borderColor: C.outlineVar, backgroundColor: C.surface }]} onPress={() => setLangModal(true)}>
                <Text style={[s.langPillText, { color: C.onSurface }]}>{currentLangLabel}</Text>
                <Ionicons name="chevron-down" size={15} color={C.outline} />
              </TouchableOpacity>
            </View>

            <View style={[s.hdiv, { backgroundColor: C.outlineVar + "30" }]} />

            {/* Thème système */}
            <View style={s.prefRow}>
              <View style={s.prefLeft}>
                <View style={[s.prefIcon, { backgroundColor: C.primary + "12" }]}>
                  <Ionicons name="phone-portrait-outline" size={20} color={C.primary} />
                </View>
                <View>
                  <Text style={[s.prefLabel, { color: C.onSurface }]}>{t("params.followSystem")}</Text>
                  <Text style={[s.prefSub, { color: C.outline }]}>{t("params.followSystemOn")}</Text>
                </View>
              </View>
              <Switch
                value={followSystem}
                onValueChange={setFollowSystem}
                trackColor={{ false: C.container, true: C.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={C.container}
              />
            </View>

            <View style={[s.hdiv, { backgroundColor: C.outlineVar + "30" }]} />

            {/* Mode sombre */}
            <View style={[s.prefRow, followSystem && { opacity: 0.45 }]}>
              <View style={s.prefLeft}>
                <View style={[s.prefIcon, { backgroundColor: C.container }]}>
                  <Ionicons name={isDark ? "moon" : "sunny-outline"} size={20} color={C.secondary} />
                </View>
                <View>
                  <Text style={[s.prefLabel, { color: C.secondary }]}>{t("params.darkMode")}</Text>
                  <Text style={[s.prefSub, { color: C.outline }]}>{t("params.darkModeAuto")}</Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={followSystem ? undefined : toggleTheme}
                disabled={followSystem}
                trackColor={{ false: C.container, true: C.secondary }}
                thumbColor={followSystem ? "rgba(255,255,255,0.5)" : "#FFFFFF"}
                ios_backgroundColor={C.container}
              />
            </View>
          </View>
        </View>

        {/* ── NAVIGATION ── */}
        <View style={s.section}>
          <SectionLabel icon="grid-outline" title={t("params.navigation")} colors={C} />
          <View style={[s.card, { backgroundColor: C.surface }]}>
            {NAV.map((item, i) => (
              <MenuRow
                key={item.id}
                icon={item.icon}
                label={item.label}
                isLast={i === NAV.length - 1}
                onPress={() => router.push(item.route as any)}
                colors={C}
              />
            ))}
          </View>
        </View>

        {/* ── ZONE DE DANGER ── */}
        <View style={s.section}>
          <SectionLabel icon="warning-outline" title={t("params.deleteAccountSection")} danger colors={C} />
          <TouchableOpacity
            style={s.dangerCard}
            onPress={() => setDeleteModal(true)}
            activeOpacity={0.8}
          >
            <View style={s.dangerIcon}>
              <Ionicons name="trash" size={20} color={C.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.dangerTitle}>{t("params.deleteAccount")}</Text>
              <Text style={s.dangerSub} numberOfLines={2}>{t("params.deleteAccountWarning")}</Text>
            </View>
            <View style={s.dangerChevron}>
              <Ionicons name="chevron-forward" size={17} color={C.error} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── LOGOUT ── */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <LinearGradient
            colors={[C.primary, "#0047FF"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.logoutGrad}
          >
            {isLoading
              ? <Ionicons name="hourglass-outline" size={20} color="#fff" />
              : <>
                  <Ionicons name="log-out-outline" size={20} color="#fff" />
                  <Text style={s.logoutText}>{t("params.logout")}</Text>
                </>
            }
          </LinearGradient>
        </TouchableOpacity>

        {/* ── FOOTER ── */}
        <Text style={s.footer}>{t("common.version")}</Text>
      </ScrollView>
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  root:  { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 8 },

  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  topSide: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  topTitle: { flex: 1, textAlign: "center", fontFamily: "NexaBold", fontSize: 17 },

  notifBadge:     { position: "absolute", top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 3, borderWidth: 1.5, borderColor: "#fff" },
  notifBadgeText: { color: "#fff", fontSize: 9, fontFamily: "NexaBold" },

  pageHeader: { marginBottom: 28, marginTop: 8 },
  pageTitle:  { fontFamily: "NexaBold", fontSize: 26, color: C.onSurface, marginBottom: 4 },
  pageSub:    { fontFamily: "NexaLight", fontSize: 14, color: C.secondary },

  section: { marginBottom: 20 },

  card: {
    backgroundColor: C.surface,
    borderRadius: 20, overflow: "hidden",
    elevation: 3, shadowColor: "rgba(0,71,255,0.08)",
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12,
  },

  prefRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  prefLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  prefIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(0,53,197,0.05)", alignItems: "center", justifyContent: "center" },
  prefLabel: { fontFamily: "NexaBold", fontSize: 14, color: C.onSurface },
  prefSub:   { fontFamily: "NexaLight", fontSize: 11, color: C.outline, marginTop: 1 },

  hdiv: { height: 1, backgroundColor: "rgba(196,197,218,0.15)", marginHorizontal: 0 },

  langPill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, borderWidth: 1, borderColor: C.outlineVar, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.surface },
  langPillText: { fontFamily: "NexaBold", fontSize: 12, color: C.onSurface },

  dangerCard: { backgroundColor: C.errCont, borderWidth: 1, borderColor: C.error + "40", borderRadius: 20, flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  dangerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.error + "22", alignItems: "center", justifyContent: "center" },
  dangerTitle: { fontFamily: "NexaBold", fontSize: 14, color: C.error, marginBottom: 2 },
  dangerSub:   { fontFamily: "NexaLight", fontSize: 11, color: C.errOnCont, lineHeight: 16 },
  dangerChevron: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.error + "22", alignItems: "center", justifyContent: "center" },

  logoutBtn: { borderRadius: 20, overflow: "hidden", marginBottom: 12 },
  logoutGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, elevation: 4, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  logoutText: { fontFamily: "NexaBold", fontSize: 16, color: "#FFFFFF" },

  footer: { textAlign: "center", fontFamily: "NexaLight", fontSize: 10, color: C.outline, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  modalBox: { width: "82%", backgroundColor: C.surface, borderRadius: 24, padding: 20, elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20 },
  modalTitle: { fontFamily: "NexaBold", fontSize: 15, color: C.onSurface, textAlign: "center", marginBottom: 12 },
  langOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 12, borderWidth: 1, borderColor: "rgba(196,197,218,0.4)", paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
  langOptionSel: { backgroundColor: "rgba(0,53,197,0.06)", borderColor: C.primary },
  langOptionText: { fontFamily: "NexaBold", fontSize: 13, color: C.onSurface },
}); }

/* ─── MENU ROW STYLES ──────────────────────────────────────────────────── */
const mr = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: "rgba(196,197,218,0.15)" },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(0,53,197,0.05)",
    alignItems: "center", justifyContent: "center",
  },
  label: { flex: 1, fontFamily: "NexaBold", fontSize: 14 },
});

/* ─── SECTION LABEL STYLES ──────────────────────────────────────────────── */
const sl = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    gap: 6, marginBottom: 10, paddingLeft: 4,
  },
  text: {
    fontFamily: "NexaLight", fontSize: 11,
    textTransform: "uppercase", letterSpacing: 1.5,
  },
});

/* ─── MODAL STYLES (lang + delete) ─────────────────────────────────────── */
function mkM(C: typeof LIGHT) { return StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  box: { width: "82%", backgroundColor: C.surface, borderRadius: 24, padding: 20, elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20 },
  title: { fontFamily: "NexaBold", fontSize: 15, color: C.onSurface, textAlign: "center", marginBottom: 12 },
  option: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 12, borderWidth: 1, borderColor: C.outlineVar, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
  optionSel: { backgroundColor: C.primary + "14", borderColor: C.primary },
  optionText: { fontFamily: "NexaLight", fontSize: 14, color: C.onSurface },
}); }

/* ─── DELETE MODAL STYLES ───────────────────────────────────────────────── */
function mkDm(C: typeof LIGHT) { return StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36, elevation: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 20 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: C.outlineVar, marginBottom: 24 },
  iconWrap: { alignSelf: "center", width: 56, height: 56, borderRadius: 28, backgroundColor: C.error + "22", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { fontFamily: "NexaBold", fontSize: 18, color: C.onSurface, textAlign: "center", marginBottom: 10 },
  msg: { fontFamily: "NexaLight", fontSize: 14, color: C.secondary, textAlign: "center", lineHeight: 21, marginBottom: 20 },
  bold: { fontFamily: "NexaBold", color: C.error },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.5, borderColor: C.outlineVar, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: C.bg, marginBottom: 20 },
  input: { flex: 1, fontFamily: "NexaLight", fontSize: 15, color: C.onSurface },
  btnRow: { flexDirection: "row", gap: 12 },
  btnCancel: { flex: 1, borderWidth: 1.5, borderColor: C.outlineVar, borderRadius: 16, paddingVertical: 14, alignItems: "center", backgroundColor: C.bg },
  btnCancelTxt: { fontFamily: "NexaBold", fontSize: 15, color: C.secondary },
  btnDelete: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: "center", backgroundColor: C.error },
  btnDeleteTxt: { fontFamily: "NexaBold", fontSize: 15, color: "#FFFFFF" },
}); }
