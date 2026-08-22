/* eslint-disable */
import { API_URL_BASE } from "@/constants/api";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useContentUpdate } from "@/hooks/useContentUpdate";
import { useOtaUpdate } from "@/hooks/useOtaUpdate";
import { useAppVersionCheck } from "@/hooks/useAppVersionCheck";
import { useGetUserOrdersQuery, useCreateOrderMutation } from "@/services/orderService";
import { useGetAllProductsQuery } from "@/services/productServices";
import { useGetAllBannersQuery } from "@/services/bannerService";
import { setSectors } from "@/services/globalApi";
import { useGetAllSectorsQuery } from "@/services/sectorsServices";
import { useGetAllTransactionsQuery } from "@/services/tsxService";
import { useGetUserByIdQuery } from "@/services/userService";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import Modal from "react-native-modal";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import { useAppTheme } from "@/app/_layout";
import RandomProductModal from "@/components/RandomProductModal";

const RANDOM_CART_KEY = "bim_random_products_cart";

/* ─── PALETTE ────────────────────────────────────────────────────────── */
/* ─── SKELETON ───────────────────────────────────────────────────────── */
function Sk({ w, h, r = 6, bg }: { w: number | string; h: number; r?: number; bg: string }) {
  return <View style={{ width: w as any, height: h, borderRadius: r, backgroundColor: bg }} />;
}

function HomeSkeleton({ C, s, insets }: { C: typeof LIGHT; s: any; insets: { bottom: number } }) {
  const sk = C.skeleton;
  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
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
  bg:      "#0B1220",
  white:   "#FFFFFF",
  green:   "#10B981",
  amber:   "#F59E0B",
  red:     "#DC2626",
  border:  "rgba(31,42,68,0.80)",
  glassBg:     "rgba(26,37,64,0.70)",
  glassBord:   "rgba(31,42,68,0.80)",
  heroBg:      "rgba(26,37,64,0.60)",
  heroBord:    "rgba(77,150,255,0.12)",
  topBarBg:    "rgba(11,18,32,0.80)",
  topBord:     "rgba(31,42,68,0.50)",
  iconBg:      "#1A2540",
  labelMut:    "rgba(159,176,208,0.50)",
  labelTier:   "rgba(159,176,208,0.60)",
  metaLbl:     "rgba(159,176,208,0.40)",
  heroAccNum:  "rgba(234,240,255,0.60)",
  actionLbl:   "rgba(234,240,255,0.70)",
  sectorImgBg: "#0F1A2E",
  recImgBg:    "rgba(77,150,255,0.06)",
  divider:     "rgba(31,42,68,0.50)",
  avatarBg:    "rgba(77,150,255,0.10)",
  skeleton:    "#1A2540",
};

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

function maskAccount(acc: string | undefined): string {
  if (!acc) return "••••  ••••  ••••  ????";
  const last4 = String(acc).slice(-4);
  return `••••  ••••  ••••  ${last4}`;
}

const QUICK_ACTIONS = [
  { key: "recharge",  labelKey: "home.recharge", icon: "add-circle-outline",     route: "/recharge"  },
  { key: "retrait",   labelKey: "home.withdraw", icon: "wallet-outline",          route: "/retrait"   },
  { key: "transfert", labelKey: "home.transfer", icon: "swap-horizontal-outline", route: "/transfert" },
  { key: "scanner",   labelKey: "home.scanner",  icon: "qr-code-outline",         route: "/qrcode"    },
  { key: "support",   labelKey: "home.support",  icon: "headset-outline",         route: "/support"   },
  { key: "orders",    labelKey: "home.orders",   icon: "receipt-outline",         route: "/mes-commandes" },
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
    <TouchableOpacity style={s.actionWrap} onPress={onPress} activeOpacity={1}
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

function SectorCard({ sector, onPress }: { sector: any; onPress: () => void }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={1}
      onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
    >
      <Animated.View style={[s.sectorCard, { transform: [{ scale }] }]}>
        <View style={s.sectorImgWrap}>
          <Image source={{ uri: getSectorImage(sector.name) }} style={s.sectorImg} contentFit="cover" transition={300} />
        </View>
        <View style={s.sectorInfo}>
          <Text style={s.sectorName} numberOfLines={1}>{sector.name}</Text>
          <Text style={s.sectorSub}>Investissements actifs</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

function TxItem({ tx, isLast }: { tx: any; isLast: boolean }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const isIn  = tx.type === "recharge" || tx.type === "reception";
  const amount = tx.amount ?? tx.montant ?? 0;
  const date   = tx.createdAt
    ? new Date(tx.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "Aujourd'hui";
  const label  = tx.description || (isIn ? "Transfert Reçu" : "Paiement Merchant");
  return (
    <>
      <TouchableOpacity style={s.txRow} activeOpacity={0.75}>
        <View style={[s.txIcon, isIn
          ? { backgroundColor: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.12)" }
          : { backgroundColor: "rgba(0,53,197,0.05)", borderColor: "rgba(0,53,197,0.10)" }
        ]}>
          <Ionicons name={isIn ? "arrow-down-outline" : "bag-outline"} size={20}
            color={isIn ? C.green : C.primary} />
        </View>
        <View style={s.txInfo}>
          <Text style={s.txTitle}>{label}</Text>
          <Text style={s.txDate}>{date}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[s.txAmount, { color: isIn ? C.green : C.text }]}>
            {isIn ? "+" : "-"}{Number(amount).toFixed(2)} EC
          </Text>
          <Text style={[s.txStatus, { color: isIn ? C.green : C.textMut }]}>Succès</Text>
        </View>
      </TouchableOpacity>
      {!isLast && <View style={s.txDivider} />}
    </>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────── */
export default function HomeScreen() {
  const router   = useRouter();
  const dispatch = useDispatch();
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
  const [openScanner, setOpenScanner] = useState(false);
  const [cartItems,   setCartItems]   = useState<any[]>([]);
  const [cartMeta,    setCartMeta]    = useState<{ companyId: string; companyName: string } | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const { data: sectorsData, isLoading: isSectorsLoading, refetch: refetchSectors } = useGetAllSectorsQuery({ page: 1, pageSize: 10, search: "", paginate: false });
  const { data: user, isLoading, isError, refetch }        = useGetUserByIdQuery(userId!, { skip: !userId });
  const { data: txData, refetch: refetchTx }       = useGetAllTransactionsQuery({ userId, page: 1, pageSize: 6 }, { skip: !userId });
  const { data: ordersData, refetch: refetchOrders }   = useGetUserOrdersQuery({ page: 1, pageSize: 6 }, { skip: !userId });
  const { data: productsData, refetch: refetchProducts } = useGetAllProductsQuery({ paginate: false });
  const { data: randomProductsData, refetch: refetchRandomProducts } = useGetAllProductsQuery({ standalone: "true", paginate: false });
  const { data: bannersData, refetch: refetchBanners } = useGetAllBannersQuery({});
  const [createRandomOrder, { isLoading: orderingRandom }] = useCreateOrderMutation();

  /* ── Mises à jour : contenu (temps réel), OTA (eas update), version PlayStore ── */
  const contentUpdate = useContentUpdate();
  const otaUpdate      = useOtaUpdate();
  const versionCheck   = useAppVersionCheck();

  const applyContentUpdate = useCallback(async () => {
    await Promise.all([refetchRandomProducts(), refetchBanners()]);
    contentUpdate.dismiss();
  }, [contentUpdate]);

  const openStoreUpdate = useCallback(() => {
    if (versionCheck.storeUrl) Linking.openURL(versionCheck.storeUrl);
    versionCheck.dismiss();
  }, [versionCheck.storeUrl, versionCheck.dismiss]);

  const [selectedRandomProduct, setSelectedRandomProduct] = useState<any | null>(null);
  const [previewBanner, setPreviewBanner] = useState<{ uri: string; title?: string } | null>(null);

  /* ── Panier "Produits du moment" (produits sans entreprise) ───────────── */
  const [randomCart, setRandomCart] = useState<any[]>([]);

  const loadRandomCart = useCallback(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(RANDOM_CART_KEY);
      setRandomCart(raw ? JSON.parse(raw) : []);
    })();
  }, []);

  useFocusEffect(loadRandomCart);

  const persistRandomCart = async (items: any[]) => {
    setRandomCart(items);
    await AsyncStorage.setItem(RANDOM_CART_KEY, JSON.stringify(items));
  };

  const addToRandomCart = (product: any) => {
    const id = product.productId ?? product.id;
    const existing = randomCart.find((i) => i.productId === id);
    const next = existing
      ? randomCart.map((i) => (i.productId === id ? { ...i, qty: i.qty + 1 } : i))
      : [...randomCart, { productId: id, name: product.name, unitPrice: Number(product.price ?? 0), imageUrl: product.imageUrl, qty: 1 }];
    persistRandomCart(next);
  };

  const randomCartTotal = randomCart.reduce((n: number, i: any) => n + i.unitPrice * i.qty, 0);

  const orderRandomCart = () => {
    if (randomCart.length === 0) return;
    Alert.alert(
      "Confirmer la commande",
      `Commander ${randomCart.length} article(s) pour ${randomCartTotal.toFixed(2)} EC ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Commander",
          onPress: async () => {
            try {
              await createRandomOrder({
                items: randomCart.map((i) => ({ productId: i.productId, qty: i.qty, unitPrice: i.unitPrice })),
                paymentMethod: "delivery",
              }).unwrap();
              await persistRandomCart([]);
              Alert.alert("Commande envoyée", "Votre commande a bien été enregistrée. Suivez-la dans « Mes commandes ».");
            } catch {
              Alert.alert("Erreur", "La commande n'a pas pu être envoyée, réessayez.");
            }
          },
        },
      ]
    );
  };

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

  useEffect(() => { if (userIdReady && !userId) router.replace("/login"); }, [userIdReady, userId]);
  useEffect(() => { if (!permission?.granted) requestPermission(); }, [permission?.granted]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        refetch(),
        refetchSectors(),
        refetchTx(),
        refetchOrders(),
        refetchProducts(),
        refetchRandomProducts(),
        refetchBanners(),
        loadCart(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleGoto = (item: any) => {
    dispatch(setSectors([item]));
    router.push(`/service/${item.businessId}`);
  };

  const sectors      = (sectorsData?.data || []).slice(0, 8);
  const transactions = (txData?.data || []).slice(0, 6);
  const orders       = (ordersData?.data || ordersData || []).slice(0, 6);
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
    return <HomeSkeleton C={C} s={s} insets={insets} />;
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

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
            <View>
              <Text style={s.topTier}>PREMIUM TIER</Text>
              <Text style={s.topGreeting}>Salut, {user?.username ?? "..."}</Text>
            </View>
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
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1, marginBottom: insets.bottom + 84 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} tintColor={C.primary} />}
        contentContainerStyle={s.scroll}
      >
        {/* ── HERO BALANCE CARD ──────────────────────────────────────── */}
        <View style={s.heroCard}>
          {/* decorative blobs */}
          <View style={s.blob1} />
          <View style={s.blob2} />

          {/* top row */}
          <View style={s.heroTop}>
            <View>
              <Text style={s.heroLabel}>SOLDE DISPONIBLE</Text>
              <View style={s.heroBalRow}>
                <Text style={s.heroBal}>{Number(user?.soldNumber ?? 0).toFixed(2)}</Text>
                <Text style={s.heroEC}>EC</Text>
              </View>
            </View>
            <Text style={s.heroBrand}>BIMNEXT</Text>
          </View>

          {/* bottom row */}
          <View style={s.heroBot}>
            <View style={{ gap: 8 }}>
              <Text style={s.heroAccNum}>{maskAccount(user?.accountNumber)}</Text>
              <View style={s.heroMetaRow}>
                <View>
                  <Text style={s.heroMetaLabel}>STATUT</Text>
                  <View style={s.activeRow}>
                    <View style={s.greenDot} />
                    <Text style={s.activeText}>Actif</Text>
                  </View>
                </View>
              </View>
            </View>
            {/* overlapping circles */}
            <View style={s.circleGroup}>
              <View style={[s.circle, { zIndex: 2 }]} />
              <View style={[s.circle, { marginLeft: -20, zIndex: 1, backgroundColor: "rgba(147,197,253,0.12)" }]} />
            </View>
          </View>
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

        {/* ── NOS OFFRES SPÉCIALES ──────────────────────────────────────── */}
        {(bannersData?.data ?? []).length > 0 && (
          <>
            <View style={[s.sectionHeader, { marginTop: 20 }]}>
              <Text style={s.sectionTitle}>Nos offres spéciales</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.sectorsScroll}>
              {(bannersData?.data ?? []).map((banner: any) => {
                const imgUri = banner.imageUrl
                  ? banner.imageUrl.startsWith("http") ? banner.imageUrl : `${API_URL_BASE}${banner.imageUrl}`
                  : null;
                return (
                  <TouchableOpacity
                    key={banner.bannerId}
                    style={s.offerCard}
                    activeOpacity={0.88}
                    onPress={() => imgUri && setPreviewBanner({ uri: imgUri, title: banner.title })}
                  >
                    <View style={s.offerImgWrap}>
                      {imgUri
                        ? <Image source={{ uri: imgUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={300} />
                        : <Ionicons name="pricetag-outline" size={30} color={C.primary} style={{ opacity: 0.3 }} />
                      }
                    </View>
                    <View style={{ padding: 14 }}>
                      <Text style={s.offerTitle} numberOfLines={1}>{banner.title}</Text>
                      {!!banner.tagline && <Text style={s.offerTagline} numberOfLines={2}>{banner.tagline}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ── PRODUITS DU MOMENT (sans entreprise) ───────────────────────── */}
        {(randomProductsData?.data ?? []).length > 0 && (
          <>
            <View style={[s.sectionHeader, { marginTop: 20 }]}>
              <Text style={s.sectionTitle}>Produits du moment</Text>
              {randomCart.length > 0 && (
                <Text style={s.seeAll}>{randomCart.length} article(s)</Text>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.sectorsScroll}>
              {(randomProductsData?.data ?? []).map((product: any) => {
                const imgUri = product.imageUrl
                  ? product.imageUrl.startsWith("http") ? product.imageUrl : `${API_URL_BASE}${product.imageUrl}`
                  : null;
                const price = Number(product.price ?? 0).toFixed(2);
                return (
                  <TouchableOpacity key={`rnd-${product.productId}`} style={s.recCard} activeOpacity={0.9} onPress={() => setSelectedRandomProduct(product)}>
                    <View style={s.recImgWrap}>
                      {imgUri
                        ? <Image source={{ uri: imgUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={300} />
                        : <Ionicons name="cube-outline" size={32} color={C.primary} style={{ opacity: 0.3 }} />
                      }
                    </View>
                    <View style={{ padding: 12 }}>
                      <Text style={s.recName} numberOfLines={1}>{product.name}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                        {product.priceOnRequest
                          ? <Text style={[s.recPrice, { fontSize: 11 }]}>Prix à discuter</Text>
                          : <Text style={s.recPrice}>{price} EC</Text>}
                        <TouchableOpacity style={s.addToCartBtn} onPress={() => addToRandomCart(product)} activeOpacity={0.8}>
                          <Ionicons name="add" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {randomCart.length > 0 && (
              <TouchableOpacity style={[s.checkoutBtn, { marginHorizontal: 20, marginTop: 4 }]} onPress={orderRandomCart} activeOpacity={0.88} disabled={orderingRandom}>
                {orderingRandom
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.checkoutText}>Commander · {randomCartTotal.toFixed(2)} EC</Text>}
              </TouchableOpacity>
            )}
          </>
        )}

        {/* ── QUICK ACTIONS ──────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Actions Rapides</Text>
          <View style={s.actionsGrid}>
            {QUICK_ACTIONS.map((a, i) => (
              <ActionBtn
                key={a.key}
                label={tr(a.labelKey)}
                icon={a.icon}
                index={i}
                onPress={
                  a.route === null
                    ? onRefresh
                    : a.key === "scanner"
                    ? () => setOpenScanner(true)
                    : () => router.push(a.route as any)
                }
              />
            ))}
          </View>
        </View>

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

        {/* ── SECTEURS BIM ───────────────────────────────────────────── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Secteurs BIM</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/reseaux")}>
            <Text style={s.seeAll}>Explorer →</Text>
          </TouchableOpacity>
        </View>
        {isSectorsLoading ? (
          <View style={{ height: 180, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="small" color={C.primary} />
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.sectorsScroll}>
            {sectors.map((sector: any) => (
              <SectorCard key={sector.businessId} sector={sector} onPress={() => handleGoto(sector)} />
            ))}
          </ScrollView>
        )}

        {/* ── DERNIÈRES COMMANDES ────────────────────────────────────── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Dernières Commandes</Text>
          <TouchableOpacity onPress={() => router.push("/mes-commandes" as any)}>
            <Text style={s.seeAll}>Voir tout →</Text>
          </TouchableOpacity>
        </View>
        <View style={s.ordersList}>
          {orders.length === 0 ? (
            <View style={[s.glassCard, s.emptyBox]}>
              <Ionicons name="bag-outline" size={28} color={C.textMut} />
              <Text style={s.emptyText}>Aucune commande</Text>
            </View>
          ) : (
            orders.map((order: any, i: number) => {
              const st = order.status ?? "pending";
              const statusMeta: Record<string, { label: string; color: string; icon: string; iconBg: string }> = {
                pending:    { label: "En attente",   color: C.amber,   icon: "time-outline",             iconBg: "rgba(245,158,11,0.07)"  },
                confirmed:  { label: "Confirmée",    color: C.primary, icon: "checkmark-circle-outline", iconBg: "rgba(0,53,197,0.06)"    },
                processing: { label: "En préparation",color: C.primary,icon: "construct-outline",        iconBg: "rgba(0,53,197,0.06)"    },
                shipped:    { label: "En livraison", color: "#0047FF", icon: "bicycle-outline",           iconBg: "rgba(0,71,255,0.07)"    },
                delivered:  { label: "Livré",        color: C.green,   icon: "bag-check-outline",        iconBg: "rgba(16,185,129,0.07)"  },
                completed:  { label: "Livré",        color: C.green,   icon: "bag-check-outline",        iconBg: "rgba(16,185,129,0.07)"  },
                cancelled:  { label: "Annulé",       color: C.red,     icon: "close-circle-outline",     iconBg: "rgba(239,68,68,0.07)"   },
              };
              const { label: statusLabel, color: statusColor, icon: iconName, iconBg } =
                statusMeta[st] ?? statusMeta.pending;
              const total       = Number(order.totalAmount ?? order.total ?? 0).toFixed(2);
              const ref         = order.orderNumber ? `#BIM-${order.orderNumber}` : `#BIM-${order.id}`;
              return (
                <TouchableOpacity
                  key={`${order.id ?? i}-${i}`}
                  style={[s.glassCard, s.orderRow]}
                  onPress={() => order.orderNumber
                    ? router.push({ pathname: "/bim-supermarche/order-tracking", params: { orderNumber: order.orderNumber } } as any)
                    : router.push("/mes-commandes" as any)
                  }
                  activeOpacity={0.85}
                >
                  <View style={[s.orderIcon, { backgroundColor: iconBg }]}>
                    <Ionicons name={iconName as any} size={22} color={statusColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.orderRef}>{ref}</Text>
                    <Text style={[s.orderStatus, { color: statusColor }]}>{statusLabel.toUpperCase()}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={s.orderAmount}>{total} EC</Text>
                    <Ionicons name="chevron-forward" size={14} color={C.textMut} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── MON PANIER ─────────────────────────────────────────────── */}
        <View style={s.sectionHeader}>
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

        {/* ── TRANSACTIONS RÉCENTES ──────────────────────────────────── */}
        <View style={[s.sectionHeader, { marginTop: 28 }]}>
          <Text style={s.sectionTitle}>Transactions Récentes</Text>
          <TouchableOpacity onPress={() => router.push("/history" as any)}>
            <Text style={s.seeAll}>Voir plus →</Text>
          </TouchableOpacity>
        </View>
        <View style={[s.glassCard, { borderRadius: 32, padding: 6, marginHorizontal: 20 }]}>
          {transactions.length === 0 ? (
            <View style={s.emptyBox}>
              <Ionicons name="receipt-outline" size={28} color={C.textMut} />
              <Text style={s.emptyText}>Aucune transaction</Text>
            </View>
          ) : (
            transactions.map((tx: any, i: number) => (
              <TxItem key={`${tx.id ?? "tx"}-${i}`} tx={tx} isLast={i === transactions.length - 1} />
            ))
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── PRODUIT DU MOMENT : DÉTAIL / COMMANDER / SUIVRE ─────────────── */}
      <RandomProductModal
        visible={!!selectedRandomProduct}
        product={selectedRandomProduct}
        onClose={() => setSelectedRandomProduct(null)}
      />

      {/* ── APERÇU PLEIN ÉCRAN D'UNE BANNIÈRE "NOS OFFRES SPÉCIALES" ────── */}
      <Modal isVisible={!!previewBanner} style={{ margin: 0 }} onBackdropPress={() => setPreviewBanner(null)}>
        <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
          {previewBanner && (
            <Image source={{ uri: previewBanner.uri }} style={{ width: "100%", height: "60%" }} contentFit="contain" />
          )}
          {!!previewBanner?.title && <Text style={{ fontFamily: "NexaBold", fontSize: 15, color: "#fff", marginTop: 16, paddingHorizontal: 24, textAlign: "center" }}>{previewBanner.title}</Text>}
          <TouchableOpacity style={s.closeScanner} onPress={() => setPreviewBanner(null)}>
            <Ionicons name="close" size={28} color={C.white} />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── SCANNER MODAL ──────────────────────────────────────────────── */}
      <Modal isVisible={openScanner} style={{ margin: 0 }} onBackdropPress={() => setOpenScanner(false)}>
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <CameraView style={{ flex: 1 }} barcodeScannerSettings={{ barcodeTypes: ["qr"] }} />
          <TouchableOpacity style={s.closeScanner} onPress={() => setOpenScanner(false)}>
            <Ionicons name="close" size={28} color={C.white} />
          </TouchableOpacity>
        </View>
      </Modal>
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
  topLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarWrap: { width: 40, height: 40, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: C.topBord, backgroundColor: C.avatarBg },
  avatar:     { width: 40, height: 40 },
  topTier:    { fontFamily: "NexaBold", fontSize: 8, color: C.labelTier, letterSpacing: 1.5 },
  topGreeting:{ fontFamily: "NexaBold", fontSize: 15, color: C.text },
  bellBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: C.iconBg, borderWidth: 1, borderColor: C.topBord, alignItems: "center", justifyContent: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  badge:      { position: "absolute", top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#DC0302", alignItems: "center", justifyContent: "center", paddingHorizontal: 3, borderWidth: 1.5, borderColor: C.white },
  badgeText:  { color: C.white, fontSize: 9, fontFamily: "NexaBold" },

  scroll: { paddingTop: 8, paddingBottom: 8 },

  /* Hero card */
  heroCard: {
    marginHorizontal: 20, marginTop: 20, marginBottom: 4,
    borderRadius: 36, padding: 28, height: 220,
    backgroundColor: C.heroBg,
    borderWidth: 1, borderColor: C.heroBord,
    elevation: 3, shadowColor: ios ? C.blue : "#000",
    shadowOpacity: 0.05, shadowRadius: 50, shadowOffset: { width: 0, height: 20 },
    justifyContent: "space-between", overflow: "hidden",
  },
  blob1: { position: "absolute", right: -70, top: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: "rgba(0,53,197,0.04)" },
  blob2: { position: "absolute", left: -70, bottom: -70, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(147,197,253,0.04)" },
  heroTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", zIndex: 1 },
  heroLabel:  { fontFamily: "NexaBold", fontSize: 9, color: C.labelMut, letterSpacing: 2 },
  heroBalRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 6 },
  heroBal:    { fontFamily: "NexaBold", fontSize: 44, color: C.text, letterSpacing: -1 },
  heroEC:     { fontFamily: "NexaBold", fontSize: 22, color: C.primary },
  heroBrand:  { fontFamily: "NexaBold", fontSize: 20, color: "rgba(0,53,197,0.35)" },
  heroBot:    { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", zIndex: 1 },
  heroAccNum: { fontFamily: "NexaLight", fontSize: 13, color: C.heroAccNum, letterSpacing: 3 },
  heroMetaRow:{ flexDirection: "row", gap: 24, marginTop: 4 },
  heroMetaLabel: { fontFamily: "NexaBold", fontSize: 8, color: C.metaLbl, letterSpacing: 1.5 },
  activeRow:  { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  greenDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" },
  activeText: { fontFamily: "NexaBold", fontSize: 11, color: "#059669" },
  circleGroup:{ flexDirection: "row", alignItems: "center" },
  circle:     { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(0,53,197,0.08)", borderWidth: 2, borderColor: C.heroBord },

  /* Quick actions */
  section:     { paddingHorizontal: 20, marginTop: 28 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 28, marginBottom: 0 },
  sectionTitle:  { fontFamily: "NexaBold", fontSize: 17, color: C.text },
  seeAll:        { fontFamily: "NexaBold", fontSize: 12, color: C.primary },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 16, gap: 0 },
  actionWrap:  { width: "33%", marginBottom: 20, alignItems: "center" },
  actionIcon:  {
    width: 64, height: 64, borderRadius: 22,
    backgroundColor: C.iconBg,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.topBord,
    elevation: 3, shadowColor: "#000",
    shadowOpacity: 0.02, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  actionLabel: { fontFamily: "NexaBold", fontSize: 11, color: C.actionLbl, textAlign: "center", marginTop: 0 },

  /* Sectors */
  sectorsScroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
  sectorCard: {
    width: 200, borderRadius: 28, overflow: "hidden",
    backgroundColor: C.glassBg,
    borderWidth: 1, borderColor: C.glassBord,
    elevation: 2, shadowColor: "#000",
    shadowOpacity: 0.03, shadowRadius: 40, shadowOffset: { width: 0, height: 10 },
  },
  sectorImgWrap: { height: 130, overflow: "hidden", backgroundColor: C.sectorImgBg },
  sectorImg:     { width: "100%", height: "100%" },
  sectorInfo:    { padding: 14 },
  sectorName:    { fontFamily: "NexaBold", fontSize: 14, color: C.text },
  sectorSub:     { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, marginTop: 3 },

  /* Orders */
  ordersList: { paddingHorizontal: 20, marginTop: 14, gap: 10 },
  orderRow:   { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 24, padding: 16, marginHorizontal: 0 },
  orderIcon:  { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  orderRef:   { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  orderStatus:{ fontFamily: "NexaBold", fontSize: 9, letterSpacing: 1, marginTop: 2 },
  orderAmount:{ fontFamily: "NexaBold", fontSize: 14, color: C.text },

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

  /* Transactions */
  txRow:    { flexDirection: "row", alignItems: "center", padding: 18, gap: 14, borderRadius: 26 },
  txDivider:{ height: 1, backgroundColor: C.divider, marginHorizontal: 18 },
  txIcon:   { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  txInfo:   { flex: 1 },
  txTitle:  { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  txDate:   { fontFamily: "NexaLight", fontSize: 10, color: C.textMut, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.6 },
  txAmount: { fontFamily: "NexaBold", fontSize: 15 },
  txStatus: { fontFamily: "NexaLight", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 },

  /* Update banners */
  updateBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 20, marginTop: 14, borderRadius: 18, padding: 14,
    elevation: 3, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  updateBannerText: { flex: 1, fontFamily: "NexaBold", fontSize: 12.5, color: "#fff" },

  /* Nos offres spéciales */
  offerCard: {
    width: 220, borderRadius: 28, overflow: "hidden",
    backgroundColor: C.glassBg,
    borderWidth: 1, borderColor: C.glassBord,
    elevation: 2, shadowColor: "#000",
    shadowOpacity: 0.03, shadowRadius: 40, shadowOffset: { width: 0, height: 10 },
  },
  offerImgWrap: { height: 110, overflow: "hidden", backgroundColor: C.sectorImgBg, alignItems: "center", justifyContent: "center" },
  offerTitle:   { fontFamily: "NexaBold", fontSize: 14, color: C.text },
  offerTagline: { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, marginTop: 3, lineHeight: 15 },

  addToCartBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.primary, alignItems: "center", justifyContent: "center",
  },

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

  /* Scanner */
  closeScanner: { position: "absolute", top: 50, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
}); }
