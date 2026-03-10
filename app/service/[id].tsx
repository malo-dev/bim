import NoData from "@/components/ui/noData";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Polygon,
  ClipPath,
  Rect,
} from "react-native-svg";

/* ─── THEME ──────────────────────────────────────────────────────────── */
const C = {
  primary:   "#0353CC",
  violet:    "#3906C7",
  deep:      "#302E99",
  accent:    "#4D96FF",
  gold:      "#F59E0B",
  goldLight: "#FDE68A",
  white:     "#FFFFFF",
  text:      "#0D1B3E",
  muted:     "#7B8DB0",
  border:    "rgba(3,83,204,0.10)",
  inputBg:   "rgba(3,83,204,0.06)",
  red:       "#EF4444",
  green:     "#22C55E",
};

const Colors = {
  light: {
    background:    "#F0F4FF",
    card:          "#FFFFFF",
    cardAlt:       "#FAFBFF",
    text:          "#0D1B3E",
    textSecondary: "#7B8DB0",
    border:        "rgba(3,83,204,0.10)",
    inputBg:       "#FFFFFF",
    ratingBg:      "#FAFBFF",
    commentBg:     "#FFFFFF",
    modalBg:       "#F4F6FB",
    headerGrad:    [C.deep, C.primary] as [string, string],
    shadow:        "#000",
    countText:     "rgba(255,255,255,0.85)",
  },
  dark: {
    background:    "#0A0F1E",
    card:          "#111827",
    cardAlt:       "#1A2235",
    text:          "#E2E8F0",
    textSecondary: "#64748B",
    border:        "rgba(255,255,255,0.08)",
    inputBg:       "#111827",
    ratingBg:      "#1E2A3A",
    commentBg:     "#1E2A3A",
    modalBg:       "#0F172A",
    headerGrad:    ["#060B18", "#0D1B3E"] as [string, string],
    shadow:        "#000",
    countText:     "rgba(255,255,255,0.55)",
  },
};

function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

/* ─── TYPES ──────────────────────────────────────────────────────────── */
interface RatingData {
  average: number;
  count: number;
  userRating: number | null;
}

/* ─── RATING STORE (mémoire) ─────────────────────────────────────────── */
const ratingsStore: Record<string, RatingData> = {};

function getRating(companyId: string): RatingData {
  return ratingsStore[companyId] ?? { average: 0, count: 0, userRating: null };
}

function submitRating(companyId: string, stars: number, prev: RatingData): RatingData {
  let newCount = prev.count, newAverage = prev.average;
  if (prev.userRating !== null) {
    newAverage = (prev.average * prev.count - prev.userRating + stars) / prev.count;
  } else {
    newCount   = prev.count + 1;
    newAverage = (prev.average * prev.count + stars) / newCount;
  }
  const next = { average: newAverage, count: newCount, userRating: stars };
  ratingsStore[companyId] = next;
  return next;
}

/* ─── STAR SVG ───────────────────────────────────────────────────────── */
function StarSvg({ size = 20, filled = 1, color = C.gold }: { size?: number; filled?: number; color?: string }) {
  const id = `clip_${size}_${Math.round(filled * 100)}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <ClipPath id={id}>
          <Rect x={0} y={0} width={24 * filled} height={24} />
        </ClipPath>
      </Defs>
      <Polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill="none" stroke={color} strokeWidth={1.5} opacity={0.3}
      />
      <Polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill={color} clipPath={`url(#${id})`}
      />
    </Svg>
  );
}

/* ─── STARS DISPLAY ──────────────────────────────────────────────────── */
function StarsDisplay({ value, size = 14, showValue = true, count, textColor }: {
  value: number; size?: number; showValue?: boolean; count?: number; textColor?: string;
}) {
  return (
    <View style={sd.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarSvg key={i} size={size} filled={Math.min(1, Math.max(0, value - (i - 1)))} />
      ))}
      {showValue && (
        <Text style={[sd.value, { fontSize: size - 2, color: textColor || C.text }]}>
          {value > 0 ? value.toFixed(1) : "—"}
          {count !== undefined && count > 0 && <Text style={[sd.count, { color: C.muted }]}> ({count})</Text>}
        </Text>
      )}
    </View>
  );
}

/* ─── RATING MODAL ───────────────────────────────────────────────────── */
type RatingModalProps = {
  visible: boolean; companyName: string; current: RatingData;
  onSubmit: (stars: number, comment: string) => void; onClose: () => void;
  isDark: boolean;
};

function RatingModal({ visible, companyName, current, onSubmit, onClose, isDark }: RatingModalProps) {
  const t          = isDark ? Colors.dark : Colors.light;
  const [hovered,  setHovered]  = useState(0);
  const [selected, setSelected] = useState(current.userRating ?? 0);
  const [comment,  setComment]  = useState("");
  const scaleAnims = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(1))).current;

  const presseStar = (star: number) => {
    setSelected(star);
    Animated.sequence([
      Animated.spring(scaleAnims[star - 1], { toValue: 1.4, useNativeDriver: true }),
      Animated.spring(scaleAnims[star - 1], { toValue: 1,   useNativeDriver: true }),
    ]).start();
  };

  const LABELS = ["", "Mauvais 😕", "Passable 😐", "Bien 🙂", "Très bien 😊", "Excellent 🤩"];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={rm.overlay}>
        <View style={[rm.sheet, { backgroundColor: t.modalBg }]}>
          <View style={[rm.handle, { backgroundColor: t.border }]} />

          {/* Header */}
          <LinearGradient
            colors={t.headerGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={rm.header}
          >
            <View style={rm.headerRow}>
              <View style={rm.headerIcon}>
                <Ionicons name="star" size={18} color={C.gold} />
              </View>
              <Text style={rm.headerTitle}>Noter cette entreprise</Text>
              <TouchableOpacity style={rm.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={16} color={C.white} />
              </TouchableOpacity>
            </View>
            <Text style={rm.companyName} numberOfLines={1}>{companyName}</Text>
          </LinearGradient>

          {/* Note actuelle */}
          {current.count > 0 && (
            <View style={[rm.currentRating, { borderBottomColor: t.border }]}>
              <StarsDisplay value={current.average} size={14} count={current.count} textColor={t.text} />
              <Text style={[rm.currentLabel, { color: t.textSecondary }]}>Note actuelle</Text>
            </View>
          )}

          {/* Étoiles interactives */}
          <View style={rm.starsSection}>
            <Text style={[rm.starsHint, { color: t.textSecondary }]}>
              {selected > 0 ? LABELS[selected] : "Touchez une étoile pour noter"}
            </Text>
            <View style={rm.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => presseStar(star)}
                  onPressIn={() => setHovered(star)}
                  onPressOut={() => setHovered(0)}
                  activeOpacity={0.85}
                >
                  <Animated.View style={{ transform: [{ scale: scaleAnims[star - 1] }] }}>
                    <StarSvg size={42} filled={star <= (hovered || selected) ? 1 : 0} color={C.gold} />
                  </Animated.View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Commentaire */}
          <View style={[rm.commentWrap, { backgroundColor: t.commentBg, borderColor: t.border }]}>
            <View style={[rm.commentIcon, { backgroundColor: isDark ? "rgba(3,83,204,0.2)" : C.inputBg }]}>
              <Ionicons name="chatbubble-outline" size={14} color={C.primary} />
            </View>
            <TextInput
              style={[rm.commentInput, { color: t.text }]}
              placeholder="Laissez un commentaire (optionnel)…"
              placeholderTextColor={t.textSecondary}
              multiline
              value={comment}
              onChangeText={setComment}
              blurOnSubmit={false}
              autoCorrect={false}
            />
          </View>

          {/* Boutons */}
          <View style={rm.btnRow}>
            <TouchableOpacity style={[rm.cancelBtn, { backgroundColor: t.card, borderColor: t.border }]} onPress={onClose}>
              <Text style={[rm.cancelText, { color: t.textSecondary }]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[rm.submitBtn, selected === 0 && rm.submitBtnDisabled]}
              onPress={() => { if (selected === 0) return; onSubmit(selected, comment); setComment(""); }}
              disabled={selected === 0}
            >
              <LinearGradient
                colors={selected > 0 ? [C.deep, C.violet] : ["#aaa", "#888"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={rm.submitGrad}
              >
                <Ionicons name="checkmark" size={16} color={C.white} />
                <Text style={rm.submitText}>Valider</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── COMPANY CARD ───────────────────────────────────────────────────── */
type CompanyCardProps = { item: any; sectorName: string; onPress: () => void; index: number; isDark: boolean };

function CompanyCardBase({ item, sectorName, onPress, index, isDark }: CompanyCardProps) {
  const t   = isDark ? Colors.dark : Colors.light;
  const cid = String(item?.companyId);

  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;
  const scaleBtn  = useRef(new Animated.Value(1)).current;

  const [rating,      setRating]      = useState<RatingData>(getRating(cid));
  const [modalOpen,   setModalOpen]   = useState(false);
  const [ratingFlash, setRatingFlash] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 320, delay: Math.min(index * 70, 400), useNativeDriver: true }),
      Animated.timing(opacAnim,  { toValue: 1, duration: 320, delay: Math.min(index * 70, 400), useNativeDriver: true }),
    ]).start();
  }, []);

  const btnIn  = () => Animated.spring(scaleBtn, { toValue: 0.94, useNativeDriver: true }).start();
  const btnOut = () => Animated.spring(scaleBtn, { toValue: 1,    useNativeDriver: true }).start();

  const handleSubmitRating = useCallback((stars: number, _comment: string) => {
    const next = submitRating(cid, stars, rating);
    setRating(next);
    setModalOpen(false);
    setRatingFlash(true);
    setTimeout(() => setRatingFlash(false), 1500);
  }, [cid, rating]);

  return (
    <>
      <Animated.View style={[
        s.card,
        {
          backgroundColor: t.card,
          borderColor: t.border,
          shadowColor: t.shadow,
          opacity: opacAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
        {/* ── COVER ── */}
        <LinearGradient
          colors={isDark ? ["#1A1060", "#0D1B3E"] : [C.deep, C.accent]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={s.cardCover}
        >
          <View style={s.coverDeco1} />
          <View style={s.coverDeco2} />
          {/* Nom du secteur sur le cover */}
          <View style={s.coverSectorChip}>
            <Ionicons name="layers-outline" size={10} color="rgba(255,255,255,0.7)" />
            <Text style={s.coverSectorText}>{sectorName}</Text>
          </View>
        </LinearGradient>

        {/* ── AVATAR ── */}
        <View style={[s.avatarWrap, { borderColor: t.card, backgroundColor: t.cardAlt }]}>
          <Image
            source={item.logo ? { uri: item.logo } : require("@/assets/images/logo.jpeg")}
            style={s.avatar}
            contentFit="cover"
            transition={200}
          />
        </View>

        {/* ── BODY ── */}
        <View style={s.cardBody}>
          {/* Nom */}
          <Text style={[s.companyName, { color: t.text }]} numberOfLines={1}>
            {item.name}
          </Text>

          {/* Description */}
          <Text style={[s.companyDesc, { color: t.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>

          {/* ── RATING ROW ── */}
          <View style={[
            s.ratingRow,
            {
              backgroundColor: ratingFlash
                ? (isDark ? "#2A1F00" : "#FEF9EE")
                : t.ratingBg,
              borderColor: t.border,
            },
          ]}>
            {rating.count > 0 ? (
              <StarsDisplay value={rating.average} size={13} count={rating.count} textColor={t.text} />
            ) : (
              <Text style={[s.noRatingText, { color: t.textSecondary }]}>Pas encore noté</Text>
            )}

            <TouchableOpacity
              style={[
                s.rateBtn,
                {
                  backgroundColor: rating.userRating !== null
                    ? (isDark ? "rgba(245,158,11,0.15)" : "#FEF3C7")
                    : (isDark ? "rgba(3,83,204,0.15)" : C.inputBg),
                  borderColor: rating.userRating !== null
                    ? (isDark ? "rgba(245,158,11,0.3)" : "#FDE68A")
                    : t.border,
                },
              ]}
              onPress={() => setModalOpen(true)}
            >
              <Ionicons
                name={rating.userRating !== null ? "star" : "star-outline"}
                size={13}
                color={rating.userRating !== null ? C.gold : C.primary}
              />
              <Text style={[
                s.rateBtnText,
                { color: rating.userRating !== null ? (isDark ? C.gold : "#92400E") : C.primary },
              ]}>
                {rating.userRating !== null ? `${rating.userRating}/5` : "Noter"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info chips */}
          <View style={s.infoRow}>
            {item.location && (
              <View style={[s.infoChip, { backgroundColor: isDark ? "rgba(3,83,204,0.2)" : C.primary + "10" }]}>
                <Ionicons name="location-outline" size={12} color={C.primary} />
                <Text style={[s.infoText, { color: C.primary }]}>{item.location}</Text>
              </View>
            )}
            {item.phone && (
              <View style={[s.infoChip, { backgroundColor: isDark ? "rgba(34,197,94,0.15)" : C.green + "12" }]}>
                <Ionicons name="call-outline" size={12} color={C.green} />
                <Text style={[s.infoText, { color: C.green }]}>{item.phone}</Text>
              </View>
            )}
          </View>

          {/* CTA */}
          <TouchableOpacity activeOpacity={1} onPressIn={btnIn} onPressOut={btnOut} onPress={onPress}>
            <Animated.View style={[s.cta, { transform: [{ scale: scaleBtn }] }]}>
              <LinearGradient
                colors={isDark ? ["#1A1060", "#0D1B3E"] : [C.deep, C.primary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.ctaGrad}
              >
                <Text style={s.ctaText}>Accéder au service</Text>
                <View style={s.ctaArrow}>
                  <Ionicons name="arrow-forward" size={14} color={C.deep} />
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <RatingModal
        visible={modalOpen}
        companyName={item.name}
        current={rating}
        onSubmit={handleSubmitRating}
        onClose={() => setModalOpen(false)}
        isDark={isDark}
      />
    </>
  );
}
const CompanyCard = memo(CompanyCardBase);
CompanyCard.displayName = "CompanyCard";

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function ServiceDetails() {
  const sectorSingle = useSelector<any>((state) => state.global.sectors);
  const router       = useRouter();
  const scrollY      = useRef(new Animated.Value(0)).current;
  const { isDark, t } = useTheme();

  const [company,    setCompany]    = useState<any[]>([]);
  const [sectorCat,  setSectorCat]  = useState<any>();
  const [searchText, setSearchText] = useState("");
  const [dataReady,  setDataReady]  = useState(false);

  useEffect(() => {
    const data = sectorSingle as any;
    setSectorCat(data[0]);
    setCompany(data[0]?.companies || []);
    setDataReady(true);
  }, [sectorSingle]);

  const gotToSelectedMenu = useCallback((value: string, id: string) => {
    const routes: Record<string, string> = {
      "BIM Santé":     `/sante/${id}`,
      "BIM Transport": `/transport/${id}`,
      "BIM Énergies":  `/bim-energie/${id}`,
      "BIM Carburant": `/bim-carburant/${id}`,
      "BIM Hôtellerie":`/hotellerie/${id}`,
      "BIM Gaz":       `/bim-gaz/${id}`,
    };
    const route = routes[value];
    if (route) router.push(route);
    else console.warn(`Aucune route pour: ${value}`);
  }, [router]);

  const handleSearchClear = useCallback(() => setSearchText(""), []);

  const headerH = scrollY.interpolate({ inputRange: [0, 80], outputRange: [Platform.OS === "ios" ? 240 : 220, Platform.OS === "ios" ? 130 : 118], extrapolate: "clamp" });
  const subOp   = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const iconSc  = scrollY.interpolate({ inputRange: [0, 80], outputRange: [1, 0.6], extrapolate: "clamp" });

  const filteredCompanies = company.filter((item: any) =>
    item.location?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  const ListHeader = (
    <View style={{ paddingTop: Platform.OS === "ios" ? 248 : 228 }}>
      {/* Search flottant */}
      <View style={[s.searchBox, {
        backgroundColor: t.inputBg,
        borderColor: t.border,
        shadowColor: t.shadow,
      }]}>
        <View style={[s.searchIconWrap, { backgroundColor: isDark ? "rgba(3,83,204,0.25)" : C.inputBg }]}>
          <Ionicons name="search-outline" size={15} color={C.primary} />
        </View>
        <TextInput
          placeholder="Rechercher par ville ou nom…"
          placeholderTextColor={t.textSecondary}
          style={[s.searchInput, { color: t.text }]}
          value={searchText}
          onChangeText={setSearchText}
          blurOnSubmit={false}
          autoCorrect={false}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={handleSearchClear}>
            <Ionicons name="close-circle" size={17} color={t.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Count */}
      <View style={s.countRow}>
        <View style={[s.countDot, { backgroundColor: C.accent }]} />
        <Text style={[s.countText, { color: t.countText }]}>
          {filteredCompanies.length} entreprise{filteredCompanies.length !== 1 ? "s" : ""}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[s.root, { backgroundColor: t.background }]}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER FIXE PLEINE LARGEUR ── */}
      <Animated.View style={[s.header, { height: headerH, shadowColor: isDark ? "#000" : C.primary }]}>
        <LinearGradient
          colors={t.headerGrad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.deco1} />
        <View style={s.deco2} />

        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          <View style={s.topBar}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={C.white} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>{sectorCat?.name || "Services"}</Text>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/notification")}>
              <Ionicons name="notifications-outline" size={22} color={C.white} />
            </TouchableOpacity>
          </View>

          <Animated.View style={{ alignItems: "center", opacity: subOp }}>
            <Animated.View style={{ transform: [{ scale: iconSc }] }}>
              <View style={s.logoWrap}>
                <Image source={{ uri: sectorCat?.logo }} style={s.headerLogo} contentFit="cover" transition={200} />
              </View>
            </Animated.View>
            <Text style={s.headerSub} numberOfLines={2}>{sectorCat?.description}</Text>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>

      {/* ── FLAT LIST ── */}
      {!dataReady ? (
        <View style={[s.center, { paddingTop: Platform.OS === "ios" ? 260 : 240 }]}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      ) : company.length === 0 ? (
        <>
          {ListHeader}
          <View style={s.center}><NoData /></View>
        </>
      ) : (
        <Animated.FlatList
          data={filteredCompanies}
          keyExtractor={(item: any) => item?.companyId?.toString()}
          contentContainerStyle={[s.list, { backgroundColor: t.background }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={<View style={s.center}><NoData /></View>}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          renderItem={({ item, index }: { item: any; index: number }) => (
            <CompanyCard
              item={item}
              index={index}
              isDark={isDark}
              sectorName={sectorCat?.name || ""}
              onPress={() => gotToSelectedMenu(sectorCat?.name, item?.companyId)}
            />
          )}
        />
      )}
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 40 },

  /* Header — position absolute pleine largeur */
  header: {
    position: "absolute", top: 0, left: 0, right: 0,
    zIndex: 10, overflow: "hidden",
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16,
  },
  deco1: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.05)", top: -60, right: -50 },
  deco2: { position: "absolute", width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,255,255,0.04)", bottom: -30, left: -30 },

  topBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 20,
    marginTop: 8,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: C.white, fontSize: 17, fontFamily: "NexaLight", letterSpacing: 0.3 },
  logoWrap: {
    width: 62, height: 62, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden", marginTop: 10,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
  },
  headerLogo: { width: "100%", height: "100%" },
  headerSub: {
    color: "rgba(255,255,255,0.7)", fontSize: 12,
    fontFamily: "NexaLight", textAlign: "center",
    marginTop: 6, paddingHorizontal: 30,
  },

  /* Search */
  searchBox: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, paddingHorizontal: 10, paddingVertical: 9,
    gap: 10, marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    borderWidth: 1,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  searchIconWrap: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  searchInput: { flex: 1, fontFamily: "NexaLight", fontSize: 13 },

  countRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6,
  },
  countDot: { width: 4, height: 16, borderRadius: 2 },
  countText: { fontFamily: "NexaLight", fontSize: 12 },

  list: { paddingHorizontal: 16, paddingBottom: 60 },

  /* Card */
  card: {
    borderRadius: 22, marginBottom: 16,
    overflow: "hidden", borderWidth: 1,
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09, shadowRadius: 10,
  },
  cardCover: { height: 76, overflow: "hidden", justifyContent: "flex-end", paddingHorizontal: 12, paddingBottom: 8 },
  coverDeco1: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.07)", top: -30, right: -20 },
  coverDeco2: { position: "absolute", width: 70,  height: 70,  borderRadius: 35, backgroundColor: "rgba(255,255,255,0.05)", bottom: -20, left: 30 },
  coverSectorChip: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  coverSectorText: { color: "rgba(255,255,255,0.75)", fontFamily: "NexaLight", fontSize: 10 },

  avatarWrap: {
    position: "absolute", top: 42, left: 16,
    width: 60, height: 60, borderRadius: 16,
    borderWidth: 3, overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6,
  },
  avatar: { width: "100%", height: "100%" },

  cardBody: { marginTop: 34, paddingHorizontal: 16, paddingBottom: 16 },

  companyName: { fontSize: 15, fontFamily: "NexaLight", marginBottom: 4 },
  companyDesc: { fontSize: 12, fontFamily: "NexaLight", lineHeight: 17, marginBottom: 10 },

  /* Rating row */
  ratingRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 10,
  },
  noRatingText: { fontFamily: "NexaLight", fontSize: 11, fontStyle: "italic" },
  rateBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1,
  },
  rateBtnText: { fontFamily: "NexaLight", fontSize: 11 },

  /* Info chips */
  infoRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  infoChip: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4,
  },
  infoText: { fontSize: 11, fontFamily: "NexaLight" },

  /* CTA */
  cta:     { borderRadius: 14, overflow: "hidden" },
  ctaGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 12 },
  ctaText: { color: C.white, fontFamily: "NexaLight", fontSize: 13, letterSpacing: 0.3 },
  ctaArrow: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.gold,
    alignItems: "center", justifyContent: "center",
  },
});

/* ─── Stars display styles ───────────────────────────────────────────── */
const sd = StyleSheet.create({
  row:   { flexDirection: "row", alignItems: "center", gap: 3 },
  value: { fontFamily: "NexaLight", marginLeft: 4 },
  count: { color: C.muted },
});

/* ─── Rating modal styles ────────────────────────────────────────────── */
const rm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(3,40,100,0.5)", justifyContent: "flex-end" },
  sheet:   { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  handle:  { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: -4 },

  header:    { padding: 18, paddingTop: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  headerIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { flex: 1, color: C.white, fontFamily: "NexaLight", fontSize: 15, letterSpacing: 0.3 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  companyName: { color: "rgba(255,255,255,0.65)", fontFamily: "NexaLight", fontSize: 12, paddingLeft: 42 },

  currentRating: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12,
    borderBottomWidth: 1,
  },
  currentLabel: { fontFamily: "NexaLight", fontSize: 11 },

  starsSection: { alignItems: "center", paddingVertical: 20 },
  starsHint:    { fontFamily: "NexaLight", fontSize: 13, marginBottom: 16, height: 20 },
  starsRow:     { flexDirection: "row", gap: 10 },

  commentWrap: {
    flexDirection: "row", alignItems: "flex-start",
    marginHorizontal: 16, marginBottom: 16,
    borderRadius: 16, borderWidth: 1,
    padding: 12, gap: 10,
  },
  commentIcon: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginTop: 2,
  },
  commentInput: {
    flex: 1, fontFamily: "NexaLight",
    fontSize: 13, minHeight: 60, textAlignVertical: "top",
  },

  btnRow:            { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingBottom: 36, paddingTop: 4 },
  cancelBtn:         { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: "center", borderWidth: 1 },
  cancelText:        { fontFamily: "NexaLight", fontSize: 14 },
  submitBtn:         { flex: 2, borderRadius: 14, overflow: "hidden" },
  submitBtnDisabled: { opacity: 0.5 },
  submitGrad: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8, paddingVertical: 13,
  },
  submitText: { color: C.white, fontFamily: "NexaLight", fontSize: 14, letterSpacing: 0.3 },
});