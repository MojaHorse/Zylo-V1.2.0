import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

export interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
    scaleTo?: number;
    style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
}

export default function AnimatedPressable({ 
    style, 
    scaleTo = 0.96, 
    onPressIn, 
    onPressOut, 
    ...props 
}: AnimatedPressableProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [isPressed, setIsPressed] = React.useState(false);

    const handlePressIn = (e: any) => {
        setIsPressed(true);
        Animated.spring(scaleAnim, {
            toValue: scaleTo,
            useNativeDriver: true,
            speed: 40,
            bounciness: 5,
        }).start();
        if (onPressIn) onPressIn(e);
    };

    const handlePressOut = (e: any) => {
        setIsPressed(false);
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 30,
            bounciness: 8,
        }).start();
        if (onPressOut) onPressOut(e);
    };

    const evaluatedStyle = typeof style === 'function' ? style({ pressed: isPressed }) : style;

    return (
        <AnimatedPressableComponent
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
                evaluatedStyle,
                { transform: [{ scale: scaleAnim }] }
            ]}
            {...props}
        />
    );
}
