import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { connectSocket } from "@/services/socketService";

type ContentType = "products" | "banners";

/**
 * Écoute en temps réel (Socket.io, connexion partagée avec le reste de l'app)
 * les ajouts/modifications de "produits aléatoires" et de bannières faits
 * depuis admin-bimnext, et expose un état "nouveau contenu disponible" que
 * l'écran Home affiche sous forme de bannière "Mettre à jour" — l'utilisateur
 * clique pour recharger les données.
 */
export function useContentUpdate() {
  const [available, setAvailable] = useState(false);
  const [types, setTypes] = useState<Set<ContentType>>(new Set());

  useEffect(() => {
    let socket: ReturnType<typeof connectSocket> | null = null;
    let cancelled = false;

    const onUpdated = ({ type }: { type: ContentType }) => {
      setTypes(prev => new Set(prev).add(type));
      setAvailable(true);
    };

    AsyncStorage.getItem("userId").then(userId => {
      if (cancelled) return;
      socket = connectSocket(userId ?? undefined);
      socket.on("content:updated", onUpdated);
    });

    return () => {
      cancelled = true;
      socket?.off("content:updated", onUpdated);
    };
  }, []);

  const dismiss = useCallback(() => {
    setAvailable(false);
    setTypes(new Set());
  }, []);

  return { available, types, dismiss };
}
