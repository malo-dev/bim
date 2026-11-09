/**
 * Pop-ups BIM NEXT : remplacent les boîtes système (Alert.alert) dans TOUTE l'app,
 * identiques sur Android et iPhone (même verre, mêmes couleurs, mêmes animations).
 *
 *  - <BimAlertHost /> est monté une fois dans app/_layout.tsx ; il redirige Alert.alert.
 *  - bimAlert(titre, message?, boutons?, { kind }) s'utilise comme Alert.alert.
 *  - kind : "success" | "error" | "warning" | "info" — deviné depuis le texte si absent.
 *  - <BimDialog> : la même fenêtre, contrôlée, pour y mettre un champ (ex. mot de passe).
 */
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { Alert, AlertButton, Animated, BackHandler, Easing, KeyboardAvoidingView, Modal, Pressable, View } from "react-native";
import { BimIcon, BimIconName } from "./icons";
import { useTh } from "./theme";
import { PressScale, T } from "./ui";

export type AlertKind = "success" | "error" | "warning" | "info";
type Req = { id: number; title: string; message?: string; buttons: AlertButton[]; kind: AlertKind; cancelable: boolean };

const ERR = /(erreur|error|échou|echou|impossible|incorrect|invalide|refus|annulé|pas abouti|problème|probleme|introuvable|expiré|manquant|indisponible)/i;
const OK = /(réussi|reussi|succès|succes|envoyé|envoyée|enregistr|confirmé|confirmée|ajouté|créé|créée|mis à jour|terminé|bravo|merci|copié)/i;

export function guessKind(title = "", message = "", buttons: AlertButton[] = []): AlertKind {
  const t = `${title} ${message}`;
  if (ERR.test(t)) return "error";
  if (buttons.some((b) => b.style === "destructive")) return "warning";
  if (OK.test(t)) return "success";
  return "info";
}

let seq = 0;
let push: ((r: Req) => void) | null = null;
const pending: Req[] = [];

export function bimAlert(title: string, message?: string, buttons?: AlertButton[], opts?: { kind?: AlertKind; cancelable?: boolean }) {
  const btns = buttons && buttons.length ? buttons : [{ text: "OK" }];
  const r: Req = { id: ++seq, title: String(title ?? ""), message: message != null ? String(message) : undefined, buttons: btns,
    kind: opts?.kind ?? guessKind(title, message, btns), cancelable: opts?.cancelable ?? btns.some((b) => b.style === "cancel") };
  if (push) push(r); else pending.push(r);
}

const ICON: Record<AlertKind, BimIconName> = { success: "check", error: "close", warning: "warning", info: "info" };

function useKindColor() {
  const th = useTh();
  return (k: AlertKind) => k === "success" ? "#22C55E" : k === "error" ? "#E01E2B" : k === "warning" ? "#F59E0B" : th.accent === "#FFFFFF" ? "#38B6FF" : th.accent;
}

/** Fenêtre BIM : voile sombre + carte en verre qui « pop », icône animée, boutons. */
export function BimDialog({ visible, kind = "info", title, message, children, actions, onRequestClose }: {
  visible: boolean; kind?: AlertKind; title: string; message?: string; children?: React.ReactNode;
  actions: { label: string; onPress: () => void; variant?: "accent" | "glass" | "danger"; disabled?: boolean }[];
  onRequestClose?: () => void;
}) {
  const th = useTh();
  const color = useKindColor()(kind);
  const v = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShown(true);
      v.setValue(0); ring.setValue(0);
      Animated.parallel([
        Animated.spring(v, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }),
        Animated.timing(ring, { toValue: 1, duration: 900, delay: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
      const h = kind === "success" ? Haptics.NotificationFeedbackType.Success : kind === "error" ? Haptics.NotificationFeedbackType.Error : kind === "warning" ? Haptics.NotificationFeedbackType.Warning : null;
      if (h) Haptics.notificationAsync(h).catch(() => {});
    } else if (shown) {
      Animated.timing(v, { toValue: 0, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => setShown(false));
    }
  }, [visible]);

  if (!shown) return null;
  const btnStyle = (variant?: string) => ({
    height: 50, borderRadius: 25, alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: 16,
    backgroundColor: variant === "danger" ? "#E01E2B" : variant === "accent" ? th.accent : th.glass(0.14),
    borderWidth: variant === "glass" || !variant ? 1 : 0, borderColor: th.glass(0.26),
  });
  const btnColor = (variant?: string) => (variant === "danger" ? "#FFFFFF" : variant === "accent" ? th.onAccent : th.fg);

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onRequestClose ?? (() => {})}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <Animated.View style={{ flex: 1, backgroundColor: "rgba(2,8,30,0.62)", opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: "clamp" }), alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Pressable style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} onPress={onRequestClose} accessibilityLabel="Fermer" disabled={!onRequestClose} />
        <Animated.View accessibilityViewIsModal accessibilityRole="alert"
          style={{ width: "100%", maxWidth: 380, borderRadius: 30, overflow: "hidden", borderWidth: 1, borderColor: th.glass(0.22), borderTopColor: th.glass(0.45),
            boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
            transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }, { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
          <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: th.base, backgroundImage: th.bgCss }} />
          <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: th.glassFill(0.08), boxShadow: th.glassFx }} />
          <View style={{ padding: 24, paddingTop: 28, alignItems: "center" }}>
            <View style={{ width: 76, height: 76, alignItems: "center", justifyContent: "center" }}>
              <Animated.View style={{ position: "absolute", width: 76, height: 76, borderRadius: 38, borderWidth: 2, borderColor: color,
                opacity: ring.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.8, 0] }),
                transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.45] }) }] }} />
              <Animated.View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: color, alignItems: "center", justifyContent: "center",
                boxShadow: `0 10px 26px ${color}88`,
                transform: [{ scale: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.3, 1.12, 1] }) }] }}>
                <BimIcon name={ICON[kind]} size={30} color="#FFFFFF" strokeWidth={2.6} />
              </Animated.View>
            </View>
            <T w="bold" size={20} style={{ marginTop: 16, textAlign: "center" }}>{title}</T>
            {!!message && <T size={15} color={th.muted} style={{ marginTop: 8, textAlign: "center", lineHeight: 22 }}>{message}</T>}
            {children && <View style={{ alignSelf: "stretch", marginTop: 16 }}>{children}</View>}
            <View style={{ alignSelf: "stretch", marginTop: 22, gap: 10, flexDirection: actions.length === 2 ? "row" : "column" }}>
              {actions.map((a, i) => (
                <PressScale key={i} onPress={a.onPress} disabled={a.disabled} accessibilityLabel={a.label} scaleTo={0.95}
                  style={[btnStyle(a.variant), actions.length === 2 ? { flex: 1 } : null]}>
                  <T w="bold" size={15} color={btnColor(a.variant)} numberOfLines={1}>{a.label}</T>
                </PressScale>
              ))}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Hôte global : file d'attente des pop-ups + redirection d'Alert.alert. */
export function BimAlertHost() {
  const [queue, setQueue] = useState<Req[]>([]);
  const [visible, setVisible] = useState(false);
  const cur = queue[0];

  useEffect(() => {
    push = (r) => setQueue((q) => [...q, r]);
    if (pending.length) setQueue((q) => [...q, ...pending.splice(0)]);
    const original = Alert.alert;
    (Alert as any).alert = (title: string, message?: string, buttons?: AlertButton[], options?: { cancelable?: boolean }) =>
      bimAlert(title, message, buttons, { cancelable: options?.cancelable });
    return () => { push = null; (Alert as any).alert = original; };
  }, []);

  useEffect(() => { if (cur) setVisible(true); }, [cur?.id]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => { if (cur?.cancelable) close(cur.buttons.find((b) => b.style === "cancel")); return true; });
    return () => sub.remove();
  }, [visible, cur?.id]);

  const close = (b?: AlertButton) => {
    setVisible(false);
    setTimeout(() => {
      setQueue((q) => q.slice(1));
      try { b?.onPress?.(); } catch {}
    }, 170);
  };

  if (!cur) return null;
  const ordered = [...cur.buttons].sort((a, b) => (a.style === "cancel" ? -1 : 0) - (b.style === "cancel" ? -1 : 0));
  const actions = ordered.map((b) => ({
    label: b.text ?? "OK",
    variant: (b.style === "destructive" ? "danger" : b.style === "cancel" ? "glass" : "accent") as "danger" | "glass" | "accent",
    onPress: () => close(b),
  }));
  return (
    <BimDialog visible={visible} kind={cur.kind} title={cur.title} message={cur.message} actions={actions}
      onRequestClose={cur.cancelable ? () => close(cur.buttons.find((b) => b.style === "cancel")) : undefined} />
  );
}
