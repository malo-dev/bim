/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetAllProductsQuery } from "@/services/productServices";
import { API_URL_BASE } from "@/constants/api";
import NoData from "@/components/ui/noData";
import { useAppTheme } from "@/app/_layout";

const { width: W } = Dimensions.get("window");
const CARD_W = (W - 48) / 2;

/* ─── PALETTE ─────────────────────────────────────────────────────────── */
const LIGHT = {
  primary: "#0035C5", blue: "#0047FF", deep: "#001257",
  white:   "#FFFFFF", bg: "#F9F9F9", surface: "#F3F3F4",
  surfLow: "#EEEEEE", text: "#1A1C1C", textSec: "#434657",
  textMut: "#747688", border: "rgba(196,197,218,0.30)",
  green:   "#10B981", amber: "#F59E0B", card: "#FFFFFF",
};
const DARK: typeof LIGHT = {
  primary: "#4D8DFF", blue: "#4D8DFF", deep: "#001257",
  white:   "#FFFFFF", bg: "#0B1220", surface: "#1A2540",
  surfLow: "#0F1A2E", text: "#EAF0FF", textSec: "#9FB0D0",
  textMut: "#6B7A99", border: "rgba(31,42,68,0.80)",
  green:   "#10B981", amber: "#F59E0B", card: "#1A2540",
};

const FALLBACKS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDQ8nSucgb7yIGmUn1cusxX94lbpaxYyprHKjsWtHr1-PmNuB2pITmGLL7hKeWazbuBIcmzH5Uqvlr2app0EUk_8yThBZZPyU7UQ6r9uy3Hhg_ouIB_BZjJ4XOAoS8cfQI1i1gnHGjIk2z3ZXHMLbCVLqXm6WV5AgVKArXFXFX7sFgRxpHpvn2IrbjZWpdrJCltiV9vkcaZUa7LfZxfk-ALEdScpBwXQmkODBs_aC-kwthBlFbRJgRmVJWtfq-Iw37VhfhSCFYZ_1w",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBOQfAUT0_Zkt8l63QABhwSEDPkPT8BKhnk2rnDRf44CCttkjRQqiTfX0h2XSH4JXzW8emNXTR08pzy58IX0cD70VScqDcKZPs1KT6I1KX42AgKV_3RxFx5ATw_vNfbnP6wrBVMQlUsTif6of-OtF9wH0fnFbY_boKrXRRqk5TF2AKvFLH_PA1FAcrHntRLAt54bL_zaxSRkbyrKm5izStFmYCaxNGphFV5duU6s40ftvgkPFbmUMvcTCnPccZF48gXVAlkhgrjZcQ",
];

/* ─── HELPERS ──────────────────────────────────────────────────────────── */
function getImgUri(item: any, index: number): string {
  if (item.imageUrl) {
    return item.imageUrl.startsWith("http") ? item.imageUrl : `${API_URL_BASE}${item.imageUrl}`;
  }
  return FALLBACKS[index % FALLBACKS.length];
}

function effectivePrice(product: any): number {
  const base = parseFloat(product.price ?? 0);
  const pct  = parseFloat(product.reduction ?? 0);
  if (pct > 0 && pct <= 100) return +(base * (1 - pct / 100)).toFixed(2);
  return base;
}

function hasDiscount(product: any): boolean {
  const pct = parseFloat(product.reduction ?? 0);
  return pct > 0 && pct <= 100;
}

function getSectorRoute(product: any): string {
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const sector = norm(product.company?.category?.name ?? "");
  const co     = norm(product.company?.name ?? "");
  const id     = product.companyId ?? product.company?.companyId;
  if (sector.includes("sante") || sector.includes("medical") || co.includes("polyclinique") || co.includes("clinique") || co.includes("hopital"))
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

/* ─── PRODUCT CARD ─────────────────────────────────────────────────────── */
function ProductCard({ item, index, onPress }: { item: any; index: number; onPress: () => void }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const c = useMemo(() => mkC(C), [isDark]);
  const scale    = useRef(new Animated.Value(1)).current;
  const imgUri   = getImgUri(item, index);
  const price    = effectivePrice(item);
  const discount = hasDiscount(item);
  const company  = item.company?.name ?? "";

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      onPress={onPress}
    >
      <Animated.View style={[c.card, { transform: [{ scale }] }]}>
        {discount && (
          <View style={c.discBadge}>
            <Text style={c.discBadgeText}>-{Math.round(parseFloat(item.reduction))}%</Text>
          </View>
        )}
        <View style={c.imgWrap}>
          <Image source={{ uri: imgUri }} style={c.img} contentFit="contain" transition={200} />
        </View>
        <View style={c.body}>
          <Text style={c.name} numberOfLines={2}>{item.name}</Text>
          {company ? <Text style={c.company} numberOfLines={1}>{company}</Text> : null}
          <View style={c.priceRow}>
            {discount && (
              <Text style={c.origPrice}>{parseFloat(item.price ?? 0).toFixed(2)} EC</Text>
            )}
            <Text style={c.price}>{price.toFixed(2)} EC</Text>
          </View>
          <View style={c.shopBtn}>
            <Ionicons name="arrow-forward" size={12} color={C.primary} />
            <Text style={c.shopText}>Voir le magasin</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ─── MAIN SCREEN ──────────────────────────────────────────────────────── */
export default function RecommendedScreen() {
  const router   = useRouter();
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useGetAllProductsQuery(
    { isRecommended: "true", paginate: "false" },
    { refetchOnMountOrArgChange: true }
  );

  const products: any[] = useMemo(() => {
    const raw = data?.data || data || [];
    if (!search) return raw;
    const q = search.toLowerCase();
    return raw.filter((p: any) => p.name?.toLowerCase().includes(q) || p.company?.name?.toLowerCase().includes(q));
  }, [data, search]);

  return (
    <>
      {/* Hide expo-router default header */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.surface} />

        {/* ── HEADER ── */}
        <SafeAreaView edges={["top"]} style={s.headerWrap}>
          <View style={s.topBar}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={C.text} />
            </TouchableOpacity>
            <View style={s.titleBlock}>
              <Text style={s.title}>Articles Recommandés</Text>
              <Text style={s.subtitle}>
                {isLoading ? "Chargement…" : `${products.length} produit${products.length !== 1 ? "s" : ""}`}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Search bar */}
          <View style={s.searchWrap}>
            <Ionicons name="search-outline" size={16} color={C.textMut} />
            <TextInput
              style={s.searchInput}
              placeholder="Rechercher un produit, une enseigne…"
              placeholderTextColor={C.textMut}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color={C.textMut} />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>

        {/* ── CONTENT ── */}
        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={{ fontFamily: "NexaLight", color: C.textMut, marginTop: 12, fontSize: 13 }}>
              Chargement des articles…
            </Text>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={item => String(item.productId)}
            numColumns={2}
            columnWrapperStyle={s.row}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 60 }}>
                <NoData />
                <Text style={{ fontFamily: "NexaBold", color: C.text, marginTop: 12, fontSize: 15 }}>
                  Aucun article recommandé
                </Text>
                <Text style={{ fontFamily: "NexaLight", color: C.textMut, marginTop: 4, fontSize: 13, textAlign: "center", paddingHorizontal: 32 }}>
                  Les articles marqués comme recommandés par l'admin apparaîtront ici.
                </Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <ProductCard
                item={item}
                index={index}
                onPress={() => router.push(getSectorRoute(item) as any)}
              />
            )}
          />
        )}
      </View>
    </>
  );
}

/* ─── STYLES ───────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  headerWrap:  { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  topBar:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, gap: 12 },
  backBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  titleBlock:  { flex: 1 },
  title:       { fontFamily: "NexaBold", fontSize: 19, color: C.text },
  subtitle:    { fontFamily: "NexaLight", fontSize: 12, color: C.textMut, marginTop: 2 },
  searchWrap:  { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 12, backgroundColor: C.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11, gap: 8 },
  searchInput: { flex: 1, fontFamily: "NexaLight", fontSize: 14, color: C.text },
  row:         { gap: 16, paddingHorizontal: 16 },
  list:        { gap: 16, paddingBottom: 32, paddingTop: 16 },
}); }

function mkC(C: typeof LIGHT) { return StyleSheet.create({
  card:         { width: CARD_W, backgroundColor: C.card, borderRadius: 24, overflow: "hidden", elevation: 3, shadowColor: "rgba(0,53,197,0.10)", shadowOpacity: 1, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
  imgWrap:      { height: 140, backgroundColor: C.surfLow, alignItems: "center", justifyContent: "center", padding: 16 },
  img:          { width: "100%", height: "100%" },
  body:         { padding: 12, gap: 5 },
  name:         { fontFamily: "NexaBold", fontSize: 13, color: C.text, lineHeight: 18 },
  company:      { fontFamily: "NexaLight", fontSize: 11, color: C.textMut },
  priceRow:     { flexDirection: "row", alignItems: "baseline", gap: 6, flexWrap: "wrap" },
  origPrice:    { fontFamily: "NexaLight", fontSize: 10, color: C.textMut, textDecorationLine: "line-through" },
  price:        { fontFamily: "NexaBold", fontSize: 15, color: C.primary },
  shopBtn:      { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  shopText:     { fontFamily: "NexaBold", fontSize: 10, color: C.primary, letterSpacing: 0.3 },
  discBadge:    { position: "absolute", top: 10, right: 10, backgroundColor: C.green, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, zIndex: 1 },
  discBadgeText:{ fontFamily: "NexaBold", fontSize: 10, color: C.white },
}); }
