import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/app/_layout";
import { useGetUserRidesQuery } from "@/services/rideService";

const LIGHT = {
  bg: "#F8FAFC", primary: "#0062FF", text: "#0F172A", textSub: "#475569", textMut: "#64748B",
  glass: "#FFFFFF", glassBord: "#E2E8F0", green: "#10B981", red: "#EF4444", canvas: "#EEF2F8",
  iconBtnBg: "rgba(0,98,255,0.08)", iconBtnBord: "rgba(0,98,255,0.15)",
};
const DARK: typeof LIGHT = {
  bg: "#0B1220", primary: "#3D7DFF", text: "#EAF0FF", textSub: "#A3B4D0", textMut: "#6B7A99",
  glass: "#1A2540", glassBord: "#1F2A44", green: "#34D399", red: "#F87171", canvas: "#0F1A2E",
  iconBtnBg: "rgba(61,125,255,0.14)", iconBtnBord: "rgba(61,125,255,0.22)",
};

const STATUS_META: Record<string, { label: string; color: keyof typeof LIGHT }> = {
  completed: { label: "Terminée", color: "green" },
  cancelled: { label: "Annulée", color: "red" },
  searching: { label: "Recherche…", color: "primary" },
  accepted: { label: "En cours", color: "primary" },
  arriving: { label: "En cours", color: "primary" },
  in_progress: { label: "En cours", color: "primary" },
};

export default function HistoriqueCoursesScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const router = useRouter();

  const { data, isLoading, refetch, isFetching } = useGetUserRidesQuery({ page: 1, pageSize: 30 });
  const rides = data?.data ?? [];

  const reorder = (ride: any) => {
    router.push({
      pathname: "/transport/choix-gamme",
      params: { pickup: "Votre position actuelle", destination: ride.destinationAddress, tier: ride.vehicleTier },
    } as any);
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.title}>Mes courses</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(r: any) => String(r.rideId)}
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
          onRefresh={refetch}
          refreshing={isFetching}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Ionicons name="car-outline" size={32} color={C.textMut} />
              <Text style={s.emptyText}>Aucune course pour le moment</Text>
            </View>
          }
          renderItem={({ item }) => {
            const meta = STATUS_META[item.status] ?? STATUS_META.completed;
            const date = new Date(item.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
            return (
              <View style={s.rideCard}>
                <View style={s.rideTopRow}>
                  <View style={[s.statusChip, { backgroundColor: `${C[meta.color]}18` }]}>
                    <Text style={[s.statusChipText, { color: C[meta.color] }]}>{meta.label}</Text>
                  </View>
                  <Text style={s.rideDate}>{date}</Text>
                  <Text style={s.ridePrice}>{Number(item.finalFare ?? item.estimatedFare ?? 0).toFixed(2)} EC</Text>
                </View>

                <View style={s.rideRoute}>
                  <View style={s.routeDots}>
                    <View style={[s.dot, { backgroundColor: C.primary }]} />
                    <View style={s.routeLine} />
                    <View style={[s.dot, { backgroundColor: C.text, borderRadius: 2 }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rideAddr} numberOfLines={1}>{item.pickupAddress}</Text>
                    <View style={{ height: 10 }} />
                    <Text style={s.rideAddr} numberOfLines={1}>{item.destinationAddress}</Text>
                  </View>
                </View>

                {item.status === "completed" && (
                  <TouchableOpacity style={s.reorderBtn} onPress={() => reorder(item)}>
                    <Ionicons name="refresh" size={14} color="#fff" />
                    <Text style={s.reorderText}>Commander à nouveau</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

function mkS(C: typeof LIGHT) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.iconBtnBg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.iconBtnBord },
  title: { fontFamily: "NexaBold", fontSize: 16, color: C.text },

  emptyBox: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 10 },
  emptyText: { fontFamily: "NexaLight", fontSize: 13, color: C.textMut },

  rideCard: { backgroundColor: C.glass, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.glassBord, gap: 12 },
  rideTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusChip: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  statusChipText: { fontFamily: "NexaBold", fontSize: 10 },
  rideDate: { fontFamily: "NexaLight", fontSize: 11, color: C.textMut, flex: 1 },
  ridePrice: { fontFamily: "NexaBold", fontSize: 14, color: C.text },

  rideRoute: { flexDirection: "row", gap: 12 },
  routeDots: { alignItems: "center", paddingTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  routeLine: { width: 1, flex: 1, backgroundColor: C.glassBord, marginVertical: 2, minHeight: 12 },
  rideAddr: { fontFamily: "NexaBold", fontSize: 12.5, color: C.text },

  reorderBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 10 },
  reorderText: { fontFamily: "NexaBold", fontSize: 12, color: "#fff" },
}); }
