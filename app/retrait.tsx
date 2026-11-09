/**
 * Retrait (design BIM NEXT) : montant, devise remise en espèces, agent BIM, confirmation animée.
 * Même logique : POST retrait (useCreateRetraitMutation) { amount, accountNumber, id, currency }.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, TextInput, View } from "react-native";
import { BimIcon } from "@/components/bim/icons";
import { F, ec, useTh } from "@/components/bim/theme";
import {
  AmountChips, Appear, BimPage, Glass, InfoRow, PillButton, PressScale, SectionLabel, Segmented, SlideButton, StatusOverlay, T, TextField,
} from "@/components/bim/ui";
import axiosInstance from "@/services/axiosInstance";
import { useCreateRetraitMutation } from "@/services/tsxService";
import { useGetUserByIdQuery } from "@/services/userService";
import { normalizeDecimal } from "@/utils/normalizeDecimal.util";

export default function RetraitScreen() {
  const th = useTh();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [amount, setAmount] = useState("10");
  const [currency, setCurrency] = useState<"USD" | "CDF">("USD");
  const [agent, setAgent] = useState("");
  const [rate, setRate] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "proc" | "done">("idle");
  const [doneMsg, setDoneMsg] = useState("");
  const [createRetrait] = useCreateRetraitMutation();

  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);
  const { data: user, refetch } = useGetUserByIdQuery(userId!, { skip: !userId });
  useEffect(() => {
    axiosInstance.get("/currency").then(({ data }) => {
      const cdf = (data?.data || []).find((c: any) => c.code === "CDF");
      if (cdf?.rate) setRate(Number(cdf.rate));
    }).catch(() => {});
  }, []);

  const amt = Number(normalizeDecimal(amount || "0")) || 0;
  const cash = useMemo(() => (currency === "CDF" && rate ? amt * rate : null), [amt, currency, rate]);

  const confirm = async () => {
    if (amt <= 0) { Alert.alert("Montant manquant", "Indique le montant à retirer."); return; }
    if (agent.replace(/\s/g, "").length < 4) { Alert.alert("Agent manquant", "Entre le numéro de compte de l'agent BIM."); return; }
    if (!userId) { Alert.alert("Erreur", "Utilisateur introuvable. Reconnecte-toi."); return; }
    if (currency === "CDF" && !rate) { Alert.alert("Taux indisponible", "Le taux du franc n'est pas disponible. Réessaie en USD."); return; }
    if (user && Number(user.soldNumber ?? 0) < amt) { Alert.alert("Solde insuffisant", `Ton solde est de ${ec(user.soldNumber)} EC.`); return; }
    setPhase("proc");
    try {
      const res: any = await createRetrait({ amount: normalizeDecimal(amount), accountNumber: agent.replace(/\s/g, ""), id: userId, currency }).unwrap();
      setDoneMsg(res?.currency === "CDF" && res?.convertedAmount
        ? `Retrait de ${ec(amt)} EC validé. L'agent te remet ${Number(res.convertedAmount).toLocaleString("fr-FR")} FC.`
        : `Retrait de ${ec(amt)} EC validé. L'agent te remet ${ec(amt)} USD.`);
      setPhase("done");
      refetch();
    } catch (err: any) {
      setPhase("idle");
      Alert.alert("Retrait échoué", err?.data?.message || "Une erreur est survenue lors du retrait.");
    }
  };
  const again = () => { setPhase("idle"); setAmount("10"); setAgent(""); setCurrency("USD"); };

  return (
    <BimPage title="Retrait" overlay={phase !== "idle" && (
        <StatusOverlay phase={phase} title={phase === "done" ? "Retrait réussi !" : "Retrait en cours…"} text={phase === "done" ? doneMsg : "On valide ton retrait avec l'agent."}>
          <PillButton variant="accent" label="Retour à l'accueil" onPress={() => router.replace("/(tabs)" as any)} />
          <PillButton label="Nouveau retrait" onPress={again} />
        </StatusOverlay>
      )}>
      <Appear kind="pop" delay={60} style={{ alignSelf: "center", marginTop: 22 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: th.glassFill(0.14), borderWidth: 1, borderColor: th.glass(0.24), alignItems: "center", justifyContent: "center", boxShadow: th.glassFx }}>
          <BimIcon name="download" size={34} color={th.fg} strokeWidth={1.7} />
        </View>
      </Appear>
      <T size={15} color={th.muted} style={{ marginTop: 12, textAlign: "center" }}>Retire tes Ecoins en espèces chez un agent BIM</T>

      <Appear kind="rise" delay={120}>
        <Glass a={0.12} b={0.2} radius={16} style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 14 }}>
          <BimIcon name="info" size={18} color={th.fg} />
          <T size={13} style={{ flex: 1, lineHeight: 19 }}>Présente-toi chez un agent BIM agréé et demande-lui son numéro de compte.</T>
        </Glass>
      </Appear>

      <View style={{ marginTop: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <SectionLabel>MONTANT À RETIRER</SectionLabel>
        <T size={12} color={th.muted}>Solde : {ec(user?.soldNumber)} EC</T>
      </View>
      <View style={{ marginTop: 6, flexDirection: "row", alignItems: "baseline", gap: 10 }}>
        <T w="light" size={20}>EC</T>
        <TextInput value={amount} onChangeText={(v) => setAmount(v.replace(/[^\d.,]/g, ""))} keyboardType="decimal-pad" accessibilityLabel="Montant à retirer"
          style={{ flex: 1, fontFamily: F.bold, fontSize: 46, color: th.fg, paddingVertical: 0, letterSpacing: -0.9, includeFontPadding: false }} />
      </View>
      <View style={{ marginTop: 10 }}><AmountChips values={[5, 10, 20, 50]} value={amt} onPick={(n) => setAmount(String(n))} /></View>

      <SectionLabel style={{ marginTop: 18 }}>JE REÇOIS EN</SectionLabel>
      <View style={{ marginTop: 8 }}>
        <Segmented height={44} items={[{ key: "USD", label: "Dollar (USD)" }, { key: "CDF", label: "Franc (CDF)" }]} value={currency} onChange={setCurrency} />
      </View>

      <SectionLabel style={{ marginTop: 18, marginBottom: 8 }}>AGENT BIM</SectionLabel>
      <TextField id="rt-agent" label="Numéro de compte de l'agent" hideLabel icon="user" value={agent} onChange={setAgent} keyboardType="numeric" placeholder="Numéro de compte de l'agent" />

      {amt > 0 && (
        <Appear kind="rise">
          <Glass a={0.12} b={0.2} radius={22} style={{ marginTop: 14, paddingHorizontal: 16, paddingVertical: 2 }}>
            <InfoRow label="Débité de ton solde" value={`${ec(amt)} EC`} strong />
            <InfoRow label="Tu reçois en espèces" value={currency === "CDF" ? (cash != null ? `${Math.round(cash).toLocaleString("fr-FR")} FC` : "Taux en attente…") : `${ec(amt)} USD`} strong />
            <InfoRow label="Frais" value="Aucun" last />
          </Glass>
        </Appear>
      )}

      <View style={{ marginTop: "auto", paddingTop: 22 }}>
        <SlideButton variant="accent" label={`Retirer ${ec(amt)} EC`} onDone={confirm} />
        <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <BimIcon name="lock" size={13} color={th.muted} strokeWidth={2} />
          <T size={12} color={th.muted}>Opération sécurisée · BIM NEXT</T>
        </View>
      </View>

    </BimPage>
  );
}
