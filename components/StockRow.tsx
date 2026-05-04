import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import tw from 'twrnc';
import { AlertTriangle, CheckCircle, Package, Pencil, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { InventoryItem } from '../types';

interface StockRowProps {
    item: InventoryItem;
    onEdit: (item: InventoryItem) => void;
    onDelete: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
    'Meat': '#ef4444',
    'Bread': '#f59e0b',
    'Veggies': '#22c55e',
    'Drinks': '#3b82f6',
    'Packaging': '#8b5cf6',
    'Other': '#64748b',
};

function StockRow({ item, onEdit, onDelete }: StockRowProps) {
    const { width } = useWindowDimensions();
    const isCompact = width < 768;

    const qty = item.quantity || 0;
    const threshold = item.low_stock_threshold ?? 5;
    const isCritical = qty <= threshold;
    const isLow = !isCritical && qty <= (threshold * 1.5);

    let statusBg = 'bg-emerald-50';
    let statusBorder = 'border-emerald-200';
    let statusText = 'text-emerald-700';
    let statusLabel = 'In Stock';
    let StatusIcon = CheckCircle;
    let statusIconColor = '#059669';

    if (isCritical) {
        statusBg = 'bg-red-50';
        statusBorder = 'border-red-200';
        statusText = 'text-red-700';
        statusLabel = 'Critical';
        StatusIcon = AlertTriangle;
        statusIconColor = '#dc2626';
    } else if (isLow) {
        statusBg = 'bg-amber-50';
        statusBorder = 'border-amber-200';
        statusText = 'text-amber-700';
        statusLabel = 'Low';
        StatusIcon = AlertTriangle;
        statusIconColor = '#d97706';
    }

    const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Other'];
    const costDisplay = Number(item.cost_price || 0).toFixed(2);

    // ═══════════ MOBILE LAYOUT ═══════════
    if (isCompact) {
        return (
            <Pressable
                onPress={() => { Haptics.selectionAsync(); onEdit(item); }}
                style={({ pressed }) => [
                    tw`mb-3 p-4 rounded-2xl border bg-white shadow-sm`,
                    isCritical ? tw`border-red-200` : tw`border-slate-200`,
                    pressed && tw`bg-slate-50 scale-[0.98]`
                ]}
            >
                {/* Top Row: Icon + Name + Qty */}
                <View style={tw`flex-row items-center`}>
                    {/* Color bar */}
                    <View style={[tw`w-1 h-10 rounded-full mr-3`, { backgroundColor: catColor }]} />

                    {/* Icon */}
                    <View style={[tw`w-10 h-10 rounded-xl items-center justify-center mr-3 border`,
                        { backgroundColor: catColor + '12', borderColor: catColor + '30' }]}>
                        <Package size={16} color={catColor} />
                    </View>

                    {/* Name & Category */}
                    <View style={tw`flex-1 mr-3`}>
                        <Text style={tw`font-black text-base text-slate-900 tracking-tight`} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <View style={tw`flex-row items-center gap-1.5 mt-0.5`}>
                            <Text style={tw`text-[10px] uppercase font-black tracking-widest text-slate-400`}>
                                {item.category}
                            </Text>
                            <View style={tw`w-1 h-1 rounded-full bg-slate-300`} />
                            <Text style={tw`text-[10px] text-slate-400 font-bold`}>
                                R{costDisplay}
                            </Text>
                        </View>
                    </View>

                    {/* Quantity */}
                    <View style={tw`items-end`}>
                        <Text style={tw`font-black text-xl text-slate-900 tracking-tight`}>{qty}</Text>
                        <Text style={tw`text-[8px] uppercase font-bold text-slate-400 tracking-widest`}>{item.unit}</Text>
                    </View>
                </View>

                {/* Bottom Row: Status + Actions */}
                <View style={tw`flex-row items-center justify-between mt-3 pt-3 border-t border-slate-100`}>
                    {/* Status Badge */}
                    <View style={tw`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg ${statusBg} border ${statusBorder}`}>
                        <StatusIcon size={12} color={statusIconColor} />
                        <Text style={tw`text-[10px] font-black uppercase tracking-wider ${statusText}`}>{statusLabel}</Text>
                    </View>

                    {/* Actions */}
                    <View style={tw`flex-row gap-2`}>
                        <Pressable
                            onPress={(e) => {
                                e.stopPropagation?.();
                                Haptics.selectionAsync();
                                onEdit(item);
                            }}
                            style={({ pressed }) => [
                                tw`flex-row items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100`,
                                pressed && tw`bg-slate-200 scale-90`
                            ]}
                        >
                            <Pencil size={12} color="#64748b" />
                            <Text style={tw`text-[10px] font-black text-slate-500 uppercase`}>Edit</Text>
                        </Pressable>
                        <Pressable
                            onPress={(e) => {
                                e.stopPropagation?.();
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                onDelete(item.id);
                            }}
                            style={({ pressed }) => [
                                tw`p-2 rounded-lg bg-slate-50 border border-slate-100`,
                                pressed && tw`bg-red-100 border-red-200 scale-90`
                            ]}
                        >
                            <Trash2 size={14} color="#94a3b8" />
                        </Pressable>
                    </View>
                </View>
            </Pressable>
        );
    }

    // ═══════════ TABLET LAYOUT ═══════════
    return (
        <Pressable
            onPress={() => { Haptics.selectionAsync(); onEdit(item); }}
            style={({ pressed }) => [
                tw`mb-3 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex-row items-center`,
                pressed && tw`bg-slate-50 scale-[0.995]`,
                isCritical && tw`border-red-200 bg-red-50/20`
            ]}
        >
            <View style={[tw`w-1 h-10 rounded-full mr-3`, { backgroundColor: catColor }]} />
            <View style={[tw`w-11 h-11 rounded-xl items-center justify-center mr-3 border`,
                { backgroundColor: catColor + '12', borderColor: catColor + '30' }]}>
                <Package size={18} color={catColor} />
            </View>
            <View style={tw`flex-1 pr-3`}>
                <Text style={tw`font-black text-base text-slate-900 tracking-tight`} numberOfLines={1}>{item.name}</Text>
                <View style={tw`flex-row items-center gap-2 mt-1`}>
                    <Text style={tw`text-[10px] uppercase font-black tracking-widest text-slate-400`}>{item.category}</Text>
                    <View style={tw`w-1 h-1 rounded-full bg-slate-300`} />
                    <Text style={tw`text-[10px] text-slate-400 font-bold`}>R{costDisplay}/{item.unit}</Text>
                </View>
            </View>
            <View style={tw`items-center mr-4 min-w-14`}>
                <Text style={tw`font-black text-xl text-slate-900 tracking-tight`}>{qty}</Text>
                <Text style={tw`text-[8px] uppercase font-bold text-slate-400 tracking-widest`}>{item.unit}</Text>
            </View>
            <View style={tw`flex-row items-center gap-1.5 px-3 py-2 rounded-xl ${statusBg} border ${statusBorder} mr-2 min-w-20 justify-center`}>
                <StatusIcon size={12} color={statusIconColor} />
                <Text style={tw`text-[10px] font-black uppercase tracking-wider ${statusText}`}>{statusLabel}</Text>
            </View>
            <View style={tw`flex-row gap-1`}>
                <Pressable
                    onPress={(e) => { e.stopPropagation?.(); Haptics.selectionAsync(); onEdit(item); }}
                    style={({ pressed }) => [
                        tw`w-9 h-9 rounded-xl items-center justify-center bg-slate-50 border border-slate-100`,
                        pressed && tw`bg-slate-200 scale-90`
                    ]}
                >
                    <Pencil size={14} color="#64748b" />
                </Pressable>
                <Pressable
                    onPress={(e) => { e.stopPropagation?.(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); onDelete(item.id); }}
                    style={({ pressed }) => [
                        tw`w-9 h-9 rounded-xl items-center justify-center bg-slate-50 border border-slate-100`,
                        pressed && tw`bg-red-100 border-red-200 scale-90`
                    ]}
                >
                    <Trash2 size={14} color="#94a3b8" />
                </Pressable>
            </View>
        </Pressable>
    );
}

export default React.memo(StockRow);