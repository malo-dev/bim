import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Filet de sécurité global : sans ça, une exception pendant le rendu
 * (n'importe quel écran) fait planter tout l'arbre React et affiche un
 * écran blanc silencieux en production (pas de RedBox comme en dev).
 * Ici on affiche un écran d'erreur récupérable à la place, avec un bouton
 * pour reprendre — indispensable vu la taille de l'app.
 */
type Props = { children: React.ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Crash intercepté :", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: "#0B1220", alignItems: "center", justifyContent: "center", padding: 28, gap: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(239,68,68,0.12)", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="warning-outline" size={34} color="#EF4444" />
          </View>
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#EAF0FF", textAlign: "center" }}>
            Un problème est survenu
          </Text>
          <Text style={{ fontSize: 13, color: "#9FB0D0", textAlign: "center", lineHeight: 19 }}>
            Quelque chose s'est mal passé sur cet écran. Réessayez, ou contactez le support si le
            problème persiste.
          </Text>
          <TouchableOpacity
            onPress={this.reset}
            style={{ backgroundColor: "#0047FF", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
