/**
 * Barre de navigation BIM NEXT : Accueil · Scanner · Profil (maquette).
 * Les autres onglets restent dans Réglages (non affichés ici).
 */
import { BlurTargetView, BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React, { useEffect, useRef, type ComponentProps, type ComponentRef } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BimIcon } from "@/components/bim/icons";
import { useTh } from "@/components/bim/theme";
import { TabBlurProvider, useTabBlur } from "@/components/bim/tabBlur";
import { T, tap } from "@/components/bim/ui";

const VISIBLE = ["index", "profil"];

/* Chaque onglet est une cible de flou pour la barre (voir components/bim/tabBlur.tsx). */
function TabScreenTarget({ name, children }: { name: string; children: React.ReactNode }) {
  const ref = useRef<ComponentRef<typeof View> | null>(null);
  const { register } = useTabBlur();
  useEffect(() => { register(name, ref); }, [name]);
  return <BlurTargetView ref={ref} style={{ flex: 1 }}>{children}</BlurTargetView>;
}

/** Enfoncement + rebond à l'appui (comme les boutons de la maquette). */
function usePress(to = 0.88) {
  const p = useRef(new Animated.Value(0)).current;
  const onPressIn = () => { tap(); Animated.timing(p, { toValue: 1, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(); };
  const onPressOut = () => Animated.spring(p, { toValue: 0, friction: 4, tension: 180, useNativeDriver: true }).start();
  return { onPressIn, onPressOut, scale: p.interpolate({ inputRange: [0, 1], outputRange: [1, to] }) };
}

type TabBarProps = NonNullable<ComponentProps<typeof Tabs>["tabBar"]> extends (props: infer P) => any ? P : never;

function SideTab({ label, icon, focused, onPress }: { label: string; icon: "home" | "user"; focused: boolean; onPress: () => void }) {
  const th = useTh();
  const v = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const pr = usePress();
  useEffect(() => { Animated.spring(v, { toValue: focused ? 1 : 0, friction: 6, tension: 120, useNativeDriver: true }).start(); }, [focused]);
  return (
    <Pressable onPress={onPress} onPressIn={pr.onPressIn} onPressOut={pr.onPressOut} style={{ flex: 1, alignItems: "center", justifyContent: "center", height: 70 }} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={label} hitSlop={8}>
      <Animated.View style={{ alignItems: "center", gap: 4, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }, { scale: pr.scale }, { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }] }}>
        <BimIcon name={icon} size={22} color={focused ? th.fg : th.muted} filled={focused && icon === "home"} />
        <T w={focused ? "bold" : "regular"} size={11} color={focused ? th.fg : th.muted}>{label}</T>
      </Animated.View>
    </Pressable>
  );
}

function ScanTab({ onPress }: { onPress: () => void }) {
  const th = useTh();
  const ring = useRef(new Animated.Value(0)).current;
  const pr = usePress(0.86);
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(ring, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }));
    loop.start(); return () => loop.stop();
  }, []);
  return (
    <Pressable onPress={onPress} onPressIn={pr.onPressIn} onPressOut={pr.onPressOut} accessibilityRole="tab" accessibilityLabel="Scanner" style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Animated.View pointerEvents="none" style={{ position: "absolute", width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: th.aura ? th.scan : th.glass(0.55),
        opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }), transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }] }} />
      <Animated.View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: th.scan, alignItems: "center", justifyContent: "center", transform: [{ scale: pr.scale }],
        boxShadow: th.aura ? `0 8px 22px ${th.scan}99` : "0 8px 20px rgba(0,0,0,0.3)" }}>
        <BimIcon name="scan" size={24} color={th.onScan} strokeWidth={1.9} />
      </Animated.View>
    </Pressable>
  );
}

function BimTabBar({ state, navigateToTab }: TabBarProps) {
  const th = useTh();
  const { targets, covered } = useTabBlur();
  const current0 = state.routes[state.index]?.name;
  // Le flou (et le fond de la barre) n'apparaît que si du contenu passe sous la barre — fondu animé.
  const blur = useRef(new Animated.Value(0)).current;
  const on = !!covered[current0];
  useEffect(() => { Animated.timing(blur, { toValue: on ? 1 : 0, duration: 320, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }).start(); }, [on]);
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name;
  if (!VISIBLE.includes(current)) return null;
  const press = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    if (current !== name) navigateToTab(route.key);
  };
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: 50, right: 50, bottom: (insets.bottom > 0 ? insets.bottom : 0) + 18, zIndex: 999, elevation: 999 }}>
      <View style={{ height: 70, borderRadius: 35, flexDirection: "row", alignItems: "center" }}>
        {/* La barre reste toujours visible ; seule l'opacité du flou / du fond change (fondu animé). */}
        <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, borderRadius: 35, overflow: "hidden", borderWidth: 1, borderColor: th.glass(0.18),
          boxShadow: `${th.glassFx}, 0 12px 30px rgba(0,0,0,0.25)`, backgroundColor: th.navBg }}>
          <Animated.View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, opacity: blur }}>
          <BlurView blurTarget={targets[current]} blurMethod="dimezisBlurViewSdk31Plus" intensity={34} tint={th.light ? "light" : "dark"}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
          <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: th.navBg }} />
          </Animated.View>
        </View>
        <SideTab label="Accueil" icon="home" focused={current === "index"} onPress={() => press("index")} />
        <ScanTab onPress={() => press("scan")} />
        <SideTab label="Profil" icon="user" focused={current === "profil"} onPress={() => press("profil")} />
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <TabBlurProvider>
    <Tabs screenOptions={{ headerShown: false, lazy: true, animation: "shift" }} tabBar={(props) => <BimTabBar {...props} />}
      screenLayout={({ route, children }) => <TabScreenTarget name={route.name}>{children}</TabScreenTarget>}>
      <Tabs.Screen name="index"   options={{ title: "Accueil" }} />
      <Tabs.Screen name="scan"    options={{ title: "Scanner" }} />
      <Tabs.Screen name="profil"  options={{ title: "Profil" }} />
      <Tabs.Screen name="params"  options={{ title: "Réglages avancés", href: null }} />
      <Tabs.Screen name="reseaux" options={{ title: "Réseaux", href: null }} />
      <Tabs.Screen name="stats"   options={{ title: "Stats", href: null }} />
    </Tabs>
    </TabBlurProvider>
  );
}
