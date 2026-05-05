/* eslint-disable */
import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { getSocket } from "@/services/socketService";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Animated,
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
import { useRechargeMutation, useVerifyPaymentMutation } from "@/services/tsxService";
import { useVerifyPassMutation } from "@/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeDecimal } from "@/utils/normalizeDecimal.util";

/* ─── THEME ──────────────────────────────────────────────────────────── */
const C = {
  primary: "#0353CC",
  violet:  "#3906C7",
  deep:    "#302E99",
  accent:  "#4D96FF",
  gold:    "#FFD700",
  white:   "#FFFFFF",
  error:   "#EF4444",
  success: "#22C55E",
};

const Colors = {
  light: {
    bg:            "#F0F4FF",
    card:          "#FFFFFF",
    text:          "#0D1B3E",
    textSecondary: "#7B8DB0",
    border:        "rgba(3,83,204,0.12)",
    inputBg:       "rgba(3,83,204,0.06)",
    inputFocBg:    "rgba(3,83,204,0.10)",
    headerGrad:    [C.deep, C.primary] as [string, string],
    shadow:        "#000",
    recapBg:       "rgba(3,83,204,0.05)",
    prefixBorder:  "rgba(3,83,204,0.12)",
    modalBg:       "#FFFFFF",
    pinBorder:     "rgba(3,83,204,0.20)",
    pinFilled:     C.primary,
    lockIconBg:    "rgba(3,83,204,0.08)",
    keyBg:         "rgba(3,83,204,0.06)",
    keyDelBg:      "rgba(239,68,68,0.08)",
  },
  dark: {
    bg:            "#07091A",
    card:          "#0F1228",
    text:          "#E2E8F0",
    textSecondary: "#556080",
    border:        "rgba(77,150,255,0.12)",
    inputBg:       "rgba(77,150,255,0.07)",
    inputFocBg:    "rgba(77,150,255,0.13)",
    headerGrad:    ["#05081A", "#0D1535"] as [string, string],
    shadow:        "#000",
    recapBg:       "rgba(77,150,255,0.06)",
    prefixBorder:  "rgba(77,150,255,0.15)",
    modalBg:       "#0F1228",
    pinBorder:     "rgba(77,150,255,0.20)",
    pinFilled:     C.accent,
    lockIconBg:    "rgba(3,83,204,0.18)",
    keyBg:         "rgba(77,150,255,0.07)",
    keyDelBg:      "rgba(239,68,68,0.12)",
  },
};

function useTheme() {
  const isDark = useColorScheme() === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

/* ─── METHODS ────────────────────────────────────────────────────────── */
const METHODS = [
  { id: "airtel",   name: "AirtelMoney", logo: "https://images.africanfinancials.com/797d4617-ng-airtel-logo.png",  color: "#E4002B" },
  { id: "orange",   name: "OrangeMoney", logo: "https://c.woopic.com/logo-orange.png",                              color: "#FF6900" },
  { id: "vodacom",  name: "M-Pesa",      logo: "https://www.vodacom.co.za/themes/custom/blip/img/menu/vodacom-logo.png", color: "#E60000" },
  { id: "africell", name: "AfriMoney",   logo: "https://upload.wikimedia.org/wikipedia/commons/c/c9/AfricellLogo.png",  color: "#0077C8" },
];

const SHORTCUTS       = ["1 000", "2 500", "5 000", "10 000"];
const SHORTCUTS_CLEAN = ["1000",  "2500",  "5000",  "10000"];

/* ─── METHOD CARD ────────────────────────────────────────────────────── */
function MethodCard({
  item, selected, onPress,
}: { item: typeof METHODS[number]; selected: boolean; onPress: () => void }) {
  const scale    = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
      <Animated.View style={[
        ms.card,
        selected && { borderColor: C.gold, borderWidth: 2.5 },
        { transform: [{ scale }] },
      ]}>
        <LinearGradient
          colors={[C.deep, item.color + "CC"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={ms.deco} />
        {selected && (
          <View style={ms.checkBadge}>
            <Ionicons name="checkmark" size={10} color={C.deep} />
          </View>
        )}
        <Image source={{ uri: item.logo }} style={ms.logo} contentFit="contain" transition={200} />
        <Text style={ms.name}>{item.name}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ─── VISA CARD ──────────────────────────────────────────────────────── */
function VisaCard({ selected, onPress }: { selected: boolean; onPress: () => void }) {
  const scale    = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={pressIn} onPressOut={pressOut} onPress={onPress} style={{ width: "100%" }}>
      <Animated.View style={[vc.outer, selected && vc.selected, { transform: [{ scale }] }]}>
        {selected && (
          <View style={vc.checkBadge}>
            <Ionicons name="checkmark" size={12} color={C.deep} />
          </View>
        )}
        <LinearGradient
          colors={["#0A0E3A", "#0353CC", "#071A6E"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={vc.card}
        >
          <View style={vc.deco1} />
          <View style={vc.deco2} />
          {/* Top */}
          <View style={vc.topRow}>
            <Text style={vc.bankName}>BIM BANK</Text>
            <View style={vc.chip}>
              <View style={vc.chipH} />
              <View style={vc.chipV} />
            </View>
          </View>
          {/* Number */}
          <Text style={vc.cardNum}>•••• •••• •••• ••••</Text>
          {/* Bottom */}
          <View style={vc.bottomRow}>
            <View>
              <Text style={vc.cardLabel}>TITULAIRE</Text>
              <Text style={vc.cardValue}>VOTRE NOM</Text>
            </View>
            <View>
              <Text style={vc.cardLabel}>EXPIRE</Text>
              <Text style={vc.cardValue}>12/27</Text>
            </View>
            <Text style={vc.visaText}>VISA</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
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
  onPress, onDelete, t,
}: {
  onPress: (v: string) => void;
  onDelete: () => void;
  t: typeof Colors.light;
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

/* ─── PENDING VIEW ───────────────────────────────────────────────────── */
function PendingView({
  subText, reference, isCard, t, onCancel, showVerifyBtn, onVerify, verifying, retryAttempt,
}: {
  subText: string;
  reference: string;
  isCard: boolean;
  t: typeof Colors.light;
  onCancel: () => void;
  showVerifyBtn: boolean;
  onVerify: () => void;
  verifying: boolean;
  retryAttempt: number;
}) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.25, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={[pv.container, { backgroundColor: t.bg }]}>
      <View style={pv.loaderWrap}>
        <Animated.View style={[pv.ring, { borderColor: C.primary + "33", transform: [{ scale: pulse }] }]} />
        <View style={[pv.innerCircle, { backgroundColor: "rgba(3,83,204,0.10)" }]}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </View>

      <Text style={[pv.title, { color: t.text }]}>
        {isCard ? "Paiement en cours…" : "En attente de confirmation"}
      </Text>
      <Text style={[pv.sub, { color: t.textSecondary }]}>{subText}</Text>

      {!!reference && (
        <View style={[pv.refBox, { backgroundColor: t.recapBg, borderColor: t.border }]}>
          <Ionicons name="receipt-outline" size={13} color={C.primary} />
          <Text style={[pv.refText, { color: t.textSecondary }]}>Réf : {reference}</Text>
        </View>
      )}

      <Text style={[pv.hint, { color: t.textSecondary }]}>
        {isCard
          ? "Ne fermez pas l'application. Cette page se mettra à jour automatiquement."
          : "Cette page se mettra à jour automatiquement dès que le paiement est confirmé."}
      </Text>

      {!isCard && retryAttempt === 0 && (
        <View style={[pv.autoCheckBadge, { backgroundColor: t.recapBg, borderColor: t.border }]}>
          <Ionicons name="sync-outline" size={13} color={C.primary} />
          <Text style={[pv.autoCheckText, { color: t.textSecondary }]}>
            Vérification automatique toutes les 20 secondes
          </Text>
        </View>
      )}

      {!isCard && retryAttempt > 0 && (
        <View style={[pv.autoCheckBadge, { backgroundColor: "rgba(255,165,0,0.08)", borderColor: "rgba(255,165,0,0.35)" }]}>
          <Ionicons name="time-outline" size={13} color="#F97316" />
          <Text style={[pv.autoCheckText, { color: "#F97316" }]}>
            Tentative {retryAttempt}/4 — En attente de votre confirmation…
          </Text>
        </View>
      )}

      {showVerifyBtn && !isCard && (
        <TouchableOpacity
          style={[pv.verifyBtn, { opacity: verifying ? 0.7 : 1 }]}
          onPress={onVerify}
          disabled={verifying}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[C.deep, C.primary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={pv.verifyGrad}
          >
            {verifying
              ? <ActivityIndicator size="small" color={C.white} />
              : <Ionicons name="refresh-outline" size={16} color={C.white} />}
            <Text style={pv.verifyText}>
              {verifying ? "Vérification…" : "Vérifier le paiement"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[pv.cancelBtn, { borderColor: C.error, backgroundColor: "rgba(239,68,68,0.08)" }]}
        onPress={onCancel}
        activeOpacity={0.75}
      >
        <Ionicons name="close-circle-outline" size={16} color={C.error} />
        <Text style={[pv.cancelText, { color: C.error, fontWeight: "600" }]}>Annuler le paiement</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── SUCCESS VIEW ───────────────────────────────────────────────────── */
function SuccessView({
  amount, t, onBack,
}: {
  amount: number;
  t: typeof Colors.light;
  onBack: () => void;
}) {
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1, useNativeDriver: true, damping: 10, stiffness: 120,
    }).start();
  }, []);

  return (
    <View style={[xv.container, { backgroundColor: t.bg }]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient colors={[C.success, "#16A34A"]} style={xv.iconGrad}>
          <Ionicons name="checkmark" size={52} color={C.white} />
        </LinearGradient>
      </Animated.View>

      <Text style={[xv.title, { color: t.text }]}>Recharge réussie !</Text>
      {amount > 0 && (
        <Text style={[xv.amount, { color: C.primary }]}>
          +{Number(amount).toLocaleString("fr-FR")} EC crédités
        </Text>
      )}
      <Text style={[xv.sub, { color: t.textSecondary }]}>
        Votre compte BIM a été crédité avec succès.
      </Text>

      <TouchableOpacity style={xv.btn} onPress={onBack} activeOpacity={0.85}>
        <LinearGradient
          colors={[C.deep, C.primary]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={xv.btnGrad}
        >
          <Ionicons name="home-outline" size={18} color={C.white} />
          <Text style={xv.btnText}>Retour à l'accueil</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

/* ─── FAILED VIEW ────────────────────────────────────────────────────── */
function FailedView({
  t, onRetry, onBack,
}: {
  t: typeof Colors.light;
  onRetry: () => void;
  onBack: () => void;
}) {
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1, useNativeDriver: true, damping: 10, stiffness: 120,
    }).start();
  }, []);

  return (
    <View style={[fv.container, { backgroundColor: t.bg }]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient colors={[C.error, "#DC2626"]} style={fv.iconGrad}>
          <Ionicons name="close" size={52} color={C.white} />
        </LinearGradient>
      </Animated.View>

      <Text style={[fv.title, { color: t.text }]}>Paiement échoué</Text>
      <Text style={[fv.sub, { color: t.textSecondary }]}>
        Votre paiement n'a pas abouti. Veuillez réessayer.
      </Text>

      <TouchableOpacity style={fv.retryBtn} onPress={onRetry} activeOpacity={0.85}>
        <LinearGradient
          colors={[C.deep, C.primary]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={fv.retryGrad}
        >
          <Ionicons name="refresh-outline" size={18} color={C.white} />
          <Text style={fv.retryText}>Réessayer</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={fv.backBtn} onPress={onBack}>
        <Text style={[fv.backText, { color: t.textSecondary }]}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── CANCELLED VIEW ─────────────────────────────────────────────────── */
function CancelledView({
  t, onRetry, onBack,
}: {
  t: typeof Colors.light;
  onRetry: () => void;
  onBack: () => void;
}) {
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1, useNativeDriver: true, damping: 10, stiffness: 120,
    }).start();
  }, []);

  return (
    <View style={[fv.container, { backgroundColor: t.bg }]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient colors={["#F59E0B", "#D97706"]} style={fv.iconGrad}>
          <Ionicons name="ban-outline" size={52} color={C.white} />
        </LinearGradient>
      </Animated.View>

      <Text style={[fv.title, { color: t.text }]}>Recharge annulée</Text>
      <Text style={[fv.sub, { color: t.textSecondary }]}>
        Vous avez annulé la recharge. Aucun montant n'a été débité si vous n'avez pas confirmé sur votre téléphone.
      </Text>

      <TouchableOpacity style={fv.retryBtn} onPress={onRetry} activeOpacity={0.85}>
        <LinearGradient
          colors={[C.deep, C.primary]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={fv.retryGrad}
        >
          <Ionicons name="refresh-outline" size={18} color={C.white} />
          <Text style={fv.retryText}>Nouvelle recharge</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={fv.backBtn} onPress={onBack}>
        <Text style={[fv.backText, { color: t.textSecondary }]}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function RechargeEcoinsScreen() {
  const router = useRouter();
  const { isDark, t } = useTheme();
  const { t: tr } = useTranslation();

  const [amount,         setAmount]         = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [phone,          setPhone]          = useState("");
  const [userId,         setUserId]         = useState<string | null>(null);

  /* ── Phase ── */
  type Phase = "idle" | "pending" | "success" | "failed" | "cancelled";
  const [phase,        setPhase]        = useState<Phase>("idle");
  const [pendingRef,   setPendingRef]   = useState("");
  const [pendingSubTx, setPendingSubTx] = useState("");
  const [paidAmount,   setPaidAmount]   = useState(0);
  const [retryAttempt, setRetryAttempt] = useState(0);

  /* PIN modal */
  const [showPinModal,  setShowPinModal]  = useState(false);
  const [pinValue,      setPinValue]      = useState("");
  const [pinError,      setPinError]      = useState("");
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingPay,    setLoadingPay]    = useState(false);
  const pinShake = useRef(new Animated.Value(0)).current;

  const inputFocAmt = useRef(new Animated.Value(0)).current;
  const inputFocPh  = useRef(new Animated.Value(0)).current;
  const cardAnim    = useRef(new Animated.Value(50)).current;
  const cardOpac    = useRef(new Animated.Value(0)).current;

  const [recharge]       = useRechargeMutation();
  const [verifyPass]     = useVerifyPassMutation();
  const [verifyPayment]  = useVerifyPaymentMutation();
  const [verifying,      setVerifying]      = useState(false);
  const [showVerifyBtn,  setShowVerifyBtn]  = useState(false);

  /* Ref qui suit toujours la référence active — lisible dans les closures socket sans re-création */
  const pendingRefRef      = useRef("");
  const pendingRetryCount  = useRef(0);
  const awaitingRetryMode  = useRef(false);
  const pollingInProgress  = useRef(false);

  const isCard   = selectedMethod === "Card";
  const isMobile = selectedMethod !== null && !isCard;

  useEffect(() => {
    AsyncStorage.getItem("userId").then(setUserId);
    Animated.parallel([
      Animated.timing(cardAnim, { toValue: 0, duration: 420, delay: 100, useNativeDriver: true }),
      Animated.timing(cardOpac, { toValue: 1, duration: 420, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  /* Garde pendingRefRef synchronisé avec pendingRef */
  useEffect(() => { pendingRefRef.current = pendingRef; }, [pendingRef]);

  /* Reset du compteur à chaque nouvelle transaction */
  useEffect(() => { pendingRetryCount.current = 0; }, [pendingRef]);

  /* Reset retry mode quand on quitte la phase pending */
  useEffect(() => {
    if (phase !== "pending") {
      awaitingRetryMode.current = false;
      pendingRetryCount.current = 0;
      setRetryAttempt(0);
    }
  }, [phase]);

  /* ── Socket listeners ── */
  useEffect(() => {
    const onSuccess   = (data: any) => {
      if (data?.reference && pendingRefRef.current && data.reference !== pendingRefRef.current) return;
      setPaidAmount(data?.montantCredite || 0);
      setPhase("success");
    };
    const onFailed    = (data: any) => {
      if (data?.reference && pendingRefRef.current && data.reference !== pendingRefRef.current) return;
      setPhase("failed");
    };
    const onCancelled = (data: any) => {
      if (data?.reference && pendingRefRef.current && data.reference !== pendingRefRef.current) return;
      if (pollingInProgress.current || awaitingRetryMode.current) return;
      setPendingRef("");
      setShowVerifyBtn(false);
      setPhase("cancelled");
    };

    const registerOn = (s: any) => {
      s.off("recharge:success",   onSuccess);
      s.off("recharge:failed",    onFailed);
      s.off("recharge:declined",  onFailed);
      s.off("recharge:cancelled", onCancelled);
      s.on("recharge:success",   onSuccess);
      s.on("recharge:failed",    onFailed);
      s.on("recharge:declined",  onFailed);
      s.on("recharge:cancelled", onCancelled);
    };
    const registerOff = (s: any) => {
      s.off("recharge:success",   onSuccess);
      s.off("recharge:failed",    onFailed);
      s.off("recharge:declined",  onFailed);
      s.off("recharge:cancelled", onCancelled);
      s.off("connect",            onReconnect);
    };
    const onReconnect = () => {
      const s = getSocket();
      if (s) registerOn(s);
    };

    let pollId: ReturnType<typeof setInterval> | null = null;

    const attach = (s: any) => {
      registerOn(s);
      s.on("connect", onReconnect);
    };

    let s = getSocket();
    if (s) {
      attach(s);
    } else {
      let attempts = 0;
      pollId = setInterval(() => {
        s = getSocket();
        attempts++;
        if (s || attempts >= 20) {
          clearInterval(pollId!);
          pollId = null;
          if (s) attach(s);
        }
      }, 500);
    }

    return () => {
      if (pollId) clearInterval(pollId);
      const sock = getSocket();
      if (sock) registerOff(sock);
    };
  }, []);

  /* ── Polling toutes les 20 s pendant la phase pending (fallback si event socket raté) ── */
  useEffect(() => {
    if (phase !== "pending" || isCard || !pendingRef) return;

    const id = setInterval(async () => {
      const attempt = pendingRetryCount.current + 1;
      pollingInProgress.current = true;
      try {
        const result: any = await verifyPayment({ reference: pendingRef }).unwrap();
        const flexMsg: string = result?.data?.message ?? "";

        if (result?.status === "success" || result?.status === "already_done") {
          awaitingRetryMode.current = false;
          setPaidAmount(result?.montantCredite || 0);
          setPhase("success");
        } else if (flexMsg.includes("awaiting client authorization")) {
          awaitingRetryMode.current = true;
          pendingRetryCount.current += 1;
          setRetryAttempt(pendingRetryCount.current);
          if (pendingRetryCount.current >= 4) {
            awaitingRetryMode.current = false;
            setPhase("cancelled");
          }
        } else if (awaitingRetryMode.current) {
          pendingRetryCount.current += 1;
          setRetryAttempt(pendingRetryCount.current);
          if (pendingRetryCount.current >= 4) {
            awaitingRetryMode.current = false;
            setPhase("cancelled");
          }
        } else if (result?.status === "cancelled" || result?.status === "failed") {
          setPhase("cancelled");
        }
      } catch { /* silencieux */ }
      finally {
        pollingInProgress.current = false;
      }
    }, 20_000);

    return () => clearInterval(id);
  }, [phase, isCard, pendingRef]);


  

  /* ── Timeout 60 s : afficher le bouton "Vérifier" ── */
  useEffect(() => {
    if (phase !== "pending" || isCard) return;
    setShowVerifyBtn(false);
    const timer = setTimeout(() => setShowVerifyBtn(true), 60_000);
    return () => clearTimeout(timer);
  }, [phase, isCard]);

  /* ── Vérification FlexPay après 20 min ── */
  useEffect(() => {
    if (phase !== "pending" || isCard || !pendingRef) return;
    const timer = setTimeout(async () => {
      try {
        const result: any = await verifyPayment({ reference: pendingRef }).unwrap();
        if (result?.status === "success" || result?.status === "already_done") {
          setPaidAmount(result?.montantCredite || 0);
          setPhase("success");
        }
      } catch { /* silencieux */ }
    }, 20 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [phase, isCard, pendingRef]);

  /* ── Vérification auto quand l'app revient au premier plan (phase pending) ── */
  useEffect(() => {
    if (phase !== "pending" || isCard) return;

    const sub = AppState.addEventListener("change", async (nextState) => {
      if (nextState === "active" && pendingRef) {
        await new Promise(r => setTimeout(r, 1500));
        try {
          const result: any = await verifyPayment({ reference: pendingRef }).unwrap();
          if (result?.status === "success" || result?.status === "already_done") {
            setPaidAmount(result?.montantCredite || 0);
            setPhase("success");
          } else if (result?.status === "cancelled" || result?.status === "failed") {
            setPhase("cancelled");
          }
        } catch { /* silencieux — le socket ou le bouton "Vérifier" prendra le relais */ }
      }
    });

    return () => sub.remove();
  }, [phase, isCard, pendingRef]);

  const focusAnim = (anim: Animated.Value, v: number) =>
    Animated.timing(anim, { toValue: v, duration: 200, useNativeDriver: false }).start();

  const borderAmt = inputFocAmt.interpolate({ inputRange: [0, 1], outputRange: [t.border, C.primary] });
  const bgAmt     = inputFocAmt.interpolate({ inputRange: [0, 1], outputRange: [t.inputBg, t.inputFocBg] });
  const borderPh  = inputFocPh.interpolate({  inputRange: [0, 1], outputRange: [t.border, C.primary] });
  const bgPh      = inputFocPh.interpolate({  inputRange: [0, 1], outputRange: [t.inputBg, t.inputFocBg] });

  const cleanAmount = (v: string) => v.replace(/\s/g, "");

  const resetToIdle = () => {
    setPhase("idle");
    setPendingRef("");
    setPaidAmount(0);
    setPendingSubTx("");
    setShowVerifyBtn(false);
  };

  const handleCancel = () => {
    setPendingRef("");
    setPaidAmount(0);
    setPendingSubTx("");
    setShowVerifyBtn(false);
    setPhase("cancelled");
  };

  const handleCancelPress = () => {
    Alert.alert(
      "Annuler le paiement ?",
      "Même si un message de paiement apparaît sur votre téléphone après ceci, SVP ne payez pas — la transaction sera annulée de notre côté.",
      [
        { text: "Continuer d'attendre", style: "cancel" },
        { text: "Annuler le paiement", style: "destructive", onPress: handleCancel },
      ]
    );
  };

  const handleVerify = async () => {
    if (!pendingRef || verifying) return;
    try {
      setVerifying(true);
      const result: any = await verifyPayment({ reference: pendingRef }).unwrap();
      if (result?.status === "success" || result?.status === "already_done") {
        setPaidAmount(result?.montantCredite || 0);
        setPhase("success");
      } else if (result?.status === "failed") {
        setPhase("failed");
      } else if (result?.status === "cancelled") {
        setPhase("cancelled");
      } else {
        Alert.alert(
          "Paiement en attente",
          "Votre paiement n'est pas encore confirmé par l'opérateur. Réessayez dans quelques instants."
        );
      }
    } catch {
      Alert.alert("Erreur", "Impossible de vérifier le paiement. Vérifiez votre connexion.");
    } finally {
      setVerifying(false);
    }
  };

  /* ── Step 1 ── */
  const handleConfirmPress = () => {
    if (!amount || !selectedMethod) {
      Alert.alert(tr("common.missingFields"), tr("common.fillAllFields"));
      return;
    }
    if (isMobile && !phone) {
      Alert.alert(tr("common.missingFields"), tr("common.fillAllFields"));
      return;
    }
    if (isMobile && !phone.startsWith("243")) {
      Alert.alert(tr("recharge.invalidNumber"), tr("recharge.numberHint"));
      return;
    }
    if (!userId) {
      Alert.alert(tr("common.error"), "Utilisateur introuvable. Veuillez vous reconnecter.");
      return;
    }
    setPinValue("");
    setPinError("");
    setShowPinModal(true);
  };

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

  /* ── Step 2 & 3 ── */
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

    try {
      setLoadingPay(true);
      const result: any = await recharge({
        amount:        normalizeDecimal(cleanAmount(amount)),
        userId,
        telephone:     isCard ? "0000000000" : phone,
        PayTypeValue:  selectedMethod,
        CurrencyValue: "USD",
      }).unwrap();

      setPendingRef(result?.reference || "");

      if (isCard) {
        setPendingSubTx("Votre paiement carte est en cours de traitement.");
        setPhase("pending");
        setLoadingPay(false);
        if (result?.redirectUrl) {
          await WebBrowser.openBrowserAsync(result.redirectUrl);
        }
      } else {
        setPendingSubTx("Validez le push sur votre téléphone.");
        setPhase("pending");
        setLoadingPay(false);
      }
    } catch (err: any) {
      setLoadingPay(false);
      Alert.alert("Erreur", err?.data?.message || "Une erreur est survenue lors de la recharge.");
    }
  };

  /* ─── HEADER (JSX variable, shared across all phases) ─────────────── */
  const headerJSX = (
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
          <Text style={s.headerTitle}>Recharge Ecoins</Text>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/notification")}>
            <Ionicons name="notifications-outline" size={22} color={C.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <View style={s.headerIcon}>
        <Ionicons name="wallet-outline" size={32} color={C.white} />
      </View>
      <Text style={s.headerSub}>Choisissez un moyen de recharge</Text>
    </View>
  );

  /* ─── STATUS SCREENS ───────────────────────────────────────────────── */
  if (phase === "pending") {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <StatusBar barStyle="light-content" />
        {headerJSX}
        <PendingView
          subText={pendingSubTx}
          reference={pendingRef}
          isCard={isCard}
          t={t}
          onCancel={handleCancelPress}
          showVerifyBtn={showVerifyBtn}
          onVerify={handleVerify}
          verifying={verifying}
          retryAttempt={retryAttempt}
        />
      </View>
    );
  }

  if (phase === "success") {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <StatusBar barStyle="light-content" />
        {headerJSX}
        <SuccessView amount={paidAmount} t={t} onBack={() => router.back()} />
      </View>
    );
  }

  if (phase === "failed") {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <StatusBar barStyle="light-content" />
        {headerJSX}
        <FailedView t={t} onRetry={resetToIdle} onBack={() => router.back()} />
      </View>
    );
  }

  if (phase === "cancelled") {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <StatusBar barStyle="light-content" />
        {headerJSX}
        <CancelledView t={t} onRetry={resetToIdle} onBack={() => router.back()} />
      </View>
    );
  }

  /* ─── IDLE : FORM ──────────────────────────────────────────────────── */
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, { backgroundColor: t.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[s.scroll, { backgroundColor: t.bg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          {headerJSX}

          {/* FORM CARD */}
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

            {/* Montant */}
            <SectionLabel title="MONTANT À RECHARGER" icon="cash-outline" />
            <Animated.View style={[s.inputBox, { borderColor: borderAmt, backgroundColor: bgAmt }]}>
              <Text style={[s.currency, { color: C.primary }]}>EC</Text>
              <TextInput
                placeholder="0"
                placeholderTextColor={t.textSecondary}
                keyboardType="numeric"
                style={[s.input, { color: t.text }]}
                value={amount}
                onChangeText={setAmount}
                onFocus={() => focusAnim(inputFocAmt, 1)}
                onBlur={() => focusAnim(inputFocAmt, 0)}
                returnKeyType="done"
              />
              {amount.length > 0 && (
                <TouchableOpacity onPress={() => setAmount("")}>
                  <Ionicons name="close-circle" size={18} color={t.textSecondary} />
                </TouchableOpacity>
              )}
            </Animated.View>

            {/* Raccourcis */}
            <View style={s.shortcuts}>
              {SHORTCUTS.map((v, i) => {
                const clean  = SHORTCUTS_CLEAN[i];
                const active = amount === clean;
                return (
                  <TouchableOpacity
                    key={v}
                    style={[s.chip, { backgroundColor: active ? C.primary : t.inputBg, borderColor: active ? C.primary : t.border }]}
                    onPress={() => setAmount(clean)}
                  >
                    <Text style={[s.chipText, { color: active ? C.white : t.textSecondary }]}>{v}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Section 1 : Mobile Money ── */}
            <SectionLabel title="MOBILE MONEY" icon="phone-portrait-outline" />
            <View style={s.methodsGrid}>
              {METHODS.map((item) => (
                <View key={item.id} style={s.methodWrap}>
                  <MethodCard
                    item={item}
                    selected={selectedMethod === item.name}
                    onPress={() => setSelectedMethod(item.name)}
                  />
                </View>
              ))}
            </View>

            {/* Téléphone — Mobile Money uniquement */}
            {isMobile && (
              <>
                <SectionLabel title={`NUMÉRO (${selectedMethod})`} icon="call-outline" />
                <Animated.View style={[s.inputBox, { borderColor: borderPh, backgroundColor: bgPh }]}>
                  <Text style={[s.prefixBadge, { color: C.primary, borderRightColor: t.prefixBorder }]}>+</Text>
                  <TextInput
                    placeholder="243812 345 678"
                    placeholderTextColor={t.textSecondary}
                    keyboardType="numeric"
                    style={[s.input, { color: t.text }]}
                    value={phone}
                    onChangeText={setPhone}
                    onFocus={() => focusAnim(inputFocPh, 1)}
                    onBlur={() => focusAnim(inputFocPh, 0)}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  {phone.length > 0 && (
                    <TouchableOpacity onPress={() => setPhone("")}>
                      <Ionicons name="close-circle" size={18} color={t.textSecondary} />
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </>
            )}

            {/* ── Section 2 : Carte Bancaire ── */}
            <SectionLabel title="CARTE BANCAIRE" icon="card-outline" />
            <VisaCard selected={isCard} onPress={() => setSelectedMethod("Card")} />

            {/* Récap */}
            {amount && selectedMethod && (
              <View style={[s.recap, { backgroundColor: t.recapBg, borderColor: t.border }]}>
                <View style={[s.recapRow, { borderBottomColor: t.border }]}>
                  <Text style={[s.recapLabel, { color: t.textSecondary }]}>Méthode</Text>
                  <Text style={[s.recapVal, { color: t.text }]}>{selectedMethod}</Text>
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
                title={
                  loadingPay ? "Traitement…" :
                  isCard     ? "Payer avec ma carte Visa" :
                               "Confirmer la recharge"
                }
                onPress={handleConfirmPress}
                leftIcon={<ArrowIcon width={18} height={12} color={C.violet} />}
                rightIcon={<ArrowRightIcon width={26} height={20} />}
                isLoad={loadingPay}
              />
            </View>

            <View style={s.secureRow}>
              <Ionicons name="lock-closed-outline" size={12} color={t.textSecondary} />
              <Text style={[s.secureText, { color: t.textSecondary }]}>Paiement sécurisé par BIM</Text>
            </View>
          </Animated.View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* ─── PIN MODAL ─────────────────────────────────────────────────── */}
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
          <View style={[s.dragHandle, { backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)" }]} />
          <View style={[s.lockIconWrap, { backgroundColor: t.lockIconBg }]}>
            <Ionicons name="lock-closed" size={28} color={C.primary} />
          </View>
          <Text style={[s.pinTitle, { color: t.text }]}>Mot de passe requis</Text>
          <Text style={[s.pinSub, { color: t.textSecondary }]}>
            Entrez votre code à 6 chiffres pour confirmer la recharge
          </Text>
          {amount.length > 0 && (
            <View style={[s.amountReminder, { backgroundColor: t.recapBg, borderColor: t.border }]}>
              <Ionicons name="wallet-outline" size={14} color={C.primary} />
              <Text style={[s.amountReminderText, { color: t.text }]}>
                {Number(normalizeDecimal(cleanAmount(amount))).toLocaleString("fr-FR")} EC
              </Text>
              {selectedMethod && (
                <Text style={[s.amountReminderMethod, { color: t.textSecondary }]}>
                  · {selectedMethod}
                </Text>
              )}
            </View>
          )}
          <Animated.View style={{ transform: [{ translateX: pinShake }] }}>
            <PinDots value={pinValue} t={t} />
          </Animated.View>
          {pinError.length > 0 && (
            <View style={s.pinErrorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={C.error} />
              <Text style={s.pinErrorText}>{pinError}</Text>
            </View>
          )}
          <Keypad onPress={handlePinKey} onDelete={handlePinDelete} t={t} />
          <TouchableOpacity
            style={[s.confirmBtn, { opacity: pinValue.length === 6 ? 1 : 0.5 }]}
            onPress={handleConfirmPin}
            disabled={loadingVerify || pinValue.length < 6}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[C.deep, C.primary]}
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

  inputBox: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, height: 50, gap: 10, marginBottom: 12,
  },
  currency:    { fontFamily: "NexaLight", fontSize: 15 },
  prefixBadge: { fontFamily: "NexaLight", fontSize: 13, paddingRight: 4, borderRightWidth: 1 },
  input:       { flex: 1, fontSize: 15, fontFamily: "NexaLight" },

  shortcuts: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 18 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontFamily: "NexaLight", fontSize: 12 },

  methodsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 4 },
  methodWrap:  { width: "48%", marginBottom: 12 },

  recap: { borderRadius: 14, padding: 14, marginBottom: 16, marginTop: 4, borderWidth: 1 },
  recapRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1 },
  recapLabel: { fontFamily: "NexaLight", fontSize: 12 },
  recapVal:   { fontFamily: "NexaLight", fontSize: 12 },

  cta: { marginTop: 4 },
  secureRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 12 },
  secureText: { fontFamily: "NexaLight", fontSize: 11 },

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

/* ─── METHOD CARD STYLES ─────────────────────────────────────────────── */
const ms = StyleSheet.create({
  card: {
    borderRadius: 18, paddingVertical: 18,
    alignItems: "center", overflow: "hidden",
    borderWidth: 2, borderColor: "transparent",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6,
  },
  deco: {
    position: "absolute", width: 80, height: 80,
    borderRadius: 40, backgroundColor: "rgba(255,255,255,0.07)",
    top: -20, right: -20,
  },
  checkBadge: {
    position: "absolute", top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.gold, alignItems: "center", justifyContent: "center",
  },
  logo: { width: 48, height: 48, marginBottom: 8 },
  name: { color: "#FFFFFF", fontFamily: "NexaLight", fontSize: 11, textAlign: "center" },
});

/* ─── VISA CARD STYLES ───────────────────────────────────────────────── */
const vc = StyleSheet.create({
  outer: {
    width: "100%", borderRadius: 20, overflow: "hidden",
    marginBottom: 16, borderWidth: 2.5, borderColor: "transparent",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20, shadowRadius: 10,
  },
  selected: { borderColor: C.gold },
  checkBadge: {
    position: "absolute", top: 10, right: 10, zIndex: 10,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.gold, alignItems: "center", justifyContent: "center",
  },
  card: { padding: 20, height: 168, justifyContent: "space-between" },
  deco1: {
    position: "absolute", width: 150, height: 150, borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.05)", top: -50, right: -40,
  },
  deco2: {
    position: "absolute", width: 100, height: 100, borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.04)", bottom: -30, left: -20,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bankName: { color: C.white, fontFamily: "NexaLight", fontSize: 16, letterSpacing: 3, fontWeight: "700" },
  chip: {
    width: 34, height: 26, borderRadius: 5,
    backgroundColor: "#D4A017",
    justifyContent: "center", alignItems: "center",
    overflow: "hidden",
  },
  chipH: { position: "absolute", width: "100%", height: 1, backgroundColor: "rgba(0,0,0,0.2)" },
  chipV: { position: "absolute", width: 1, height: "100%", backgroundColor: "rgba(0,0,0,0.2)" },
  cardNum: {
    color: "rgba(255,255,255,0.90)", fontFamily: "NexaLight",
    fontSize: 18, letterSpacing: 4, textAlign: "center",
  },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  cardLabel: {
    color: "rgba(255,255,255,0.50)", fontFamily: "NexaLight",
    fontSize: 8, letterSpacing: 1, marginBottom: 2,
  },
  cardValue: { color: C.white, fontFamily: "NexaLight", fontSize: 12, letterSpacing: 1 },
  visaText:  { color: C.white, fontSize: 22, fontStyle: "italic", fontWeight: "700", letterSpacing: 1 },
});

/* ─── SECTION LABEL STYLES ───────────────────────────────────────────── */
const sl = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, marginTop: 4 },
  text: { fontFamily: "NexaLight", fontSize: 11, color: C.primary, textTransform: "uppercase", letterSpacing: 0.8 },
});

/* ─── PIN DOTS STYLES ────────────────────────────────────────────────── */
const pd = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, marginBottom: 10 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
});

/* ─── KEYPAD STYLES ──────────────────────────────────────────────────── */
const kp = StyleSheet.create({
  grid:    { flexDirection: "row", flexWrap: "wrap", width: 280, gap: 12, justifyContent: "center", marginTop: 10 },
  key:     { width: 78, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  empty:   { width: 78, height: 56 },
  keyText: { fontSize: 20, fontFamily: "NexaLight", fontWeight: "600" },
});

/* ─── PENDING VIEW STYLES ────────────────────────────────────────────── */
const pv = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  loaderWrap: { alignItems: "center", justifyContent: "center", marginBottom: 32, width: 120, height: 120 },
  ring: {
    position: "absolute", width: 120, height: 120, borderRadius: 60, borderWidth: 2,
  },
  innerCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center",
  },
  title:  { fontFamily: "NexaLight", fontSize: 20, textAlign: "center", marginBottom: 10, letterSpacing: 0.2 },
  sub:    { fontFamily: "NexaLight", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  refBox: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 8, marginBottom: 20,
  },
  refText:    { fontFamily: "NexaLight", fontSize: 11 },
  hint:       { fontFamily: "NexaLight", fontSize: 11, textAlign: "center", lineHeight: 18, opacity: 0.7, marginBottom: 20, paddingHorizontal: 8 },
  verifyBtn:  { width: "100%", borderRadius: 14, overflow: "hidden", marginBottom: 14 },
  verifyGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  verifyText: { color: C.white, fontFamily: "NexaLight", fontSize: 14 },
  cancelBtn:  { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 20, borderWidth: 1.5 },
  cancelText: { fontFamily: "NexaLight", fontSize: 13 },
  autoCheckBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 7, marginBottom: 20,
  },
  autoCheckText: { fontFamily: "NexaLight", fontSize: 11, opacity: 0.8 },
});

/* ─── SUCCESS VIEW STYLES ────────────────────────────────────────────── */
const xv = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  iconGrad:  { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title:     { fontFamily: "NexaLight", fontSize: 24, textAlign: "center", marginBottom: 10, letterSpacing: 0.3 },
  amount:    { fontFamily: "NexaLight", fontSize: 34, fontWeight: "700", marginBottom: 12 },
  sub:       { fontFamily: "NexaLight", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 36 },
  btn:       { width: "100%", borderRadius: 16, overflow: "hidden" },
  btnGrad:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  btnText:   { color: C.white, fontFamily: "NexaLight", fontSize: 15 },
});

/* ─── FAILED VIEW STYLES ─────────────────────────────────────────────── */
const fv = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  iconGrad:  { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title:     { fontFamily: "NexaLight", fontSize: 24, textAlign: "center", marginBottom: 10, letterSpacing: 0.3 },
  sub:       { fontFamily: "NexaLight", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 36 },
  retryBtn:  { width: "100%", borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  retryGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  retryText: { color: C.white, fontFamily: "NexaLight", fontSize: 15 },
  backBtn:   { paddingVertical: 10 },
  backText:  { fontFamily: "NexaLight", fontSize: 13 },
});
