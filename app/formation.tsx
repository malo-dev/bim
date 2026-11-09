/**
 * Formation (design BIM NEXT) : tutoriels vidéo YouTube, recherche, ouverture plein écran.
 */
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, TextInput, View } from "react-native";
import { BimIcon } from "@/components/bim/icons";
import { F, useTh } from "@/components/bim/theme";
import { Appear, BimPage, EmptyState, PageTitle, PressScale, T } from "@/components/bim/ui";
import { useGetTutorialsQuery } from "@/services/tutorialService";

function ytId(url: string): string | null {
  for (const re of [/[?&]v=([^&#]+)/, /youtu\.be\/([^?&#]+)/, /\/embed\/([^?&#]+)/]) { const m = url.match(re); if (m) return m[1]; }
  return null;
}
const thumb = (url: string, provided?: string | null) => provided || (ytId(url) ? `https://img.youtube.com/vi/${ytId(url)}/hqdefault.jpg` : null);

export default function Formation() {
  const th = useTh();
  const [search, setSearch] = useState("");
  const [opening, setOpening] = useState<number | null>(null);
  const { data, isLoading, isFetching, refetch } = useGetTutorialsQuery(undefined, { refetchOnFocus: true });
  const tutorials: any[] = data?.tutorials ?? [];
  const list = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? tutorials.filter((t) => t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q)) : tutorials;
  }, [tutorials, search]);

  const open = async (t: any) => {
    try { setOpening(t.id); await WebBrowser.openBrowserAsync(t.youtubeUrl, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN }); }
    catch {} finally { setOpening(null); }
  };

  return (
    <BimPage title="Formation" refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => { refetch(); }} tintColor={th.fg} />}>
      <PageTitle light="Apprends" bold="BIM NEXT en vidéo" text={`${tutorials.length} tutoriel${tutorials.length > 1 ? "s" : ""} pour tout savoir sur l'app.`} />
      <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 10, height: 52, borderRadius: 26, paddingHorizontal: 16,
        backgroundColor: th.glassFill(0.12), borderWidth: 1, borderColor: th.glass(0.22), boxShadow: th.glassFx }}>
        <BimIcon name="search" size={18} color={th.muted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Rechercher une vidéo" placeholderTextColor={th.glass(0.55)} autoCapitalize="none"
          accessibilityLabel="Rechercher une vidéo" style={{ flex: 1, color: th.fg, fontFamily: F.regular, fontSize: 15, includeFontPadding: false }} />
        {!!search && <PressScale onPress={() => setSearch("")} accessibilityLabel="Effacer"><BimIcon name="close" size={16} color={th.muted} /></PressScale>}
      </View>

      {isLoading ? <EmptyState loading title="Chargement…" /> : list.length === 0 ? (
        <EmptyState icon="play" title={search ? "Aucun résultat" : "Aucun tutoriel"} text={search ? `Aucune vidéo pour « ${search} ».` : "Les tutoriels apparaîtront ici dès leur publication."} />
      ) : (
        <View style={{ marginTop: 16, gap: 12 }}>
          {list.map((t, i) => {
            const img = thumb(t.youtubeUrl, t.thumbnailUrl);
            return (
              <Appear key={t.id} kind="rise" delay={Math.min(i, 6) * 60}>
                <PressScale scaleTo={0.97} onPress={() => open(t)} disabled={opening === t.id} accessibilityLabel={`Regarder : ${t.title}`}
                  style={{ borderRadius: 26, overflow: "hidden", backgroundColor: th.glassFill(0.12), borderWidth: 1, borderColor: th.glass(0.2), boxShadow: th.glassFx }}>
                  <View style={{ height: 170, backgroundColor: th.ink, alignItems: "center", justifyContent: "center" }}>
                    {img && <Image source={{ uri: img }} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} contentFit="cover" transition={250} />}
                    <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: th.knob, alignItems: "center", justifyContent: "center", boxShadow: "0 8px 22px rgba(0,0,0,0.35)" }}>
                      {opening === t.id ? <ActivityIndicator color="#FFFFFF" /> : <BimIcon name="play" size={30} color="#FFFFFF" strokeWidth={1.8} />}
                    </View>
                  </View>
                  <View style={{ padding: 14 }}>
                    <T w="bold" size={15} numberOfLines={2}>{t.title}</T>
                    {!!t.description && <T size={13} color={th.muted} numberOfLines={2} style={{ marginTop: 4, lineHeight: 19 }}>{t.description}</T>}
                  </View>
                </PressScale>
              </Appear>
            );
          })}
        </View>
      )}
    </BimPage>
  );
}
