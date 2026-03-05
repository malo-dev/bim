import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

export default function Index() {
  const [tokenValue, setTokenValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      const token = await AsyncStorage.getItem("token");
      setTokenValue(token);
      setLoading(false);
      console.log("Mon token :", token);
    };

    fetchToken();
  }, []);

  if (loading) {
    return null;
  }

  if (tokenValue) {
    return <Redirect href="/login" />; 
  }

  return <Redirect href="/onboarding" />;
}