/**
 * Mes favoris (design BIM NEXT) : grille de produits en verre, recherche, retrait d'un favori.
 */
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL_BASE } from "@/constants/api";
import { BimIcon } from "@/components/bim/icons";
import { fallbackArt } from "@/components/bim/illustrations";
import { orderType } from "@/components/bim/orders";
import { F, ec, useTh } from "@/components/bim/theme";
import { Appear, BimBackground, EmptyState, Header, PressScale, ProductArt, T } from "@/components/bim/ui";
import { useGetUserFavoritesQuery, useToggleFavoriteMutation } from "@/services/favoriteService";

const img = (u?: string) => (!u ? null : u.startsWith("http") ? u : `${API_URL_BASE}${u}`);
const price = (p: any) => { const b = parseFloat(p.price ?? 0); const r = parseFloat(p.reduction ?? 0); return r > 0 && r <= 100 ? b * (1 - r / 100) : b; };
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Où ouvrir un produit favori : les 3 catégories BIM vont au parcours de commande. */
function route(p: any): string {
  const sector = norm(p.company?.category?.name ?? ""); const co = norm(p.company?.name ?? ""); const name = norm(p.name ?? "");
  const id = p.companyId ?? p.company?.companyId;
  if (sector.includes("gaz") || co.includes("gaz") || co.includes("gpl")) return "/commande/gaz";
  if (sector.includes("carburant") || sector.includes("station") || co.includes("station")) return "/commande/carburant";
  if (sector.includes("eau") || name.includes("bonbonne") || name.includes("eau")) return "/commande/eau";
  if (sector.includes("sante") || co.includes("clinique")) return `/sante/${id}`;
  if (sector.includes("supermarche") || sector.includes("epicerie")) return `/bim-supermarche/${id}`;
  if (sector.includes("hotel")) return `/hotellerie/${id}`;
  if (sector.includes("transport")) return `/transport/${id}`;
  return `/service/${id}`;
}

export default function FavoritesScreen() {
  const th = useTh();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGetUserFavoritesQuery(undefined, { refetchOnMountOrArgChange: true });
  const [toggleFav] = useToggleFavoriteMutation();
  const products: any[] = useMemo(() => {
    const raw: any[] = data?.data || data || [];
    if (!search) return raw;
    const q = search.toLowerCase();
    return raw.filter((p) => p.name?.toLowerCase().includes(q) || p.company?.name?.toLowerCase().includes(q));
  }, [data, search]);

  return (
    <BimBackground>
      <FlatList
        data={isLoading ? [] : products}
        numColumns={2}
        keyExtractor={(p) => String(p.productId)}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ paddingTop: 28 + insets.top, paddingHorizontal: 20, paddingBottom: 40 + insets.bottom, gap: 10, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ marginBottom: 6 }}>
            <Header title="Mes favoris" onBack={() => router.back()} />
            <T size={13} color={th.muted} style={{ marginTop: 10, textAlign: "center" }}>{isLoading ? "Chargement…" : `${products.length} produit${products.length > 1 ? "s" : ""}`}</T>
            <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10, height: 52, borderRadius: 26, paddingHorizontal: 16,
              backgroundColor: th.glassFill(0.12), borderWidth: 1, borderColor: th.glass(0.22), boxShadow: th.glassFx }}>
              <BimIcon name="search" size={18} color={th.muted} />
              <TextInput value={search} onChangeText={setSearch} placeholder="Rechercher dans mes favoris" placeholderTextColor={th.glass(0.55)}
                accessibilityLabel="Rechercher dans mes favoris" style={{ flex: 1, color: th.fg, fontFamily: F.regular, fontSize: 15, includeFontPadding: false }} />
            </View>
          </View>
        }
        ListEmptyComponent={isLoading ? <EmptyState loading title="Chargement de tes favoris…" /> :
          <EmptyState icon="heart" title="Aucun favori pour l'instant" text="Touche le cœur d'un produit pour le retrouver ici." action={{ label: "Commander", onPress: () => router.push("/commande" as any) }} />}
        renderItem={({ item: p, index }) => {
          const r = parseFloat(p.reduction ?? 0);
          const uri = img(p.imageUrl);
          return (
            <Appear kind="rise" delay={Math.min(index, 6) * 50} style={{ flex: 1 }}>
              <PressScale scaleTo={0.96} onPress={() => router.push(route(p) as any)} accessibilityLabel={p.name}
                style={{ flex: 1, padding: 12, borderRadius: 24, backgroundColor: th.glassFill(0.12), borderWidth: 1, borderColor: th.glass(0.2), boxShadow: th.glassFx }}>
                <View style={{ height: 110, borderRadius: 18, backgroundColor: th.glass(0.12), alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {uri ? <Image source={{ uri }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} contentFit="cover" contentPosition="center" transition={200} /> : <ProductArt xml={fallbackArt(orderType(p.name), p.name)} size={92} />}
                  {r > 0 && r <= 100 && (
                    <View style={{ position: "absolute", top: 8, left: 8, paddingHorizontal: 8, height: 22, borderRadius: 11, backgroundColor: th.knob, justifyContent: "center" }}>
                      <T w="bold" size={11} color="#FFFFFF">−{Math.round(r)} %</T>
                    </View>
                  )}
                  <PressScale onPress={() => toggleFav(p.productId)} accessibilityLabel="Retirer des favoris" hitSlop={8}
                    style={{ position: "absolute", top: 6, right: 6, width: 34, height: 34, borderRadius: 17, backgroundColor: th.navBg, alignItems: "center", justifyContent: "center" }}>
                    <BimIcon name="heart" size={16} color="#FF5A66" strokeWidth={2.2} />
                  </PressScale>
                </View>
                <T w="bold" size={14} numberOfLines={2} style={{ marginTop: 10, minHeight: 36 }}>{p.name}</T>
                {!!p.company?.name && <T size={11} color={th.muted} numberOfLines={1}>{p.company.name}</T>}
                <View style={{ marginTop: 6, flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                  <T w="bold" size={15}>{ec(price(p))} EC</T>
                  {r > 0 && r <= 100 && <T size={11} color={th.muted} style={{ textDecorationLine: "line-through" }}>{ec(p.price)}</T>}
                </View>
              </PressScale>
            </Appear>
          );
        }}
      />
    </BimBackground>
  );
}
