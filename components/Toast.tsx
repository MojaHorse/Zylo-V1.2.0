import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Platform } from 'react-native';
import tw from 'twrnc';
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onHide: () => void;
    duration?: number;
}

export const Toast = ({ message, type, onHide, duration = 3000 }: ToastProps) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                speed: 12,
                bounciness: 5
            })
        ]).start();

        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 20,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start(() => onHide());
        }, duration);

        return () => clearTimeout(timer);
    }, []);

    let iconColor, Icon;

    switch (type) {
        case 'success':
            iconColor = '#10b981'; // emerald-500
            Icon = CheckCircle;
            break;
        case 'error':
            iconColor = '#ef4444'; // red-500
            Icon = XCircle;
            break;
        case 'warning':
            iconColor = '#f59e0b'; // amber-500
            Icon = AlertTriangle;
            break;
        case 'info':
        default:
            iconColor = '#4f46e5'; // indigo-600
            Icon = Info;
            break;
    }

    return (
        <Animated.View
            style={[
                tw`absolute bottom-10 left-4 right-4 bg-white border border-slate-200 p-4 rounded-2xl flex-row items-center shadow-lg z-50`,
                { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 8 },
                { opacity, transform: [{ translateY }] },
                Platform.OS === 'web' && { maxWidth: 400, alignSelf: 'center' }
            ]}
        >
            <Icon size={24} color={iconColor} style={tw`mr-3`} />
            <Text style={tw`font-semibold text-base flex-1 text-slate-800`}>{message}</Text>
        </Animated.View>
    );
};
