import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";

type CompanyCardProps = {
  name: string;
  description: string;
  logo: string;
  onPress: () => void;
};

const CompanyCard = ({ name, description, logo, onPress }: CompanyCardProps) => {
  return (
    <LinearGradient
      colors={["#302E99", "#3906C7"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Image source={{ uri: logo }} style={styles.logo} contentFit="cover"
  transition={200} />

        <View style={{ flex: 1 }}>
          <ThemedText style={styles.name}>{name}</ThemedText>
          <ThemedText style={styles.description} numberOfLines={2}>
            {description}
          </ThemedText>
        </View>
      </View>

      {/* FOOTER */}
      <TouchableOpacity style={styles.readMoreBtn} onPress={onPress}>
        <ThemedText style={styles.readMoreText}>Lire plus</ThemedText>
        <Ionicons name="arrow-forward" size={18} color="white" />
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default CompanyCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 15,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 5 },
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  logo: {
    width: 55,
    height: 55,
    borderRadius: 12,
    backgroundColor: "white",
  },

  name: {
    color: "white",
    fontSize: 18,
    fontFamily: "InterSemiBold",
  },

  description: {
    color: "#E0E0E0",
    fontSize: 13,
    marginTop: 4,
  },

  readMoreBtn: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
  },

  readMoreText: {
    color: "white",
    fontFamily: "InterSemiBold",
  },
});
