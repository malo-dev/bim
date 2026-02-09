import { useRouter } from "expo-router";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {jwtDecode } from "jwt-decode";
import * as Device from "expo-device";
import * as Application from "expo-application";
import * as Location from "expo-location";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import axios from 'axios';

import {

  ArrowIcon,
  ArrowRightIcon,

} from "@/assets/svg/ArrowIcon";

import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import GradientButton from "@/components/ui/GradientButton";
import { Fonts } from "@/constants/theme";
import { useLoginMutation } from "@/services/authService";
import { useCreateHistoryMutation } from "@/services/historyService";
import { useCreateNotificationMutation} from '@/services/notificationService'
import { registerForPushNotificationsAsync, sendLocalNotification } from '@/services/pushNotifications';
import { API_URL_BASE } from "@/constants/api";




export default function LoginScreen() {
  const router = useRouter();
const [login, { isLoading }] = useLoginMutation();
const [createHistory , { isLoading:isLoadingHIstory }] = useCreateHistoryMutation();
const [createNotification, { isLoading:isLoadingNotfication }] = useCreateNotificationMutation();
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  

  const [focusedInput, setFocusedInput] =
    useState<"email" | "password" | null>(null);

  const [showPassword, setShowPassword] = useState(false);





const handleLogin = async () => {
  try {
    const deviceName = Device.deviceName || "Unknown device";
    const osName = Device.osName || Platform.OS;
    const osVersion = Device.osVersion || "";
    const appVersion = Application.nativeApplicationVersion || "";

    let locationName = "Inconnue";
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      const location = await Location.getCurrentPositionAsync({});
      locationName = `${location.coords.latitude}, ${location.coords.longitude}`;
    }

    const payload = {
      email,
      password,
      device: `${deviceName} - ${osName} ${osVersion}`,
      location: locationName,
      appVersion,
    };

    const response = await login(payload).unwrap();
    if (!response) return;

    await AsyncStorage.multiSet([
      ["token", response.token],
      ["refreshToken", response.refreshToken],
    ]);

    const decoded: any = jwtDecode(response.token);
    const userId = decoded?.userId;
    const emailUser = decoded?.email;

    await AsyncStorage.multiSet([
      ["userId", String(userId)],
      ["email", emailUser],
    ]);

   
    const pushToken = await registerForPushNotificationsAsync();
    if (pushToken) {
     

     
    await axios.post(`${API_URL_BASE}/api/v1/auth/users/${userId}/expoPushToken`, { tokenPush : pushToken});
  

   
      // await sendLocalNotification(
      //   "Connexion réussie ✅",
      //   "Bienvenue ! Vous êtes maintenant connecté."
      // );
    }

    router.replace("/(tabs)");

  } catch (err) {
    const dataMess = err as any;
    const userId = await AsyncStorage.getItem("userId");

    try {
      await createHistory({
        type: "connexion",
        description: "Une tentative de connexion a été détectée, mais elle a échoué.",
        userId: userId || null,
        action: "Échec de la connexion ❌",
      });

      await createNotification({
        title: "Échec de connexion",
        message: "Une tentative de connexion a échoué.",
        type: "ERREUR",
        userId: userId || null,
      });

    
      await sendLocalNotification(
        "Échec de connexion ❌",
        "Une tentative de connexion a échoué."
      );

    } catch (notifErr) {
      console.error("Erreur lors de la création de l'historique ou notification :", notifErr);
    }

    Alert.alert(dataMess?.data?.message || "Une erreur est survenue");
    console.error(err);
  }
};






  const handleRegister = () => {
    router.push("/register");
  };



  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.container}>

          {/* TITLE */}
          <ThemedText
            type="title"
            style={{ fontFamily: Fonts.rounded, textAlign: "center" }}
          >
            Bon retour parmi nous !
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            Connectez-vous maintenant et plongez dans une expérience unique
          </ThemedText>

          {/* EMAIL */}
          <ThemedText style={styles.label}>Adresse email</ThemedText>

          <View
            style={[
              styles.inputContainer,
              focusedInput === "email" && styles.inputFocused,
            ]}
          >
            <Ionicons name="mail-outline" size={20} color="#777" />

            <TextInput
              style={styles.input}
              placeholder="exemple@gmail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusedInput("email")}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          {/* PASSWORD */}
          <ThemedText style={styles.label}>Mot de passe</ThemedText>

          <View
            style={[
              styles.inputContainer,
              focusedInput === "password" && styles.inputFocused,
            ]}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#777" />

            <TextInput
              style={styles.input}
              placeholder="Votre mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setFocusedInput("password")}
              onBlur={() => setFocusedInput(null)}
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#777"
              />
            </TouchableOpacity>
          </View>

          {/* FORGOT */}
          <TouchableOpacity onPress={() => router.push("/forgot-password")}>
            <ThemedText style={styles.forgot}>
              Mot de passe oublié ?
            </ThemedText>
          </TouchableOpacity>

          {/* LOGIN BUTTON */}
          <GradientButton
          isLoad={isLoading}
            title="Se connecter"
            onPress={handleLogin}
            leftIcon={<ArrowIcon width={20} height={14} color="#3A3AB7" />}
            rightIcon={<ArrowRightIcon width={30} height={24} />}
          />

          {/* DIVIDER */}
          <View style={styles.divider}>
            <View style={styles.line} />
            <ThemedText>OU</ThemedText>
            <View style={styles.line} />
          </View>


          {/* REGISTER */}
          <View style={styles.footer}>
            <ThemedText>Pas de compte ?</ThemedText>

            <TouchableOpacity onPress={handleRegister}>
              <ThemedText style={styles.register}>
                Créer un compte
              </ThemedText>
            </TouchableOpacity>
          </View>

        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// LoginScreen.options = {
//   headerShown: false,
// };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },

  subtitle: {
    marginBottom: 25,
    opacity: 0.7,
    textAlign: "center",
  },

  label: {
    marginBottom: 6,
    fontSize: 13,
    opacity: 0.7,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 15,
    gap: 10,
  },

  input: {
    flex: 1,
    height: "100%",
  },

  inputFocused: {
    borderColor: "#3A3AB7",
    borderWidth: 2,
  },

  forgot: {
    alignSelf: "flex-end",
    marginBottom: 20,
    color: "#3A3AB7",
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
  },

  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    height: 50,
    width: "100%",
    borderRadius: 10,
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
  },

  socialText: {
    fontSize: 14,
  },

  footer: {
    flexDirection: "row",
    marginTop: 25,
    gap: 5,
    justifyContent: "center",
  },

  register: {
    color: "#3A3AB7",
    fontWeight: "bold",
  },
});
