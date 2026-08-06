import axiosInstance from "@/services/axiosInstance";
import { notificationApi } from "@/services/notificationService";
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
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
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
    // console.warn("Expo push token error:", e);
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

      /* Connecter le socket en premier (avant registerPushToken qui est lent) */
      const socket = connectSocket(userId);
      socketRef.current = socket;

      socket.on("notification", () => {
        dispatch(notificationApi.util.invalidateTags(["Notifications"]));
        dispatch(userApi.util.invalidateTags(["User"]));
      });

      /* Enregistrement push notifications (async, ne bloque plus le socket) */
      registerPushToken(userId);
    }

    setup();

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
      disconnectSocket();
      notifListenerRef.current?.remove();
      appStateSub.remove();
      logoutSub.remove();
    };
  }, [dispatch]);

  return <>{children}</>;
}
