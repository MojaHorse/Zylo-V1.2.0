import React from 'react';
import { View } from 'react-native';
import tw from 'twrnc';
import { Skeleton } from './Skeleton';
import { useTheme } from '../Context/ThemeContext'; // 👈 Fixed Path

interface Props {
    width?: string;
}

export const StatCardSkeleton = ({ width = "w-[48%]" }: Props) => {
    const { colors } = useTheme();
    return (
        <View style={[
            tw`${width} p-4 rounded-2xl mb-4 border justify-between`,
            { backgroundColor: colors.surfaceHighlight, borderColor: colors.border, height: 120 }
        ]}>
            <View style={tw`flex-row justify-between items-start mb-2`}>
                <Skeleton width={80} height={16} />
                <Skeleton width={32} height={32} borderRadius={16} />
            </View>
            <View>
                <Skeleton width="60%" height={32} style={tw`mb-1`} />
                <Skeleton width="40%" height={12} />
            </View>
        </View>
    );
};
