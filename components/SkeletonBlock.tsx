import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

type Props = {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: any;
};

export default function SkeletonBlock({
  width = "100%",
  height = 16,
  radius = 8,
  style,
}: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.block,
        {
          width,
          height,
          borderRadius: radius,
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: "#E1E9EE",
  },
});
