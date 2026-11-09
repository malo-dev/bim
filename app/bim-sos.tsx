/**
 * BIM SOS (design BIM NEXT) : alertes Sécurité (3 niveaux) et Santé, position GPS jointe.
 * Même logique : sendUserSOS { category, type, subType?, caseLocation?, contactPhone?, latitude, longitude }.
 */
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, View } from "react-native";
import { BimIcon, BimIconName } from "@/components/bim/icons";
import { useTh } from "@/components/bim/theme";
import { Appear, BimPage, Glass, PillButton, PressScale, Pulse, Segmented, SlideButton, StatusOverlay, T, TextField } from "@/components/bim/ui";
import { useSendUserSOSMutation } from "@/services/authService";

const SECURITY: { type: "suspect" | "urgence" | "secours"; icon: BimIconName; label: string; sub: string; color: string }[] = [
  { type: "suspect", icon: "eye", label: "Suspect", sub: "Je remarque quelque chose d'anormal", color: "#F5C518" },
  { type: "urgence", icon: "warning", label: "Urgence", sub: "Problème sérieux, j'ai besoin d'aide", color: "#FF8A3D" },
  { type: "secours", icon: "bell", label: "Au secours !", sub: "Cas grave, intervention immédiate", color: "#E01E2B" },
];
const HEALTH: { key: "ebola" | "cas_suspect" | "autre"; label: string }[] = [
  { key: "ebola", label: "Ebola" }, { key: "cas_suspect", label: "Cas suspect de maladie" }, { key: "autre", label: "Autre urgence médicale" },
];

export default function BimSOSScreen() {
  const th = useTh();
  const router = useRouter();
  const [sendUserSOS] = useSendUserSOSMutation();
  const [tab, setTab] = useState<"securite" | "sante">("securite");
  const [sub, setSub] = useState<"ebola" | "cas_suspect" | "autre" | null>(null);
  const [place, setPlace] = useState("");
  const [contact, setContact] = useState("");
  const [phase, setPhase] = useState<"idle" | "proc" | "done">("idle");

  const position = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return { latitude: null, longitude: null };
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return { latitude: p.coords.latitude, longitude: p.coords.longitude };
    } catch { return { latitude: null, longitude: null }; }
  };

  const send = async (body: any) => {
    setPhase("proc");
    const pos = await position();
    try { await sendUserSOS({ ...body, ...pos }).unwrap(); setPhase("done"); }
    catch { setPhase("idle"); Alert.alert("Envoi impossible", "L'alerte SOS n'a pas pu être envoyée. Vérifie ta connexion et réessaie."); }
  };

  const security = (o: (typeof SECURITY)[number]) =>
    Alert.alert(`Alerte « ${o.label} »`, "Envoyer cette alerte à BIM NEXT ? Ta position GPS sera jointe.", [
      { text: "Annuler", style: "cancel" },
      { text: "Envoyer", style: "destructive", onPress: () => send({ category: "securite", type: o.type }) },
    ]);
  const health = () => {
    if (!sub) { Alert.alert("Type requis", "Choisis le type d'urgence médicale."); return; }
    return send({ category: "sante", type: "sante", subType: sub, caseLocation: place.trim() || null, contactPhone: contact.trim() || null });
  };

  return (
    <BimPage title="BIM SOS"
      overlay={phase !== "idle" && (
        <StatusOverlay phase={phase} title={phase === "done" ? "Alerte envoyée" : "Envoi de l'alerte…"}
          text={phase === "done" ? "BIM NEXT a été prévenu et va intervenir. Reste en sécurité." : "On récupère ta position et on prévient BIM NEXT."}>
          <PillButton variant="accent" label="OK" onPress={() => router.back()} />
        </StatusOverlay>
      )}>
      <Appear kind="pop" delay={60} style={{ alignItems: "center", marginTop: 24 }}>
        <View style={{ width: 96, height: 96, alignItems: "center", justifyContent: "center" }}>
          <Pulse size={96} radar />
          <View style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: th.knob, alignItems: "center", justifyContent: "center", boxShadow: "0 10px 28px rgba(224,30,43,0.5)" }}>
            <BimIcon name="shield" size={34} color="#FFFFFF" strokeWidth={1.8} />
          </View>
        </View>
        <T w="bold" size={22} style={{ marginTop: 14 }}>Urgences et santé</T>
        <T size={14} color={th.muted} style={{ marginTop: 4 }}>BIM NEXT intervient immédiatement</T>
        <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 28, borderRadius: 14, backgroundColor: th.glass(0.14) }}>
          <BimIcon name="pin" size={13} color={th.fg} />
          <T size={12}>Position GPS jointe automatiquement</T>
        </View>
      </Appear>

      <View style={{ marginTop: 20 }}>
        <Segmented height={46} items={[{ key: "securite", label: "Sécurité" }, { key: "sante", label: "Santé" }]} value={tab} onChange={setTab} />
      </View>

      {tab === "securite" ? (
        <Appear key="sec" kind="rise">
          <T size={13} color={th.muted} style={{ marginTop: 14, textAlign: "center", lineHeight: 19 }}>Touche un bouton pour envoyer une alerte immédiate.</T>
          <View style={{ marginTop: 12, gap: 10 }}>
            {SECURITY.map((o) => (
              <PressScale key={o.type} scaleTo={0.97} onPress={() => security(o)} accessibilityLabel={`Alerte ${o.label}`}
                style={{ minHeight: 76, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, borderRadius: 26,
                  backgroundColor: th.glassFill(0.14), borderWidth: 1.5, borderColor: o.color + "AA", boxShadow: th.glassFx }}>
                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: o.color, alignItems: "center", justifyContent: "center" }}>
                  <BimIcon name={o.icon} size={24} color="#FFFFFF" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <T w="bold" size={17}>{o.label}</T>
                  <T size={13} color={th.muted}>{o.sub}</T>
                </View>
                <BimIcon name="chevron" size={18} color={th.muted} />
              </PressScale>
            ))}
          </View>
        </Appear>
      ) : (
        <Appear key="san" kind="rise">
          <Glass a={0.12} b={0.2} radius={24} style={{ marginTop: 16, padding: 14, gap: 10 }}>
            <T w="bold" size={14}>Type d'urgence médicale</T>
            {HEALTH.map((h) => {
              const on = sub === h.key;
              return (
                <PressScale key={h.key} scaleTo={0.98} onPress={() => setSub(h.key)} accessibilityLabel={h.label}
                  style={{ height: 52, borderRadius: 26, borderWidth: on ? 2 : 1, borderColor: on ? th.fg : th.glass(0.22), backgroundColor: on ? th.glass(0.2) : th.glass(0.08),
                    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: th.fg, alignItems: "center", justifyContent: "center" }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: on ? th.fg : "transparent" }} />
                  </View>
                  <T w={on ? "bold" : "regular"} size={15}>{h.label}</T>
                </PressScale>
              );
            })}
            <View style={{ marginTop: 4 }}><TextField id="sos-place" label="Où se trouve le cas ? (facultatif)" icon="pin" value={place} onChange={setPlace} placeholder="Quartier, avenue, repère…" /></View>
            <TextField id="sos-phone" label="Numéro à contacter (facultatif)" icon="phone" value={contact} onChange={setContact} keyboardType="phone-pad" placeholder="+243 …" />
          </Glass>
          <View style={{ marginTop: 18 }}>
            <SlideButton variant="accent" label="Envoyer l'alerte santé" icon="send" onDone={health} />
          </View>
        </Appear>
      )}
    </BimPage>
  );
}
