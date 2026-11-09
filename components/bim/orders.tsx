/**
 * Commandes BIM NEXT — éléments partagés :
 *  - OrderTracking : suivi de livraison temps réel (après une commande et depuis « Mes commandes »)
 *  - orderStatus / orderArtItem / OrderArt : statut, illustration et miniature d'une commande
 */
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Linking, ScrollView, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL_BASE } from "@/constants/api";
import { useGetUserOrdersQuery } from "@/services/orderService";
import { BimIcon } from "./icons";
import { fallbackArt } from "./illustrations";
import { BimType, ec, useTh } from "./theme";
import { Float, Glass, Header, PressScale, ProductArt, Pulse, RoundButton, T } from "./ui";

export type OrderArtItem = { name: string; uri: string | null; art: string };

const imgUri = (u?: string | null) => (!u ? null : u.startsWith("http") ? u : `${API_URL_BASE}${u}`);

/** Devine la catégorie (eau / gaz / carburant) depuis le nom du produit. */
export function orderType(name = ""): BimType {
  const n = name.toLowerCase();
  if (/(gaz|bouteille|kg|détendeur|detendeur)/.test(n)) return "gaz";
  if (/(essence|gasoil|diesel|carburant|pétrole|petrole|litre|super)/.test(n) && !/(eau|bonbonne|sachet|pack)/.test(n)) return "carburant";
  return "eau";
}

export function orderArtItem(order: any): OrderArtItem {
  const name = order?.product?.name ?? "Commande BIM";
  return { name, uri: imgUri(order?.product?.imageUrl), art: fallbackArt(orderType(name), name) };
}

export function OrderArt({ item, size, tile }: { item: OrderArtItem; size: number; tile: number }) {
  const th = useTh();
  return (
    <View style={{ width: tile, height: tile, borderRadius: tile * 0.3, backgroundColor: th.glassFill(0.18), borderWidth: 1, borderColor: th.glass(0.22), alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: th.glassFx }}>
      <ProductArt uri={item.uri} xml={item.art} size={size} fill />
    </View>
  );
}

/** Libellé + couleur du statut, pour les listes. */
export function orderStatus(status?: string): { label: string; color: string; active: boolean } {
  switch (status) {
    case "delivered": return { label: "Livrée", color: "#22C55E", active: false };
    case "cancelled": return { label: "Annulée", color: "#FF5A66", active: false };
    case "shipped": return { label: "En route", color: "#38B6FF", active: true };
    case "confirmed": case "processing": case "paid": return { label: "En préparation", color: "#F5C518", active: true };
    default: return { label: "Reçue", color: "#C9DAFF", active: true };
  }
}

/* ═══ Suivi de livraison (temps réel, actualisé toutes les 8 s) ════════ */
export const ORDER_STEPS = [
  ["Commande reçue", "On a bien reçu ta commande"],
  ["En préparation", "Le partenaire prépare tes produits"],
  ["En route", "Le livreur arrive chez toi"],
  ["Livrée", "Bonne journée avec BIMNEXT !"],
] as const;

export const statusToStep = (s?: string) =>
  s === "delivered" ? 3 : s === "shipped" ? 2 : s === "confirmed" || s === "processing" || s === "paid" ? 1 : 0;

export function OrderTracking({ orderNumber, item: given, qty: givenQty, paid, method, onHome, onRestart, onAll, backLabel = "Retour à l'accueil" }: {
  orderNumber: string; item?: OrderArtItem; qty?: number; paid?: boolean; method?: "ec" | "mm" | "cash";
  onHome: () => void; onRestart?: () => void; onAll?: () => void; backLabel?: string;
}) {
  const th = useTh();
  const insets = useSafeAreaInsets();
  const { data } = useGetUserOrdersQuery({}, { pollingInterval: 8000 });
  const order = (data?.data ?? []).find((o: any) => o.orderNumber === orderNumber);
  const item = given ?? orderArtItem(order);
  const qty = givenQty ?? Number(order?.quantity ?? 1);
  const cur = order?.status === "cancelled" ? -1 : statusToStep(order?.status);
  const isPaid = paid || order?.paymentStatus === "paid";
  const [mapW, setMapW] = useState(0);

  const prog = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(prog, { toValue: Math.max(0, cur), duration: 1200, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: false }).start();
  }, [cur]);
  const usable = Math.max(0, mapW - 68);
  const truckX = prog.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [8, usable * 0.22 + 8, usable * 0.62 + 8, usable - 12] });
  const routeW = prog.interpolate({ inputRange: [0, 3], outputRange: [0, usable] });

  const eta = cur === 3 ? "Livrée" : cur === -1 ? "Commande annulée"
    : `Arrivée estimée : ~ ${order?.estimatedMinutes ?? [30, 25, 10][Math.max(0, cur)]} min`;
  const m = method ?? order?.paymentMethod;
  const due = order?.grandTotal != null ? ` : ${ec(Number(order.grandTotal))} EC` : "";
  const payNote = isPaid ? "Payé · reçu dans ton historique"
    : (m === "mm" || m === "mobile_money") ? `À payer au livreur par Mobile Money${due}` : `À payer au livreur en espèces${due}`;
  const livreur = order?.livreur;
  const livreurName = livreur?.user?.username || (cur >= 1 ? "Ton livreur" : "Livreur en cours d'attribution");
  // Notes des étapes selon l'état réel (livreur trouvé, récupérée, à payer…).
  const notes = [
    livreur ? "Commande enregistrée" : "On cherche un livreur disponible",
    livreur ? `${livreurName} a accepté ta commande et va la récupérer` : "Le partenaire prépare tes produits",
    "Ton livreur a récupéré ta commande et arrive",
    isPaid ? "Bonne journée avec BIMNEXT !" : `Paie le livreur à la remise${due}`,
  ];

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: 28 + insets.top, paddingHorizontal: 24, paddingBottom: 40 + insets.bottom }} showsVerticalScrollIndicator={false}>
      <Header title="Suivi de livraison" backLabel={backLabel} onBack={onHome} />
      <T size={13} color={th.muted} style={{ marginTop: 10, textAlign: "center" }}>Commande #{orderNumber}</T>

      <View onLayout={(e) => setMapW(e.nativeEvent.layout.width)}
        style={{ marginTop: 20, height: 170, borderRadius: 26, overflow: "hidden", backgroundColor: th.ink, borderWidth: 1, borderColor: th.glass(0.18) }}>
        <Svg width="100%" height="100%" style={{ position: "absolute" }}>
          {Array.from({ length: 16 }).map((_, i) => <Path key={"v" + i} d={`M${i * 28} 0V170`} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />)}
          {Array.from({ length: 7 }).map((_, i) => <Path key={"h" + i} d={`M0 ${i * 28}H600`} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />)}
        </Svg>
        <View style={{ position: "absolute", left: 34, right: 34, top: 92, height: 4, borderRadius: 2, backgroundColor: th.glass(0.2) }} />
        <Animated.View style={{ position: "absolute", left: 34, top: 92, height: 4, borderRadius: 2, backgroundColor: th.accent, width: routeW }} />
        <View style={{ position: "absolute", left: 22, top: 82, width: 24, height: 24, borderRadius: 12, backgroundColor: th.ink, borderWidth: 3, borderColor: th.fg }} />
        <View style={{ position: "absolute", right: 22, top: 80, width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
          {cur < 3 && <Pulse size={28} />}
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: th.accent, alignItems: "center", justifyContent: "center" }}>
            <BimIcon name="home" size={14} color={th.onAccent} strokeWidth={2.4} />
          </View>
        </View>
        <Animated.View style={{ position: "absolute", top: 60, left: 22, transform: [{ translateX: truckX }] }}>
          <Float amp={4} duration={1800}>
            <Svg width={48} height={32} viewBox="0 0 48 32">
              <Path d="M5 6h22a3 3 0 0 1 3 3v15H2V9a3 3 0 0 1 3-3z" fill="#FFFFFF" />
              <Path d="M30 12h8l6 6v6H30z" fill="#D9DDE3" />
              <Path d="M7 26a4 4 0 1 0 8 0a4 4 0 1 0-8 0" fill="#1E2125" stroke="#FFFFFF" strokeWidth={2} />
              <Path d="M33 26a4 4 0 1 0 8 0a4 4 0 1 0-8 0" fill="#1E2125" stroke="#FFFFFF" strokeWidth={2} />
            </Svg>
          </Float>
        </Animated.View>
        <View style={{ position: "absolute", left: 16, bottom: 14, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, backgroundColor: th.navBg }}>
          <T size={13}>{eta}</T>
        </View>
      </View>

      <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <OrderArt item={item} size={42} tile={44} />
        <View style={{ flex: 1 }}>
          <T w="bold" size={15} numberOfLines={1}>{item.name} × {qty}</T>
          <T size={12} color={th.muted}>{payNote}</T>
        </View>
      </View>

      <View style={{ marginTop: 18 }}>
        {ORDER_STEPS.map(([label], i) => {
          const note = notes[i];
          const done = cur >= 0 && (i < cur || cur === 3);
          const active = i === cur && cur < 3;
          return (
            <View key={label} style={{ flexDirection: "row", gap: 14 }}>
              <View style={{ alignItems: "center", width: 26 }}>
                <View style={{ width: 26, height: 26, alignItems: "center", justifyContent: "center" }}>
                  {active && <Pulse size={26} />}
                  <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: done || active ? th.accent : th.glass(0.35),
                    backgroundColor: done ? th.accent : "transparent", alignItems: "center", justifyContent: "center" }}>
                    {done && <BimIcon name="check" size={14} color={th.onAccent} strokeWidth={2.6} />}
                  </View>
                </View>
                {i < 3 && <View style={{ width: 2, flex: 1, minHeight: 22, backgroundColor: i < cur ? th.accent : th.glass(0.25) }} />}
              </View>
              <View style={{ flex: 1, paddingBottom: 14 }}>
                <T w="bold" size={15} color={done || active ? th.fg : th.muted}>{label}</T>
                <T size={13} color={th.muted} style={{ marginTop: 2 }}>{note}</T>
              </View>
            </View>
          );
        })}
      </View>

      <Glass a={0.14} b={0.22} radius={22} style={{ marginTop: 6, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: th.ink, alignItems: "center", justifyContent: "center" }}><BimIcon name="bike" size={20} color={th.onInk} /></View>
        <View style={{ flex: 1 }}>
          <T w="bold" size={15} numberOfLines={1}>{livreurName}</T>
          <T size={12} color={th.muted}>Ton livreur BIMNEXT</T>
        </View>
        <RoundButton icon="phone" label="Appeler le livreur" variant="accent" disabled={!livreur?.telephone}
          onPress={() => livreur?.telephone && Linking.openURL(`tel:${livreur.telephone}`)} />
      </Glass>

      <View style={{ marginTop: "auto", paddingTop: 20, gap: 10 }}>
        {onAll && (
          <PressScale onPress={onAll} accessibilityLabel="Voir toutes mes commandes"
            style={{ height: 50, borderRadius: 25, backgroundColor: th.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <BimIcon name="box" size={18} color={th.onAccent} strokeWidth={2} />
            <T w="bold" size={15} color={th.onAccent}>Voir toutes mes commandes</T>
          </PressScale>
        )}
        {onRestart && (
          <PressScale onPress={onRestart} accessibilityLabel="Commander autre chose"
            style={{ height: 50, borderRadius: 25, borderWidth: 1, borderColor: th.glass(0.3), alignItems: "center", justifyContent: "center" }}>
            <T size={15}>Commander autre chose</T>
          </PressScale>
        )}
      </View>
    </ScrollView>
  );
}
