/**
 * Aide et support (design BIM NEXT) : sujet, e-mail, message, capture facultative → ticket.
 * Même logique : POST /support_track/create (multipart : email, description, id, sujet, image?).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, TextInput, View } from "react-native";
import { API_URL_BASE } from "@/constants/api";
import { BimIcon, BimIconName } from "@/components/bim/icons";
import { F, useTh } from "@/components/bim/theme";
import { Appear, BimPage, PageTitle, PillButton, PressScale, SectionLabel, SlideButton, StatusOverlay, T, TextField } from "@/components/bim/ui";
import { useGetUserByIdQuery } from "@/services/userService";

const TOPICS: { label: string; icon: BimIconName }[] = [
  { label: "Problème de connexion", icon: "lock" },
  { label: "Recharger mon compte", icon: "recharge" },
  { label: "Transfert Ecoins", icon: "transfer" },
  { label: "Commande ou livraison", icon: "box" },
  { label: "Autres questions", icon: "message" },
];

export default function SupportScreen() {
  const th = useTh();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "proc" | "done">("idle");

  useEffect(() => { AsyncStorage.multiGet(["userId", "token"]).then(([[, id], [, tk]]) => { setUserId(id); setToken(tk); }); }, []);
  const { data: user } = useGetUserByIdQuery(userId!, { skip: !userId });
  useEffect(() => {
    const e = user?.email && !String(user.email).startsWith("quick_") ? user.email : user?.notificationEmail;
    if (e && !email) setEmail(e);
  }, [user]);

  const pick = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert("Autorisation refusée", "Autorise l'accès à tes photos pour joindre une capture."); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!r.canceled) setImage(r.assets[0].uri);
  };

  const send = async () => {
    if (!topic || !message.trim() || !email.trim()) { Alert.alert("Champs manquants", "Choisis un sujet, indique ton e-mail et décris ton problème."); return; }
    setPhase("proc");
    try {
      const fd = new FormData();
      fd.append("email", email.trim());
      fd.append("description", message.trim());
      fd.append("id", String(userId));
      fd.append("sujet", topic);
      if (image) {
        const name = image.split("/").pop() ?? `photo_${Date.now()}.jpg`;
        fd.append("image", { uri: image, name, type: `image/${/\.(\w+)$/.exec(name)?.[1] ?? "jpeg"}` } as any);
      }
      const res = await fetch(`${API_URL_BASE}/api/v1/support_track/create`, { method: "POST", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Erreur lors de l'envoi du ticket.");
      setPhase("done");
    } catch (e: any) {
      setPhase("idle");
      Alert.alert("Envoi impossible", e?.message || "Erreur réseau. Vérifie ta connexion et réessaie.");
    }
  };
  const again = () => { setPhase("idle"); setTopic(null); setMessage(""); setImage(null); };

  return (
    <BimPage title="Aide et support"
      overlay={phase !== "idle" && (
        <StatusOverlay phase={phase} title={phase === "done" ? "Ticket envoyé !" : "Envoi en cours…"}
          text={phase === "done" ? "Merci ! L'équipe BIM NEXT te répond par e-mail dès que possible." : "On transmet ton message à l'équipe."}>
          <PillButton variant="accent" label="Retour" onPress={() => router.back()} />
          <PillButton label="Envoyer un autre message" onPress={again} />
        </StatusOverlay>
      )}>
      <PageTitle light="On est là" bold="pour t'aider" text="Décris ton problème : l'équipe te répond par e-mail." />

      <PressScale onPress={() => router.push("/faqs" as any)} accessibilityLabel="Voir les questions fréquentes"
        style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 22, backgroundColor: th.glassFill(0.14), borderWidth: 1, borderColor: th.glass(0.22), boxShadow: th.glassFx }}>
        <BimIcon name="help" size={22} color={th.fg} />
        <T w="bold" size={14} style={{ flex: 1 }}>Voir d'abord les questions fréquentes</T>
        <BimIcon name="chevron" size={18} color={th.muted} />
      </PressScale>

      <SectionLabel style={{ marginTop: 20 }}>SUJET</SectionLabel>
      <View style={{ marginTop: 8, gap: 8 }}>
        {TOPICS.map((tp, i) => {
          const on = topic === tp.label;
          return (
            <Appear key={tp.label} kind="rise" delay={i * 40}>
              <PressScale scaleTo={0.98} onPress={() => setTopic(tp.label)} accessibilityLabel={tp.label}
                style={{ height: 56, flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 6, paddingRight: 16, borderRadius: 28,
                  borderWidth: on ? 2 : 1, borderColor: on ? th.fg : th.glass(0.2), backgroundColor: on ? th.glass(0.22) : th.glassFill(0.12), boxShadow: th.glassFx }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: on ? th.accent : th.ink, alignItems: "center", justifyContent: "center" }}>
                  <BimIcon name={tp.icon} size={20} color={on ? th.onAccent : th.onInk} />
                </View>
                <T w={on ? "bold" : "regular"} size={15} style={{ flex: 1 }}>{tp.label}</T>
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: th.fg, alignItems: "center", justifyContent: "center" }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: on ? th.fg : "transparent" }} />
                </View>
              </PressScale>
            </Appear>
          );
        })}
      </View>

      <SectionLabel style={{ marginTop: 20, marginBottom: 8 }}>TON E-MAIL</SectionLabel>
      <TextField id="sp-email" label="Ton e-mail" hideLabel icon="mail" value={email} onChange={setEmail} keyboardType="email-address" placeholder="nom@exemple.com" />

      <SectionLabel style={{ marginTop: 20 }}>MESSAGE</SectionLabel>
      <TextInput value={message} onChangeText={setMessage} multiline textAlignVertical="top" placeholder="Décris ton problème en détail…" placeholderTextColor={th.glass(0.55)}
        accessibilityLabel="Message"
        style={{ marginTop: 8, minHeight: 130, borderRadius: 22, padding: 16, backgroundColor: th.glassFill(0.12), borderWidth: 1, borderColor: th.glass(0.24),
          color: th.fg, fontFamily: F.regular, fontSize: 15, lineHeight: 22, boxShadow: th.glassFx }} />

      <PressScale onPress={image ? () => setImage(null) : pick} accessibilityLabel={image ? "Retirer la capture" : "Joindre une capture d'écran"}
        style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 20, borderWidth: 1, borderStyle: "dashed", borderColor: th.glass(0.4) }}>
        {image ? <Image source={{ uri: image }} style={{ width: 52, height: 52, borderRadius: 12 }} contentFit="cover" />
          : <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: th.glass(0.12), alignItems: "center", justifyContent: "center" }}><BimIcon name="camera" size={22} color={th.fg} /></View>}
        <T size={14} style={{ flex: 1 }}>{image ? "Capture jointe · toucher pour retirer" : "Joindre une capture (facultatif)"}</T>
      </PressScale>

      <View style={{ marginTop: "auto", paddingTop: 22 }}>
        <SlideButton variant="accent" label="Envoyer mon message" icon="send" onDone={send} />
      </View>
    </BimPage>
  );
}
