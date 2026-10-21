import React from "react";
import { ScrollView, StyleProp, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// Carousel horizontal de pastilles (filtres, onglets...) avec un léger
// fondu sur le bord droit pour indiquer qu'on peut scroller — sans ça, une
// ligne de pastilles qui dépasse l'écran se coupe net, sans aucun indice
// visuel qu'il y a plus de contenu à droite.
export default function HorizontalFadeScroll({
  children, bg, contentStyle,
}: { children: React.ReactNode; bg: string; contentStyle?: StyleProp<ViewStyle> }) {
  return (
    <View style={{ position: "relative" }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={contentStyle}>
        {children}
      </ScrollView>
      <LinearGradient
        colors={["transparent", bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        pointerEvents="none"
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 24 }}
      />
    </View>
  );
}
