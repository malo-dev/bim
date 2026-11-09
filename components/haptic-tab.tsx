import * as Haptics from 'expo-haptics';
import { Pressable, type GestureResponderEvent, type PressableProps } from 'react-native';

// Bouton d'onglet avec retour haptique léger sur iOS (SDK 58 : sans @react-navigation).
export function HapticTab(props: PressableProps) {
  return (
    <Pressable
      {...props}
      onPressIn={(ev: GestureResponderEvent) => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
