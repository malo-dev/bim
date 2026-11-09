/**
 * Scanner un QR BIMNEXT (maquette) — caméra, cadre qui respire, ligne de scan,
 * lampe torche. Un QR membre ouvre le paiement (transfert d'EC).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useIsFocused, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, Vibration, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BimIcon } from "@/components/bim/icons";
import { F, ec, useTh } from "@/components/bim/theme";
import { AmountChips, Breath, Ink, PillButton, PressScale, RoundButton, ScanLine, SlideButton, StatusOverlay, T } from "@/components/bim/ui";
import { useCreateTransfertMutation } from "@/services/tsxService";
import { useGetUserByIdQuery } from "@/services/userService";
import { normalizeDecimal } from "@/utils/normalizeDecimal.util";

const FRAME = 280;

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const s: any = { position: "absolute", width: 44, height: 44, borderColor: "#FFFFFF" };
  if (pos[0] === "t") { s.top = 0; s.borderTopWidth = 4; } else { s.bottom = 0; s.borderBottomWidth = 4; }
  if (pos[1] === "l") { s.left = 0; s.borderLeftWidth = 4; } else { s.right = 0; s.borderRightWidth = 4; }
  s[{ tl: "borderTopLeftRadius", tr: "borderTopRightRadius", bl: "borderBottomLeftRadius", br: "borderBottomRightRadius" }[pos]] = 22;
  return <View style={s} />;
}

export default function ScanScreen() {
  const th = useTh();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [target, setTarget] = useState<{ userId: string; accountNumber?: string } | null>(null);
  const [amount, setAmount] = useState("10");
  const [phase, setPhase] = useState<"idle" | "proc" | "done">("idle");
  const [userId, setUserId] = useState<string | null>(null);
  const [createTransfert] = useCreateTransfertMutation();
  const sheet = useRef(new Animated.Value(0)).current;

  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);
  useEffect(() => { if (permission && !permission.granted && permission.canAskAgain) requestPermission(); }, [permission?.granted]);
  useEffect(() => { if (!focused) setTorch(false); }, [focused]);

  const { data: dest } = useGetUserByIdQuery(target?.userId as any, { skip: !target?.userId });
  const destName = dest?.username && !String(dest.username).startsWith("quick_") ? dest.username
    : target?.accountNumber ? `Membre ${target.accountNumber}` : "Membre BIMNEXT";

  const reset = () => {
    Animated.timing(sheet, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setTarget(null); setScanned(false); setAmount("10"); setPhase("idle");
    });
  };

  const onScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(60);
    try {
      const parsed = JSON.parse(data);
      if (parsed?.userId && String(parsed.userId) !== String(userId)) {
        setTarget({ userId: String(parsed.userId), accountNumber: parsed.accountNumber });
        sheet.setValue(0);
        Animated.spring(sheet, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }).start();
        return;
      }
    } catch {}
    setTimeout(() => setScanned(false), 1500);
  };

  const pay = async () => {
    const amt = Number(normalizeDecimal(amount));
    if (!amt || amt <= 0 || !target || !userId) { Alert.alert("Montant", "Entre un montant supérieur à 0."); return; }
    setPhase("proc");
    try {
      await createTransfert({ amount: normalizeDecimal(amount), targetId: target.userId, id: userId }).unwrap();
      Vibration.vibrate([0, 80, 40, 80]);
      setPhase("done");
    } catch (err: any) {
      setPhase("idle");
      Alert.alert("Paiement impossible", err?.data?.message || "Le paiement a échoué. Réessaie.");
    }
  };

  const camOk = !!permission?.granted && focused;
  const amt = ec(normalizeDecimal(amount || "0"));

  return (
    <View style={{ flex: 1, backgroundColor: "#1A1C20" }}>
      {camOk && (
        <CameraView style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} facing="back" enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={scanned ? undefined : onScan} />
      )}
      <LinearGradient pointerEvents="none"
        colors={camOk ? ["rgba(26,28,32,0.6)", "rgba(42,46,52,0.3)", "rgba(26,28,32,0.8)"] : ["#4A5058", "#2A2E34", "#1A1C20"]}
        locations={[0, 0.55, 1]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />

      <View style={{ position: "absolute", top: 28 + insets.top, left: 20, right: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <PressScale onPress={() => router.navigate("/(tabs)" as any)} accessibilityLabel="Retour à l'accueil"
          style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
          <BimIcon name="back" size={20} color="#FFFFFF" />
        </PressScale>
        <T w="bold" size={17} color="#FFFFFF">Scanner un QR BIMNEXT</T>
        <PressScale onPress={() => setTorch((t) => !t)} accessibilityLabel={torch ? "Éteindre la lampe torche" : "Allumer la lampe torche"}
          style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: torch ? th.accent : "rgba(255,255,255,0.16)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
          <BimIcon name="flash" size={20} color={torch ? th.onAccent : "#FFFFFF"} />
        </PressScale>
      </View>

      <View style={{ position: "absolute", top: 200 + insets.top * 0.5, alignSelf: "center" }}>
        <Breath style={{ width: FRAME, height: FRAME }}>
          <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
          <ScanLine travel={FRAME - 24} />
        </Breath>
      </View>

      <View style={{ position: "absolute", top: 512 + insets.top * 0.5, left: 0, right: 0, alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}>
          <BimIcon name="qr" size={18} color="#FFFFFF" />
          <T size={14} color="#FFFFFF">Place le QR code dans le cadre</T>
        </View>
        <T size={14} color="#C9CED5" style={{ marginTop: 16, marginHorizontal: 40, textAlign: "center", lineHeight: 21 }}>
          {permission && !permission.granted
            ? "Autorise l'accès à la caméra pour scanner les QR codes BIMNEXT."
            : "Scanne le QR d'un client ou d'un partenaire (Citadelle, TRILEX…) pour payer ou encaisser."}
        </T>
        {permission && !permission.granted && (
          <PillButton label="Autoriser la caméra" variant="accent" onPress={requestPermission} style={{ marginTop: 14, paddingHorizontal: 24 }} />
        )}
      </View>

      <View style={{ position: "absolute", left: 24, right: 24, bottom: 44 + insets.bottom }}>
        <PressScale onPress={() => router.push("/qrcode" as any)} accessibilityLabel="Afficher mon QR Code"
          style={{ height: 60, borderRadius: 30, backgroundColor: th.accent, flexDirection: "row", alignItems: "center", gap: 14, paddingLeft: 7, paddingRight: 22 }}>
          <Ink size={46} icon="qr" iconSize={18} />
          <T w="bold" size={15} color={th.onAccent} style={{ flex: 1 }}>Afficher mon QR Code</T>
          <T size={14} color={th.onAccent} style={{ opacity: 0.6, letterSpacing: 2 }}>›››</T>
        </PressScale>
      </View>

      <Modal visible={!!target} transparent animationType="none" onRequestClose={reset}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={phase === "idle" ? reset : undefined} accessibilityLabel="Fermer" />
        <KeyboardAvoidingView behavior="padding">
          <Animated.View style={{ transform: [{ translateY: sheet.interpolate({ inputRange: [0, 1], outputRange: [520, 0] }) }] }}>
            <View
              style={{ backgroundColor: th.base, backgroundImage: th.bgCss, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 28 + insets.bottom }}>
              <View style={{ alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: th.glass(0.3) }} />
              <View style={{ marginTop: 18, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Ink size={50} icon="user" iconSize={22} />
                <View style={{ flex: 1 }}>
                  <T size={13} color={th.muted}>Payer</T>
                  <T w="bold" size={18} numberOfLines={1}>{destName}</T>
                </View>
              </View>
              <T size={13} color={th.muted} style={{ marginTop: 20, letterSpacing: 1 }}>MONTANT</T>
              <View style={{ marginTop: 6, flexDirection: "row", alignItems: "baseline", gap: 10 }}>
                <T w="light" size={20}>EC</T>
                <TextInput value={amount} onChangeText={(v) => setAmount(v.replace(/[^\d.,]/g, ""))} keyboardType="decimal-pad" accessibilityLabel="Montant à payer"
                  style={{ flex: 1, fontFamily: F.bold, fontSize: 44, color: th.fg, paddingVertical: 0 }} />
              </View>
              <View style={{ marginTop: 10 }}><AmountChips values={[5, 10, 20, 50]} value={Number(amount)} onPick={(n) => setAmount(String(n))} /></View>
              <SlideButton variant="accent" label={`Payer ${amt} EC`} onDone={pay} style={{ marginTop: 22 }} />
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
        {phase !== "idle" && (
          <StatusOverlay phase={phase} title={phase === "done" ? "Paiement réussi !" : "Paiement en cours…"}
            text={phase === "done" ? `${amt} EC envoyés à ${destName}. Sans frais.` : "On sécurise ton paiement."}>
            <PillButton variant="accent" label="Retour à l'accueil" onPress={() => { reset(); router.navigate("/(tabs)" as any); }} />
            <PillButton label="Scanner un autre QR" onPress={reset} />
          </StatusOverlay>
        )}
      </Modal>
    </View>
  );
}
