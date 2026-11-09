/**
 * Conditions d'utilisation (design BIM NEXT) : 7 articles dépliables. Texte identique à l'ancienne page.
 */
import * as Application from "expo-application";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { BimIcon, BimIconName } from "@/components/bim/icons";
import { useTh } from "@/components/bim/theme";
import { Appear, BimPage, Glass, PageTitle, PressScale, SectionLabel, T } from "@/components/bim/ui";

const TERMS = [
  { id: 1, icon: "checkmark-circle-outline",   title: "Acceptation des termes",       body: "En utilisant l'application BIM, vous acceptez de respecter les termes et conditions décrits dans ce document. Cette acceptation est requise pour accéder à l'ensemble des fonctionnalités de la plateforme." },
  { id: 2, icon: "shield-checkmark-outline",    title: "Politique de confidentialité", body: "Vos données personnelles sont collectées et traitées conformément à notre politique de confidentialité. Nous ne partageons jamais vos informations sans votre consentement explicite et préalable." },
  { id: 3, icon: "phone-portrait-outline",      title: "Utilisation de l'application", body: "Vous vous engagez à utiliser l'application uniquement à des fins légales et conformément aux lois en vigueur. Toute utilisation abusive pourra entraîner la suspension ou la suppression de votre compte." },
  { id: 4, icon: "ribbon-outline",              title: "Propriété intellectuelle",     body: "Tous les contenus, logos et marques présents dans l'application sont la propriété de BIM ou de ses partenaires. Toute reproduction ou utilisation non autorisée est strictement interdite." },
  { id: 5, icon: "refresh-circle-outline",      title: "Modifications des termes",     body: "BIM se réserve le droit de modifier ces termes à tout moment. Les modifications seront effectives dès leur publication dans l'application. Nous vous encourageons à les consulter régulièrement." },
  { id: 6, icon: "alert-circle-outline",        title: "Limitation de responsabilité", body: "BIM ne pourra être tenu responsable des dommages directs ou indirects liés à l'utilisation de l'application, dans les limites permises par la législation applicable." },
  { id: 7, icon: "chatbubble-ellipses-outline", title: "Contact",                      body: "Pour toute question concernant ces termes et notre politique de confidentialité, veuillez nous contacter via la section Support de l'application. Notre équipe vous répondra dans les meilleurs délais." },
];

const ICONS: BimIconName[] = ["check", "shield", "phone", "star", "clock", "warning", "message"];

function Article({ item, index, open, onToggle }: { item: (typeof TERMS)[number]; index: number; open: boolean; onToggle: () => void }) {
  const th = useTh();
  const v = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => { Animated.timing(v, { toValue: open ? 1 : 0, duration: 260, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }).start(); }, [open]);
  return (
    <PressScale scaleTo={0.98} onPress={onToggle} accessibilityLabel={`Article ${index + 1} : ${item.title}`}
      style={{ padding: 14, borderRadius: 22, backgroundColor: th.glassFill(open ? 0.18 : 0.12), borderWidth: 1, borderColor: open ? th.glass(0.4) : th.glass(0.2), boxShadow: th.glassFx }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: open ? th.accent : th.ink, alignItems: "center", justifyContent: "center" }}>
          <BimIcon name={ICONS[index] ?? "doc"} size={17} color={open ? th.onAccent : th.onInk} strokeWidth={2} />
        </View>
        <T size={12} color={th.muted} w="bold">{String(index + 1).padStart(2, "0")}</T>
        <T w="bold" size={15} style={{ flex: 1 }} numberOfLines={open ? undefined : 1}>{item.title}</T>
        <Animated.View style={{ transform: [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ["90deg", "270deg"] }) }] }}>
          <BimIcon name="chevron" size={18} color={th.fg} strokeWidth={2} />
        </Animated.View>
      </View>
      {open && <Appear kind="fade" duration={260}><T size={14} color={th.muted} style={{ marginTop: 10, lineHeight: 21 }}>{item.body}</T></Appear>}
    </PressScale>
  );
}

export default function Terms() {
  const th = useTh();
  const router = useRouter();
  const [active, setActive] = useState<number | null>(0);
  return (
    <BimPage title="Conditions">
      <PageTitle light="Conditions" bold="d'utilisation" text="Dernière mise à jour : janvier 2025" />
      <Appear kind="rise" delay={100}>
        <Glass a={0.14} b={0.22} radius={22} style={{ marginTop: 16, flexDirection: "row", paddingVertical: 14 }}>
          {[["7", "Articles"], ["100 %", "Transparent"], ["RGPD", "Conforme"]].map(([v, l], i) => (
            <View key={l} style={{ flex: 1, alignItems: "center", borderLeftWidth: i ? 1 : 0, borderLeftColor: th.glass(0.16) }}>
              <T w="bold" size={18}>{v}</T>
              <T size={11} color={th.muted}>{l}</T>
            </View>
          ))}
        </Glass>
        <Glass a={0.12} b={0.2} radius={18} style={{ marginTop: 10, flexDirection: "row", gap: 10, padding: 14 }}>
          <BimIcon name="info" size={18} color={th.fg} />
          <T size={13} style={{ flex: 1, lineHeight: 19 }}>Merci de lire attentivement ces conditions avant d'utiliser BIM. En vous inscrivant, vous acceptez l'ensemble des termes ci-dessous.</T>
        </Glass>
      </Appear>

      <SectionLabel style={{ marginTop: 20 }}>ARTICLES</SectionLabel>
      <View style={{ marginTop: 8, gap: 8 }}>
        {TERMS.map((t, i) => (
          <Appear key={t.id} kind="rise" delay={Math.min(i, 6) * 40}>
            <Article item={t} index={i} open={active === i} onToggle={() => setActive(active === i ? null : i)} />
          </Appear>
        ))}
      </View>

      <PressScale onPress={() => router.push("/support" as any)} accessibilityLabel="Contacter le support"
        style={{ marginTop: 18, flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 24, backgroundColor: th.accent }}>
        <BimIcon name="message" size={22} color={th.onAccent} />
        <View style={{ flex: 1 }}>
          <T w="bold" size={15} color={th.onAccent}>Une question ?</T>
          <T size={13} color={th.onAccent}>Contacte notre support</T>
        </View>
        <BimIcon name="chevron" size={18} color={th.onAccent} />
      </PressScale>
      <T size={12} color={th.muted} style={{ marginTop: 16, textAlign: "center" }}>BIM NEXT · v{Application.nativeApplicationVersion ?? "1.0.0"}</T>
    </BimPage>
  );
}
