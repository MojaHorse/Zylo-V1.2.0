import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

interface Props {
    visible: boolean;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export default function AnimatedModalContainer({ visible, children, style }: Props) {
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        if (visible) {
            scaleAnim.setValue(0.9);
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                bounciness: 8,
                speed: 24,
            }).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
            {children}
        </Animated.View>
    );
}
