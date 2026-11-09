/**
 * À propos de BIM NEXT (design BIM NEXT) : logo, chiffres, mission / vision / valeurs, équipe,
 * bureaux, contact et réseaux sociaux. Contenu identique à l'ancienne page.
 */
import * as Application from "expo-application";
import { Image } from "expo-image";
import React from "react";
import { Linking, View } from "react-native";
import logoImg from "@/assets/images/logo.jpeg";
import { BimIcon, BimIconName } from "@/components/bim/icons";
import { useTh } from "@/components/bim/theme";
import { Appear, BimPage, Glass, PillButton, PressScale, SectionLabel, T } from "@/components/bim/ui";

const STATS = [
  { value: "30+",  label: "Entreprises"   },
  { value: "200+", label: "Entrepreneurs" },
  { value: "10+",  label: "Organisations" },
  { value: "2022", label: "Fondé en"      },
];

const PILIERS = [
  { icon: "star-outline",      title: "Mission",      body: "Mettre en place un réseau d'affaires proactif où les souscripteurs boostent leurs activités grâce à des solutions innovantes." },
  { icon: "telescope-outline", title: "Vision 2030",  body: "Devenir le plus grand réseau d'affaires congolais, figurer dans le top 5 en Afrique et le top 20 mondial." },
  { icon: "diamond-outline",   title: "Nos valeurs",  body: "Professionnalisme, Excellence et Innovation — une équipe dynamique et enthousiasmée de servir ses partenaires." },
  { icon: "globe-outline",     title: "Notre réseau", body: "BIM est un réseau d'affaires congolais créé pour promouvoir le milieu des affaires congolais localement et mondialement." },
];

const TEAM = [
  { name: "BARAKA KPAVURO JERRY",     role: "Co-fondateur de BIM NEXT",  detail: "Concepteur & visionnaire du projet BIM NEXT", initials: "BJ" },
  { name: "MUSHIO ATAULWA",           role: "Co-fondateur de BIM NEXT",  detail: "Responsable technique — BIM NEXT",            initials: "MA" },
  { name: "Félicien MAFUTALA",        role: "Directeur financier",       detail: "Pilier stratégique & financier",              initials: "FM" },
  { name: "David RAHARI RGAMBWA",     role: "Membre de l'équipe",        detail: "Membre opérationnel",   initials: "DR" },
  { name: "JOEL SIVASIMIRE KATEMBO",  role: "Livreur",                   detail: "Membre opérationnel",   initials: "JK" },
  { name: "Moïse LUPETE SADIKI",      role: "Logistique",                detail: "Membre opérationnel",   initials: "MS" },
  { name: "NEYMAR THEM'S MBIKAMBOLI", role: "Superviseur",               detail: "Membre opérationnel",   initials: "NM" },
];

const OFFICES = [
  { city: "Bunia",        icon: "business-outline" },
  { city: "Kinshasa",     icon: "business-outline" },
  { city: "Nord-Kivu",    icon: "business-outline" },
  { city: "Lubumbashi",   icon: "business-outline" },
];

const SOCIALS = [
  { icon: "logo-facebook", label: "Facebook", url: "https://www.facebook.com/share/17svZSm1Xo/" },
  { icon: "logo-twitter",  label: "Twitter",  url: "https://x.com/BIM_Officiel"                 },
  { icon: "logo-linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/business-investment-meeting/" },
];

const PILIER_ICON: BimIconName[] = ["star", "sparkle", "heart", "globe"];
const open = async (url: string) => { if (await Linking.canOpenURL(url)) Linking.openURL(url); };

export default function Apropos() {
  const th = useTh();
  const version = Application.nativeApplicationVersion ?? "1.0.0";
  return (
    <BimPage title="À propos">
      <Appear kind="pop" delay={60} style={{ alignItems: "center", marginTop: 22 }}>
        <View style={{ width: 110, height: 110, borderRadius: 32, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 14px 34px rgba(0,0,0,0.3)" }}>
          <Image source={logoImg} style={{ width: 96, height: 96 }} contentFit="contain" />
        </View>
        <T w="bold" size={22} style={{ marginTop: 16, textAlign: "center" }}>Business Investment Meeting</T>
        <T size={14} color={th.muted} style={{ marginTop: 4 }}>Réseau d'affaires congolais · RDC</T>
        <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 28, borderRadius: 14, backgroundColor: th.glass(0.14) }}>
          <BimIcon name="calendar" size={13} color={th.fg} />
          <T size={12}>Fondé en 2022</T>
        </View>
      </Appear>

      <Appear kind="rise" delay={120}>
        <Glass a={0.14} b={0.22} radius={24} style={{ marginTop: 20, flexDirection: "row", paddingVertical: 16 }}>
          {STATS.map((s, i) => (
            <View key={s.label} style={{ flex: 1, alignItems: "center", borderLeftWidth: i ? 1 : 0, borderLeftColor: th.glass(0.16) }}>
              <T w="bold" size={20}>{s.value}</T>
              <T size={11} color={th.muted} style={{ marginTop: 2 }}>{s.label}</T>
            </View>
          ))}
        </Glass>
      </Appear>

      <SectionLabel style={{ marginTop: 22 }}>QUI SOMMES-NOUS</SectionLabel>
      <View style={{ marginTop: 8, gap: 10 }}>
        {PILIERS.map((p, i) => (
          <Appear key={p.title} kind="rise" delay={i * 50}>
            <Glass a={0.12} b={0.2} radius={22} style={{ padding: 14, flexDirection: "row", gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: th.ink, alignItems: "center", justifyContent: "center" }}>
                <BimIcon name={PILIER_ICON[i] ?? "star"} size={19} color={th.onInk} />
              </View>
              <View style={{ flex: 1 }}>
                <T w="bold" size={15}>{p.title}</T>
                <T size={13} color={th.muted} style={{ marginTop: 3, lineHeight: 19 }}>{p.body}</T>
              </View>
            </Glass>
          </Appear>
        ))}
      </View>

      <SectionLabel style={{ marginTop: 22 }}>NOTRE ÉQUIPE</SectionLabel>
      <Glass a={0.12} b={0.2} radius={24} style={{ marginTop: 8, paddingHorizontal: 14, paddingVertical: 4 }}>
        {TEAM.map((m, i) => (
          <View key={m.name} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: th.glass(0.12) }}>
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: i < 2 ? th.accent : th.ink, alignItems: "center", justifyContent: "center" }}>
              <T w="bold" size={15} color={i < 2 ? th.onAccent : th.onInk}>{m.initials}</T>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T w="bold" size={14} numberOfLines={1}>{m.name}</T>
              <T size={12}>{m.role}</T>
              <T size={12} color={th.muted}>{m.detail}</T>
            </View>
          </View>
        ))}
      </Glass>

      <SectionLabel style={{ marginTop: 22 }}>NOS BUREAUX</SectionLabel>
      <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {OFFICES.map((o) => (
          <View key={o.city} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, height: 40, borderRadius: 20,
            backgroundColor: th.glassFill(0.12), borderWidth: 1, borderColor: th.glass(0.2), boxShadow: th.glassFx }}>
            <BimIcon name="pin" size={15} color={th.fg} />
            <T w="bold" size={13}>{o.city}</T>
          </View>
        ))}
      </View>

      <SectionLabel style={{ marginTop: 22 }}>CONTACT</SectionLabel>
      <Glass a={0.12} b={0.2} radius={24} style={{ marginTop: 8, overflow: "hidden" }}>
        {([
          { icon: "mail", label: "contact@bimreseau.com", url: "mailto:contact@bimreseau.com" },
          { icon: "phone", label: "+243 861 166 469 · Support", url: "tel:+243861166469" },
          { icon: "globe", label: "bimreseau.com", url: "https://bimreseau.com/" },
        ] as { icon: BimIconName; label: string; url: string }[]).map((c, i) => (
          <PressScale key={c.url} scaleTo={0.98} onPress={() => open(c.url)} accessibilityLabel={c.label}
            style={{ height: 54, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, borderTopWidth: i ? 1 : 0, borderTopColor: th.glass(0.12) }}>
            <BimIcon name={c.icon} size={19} color={th.fg} />
            <T size={14} style={{ flex: 1 }}>{c.label}</T>
            <BimIcon name="chevron" size={16} color={th.muted} />
          </PressScale>
        ))}
      </Glass>

      <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
        {SOCIALS.map((s) => (
          <PressScale key={s.label} onPress={() => open(s.url)} accessibilityLabel={s.label} style={{ flex: 1 }}>
            <View style={{ height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: th.glassFill(0.12), borderWidth: 1, borderColor: th.glass(0.2), boxShadow: th.glassFx }}>
              <T w="bold" size={13}>{s.label}</T>
            </View>
          </PressScale>
        ))}
      </View>

      <PillButton variant="accent" label="Rejoindre le réseau BIM" icon="globe" onPress={() => open("https://bimreseau.com/")} style={{ marginTop: 18 }} />
      <T size={12} color={th.muted} style={{ marginTop: 16, textAlign: "center" }}>BIM NEXT · v{version}</T>
    </BimPage>
  );
}
