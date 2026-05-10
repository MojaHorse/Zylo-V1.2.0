import React, { useState } from 'react';
import { View, TouchableOpacity, Pressable, Text, useWindowDimensions, Alert, ActionSheetIOS, Platform } from 'react-native';
import { Info, Plus, SlidersHorizontal, Trash2, MoreVertical, Pencil } from 'lucide-react-native';
import tw from 'twrnc';
import type { Product } from '../types';
import { triggerHaptic } from '../src/utils/haptics';
import AnimatedPressable from './AnimatedPressable';

type Props = {
    product: Product;
    onAdd: (product: Product) => void;
    onEdit?: (product: Product) => void;
    onEditProduct?: (product: Product) => void;
    onInfoPress?: (product: Product) => void;
    onDelete?: (product: Product) => void;
};

export default function ProductCard({ product, onAdd, onEdit, onEditProduct, onInfoPress, onDelete }: Props) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const [showMenu, setShowMenu] = useState(false);

    const initials = product.name ? product.name.slice(0, 2).toUpperCase() : '??';

    // Stock Logic
    const isOutOfStock = product.stockStatus === 'out';
    const isLowStock = product.stockStatus === 'low';

    // Clean, consistent backdrop for product images
    const imagePlaceholderColor = 'bg-slate-100';

    const handleMenuPress = () => {
        triggerHaptic('medium');

        if (Platform.OS === 'ios') {
            const options = ['Cancel', 'Edit Product', 'Delete Product'];
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex: 0,
                    destructiveButtonIndex: 2,
                    title: product.name,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        onEditProduct?.(product);
                    } else if (buttonIndex === 2) {
                        onDelete?.(product);
                    }
                }
            );
        } else {
            // Android / Web fallback — show inline dropdown
            setShowMenu(!showMenu);
        }
    };

    return (
        <View style={[
            tw`rounded-2xl overflow-hidden w-full border shadow-sm bg-white`,
            { borderColor: '#e2e8f0' } // slate-200
        ]}>

            {/* --- TOP: IMAGE / CATEGORY --- */}
            <View style={tw`${isMobile ? 'h-28' : 'h-36'} ${imagePlaceholderColor} items-center justify-center relative`}>

                {/* Initials Background */}
                <Text style={tw`text-slate-300 font-bold text-5xl tracking-tight absolute`}>
                    {initials}
                </Text>

                {/* ⋮ MORE MENU (Top Left - Floating) */}
                {(onDelete || onEditProduct) && (
                    <View style={tw`absolute top-2 left-2 z-30`}>
                        <AnimatedPressable
                            onPress={handleMenuPress}
                            style={({ pressed }) => [
                                tw`p-2 rounded-full border`,
                                tw`bg-white/90 border-slate-200 shadow-sm`,
                                pressed && tw`opacity-70`
                            ]}
                        >
                            <MoreVertical size={16} color="#64748b" />
                        </AnimatedPressable>

                        {/* Android/Web Dropdown Menu */}
                        {showMenu && Platform.OS !== 'ios' && (
                            <Pressable
                                onPress={() => setShowMenu(false)}
                                style={tw`absolute top-10 left-0 z-50`}
                            >
                                <View style={tw`bg-white rounded-xl border border-slate-200 shadow-lg min-w-[160px] overflow-hidden`}>
                                    {onEditProduct && (
                                        <Pressable
                                            onPress={() => {
                                                setShowMenu(false);
                                                onEditProduct(product);
                                            }}
                                            style={({ pressed }) => [
                                                tw`flex-row items-center gap-3 px-4 py-3 border-b border-slate-100`,
                                                pressed && tw`bg-slate-50`
                                            ]}
                                        >
                                            <Pencil size={14} color="#64748b" />
                                            <Text style={tw`text-sm font-semibold text-slate-700`}>Edit Product</Text>
                                        </Pressable>
                                    )}
                                    {onDelete && (
                                        <Pressable
                                            onPress={() => {
                                                setShowMenu(false);
                                                onDelete(product);
                                            }}
                                            style={({ pressed }) => [
                                                tw`flex-row items-center gap-3 px-4 py-3`,
                                                pressed && tw`bg-red-50`
                                            ]}
                                        >
                                            <Trash2 size={14} color="#ef4444" />
                                            <Text style={tw`text-sm font-semibold text-red-500`}>Delete Product</Text>
                                        </Pressable>
                                    )}
                                </View>
                            </Pressable>
                        )}
                    </View>
                )}

                {/* ℹ️ INFO BUTTON (Top Right - Floating) */}
                <AnimatedPressable
                    onPress={() => onInfoPress?.(product)}
                    style={({ pressed }) => [
                        tw`absolute top-2 right-2 p-2 rounded-full border z-20`,
                        tw`bg-white/90 border-slate-200 shadow-sm`,
                        pressed && tw`opacity-70`
                    ]}
                >
                    <Info size={16} color="#64748b" />
                </AnimatedPressable>

                {/* ⚠️ STOCK BADGES */}
                {isOutOfStock && (
                    <View style={tw`absolute inset-0 bg-white/40 items-center justify-center z-10 backdrop-blur-xs`}>
                        <View style={tw`bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 shadow-sm`}>
                            <Text style={tw`text-red-600 font-bold text-xs uppercase tracking-wider`}>Missing Items</Text>
                        </View>
                    </View>
                )}

                {isLowStock && !isOutOfStock && (
                    <View style={tw`absolute bottom-2 left-2 bg-amber-500 px-2 py-1 rounded-md shadow-sm border border-amber-600 z-10`}>
                        <Text style={tw`text-[10px] font-bold text-white uppercase tracking-wider`}>Low Stock</Text>
                    </View>
                )}

                {/* Category Label (Bottom Right) */}
                <View style={tw`absolute bottom-2 right-2 bg-slate-800/80 px-2 py-1 rounded-md z-10`}>
                    <Text style={tw`text-[10px] text-white font-bold uppercase tracking-wider`}>{product.category || 'N/A'}</Text>
                </View>
            </View>

            {/* --- BOTTOM: DETAILS & ACTIONS --- */}
            <View style={tw`p-4`}>

                {/* Header */}
                <View style={tw`mb-4`}>
                    <Text numberOfLines={1} style={tw`font-bold text-slate-900 text-lg leading-tight mb-1`}>
                        {product.name}
                    </Text>
                    <View style={tw`flex-row items-baseline`}>
                        <Text style={tw`text-indigo-600 font-bold text-lg mr-1`}>R</Text>
                        <Text style={tw`text-slate-900 font-black text-xl`}>{product.price.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Buttons Row */}
                <View style={tw`flex-row gap-2`}>
                    {/* CUSTOMIZE Button (opens customization modal for modifiers/notes) */}
                    <AnimatedPressable
                        onPress={() => onEdit?.(product)}
                        style={({ pressed }) => [
                            tw`w-10 h-10 rounded-xl items-center justify-center border border-slate-200 bg-slate-50`,
                            pressed && tw`bg-slate-100`
                        ]}
                    >
                        <SlidersHorizontal size={16} color="#64748b" />
                    </AnimatedPressable>

                    {/* ADD Button */}
                    <AnimatedPressable
                        onPress={() => {
                            triggerHaptic('medium');
                            onAdd(product);
                        }}
                        style={({ pressed }) => [
                            tw`flex-1 h-10 flex-row items-center justify-center gap-1.5 transition-all p-0`,
                            isOutOfStock
                                ? tw`bg-indigo-600 border border-indigo-700 rounded-xl shadow-sm opacity-80`
                                : tw`bg-indigo-600 border border-indigo-700 rounded-xl shadow-sm`,
                            pressed && tw`bg-indigo-700`
                        ]}
                    >
                        <Plus size={18} color="white" strokeWidth={3} />
                        <Text style={tw`text-white font-black text-xs uppercase tracking-wider`}>Add</Text>
                    </AnimatedPressable>
                </View>
            </View>
        </View>
    );
}