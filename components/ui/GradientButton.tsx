import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { ThemedText } from "../themed-text";
import { Feather } from "@expo/vector-icons";

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoad ?:boolean
}

export default function GradientButton({
  title,
  onPress,
  leftIcon,
  rightIcon,
  isLoad = false,
}: GradientButtonProps) {

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
         colors={["#302E99", "#3906C7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >

          {leftIcon && (
            <View style={styles.leftIcon}>
              {leftIcon}
            </View>
          )}


        {
  isLoad ? (
    <Feather name="loader" size={24} color="white" style={{ flex: 1, textAlign: "center" }} />
  ) : (
    <ThemedText style={styles.text}>{title}</ThemedText>
  )
}


          

          {rightIcon && rightIcon}

        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    height: 56,
    width: "100%",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  leftIcon: {
    width: 40,
    height: 40,
    backgroundColor: "white",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
