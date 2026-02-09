import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useGetUserByIdQuery, useUpdateUserMutation } from "@/services/userService"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCreateHistoryMutation } from "@/services/historyService";
import { useCreateNotificationMutation} from '@/services/notificationService'
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { API_URL_BASE } from "@/constants/api";

export default function ProfileScreen() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);

  const { data: user, isLoading, isError,refetch } = useGetUserByIdQuery(userId!, {
    skip: !userId,
  });

  const [updateUser,{isLoading:isupdated}] = useUpdateUserMutation();

  const [profile, setProfile] = useState({
    username: "",
    nom: "",
    poste: "",
    email: "",
    tel: "",
    adresse: "",
    photo: "",
  });

  const [createHistory , { isLoading:isLoadingHIstory }] = useCreateHistoryMutation();
  const [createNotification, { isLoading:isLoadingNotfication }] = useCreateNotificationMutation();

  useEffect(() => {
    const loadUser = async () => {
      const id = await AsyncStorage.getItem("userId");
      setUserId(id);
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {

      setProfile({
        username: user.username || "",
        nom: user.fullname || "",
        poste: user.poste || "",
        email: user.email || "",
        tel: user.telephone || "",
        adresse: user.adresse || "",
        photo:   user?.imageUrl
            ? user.imageUrl.startsWith("http")
              ? user.imageUrl
              : `${API_URL_BASE}${user.imageUrl}`
            : "https://www.w3schools.com/howto/img_avatar.png"
      });
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

const uploadImage = async (uri: string) => {
  const token = await AsyncStorage.getItem("token");
  if (!userId) return;

  const formData = new FormData();

  const fileName = uri.split("/").pop() || `photo_${Date.now()}.jpg`;
  const extension = fileName.split(".").pop()?.toLowerCase();

  const mimeType =
    extension === "png" ? "image/png" : "image/jpeg";

  formData.append("image", {
    uri,
    name: fileName,
    type: mimeType,
  } as any);

  const response = await fetch(
    `${API_URL_BASE}/api/v1/auth/users/${userId}/profile`,
    {
      method: "PUT",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw await response.json();
  }
};


const handlePickImage = async () => {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert("Permission refusée", "Autorisez l'accès à la galerie");
    return;
  }

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images as any, 
  quality: 0.7,
  allowsEditing: true,
});


  if (!result.canceled) {
    const uri = result.assets[0].uri;

    // aperçu immédiat
    handleChange("photo", uri);

    try {
      await uploadImage(uri);
      refetch(); // recharge profil
      Alert.alert("Succès", "Photo mise à jour !");
    } catch (err) {
      Alert.alert("Erreur", "Upload image échoué");
    }
  }
};


const handleSave = async () => {

  if (!userId) return;

  try {
    const formData = new FormData();

    formData.append("username", profile.username);
    formData.append("fullname", profile.nom);
    formData.append("poste", profile.poste);
    formData.append("email", profile.email);
    formData.append("telephone", profile.tel);
    formData.append("adresse", profile.adresse);

  
const res = await updateUser({
  id: userId,
  formData
});


if(res){
   await createHistory({
  type: "MODIFICATION_PROFIL", // type adapté pour l'historique
  description: "Votre profil a été mis à jour avec succès.",
  userId,
  action: "Profil modifié ✅",
});

await createNotification({
  title: "Profil mis à jour",
  message: "Votre profil a été mis à jour avec succès depuis l'application.",
  type: "SUCCESS",
  userId,
});

}


    

    Alert.alert("Succès", "Profil mis à jour !");
  } catch (err: any) {
    await createHistory({
  type: "MODIFICATION_PROFIL",
  description: "La mise à jour de votre profil a échoué.",
  userId,
  action: "Échec de la modification ❌",
});

await createNotification({
  title: "Erreur lors de la mise à jour du profil",
  message: "Une erreur est survenue lors de la mise à jour de votre profil.",
  type: "ERREUR", // correspond à ton ENUM
  userId,
});
    console.log("UPLOAD ERROR:", err);
    Alert.alert(
      "Erreur",
      err?.message || "Impossible de mettre à jour le profil"
    );
  }
};




  

  if (isLoading) {
    return <Text style={{ flex: 1, textAlign: "center", marginTop: 50 }}>Chargement...</Text>;
  }

  if (isError) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <Text>Impossible de charger les données</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* ===== HEADER ===== */}
        <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>

            <Text style={styles.title}>Mon Profil</Text>

              <TouchableOpacity onPress={() => router.push('/notification')}>
                                 <Ionicons name="notifications-outline" size={24} color="white" />
                               </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickImage}>
            <Image source={{ uri:  profile.photo }} style={styles.avatar} />
            <View style={styles.cameraIconWrapper}>
              <Ionicons name="camera" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </LinearGradient>

        {/* ===== FORMULAIRE PROFIL ===== */}
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/** Username */}
          <Text style={styles.label}>Username</Text>
          <BlurView intensity={80} tint="light" style={styles.inputBox}>
            <Ionicons name="person-circle-outline" size={20} color="#888" />
            <TextInput
            placeholder="Entre un username"
              style={styles.input}
              value={profile.username}
              onChangeText={(text) => handleChange("username", text)}
              returnKeyType="next"
            />
          </BlurView>

          {/** Nom */}
          <Text style={styles.label}>Nom</Text>
          <BlurView intensity={80} tint="light" style={styles.inputBox}>
            <Ionicons name="person-outline" size={20} color="#888" />
            <TextInput
              placeholder="Entrez votre nom complet"
              style={styles.input}
              value={profile.nom}
              onChangeText={(text) => handleChange("nom", text)}
              returnKeyType="next"
            />
          </BlurView>

          {/** Poste */}
          <Text style={styles.label}>Poste</Text>
          <BlurView intensity={80} tint="light" style={styles.inputBox}>
            <Ionicons name="briefcase-outline" size={20} color="#888" />
            <TextInput
              placeholder="Entre votre paste"
              style={styles.input}
              value={profile.poste}
              onChangeText={(text) => handleChange("poste", text)}
              returnKeyType="next"
            />
          </BlurView>

          {/** Email */}
          <Text style={styles.label}>Email</Text>
          <BlurView intensity={80} tint="light" style={styles.inputBox}>
            <Ionicons name="mail-outline" size={20} color="#888" />
            <TextInput
              placeholder="Entrez votre email"
              style={styles.input}
              value={profile.email}
              onChangeText={(text) => handleChange("email", text)}
              keyboardType="email-address"
              returnKeyType="next"
            />
          </BlurView>

          {/** Numéro */}
          <Text style={styles.label}>Numéro de téléphone</Text>
          <BlurView intensity={80} tint="light" style={styles.inputBox}>
            <Ionicons name="call-outline" size={20} color="#888" />
            <TextInput
              placeholder="Entrez votre Numéro de téléphone"
              style={styles.input}
              value={profile.tel}
              keyboardType="phone-pad"
              onChangeText={(text) => handleChange("tel", text)}
              returnKeyType="next"
            />
          </BlurView>

          {/** Adresse */}
          <Text style={styles.label}>Adresse</Text>
          <BlurView intensity={80} tint="light" style={styles.inputBox}>
            <Ionicons name="location-outline" size={20} color="#888" />
            <TextInput
            placeholder="Entrez votre adresse"
              style={styles.input}
              value={profile.adresse}
              onChangeText={(text) => handleChange("adresse", text)}
              returnKeyType="done"
            />
          </BlurView>

          <View style={{ marginTop: 10 }}>
            <GradientButton
            isLoad={isupdated || isLoadingHIstory || isLoadingNotfication}
              title="Enregistrer les modifications"
              onPress={handleSave}
              leftIcon={<ArrowIcon width={20} height={14} color="#3906C7" />}
              rightIcon={<ArrowRightIcon width={30} height={24} />}
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },

  header: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
  },

  headerRow: {
    marginTop: 60,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: { color: "white", fontSize: 22, fontWeight: "700" },

  avatarWrapper: {
    marginTop: 20,
    alignItems: "center",
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFD700",
  },

  cameraIconWrapper: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#4D96FF",
    padding: 6,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "white",
  },

  label: {
    marginTop: 20,
    marginBottom: 6,
    fontWeight: "600",
    color: "#333",
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
    paddingHorizontal: 12,
    gap: 8,
    height: 50,
  },

  input: {
    flex: 1,
    color: "#000",
    fontWeight: "500",
    fontSize: 14,
  },
});
