
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

let isRefreshing = false;
let subscribers = [];

function onRefreshed(token) {
  console.log("🔁 Token rafraîchi, mise à jour des requêtes...");
  subscribers.forEach((callback) => callback(token));
  subscribers = [];
}

function addSubscriber(callback) {
  subscribers.push(callback);
}

const BASE_URL = Constants.expoConfig.extra.API_URL;

const instance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ---------------- REQUEST INTERCEPTOR ---------------- */

instance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      // console.log("📌 Token envoyé:", token);
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log("⚠️ Aucun token trouvé");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ---------------- RESPONSE INTERCEPTOR ---------------- */

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isTokenExpired =
      error.response?.status === 401 &&
      error.response?.data?.message === "BEARER_TOKEN_EXPIRED";

    if (!isTokenExpired) {
      return Promise.reject(error);
    }

    console.log("⛔ Token expiré, tentative de refresh...");

    if (!originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await AsyncStorage.getItem("refreshToken");

      if (!refreshToken) {
        console.log("❌ Aucun refreshToken trouvé");
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const { data } = await axios.post(
            `${BASE_URL}/auth/refresh-token`,
            { refreshToken }
          );

          console.log("✅ Nouveau token reçu:", data.token);

          await AsyncStorage.setItem("token", data.token);

          onRefreshed(data.token);
        } catch (err) {
          console.log("❌ Erreur refresh token");

          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("refreshToken");

          isRefreshing = false;
          return Promise.reject(err);
        }

        isRefreshing = false;
      }

      return new Promise((resolve) => {
        addSubscriber((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(instance(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default instance;
