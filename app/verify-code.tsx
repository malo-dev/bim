import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View,KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useAskPasswordResetMutation, useVerifyOtpMutation } from "@/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
export default function VerifyCode() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
 const [askPasswordReset, { isLoading : isValue}] = useAskPasswordResetMutation();

  const handleVerify = async () => {
    if (code.length === 6) {
      try {
        const response = await verifyOtp({ otp: String(code) }).unwrap();
        if (response) {
          router.replace("/login");
        }
      } catch (err) {
        const dataMess = err as any;
        Alert.alert(dataMess?.data?.error || "Une erreur est survenue");
      }
    } else {
      alert("Veuillez entrer un code valide");
    }
  };


    const handleSend = async () => {
     try {
       
      const email = await AsyncStorage.getItem("email");
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20} // Ajuste selon ton header
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Image
            source={require("../assets/images/onboarding.png")}
            style={styles.image}
            resizeMode="contain"
          />

          <Text style={styles.title}>Vérification du code</Text>
          <Text style={styles.subtitle}>
            Entrez le code à 6 chiffres envoyé à votre email
          </Text>

          <TextInput
            style={styles.input}
            placeholder="------"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            textAlign="center"
            blurOnSubmit
            returnKeyType="done"
            onSubmitEditing={handleVerify}
          />

          <GradientButton
            isLoad={isLoading}
            title="Verifier ce code"
            onPress={handleVerify}
            leftIcon={<ArrowIcon width={20} height={14} color="#3A3AB7" />}
            rightIcon={<ArrowRightIcon width={30} height={24} />}
          />

          <TouchableOpacity onPress={()=>handleSend()}>

            {isValue ? (
                <Feather name="loader" size={24} color="white" style={{ flex: 1, textAlign: "center" }} />
              ) : (
               <Text style={styles.resend}>Renvoyer le code</Text>
              )
            }
            
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  image: {
    width: "100%",
    height: 300,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#777",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 22,
    letterSpacing: 10,
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#2D39A1",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  resend: {
    marginTop: 20,
    color: "#2D39A1",
    textAlign: "center",
  },
});
