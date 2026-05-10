import React from 'react';
import { Text } from 'react-native';
import tw from 'twrnc';
import * as Haptics from 'expo-haptics';
import AnimatedPressable from './AnimatedPressable';

interface Props {
    label: string;
    isActive: boolean;
    onPress: () => void;
}

export default function CategoryPill({ label, isActive, onPress }: Props) {
    const handlePress = () => {
        Haptics.selectionAsync();
        onPress();
    };

    return (
        <AnimatedPressable
            onPress={handlePress}
            style={({ pressed }) => [
                tw`px-5 py-2.5 rounded-xl border flex-row items-center justify-center transition-all`,
                isActive
                    ? tw`bg-indigo-600 border-indigo-700 shadow-sm`
                    : tw`bg-white border-slate-200 shadow-sm`,
                pressed && tw`opacity-80`
            ]}
        >
            <Text style={[
                tw`font-bold text-sm`,
                isActive ? tw`text-white` : tw`text-slate-600`
            ]}>
                {label}
            </Text>
        </AnimatedPressable>
    );
}