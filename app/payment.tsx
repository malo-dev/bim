/**
 * Payer un partenaire (design BIM NEXT) : montant, adresse + téléphone de livraison, confirmation animée.
 * Même logique : createPaiement { amount, companyId, shippingAddress, clientPhone, notes, paymentMethod, id, productId }.
 * Les infos de livraison restent obligatoires (sinon la commande créée n'est pas livrable).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, TextInput, View } from "react-native";
import { BimIcon } from "@/components/bim/icons";
import { F, ec, useTh } from "@/components/bim/theme";
import {
  AmountChips, Appear, BimPage, DEFAULT_COUNTRY, Glass, InfoRow, PhoneField, PillButton, SectionLabel, SlideButton, StatusOverlay, T, TextField,
} from "@/components/bim/ui";
import { useCreatePaiementMutation } from "@/services/tsxService";
import { useGetUserByIdQuery } from "@/services/userService";
import { normalizeDecimal } from "@/utils/normalizeDecimal.util";

export default function Payment() {
  const th = useTh();
  const router = useRouter();
  const { productId, companyId } = useLocalSearchParams<{ productId?: string; companyId?: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<"idle" | "proc" | "done">("idle");
  const [createPaiement] = useCreatePaiementMutation();

  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);
  const { data: user } = useGetUserByIdQuery(userId!, { skip: !userId });
  useEffect(() => {
    if (!user) return;
    if (!address && user.adresse) setAddress(user.adresse);
    if (!phone && user.telephone) setPhone(String(user.telephone).replace(/^\+\d{3}/, ""));
  }, [user]);

  const amt = Number(normalizeDecimal(amount || "0")) || 0;

  const pay = async () => {
    if (amt <= 0) { Alert.alert("Montant manquant", "Entre un montant valide."); return; }
    if (!userId) { Alert.alert("Erreur", "Reconnecte-toi puis réessaie."); return; }
    if (!address.trim() || phone.replace(/\s/g, "").length < 8) { Alert.alert("Livraison", "Indique ton adresse et ton numéro pour la livraison."); return; }
    if (user && Number(user.soldNumber ?? 0) < amt) { Alert.alert("Solde insuffisant", `Ton solde est de ${ec(user.soldNumber)} EC. Recharge ton compte.`); return; }
    setPhase("proc");
    try {
      await createPaiement({
        amount: amt, companyId: Number(companyId), shippingAddress: address.trim(),
        clientPhone: `${country.code}${phone.replace(/\s/g, "")}`, notes: "Paiement produit", paymentMethod: "BIM NEXT APP",
        id: Number(userId), productId: Number(productId),
      }).unwrap();
      setPhase("done");
    } catch (err: any) {
      setPhase("idle");
      Alert.alert("Paiement échoué", err?.data?.message || "Une erreur est survenue. Réessaie.");
    }
  };

  return (
    <BimPage title="Payer un partenaire"
      overlay={phase !== "idle" && (
        <StatusOverlay phase={phase} title={phase === "done" ? "Paiement réussi !" : "Paiement en cours…"}
          text={phase === "done" ? `${ec(amt)} EC payés avec BIM NEXT. Ta commande est en préparation.` : "On sécurise ton paiement."}>
          <PillButton variant="accent" label="Suivre mes commandes" onPress={() => router.replace("/commandes" as any)} />
          <PillButton label="Retour à l'accueil" onPress={() => router.replace("/(tabs)" as any)} />
        </StatusOverlay>
      )}>
      <Appear kind="pop" delay={60} style={{ alignSelf: "center", marginTop: 22 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: th.glassFill(0.14), borderWidth: 1, borderColor: th.glass(0.24), alignItems: "center", justifyContent: "center", boxShadow: th.glassFx }}>
          <BimIcon name="wallet" size={34} color={th.fg} strokeWidth={1.7} />
        </View>
      </Appear>
      <T size={15} color={th.muted} style={{ marginTop: 12, textAlign: "center" }}>Paie un partenaire BIM avec tes Ecoins</T>

      <View style={{ marginTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <SectionLabel>MONTANT À PAYER</SectionLabel>
        <T size={12} color={th.muted}>Solde : {ec(user?.soldNumber)} EC</T>
      </View>
      <View style={{ marginTop: 6, flexDirection: "row", alignItems: "baseline", gap: 10 }}>
        <T w="light" size={20}>EC</T>
        <TextInput value={amount} onChangeText={(v) => setAmount(v.replace(/[^\d.,]/g, ""))} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={th.glass(0.4)}
          accessibilityLabel="Montant à payer" style={{ flex: 1, fontFamily: F.bold, fontSize: 46, color: th.fg, paddingVertical: 0, letterSpacing: -0.9, includeFontPadding: false }} />
      </View>
      <View style={{ marginTop: 10 }}><AmountChips values={[5, 10, 20, 50]} value={amt} onPick={(n) => setAmount(String(n))} /></View>

      <SectionLabel style={{ marginTop: 20 }}>LIVRAISON</SectionLabel>
      <Glass a={0.12} b={0.2} radius={24} style={{ marginTop: 8, padding: 14, gap: 14 }}>
        <TextField id="pay-address" label="Adresse de livraison" icon="pin" value={address} onChange={setAddress} placeholder="Quartier, avenue, référence…" />
        <PhoneField id="pay-phone" label="Numéro pour la livraison" value={phone} onChange={setPhone} country={country} setCountry={setCountry} />
      </Glass>

      {amt > 0 && (
        <Appear kind="rise">
          <Glass a={0.12} b={0.2} radius={22} style={{ marginTop: 14, paddingHorizontal: 16, paddingVertical: 2 }}>
            <InfoRow label="Montant" value={`${ec(amt)} EC`} />
            <InfoRow label="Moyen" value="Solde BIM NEXT" />
            <InfoRow label="Total" value={`${ec(amt)} EC`} strong last />
          </Glass>
        </Appear>
      )}

      <View style={{ marginTop: "auto", paddingTop: 22 }}>
        <SlideButton variant="accent" label={amt > 0 ? `Payer ${ec(amt)} EC` : "Payer"} onDone={pay} />
        <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <BimIcon name="lock" size={13} color={th.muted} strokeWidth={2} />
          <T size={12} color={th.muted}>Paiement sécurisé · BIM NEXT</T>
        </View>
      </View>
    </BimPage>
  );
}
