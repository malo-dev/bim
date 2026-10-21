/* eslint-disable */
import { API_URL_BASE } from "@/constants/api";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useContentUpdate } from "@/hooks/useContentUpdate";
import { useOtaUpdate } from "@/hooks/useOtaUpdate";
import { useAppVersionCheck } from "@/hooks/useAppVersionCheck";
import { useEnsureLocation } from "@/hooks/useEnsureLocation";
import { useGetAllProductsQuery } from "@/services/productServices";
import { useGetAllSectorsQuery } from "@/services/sectorsServices";
import { useGetUserByIdQuery } from "@/services/userService";
import CompletePhoneModal from "@/components/CompletePhoneModal";
import CompleteEmailModal from "@/components/CompleteEmailModal";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/app/_layout";
import FirstOrderHint from "@/components/FirstOrderHint";

/* ─── PALETTE ────────────────────────────────────────────────────────── */
/* ─── SKELETON ───────────────────────────────────────────────────────── */
function Sk({ w, h, r = 6, bg }: { w: number | string; h: number; r?: number; bg: string }) {
  return <View style={{ width: w as any, height: h, borderRadius: r, backgroundColor: bg }} />;
}

function HomeSkeleton({ C, s, insets, isDark }: { C: typeof LIGHT; s: any; insets: { bottom: number }; isDark: boolean }) {
  const sk = C.skeleton;
  return (
    <View style={s.screen}>
      {isDark && <DarkBackdrop />}
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <SafeAreaView edges={["top"]} style={s.safeBar}>
        <View style={s.topBar}>
          <View style={s.topLeft}>
            <View style={[s.avatarWrap, { backgroundColor: sk }]} />
            <View style={{ gap: 6 }}>
              <Sk w={56} h={8} bg={sk} />
              <Sk w={110} h={13} bg={sk} />
            </View>
          </View>
          <View style={[s.bellBtn, { backgroundColor: sk, borderColor: "transparent", elevation: 0, shadowOpacity: 0 }]} />
        </View>
      </SafeAreaView>

      <ScrollView scrollEnabled={false} style={{ flex: 1, marginBottom: insets.bottom + 84 }} contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}>
        {/* Hero card */}
        <View style={[s.heroCard, { backgroundColor: sk, borderColor: "transparent", elevation: 0, shadowOpacity: 0 }]} />

        {/* Actions */}
        <View style={s.section}>
          <Sk w={90} h={13} bg={sk} />
          <View style={[s.actionsGrid, { marginTop: 16 }]}>
            {[0,1,2,3,4,5].map(i => (
              <View key={i} style={[s.actionWrap, { gap: 8 }]}>
                <View style={[s.actionIcon, { backgroundColor: sk, borderColor: "transparent", elevation: 0, shadowOpacity: 0 }]} />
                <Sk w={36} h={8} bg={sk} />
              </View>
            ))}
          </View>
        </View>

        {/* Transactions */}
        <View style={[s.sectionHeader, { marginTop: 24 }]}>
          <Sk w={110} h={13} bg={sk} />
        </View>
        {[0,1,2,3].map(i => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", padding: 18, gap: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: sk }} />
            <View style={{ flex: 1, gap: 8 }}>
              <Sk w="60%" h={12} bg={sk} />
              <Sk w="35%" h={9} bg={sk} />
            </View>
            <Sk w={44} h={13} bg={sk} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const ios = Platform.OS === "ios";
const LIGHT = {
  primary: "#0035C5",
  blue:    "#0047FF",
  text:    "#1A1C1C",
  textSec: "#434657",
  textMut: "#747688",
  bg:      ios ? "#F9F9F9"              : "#F0F4FA",
  white:   "#FFFFFF",
  green:   "#10B981",
  amber:   "#F59E0B",
  red:     "#EF4444",
  border:  ios ? "rgba(196,197,218,0.30)" : "rgba(196,197,218,0.40)",
  glassBg:  ios ? "rgba(255,255,255,0.70)" : "#FFFFFF",
  glassBord: ios ? "rgba(255,255,255,0.80)" : "rgba(0,0,0,0.07)",
  heroBg:   ios ? "rgba(255,255,255,0.40)" : "#FFFFFF",
  heroBord: ios ? "rgba(255,255,255,0.50)" : "rgba(0,53,197,0.10)",
  topBarBg: ios ? "rgba(255,255,255,0.60)" : "rgba(255,255,255,0.97)",
  topBord:  ios ? "rgba(0,0,0,0.03)"       : "rgba(0,0,0,0.07)",
  iconBg:      "#FFFFFF",
  labelMut:  ios ? "rgba(67,70,87,0.50)" : "rgba(67,70,87,0.55)",
  labelTier: ios ? "rgba(67,70,87,0.60)" : "rgba(67,70,87,0.65)",
  metaLbl:   ios ? "rgba(67,70,87,0.40)" : "rgba(67,70,87,0.45)",
  heroAccNum: ios ? "rgba(26,28,28,0.60)" : "rgba(26,28,28,0.65)",
  actionLbl:  ios ? "rgba(26,28,28,0.70)" : "rgba(26,28,28,0.75)",
  sectorImgBg: "#EEF4FF",
  recImgBg:    "rgba(0,53,197,0.06)",
  divider:  ios ? "rgba(0,0,0,0.03)" : "rgba(0,0,0,0.07)",
  avatarBg: "rgba(0,53,197,0.10)",
  skeleton: "#E4E8F0",
};
const DARK: typeof LIGHT = {
  primary: "#4D8DFF",
  blue:    "#4D8DFF",
  text:    "#EAF0FF",
  textSec: "#9FB0D0",
  textMut: "#6B7A99",
  bg:      "transparent",
  white:   "#FFFFFF",
  green:   "#10B981",
  amber:   "#F59E0B",
  red:     "#DC2626",
  border:  "rgba(255,255,255,0.14)",
  glassBg:     "rgba(255,255,255,0.08)",
  glassBord:   "rgba(255,255,255,0.15)",
  heroBg:      "rgba(255,255,255,0.08)",
  heroBord:    "rgba(255,255,255,0.18)",
  topBarBg:    "rgba(255,255,255,0.06)",
  topBord:     "rgba(255,255,255,0.14)",
  iconBg:      "rgba(255,255,255,0.08)",
  labelMut:    "rgba(159,176,208,0.50)",
  labelTier:   "rgba(159,176,208,0.60)",
  metaLbl:     "rgba(159,176,208,0.40)",
  heroAccNum:  "rgba(234,240,255,0.60)",
  actionLbl:   "rgba(234,240,255,0.70)",
  sectorImgBg: "rgba(255,255,255,0.06)",
  recImgBg:    "rgba(255,255,255,0.06)",
  divider:     "rgba(255,255,255,0.12)",
  avatarBg:    "rgba(77,141,255,0.20)",
  skeleton:    "rgba(255,255,255,0.08)",
};

// Fond dégradé sombre + lueurs bleues — même habillage que l'écran
// d'onboarding, affiché uniquement quand le mode sombre est actif (le mode
// clair garde son fond plein uni existant, inchangé).
function DarkBackdrop() {
  return (
    <>
      <LinearGradient
        colors={["#0B1220", "#060B16", "#000000"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={{
        position: "absolute", width: 420, height: 420, borderRadius: 210,
        backgroundColor: "rgba(56,189,248,0.08)", top: -160, right: -140,
      }} />
      <View pointerEvents="none" style={{
        position: "absolute", width: 360, height: 360, borderRadius: 180,
        backgroundColor: "rgba(0,71,255,0.08)", bottom: -140, left: -120,
      }} />
    </>
  );
}

/* ─── SECTOR IMAGE MAP ───────────────────────────────────────────────── */
const SECTOR_IMG_MAP: [string, string][] = [
  ["immobilier",    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80"],
  ["technolog",     "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80"],
  ["informatique",  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80"],
  ["alimentaire",   "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"],
  ["supermarche",   "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"],
  ["restaurant",    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80"],
  ["agriculture",   "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&q=80"],
  ["transport",     "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80"],
  ["sante",         "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80"],
  ["finance",       "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80"],
  ["mode",          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80"],
  ["education",     "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80"],
  ["sport",         "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&q=80"],
  ["energie",       "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&q=80"],
  ["construction",  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80"],
  ["hotel",         "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=400&q=80"],
  ["tourisme",      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80"],
];
const IMG_DEFAULT = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80";
function getSectorImage(name: string): string {
  const n = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [k, u] of SECTOR_IMG_MAP) { if (n.includes(k)) return u; }
  return IMG_DEFAULT;
}

const QUICK_ACTIONS = [
  { key: "recharge",     labelKey: "home.recharge",    icon: "add-circle-outline",     route: "/recharge"  },
  { key: "transfert",    labelKey: "home.transfer",    icon: "swap-horizontal-outline", route: "/transfert" },
  { key: "scanner",      labelKey: "home.scanner",     icon: "qr-code-outline",         route: "/qrcode"    },
  // Clé transport : pas de traduction distante (labelKey), le libellé est
  // fourni en dur — route calculée dynamiquement (voir onPress ci-dessous)
  // car BIM Transport n'a pas d'id fixe, il faut l'id réel du secteur.
  { key: "transport",    labelKey: null, label: "Commander un véhicule", icon: "car-outline", route: null },
  { key: "support",      labelKey: "home.support",     icon: "headset-outline",         route: "/support"   },
  { key: "orders",       labelKey: "home.orders",      icon: "receipt-outline",         route: "/mes-commandes" },
  { key: "allProducts",  labelKey: "home.allProducts", icon: "grid-outline",            route: "/products"  },
] as const;

/* ─── SUB-COMPONENTS ─────────────────────────────────────────────────── */
function ActionBtn({ label, icon, onPress, index }: { label: string; icon: string; onPress?: () => void; index: number }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const scale  = useRef(new Animated.Value(1)).current;
  const slideY = useRef(new Animated.Value(14)).current;
  const opac   = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 260, delay: index * 45, useNativeDriver: true }),
      Animated.timing(opac,   { toValue: 1, duration: 260, delay: index * 45, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <TouchableOpacity style={s.actionWrapH} onPress={onPress} activeOpacity={1}
      onPressIn={() => Animated.spring(scale, { toValue: 0.90, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
    >
      <Animated.View style={[{ opacity: opac, transform: [{ translateY: slideY }, { scale }], alignItems: "center", gap: 10 }]}>
        <View style={s.actionIcon}>
          <Ionicons name={icon as any} size={26} color={C.primary} />
        </View>
        <Text style={s.actionLabel}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Petit bouton rond animé en bord de rangée horizontale — signale discrètement
// "il y a plus à droite, fais défiler" (actions rapides, puces de filtre…).
function ScrollHintArrow({ color }: { color: string }) {
  const translateX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, { toValue: 4, duration: 550, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 550, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View
      style={{
        position: "absolute", right: 4, top: "50%", marginTop: -14,
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: color, alignItems: "center", justifyContent: "center",
        transform: [{ translateX }],
        elevation: 3, shadowColor: "#000", shadowOpacity: 0.20, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
      }}
      pointerEvents="none"
    >
      <Ionicons name="chevron-forward" size={14} color="#fff" />
    </Animated.View>
  );
}

function getSectorRoute(product: any): string {
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const sector = norm(product.company?.category?.name ?? "");
  const co     = norm(product.company?.name ?? "");
  const id     = product.companyId ?? product.company?.companyId;
  if (sector.includes("sante") || sector.includes("medical") || co.includes("sante") || co.includes("polyclinique") || co.includes("clinique") || co.includes("hopital"))
    return `/sante/${id}`;
  if (sector.includes("supermarche") || sector.includes("epicerie") || co.includes("supermarche") || co.includes("epicerie"))
    return `/bim-supermarche/${id}`;
  if (sector.includes("carburant") || sector.includes("station") || co.includes("station") || co.includes("carburant"))
    return `/bim-carburant/${id}`;
  if (sector.includes("gaz") || co.includes("gaz") || co.includes("gpl"))
    return `/bim-gaz/${id}`;
  if (sector.includes("hotel") || sector.includes("hotellerie") || co.includes("hotel"))
    return `/hotellerie/${id}`;
  if (sector.includes("energie") || sector.includes("energy") || co.includes("energie"))
    return `/bim-energie/${id}`;
  if (sector.includes("transport") || co.includes("transport"))
    return `/transport/${id}`;
  return `/service/${id}`;
}

// Secteurs avec une fiche produit dédiée (Santé, Carburant) : on y redirige
// directement avec le produit déjà sélectionné, au lieu de la page
// entreprise générique. BIM Hôtellerie n'a pas de fiche produit séparée mais
// sa page de secteur (liste + fiche détail en bottom sheet) remplace déjà la
// page entreprise générique. BIM Transport n'a pas de fiche produit — c'est un
// flux de réservation (choix du véhicule), pas un catalogue — donc il garde
// sa page de secteur habituelle. Tous les autres produits ouvrent la fiche
// produit générique (/product/[id]).
const SPECIAL_SECTOR_PREFIXES = ["/sante/", "/bim-carburant/", "/transport/", "/hotellerie/"];
const SECTOR_PRODUCT_PAGE: Record<string, string> = {
  "/sante/": "/sante/product",
  "/bim-carburant/": "/bim-carburant/product",
};
function handleProductTap(product: any, router: any) {
  if (product.companyId) {
    const route = getSectorRoute(product);
    const specialPrefix = SPECIAL_SECTOR_PREFIXES.find((p) => route.startsWith(p));
    if (specialPrefix) {
      const productPageBase = SECTOR_PRODUCT_PAGE[specialPrefix];
      if (productPageBase) {
        router.push({
          pathname: `${productPageBase}/[productId]`,
          params: { productId: String(product.productId), companyId: String(product.companyId) },
        } as any);
      } else {
        router.push(route as any);
      }
      return;
    }
  }
  router.push({ pathname: "/product/[productId]", params: { productId: String(product.productId) } } as any);
}

/* ─── MAIN ───────────────────────────────────────────────────────────── */
export default function HomeScreen() {
  const router   = useRouter();
  const { t: tr } = useTranslation();
  const insets  = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const { unread }   = useUnreadNotifications();

  const [userId,      setUserId]      = useState<string | null>(null);
  const [userIdReady, setUserIdReady] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [cartItems,   setCartItems]   = useState<any[]>([]);
  const [cartMeta,    setCartMeta]    = useState<{ companyId: string; companyName: string } | null>(null);

  const { data: sectorsData } = useGetAllSectorsQuery({ page: 1, pageSize: 10, search: "", paginate: false });
  const { data: user, isLoading, isError, refetch }        = useGetUserByIdQuery(userId!, { skip: !userId });
  const { data: productsData, refetch: refetchProducts } = useGetAllProductsQuery({ paginate: false });
  const { data: randomProductsData, refetch: refetchRandomProducts } = useGetAllProductsQuery({ standalone: "true", paginate: false });

  /* ── Grille "Tous nos produits" — pagination serveur + filtre par secteur ── */
  const [gridFilter, setGridFilter] = useState<string | null>(null);
  const [gridPage,   setGridPage]   = useState(1);
  const [gridItems,  setGridItems]  = useState<any[]>([]);
  const { data: gridData, isFetching: isFetchingGrid } = useGetAllProductsQuery({
    paginate: "true", page: gridPage, pageSize: 20,
    ...(gridFilter ? { businessId: gridFilter } : {}),
  });
  useEffect(() => {
    if (!gridData) return;
    const rows = gridData.data ?? [];
    setGridItems(prev => (gridPage === 1 ? rows : [...prev, ...rows]));
  }, [gridData]);
  useEffect(() => { setGridPage(1); }, [gridFilter]);
  const gridHasMore = (gridData?.currentPage ?? 1) < (gridData?.totalPages ?? 1);
  const loadMoreGrid = () => { if (gridHasMore && !isFetchingGrid) setGridPage(p => p + 1); };

  /* ── Mises à jour : contenu (temps réel), OTA (eas update), version PlayStore ── */
  const contentUpdate = useContentUpdate();
  const otaUpdate      = useOtaUpdate();
  const versionCheck   = useAppVersionCheck();
  useEnsureLocation();

  const applyContentUpdate = useCallback(async () => {
    await Promise.all([refetchRandomProducts(), refetchProducts()]);
    contentUpdate.dismiss();
  }, [contentUpdate]);

  const openStoreUpdate = useCallback(() => {
    if (versionCheck.storeUrl) Linking.openURL(versionCheck.storeUrl);
    versionCheck.dismiss();
  }, [versionCheck.storeUrl, versionCheck.dismiss]);

  useEffect(() => {
    AsyncStorage.getItem("userId").then(id => { setUserId(id); setUserIdReady(true); });
  }, []);

  const loadCart = useCallback(() => {
    (async () => {
      const raw  = await AsyncStorage.getItem("bim_supermarche_cart");
      const meta = await AsyncStorage.getItem("bim_supermarche_cart_meta");
      setCartItems(raw ? JSON.parse(raw) : []);
      setCartMeta(meta ? JSON.parse(meta) : null);
    })();
  }, []);

  useFocusEffect(loadCart);

  useEffect(() => { if (userIdReady && !userId) router.replace("/onboarding"); }, [userIdReady, userId]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setGridPage(1);
      await Promise.all([
        refetch(),
        refetchProducts(),
        refetchRandomProducts(),
        loadCart(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // Secteurs — utilisés uniquement comme puces de filtre pour la grille
  // "Tous nos produits" (plus de grandes cartes secteur à l'accueil).
  const sectors = (sectorsData?.data || []).slice(0, 10);
  // BIM Transport n'a pas de "produits" dans ce catalogue (c'est une
  // réservation, pas un article) — filtrer sur ce secteur n'affichait donc
  // jamais rien. Retiré des puces de filtre ; accessible depuis l'action
  // rapide "Commander un véhicule" à la place.
  const filterableSectors = sectors.filter((sec: any) => !(sec.name ?? "").toLowerCase().includes("transport"));
  const allProducts  = productsData?.data || productsData || [];
  const recommended  = allProducts
    .filter((p: any) => p.isRecommended === true || p.isRecommended === 1)
    .slice(0, 8);
  const cartTotal    = cartItems.reduce((n: number, i: any) => n + i.unitPrice * i.qty, 0);
  const avatarUri    = user?.imageUrl
    ? user.imageUrl.startsWith("http") ? user.imageUrl : `${API_URL_BASE}${user.imageUrl}`
    : null;

  /* Une fois les données affichées une première fois, on ne repasse plus jamais
     par le skeleton — évite le clignotement "chargement" lors des refetchs en
     arrière-plan (focus, socket, pull-to-refresh…). */
  useEffect(() => { if (user) setHasLoadedOnce(true); }, [user]);

  /* Show skeleton while AsyncStorage is loading or user data is not yet ready */
  if (!hasLoadedOnce && (!userIdReady || (userIdReady && !!userId && isLoading && !user))) {
    return <HomeSkeleton C={C} s={s} insets={insets} isDark={isDark} />;
  }

  return (
    <View style={s.screen}>
      {isDark && <DarkBackdrop />}
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      {userId && <CompletePhoneModal userId={userId} telephone={user?.telephone} onSaved={refetch} />}
      {userId && !!user?.telephone && (
        <CompleteEmailModal userId={userId} email={user?.email} onSaved={refetch} />
      )}

      {/* ── TOP BAR ────────────────────────────────────────────────────── */}
      <SafeAreaView edges={["top"]} style={s.safeBar}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.topLeft} onPress={() => router.push("/profile" as any)} activeOpacity={0.8}>
            <View style={s.avatarWrap}>
              {avatarUri
                ? <Image source={{ uri: avatarUri }} style={s.avatar} contentFit="cover" />
                : <View style={[s.avatar, { backgroundColor: C.avatarBg, alignItems: "center", justifyContent: "center" }]}>
                    <Ionicons name="person" size={18} color={C.primary} />
                  </View>
              }
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={s.topTier}>PREMIUM TIER</Text>
              <Text style={s.topGreeting} numberOfLines={1}>Salut, {user?.username ?? "..."}</Text>
            </View>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity style={s.bellBtn} onPress={() => router.push("/products" as any)}>
              <Ionicons name="grid-outline" size={20} color={C.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.bellBtn}
              onPress={() => cartMeta
                ? router.push({ pathname: "/bim-supermarche/cart", params: { companyId: cartMeta.companyId, companyName: cartMeta.companyName } } as any)
                : router.push("/bim-supermarche/cart" as any)
              }
            >
              <Ionicons name="cart-outline" size={20} color={C.text} />
              {cartItems.length > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{cartItems.length > 99 ? "99+" : cartItems.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={s.bellBtn} onPress={() => router.push("/mes-commandes" as any)}>
              <Ionicons name="receipt-outline" size={20} color={C.text} />
            </TouchableOpacity>
            <TouchableOpacity style={s.bellBtn} onPress={() => router.push("/notification" as any)}>
              <Ionicons name="notifications-outline" size={20} color={C.text} />
              {unread > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{unread > 99 ? "99+" : unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={gridItems}
        keyExtractor={(item: any, i: number) => String(item.productId ?? item.id ?? i)}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        style={{ flex: 1, marginBottom: insets.bottom + 84 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} tintColor={C.primary} />}
        contentContainerStyle={s.scroll}
        onEndReached={loadMoreGrid}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <>
            {/* ── QUICK ACTIONS (tout en haut, juste sous le header) ────────── */}
            <View style={[s.section, { marginTop: 14 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={s.sectionTitle}>Actions Rapides</Text>
                <TouchableOpacity onPress={() => router.push("/mes-commandes" as any)}>
                  <Text style={s.seeAll}>Voir toutes tes commandes →</Text>
                </TouchableOpacity>
              </View>
              <View style={{ position: "relative" }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.actionsScroll}>
                  {QUICK_ACTIONS.map((a, i) => (
                    <ActionBtn
                      key={a.key}
                      label={a.labelKey ? tr(a.labelKey) : (a as any).label}
                      icon={a.icon}
                      index={i}
                      onPress={() => {
                        if (a.key === "transport") {
                          const transportSector = sectors.find((sec: any) =>
                            (sec.name ?? "").toLowerCase().includes("transport")
                          );
                          if (transportSector) router.push(`/transport/${transportSector.businessId}` as any);
                          return;
                        }
                        if (a.route === null) { onRefresh(); return; }
                        router.push(a.route as any);
                      }}
                    />
                  ))}
                </ScrollView>
                <ScrollHintArrow color={C.primary} />
              </View>
            </View>

            {/* ── SOLDE (toujours visible) ──────────────────────────────── */}
            <View style={s.soldeCard}>
              <View style={s.soldeIconWrap}>
                <Ionicons name="wallet-outline" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.soldeLabel}>SOLDE DISPONIBLE</Text>
                <View style={s.soldeBalRow}>
                  <Text style={s.soldeBal}>{Number(user?.soldNumber ?? 0).toFixed(2)}</Text>
                  <Text style={s.soldeEC}>EC</Text>
                </View>
              </View>
              <TouchableOpacity style={s.soldeLink} onPress={() => router.push("/solde" as any)} activeOpacity={0.8}>
                <Text style={s.soldeLinkText}>Voir le solde</Text>
                <Ionicons name="chevron-forward" size={14} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* ── MISES À JOUR DISPONIBLES ──────────────────────────────────── */}
            {contentUpdate.available && (
              <TouchableOpacity style={[s.updateBanner, { backgroundColor: C.primary }]} onPress={applyContentUpdate} activeOpacity={0.88}>
                <Ionicons name="sparkles-outline" size={18} color="#fff" />
                <Text style={s.updateBannerText}>Nouveau contenu disponible · Mettre à jour</Text>
                <Ionicons name="refresh-outline" size={16} color="#fff" />
              </TouchableOpacity>
            )}
            {otaUpdate.available && (
              <TouchableOpacity style={[s.updateBanner, { backgroundColor: C.green }]} onPress={otaUpdate.apply} activeOpacity={0.88} disabled={otaUpdate.applying}>
                {otaUpdate.applying
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="cloud-download-outline" size={18} color="#fff" />}
                <Text style={s.updateBannerText}>{otaUpdate.applying ? "Mise à jour en cours…" : "Mise à jour disponible · Installer"}</Text>
                {!otaUpdate.applying && <Ionicons name="chevron-forward" size={16} color="#fff" />}
              </TouchableOpacity>
            )}
            {versionCheck.available && (
              <TouchableOpacity style={[s.updateBanner, { backgroundColor: C.amber }]} onPress={openStoreUpdate} activeOpacity={0.88}>
                <Ionicons name="rocket-outline" size={18} color="#fff" />
                <Text style={s.updateBannerText}>Nouvelle version {versionCheck.latestVersion} disponible sur le store</Text>
                <Ionicons name="open-outline" size={16} color="#fff" />
              </TouchableOpacity>
            )}

            {/* ── PRODUITS DU MOMENT (sans entreprise) ───────────────────────── */}
            {(randomProductsData?.data ?? []).length > 0 && (
              <>
                <View style={[s.sectionHeader, { marginTop: 20 }]}>
                  <Text style={s.sectionTitle}>Produits du moment</Text>
                  <TouchableOpacity onPress={() => router.push("/products" as any)}>
                    <Text style={s.seeAll}>Voir tous les produits →</Text>
                  </TouchableOpacity>
                </View>
                <View style={s.momentList}>
                  {(randomProductsData?.data ?? []).map((product: any) => {
                    const imgUri = product.imageUrl
                      ? product.imageUrl.startsWith("http") ? product.imageUrl : `${API_URL_BASE}${product.imageUrl}`
                      : null;
                    const price = Number(product.price ?? 0).toFixed(2);
                    return (
                      <TouchableOpacity key={`rnd-${product.productId}`} style={s.momentRow} activeOpacity={0.9} onPress={() => handleProductTap(product, router)}>
                        <View style={s.momentImgWrap}>
                          {imgUri
                            ? <Image source={{ uri: imgUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={300} />
                            : <Ionicons name="cube-outline" size={28} color={C.primary} style={{ opacity: 0.3 }} />
                          }
                        </View>
                        <View style={s.momentInfo}>
                          <View>
                            {!!product.categories?.[0]?.name && (
                              <Text style={s.momentCategory} numberOfLines={1}>{product.categories[0].name}</Text>
                            )}
                            <Text style={s.momentName} numberOfLines={1}>{product.name}</Text>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <View>
                              <Text style={s.momentPriceLabel}>Prix unitaire</Text>
                              {product.priceOnRequest
                                ? <Text style={s.momentPrice}>Prix à discuter</Text>
                                : <Text style={s.momentPrice}>{price} <Text style={s.momentPriceEC}>EC</Text></Text>}
                            </View>
                            <TouchableOpacity style={s.momentOrderBtn} onPress={() => handleProductTap(product, router)} activeOpacity={0.85}>
                              <Text style={s.momentOrderBtnText}>Commander</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* ── ESPACE AGENT (only visible if user.isAgent) ──────────────── */}
            {user?.isAgent && (
              <TouchableOpacity style={s.agentBanner} onPress={() => router.push("/agent-dashboard" as any)} activeOpacity={0.85}>
                <View style={s.agentBannerLeft}>
                  <View style={s.agentIconWrap}>
                    <Ionicons name="id-card-outline" size={22} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={s.agentBannerTitle}>Espace Agent</Text>
                    <Text style={s.agentBannerSub}>Voir mes retraits & commissions</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.70)" />
              </TouchableOpacity>
            )}

            <FirstOrderHint />

            {/* ── TOUS NOS PRODUITS ──────────────────────────────────────── */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Tous nos produits</Text>
            </View>
            <View style={{ position: "relative" }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
                <TouchableOpacity
                  style={[s.chip, gridFilter === null && s.chipActive]}
                  onPress={() => setGridFilter(null)}
                  activeOpacity={0.85}
                >
                  <Text style={[s.chipText, gridFilter === null && s.chipTextActive]}>Tout</Text>
                </TouchableOpacity>
                {filterableSectors.map((sector: any) => (
                  <TouchableOpacity
                    key={sector.businessId}
                    style={[s.chip, String(gridFilter) === String(sector.businessId) && s.chipActive]}
                    onPress={() => setGridFilter(String(sector.businessId))}
                    activeOpacity={0.85}
                  >
                    <Text style={[s.chipText, String(gridFilter) === String(sector.businessId) && s.chipTextActive]}>{sector.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollHintArrow color={C.primary} />
            </View>
          </>
        }
        renderItem={({ item: product }: { item: any }) => {
          const imgUri = product.imageUrl
            ? product.imageUrl.startsWith("http") ? product.imageUrl : `${API_URL_BASE}${product.imageUrl}`
            : null;
          const price = Number(product.price ?? 0).toFixed(2);
          return (
            <TouchableOpacity style={[s.momentRow, { marginHorizontal: 20 }]} activeOpacity={0.9} onPress={() => handleProductTap(product, router)}>
              <View style={s.momentImgWrap}>
                {imgUri
                  ? <Image source={{ uri: imgUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={300} />
                  : <Ionicons name="cube-outline" size={28} color={C.primary} style={{ opacity: 0.3 }} />
                }
              </View>
              <View style={s.momentInfo}>
                <View>
                  {!!product.categories?.[0]?.name && (
                    <Text style={s.momentCategory} numberOfLines={1}>{product.categories[0].name}</Text>
                  )}
                  <Text style={s.momentName} numberOfLines={1}>{product.name}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <View>
                    <Text style={s.momentPriceLabel}>Prix unitaire</Text>
                    {product.priceOnRequest
                      ? <Text style={s.momentPrice}>Prix à discuter</Text>
                      : <Text style={s.momentPrice}>{price} <Text style={s.momentPriceEC}>EC</Text></Text>}
                  </View>
                  <TouchableOpacity style={s.momentOrderBtn} onPress={() => handleProductTap(product, router)} activeOpacity={0.85}>
                    <Text style={s.momentOrderBtnText}>Commander</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          isFetchingGrid ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator size="small" color={C.primary} />
            </View>
          ) : (
            <View style={[s.glassCard, s.emptyBox, { marginHorizontal: 20 }]}>
              <Ionicons name="cube-outline" size={28} color={C.textMut} />
              <Text style={s.emptyText}>Aucun produit disponible</Text>
            </View>
          )
        }
        ListFooterComponent={
          <>
            {isFetchingGrid && gridItems.length > 0 && (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator size="small" color={C.primary} />
              </View>
            )}

            {/* ── MON PANIER ─────────────────────────────────────────────── */}
            <View style={[s.sectionHeader, { marginTop: 28 }]}>
              <Text style={s.sectionTitle}>Panier</Text>
              {cartItems.length > 0 && (
                <TouchableOpacity onPress={() => cartMeta
                  ? router.push({ pathname: "/bim-supermarche/cart", params: { companyId: cartMeta.companyId, companyName: cartMeta.companyName } } as any)
                  : router.push("/bim-supermarche/cart" as any)
                }>
                  <Text style={s.seeAll}>Voir le panier →</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={[s.glassDeep, { borderRadius: 32, padding: 18, marginHorizontal: 20 }]}>
              {cartItems.length === 0 ? (
                <View style={s.emptyBox}>
                  <Ionicons name="cart-outline" size={28} color={C.textMut} />
                  <Text style={s.emptyText}>Panier vide</Text>
                </View>
              ) : (
                <>
                  <View style={{ gap: 14, marginBottom: 16 }}>
                    {cartItems.slice(0, 3).map((item: any, i: number) => {
                      const imgUri = item.imageUrl
                        ? item.imageUrl.startsWith("http") ? item.imageUrl : `${API_URL_BASE}${item.imageUrl}`
                        : null;
                      return (
                        <View key={`cart-${item.productId}-${i}`} style={s.cartItem}>
                          <View style={s.cartImgWrap}>
                            {imgUri
                              ? <Image source={{ uri: imgUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                              : <Ionicons name="cube-outline" size={20} color={C.primary} />
                            }
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={s.cartName} numberOfLines={1}>{item.name}</Text>
                            <Text style={s.cartQty}>×{item.qty}</Text>
                          </View>
                          <Text style={s.cartPrice}>{(item.unitPrice * item.qty).toFixed(2)} EC</Text>
                        </View>
                      );
                    })}
                    {cartItems.length > 3 && (
                      <Text style={{ fontFamily: "NexaLight", fontSize: 12, color: C.textMut, textAlign: "center" }}>
                        +{cartItems.length - 3} autre{cartItems.length - 3 > 1 ? "s" : ""} article{cartItems.length - 3 > 1 ? "s" : ""}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={s.checkoutBtn}
                    onPress={() => cartMeta
                      ? router.push({ pathname: "/bim-supermarche/cart", params: { companyId: cartMeta.companyId, companyName: cartMeta.companyName } } as any)
                      : router.push("/bim-supermarche/cart" as any)
                    }
                    activeOpacity={0.88}
                  >
                    <Text style={s.checkoutText}>
                      Passer à la caisse · {cartTotal.toFixed(2)} EC
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* ── ARTICLES RECOMMANDÉS ──────────────────────────────────── */}
            {recommended.length > 0 && (
              <>
                <View style={[s.sectionHeader, { marginTop: 28 }]}>
                  <Text style={s.sectionTitle}>Articles Recommandés</Text>
                  <TouchableOpacity onPress={() => router.push("/recommended" as any)}>
                    <Text style={s.seeAll}>Voir plus →</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.sectorsScroll}
                >
                  {recommended.map((product: any, i: number) => {
                    const imgUri = product.imageUrl
                      ? product.imageUrl.startsWith("http") ? product.imageUrl : `${API_URL_BASE}${product.imageUrl}`
                      : null;
                    const price = Number(product.price ?? 0).toFixed(2);
                    return (
                      <TouchableOpacity
                        key={`rec-${product.productId ?? product.id ?? i}`}
                        style={s.recCard}
                        activeOpacity={0.88}
                        onPress={() => router.push(getSectorRoute(product) as any)}
                      >
                        <View style={s.recImgWrap}>
                          {imgUri
                            ? <Image source={{ uri: imgUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={300} />
                            : <Ionicons name="cube-outline" size={32} color={C.primary} style={{ opacity: 0.3 }} />
                          }
                        </View>
                        <View style={{ padding: 12 }}>
                          <Text style={s.recName} numberOfLines={1}>{product.name}</Text>
                          <Text style={s.recSub} numberOfLines={1}>{product.company?.name ?? ""}</Text>
                          <Text style={s.recPrice}>{price} EC</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            <View style={{ height: 120 }} />
          </>
        }
      />
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  loader: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontFamily: "NexaLight", fontSize: 14, color: C.textMut },

  /* Top bar */
  safeBar: { backgroundColor: C.topBarBg, zIndex: 50 },
  topBar:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.topBord },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
  avatarWrap: { width: 40, height: 40, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: C.topBord, backgroundColor: C.avatarBg },
  avatar:     { width: 40, height: 40 },
  topTier:    { fontFamily: "NexaBold", fontSize: 8, color: C.labelTier, letterSpacing: 1.5 },
  topGreeting:{ fontFamily: "NexaBold", fontSize: 15, color: C.text },
  bellBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: C.iconBg, borderWidth: 1, borderColor: C.topBord, alignItems: "center", justifyContent: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  badge:      { position: "absolute", top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#DC0302", alignItems: "center", justifyContent: "center", paddingHorizontal: 3, borderWidth: 1.5, borderColor: C.white },
  badgeText:  { color: C.white, fontSize: 9, fontFamily: "NexaBold" },

  scroll: { paddingTop: 8, paddingBottom: 8 },

  /* Hero card (skeleton uniquement désormais — le détail vit sur /solde) */
  heroCard: {
    marginHorizontal: 20, marginTop: 20, marginBottom: 4,
    borderRadius: 36, padding: 28, height: 220,
    backgroundColor: C.heroBg,
    borderWidth: 1, borderColor: C.heroBord,
    elevation: 3, shadowColor: ios ? C.blue : "#000",
    shadowOpacity: 0.05, shadowRadius: 50, shadowOffset: { width: 0, height: 20 },
    justifyContent: "space-between", overflow: "hidden",
  },

  /* Solde — toujours visible, avec lien vers la page détaillée */
  soldeCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 20, marginTop: 14, borderRadius: 22, padding: 16,
    backgroundColor: C.heroBg, borderWidth: 1, borderColor: C.heroBord,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  soldeIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  soldeLabel: { fontFamily: "NexaBold", fontSize: 9, color: C.labelMut, letterSpacing: 1.5 },
  soldeBalRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 3 },
  soldeBal: { fontFamily: "NexaBold", fontSize: 24, color: C.text, letterSpacing: -0.5 },
  soldeEC: { fontFamily: "NexaBold", fontSize: 14, color: C.primary },
  soldeLink: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.primary, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  soldeLinkText: { fontFamily: "NexaBold", fontSize: 11, color: "#fff" },

  /* Quick actions */
  section:     { paddingHorizontal: 20, marginTop: 28 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 28, marginBottom: 0 },
  sectionTitle:  { fontFamily: "NexaBold", fontSize: 17, color: C.text },
  seeAll:        { fontFamily: "NexaBold", fontSize: 12, color: C.primary },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 16, gap: 0 },
  actionWrap:  { width: "33%", marginBottom: 20, alignItems: "center" },
  actionsScroll: { paddingTop: 16, paddingRight: 32, gap: 20 },
  actionWrapH: { width: 72, alignItems: "center" },
  actionIcon:  {
    width: 64, height: 64, borderRadius: 22,
    backgroundColor: C.iconBg,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.topBord,
    elevation: 3, shadowColor: "#000",
    shadowOpacity: 0.02, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  actionLabel: { fontFamily: "NexaBold", fontSize: 11, color: C.actionLbl, textAlign: "center", marginTop: 0 },

  /* Sectors (chips de filtre réutilisent ce conteneur horizontal) */
  sectorsScroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 14 },

  /* Glass cards */
  glassCard: {
    backgroundColor: C.glassBg,
    borderWidth: 1, borderColor: C.glassBord,
    elevation: 2, shadowColor: "#000",
    shadowOpacity: 0.03, shadowRadius: 40, shadowOffset: { width: 0, height: 10 },
  },
  glassDeep: {
    backgroundColor: C.heroBg,
    borderWidth: 1, borderColor: C.heroBord,
    elevation: 3, shadowColor: ios ? C.blue : "#000",
    shadowOpacity: 0.05, shadowRadius: 50, shadowOffset: { width: 0, height: 20 },
  },
  emptyBox:  { alignItems: "center", justifyContent: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontFamily: "NexaLight", fontSize: 13, color: C.textMut },

  /* Cart */
  cartItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  cartImgWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.iconBg, overflow: "hidden", borderWidth: 1, borderColor: C.topBord, alignItems: "center", justifyContent: "center" },
  cartName:    { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  cartQty:     { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, marginTop: 2 },
  cartPrice:   { fontFamily: "NexaBold", fontSize: 13, color: C.primary },
  checkoutBtn: {
    backgroundColor: C.primary, borderRadius: 18,
    paddingVertical: 14, alignItems: "center",
    elevation: 4, shadowColor: ios ? C.blue : "#000",
    shadowOpacity: 0.30, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  checkoutText: { fontFamily: "NexaBold", fontSize: 14, color: C.white },

  /* Agent banner */
  agentBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: C.primary, borderRadius: 20, padding: 16,
    elevation: 3, shadowColor: C.primary, shadowOpacity: 0.30, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  agentBannerLeft:  { flexDirection: "row", alignItems: "center", gap: 12 },
  agentIconWrap:    { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.20)", alignItems: "center", justifyContent: "center" },
  agentBannerTitle: { fontFamily: "NexaBold", fontSize: 15, color: "#FFFFFF" },
  agentBannerSub:   { fontFamily: "NexaLight", fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 },

  /* Update banners */
  updateBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 20, marginTop: 14, borderRadius: 18, padding: 14,
    elevation: 3, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  updateBannerText: { flex: 1, fontFamily: "NexaBold", fontSize: 12.5, color: "#fff" },

  /* Produits du moment — liste verticale, une carte pleine largeur par ligne */
  momentList: { paddingHorizontal: 20, paddingTop: 14, gap: 12 },
  momentRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 20, padding: 14,
    backgroundColor: C.glassBg, borderWidth: 1, borderColor: C.glassBord,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 20, shadowOffset: { width: 0, height: 6 },
  },
  momentImgWrap: {
    width: 88, height: 88, borderRadius: 16, flexShrink: 0,
    backgroundColor: C.recImgBg, alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  momentInfo: { flex: 1, minWidth: 0, justifyContent: "space-between", gap: 10, height: 88, paddingVertical: 1 },
  momentCategory: { fontFamily: "NexaBold", fontSize: 10, color: C.primary, letterSpacing: 0.6, textTransform: "uppercase" },
  momentName: { fontFamily: "NexaBold", fontSize: 15, color: C.text, marginTop: 2 },
  momentPriceLabel: { fontFamily: "NexaLight", fontSize: 10, color: C.textMut },
  momentPrice: { fontFamily: "NexaBold", fontSize: 14, color: C.text, marginTop: 1 },
  momentPriceEC: { fontFamily: "NexaBold", fontSize: 11, color: C.primary },
  momentOrderBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: C.primary, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  momentOrderBtnText: { fontFamily: "NexaBold", fontSize: 12, color: "#fff" },

  /* Tous nos produits — grille 2 colonnes + puces de filtre */
  chipRow: { paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    backgroundColor: C.glassBg, borderWidth: 1, borderColor: C.glassBord,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontFamily: "NexaBold", fontSize: 12, color: C.textMut },
  chipTextActive: { color: C.white },

  /* Recommended */
  recCard: {
    width: 176, borderRadius: 28, overflow: "hidden",
    backgroundColor: C.glassBg,
    borderWidth: 1, borderColor: C.glassBord,
    elevation: 2, shadowColor: "#000",
    shadowOpacity: 0.03, shadowRadius: 40, shadowOffset: { width: 0, height: 10 },
  },
  recImgWrap: {
    width: "100%", height: 120,
    backgroundColor: C.recImgBg,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  recName:  { fontFamily: "NexaBold", fontSize: 13, color: C.text, marginBottom: 4 },
  recSub:   { fontFamily: "NexaLight", fontSize: 11, color: C.textMut },
  recPrice: { fontFamily: "NexaBold", fontSize: 12, color: C.primary },
}); }
