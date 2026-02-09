import { slides } from "@/assets/mockdata/slidersOnboarding.mock";
import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import { useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  StatusBar,
  Text,
  View
} from "react-native";

import GradientButton from "@/components/ui/GradientButton";
const { width } = Dimensions.get("window");

function VideoSlide({ source }: { source: any }) {
  const player = useVideoPlayer(source, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <VideoView
      player={player}
      style={{ width: 300, height: 300 }}
      contentFit="contain"
    />
  );
}



function ImageSlide({ source }: { source: any }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: -10,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 10,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.Image
      source={source}
      style={{
        width: 300,
        height: 300,
        transform: [{ translateY: anim }],
      }}
      resizeMode="contain"
    />
  );
}

function SlideItem({ item }: any) {
  return (
    <View
      style={{
        width,
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 64,
        paddingHorizontal: 30,
      }}
    >
      {item.type === "video" ? (
        <VideoSlide source={item.source} />
      ) : (
        <ImageSlide source={item.source} />
      )}

      <Text
        style={{
          fontSize: 30,
          fontFamily: "InterSemiBold",
          textAlign: "center",
          marginTop: 32,
        }}
      >
        {item.title}
      </Text>

      <Text
        style={{
          textAlign: "center",
          fontSize: 16,
          lineHeight: 28,
          fontFamily: "InterMedium",
          fontWeight:'500',
          marginTop: 16,
        }}
      >
        {item.description}
      </Text>
    </View>
  );
}


export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  // Animation bouton
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, [scaleAnim]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
   
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#fff"
        translucent={true}
      />

      <FlatList
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(i);
        }}
        renderItem={({ item }) => <SlideItem item={item} />}
      />

   
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginBottom: 40,
        }}
      >
        {slides.map((_, i) => (
          <View
            key={i}
            style={{
              height: 8,
              width: index === i ? 22 : 8,
              backgroundColor: index === i ? "#1561CC" : "#ccc",
              marginHorizontal: 4,
              borderRadius: 4,
            }}
          />
        ))}
      </View>

   <View style={{marginBottom:60,paddingInline:20,paddingBlock:10}}>
      <GradientButton
  title="Commencer"
  onPress={() => router.replace("/login")}
  leftIcon={<ArrowIcon width={20} height={14} color="#3A3AB7" />}
  rightIcon={<ArrowRightIcon width={30} height={24} />}
/>
   </View>

    </View>
  );
}
