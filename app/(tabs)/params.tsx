import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useLogOutMutation } from "@/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Params() {
  const router = useRouter();
const [logOut, { isLoading }] = useLogOutMutation();

  // États pour le mode sombre et la langue
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState("fr"); // 'fr' ou 'en'

  // Menu items
  const menuItems = [
    { id: "support", title: "Support", icon: "help-circle-outline", onPress: () => router.push("/support") },
    { id: "profile", title: "Profil", icon: "person-outline", onPress: () => router.push("/profile") },
    { id: "notifications", title: "Notifications", icon: "notifications-outline", onPress: () => router.push("/notification") },
    { id: "history", title: "Historique des transactions", icon: "time-outline", onPress: () => router.push("/history") },
    { id: "terms", title: "Termes d'utilisation", icon: "document-text-outline", onPress: () => router.push("/terms") },
    { id: "about", title: "À propos de BIM", icon: "information-circle-outline", onPress: () => router.push("/apropos") },
  ];

 const handleLogout = async () => {
 

  try {
    const email = await AsyncStorage.getItem("email");
 
    const res = await logOut({email:String(email)});
    if(res){
        await AsyncStorage.clear();
         if (email) {
      await AsyncStorage.setItem("email", email);
    }
    router.replace("/login");
    }
    

   

  } catch (err) {
    const dataMess = err as any;
    Alert.alert(dataMess?.data?.error || "Une erreur est survenue");
    console.error(err);
  }
};

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? "#1E1E1E" : "#F5F6FA" }]}>
      {/* HEADER */}
      <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>
        <Text style={styles.headerTitle}>Paramètres</Text>
      </LinearGradient>

      {/* PROFIL + SWITCH */}
      <View style={styles.topSettings}>
        {/* Langue */}
        <View style={styles.settingRow}>
          <Text style={[styles.settingText, { color: isDarkMode ? "#fff" : "#302E99" }]}>Langue</Text>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLanguage(language === "fr" ? "en" : "fr")}
          >
            <Text style={styles.langText}>{language === "fr" ? "Français" : "English"}</Text>
          </TouchableOpacity>
        </View>

        {/* Mode sombre */}
        <View style={styles.settingRow}>
          <Text style={[styles.settingText, { color: isDarkMode ? "#fff" : "#302E99" }]}>Mode sombre</Text>
          <Switch
            value={isDarkMode}
            onValueChange={setIsDarkMode}
            thumbColor={isDarkMode ? "#3906C7" : "#f4f3f4"}
            trackColor={{ false: "#ccc", true: "#6A5ACD" }}
          />
        </View>
      </View>

      {/* MENU */}
      <View style={styles.menuWrapper}>
        {menuItems.map((item:any) => (
          <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress}>
            <BlurView intensity={80} tint={isDarkMode ? "dark" : "light"} style={styles.blurCard}>
              <View style={styles.menuRow}>
                <Ionicons name={item.icon} size={24} color={isDarkMode ? "#fff" : "#302E99"} />
                <Text style={[styles.menuText, { color: isDarkMode ? "#fff" : "#302E99" }]}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#aaa" : "#888"} />
              </View>
            </BlurView>
          </TouchableOpacity>
        ))}

        {/* BOUTON DE DÉCONNEXION */}
         <View style={{marginTop:10}}>
             
                        <GradientButton
                        isLoad={isLoading}
                                 title="Deconnection"
                                 onPress={handleLogout}
                                 leftIcon={<ArrowIcon width={20} height={14} color="#3906C7" />}
                                 rightIcon={<ArrowRightIcon width={30} height={24} />}
                               />
                   </View>
      </View>
       <View style={{height:170}}/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
  },

  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
  },

  topSettings: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
  },

  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  settingText: {
    fontSize: 16,
    fontWeight: "600",
  },

  langBtn: {
    backgroundColor: "#EEE",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 14,
  },

  langText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#302E99",
  },

  menuWrapper: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  menuItem: {
    marginBottom: 15,
  },

  blurCard: {
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 20,
    overflow: "hidden",
  },

  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  menuText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    fontWeight: "600",
  },

  logoutBtn: {
    marginTop: 30,
    backgroundColor: "#FF4D4D",
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
  },

  logoutText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});
