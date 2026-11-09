/**
 * BIM NEXT — parcours d'ouverture, identique à la maquette.
 *
 *   Ouverture animée → 4 écrans (le thème se change dans Profil / Réglages)
 *   → « As-tu déjà un compte ? »
 *        Oui → Connexion ⇄ Mot de passe oublié
 *        Non → Inscription 1/3 → 2/3 → 3/3
 *
 * `?step=phone` (après une déconnexion) ouvre directement la connexion.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert, Animated, DeviceEventEmitter, Easing, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, View, useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SvgXml } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useAskPasswordResetMutation, useLoginMutation, usePhoneLoginMutation, useQuickAccessMutation,
} from "@/services/authService";
import { persistAuthSession } from "@/utils/authSession.utils";
import { BimIcon } from "@/components/bim/icons";
import {
  slideGas, slidePump, slidePumpCity, slideTaxi, slideTaxiCity, slideWater,
  splashGas, splashPump, splashTaxi, splashWater,
} from "@/components/bim/illustrations";
import {
  Appear, Aura, BLogo, BimBackground, BottomFade, DEFAULT_COUNTRY, DrawLine, Float, Glow, Ink,
  PhoneField, PressScale, RoundButton, SlideButton, Steps, T, TextField,
} from "@/components/bim/ui";
import { useTh } from "@/components/bim/theme";

type Step =
  | "splash" | "s1" | "s2" | "s3" | "s4" | "compte"
  | "connexion" | "motdepasse" | "ins1" | "ins2" | "ins3";

/**
 * Enchaînement des écrans comme la maquette : l'écran sortant s'efface en glissant
 * de 40 px vers la gauche (0,45 s), puis le nouvel écran entre par la droite (0,55 s).
 * Chaque écran a SA propre valeur d'animation (StepView, remonté à chaque étape) :
 * aucune remise à zéro, donc ni saut ni écran qui reste invisible.
 */
function useStepper(initial: Step) {
  const [step, setStep] = useState<Step>(initial);
  const [leaving, setLeaving] = useState(false);
  const target = useRef<Step | null>(null);
  const busy = useRef(false);
  const cur = useRef(step);
  cur.current = step;
  const go = (to: Step, animate = true) => {
    if (busy.current || to === cur.current) return;
    if (!animate) { setStep(to); return; }
    busy.current = true;
    target.current = to;
    setLeaving(true);
  };
  const onLeft = () => {
    const to = target.current;
    target.current = null;
    busy.current = false;
    setLeaving(false);
    if (to) setStep(to);
  };
  return { step, setStep, go, leaving, onLeft };
}

function StepView({ leaving, onLeft, children }: { leaving: boolean; onLeft: () => void; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!leaving) return;
    const a = Animated.timing(v, { toValue: 1, duration: 450, easing: Easing.ease, useNativeDriver: true });
    a.start(() => onLeft());
    return () => a.stop();
  }, [leaving]);
  return (
    <Animated.View style={{ flex: 1,
      opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
      transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, -40] }) }] }}>
      {children}
    </Animated.View>
  );
}

/* ═══ Ouverture animée ════════════════════════════════════════════════ */
function Splash({ onStart }: { onStart: () => void }) {
  const th = useTh();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const k = width / 390;
  const top = insets.top * 0.4;
  const letters = [
    ["B", 1500, "bold"], ["I", 1580, "bold"], ["M", 1660, "bold"],
    ["N", 1800, "light"], ["E", 1880, "light"], ["X", 1960, "light"], ["T", 2040, "light"],
  ] as const;
  return (
    <BimBackground enter={false}>
      <Glow top={20 * k} size={460 * k} opacity={0.24} pulse />
      <View style={{ position: "absolute", top: 60 * k + top, left: 0, width, height: 380 * k }}>
        <View style={{ position: "absolute", left: 50 * k, right: 50 * k, bottom: 4 * k, height: 34 * k, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.22)" }} />
        <Appear kind="left" delay={350} style={{ position: "absolute", left: 14 * k, top: 80 * k }}>
          <View style={{ transform: [{ rotate: "-9deg" }] }}><Float offset={1200}><SvgXml xml={splashWater} width={150 * k} height={236 * k} /></Float></View>
        </Appear>
        <Appear kind="right" delay={550} style={{ position: "absolute", right: 10 * k, top: 66 * k }}>
          <View style={{ transform: [{ rotate: "8deg" }] }}><Float offset={2600}><SvgXml xml={splashPump} width={150 * k} height={240 * k} /></Float></View>
        </Appear>
        <Appear kind="up" delay={150} style={{ position: "absolute", left: 105 * k, top: 14 * k }}>
          <Float><SvgXml xml={splashGas} width={180 * k} height={288 * k} /></Float>
        </Appear>
        <Appear kind="drive" delay={800} style={{ position: "absolute", left: 70 * k, top: 238 * k }}>
          <Float offset={3400} amp={6}><SvgXml xml={splashTaxi} width={250 * k} height={139 * k} /></Float>
        </Appear>
      </View>

      <View style={{ position: "absolute", top: 462 * k + top, left: 0, right: 0, alignItems: "center" }}>
        <Appear kind="pop" delay={1300}>
          <BLogo size={84} />
        </Appear>
        <View style={{ marginTop: 20, flexDirection: "row" }}>
          {letters.map(([l, d, w]) => (
            <Appear key={l + d} kind="rise" delay={d}><T w={w} size={44} style={{ letterSpacing: 2.6, lineHeight: 50 }}>{l}</T></Appear>
          ))}
        </View>
        <View style={{ marginTop: 14 }}><DrawLine delay={2200} /></View>
        <Appear kind="fade" delay={2400}><T size={15} color={th.muted} style={{ marginTop: 16 }}>Eau, gaz, carburant et taxi à Bunia</T></Appear>
      </View>

      <Appear kind="fade" delay={2700} style={{ position: "absolute", left: 24, right: 24, bottom: 44 + insets.bottom }}>
        <SlideButton label="Commencer" onDone={onStart} />
      </Appear>
    </BimBackground>
  );
}

/* ═══ 4 écrans de présentation ════════════════════════════════════════ */
type SlideDef = { xml: string; w: number; h: number; top: number; left: number; city?: string; cityTop?: number; cityH?: number; cityOp?: number; road?: number; glowTop: number; kicker?: string; key: string };
const SLIDES: SlideDef[] = [
  { key: "eau", xml: slideWater, w: 300, h: 470, top: 96, left: 45, glowTop: 70, kicker: "Bienvenue sur BIM NEXT" },
  { key: "gaz", xml: slideGas, w: 300, h: 480, top: 90, left: 45, glowTop: 60 },
  { key: "carb", xml: slidePump, w: 300, h: 480, top: 92, left: 40, glowTop: 70, city: slidePumpCity, cityTop: 80, cityH: 420, cityOp: 0.35 },
  { key: "taxi", xml: slideTaxi, w: 350, h: 194, top: 268, left: 20, glowTop: 120, city: slideTaxiCity, cityTop: 90, cityH: 380, cityOp: 0.32, road: 452 },
];

function SlideText({ i }: { i: number }) {
  const th = useTh();
  const LH = 43;
  const B = ({ children }: { children: React.ReactNode }) => <T w="bold" size={15}>{children}</T>;
  const titles = [
    <><T w="light" size={38} style={{ lineHeight: LH }}>Ton eau{"\n"}</T><T w="bold" size={38} style={{ lineHeight: LH }}>livrée chez toi</T></>,
    <><T w="italic" size={38} style={{ lineHeight: LH }}>Recharge</T><T size={38} style={{ lineHeight: LH }}> ton{"\n"}</T><T w="bold" size={38} style={{ lineHeight: LH }}>gaz sans attendre</T></>,
    <><T size={38} style={{ lineHeight: LH }}>Fais le plein,{"\n"}</T><T w="bold" size={38} style={{ lineHeight: LH }}>économise plus !</T></>,
    <><T w="light" size={38} style={{ lineHeight: LH }}>Ton taxi,{"\n"}</T><T w="bold" size={38} style={{ lineHeight: LH }}>en un clic</T></>,
  ];
  const texts = [
    <>Commande ta bonbonne dans l'app et paie avec ton QR, <B>même sans connexion</B>.</>,
    <>Ta bouteille rechargée chez nos partenaires, au <B>meilleur prix</B> de Bunia.</>,
    <>Jusqu'à <B>−0,30 $ par litre</B> chez TRILEX quand tu paies avec BIM NEXT.</>,
    <>Commande une course dans l'app et paie en EC. <B>Pas de cash, pas de négociation.</B></>,
  ];
  return (
    <>
      <Appear kind="rise" delay={180}><T style={{ marginTop: SLIDES[i].kicker ? 10 : 0, letterSpacing: -0.4 }}>{titles[i]}</T></Appear>
      <Appear kind="rise" delay={280}><T size={15} color={th.muted} style={{ marginTop: 14, lineHeight: 23 }}>{texts[i]}</T></Appear>
    </>
  );
}

function Slide({ i, onNext, onBack, onSkip }: { i: number; onNext: () => void; onBack: () => void; onSkip: () => void }) {
  const th = useTh();
  const d = SLIDES[i];
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const k = width / 390;
  return (
    <BimBackground enter="slide">
      {d.city && <View pointerEvents="none" style={{ position: "absolute", top: (d.cityTop ?? 80) * k, left: 0, opacity: d.cityOp }}><SvgXml xml={d.city} width={390 * k} height={(d.cityH ?? 400) * k} /></View>}
      <Glow top={d.glowTop * k} size={440 * k} opacity={0.2} />
      {d.road && <View style={{ position: "absolute", left: 0, right: 0, top: d.road * k, height: 2, backgroundColor: th.glass(0.12) }} />}
      <Appear kind="fade" duration={600} style={{ position: "absolute", top: d.top * k, left: d.left * k }}>
        <Float><SvgXml xml={d.xml} width={d.w * k} height={d.h * k} /></Float>
      </Appear>
      <BottomFade />
      <View style={{ position: "absolute", top: 28 + insets.top, left: 20, right: 20, flexDirection: "row", alignItems: "center", gap: 18 }}>
        <BLogo />
        <View style={{ flex: 1 }}><Steps total={4} active={i} /></View>
        <PressScale onPress={onSkip} accessibilityLabel="Passer" style={{ height: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: th.glass(0.22), justifyContent: "center" }}>
          <T size={14}>Passer</T>
        </PressScale>
      </View>
      <View style={{ position: "absolute", left: 24, right: 24, bottom: 44 + insets.bottom }}>
        {d.kicker && <Appear kind="rise" delay={100}><T size={14} color={th.mutedSoft}>{d.kicker}</T></Appear>}
        <SlideText i={i} />
        <Appear kind="fade" delay={420} style={{ flexDirection: "row", gap: 10, marginTop: 40 }}>
          <RoundButton icon="back" label="Retour" size={60} onPress={onBack} />
          <View style={{ flex: 1 }}><SlideButton label="Commencer" onDone={onNext} /></View>
        </Appear>
      </View>
    </BimBackground>
  );
}

/* ═══ Formulaires ═════════════════════════════════════════════════════ */
function TopBar({ onBack, step }: { onBack: () => void; step?: number }) {
  const th = useTh();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
      <RoundButton icon="back" label="Retour" onPress={onBack} />
      {step === undefined ? <BLogo /> : (
        <>
          <View style={{ flex: 1, flexDirection: "row", gap: 10 }} accessibilityLabel={`Étape ${step + 1} sur 3`}>
            {[0, 1, 2].map((n) => <View key={n} style={{ width: 38, height: 3, borderRadius: 3, backgroundColor: n === step ? th.fg : th.glass(0.35) }} />)}
          </View>
          <T size={13} color={th.muted}>{step + 1} / 3</T>
        </>
      )}
    </View>
  );
}

function FormScreen({ children, footer, glowTop = 80, glow = true }: { children: React.ReactNode; footer: React.ReactNode; glowTop?: number; glow?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <BimBackground enter="slide">
      {glow && <Glow top={glowTop} opacity={0.18} />}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingTop: 28 + insets.top, paddingHorizontal: 24, paddingBottom: 34 + insets.bottom }}>
          {children}
          <View style={{ marginTop: "auto", paddingTop: 24 }}>{footer}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BimBackground>
  );
}

function HeroBubble({ icon, size = 132 }: { icon: "user" | "phone" | "lock"; size?: number }) {
  const th = useTh();
  const inner = Math.round(size * 0.64);
  return (
    <Float amp={7} duration={4500} style={{ alignSelf: "center" }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: th.glassFill(0.14), borderWidth: 1, borderColor: th.glass(0.24), alignItems: "center", justifyContent: "center", boxShadow: th.glassFx }}>
        <Ink size={inner} icon={icon} iconSize={Math.round(inner * 0.48)} />
      </View>
    </Float>
  );
}

function H1({ a, b, size = 32 }: { a: string; b: string; size?: number }) {
  return (
    <T style={{ letterSpacing: -0.3 }}>
      <T w="light" size={size} style={{ lineHeight: size * 1.14 }}>{a}{"\n"}</T>
      <T w="bold" size={size} style={{ lineHeight: size * 1.14 }}>{b}</T>
    </T>
  );
}

function LinkText({ children, onPress, bold }: { children: React.ReactNode; onPress: () => void; bold?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ minHeight: 44, justifyContent: "center" }} accessibilityRole="button">
      <T w={bold ? "bold" : "regular"} size={14} style={{ textDecorationLine: "underline" }}>{children}</T>
    </Pressable>
  );
}

function PinDot({ on }: { on: boolean }) {
  const th = useTh();
  const v = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => { Animated.spring(v, { toValue: on ? 1 : 0, friction: 5, tension: 200, useNativeDriver: true }).start(); }, [on]);
  return (
    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: th.fg, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: th.fg, transform: [{ scale: v }] }} />
    </View>
  );
}

/* ═══ Flux principal ══════════════════════════════════════════════════ */
export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const th = useTh();
  const { step: initialStep } = useLocalSearchParams<{ step?: string }>();
  const startOnLogin = initialStep === "phone";
  const { step, setStep, go, leaving, onLeft } = useStepper(startOnLogin ? "connexion" : "splash");

  // Plus d'écran « Choisis ton thème » au démarrage : on ouvre directement l'animation.
  useEffect(() => { if (startOnLogin) setStep("connexion"); }, [initialStep]);

  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const [legacyEmail, setLegacyEmail] = useState("");
  const [legacyPwd, setLegacyPwd] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [quickAccess] = useQuickAccessMutation();
  const [phoneLogin] = usePhoneLoginMutation();
  const [loginUser] = useLoginMutation();
  const [askReset] = useAskPasswordResetMutation();

  const fullPhone = `${country.code}${phone.replace(/\s/g, "")}`;
  const phoneOk = phone.replace(/\s/g, "").length >= 8;

  // Redirection selon l'espace du compte : admin BIM → Gestion, livreur →
  // Espace Livreur, chauffeur → Mode chauffeur, sinon accueil client.
  // `homeSpace` permet à app/index.tsx de rouvrir le même espace au relancement.
  const finish = async (res: any, quick: boolean) => {
    await AsyncStorage.setItem("onboardingDone", "true");
    if (res.livreurToken && res.livreurUser) {
      await AsyncStorage.multiSet([
        ["livreurToken", res.livreurToken], ["livreurId", String(res.livreurUser.livreur?.livreurId ?? "")],
        ["livreurUser", JSON.stringify(res.livreurUser)], ["livreurLastActivity", String(Date.now())],
      ]);
    }
    const space = res.role === "BIM" ? "gestion"
      : res.space === "livreur" || res.livreurOnly ? "livreur"
      : res.isChauffeur && res.chauffeurStatus !== "rejected" ? "chauffeur"
      : "client";
    await AsyncStorage.setItem("homeSpace", space);
    // Connexion avec le mot de passe livreur uniquement : pas de session client.
    if (res.livreurOnly) { router.replace("/livreur/space" as any); return; }
    await persistAuthSession(res.token, res.refreshToken, { isQuickAccount: quick });
    if (res.isNewAccount) await AsyncStorage.setItem("firstOrderHintPending", "true");
    DeviceEventEmitter.emit("auth:loggedIn");
    const target = { gestion: "/gestion/home", livreur: "/livreur/space", chauffeur: "/transport/mode-chauffeur", client: "/(tabs)" }[space];
    router.replace(target as any);
  };

  const legacyPhoneAccess = async () => {
    setBusy(true);
    try {
      const res: any = await quickAccess({ telephone: fullPhone, mustExist: true }).unwrap();
      await finish(res, !!res.isQuickAccount);
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Connexion impossible. Réessaie.");
    } finally { setBusy(false); }
  };

  const doLogin = async () => {
    if (!phoneOk) { setPhoneError("Entre ton numéro de téléphone."); return; }
    if (!password) { Alert.alert("Mot de passe", "Entre ton mot de passe."); return; }
    setBusy(true);
    try {
      const res: any = await phoneLogin({ telephone: fullPhone, password }).unwrap();
      await finish(res, !!res.isQuickAccount);
    } catch (err: any) {
      if (err?.status === 401) {
        Alert.alert("Mot de passe incorrect", "Vérifie ton mot de passe. Si ton compte a été créé sans mot de passe (ancienne version), connecte-toi avec ton numéro seul.", [
          { text: "Réessayer", style: "cancel" },
          { text: "Compte sans mot de passe", onPress: legacyPhoneAccess },
        ]);
      } else Alert.alert("Erreur", err?.data?.message || "Connexion impossible. Vérifie tes informations.");
    } finally { setBusy(false); }
  };

  const doLegacyEmailLogin = async () => {
    if (!legacyEmail.trim() || !legacyPwd) { Alert.alert("Erreur", "Entre ton e-mail et ton mot de passe."); return; }
    setBusy(true);
    try {
      const res: any = await loginUser({ email: legacyEmail.trim(), password: legacyPwd }).unwrap();
      await finish(res, false);
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Connexion impossible. Vérifie tes identifiants.");
    } finally { setBusy(false); }
  };

  const doReset = async () => {
    const m = resetEmail.trim();
    if (!/^\S+@\S+\.\S+$/.test(m)) { Alert.alert("E-mail", "Entre une adresse e-mail valide."); return; }
    setBusy(true);
    try {
      await askReset({ email: m }).unwrap();
      setResetSent(true);
      go("connexion");
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Envoi impossible. Réessaie.");
    } finally { setBusy(false); }
  };

  const doSignup = async () => {
    if (pin.length !== 6) { Alert.alert("Mot de passe", "Ton mot de passe doit contenir 6 chiffres."); return; }
    setBusy(true);
    try {
      const res: any = await quickAccess({ telephone: fullPhone, password: pin, fullName: fullName.trim(), email: email.trim() || undefined }).unwrap();
      await finish(res, true);
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Création du compte impossible. Réessaie.");
    } finally { setBusy(false); }
  };

  const isSlide = step === "s1" || step === "s2" || step === "s3" || step === "s4";
  let screen: React.ReactNode = null;

  if (step === "splash") {
    screen = <Splash onStart={() => go("s1")} />;
  } else if (isSlide) {
    const i = Number(step[1]) - 1;
    const order: Step[] = ["s1", "s2", "s3", "s4", "compte"];
    screen = <Slide i={i} onNext={() => go(order[i + 1])} onBack={() => go(i === 0 ? "splash" : order[i - 1], false)} onSkip={() => go("compte")} />;
  } else if (step === "compte") {
    screen = (
      <BimBackground enter="slide">
        <Glow top={90} opacity={0.2} />
        <View style={{ flex: 1, paddingTop: 28 + insets.top, paddingHorizontal: 24, paddingBottom: 44 + insets.bottom }}>
          <TopBar onBack={() => go("s4", false)} />
          <View style={{ marginTop: 70 }}><HeroBubble icon="user" size={150} /></View>
          <View style={{ marginTop: "auto" }}>
            <Appear kind="rise" delay={120}><H1 a="As-tu déjà un" b="compte BIMNEXT ?" size={36} /></Appear>
            <Appear kind="rise" delay={220}><T size={15} color={th.muted} style={{ marginTop: 14, lineHeight: 23 }}>Connecte-toi avec ton numéro, ou crée ton compte en une minute.</T></Appear>
            <Appear kind="fade" delay={340}>
              <SlideButton variant="accent" label="Oui, me connecter" onDone={() => { setResetSent(false); go("connexion"); }} style={{ marginTop: 34 }} />
              <SlideButton icon="plus" label="Non, créer mon compte" onDone={() => go("ins1")} style={{ marginTop: 12 }} />
            </Appear>
          </View>
        </View>
      </BimBackground>
    );
  } else if (step === "connexion") {
    screen = (
      <FormScreen glowTop={-40}
        footer={
          <>
            <SlideButton variant="accent" label="Se connecter" loading={busy} onDone={emailMode ? doLegacyEmailLogin : doLogin} />
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
              <T size={14} color={th.muted}>Pas encore de compte ? </T>
              <LinkText bold onPress={() => go("ins1")}>Créer un compte</LinkText>
            </View>
          </>
        }>
        <TopBar onBack={() => go("compte", false)} />
        <View style={{ marginTop: 40 }}><H1 a="Bon retour" b="sur BIMNEXT" size={36} /></View>
        <T size={15} color={th.muted} style={{ marginTop: 12, lineHeight: 23 }}>
          {emailMode ? "Entre l'e-mail et le mot de passe de ton ancien compte." : "Entre ton numéro de téléphone et ton mot de passe."}
        </T>
        {resetSent && (
          <Appear kind="rise">
            <View style={{ marginTop: 18, flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 16, backgroundColor: th.accent }} accessibilityRole="alert">
              <BimIcon name="mail" size={18} color={th.onAccent} />
              <T size={14} color={th.onAccent} style={{ flex: 1 }}>Lien envoyé ! Regarde ta boîte Gmail.</T>
            </View>
          </Appear>
        )}
        {emailMode ? (
          <>
            <View style={{ marginTop: 28 }}><TextField id="cx-mail" label="Adresse e-mail" value={legacyEmail} onChange={setLegacyEmail} placeholder="nom@gmail.com" keyboardType="email-address" autoComplete="email" /></View>
            <View style={{ marginTop: 18 }}><TextField id="cx-mpwd" label="Mot de passe" value={legacyPwd} onChange={setLegacyPwd} placeholder="••••••" secure letterSpacing={4} /></View>
          </>
        ) : (
          <>
            <View style={{ marginTop: 28 }}><PhoneField id="cx-tel" value={phone} onChange={(v) => { setPhone(v); setPhoneError(null); }} country={country} setCountry={setCountry} error={phoneError} /></View>
            <View style={{ marginTop: 18 }}><TextField id="cx-pin" label="Mot de passe (6 chiffres)" value={password} onChange={setPassword} placeholder="••••••" secure keyboardType="number-pad" letterSpacing={5} /></View>
          </>
        )}
        <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", columnGap: 16, marginTop: 4 }}>
          <LinkText onPress={() => go("motdepasse")}>Mot de passe oublié ?</LinkText>
          <LinkText onPress={() => setEmailMode((m) => !m)}>{emailMode ? "Utiliser mon numéro" : "Compte avec e-mail"}</LinkText>
        </View>
      </FormScreen>
    );
  } else if (step === "motdepasse") {
    screen = (
      <FormScreen footer={<SlideButton variant="accent" label="Envoyer le lien" loading={busy} onDone={doReset} />}>
        <TopBar onBack={() => go("connexion", false)} />
        <View style={{ marginTop: 50 }}><HeroBubble icon="lock" /></View>
        <View style={{ marginTop: 36 }}><H1 a="Mot de passe" b="oublié ?" /></View>
        <T size={15} color={th.muted} style={{ marginTop: 12, lineHeight: 23 }}>Entre l'adresse Gmail utilisée à l'inscription. On t'envoie un lien pour choisir un nouveau mot de passe.</T>
        <View style={{ marginTop: 24 }}><TextField id="md-mail" label="Adresse e-mail" value={resetEmail} onChange={setResetEmail} placeholder="nom@gmail.com" keyboardType="email-address" autoComplete="email" /></View>
      </FormScreen>
    );
  } else if (step === "ins1") {
    screen = (
      <FormScreen footer={<SlideButton variant="accent" label="Continuer" onDone={() => { if (!phoneOk) { setPhoneError("Entre un numéro valide."); return; } go("ins2"); }} />}>
        <TopBar onBack={() => go("compte", false)} step={0} />
        <View style={{ marginTop: 60 }}><HeroBubble icon="phone" /></View>
        <View style={{ marginTop: 40 }}><H1 a="Veuillez entrer votre" b="numéro de téléphone" /></View>
        <T size={15} color={th.muted} style={{ marginTop: 12, lineHeight: 23 }}>Il servira à te connecter et à recevoir tes paiements.</T>
        <View style={{ marginTop: 24 }}><PhoneField id="in-tel" value={phone} onChange={(v) => { setPhone(v); setPhoneError(null); }} country={country} setCountry={setCountry} error={phoneError} /></View>
      </FormScreen>
    );
  } else if (step === "ins2") {
    screen = (
      <FormScreen footer={<SlideButton variant="accent" label="Continuer" onDone={() => {
        if (fullName.trim().length < 2) { Alert.alert("Nom complet", "Entre ton prénom et ton nom."); return; }
        if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) { Alert.alert("E-mail", "Cette adresse e-mail n'est pas valide."); return; }
        go("ins3");
      }} />}>
        <TopBar onBack={() => go("ins1", false)} step={1} />
        <View style={{ marginTop: 40 }}><H1 a="Complète" b="ton profil" /></View>
        <T size={15} color={th.muted} style={{ marginTop: 12, lineHeight: 23 }}>Ton nom apparaît sur tes reçus. Ton e-mail sert si tu oublies ton mot de passe.</T>
        <View style={{ marginTop: 28 }}><TextField id="in-nom" label="Nom complet" value={fullName} onChange={setFullName} placeholder="Prénom et nom" autoComplete="name" /></View>
        <View style={{ marginTop: 18 }}><TextField id="in-mail" label="Adresse e-mail" value={email} onChange={setEmail} placeholder="nom@gmail.com" keyboardType="email-address" autoComplete="email" /></View>
      </FormScreen>
    );
  } else if (step === "ins3") {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];
    screen = (
      <FormScreen glow={false} footer={<SlideButton variant="accent" label="Créer mon compte" loading={busy} onDone={doSignup} />}>
        <TopBar onBack={() => go("ins2", false)} step={2} />
        <View style={{ marginTop: 34 }}><H1 a="Crée ton" b="mot de passe" /></View>
        <T size={15} color={th.muted} style={{ marginTop: 10 }}>6 chiffres, simples à retenir.</T>
        <View style={{ marginTop: 26, flexDirection: "row", justifyContent: "center", gap: 14 }} accessibilityLabel={`${pin.length} chiffres sur 6 saisis`}>
          {[0, 1, 2, 3, 4, 5].map((n) => <PinDot key={n} on={n < pin.length} />)}
        </View>
        <View style={{ marginTop: 26, alignSelf: "center", width: 282, flexDirection: "row", flexWrap: "wrap", rowGap: 10, columnGap: 18 }}>
          {keys.map((kk, idx) => {
            const digit = kk !== "" && kk !== "⌫";
            return (
              <PressScale key={idx} disabled={kk === ""} accessibilityLabel={kk === "⌫" ? "Effacer" : digit ? `Chiffre ${kk}` : "Vide"}
                onPress={() => { if (kk === "⌫") setPin((p) => p.slice(0, -1)); else if (digit) setPin((p) => (p.length < 6 ? p + kk : p)); }}
                style={{ width: 82, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center",
                  backgroundColor: digit ? th.glassFill(0.12) : "transparent", borderWidth: 1, borderColor: digit ? th.glass(0.22) : "transparent", boxShadow: th.glassFx }}>
                <T w="light" size={24}>{kk}</T>
              </PressScale>
            );
          })}
        </View>
      </FormScreen>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: th.base, backgroundImage: th.bgCss }}>
      <StepView key={step} leaving={leaving} onLeft={onLeft}>
        {screen}
      </StepView>
    </View>
  );
}
