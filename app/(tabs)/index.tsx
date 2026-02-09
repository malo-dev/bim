import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { BlurView } from "expo-blur";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { default as HeaderOFpage } from "@/components/ui/headerHome";
import HeaderRow from "@/components/ui/headerTextUi";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import Modal from "react-native-modal";
import { useGetUserByIdQuery } from "@/services/userService"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
import HomeSkeleton from "@/components/skeleton/HomeSkeleton";
import { API_URL_BASE } from "@/constants/api";


// const [createNotification] = useCreateNotificationMutation();
type ActionButtonProps = {
  title: string;
  icon: React.ComponentProps<typeof FontAwesome6>["name"];
  color?: string;
  glass?: boolean;
  onPress?: () => void; 
};

const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  icon,
  color = "#000",
  glass = false,
  onPress,
}) => {
  const Content = () => (
    <View style={styles.btnContent}>
      <View style={[styles.iconCircle, { backgroundColor: color + "25" }]}>
        <FontAwesome6 name={icon} size={22} color={color} />
      </View>
      <ThemedText style={styles.actionText}>{title}</ThemedText>
    </View>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.btnWrapper}
      onPress={onPress} // 🔥 ici on passe la fonction
    >
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
  const [userId, setUserId] = useState<string | null>(null);
const [refreshing, setRefreshing] = useState(false);


  const router = useRouter()

const {
  data: user,
  isLoading,
  isFetching,
  isUninitialized,
  isError,
  refetch,
} = useGetUserByIdQuery(userId!, {
  skip: !userId,
});


const onRefresh = async () => {
  try {
    setRefreshing(true);
    await refetch(); // recharge les données
  } catch (error) {
    console.log("Erreur refresh:", error);
  } finally {
    setRefreshing(false);
  }
};


  
    const [openScanner, setOpenScanner] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const [result, setResult] = useState<"success" | "error" | null>(null);
  
   useEffect(() => {
    const loadUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      console.log("USER ID:", id);
      setUserId(id);
    };

    loadUserId();
  }, []);

    useEffect(() => {
      if (!permission?.granted) {
        requestPermission();
      }
    }, [permission?.granted, requestPermission]);
  
   const handleBarcodeScanned = ({ data }: any) => {
    try {
      const parsed = JSON.parse(data);

      if (parsed.userId && parsed.bimAccount) {
        setResult("success");
      } else {
        setResult("error");
      }
    } catch {
      setResult("error");
    }

    setOpenScanner(false);
  };


if (isUninitialized || isLoading || isFetching) {
  return <HomeSkeleton />;
}

else if (isError) {
  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <ThemedText>Impossible de charger les données</ThemedText>
    </View>
  );
}else{
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
  showsVerticalScrollIndicator={false}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={["#4D96FF"]}   
      tintColor="#4D96FF"  
    />
  }
>

        <HeaderOFpage username={user?.username} tokenAbonement={user?.TokenAbonemment} soldNumber={user?.soldNumber}  avatar={
  user?.imageUrl
    ? user.imageUrl.startsWith("http")
      ? user.imageUrl
      : `${API_URL_BASE}${user.imageUrl}`
    : undefined
}
 accountNumber={user?.accountNumber}/>

        {/* Quick Actions */}
        <View style={styles.smallCard}>
          <ActionButton  onPress={()=> router.push('/recharge')}  title="Recharge" icon="circle-plus" color="#4D96FF" glass />
          <ActionButton onPress={()=> router.push('/retrait')}  title="Retrait" icon="money-bill-transfer" color="#FF6B6B" glass />
          
          <ActionButton  onPress={()=> router.push('/transfert')}  title="Transfert" icon="right-left" color="#FFD93D" glass />
          <ActionButton   onPress={() => setOpenScanner(true)} title="Scaner un qr" icon="qrcode" color="#6BCB77" glass />
          <ActionButton  onPress={()=> router.push('/support')}  title="Support" icon="headset" color="#845EC2" glass />
        <ActionButton  
  onPress={onRefresh}  
  title="Actualiser" 
  icon="arrows-rotate" 
  color="#F9A826" 
  glass 
/>

        </View>

        {/* Main Section */}
        <ThemedView style={styles.mainCard}>
          <HeaderRow/>

          <Modal isVisible={openScanner} style={{ margin: 0 }}>
                  <CameraView
                    style={{ flex: 1 }}
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    onBarcodeScanned={handleBarcodeScanned}
                  />
                </Modal>
          <View style={styles.grid}>
            <ActionButton onPress={() =>
                  router.push(`/service/${1}`)
                } title="BIM Santé" icon="hand-holding-medical" color="#FF6B6B" glass />
            <ActionButton  onPress={() =>
                  router.push(`/service/${3}`)
                }   title="BIM Énergies" icon="bolt" color="#FFD93D"  glass/>
            <ActionButton   onPress={() =>
                  router.push(`/service/${6}`)
                }  title="BIM Gaz" icon="fire-flame-simple" color="#FF7F50"  glass/>
            <ActionButton   onPress={() =>
                  router.push(`/service/${5}`)
                }  title="BIM Hôtellerie" icon="hotel" color="#6BCB77"  glass/>
            <ActionButton  onPress={() =>
                  router.push(`/service/${4}`)
                }  title="BIM Carburant" icon="gas-pump" color="#4D96FF"  glass/>
            <ActionButton  onPress={() =>
                  router.push(`/service/${2}`)
                }  title="BIM Transport" icon="bus" color="#00B4D8" glass />
          </View>
        </ThemedView>

        <View style={{height:80}}/>
      </ScrollView>
    </SafeAreaView>
  );
}
  

  
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
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    elevation: 4,

    height:'80%'
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
