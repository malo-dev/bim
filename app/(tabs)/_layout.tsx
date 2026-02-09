import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  const TabBarBackground = () => (
    <LinearGradient
     colors={['#302E99', '#3906C7']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBackground}
    >
      <BlurView intensity={50} style={styles.blurBackground} />
    </LinearGradient>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeColors.tint,
        tabBarInactiveTintColor: '#FFFFFF',
        tabBarStyle: styles.tabBar,
        tabBarBackground: TabBarBackground,
        tabBarLabelStyle: { fontSize: 11 },
        tabBarItemStyle: { flex: 1, alignItems: 'center' }, // Important pour centrer
      }}
    >
      {/* Accueil */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="home" color={color} />,
        }}
      />

      {/* Réseaux */}
      <Tabs.Screen
        name="reseaux"
        options={{
          title: 'Réseaux',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="people" color={color} />,
        }}
      />

      {/* Scan QR Code central */}
      <Tabs.Screen
        name="scan"
        options={{
          title: '',
          tabBarIcon: ({ color }) => (
            <View style={[styles.scanTab, { backgroundColor: themeColors.tint }]}>
              <Ionicons size={28} name="qr-code" color="#fff" />
            </View>
          ),
        }}
      />

      {/* Statistiques */}
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="bar-chart" color={color} />,
        }}
      />

      {/* Paramètres */}
      <Tabs.Screen
        name="params"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="settings-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 0 : 0,
    left: 15,
    right: 15,
    height: 125,
    borderRadius: 35,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between', // ← ici on met space-between
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    paddingHorizontal: 5, // pour un centrage parfait
  },
  gradientBackground: {
    flex: 1,
    borderRadius: 35,
    overflow: 'hidden',
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  scanTab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -5, // léger flottant intégré
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
});
