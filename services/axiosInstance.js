
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

// Connexions faibles (2G / 3G instable) : 30 s par requête (60 s pour l'envoi
// d'images) au lieu de 15 s, et nouvelles tentatives automatiques (voir plus bas).
const TIMEOUT_MS = 30000;
const UPLOAD_TIMEOUT_MS = 60000;

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

// Clé unique par action (payer, commander, transférer…), réutilisée à chaque
// nouvelle tentative : le serveur ne l'exécute qu'une fois (idempotency.middleware).
const newIdempotencyKey = () =>
  `${Date.now().toString(36)}-${Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

/* ---------------- REQUEST INTERCEPTOR ---------------- */

instance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      // console.log("📌 Token envoyé:", token);
      config.headers.Authorization = `Bearer ${token}`;
    }

    const method = String(config.method || "get").toLowerCase();
    if (method !== "get") {
      if (!config.__idemKey) config.__idemKey = newIdempotencyKey();
      config.headers["Idempotency-Key"] = config.__idemKey;
    }
    const isUpload = typeof FormData !== "undefined" && config.data instanceof FormData;
    if (isUpload && (!config.timeout || config.timeout < UPLOAD_TIMEOUT_MS)) config.timeout = UPLOAD_TIMEOUT_MS;

    return config;
  },
  (error) => Promise.reject(error)
);

/* ---------------- NOUVELLES TENTATIVES (réseau faible) ---------------- */

// Lecture : 2 nouvelles tentatives. Action (POST/PUT…) : 3, avec la même clé
// d'idempotence — sans risque de doublon. Attentes : 1,5 s, 3 s, 6 s.
const RETRY_DELAYS_MS = [1500, 3000, 6000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function shouldRetry(error) {
  const cfg = error?.config;
  if (!cfg || cfg.__noRetry) return false;
  const method = String(cfg.method || "get").toLowerCase();
  const max = method === "get" ? 2 : 3;
  if ((cfg.__retryCount || 0) >= max) return false;
  const status = error?.response?.status;
  if (!error?.response) return true;                                   // pas de réseau / délai dépassé
  if (status === 502 || status === 503 || status === 504) return true; // serveur momentanément indisponible
  if (status === 409 && error.response.data?.code === "IN_PROGRESS") return true; // 1re tentative encore en cours
  return false;
}

instance.interceptors.response.use(undefined, async (error) => {
  if (!shouldRetry(error)) return Promise.reject(error);
  const cfg = error.config;
  cfg.__retryCount = (cfg.__retryCount || 0) + 1;
  await sleep(RETRY_DELAYS_MS[cfg.__retryCount - 1] ?? 6000);
  return instance(cfg);
});

/* ---------------- RESPONSE INTERCEPTOR ---------------- */

// Message convivial pour toute erreur réseau (pas de connexion, serveur
// injoignable, timeout) — remplace le jargon technique brut ("Network
// Error", "timeout of 15000ms exceeded") qui remontait tel quel jusqu'à
// l'utilisateur. S'applique automatiquement partout où axiosInstance est
// utilisé, sans toucher chaque écran individuellement.
const NETWORK_ERROR_MESSAGE =
  "Impossible de contacter le serveur. Vérifiez votre connexion internet (Wifi ou données mobiles) et réessayez. " +
  "Si le problème persiste, contactez le support BIM NEXT.";
// Action (paiement, commande…) dont on n'a pas reçu la réponse malgré les
// nouvelles tentatives : elle a pu passer quand même.
const ACTION_NETWORK_ERROR_MESSAGE =
  "La connexion est trop faible : nous n'avons pas reçu la confirmation. Votre opération a peut-être été enregistrée — " +
  "vérifiez votre solde ou vos commandes avant de réessayer.";

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
      const isAction = String(originalRequest?.method || "get").toLowerCase() !== "get";
      error.response.data.message = isAction ? ACTION_NETWORK_ERROR_MESSAGE : NETWORK_ERROR_MESSAGE;
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
            { refreshToken },
            { timeout: TIMEOUT_MS }
          );

          await AsyncStorage.setItem("token", data.token);
          // Le serveur remplace les anciens jetons courts par un jeton longue durée.
          if (data.refreshToken) await AsyncStorage.setItem("refreshToken", data.refreshToken);

          onRefreshed(data.token);
        } catch (err) {
          onRefreshFailed(err);
          isRefreshing = false;
          // Déconnexion UNIQUEMENT si le serveur dit que la session est révoquée (401/403).
          // Pas de réseau, serveur en redémarrage, erreur 500… → on garde la session.
          const st = err?.response?.status;
          if (st === 401 || st === 403) {
            await AsyncStorage.multiRemove(["token", "refreshToken", "userId", "email", "accountType"]);
            DeviceEventEmitter.emit("auth:forceLogout");
          }
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
