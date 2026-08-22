import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { useEffect, useRef } from "react";
import { useAppTheme } from "@/app/_layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const W = {
  primary: "#0047FF",
  text:    "#1A1C1C",
  muted:   "#B0B4CC",
  white:   "#FFFFFF",
  border:  "#E8EDF5",
};

const TAB_CONFIG = [
  { name: "index",   label: "Accueil", icon: { active: "home",      inactive: "home-outline"      } },
  { name: "reseaux", label: "Réseaux", icon: { active: "people",    inactive: "people-outline"    } },
  { name: "scan",    label: "Scan",    icon: { active: "qr-code",   inactive: "qr-code-outline"   }, isCenter: true },
  { name: "stats",   label: "Stats",   icon: { active: "bar-chart", inactive: "bar-chart-outline" } },
  { name: "params",  label: "Params",  icon: { active: "settings",  inactive: "settings-outline"  } },
] as const;

function TabItem({
  config,
  focused,
  onPress,
}: {
  config: typeof TAB_CONFIG[number];
  focused: boolean;
  onPress: () => void;
}) {
  const { isDark } = useAppTheme();
  const dropScale = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    dropScale.stopAnimation();
    Animated.spring(dropScale, {
      toValue: focused ? 1 : 0,
      friction: 7,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [focused, dropScale]);

  if ("isCenter" in config && config.isCenter) {
    return (
      <Pressable style={tb.centerWrap} onPress={onPress} hitSlop={10}>
        <View style={[tb.fab, !focused && tb.fabMuted, !focused && isDark && { backgroundColor: "#1A2540" }]}>
          <Ionicons
            name={focused ? "qr-code" : "qr-code-outline"}
            size={26}
            color={focused ? W.white : W.muted}
          />
        </View>
        <Text style={[tb.label, focused && tb.labelActive, focused && isDark && { color: "#4D8DFF" }]}>Scan</Text>
      </Pressable>
    );
  }

  const iconName = focused ? config.icon.active : config.icon.inactive;

  return (
    <Pressable style={tb.tabItem} onPress={onPress} hitSlop={10}>
      <View style={tb.iconWrap}>
        <Animated.View
          pointerEvents="none"
          style={[tb.liquidDrop, { transform: [{ scale: dropScale }] }]}
        />
        <Ionicons
          name={iconName as any}
          size={22}
          color={focused ? W.white : W.muted}
        />
      </View>
      <Text style={[tb.label, focused && tb.labelActive, focused && isDark && { color: "#4D8DFF" }]}>
        {config.label}
      </Text>
    </Pressable>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomPos = insets.bottom > 0 ? insets.bottom + 8 : 16;

  return (
    <View style={[tb.container, { bottom: bottomPos }]}>
      <View style={[tb.pill, isDark && { backgroundColor: "rgba(26,37,64,0.95)", borderColor: "rgba(31,42,68,0.80)" }]}>
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG.find(c => c.name === route.name) ?? TAB_CONFIG[index];
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem key={route.key} config={config} focused={focused} onPress={onPress} />
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, lazy: true }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index"   options={{ title: "Accueil" }} />
      <Tabs.Screen name="reseaux" options={{ title: "Réseaux" }} />
      <Tabs.Screen name="scan"    options={{ title: ""        }} />
      <Tabs.Screen name="stats"   options={{ title: "Stats"   }} />
      <Tabs.Screen name="params"  options={{ title: "Params"  }} />
    </Tabs>
  );
}

const PILL_HEIGHT = 68;

const tb = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16, right: 16,
    alignItems: "center",
    zIndex: 999,
    elevation: 999,
  },

  pill: {
    flexDirection: "row",
    alignItems: "flex-end",
    width: "100%",
    height: PILL_HEIGHT,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 40,
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.13,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },

  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingTop: 8,
  },

  iconWrap: {
    width: 44, height: 44,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },

  liquidDrop: {
    position: "absolute",
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: W.primary,
    shadowColor: W.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  label: {
    fontFamily: "NexaRegular",
    fontSize: 9,
    color: W.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  labelActive: {
    fontFamily: "NexaBold",
    color: W.primary,
  },

  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
    gap: 3,
  },
  fab: {
    width: 54, height: 54,
    borderRadius: 27,
    backgroundColor: W.primary,
    alignItems: "center", justifyContent: "center",
    elevation: 10,
    shadowColor: W.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.9)",
  },
  fabMuted: {
    backgroundColor: "#E8EDF5",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderColor: "rgba(255,255,255,0.9)",
  },
});
