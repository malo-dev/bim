import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const colorScheme  = useColorScheme();
  const isDark       = colorScheme === 'dark';
  const themeColors  = Colors[colorScheme ?? 'light'];

  /* ── Couleurs selon le thème ── */
  // En dark : gradient plus profond/nuit, icône active en bleu clair
  const gradientColors: [string, string] = isDark
    ? ['#0D1628', '#111936']
    : ['#0353CC', '#070599'];

  const activeColor  = isDark ? '#4D96FF' : '#FFFFFF';
  const inactiveColor = isDark ? 'rgba(148,163,184,0.6)' : 'rgba(255,255,255,0.5)';
  const scanBg        = isDark ? '#1E3A6E' : '#0353CC';
  const scanIconColor = '#FFFFFF';

  /* ── Tab bar background ── */
  const TabBarBackground = () => (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBackground}
    >
      <BlurView
        intensity={isDark ? 30 : 50}
        tint={isDark ? 'dark' : 'default'}
        style={styles.blurBackground}
      />
      {/* Bordure subtile en dark */}
      {isDark && <View style={styles.darkBorder} />}
    </LinearGradient>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: [
          styles.tabBar,
          {
            shadowColor:   isDark ? '#000' : '#000',
            shadowOpacity: isDark ? 0.4 : 0.15,
            // Bordure top en dark pour délimiter la tab bar
            borderTopWidth:  isDark ? 1 : 0,
            borderTopColor:  isDark ? 'rgba(77,150,255,0.15)' : 'transparent',
          },
        ],
        tabBarBackground:  TabBarBackground,
        tabBarLabelStyle:  [
          styles.tabLabel,
          { color: inactiveColor }, // fallback, écrasé par active/inactive tint
        ],
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {/* Accueil */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="home" color={color} />
          ),
        }}
      />

      {/* Réseaux */}
      <Tabs.Screen
        name="reseaux"
        options={{
          title: 'Réseaux',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="people" color={color} />
          ),
        }}
      />

      {/* Scan QR Code central */}
      <Tabs.Screen
        name="scan"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={[
              styles.scanTab,
              {
                backgroundColor: scanBg,
                // En dark : bordure bleu pour faire ressortir le bouton
                borderWidth: isDark ? 1.5 : 0,
                borderColor: isDark ? 'rgba(77,150,255,0.40)' : 'transparent',
                shadowColor:    isDark ? '#4D96FF' : '#000',
                shadowOpacity:  isDark ? 0.35 : 0.20,
              },
            ]}>
              <Ionicons size={28} name="qr-code" color={scanIconColor} />
            </View>
          ),
        }}
      />

      {/* Statistiques */}
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="bar-chart" color={color} />
          ),
        }}
      />

      {/* Paramètres */}
      <Tabs.Screen
        name="params"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="settings-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position:        'absolute',
    bottom:          0,
    left:            15,
    right:           15,
    height:          125,
    borderRadius:    35,
    backgroundColor: 'transparent',
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    shadowOffset:    { width: 0, height: 5 },
    shadowRadius:    10,
    elevation:       5,
    paddingHorizontal: 5,
  },

  gradientBackground: {
    flex:         1,
    borderRadius: 35,
    overflow:     'hidden',
  },

  blurBackground: {
    ...StyleSheet.absoluteFillObject,
  },

  /* Bordure interne visible uniquement en dark */
  darkBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 35,
    borderWidth:  1,
    borderColor:  'rgba(77,150,255,0.12)',
  },

  tabLabel: {
    fontSize:    11,
    fontFamily:  'NexaLight',
  },

  tabItem: {
    flex:        1,
    alignItems:  'center',
  },

  scanTab: {
    width:        60,
    height:       60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems:     'center',
    marginTop:    -5,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation:    4,
  },
});