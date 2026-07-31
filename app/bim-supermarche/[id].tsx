/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetAllProductsQuery } from "@/services/productServices";
import { useGetFavoriteIdsQuery, useToggleFavoriteMutation } from "@/services/favoriteService";
import { API_URL_BASE } from "@/constants/api";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import NoData from "@/components/ui/noData";
import { useAppTheme } from "@/app/_layout";

const { width: SCREEN_W } = Dimensions.get("window");
const CART_KEY = "bim_supermarche_cart";

/* ─── PALETTE ────────────────────────────────────────────────────────── */
const LIGHT = {
  primary: "#0035C5", blue: "#0047FF", deep: "#001257",
  white:   "#FFFFFF", bg: "#F9F9F9", surface: "#F3F3F4",
  surfLow: "#EEEEEE", text: "#1A1C1C", textSec: "#434657",
  textMut: "#747688", border: "rgba(196,197,218,0.30)",
  green:   "#10B981", amber: "#F59E0B", error: "#EF4444",
  card:       "#FFFFFF",
  safeBarBg:  "rgba(255,255,255,0.96)",
  heroCardBg: "rgba(255,255,255,0.82)",
  heroCardBord: "rgba(255,255,255,0.55)",
  catPillBord:  "rgba(196,197,218,0.40)",
  bottomNavBg:  "rgba(255,255,255,0.92)",
};
const DARK: typeof LIGHT = {
  primary: "#0035C5", blue: "#4D8DFF", deep: "#001257",
  white:   "#FFFFFF", bg: "#0B1220", surface: "#1A2540",
  surfLow: "#0F1A2E", text: "#EAF0FF", textSec: "#A3B4D0",
  textMut: "#6B7A99", border: "rgba(31,42,68,0.80)",
  green:   "#059669", amber: "#D97706", error: "#DC2626",
  card:       "#1A2540",
  safeBarBg:  "rgba(11,18,32,0.94)",
  heroCardBg: "rgba(26,37,64,0.85)",
  heroCardBord: "rgba(31,42,68,0.80)",
  catPillBord:  "rgba(31,42,68,0.60)",
  bottomNavBg:  "rgba(11,18,32,0.94)",
};

/* ─── ASSETS ─────────────────────────────────────────────────────────── */
const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA32MC7i6OUY-QZ0Sygxcb768CetUXb_ulivVXeQsBURFgGEKPmX9X_ietfkBICGh18Nw5TBDgwJNZSvFAx0NnUKKMoIgRXkrkUx8bDpumQMzPV35kzLdDtKTkFR41T63jwWmKSHCmeiV890vN3jxPoESdyLqxkaica79UyPhkYeFgTJqMt4xTJJ-hhZO8bcOQbPK0cp8Sgf3teWGu8QFqp3u9aqlsIYYONbv5zmQW3OwIqcQdEgPre603v_uM6sIMYcYn9gR77XFE";

const FALLBACK_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDQ8nSucgb7yIGmUn1cusxX94lbpaxYyprHKjsWtHr1-PmNuB2pITmGLL7hKeWazbuBIcmzH5Uqvlr2app0EUk_8yThBZZPyU7UQ6r9uy3Hhg_ouIB_BZjJ4XOAoS8cfQI1i1gnHGjIk2z3ZXHMLbCVLqXm6WV5AgVKArXFXFX7sFgRxpHpvn2IrbjZWpdrJCltiV9vkcaZUa7LfZxfk-ALEdScpBwXQmkODBs_aC-kwthBlFbRJgRmVJWtfq-Iw37VhfhSCFYZ_1w",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDSErKl0YpJZzCZOLq3BU23VzFwYe8Pvy106iSCv6n7CCZbRS_pOCeWpRkeQ5KqCLDSksLPhZjMy3H72UqpjujL7hsN_6gLN4rJWf6G69r8NOloOpofQ93FnotJB1DYfpeCnfgazOEAc5bH6tNAsTrOFxVZ7lhl-0KbHJLa-NoReZi0uOEn_thXi5ZWtNC6QU6ndEitlqhzS6N5Q34mZY8lCCZP_BaFjfhZHRGlReilspsYtFtlNUIVCSBEA6I7jK0xbsUjxLqwo7o",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDaIa2Vl5sRaoCyBvWAU8b50JP15Og5o5XkLZaTy0kM56CyGXJsgCS9bfGnf86GoYDd8pgSTK8Sx-gNHB09ZHearHLweef4naPT02rXzV4gyjbGB_PCd0jfuiWj_OtVEAcBLWOpQPu5XQGxVfE7Nr5OB1YzcT-E9G2UrXCRhQvEKNACRPZu2XwqBFNRuBlorlHDjM8y9JXKdq4w4mPKY5OZ3tNg3c2BZ9yjf7uCQ4N7CMsR6EAON4f5dpA64V69eZ0mnah7uGKXzOQ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBOQfAUT0_Zkt8l63QABhwSEDPkPT8BKhnk2rnDRf44CCttkjRQqiTfX0h2XSH4JXzW8emNXTR08pzy58IX0cD70VScqDcKZPs1KT6I1KX42AgKV_3RxFx5ATw_vNfbnP6wrBVMQlUsTif6of-OtF9wH0fnFbY_boKrXRRqk5TF2AKvFLH_PA1FAcrHntRLAt54bL_zaxSRkbyrKm5izStFmYCaxNGphFV5duU6s40ftvgkPFbmUMvcTCnPccZF48gXVAlkhgrjZcQ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD1ArqtY5ZEUs-0_lnU2VKFQVRS6dkymWhZvEC5-DYEPpGjSpBO4wLCT5YdbFfoC_O9nf0lHZpXC5lOnam9KDvQTW9KW2yEhm7X9XJFgCG3G4jHfkKJ7m4nyehJK4W9dd783XVztxrob0p8ZG9NudQDANKsWNw624umfkNvKgCjxnrmTzfSobW3-PFig5tpy3_G2nZA3DIXg8NATHI8iIdkx9Cp-EMyTrWs0xRDN8SKef2eUhgg1dF-_P21yFDGdO5vV887C_csNn4",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAeYoJS6mSlPkFWQYRQLLPni0Bjks4jH8rbv9RRikdHMALnkW_m1XjwQMkwSEjnsFU6TXPXornP-L6bKUthBPIds5oLz2ir5w8oTyezMeX5tfy4xWXN56WmqpxUdLPA_X8VHubf6kczHUt-77wRGLfwKu2cnX1fagaEVwzCV-1jfOmReSVW3Ehxsa7UQpD5rXSmi8Aqmv8OuSdbCVhfh9ZFXQ60q7le5zf-mMuQto4OrIfe6o3oU_45ECb2lek-eYOswUX4rvoTQNs",
];

/* categories are derived from real product data at runtime */

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

export type CartItem = {
  productId: number; name: string; unitPrice: number; qty: number; imageUrl: string | null;
};

/* ─── HELPERS ─────────────────────────────────────────────────────────── */
function getImgUri(item: any, index: number): string {
  if (item.imageUrl) {
    return item.imageUrl.startsWith("http") ? item.imageUrl : `${API_URL_BASE}${item.imageUrl}`;
  }
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

const SORT_OPTIONS = [
  { key: "default",    label: "Par défaut" },
  { key: "price_asc",  label: "Prix croissant" },
  { key: "price_desc", label: "Prix décroissant" },
  { key: "name_az",    label: "Nom A → Z" },
] as const;

const STOCK_OPTIONS = [
  { key: "all",      label: "Tout" },
  { key: "in_stock", label: "En stock" },
  { key: "out",      label: "Épuisé" },
] as const;

type SortKey  = typeof SORT_OPTIONS[number]["key"];
type StockKey = typeof STOCK_OPTIONS[number]["key"];

/* ─── FILTER SHEET ───────────────────────────────────────────────────── */
function FilterSheet({
  visible,
  categories,
  category, onCategory,
  sortBy, onSort,
  stockFilter, onStock,
  onClose,
}: {
  visible: boolean;
  categories: string[];
  category: string; onCategory: (c: string) => void;
  sortBy: SortKey; onSort: (s: SortKey) => void;
  stockFilter: StockKey; onStock: (s: StockKey) => void;
  onClose: () => void;
}) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const fs = useMemo(() => mkFs(C), [isDark]);
  const slideY = useRef(new Animated.Value(700)).current;

  /* staged values so we only apply on button press */
  const [tmpCat,   setTmpCat]   = useState(category);
  const [tmpSort,  setTmpSort]  = useState(sortBy);
  const [tmpStock, setTmpStock] = useState(stockFilter);

  useEffect(() => {
    if (visible) {
      setTmpCat(category); setTmpSort(sortBy); setTmpStock(stockFilter);
      Animated.spring(slideY, { toValue: 0, friction: 8, tension: 55, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideY, { toValue: 700, duration: 240, useNativeDriver: true }).start();
    }
  }, [visible]);

  const reset = () => { setTmpCat("Tout"); setTmpSort("default"); setTmpStock("all"); };

  const apply = () => {
    onCategory(tmpCat);
    onSort(tmpSort);
    onStock(tmpStock);
    onClose();
  };

  const hasFilters = tmpCat !== "Tout" || tmpSort !== "default" || tmpStock !== "all";

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={fs.overlay} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[fs.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={fs.handle} />

        {/* Header */}
        <View style={fs.header}>
          <Text style={fs.title}>Filtrer les produits</Text>
          {hasFilters && (
            <TouchableOpacity onPress={reset}>
              <Text style={fs.reset}>Réinitialiser</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Catégorie */}
          <Text style={fs.sectionTitle}>Catégorie</Text>
          <View style={fs.pillRow}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[fs.pill, tmpCat === cat && fs.pillActive]}
                onPress={() => setTmpCat(cat)}
                activeOpacity={0.85}
              >
                <Text style={[fs.pillText, tmpCat === cat && fs.pillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Disponibilité */}
          <Text style={fs.sectionTitle}>Disponibilité</Text>
          <View style={fs.optionList}>
            {STOCK_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.key} style={fs.optionRow} onPress={() => setTmpStock(opt.key)} activeOpacity={0.85}>
                <View style={[fs.radio, tmpStock === opt.key && fs.radioActive]}>
                  {tmpStock === opt.key && <View style={fs.radioDot} />}
                </View>
                <Text style={[fs.optionLabel, tmpStock === opt.key && fs.optionLabelActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Trier par */}
          <Text style={fs.sectionTitle}>Trier par</Text>
          <View style={fs.optionList}>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.key} style={fs.optionRow} onPress={() => setTmpSort(opt.key)} activeOpacity={0.85}>
                <View style={[fs.radio, tmpSort === opt.key && fs.radioActive]}>
                  {tmpSort === opt.key && <View style={fs.radioDot} />}
                </View>
                <Text style={[fs.optionLabel, tmpSort === opt.key && fs.optionLabelActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Appliquer */}
        <TouchableOpacity style={fs.applyBtn} onPress={apply} activeOpacity={0.9}>
          <LinearGradient colors={[C.blue, C.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={fs.applyGrad}>
            <Ionicons name="checkmark-circle-outline" size={20} color={C.white} />
            <Text style={fs.applyText}>Appliquer les filtres</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

/* ─── PRODUCT DETAIL SHEET ───────────────────────────────────────────── */
function ProductSheet({
  visible, product, index, onClose, onAdd, isFav, onFav,
}: {
  visible: boolean; product: any | null; index: number;
  onClose: () => void; onAdd: (item: CartItem) => void;
  isFav?: boolean; onFav?: (productId: number) => void;
}) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const sh = useMemo(() => mkSh(C), [isDark]);
  const slideY = useRef(new Animated.Value(700)).current;
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (visible) {
      setQty(1);
      Animated.spring(slideY, { toValue: 0, friction: 8, tension: 55, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideY, { toValue: 700, duration: 240, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!product) return null;

  const origPrice = parseFloat(product.price ?? 0);
  const price     = effectivePrice(product);
  const discount  = hasDiscount(product);
  const total     = (price * qty).toFixed(2);
  const maxQty    = product.qty ?? 99;
  const imgUri    = getImgUri(product, index);
  const hasStock  = (product.qty ?? 1) > 0;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={sh.overlay} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[sh.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={sh.handle} />

        {/* Image produit */}
        <View style={sh.imgArea}>
          <Image source={{ uri: imgUri }} style={sh.img} contentFit="contain" transition={200} />
        </View>

        <View style={sh.body}>
          {/* Nom + prix */}
          <View style={sh.nameRow}>
            <Text style={sh.name} numberOfLines={2}>{product.name}</Text>
            <TouchableOpacity onPress={() => onFav?.(product.productId)} style={sh.favBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={isFav ? "heart" : "heart-outline"} size={22} color={isFav ? "#EF4444" : C.textMut} />
            </TouchableOpacity>
            <View>
              {discount && (
                <Text style={sh.origPrice}>{origPrice.toFixed(2)} EC</Text>
              )}
              <View style={sh.priceBadge}>
                {discount && (
                  <Text style={sh.discountBadge}>-{Math.round(parseFloat(product.reduction))}%</Text>
                )}
                <Text style={sh.priceText}>{price.toFixed(2)} EC</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          {product.description ? (
            <Text style={sh.desc} numberOfLines={3}>{product.description}</Text>
          ) : null}

          {/* Disponibilité */}
          <View style={sh.statusRow}>
            <View style={[sh.statusDot, { backgroundColor: hasStock ? C.green : C.textMut }]} />
            <Text style={[sh.statusText, { color: hasStock ? C.green : C.textMut }]}>
              {hasStock ? "Disponible maintenant" : "Stock épuisé"}
            </Text>
          </View>

          {/* Quantité */}
          <View style={sh.qtyRow}>
            <Text style={sh.qtyLabel}>Quantité</Text>
            <View style={sh.qtyStepper}>
              <TouchableOpacity
                style={[sh.qtyBtn, qty <= 1 && { opacity: 0.35 }]}
                onPress={() => setQty(q => Math.max(1, q - 1))}
                disabled={qty <= 1}
              >
                <Ionicons name="remove" size={20} color={C.primary} />
              </TouchableOpacity>
              <Text style={sh.qtyVal}>{qty}</Text>
              <TouchableOpacity
                style={[sh.qtyBtn, qty >= maxQty && { opacity: 0.35 }]}
                onPress={() => setQty(q => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty}
              >
                <Ionicons name="add" size={20} color={C.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Total + bouton */}
          <View style={sh.footer}>
            <View>
              <Text style={sh.totalLabel}>Total</Text>
              <Text style={sh.totalVal}>{total} EC</Text>
            </View>
            <TouchableOpacity
              style={[sh.addBtn, !hasStock && { opacity: 0.38 }]}
              onPress={() => { onAdd({ productId: product.productId, name: product.name, unitPrice: price, qty, imageUrl: product.imageUrl ?? null }); onClose(); }}
              disabled={!hasStock}
              activeOpacity={0.88}
            >
              <LinearGradient colors={[C.blue, C.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={sh.addGrad}>
                <Ionicons name="cart-outline" size={18} color={C.white} />
                <Text style={sh.addText}>Ajouter au panier</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ─── RECOMMENDED CARD (portrait) ───────────────────────────────────── */
function RecommendedCard({ item, index, onPress, isFav, onFav }: {
  item: any; index: number; onPress: () => void;
  isFav?: boolean; onFav?: (productId: number) => void;
}) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const rc = useMemo(() => mkRc(C), [isDark]);
  const scale    = useRef(new Animated.Value(1)).current;
  const imgUri   = getImgUri(item, index);
  const price    = effectivePrice(item);
  const discount = hasDiscount(item);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      onPress={onPress}
    >
      <Animated.View style={[rc.card, { transform: [{ scale }] }]}>
        {discount && (
          <View style={rc.discBadge}>
            <Text style={rc.discBadgeText}>-{Math.round(parseFloat(item.reduction))}%</Text>
          </View>
        )}
        <TouchableOpacity style={rc.heartBtn} onPress={() => onFav?.(item.productId)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Ionicons name={isFav ? "heart" : "heart-outline"} size={16} color={isFav ? "#EF4444" : C.textMut} />
        </TouchableOpacity>
        <View style={rc.imgWrap}>
          <Image source={{ uri: imgUri }} style={rc.img} contentFit="contain" transition={200} />
        </View>
        <Text style={rc.name} numberOfLines={2}>{item.name}</Text>
        <View style={rc.footer}>
          <View style={rc.pricePill}>
            {discount && (
              <Text style={rc.origPrice}>{parseFloat(item.price ?? 0).toFixed(2)}</Text>
            )}
            <Text style={rc.priceText}>{price.toFixed(2)} EC</Text>
          </View>
          <TouchableOpacity style={rc.addBtn} onPress={onPress} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={C.white} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

/* ─── PRODUCT LIST ROW ───────────────────────────────────────────────── */
function ProductRowBase({ item, index, onPress, isFav, onFav }: {
  item: any; index: number; onPress: () => void;
  isFav?: boolean; onFav?: (productId: number) => void;
}) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const pr = useMemo(() => mkPr(C), [isDark]);
  const slideX = useRef(new Animated.Value(20)).current;
  const opac   = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideX, { toValue: 0, duration: 280, delay: Math.min(index * 40, 300), useNativeDriver: true }),
      Animated.timing(opac,   { toValue: 1, duration: 280, delay: Math.min(index * 40, 300), useNativeDriver: true }),
    ]).start();
  }, []);

  const imgUri    = getImgUri(item, index);
  const price     = effectivePrice(item);
  const origPrice = parseFloat(item.price ?? 0);
  const discount  = hasDiscount(item);
  const hasStock  = (item.qty ?? 1) > 0;
  const isLowStock= hasStock && (item.qty ?? 99) < 5;
  const dotColor  = hasStock ? (isLowStock ? C.amber : C.green) : C.textMut;
  const statusLbl = hasStock ? (isLowStock ? "Stock faible" : "Disponible") : "Épuisé";

  return (
    <Animated.View style={[pr.card, { opacity: opac, transform: [{ translateX: slideX }] }]}>
      <TouchableOpacity style={pr.inner} onPress={onPress} activeOpacity={0.88}>
        <View style={pr.imgWrap}>
          <Image source={{ uri: imgUri }} style={pr.img} contentFit="contain" transition={200} />
          <TouchableOpacity style={pr.heartBtn} onPress={() => onFav?.(item.productId)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name={isFav ? "heart" : "heart-outline"} size={13} color={isFav ? "#EF4444" : C.textMut} />
          </TouchableOpacity>
        </View>
        <View style={pr.info}>
          <Text style={pr.name} numberOfLines={2}>{item.name}</Text>
          <View style={pr.statusRow}>
            <View style={[pr.dot, { backgroundColor: dotColor }]} />
            <Text style={[pr.statusText, { color: dotColor }]}>{statusLbl}</Text>
            {discount && (
              <View style={pr.discBadge}>
                <Text style={pr.discBadgeText}>-{Math.round(parseFloat(item.reduction))}%</Text>
              </View>
            )}
          </View>
          {discount && (
            <Text style={pr.origPrice}>{origPrice.toFixed(2)} EC</Text>
          )}
          <Text style={pr.price}>{price.toFixed(2)} EC</Text>
        </View>
        <TouchableOpacity style={pr.addBtn} onPress={onPress} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color={C.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}
const ProductRow = memo(ProductRowBase);

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function SupermarcheDetail() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const { id }       = useLocalSearchParams<{ id: string }>();
  const router       = useRouter();
  const { unread }   = useUnreadNotifications();

  const [search,      setSearch]     = useState("");
  const [category,    setCategory]   = useState("Tout");
  const [sortBy,      setSortBy]     = useState<SortKey>("default");
  const [stockFilter, setStockFilter]= useState<StockKey>("all");
  const [cart,        setCart]       = useState<CartItem[]>([]);
  const [selected,    setSelected]   = useState<{ item: any; index: number } | null>(null);
  const [sheetOpen,   setSheetOpen]  = useState(false);
  const [filterOpen,  setFilterOpen] = useState(false);
  const [refreshing,  setRefreshing] = useState(false);
  const cartScale = useRef(new Animated.Value(1)).current;

  const { data, isLoading, refetch } = useGetAllProductsQuery(
    { companyId: id, paginate: false }, { skip: !id }
  );
  const { data: favIdsData } = useGetFavoriteIdsQuery(undefined);
  const [toggleFav] = useToggleFavoriteMutation();
  const favIds = useMemo(() => {
    const raw = favIdsData?.data ?? favIdsData ?? [];
    return new Set(Array.isArray(raw) ? raw.map((fid: any) => Number(fid)) : []);
  }, [favIdsData]);
  const handleFav = useCallback((productId: number) => { toggleFav(productId); }, [toggleFav]);

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then(raw => { if (raw) setCart(JSON.parse(raw)); });
  }, []);

  const handleAdd = useCallback((item: CartItem) => {
    setCart(prev => {
      const idx  = prev.findIndex(c => c.productId === item.productId);
      const next = idx >= 0
        ? prev.map((c, i) => i === idx ? { ...c, qty: c.qty + item.qty } : c)
        : [...prev, item];
      AsyncStorage.setItem(CART_KEY, JSON.stringify(next));
      return next;
    });
    Animated.sequence([
      Animated.spring(cartScale, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(cartScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  }, [cartScale]);

  const openProduct = useCallback((item: any, index: number) => {
    setSelected({ item, index });
    setSheetOpen(true);
  }, []);

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  const products: any[]  = data?.data || data || [];
  const companyName      = products[0]?.company?.name ?? "Supermarché";
  const cartCount        = cart.length;
  const cartTotal        = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  /* derive real categories from product data */
  const categoryList = useMemo(() => {
    const seen = new Set<string>();
    const names: string[] = ["Tout"];
    products.forEach(p => (p.categories ?? []).forEach((c: any) => {
      if (c.name && !seen.has(c.name)) { seen.add(c.name); names.push(c.name); }
    }));
    return names;
  }, [products]);

  /* best promo for hero banner */
  const bestPromo = useMemo(() => {
    return products
      .filter(p => parseFloat(p.reduction ?? 0) > 0)
      .sort((a, b) => parseFloat(b.reduction) - parseFloat(a.reduction))[0] ?? null;
  }, [products]);

  /* recommended products for the horizontal carousel */
  const recommended = useMemo(() => {
    return products.filter(p => p.isRecommended === true || p.isRecommended === 1);
  }, [products]);

  useEffect(() => {
    if (cart.length > 0) {
      AsyncStorage.setItem("bim_supermarche_cart_meta", JSON.stringify({ companyId: id, companyName }));
    } else {
      AsyncStorage.removeItem("bim_supermarche_cart_meta");
    }
  }, [cart.length, companyName, id]);

  const hasActiveFilters = category !== "Tout" || sortBy !== "default" || stockFilter !== "all";

  const filtered = useMemo(() => {
    let res = products.filter(p => {
      if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== "Tout") {
        if (!((p.categories ?? []) as any[]).some((c: any) => c.name === category)) return false;
      }
      if (stockFilter === "in_stock" && !((p.qty ?? 1) > 0)) return false;
      if (stockFilter === "out"      &&  (p.qty ?? 1) > 0)  return false;
      return true;
    });
    if (sortBy === "price_asc")  res = [...res].sort((a, b) => effectivePrice(a) - effectivePrice(b));
    if (sortBy === "price_desc") res = [...res].sort((a, b) => effectivePrice(b) - effectivePrice(a));
    if (sortBy === "name_az")    res = [...res].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    return res;
  }, [products, search, category, stockFilter, sortBy]);

  const ListHeader = () => (
    <View>
      {/* ── Search ── */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={18} color={C.textMut} />
          <TextInput
            style={s.searchInput}
            placeholder="Rechercher des produits..."
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
          <TouchableOpacity style={[s.filterBtn, hasActiveFilters && s.filterBtnActive]} onPress={() => setFilterOpen(true)}>
            <Ionicons name="options-outline" size={18} color={hasActiveFilters ? C.white : C.primary} />
            {hasActiveFilters && <View style={s.filterDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Hero ── */}
      <View style={s.hero}>
        <Image source={{ uri: HERO_IMAGE }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
        <LinearGradient
          colors={["rgba(0,0,0,0.06)", "rgba(0,0,0,0.22)"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.heroCard}>
          <View style={s.heroBadge}>
            <Text style={s.heroBadgeText}>Offre Spéciale</Text>
          </View>
          {bestPromo ? (
            <>
              <Text style={s.heroTitle}>-{Math.round(parseFloat(bestPromo.reduction))}% sur {bestPromo.name}</Text>
              <Text style={s.heroSub}>
                {parseFloat(bestPromo.price ?? 0).toFixed(2)} EC → {effectivePrice(bestPromo).toFixed(2)} EC
              </Text>
            </>
          ) : (
            <>
              <Text style={s.heroTitle}>Faites vos courses en ligne</Text>
              <Text style={s.heroSub}>Livraison rapide chez vous</Text>
            </>
          )}
        </View>
      </View>

      {/* ── Catégories ── */}
      <View style={s.catSection}>
        <View style={s.rowBetween}>
          <Text style={s.sectionTitle}>Catégories</Text>
          <TouchableOpacity><Text style={s.seeAll}>Voir tout</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
          {categoryList.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[s.catPill, category === cat && s.catPillActive]}
              onPress={() => setCategory(cat)}
              activeOpacity={0.85}
            >
              <Text style={[s.catText, category === cat && s.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Recommandés ── */}
      {recommended.length > 0 && (
        <View style={s.recSection}>
          <Text style={[s.sectionTitle, { paddingHorizontal: 16, marginBottom: 4 }]}>
            Produits Recommandés
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recScroll}>
            {recommended.map((item, i) => (
              <RecommendedCard
                key={item.productId}
                item={item}
                index={i}
                onPress={() => openProduct(item, i)}
                isFav={favIds.has(item.productId)}
                onFav={handleFav}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Titre liste ── */}
      <View style={s.allHeader}>
        <Text style={s.sectionTitle}>Tous les produits</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ── TOP BAR ── */}
      <SafeAreaView edges={["top"]} style={s.safeBar}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={s.topTitle}>BIM Supermarché</Text>
          <View style={{ flexDirection: "row", gap: 4 }}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/favorites" as any)}>
              <Ionicons name="heart-outline" size={22} color={C.text} />
              {favIds.size > 0 && <View style={s.badge}><Text style={s.badgeText}>{favIds.size > 99 ? "99+" : favIds.size}</Text></View>}
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/notification" as any)}>
              <Ionicons name="notifications-outline" size={22} color={C.text} />
              {unread > 0 && <View style={s.badge}><Text style={s.badgeText}>{unread > 99 ? "99+" : unread}</Text></View>}
            </TouchableOpacity>
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => router.push({ pathname: "/bim-supermarche/cart", params: { companyId: id, companyName } } as any)}
            >
              <Animated.View style={{ transform: [{ scale: cartScale }] }}>
                <Ionicons name="cart-outline" size={22} color={C.text} />
                {cartCount > 0 && <View style={s.badge}><Text style={s.badgeText}>{cartCount > 99 ? "99+" : cartCount}</Text></View>}
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* ── CONTENU ── */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.productId)}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 24 }}><NoData /></View>
          }
          contentContainerStyle={{ paddingBottom: cartCount > 0 ? 164 : 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />
          }
          renderItem={({ item, index }) => (
            <ProductRow item={item} index={index} onPress={() => openProduct(item, index)} isFav={favIds.has(item.productId)} onFav={handleFav} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      {/* ── FLOATING CART ── */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={s.floatCart}
          onPress={() => router.push({ pathname: "/bim-supermarche/cart", params: { companyId: id, companyName } } as any)}
          activeOpacity={0.9}
        >
          <LinearGradient colors={[C.blue, C.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.floatGrad}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name="bag-outline" size={22} color={C.white} />
              <Text style={s.floatText}>Voir le panier</Text>
            </View>
            <View style={s.floatDivider} />
            <Text style={s.floatTotal}>{cartTotal.toFixed(2)} EC</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* ── BOTTOM NAV ── */}
      <View style={s.bottomNav}>
        <TouchableOpacity style={s.navItem} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="home-outline" size={22} color={C.textMut} />
        </TouchableOpacity>
        <TouchableOpacity style={s.navItemActive} activeOpacity={0.85}>
          <Ionicons name="language-outline" size={22} color={C.white} />
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} activeOpacity={0.7}>
          <Ionicons name="qr-code-outline" size={22} color={C.textMut} />
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} activeOpacity={0.7}>
          <Ionicons name="stats-chart-outline" size={22} color={C.textMut} />
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => router.push("/profile" as any)} activeOpacity={0.7}>
          <Ionicons name="settings-outline" size={22} color={C.textMut} />
        </TouchableOpacity>
      </View>

      {/* ── PRODUCT DETAIL SHEET ── */}
      <ProductSheet
        visible={sheetOpen}
        product={selected?.item ?? null}
        index={selected?.index ?? 0}
        onClose={() => setSheetOpen(false)}
        onAdd={handleAdd}
        isFav={selected ? favIds.has(selected.item.productId) : false}
        onFav={handleFav}
      />

      {/* ── FILTER SHEET ── */}
      <FilterSheet
        visible={filterOpen}
        categories={categoryList}
        category={category}    onCategory={setCategory}
        sortBy={sortBy}        onSort={setSortBy}
        stockFilter={stockFilter} onStock={setStockFilter}
        onClose={() => setFilterOpen(false)}
      />
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  safeBar:  { backgroundColor: C.safeBarBg, borderBottomWidth: 1, borderBottomColor: C.border, elevation: 2, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  topBar:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  iconBtn:  { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", position: "relative" },
  topTitle: { fontFamily: "NexaBold", fontSize: 18, color: C.primary },
  badge:    { position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.error, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText:{ fontFamily: "NexaBold", fontSize: 9, color: C.white },

  searchWrap:  { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  searchBox:   { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surfLow, borderRadius: 20, paddingHorizontal: 14, height: 52 },
  searchInput: { flex: 1, fontFamily: "NexaLight", fontSize: 14, color: C.text },
  filterBtn:       { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,53,197,0.08)", alignItems: "center", justifyContent: "center" },
  filterBtnActive: { backgroundColor: C.primary },
  filterDot:       { position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: C.amber, borderWidth: 1.5, borderColor: C.white },

  hero:          { marginHorizontal: 16, marginTop: 16, height: 200, borderRadius: 32, overflow: "hidden" },
  heroCard:      { position: "absolute", bottom: 16, left: 16, backgroundColor: C.heroCardBg, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: C.heroCardBord },
  heroBadge:     { backgroundColor: C.primary, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 6 },
  heroBadgeText: { fontFamily: "NexaBold", fontSize: 10, color: C.white, letterSpacing: 1.2 },
  heroTitle:     { fontFamily: "NexaBold", fontSize: 18, color: C.text, marginBottom: 3 },
  heroSub:       { fontFamily: "NexaLight", fontSize: 12, color: C.textSec },

  catSection: { paddingTop: 20 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle:{ fontFamily: "NexaBold", fontSize: 18, color: C.text },
  seeAll:     { fontFamily: "NexaBold", fontSize: 13, color: C.primary },
  catScroll:  { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  catPill:    { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99, backgroundColor: C.card, borderWidth: 1, borderColor: C.catPillBord, elevation: 1, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  catPillActive: { backgroundColor: C.primary, borderColor: C.primary },
  catText:    { fontFamily: "NexaBold", fontSize: 13, color: C.textSec },
  catTextActive: { color: C.white },

  recSection: { paddingTop: 20 },
  recScroll:  { paddingHorizontal: 16, paddingVertical: 10, gap: 14 },

  allHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },

  floatCart:    { position: "absolute", bottom: 80, left: 16, right: 16, borderRadius: 24, overflow: "hidden", elevation: 14, shadowColor: C.blue, shadowOpacity: 0.38, shadowRadius: 20, shadowOffset: { width: 0, height: 6 } },
  floatGrad:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, height: 62 },
  floatText:    { fontFamily: "NexaBold", fontSize: 16, color: C.white },
  floatDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.22)" },
  floatTotal:   { fontFamily: "NexaBold", fontSize: 16, color: C.white },

  bottomNav:     { position: "absolute", bottom: 0, left: 0, right: 0, height: 72, paddingBottom: 8, backgroundColor: C.bottomNavBg, borderTopWidth: 1, borderTopColor: C.border, flexDirection: "row", alignItems: "center", justifyContent: "space-around", elevation: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: -3 } },
  navItem:       { flex: 1, alignItems: "center", justifyContent: "center", height: 48 },
  navItemActive: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
}); }

/* ─── RECOMMENDED CARD STYLES ─────────────────────────────────────────── */
function mkRc(C: typeof LIGHT) { return StyleSheet.create({
  card:        { width: 172, backgroundColor: C.card, borderRadius: 32, padding: 14, elevation: 3, shadowColor: "rgba(0,71,255,0.06)", shadowOpacity: 1, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
  imgWrap:     { height: 140, backgroundColor: C.surfLow, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 12, padding: 12 },
  img:         { width: "100%", height: "100%" },
  name:        { fontFamily: "NexaBold", fontSize: 14, color: C.text, marginBottom: 8 },
  footer:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pricePill:   { backgroundColor: C.surfLow, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(0,53,197,0.12)" },
  priceText:   { fontFamily: "NexaBold", fontSize: 13, color: C.primary },
  origPrice:   { fontFamily: "NexaLight", fontSize: 10, color: C.textMut, textDecorationLine: "line-through", marginBottom: 1 },
  addBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  discBadge:   { position: "absolute", top: 10, right: 10, backgroundColor: C.green, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, zIndex: 1 },
  discBadgeText:{ fontFamily: "NexaBold", fontSize: 10, color: C.white },
  heartBtn:    { position: "absolute", top: 10, left: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: C.safeBarBg, alignItems: "center", justifyContent: "center", zIndex: 1 },
}); }

/* ─── PRODUCT ROW STYLES ─────────────────────────────────────────────── */
function mkPr(C: typeof LIGHT) { return StyleSheet.create({
  card:         { marginHorizontal: 16, backgroundColor: C.card, borderRadius: 24, overflow: "hidden", elevation: 1, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  inner:        { flexDirection: "row", alignItems: "center", padding: 14, gap: 14 },
  imgWrap:      { width: 76, height: 76, borderRadius: 16, backgroundColor: C.surfLow, alignItems: "center", justifyContent: "center", padding: 8 },
  img:          { width: "100%", height: "100%" },
  info:         { flex: 1, gap: 4 },
  name:         { fontFamily: "NexaBold", fontSize: 15, color: C.text },
  statusRow:    { flexDirection: "row", alignItems: "center", gap: 5 },
  dot:          { width: 7, height: 7, borderRadius: 3.5 },
  statusText:   { fontFamily: "NexaBold", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  price:        { fontFamily: "NexaBold", fontSize: 15, color: C.primary },
  origPrice:    { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, textDecorationLine: "line-through" },
  addBtn:       { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: "rgba(0,53,197,0.22)", alignItems: "center", justifyContent: "center" },
  discBadge:    { backgroundColor: C.green, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  discBadgeText:{ fontFamily: "NexaBold", fontSize: 9, color: C.white },
  heartBtn:     { position: "absolute", bottom: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: C.safeBarBg, alignItems: "center", justifyContent: "center" },
}); }

/* ─── PRODUCT SHEET STYLES ───────────────────────────────────────────── */
function mkSh(C: typeof LIGHT) { return StyleSheet.create({
  overlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.42)" },
  sheet:       { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.card, borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingBottom: 32, elevation: 20, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -4 } },
  handle:      { width: 44, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.10)", alignSelf: "center", marginTop: 14 },
  imgArea:     { height: 200, marginHorizontal: 24, marginTop: 16, backgroundColor: C.surfLow, borderRadius: 24, alignItems: "center", justifyContent: "center", padding: 20 },
  img:         { width: "100%", height: "100%" },
  body:        { paddingHorizontal: 24, paddingTop: 20, gap: 14 },
  nameRow:     { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  name:        { flex: 1, fontFamily: "NexaBold", fontSize: 20, color: C.text },
  priceBadge:   { backgroundColor: "rgba(0,53,197,0.07)", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "rgba(0,53,197,0.12)", alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8 },
  priceText:    { fontFamily: "NexaBold", fontSize: 17, color: C.primary },
  origPrice:    { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, textDecorationLine: "line-through", marginBottom: 3, textAlign: "right" },
  discountBadge:{ backgroundColor: C.green, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, fontFamily: "NexaBold", fontSize: 12, color: C.white },
  desc:        { fontFamily: "NexaLight", fontSize: 13, color: C.textSec, lineHeight: 19 },
  statusRow:   { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot:   { width: 8, height: 8, borderRadius: 4 },
  statusText:  { fontFamily: "NexaBold", fontSize: 12 },
  qtyRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  qtyLabel:    { fontFamily: "NexaBold", fontSize: 15, color: C.text },
  qtyStepper:  { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surfLow, borderRadius: 99, paddingHorizontal: 6, paddingVertical: 4 },
  qtyBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: "center", justifyContent: "center", elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  qtyVal:      { fontFamily: "NexaBold", fontSize: 22, color: C.text, minWidth: 30, textAlign: "center" },
  footer:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  totalLabel:  { fontFamily: "NexaLight", fontSize: 12, color: C.textMut, marginBottom: 2 },
  totalVal:    { fontFamily: "NexaBold", fontSize: 24, color: C.primary },
  addBtn:      { flex: 1, marginLeft: 20, borderRadius: 20, overflow: "hidden" },
  addGrad:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  addText:     { fontFamily: "NexaBold", fontSize: 15, color: C.white },
  favBtn:      { padding: 4 },
}); }

/* ─── FILTER SHEET STYLES ─────────────────────────────────────────────── */
function mkFs(C: typeof LIGHT) { return StyleSheet.create({
  overlay:         { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.42)" },
  sheet:           { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.card, borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingBottom: 32, elevation: 20, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -4 }, maxHeight: "82%" },
  handle:          { width: 44, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.10)", alignSelf: "center", marginTop: 14, marginBottom: 4 },
  header:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 16 },
  title:           { fontFamily: "NexaBold", fontSize: 20, color: C.text },
  reset:           { fontFamily: "NexaBold", fontSize: 13, color: C.primary },
  sectionTitle:    { fontFamily: "NexaBold", fontSize: 14, color: C.textMut, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 24, marginBottom: 12, marginTop: 20 },
  pillRow:         { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 24 },
  pill:            { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 99, backgroundColor: C.surfLow, borderWidth: 1, borderColor: "transparent" },
  pillActive:      { backgroundColor: "rgba(0,53,197,0.08)", borderColor: C.primary },
  pillText:        { fontFamily: "NexaBold", fontSize: 13, color: C.textSec },
  pillTextActive:  { color: C.primary },
  optionList:      { paddingHorizontal: 24, gap: 14 },
  optionRow:       { flexDirection: "row", alignItems: "center", gap: 14 },
  radio:           { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  radioActive:     { borderColor: C.primary },
  radioDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
  optionLabel:     { fontFamily: "NexaLight", fontSize: 15, color: C.textSec },
  optionLabelActive: { fontFamily: "NexaBold", color: C.text },
  applyBtn:        { marginHorizontal: 24, marginTop: 20, borderRadius: 56, overflow: "hidden", elevation: 4, shadowColor: C.blue, shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  applyGrad:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18 },
  applyText:       { fontFamily: "NexaBold", fontSize: 16, color: C.white },
}); }
