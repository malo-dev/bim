import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useResetPasswordMutation } from "@/services/authService";



import {
  Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function ResetPassword() {
   const [resetPassword, { isLoading }] = useResetPasswordMutation();
  
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    if (password.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }


    try {
             const userId = await AsyncStorage.getItem("userId");
            const response = await resetPassword({ newPassword  : String(password), userId : userId  }).unwrap();
    
                  if(response){
           router.replace("/login");
          }
          } catch (err) {
                  const dataMess = err as any
          
          Alert.alert( dataMess?.data?.error || 'Une erreur est survenue');
         
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
        <View style={styles.container}>

          <Image
            source={require("../assets/images/onboarding.png")}
            style={styles.image}
            resizeMode="contain"
          />

          <Text style={styles.title}>Nouveau mot de passe</Text>
          <Text style={styles.subtitle}>
            Créez un nouveau mot de passe sécurisé
          </Text>

          {/* MOT DE PASSE */}
          <Text style={styles.label}>Mot de passe</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#666" />

            <TextInput
              style={styles.input}
              placeholder="Nouveau mot de passe"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* CONFIRMATION */}
          <Text style={styles.label}>Confirmer le mot de passe</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#666" />

            <TextInput
              style={styles.input}
              placeholder="Confirmer le mot de passe"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              onPress={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
            >
              <Ionicons
                name={
                  showConfirmPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <GradientButton
            title="Renitialiser le mot de passe"
            onPress={handleReset}
            leftIcon={<ArrowIcon width={20} height={14} color="#3A3AB7" />}
            rightIcon={<ArrowRightIcon width={30} height={24} />}
          />

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    justifyContent: "center",
  },

  image: {
    width: "100%",
    height: 250,
    marginBottom: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginBottom: 30,
  },

  label: {
    fontSize: 14,
    marginBottom: 6,
    color: "#333",
    fontWeight: "500",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 55,
    marginBottom: 20,
  },

  input: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 15,
  },
});
