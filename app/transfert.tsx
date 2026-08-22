/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCreateTransfertMutation } from "@/services/tsxService";
import { useGetAllUsersQuery } from "@/services/userService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeDecimal } from "@/utils/normalizeDecimal.util";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useAppTheme } from "@/app/_layout";

/* ─── PALETTE ────────────────────────────────────────────────────────── */
const LIGHT = {
  primary:      "#0035C5",
  blue:         "#0047FF",
  deep:         "#001257",
  white:        "#FFFFFF",
  error:        "#EF4444",
  success:      "#22C55E",
  bg:           "#F9F9F9",
  text:         "#1A1C1C",
  textSec:      "#434657",
  textMut:      "#747688",
  border:       "rgba(196,197,218,0.30)",
  inputBg:      "#FFFFFF",
  surface:      "#FFFFFF",
  navBg:        "rgba(255,255,255,0.92)",
  navBord:      "rgba(196,197,218,0.18)",
  iconBtnBg:    "rgba(0,0,0,0.04)",
  heroBg:       "rgba(0,53,197,0.06)",
  infoBg:       "rgba(0,53,197,0.05)",
  infoBord:     "rgba(0,53,197,0.12)",
  cardBg:       "rgba(255,255,255,0.80)",
  cardBord:     "rgba(255,255,255,0.80)",
  selectedBg:   "rgba(0,53,197,0.04)",
  selectedBord: "rgba(0,53,197,0.15)",
  avatarBg:     "rgba(0,53,197,0.10)",
  recapBg:      "rgba(0,53,197,0.03)",
  lockBg:       "rgba(0,53,197,0.07)",
  handleBg:     "rgba(0,0,0,0.10)",
  reminderBg:   "rgba(0,53,197,0.04)",
};
const DARK: typeof LIGHT = {
  primary:      "#4D8DFF",
  blue:         "#4D8DFF",
  deep:         "#4D8DFF",
  white:        "#FFFFFF",
  error:        "#FF5A5A",
  success:      "#22C55E",
  bg:           "#0B1220",
  text:         "#EAF0FF",
  textSec:      "#C5D0E8",
  textMut:      "#9FB0D0",
  border:       "rgba(31,42,68,0.80)",
  inputBg:      "#0F1A2E",
  surface:      "#1A2540",
  navBg:        "rgba(11,18,32,0.94)",
  navBord:      "rgba(31,42,68,0.80)",
  iconBtnBg:    "rgba(255,255,255,0.06)",
  heroBg:       "rgba(77,141,255,0.08)",
  infoBg:       "rgba(77,141,255,0.05)",
  infoBord:     "rgba(77,141,255,0.12)",
  cardBg:       "rgba(26,37,64,0.90)",
  cardBord:     "rgba(31,42,68,0.80)",
  selectedBg:   "rgba(77,141,255,0.08)",
  selectedBord: "rgba(77,141,255,0.20)",
  avatarBg:     "rgba(77,141,255,0.12)",
  recapBg:      "rgba(77,141,255,0.05)",
  lockBg:       "rgba(77,141,255,0.10)",
  handleBg:     "rgba(255,255,255,0.12)",
  reminderBg:   "rgba(77,141,255,0.08)",
};

const SHORTCUTS = ["500", "1000", "2500", "5000"];

type User = { id: string | number; username: string; phone?: string };

/* ─── SCREEN ─────────────────────────────────────────────────────────── */
export default function TransfertScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s  = useMemo(() => mkS(C),  [isDark]);
  const fb = useMemo(() => mkFb(C), [isDark]);

  const router = useRouter();
  const { unread } = useUnreadNotifications();

  const [amount,       setAmount]       = useState("");
  const [userId,       setUserId]       = useState<string | null>(null);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [loadingPay, setLoadingPay] = useState(false);

  const [feedback,    setFeedback]    = useState<"success" | "error" | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const fbScale = useRef(new Animated.Value(0.85)).current;
  const fbOpac  = useRef(new Animated.Value(0)).current;

  const cardAnim = useRef(new Animated.Value(40)).current;
  const cardOpac = useRef(new Animated.Value(0)).current;

  const [createTransfert] = useCreateTransfertMutation();
  const { data: usersData } = useGetAllUsersQuery({});

  const allUsers: User[] = usersData?.data ?? usersData ?? [];
  const filteredUsers = searchQuery.length > 1
    ? allUsers.filter((u: User) => {
        const q = searchQuery.toLowerCase();
        return u.username?.toLowerCase().includes(q) || String(u.phone ?? "").includes(q);
      }).slice(0, 6)
    : [];

  useEffect(() => {
    AsyncStorage.getItem("userId").then(setUserId);
    Animated.parallel([
      Animated.timing(cardAnim, { toValue: 0, duration: 400, delay: 80, useNativeDriver: true }),
      Animated.timing(cardOpac, { toValue: 1, duration: 400, delay: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedbackMsg(msg); setFeedback(type);
    fbScale.setValue(0.85); fbOpac.setValue(0);
    Animated.parallel([
      Animated.spring(fbScale, { toValue: 1, friction: 7, useNativeDriver: true }),
      Animated.timing(fbOpac,  { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const hideFeedback = () => {
    const wasSuccess = feedback === "success";
    Animated.timing(fbOpac, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setFeedback(null);
      if (wasSuccess) { setAmount(""); setSearchQuery(""); setSelectedUser(null); }
    });
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user); setSearchQuery(user.username); setShowDropdown(false); Keyboard.dismiss();
  };

  const handleConfirmPress = async () => {
    if (!amount || !selectedUser) { showFeedback("error", "Veuillez remplir tous les champs."); return; }
    if (!userId) { showFeedback("error", "Utilisateur introuvable. Veuillez vous reconnecter."); return; }
    try {
      setLoadingPay(true);
      const res: any = await createTransfert({ amount: normalizeDecimal(amount), receiverId: selectedUser.id, senderId: userId }).unwrap();
      if (res) showFeedback("success", `Transfert de ${amount} EC à ${selectedUser.username} réussi !`);
      else     showFeedback("error", "Transfert échoué, veuillez réessayer.");
    } catch (err: any) {
      showFeedback("error", err?.data?.message || "Une erreur est survenue lors du transfert.");
    } finally { setLoadingPay(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ── TOP BAR ──────────────────────────────────────────────────── */}
      <SafeAreaView edges={["top"]} style={s.safeBar}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={s.topTitle}>Transfert</Text>
          <TouchableOpacity style={s.iconBtnRel} onPress={() => router.push("/notification" as any)}>
            <Ionicons name="notifications-outline" size={22} color={C.textSec} />
            {unread > 0 && (
              <View style={s.badge}><Text style={s.badgeText}>{unread > 99 ? "99+" : unread}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setShowDropdown(false); }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── HERO SECTION ─────────────────────────────────────────── */}
          <View style={s.hero}>
            <View style={s.heroIconWrap}>
              <Ionicons name="swap-horizontal-outline" size={32} color={C.primary} />
            </View>
            <Text style={s.heroSub}>Envoyez des Ecoins à un membre BIM</Text>
          </View>

          {/* ── INFO BANNER ──────────────────────────────────────────── */}
          <View style={s.infoBanner}>
            <Ionicons name="information-circle-outline" size={18} color={C.primary} />
            <Text style={s.infoText}>Les transferts entre membres BIM sont instantanés et sans frais</Text>
          </View>

          {/* ── FORM CARD ────────────────────────────────────────────── */}
          <Animated.View style={[s.card, { opacity: cardOpac, transform: [{ translateY: cardAnim }] }]}>

            {/* Amount */}
            <View style={s.sectionHeader}>
              <Ionicons name="cash-outline" size={14} color={C.primary} />
              <Text style={s.sectionLabel}>MONTANT À ENVOYER</Text>
            </View>

            <View style={s.amountBox}>
              <Text style={s.currencyPrefix}>EC</Text>
              <TextInput
                placeholder="0"
                placeholderTextColor={C.textMut}
                keyboardType="numeric"
                style={s.amountInput}
                value={amount}
                onChangeText={setAmount}
                returnKeyType="done"
              />
              {amount.length > 0 && (
                <TouchableOpacity onPress={() => setAmount("")}>
                  <Ionicons name="close-circle" size={20} color={C.textMut} />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick chips */}
            <View style={s.chips}>
              {SHORTCUTS.map((v) => {
                const active = amount === v;
                return (
                  <TouchableOpacity
                    key={v}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => setAmount(v)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.chipText, active && s.chipTextActive]}>{v} EC</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Recipient */}
            <View style={[s.sectionHeader, { marginTop: 18 }]}>
              <Ionicons name="person-circle-outline" size={14} color={C.primary} />
              <Text style={s.sectionLabel}>DESTINATAIRE</Text>
            </View>

            {selectedUser ? (
              <View style={s.selectedUserCard}>
                <View style={s.userAvatar}>
                  <Text style={s.avatarText}>{selectedUser.username?.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.selectedName}>{selectedUser.username}</Text>
                  {selectedUser.phone && <Text style={s.selectedPhone}>{selectedUser.phone}</Text>}
                </View>
                <TouchableOpacity onPress={() => { setSelectedUser(null); setSearchQuery(""); }}>
                  <Ionicons name="close-circle" size={20} color={C.textMut} />
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={s.searchBox}>
                  <Ionicons name="search-outline" size={16} color={C.textMut} />
                  <TextInput
                    placeholder="Rechercher un membre BIM..."
                    placeholderTextColor={C.textMut}
                    style={s.searchInput}
                    value={searchQuery}
                    onChangeText={(t) => { setSearchQuery(t); setShowDropdown(t.length > 1); }}
                    onFocus={() => { if (searchQuery.length > 1) setShowDropdown(true); }}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => { setSearchQuery(""); setShowDropdown(false); }}>
                      <Ionicons name="close-circle" size={16} color={C.textMut} />
                    </TouchableOpacity>
                  )}
                </View>

                {showDropdown && filteredUsers.length > 0 && (
                  <View style={s.dropdown}>
                    {filteredUsers.map((item) => (
                      <TouchableOpacity key={String(item.id)} style={s.dropdownItem} onPress={() => handleSelectUser(item)} activeOpacity={0.7}>
                        <View style={[s.userAvatar, { width: 34, height: 34, borderRadius: 17 }]}>
                          <Text style={[s.avatarText, { fontSize: 14 }]}>{item.username?.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.dropdownName}>{item.username}</Text>
                          {item.phone && <Text style={s.dropdownPhone}>{item.phone}</Text>}
                        </View>
                        <Ionicons name="chevron-forward" size={14} color={C.textMut} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {showDropdown && filteredUsers.length === 0 && searchQuery.length > 1 && (
                  <View style={s.dropdown}>
                    <View style={s.emptyDrop}>
                      <Ionicons name="person-outline" size={24} color={C.textMut} />
                      <Text style={s.emptyDropText}>Aucun membre trouvé</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Recap */}
            {amount.length > 0 && selectedUser && (
              <View style={s.recap}>
                <View style={s.recapRow}>
                  <Text style={s.recapLabel}>Destinataire</Text>
                  <Text style={s.recapVal}>{selectedUser.username}</Text>
                </View>
                <View style={[s.recapRow, { borderBottomWidth: 0 }]}>
                  <Text style={s.recapLabel}>Montant</Text>
                  <Text style={[s.recapVal, { color: C.primary, fontFamily: "NexaBold" }]}>{amount} EC</Text>
                </View>
              </View>
            )}

            {/* CTA */}
            <TouchableOpacity
              style={[s.ctaBtn, { opacity: loadingPay ? 0.7 : 1 }]}
              onPress={handleConfirmPress}
              disabled={loadingPay}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[C.blue, C.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaGrad}>
                {loadingPay
                  ? <ActivityIndicator size="small" color={C.white} />
                  : <>
                      <Ionicons name="send-outline" size={20} color={C.white} />
                      <Text style={s.ctaText}>Envoyer les Ecoins</Text>
                    </>}
              </LinearGradient>
            </TouchableOpacity>

            {/* Secure note */}
            <View style={s.secureRow}>
              <Ionicons name="shield-checkmark-outline" size={12} color={C.textMut} />
              <Text style={s.secureText}>Transfert sécurisé et instantané · BIM NEXT</Text>
            </View>
          </Animated.View>

          {/* ── PROMO CARD ───────────────────────────────────────────── */}
          <Animated.View style={[s.promoCard, { opacity: cardOpac }]}>
            <View style={s.promoContent}>
              <Text style={s.promoTitle}>Transférez sans limites</Text>
              <Text style={s.promoSub}>Profitez de transferts sécurisés à travers tout l'écosystème BIMNext.</Text>
            </View>
            <View style={s.promoIconCircle}>
              <Ionicons name="swap-horizontal-outline" size={36} color={C.primary} style={{ opacity: 0.18 }} />
            </View>
          </Animated.View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* ── FEEDBACK MODAL ───────────────────────────────────────────── */}
      <Modal transparent visible={feedback !== null} animationType="none" onRequestClose={hideFeedback}>
        <TouchableOpacity style={fb.overlay} activeOpacity={1} onPress={hideFeedback}>
          <Animated.View style={[fb.sheet, { opacity: fbOpac, transform: [{ scale: fbScale }] }]}>
            <View style={[fb.iconWrap, { backgroundColor: feedback === "success" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)" }]}>
              <Ionicons
                name={feedback === "success" ? "checkmark-circle" : "close-circle"}
                size={56}
                color={feedback === "success" ? C.success : C.error}
              />
            </View>
            <Text style={fb.title}>{feedback === "success" ? "Transfert réussi !" : "Opération échouée"}</Text>
            <Text style={fb.msg}>{feedbackMsg}</Text>
            <TouchableOpacity
              style={[fb.btn, { backgroundColor: feedback === "success" ? C.success : C.error }]}
              onPress={hideFeedback}
              activeOpacity={0.85}
            >
              <Text style={fb.btnText}>OK</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  safeBar: { backgroundColor: Platform.OS === "android" ? C.surface : C.navBg, borderBottomWidth: 1, borderBottomColor: C.navBord },
  topBar:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.iconBtnBg, alignItems: "center", justifyContent: "center" },
  iconBtnRel: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  topTitle: { fontFamily: "NexaBold", fontSize: 17, color: C.text },
  badge:   { position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.error, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText:{ fontFamily: "NexaBold", fontSize: 9, color: C.white },

  scroll: { paddingBottom: 20 },

  hero: { alignItems: "center", paddingTop: 28, paddingBottom: 8, gap: 8 },
  heroIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.heroBg, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  heroTitle: { fontFamily: "NexaBold", fontSize: 24, color: C.text, letterSpacing: -0.3 },
  heroSub:   { fontFamily: "NexaLight", fontSize: 13, color: C.textSec },

  infoBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: C.infoBg,
    borderWidth: 1, borderColor: C.infoBord,
    borderRadius: 16, padding: 14,
  },
  infoText: { flex: 1, fontFamily: "NexaLight", fontSize: 12, lineHeight: 18, color: C.text },

  card: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: C.cardBg,
    borderRadius: 28, padding: 20,
    borderWidth: 1, borderColor: C.cardBord,
    elevation: 4, shadowColor: "#0047FF", shadowOpacity: 0.04, shadowRadius: 32, shadowOffset: { width: 0, height: 8 },
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, marginTop: 4 },
  sectionLabel:  { fontFamily: "NexaBold", fontSize: 10, color: C.primary, textTransform: "uppercase", letterSpacing: 1 },

  amountBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.surface, borderRadius: 18,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 18, paddingVertical: 18,
    marginBottom: 14,
    elevation: 2, shadowColor: "#0047FF", shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 2 },
  },
  currencyPrefix: { fontFamily: "NexaBold", fontSize: 20, color: C.primary },
  amountInput:    { flex: 1, fontSize: 34, fontFamily: "NexaBold", color: C.text },

  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  chip:       { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText:       { fontFamily: "NexaBold", fontSize: 12, color: C.textSec },
  chipTextActive: { color: C.white },

  selectedUserCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, borderWidth: 1.5, padding: 12, marginBottom: 14,
    borderColor: C.selectedBord, backgroundColor: C.selectedBg,
  },
  userAvatar:  { width: 42, height: 42, borderRadius: 21, backgroundColor: C.avatarBg, alignItems: "center", justifyContent: "center" },
  avatarText:  { fontFamily: "NexaBold", fontSize: 18, color: C.primary },
  selectedName:  { fontFamily: "NexaBold", fontSize: 14, color: C.text },
  selectedPhone: { fontFamily: "NexaLight", fontSize: 12, color: C.textSec },

  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, height: 48,
    elevation: 2, shadowColor: "#0035C5", shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: "NexaLight", color: C.text },

  dropdown: {
    marginTop: 6,
    borderRadius: 16, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.surface,
    elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
    overflow: "hidden",
  },
  dropdownItem:  { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  dropdownName:  { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  dropdownPhone: { fontFamily: "NexaLight", fontSize: 11, color: C.textSec },
  emptyDrop:     { padding: 20, alignItems: "center", gap: 6 },
  emptyDropText: { fontFamily: "NexaLight", fontSize: 13, color: C.textSec },

  recap: { borderRadius: 14, padding: 14, marginTop: 14, marginBottom: 2, borderWidth: 1, backgroundColor: C.recapBg, borderColor: C.border },
  recapRow:  { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  recapLabel:{ fontFamily: "NexaLight", fontSize: 12, color: C.textSec },
  recapVal:  { fontFamily: "NexaLight", fontSize: 12, color: C.text },

  ctaBtn:  { borderRadius: 18, overflow: "hidden", marginTop: 18 },
  ctaGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18 },
  ctaText: { color: C.white, fontFamily: "NexaBold", fontSize: 16 },

  secureRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 14 },
  secureText:{ fontFamily: "NexaLight", fontSize: 11, color: C.textMut },

  promoCard: {
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: C.cardBg,
    borderRadius: 28, padding: 22,
    borderWidth: 1, borderColor: C.cardBord,
    flexDirection: "row", alignItems: "center",
    minHeight: 130, overflow: "hidden",
    elevation: 2, shadowColor: "#0047FF", shadowOpacity: 0.03, shadowRadius: 20, shadowOffset: { width: 0, height: 4 },
  },
  promoContent: { flex: 1, zIndex: 1 },
  promoTitle:   { fontFamily: "NexaBold", fontSize: 18, color: C.text, marginBottom: 8 },
  promoSub:     { fontFamily: "NexaLight", fontSize: 13, color: C.textSec, lineHeight: 20 },
  promoIconCircle: { position: "absolute", right: -16, top: "50%", marginTop: -36, width: 120, height: 120, alignItems: "center", justifyContent: "center" },

  modalSlide: { justifyContent: "flex-end", margin: 0 },
  pinModal:    { backgroundColor: C.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 36, alignItems: "center", elevation: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 20 },
  dragHandle:  { width: 40, height: 4, borderRadius: 2, marginBottom: 20, backgroundColor: C.handleBg },
  lockIconWrap:{ width: 66, height: 66, borderRadius: 33, backgroundColor: C.lockBg, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  pinTitle:    { fontFamily: "NexaBold", fontSize: 18, color: C.text, marginBottom: 6, letterSpacing: 0.2 },
  pinSub:      { fontFamily: "NexaLight", fontSize: 12, color: C.textSec, textAlign: "center", lineHeight: 18, marginBottom: 18, paddingHorizontal: 10 },
  amountReminder: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, borderWidth: 1, backgroundColor: C.reminderBg, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 22 },
  amountReminderText:   { fontFamily: "NexaBold", fontSize: 15, color: C.text },
  amountReminderMethod: { fontFamily: "NexaLight", fontSize: 13, color: C.textSec },
  pinErrorRow:  { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  pinErrorText: { fontFamily: "NexaLight", fontSize: 12, color: C.error },
  confirmBtn:   { width: "100%", borderRadius: 16, overflow: "hidden", marginTop: 20 },
  confirmGrad:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15 },
  confirmText:  { color: C.white, fontFamily: "NexaBold", fontSize: 15 },
  cancelBtn:    { marginTop: 14, paddingVertical: 8 },
  cancelText:   { fontFamily: "NexaLight", fontSize: 13, color: C.textSec },
}); }

const pd = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, marginBottom: 10 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
});

const kp = StyleSheet.create({
  grid:    { flexDirection: "row", flexWrap: "wrap", width: 280, gap: 12, justifyContent: "center", marginTop: 10 },
  key:     { width: 78, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  empty:   { width: 78, height: 56 },
  keyText: { fontSize: 20, fontFamily: "NexaLight", fontWeight: "600" },
});

function mkFb(C: typeof LIGHT) { return StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: 32 },
  sheet:   { backgroundColor: C.inputBg, borderRadius: 28, padding: 28, alignItems: "center", width: "100%", elevation: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20 },
  iconWrap:{ width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title:   { fontFamily: "NexaBold", fontSize: 20, color: C.text, marginBottom: 10, textAlign: "center" },
  msg:     { fontFamily: "NexaLight", fontSize: 13, color: C.textSec, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  btn:     { paddingHorizontal: 40, paddingVertical: 13, borderRadius: 14 },
  btnText: { color: C.white, fontFamily: "NexaBold", fontSize: 15 },
}); }
