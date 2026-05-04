import React from 'react';
import { View } from 'react-native';
import tw from 'twrnc';
import { Skeleton } from './Skeleton';
import { useTheme } from '../Context/ThemeContext'; // 👈 Fixed Path

export const ProductCardSkeleton = () => {
    const { colors } = useTheme();
    return (
        <View style={[
            tw`rounded-2xl overflow-hidden w-full border mb-4`,
            { backgroundColor: colors.surface, borderColor: colors.border, height: 240 }
        ]}>
            {/* Image Placeholder */}
            <Skeleton width="100%" height={144} borderRadius={0} />

            {/* Content */}
            <View style={tw`p-4`}>
                <Skeleton width="60%" height={20} style={tw`mb-2`} />
                <Skeleton width="40%" height={24} style={tw`mb-3`} />
                <View style={tw`flex-row gap-3`}>
                    <Skeleton width={48} height={48} borderRadius={12} />
                    <Skeleton style={tw`flex-1 h-12 rounded-xl`} />
                </View>
            </View>
        </View>
    );
};
