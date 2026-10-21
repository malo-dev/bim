import axiosInstance from "@/services/axiosInstance";
import { notificationApi } from "@/services/notificationService";
import { orderApi } from "@/services/orderService";
import { connectSocket, disconnectSocket } from "@/services/socketService";
import { userApi } from "@/services/userService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus, DeviceEventEmitter, Platform } from "react-native";
import { useDispatch } from "react-redux";
import { getSocket } from "@/services/socketService";

/* ─── Configuration du handler de notifications ─────────────────────── */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
  }),
});

/* ─── Enregistrement du token Expo Push ──────────────────────────────── */
async function registerPushToken(userId: string) {
  if (!Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "BIM Notifications",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0353CC",
    });
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const savedToken = await AsyncStorage.getItem("expoPushToken");
    const synced     = await AsyncStorage.getItem("expoPushTokenSynced");
    // `synced` protège aussi les installations déjà affectées par l'ancien bug
    // (mauvais champ envoyé au serveur) : ces appareils ont déjà un token en
    // cache identique à l'actuel, donc `token !== savedToken` seul ne suffit
    // pas à déclencher un nouveau essai — `expoPushTokenSynced` force la
    // resynchronisation tant qu'aucune confirmation serveur n'a été reçue.
    if (token !== savedToken || synced !== "1") {
      const authToken = await AsyncStorage.getItem("token");
      if (authToken) {
        // Le backend attend `tokenPush` (voir auth.controller.js storeExpoPushToken).
        await axiosInstance.post(`/auth/users/${userId}/expoPushToken`, {
          tokenPush: token,
        });
        await AsyncStorage.setItem("expoPushToken", token);
        await AsyncStorage.setItem("expoPushTokenSynced", "1");
      }
    }
  } catch (e) {
    console.warn("Expo push token error:", e);
  }
}

/* ─── SocketProvider ─────────────────────────────────────────────────── */
export default function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch();
  const socketRef   = useRef<ReturnType<typeof connectSocket> | null>(null);
  const notifListenerRef = useRef<Notifications.Subscription | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId || !mounted) return;
      // Déjà connecté pour cet utilisateur (ex. appel déclenché par
      // "auth:loggedIn" juste après un setup initial réussi) — rien à refaire.
      if (socketRef.current?.connected) return;

      /* Connecter le socket en premier (avant registerPushToken qui est lent) */
      const socket = connectSocket(userId);
      socketRef.current = socket;

      socket.on("notification", () => {
        dispatch(notificationApi.util.invalidateTags(["Notifications"]));
        dispatch(userApi.util.invalidateTags(["User"]));
      });

      // Mise à jour du statut d'une commande depuis l'admin
      socket.on("order:status_updated", () => {
        dispatch(orderApi.util.invalidateTags(["order"]));
      });

      // Recharge FlexPay confirmée (ou annulée) — contrairement aux paiements
      // et transferts, ces événements ne passent pas par "notification", donc
      // le solde affiché (accueil, page Solde...) ne se rafraîchissait que si
      // l'utilisateur était resté sur l'écran de recharge. On invalide ici
      // globalement, pour que le solde se mette à jour partout tout seul.
      const refreshUser = () => dispatch(userApi.util.invalidateTags(["User"]));
      socket.on("recharge:success", refreshUser);
      socket.on("recharge:cancelled", refreshUser);
      socket.on("recharge:failed", refreshUser);

      /* Enregistrement push notifications (async, ne bloque plus le socket) */
      registerPushToken(userId);
    }

    setup();

    /* ── Connexion/reconnexion juste après une connexion réussie (onboarding,
       Espace Gestion…) — au premier montage du provider, aucun `userId`
       n'existe encore dans AsyncStorage tant que l'utilisateur ne s'est pas
       connecté, donc `setup()` ci-dessus ressort sans rien faire. Sans cet
       écouteur, le socket ne se connecterait jamais avant un redémarrage
       complet de l'app. ── */
    const loginSub = DeviceEventEmitter.addListener("auth:loggedIn", () => {
      setup();
    });

    /* ── AppState : reconnexion socket quand l'app revient au premier plan ── */
    const appStateSub = AppState.addEventListener("change", (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        const socket = getSocket();
        if (socket && !socket.connected) {
          socket.connect();
        }
      }
      appStateRef.current = nextState;
    });

    /* ── Logout forcé (token refresh échoué dans axiosInstance) ── */
    const logoutSub = DeviceEventEmitter.addListener("auth:forceLogout", () => {
      socketRef.current?.off("notification");
      disconnectSocket();
    });

    /* Listener notifications reçues au premier plan */
    notifListenerRef.current =
      Notifications.addNotificationReceivedListener(() => {
        dispatch(notificationApi.util.invalidateTags(["Notifications"]));
        dispatch(userApi.util.invalidateTags(["User"]));
      });

    return () => {
      mounted = false;
      socketRef.current?.off("notification");
      socketRef.current?.off("order:status_updated");
      socketRef.current?.off("recharge:success");
      socketRef.current?.off("recharge:cancelled");
      socketRef.current?.off("recharge:failed");
      disconnectSocket();
      notifListenerRef.current?.remove();
      appStateSub.remove();
      logoutSub.remove();
      loginSub.remove();
    };
  }, [dispatch]);

  return <>{children}</>;
}
