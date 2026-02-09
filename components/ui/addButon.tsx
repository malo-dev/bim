import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { BlurView } from "expo-blur";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import HeaderOFpage from "@/components/ui/headerHome";

/* ================================================= */
/* ACTION BUTTON */
/* ================================================= */

type ActionButtonProps = {
  title: string;
  icon: React.ComponentProps<typeof FontAwesome6>["name"];
  color?: string;
  glass?: boolean;
};

const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  icon,
  color = "#000",
  glass = false,
}: ActionButtonProps) => {
  const Content = () => (
    <View style={styles.btnContent}>
      <View style={[styles.iconCircle, { backgroundColor: color + "25" }]}>
        <FontAwesome6 name={icon} size={22} color={color} />
      </View>

      <ThemedText style={styles.actionText}>{title}</ThemedText>
    </View>
  );

  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.btnWrapper}>
      {glass ? (
        <BlurView intensity={40} tint="light" style={styles.glassBtn}>
          <Content />
        </BlurView>
      ) : (
        <View style={styles.normalBtn}>
          <Content />
        </View>
      )}
    </TouchableOpacity>
  );
};

/* ================================================= */
/* HOME SCREEN */
/* ================================================= */

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <HeaderOFpage />

        {/* Quick Actions */}
        <View style={styles.smallCard}>
          <ActionButton title="Retrait" icon="money-bill-transfer" color="#FF6B6B" glass />
          <ActionButton title="Recharge" icon="circle-plus" color="#4D96FF" glass />
          <ActionButton title="Transfert" icon="right-left" color="#FFD93D" glass />
          <ActionButton title="QR Code" icon="qrcode" color="#6BCB77" glass />
          <ActionButton title="Support" icon="headset" color="#845EC2" glass />
          <ActionButton title="FAQs" icon="circle-question" color="#F9A826" glass />
        </View>

        {/* Main Section */}
        <ThemedView style={styles.mainCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Explorez les Secteurs BIM Récents
          </ThemedText>

          <View style={styles.grid}>
            <ActionButton title="BIM Santé" icon="hand-holding-medical" color="#FF6B6B" />
            <ActionButton title="BIM Énergies" icon="bolt" color="#FFD93D" />
            <ActionButton title="BIM Gaz" icon="fire-flame-simple" color="#FF7F50" />
            <ActionButton title="BIM Hôtellerie" icon="hotel" color="#6BCB77" />
            <ActionButton title="BIM Carburant" icon="gas-pump" color="#4D96FF" />
            <ActionButton title="BIM Transport" icon="bus" color="#00B4D8" />
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================================================= */
/* STYLES */
/* ================================================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },

  /* SMALL CARD */
  smallCard: {
    marginHorizontal: 20,
    marginTop: -30,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    elevation: 6,
  },

  /* MAIN CARD */
  mainCard: {
    marginTop: 25,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    elevation: 4,
  },

  sectionTitle: {
    marginBottom: 18,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  /* BUTTONS */

  btnWrapper: {
    width: "30%",
    marginBottom: 14,
  },

  glassBtn: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  normalBtn: {
    backgroundColor: "#F2F4F8",
    borderRadius: 18,
  },

  btnContent: {
    alignItems: "center",
    paddingVertical: 14,
    gap: 8,
  },

  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },

  actionText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
