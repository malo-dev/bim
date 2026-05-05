import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  name,
  focused,
  color,
  size,
}: {
  name: { active: IoniconsName; inactive: IoniconsName };
  focused: boolean;
  color: string;
  size: number;
}) {
  return (
    <Ionicons
      name={focused ? name.active : name.inactive}
      size={size}
      color={color}
    />
  );
}

function ScanIcon({ focused, isDark }: { focused: boolean; isDark: boolean }) {
  return (
    <View
      style={[
        styles.scanWrap,
        {
          backgroundColor: isDark ? "#1E3A6E" : "#0353CC",
          shadowColor:     "#0353CC",
          shadowOffset:    { width: 0, height: 3 },
          shadowOpacity:   0.35,
          shadowRadius:    6,
          elevation:       6,
          borderWidth:     focused ? 2 : 0,
          borderColor:     focused ? (isDark ? "#6AA8FF" : "#FFFFFF") : "transparent",
        },
      ]}
    >
      <Ionicons
        name={focused ? "qr-code" : "qr-code-outline"}
        size={26}
        color="#FFFFFF"
      />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark      = colorScheme === "dark";
  const theme       = Colors[colorScheme ?? "light"];

  return (
    <Tabs
      screenOptions={{
        headerShown:             false,
        tabBarActiveTintColor:   theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: isDark ? "#0D1628" : "#FFFFFF",
          borderTopWidth:  StyleSheet.hairlineWidth,
          borderTopColor:  isDark ? "rgba(77,150,255,0.18)" : "rgba(0,0,0,0.12)",
          paddingTop:      Platform.OS === "ios" ? 6 : 4,
          shadowColor:     "#000",
          shadowOffset:    { width: 0, height: -2 },
          shadowOpacity:   isDark ? 0.4 : 0.08,
          shadowRadius:    8,
          elevation:       isDark ? 8 : 4,
        },
        tabBarLabelStyle: {
          fontSize:     10,
          fontFamily:   "NexaLight",
          marginBottom: Platform.OS === "android" ? 4 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name={{ active: "home", inactive: "home-outline" }}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="reseaux"
        options={{
          title: "Réseaux",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name={{ active: "people", inactive: "people-outline" }}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <ScanIcon focused={focused} isDark={isDark} />
          ),
        }}
      />

      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name={{ active: "bar-chart", inactive: "bar-chart-outline" }}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="params"
        options={{
          title: "Paramètres",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name={{ active: "settings", inactive: "settings-outline" }}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scanWrap: {
    width:          52,
    height:         52,
    borderRadius:   26,
    alignItems:     "center",
    justifyContent: "center",
    marginBottom:   Platform.OS === "ios" ? 6 : 0,
  },
});
