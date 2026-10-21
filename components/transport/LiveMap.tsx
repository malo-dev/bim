import React, { useEffect, useRef } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { API_URL_BASE } from "@/constants/api";

/* Carte Google Maps en direct, servie par bim_server (/transport/map) et
 * affichée dans une WebView — pas de dépendance native (react-native-maps),
 * reste compatible Expo Go. La position du véhicule se met à jour en direct
 * via injectedJavaScript, sans recharger la page. */
type Props = {
  pickupLat?: number | null;
  pickupLng?: number | null;
  destLat?: number | null;
  destLng?: number | null;
  chauffeurLat?: number | null;
  chauffeurLng?: number | null;
  style?: any;
};

export default function LiveMap({ pickupLat, pickupLng, destLat, destLng, chauffeurLat, chauffeurLng, style }: Props) {
  const webRef = useRef<WebView>(null);
  const ready = useRef(false);

  const params = new URLSearchParams();
  if (pickupLat != null && pickupLng != null) { params.set("pickupLat", String(pickupLat)); params.set("pickupLng", String(pickupLng)); }
  if (destLat != null && destLng != null) { params.set("destLat", String(destLat)); params.set("destLng", String(destLng)); }
  const uri = `${API_URL_BASE}/transport/map?${params.toString()}`;

  useEffect(() => {
    if (!ready.current || chauffeurLat == null || chauffeurLng == null) return;
    webRef.current?.injectJavaScript(
      `window.updateChauffeurPosition && window.updateChauffeurPosition(${chauffeurLat}, ${chauffeurLng}); true;`
    );
  }, [chauffeurLat, chauffeurLng]);

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        ref={webRef}
        source={{ uri }}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg.type === "ready") {
              ready.current = true;
              if (chauffeurLat != null && chauffeurLng != null) {
                webRef.current?.injectJavaScript(
                  `window.updateChauffeurPosition && window.updateChauffeurPosition(${chauffeurLat}, ${chauffeurLng}); true;`
                );
              }
            }
          } catch {}
        }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}><ActivityIndicator color="#0062FF" /></View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: "hidden" },
  web: { flex: 1, backgroundColor: "transparent" },
  loading: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: "#EEF2F8" },
});
