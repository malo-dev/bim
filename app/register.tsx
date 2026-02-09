import { useRouter } from "expo-router";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

import {
  AppleIcon,
  ArrowIcon,
  ArrowRightIcon,
  GoogleLikeIcon,
} from "@/assets/svg/ArrowIcon";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import GradientButton from "@/components/ui/GradientButton";
import { Fonts } from "@/constants/theme";
import { useRegisterMutation } from "@/services/authService";
import { generateUsername } from "@/utils/generateUsername.utils";

export default function RegisterScreen() {
  const router = useRouter();

    const [register, { isLoading }] = useRegisterMutation();


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [focusedInput, setFocusedInput] =
    useState<"name" | "email" | "password" | "confirmPassword" | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


   const handleRegister = async () => {
    try {
      const response = await register({ username: generateUsername(), email, password }).unwrap();
     const userId = response?.user?.id
        // await AsyncStorage.setItem("userId", userId);
      if(response){

        

      

        router.push("/verify-code");
      }
    } catch (err) {

      const dataMess = err as any
      
      Alert.alert( dataMess?.data?.error || 'Une erreur est survenue');
      console.error(err);
    }
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
            Créer un compte
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            Rejoignez-nous dès maintenant
          </ThemedText>

          {/* NAME */}
          {/* <ThemedText style={styles.label}>Nom complet</ThemedText> */}
          {/* <View
            style={[
              styles.inputContainer,
              focusedInput === "name" && styles.inputFocused,
            ]}
          >
            <Ionicons name="person-outline" size={20} color="#777" />
            <TextInput
              style={styles.input}
              placeholder="Votre nom complet"
              value={name}
              onChangeText={setName}
              onFocus={() => setFocusedInput("name")}
              onBlur={() => setFocusedInput(null)}
            />
          </View> */}

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

          {/* CONFIRM PASSWORD */}
          <ThemedText style={styles.label}>Confirmer mot de passe</ThemedText>
          <View
            style={[
              styles.inputContainer,
              focusedInput === "confirmPassword" && styles.inputFocused,
            ]}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#777" />
            <TextInput
              style={styles.input}
              placeholder="Confirmez votre mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              onFocus={() => setFocusedInput("confirmPassword")}
              onBlur={() => setFocusedInput(null)}
            />
            <TouchableOpacity
              onPress={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#777"
              />
            </TouchableOpacity>
          </View>

          {/* REGISTER BUTTON */}
          <GradientButton
          isLoad={isLoading}
            title="Créer un compte"
            onPress={handleRegister}
            leftIcon={<ArrowIcon width={20} height={14} color="#3A3AB7" />}
            rightIcon={<ArrowRightIcon width={30} height={24} />}
          />

          {/* DIVIDER */}
          <View style={styles.divider}>
            <View style={styles.line} />
            <ThemedText>OU</ThemedText>
            <View style={styles.line} />
          </View>

          {/* SOCIAL LOGIN */}
          {/* <TouchableOpacity style={styles.socialButton}>
            <GoogleLikeIcon width={32} height={32} />
            <ThemedText style={styles.socialText}>
              Continuer avec Google
            </ThemedText>
          </TouchableOpacity> */}

          {/* <TouchableOpacity style={styles.socialButton}>
            <AppleIcon width={28} height={28} color="#000" />
            <ThemedText style={styles.socialText}>
              Continuer avec Apple
            </ThemedText>
          </TouchableOpacity> */}

          {/* LOGIN LINK */}
          <View style={styles.footer}>
            <ThemedText>Déjà un compte ?</ThemedText>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <ThemedText style={styles.register}>
                Se connecter
              </ThemedText>
            </TouchableOpacity>
          </View>

        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

RegisterScreen.options = {
  headerShown: false,
};

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
