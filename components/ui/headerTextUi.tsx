import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function HeaderRow() {
  const [hover, setHover] = useState(false);
const router = useRouter()
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: 10,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
        }}
      >
        Explorez les Secteurs BIM
      </Text>

      <Pressable
        onHoverIn={() => setHover(true)}
              onHoverOut={() => setHover(false)}
              onPress={()=>router.push('/reseaux')}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: hover ? "#3906C7" : "#999",
          }}
        >
          Voir plus
        </Text>
      </Pressable>
    </View>
  );
}
