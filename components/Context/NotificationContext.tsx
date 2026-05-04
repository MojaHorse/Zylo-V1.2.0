import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { supabase } from '../../lib/supabase';
import { useAuth } from './AuthContext';
import { Platform } from 'react-native';

export type AppNotification = {
    id: string;
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    data?: any;
};

type NotificationContextType = {
    notifications: AppNotification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Configure expo-notifications behavior for when the app is foregrounded
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const { user } = useAuth();
    const notificationListener = useRef<Notifications.Subscription | null>(null);

    useEffect(() => {
        if (!user) return;

        console.log("Registering for push notifications...");
        registerForPushNotificationsAsync().then(token => {
            if (token) {
                // Save Push token to supabase so our edge function can find it
                const saveToken = async () => {
                    // Check if token already exists to avoid duplicate constraint errors
                    const { data: existing } = await supabase
                        .from('user_push_tokens')
                        .select('id')
                        .eq('token', token)
                        .single();

                    if (!existing) {
                        const { error } = await supabase.from('user_push_tokens').insert({
                            user_id: user.id,
                            token: token
                        });
                        
                        if (error) console.error("Error saving push token to DB:", error);
                    }
                };
                
                saveToken();
            }
        });

        // Listen for incoming notifications while the app is actively open
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            const newNotif: AppNotification = {
                id: notification.request.identifier || Date.now().toString(),
                title: notification.request.content.title || 'New Alert',
                message: notification.request.content.body || '',
                timestamp: Date.now(),
                read: false,
                data: notification.request.content.data,
            };

            // Prepend new notification
            setNotifications(prev => [newNotif, ...prev]);
        });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
        };
    }, [user]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationContext = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotificationContext must be used within a NotificationProvider');
    return ctx;
};

// Helper: Get token and request permission
async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4f46e5',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // Request permission if not granted
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted.');
        return null; // Return null if user denied
    }

    try {
        const tokenResponse = await Notifications.getExpoPushTokenAsync({
            // Assuming default projectId config is in app.json for EAS
        });
        token = tokenResponse.data;
    } catch (e) {
        console.error("Failed to get push token:", e);
    }
    
    return token;
}
