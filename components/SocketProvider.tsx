import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useDispatch } from "react-redux";
import axiosInstance from "@/services/axiosInstance";
import { notificationApi } from "@/services/notificationService";
import { userApi } from "@/services/userService";
import { connectSocket, disconnectSocket } from "@/services/socketService";

/* ─── Configuration du handler de notifications ─────────────────────── */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
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
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const savedToken = await AsyncStorage.getItem("expoPushToken");
    if (token !== savedToken) {
      await AsyncStorage.setItem("expoPushToken", token);
      const authToken = await AsyncStorage.getItem("token");
      if (authToken) {
        await axiosInstance.post(`/auth/users/${userId}/expoPushToken`, {
          expoPushToken: token,
        });
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
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);
  const notifListenerRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId || !mounted) return;

      // Enregistrement push notifications
      await registerPushToken(userId);

      // Connexion Socket.io
      const socket = connectSocket(userId);
      socketRef.current = socket;

      // Ecouter l'événement "notification" émis par le serveur après
      // chaque retrait / recharge / transfert / paiement
      socket.on("notification", () => {
        // Invalider le cache notifications pour forcer un refetch
        dispatch(notificationApi.util.invalidateTags(["Notifications"]));
        // Invalider le cache utilisateur pour mettre à jour le solde
        dispatch(userApi.util.invalidateTags(["User"]));
      });
    }

    setup();

    // Listener pour les notifications reçues au premier plan
    notifListenerRef.current =
      Notifications.addNotificationReceivedListener(() => {
        dispatch(notificationApi.util.invalidateTags(["Notifications"]));
        dispatch(userApi.util.invalidateTags(["User"]));
      });

    return () => {
      mounted = false;
      socketRef.current?.off("notification");
      disconnectSocket();
      notifListenerRef.current?.remove();
    };
  }, [dispatch]);

  return <>{children}</>;
}
