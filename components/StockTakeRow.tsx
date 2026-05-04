import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import tw from 'twrnc';
import { Package, Minus, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { InventoryItem } from '../types';

interface StockTakeRowProps {
    item: InventoryItem;
    count: number | undefined;
    onUpdateCount: (id: string, count: number) => void;
}

function StockTakeRow({ item, count, onUpdateCount }: StockTakeRowProps) {
    const currentQty = item.quantity || 0;
    const variance = (count !== undefined) ? (count - currentQty) : 0;
    const hasVariance = variance !== 0;
    const isCounted = count !== undefined;

    // Visual states
    const borderStyle = isCounted
        ? (hasVariance ? 'border-amber-300' : 'border-emerald-300')
        : 'border-slate-200';
    
    const bgStyle = isCounted 
        ? (hasVariance ? 'bg-amber-50/50' : 'bg-emerald-50/50')
        : 'bg-white';

    const handleIncrement = () => {
        Haptics.selectionAsync();
        const current = count ?? currentQty;
        onUpdateCount(item.id, current + 1);
    };

    const handleDecrement = () => {
        Haptics.selectionAsync();
        const current = count ?? currentQty;
        if (current > 0) onUpdateCount(item.id, current - 1);
    };

    return (
        <View style={tw`mb-3 p-4 rounded-2xl border ${borderStyle} ${bgStyle} shadow-sm flex-row items-center`}>
            {/* Icon */}
            <View style={tw`w-11 h-11 rounded-xl items-center justify-center bg-white border border-slate-100 mr-4 shadow-sm`}>
                <Package size={18} color="#94a3b8" />
            </View>

            {/* Name & Expected */}
            <View style={tw`flex-1 pr-3`}>
                <Text style={tw`font-black text-base text-slate-900 tracking-tight`} numberOfLines={1}>
                    {item.name}
                </Text>
                <View style={tw`flex-row items-center gap-2 mt-1`}>
                    <Text style={tw`text-[10px] font-bold uppercase tracking-widest text-slate-500`}>
                        System: {currentQty} {item.unit}
                    </Text>
                    {isCounted && hasVariance && (
                        <View style={tw`px-2 py-0.5 rounded-md ${variance > 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                            <Text style={tw`text-[10px] font-black ${variance > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                {variance > 0 ? '+' : ''}{variance} {item.unit}
                            </Text>
                        </View>
                    )}
                    {isCounted && !hasVariance && (
                        <View style={tw`px-2 py-0.5 rounded-md bg-emerald-100`}>
                            <Text style={tw`text-[10px] font-black text-emerald-700`}>✓ Match</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Counter Input */}
            <View style={tw`flex-row items-center gap-1`}>
                <Pressable
                    onPress={handleDecrement}
                    style={({ pressed }) => [
                        tw`w-10 h-10 rounded-xl bg-white border border-slate-200 items-center justify-center`,
                        pressed && tw`bg-slate-100 scale-90`
                    ]}
                >
                    <Minus size={16} color="#64748b" />
                </Pressable>
                
                <View style={tw`w-20 h-10 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden`}>
                    <TextInput
                        value={count?.toString() ?? ''}
                        onChangeText={(text) => {
                            const val = parseFloat(text);
                            if (!isNaN(val)) {
                                onUpdateCount(item.id, val);
                            } else if (text === '') {
                                onUpdateCount(item.id, 0);
                            }
                        }}
                        keyboardType="numeric"
                        placeholder={currentQty.toString()}
                        placeholderTextColor="#cbd5e1"
                        style={tw`flex-1 text-center font-black text-lg text-slate-900`}
                    />
                </View>

                <Pressable
                    onPress={handleIncrement}
                    style={({ pressed }) => [
                        tw`w-10 h-10 rounded-xl bg-white border border-slate-200 items-center justify-center`,
                        pressed && tw`bg-indigo-50 border-indigo-200 scale-90`
                    ]}
                >
                    <Plus size={16} color="#4f46e5" />
                </Pressable>
            </View>
        </View>
    );
}

export default React.memo(StockTakeRow);
