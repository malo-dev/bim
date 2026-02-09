import React from "react";
import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Image, TouchableOpacity, View } from "react-native";
import { formatNumber } from "@/utils/formatNUmber.util";
import { checkAbonnementAndExpiry } from "@/utils/checkAbonnementAndExpiry.util";

/* ================= TYPES ================= */
type HeaderOFpageProps = {
  username?: string;
  avatar?: string;
  soldNumber?:string;
  accountNumber?:string,
  tokenAbonement?:string,
};

/* ================= COMPONENT ================= */
const HeaderOFpage: React.FC<HeaderOFpageProps> = ({
  username = "Utilisateur",

  avatar = "https://www.w3schools.com/howto/img_avatar.png",
  accountNumber,
  soldNumber,
  tokenAbonement
}) => {

  const router = useRouter();

  return (
    <LinearGradient
      colors={["#302E99", "#3906C7"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 60,
      }}
    >
      {/* ===== Profil + Notification ===== */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Avatar */}
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <View
            style={{
              width: 50,
              height: 50,
              backgroundColor: "white",
              borderRadius: 50,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
  source={{
    uri:
      avatar && typeof avatar === "string" && avatar.startsWith("http")
        ? avatar
        : "https://www.w3schools.com/howto/img_avatar.png",
  }}
  style={{
    width: 50,
    height: 50,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#FFD700",
  }}
/>

          </View>
        </TouchableOpacity>

        {/* Username */}
        <ThemedText
          style={{
            color: "white",
            fontSize: 18,
            fontFamily: "InterSemiBold",
          }}
        >
          Hello {username.slice(0,15)} 👋
        </ThemedText>

        {/* Notifications */}
        <TouchableOpacity onPress={() => router.push("/notification")}>
          <Ionicons name="notifications-circle" size={40} color="white" />
        </TouchableOpacity>
      </View>

      {/* ===== Carte BIM ===== */}
      <LinearGradient
        colors={["#4C3AFF", "#302E99"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          marginTop: 30,
          borderRadius: 20,
          padding: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.4,
          shadowRadius: 6,
          elevation: 8,
        }}
      >
        {/* Titre carte */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <ThemedText
            style={{ color: "white", fontSize: 18, fontFamily: "InterSemiBold" }}
          >
            BIM PLATINUM
          </ThemedText>
          <Ionicons name="card" size={28} color="white" />
        </View>

        {/* Numéro */}
        <ThemedText
          style={{
            color: "white",
            fontSize: 20,
            letterSpacing: 2,
            fontFamily: "InterSemiBold",
            marginBottom: 15,
          }}
        >
         { accountNumber ?? '0000....'}
        </ThemedText>

        {/* Expiration + Balance */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <View>
            <ThemedText style={{ color: "white", fontSize: 12 }}>
              EXPIRE
            </ThemedText>
            <TouchableOpacity onPress={() => router.push('/recharge')}>
              <ThemedText
              style={{ color: "white", fontSize: 16, fontFamily: "InterSemiBold" }}
            >
               {checkAbonnementAndExpiry(tokenAbonement ?? '') }
            </ThemedText>
            </TouchableOpacity>
          </View>

          <View>
            <ThemedText style={{ color: "white", fontSize: 12 }}>
              BALANCE DISPONIBLE
            </ThemedText>
            <ThemedText
              style={{ color: "white", fontSize: 16, fontFamily: "InterSemiBold" }}
            >
              {formatNumber(Number(soldNumber) ?? 0)} Ecoins
            </ThemedText>
          </View>
        </View>
      </LinearGradient>
    </LinearGradient>
  );
};

export default HeaderOFpage;
