import React, { useEffect, useRef, useState } from "react";
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
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useGetUserOrdersQuery, usePayOrderAtDeliveryMutation } from "@/services/orderService";
import { useRateLivreurMutation } from "@/services/livreurService";
import { connectSocket, getSocket } from "@/services/socketService";

const SUPPORT_PHONE   = "+243861166469";
const SUPPORT_DISPLAY = "+243 861 166 469";

/* ─── THEME ──────────────────────────────────────────────────────────── */
const C = {
  primary: "#0353CC", violet: "#3906C7", deep: "#302E99",
  accent: "#4D96FF", gold: "#FFD700", green: "#22C55E",
  red: "#EF4444", orange: "#F97316", white: "#FFFFFF",
  text: "#0D1B3E", muted: "#7B8DB0", f4: "#F4F6FB",
};
const TH = {
  light: { bg: "#F0F4FF", card: "#FFFFFF", text: "#0D1B3E", sub: "#7B8DB0", border: "rgba(3,83,204,0.10)", headerGrad: [C.deep, C.primary] as [string, string] },
  dark:  { bg: "#0A0F1E", card: "#111827", text: "#E2E8F0", sub: "#64748B", border: "rgba(255,255,255,0.08)", headerGrad: ["#060B18", "#0D1B3E"] as [string, string] },
};
function useTheme() {
  const isDark = useColorScheme() === "dark";
  return { isDark, t: isDark ? TH.dark : TH.light };
}

/* ─── STATUS CONFIG ──────────────────────────────────────────────────── */
type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

const STATUS_STEPS: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

const STATUS_META: Record<OrderStatus, { label: string; icon: string; color: string; desc: string }> = {
  pending:    { label: "En attente",     icon: "time-outline",            color: C.orange,  desc: "Commande reçue, en attente de confirmation" },
  confirmed:  { label: "Confirmée",      icon: "checkmark-circle-outline", color: C.primary, desc: "L'entreprise a confirmé votre commande" },
  processing: { label: "En préparation", icon: "construct-outline",        color: C.violet,  desc: "Votre commande est en cours de préparation" },
  shipped:    { label: "En livraison",   icon: "bicycle-outline",          color: C.accent,  desc: "Votre commande est en route vers vous" },
  delivered:  { label: "Livrée",         icon: "bag-check-outline",        color: C.green,   desc: "Commande livrée avec succès !" },
  cancelled:  { label: "Annulée",        icon: "close-circle-outline",     color: C.red,     desc: "Commande annulée" },
};

/* ─── TIMELINE ───────────────────────────────────────────────────────── */
function StatusTimeline({ status }: { status: OrderStatus }) {
  const isCancelled = status === "cancelled";
  const currentIdx  = STATUS_STEPS.indexOf(status);

  if (isCancelled) {
    const meta = STATUS_META.cancelled;
    return (
      <View style={[tl.cancelled, { borderColor: C.red + "30", backgroundColor: C.red + "08" }]}>
        <Ionicons name={meta.icon as any} size={32} color={C.red} />
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
        return (
          <View key={step} style={tl.stepRow}>
            {idx < STATUS_STEPS.length - 1 && (
              <View style={[tl.line, done && idx < currentIdx && { backgroundColor: C.primary }]} />
            )}
            <View style={[
              tl.circle,
              done  && { backgroundColor: meta.color, borderColor: meta.color },
              !done && { borderColor: C.muted + "50", backgroundColor: "transparent" },
            ]}>
              <Ionicons name={meta.icon as any} size={16} color={done ? C.white : C.muted} />
              {current && <View style={[tl.pulse, { borderColor: meta.color }]} />}
            </View>
            <View style={tl.stepInfo}>
              <Text style={[tl.stepLabel, { color: done ? meta.color : C.muted, fontWeight: current ? "700" : "400" }]}>
                {meta.label}
              </Text>
              {current && <Text style={[tl.stepDesc, { color: C.muted }]}>{meta.desc}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ─── PIN PAD ────────────────────────────────────────────────────────── */
function PinPad({ value, onChange, onDelete }: { value: string; onChange: (k: string) => void; onDelete: () => void }) {
  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return (
    <View style={pp.grid}>
      {keys.map((k, i) =>
        k === "" ? <View key={i} style={pp.key} /> :
        k === "⌫" ? (
          <TouchableOpacity key={i} style={pp.key} onPress={onDelete}>
            <Ionicons name="backspace-outline" size={22} color={C.muted} />
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

/* ─── MAIN ───────────────────────────────────────────────────────────── */
export default function OrderTracking() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const router          = useRouter();
  const { isDark, t }   = useTheme();

  /* Payment state */
  const [showPay,  setShowPay]  = useState(false);
  const [pin,      setPin]      = useState("");
  const [pinError, setPinError] = useState("");
  const pinShake = useRef(new Animated.Value(0)).current;

  /* Rating state */
  const [showRating,     setShowRating]     = useState(false);
  const [ratingScore,    setRatingScore]    = useState(0);
  const [ratingComment,  setRatingComment]  = useState("");
  const [ratingDone,     setRatingDone]     = useState(false);

  const [payOrderAtDelivery, { isLoading: paying }] = usePayOrderAtDeliveryMutation();
  const [rateLivreur, { isLoading: rating }] = useRateLivreurMutation();

  const { data, isLoading, refetch, isFetching } = useGetUserOrdersQuery({});

  // Temps réel — écouter les changements de statut via Socket.io
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

  const orders: any[]   = data?.data || [];
  const order           = orders.find(o => o.orderNumber === orderNumber);
  const status: OrderStatus = order?.status ?? "pending";
  const paymentStatus   = order?.paymentStatus ?? "pending";
  const meta            = STATUS_META[status] ?? STATUS_META.pending;
  const items: any[]    = order?.items || [];
  const total           = order?.grandTotal ?? 0;
  const livreur         = order?.livreur ?? null;
  const estimatedMinutes = order?.estimatedMinutes ?? null;

  const isCancelled    = status === "cancelled";
  const isDelivered    = status === "delivered";
  const alreadyPaid    = paymentStatus === "paid";
  const canPay         = !isCancelled && !isDelivered && !alreadyPaid;
  const canCancel      = !isCancelled && !isDelivered && ["pending", "confirmed"].includes(status);

  /* ── Shake PIN ── */
  const shakePin = () => {
    Animated.sequence([
      Animated.timing(pinShake, { toValue: 10,  duration: 50, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: 6,   duration: 50, useNativeDriver: true }),
      Animated.timing(pinShake, { toValue: 0,   duration: 50, useNativeDriver: true }),
    ]).start();
  };

  /* ── Payer à la livraison ── */
  const handlePay = async () => {
    if (pin.length < 6) return;
    try {
      await payOrderAtDelivery({ orderNumber, pin }).unwrap();
      setShowPay(false);
      setPin("");
      setPinError("");
      refetch();
      // Ouvrir la notation si un livreur est assigné
      if (livreur?.livreurId) {
        setShowRating(true);
      } else {
        Alert.alert("Paiement effectué ✅", "Votre commande est marquée comme livrée et payée. Merci !");
      }
    } catch (err: any) {
      const msg = err?.data?.message || "Code PIN incorrect ou solde insuffisant";
      setPinError(msg);
      shakePin();
    }
  };

  /* ── Soumettre la note ── */
  const handleRate = async () => {
    if (ratingScore === 0) {
      Alert.alert("Note requise", "Veuillez sélectionner une note de 1 à 5 étoiles.");
      return;
    }
    try {
      await rateLivreur({ id: livreur.livreurId, score: ratingScore, comment: ratingComment.trim() || undefined }).unwrap();
      setRatingDone(true);
    } catch {
      // On ferme quand même sans bloquer
      setShowRating(false);
    }
  };

  const handleSkipRating = () => {
    setShowRating(false);
    Alert.alert("Paiement effectué ✅", "Votre commande est marquée comme livrée et payée. Merci !");
  };

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER ── */}
      <View style={[s.header, { shadowColor: isDark ? "#000" : C.primary }]}>
        <LinearGradient colors={t.headerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={s.deco1} />
        <View style={s.deco2} />
        <SafeAreaView edges={["top"]}>
          <View style={s.topBar}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.replace("/(tabs)")}>
              <Ionicons name="arrow-back" size={20} color={C.white} />
            </TouchableOpacity>
            <View style={s.titleWrap}>
              <View style={s.titleBadge}>
                <Ionicons name="receipt-outline" size={12} color={C.gold} />
              </View>
              <Text style={s.headerTitle}>SUIVI DE COMMANDE</Text>
            </View>
            <TouchableOpacity style={s.iconBtn} onPress={() => refetch()} disabled={isFetching}>
              {isFetching ? <ActivityIndicator size="small" color={C.white} /> : <Ionicons name="refresh" size={20} color={C.white} />}
            </TouchableOpacity>
          </View>
          <Text style={s.headerSub} numberOfLines={1}>{orderNumber}</Text>
        </SafeAreaView>
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={C.primary} />}
        >
          {/* Status hero */}
          <View style={[s.statusCard, { backgroundColor: meta.color + "12", borderColor: meta.color + "30" }]}>
            <View style={[s.statusIcon, { backgroundColor: meta.color + "20" }]}>
              <Ionicons name={meta.icon as any} size={28} color={meta.color} />
            </View>
            <Text style={[s.statusLabel, { color: meta.color }]}>{meta.label}</Text>
            <Text style={[s.statusDesc, { color: t.sub }]}>{meta.desc}</Text>
            {alreadyPaid && (
              <View style={s.paidBadge}>
                <Ionicons name="shield-checkmark-outline" size={13} color={C.green} />
                <Text style={s.paidBadgeText}>Payé</Text>
              </View>
            )}
          </View>

          {/* Timeline */}
          <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
            <View style={s.sectionHeader}>
              <View style={[s.dot, { backgroundColor: C.primary }]} />
              <Text style={[s.sectionTitle, { color: t.sub }]}>PROGRESSION</Text>
            </View>
            <StatusTimeline status={status} />
          </View>

          {/* Articles */}
          <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
            <View style={s.sectionHeader}>
              <View style={[s.dot, { backgroundColor: C.gold }]} />
              <Text style={[s.sectionTitle, { color: t.sub }]}>ARTICLES ({items.length})</Text>
            </View>
            {items.map((item, i) => (
              <View key={i} style={[s.itemRow, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.border }]}>
                <Text style={[s.itemName, { color: t.text }]} numberOfLines={1}>{item.product?.name || "Produit"}</Text>
                <Text style={[s.itemQty, { color: t.sub }]}>×{item.qty}</Text>
                <Text style={s.itemPrice}>{parseFloat(item.totalAmount).toFixed(2)} EC</Text>
              </View>
            ))}
            <View style={[s.totalRow, { borderTopColor: t.border }]}>
              <Text style={[s.totalLabel, { color: t.text }]}>Total</Text>
              <Text style={s.totalVal}>{total.toFixed(2)} EC</Text>
            </View>
          </View>

          {/* Livraison */}
          {order?.shippingAddress && (
            <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }]}>
              <View style={s.sectionHeader}>
                <View style={[s.dot, { backgroundColor: C.violet }]} />
                <Text style={[s.sectionTitle, { color: t.sub }]}>LIVRAISON</Text>
              </View>
              <View style={s.addressRow}>
                <Ionicons name="location-outline" size={16} color={C.primary} />
                <Text style={[s.addressText, { color: t.text }]}>{order.shippingAddress}</Text>
              </View>
            </View>
          )}

          {/* ── PAYER À LA LIVRAISON ── */}
          {canPay && !showPay && (
            <TouchableOpacity style={s.payBtn} onPress={() => setShowPay(true)} activeOpacity={0.88}>
              <LinearGradient colors={[C.green, "#16A34A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.payGrad}>
                <View style={s.payIconWrap}>
                  <Ionicons name="wallet-outline" size={20} color={C.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.payTitle}>Payer à la livraison</Text>
                  <Text style={s.paySub}>{total.toFixed(2)} EC — Portefeuille BIM</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.white} />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ── PIN PAD ── */}
          {canPay && showPay && (
            <View style={[s.card, s.payCard, { backgroundColor: t.card, borderColor: C.green + "40" }]}>
              <View style={s.sectionHeader}>
                <View style={[s.dot, { backgroundColor: C.green }]} />
                <Text style={[s.sectionTitle, { color: C.green }]}>PAIEMENT — {total.toFixed(2)} EC</Text>
                <TouchableOpacity onPress={() => { setShowPay(false); setPin(""); setPinError(""); }} style={{ marginLeft: "auto" }}>
                  <Ionicons name="close-circle-outline" size={20} color={C.muted} />
                </TouchableOpacity>
              </View>

              <Text style={[s.pinHint, { color: t.sub }]}>Entrez votre code PIN (6 chiffres)</Text>

              <Animated.View style={[s.pinDots, { transform: [{ translateX: pinShake }] }]}>
                {[0,1,2,3,4,5].map(i => (
                  <View key={i} style={[
                    s.pinDot,
                    { borderColor: pinError ? C.red : C.green },
                    i < pin.length && { backgroundColor: C.green },
                  ]} />
                ))}
              </Animated.View>
              {pinError ? <Text style={s.pinError}>{pinError}</Text> : null}

              <PinPad value={pin} onChange={k => { setPinError(""); setPin(p => p.length < 6 ? p + k : p); }} onDelete={() => setPin(p => p.slice(0, -1))} />

              <TouchableOpacity
                style={[s.confirmBtn, (paying || pin.length < 6) && { opacity: 0.55 }]}
                onPress={handlePay}
                disabled={paying || pin.length < 6}
              >
                <LinearGradient colors={[C.green, "#16A34A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.confirmGrad}>
                  {paying
                    ? <ActivityIndicator color={C.white} size="small" />
                    : <>
                        <Ionicons name="checkmark-circle-outline" size={18} color={C.white} />
                        <Text style={s.confirmText}>Confirmer le paiement</Text>
                      </>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ── ANNULER ── */}
          {alreadyPaid ? (
            <View style={[s.refundCard, { backgroundColor: t.card, borderColor: C.orange + "40" }]}>
              <Ionicons name="information-circle-outline" size={18} color={C.orange} />
              <View style={{ flex: 1 }}>
                <Text style={[s.refundTitle, { color: C.orange }]}>Commande déjà payée</Text>
                <Text style={[s.refundSub, { color: t.sub }]}>
                  Pour un remboursement, contactez BIM NEXT ou l'entreprise auprès de qui vous avez passé commande.
                </Text>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} style={s.refundCall}>
                  <Ionicons name="call" size={13} color={C.green} />
                  <Text style={s.refundCallText}>{SUPPORT_DISPLAY}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : canCancel ? (
            <TouchableOpacity
              style={s.cancelBtn}
              onPress={() => Alert.alert(
                "Annuler la commande",
                "Voulez-vous vraiment annuler cette commande ?",
                [
                  { text: "Non", style: "cancel" },
                  { text: "Annuler la commande", style: "destructive", onPress: () => {
                    /* updateOrderStatus to cancelled — handled via existing mutation */
                    Alert.alert("Contactez le support", `Veuillez appeler BIM NEXT au ${SUPPORT_DISPLAY} pour annuler votre commande.`);
                  }},
                ]
              )}
              activeOpacity={0.85}
            >
              <Ionicons name="close-circle-outline" size={16} color={C.red} />
              <Text style={s.cancelText}>Annuler la commande</Text>
            </TouchableOpacity>
          ) : null}

          {/* Livreur assigné */}
          {livreur && (
            <View style={s.livreurCard}>
              <View style={s.livreurHeader}>
                <View style={s.livreurIconWrap}>
                  <Ionicons name="bicycle" size={20} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.livreurTitle, { color: t.text }]}>Votre livreur</Text>
                  <Text style={[s.livreurSub, { color: t.sub }]}>En route vers vous</Text>
                </View>
                <View style={s.livreurOnline}>
                  <Text style={s.livreurOnlineTxt}>🟢 En ligne</Text>
                </View>
              </View>
              {estimatedMinutes && (
                <View style={s.estTimeRow}>
                  <Ionicons name="time-outline" size={14} color={C.orange} />
                  <Text style={s.estTimeTxt}>Livraison dans environ {estimatedMinutes} min</Text>
                </View>
              )}
              <View style={s.livreurRow}>
                <Ionicons name="person-circle-outline" size={16} color={C.muted} />
                <Text style={[s.livreurInfo, { color: t.text }]}>{livreur.user?.username ?? "Livreur BIM"}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 2, marginLeft: 8 }}>
                  <Text style={{ color: "#FFD700", fontSize: 12 }}>★</Text>
                  <Text style={[s.livreurInfo, { color: C.muted }]}>{parseFloat(livreur.rating || 0).toFixed(1)}</Text>
                </View>
              </View>
              <View style={s.livreurBtns}>
                {livreur.telephone && (
                  <TouchableOpacity
                    style={s.livreurBtn}
                    onPress={() => Linking.openURL(`tel:${livreur.telephone}`)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call" size={16} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={s.livreurBtnTxt}>Appeler · {livreur.telephone}</Text>
                  </TouchableOpacity>
                )}
                {livreur.latitude && livreur.longitude && (
                  <TouchableOpacity
                    style={[s.livreurBtn, { backgroundColor: C.primary }]}
                    onPress={() => Linking.openURL(`https://maps.google.com/?q=${livreur.latitude},${livreur.longitude}`)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate" size={16} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={s.livreurBtnTxt}>Voir sa position</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Support */}
          <TouchableOpacity style={s.supportBtn} onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} activeOpacity={0.85}>
            <View style={s.supportIconWrap}>
              <Ionicons name="call" size={18} color={C.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.supportLabel, { color: t.sub }]}>Un problème avec votre commande ?</Text>
              <Text style={s.supportNum}>{SUPPORT_DISPLAY}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.green} />
          </TouchableOpacity>

          {(isDelivered || alreadyPaid) && (
            <TouchableOpacity style={s.homeBtn} onPress={() => router.replace("/(tabs)")}>
              <LinearGradient colors={[C.deep, C.primary]} style={s.homeBtnGrad}>
                <Ionicons name="home-outline" size={18} color={C.white} />
                <Text style={s.homeBtnText}>Retour à l'accueil</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* ══ MODAL NOTATION LIVREUR ══ */}
      <Modal visible={showRating} transparent animationType="slide" onRequestClose={handleSkipRating}>
        <View style={s.ratingOverlay}>
          <View style={[s.ratingSheet, { backgroundColor: isDark ? TH.dark.card : "#FFF" }]}>

            {!ratingDone ? (
              <>
                {/* Header */}
                <View style={s.ratingHeader}>
                  <View style={s.ratingAvatarWrap}>
                    <Ionicons name="bicycle" size={28} color={C.primary} />
                  </View>
                  <Text style={[s.ratingTitle, { color: isDark ? TH.dark.text : C.text }]}>
                    Évaluer votre livreur
                  </Text>
                  <Text style={[s.ratingSub, { color: isDark ? TH.dark.sub : C.muted }]}>
                    {livreur?.user?.username ?? "Votre livreur"} · Comment s'est passée la livraison ?
                  </Text>
                </View>

                {/* Étoiles */}
                <View style={s.starsRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity key={star} onPress={() => setRatingScore(star)} activeOpacity={0.7}>
                      <Ionicons
                        name={star <= ratingScore ? "star" : "star-outline"}
                        size={40}
                        color={star <= ratingScore ? "#FFD700" : (isDark ? "#374151" : "#D1D5DB")}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Label selon score */}
                {ratingScore > 0 && (
                  <Text style={[s.ratingScoreLabel, { color: ratingScore >= 4 ? C.green : ratingScore >= 3 ? C.orange : C.red }]}>
                    {ratingScore === 5 ? "Excellent ! 🎉" : ratingScore === 4 ? "Très bien 👍" : ratingScore === 3 ? "Correct 😐" : ratingScore === 2 ? "Décevant 😕" : "Mauvais 😞"}
                  </Text>
                )}

                {/* Commentaire optionnel */}
                <TextInput
                  style={[s.ratingInput, {
                    borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(3,83,204,0.15)",
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFF",
                    color: isDark ? TH.dark.text : C.text,
                  }]}
                  placeholder="Laissez un commentaire (optionnel)"
                  placeholderTextColor={isDark ? TH.dark.sub : C.muted}
                  value={ratingComment}
                  onChangeText={setRatingComment}
                  multiline
                  maxLength={200}
                />

                {/* Boutons */}
                <TouchableOpacity
                  style={[s.ratingSubmitBtn, ratingScore === 0 && { opacity: 0.5 }]}
                  onPress={handleRate}
                  disabled={ratingScore === 0 || rating}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={[C.deep, C.primary]} style={s.ratingSubmitGrad}>
                    {rating
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <><Ionicons name="star" size={16} color="#fff" /><Text style={s.ratingSubmitTxt}>Envoyer ma note</Text></>
                    }
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={s.ratingSkip} onPress={handleSkipRating}>
                  <Text style={[s.ratingSkipTxt, { color: isDark ? TH.dark.sub : C.muted }]}>Passer cette étape</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Succès */
              <View style={s.ratingSuccess}>
                <View style={s.ratingSuccessIcon}>
                  <Ionicons name="checkmark-circle" size={56} color={C.green} />
                </View>
                <Text style={[s.ratingTitle, { color: isDark ? TH.dark.text : C.text }]}>Merci pour votre avis !</Text>
                <Text style={[s.ratingSub, { color: isDark ? TH.dark.sub : C.muted, textAlign: "center" }]}>
                  Votre évaluation aide l'entreprise à garantir la qualité des livraisons.
                </Text>
                <View style={s.starsRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Ionicons key={star} name={star <= ratingScore ? "star" : "star-outline"} size={28} color={star <= ratingScore ? "#FFD700" : "#D1D5DB"} />
                  ))}
                </View>
                <TouchableOpacity
                  style={[s.ratingSubmitBtn, { marginTop: 16 }]}
                  onPress={() => { setShowRating(false); }}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={[C.deep, C.primary]} style={s.ratingSubmitGrad}>
                    <Ionicons name="home-outline" size={16} color="#fff" />
                    <Text style={s.ratingSubmitTxt}>Retour à l'accueil</Text>
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
const s = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    overflow: "hidden", borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    paddingBottom: 16, elevation: 12,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16,
  },
  deco1: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(255,255,255,0.05)", top: -70, right: -60 },
  deco2: { position: "absolute", width: 130, height: 130, borderRadius: 65,  backgroundColor: "rgba(255,255,255,0.04)", bottom: -30, left: -30 },
  topBar:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 8 },
  iconBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  titleWrap:   { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, justifyContent: "center" },
  titleBadge:  { width: 28, height: 28, borderRadius: 9, backgroundColor: "rgba(255,215,0,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: C.white, fontSize: 14, fontFamily: "NexaLight", letterSpacing: 1.5 },
  headerSub:   { color: "rgba(255,255,255,0.6)", fontFamily: "NexaLight", fontSize: 11, paddingHorizontal: 20, marginTop: 4, marginBottom: 4 },

  statusCard:  { borderRadius: 20, borderWidth: 1, padding: 20, alignItems: "center", marginBottom: 14, gap: 8 },
  statusIcon:  { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center" },
  statusLabel: { fontFamily: "NexaLight", fontSize: 18, fontWeight: "700" },
  statusDesc:  { fontFamily: "NexaLight", fontSize: 13, textAlign: "center" },
  paidBadge:   { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.green + "15", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  paidBadgeText: { fontFamily: "NexaLight", fontSize: 12, fontWeight: "700", color: C.green },

  card:          { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14 },
  payCard:       { borderWidth: 1.5 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  dot:           { width: 4, height: 16, borderRadius: 2 },
  sectionTitle:  { fontFamily: "NexaLight", fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" },

  itemRow:   { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 8 },
  itemName:  { flex: 1, fontFamily: "NexaLight", fontSize: 13 },
  itemQty:   { fontFamily: "NexaLight", fontSize: 12 },
  itemPrice: { fontFamily: "NexaLight", fontSize: 13, fontWeight: "700", color: C.primary, minWidth: 70, textAlign: "right" },
  totalRow:  { flexDirection: "row", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1, marginTop: 4 },
  totalLabel: { fontFamily: "NexaLight", fontSize: 14, fontWeight: "700" },
  totalVal:   { fontFamily: "NexaLight", fontSize: 16, fontWeight: "700", color: C.primary },

  addressRow:  { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  addressText: { fontFamily: "NexaLight", fontSize: 13, flex: 1, lineHeight: 19 },

  /* Pay button */
  payBtn:      { borderRadius: 20, overflow: "hidden", marginBottom: 14, elevation: 4, shadowColor: C.green, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  payGrad:     { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  payIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  payTitle:    { color: C.white, fontFamily: "NexaLight", fontSize: 15, fontWeight: "700" },
  paySub:      { color: "rgba(255,255,255,0.75)", fontFamily: "NexaLight", fontSize: 12, marginTop: 2 },

  /* PIN */
  pinHint:   { fontFamily: "NexaLight", fontSize: 13, textAlign: "center", marginBottom: 16 },
  pinDots:   { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 8 },
  pinDot:    { width: 16, height: 16, borderRadius: 8, borderWidth: 2, backgroundColor: "transparent" },
  pinError:  { fontFamily: "NexaLight", fontSize: 12, color: C.red, textAlign: "center", marginBottom: 8 },
  confirmBtn:  { borderRadius: 16, overflow: "hidden", marginTop: 16 },
  confirmGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15 },
  confirmText: { color: C.white, fontFamily: "NexaLight", fontSize: 15, fontWeight: "700" },

  /* Cancel */
  cancelBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: C.red + "30", backgroundColor: C.red + "08", marginBottom: 12 },
  cancelText: { fontFamily: "NexaLight", fontSize: 13, color: C.red, fontWeight: "700" },

  /* Refund */
  refundCard:  { flexDirection: "row", alignItems: "flex-start", gap: 12, borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
  refundTitle: { fontFamily: "NexaLight", fontSize: 13, fontWeight: "700", marginBottom: 4 },
  refundSub:   { fontFamily: "NexaLight", fontSize: 12, lineHeight: 17 },
  refundCall:  { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  refundCallText: { fontFamily: "NexaLight", fontSize: 13, fontWeight: "700", color: C.green },

  /* Support */
  livreurCard:     { backgroundColor: "#EFF6FF", borderRadius: 16, borderWidth: 1, borderColor: C.primary + "25", padding: 14, marginBottom: 12 },
  livreurHeader:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  livreurIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary + "15", alignItems: "center", justifyContent: "center" },
  livreurTitle:    { fontFamily: "NexaBold", fontSize: 14 },
  livreurSub:      { fontFamily: "NexaLight", fontSize: 11, marginTop: 1 },
  livreurOnline:   { backgroundColor: "#DCFCE7", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  livreurOnlineTxt:{ fontFamily: "NexaBold", fontSize: 10, color: "#16A34A" },
  livreurRow:      { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  livreurInfo:     { fontFamily: "NexaBold", fontSize: 13 },
  livreurBtns:     { flexDirection: "row", gap: 8 },
  livreurBtn:      { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#22C55E", borderRadius: 10, paddingVertical: 10 },
  livreurBtnTxt:   { fontFamily: "NexaBold", fontSize: 12, color: "#fff" },
  estTimeRow:      { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, backgroundColor: "#FFF7ED", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  estTimeTxt:      { fontFamily: "NexaBold", fontSize: 12, color: "#F97316" },
  supportBtn:      { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#F0FDF4", borderRadius: 16, padding: 14, marginTop: 4, marginBottom: 12, borderWidth: 1, borderColor: C.green + "30" },
  supportIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.green + "15", alignItems: "center", justifyContent: "center" },
  supportLabel:    { fontFamily: "NexaLight", fontSize: 11, marginBottom: 2 },
  supportNum:      { fontFamily: "NexaLight", fontSize: 14, fontWeight: "700", color: C.green, letterSpacing: 0.3 },

  homeBtn:     { borderRadius: 18, overflow: "hidden", marginTop: 4 },
  homeBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  homeBtnText: { color: C.white, fontFamily: "NexaLight", fontSize: 15, fontWeight: "700" },

  /* Rating modal */
  ratingOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  ratingSheet:   { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 },
  ratingHeader:  { alignItems: "center", marginBottom: 20 },
  ratingAvatarWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.primary + "15", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  ratingTitle:   { fontFamily: "NexaLight", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  ratingSub:     { fontFamily: "NexaLight", fontSize: 12, textAlign: "center", lineHeight: 18 },
  starsRow:      { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 12 },
  ratingScoreLabel: { fontFamily: "NexaLight", fontSize: 14, fontWeight: "700", textAlign: "center", marginBottom: 14 },
  ratingInput:   { borderWidth: 1.5, borderRadius: 14, padding: 12, fontFamily: "NexaLight", fontSize: 13, minHeight: 70, marginBottom: 16 },
  ratingSubmitBtn:  { borderRadius: 16, overflow: "hidden" },
  ratingSubmitGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  ratingSubmitTxt:  { color: "#fff", fontFamily: "NexaLight", fontSize: 14, fontWeight: "700" },
  ratingSkip:    { alignItems: "center", paddingVertical: 14 },
  ratingSkipTxt: { fontFamily: "NexaLight", fontSize: 13 },
  ratingSuccess: { alignItems: "center", paddingVertical: 8, gap: 10 },
  ratingSuccessIcon: { marginBottom: 8 },
});

const tl = StyleSheet.create({
  wrap:    { gap: 0 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", position: "relative", paddingBottom: 20 },
  line:    { position: "absolute", left: 17, top: 34, width: 2, height: "100%", backgroundColor: "rgba(3,83,204,0.12)", zIndex: -1 },
  circle:  { width: 36, height: 36, borderRadius: 18, borderWidth: 2, justifyContent: "center", alignItems: "center", marginRight: 12, zIndex: 1 },
  pulse:   { position: "absolute", width: 48, height: 48, borderRadius: 24, borderWidth: 2, opacity: 0.3 },
  stepInfo:  { flex: 1, paddingTop: 6 },
  stepLabel: { fontFamily: "NexaLight", fontSize: 13 },
  stepDesc:  { fontFamily: "NexaLight", fontSize: 11, marginTop: 2, lineHeight: 16 },
  cancelled: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: "center", gap: 8 },
  cancelTitle: { fontFamily: "NexaLight", fontSize: 16, fontWeight: "700" },
  cancelDesc:  { fontFamily: "NexaLight", fontSize: 12, color: C.muted, textAlign: "center" },
});

const pp = StyleSheet.create({
  grid:    { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  key:     { width: "33.33%", alignItems: "center", justifyContent: "center", paddingVertical: 16 },
  keyText: { fontFamily: "NexaLight", fontSize: 22, fontWeight: "700", color: C.text },
});
