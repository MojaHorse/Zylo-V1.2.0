import React from 'react';
import { View } from 'react-native';
import tw from 'twrnc';
import { Skeleton } from './Skeleton';
import { useTheme } from '../Context/ThemeContext'; // 👈 Fixed Path

export const StockRowSkeleton = () => {
    const { colors } = useTheme();
    return (
        <View style={[
            tw`mb-3 py-3 px-4 rounded-xl border flex-row items-center justify-between`,
            { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }
        ]}>
            {/* Left: Info */}
            <View style={tw`flex-3 pr-2`}>
                <Skeleton width="70%" height={24} style={tw`mb-2`} />
                <View style={tw`flex-row gap-2`}>
                    <Skeleton width={60} height={16} />
                    <Skeleton width={80} height={16} />
                </View>
            </View>

            {/* Center: Qty */}
            <View style={tw`flex-1 items-center px-2`}>
                <Skeleton width={30} height={24} style={tw`mb-1`} />
                <Skeleton width={20} height={12} />
            </View>

            {/* Right: Status */}
            <View style={tw`flex-1.5 items-end pl-2`}>
                <Skeleton width={80} height={32} borderRadius={8} />
            </View>
        </View>
    );
};
