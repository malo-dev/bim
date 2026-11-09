/**
 * Parcours de commande BIM NEXT (design Graphite) — EAU · GAZ · CARBURANT.
 *
 *   Catalogue → Produit → (Autorisations, 1re fois) → Paiement → Suivi
 *
 * Les produits viennent de GET /product/bim-catalogue?type=… : seuls les
 * produits rattachés à ces trois catégories sont affichés.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Animated, Easing, KeyboardAvoidingView, Linking, Platform, Pressable, RefreshControl,
  ScrollView, TextInput, View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL_BASE } from "@/constants/api";
import { BimIcon, BimIconName } from "@/components/bim/icons";
import { fallbackArt } from "@/components/bim/illustrations";
import { BimType, F, TYPE_META, ec, useTh } from "@/components/bim/theme";
import { OrderTracking } from "@/components/bim/orders";
import { Appear, BimBackground, Float, Glass, Glow, Header, Ink, PressScale, ProductArt, Pulse, RoundButton, SectionLabel, SlideButton, T } from "@/components/bim/ui";
import { getLastKnownLocation } from "@/hooks/useEnsureLocation";
import { useCreateOrderMutation, useGetUserOrdersQuery, usePrepayOrderMutation } from "@/services/orderService";
import { useGetBimCatalogueQuery } from "@/services/productServices";
import { useGetUserByIdQuery } from "@/services/userService";

type StepName = "cat" | "prod" | "perm" | "pay" | "track";
type Method = "ec" | "mm" | "cash";
type Item = { id: number; name: string; sub: string; desc: string; price: number; uri: string | null; art: string; companyId: number | null };

const TYPES: BimType[] = ["eau", "gaz", "carburant"];
// « autres » : tous les autres produits disponibles, même parcours de commande.
type CatType = BimType | "autres";
const ICON: Record<CatType, BimIconName> = { eau: "drop", gaz: "flame", carburant: "pump", autres: "box" };
const META: Record<CatType, { title: string; label: string }> = { ...TYPE_META, autres: { title: "Autres produits", label: "AUTRES" } };
// Illustration de secours d'un « autre produit » sans photo (colis).
const BOX_ART = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><path d="M60 14 104 36v48L60 106 16 84V36z" fill="#E9EEF7"/><path d="M60 14 104 36 60 58 16 36z" fill="#FFFFFF"/><path d="M60 58v48L16 84V36z" fill="#C9D4E6"/><path d="M38 25 82 47v14l-8-4V51L30 29z" fill="#F5C518"/></svg>`;
const artFor = (t: CatType, name: string) => (t === "autres" ? BOX_ART : fallbackArt(t, name));
const DELIVERY_NOTE = "Frais de livraison payés au livreur";
const PERMS_KEY = "bim_order_perms_asked";

const imgUri = (u?: string | null) => (!u ? null : u.startsWith("http") ? u : `${API_URL_BASE}${u}`);

/* ─── Petits éléments ─── */
function ArtTile({ item, size, tile }: { item: Item; size: number; tile: number }) {
  const th = useTh();
  return (
    <View style={{ width: tile, height: tile, borderRadius: tile * 0.3, backgroundColor: th.glassFill(0.18), borderWidth: 1, borderColor: th.glass(0.22), alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: th.glassFx }}>
      <ProductArt uri={item.uri} xml={item.art} size={size} fill />
    </View>
  );
}

function Shimmer({ h }: { h: number }) {
  const th = useTh();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]));
    l.start(); return () => l.stop();
  }, []);
  return <Animated.View style={{ height: h, borderRadius: 24, backgroundColor: th.glass(0.14), opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] }) }} />;
}

function Toggle({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  const th = useTh();
  const v = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => { Animated.timing(v, { toValue: on ? 1 : 0, duration: 200, useNativeDriver: false }).start(); }, [on]);
  return (
    <Pressable onPress={onPress} accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={label} hitSlop={8}
      style={{ width: 56, height: 32, borderRadius: 16, justifyContent: "center" }}>
      <Animated.View style={{ position: "absolute", inset: 0, borderRadius: 16, backgroundColor: v.interpolate({ inputRange: [0, 1], outputRange: [th.glass(0.25), th.accent] }) } as any} />
      <Animated.View style={{ width: 24, height: 24, borderRadius: 12, marginLeft: 4, backgroundColor: on ? th.onAccent : "#FFFFFF",
        transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 24] }) }] }} />
    </Pressable>
  );
}

/* ═══ Écran ═════════════════════════════════════════════════════════════ */
export default function CommandeScreen() {
  const th = useTh();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string }>();
  const initial = (params.type === "autres" || TYPES.includes(params.type as BimType) ? params.type : "eau") as CatType;

  const [type, setType] = useState<CatType>(initial);
  const isOther = type === "autres";
  const [sub, setSub] = useState("Tout");
  const [item, setItem] = useState<Item | null>(null);
  const [qty, setQty] = useState(1);
  const [step, setStepState] = useState<StepName>("cat");
  const [method, setMethod] = useState<Method>("ec");
  const [notifOn, setNotifOn] = useState(false);
  const [geoOn, setGeoOn] = useState(false);
  const [address, setAddress] = useState("");
  const [editAddr, setEditAddr] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [paidNow, setPaidNow] = useState(false);
  const [busy, setBusy] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);
  const { data: user, refetch: refetchUser } = useGetUserByIdQuery(userId!, { skip: !userId });

  const { data, isLoading, isFetching, refetch } = useGetBimCatalogueQuery({ type });
  const [createOrder] = useCreateOrderMutation();
  const [prepay] = usePrepayOrderMutation();

  /* transition de sortie entre étapes */
  const leave = useRef(new Animated.Value(0)).current;
  const go = (to: StepName, animate = true) => {
    if (!animate) { setStepState(to); return; }
    Animated.timing(leave, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
      setStepState(to); leave.setValue(0);
    });
  };

  const items: Item[] = useMemo(() => (data?.data ?? []).map((p: any) => ({
    id: p.productId,
    name: p.name,
    sub: p.sub || META[type].title,
    desc: p.description || p.Warning || "",
    price: Number(p.effectivePrice ?? p.price ?? 0),
    uri: imgUri(p.imageUrl),
    art: artFor(type, p.name),
    companyId: p.companyId ?? null,
  })), [data, type]);
  const subs = useMemo(() => ["Tout", ...Array.from(new Set(items.map((i) => i.sub)))], [items]);
  const shown = items.filter((i) => sub === "Tout" || i.sub === sub);

  const total = item ? item.price * qty : 0;
  const balance = Number(user?.soldNumber ?? 0);

  /* adresse : position actuelle → adresse lisible */
  const locate = async () => {
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== "granted") return;
      const last = await getLastKnownLocation();
      const pos: { lat: number; lng: number } = last ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        .then((p) => ({ lat: p.coords.latitude, lng: p.coords.longitude }));
      setCoords(pos);
      if (!address) {
        const [g] = await Location.reverseGeocodeAsync({ latitude: pos.lat, longitude: pos.lng });
        const parts = [g?.street || g?.name, g?.district || g?.subregion, g?.city].filter(Boolean);
        setAddress(parts.length ? parts.join(", ") : `Position GPS ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`);
      }
    } catch {}
  };
  useEffect(() => { if (step === "pay") locate(); }, [step]);

  const afterProduct = async () => {
    const asked = await AsyncStorage.getItem(PERMS_KEY);
    go(asked ? "pay" : "perm");
  };

  const allowAll = async () => {
    try {
      if (!notifOn) { const r = await Notifications.requestPermissionsAsync(); setNotifOn(r.granted); }
      if (!geoOn) { const r = await Location.requestForegroundPermissionsAsync(); setGeoOn(r.status === "granted"); }
    } catch {}
    await AsyncStorage.setItem(PERMS_KEY, "1");
    go("pay");
  };

  const toggleNotif = async () => {
    if (notifOn) return setNotifOn(false);
    try { const r = await Notifications.requestPermissionsAsync(); setNotifOn(r.granted); } catch {}
  };
  const toggleGeo = async () => {
    if (geoOn) return setGeoOn(false);
    try { const r = await Location.requestForegroundPermissionsAsync(); setGeoOn(r.status === "granted"); } catch {}
  };

  const submit = async () => {
    if (!item) return;
    const phone = user?.telephone;
    if (!address.trim()) { setEditAddr(true); Alert.alert("Adresse", "Indique où livrer ta commande."); return; }
    if (!phone) { Alert.alert("Téléphone", "Ajoute ton numéro de téléphone dans ton profil pour être livré."); return; }
    if (method === "ec" && total > balance) {
      Alert.alert("Solde insuffisant", `Ton solde est de ${ec(balance)} EC. Recharge ton compte ou choisis un autre moyen de paiement.`, [
        { text: "Annuler", style: "cancel" },
        { text: "Recharger", onPress: () => router.push("/recharge" as any) },
      ]);
      return;
    }
    setBusy(true);
    try {
      const res: any = await createOrder({
        items: [{ productId: item.id, qty, unitPrice: item.price }],
        companyId: item.companyId ?? undefined,
        shippingAddress: address.trim(),
        destinationLat: coords?.lat,
        destinationLng: coords?.lng,
        paymentMethod: method === "ec" ? "ec" : method === "mm" ? "mobile_money" : "delivery",
        clientPhone: phone,
        notes: `${META[type].title} — commande BIM NEXT`,
      }).unwrap();
      let paid = false;
      if (method === "ec") {
        try { await prepay(res.orderNumber).unwrap(); paid = true; refetchUser(); }
        catch (err: any) {
          Alert.alert("Paiement non effectué", (err?.data?.message || "Le paiement en EC a échoué.") + " Ta commande est enregistrée : tu paieras le livreur à la livraison.");
        }
      }
      setPaidNow(paid);
      setOrderNumber(res.orderNumber);
      go("track");
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Impossible de passer la commande. Réessaie.");
    } finally { setBusy(false); }
  };

  const leaveStyle = {
    flex: 1,
    opacity: leave.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [{ translateX: leave.interpolate({ inputRange: [0, 1], outputRange: [0, -40] }) }],
  };
  const pad = { paddingTop: 28 + insets.top, paddingHorizontal: 20, paddingBottom: 40 + insets.bottom };

  /* ═══ Catalogue ═══ */
  const renderCatalogue = () => (
    <ScrollView contentContainerStyle={pad} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={!isLoading && isFetching} onRefresh={() => { refetch(); }} tintColor="#FFF" />}>
      <Header title={isOther ? "Autres produits" : "Commander"} backLabel="Retour" onBack={() => router.back()} />
      {!isOther && <View style={{ marginTop: 18, flexDirection: "row", gap: 6, padding: 5, borderRadius: 27, backgroundColor: th.glassFill(0.1), borderWidth: 1, borderColor: th.glass(0.18), boxShadow: th.glassFx }}>
        {TYPES.map((t) => {
          const on = t === type;
          return (
            <PressScale key={t} onPress={() => { setType(t); setSub("Tout"); }} accessibilityLabel={TYPE_META[t].title}
              style={{ flex: 1 }}>
              <View style={{ height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: on ? th.accent : "transparent" }}>
                <T w="bold" size={13} color={on ? th.onAccent : th.fg} style={{ letterSpacing: 0.5 }}>{TYPE_META[t].label}</T>
              </View>
            </PressScale>
          );
        })}
      </View>}

      <Appear key={type + "-t"} kind="rise">
        {isOther ? (
          <>
            <T style={{ marginTop: 22 }}>
              <T w="light" size={32} style={{ lineHeight: 36 }}>Tous nos{"\n"}</T>
              <T w="bold" size={32} style={{ lineHeight: 36 }}>autres produits</T>
            </T>
            <T size={14} color={th.muted} style={{ marginTop: 6 }}>Choisis une catégorie, puis ton produit. Livré chez toi.</T>
          </>
        ) : (
          <T style={{ marginTop: 22 }}>
            <T w="light" size={32} style={{ lineHeight: 36 }}>Toute l'offre </T>
            <T w="bold" size={32} style={{ lineHeight: 36 }}>{META[type].title}</T>
          </T>
        )}
      </Appear>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14, marginRight: -20 }} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
        {subs.map((s) => {
          const on = s === sub;
          return (
            <PressScale key={s} onPress={() => setSub(s)} accessibilityLabel={s}
              style={{ height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: th.glass(0.22), justifyContent: "center", backgroundColor: on ? th.accent : th.glassFill(0.12), boxShadow: th.glassFx }}>
              <T w="bold" size={14} color={on ? th.onAccent : th.fg}>{s}</T>
            </PressScale>
          );
        })}
      </ScrollView>

      <View style={{ marginTop: 16, gap: 10 }}>
        {isLoading && [0, 1, 2, 3].map((n) => <Shimmer key={n} h={76} />)}
        {!isLoading && shown.length === 0 && (
          <Glass style={{ padding: 22, alignItems: "center", gap: 10 }}>
            <BimIcon name={ICON[type]} size={30} color={th.fg} />
            <T w="bold" size={16}>Bientôt disponible</T>
            <T size={14} color={th.muted} style={{ textAlign: "center" }}>{isOther ? "Aucun autre produit pour le moment." : `Aucun produit ${META[type].title.toLowerCase()} pour le moment.`} Tire vers le bas pour actualiser.</T>
          </Glass>
        )}
        {shown.map((it, idx) => (
          <Appear key={`${type}-${it.id}`} kind="page" delay={idx * 60}>
            <PressScale onPress={() => { setItem(it); setQty(1); go("prod", false); }} accessibilityLabel={`${it.name}, ${ec(it.price)} EC`}
              style={{ height: 76, borderRadius: 24, backgroundColor: th.glassFill(0.14), borderWidth: 1, borderColor: th.glass(0.2), flexDirection: "row", alignItems: "center", gap: 14, paddingLeft: 8, paddingRight: 12, boxShadow: th.glassFx }}>
              <ArtTile item={it} size={56} tile={60} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <T w="bold" size={15} numberOfLines={1}>{it.name}</T>
                <T size={12} color={th.muted} style={{ marginTop: 3 }} numberOfLines={1}>{it.sub}</T>
                <T w="bold" size={14} style={{ marginTop: 4 }}>{ec(it.price)} <T w="light" size={14}>EC</T></T>
              </View>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: th.accent, alignItems: "center", justifyContent: "center" }}>
                <BimIcon name="plus" size={16} color={th.onAccent} strokeWidth={2.4} />
              </View>
            </PressScale>
          </Appear>
        ))}
      </View>
    </ScrollView>
  );

  /* ═══ Produit ═══ */
  const renderProduct = () => item && (
    <View style={[{ flex: 1 }, { paddingTop: 28 + insets.top, paddingHorizontal: 24, paddingBottom: 44 + insets.bottom }]}>
      <Glow top={40} opacity={0.22} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <RoundButton icon="back" label="Retour" onPress={() => go("cat", false)} />
        <T size={14} color={th.muted} numberOfLines={1} style={{ flexShrink: 1, marginHorizontal: 8 }}>{isOther ? item.sub : `${META[type].title} · ${item.sub}`}</T>
        <View style={{ width: 46 }} />
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <Appear kind="pop" style={{ alignSelf: "center", marginTop: 34 }}>
          <Float amp={7} duration={4500}>
            <View style={{ width: 220, height: 220, borderRadius: 40, backgroundColor: th.glassFill(0.14), borderWidth: 1, borderColor: th.glass(0.24), alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: th.glassFx }}>
              <ProductArt uri={item.uri} xml={item.art} size={176} fill />
            </View>
          </Float>
        </Appear>
        <Appear kind="rise" delay={120}><T w="bold" size={30} style={{ marginTop: 34, lineHeight: 35 }}>{item.name}</T></Appear>
        <Appear kind="rise" delay={180}>
          <T w="light" size={22} style={{ marginTop: 6 }}>{ec(item.price)} EC <T size={14} color={th.muted}>/ unité</T></T>
        </Appear>
        {!!item.desc && <Appear kind="rise" delay={240}><T size={15} color={th.muted} style={{ marginTop: 12, lineHeight: 23 }}>{item.desc}</T></Appear>}
        <Appear kind="rise" delay={300}>
          <Glass a={0.12} b={0.22} radius={30} style={{ marginTop: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, paddingRight: 8, paddingLeft: 18 }}>
            <T size={15}>Quantité</T>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <PressScale onPress={() => setQty((q) => Math.max(1, q - 1))} accessibilityLabel="Diminuer"
                style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: th.glass(0.3), alignItems: "center", justifyContent: "center" }}>
                <BimIcon name="minus" size={16} color={th.fg} strokeWidth={2.4} />
              </PressScale>
              <T w="bold" size={20} style={{ minWidth: 24, textAlign: "center" }} accessibilityLiveRegion="polite">{qty}</T>
              <PressScale onPress={() => setQty((q) => Math.min(99, q + 1))} accessibilityLabel="Augmenter"
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: th.accent, alignItems: "center", justifyContent: "center" }}>
                <BimIcon name="plus" size={16} color={th.onAccent} strokeWidth={2.4} />
              </PressScale>
            </View>
          </Glass>
        </Appear>
        <View style={{ marginTop: "auto", paddingTop: 24 }}>
          <SlideButton variant="accent" label={`Commander · ${ec(total)} EC`} onDone={afterProduct} />
        </View>
      </ScrollView>
    </View>
  );

  /* ═══ Autorisations ═══ */
  const renderPerm = () => (
    <View style={{ flex: 1, paddingTop: 28 + insets.top, paddingHorizontal: 24, paddingBottom: 34 + insets.bottom }}>
      <Glow top={40} opacity={0.2} />
      <View style={{ alignSelf: "center", marginTop: 50, width: 220, height: 150 }}>
        <Float amp={7} duration={4500} style={{ position: "absolute", left: 0, top: 20 }}>
          <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: th.glassFill(0.14), borderWidth: 1, borderColor: th.glass(0.24), alignItems: "center", justifyContent: "center", boxShadow: th.glassFx }}>
            <Pulse size={70} />
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: th.ink, alignItems: "center", justifyContent: "center" }}><BimIcon name="bell" size={32} color={th.onInk} strokeWidth={1.6} /></View>
          </View>
        </Float>
        <Float amp={7} duration={4500} offset={2000} style={{ position: "absolute", right: 0, top: 0 }}>
          <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: th.glassFill(0.14), borderWidth: 1, borderColor: th.glass(0.24), alignItems: "center", justifyContent: "center", boxShadow: th.glassFx }}>
            <Pulse size={70} delay={600} />
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: th.accent, alignItems: "center", justifyContent: "center" }}><BimIcon name="pin" size={32} color={th.onAccent} strokeWidth={1.7} /></View>
          </View>
        </Float>
      </View>
      <Appear kind="rise" delay={100}>
        <T style={{ marginTop: 36 }}>
          <T w="light" size={32} style={{ lineHeight: 36 }}>Avant ta première{"\n"}</T>
          <T w="bold" size={32} style={{ lineHeight: 36 }}>commande</T>
        </T>
      </Appear>
      <Appear kind="rise" delay={180}>
        <T size={15} color={th.muted} style={{ marginTop: 12, lineHeight: 23 }}>Deux autorisations pour que ta livraison arrive au bon endroit. On ne te le demandera qu'une fois.</T>
      </Appear>
      <Appear kind="rise" delay={260} style={{ marginTop: 22, gap: 10 }}>
        {[
          { t: "Notifications", s: "Suivre ta livraison en direct", on: notifOn, f: toggleNotif },
          { t: "Ma position", s: "Pour que le livreur te trouve", on: geoOn, f: toggleGeo },
        ].map((r) => (
          <Glass key={r.t} a={0.14} b={0.22} radius={22} style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14, paddingLeft: 16 }}>
            <View style={{ flex: 1 }}>
              <T w="bold" size={16}>{r.t}</T>
              <T size={13} color={th.muted} style={{ marginTop: 3 }}>{r.s}</T>
            </View>
            <Toggle on={r.on} onPress={r.f} label={r.t} />
          </Glass>
        ))}
      </Appear>
      <View style={{ marginTop: "auto" }}>
        <SlideButton variant="accent" label="Autoriser et continuer" onDone={allowAll} />
        <Pressable onPress={async () => { await AsyncStorage.setItem(PERMS_KEY, "1"); go("pay", false); }} accessibilityRole="button"
          style={{ alignSelf: "center", marginTop: 10, minHeight: 44, paddingHorizontal: 16, justifyContent: "center" }}>
          <T size={14} style={{ textDecorationLine: "underline" }}>Plus tard</T>
        </Pressable>
      </View>
    </View>
  );

  /* ═══ Paiement ═══ */
  const methods: { id: Method; name: string; sub: string }[] = [
    { id: "ec", name: "Mes Ecoins", sub: `Solde : ${ec(balance)} EC` },
    { id: "mm", name: "Mobile Money", sub: "Airtel, Orange ou M-Pesa · au livreur" },
    { id: "cash", name: "Cash à la livraison", sub: "Tu paies au livreur" },
  ];
  const renderPay = () => item && (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView contentContainerStyle={[pad, { flexGrow: 1 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Header title="Ma commande" onBack={() => go("prod", false)} />
        <Appear kind="rise" delay={60}>
          <Glass a={0.14} b={0.22} radius={24} style={{ marginTop: 18, padding: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <ArtTile item={item} size={46} tile={50} />
              <T w="bold" size={15} style={{ flex: 1 }} numberOfLines={2}>{item.name}</T>
              <T size={15} color={th.muted}>× {qty}</T>
            </View>
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: th.glass(0.16), gap: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}><T size={14} color={th.muted}>Produits</T><T size={14}>{ec(total)} EC</T></View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}><T size={14} color={th.muted}>Livraison</T><T size={13} color={th.muted}>{DELIVERY_NOTE}</T></View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}><T w="bold" size={16}>Total</T><T w="bold" size={16}>{ec(total)} EC</T></View>
            </View>
          </Glass>
        </Appear>

        <SectionLabel style={{ marginTop: 18 }}>LIVRER À</SectionLabel>
        <Appear kind="rise" delay={120}>
          <Glass a={0.12} b={0.22} radius={22} style={{ marginTop: 8, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: th.ink, alignItems: "center", justifyContent: "center" }}><BimIcon name="pin" size={20} color={th.onInk} /></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T w="bold" size={15}>Ma position actuelle</T>
              {editAddr ? (
                <TextInput value={address} onChangeText={setAddress} placeholder="Quartier, avenue, repère" placeholderTextColor={th.glass(0.55)} autoFocus
                  accessibilityLabel="Adresse de livraison"
                  style={{ fontFamily: F.regular, fontSize: 13, color: th.fg, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: th.glass(0.3) }} />
              ) : (
                <T size={13} color={th.muted} numberOfLines={2}>{address || "Recherche de ta position…"}</T>
              )}
            </View>
            <PressScale onPress={() => setEditAddr((e) => !e)} accessibilityLabel="Modifier l'adresse"
              style={{ height: 36, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: th.glass(0.3), justifyContent: "center" }}>
              <T size={13}>{editAddr ? "OK" : "Modifier"}</T>
            </PressScale>
          </Glass>
        </Appear>

        <SectionLabel style={{ marginTop: 18 }}>PAYER AVEC</SectionLabel>
        <Appear kind="rise" delay={180} style={{ marginTop: 8, gap: 8 }}>
          {methods.map((m) => {
            const on = m.id === method;
            return (
              <PressScale key={m.id} onPress={() => setMethod(m.id)} accessibilityLabel={m.name}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1,
                  borderColor: on ? th.fg : th.glass(0.2), backgroundColor: on ? th.glassFill(0.2) : th.glassFill(0.1), boxShadow: th.glassFx }}>
                <View style={{ flex: 1 }}>
                  <T w="bold" size={15}>{m.name}</T>
                  <T size={12} color={th.muted} style={{ marginTop: 2 }}>{m.sub}</T>
                </View>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? th.fg : th.glass(0.4), alignItems: "center", justifyContent: "center" }}>
                  {on && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: th.fg }} />}
                </View>
              </PressScale>
            );
          })}
        </Appear>

        <View style={{ marginTop: "auto", paddingTop: 22 }}>
          <SlideButton variant="accent" loading={busy} label={`${method === "ec" ? "Payer" : "Commander"} · ${ec(total)} EC`} onDone={submit} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <BimBackground enter={false}>
      <Animated.View style={leaveStyle}>
        <View key={step} style={{ flex: 1 }}>
          <Appear kind="page" duration={500} style={{ flex: 1 }}>
            {step === "cat" && renderCatalogue()}
            {step === "prod" && renderProduct()}
            {step === "perm" && renderPerm()}
            {step === "pay" && renderPay()}
            {step === "track" && item && orderNumber && (
              <OrderTracking orderNumber={orderNumber} item={item} qty={qty} paid={paidNow} method={method}
                onHome={() => router.back()} onAll={() => router.replace("/commandes" as any)}
                onRestart={() => { setItem(null); setOrderNumber(null); setQty(1); go("cat", false); }} />
            )}
          </Appear>
        </View>
      </Animated.View>
    </BimBackground>
  );
}
