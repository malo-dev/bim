import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import GradientButton from "@/components/ui/GradientButton";
import { Fonts } from "@/constants/theme";
import { useAskPasswordResetMutation } from "@/services/authService";

export default function ForgotPasswordScreen() {
  const router = useRouter();
const [askPasswordReset, { isLoading }] = useAskPasswordResetMutation();

  const [email, setEmail] = useState("");
  const [focusedInput, setFocusedInput] = useState<"email" | null>(null);

  const handleSend = async () => {
   try {
     

      const response = await askPasswordReset({ email}).unwrap();
     
         if (response) {

          const userId = response.userId

          await AsyncStorage.setItem("userId", String(userId));
         
          router.push('/check-pwd');
         }
   
   } catch (err) {
    const dataMess = err as any;
        Alert.alert(dataMess?.data?.error || "Une erreur est survenue");
        console.error(err);
   }
  };

  return (
    <ThemedView style={styles.container}>

      {/* ICON */}
      <View style={styles.iconCircle}>
        <Ionicons name="key-outline" size={50} color="#3A3AB7" />
      </View>

      {/* TITLE */}
      <ThemedText
        type="title"
        style={{ fontFamily: Fonts.rounded, textAlign: "center" }}
      >
        Mot de passe oublié
      </ThemedText>

      <ThemedText style={styles.subtitle}>
        Entrez votre email pour recevoir un lien de réinitialisation
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
          onFocus={() => setFocusedInput("email")}
          onBlur={() => setFocusedInput(null)}
        />
      </View>

      {/* BUTTON */}
      <GradientButton
      isLoad={isLoading}
        title="Envoyer le lien"
        onPress={handleSend}
        leftIcon={<ArrowIcon width={20} height={14} color="#3A3AB7" />}
        rightIcon={<ArrowRightIcon width={30} height={24} />}
      />

      {/* BACK */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push("/login")}>
          <ThemedText style={styles.register}>
            Retour à la connexion
          </ThemedText>
        </TouchableOpacity>
      </View>

    </ThemedView>
  );
}

ForgotPasswordScreen.options = {
  headerShown: false,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },

  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "center",
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
    marginBottom: 20,
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

  footer: {
    marginTop: 25,
    alignItems: "center",
  },

  register: {
    color: "#3A3AB7",
    fontWeight: "bold",
  },
});
