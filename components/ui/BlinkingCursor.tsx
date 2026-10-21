import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";

// Curseur clignotant manuel : les champs mot de passe/code masqués par
// points (voir onboarding.tsx, gestion/login.tsx, params.tsx) utilisent un
// TextInput invisible pour capter la saisie — son propre curseur natif est
// donc invisible aussi, ce qui ne donne plus aucun repère visuel à
// l'utilisateur pour savoir où il écrit. On rejoue ce repère nous-mêmes.
export default function BlinkingCursor({ color, height = 16, width = 2 }: { color: string; height?: number; width?: number }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return <Animated.View style={{ width, height, borderRadius: 1, backgroundColor: color, opacity }} />;
}
