/**
 * Transfert d'Ecoins entre membres (maquette).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BimIcon } from "@/components/bim/icons";
import { F, ec, useTh } from "@/components/bim/theme";
import { AmountChips, Appear, BimBackground, Glass, Header, Ink, PillButton, PressScale, SectionLabel, SlideButton, StatusOverlay, Swap, T, TextField } from "@/components/bim/ui";
import { useCreateTransfertMutation } from "@/services/tsxService";
import { useGetAllUsersQuery, useGetUserByIdQuery } from "@/services/userService";
import { normalizeDecimal } from "@/utils/normalizeDecimal.util";

type Member = { id: string | number; username: string; telephone?: string; accountNumber?: string };
const display = (u: Member) => (u.username && !u.username.startsWith("quick_") ? u.username : u.telephone || `Membre ${u.accountNumber ?? u.id}`);

export default function TransfertScreen() {
  const th = useTh();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ targetId?: string; targetName?: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const [amount, setAmount] = useState("10");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<Member | null>(params.targetId ? { id: params.targetId, username: params.targetName ?? "" } : null);
  const [phase, setPhase] = useState<"idle" | "proc" | "done">("idle");
  const [createTransfert] = useCreateTransfertMutation();

  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);
  useEffect(() => { const t = setTimeout(() => setDebounced(query.trim()), 350); return () => clearTimeout(t); }, [query]);
  const { data: usersData, isFetching } = useGetAllUsersQuery({ paginate: false, search: debounced }, { skip: debounced.length < 2 });
  const { data: me } = useGetUserByIdQuery(userId!, { skip: !userId });
  const results: Member[] = ((usersData?.data ?? usersData ?? []) as Member[]).filter((u) => String(u.id) !== String(userId)).slice(0, 6);

  const amt = Number(normalizeDecimal(amount || "0")) || 0;

  const send = async () => {
    if (!selected) { Alert.alert("Destinataire", "Choisis le membre à qui envoyer les Ecoins."); return; }
    if (amt <= 0) { Alert.alert("Montant", "Entre un montant supérieur à 0."); return; }
    if (me && amt > Number(me.soldNumber ?? 0)) { Alert.alert("Solde insuffisant", `Ton solde est de ${ec(me.soldNumber)} EC.`); return; }
    if (me && me.hasActiveSubscription === false) { Alert.alert("Abonnement", "Fais une recharge pour activer ton abonnement avant de transférer."); return; }
    setPhase("proc");
    try {
      await createTransfert({ amount: normalizeDecimal(amount), targetId: selected.id, id: userId }).unwrap();
      setTimeout(() => setPhase("done"), 600);
    } catch (err: any) {
      setPhase("idle");
      Alert.alert("Transfert impossible", err?.data?.message || "Une erreur est survenue lors du transfert.");
    }
  };

  const again = () => { setPhase("idle"); setSelected(null); setQuery(""); setAmount("10"); };

  return (
    <BimBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingTop: 28 + insets.top, paddingHorizontal: 24, paddingBottom: 44 + insets.bottom }} showsVerticalScrollIndicator={false}>
          <Header title="Transfert" backLabel="Retour à l'accueil" onBack={() => router.back()} />

          <Appear kind="pop" delay={60} style={{ alignSelf: "center", marginTop: 24 }}>
            <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: th.glassFill(0.14), borderWidth: 1, borderColor: th.glass(0.24), alignItems: "center", justifyContent: "center", boxShadow: th.glassFx }}>
              <Swap><BimIcon name="transfer" size={34} color={th.fg} strokeWidth={1.7} /></Swap>
            </View>
          </Appear>
          <T size={15} color={th.muted} style={{ marginTop: 12, textAlign: "center" }}>Envoie des Ecoins à un membre BIMNEXT</T>

          <Appear kind="rise" delay={120}>
            <Glass a={0.12} b={0.2} radius={16} style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 14 }}>
              <BimIcon name="info" size={18} color={th.fg} />
              <T size={13} style={{ flex: 1, lineHeight: 19 }}>Les transferts entre membres sont instantanés et sans frais.</T>
            </Glass>
          </Appear>

          <SectionLabel style={{ marginTop: 20 }}>MONTANT À ENVOYER</SectionLabel>
          <View style={{ marginTop: 6, flexDirection: "row", alignItems: "baseline", gap: 10 }}>
            <T w="light" size={20}>EC</T>
            <TextInput value={amount} onChangeText={(v) => setAmount(v.replace(/[^\d.,]/g, ""))} keyboardType="decimal-pad" accessibilityLabel="Montant à envoyer"
              style={{ flex: 1, fontFamily: F.bold, fontSize: 46, color: th.fg, paddingVertical: 0, letterSpacing: -0.9 }} />
          </View>
          <View style={{ marginTop: 10 }}><AmountChips values={[5, 10, 20, 50]} value={amt} onPick={(n) => setAmount(String(n))} /></View>

          <SectionLabel style={{ marginTop: 20, marginBottom: 8 }}>DESTINATAIRE</SectionLabel>
          {selected ? (
            <Appear kind="rise">
              <Glass a={0.16} b={0.24} radius={18} style={{ height: 56, flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 6, paddingRight: 8 }}>
                <Ink size={44} icon="user" iconSize={20} />
                <T w="bold" size={16} numberOfLines={1} style={{ flex: 1 }}>{display(selected) || "Membre BIMNEXT"}</T>
                <PressScale onPress={() => setSelected(null)} accessibilityLabel="Changer de destinataire"
                  style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: th.glass(0.16) }}>
                  <BimIcon name="close" size={16} color={th.fg} strokeWidth={2.2} />
                </PressScale>
              </Glass>
            </Appear>
          ) : (
            <>
              <TextField id="tr-dest" label="Destinataire" hideLabel icon="search" value={query} onChange={setQuery} placeholder="Nom ou numéro d'un membre" />
              {debounced.length >= 2 && (
                <Glass a={0.12} b={0.2} radius={18} style={{ marginTop: 8, overflow: "hidden" }}>
                  {isFetching && results.length === 0 && <T size={14} color={th.muted} style={{ padding: 14 }}>Recherche…</T>}
                  {!isFetching && results.length === 0 && <T size={14} color={th.muted} style={{ padding: 14 }}>Aucun membre trouvé.</T>}
                  {results.map((u, i) => (
                    <PressScale key={String(u.id)} onPress={() => { setSelected(u); setQuery(""); }} accessibilityLabel={display(u)}
                      style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, height: 56, borderTopWidth: i ? 1 : 0, borderTopColor: th.glass(0.12) }}>
                      <Ink size={36} icon="user" iconSize={16} />
                      <View style={{ flex: 1 }}>
                        <T w="bold" size={15} numberOfLines={1}>{display(u)}</T>
                        {!!u.telephone && <T size={12} color={th.muted}>{u.telephone}</T>}
                      </View>
                    </PressScale>
                  ))}
                </Glass>
              )}
            </>
          )}

          <View style={{ marginTop: "auto", paddingTop: 24 }}>
            <SlideButton variant="accent" label={`Envoyer ${ec(amt)} EC`} onDone={send} />
            <T size={12} color={th.muted} style={{ marginTop: 12, textAlign: "center" }}>Transfert sécurisé et instantané · BIMNEXT</T>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {phase !== "idle" && (
        <StatusOverlay phase={phase} title={phase === "done" ? "Ecoins envoyés !" : "Envoi en cours…"}
          text={phase === "done" ? `${ec(amt)} EC sont arrivés chez ${selected ? display(selected) : "ton destinataire"}. Sans frais.` : "On sécurise ton transfert."}>
          <PillButton variant="accent" label="Retour à l'accueil" onPress={() => router.replace("/(tabs)" as any)} />
          <PillButton label="Nouveau transfert" onPress={again} />
        </StatusOverlay>
      )}
    </BimBackground>
  );
}
