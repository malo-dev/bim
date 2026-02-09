import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL_BASE } from "@/constants/api";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

const supportTopics = [
  { id: "1", title: "Problème de connexion" },
  { id: "2", title: "Recharger mon compte" },
  { id: "3", title: "Transfert Ecoins" },
  { id: "4", title: "Autres questions" },
];

export default function SupportScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const id = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("token");
      setUserId(id);
      setToken(token);
    };
    loadUser();
  }, []);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert("Permission refusée pour accéder aux photos !");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSend = async () => {
    if (!selectedTopic || !message || !email) {
      alert("Veuillez remplir tous les champs !");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("description", message);
      formData.append("id", String(userId));
      formData.append("sujet", selectedTopic);

      if (image) {
        const filename = image.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const type = match ? `image/${match[1]}` : `image`;

        formData.append("image", {
          uri: image,
          name: filename,
          type,
        } as any);
      }

      const response = await fetch(
        `${API_URL_BASE}/api/v1/support_track/create`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Ticket envoyé avec succès !");
        setSelectedTopic(null);
        setMessage("");
        setEmail("");
        setImage(null);
      } else {
        alert(data.message || "Erreur lors de l'envoi");
      }
    } catch (error) {
      console.log(error);
      alert("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* HEADER */}
        <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>

            <Text style={styles.title}>Support</Text>

            <TouchableOpacity onPress={() => router.push("/notification")}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>

          <Ionicons name="help-circle-outline" size={60} color="white" />
          <Text style={styles.subtitle}>
            Nous sommes là pour vous aider
          </Text>
        </LinearGradient>

        {/* FORM */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        >
          {/* Sujet */}
          <Text style={styles.label}>Sujet</Text>

          {supportTopics.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.topicItem,
                selectedTopic === item.title &&
                  styles.topicItemSelected,
              ]}
              onPress={() => setSelectedTopic(item.title)}
            >
              <Text style={styles.topicText}>{item.title}</Text>
            </TouchableOpacity>
          ))}

          {/* Email */}
          <Text style={styles.label}>Votre email</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: monemail@mail.com"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          {/* Message */}
          <Text style={styles.label}>Votre message</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Écrivez votre message ici..."
            placeholderTextColor="#888"
            value={message}
            onChangeText={setMessage}
            multiline
          />

          {/* Image */}
          <Text style={styles.label}>Joindre une image</Text>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={pickImage}
          >
            <Text style={styles.uploadText}>
              {image ? "Modifier l'image" : "Ajouter une image"}
            </Text>
          </TouchableOpacity>

          {image && (
            <Image
              source={{ uri: image }}
              style={styles.imagePreview}
            />
          )}

          {/* Bouton */}
          <View style={{ marginTop: 30 }}>
            <GradientButton
              title={loading ? "Envoi..." : "Envoyer"}
              onPress={handleSend}
              leftIcon={
                <ArrowIcon width={20} height={14} color="#3906C7" />
              }
              rightIcon={<ArrowRightIcon width={30} height={24} />}
              isLoad={loading}
            />

            {loading && (
              <ActivityIndicator
                style={{ marginTop: 10 }}
                color="#3906C7"
              />
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ================== STYLES ================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },

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
  },

  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
  },

  subtitle: {
    color: "white",
    opacity: 0.9,
    marginTop: 8,
  },

  label: {
    marginTop: 20,
    marginBottom: 6,
    fontWeight: "600",
    color: "#333",
  },

  topicItem: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#EEE",
    marginVertical: 4,
  },

  topicItemSelected: {
    borderWidth: 2,
    borderColor: "#FFD700",
    backgroundColor: "#DDE0FF",
  },

  topicText: {
    fontWeight: "600",
    color: "#333",
  },

  input: {
    backgroundColor: "#EEE",
    borderRadius: 12,
    padding: 12,
    color: "#000",
  },

  messageInput: {
    backgroundColor: "#EEE",
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    textAlignVertical: "top",
    color: "#000",
  },

  uploadBtn: {
    backgroundColor: "#DDD",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },

  uploadText: {
    color: "#333",
    fontWeight: "600",
  },

  imagePreview: {
    width: "100%",
    height: 200,
    marginTop: 10,
    borderRadius: 12,
  },
});
