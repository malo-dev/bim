import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Vibration,
  useColorScheme,
} from "react-native";
import Modal from "react-native-modal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCreateTransfertMutation } from "@/services/tsxService";
import { useVerifyPassMutation } from "@/services/authService";
import { normalizeDecimal } from "@/utils/normalizeDecimal.util";

/* ═══════════════════════════════════════════════════════════════════════
   THEME — même pattern que RechargeEcoinsScreen
═══════════════════════════════════════════════════════════════════════ */
const C = {
  primary: "#0353CC",
  violet:  "#3906C7",
  deep:    "#302E99",
  accent:  "#4D96FF",
  gold:    "#FFD700",
  white:   "#FFFFFF",
  success: "#22C55E",
  error:   "#EF4444",
};

const TH = {
  light: {
    modalBg:    "#FFFFFF",
    text:       "#0D1B3E",
    textSub:    "#7B8DB0",
    border:     "rgba(3,83,204,0.15)",
    inputBg:    "rgba(3,83,204,0.06)",
    inputFocBg: "rgba(3,83,204,0.11)",
    recapBg:    "rgba(3,83,204,0.05)",
    pinBorder:  "rgba(3,83,204,0.22)",
    pinFilled:  C.primary,
    lockBg:     "rgba(3,83,204,0.08)",
    keyBg:      "rgba(3,83,204,0.06)",
    keyDelBg:   "rgba(239,68,68,0.08)",
    keyDelBord: "rgba(239,68,68,0.20)",
    handle:     "rgba(0,0,0,0.10)",
    chipBg:     "rgba(3,83,204,0.06)",
    topBorder:  "transparent",
  },
  dark: {
    modalBg:    "#0F1228",
    text:       "#E2E8F0",
    textSub:    "#556080",
    border:     "rgba(77,150,255,0.14)",
    inputBg:    "rgba(77,150,255,0.07)",
    inputFocBg: "rgba(77,150,255,0.13)",
    recapBg:    "rgba(77,150,255,0.06)",
    pinBorder:  "rgba(77,150,255,0.24)",
    pinFilled:  C.accent,
    lockBg:     "rgba(3,83,204,0.22)",
    keyBg:      "rgba(77,150,255,0.09)",
    keyDelBg:   "rgba(239,68,68,0.14)",
    keyDelBord: "rgba(239,68,68,0.28)",
    handle:     "rgba(255,255,255,0.12)",
    chipBg:     "rgba(77,150,255,0.09)",
    topBorder:  "rgba(77,150,255,0.18)",
  },
};

function useTheme() {
  const isDark = useColorScheme() === "dark";
  return { isDark, t: isDark ? TH.dark : TH.light };
}

/* ═══════════════════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
═══════════════════════════════════════════════════════════════════════ */

/* ── PIN DOTS ── */
function PinDots({ value, t }: { value: string; t: typeof TH.light }) {
  return (
    <View style={pd.row}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={i}
          style={[pd.dot, {
            backgroundColor: i < value.length ? t.pinFilled : "transparent",
            borderColor:     i < value.length ? t.pinFilled : t.pinBorder,
          }]}
        />
      ))}
    </View>
  );
}

/* ── KEYPAD — rendu statique, aucune dépendance qui change ── */
const KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

function Keypad({
  onPress,
  onDelete,
  t,
  disabled,
}: {
  onPress:  (v: string) => void;
  onDelete: () => void;
  t:        typeof TH.light;
  disabled: boolean;
}) {
  return (
    <View style={kp.grid}>
      {KEYS.map((k, i) => {
        if (k === "") return <View key={i} style={kp.empty} />;
        const isDel = k === "⌫";
        return (
          <TouchableOpacity
            key={i}
            activeOpacity={0.6}
            disabled={disabled}
            style={[kp.key, {
              backgroundColor: isDel ? t.keyDelBg : t.keyBg,
              borderColor:     isDel ? t.keyDelBord : t.border,
              opacity: disabled ? 0.35 : 1,
            }]}
            onPress={() => { isDel ? onDelete() : onPress(k); }}
          >
            <Text style={[kp.keyText, { color: isDel ? C.error : t.text }]}>
              {k}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ── SCAN FRAME ── */
function ScanFrame({ pulse }: { pulse: Animated.Value }) {
  const corners = [
    { top:    0, left:  0, borderTopWidth:    3, borderLeftWidth:  3, borderRightWidth:  0, borderBottomWidth: 0 },
    { top:    0, right: 0, borderTopWidth:    3, borderRightWidth: 3, borderLeftWidth:   0, borderBottomWidth: 0 },
    { bottom: 0, left:  0, borderBottomWidth: 3, borderLeftWidth:  3, borderTopWidth:    0, borderRightWidth:  0 },
    { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderTopWidth:    0, borderLeftWidth:   0 },
  ];
  return (
    <Animated.View style={[sf.frame, { transform: [{ scale: pulse }] }]}>
      {corners.map((c, i) => <View key={i} style={[sf.corner, c, { borderColor: C.gold }]} />)}
      <Animated.View style={[sf.laser, {
        opacity: pulse.interpolate({ inputRange: [0.97, 1], outputRange: [0.4, 1] }),
      }]} />
    </Animated.View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════════ */
export default function ScannerPage() {
  const router = useRouter();
  const { isDark, t } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();

  /* ── Caméra ── */
  const [scanned, setScanned] = useState(false);
  const [torch,   setTorch]   = useState(false);
  const [qrData,  setQrData]  = useState<{ userId?: string; accountNumber?: string } | null>(null);

  /* ── Form ── */
  const [amount, setAmount] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  /* ── 4 modals TOTALEMENT INDÉPENDANTS ── */
  const [showAmount,  setShowAmount]  = useState(false);
  const [showPin,     setShowPin]     = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError,   setShowError]   = useState(false);

  /* ── PIN ── */
  const [pin,         setPin]         = useState("");
  const [pinError,    setPinError]    = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [txError,     setTxError]     = useState("");

  /* ── Refs (évite stale closures dans les async callbacks) ── */
  const amountRef = useRef("");
  const userIdRef = useRef<string | null>(null);
  const qrRef     = useRef<typeof qrData>(null);
  const pinRef    = useRef("");

  /* Sync des refs à chaque render */
  amountRef.current = amount;
  userIdRef.current = userId;
  qrRef.current     = qrData;
  pinRef.current    = pin;

  /* ── Animations ── */
  const pinShake    = useRef(new Animated.Value(0)).current;
  const inputFoc    = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  const [createTransfert] = useCreateTransfertMutation();
  const [verifyPass]      = useVerifyPassMutation();

  /* ── Init ── */
  useEffect(() => {
    AsyncStorage.getItem("userId").then((id) => { if (id) setUserId(id); });
    if (!permission?.granted) requestPermission();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.97, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.00, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [permission?.granted, pulseAnim, requestPermission]);

  /* ── Input focus animé ── */
  const onFocusAmt  = () => Animated.timing(inputFoc, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  const onBlurAmt   = () => Animated.timing(inputFoc, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  const animBorder  = inputFoc.interpolate({ inputRange: [0, 1], outputRange: [t.border, C.primary] });
  const animBg      = inputFoc.interpolate({ inputRange: [0, 1], outputRange: [t.inputBg, t.inputFocBg] });

  /* ── QR ── */
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(80);
    try {
      const parsed = JSON.parse(data);
      if (parsed?.userId || parsed?.accountNumber) {
        setQrData(parsed);
        setShowAmount(true);        // ← ouvre MODAL 1 uniquement
      } else {
        Alert.alert("QR invalide", "Ce QR code n'est pas un code BIM valide.", [
          { text: "Réessayer", onPress: () => setScanned(false) },
        ]);
      }
    } catch {
      Alert.alert("QR invalide", "Impossible de lire ce QR code.", [
        { text: "Réessayer", onPress: () => setScanned(false) },
      ]);
    }
  };

  /* ── Shake PIN ── */
  const shakePin = () =>
    Animated.sequence([
      Animated.timing(pinShake, { toValue:  10, duration: 55, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue:  8,  duration: 55, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: -8,  duration: 55, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue:  0,  duration: 55, useNativeDriver: true }),
    ]).start();

  /* ── Montant → PIN ── */
  const handleContinue = () => {
    const amt = Number(normalizeDecimal(amountRef.current));
    if (!amt || amt <= 0) {
      Alert.alert("Montant invalide", "Entrez un montant supérieur à 0.");
      return;
    }
    if (!userIdRef.current || !qrRef.current?.userId) {
      Alert.alert("Erreur", "Données manquantes. Scannez à nouveau.");
      return;
    }
    Keyboard.dismiss();
    setPin("");
    setPinError("");
    /* Ferme MODAL 1, attend fin animation, ouvre MODAL 2 */
    setShowAmount(false);
    setTimeout(() => setShowPin(true), 380);
  };

  /* ── PIN → Montant ── */
  const handlePinBack = () => {
    if (isVerifying) return;
    setShowPin(false);
    setTimeout(() => setShowAmount(true), 380);
  };

  /* ── PIN keypad handlers ── */
  const handlePinKey = (k: string) => {
    if (isVerifying || pin.length >= 6) return;
    setPinError("");
    setPin(p => p + k);
  };
  const handlePinDel = () => {
    if (isVerifying) return;
    setPin(p => p.slice(0, -1));
  };

  /* ── Confirmer PIN ── */
  const handleConfirmPin = async () => {
    const currentPin    = pinRef.current;
    const currentUserId = userIdRef.current;
    const currentQr     = qrRef.current;
    const currentAmount = amountRef.current.replace(/\s/g, "");

    if (currentPin.length < 6) {
      setPinError("Veuillez entrer vos 6 chiffres.");
      return;
    }
    if (!currentUserId || !currentQr?.userId) {
      setPinError("Données manquantes. Recommencez.");
      return;
    }

    setIsVerifying(true);

    /* ÉTAPE 1 — Vérifier le mot de passe */
    try {
      await verifyPass({ userId: currentUserId, password: currentPin }).unwrap();
    } catch {
      shakePin();
      Vibration.vibrate(180);
      setPinError("Mot de passe incorrect. Réessayez.");
      setPin("");
      setIsVerifying(false);
      return;                       // ← reste sur modal PIN
    }

    /* ÉTAPE 2 — Transférer */
    try {
      await createTransfert({
        amount:   normalizeDecimal(currentAmount),
        targetId: currentQr.userId,
        id:       currentUserId,
      }).unwrap();

      setIsVerifying(false);
      Vibration.vibrate([0, 80, 40, 80]);

      /* Ferme MODAL 2, ouvre MODAL 3 */
      setShowPin(false);
      successAnim.setValue(0);
      setTimeout(() => {
        setShowSuccess(true);
        Animated.spring(successAnim, {
          toValue: 1, tension: 50, friction: 7, useNativeDriver: true,
        }).start();
      }, 420);

    } catch (err: any) {
      setIsVerifying(false);
      setTxError(err?.data?.message || err?.message || "Transfert échoué. Réessayez.");
      /* Ferme MODAL 2, ouvre MODAL 4 */
      setShowPin(false);
      setTimeout(() => setShowError(true), 420);
    }
  };

  /* ── Reset total ── */
  const handleReset = () => {
    setShowAmount(false);
    setShowPin(false);
    setShowSuccess(false);
    setShowError(false);
    setScanned(false);
    setQrData(null);
    setAmount("");
    setPin("");
    setPinError("");
    setTxError("");
    setIsVerifying(false);
    successAnim.setValue(0);
  };

  /* ── Permission guards ── */
  if (!permission) return (
    <View style={[g.center, { backgroundColor: isDark ? TH.dark.modalBg : "#000" }]}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );

  if (!permission.granted) return (
    <View style={g.permScreen}>
      <LinearGradient colors={[C.deep, C.primary]} style={StyleSheet.absoluteFill} />
      <Ionicons name="camera-outline" size={64} color="rgba(255,255,255,0.5)" />
      <Text style={g.permTitle}>Accès caméra requis</Text>
      <Text style={g.permSub}>Pour scanner les QR codes BIM, autorisez l'accès à la caméra.</Text>
      <TouchableOpacity style={g.permBtn} onPress={requestPermission}>
        <Text style={g.permBtnText}>Continuer</Text>
      </TouchableOpacity>
      <TouchableOpacity style={g.permBack} onPress={() => router.back()}>
        <Text style={g.permBackText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );

  /* ════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════ */
  return (
    <View style={g.root}>
      <StatusBar barStyle="light-content" />

      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* ── UI caméra ── */}
      <View style={g.overlay}>
        <View style={g.overlayTop}>
          <TouchableOpacity style={g.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.white} />
          </TouchableOpacity>
          <Text style={g.overlayTitle}>Scanner QR BIM</Text>
          <TouchableOpacity
            style={[g.iconBtn, torch && { backgroundColor: C.gold }]}
            onPress={() => setTorch(v => !v)}
          >
            <Ionicons name={torch ? "flash" : "flash-outline"} size={22} color={torch ? C.deep : C.white} />
          </TouchableOpacity>
        </View>

        <View style={g.scanZone}>
          <ScanFrame pulse={pulseAnim} />
        </View>

        <View style={g.overlayBottom}>
          <View style={g.hintBox}>
            <Ionicons name="qr-code-outline" size={16} color={C.gold} />
            <Text style={g.hintText}>Placez le QR code dans le cadre</Text>
          </View>
          {scanned && !showAmount && !showPin && !showSuccess && !showError && (
            <TouchableOpacity style={g.retryBtn} onPress={handleReset}>
              <Text style={g.retryText}>Réessayer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ════════════════════════════════════════════
          MODAL 1 — MONTANT
      ════════════════════════════════════════════ */}
      <Modal
        isVisible={showAmount}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        animationInTiming={340}
        animationOutTiming={280}
        backdropOpacity={0.55}
        style={g.modal}
        avoidKeyboard
        onBackdropPress={undefined}
        useNativeDriver
        useNativeDriverForBackdrop
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={[g.sheet, {
            backgroundColor: t.modalBg,
            borderTopColor:  t.topBorder,
            borderTopWidth:  isDark ? 1 : 0,
          }]}>
            <View style={[g.handle, { backgroundColor: t.handle }]} />

            {/* Destinataire */}
            <View style={[g.recipientRow, { backgroundColor: t.recapBg, borderColor: t.border }]}>
              <LinearGradient colors={[C.deep, C.primary]} style={g.recipientAvatar}>
                <Ionicons name="person" size={20} color={C.white} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[g.recipientLabel, { color: t.textSub }]}>Destinataire</Text>
                <Text style={[g.recipientId, { color: t.text }]} numberOfLines={1}>
                  {qrData?.accountNumber || qrData?.userId || "Compte BIM"}
                </Text>
              </View>
              <View style={g.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={13} color={C.success} />
                <Text style={g.verifiedText}>Vérifié</Text>
              </View>
            </View>

            {/* Montant */}
            <Text style={[g.sectionLabel, { color: C.primary }]}>MONTANT (EC)</Text>
            <Animated.View style={[g.inputBox, { borderColor: animBorder, backgroundColor: animBg }]}>
              <Text style={[g.currency, { color: C.primary }]}>EC</Text>
              <TextInput
                placeholder="0"
                placeholderTextColor={t.textSub}
                keyboardType="numeric"
                style={[g.input, { color: t.text }]}
                value={amount}
                onChangeText={setAmount}
                onFocus={onFocusAmt}
                onBlur={onBlurAmt}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              {amount.length > 0 && (
                <TouchableOpacity onPress={() => setAmount("")}>
                  <Ionicons name="close-circle" size={18} color={t.textSub} />
                </TouchableOpacity>
              )}
            </Animated.View>

            {/* Raccourcis */}
            <View style={g.shortcuts}>
              {["500","1 000","2 500","5 000"].map((label, i) => {
                const val = ["500","1000","2500","5000"][i];
                const active = amount === val;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[g.chip, {
                      backgroundColor: active ? C.primary : t.chipBg,
                      borderColor:     active ? C.primary : t.border,
                    }]}
                    onPress={() => setAmount(val)}
                  >
                    <Text style={[g.chipText, { color: active ? C.white : t.textSub }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* CTA */}
            <TouchableOpacity style={g.payBtn} onPress={handleContinue} activeOpacity={0.85}>
              <LinearGradient
                colors={[C.deep, C.primary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={g.payGrad}
              >
                <Ionicons name="lock-closed-outline" size={18} color={C.white} />
                <Text style={g.payText}>Continuer vers la confirmation</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={g.cancelRow} onPress={handleReset}>
              <Text style={[g.cancelText, { color: t.textSub }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════════════════════════════════════════════
          MODAL 2 — PIN
      ════════════════════════════════════════════ */}
      <Modal
        isVisible={showPin}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        animationInTiming={340}
        animationOutTiming={280}
        backdropOpacity={0.65}
        style={g.modal}
        onBackdropPress={isVerifying ? undefined : handlePinBack}
        useNativeDriver
        useNativeDriverForBackdrop
      >
        <View style={[g.pinSheet, {
          backgroundColor: t.modalBg,
          borderTopColor:  t.topBorder,
          borderTopWidth:  isDark ? 1 : 0,
        }]}>
          <View style={[g.handle, { backgroundColor: t.handle }]} />

          {isVerifying ? (
            /* Loading spinner pendant vérif + transfert */
            <View style={g.processingBox}>
              <View style={[g.lockWrap, { backgroundColor: t.lockBg }]}>
                <ActivityIndicator size="large" color={C.primary} />
              </View>
              <Text style={[g.passTitle, { color: t.text }]}>Traitement en cours…</Text>
              <Text style={[g.passSub, { color: t.textSub }]}>
                Vérification et transfert en cours,{"\n"}ne quittez pas l'application.
              </Text>
            </View>
          ) : (
            <>
              {/* Icône cadenas */}
              <View style={[g.lockWrap, { backgroundColor: t.lockBg }]}>
                <Ionicons name="lock-closed" size={28} color={C.primary} />
              </View>

              <Text style={[g.passTitle, { color: t.text }]}>Mot de passe requis</Text>
              <Text style={[g.passSub, { color: t.textSub }]}>
                Entrez votre code à 6 chiffres{"\n"}pour confirmer le transfert
              </Text>

              {/* Récap */}
              {amount.length > 0 && (
                <View style={[g.amtReminder, { backgroundColor: t.recapBg, borderColor: t.border }]}>
                  <Ionicons name="cash-outline" size={14} color={C.primary} />
                  <Text style={[g.amtReminderAmt, { color: t.text }]}>{amount} EC</Text>
                  <Ionicons name="arrow-forward" size={12} color={t.textSub} />
                  <Text style={[g.amtReminderDest, { color: t.textSub }]} numberOfLines={1}>
                    {qrData?.accountNumber || qrData?.userId || "BIM"}
                  </Text>
                </View>
              )}

              {/* PIN dots */}
              <Animated.View style={{ transform: [{ translateX: pinShake }] }}>
                <PinDots value={pin} t={t} />
              </Animated.View>

              {pinError.length > 0 && (
                <View style={g.pinErrRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={C.error} />
                  <Text style={g.pinErrText}>{pinError}</Text>
                </View>
              )}

              {/* Keypad */}
              <Keypad
                onPress={handlePinKey}
                onDelete={handlePinDel}
                t={t}
                disabled={isVerifying}
              />

              {/* Valider */}
              <TouchableOpacity
                style={[g.confirmBtn, { opacity: pin.length === 6 ? 1 : 0.38 }]}
                onPress={handleConfirmPin}
                disabled={pin.length < 6 || isVerifying}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[C.deep, C.primary]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={g.confirmGrad}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color={C.white} />
                  <Text style={g.confirmText}>Valider et transférer</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={g.cancelRow} onPress={handlePinBack}>
                <Text style={[g.cancelText, { color: t.textSub }]}>← Retour au montant</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>

      {/* ════════════════════════════════════════════
          MODAL 3 — SUCCÈS
      ════════════════════════════════════════════ */}
      <Modal
        isVisible={showSuccess}
        animationIn="fadeInUp"
        animationOut="fadeOutDown"
        animationInTiming={400}
        animationOutTiming={280}
        backdropOpacity={0.65}
        style={g.modal}
        onBackdropPress={handleReset}
        useNativeDriver
        useNativeDriverForBackdrop
      >
        <View style={[g.sheet, { backgroundColor: t.modalBg }]}>
          <View style={[g.handle, { backgroundColor: t.handle }]} />

          <Animated.View style={[g.centerBox, {
            opacity:   successAnim,
            transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.80, 1] }) }],
          }]}>
            <View style={[g.bigIcon, { backgroundColor: C.success + "18" }]}>
              <Ionicons name="checkmark-circle" size={72} color={C.success} />
            </View>
            <Text style={[g.bigTitle, { color: t.text }]}>Transfert réussi !</Text>
            <Text style={[g.bigSub, { color: t.textSub }]}>
              {amount} EC envoyés avec succès
              {qrData?.accountNumber ? `\nà ${qrData.accountNumber}` : ""}
            </Text>

            <View style={[g.recap, { backgroundColor: t.recapBg, borderColor: t.border }]}>
              <View style={[g.recapRow, { borderBottomColor: t.border }]}>
                <Text style={[g.recapLabel, { color: t.textSub }]}>Montant</Text>
                <Text style={[g.recapVal, { color: C.primary }]}>{amount} EC</Text>
              </View>
              {qrData?.accountNumber && (
                <View style={[g.recapRow, { borderBottomWidth: 0 }]}>
                  <Text style={[g.recapLabel, { color: t.textSub }]}>Destinataire</Text>
                  <Text style={[g.recapVal, { color: t.text }]} numberOfLines={1}>{qrData.accountNumber}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={g.doneBtn} onPress={handleReset} activeOpacity={0.85}>
              <LinearGradient colors={[C.deep, C.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={g.doneGrad}>
                <Text style={g.doneTxt}>Terminer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* ════════════════════════════════════════════
          MODAL 4 — ERREUR
      ════════════════════════════════════════════ */}
      <Modal
        isVisible={showError}
        animationIn="fadeInUp"
        animationOut="fadeOutDown"
        animationInTiming={350}
        animationOutTiming={280}
        backdropOpacity={0.65}
        style={g.modal}
        onBackdropPress={handleReset}
        useNativeDriver
        useNativeDriverForBackdrop
      >
        <View style={[g.sheet, { backgroundColor: t.modalBg }]}>
          <View style={[g.handle, { backgroundColor: t.handle }]} />

          <View style={g.centerBox}>
            <View style={[g.bigIcon, { backgroundColor: C.error + "18" }]}>
              <Ionicons name="close-circle" size={72} color={C.error} />
            </View>
            <Text style={[g.bigTitle, { color: t.text }]}>Transfert échoué</Text>
            <Text style={[g.bigSub, { color: t.textSub }]}>{txError}</Text>

            <TouchableOpacity style={g.doneBtn} onPress={handleReset} activeOpacity={0.85}>
              <LinearGradient colors={["#991B1B", C.error]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={g.doneGrad}>
                <Text style={g.doneTxt}>Réessayer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════════════ */
const sf = StyleSheet.create({
  frame:  { width: 240, height: 240, position: "relative" },
  corner: { position: "absolute", width: 28, height: 28 },
  laser:  { position: "absolute", left: 10, right: 10, top: "50%", height: 2, backgroundColor: C.gold, borderRadius: 1 },
});

const g = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* Permission */
  permScreen:   { flex: 1, justifyContent: "center", alignItems: "center", padding: 30, gap: 16 },
  permTitle:    { color: C.white, fontSize: 22, fontFamily: "NexaLight", textAlign: "center" },
  permSub:      { color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "NexaLight", textAlign: "center", lineHeight: 20 },
  permBtn:      { backgroundColor: C.gold, borderRadius: 20, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
  permBtnText:  { color: C.deep, fontFamily: "NexaLight", fontSize: 15 },
  permBack:     { marginTop: 4 },
  permBackText: { color: "rgba(255,255,255,0.5)", fontFamily: "NexaLight", fontSize: 13 },

  /* Camera UI */
  overlay:       { flex: 1 },
  overlayTop: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  iconBtn:       { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  overlayTitle:  { color: C.white, fontSize: 16, fontFamily: "NexaLight", letterSpacing: 0.3 },
  scanZone:      { flex: 1, alignItems: "center", justifyContent: "center" },
  overlayBottom: { backgroundColor: "rgba(0,0,0,0.55)", paddingVertical: 30, paddingHorizontal: 30, alignItems: "center", gap: 14 },
  hintBox:       { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  hintText:      { color: C.white, fontFamily: "NexaLight", fontSize: 13 },
  retryBtn:      { backgroundColor: C.gold, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:     { color: C.deep, fontFamily: "NexaLight", fontSize: 13 },

  /* Modal base */
  modal:     { justifyContent: "flex-end", margin: 0 },
  handle:    { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },

  /* Sheet MONTANT / SUCCÈS / ERREUR */
  sheet: {
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
  },

  /* Sheet PIN — centré */
  pinSheet: {
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingTop: 24,
    paddingBottom: Platform.OS === "ios" ? 44 : 36,
    alignItems: "center",
  },

  /* Destinataire */
  recipientRow:   { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18, borderRadius: 16, padding: 14, borderWidth: 1 },
  recipientAvatar:{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  recipientLabel: { fontFamily: "NexaLight", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  recipientId:    { fontFamily: "NexaLight", fontSize: 14 },
  verifiedBadge:  { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.success + "18", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  verifiedText:   { fontFamily: "NexaLight", fontSize: 10, color: C.success },

  /* Input montant */
  sectionLabel: { fontFamily: "NexaLight", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  inputBox:     { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, height: 56, gap: 10, marginBottom: 14 },
  currency:     { fontFamily: "NexaLight", fontSize: 18 },
  input:        { flex: 1, fontSize: 22, fontFamily: "NexaLight" },
  shortcuts:    { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 20 },
  chip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  chipText:     { fontFamily: "NexaLight", fontSize: 12 },
  payBtn:       { borderRadius: 16, overflow: "hidden", marginBottom: 10 },
  payGrad:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  payText:      { color: C.white, fontFamily: "NexaLight", fontSize: 15 },
  cancelRow:    { alignItems: "center", paddingVertical: 10 },
  cancelText:   { fontFamily: "NexaLight", fontSize: 13 },

  /* PIN sheet */
  processingBox: { alignItems: "center", paddingVertical: 32, gap: 14, width: "100%" },
  lockWrap:      { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  passTitle:     { fontFamily: "NexaLight", fontSize: 18, marginBottom: 4, letterSpacing: 0.2 },
  passSub:       { fontFamily: "NexaLight", fontSize: 12, textAlign: "center", lineHeight: 18, marginBottom: 16, paddingHorizontal: 10 },
  amtReminder:   { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 18, width: "100%" },
  amtReminderAmt:  { fontFamily: "NexaLight", fontSize: 16 },
  amtReminderDest: { fontFamily: "NexaLight", fontSize: 12, flex: 1 },
  pinErrRow:  { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, marginBottom: 2 },
  pinErrText: { fontFamily: "NexaLight", fontSize: 12, color: C.error },
  confirmBtn: { width: "100%", borderRadius: 16, overflow: "hidden", marginTop: 16 },
  confirmGrad:{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  confirmText:{ color: C.white, fontFamily: "NexaLight", fontSize: 15 },

  /* Succès / Erreur */
  centerBox:  { alignItems: "center", paddingVertical: 8 },
  bigIcon:    { width: 104, height: 104, borderRadius: 52, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  bigTitle:   { fontFamily: "NexaLight", fontSize: 22, marginBottom: 8 },
  bigSub:     { fontFamily: "NexaLight", fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  recap:      { borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, width: "100%" },
  recapRow:   { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1 },
  recapLabel: { fontFamily: "NexaLight", fontSize: 12 },
  recapVal:   { fontFamily: "NexaLight", fontSize: 12 },
  doneBtn:    { width: "100%", borderRadius: 16, overflow: "hidden" },
  doneGrad:   { paddingVertical: 16, alignItems: "center" },
  doneTxt:    { color: C.white, fontFamily: "NexaLight", fontSize: 15 },
});

const pd = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, marginBottom: 8 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
});

const kp = StyleSheet.create({
  grid:    { flexDirection: "row", flexWrap: "wrap", width: 288, gap: 10, justifyContent: "center", marginVertical: 10 },
  key:     { width: 82, height: 58, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  empty:   { width: 82, height: 58 },
  keyText: { fontSize: 22, fontFamily: "NexaLight" },
});