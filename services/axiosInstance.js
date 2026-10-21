
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { DeviceEventEmitter } from "react-native";

let isRefreshing = false;
let subscribers = [];

function onRefreshed(token) {
  subscribers.forEach(({ onSuccess }) => onSuccess(token));
  subscribers = [];
}

function onRefreshFailed(error) {
  subscribers.forEach(({ onError }) => onError(error));
  subscribers = [];
}

function addSubscriber(onSuccess, onError) {
  subscribers.push({ onSuccess, onError });
}

const BASE_URL = Constants.expoConfig.extra.API_URL;

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
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
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ---------------- RESPONSE INTERCEPTOR ---------------- */

// Message convivial pour toute erreur réseau (pas de connexion, serveur
// injoignable, timeout) — remplace le jargon technique brut ("Network
// Error", "timeout of 15000ms exceeded") qui remontait tel quel jusqu'à
// l'utilisateur. S'applique automatiquement partout où axiosInstance est
// utilisé, sans toucher chaque écran individuellement.
const NETWORK_ERROR_MESSAGE =
  "Impossible de contacter le serveur. Vérifiez votre connexion internet (Wifi ou données mobiles) et réessayez. " +
  "Si le problème persiste, contactez le support BIM NEXT.";

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      error.response = { data: {} };
      error.isNetworkError = true;
    }
    if (!error.response.data || typeof error.response.data !== "object") {
      error.response.data = {};
    }
    if (error.isNetworkError && !error.response.data.message) {
      error.response.data.message = NETWORK_ERROR_MESSAGE;
    }

    const isTokenExpired =
      error.response?.status === 401 &&
      error.response?.data?.message === "BEARER_TOKEN_EXPIRED";

    if (!isTokenExpired) {
      return Promise.reject(error);
    }

    if (!originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await AsyncStorage.getItem("refreshToken");

      if (!refreshToken) {
        await AsyncStorage.multiRemove(["token", "refreshToken", "userId", "email", "accountType"]);
        DeviceEventEmitter.emit("auth:forceLogout");
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const { data } = await axios.post(
            `${BASE_URL}/auth/refresh-token`,
            { refreshToken }
          );

          await AsyncStorage.setItem("token", data.token);

          onRefreshed(data.token);
        } catch (err) {
          await AsyncStorage.multiRemove(["token", "refreshToken", "userId", "email", "accountType"]);
          onRefreshFailed(err);
          isRefreshing = false;
          DeviceEventEmitter.emit("auth:forceLogout");
          return Promise.reject(err);
        }

        isRefreshing = false;
      }

      return new Promise((resolve, reject) => {
        addSubscriber((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(instance(originalRequest));
        }, (err) => {
          reject(err);
        });
      });
    }

    return Promise.reject(error);
  }
);

export default instance;
