import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from '@/store/store'; // chemin vers ton store

import 'react-native-reanimated';

import {
  Inter_400Regular,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    InterRegular: Inter_400Regular,
    InterSemiBold: Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Provider store={store}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
         <Stack>

        <Stack.Screen 
          name="onboarding" 
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="login" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="forgot-password" 
          options={{ headerShown: false }} 
        />
          <Stack.Screen 
          name="retrait"
          options={{ headerShown: false }} 
        />

         <Stack.Screen 
          name="history"
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="bim-carburant"
          options={{ headerShown: false }} 
        />

         <Stack.Screen 
          name="bim-energie"
          options={{ headerShown: false }} 
        />

          <Stack.Screen 
          name="hotellerie"
          options={{ headerShown: false }} 
        />

         <Stack.Screen 
          name="bim-gaz"
          options={{ headerShown: false }} 
        />

         <Stack.Screen 
          name="apropos"
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="terms"
          options={{ headerShown: false }} 
        />

          <Stack.Screen 
          name="transfert"
          options={{ headerShown: false }} 
        />
         <Stack.Screen 
          name="profile"
          options={{ headerShown: false }} 
        />

         <Stack.Screen 
          name="support"
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="faqs"
          options={{ headerShown: false }} 
        />


           <Stack.Screen 
          name="recharge"
          options={{ headerShown: false }} 
        />

           <Stack.Screen 
          name="check-pwd"
          options={{ headerShown: false }} 
        />


        <Stack.Screen 
          name="reset-password" 
          options={{ headerShown: false }} 
        />

         <Stack.Screen 
          name="verify-code" 
          options={{ headerShown: false }} 
        />

         <Stack.Screen 
          name="register" 
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="transport" 
          options={{ headerShown: false }} 
        />
        
        

        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} 
        />

          <Stack.Screen 
          name="receive" 
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="service" 
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="notification" 
          options={{ headerShown: false }} 
        />

         <Stack.Screen 
          name="sante" 
          options={{ headerShown: false }} 
        />
        

         
        
        
        <Stack.Screen 
          name="modal" 
          options={{ presentation: 'modal', title: 'Modal' }} 
        />

      </Stack>

        <StatusBar style="auto" />
      </ThemeProvider>
    </Provider>
  );
}

