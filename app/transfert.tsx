/* eslint-disable @typescript-eslint/no-unused-vars */
import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCreateTransfertMutation } from "@/services/tsxService";
import { useVerifyPassMutation } from "@/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeDecimal } from "@/utils/normalizeDecimal.util";
import React, { useEffect, useRef, useState } from "react";
import { useGetAllUsersQuery } from "@/services/userService";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Alert,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Modal from "react-native-modal";

/* ─── THEME ──────────────────────────────────────────────────────────── */
const C = {
  primary: "#0353CC",
  violet:  "#3906C7",
  deep:    "#302E99",
  accent:  "#4D96FF",
  gold:    "#FFD700",
  white:   "#FFFFFF",
  green:   "#22C55E",
  error:   "#EF4444",
};

const Colors = {
  light: {
    bg:              "#F0F4FF",
    card:            "#FFFFFF",
    text:            "#0D1B3E",
    textSecondary:   "#7B8DB0",
    border:          "rgba(3,83,204,0.12)",
    inputBg:         "rgba(3,83,204,0.06)",
    inputFocBg:      "rgba(3,83,204,0.10)",
    headerGrad:      [C.deep, C.violet] as [string, string],
    shadow:          C.violet,
    recapBg:         "rgba(3,83,204,0.05)",
    modalBg:         "#FFFFFF",
    pinBorder:       "rgba(3,83,204,0.20)",
    pinFilled:       C.primary,
    lockIconBg:      "rgba(3,83,204,0.08)",
    keyBg:           "rgba(3,83,204,0.06)",
    keyDelBg:        "rgba(239,68,68,0.08)",
    dropdownBg:      "#FFFFFF",
    selectedUserBg:  "rgba(3,83,204,0.08)",
    selectedBorder:  "rgba(3,83,204,0.25)",
    avatarBg:        "rgba(3,83,204,0.10)",
    clearBtnBg:      "rgba(3,83,204,0.06)",
  },
  dark: {
    bg:              "#07091A",
    card:            "#0F1228",
    text:            "#E2E8F0",
    textSecondary:   "#556080",
    border:          "rgba(77,150,255,0.12)",
    inputBg:         "rgba(77,150,255,0.07)",
    inputFocBg:      "rgba(77,150,255,0.13)",
    headerGrad:      ["#0D0520", "#1a0c3d"] as [string, string],
    shadow:          "#000",
    recapBg:         "rgba(77,150,255,0.06)",
    modalBg:         "#0F1228",
    pinBorder:       "rgba(77,150,255,0.22)",
    pinFilled:       C.accent,
    lockIconBg:      "rgba(3,83,204,0.18)",
    keyBg:           "rgba(77,150,255,0.07)",
    keyDelBg:        "rgba(239,68,68,0.12)",
    dropdownBg:      "#0F1228",
    selectedUserBg:  "rgba(77,150,255,0.10)",
    selectedBorder:  "rgba(77,150,255,0.22)",
    avatarBg:        "rgba(77,150,255,0.12)",
    clearBtnBg:      "rgba(77,150,255,0.08)",
  },
};

function useTheme() {
  const isDark = useColorScheme() === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

const SHORTCUTS = ["500", "1000", "2500", "5000"];

interface User {
  id: number | string;
  username: string;
  email?: string;
}

/* ─── SECTION LABEL ──────────────────────────────────────────────────── */
function SectionLabel({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={sl.row}>
      <Ionicons name={icon as any} size={14} color={C.primary} style={{ opacity: 0.7 }} />
      <Text style={sl.text}>{title}</Text>
    </View>
  );
}

/* ─── USER ROW ───────────────────────────────────────────────────────── */
function UserRow({
  item, selected, onPress, t, isDark,
}: {
  item: User; selected: boolean; onPress: () => void;
  t: typeof Colors.light; isDark: boolean;
}) {
  const scale    = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();
  const initials = item.username.slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
      <Animated.View style={[
        ur.row,
        {
          borderBottomColor: t.border,
          backgroundColor: selected ? t.selectedUserBg : "transparent",
          transform: [{ scale }],
        },
      ]}>
        <View style={[ur.avatar, { backgroundColor: selected ? C.primary : t.avatarBg }]}>
          <Text style={[ur.initials, { color: selected ? C.white : C.primary }]}>{initials}</Text>
        </View>
        <View style={ur.info}>
          <Text style={[ur.name, { color: selected ? C.primary : t.text }]}>{item.username}</Text>
          {item.email && <Text style={[ur.email, { color: t.textSecondary }]} numberOfLines={1}>{item.email}</Text>}
        </View>
        {selected ? (
          <View style={ur.checkCircle}>
            <Ionicons name="checkmark" size={14} color={C.white} />
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={t.textSecondary} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ─── PIN DOTS ───────────────────────────────────────────────────────── */
function PinDots({ value, t }: { value: string; t: typeof Colors.light }) {
  return (
    <View style={pd.row}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={i}
          style={[
            pd.dot,
            {
              backgroundColor: i < value.length ? t.pinFilled : "transparent",
              borderColor:     i < value.length ? t.pinFilled : t.pinBorder,
            },
          ]}
        />
      ))}
    </View>
  );
}

/* ─── KEYPAD ─────────────────────────────────────────────────────────── */
function Keypad({
  onPress, onDelete, t, isDark,
}: {
  onPress: (v: string) => void;
  onDelete: () => void;
  t: typeof Colors.light;
  isDark: boolean;
}) {
  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return (
    <View style={kp.grid}>
      {keys.map((k, i) => {
        if (k === "") return <View key={i} style={kp.empty} />;
        const isDel = k === "⌫";
        return (
          <TouchableOpacity
            key={i}
            style={[
              kp.key,
              {
                backgroundColor: isDel ? t.keyDelBg : t.keyBg,
                borderColor:     isDel ? "rgba(239,68,68,0.20)" : t.border,
              },
            ]}
            onPress={() => isDel ? onDelete() : onPress(k)}
            activeOpacity={0.7}
          >
            <Text style={[kp.keyText, { color: isDel ? C.error : t.text }]}>{k}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function TransferEcoinsScreen() {
  const router = useRouter();
  const { isDark, t } = useTheme();

  const [createTransfert, { isLoading }] = useCreateTransfertMutation();
  const [verifyPass]                     = useVerifyPassMutation();

  const [userId,       setUserId]       = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount,       setAmount]       = useState("");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [page,         setPage]         = useState(1);
  const [users,        setUsers]        = useState<User[]>([]);
  const [showList,     setShowList]     = useState(false);

  /* PIN modal */
  const [showPinModal,  setShowPinModal]  = useState(false);
  const [pinValue,      setPinValue]      = useState("");
  const [pinError,      setPinError]      = useState("");
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingPay,    setLoadingPay]    = useState(false);
  const pinShake = useRef(new Animated.Value(0)).current;

  const cardAnim  = useRef(new Animated.Value(50)).current;
  const cardOpac  = useRef(new Animated.Value(0)).current;
  const inputFocS = useRef(new Animated.Value(0)).current;
  const inputFocA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem("userId").then(setUserId);
    Animated.parallel([
      Animated.timing(cardAnim, { toValue: 0, duration: 420, delay: 100, useNativeDriver: true }),
      Animated.timing(cardOpac, { toValue: 1, duration: 420, delay: 100, useNativeDriver: true }),
    ]).start();
  }, [cardAnim, cardOpac]);

  const { data, isFetching, refetch } = useGetAllUsersQuery({
    search: searchQuery, page, pageSize: 20, paginate: true,
  });

  useEffect(() => {
    if (data?.data) {
      if (page === 1) setUsers(data.data);
      else setUsers((prev) => [...prev, ...data.data]);
    }
  }, [data, page]);

  const loadMore = () => {
    if (!isFetching && data?.pagination?.page < data?.pagination?.totalPages)
      setPage((p) => p + 1);
  };

  const focusAnim = (anim: Animated.Value, v: number) =>
    Animated.timing(anim, { toValue: v, duration: 200, useNativeDriver: false }).start();

  const borderS = inputFocS.interpolate({ inputRange: [0, 1], outputRange: [t.border, C.primary] });
  const bgS     = inputFocS.interpolate({ inputRange: [0, 1], outputRange: [t.inputBg, t.inputFocBg] });
  const borderA = inputFocA.interpolate({ inputRange: [0, 1], outputRange: [t.border, C.primary] });
  const bgA     = inputFocA.interpolate({ inputRange: [0, 1], outputRange: [t.inputBg, t.inputFocBg] });

  const handleSelectUser = (item: User) => {
    setSelectedUser(item);
    setSearchQuery(item.username);
    setShowList(false);
    Keyboard.dismiss();
  };

  /* ── Step 1 : validate → open PIN ── */
  const handleConfirmPress = () => {
    if (!selectedUser || !amount) {
      Alert.alert("Champs manquants", "Choisissez un utilisateur et entrez un montant.");
      return;
    }
    if (!userId) {
      Alert.alert("Erreur", "Utilisateur introuvable. Veuillez vous reconnecter.");
      return;
    }
    setPinValue("");
    setPinError("");
    setShowPinModal(true);
  };

  /* Shake on wrong PIN */
  const shakePin = () => {
    Animated.sequence([
      Animated.timing(pinShake, { toValue:  10, duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue:  8,  duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue:  0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handlePinKey    = (k: string) => { if (pinValue.length >= 6) return; setPinError(""); setPinValue(p => p + k); };
  const handlePinDelete = () => setPinValue(p => p.slice(0, -1));

  /* ── Step 2 : verifyPass → Step 3 : transfert ── */
  const handleConfirmPin = async () => {
    if (pinValue.length < 6) { setPinError("Veuillez entrer vos 6 chiffres."); return; }
    if (!userId) return;

    try {
      setLoadingVerify(true);
      await verifyPass({ userId, password: pinValue }).unwrap();
    } catch {
      shakePin();
      setPinError("Mot de passe incorrect. Réessayez.");
      setPinValue("");
      setLoadingVerify(false);
      return;
    }
    setLoadingVerify(false);
    setShowPinModal(false);

    /* ── Step 3 : proceed ── */
    try {
      setLoadingPay(true);
      const res: any = await createTransfert({
        amount:   normalizeDecimal(amount),
        targetId: selectedUser!.id,
        id:       userId,
      }).unwrap();

      if (res) {
        Alert.alert("✅ Succès", `${amount} Ecoins transférés à ${selectedUser!.username} !`);
        setSelectedUser(null); setAmount(""); setSearchQuery(""); setPage(1);
      } else {
        Alert.alert("Échec", "Transfert échoué, veuillez réessayer.");
      }
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Une erreur est survenue.");
    } finally {
      setLoadingPay(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, { backgroundColor: t.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" />
      <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setShowList(false); }}>
        <View>
          {/* ── HEADER ── */}
          <View style={[s.header, { shadowColor: t.shadow }]}>
            <LinearGradient
              colors={t.headerGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.deco1} />
            <View style={s.deco2} />

            <SafeAreaView edges={["top"]} style={{ width: "100%" }}>
              <View style={s.topBar}>
                <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
                  <Ionicons name="arrow-back" size={22} color={C.white} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Transfert Ecoins</Text>
                <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/notification")}>
                  <Ionicons name="notifications-outline" size={22} color={C.white} />
                </TouchableOpacity>
              </View>
            </SafeAreaView>

            <View style={s.headerIcon}>
              <Ionicons name="swap-horizontal-outline" size={32} color={C.white} />
            </View>
            <Text style={s.headerSub}>Envoyez des Ecoins à un utilisateur</Text>
          </View>

          {/* ── FORM CARD ── */}
          <Animated.View style={[
            s.card,
            {
              backgroundColor: t.card,
              shadowColor: t.shadow,
              borderColor: isDark ? t.border : "transparent",
              borderWidth: isDark ? 1 : 0,
              opacity: cardOpac,
              transform: [{ translateY: cardAnim }],
            },
          ]}>
            {isDark && <View style={s.cardShimmer} />}

            {/* Destinataire */}
            <SectionLabel title="DESTINATAIRE" icon="person-outline" />

            {/* Utilisateur sélectionné */}
            {selectedUser && (
              <View style={[s.selectedUser, { backgroundColor: t.selectedUserBg, borderColor: t.selectedBorder }]}>
                <View style={[s.selectedAvatar, { backgroundColor: C.primary }]}>
                  <Text style={s.selectedInitials}>{selectedUser.username.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.selectedName, { color: t.text }]}>{selectedUser.username}</Text>
                  {selectedUser.email && <Text style={[s.selectedEmail, { color: t.textSecondary }]}>{selectedUser.email}</Text>}
                </View>
                <TouchableOpacity
                  style={[s.clearUser, { backgroundColor: t.clearBtnBg }]}
                  onPress={() => { setSelectedUser(null); setSearchQuery(""); setShowList(false); }}
                >
                  <Ionicons name="close" size={16} color={t.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Search */}
            <Animated.View style={[s.inputBox, { borderColor: borderS, backgroundColor: bgS }]}>
              <Ionicons name="search-outline" size={16} color={t.textSecondary} />
              <TextInput
                placeholder="Rechercher un utilisateur…"
                placeholderTextColor={t.textSecondary}
                style={[s.input, { color: t.text }]}
                value={searchQuery}
                onChangeText={(v) => { setSearchQuery(v); setPage(1); setShowList(true); refetch(); }}
                onFocus={() => { focusAnim(inputFocS, 1); setShowList(true); }}
                onBlur={() => focusAnim(inputFocS, 0)}
              />
              {searchQuery.length > 0 && !selectedUser && (
                <ActivityIndicator size="small" color={t.textSecondary} animating={isFetching} />
              )}
            </Animated.View>

            {/* Dropdown */}
            {showList && users.length > 0 && !selectedUser && (
              <View style={[s.dropdown, { backgroundColor: t.dropdownBg, borderColor: t.border }]}>
                <FlatList

                  data={users}
                
 
                  keyExtractor={(item) => item.id.toString()}
                  style={{ maxHeight: 220 }}
                  keyboardShouldPersistTaps="handled"
                  onEndReached={loadMore}
                  onEndReachedThreshold={0.5}
                  showsVerticalScrollIndicator={false}
                   nestedScrollEnabled
                  ListFooterComponent={
                    isFetching ? (
                      <View style={{ padding: 10, alignItems: "center" }}>
                        <ActivityIndicator size="small" color={C.primary} />
                      </View>
                    ) : null
                  }
                  renderItem={({ item }) => (
                    <UserRow
                      item={item}
                      selected={selectedUser?.id === item.id}
                      onPress={() => handleSelectUser(item)}
                      t={t}
                      isDark={isDark}
                    />
                  )}
                />
              </View>
            )}

            {/* Montant */}
            <SectionLabel title="MONTANT (EC)" icon="cash-outline" />
            <Animated.View style={[s.inputBox, { borderColor: borderA, backgroundColor: bgA }]}>
              <Text style={[s.currency, { color: C.primary }]}>EC</Text>
              <TextInput
                placeholder="0"
                placeholderTextColor={t.textSecondary}
                keyboardType="numeric"
                style={[s.input, { color: t.text, fontSize: 18 }]}
                value={amount}
                onChangeText={setAmount}
                onFocus={() => focusAnim(inputFocA, 1)}
                onBlur={() => focusAnim(inputFocA, 0)}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              {amount.length > 0 && (
                <TouchableOpacity onPress={() => setAmount("")}>
                  <Ionicons name="close-circle" size={18} color={t.textSecondary} />
                </TouchableOpacity>
              )}
            </Animated.View>

            {/* Raccourcis */}
            <View style={s.shortcuts}>
              {SHORTCUTS.map((v) => {
                const active = amount === v;
                return (
                  <TouchableOpacity
                    key={v}
                    style={[s.chip, { backgroundColor: active ? C.primary : t.inputBg, borderColor: active ? C.primary : t.border }]}
                    onPress={() => setAmount(v)}
                  >
                    <Text style={[s.chipText, { color: active ? C.white : t.textSecondary }]}>{v} EC</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Récap */}
            {selectedUser && amount && (
              <View style={[s.recap, { backgroundColor: t.recapBg, borderColor: t.border }]}>
                <View style={[s.recapRow, { borderBottomColor: t.border }]}>
                  <Text style={[s.recapLabel, { color: t.textSecondary }]}>Destinataire</Text>
                  <Text style={[s.recapVal, { color: t.text }]}>{selectedUser.username}</Text>
                </View>
                <View style={[s.recapRow, { borderBottomWidth: 0 }]}>
                  <Text style={[s.recapLabel, { color: t.textSecondary }]}>Montant</Text>
                  <Text style={[s.recapVal, { color: C.primary }]}>{amount} EC</Text>
                </View>
              </View>
            )}

            {/* CTA */}
            <View style={s.cta}>
              <GradientButton
                isLoad={loadingPay}
                title={loadingPay ? "Traitement…" : "Confirmer le transfert"}
                onPress={handleConfirmPress}
                leftIcon={<ArrowIcon width={18} height={12} color={C.violet} />}
                rightIcon={<ArrowRightIcon width={26} height={20} />}
              />
            </View>

            <View style={s.secureRow}>
              <Ionicons name="lock-closed-outline" size={12} color={t.textSecondary} />
              <Text style={[s.secureText, { color: t.textSecondary }]}>Transfert sécurisé par BIM</Text>
            </View>
          </Animated.View>

          <View style={{ height: 60 }} />
        </View>
      </TouchableWithoutFeedback>

      {/* ══════════════════════════════════════════════
          ── PIN MODAL ──
      ══════════════════════════════════════════════ */}
      <Modal
        isVisible={showPinModal}
        onBackdropPress={() => { if (!loadingVerify) setShowPinModal(false); }}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={s.modalSlide}
        avoidKeyboard
      >
        <View style={[
          s.pinModal,
          {
            backgroundColor: t.modalBg,
            borderColor: isDark ? t.border : "transparent",
            borderWidth: isDark ? 1 : 0,
          },
        ]}>
          {/* Drag handle */}
          <View style={[s.dragHandle, { backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)" }]} />

          {/* Lock icon — violet pour le transfert */}
          <View style={[s.lockIconWrap, { backgroundColor: t.lockIconBg }]}>
            <Ionicons name="lock-closed" size={28} color={C.violet} />
          </View>

          <Text style={[s.pinTitle, { color: t.text }]}>Mot de passe requis</Text>
          <Text style={[s.pinSub, { color: t.textSecondary }]}>
            Entrez votre code à 6 chiffres pour confirmer le transfert
          </Text>

          {/* Reminder : destinataire + montant */}
          {selectedUser && amount && (
            <View style={[s.amountReminder, { backgroundColor: t.recapBg, borderColor: t.border }]}>
              <Ionicons name="swap-horizontal-outline" size={14} color={C.primary} />
              <Text style={[s.amountReminderText, { color: t.text }]}>
                {Number(amount).toLocaleString("fr-FR")} EC
              </Text>
              <Text style={[s.amountReminderMethod, { color: t.textSecondary }]}>
                → {selectedUser.username}
              </Text>
            </View>
          )}

          {/* PIN dots */}
          <Animated.View style={{ transform: [{ translateX: pinShake }] }}>
            <PinDots value={pinValue} t={t} />
          </Animated.View>

          {/* Error */}
          {pinError.length > 0 && (
            <View style={s.pinErrorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={C.error} />
              <Text style={s.pinErrorText}>{pinError}</Text>
            </View>
          )}

          {/* Keypad */}
          <Keypad onPress={handlePinKey} onDelete={handlePinDelete} t={t} isDark={isDark} />

          {/* Confirm */}
          <TouchableOpacity
            style={[s.confirmBtn, { opacity: pinValue.length === 6 ? 1 : 0.5 }]}
            onPress={handleConfirmPin}
            disabled={loadingVerify || pinValue.length < 6}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[C.deep, C.violet]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.confirmGrad}
            >
              {loadingVerify
                ? <Ionicons name="sync" size={18} color={C.white} />
                : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color={C.white} />
                    <Text style={s.confirmText}>Valider</Text>
                  </>
                )
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowPinModal(false)}
            style={s.cancelBtn}
            disabled={loadingVerify}
          >
            <Text style={[s.cancelText, { color: t.textSecondary }]}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  scroll: { paddingBottom: 20 },

  header: {
    height: 220, overflow: "hidden",
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    alignItems: "center", elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16,
  },
  deco1: {
    position: "absolute", width: 180, height: 180,
    borderRadius: 90, backgroundColor: "rgba(255,255,255,0.06)",
    top: -50, right: -40,
  },
  deco2: {
    position: "absolute", width: 120, height: 120,
    borderRadius: 60, backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -20, left: -20,
  },
  topBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 8,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 17, fontFamily: "NexaLight", letterSpacing: 0.3 },
  headerIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    marginTop: 12, borderWidth: 2, borderColor: "rgba(255,255,255,0.25)",
  },
  headerSub: { color: "rgba(255,255,255,0.80)", fontSize: 12, fontFamily: "NexaLight", marginTop: 8 },

  card: {
    borderRadius: 28, padding: 20,
    marginHorizontal: 16, marginTop: -28,
    overflow: "hidden", elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 14,
  },
  cardShimmer: {
    position: "absolute", top: 0, left: 0, right: 0, height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  selectedUser: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, padding: 10,
    marginBottom: 10, gap: 10,
    borderWidth: 1.5,
  },
  selectedAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  selectedInitials: { color: "#FFFFFF", fontFamily: "NexaLight", fontSize: 13 },
  selectedName:     { fontFamily: "NexaLight", fontSize: 13 },
  selectedEmail:    { fontFamily: "NexaLight", fontSize: 11 },
  clearUser: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },

  inputBox: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, height: 50, gap: 10, marginBottom: 12,
  },
  currency: { fontFamily: "NexaLight", fontSize: 15 },
  input:    { flex: 1, fontSize: 14, fontFamily: "NexaLight" },

  dropdown: {
    borderRadius: 16, marginBottom: 14,
    borderWidth: 1, overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10, shadowRadius: 8,
  },

  shortcuts: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 18 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontFamily: "NexaLight", fontSize: 12 },

  recap: { borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1 },
  recapRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1 },
  recapLabel: { fontFamily: "NexaLight", fontSize: 12 },
  recapVal:   { fontFamily: "NexaLight", fontSize: 12 },

  cta: { marginTop: 4 },
  secureRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 12 },
  secureText: { fontFamily: "NexaLight", fontSize: 11 },

  /* ── PIN modal ── */
  modalSlide: { justifyContent: "flex-end", margin: 0 },
  pinModal: {
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: 36, alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18, shadowRadius: 20,
  },
  dragHandle: { width: 40, height: 4, borderRadius: 2, marginBottom: 20 },
  lockIconWrap: {
    width: 66, height: 66, borderRadius: 33,
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  pinTitle: { fontFamily: "NexaLight", fontSize: 18, marginBottom: 6, letterSpacing: 0.2 },
  pinSub: {
    fontFamily: "NexaLight", fontSize: 12,
    textAlign: "center", lineHeight: 18,
    marginBottom: 18, paddingHorizontal: 10,
  },
  amountReminder: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 8, marginBottom: 22,
  },
  amountReminderText:   { fontFamily: "NexaLight", fontSize: 15, fontWeight: "600" },
  amountReminderMethod: { fontFamily: "NexaLight", fontSize: 13 },

  pinErrorRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  pinErrorText: { fontFamily: "NexaLight", fontSize: 12, color: C.error },

  confirmBtn: { width: "100%", borderRadius: 16, overflow: "hidden", marginTop: 20 },
  confirmGrad: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 10, paddingVertical: 15,
  },
  confirmText: { color: "#FFFFFF", fontFamily: "NexaLight", fontSize: 15 },

  cancelBtn: { marginTop: 14, paddingVertical: 8 },
  cancelText: { fontFamily: "NexaLight", fontSize: 13 },
});

const ur = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    padding: 12, gap: 10, borderBottomWidth: 1,
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },
  initials:    { fontFamily: "NexaLight", fontSize: 13 },
  info:        { flex: 1 },
  name:        { fontFamily: "NexaLight", fontSize: 13 },
  email:       { fontFamily: "NexaLight", fontSize: 11 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: "center", justifyContent: "center",
  },
});

const sl = StyleSheet.create({
  row:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, marginTop: 4 },
  text: { fontFamily: "NexaLight", fontSize: 11, color: C.primary, textTransform: "uppercase", letterSpacing: 0.8, opacity: 0.9 },
});

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