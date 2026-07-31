/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback, useEffect, useMemo, useRef, useState, memo,
} from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetAllProductsQuery } from "@/services/productServices";
import { useGetAllTransactionsQuery } from "@/services/tsxService";
import { API_URL_BASE } from "@/constants/api";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import NoData from "@/components/ui/noData";
import { useAppTheme } from "@/app/_layout";

const PRICE_KEY = "carburant_custom_price";

/* ─── PALETTE ────────────────────────────────────────────────────────── */
const LIGHT = {
  primary:    "#0035C5",
  blue:       "#0047FF",
  deep:       "#001257",
  white:      "#FFFFFF",
  bg:         "#F9F9F9",
  surface:    "#F3F3F4",
  text:       "#1A1C1C",
  textSec:    "#434657",
  textMut:    "#747688",
  border:     "rgba(196,197,218,0.30)",
  green:      "#22C55E",
  error:      "#EF4444",
  card:       "#FFFFFF",
  surfLow:    "#F3F3F4",
  safeBarBg:  "rgba(249,249,249,0.96)",
  heroCardBg: "rgba(255,255,255,0.82)",
  bottomNavBg:"rgba(249,249,249,0.92)",
};
const DARK: typeof LIGHT = {
  primary:    "#0035C5",
  blue:       "#4D8DFF",
  deep:       "#001257",
  white:      "#FFFFFF",
  bg:         "#0B1220",
  surface:    "#1A2540",
  text:       "#EAF0FF",
  textSec:    "#A3B4D0",
  textMut:    "#6B7A99",
  border:     "rgba(31,42,68,0.80)",
  green:      "#059669",
  error:      "#DC2626",
  card:       "#1A2540",
  surfLow:    "#0F1A2E",
  safeBarBg:  "rgba(11,18,32,0.94)",
  heroCardBg: "rgba(26,37,64,0.85)",
  bottomNavBg:"rgba(11,18,32,0.94)",
};

/* images de secours carburant (aléatoires si pas d'image backend) */
const FALLBACK_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC4L2u5lhjP-K7LEMDrWCgRe23llmlMUiaKvsssM1jaRQzkkrpYvZ4kSCEzUMjiDb_OcpJHB36DmWX7_YF7eIXNIoWHDbkp9iSbUT1v-JWwE0r4KVkDO5TdpNCqk5wNYMvEhXx9d4m4gve7oK7vibXXemJJAyg0T6t3gXm3RTum7ymyCCZOc5IVvfeD66Xf85ypKx_x7uFNRIwgLF214OKsnUakSX-h4pwGacKiraodd-XPNwrw3tZ21SdvCbq2bwSx83ckUuXdpcI",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBEo9hvThUQOtzHthWKL6qO2PjwJBz_jX0tDsYU40eDCdalLLEGijplRAb144khCMSf95MDm33hYhdi8SqsEWMRTs-aRpWeqEQtwsZAg6RwnXkDlZa3Ro6LK8W8uZSL7B9UZeANVOb-0JGVMvCK6W9u9Pc9cfnW_8UKxvwT6GE3ay7z-8Uy0VUTLJhyEj4k4Kad5heo91s2i4Djcgikmj9-DkgzJXBhu65aKJbqvyM7V7mZZ_Y66BX0BARJOW3KMraCRVMIXhfpERk",
];

/* ─── UTILS ──────────────────────────────────────────────────────────── */
type Period = "Aujourd'hui" | "Semaine" | "Mois" | "Année";
const PERIODS: Period[] = ["Aujourd'hui", "Semaine", "Mois", "Année"];

function startOfPeriod(p: Period): Date {
  const now = new Date();
  if (p === "Aujourd'hui") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === "Semaine")     { const d = new Date(now); d.setDate(now.getDate() - 6); d.setHours(0,0,0,0); return d; }
  if (p === "Mois")        return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), 0, 1);
}
function filterByPeriod(txs: any[], period: Period) {
  const start = startOfPeriod(period);
  return txs.filter(tx => new Date(tx.createdAt ?? tx.date ?? 0) >= start);
}
function formatShortDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/* bar chart: 6 colonnes selon période */
function buildBars(txs: any[], period: Period) {
  const now = new Date();
  if (period === "Aujourd'hui") {
    return Array.from({ length: 6 }, (_, i) => {
      const h = now.getHours() - 5 + i;
      const sum = txs.filter(tx => {
        const d = new Date(tx.createdAt ?? 0);
        return d.getDate() === now.getDate() && d.getHours() === Math.max(0, h);
      }).reduce((a, b) => a + Number(b.amount ?? 0), 0);
      return { label: `${Math.max(0, h)}h`, value: sum, isCurrent: i === 5 };
    });
  }
  if (period === "Semaine") {
    const DAYS = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - 6 + i);
      const sum = txs.filter(tx => new Date(tx.createdAt ?? 0).toDateString() === d.toDateString())
                     .reduce((a, b) => a + Number(b.amount ?? 0), 0);
      return { label: DAYS[d.getDay()], value: sum, isCurrent: i === 6 };
    });
  }
  if (period === "Mois") {
    return Array.from({ length: 4 }, (_, i) => {
      const ws = new Date(now.getFullYear(), now.getMonth(), 1 + i * 7);
      const we = new Date(now.getFullYear(), now.getMonth(), 1 + (i + 1) * 7);
      const sum = txs.filter(tx => { const td = new Date(tx.createdAt ?? 0); return td >= ws && td < we; })
                     .reduce((a, b) => a + Number(b.amount ?? 0), 0);
      return { label: `S${i + 1}`, value: sum, isCurrent: i === 3 };
    });
  }
  const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jui","Jul","Aoû","Sep","Oct","Nov","Déc"];
  return Array.from({ length: 6 }, (_, i) => {
    const m = (now.getMonth() - 5 + i + 12) % 12;
    const y = now.getMonth() - 5 + i < 0 ? now.getFullYear() - 1 : now.getFullYear();
    const sum = txs.filter(tx => { const td = new Date(tx.createdAt ?? 0); return td.getMonth() === m && td.getFullYear() === y; })
                   .reduce((a, b) => a + Number(b.amount ?? 0), 0);
    return { label: MONTHS[m], value: sum, isCurrent: i === 5 };
  });
}

/* ─── BAR CHART (bleu uniquement) ───────────────────────────────────── */
function BarChart({ bars }: { bars: { label: string; value: number; isCurrent: boolean }[] }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const bc = useMemo(() => mkBc(C), [isDark]);
  const maxV = Math.max(...bars.map(b => b.value), 1);
  /* opacités bleues comme le mockup */
  const opacities = [0.1, 0.2, 0.4, 0.1, 1, 0.3];
  return (
    <View style={bc.wrap}>
      {bars.map((b, i) => {
        const pct = b.value / maxV;
        const opacity = b.value > 0 ? opacities[i % opacities.length] : 0.08;
        return (
          <View key={i} style={bc.col}>
            <View style={bc.barBg}>
              <View style={[bc.bar, {
                height: `${Math.max(pct * 100, b.value > 0 ? 6 : 0)}%`,
                backgroundColor: `rgba(0,53,197,${b.value > 0 ? opacity : 0.08})`,
              }]} />
            </View>
            <Text style={[bc.label, b.isCurrent && { color: C.primary, fontFamily: "NexaBold" }]}>{b.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

/* ─── PRODUCT CARD ───────────────────────────────────────────────────── */
function ProductCardBase({ item, onPress, index }: { item: any; onPress: () => void; index: number }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const pc = useMemo(() => mkPc(C), [isDark]);
  const slideY = useRef(new Animated.Value(24)).current;
  const opac   = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 360, delay: Math.min(index * 70, 350), useNativeDriver: true }),
      Animated.timing(opac,   { toValue: 1, duration: 360, delay: Math.min(index * 70, 350), useNativeDriver: true }),
    ]).start();
  }, []);

  const imageUri  = item.imageUrl
    ? `${API_URL_BASE}${item.imageUrl}`
    : FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  const price     = Number(item.price ?? 0).toFixed(2);
  const currency  = item.currency?.code ?? "EC";

  return (
    <Animated.View style={[pc.card, { opacity: opac, transform: [{ translateY: slideY }] }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.92}>

        {/* ── IMAGE ── */}
        <View style={pc.imageWrap}>
          <Image source={{ uri: imageUri }} style={pc.image} contentFit="cover" transition={300} />

          {/* badge catégorie haut droite — blanc/blur */}
          <View style={pc.badgeCat}>
            <Ionicons name="water" size={13} color={C.primary} />
            <Text style={pc.badgeCatText}>Carburant</Text>
          </View>

          {/* badge prix bas gauche — bleu */}
          <View style={pc.priceWrap}>
            <Text style={pc.priceValue}>{price} {currency}/L</Text>
          </View>
        </View>

        {/* ── CONTENU ── */}
        <View style={pc.content}>
          <View style={pc.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={pc.name} numberOfLines={1}>{item.name}</Text>
              <View style={pc.availRow}>
                <View style={pc.availDot} />
                <Text style={pc.availText}>Disponible maintenant</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={pc.btnWrap}>
              <LinearGradient
                colors={[C.blue, C.deep]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={pc.btn}
              >
                <Text style={pc.btnText}>Voir</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={pc.desc} numberOfLines={2}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const ProductCard = memo(ProductCardBase);

/* ─── TRANSACTION ROW ────────────────────────────────────────────────── */
function TxRow({ tx, index }: { tx: any; index: number }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const tr = useMemo(() => mkTr(C), [isDark]);
  const slideX = useRef(new Animated.Value(16)).current;
  const opac   = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideX, { toValue: 0, duration: 300, delay: Math.min(index * 40, 280), useNativeDriver: true }),
      Animated.timing(opac,   { toValue: 1, duration: 300, delay: Math.min(index * 40, 280), useNativeDriver: true }),
    ]).start();
  }, []);

  const amount = Number(tx.amount ?? 0);
  const status = (tx.status ?? "").toLowerCase();
  const isOk = status === "success" || status === "completed";

  return (
    <Animated.View style={[tr.row, { opacity: opac, transform: [{ translateX: slideX }] }]}>
      <View style={tr.iconWrap}>
        <Ionicons name="car-sport-outline" size={18} color={C.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={tr.name} numberOfLines={1}>{tx.product?.name ?? tx.notes ?? "Carburant"}</Text>
        <Text style={tr.date}>{formatShortDate(tx.createdAt ?? tx.date)}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={tr.amount}>{amount.toLocaleString("fr-FR")} EC</Text>
        <View style={[tr.badge, { backgroundColor: isOk ? "rgba(34,197,94,0.10)" : "rgba(196,197,218,0.20)" }]}>
          <Text style={[tr.badgeText, { color: isOk ? C.green : C.textMut }]}>
            {isOk ? "Succès" : "En cours"}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────── */
type Tab = "products" | "tracker";

export default function FuelScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router       = useRouter();
  const { id }       = useLocalSearchParams<{ id: string }>();
  const { unread }   = useUnreadNotifications();

  const [tab,          setTab]          = useState<Tab>("products");
  const [period,       setPeriod]       = useState<Period>("Semaine");
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState("");
  const [dataList,     setDataList]     = useState<any[]>([]);
  const [refreshing,   setRefreshing]   = useState(false);
  /* prix personnalisé EC/L — persisté dans AsyncStorage */
  const [customPrice,  setCustomPrice]  = useState(""); // chaîne saisie
  const [savedPrice,   setSavedPrice]   = useState(0);  // valeur sauvegardée
  const [priceSaved,   setPriceSaved]   = useState(false); // feedback confirmation

  useEffect(() => {
    AsyncStorage.getItem(PRICE_KEY).then(v => {
      if (v) { setCustomPrice(v); setSavedPrice(parseFloat(v) || 0); }
    });
  }, []);

  const saveCustomPrice = () => {
    const num = parseFloat(customPrice.replace(",", ".")) || 0;
    if (num <= 0) return;
    setSavedPrice(num);
    AsyncStorage.setItem(PRICE_KEY, String(num));
    setPriceSaved(true);
    setTimeout(() => setPriceSaved(false), 1800);
  };

  /* products */
  const { data: prodData, isFetching: prodFetching, refetch: refetchProd } = useGetAllProductsQuery({
    page, pageSize: 10, search, paginate: true, companyId: id,
  });
  useEffect(() => {
    if (prodData?.data) {
      if (page === 1) setDataList(prodData.data);
      else setDataList(prev => [...prev, ...prodData.data]);
    }
  }, [prodData, page]);

  const loadMore = useCallback(() => {
    if (prodData?.totalPages && page < prodData.totalPages && !prodFetching) setPage(p => p + 1);
  }, [prodData, page, prodFetching]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); setPage(1); await refetchProd(); setRefreshing(false);
  }, [refetchProd]);

  /* transactions — always loaded for inline dashboard */
  const { data: txData, isFetching: txFetching, refetch: refetchTx } = useGetAllTransactionsQuery(
    { companyId: id, paginate: false }
  );

  const allTxs: any[] = useMemo(() => {
    const arr = txData?.data ?? txData ?? [];
    return Array.isArray(arr) ? arr.filter(tx =>
      (tx.type ?? "").toLowerCase().includes("paiement") ||
      (tx.type ?? "").toLowerCase().includes("payment")
    ) : [];
  }, [txData]);

  const filteredTxs = useMemo(() => filterByPeriod(allTxs, period), [allTxs, period]);
  const bars        = useMemo(() => buildBars(filteredTxs, period), [filteredTxs, period]);
  const totalSpent  = useMemo(() => filteredTxs.reduce((a, b) => a + Number(b.amount ?? 0), 0), [filteredTxs]);
  const txCount     = filteredTxs.length;
  /* litres estimés = total EC / prix perso EC/L */
  const totalLiters = savedPrice > 0 ? totalSpent / savedPrice : null;
  const sortedTxs   = useMemo(() => [...filteredTxs].sort((a, b) =>
    new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  ), [filteredTxs]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ── TOP BAR ── */}
      <SafeAreaView edges={["top"]} style={s.safeBar}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.primary} />
          </TouchableOpacity>
          <Text style={s.topTitle}>BIM Carburant</Text>
          <TouchableOpacity style={s.iconBtnRel} onPress={() => router.push("/notification" as any)}>
            <Ionicons name="notifications-outline" size={22} color={C.primary} />
            {unread > 0 && (
              <View style={s.badge}><Text style={s.badgeText}>{unread > 99 ? "99+" : unread}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── CONTENU ── */}
      {tab === "products" ? (
        /* ═══ ONGLET PRODUITS ═══ */
        <FlatList
          data={dataList}
          keyExtractor={item => `${item.productId}`}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />
          }
          ListHeaderComponent={
            <View>
              {/* Hero */}
              <View style={s.hero}>
                <Image
                  source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuA0v7FNpZU5sHfs4rFkCVilliZ5fl9fhUMu0QPoYdzRdq08jGy6cOW6ZEg60_BL8XMg-7h5eB9KzLDp5QfZhqgi0H4JKaKr6Zh0Q9aVS4Qa3oU7wGqeP8OBK1-jm-yYZac6mwOvBUdZ-wuxnvZrcrz9K6JP7mMu99TfPl_abGCNTC01VcRykGEXFUdv0ocBH211sbgLmWNKdw92U0HCIol7zXZnWC6XZ1lw5aZO0_1pdbjIt_I7G9WXXchqHFoDIzgz20aux3VlkRM" }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,53,197,0.40)"]}
                  start={{ x: 0, y: 0.3 }} end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={s.heroCard}>
                  <View style={s.heroIconRow}>
                    <Ionicons name="car-sport" size={18} color={C.primary} />
                    <Text style={s.heroBadge}>SECTEUR PREMIUM</Text>
                  </View>
                  <Text style={s.heroTitle}>Gestion du Carburant</Text>
                  <Text style={s.heroSub}>Trouvez votre station et suivez vos dépenses en temps réel.</Text>
                </View>
              </View>

              {/* search */}
              <View style={s.searchWrap}>
                <Ionicons name="search-outline" size={16} color={C.textMut} />
                <TextInput
                  style={s.searchInput}
                  placeholder="Rechercher un produit carburant..."
                  placeholderTextColor={C.textMut}
                  value={search}
                  onChangeText={v => { setSearch(v); setPage(1); }}
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => { setSearch(""); setPage(1); }}>
                    <Ionicons name="close-circle" size={16} color={C.textMut} />
                  </TouchableOpacity>
                )}
              </View>

              {/* ── TABLEAU DE BORD inline ── */}
              <View style={s.dashSection}>
                <View style={s.dashSectionHeader}>
                  <Text style={s.dashSectionTitle}>Tableau de bord</Text>
                  <Ionicons name="stats-chart-outline" size={20} color={C.textMut} />
                </View>

                <View style={s.dashCard}>
                  {/* period pills */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.periodRow}>
                    {PERIODS.map(p => (
                      <TouchableOpacity
                        key={p}
                        style={[s.periodChip, period === p && s.periodChipActive]}
                        onPress={() => setPeriod(p)}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.periodText, period === p && s.periodTextActive]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* stats 2 cards */}
                  <View style={s.statsRow}>
                    <View style={s.statCard}>
                      <Text style={s.statLabel}>Total consommé</Text>
                      <View style={s.statValueRow}>
                        {totalLiters !== null ? (
                          <>
                            <Text style={s.statValue}>{totalLiters.toFixed(1)}</Text>
                            <Text style={s.statUnit}>L</Text>
                          </>
                        ) : (
                          <Text style={[s.statValue, { fontSize: 13, color: C.textMut }]}>Définissez{"\n"}le prix/L</Text>
                        )}
                      </View>
                    </View>
                    <View style={s.statCard}>
                      <Text style={s.statLabel}>Dépenses totales</Text>
                      <View style={s.statValueRow}>
                        <Text style={s.statValue}>
                          {totalSpent > 9999 ? `${(totalSpent / 1000).toFixed(1)}k` : totalSpent.toLocaleString("fr-FR")}
                        </Text>
                        <Text style={s.statUnit}>EC</Text>
                      </View>
                    </View>
                  </View>

                  {/* bar chart */}
                  {txFetching ? (
                    <View style={{ height: 128, alignItems: "center", justifyContent: "center" }}>
                      <ActivityIndicator color={C.primary} />
                    </View>
                  ) : (
                    <BarChart bars={bars} />
                  )}
                </View>
              </View>

              {/* titre section produits */}
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Produits disponibles</Text>
                <Text style={s.sectionCount}>{dataList.length} produit{dataList.length !== 1 ? "s" : ""}</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            !prodFetching ? (
              <View style={{ alignItems: "center", paddingTop: 40 }}><NoData /></View>
            ) : (
              <View style={{ padding: 40, alignItems: "center" }}>
                <ActivityIndicator color={C.primary} />
              </View>
            )
          }
          ListFooterComponent={prodFetching && !refreshing ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator color={C.primary} />
            </View>
          ) : null}
          renderItem={({ item, index }) => (
            <ProductCard
              item={item}
              index={index}
              onPress={() => router.push(`/bim-carburant/product/${item.productId}?companyId=${id}` as any)}
            />
          )}
        />
      ) : (
        /* ═══ ONGLET TRACKER ═══ */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.trackerContent}
          refreshControl={
            <RefreshControl refreshing={txFetching && !txData} onRefresh={() => refetchTx()} tintColor={C.primary} colors={[C.primary]} />
          }
        >
          {/* section header */}
          <View style={s.trackerHeader}>
            <Text style={s.trackerTitle}>Tableau de bord</Text>
            <Ionicons name="stats-chart-outline" size={22} color={C.textMut} />
          </View>

          {/* ── CARD : PRIX PERSONNALISÉ ── */}
          <View style={s.priceCard}>
            <View style={s.priceCardTop}>
              <View style={s.priceIconWrap}>
                <Ionicons name="create-outline" size={18} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.priceCardTitle}>Mon prix carburant</Text>
                <Text style={s.priceCardSub}>Définissez votre prix de référence pour calculer les litres consommés</Text>
              </View>
              {savedPrice > 0 && (
                <View style={s.priceSavedBadge}>
                  <Text style={s.priceSavedBadgeText}>{savedPrice.toFixed(2)} EC/L</Text>
                </View>
              )}
            </View>

            <View style={s.priceInputRow}>
              <View style={s.priceInputWrap}>
                <Ionicons name="water-outline" size={16} color={C.primary} />
                <TextInput
                  style={s.priceInput}
                  value={customPrice}
                  onChangeText={v => setCustomPrice(v.replace(/[^0-9.,]/g, ""))}
                  keyboardType="decimal-pad"
                  placeholder="Ex: 1.83"
                  placeholderTextColor={C.textMut}
                  returnKeyType="done"
                  onSubmitEditing={saveCustomPrice}
                />
                <Text style={s.priceInputUnit}>EC/L</Text>
              </View>

              <TouchableOpacity
                style={[s.priceSaveBtn, (!customPrice || parseFloat(customPrice) <= 0) && { opacity: 0.45 }]}
                onPress={saveCustomPrice}
                disabled={!customPrice || parseFloat(customPrice.replace(",", ".")) <= 0}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[C.blue, C.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.priceSaveBtnGrad}>
                  {priceSaved ? (
                    <Ionicons name="checkmark" size={18} color={C.white} />
                  ) : (
                    <Text style={s.priceSaveBtnText}>Enregistrer</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {savedPrice > 0 && (
              <View style={s.priceHint}>
                <Ionicons name="information-circle-outline" size={13} color={C.primary} />
                <Text style={s.priceHintText}>
                  Les litres consommés sont estimés sur la base de {savedPrice.toFixed(2)} EC/L
                </Text>
              </View>
            )}
          </View>

          {/* dashboard card */}
          <View style={s.dashCard}>

            {/* period filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.periodRow}>
              {PERIODS.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[s.periodChip, period === p && s.periodChipActive]}
                  onPress={() => setPeriod(p)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.periodText, period === p && s.periodTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* stats 2x2 — exactement comme le mockup HTML */}
            <View style={s.statsRow}>
              <View style={s.statCard}>
                <Text style={s.statLabel}>Total consommé</Text>
                <View style={s.statValueRow}>
                  {totalLiters !== null ? (
                    <>
                      <Text style={s.statValue}>{totalLiters.toFixed(1)}</Text>
                      <Text style={s.statUnit}>L</Text>
                    </>
                  ) : (
                    <Text style={[s.statValue, { fontSize: 14, color: C.textMut }]}>
                      Définissez{"\n"}le prix/L
                    </Text>
                  )}
                </View>
              </View>
              <View style={s.statCard}>
                <Text style={s.statLabel}>Dépenses totales</Text>
                <View style={s.statValueRow}>
                  <Text style={s.statValue}>
                    {totalSpent > 9999 ? `${(totalSpent/1000).toFixed(1)}k` : totalSpent.toLocaleString("fr-FR")}
                  </Text>
                  <Text style={s.statUnit}>EC</Text>
                </View>
              </View>
            </View>

            {/* bar chart */}
            {txFetching ? (
              <View style={{ height: 148, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator color={C.primary} />
              </View>
            ) : (
              <BarChart bars={bars} />
            )}
          </View>

          {/* rapport détaillé */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Rapport détaillé</Text>
            <Text style={s.sectionCount}>{sortedTxs.length} ligne{sortedTxs.length !== 1 ? "s" : ""}</Text>
          </View>

          {txFetching ? (
            <View style={{ padding: 30, alignItems: "center" }}>
              <ActivityIndicator color={C.primary} />
            </View>
          ) : sortedTxs.length === 0 ? (
            <View style={s.emptyReport}>
              <Ionicons name="document-text-outline" size={40} color={C.textMut} />
              <Text style={s.emptyTitle}>Aucune transaction</Text>
              <Text style={s.emptySub}>Vos achats carburant apparaîtront ici</Text>
            </View>
          ) : (
            <View style={s.reportList}>
              {sortedTxs.map((tx, i) => (
                <TxRow key={tx.id ?? tx.txId ?? i} tx={tx} index={i} />
              ))}

              {/* résumé */}
              <View style={s.summaryCard}>
                <Text style={s.summaryTitle}>Résumé — {period}</Text>
                <View style={s.summaryRow}>
                  <View style={s.summaryItem}>
                    <Text style={s.summaryLabel}>Minimum</Text>
                    <Text style={s.summaryValue}>
                      {Math.min(...sortedTxs.map(t => Number(t.amount ?? 0))).toLocaleString("fr-FR")} EC
                    </Text>
                  </View>
                  <View style={s.summaryDivider} />
                  <View style={s.summaryItem}>
                    <Text style={s.summaryLabel}>Maximum</Text>
                    <Text style={s.summaryValue}>
                      {Math.max(...sortedTxs.map(t => Number(t.amount ?? 0))).toLocaleString("fr-FR")} EC
                    </Text>
                  </View>
                  <View style={s.summaryDivider} />
                  <View style={s.summaryItem}>
                    <Text style={s.summaryLabel}>Moyenne</Text>
                    <Text style={s.summaryValue}>
                      {txCount > 0 ? (totalSpent / txCount).toFixed(0) : "—"} EC
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── BOTTOM NAV ── */}
      <View style={s.bottomNav}>
        <TouchableOpacity style={s.navItem} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="home-outline" size={22} color={C.textMut} />
          <Text style={s.navLabel}>Accueil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.navItem} onPress={() => setTab("products")} activeOpacity={0.7}>
          <Ionicons name={tab === "products" ? "water" : "water-outline"} size={22}
            color={tab === "products" ? C.primary : C.textMut} />
          <Text style={[s.navLabel, tab === "products" && s.navLabelActive]}>Produits</Text>
          {tab === "products" && <View style={s.navDot} />}
        </TouchableOpacity>

        <TouchableOpacity style={s.navItem} onPress={() => setTab("tracker")} activeOpacity={0.7}>
          <Ionicons name={tab === "tracker" ? "bar-chart" : "bar-chart-outline"} size={22}
            color={tab === "tracker" ? C.primary : C.textMut} />
          <Text style={[s.navLabel, tab === "tracker" && s.navLabelActive]}>Tracker</Text>
          {tab === "tracker" && <View style={s.navDot} />}
        </TouchableOpacity>

        <TouchableOpacity style={s.navItem} onPress={() => router.push("/profile" as any)} activeOpacity={0.7}>
          <Ionicons name="person-outline" size={22} color={C.textMut} />
          <Text style={s.navLabel}>Profil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  safeBar:   { backgroundColor: C.safeBarBg, borderBottomWidth: 1, borderBottomColor: C.border, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  topBar:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn:   { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  iconBtnRel:{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  topTitle:  { fontFamily: "NexaBold", fontSize: 20, color: C.primary },
  badge:     { position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.error, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { fontFamily: "NexaBold", fontSize: 9, color: C.white },

  /* ── Products tab ── */
  listContent: { paddingBottom: 90 },

  hero:     { height: 220, marginHorizontal: 16, marginTop: 16, borderRadius: 24, overflow: "hidden", position: "relative" },
  heroCard: { position: "absolute", bottom: 16, left: 16, right: 16, backgroundColor: C.heroCardBg, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.60)" },
  heroIconRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  heroBadge:   { fontFamily: "NexaBold", fontSize: 10, color: C.primary, letterSpacing: 1.5 },
  heroTitle:   { fontFamily: "NexaBold", fontSize: 20, color: C.text },
  heroSub:     { fontFamily: "NexaLight", fontSize: 12, color: C.textSec, marginTop: 2 },

  searchWrap: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surfLow, borderRadius: 18, paddingHorizontal: 14, height: 50, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: "transparent" },
  searchInput:{ flex: 1, fontFamily: "NexaLight", fontSize: 14, color: C.text },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  sectionTitle:  { fontFamily: "NexaBold", fontSize: 18, color: C.text },
  sectionCount:  { fontFamily: "NexaBold", fontSize: 12, color: C.primary },

  /* ── Tableau de bord inline (Products tab) ── */
  dashSection:       { marginHorizontal: 16, marginTop: 20, marginBottom: 4 },
  dashSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  dashSectionTitle:  { fontFamily: "NexaBold", fontSize: 18, color: C.text },

  /* ── Tracker tab ── */
  trackerContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 90 },
  trackerHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  trackerTitle:   { fontFamily: "NexaBold", fontSize: 20, color: C.text },

  dashCard: { backgroundColor: C.card, borderRadius: 28, padding: 20, marginBottom: 24, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },

  periodRow:         { gap: 8, marginBottom: 20 },
  periodChip:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: C.surfLow },
  periodChipActive:  { backgroundColor: C.primary },
  periodText:        { fontFamily: "NexaBold", fontSize: 12, color: C.textSec },
  periodTextActive:  { color: C.white },

  statsRow:      { flexDirection: "row", gap: 12, marginBottom: 20 },
  statCard:      { flex: 1, backgroundColor: "rgba(0,53,197,0.05)", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "rgba(0,53,197,0.10)" },
  statLabel:     { fontFamily: "NexaLight", fontSize: 10, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  statValueRow:  { flexDirection: "row", alignItems: "baseline", gap: 4 },
  statValue:     { fontFamily: "NexaBold", fontSize: 24, color: C.primary },
  statUnit:      { fontFamily: "NexaBold", fontSize: 12, color: C.primary },

  /* ── prix personnalisé ── */
  priceCard:        { backgroundColor: C.card, borderRadius: 24, padding: 20, marginBottom: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, borderWidth: 1, borderColor: "rgba(0,53,197,0.08)" },
  priceCardTop:     { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  priceIconWrap:    { width: 40, height: 40, borderRadius: 13, backgroundColor: "rgba(0,53,197,0.08)", alignItems: "center", justifyContent: "center" },
  priceCardTitle:   { fontFamily: "NexaBold", fontSize: 15, color: C.text, marginBottom: 3 },
  priceCardSub:     { fontFamily: "NexaLight", fontSize: 12, color: C.textMut, lineHeight: 17 },
  priceSavedBadge:  { backgroundColor: "rgba(0,53,197,0.08)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start" },
  priceSavedBadgeText: { fontFamily: "NexaBold", fontSize: 11, color: C.primary },

  priceInputRow:  { flexDirection: "row", gap: 10, alignItems: "center" },
  priceInputWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.surfLow, borderRadius: 16, paddingHorizontal: 14, height: 52, borderWidth: 1.5, borderColor: "rgba(0,53,197,0.18)" },
  priceInput:     { flex: 1, fontFamily: "NexaBold", fontSize: 20, color: C.primary },
  priceInputUnit: { fontFamily: "NexaBold", fontSize: 12, color: C.textMut },

  priceSaveBtn:     { borderRadius: 16, overflow: "hidden", elevation: 3, shadowColor: C.blue, shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  priceSaveBtnGrad: { paddingHorizontal: 18, height: 52, alignItems: "center", justifyContent: "center" },
  priceSaveBtnText: { fontFamily: "NexaBold", fontSize: 13, color: C.white },

  priceHint:     { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 12, backgroundColor: "rgba(0,53,197,0.05)", borderRadius: 12, padding: 10 },
  priceHintText: { fontFamily: "NexaLight", fontSize: 12, color: C.primary, flex: 1, lineHeight: 17 },

  emptyReport: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyTitle:  { fontFamily: "NexaBold", fontSize: 15, color: C.textSec },
  emptySub:    { fontFamily: "NexaLight", fontSize: 13, color: C.textMut },

  reportList: { gap: 10 },

  summaryCard:    { backgroundColor: C.card, borderRadius: 20, padding: 18, marginTop: 8, elevation: 1, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  summaryTitle:   { fontFamily: "NexaBold", fontSize: 13, color: C.text, marginBottom: 14 },
  summaryRow:     { flexDirection: "row" },
  summaryItem:    { flex: 1, alignItems: "center" },
  summaryLabel:   { fontFamily: "NexaLight", fontSize: 10, color: C.textMut, textTransform: "uppercase", marginBottom: 4 },
  summaryValue:   { fontFamily: "NexaBold", fontSize: 14, color: C.primary },
  summaryDivider: { width: 1, backgroundColor: C.border },

  /* ── Bottom nav ── */
  bottomNav: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: C.bottomNavBg,
    borderTopWidth: 1, borderTopColor: C.border,
    flexDirection: "row", alignItems: "center",
    height: 72, paddingBottom: 8,
    elevation: 12, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: -4 },
  },
  navItem:       { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingTop: 8, position: "relative" },
  navLabel:      { fontFamily: "NexaLight", fontSize: 11, color: C.textMut },
  navLabelActive:{ fontFamily: "NexaBold", color: C.primary },
  navDot:        { position: "absolute", bottom: -4, width: 4, height: 4, borderRadius: 2, backgroundColor: C.primary },
}); }

/* ─── PRODUCT CARD STYLES ────────────────────────────────────────────── */
function mkPc(C: typeof LIGHT) { return StyleSheet.create({
  card:      { backgroundColor: C.card, borderRadius: 28, marginHorizontal: 16, marginBottom: 16, overflow: "hidden", elevation: 3, shadowColor: "rgba(0,71,255,0.06)", shadowOpacity: 1, shadowRadius: 20, shadowOffset: { width: 0, height: 6 } },
  imageWrap: { height: 200, position: "relative" },
  image:     { width: "100%", height: "100%" },

  /* badge haut droit — blanc */
  badgeCat:     { position: "absolute", top: 14, right: 14, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.90)", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(0,53,197,0.10)" },
  badgeCatText: { fontFamily: "NexaBold", fontSize: 11, color: C.text },

  /* badge prix bas gauche — BLEU */
  priceWrap:  { position: "absolute", bottom: 14, left: 14, backgroundColor: "rgba(0,53,197,0.90)", borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7 },
  priceValue: { fontFamily: "NexaBold", fontSize: 13, color: C.white },

  /* contenu */
  content: { padding: 20 },
  topRow:  { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, gap: 12 },
  name:    { fontFamily: "NexaBold", fontSize: 18, color: C.text, marginBottom: 5 },
  desc:    { fontFamily: "NexaLight", fontSize: 13, color: C.textSec, lineHeight: 20 },

  availRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  availDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E" },
  availText:{ fontFamily: "NexaLight", fontSize: 12, color: "#16A34A" },

  btnWrap: { borderRadius: 18, overflow: "hidden", elevation: 4, shadowColor: C.primary, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, alignSelf: "flex-start" },
  btn:     { paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { fontFamily: "NexaBold", fontSize: 13, color: C.white },
}); }

/* ─── TRANSACTION ROW STYLES ─────────────────────────────────────────── */
function mkTr(C: typeof LIGHT) { return StyleSheet.create({
  row:       { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.card, borderRadius: 18, padding: 14, elevation: 1, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  iconWrap:  { width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(0,53,197,0.08)", alignItems: "center", justifyContent: "center" },
  name:      { fontFamily: "NexaBold", fontSize: 13, color: C.text, marginBottom: 2 },
  date:      { fontFamily: "NexaLight", fontSize: 11, color: C.textMut },
  amount:    { fontFamily: "NexaBold", fontSize: 14, color: C.text },
  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontFamily: "NexaBold", fontSize: 10 },
}); }

/* ─── BAR CHART STYLES ───────────────────────────────────────────────── */
function mkBc(C: typeof LIGHT) { return StyleSheet.create({
  wrap:  { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 128, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 4 },
  col:   { flex: 1, alignItems: "center", gap: 4 },
  barBg: { width: "60%", flex: 1, justifyContent: "flex-end", borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  bar:   { width: "100%", borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  label: { fontFamily: "NexaLight", fontSize: 10, color: C.textMut, marginTop: 6, marginBottom: 2 },
}); }
