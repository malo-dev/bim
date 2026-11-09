/**
 * Questions fréquentes (design BIM NEXT) : recherche, catégories, réponses dépliables animées.
 */
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, TextInput, View } from "react-native";
import { BimIcon } from "@/components/bim/icons";
import { F, useTh } from "@/components/bim/theme";
import { Appear, BimPage, EmptyState, FilterChips, Glass, PageTitle, PillButton, PressScale, T } from "@/components/bim/ui";

type Cat = "Tout" | "Compte" | "Argent" | "Commandes" | "Sécurité" | "Support";
const CATS: { key: Cat; label: string }[] = ["Tout", "Compte", "Argent", "Commandes", "Sécurité", "Support"].map((k) => ({ key: k as Cat, label: k }));
const FAQS: { id: string; cat: Cat; q: string; a: string; popular?: boolean }[] = [
  { id: "1", cat: "Argent", popular: true, q: "Comment recharger mon compte ?", a: "Sur l'accueil, touche « Recharger ». Choisis Automatique (crédit immédiat avec Airtel Money, Orange Money, M-Pesa ou une carte Visa) ou Manuelle (un agent BIM crédite ton compte), puis la devise, le montant et ton numéro." },
  { id: "2", cat: "Argent", q: "Comment envoyer des Ecoins à un ami ?", a: "Touche « Transfert » sur l'accueil, cherche ton ami par son nom ou son numéro, choisis le montant et glisse le bouton. Le transfert est instantané et sans frais." },
  { id: "3", cat: "Argent", q: "Comment retirer de l'argent ?", a: "Va dans Réglages › Retrait. Indique le montant, la devise que tu veux recevoir et le numéro de compte de l'agent BIM : il te remet l'argent en espèces." },
  { id: "4", cat: "Argent", q: "Puis-je annuler une transaction ?", a: "Non : les transferts sont instantanés, une transaction validée ne peut pas être annulée. Vérifie toujours le destinataire avant de confirmer." },
  { id: "5", cat: "Commandes", popular: true, q: "Comment commander de l'eau, du gaz ou du carburant ?", a: "Sur l'accueil, touche « Eau, gaz, carburant », choisis la catégorie, puis le produit, la quantité et le paiement (Ecoins, Mobile Money ou espèces à la livraison)." },
  { id: "6", cat: "Commandes", q: "Comment suivre ma commande ?", a: "Une carte « Commande en cours » apparaît sur l'accueil : touche « Suivre ». Tu retrouves aussi toutes tes commandes dans « Mes commandes »." },
  { id: "7", cat: "Compte", q: "Comment modifier mon profil ?", a: "Dans Profil, touche « Modifier mon profil » pour changer ta photo, ton nom, ton e-mail, ton téléphone ou ton adresse." },
  { id: "8", cat: "Compte", q: "Comment changer les couleurs de l'app ?", a: "Dans Profil › Thème, choisis parmi les thèmes : BIM NEXT, Blanc, Graphite et d'autres. Le changement est immédiat." },
  { id: "9", cat: "Compte", q: "Comment supprimer mon compte ?", a: "Dans Profil, touche « Supprimer mon compte » en bas de la page et confirme avec ton mot de passe. Toutes tes données sont effacées définitivement." },
  { id: "10", cat: "Sécurité", q: "Comment sécuriser mon compte ?", a: "Choisis un mot de passe que toi seul connais dans Profil › Sécurité et mot de passe, et ne le partage jamais, même avec un agent BIM." },
  { id: "11", cat: "Sécurité", q: "J'ai oublié mon mot de passe", a: "Sur l'écran de connexion, touche « Mot de passe oublié » et suis les étapes. En cas de difficulté, contacte le support BIM." },
  { id: "12", cat: "Support", q: "Comment contacter le support ?", a: "Va dans Réglages › Aide et support : choisis un sujet, décris ton problème et ajoute une capture si besoin. L'équipe te répond par e-mail." },
];

function Item({ f, open, onToggle }: { f: (typeof FAQS)[number]; open: boolean; onToggle: () => void }) {
  const th = useTh();
  const v = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => { Animated.timing(v, { toValue: open ? 1 : 0, duration: 260, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }).start(); }, [open]);
  return (
    <PressScale scaleTo={0.98} onPress={onToggle} accessibilityLabel={f.q}
      style={{ padding: 16, borderRadius: 22, backgroundColor: th.glassFill(open ? 0.18 : 0.12), borderWidth: 1, borderColor: open ? th.glass(0.4) : th.glass(0.2), boxShadow: th.glassFx }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <T w="bold" size={15} style={{ flex: 1, lineHeight: 21 }}>{f.q}</T>
        <Animated.View style={{ transform: [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ["90deg", "270deg"] }) }] }}>
          <BimIcon name="chevron" size={18} color={th.fg} strokeWidth={2} />
        </Animated.View>
      </View>
      {open && (
        <Appear kind="fade" duration={260}>
          <T size={14} color={th.muted} style={{ marginTop: 10, lineHeight: 21 }}>{f.a}</T>
          {f.popular && <View style={{ marginTop: 10, alignSelf: "flex-start", paddingHorizontal: 8, height: 20, borderRadius: 10, backgroundColor: th.knob, justifyContent: "center" }}><T w="bold" size={10} color="#FFFFFF">POPULAIRE</T></View>}
        </Appear>
      )}
    </PressScale>
  );
}

export default function FAQScreen() {
  const th = useTh();
  const router = useRouter();
  const [open, setOpen] = useState<string | null>("1");
  const [cat, setCat] = useState<Cat>("Tout");
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const list = FAQS.filter((f) => (cat === "Tout" || f.cat === cat) && (q.length < 2 || `${f.q} ${f.a}`.toLowerCase().includes(q)));

  return (
    <BimPage title="Questions fréquentes">
      <PageTitle light="Comment pouvons-nous" bold="t'aider ?" />
      <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 10, height: 52, borderRadius: 26, paddingHorizontal: 16,
        backgroundColor: th.glassFill(0.12), borderWidth: 1, borderColor: th.glass(0.22), boxShadow: th.glassFx }}>
        <BimIcon name="search" size={18} color={th.muted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Rechercher une réponse" placeholderTextColor={th.glass(0.55)}
          accessibilityLabel="Rechercher une réponse" style={{ flex: 1, color: th.fg, fontFamily: F.regular, fontSize: 15, includeFontPadding: false }} />
        {!!search && <PressScale onPress={() => setSearch("")} accessibilityLabel="Effacer"><BimIcon name="close" size={16} color={th.muted} /></PressScale>}
      </View>
      <View style={{ marginTop: 12 }}><FilterChips items={CATS} value={cat} onChange={setCat} /></View>

      {list.length === 0 ? <EmptyState icon="search" title="Aucun résultat" text="Essaie un autre mot ou contacte le support." /> : (
        <View style={{ marginTop: 14, gap: 10 }}>
          {list.map((f, i) => (
            <Appear key={f.id} kind="rise" delay={Math.min(i, 6) * 50}>
              <Item f={f} open={open === f.id} onToggle={() => setOpen(open === f.id ? null : f.id)} />
            </Appear>
          ))}
        </View>
      )}

      <Glass a={0.12} b={0.2} radius={24} style={{ marginTop: 20, padding: 16, alignItems: "center", gap: 6 }}>
        <BimIcon name="message" size={26} color={th.fg} />
        <T w="bold" size={16}>Pas trouvé ta réponse ?</T>
        <T size={13} color={th.muted} style={{ textAlign: "center" }}>L'équipe BIM NEXT te répond par e-mail.</T>
        <PillButton variant="accent" label="Contacter le support" onPress={() => router.push("/support" as any)} style={{ alignSelf: "stretch", marginTop: 8 }} />
      </Glass>
    </BimPage>
  );
}
