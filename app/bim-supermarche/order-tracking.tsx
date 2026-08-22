/* eslint-disable */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useGetUserOrdersQuery, usePayOrderAtDeliveryMutation, useUpdateOrderShippingMutation } from "@/services/orderService";
import { useRateLivreurMutation } from "@/services/livreurService";
import { connectSocket, getSocket } from "@/services/socketService";
import { useAppTheme } from "@/app/_layout";

const SUPPORT_PHONE   = "+243861166469";
const SUPPORT_DISPLAY = "+243 861 166 469";

/* ─── PALETTE ────────────────────────────────────────────────────────── */
const LIGHT = {
  primary: "#0035C5", blue: "#0047FF", deep: "#001257",
  white:   "#FFFFFF", bg: "#F7F8FC", surface: "#FFFFFF",
  border:  "rgba(196,197,218,0.25)",
  text:    "#1A1C1C", textSec: "#434657", textMut: "#747688",
  green:   "#10B981", amber:   "#F59E0B", red:     "#EF4444",
  purple:  "#7C3AED",
  card:    "#FFFFFF", iconBtnBg: "#F3F4F8",
};
const DARK: typeof LIGHT = {
  primary: "#0035C5", blue: "#4D8DFF", deep: "#001257",
  white:   "#FFFFFF", bg: "#0B1220", surface: "#1A2540",
  border:  "rgba(31,42,68,0.80)",
  text:    "#EAF0FF", textSec: "#A3B4D0", textMut: "#6B7A99",
  green:   "#059669", amber:   "#D97706", red:     "#DC2626",
  purple:  "#7C3AED",
  card:    "#1A2540", iconBtnBg: "#0F1A2E",
};

/* ─── STATUS CONFIG ──────────────────────────────────────────────────── */
type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
const STATUS_STEPS: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

function getStatusMeta(C: typeof LIGHT): Record<OrderStatus, { label: string; icon: string; color: string; desc: string }> {
  return {
    pending:    { label: "En attente",     icon: "time-outline",             color: C.amber,   desc: "Commande reçue, en attente de confirmation" },
    confirmed:  { label: "Confirmée",      icon: "checkmark-circle-outline", color: C.primary, desc: "L'entreprise a confirmé votre commande" },
    processing: { label: "En préparation", icon: "construct-outline",        color: C.purple,  desc: "Votre commande est en cours de préparation" },
    shipped:    { label: "En livraison",   icon: "bicycle-outline",          color: C.blue,    desc: "Votre commande est en route vers vous" },
    delivered:  { label: "Livrée",         icon: "bag-check-outline",        color: C.green,   desc: "Commande livrée avec succès !" },
    cancelled:  { label: "Annulée",        icon: "close-circle-outline",     color: C.red,     desc: "Commande annulée" },
  };
}

/* ─── STATUS TIMELINE ─────────────────────────────────────────────────── */
function StatusTimeline({ status }: { status: OrderStatus }) {
  const { isDark } = useAppTheme();
  const C          = isDark ? DARK : LIGHT;
  const tl         = useMemo(() => mkTl(C), [isDark]);
  const STATUS_META = useMemo(() => getStatusMeta(C), [isDark]);
  const isCancelled = status === "cancelled";
  const currentIdx  = STATUS_STEPS.indexOf(status);

  if (isCancelled) {
    const meta = STATUS_META.cancelled;
    return (
      <View style={tl.cancelledBox}>
        <View style={[tl.cancelIcon, { backgroundColor: C.red + "12" }]}>
          <Ionicons name={meta.icon as any} size={28} color={C.red} />
        </View>
        <Text style={[tl.cancelTitle, { color: C.red }]}>{meta.label}</Text>
        <Text style={tl.cancelDesc}>{meta.desc}</Text>
      </View>
    );
  }

  return (
    <View style={tl.wrap}>
      {STATUS_STEPS.map((step, idx) => {
        const meta    = STATUS_META[step];
        const done    = idx <= currentIdx;
        const current = idx === currentIdx;
        const isLast  = idx === STATUS_STEPS.length - 1;
        return (
          <View key={step} style={tl.stepRow}>
            {/* Vertical line */}
            {!isLast && (
              <View style={[tl.line, { backgroundColor: done && idx < currentIdx ? meta.color + "60" : C.border }]} />
            )}
            {/* Circle */}
            <View style={[
              tl.circle,
              done  ? { backgroundColor: meta.color, borderColor: meta.color } : { backgroundColor: C.bg, borderColor: C.border },
              current && { shadowColor: meta.color, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
            ]}>
              <Ionicons name={meta.icon as any} size={15} color={done ? C.white : C.textMut} />
            </View>
            {/* Info */}
            <View style={tl.stepInfo}>
              <Text style={[tl.stepLabel, { color: done ? meta.color : C.textMut, fontFamily: current ? "NexaBold" : "NexaLight" }]}>
                {meta.label}
              </Text>
              {current && (
                <Text style={tl.stepDesc}>{meta.desc}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ─── PIN PAD ─────────────────────────────────────────────────────────── */
function PinPad({ value, onChange, onDelete }: { value: string; onChange: (k: string) => void; onDelete: () => void }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const pp = useMemo(() => mkPp(C), [isDark]);
  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return (
    <View style={pp.grid}>
      {keys.map((k, i) =>
        k === "" ? <View key={i} style={pp.key} /> :
        k === "⌫" ? (
          <TouchableOpacity key={i} style={pp.key} onPress={onDelete}>
            <Ionicons name="backspace-outline" size={22} color={C.textMut} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity key={i} style={pp.key} onPress={() => onChange(k)} disabled={value.length >= 6}>
            <Text style={pp.keyText}>{k}</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
}

/* ─── MAIN ─────────────────────────────────────────────────────────────── */
export default function OrderTracking() {
  const { isDark }  = useAppTheme();
  const C           = isDark ? DARK : LIGHT;
  const s           = useMemo(() => mkS(C),          [isDark]);
  const rm          = useMemo(() => mkRm(C),         [isDark]);
  const pm          = useMemo(() => mkPm(C),         [isDark]);
  const STATUS_META = useMemo(() => getStatusMeta(C), [isDark]);
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const router          = useRouter();

  const [showRating,    setShowRating]    = useState(false);
  const [ratingScore,   setRatingScore]   = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingDone,    setRatingDone]    = useState(false);

  const [payOrderAtDelivery, { isLoading: paying }] = usePayOrderAtDeliveryMutation();
  const [rateLivreur,        { isLoading: rating }] = useRateLivreurMutation();
  const [updateOrderShipping, { isLoading: savingAddress }] = useUpdateOrderShippingMutation();

  const [bonusAddress, setBonusAddress] = useState("");
  const [bonusPhone,   setBonusPhone]   = useState("");

  const { data, isLoading, refetch, isFetching } = useGetUserOrdersQuery({});

  useEffect(() => {
    if (!orderNumber) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit("track_order", orderNumber);
    const handler = (payload: any) => {
      if (payload.orderNumber === orderNumber) refetch();
    };
    socket.on("order:status_updated", handler);
    return () => { socket.off("order:status_updated", handler); };
  }, [orderNumber, refetch]);

  const orders: any[]       = data?.data || [];
  const order               = orders.find((o: any) => o.orderNumber === orderNumber);
  const status: OrderStatus = order?.status ?? "pending";
  const paymentStatus       = order?.paymentStatus ?? "pending";
  const meta                = STATUS_META[status] ?? STATUS_META.pending;
  const items: any[]        = order?.items || [];
  const total               = order?.grandTotal ?? 0;
  const livreur             = order?.livreur ?? null;
  const estimatedMinutes    = order?.estimatedMinutes ?? null;

  const isCancelled = status === "cancelled";
  const isDelivered = status === "delivered";
  const alreadyPaid = paymentStatus === "paid";
  const canPay      = status === "shipped" && !alreadyPaid;
  const canCancel   = !isCancelled && !isDelivered && ["pending", "confirmed"].includes(status);

  const handlePay = async () => {
    try {
      await payOrderAtDelivery({ orderNumber }).unwrap();
      refetch();
      if (livreur?.livreurId) setShowRating(true);
      else Alert.alert("Paiement effectué ✅", "Votre commande est marquée comme livrée et payée. Merci !");
    } catch (err: any) {
      Alert.alert("Erreur", err?.data?.message || "Le paiement n'a pas pu être effectué");
    }
  };

  const confirmPay = () => {
    Alert.alert(
      "Confirmer le paiement",
      `Payer ${Number(total).toFixed(2)} EC pour cette commande ?`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Payer", onPress: handlePay },
      ]
    );
  };

  const handleRate = async () => {
    if (ratingScore === 0) { Alert.alert("Note requise", "Veuillez sélectionner une note."); return; }
    try {
      await rateLivreur({ id: livreur.livreurId, score: ratingScore, comment: ratingComment.trim() || undefined }).unwrap();
      setRatingDone(true);
    } catch { setShowRating(false); }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.card} />

      {/* ── HEADER blanc ── */}
      <SafeAreaView edges={["top"]} style={s.header}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.headerTitle}>Suivi de commande</Text>
            {orderNumber ? <Text style={s.headerSub} numberOfLines={1}>{orderNumber}</Text> : null}
          </View>
          <TouchableOpacity style={s.iconBtn} onPress={() => refetch()} disabled={isFetching}>
            {isFetching
              ? <ActivityIndicator size="small" color={C.primary} />
              : <Ionicons name="refresh-outline" size={22} color={C.primary} />}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={C.primary} />}
        >
          {/* ── Status hero card ── */}
          <View style={[s.statusCard, { borderColor: meta.color + "30" }]}>
            <View style={[s.statusIcon, { backgroundColor: meta.color + "12" }]}>
              <Ionicons name={meta.icon as any} size={30} color={meta.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.statusLabel, { color: meta.color }]}>{meta.label}</Text>
              <Text style={s.statusDesc}>{meta.desc}</Text>
            </View>
            {alreadyPaid && (
              <View style={s.paidBadge}>
                <Ionicons name="shield-checkmark-outline" size={12} color={C.green} />
                <Text style={s.paidBadgeText}>Payé</Text>
              </View>
            )}
          </View>

          {/* ── Progression ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Progression</Text>
            <StatusTimeline status={status} />
          </View>

          {/* ── Articles ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Articles · {items.length}</Text>
            {items.map((item: any, i: number) => (
              <View key={i} style={[s.itemRow, i < items.length - 1 && s.itemDivider]}>
                <View style={s.itemDot} />
                <Text style={s.itemName} numberOfLines={1}>{item.product?.name || "Produit"}</Text>
                <Text style={s.itemQty}>×{item.qty}</Text>
                <Text style={s.itemPrice}>{parseFloat(item.totalAmount).toFixed(2)} EC</Text>
              </View>
            ))}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalVal}>{parseFloat(total).toFixed(2)} EC</Text>
            </View>
          </View>

          {/* ── Adresse ── */}
          {order?.shippingAddress && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Livraison</Text>
              <View style={s.addrRow}>
                <View style={[s.addrIcon, { backgroundColor: C.primary + "10" }]}>
                  <Ionicons name="location-outline" size={16} color={C.primary} />
                </View>
                <Text style={s.addrText}>{order.shippingAddress}</Text>
              </View>
              {order?.clientPhone && (
                <View style={[s.addrRow, { marginTop: 8 }]}>
                  <View style={[s.addrIcon, { backgroundColor: C.green + "10" }]}>
                    <Ionicons name="call-outline" size={16} color={C.green} />
                  </View>
                  <Text style={s.addrText}>{order.clientPhone}</Text>
                </View>
              )}
            </View>
          )}

          {/* ── Produit offert (bonus fidélité) sans adresse : on la demande ── */}
          {order?.paymentMethod === "bonus" && !order?.shippingAddress && (
            <View style={s.card}>
              <View style={[s.addrRow, { marginBottom: 10 }]}>
                <View style={[s.addrIcon, { backgroundColor: C.amber + "10" }]}>
                  <Ionicons name="gift-outline" size={16} color={C.amber} />
                </View>
                <Text style={s.cardTitle}>🎁 Produit offert — où vous livrer ?</Text>
              </View>
              <TextInput
                value={bonusAddress}
                onChangeText={setBonusAddress}
                placeholder="Adresse de livraison"
                placeholderTextColor={C.textMut}
                style={s.bonusInput}
              />
              <TextInput
                value={bonusPhone}
                onChangeText={setBonusPhone}
                placeholder="Téléphone"
                placeholderTextColor={C.textMut}
                keyboardType="phone-pad"
                style={[s.bonusInput, { marginTop: 8 }]}
              />
              <TouchableOpacity
                style={[s.confirmBtn, { marginTop: 4, opacity: bonusAddress.trim() ? 1 : 0.5 }]}
                disabled={!bonusAddress.trim() || savingAddress}
                onPress={async () => {
                  try {
                    await updateOrderShipping({ id: order.orderId, shippingAddress: bonusAddress.trim(), clientPhone: bonusPhone.trim() }).unwrap();
                    refetch();
                  } catch {
                    Alert.alert("Erreur", "Impossible d'enregistrer l'adresse, réessayez.");
                  }
                }}
              >
                <LinearGradient colors={[C.amber, "#D97706"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.confirmGrad}>
                  {savingAddress ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.confirmText}>Confirmer la livraison</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Livreur ── */}
          {livreur && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Votre livreur</Text>
              <View style={s.livreurRow}>
                <View style={s.livreurAvatar}>
                  <Ionicons name="bicycle" size={20} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.livreurName}>{livreur.user?.username ?? "Livreur BIM"}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={{ color: "#F59E0B", fontSize: 12 }}>★</Text>
                    <Text style={s.livreurRating}>{parseFloat(livreur.rating || 0).toFixed(1)}</Text>
                    <View style={s.onlineDot} />
                    <Text style={s.onlineText}>En ligne</Text>
                  </View>
                </View>
              </View>
              {estimatedMinutes && (
                <View style={s.etaRow}>
                  <Ionicons name="time-outline" size={14} color={C.amber} />
                  <Text style={s.etaText}>Livraison estimée dans {estimatedMinutes} min</Text>
                </View>
              )}
              <View style={s.livreurBtns}>
                {livreur.telephone && (
                  <TouchableOpacity style={[s.livreurBtn, { backgroundColor: C.green }]} onPress={() => Linking.openURL(`tel:${livreur.telephone}`)} activeOpacity={0.85}>
                    <Ionicons name="call" size={15} color={C.white} />
                    <Text style={s.livreurBtnText}>Appeler</Text>
                  </TouchableOpacity>
                )}
                {livreur.latitude && livreur.longitude && (
                  <TouchableOpacity style={[s.livreurBtn, { backgroundColor: C.primary }]} onPress={() => Linking.openURL(`https://maps.google.com/?q=${livreur.latitude},${livreur.longitude}`)} activeOpacity={0.85}>
                    <Ionicons name="navigate" size={15} color={C.white} />
                    <Text style={s.livreurBtnText}>Position</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ── Payer à la livraison ── */}
          {canPay && (
            <TouchableOpacity style={s.payBtn} onPress={confirmPay} activeOpacity={0.88} disabled={paying}>
              <LinearGradient colors={[C.green, "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.payGrad}>
                <View style={s.payIconWrap}>
                  <Ionicons name="wallet-outline" size={20} color={C.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.payTitle}>Payer à la livraison</Text>
                  <Text style={s.paySub}>{parseFloat(total).toFixed(2)} EC — Portefeuille BIM</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.white} />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ── Annuler / Remboursement ── */}
          {alreadyPaid ? (
            <View style={s.refundCard}>
              <Ionicons name="information-circle-outline" size={18} color={C.amber} />
              <View style={{ flex: 1 }}>
                <Text style={[s.refundTitle, { color: C.amber }]}>Commande déjà payée</Text>
                <Text style={s.refundSub}>Pour un remboursement, contactez BIM NEXT ou l'entreprise.</Text>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} style={s.refundCall}>
                  <Ionicons name="call" size={12} color={C.green} />
                  <Text style={s.refundCallText}>{SUPPORT_DISPLAY}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : canCancel ? (
            <TouchableOpacity
              style={s.cancelBtn}
              onPress={() => Alert.alert(
                "Annuler la commande",
                "Voulez-vous vraiment annuler ?",
                [
                  { text: "Non", style: "cancel" },
                  { text: "Annuler", style: "destructive", onPress: () => Alert.alert("Contact requis", `Appelez le ${SUPPORT_DISPLAY} pour annuler.`) },
                ]
              )}
              activeOpacity={0.85}
            >
              <Ionicons name="close-circle-outline" size={15} color={C.red} />
              <Text style={s.cancelText}>Annuler la commande</Text>
            </TouchableOpacity>
          ) : null}

          {/* ── Support ── */}
          <TouchableOpacity style={s.supportBtn} onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} activeOpacity={0.85}>
            <View style={[s.supportIcon, { backgroundColor: C.green + "12" }]}>
              <Ionicons name="call-outline" size={18} color={C.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.supportLabel}>Un problème avec votre commande ?</Text>
              <Text style={s.supportNum}>{SUPPORT_DISPLAY}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.textMut} />
          </TouchableOpacity>

          {(isDelivered || alreadyPaid) && (
            <TouchableOpacity style={s.homeBtn} onPress={() => router.replace("/(tabs)" as any)} activeOpacity={0.88}>
              <LinearGradient colors={[C.blue, C.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.homeGrad}>
                <Ionicons name="home-outline" size={18} color={C.white} />
                <Text style={s.homeText}>Retour à l'accueil</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── MODAL NOTATION ── */}
      <Modal visible={showRating} transparent animationType="slide" onRequestClose={() => setShowRating(false)}>
        <View style={rm.overlay}>
          <View style={rm.sheet}>
            <View style={rm.handle} />
            {!ratingDone ? (
              <>
                <View style={rm.avatarWrap}>
                  <Ionicons name="bicycle" size={28} color={C.primary} />
                </View>
                <Text style={rm.title}>Évaluer votre livreur</Text>
                <Text style={rm.sub}>{livreur?.user?.username ?? "Votre livreur"} — Comment s'est passée la livraison ?</Text>
                <View style={rm.stars}>
                  {[1,2,3,4,5].map(star => (
                    <TouchableOpacity key={star} onPress={() => setRatingScore(star)} activeOpacity={0.7}>
                      <Ionicons name={star <= ratingScore ? "star" : "star-outline"} size={38} color={star <= ratingScore ? "#F59E0B" : "#D1D5DB"} />
                    </TouchableOpacity>
                  ))}
                </View>
                {ratingScore > 0 && (
                  <Text style={[rm.scoreLabel, { color: ratingScore >= 4 ? C.green : ratingScore >= 3 ? C.amber : C.red }]}>
                    {ratingScore === 5 ? "Excellent ! 🎉" : ratingScore === 4 ? "Très bien 👍" : ratingScore === 3 ? "Correct 😐" : ratingScore === 2 ? "Décevant 😕" : "Mauvais 😞"}
                  </Text>
                )}
                <TextInput
                  style={rm.input}
                  placeholder="Commentaire optionnel…"
                  placeholderTextColor={C.textMut}
                  value={ratingComment}
                  onChangeText={setRatingComment}
                  multiline maxLength={200}
                />
                <TouchableOpacity style={[rm.submitBtn, ratingScore === 0 && { opacity: 0.5 }]} onPress={handleRate} disabled={ratingScore === 0 || rating} activeOpacity={0.85}>
                  <LinearGradient colors={[C.blue, C.deep]} style={rm.submitGrad}>
                    {rating ? <ActivityIndicator size="small" color={C.white} /> : <><Ionicons name="star" size={15} color={C.white} /><Text style={rm.submitText}>Envoyer ma note</Text></>}
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={rm.skipBtn} onPress={() => { setShowRating(false); Alert.alert("Paiement effectué ✅", "Merci !"); }}>
                  <Text style={rm.skipText}>Passer cette étape</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={rm.successWrap}>
                <Ionicons name="checkmark-circle" size={60} color={C.green} />
                <Text style={rm.title}>Merci pour votre avis !</Text>
                <Text style={rm.sub}>Votre évaluation aide à améliorer la qualité des livraisons.</Text>
                <View style={rm.stars}>
                  {[1,2,3,4,5].map(star => (
                    <Ionicons key={star} name={star <= ratingScore ? "star" : "star-outline"} size={26} color={star <= ratingScore ? "#F59E0B" : "#D1D5DB"} />
                  ))}
                </View>
                <TouchableOpacity style={[rm.submitBtn, { marginTop: 12 }]} onPress={() => setShowRating(false)} activeOpacity={0.85}>
                  <LinearGradient colors={[C.blue, C.deep]} style={rm.submitGrad}>
                    <Ionicons name="home-outline" size={15} color={C.white} />
                    <Text style={rm.submitText}>Retour</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { paddingHorizontal: 16, paddingBottom: 60, paddingTop: 12, gap: 12 },

  /* Header */
  header:      { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  topBar:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  iconBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: C.iconBtnBg, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "NexaBold", fontSize: 17, color: C.text },
  headerSub:   { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, marginTop: 1 },

  /* Status card */
  statusCard:  { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, elevation: 1, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  statusIcon:  { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  statusLabel: { fontFamily: "NexaBold", fontSize: 16 },
  statusDesc:  { fontFamily: "NexaLight", fontSize: 12, color: C.textSec, marginTop: 3, lineHeight: 17 },
  paidBadge:   { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.green + "12", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  paidBadgeText: { fontFamily: "NexaBold", fontSize: 11, color: C.green },

  /* Card */
  card:      { backgroundColor: C.card, borderRadius: 20, padding: 18, elevation: 1, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  cardTitle: { fontFamily: "NexaBold", fontSize: 14, color: C.text, marginBottom: 14 },

  /* Items */
  itemRow:     { flexDirection: "row", alignItems: "center", paddingVertical: 9, gap: 8 },
  itemDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
  itemDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary + "50" },
  itemName:    { flex: 1, fontFamily: "NexaLight", fontSize: 13, color: C.text },
  itemQty:     { fontFamily: "NexaLight", fontSize: 12, color: C.textMut },
  itemPrice:   { fontFamily: "NexaBold", fontSize: 13, color: C.primary, minWidth: 72, textAlign: "right" },
  totalRow:    { flexDirection: "row", justifyContent: "space-between", paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: C.border },
  totalLabel:  { fontFamily: "NexaBold", fontSize: 14, color: C.text },
  totalVal:    { fontFamily: "NexaBold", fontSize: 16, color: C.primary },

  /* Address */
  addrRow:  { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  addrIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  bonusInput: {
    borderWidth: 1, borderColor: C.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: "NexaLight", fontSize: 14, color: C.text,
    backgroundColor: C.bg,
  },
  addrText: { flex: 1, fontFamily: "NexaLight", fontSize: 13, color: C.text, lineHeight: 19, paddingTop: 6 },

  /* Livreur */
  livreurRow:    { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  livreurAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primary + "10", alignItems: "center", justifyContent: "center" },
  livreurName:   { fontFamily: "NexaBold", fontSize: 15, color: C.text },
  livreurRating: { fontFamily: "NexaLight", fontSize: 12, color: C.textMut },
  onlineDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  onlineText:    { fontFamily: "NexaBold", fontSize: 10, color: C.green },
  etaRow:        { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.amber + "10", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 12 },
  etaText:       { fontFamily: "NexaBold", fontSize: 12, color: C.amber },
  livreurBtns:   { flexDirection: "row", gap: 10 },
  livreurBtn:    { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, paddingVertical: 10 },
  livreurBtnText:{ fontFamily: "NexaBold", fontSize: 13, color: C.white },

  /* Pay button */
  payBtn:      { borderRadius: 20, overflow: "hidden", elevation: 3, shadowColor: C.green, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  payGrad:     { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  payIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  payTitle:    { fontFamily: "NexaBold", fontSize: 15, color: C.white },
  paySub:      { fontFamily: "NexaLight", fontSize: 12, color: "rgba(255,255,255,0.80)", marginTop: 2 },

  /* PIN */
  pinHint:    { fontFamily: "NexaLight", fontSize: 13, color: C.textSec, textAlign: "center", marginBottom: 16 },
  pinDots:    { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 8 },
  pinDot:     { width: 16, height: 16, borderRadius: 8, borderWidth: 2, backgroundColor: "transparent" },
  pinError:   { fontFamily: "NexaLight", fontSize: 12, color: C.red, textAlign: "center", marginBottom: 8 },
  confirmBtn: { borderRadius: 16, overflow: "hidden", marginTop: 16 },
  confirmGrad:{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15 },
  confirmText:{ fontFamily: "NexaBold", fontSize: 15, color: C.white },

  /* Cancel / Refund */
  cancelBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: C.red + "30", backgroundColor: C.red + "06" },
  cancelText: { fontFamily: "NexaBold", fontSize: 13, color: C.red },
  refundCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.amber + "30", padding: 14 },
  refundTitle:{ fontFamily: "NexaBold", fontSize: 13, marginBottom: 4 },
  refundSub:  { fontFamily: "NexaLight", fontSize: 12, color: C.textSec, lineHeight: 17 },
  refundCall: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  refundCallText: { fontFamily: "NexaBold", fontSize: 13, color: C.green },

  /* Support */
  supportBtn:  { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  supportIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  supportLabel:{ fontFamily: "NexaLight", fontSize: 11, color: C.textMut, marginBottom: 2 },
  supportNum:  { fontFamily: "NexaBold", fontSize: 14, color: C.green },

  /* Home button */
  homeBtn:  { borderRadius: 20, overflow: "hidden", elevation: 3, shadowColor: C.blue, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  homeGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  homeText: { fontFamily: "NexaBold", fontSize: 15, color: C.white },
}); }

/* ─── TIMELINE STYLES ─────────────────────────────────────────────────── */
function mkTl(C: typeof LIGHT) { return StyleSheet.create({
  wrap:         { gap: 0 },
  stepRow:      { flexDirection: "row", alignItems: "flex-start", paddingBottom: 20 },
  line:         { position: "absolute", left: 17, top: 36, width: 2, height: "100%", zIndex: -1 },
  circle:       { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: "center", justifyContent: "center", marginRight: 12, zIndex: 1 },
  stepInfo:     { flex: 1, paddingTop: 6 },
  stepLabel:    { fontSize: 13 },
  stepDesc:     { fontFamily: "NexaLight", fontSize: 11, color: C.textSec, marginTop: 3, lineHeight: 16 },
  cancelledBox: { alignItems: "center", gap: 10, paddingVertical: 8 },
  cancelIcon:   { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  cancelTitle:  { fontFamily: "NexaBold", fontSize: 16 },
  cancelDesc:   { fontFamily: "NexaLight", fontSize: 12, color: C.textMut, textAlign: "center" },
}); }

/* ─── PIN PAD STYLES ─────────────────────────────────────────────────── */
function mkPp(C: typeof LIGHT) { return StyleSheet.create({
  grid:    { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  key:     { width: "33.33%", alignItems: "center", justifyContent: "center", paddingVertical: 16 },
  keyText: { fontFamily: "NexaBold", fontSize: 22, color: C.text },
}); }

/* ─── PAYMENT BOTTOM SHEET STYLES ────────────────────────────────────── */
function mkPm(C: typeof LIGHT) { return StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.52)", justifyContent: "flex-end" },
  sheet:       { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingBottom: 36 },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB", alignSelf: "center", marginVertical: 14 },
  header:      { alignItems: "center", marginBottom: 8 },
  amountBadge: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.green + "12", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 12 },
  amountTxt:   { fontFamily: "NexaBold", fontSize: 18 },
  title:       { fontFamily: "NexaBold", fontSize: 20, marginBottom: 6, textAlign: "center" },
  sub:         { fontFamily: "NexaBold", fontSize: 13, textAlign: "center", lineHeight: 18 },
  dots:        { flexDirection: "row", justifyContent: "center", gap: 14, marginVertical: 18 },
  dot:         { width: 18, height: 18, borderRadius: 9, borderWidth: 2, backgroundColor: "transparent" },
  pinError:    { fontFamily: "NexaBold", fontSize: 13, textAlign: "center", marginBottom: 4 },
  confirmBtn:  { borderRadius: 18, overflow: "hidden", marginTop: 12 },
  confirmGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  confirmTxt:  { fontFamily: "NexaBold", fontSize: 16, color: C.white },
  cancelBtn:   { alignItems: "center", paddingVertical: 14 },
  cancelTxt:   { fontFamily: "NexaBold", fontSize: 14 },
}); }

/* ─── RATING MODAL STYLES ─────────────────────────────────────────────── */
function mkRm(C: typeof LIGHT) { return StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.48)", justifyContent: "flex-end" },
  sheet:       { backgroundColor: C.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40, alignItems: "center" },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB", alignSelf: "center", marginBottom: 20 },
  avatarWrap:  { width: 64, height: 64, borderRadius: 32, backgroundColor: C.primary + "10", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title:       { fontFamily: "NexaBold", fontSize: 18, color: C.text, marginBottom: 4, textAlign: "center" },
  sub:         { fontFamily: "NexaLight", fontSize: 12, color: C.textMut, textAlign: "center", marginBottom: 16, lineHeight: 18 },
  stars:       { flexDirection: "row", gap: 8, marginBottom: 10 },
  scoreLabel:  { fontFamily: "NexaBold", fontSize: 14, marginBottom: 14 },
  input:       { width: "100%", borderWidth: 1.5, borderColor: C.border, borderRadius: 14, padding: 12, fontFamily: "NexaLight", fontSize: 13, minHeight: 70, marginBottom: 16, color: C.text },
  submitBtn:   { borderRadius: 16, overflow: "hidden", width: "100%" },
  submitGrad:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  submitText:  { fontFamily: "NexaBold", fontSize: 14, color: C.white },
  skipBtn:     { paddingVertical: 14 },
  skipText:    { fontFamily: "NexaLight", fontSize: 13, color: C.textMut },
  successWrap: { alignItems: "center", gap: 10, paddingVertical: 8, width: "100%" },
}); }
