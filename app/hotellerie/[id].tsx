/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Image } from "expo-image";
import {
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
import { useGetAllProductsQuery } from "@/services/productServices";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import NoData from "@/components/ui/noData";
import { API_URL_BASE } from "@/constants/api";
import { useAppTheme } from "@/app/_layout";

const { width: W, height: H } = Dimensions.get("window");

/* ─── PALETTE ────────────────────────────────────────────────────────── */
const LIGHT = {
  white:      "#FFFFFF",
  bg:         "#FAFAFA",
  surface:    "#FFFFFF",
  surfLow:    "#F4F5F7",
  text:       "#1A1C1C",
  textSec:    "#555770",
  textMut:    "#9496A8",
  border:     "rgba(0,0,0,0.07)",
  gold:       "#C9A84C",
  goldLt:     "#F0D484",
  blue:       "#0035C5",
  blueDark:   "#001A80",
  error:      "#EF4444",
  green:      "#10B981",
  card:       "#FFFFFF",
  perNightBg: "rgba(0,53,197,0.07)",
};
const DARK: typeof LIGHT = {
  white:      "#FFFFFF",
  bg:         "#0B1220",
  surface:    "#1A2540",
  surfLow:    "#0F1A2E",
  text:       "#EAF0FF",
  textSec:    "#A3B4D0",
  textMut:    "#6B7A99",
  border:     "rgba(31,42,68,0.80)",
  gold:       "#C9A84C",
  goldLt:     "#F0D484",
  blue:       "#4D8DFF",
  blueDark:   "#2A5FCC",
  error:      "#DC2626",
  green:      "#059669",
  card:       "#1A2540",
  perNightBg: "rgba(77,141,255,0.12)",
};

/* ─── HOTEL ROOM FALLBACK IMAGES ─────────────────────────────────────── */
const FALLBACK = [
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
  "https://images.unsplash.com/photo-1540541338537-71acf588f9c5?w=800&q=80",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDQ8nSucgb7yIGmUn1cusxX94lbpaxYyprHKjsWtHr1-PmNuB2pITmGLL7hKeWazbuBIcmzH5Uqvlr2app0EUk_8yThBZZPyU7UQ6r9uy3Hhg_ouIB_BZjJ4XOAoS8cfQI1i1gnHGjIk2z3ZXHMLbCVLqXm6WV5AgVKArXFXFX7sFgRxpHpvn2IrbjZWpdrJCltiV9vkcaZUa7LfZxfk-ALEdScpBwXQmkODBs_aC-kwthBlFbRJgRmVJWtfq-Iw37VhfhSCFYZ_1w",
];

function getImgUri(item: any, index: number): string {
  if (item.imageUrl)
    return item.imageUrl.startsWith("http") ? item.imageUrl : `${API_URL_BASE}${item.imageUrl}`;
  return FALLBACK[index % FALLBACK.length];
}

function getStars(item: any): number {
  return item.stars ?? ((item.productId % 3) + 3);
}

/* ─── STARS ──────────────────────────────────────────────────────────── */
function Stars({ count, size = 12 }: { count: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons key={i} name={i < count ? "star" : "star-outline"} size={size}
          color={i < count ? LIGHT.gold : "rgba(201,168,76,0.30)"} />
      ))}
    </View>
  );
}

/* ─── CHIP ───────────────────────────────────────────────────────────── */
function Chip({ icon, label }: { icon: string; label: string }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const ch = useMemo(() => mkCh(C), [isDark]);
  return (
    <View style={ch.wrap}>
      <Ionicons name={icon as any} size={11} color={C.textSec} />
      <Text style={ch.text}>{label}</Text>
    </View>
  );
}

/* ─── DETAIL SHEET ───────────────────────────────────────────────────── */
function DetailSheet({
  visible, item, index, onClose, onPay,
}: {
  visible: boolean; item: any | null; index: number;
  onClose: () => void; onPay: () => void;
}) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const ds = useMemo(() => mkDs(C), [isDark]);
  const slideY = useRef(new Animated.Value(H)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideY, { toValue: 0, friction: 8, tension: 52, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideY, { toValue: H, duration: 260, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!item) return null;

  const imgUri   = getImgUri(item, index);
  const stars    = getStars(item);
  const price    = parseFloat(item.price ?? 0);
  const hasStock = (item.qty ?? 1) > 0;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Overlay */}
      <TouchableOpacity style={ds.overlay} activeOpacity={1} onPress={onClose} />

      <Animated.View style={[ds.sheet, { transform: [{ translateY: slideY }] }]}>
        {/* Handle */}
        <View style={ds.handle} />

        {/* Image */}
        <View style={ds.imgWrap}>
          <Image source={{ uri: imgUri }} style={ds.img} contentFit="cover" transition={300} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.50)"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0, y: 1 }}
          />
          {/* Stars on image */}
          <View style={ds.imgStars}>
            <Stars count={stars} size={13} />
            <Text style={ds.imgStarsLabel}>{stars} étoile{stars > 1 ? "s" : ""}</Text>
          </View>
          {/* Close */}
          <TouchableOpacity style={ds.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={18} color={C.white} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ds.body}>
          {/* Name + location */}
          <Text style={ds.name}>{item.name}</Text>
          {item.company?.name ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
              <Ionicons name="location-outline" size={13} color={C.textMut} />
              <Text style={ds.location}>{item.company.name}</Text>
            </View>
          ) : null}

          {/* Description */}
          {item.description ? (
            <Text style={ds.desc}>{item.description}</Text>
          ) : null}

          {/* Amenities */}
          <Text style={ds.sectionTitle}>Services inclus</Text>
          <View style={ds.chips}>
            <Chip icon="wifi-outline"         label="Wi-Fi gratuit"  />
            <Chip icon="restaurant-outline"   label="Restaurant"     />
            <Chip icon="car-outline"          label="Parking"        />
            <Chip icon="snow-outline"         label="Climatisation"  />
            <Chip icon="tv-outline"           label="Smart TV"       />
            <Chip icon="fitness-outline"      label="Salle de sport" />
          </View>

          <View style={ds.divider} />

          {/* Price */}
          <View style={ds.priceRow}>
            <View>
              <Text style={ds.fromLabel}>Prix par nuit</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                <Text style={ds.price}>{price.toFixed(2)}</Text>
                <Text style={ds.priceSuffix}>EC</Text>
              </View>
            </View>
            <View style={ds.perNightBadge}>
              <Ionicons name="moon-outline" size={13} color={C.blue} />
              <Text style={ds.perNightText}>/ nuit</Text>
            </View>
          </View>
        </ScrollView>

        {/* Pay button */}
        <View style={ds.footer}>
          <TouchableOpacity onPress={onPay} activeOpacity={0.88} disabled={!hasStock} style={{ flex: 1 }}>
            <View style={[ds.payBtn, !hasStock && { opacity: 0.38 }]}>
              <Ionicons name="card-outline" size={18} color={C.white} />
              <Text style={ds.payBtnText}>
                {hasStock ? `Payer ${price.toFixed(2)} EC` : "Complet"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ─── HOTEL CARD ─────────────────────────────────────────────────────── */
function HotelCard({ item, index, onPress }: { item: any; index: number; onPress: () => void }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const cd = useMemo(() => mkCd(C), [isDark]);
  const scale  = useRef(new Animated.Value(1)).current;
  const slideY = useRef(new Animated.Value(28)).current;
  const opac   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 400, delay: Math.min(index * 80, 400), useNativeDriver: true }),
      Animated.timing(opac,   { toValue: 1, duration: 400, delay: Math.min(index * 80, 400), useNativeDriver: true }),
    ]).start();
  }, []);

  const onIn  = () => Animated.spring(scale, { toValue: 0.975, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,     useNativeDriver: true }).start();

  const imgUri   = getImgUri(item, index);
  const stars    = getStars(item);
  const price    = parseFloat(item.price ?? 0);
  const hasStock = (item.qty ?? 1) > 0;

  return (
    <Animated.View style={[cd.card, { opacity: opac, transform: [{ translateY: slideY }, { scale }] }]}>
      <TouchableOpacity activeOpacity={1} onPressIn={onIn} onPressOut={onOut} onPress={onPress}>

        {/* Image */}
        <View style={cd.imgWrap}>
          <Image source={{ uri: imgUri }} style={cd.img} contentFit="cover" transition={300} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.48)"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.45 }}
            end={{ x: 0, y: 1 }}
          />

          {/* Stars */}
          <View style={cd.starsBadge}>
            <Stars count={stars} size={11} />
          </View>

          {/* Complet */}
          {!hasStock && (
            <View style={cd.fullBadge}>
              <Text style={cd.fullText}>Complet</Text>
            </View>
          )}

          {/* Name overlay */}
          <View style={cd.nameWrap}>
            <Text style={cd.nameText} numberOfLines={1}>{item.name}</Text>
            {item.company?.name ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.80)" />
                <Text style={cd.locationText}>{item.company.name}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Body */}
        <View style={cd.body}>
          {item.description ? (
            <Text style={cd.desc} numberOfLines={2}>{item.description}</Text>
          ) : null}

          <View style={cd.chips}>
            <Chip icon="wifi-outline"         label="Wi-Fi"      />
            <Chip icon="restaurant-outline"   label="Restaurant" />
            <Chip icon="car-outline"          label="Parking"    />
            <Chip icon="snow-outline"         label="Climatisé"  />
          </View>

          <View style={cd.divider} />

          {/* Footer */}
          <View style={cd.footer}>
            <View>
              <Text style={cd.fromLabel}>À partir de</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                <Text style={cd.price}>{price.toFixed(2)}</Text>
                <Text style={cd.priceSuffix}>EC / nuit</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onPress} activeOpacity={0.88} disabled={!hasStock}>
              <View style={[cd.btn, !hasStock && { opacity: 0.38 }]}>
                <Ionicons name="eye-outline" size={14} color={C.white} />
                <Text style={cd.btnText}>Voir</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

      </TouchableOpacity>
    </Animated.View>
  );
}

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function HotelsList() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router     = useRouter();
  const { id }     = useLocalSearchParams<{ id: string }>();
  const { unread } = useUnreadNotifications();

  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState("");
  const [dataList,   setDataList]   = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selected,   setSelected]   = useState<{ item: any; index: number } | null>(null);
  const [sheetOpen,  setSheetOpen]  = useState(false);

  const { data, isFetching, refetch } = useGetAllProductsQuery({
    page, pageSize: 10, search, paginate: true, companyId: id,
  });

  useEffect(() => {
    if (data?.data) {
      if (page === 1) setDataList(data.data);
      else setDataList(prev => [...prev, ...data.data]);
    }
  }, [data, page]);

  const loadMore     = () => {
    if (data?.totalPages && page < data.totalPages && !isFetching) setPage(p => p + 1);
  };
  const onRefresh    = async () => { setRefreshing(true); setPage(1); await refetch(); setRefreshing(false); };
  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const clearSearch  = useCallback(() => { setSearch(""); setPage(1); }, []);

  const openDetail = useCallback((item: any, index: number) => {
    setSelected({ item, index });
    setSheetOpen(true);
  }, []);

  const handlePay = useCallback(() => {
    if (!selected) return;
    setSheetOpen(false);
    router.push(`/payment?productId=${selected.item.productId}&companyId=${id}` as any);
  }, [selected, id, router]);

  const companyName = dataList[0]?.company?.name ?? "Hôtellerie";

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.surface} />

      {/* ── HEADER full white ── */}
      <SafeAreaView edges={["top"]} style={s.headerWrap}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>

          <View style={s.titleBlock}>
            <View style={s.titleRow}>
              <View style={s.goldDot} />
              <Text style={s.title}>BIM Hôtellerie</Text>
            </View>
            <Text style={s.subtitle}>
              {isFetching && dataList.length === 0
                ? "Chargement…"
                : `${dataList.length} établissement${dataList.length !== 1 ? "s" : ""}`}
            </Text>
          </View>

          <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/notification" as any)}>
            <Ionicons name="notifications-outline" size={22} color={C.text} />
            {unread > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{unread > 99 ? "99+" : unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={s.premiumRow}>
          <Ionicons name="star" size={11} color={C.gold} />
          <Text style={s.premiumText}>Séjournez dans les meilleurs établissements</Text>
        </View>

        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={16} color={C.textMut} />
          <TextInput
            style={s.searchInput}
            placeholder="Rechercher un hôtel, une chambre…"
            placeholderTextColor={C.textMut}
            value={search}
            onChangeText={handleSearch}
            autoCorrect={false}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={16} color={C.textMut} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* ── LIST ── */}
      {dataList.length === 0 && !isFetching ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <NoData />
          <Text style={{ fontFamily: "NexaBold", color: C.text, marginTop: 12, fontSize: 15 }}>
            Aucun établissement trouvé
          </Text>
          <Text style={{ fontFamily: "NexaLight", color: C.textMut, fontSize: 13, marginTop: 4 }}>
            Essayez une autre recherche
          </Text>
        </View>
      ) : (
        <FlatList
          data={dataList}
          keyExtractor={item => `${item.productId}`}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} colors={[C.gold]} />
          }
          ListFooterComponent={
            isFetching ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <Ionicons name="ellipsis-horizontal" size={24} color={C.textMut} />
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <HotelCard
              item={item}
              index={index}
              onPress={() => openDetail(item, index)}
            />
          )}
        />
      )}

      {/* ── DETAIL SHEET ── */}
      <DetailSheet
        visible={sheetOpen}
        item={selected?.item ?? null}
        index={selected?.index ?? 0}
        onClose={() => setSheetOpen(false)}
        onPay={handlePay}
      />
    </View>
  );
}

/* ─── HEADER STYLES ──────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  headerWrap:  { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  topBar:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 12 },
  iconBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surfLow, alignItems: "center", justifyContent: "center" },
  badge:       { position: "absolute", top: 2, right: 2, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: C.error, alignItems: "center", justifyContent: "center", paddingHorizontal: 2 },
  badgeText:   { fontFamily: "NexaBold", fontSize: 8, color: C.white },
  titleBlock:  { flex: 1 },
  titleRow:    { flexDirection: "row", alignItems: "center", gap: 8 },
  goldDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold },
  title:       { fontFamily: "NexaBold", fontSize: 19, color: C.text },
  subtitle:    { fontFamily: "NexaLight", fontSize: 12, color: C.textMut, marginTop: 2 },
  premiumRow:  { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingBottom: 8, paddingTop: 4 },
  premiumText: { fontFamily: "NexaLight", fontSize: 12, color: C.textMut },
  searchWrap:  { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginBottom: 14, marginTop: 6, backgroundColor: C.surfLow, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput: { flex: 1, fontFamily: "NexaLight", fontSize: 13, color: C.text },
}); }

/* ─── CARD STYLES ─────────────────────────────────────────────────────── */
function mkCd(C: typeof LIGHT) { return StyleSheet.create({
  card:        { backgroundColor: C.card, borderRadius: 28, marginBottom: 18, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  imgWrap:     { width: "100%", height: 210 },
  img:         { width: "100%", height: "100%" },
  starsBadge:  { position: "absolute", top: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.88)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  fullBadge:   { position: "absolute", top: 12, right: 12, backgroundColor: "rgba(239,68,68,0.88)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  fullText:    { fontFamily: "NexaBold", fontSize: 10, color: C.white },
  nameWrap:    { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 14 },
  nameText:    { fontFamily: "NexaBold", fontSize: 20, color: C.white },
  locationText:{ fontFamily: "NexaLight", fontSize: 12, color: "rgba(255,255,255,0.82)" },
  body:        { padding: 16, gap: 10 },
  desc:        { fontFamily: "NexaLight", fontSize: 13, color: C.textSec, lineHeight: 19 },
  chips:       { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  divider:     { height: 1, backgroundColor: C.border },
  footer:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fromLabel:   { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, marginBottom: 2 },
  price:       { fontFamily: "NexaBold", fontSize: 22, color: C.text },
  priceSuffix: { fontFamily: "NexaLight", fontSize: 12, color: C.textMut },
  btn:         { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: C.blue, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 18 },
  btnText:     { fontFamily: "NexaBold", fontSize: 14, color: C.white },
}); }

/* ─── DETAIL SHEET STYLES ─────────────────────────────────────────────── */
function mkDs(C: typeof LIGHT) { return StyleSheet.create({
  overlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet:         { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.card, borderTopLeftRadius: 36, borderTopRightRadius: 36, maxHeight: H * 0.90, elevation: 24, shadowColor: "#000", shadowOpacity: 0.20, shadowRadius: 28, shadowOffset: { width: 0, height: -4 } },
  handle:        { width: 44, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.10)", alignSelf: "center", marginTop: 14, marginBottom: 0 },

  imgWrap:       { width: "100%", height: 220, marginTop: 10, overflow: "hidden" },
  img:           { width: "100%", height: "100%" },
  imgStars:      { position: "absolute", top: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.88)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  imgStarsLabel: { fontFamily: "NexaBold", fontSize: 10, color: C.gold },
  closeBtn:      { position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.40)", alignItems: "center", justifyContent: "center" },

  body:          { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  name:          { fontFamily: "NexaBold", fontSize: 22, color: C.text },
  location:      { fontFamily: "NexaLight", fontSize: 13, color: C.textMut },
  desc:          { fontFamily: "NexaLight", fontSize: 14, color: C.textSec, lineHeight: 21, marginTop: 12 },

  sectionTitle:  { fontFamily: "NexaBold", fontSize: 13, color: C.text, marginTop: 16, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 },
  chips:         { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  divider:       { height: 1, backgroundColor: C.border, marginVertical: 16 },

  priceRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fromLabel:     { fontFamily: "NexaLight", fontSize: 12, color: C.textMut, marginBottom: 3 },
  price:         { fontFamily: "NexaBold", fontSize: 28, color: C.text },
  priceSuffix:   { fontFamily: "NexaLight", fontSize: 14, color: C.textMut },
  perNightBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.perNightBg, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  perNightText:  { fontFamily: "NexaBold", fontSize: 13, color: C.blue },

  footer:        { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: C.border },
  payBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: C.blue, borderRadius: 22, paddingVertical: 17 },
  payBtnText:    { fontFamily: "NexaBold", fontSize: 17, color: C.white, letterSpacing: 0.3 },
}); }

/* ─── CHIP STYLES ─────────────────────────────────────────────────────── */
function mkCh(C: typeof LIGHT) { return StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.surfLow, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  text: { fontFamily: "NexaLight", fontSize: 10, color: C.textSec },
}); }
