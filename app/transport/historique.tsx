/**
 * Mes courses en taxi (design BIM NEXT) : historique, statut, trajet, prix, « Commander à nouveau ».
 */
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BimIcon } from "@/components/bim/icons";
import { ec, useTh } from "@/components/bim/theme";
import { Appear, BimBackground, EmptyState, Header, PressScale, StatusPill, T } from "@/components/bim/ui";
import { useGetAllSectorsQuery } from "@/services/sectorsServices";
import { useGetUserRidesQuery } from "@/services/rideService";

const STATUS: Record<string, { label: string; color: string }> = {
  completed: { label: "Terminée", color: "#22C55E" },
  cancelled: { label: "Annulée", color: "#FF5A66" },
  searching: { label: "Recherche…", color: "#F5C518" },
  accepted: { label: "En cours", color: "#38B6FF" },
  arriving: { label: "En cours", color: "#38B6FF" },
  in_progress: { label: "En cours", color: "#38B6FF" },
};

export default function HistoriqueCoursesScreen() {
  const th = useTh();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isFetching, refetch } = useGetUserRidesQuery({ page: 1, pageSize: 30 });
  const { data: sectors } = useGetAllSectorsQuery({});
  const transport = (sectors?.data ?? sectors ?? []).find?.((s: any) => /transport|taxi/i.test(s?.name ?? ""));
  const taxiHref = `/transport/${transport?.businessId ?? transport?.sectorId ?? 2}`;
  const rides: any[] = data?.data ?? [];

  return (
    <BimBackground>
      <FlatList
        data={isLoading ? [] : rides}
        keyExtractor={(r) => String(r.rideId)}
        contentContainerStyle={{ paddingTop: 28 + insets.top, paddingHorizontal: 20, paddingBottom: 40 + insets.bottom, gap: 10, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={!isLoading && isFetching} onRefresh={() => { refetch(); }} tintColor={th.fg} />}
        ListHeaderComponent={<View style={{ marginBottom: 8 }}><Header title="Mes courses" onBack={() => router.back()} /></View>}
        ListEmptyComponent={isLoading ? <EmptyState loading title="Chargement…" /> :
          <EmptyState icon="car" title="Aucune course pour le moment" text="Tes courses en taxi apparaîtront ici." action={{ label: "Commander un taxi", onPress: () => router.push(taxiHref as any) }} />}
        renderItem={({ item: r, index }) => {
          const st = STATUS[r.status] ?? STATUS.completed;
          const date = new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
          return (
            <Appear kind="rise" delay={Math.min(index, 6) * 50}>
              <View style={{ padding: 14, borderRadius: 24, backgroundColor: th.glassFill(0.12), borderWidth: 1, borderColor: th.glass(0.2), boxShadow: th.glassFx }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: th.ink, alignItems: "center", justifyContent: "center" }}>
                    <BimIcon name="car" size={19} color={th.onInk} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <StatusPill label={st.label} color={st.color} />
                    <T size={12} color={th.muted} style={{ marginTop: 3 }}>{date}</T>
                  </View>
                  <T w="bold" size={17}>{ec(r.finalFare ?? r.estimatedFare)} <T w="light" size={13}>EC</T></T>
                </View>
                <View style={{ marginTop: 12, flexDirection: "row", gap: 12 }}>
                  <View style={{ alignItems: "center", paddingTop: 4 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: th.fg }} />
                    <View style={{ width: 2, flex: 1, minHeight: 18, backgroundColor: th.glass(0.3), marginVertical: 3 }} />
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: th.knob }} />
                  </View>
                  <View style={{ flex: 1, gap: 12 }}>
                    <T size={14} numberOfLines={1}>{r.pickupAddress || "Point de départ"}</T>
                    <T w="bold" size={14} numberOfLines={1}>{r.destinationAddress || "Destination"}</T>
                  </View>
                </View>
                {r.status === "completed" && (
                  <PressScale onPress={() => router.push(taxiHref as any)} accessibilityLabel="Commander à nouveau"
                    style={{ marginTop: 12, height: 42, borderRadius: 21, backgroundColor: th.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <BimIcon name="route" size={16} color={th.onAccent} strokeWidth={2} />
                    <T w="bold" size={14} color={th.onAccent}>Commander à nouveau</T>
                  </PressScale>
                )}
              </View>
            </Appear>
          );
        }}
      />
    </BimBackground>
  );
}
