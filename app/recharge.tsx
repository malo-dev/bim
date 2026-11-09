/**
 * Recharge d'Ecoins — parcours en 4 étapes (le bouton « Continuer » reste fixe en bas) :
 *  1. Type      : Automatique (crédit direct, par défaut) ou Manuelle (demande à un agent BIM)
 *  2. Devise    : Dollar (USD) ou Franc (CDF)
 *  3. Montant   : montant + « Payer avec » (liste déroulante, Airtel Money par défaut)
 *  4. Numéro    : « Tu y es presque ! » — numéro d'inscription ou un autre numéro
 * Puis attente animée → « Félicitations ! » → Nouvelle recharge / Retour à l'accueil.
 * Paiement via FlexPay (POST /tsx/recharge), confirmé par socket + vérification toutes les 3 s.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Easing, KeyboardAvoidingView, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AFRICA_COUNTRIES } from "@/constants/africaCountries";
import { BimIcon, BimIconName } from "@/components/bim/icons";
import { F, ec, useTh } from "@/components/bim/theme";
import {
  AmountChips, Appear, BimBackground, DEFAULT_COUNTRY, Glass, Header, PhoneField, PillButton, PressScale,
  SectionLabel, SlideButton, StatusOverlay, T, TextField,
} from "@/components/bim/ui";
import axiosInstance from "@/services/axiosInstance";
import { getSocket } from "@/services/socketService";
import { useCreateManualRechargeMutation, useRechargeMutation, useVerifyPaymentMutation } from "@/services/tsxService";
import { useGetUserByIdQuery } from "@/services/userService";
import { normalizeDecimal } from "@/utils/normalizeDecimal.util";

const OPS = [
  { id: "airtel", name: "Airtel Money", initials: "AM", sub: "Mobile Money", pay: "AirtelMoney" },
  { id: "orange", name: "Orange Money", initials: "OM", sub: "Mobile Money", pay: "OrangeMoney" },
  { id: "mpesa", name: "M-Pesa", initials: "MP", sub: "Mobile Money", pay: "M-Pesa" },
  { id: "visa", name: "Carte Visa", initials: "VISA", sub: "Carte bancaire", pay: "Card" },
] as const;
type OpId = (typeof OPS)[number]["id"];
type Mode = "auto" | "manual";
type Cur = "USD" | "CDF";
const STEP_LABELS = ["Type", "Devise", "Montant", "Numéro"];

function OpBadge({ initials, size = 42, font = 11 }: { initials: string; size?: number; font?: number }) {
  const th = useTh();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: th.ink, alignItems: "center", justifyContent: "center" }}>
      <T w="bold" size={font} color={th.onInk} style={{ letterSpacing: 0.5 }}>{initials}</T>
    </View>
  );
}

/** Barre d'étapes : 4 segments qui se remplissent + libellés. */
function StepBar({ step }: { step: number }) {
  const th = useTh();
  const v = useRef(new Animated.Value(step)).current;
  useEffect(() => { Animated.timing(v, { toValue: step, duration: 450, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: false }).start(); }, [step]);
  return (
    <View style={{ marginTop: 18 }} accessibilityLabel={`Étape ${step + 1} sur 4 : ${STEP_LABELS[step]}`}>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {STEP_LABELS.map((_, i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: th.glass(0.22), overflow: "hidden" }}>
            <Animated.View style={{ height: 4, borderRadius: 2, backgroundColor: i === step ? th.knob : th.fg,
              width: v.interpolate({ inputRange: [i - 1, i, i + 1], outputRange: ["0%", "100%", "100%"], extrapolate: "clamp" }) }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", marginTop: 8 }}>
        {STEP_LABELS.map((l, i) => (
          <T key={l} size={11} w={i === step ? "bold" : "regular"} color={i <= step ? th.fg : th.muted} style={{ flex: 1, textAlign: "center", letterSpacing: 0.3 }}>{i + 1}. {l}</T>
        ))}
      </View>
    </View>
  );
}

/** Grande carte de choix (type, devise, numéro). */
function ChoiceCard({ icon, mark, title, text, on, onPress, badge }: { icon?: BimIconName; mark?: string; title: string; text: string; on: boolean; onPress: () => void; badge?: string }) {
  const th = useTh();
  return (
    <PressScale onPress={onPress} scaleTo={0.97} accessibilityLabel={title}
      style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 24, borderWidth: on ? 2 : 1,
        borderColor: on ? th.fg : th.glass(0.22), backgroundColor: on ? th.glassFill(0.22) : th.glassFill(0.1), boxShadow: th.glassFx }}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: on ? th.accent : th.ink, alignItems: "center", justifyContent: "center" }}>
        {icon ? <BimIcon name={icon} size={24} color={on ? th.onAccent : th.onInk} strokeWidth={1.9} /> : <T w="bold" size={18} color={on ? th.onAccent : th.onInk}>{mark}</T>}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <T w="bold" size={17}>{title}</T>
          {!!badge && <View style={{ paddingHorizontal: 8, height: 20, borderRadius: 10, backgroundColor: th.knob, justifyContent: "center" }}><T w="bold" size={10} color="#FFFFFF">{badge}</T></View>}
        </View>
        <T size={13} color={th.muted} style={{ marginTop: 3, lineHeight: 19 }}>{text}</T>
      </View>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: th.fg, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: on ? th.fg : "transparent" }} />
      </View>
    </PressScale>
  );
}

/** Liste déroulante « Payer avec » : l'opérateur choisi, puis les autres en dépliant. */
function PaySelect({ value, onChange }: { value: OpId; onChange: (id: OpId) => void }) {
  const th = useTh();
  const [open, setOpen] = useState(false);
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: open ? 1 : 0, duration: 260, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: false }).start(); }, [open]);
  const sel = OPS.find((o) => o.id === value)!;
  const others = OPS.filter((o) => o.id !== value);
  const rowH = 62;
  return (
    <View style={{ borderRadius: 24, borderWidth: 1, borderColor: open ? th.fg : th.glass(0.24), backgroundColor: th.glassFill(0.14), overflow: "hidden", boxShadow: th.glassFx }}>
      <PressScale onPress={() => setOpen((o) => !o)} scaleTo={0.98} accessibilityLabel={`Payer avec ${sel.name}. ${open ? "Fermer la liste" : "Voir les autres moyens"}`}
        style={{ height: rowH, flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 10, paddingRight: 16 }}>
        <OpBadge initials={sel.initials} />
        <View style={{ flex: 1 }}>
          <T w="bold" size={15}>{sel.name}</T>
          <T size={12} color={th.muted}>{sel.sub} · {open ? "choisis un autre moyen" : "toucher pour changer"}</T>
        </View>
        <Animated.View style={{ transform: [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ["90deg", "270deg"] }) }] }}>
          <BimIcon name="chevron" size={20} color={th.fg} strokeWidth={2} />
        </Animated.View>
      </PressScale>
      <Animated.View style={{ height: v.interpolate({ inputRange: [0, 1], outputRange: [0, others.length * rowH + 1] }), opacity: v }}>
        <View style={{ height: 1, backgroundColor: th.glass(0.16) }} />
        {others.map((o) => (
          <PressScale key={o.id} onPress={() => { onChange(o.id); setOpen(false); }} scaleTo={0.98} accessibilityLabel={`Payer avec ${o.name}`}
            style={{ height: rowH, flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 10, paddingRight: 16 }}>
            <OpBadge initials={o.initials} />
            <View style={{ flex: 1 }}>
              <T w="bold" size={15}>{o.name}</T>
              <T size={12} color={th.muted}>{o.sub}</T>
            </View>
            <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: th.glass(0.6) }} />
          </PressScale>
        ))}
      </Animated.View>
    </View>
  );
}

/** Découpe un numéro « +243812345678 » en pays + numéro local. */
function splitPhone(tel?: string | null) {
  const t = String(tel ?? "").replace(/\s/g, "");
  if (!t) return null;
  const withPlus = t.startsWith("+") ? t : `+${t}`;
  const c = [...AFRICA_COUNTRIES].sort((a, b) => b.code.length - a.code.length).find((x) => withPlus.startsWith(x.code));
  if (!c) return { country: DEFAULT_COUNTRY, local: t.replace(/^\+/, "") };
  return { country: c, local: withPlus.slice(c.code.length).replace(/^0+/, "") };
}

export default function RechargeScreen() {
  const th = useTh();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<Mode>("auto");
  const [cur, setCur] = useState<Cur>("USD");
  const [amount, setAmount] = useState("10");
  const [op, setOp] = useState<OpId>("airtel");
  const [useMine, setUseMine] = useState(true);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<"idle" | "proc" | "done">("idle");
  const [ref, setRef] = useState<string | null>(null);
  const [credited, setCredited] = useState<string | null>(null);
  const [rate, setRate] = useState<number | null>(null);

  const [recharge, { isLoading }] = useRechargeMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [createManual, { isLoading: sendingManual }] = useCreateManualRechargeMutation();

  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);
  const { data: user, refetch } = useGetUserByIdQuery(userId!, { skip: !userId });
  useEffect(() => {
    axiosInstance.get("/currency").then(({ data }) => {
      const cdf = (data?.data || []).find((c: any) => c.code === "CDF");
      if (cdf?.rate) setRate(Number(cdf.rate));
    }).catch(() => {});
  }, []);

  const mine = useMemo(() => splitPhone(user?.telephone), [user?.telephone]);
  const usingMine = useMine && !!mine;

  const sel = OPS.find((o) => o.id === op)!;
  const isCard = mode === "auto" && op === "visa";
  const amt = Number(normalizeDecimal(amount || "0")) || 0;
  const unit = cur === "USD" ? "EC" : "FC";
  const estimatedEc = useMemo(() => (cur === "CDF" && rate ? amt / rate : amt), [amt, cur, rate]);
  const payLabel = cur === "USD" ? `Tu paies ${amt} USD` : rate ? `≈ ${ec(estimatedEc)} EC au taux du jour` : "Payé en CDF au taux du jour";
  const finalTel = () => (usingMine && mine ? { code: mine.country.code, local: mine.local } : { code: country.code, local: phone.replace(/\s/g, "") });

  const succeed = (montant?: any) => {
    setCredited(montant != null ? ec(montant) : ec(estimatedEc));
    setPhase("done");
    refetch();
  };

  /* Suivi temps réel du paiement automatique */
  useEffect(() => {
    if (phase !== "proc" || !ref) return;
    const socket = getSocket();
    const ok = (p: any) => succeed(p?.montantCredite);
    const ko = () => { Alert.alert("Paiement annulé", "Le paiement n'a pas abouti. Tu peux réessayer."); setPhase("idle"); };
    socket?.on("recharge:success", ok);
    ["recharge:cancelled", "recharge:failed", "recharge:declined"].forEach((e) => socket?.on(e, ko));
    const started = Date.now();
    const id = setInterval(async () => {
      try {
        const res: any = await verifyPayment({ reference: ref }).unwrap();
        if (res.status === "success" || res.status === "already_done") { clearInterval(id); succeed(res.montantCredite); }
        else if (res.status === "cancelled") { clearInterval(id); ko(); }
      } catch {}
      if (Date.now() - started > 60 * 60 * 1000) {
        clearInterval(id);
        Alert.alert("Problème de paiement", "Ton paiement n'a pas pu être confirmé. Contacte le support BIM NEXT.");
        setPhase("idle");
      }
    }, 3000);
    return () => {
      clearInterval(id);
      socket?.off("recharge:success", ok);
      ["recharge:cancelled", "recharge:failed", "recharge:declined"].forEach((e) => socket?.off(e, ko));
    };
  }, [phase, ref]);

  const submit = async () => {
    const { code, local } = finalTel();
    if (local.length < 8) { Alert.alert("Numéro manquant", isCard ? "Entre un numéro de contact valide." : mode === "auto" ? `Entre ton numéro ${sel.name}.` : "Entre ton numéro de téléphone."); return; }
    if (!userId) { Alert.alert("Erreur", "Reconnecte-toi puis réessaie."); return; }
    const telephone = `${code.replace("+", "")}${local}`;
    try {
      if (mode === "manual") {
        await createManual({ id: userId, amount: amt, telephone, method: note.trim() || "Manuel" }).unwrap();
        setCredited(null);
        setPhase("done");
        return;
      }
      const res: any = await recharge({ userId, amount: amt, telephone, PayTypeValue: sel.pay, CurrencyValue: cur }).unwrap();
      setRef(res.reference);
      if (isCard && res.redirectUrl) await WebBrowser.openBrowserAsync(res.redirectUrl);
      setPhase("proc");
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || err?.data?.details || "Une erreur est survenue. Réessaie.");
    }
  };

  const next = () => {
    if (step === 2) {
      if (amt <= 0) { Alert.alert("Montant manquant", "Choisis un montant à recharger."); return; }
      if (cur === "CDF" && !rate && mode === "auto") { Alert.alert("Taux indisponible", "Le taux du franc n'est pas disponible. Réessaie en USD."); return; }
    }
    if (step < 3) setStep(step + 1); else return submit();
  };
  const back = () => (step > 0 ? setStep(step - 1) : router.back());
  const restart = () => { setPhase("idle"); setRef(null); setCredited(null); setStep(0); setNote(""); };

  const ctaLabel = step < 3 ? "Continuer" : mode === "manual" ? "Envoyer la demande" : `Confirmer · ${amt} ${unit}`;

  /* ─── Contenu de chaque étape ─── */
  const content = () => {
    if (step === 0) return (
      <>
        <T style={{ marginTop: 22 }}><T w="light" size={30} style={{ lineHeight: 35 }}>Quel type{"\n"}</T><T w="bold" size={30} style={{ lineHeight: 35 }}>de recharge ?</T></T>
        <View style={{ marginTop: 20, gap: 12 }}>
          <ChoiceCard icon="flash" title="Automatique" badge="Recommandé" on={mode === "auto"} onPress={() => setMode("auto")}
            text="Ton solde est crédité directement, dès que tu valides le paiement sur ton téléphone." />
          <ChoiceCard icon="user" title="Manuelle" on={mode === "manual"} onPress={() => setMode("manual")}
            text="Tu fais une demande de recharge auprès de BIM : un agent la traite et crédite ton compte." />
        </View>
      </>
    );
    if (step === 1) return (
      <>
        <T style={{ marginTop: 22 }}><T w="light" size={30} style={{ lineHeight: 35 }}>Dans quelle{"\n"}</T><T w="bold" size={30} style={{ lineHeight: 35 }}>devise ?</T></T>
        <View style={{ marginTop: 20, gap: 12 }}>
          <ChoiceCard mark="$" title="Dollar (USD)" on={cur === "USD"} onPress={() => { if (cur !== "USD") setAmount("10"); setCur("USD"); }} text="1 USD = 1 EC crédité sur ton compte." />
          <ChoiceCard mark="FC" title="Franc (CDF)" on={cur === "CDF"} onPress={() => { if (cur !== "CDF") setAmount("10000"); setCur("CDF"); }}
            text={rate ? `Converti au taux du jour : 1 EC = ${Math.round(rate).toLocaleString("fr-FR")} FC.` : "Converti en EC au taux du jour."} />
        </View>
      </>
    );
    if (step === 2) return (
      <>
        <T style={{ marginTop: 22 }}><T w="light" size={30} style={{ lineHeight: 35 }}>Combien veux-tu{"\n"}</T><T w="bold" size={30} style={{ lineHeight: 35 }}>recharger ?</T></T>
        <Glass a={0.14} b={0.22} radius={24} style={{ marginTop: 18, padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
            <T w="light" size={20}>{unit}</T>
            <TextInput value={amount} onChangeText={(v) => setAmount(v.replace(/[^\d.,]/g, ""))} keyboardType="decimal-pad" accessibilityLabel="Montant à recharger"
              style={{ flex: 1, fontFamily: F.bold, fontSize: 44, color: th.fg, paddingVertical: 0, letterSpacing: -0.8, includeFontPadding: false }} />
          </View>
          <T size={13} color={th.muted} style={{ marginTop: 2 }}>{payLabel}</T>
          <View style={{ marginTop: 12 }}><AmountChips values={cur === "USD" ? [5, 10, 20, 50] : [5000, 10000, 20000, 50000]} value={amt} onPick={(n) => setAmount(String(n))} /></View>
        </Glass>
        {mode === "auto" ? (
          <>
            <SectionLabel style={{ marginTop: 20 }}>PAYER AVEC</SectionLabel>
            <View style={{ marginTop: 8 }}><PaySelect value={op} onChange={setOp} /></View>
          </>
        ) : (
          <View style={{ marginTop: 20 }}>
            <TextField id="rm-note" label="Comment vas-tu payer l'agent ? (facultatif)" value={note} onChange={setNote} placeholder="Ex. Airtel Money, cash à l'agence" />
          </View>
        )}
      </>
    );
    // Étape 4 : numéro
    return (
      <>
        <T style={{ marginTop: 22 }}><T w="light" size={30} style={{ lineHeight: 35 }}>Tu y es{"\n"}</T><T w="bold" size={30} style={{ lineHeight: 35 }}>presque !</T></T>
        <T size={15} color={th.muted} style={{ marginTop: 8, lineHeight: 22 }}>
          {isCard ? "Tu vas saisir ta carte sur la page sécurisée de notre partenaire bancaire. Indique un numéro pour te joindre."
            : mode === "auto" ? `Tu vas recevoir une demande de paiement ${sel.name} sur ce numéro. Valide-la avec ton code secret.`
            : "Un agent BIM te contactera sur ce numéro pour finaliser ta recharge."}
        </T>

        <Glass a={0.12} b={0.2} radius={22} style={{ marginTop: 16, paddingVertical: 4, paddingHorizontal: 16 }}>
          {[
            ["Type", mode === "auto" ? "Automatique" : "Manuelle"],
            ["Montant", `${amt} ${unit}${cur === "CDF" && rate ? ` (≈ ${ec(estimatedEc)} EC)` : ""}`],
            ...(mode === "auto" ? [["Payer avec", sel.name]] : []),
          ].map(([k, val], i, arr) => (
            <View key={k} style={{ height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: th.glass(0.12) }}>
              <T size={14} color={th.muted}>{k}</T>
              <T w="bold" size={14}>{val}</T>
            </View>
          ))}
        </Glass>

        <SectionLabel style={{ marginTop: 20 }}>{isCard ? "NUMÉRO DE CONTACT" : mode === "auto" ? `NUMÉRO ${sel.name.toUpperCase()}` : "TON NUMÉRO"}</SectionLabel>
        <View style={{ marginTop: 8, gap: 8 }}>
          {mine && (
            <ChoiceCard icon="phone" title="Mon numéro d'inscription" on={usingMine} onPress={() => setUseMine(true)} text={`${mine.country.code} ${mine.local}`} />
          )}
          <ChoiceCard icon="plus" title="Un autre numéro" on={!usingMine} onPress={() => setUseMine(false)} text="Utiliser un numéro différent pour cette recharge." />
        </View>
        {!usingMine && (
          <Appear kind="rise" style={{ marginTop: 14 }}>
            <PhoneField id="rc-tel" label="Nouveau numéro" value={phone} onChange={setPhone} country={country} setCountry={setCountry} />
          </Appear>
        )}
      </>
    );
  };

  return (
    <BimBackground enter={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={{ paddingTop: 28 + insets.top, paddingHorizontal: 24 }}>
          <Header title="Recharge" backLabel={step > 0 ? "Étape précédente" : "Retour à l'accueil"} onBack={back} />
          <StepBar step={step} />
        </View>

        <ScrollView key={step} style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <Appear kind="page" duration={500}>{content()}</Appear>
        </ScrollView>

        {/* Bouton fixe : il ne bouge pas, seul le contenu au-dessus change */}
        <View style={{ paddingHorizontal: 24, paddingTop: 10, paddingBottom: 20 + insets.bottom }}>
          {step === 3 && (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10 }}>
              <BimIcon name="lock" size={14} color={th.muted} strokeWidth={2} />
              <T size={12} color={th.muted}>Paiement sécurisé</T>
            </View>
          )}
          <SlideButton variant="accent" loading={isLoading || sendingManual} label={ctaLabel} onDone={next} />
        </View>
      </KeyboardAvoidingView>

      {phase !== "idle" && (
        <StatusOverlay phase={phase}
          title={phase === "proc" ? "Paiement en cours…" : mode === "manual" ? "Félicitations, c'est envoyé !" : "Félicitations, tu y es arrivé !"}
          text={phase === "proc"
            ? (isCard ? "On vérifie ta carte auprès de la banque." : `Valide la demande ${sel.name} reçue sur ton téléphone.`)
            : mode === "manual"
              ? `Merci ! Ta demande de ${amt} ${unit} est envoyée à BIM. Tu recevras une notification dès qu'elle est créditée.`
              : `Merci ! ${credited} EC ont été ajoutés à ton solde.`}>
          {phase === "done" && (
            <>
              <PillButton variant="accent" label="Faire une nouvelle recharge" onPress={restart} />
              <PillButton label="Retour à l'accueil" onPress={() => router.replace("/(tabs)" as any)} />
            </>
          )}
        </StatusOverlay>
      )}
      {phase === "proc" && (
        <View style={{ position: "absolute", left: 24, right: 24, bottom: 40 + insets.bottom, zIndex: 60 }}>
          <PillButton label="Annuler l'attente" onPress={() => setPhase("idle")} />
        </View>
      )}
    </BimBackground>
  );
}
