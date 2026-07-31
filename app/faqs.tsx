/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAppTheme } from "@/app/_layout";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ─── PALETTE ────────────────────────────────────────────────────────── */
const LIGHT = {
  primary: "#0035C5",
  deep:    "#302E99",
  white:   "#FFFFFF",
  bg:      "#F9F9F9",
  surface: "#FFFFFF",
  text:    "#1A1C1C",
  textSec: "#434657",
  textMut: "#747688",
  border:  "rgba(196,197,218,0.40)",
  inputBg: "rgba(255,255,255,0.80)",
};
const DARK: typeof LIGHT = {
  primary: "#4D8DFF",
  deep:    "#302E99",
  white:   "#FFFFFF",
  bg:      "#0B1220",
  surface: "#1A2540",
  text:    "#EAF0FF",
  textSec: "#9FB0D0",
  textMut: "#6B7A99",
  border:  "rgba(31,42,68,0.80)",
  inputBg: "rgba(24,32,51,0.80)",
};

/* ─── DATA ───────────────────────────────────────────────────────────── */
const CATEGORIES = ["Tout", "Compte", "Transactions", "Sécurité", "Support"];

const FAQS: { id: string; cat: string; question: string; answer: string; popular?: boolean }[] = [
  {
    id: "1", cat: "Transactions",
    question: "Comment recharger mon compte Ecoins ?",
    answer: "Vous pouvez recharger votre compte via Airtel, Orange, Vodacom ou Africell en choisissant le montant et le moyen de paiement dans l'onglet Recharge.",
    popular: true,
  },
  {
    id: "2", cat: "Transactions",
    question: "Comment transférer des Ecoins à un ami ?",
    answer: "Accédez à votre portefeuille, appuyez sur « Transférer », puis entrez le nom d'utilisateur du destinataire. Les transactions sont instantanées.",
  },
  {
    id: "3", cat: "Support",
    question: "Comment contacter le support ?",
    answer: "Notre équipe est disponible 24/7 via le chat intégré dans l'application ou via l'onglet Support.",
  },
  {
    id: "4", cat: "Transactions",
    question: "Puis-je annuler une transaction ?",
    answer: "En raison de la nature instantanée des transferts, les transactions validées ne peuvent pas être annulées. Vérifiez toujours le destinataire avant de confirmer.",
  },
  {
    id: "5", cat: "Compte",
    question: "Comment créer un compte Ecoins ?",
    answer: "Téléchargez l'application BIM NEXT, appuyez sur « S'inscrire » et suivez les étapes de vérification d'identité sécurisées.",
  },
  {
    id: "6", cat: "Sécurité",
    question: "Comment sécuriser mon compte ?",
    answer: "Utilisez un mot de passe à 6 chiffres unique et ne le partagez jamais. En cas de doute, contactez le support pour bloquer votre compte.",
  },
  {
    id: "7", cat: "Transactions",
    question: "Quels sont les frais de retrait ?",
    answer: "Les frais dépendent du montant et de l'agent BIM. Rapprochez-vous de votre agent agréé pour connaître les conditions applicables.",
  },
  {
    id: "8", cat: "Compte",
    question: "Comment consulter mon historique ?",
    answer: "Accédez à la section « Historique » depuis l'accueil pour voir toutes vos transactions passées, classées par date.",
  },
  {
    id: "9", cat: "Compte",
    question: "Comment mettre à jour mon profil ?",
    answer: "Dans votre profil, appuyez sur « Modifier » pour mettre à jour vos informations personnelles.",
  },
  {
    id: "10", cat: "Sécurité",
    question: "Que faire si j'oublie mon mot de passe ?",
    answer: "Contactez le support BIM en fournissant vos informations d'identification. Un agent vous guidera pour réinitialiser votre accès.",
  },
];

/* ─── ACCORDION ITEM ─────────────────────────────────────────────────── */
function AccordionItem({
  item, isOpen, onToggle,
}: { item: typeof FAQS[number]; isOpen: boolean; onToggle: () => void }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const rotateAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  const toggle = () => {
    LayoutAnimation.configureNext({
      duration: 280,
      update:  { type: "easeInEaseOut" },
      create:  { type: "easeInEaseOut", property: "opacity" },
    });
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 0 : 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
    onToggle();
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <TouchableOpacity style={s.card} onPress={toggle} activeOpacity={0.82}>
      <View style={s.cardHeader}>
        <Text style={s.question}>{item.question}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={22} color={C.primary} />
        </Animated.View>
      </View>
      {isOpen && (
        <View style={s.answerBox}>
          <Text style={s.answer}>{item.answer}</Text>
          {item.popular && (
            <View style={s.popularBadge}>
              <Text style={s.popularText}>POPULAIRE</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

/* ─── SCREEN ─────────────────────────────────────────────────────────── */
export default function FAQScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router = useRouter();
  const [expandedId,     setExpandedId]     = useState<string | null>("1");
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [search,         setSearch]         = useState("");

  const filtered = FAQS.filter((f) => {
    const matchCat    = activeCategory === "Tout" || f.cat === activeCategory;
    const matchSearch = search.length < 2
      || f.question.toLowerCase().includes(search.toLowerCase())
      || f.answer.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ── TOP BAR ──────────────────────────────────────────────────── */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>BIM<Text style={{ color: C.primary }}>Next</Text></Text>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/notification" as any)}>
          <Ionicons name="notifications-outline" size={22} color={C.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── PAGE TITLE ───────────────────────────────────────────── */}
        <View style={s.titleSection}>
          <Text style={s.pageTitle}>FAQ</Text>
          <Text style={s.pageSub}>Questions fréquentes</Text>
        </View>

        {/* ── SEARCH ───────────────────────────────────────────────── */}
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={18} color={C.textMut} />
          <TextInput
            placeholder="Rechercher une réponse..."
            placeholderTextColor={C.textMut}
            value={search}
            onChangeText={setSearch}
            style={s.searchInput}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={C.textMut} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── CATEGORIES ───────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.cats}
          style={{ marginBottom: 4 }}
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[s.pill, active && s.pillActive]}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[s.pillText, active && s.pillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── ACCORDION ────────────────────────────────────────────── */}
        <View style={s.list}>
          {filtered.length === 0 ? (
            <View style={s.emptyWrap}>
              <Ionicons name="search-outline" size={32} color={C.textMut} />
              <Text style={s.emptyText}>Aucun résultat trouvé</Text>
            </View>
          ) : (
            filtered.map((item) => (
              <AccordionItem
                key={item.id}
                item={item}
                isOpen={expandedId === item.id}
                onToggle={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
              />
            ))
          )}
        </View>

        {/* ── HELP BANNER ──────────────────────────────────────────── */}
        <View style={s.helpCard}>
          {/* subtle blue radial glow on right */}
          <View style={s.helpGlow} />
          <View style={{ flex: 1, zIndex: 1 }}>
            <Text style={s.helpLabel}>BESOIN D'AIDE ?</Text>
            <Text style={s.helpTitle}>Parlez à nos experts{"\n"}en direct.</Text>
            <TouchableOpacity
              style={s.helpBtn}
              onPress={() => router.push("/support" as any)}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={[C.deep, C.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.helpBtnGrad}
              >
                <Text style={s.helpBtnText}>Ouvrir le Chat</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Ionicons
            name="headset-outline"
            size={80}
            color={C.primary}
            style={s.helpIcon}
          />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.90)",
    borderBottomWidth: 1, borderBottomColor: "rgba(196,197,218,0.18)",
  },
  iconBtn:     { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  topBarTitle: { fontFamily: "NexaBold", fontSize: 18, color: C.text },

  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  titleSection: { marginBottom: 20, marginTop: 8 },
  pageTitle:    { fontFamily: "NexaBold", fontSize: 28, color: C.text, lineHeight: 34 },
  pageSub:      { fontFamily: "NexaLight", fontSize: 15, color: C.textSec, marginTop: 4 },

  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.surface,
    borderRadius: 18, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 16, height: 50, marginBottom: 16,
    elevation: 2, shadowColor: "#0035C5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "NexaLight", color: C.text },

  cats:        { gap: 8, paddingBottom: 12, paddingRight: 8 },
  pill:        { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 24, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  pillActive:  { backgroundColor: C.primary, borderColor: C.primary },
  pillText:    { fontFamily: "NexaBold", fontSize: 12, color: C.textSec, letterSpacing: 0.4 },
  pillTextActive: { color: C.white },

  list: { gap: 12, marginTop: 4 },

  card: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.85)",
    elevation: 2, shadowColor: "#0035C5",
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 16,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  question:   { flex: 1, fontFamily: "NexaBold", fontSize: 15, color: C.text, lineHeight: 22 },
  answerBox:  { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(196,197,218,0.35)" },
  answer:     { fontFamily: "NexaLight", fontSize: 14, color: C.textSec, lineHeight: 22 },
  popularBadge: {
    marginTop: 12, alignSelf: "flex-start",
    backgroundColor: "rgba(0,53,197,0.05)",
    borderRadius: 24, borderWidth: 1, borderColor: "rgba(0,53,197,0.12)",
    paddingHorizontal: 12, paddingVertical: 4,
  },
  popularText: { fontFamily: "NexaBold", fontSize: 9, color: C.primary, letterSpacing: 1 },

  emptyWrap: { paddingVertical: 40, alignItems: "center", gap: 10 },
  emptyText: { fontFamily: "NexaLight", fontSize: 14, color: C.textMut },

  helpCard: {
    marginTop: 28, borderRadius: 32, overflow: "hidden",
    padding: 28, minHeight: 180,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1, borderColor: "rgba(0,53,197,0.07)",
    flexDirection: "row", alignItems: "center",
    elevation: 2, shadowColor: "#0035C5", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 16,
  },
  helpGlow: {
    position: "absolute", right: 0, top: 0,
    width: "55%", height: "100%", opacity: 0.18,
    // implemented via background in JSX below
  },
  helpLabel: { fontFamily: "NexaBold", fontSize: 10, color: C.primary, letterSpacing: 1.4, marginBottom: 6 },
  helpTitle: { fontFamily: "NexaBold", fontSize: 20, color: C.text, lineHeight: 26, marginBottom: 16 },
  helpBtn:   { borderRadius: 24, overflow: "hidden", alignSelf: "flex-start" },
  helpBtnGrad: { paddingHorizontal: 24, paddingVertical: 11 },
  helpBtnText: { color: C.white, fontFamily: "NexaBold", fontSize: 13 },
  helpIcon:    { opacity: 0.10, position: "absolute", right: 16, bottom: 8 },
}); }
