import axiosInstance from "@/services/axiosInstance";
import { notificationApi } from "@/services/notificationService";
import { orderApi } from "@/services/orderService";
import { productApi } from "@/services/productServices";
import { connectSocket, disconnectSocket } from "@/services/socketService";
import { userApi } from "@/services/userService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef } from "react";
import { Alert, AppState, AppStateStatus, DeviceEventEmitter, Platform } from "react-native";
import { useDispatch } from "react-redux";
import { useRouter } from "expo-router";
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

  try {
    // Android 13+ : le canal doit exister AVANT la demande d'autorisation,
    // sinon la fenêtre « Autoriser les notifications » n'apparaît jamais.
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "BIM Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0353CC",
        sound: "default",
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    // Le jeton est envoyé à CHAQUE ouverture / connexion pour le compte
    // connecté : l'ancien cache « déjà synchronisé » n'était pas lié au compte,
    // donc après un changement de compte sur le même téléphone le nouveau
    // compte ne recevait jamais rien.
    if (await AsyncStorage.getItem("token")) {
      await axiosInstance.post(`/auth/users/${userId}/expoPushToken`, { tokenPush: token });
      await AsyncStorage.setItem("expoPushToken", token);
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
  const router = useRouter();
  const socketRef   = useRef<ReturnType<typeof connectSocket> | null>(null);
  const userIdRef   = useRef<string | null>(null);
  const notifListenerRef = useRef<Notifications.Subscription | null>(null);
  const appStateRef = useRef<AppStateStatus>((AppState.currentState ?? "active") as AppStateStatus);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId || !mounted) return;

      // Toujours (ré)enregistrer le jeton push pour le compte connecté.
      registerPushToken(userId);

      // Socket déjà ouvert pour CE compte → rien à refaire. S'il appartient à
      // un autre compte (déconnexion puis connexion avec un autre compte), on
      // le ferme : sinon les événements continuaient d'arriver pour l'ancien.
      if (socketRef.current?.connected && userIdRef.current === userId) return;
      if (socketRef.current) {
        socketRef.current.off("notification");
        disconnectSocket();
        socketRef.current = null;
      }
      userIdRef.current = userId;

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

      // Produit ajouté / modifié / masqué depuis l'admin → catalogue rechargé.
      socket.on("content:updated", (e: { type?: string }) => {
        if (e?.type === "products") dispatch(productApi.util.invalidateTags(["product"]));
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

      // Connexion détectée depuis un autre appareil avec ce même numéro —
      // on laisse les deux connexions actives, mais on prévient le
      // propriétaire pour qu'il puisse réagir si ce n'était pas lui.
      socket.on("auth:new_device_login", () => {
        Alert.alert(
          "Nouvelle connexion détectée",
          "Votre compte BIM NEXT vient d'être utilisé depuis un autre appareil. Est-ce vous ?",
          [
            { text: "Oui, c'est moi", style: "cancel" },
            { text: "Non, sécuriser mon compte", style: "destructive", onPress: () => router.push("/securiser-compte" as any) },
          ]
        );
      });

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
