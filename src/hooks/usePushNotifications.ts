import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/Context/AuthContext';

// Configure behavior (Banner + List)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  
  // 👇 FIXED: Initialized with 'null' to satisfy TypeScript
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!user) return;

    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
      if (token) saveTokenToDatabase(token);
    });

    // Store subscription
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("🔔 Notification Received:", notification);
    });

    // Store response subscription
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("👆 User tapped notification:", response);
    });

    return () => {
      // 👇 FIXED: Used .remove() directly on the subscription object
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user]);

  const saveTokenToDatabase = async (token: string) => {
    if (!user) return;

    const { error } = await supabase
        .from('user_push_tokens')
        .upsert({ 
            user_id: user.id, 
            token: token,
            device_name: Device.modelName || 'Unknown Device',
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, token' });

    if (error) console.error("❌ Failed to save push token:", error.message);
    else console.log("✅ Push Token saved to Supabase!");
  };

  return { expoPushToken };
};

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ Permission not granted for push notifications');
      return;
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    
    try {
        const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        token = pushTokenData.data;
        console.log("📱 Device Token:", token);
    } catch (e) {
        console.error("Error fetching token:", e);
    }
  } else {
    console.log('⚠️ Must use physical device for Push Notifications');
  }

  return token;
}

