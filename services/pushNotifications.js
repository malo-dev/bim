// services/pushNotifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';

/**
 * Enregistre l'appareil pour les notifications push Expo
 * et configure le channel Android avec son et vibration.
 * @returns {Promise<string|undefined>} Expo Push Token
 */
export const registerForPushNotificationsAsync = async () => {
  let token;

  if (!Device.isDevice) {
    Alert.alert('Vous devez utiliser un vrai appareil pour les notifications push!');
    return;
  }

  try {
    // Vérifie les permissions existantes
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Si pas encore accordé, demande la permission
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Échec de l’activation des notifications push!');
      return;
    }

    // Récupère le token Expo
    const expoPushTokenData = await Notifications.getExpoPushTokenAsync();
    token = expoPushTokenData.data;

    // Configure le channel Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: true, // Active le son sur Android
      });
    }

    return token;

  } catch (error) {
    console.error('Erreur lors de l’enregistrement des notifications push:', error);
    return;
  }
};

/**
 * Affiche une notification locale immédiatement (utile pour test ou push interne)
 * @param {string} title 
 * @param {string} body 
 */
export const sendLocalNotification = async (title, body) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
      sound: true,
    },
    trigger: null, // immédiat
  });
};
