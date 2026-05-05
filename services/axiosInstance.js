
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { DeviceEventEmitter } from "react-native";

let isRefreshing = false;
let subscribers = [];

function onRefreshed(token) {
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

    if (!originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await AsyncStorage.getItem("refreshToken");

      if (!refreshToken) {
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
          await AsyncStorage.multiRemove(["token", "refreshToken", "userId", "email"]);
          subscribers = [];
          isRefreshing = false;
          DeviceEventEmitter.emit("auth:forceLogout");
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
