import React, { useState, useEffect } from "react";
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/themed-text";
import { useGetAllNotificationsQuery } from "@/services/notificationService";
import HomeSkeleton from "@/components/skeleton/HomeSkeleton";
import NotFound from "@/components/ui/noData";

export default function NotificationPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const storedId = await AsyncStorage.getItem("userId");
     
      if (storedId) setUserId(storedId);
    };
    fetchUserId();
  }, []);


  const { data, isLoading, isFetching, refetch } = useGetAllNotificationsQuery(
    userId
      ? { userId, search, page, pageSize: 20 }
      : null,
    { skip: !userId } 
  );

  const notifications = data?.data || [];
  const totalPages = data?.totalPages || 1;

  useEffect(() => {
    setPage(1);
  }, [search]);

  const loadMore = () => {
    if (!isFetching && page < totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <View style={styles.container}>
     
      <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Notifications</ThemedText>
        </View>
        <ThemedText style={styles.headerSubtitle}>Toutes vos notifications BIM</ThemedText>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#777" />
          <TextInput
            placeholder="Rechercher une notification..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              refetch();
            }}
            style={styles.input}
          />
        </View>
      </LinearGradient>

  
      {isLoading ? (
        <HomeSkeleton />
      ) : notifications.length === 0 ? (
        <NotFound  />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.notificationId.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetching ? <HomeSkeleton /> : null}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.notificationCard,
                { backgroundColor: item.isRead ? "#F0F0F0" : "#E6F0FF" },
              ]}
            >
              <ThemedText
                style={[
                  styles.notificationTitle,
                  { fontWeight: item.isRead ? "400" : "700" },
                ]}
              >
                {item.title}
              </ThemedText>
              <ThemedText style={styles.notificationMessage}>{item.message}</ThemedText>
              <ThemedText style={styles.notificationDate}>
                {new Date(item.createdAt || item.date).toLocaleString()}
              </ThemedText>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  backButton: { marginRight: 15, padding: 5 },
  headerTitle: { color: "white", fontSize: 26, fontFamily: "InterSemiBold" },
  headerSubtitle: { color: "#DDD", marginBottom: 20 },
  searchBox: { backgroundColor: "white", borderRadius: 14, paddingHorizontal: 15, height: 50, flexDirection: "row", alignItems: "center" },
  input: { marginLeft: 10, flex: 1, color: "#000" },
  list: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  notificationCard: { borderRadius: 20, padding: 15, marginBottom: 15 },
  notificationTitle: { fontSize: 16, color: "#111", marginBottom: 5 },
  notificationMessage: { fontSize: 14, color: "#555", marginBottom: 5 },
  notificationDate: { fontSize: 12, color: "#888" },
});
