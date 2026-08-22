/* eslint-disable */
import { useGetTutorialsQuery } from "@/services/tutorialService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/app/_layout";

const ios = Platform.OS === "ios";

/* ── PALETTE ───────────────────────────────────────────────── */
const LIGHT = {
  primary:  "#0035C5",
  text:     "#1A1C1C",
  textSec:  "#434657",
  textMut:  "#747688",
  bg:       "#F0F4FA",
  surface:  "#FFFFFF",
  red:      "#EF4444",
  border:   "rgba(196,197,218,0.35)",
  topBarBg: "#FFFFFF",
  topBord:  "rgba(0,0,0,0.08)",
  cardBg:   "#FFFFFF",
  cardBord: "rgba(0,0,0,0.07)",
  inputBg:  "#F4F6FB",
  inputBord:"rgba(196,197,218,0.60)",
  tag:      "#EEF2FF",
  tagText:  "#3B5BDB",
};
const DARK = {
  primary:  "#4D8DFF",
  text:     "#EAF0FF",
  textSec:  "#B0BCDA",
  textMut:  "#6B7A99",
  bg:       "#0B1220",
  surface:  "#1A2540",
  red:      "#DC2626",
  border:   "rgba(31,42,68,0.80)",
  topBarBg: "#111B2E",
  topBord:  "rgba(255,255,255,0.07)",
  cardBg:   "#1A2540",
  cardBord: "rgba(255,255,255,0.06)",
  inputBg:  "#141E33",
  inputBord:"rgba(75,90,130,0.50)",
  tag:      "#1A2B50",
  tagText:  "#7BA7FF",
};

/* ── HELPERS ───────────────────────────────────────────────── */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?&#]+)/,
    /\/embed\/([^?&#]+)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function autoThumb(youtubeUrl: string, provided?: string | null): string | null {
  if (provided) return provided;
  const id = extractYouTubeId(youtubeUrl);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

/* ── MAIN ──────────────────────────────────────────────────── */
export default function Formation() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);

  const [search, setSearch]       = useState("");
  const [opening, setOpening]     = useState<number | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetTutorialsQuery(undefined, {
    refetchOnFocus: true,
  });

  const tutorials = data?.tutorials ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return tutorials;
    return tutorials.filter(
      (t: any) =>
        t.title.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
    );
  }, [tutorials, search]);

  const handleOpen = async (tuto: any) => {
    try {
      setOpening(tuto.id);
      await WebBrowser.openBrowserAsync(tuto.youtubeUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        toolbarColor: "#FF0000",
        controlsColor: "#FFFFFF",
      });
    } catch {
      // fallback silencieux
    } finally {
      setOpening(null);
    }
  };

  const HEADER_H =
    (ios ? insets.top : StatusBar.currentHeight ?? 0) + 60;

  return (
    <View style={[s.root, { backgroundColor: C.bg }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={C.topBarBg}
      />

      {/* ── TOP BAR ── */}
      <View
        style={[
          s.topBar,
          {
            backgroundColor: C.topBarBg,
            borderBottomColor: C.topBord,
            paddingTop: ios ? insets.top : (StatusBar.currentHeight ?? 0) + 8,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.topSide}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>

        <View style={s.topCenter}>
          <Text style={[s.topTitle, { color: C.text }]}>Formation</Text>
        </View>

        <View style={s.topSide} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          s.scroll,
          { paddingTop: HEADER_H + 12, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {/* ── Hero ── */}
        <View style={[s.hero, { backgroundColor: C.primary }]}>
          <View style={s.heroIconWrap}>
            <Ionicons name="play-circle" size={36} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.heroTitle}>Tutoriels BIM Next</Text>
            <Text style={s.heroSub}>
              {tutorials.length} vidéo{tutorials.length !== 1 ? "s" : ""} disponible{tutorials.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* ── Search ── */}
        <View style={[s.searchWrap, { backgroundColor: C.inputBg, borderColor: C.inputBord }]}>
          <Ionicons name="search-outline" size={18} color={C.textMut} style={{ marginRight: 8 }} />
          <TextInput
            style={[s.searchInput, { color: C.text }]}
            placeholder="Rechercher une vidéo…"
            placeholderTextColor={C.textMut}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color={C.textMut} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Loading ── */}
        {isLoading && (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        )}

        {/* ── Empty ── */}
        {!isLoading && filtered.length === 0 && (
          <View style={s.emptyWrap}>
            <Ionicons name="play-circle-outline" size={54} color={C.textMut} />
            <Text style={[s.emptyTitle, { color: C.text }]}>
              {search ? "Aucun résultat" : "Aucun tutoriel"}
            </Text>
            <Text style={[s.emptySub, { color: C.textMut }]}>
              {search
                ? `Aucune vidéo ne correspond à "${search}"`
                : "Les tutoriels apparaîtront ici dès leur publication."}
            </Text>
          </View>
        )}

        {/* ── List ── */}
        {!isLoading && filtered.map((tuto: any) => {
          const thumb = autoThumb(tuto.youtubeUrl, tuto.thumbnailUrl);
          const isOpening = opening === tuto.id;
          return (
            <TouchableOpacity
              key={tuto.id}
              style={[s.card, { backgroundColor: C.cardBg, borderColor: C.cardBord }]}
              onPress={() => handleOpen(tuto)}
              activeOpacity={0.82}
              disabled={isOpening}
            >
              {/* Thumbnail */}
              <View style={s.thumbWrap}>
                {thumb ? (
                  <Image
                    source={{ uri: thumb }}
                    style={s.thumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[s.thumb, s.thumbPlaceholder, { backgroundColor: C.bg }]}>
                    <Ionicons name="play-circle-outline" size={32} color={C.textMut} />
                  </View>
                )}

                {/* Play overlay */}
                <View style={s.playOverlay} pointerEvents="none">
                  {isOpening ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="play-circle" size={44} color="rgba(255,255,255,0.92)" />
                  )}
                </View>

                {/* YouTube badge */}
                <View style={s.ytBadge} pointerEvents="none">
                  <Ionicons name="logo-youtube" size={13} color="#FF0000" />
                  <Text style={s.ytBadgeText}>YouTube</Text>
                </View>
              </View>

              {/* Info */}
              <View style={s.cardBody}>
                <Text style={[s.cardTitle, { color: C.text }]} numberOfLines={2}>
                  {tuto.title}
                </Text>
                {tuto.description ? (
                  <Text style={[s.cardDesc, { color: C.textSec }]} numberOfLines={2}>
                    {tuto.description}
                  </Text>
                ) : null}

                <View style={s.cardFooter}>
                  <View style={[s.watchTag, { backgroundColor: C.tag }]}>
                    <Ionicons name="play" size={11} color={C.tagText} />
                    <Text style={[s.watchTagText, { color: C.tagText }]}>Regarder</Text>
                  </View>
                  <Ionicons name="open-outline" size={14} color={C.textMut} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ── STYLES ────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) {
  return StyleSheet.create({
    root:  { flex: 1 },
    scroll: { paddingHorizontal: 16 },

    /* Top bar */
    topBar: {
      position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
      flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12,
      borderBottomWidth: 1,
      elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    topSide:   { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    topCenter: { flex: 1, alignItems: "center" },
    topTitle:  { fontFamily: "NexaBold", fontSize: 17 },

    /* Hero */
    hero: {
      flexDirection: "row", alignItems: "center", gap: 14,
      borderRadius: 20, padding: 20, marginBottom: 16,
      elevation: 4, shadowColor: "#0035C5", shadowOpacity: 0.3,
      shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    },
    heroIconWrap: {
      width: 56, height: 56, borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center", justifyContent: "center",
    },
    heroTitle: { fontFamily: "NexaBold", fontSize: 17, color: "#FFFFFF", marginBottom: 2 },
    heroSub:   { fontFamily: "NexaLight", fontSize: 12, color: "rgba(255,255,255,0.78)" },

    /* Search */
    searchWrap: {
      flexDirection: "row", alignItems: "center",
      borderRadius: 16, borderWidth: 1,
      paddingHorizontal: 14, paddingVertical: ios ? 12 : 10,
      marginBottom: 20,
    },
    searchInput: {
      flex: 1, fontFamily: "NexaLight", fontSize: 14,
    },

    /* Loading / Empty */
    loadingWrap: { paddingTop: 60, alignItems: "center" },
    emptyWrap:   { paddingTop: 50, alignItems: "center", gap: 10 },
    emptyTitle:  { fontFamily: "NexaBold", fontSize: 18, marginTop: 8 },
    emptySub:    { fontFamily: "NexaLight", fontSize: 13, textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },

    /* Card */
    card: {
      borderRadius: 20, borderWidth: 1,
      marginBottom: 16, overflow: "hidden",
      elevation: 3, shadowColor: "#000", shadowOpacity: 0.06,
      shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
    },

    /* Thumbnail */
    thumbWrap:        { position: "relative", width: "100%", height: 190 },
    thumb:            { width: "100%", height: "100%" },
    thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
    playOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center", justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.22)",
    },
    ytBadge: {
      position: "absolute", bottom: 10, right: 10,
      flexDirection: "row", alignItems: "center", gap: 4,
      backgroundColor: "rgba(255,255,255,0.92)",
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    ytBadgeText: { fontFamily: "NexaBold", fontSize: 10, color: "#1A1A1A" },

    /* Card body */
    cardBody:   { padding: 14 },
    cardTitle:  { fontFamily: "NexaBold", fontSize: 15, lineHeight: 21, marginBottom: 4 },
    cardDesc:   { fontFamily: "NexaLight", fontSize: 13, lineHeight: 19, marginBottom: 10 },

    cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    watchTag: {
      flexDirection: "row", alignItems: "center", gap: 5,
      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    },
    watchTagText: { fontFamily: "NexaBold", fontSize: 12 },
  });
}
