/**
 * Mon réseau BIM NEXT (design BIM NEXT) : secteurs partenaires, recherche, à la une + liste paginée.
 */
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import { BimIcon } from "@/components/bim/icons";
import { useTh } from "@/components/bim/theme";
import { Appear, BimBackground, EmptyState, Header, PressScale, SectionLabel, T } from "@/components/bim/ui";
import { setSectors } from "@/services/globalApi";
import { useGetAllSectorsQuery } from "@/services/sectorsServices";

const SECTOR_IMG_MAP: [string, string][] = [
  ["immobilier",   "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80"],
  ["technolog",    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80"],
  ["informatique", "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80"],
  ["alimentaire",  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"],
  ["epicerie",     "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"],
  ["restaurant",   "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80"],
  ["agriculture",  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&q=80"],
  ["transport",    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80"],
  ["logistique",   "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&q=80"],
  ["sante",        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80"],
  ["medic",        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80"],
  ["pharma",       "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80"],
  ["finance",      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80"],
  ["banque",       "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80"],
  ["mode",         "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80"],
  ["vetement",     "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80"],
  ["beaute",       "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80"],
  ["education",    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80"],
  ["sport",        "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&q=80"],
  ["loisir",       "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&q=80"],
  ["energie",      "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&q=80"],
  ["gaz",          "https://images.unsplash.com/photo-1518704618243-b719e5d5f2b8?w=400&q=80"],
  ["carburant",    "https://images.unsplash.com/photo-1545262810-77515befe149?w=400&q=80"],
  ["petrole",      "https://images.unsplash.com/photo-1545262810-77515befe149?w=400&q=80"],
  ["construction", "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80"],
  ["artisanat",    "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&q=80"],
  ["tourisme",     "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80"],
  ["hotel",        "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=400&q=80"],
  ["media",        "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80"],
];
const IMG_DEFAULT = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80";

function getSectorImage(name: string): string {
  const n = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [k, url] of SECTOR_IMG_MAP) {
    if (n.includes(k)) return url;
  }
  return IMG_DEFAULT;
}

function getSectorLabel(name: string): string {
  const n = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (n.includes("sante") || n.includes("medic") || n.includes("pharma")) return "Secteur Prioritaire";
  if (n.includes("transport") || n.includes("logistique"))                 return "Mobilité";
  if (n.includes("gaz") || n.includes("energie") || n.includes("carburant") || n.includes("petrole")) return "Énergie";
  if (n.includes("finance") || n.includes("banque"))                       return "Finance";
  if (n.includes("technolog") || n.includes("informatique"))               return "Innovation";
  if (n.includes("immobilier"))                                             return "Immobilier";
  if (n.includes("alimentaire") || n.includes("restaurant") || n.includes("epicerie")) return "Alimentation";
  if (n.includes("tourisme") || n.includes("hotel"))                       return "Tourisme";
  if (n.includes("education"))                                              return "Éducation";
  if (n.includes("sport") || n.includes("loisir"))                         return "Sport & Loisirs";
  if (n.includes("construction"))                                           return "Construction";
  if (n.includes("mode") || n.includes("vetement"))                        return "Mode";
  if (n.includes("agriculture"))                                            return "Agriculture";
  return "Secteur";
}

interface Sector { businessId: number; name: string; description?: string; logo?: string; companies?: any[] }

export default function Reseaux() {
  const th = useTh();
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const search = ""; // liste simple : pas de recherche
  const [page, setPage] = useState(1);
  const [list, setList] = useState<Sector[]>([]);
  const first = useRef(true);
  const { data, isLoading, isFetching, refetch } = useGetAllSectorsQuery({ page, pageSize: 10, search, paginate: true });


  useEffect(() => {
    if (!data?.data) return;
    if (first.current) { setList(data.data); first.current = false; }
    else setList((prev) => { const ids = new Set(prev.map((s) => s.businessId)); return [...prev, ...data.data.filter((s: Sector) => !ids.has(s.businessId))]; });
  }, [data]);

  const loadMore = useCallback(() => { if (data?.totalPages && page < data.totalPages && !isFetching) setPage((p) => p + 1); }, [data, page, isFetching]);
  const go = useCallback((item: Sector) => {
    const n = (item?.name ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (n.includes("transport")) { router.push(`/transport/${item.businessId}` as any); return; }
    dispatch(setSectors([item]));
    router.push(`/service/${item.businessId}` as any);
  }, [dispatch, router]);

  const header = (
    <View>
      <Header title="Mon réseau" onBack={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as any))} />
      <Appear kind="rise" delay={60}>
        <T style={{ marginTop: 22 }}><T w="light" size={30} style={{ lineHeight: 35 }}>Le réseau{"\n"}</T><T w="bold" size={30} style={{ lineHeight: 35 }}>BIM NEXT</T></T>
        <T size={14} color={th.muted} style={{ marginTop: 6 }}>{data?.total ?? list.length} réseau{(data?.total ?? list.length) > 1 ? "x" : ""} disponible{(data?.total ?? list.length) > 1 ? "s" : ""}</T>
      </Appear>
      <SectionLabel style={{ marginTop: 20, marginBottom: 10 }}>RÉSEAUX DISPONIBLES</SectionLabel>
    </View>
  );

  return (
    <BimBackground>
      <FlatList
        data={list}
        keyExtractor={(s) => String(s.businessId)}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingTop: 28 + insets.top, paddingHorizontal: 20, paddingBottom: 40 + insets.bottom, gap: 8, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={!isLoading && isFetching && page === 1} onRefresh={() => { first.current = true; setPage(1); refetch(); }} tintColor={th.fg} />}
        ListEmptyComponent={isLoading ? <EmptyState loading title="Chargement…" /> : <EmptyState icon="users" title="Aucun réseau disponible pour le moment" />}
        renderItem={({ item, index }) => {
          const count = item.companies?.length ?? 0;
          return (
            <Appear kind="rise" delay={Math.min(index, 6) * 50}>
              <PressScale scaleTo={0.97} onPress={() => go(item)} accessibilityLabel={item.name}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 22, backgroundColor: th.glassFill(0.12), borderWidth: 1, borderColor: th.glass(0.18), boxShadow: th.glassFx }}>
                <Image source={{ uri: getSectorImage(item.name) }} style={{ width: 58, height: 58, borderRadius: 16 }} contentFit="cover" transition={250} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T w="bold" size={15} numberOfLines={1}>{item.name}</T>
                  <T size={12} color={th.muted} numberOfLines={1}>{item.description || getSectorLabel(item.name)}</T>
                  <T size={12} color={th.muted} style={{ marginTop: 2 }}>{count} entreprise{count > 1 ? "s" : ""}</T>
                </View>
                <BimIcon name="chevron" size={18} color={th.muted} />
              </PressScale>
            </Appear>
          );
        }}
      />
    </BimBackground>
  );
}
