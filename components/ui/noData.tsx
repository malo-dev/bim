import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg"; // SVG inline

export default function NotFound() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
        backgroundColor: "#F5F6FA", // fond neutre gris clair
      }}
    >
      {/* SVG “Not Found” stylisé */}
      <Svg height={150} width={150} viewBox="0 0 64 64">
        {/* Cercle extérieur */}
        <Circle cx="32" cy="32" r="30" stroke="#999" strokeWidth="2" fill="none" />
        {/* Croix X */}
        <Path d="M20 20 L44 44 M44 20 L20 44" stroke="#999" strokeWidth="3" strokeLinecap="round" />
      </Svg>

      {/* Texte principal */}
      <Text
        style={{
          fontSize: 22,
          color: "#333",
          textAlign: "center",
          fontFamily: "InterSemiBold",
          marginTop: 25,
        }}
      >
        Aucune donnée trouvée
      </Text>

      {/* Texte secondaire */}
      <Text
        style={{
          fontSize: 16,
          color: "#666",
          textAlign: "center",
          marginTop: 10,
        }}
      >
        Il n’y a aucune information disponible pour ce service pour le moment.
      </Text>
    </View>
  );
}
