import { sectors } from "@/assets/mockdata/slidersOnboarding.mock";
import NoData from "@/components/ui/noData";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ServiceDetails() {


  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [searchText, setSearchText] = useState(""); // État pour la recherche

const gotToSelectedMenu = (value: string, id: string) => {
  switch (value) {
    case 'BIM Santé':
      router.push(`/sante/${id}`);
      break;

    case 'BIM Transport':
      router.push(`/transport/${id}`);
      break;

    case 'BIM Énergies':
      router.push(`/bim-energie/${id}`);
      break;

    case 'BIM Carburant':
      router.push(`/bim-carburant/${id}`);
      break;

    case 'BIM Hôtellerie':
      router.push(`/hotellerie/${id}`);
      break;

    case 'BIM Gaz':
      router.push(`/bim-gaz/${id}`);
      break;

    // case 'BIM Éducation':
    //   router.push(`/education/${id}`);
    //   break;

    // case 'BIM Commerce':
    //   router.push(`/commerce/${id}`);
    //   break;

    // case 'BIM Agriculture':
    //   router.push(`/agriculture/${id}`);
    //   break;

    // case 'BIM Télécoms':
    //   router.push(`/telecoms/${id}`);
    //   break;

    // case 'BIM Finance':
    //   router.push(`/finance/${id}`);
    //   break;

    // case 'BIM Immobilier':
    //   router.push(`/immobilier/${id}`);
    //   break;

    // case 'BIM Marketing':
    //   router.push(`/marketing/${id}`);
    //   break;

    default:
      console.warn(`Aucune route définie pour la valeur: ${value}`);
      break;
  }
};


  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scaleAnim]);

  const sector = sectors.find((s) => s?.id === id);

  if (!sector) {
    return (
      <View style={styles.center}>
        <Text>Secteur introuvable</Text>
      </View>
    );
  }

  // Filtrer les entreprises selon la recherche par location
  const filteredCompanies = sector.companies.filter((item) =>
    item.location?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* ===== HEADER ===== */}
      <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 50 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

           <Text style={styles.title}>{sector.name}</Text>

          <TouchableOpacity onPress={() => router.push('/notification')}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <Image source={{ uri: sector.logo }} style={styles.headerIcon} />
        {/* <Text style={styles.title}>{sector.name}</Text> */}
        <Text style={styles.subtitle}>{sector.description}</Text>
      </LinearGradient>

      {/* ===== RECHERCHE PAR LOCATION ===== */}
      {sector.companies.length > 0 && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Rechercher par ville..."
            placeholderTextColor="#888"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      )}

      {/* ===== ENTREPRISES ===== */}
      {filteredCompanies.length === 0 ? (
        <View style={styles.center}>
          <NoData />
        </View>
      ) : (
        <FlatList
          data={filteredCompanies}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <BlurView intensity={80} tint="light" style={styles.card}>
              <LinearGradient
                colors={["#302E99", "#3906C7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <Image source={{ uri: item.logo }} style={styles.logo} />

              <View style={{ flex: 1 }}>
                <Text style={styles.companyName}>{item.name}</Text>
                <Text style={styles.companyDesc}>{item.description}</Text>
                <Text style={styles.companyLocation}> <Ionicons name="location-outline" size={14} color="#C0C0C0" /> {item.location}</Text>
              </View>

              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                  onPress={() => gotToSelectedMenu(sector?.name,item?.id)}
                  style={styles.btn}
                >
                  <Ionicons name="arrow-forward-circle-outline" size={28} color="white" />
                </TouchableOpacity>
              </Animated.View>
            </BlurView>
          )}
        />
      )}
    </View>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { paddingTop: 0, paddingBottom: 40, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: "center" },
  headerIcon: { width: 70, height: 70, marginVertical: 10 },
  title: { color: "white", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "white", opacity: 0.9, marginTop: 6, textAlign: "center" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEE",
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  searchInput: { flex: 1, color: "#333" },

  card: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },

  logo: { width: 60, height: 60, borderRadius: 12, backgroundColor: "white" },
  companyName: { color: "white", fontSize: 16, fontWeight: "600" },
  companyDesc: { color: "#E0E0E0", fontSize: 13, marginVertical: 4 },
  companyLocation: { color: "#C0C0C0", fontSize: 12 },

  btn: { backgroundColor: "rgba(255,255,255,0.25)", alignSelf: "flex-start", padding: 10, borderRadius: 12, justifyContent: "center", alignItems: "center" },
});
