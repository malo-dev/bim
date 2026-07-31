/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, memo, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Polygon, ClipPath, Rect } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetsectorByIdQuery, useGetAllSectorsQuery } from "@/services/sectorsServices";
import {
  useGetNotesByCompanyQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} from "@/services/notesService";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useAppTheme } from "@/app/_layout";

/* ─── PALETTE ────────────────────────────────────────────────────────── */
const LIGHT = {
  primary:   "#0035C5",
  blue:      "#0047FF",
  deep:      "#001257",
  gold:      "#F59E0B",
  white:     "#FFFFFF",
  error:     "#EF4444",
  green:     "#22C55E",
  bg:        "#F9F9F9",
  card:      "#FFFFFF",
  text:      "#1A1C1C",
  textSec:   "#434657",
  textMut:   "#747688",
  border:    "rgba(196,197,218,0.30)",
  safeBarBg: "rgba(255,255,255,0.96)",
  noteBg:    "#FAFAFA",
  searchBg:  "#FFFFFF",
  heroCard:  "rgba(255,255,255,0.88)",
  heroBorder:"rgba(255,255,255,0.80)",
};
const DARK: typeof LIGHT = {
  primary:   "#4D8DFF",
  blue:      "#4D8DFF",
  deep:      "#001257",
  gold:      "#F59E0B",
  white:     "#FFFFFF",
  error:     "#DC2626",
  green:     "#22C55E",
  bg:        "#0B1220",
  card:      "#1A2540",
  text:      "#EAF0FF",
  textSec:   "#A3B4D0",
  textMut:   "#6B7A99",
  border:    "rgba(31,42,68,0.80)",
  safeBarBg: "rgba(11,18,32,0.94)",
  noteBg:    "rgba(31,42,68,0.50)",
  searchBg:  "#1A2540",
  heroCard:  "rgba(26,37,64,0.92)",
  heroBorder:"rgba(31,42,68,0.80)",
};

/* ─── SECTOR HERO IMAGES ─────────────────────────────────────────────── */
const HERO: Record<string, string> = {
  "bim santé":       "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
  "bim sante":       "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
  "bim transport":   "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
  "bim carburant":   "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "bim énergies":    "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
  "bim energies":    "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
  "bim hôtellerie":  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
  "bim hotellerie":  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
  "bim gaz":         "https://images.unsplash.com/photo-1548337138-e87d889cc369?w=800&q=80",
  "bim supermarche": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
  "bim supermarché": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
  "bim supermarket": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
};
function heroImage(name: string) {
  const lower = (name ?? "").toLowerCase();
  return HERO[lower] ?? "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80";
}

/* ─── STAR SVG ───────────────────────────────────────────────────────── */
function StarSvg({ size = 16, filled = 1, uid = "x" }: { size?: number; filled?: number; uid?: string }) {
  const clipId = `clip_${uid}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <ClipPath id={clipId}>
          <Rect x={0} y={0} width={filled >= 1 ? 24 : filled <= 0 ? 0 : 24 * filled} height={24} />
        </ClipPath>
      </Defs>
      <Polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill="none" stroke={LIGHT.gold} strokeWidth={1.8} opacity={0.35}
      />
      {filled > 0 && (
        <Polygon
          points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
          fill={LIGHT.gold} clipPath={`url(#${clipId})`}
        />
      )}
    </Svg>
  );
}

function StarsRow({ value, count, size = 14, ns = "row" }: { value: number; count?: number; size?: number; ns?: string }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <StarSvg key={i} size={size} filled={Math.min(1, Math.max(0, value - (i - 1)))} uid={`${ns}_${i}`} />
      ))}
      <Text style={{ fontFamily: "NexaBold", fontSize: size - 2, color: C.text, marginLeft: 3 }}>
        {value > 0 ? value.toFixed(1) : "—"}
      </Text>
      {count !== undefined && count > 0 && (
        <Text style={{ fontFamily: "NexaLight", fontSize: size - 3, color: C.textMut }}>({count})</Text>
      )}
    </View>
  );
}

/* ─── INTERACTIVE STARS ──────────────────────────────────────────────── */
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <TouchableOpacity key={s} onPress={() => onChange(s)} activeOpacity={0.5}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
          <Text style={{ fontSize: 46, color: s <= value ? LIGHT.gold : "#D1D5DB", lineHeight: 54 }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function fmtDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

/* ─── REVIEWS MODAL ──────────────────────────────────────────────────── */
type ReviewsModalProps = {
  visible: boolean; onClose: () => void;
  companyId: string; companyName: string; userId: string | null;
};

function ReviewsModal({ visible, onClose, companyId, companyName, userId }: ReviewsModalProps) {
  const { isDark } = useAppTheme();
  const C  = isDark ? DARK : LIGHT;
  const rv = useMemo(() => mkRv(C), [isDark]);

  const { data: notesData, refetch } = useGetNotesByCompanyQuery(companyId, { skip: !companyId });
  const [createNote, { isLoading: creating }] = useCreateNoteMutation();
  const [updateNote, { isLoading: updating }] = useUpdateNoteMutation();
  const [deleteNote, { isLoading: deleting }] = useDeleteNoteMutation();

  const notesList: any[]  = notesData?.data ?? [];
  const averageStars       = notesData?.averageStars ?? 0;
  const userNote           = userId ? notesList.find((n: any) => String(n.userId ?? n.user?.id) === String(userId)) : null;

  const [editMode,   setEditMode]   = useState<"none" | "add" | "edit">("none");
  const [starValue,  setStarValue]  = useState(0);
  const [commentVal, setCommentVal] = useState("");

  useEffect(() => {
    if (visible) { setEditMode("none"); setStarValue(0); setCommentVal(""); }
  }, [visible]);

  const startEdit = () => {
    setStarValue(userNote?.totalStars ?? 0);
    setCommentVal(userNote?.notes ?? "");
    setEditMode("edit");
  };

  const handleSubmit = async () => {
    if (starValue === 0) return;
    try {
      if (!userNote) {
        await createNote({ companyId: Number(companyId), totalStars: starValue, notes: commentVal }).unwrap();
      } else {
        await updateNote({ noteId: userNote.noteId, companyId, totalStars: starValue, notes: commentVal }).unwrap();
      }
      setEditMode("none"); refetch();
    } catch (e) { console.error("handleSubmit error:", e); }
  };

  const handleDelete = () => {
    Alert.alert("Supprimer l'avis", "Voulez-vous vraiment supprimer votre avis ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          try { await deleteNote({ noteId: userNote.noteId, companyId }).unwrap(); setEditMode("none"); refetch(); } catch (_) {}
        },
      },
    ]);
  };

  const LABELS = ["","Mauvais 😕","Passable 😐","Bien 🙂","Très bien 😊","Excellent 🤩"];
  const otherNotes = notesList.filter((n: any) => String(n.userId ?? n.user?.id) !== String(userId));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={rv.overlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
          <View style={rv.sheet}>
            <View style={rv.handle} />
            <View style={rv.topBar}>
              <View style={{ flex: 1 }}>
                <Text style={rv.headerCompany} numberOfLines={1}>{companyName}</Text>
                <Text style={rv.headerSub}>Avis et évaluations</Text>
              </View>
              <TouchableOpacity style={rv.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={20} color={C.textSec} />
              </TouchableOpacity>
            </View>

            <View style={rv.avgCard}>
              <Text style={rv.avgNumber}>{averageStars > 0 ? Number(averageStars).toFixed(1) : "—"}</Text>
              <View style={{ gap: 5 }}>
                <StarsRow value={averageStars} size={20} ns="modal_avg" />
                <Text style={rv.avgCount}>{notesList.length} avis au total</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 14 }}
              keyboardShouldPersistTaps="handled">

              <Text style={rv.sectionTitle}>Mon avis</Text>

              {userNote && editMode !== "edit" ? (
                <View style={rv.myNoteCard}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <StarsRow value={userNote.totalStars ?? 0} size={16} ns="my_note" />
                    <Text style={rv.noteDate}>{fmtDate(userNote.createdAt)}</Text>
                  </View>
                  {userNote.notes ? <Text style={rv.noteComment}>{userNote.notes}</Text> : null}
                  <View style={rv.myNoteActions}>
                    <TouchableOpacity style={rv.actionBtnOutline} onPress={startEdit} activeOpacity={0.8}>
                      <Ionicons name="pencil-outline" size={13} color={C.primary} />
                      <Text style={rv.actionBtnOutlineText}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={rv.actionBtnDanger} onPress={handleDelete} disabled={deleting} activeOpacity={0.8}>
                      {deleting
                        ? <ActivityIndicator size="small" color={C.error} />
                        : <><Ionicons name="trash-outline" size={13} color={C.error} />
                            <Text style={rv.actionBtnDangerText}>Supprimer</Text></>}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={rv.formCard}>
                  <Text style={rv.formHint}>
                    {starValue > 0 ? LABELS[starValue] : "Touchez une étoile pour noter"}
                  </Text>
                  <StarPicker value={starValue} onChange={setStarValue} />
                  <View style={rv.commentWrap}>
                    <TextInput
                      style={rv.commentInput}
                      placeholder="Commentaire (optionnel)…"
                      placeholderTextColor={C.textMut}
                      value={commentVal}
                      onChangeText={setCommentVal}
                      multiline keyboardType="default"
                      autoCapitalize="sentences" autoCorrect blurOnSubmit={false} scrollEnabled={false}
                    />
                  </View>
                  <TouchableOpacity
                    style={[rv.submitBtn, (starValue === 0 || creating || updating) && { opacity: 0.40 }]}
                    onPress={handleSubmit} disabled={starValue === 0 || creating || updating} activeOpacity={0.85}>
                    <LinearGradient colors={[C.blue, C.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={rv.submitGrad}>
                      {(creating || updating)
                        ? <ActivityIndicator size="small" color={C.white} />
                        : <><Ionicons name="checkmark-circle-outline" size={18} color={C.white} />
                            <Text style={rv.submitText}>{editMode === "edit" ? "Modifier mon avis" : "Envoyer mon avis"}</Text></>}
                    </LinearGradient>
                  </TouchableOpacity>
                  {editMode === "edit" && (
                    <TouchableOpacity onPress={() => setEditMode("none")} style={{ alignItems: "center", marginTop: -4 }}>
                      <Text style={{ fontFamily: "NexaBold", fontSize: 12, color: C.textMut }}>Annuler</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {otherNotes.length > 0 && (
                <>
                  <Text style={[rv.sectionTitle, { marginTop: 4 }]}>Avis des membres ({otherNotes.length})</Text>
                  {otherNotes.map((n: any) => {
                    const uname = n.user?.username ?? n.username ?? "Membre";
                    return (
                      <View key={n.noteId} style={rv.reviewCard}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <View style={rv.avatar}>
                            <Text style={rv.avatarText}>{uname.charAt(0).toUpperCase()}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={rv.reviewUser}>{uname}</Text>
                            <StarsRow value={n.totalStars ?? 0} size={12} ns={`rev_${n.noteId}`} />
                          </View>
                          <Text style={rv.noteDate}>{fmtDate(n.createdAt)}</Text>
                        </View>
                        {n.notes ? <Text style={rv.noteComment}>{n.notes}</Text> : null}
                      </View>
                    );
                  })}
                </>
              )}

              {otherNotes.length === 0 && !userNote && (
                <View style={{ alignItems: "center", paddingVertical: 16, gap: 8 }}>
                  <Ionicons name="chatbubble-ellipses-outline" size={32} color={C.textMut} />
                  <Text style={{ fontFamily: "NexaLight", fontSize: 13, color: C.textMut, textAlign: "center" }}>
                    Soyez le premier à donner votre avis !
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ─── COMPANY CARD ───────────────────────────────────────────────────── */
function CompanyCardBase({ item, sectorName, onPress, index, userId, onRatingLoaded }: {
  item: any; sectorName: string; onPress: () => void;
  index: number; userId: string | null;
  onRatingLoaded: (companyId: string, avg: number) => void;
}) {
  const { isDark } = useAppTheme();
  const C  = isDark ? DARK : LIGHT;
  const cc = useMemo(() => mkCc(C), [isDark]);

  const cid       = String(item?.companyId);
  const slideAnim = useRef(new Animated.Value(24)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;
  const [reviewsOpen, setReviewsOpen] = useState(false);

  const { data: notesData } = useGetNotesByCompanyQuery(cid);
  const averageStars = notesData?.averageStars ?? 0;
  const noteCount    = notesData?.data?.length ?? 0;
  const userNote     = userId ? (notesData?.data ?? []).find((n: any) => String(n.userId ?? n.user?.id) === String(userId)) : null;

  useEffect(() => { if (notesData) onRatingLoaded(cid, averageStars); }, [averageStars]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: Math.min(index * 60, 360), useNativeDriver: true }),
      Animated.timing(opacAnim,  { toValue: 1, duration: 300, delay: Math.min(index * 60, 360), useNativeDriver: true }),
    ]).start();
  }, []);

  const tags: string[] = item.specialties ?? item.tags ?? item.services ?? [];

  return (
    <>
      <Animated.View style={[cc.card, { opacity: opacAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={cc.topRow}>
          <View style={cc.logoWrap}>
            <Image source={item.logo ? { uri: item.logo } : require("@/assets/images/logo.jpeg")}
              style={cc.logo} contentFit="contain" transition={200} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={cc.name} numberOfLines={2}>{item.name}</Text>
            <StarsRow value={averageStars} count={noteCount} size={13} ns={`card_${cid}`} />
            {userNote && (
              <View style={cc.myRatingBadge}>
                <Ionicons name="star" size={10} color={C.gold} />
                <Text style={cc.myRatingText}>Ma note : {userNote.totalStars}/5</Text>
              </View>
            )}
          </View>
        </View>

        {item.description ? <Text style={cc.desc} numberOfLines={3}>{item.description}</Text> : null}

        {tags.length > 0 && (
          <View style={cc.tagsRow}>
            {tags.slice(0, 4).map((t: string, i: number) => (
              <View key={i} style={cc.tag}><Text style={cc.tagText}>{t}</Text></View>
            ))}
          </View>
        )}

        <View style={cc.infoRow}>
          {item.location ? (
            <View style={cc.infoChip}>
              <Ionicons name="location-outline" size={13} color={C.textMut} />
              <Text style={cc.infoText}>{item.location}</Text>
            </View>
          ) : null}
          {item.phone ? (
            <View style={cc.infoChip}>
              <Ionicons name="call-outline" size={13} color={C.textMut} />
              <Text style={cc.infoText}>{item.phone}</Text>
            </View>
          ) : null}
        </View>

        <View style={cc.btnRow}>
          <TouchableOpacity style={cc.btnOutline} onPress={() => setReviewsOpen(true)} activeOpacity={0.8}>
            <Ionicons name={userNote ? "star" : "star-outline"} size={14} color={C.primary} />
            <Text style={cc.btnOutlineText}>{noteCount > 0 ? `Avis (${noteCount})` : "Donner un avis"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cc.btnSolid} onPress={onPress} activeOpacity={0.85}>
            <LinearGradient colors={[C.blue, C.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={cc.btnGrad}>
              <Text style={cc.btnSolidText}>Accéder</Text>
              <Ionicons name="arrow-forward" size={14} color={C.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ReviewsModal visible={reviewsOpen} onClose={() => setReviewsOpen(false)}
        companyId={cid} companyName={item.name} userId={userId} />
    </>
  );
}
const CompanyCard = memo(CompanyCardBase);

/* ─── MAIN SCREEN ────────────────────────────────────────────────────── */
export default function ServiceDetails() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);

  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const { unread } = useUnreadNotifications();

  const [searchText, setSearchText] = useState("");
  const [userId, setUserId]         = useState<string | null>(null);
  const [sortBy, setSortBy]         = useState<"name" | "rating">("rating");
  const ratingsRef = useRef<Record<string, number>>({});
  const [, forceSort] = useState(0);

  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);

  const { data: sectorData, isLoading } = useGetsectorByIdQuery(id, { skip: !id });
  const { data: allSectorsData }        = useGetAllSectorsQuery({ page: 1, pageSize: 10, search: "", paginate: false });

  const sectorCat  = sectorData?.data ?? sectorData;
  const sectorName = sectorCat?.name ?? "";
  const companies: any[]  = sectorCat?.companies ?? [];
  const otherSectors      = (allSectorsData?.data ?? []).filter((s: any) => s.businessId !== id).slice(0, 8);

  const onRatingLoaded = useCallback((cid: string, avg: number) => {
    ratingsRef.current[cid] = avg;
  }, []);

  const filteredCompanies = useMemo(() => {
    let list = companies.filter((c: any) =>
      c.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.location?.toLowerCase().includes(searchText.toLowerCase())
    );
    if (sortBy === "rating") {
      list = [...list].sort((a, b) => (ratingsRef.current[String(b.companyId)] ?? 0) - (ratingsRef.current[String(a.companyId)] ?? 0));
    } else {
      list = [...list].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    }
    return list;
  }, [companies, searchText, sortBy]);

  const gotToSelectedMenu = useCallback((value: string, cid: string) => {
    const routes: Record<string, string> = {
      "BIM Santé":       `/sante/${cid}`,
      "BIM Transport":   `/transport/${cid}`,
      "BIM Énergies":    `/bim-energie/${cid}`,
      "BIM Carburant":   `/bim-carburant/${cid}`,
      "BIM Hôtellerie":  `/hotellerie/${cid}`,
      "BIM Gaz":         `/bim-gaz/${cid}`,
      "BIM SUPERMARCHE": `/bim-supermarche/${cid}`,
    };
    const route = routes[value];
    if (route) router.push(route as any);
  }, [router]);

  const ListHeader = () => (
    <View>
      <View style={s.hero}>
        <Image source={{ uri: heroImage(sectorName) }} style={s.heroImg} contentFit="cover" transition={400} />
        <LinearGradient colors={["transparent", "rgba(0,18,87,0.60)"]}
          start={{ x: 0, y: 0.2 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={s.heroCard}>
          <Text style={s.heroTitle}>{sectorName || "Services BIM"}</Text>
          {sectorCat?.description ? (
            <Text style={s.heroDesc} numberOfLines={2}>{sectorCat.description}</Text>
          ) : null}
        </View>
      </View>

      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={C.textMut} />
          <TextInput placeholder="Rechercher par ville ou nom..." placeholderTextColor={C.textMut}
            style={s.searchInput} value={searchText} onChangeText={setSearchText}
            returnKeyType="search" autoCorrect={false} />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={16} color={C.textMut} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={s.sectionRow}>
        <View style={s.sectionLabelRow}>
          <Text style={s.sectionLabel}>Établissements</Text>
          <View style={s.countBadge}><Text style={s.countBadgeText}>{filteredCompanies.length}</Text></View>
        </View>
        <View style={s.sortRow}>
          <TouchableOpacity style={[s.sortChip, sortBy === "rating" && s.sortChipActive]}
            onPress={() => { setSortBy("rating"); forceSort(n => n+1); }}>
            <Ionicons name="star-outline" size={12} color={sortBy === "rating" ? C.white : C.primary} />
            <Text style={[s.sortChipText, sortBy === "rating" && { color: C.white }]}>Note</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.sortChip, sortBy === "name" && s.sortChipActive]}
            onPress={() => setSortBy("name")}>
            <Ionicons name="text-outline" size={12} color={sortBy === "name" ? C.white : C.primary} />
            <Text style={[s.sortChipText, sortBy === "name" && { color: C.white }]}>A-Z</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const ListFooter = () => (
    <View>
      {otherSectors.length > 0 && (
        <View style={s.otherSection}>
          <Text style={s.sectionLabel}>Explorer d'autres secteurs</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.otherScroll}>
            {otherSectors.map((sec: any) => (
              <TouchableOpacity key={sec.businessId} style={s.otherCard}
                onPress={() => router.push(`/service/${sec.businessId}` as any)} activeOpacity={0.88}>
                <Image source={{ uri: heroImage(sec.name ?? "") }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
                <LinearGradient colors={["rgba(0,18,87,0.08)", "rgba(0,18,87,0.72)"]}
                  start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                <View style={s.otherContent}>
                  <Text style={s.otherName} numberOfLines={2}>{sec.name}</Text>
                  <View style={s.otherLinkRow}>
                    <Text style={s.otherLink}>Voir plus</Text>
                    <Ionicons name="arrow-forward" size={11} color="rgba(255,255,255,0.85)" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      <View style={{ height: 100 }} />
    </View>
  );

  return (
    <View style={[{ flex: 1 }, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <SafeAreaView edges={["top"]} style={s.safeBar}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={s.topBrand} numberOfLines={1}>{sectorName || "BIMNext"}</Text>
          <TouchableOpacity style={s.iconBtnRel} onPress={() => router.push("/notification" as any)}>
            <Ionicons name="notifications-outline" size={22} color={C.textSec} />
            {unread > 0 && <View style={s.badge}><Text style={s.badgeText}>{unread > 99 ? "99+" : unread}</Text></View>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <FlatList
          data={filteredCompanies}
          keyExtractor={(item: any) => String(item?.companyId)}
          ListHeaderComponent={<ListHeader />}
          ListFooterComponent={<ListFooter />}
          ListEmptyComponent={
            <View style={s.center}>
              <Ionicons name="business-outline" size={40} color={C.textMut} />
              <Text style={s.emptyText}>Aucun établissement trouvé</Text>
            </View>
          }
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          renderItem={({ item, index }) => (
            <CompanyCard item={item} index={index} sectorName={sectorName} userId={userId}
              onRatingLoaded={onRatingLoaded}
              onPress={() => gotToSelectedMenu(sectorName, item?.companyId)} />
          )}
        />
      )}
    </View>
  );
}

/* ─── STYLE FACTORIES ────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  safeBar:    { backgroundColor: C.safeBarBg, borderBottomWidth: 1, borderBottomColor: C.border },
  topBar:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  iconBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: C.border, alignItems: "center", justifyContent: "center" },
  iconBtnRel: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  topBrand:   { fontFamily: "NexaBold", fontSize: 18, color: C.primary, letterSpacing: -0.3 },
  badge:      { position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.error, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText:  { fontFamily: "NexaBold", fontSize: 9, color: C.white },
  list:       { paddingBottom: 20 },
  center:     { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText:  { fontFamily: "NexaLight", fontSize: 14, color: C.textMut },

  hero:      { marginHorizontal: 16, marginTop: 16, height: 220, borderRadius: 36, overflow: "hidden", elevation: 8, shadowColor: C.deep, shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  heroImg:   { width: "100%", height: "100%" },
  heroCard:  { position: "absolute", bottom: 16, left: 16, right: 16, backgroundColor: C.heroCard, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 14, borderWidth: 1, borderColor: C.heroBorder },
  heroTitle: { fontFamily: "NexaBold", fontSize: 20, color: C.primary, marginBottom: 2 },
  heroDesc:  { fontFamily: "NexaLight", fontSize: 12, color: C.textSec, lineHeight: 17 },

  searchWrap:  { paddingHorizontal: 16, marginTop: 16 },
  searchBox:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.searchBg, borderRadius: 16, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, height: 48, elevation: 2, shadowColor: "#0047FF", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
  searchInput: { flex: 1, fontSize: 13, fontFamily: "NexaLight", color: C.text },

  sectionRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginTop: 20, marginBottom: 12 },
  sectionLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionLabel:    { fontFamily: "NexaBold", fontSize: 10, color: C.textMut, textTransform: "uppercase", letterSpacing: 1.5 },
  countBadge:      { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  countBadgeText:  { fontFamily: "NexaBold", fontSize: 10, color: C.white },

  sortRow:        { flexDirection: "row", gap: 6 },
  sortChip:       { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: C.primary + "40", backgroundColor: C.searchBg },
  sortChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  sortChipText:   { fontFamily: "NexaBold", fontSize: 10, color: C.primary },

  otherSection: { paddingHorizontal: 16, marginTop: 28 },
  otherScroll:  { paddingTop: 12, paddingBottom: 8, gap: 12 },
  otherCard:    { width: 155, height: 110, borderRadius: 22, overflow: "hidden", elevation: 4, shadowColor: C.deep, shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, justifyContent: "flex-end" },
  otherContent: { padding: 12, gap: 4 },
  otherName:    { fontFamily: "NexaBold", fontSize: 13, color: C.white, lineHeight: 17 },
  otherLinkRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  otherLink:    { fontFamily: "NexaBold", fontSize: 10, color: "rgba(255,255,255,0.85)", letterSpacing: 0.3 },
}); }

function mkCc(C: typeof LIGHT) { return StyleSheet.create({
  card:          { marginHorizontal: 16, backgroundColor: C.card, borderRadius: 28, padding: 20, borderWidth: 1, borderColor: C.border, elevation: 3, shadowColor: "#0047FF", shadowOpacity: 0.05, shadowRadius: 24, shadowOffset: { width: 0, height: 6 }, gap: 12 },
  topRow:        { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  logoWrap:      { width: 62, height: 62, borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 6, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  logo:          { width: "100%", height: "100%" },
  name:          { fontFamily: "NexaBold", fontSize: 15, color: C.text },
  myRatingBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2, backgroundColor: "rgba(245,158,11,0.10)", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, alignSelf: "flex-start" },
  myRatingText:  { fontFamily: "NexaBold", fontSize: 9, color: "#92400E" },
  desc:          { fontFamily: "NexaLight", fontSize: 13, color: C.textSec, lineHeight: 19 },
  tagsRow:       { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag:           { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: C.primary + "14", borderRadius: 20, borderWidth: 1, borderColor: C.primary + "22" },
  tagText:       { fontFamily: "NexaBold", fontSize: 10, color: C.primary, letterSpacing: 0.3 },
  infoRow:       { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  infoChip:      { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  infoText:      { fontFamily: "NexaLight", fontSize: 11, color: C.textSec },
  btnRow:        { flexDirection: "row", gap: 10, marginTop: 4 },
  btnOutline:    { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 16, borderWidth: 1.5, borderColor: C.primary + "40", paddingVertical: 12, backgroundColor: C.card },
  btnOutlineText:{ fontFamily: "NexaBold", fontSize: 12, color: C.primary },
  btnSolid:      { flex: 1.6, borderRadius: 16, overflow: "hidden" },
  btnGrad:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13 },
  btnSolidText:  { fontFamily: "NexaBold", fontSize: 12, color: C.white },
}); }

function mkRv(C: typeof LIGHT) { return StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: "rgba(20,20,40,0.45)", justifyContent: "flex-end" },
  sheet:         { backgroundColor: C.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: "80%", flexShrink: 1 },
  handle:        { width: 44, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginTop: 12 },
  topBar:        { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  headerCompany: { fontFamily: "NexaBold", fontSize: 17, color: C.text },
  headerSub:     { fontFamily: "NexaLight", fontSize: 12, color: C.textMut, marginTop: 2 },
  closeBtn:      { width: 34, height: 34, borderRadius: 17, backgroundColor: C.border, alignItems: "center", justifyContent: "center" },
  avgCard:       { flexDirection: "row", alignItems: "center", gap: 16, marginHorizontal: 20, marginTop: 14, marginBottom: 4, backgroundColor: "rgba(245,158,11,0.07)", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 14, borderWidth: 1, borderColor: "rgba(245,158,11,0.15)" },
  avgNumber:     { fontFamily: "NexaBold", fontSize: 44, color: C.text, lineHeight: 50 },
  avgCount:      { fontFamily: "NexaLight", fontSize: 11, color: C.textMut },
  sectionTitle:  { fontFamily: "NexaBold", fontSize: 10, color: C.textMut, textTransform: "uppercase", letterSpacing: 1.4 },
  myNoteCard:    { backgroundColor: C.noteBg, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(245,158,11,0.22)", gap: 8 },
  noteDate:      { fontFamily: "NexaLight", fontSize: 10, color: C.textMut, textTransform: "uppercase", letterSpacing: 0.5 },
  noteComment:   { fontFamily: "NexaLight", fontSize: 13, color: C.textSec, lineHeight: 19 },
  myNoteActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  actionBtnOutline:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 12, borderWidth: 1.5, borderColor: C.primary + "40", paddingVertical: 11, backgroundColor: C.card },
  actionBtnOutlineText: { fontFamily: "NexaBold", fontSize: 12, color: C.primary },
  actionBtnDanger:      { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 12, borderWidth: 1.5, borderColor: C.error + "40", paddingVertical: 11, backgroundColor: C.card },
  actionBtnDangerText:  { fontFamily: "NexaBold", fontSize: 12, color: C.error },
  formCard:      { backgroundColor: C.noteBg, borderRadius: 22, padding: 20, gap: 16, borderWidth: 1, borderColor: C.border },
  formHint:      { fontFamily: "NexaBold", fontSize: 15, color: C.text, textAlign: "center" },
  commentWrap:   { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10 },
  commentInput:  { fontFamily: "NexaLight", fontSize: 13, color: C.text, minHeight: 70, textAlignVertical: "top", backgroundColor: "transparent" },
  submitBtn:     { borderRadius: 14, overflow: "hidden" },
  submitGrad:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15 },
  submitText:    { fontFamily: "NexaBold", fontSize: 14, color: C.white },
  reviewCard:    { backgroundColor: C.noteBg, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  avatar:        { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary + "14", alignItems: "center", justifyContent: "center" },
  avatarText:    { fontFamily: "NexaBold", fontSize: 15, color: C.primary },
  reviewUser:    { fontFamily: "NexaBold", fontSize: 13, color: C.text, marginBottom: 2 },
}); }
