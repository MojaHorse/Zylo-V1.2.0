import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, LayoutAnimation, Platform, UIManager, Alert } from 'react-native';
import AnimatedPressable from './AnimatedPressable';
import tw from 'twrnc';
import { useCart } from '../components/Context/CartContext';
import { useToast } from '../components/Context/ToastContext';
import {
    Trash2, Minus, Plus, ChevronRight, ShoppingBag,
    CreditCard, Receipt, Tag, AlertCircle
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNextOrderNumber } from '../src/hooks/useNextOrderNumber';
import { formatBusinessDayOrderNumber } from '../src/utils/formatters';
import { validateOrderStock } from '../src/utils/validateOrderStock';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type OrderSummaryProps = {
    onCollapsedChange: (collapsed: boolean) => void;
    onCheckoutPress: () => void;
};

export default function OrderSummary({ onCollapsedChange, onCheckoutPress }: OrderSummaryProps) {
    const { cart, total, totalQty, decreaseQty, removeFromCart, clearCart, updateQuantity } = useCart();
    const { showToast } = useToast();
    const [collapsed, setCollapsed] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const nextOrderNum = useNextOrderNumber();

    // Auto-update time for the receipt header
    const [orderTime, setOrderTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setOrderTime(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    // Calculated fields
    const vatRate = 0.15;
    const taxAmount = total - (total / (1 + vatRate));
    const subTotal = total - taxAmount;

    const toggleCollapse = () => {
        Haptics.selectionAsync();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newState = !collapsed;
        setCollapsed(newState);
        onCollapsedChange(newState);
    };

    const handlePayNow = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsValidating(true);
        
        // Block checkouts if recipes aren't physically available
        const check = await validateOrderStock(cart);
        
        setIsValidating(false);
        
        if (check.warnings && check.warnings.length > 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert(
                "Stock Warning",
                "You are attempting to sell items that exceed current inventory:\n\n" + 
                check.warnings.map(w => `• ${w}`).join('\n') +
                "\n\nDo you want to proceed and allow inventory to drop into the negatives?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Proceed Anyway", style: "destructive", onPress: () => onCheckoutPress() }
                ]
            );
            return;
        }

        onCheckoutPress();
    };

    // --- VIEW 1: COLLAPSED (Mini Mode) ---
    if (collapsed) {
        return (
            <Pressable
                onPress={toggleCollapse}
                style={({ pressed }) => [
                    tw`w-20 border-l border-slate-200 items-center py-6 z-10 bg-slate-50 transition-all`,
                    pressed && tw`bg-slate-100`
                ]}
            >
                <View style={tw`p-4 rounded-2xl relative shadow-md mb-8 bg-indigo-600`}>
                    <ShoppingBag size={26} color="white" />
                    {totalQty > 0 && (
                        <View style={tw`absolute -top-2 -right-2 w-8 h-6 rounded-full items-center justify-center border-2 border-white bg-emerald-500`}>
                            <Text style={tw`text-white text-[14px] font-black`}>{totalQty}</Text>
                        </View>
                    )}
                </View>
                <Text style={tw`top-10 text-xs font-bold -rotate-90 w-32 text-center uppercase tracking-widest text-slate-500`}>
                    Current Order
                </Text>
            </Pressable>
        );
    }

    // --- VIEW 2: EXPANDED (Full Receipt) ---
    return (
        <View style={[tw`border-l border-slate-200 flex-col bg-white`, { width: 360 }]}>

            {/* --- HEADER --- */}
            <View style={tw`p-5 border-b border-slate-200 bg-white`}>
                <View style={tw`flex-row justify-between items-start`}>
                    <View>
                        <View style={tw`flex-row items-center gap-2 mb-1`}>
                            <Text style={tw`text-xl font-black uppercase tracking-wide text-indigo-900`}>
                                {nextOrderNum ? `Order ${formatBusinessDayOrderNumber(nextOrderNum)}` : 'New Order'}
                            </Text>
                        </View>
                        <Text style={tw`text-xs font-medium text-slate-500`}>
                            {orderTime.toLocaleDateString()} • {orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                    <AnimatedPressable
                        onPress={toggleCollapse}
                        style={({ pressed }) => [
                            tw`w-8 h-8 rounded-lg items-center justify-center border border-slate-200 bg-white shadow-sm`,
                            pressed && tw`bg-slate-50`
                        ]}
                    >
                        <ChevronRight size={18} color="#64748b" />
                    </AnimatedPressable>
                </View>
            </View>

            {/* --- LIST --- */}
            <FlatList
                data={cart}
                keyExtractor={(item) => item.internalId}
                contentContainerStyle={tw`p-4 pb-20`}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={tw`items-center justify-center mt-32 opacity-80 gap-4`}>
                        <Receipt size={64} color="#94a3b8" />
                        <Text style={tw`font-bold text-lg text-slate-400`}>Empty Cart</Text>
                        <Text style={tw`text-center text-xs px-10 text-slate-400`}>Add items from the menu to start a new transaction.</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={tw`rounded-xl mb-3 border border-slate-100 bg-slate-50 overflow-hidden`}>

                        {/* CARD BODY */}
                        <View style={tw`p-4`}>
                            {/* Row 1: Item Name & Price */}
                            <View style={tw`flex-row justify-between items-start mb-2`}>
                                <Text style={tw`font-bold text-lg flex-1 mr-2 leading-5 text-slate-900`}>{item.name}</Text>
                                <Text style={tw`font-black text-lg text-indigo-600`}>
                                    R {((item.price + (item.modifiers?.reduce((s, m) => s + (m.price || 0), 0) || 0)) * item.quantity).toFixed(2)}
                                </Text>
                            </View>

                            {/* EXTRAS (Modifiers) - Styled as Tags */}
                            {item.modifiers && item.modifiers.length > 0 && (
                                <View style={tw`flex-row flex-wrap gap-1.5 mb-2`}>
                                    {item.modifiers.map((m, i) => (
                                        <View key={i} style={tw`border border-slate-100 bg-slate-50 px-2 py-1 rounded flex-row items-center`}>
                                            <Tag size={10} color="#4f46e5" style={tw`mr-1`} />
                                            <Text style={tw`text-[10px] font-bold text-indigo-600`}>{m.name}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* NOTES - Warning Box Style */}
                            {item.note ? (
                                <View style={tw`border border-red-100 bg-red-50 px-2 py-1.5 rounded flex-row items-start mb-1`}>
                                    <AlertCircle size={12} color="#ef4444" style={tw`mr-1.5 mt-0.5`} />
                                    <Text style={tw`text-[11px] font-bold flex-1 italic text-red-600`}>"{item.note}"</Text>
                                </View>
                            ) : null}
                        </View>

                        {/* CARD FOOTER: CONTROLS */}
                        <View style={tw`p-2 flex-row justify-between items-center border-t border-slate-100 bg-slate-50`}>
                            {/* Quantity Control */}
                            <View style={tw`flex-row items-center rounded-lg border border-slate-200 bg-white shadow-sm`}>
                                <AnimatedPressable
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        updateQuantity ? updateQuantity(item.internalId, item.quantity - 1) : removeFromCart(item.internalId);
                                    }}
                                    style={({ pressed }) => [
                                        tw`w-9 h-8 items-center justify-center border-r border-slate-200`,
                                        pressed && tw`bg-slate-100`
                                    ]}
                                >
                                    <Minus size={14} color={item.quantity === 1 ? '#ef4444' : '#0f172a'} />
                                </AnimatedPressable>

                                <Text style={tw`font-bold w-10 text-center text-slate-900`}>{item.quantity}</Text>

                                <AnimatedPressable
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        const res = updateQuantity(item.internalId, item.quantity + 1);
                                        if (!res.success) {
                                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                                            showToast(res.message || 'Limit reached', 'error');
                                        }
                                    }}
                                    style={({ pressed }) => [
                                        tw`w-9 h-8 items-center justify-center border-l border-slate-200`,
                                        pressed && tw`bg-slate-100`
                                    ]}
                                >
                                    <Plus size={14} color="#0f172a" />
                                </AnimatedPressable>
                            </View>

                            {/* Remove Button */}
                            <AnimatedPressable 
                                onPress={() => {
                                    Haptics.impactAsync();
                                    removeFromCart(item.internalId);
                                }} 
                                style={({ pressed }) => [tw`p-2 rounded-lg`, pressed && tw`bg-red-50`]}
                            >
                                <Trash2 size={16} color="#ef4444" />
                            </AnimatedPressable>
                        </View>
                    </View>
                )}
            />

            {/* --- FOOTER --- */}
            <View style={tw`border-t border-slate-200 p-5 pb-8 bg-white`}>

                {/* Financial Breakdown */}
                <View style={tw`gap-2 mb-6`}>
                    <View style={tw`flex-row justify-between`}>
                        <Text style={tw`text-sm font-medium text-slate-500`}>Subtotal (excl. tax)</Text>
                        <Text style={tw`text-sm font-medium text-slate-900`}>R {subTotal.toFixed(2)}</Text>
                    </View>
                    <View style={tw`flex-row justify-between`}>
                        <Text style={tw`text-sm font-medium text-slate-500`}>VAT (15%)</Text>
                        <Text style={tw`text-sm font-medium text-slate-900`}>R {taxAmount.toFixed(2)}</Text>
                    </View>
                    <View style={tw`h-[1px] my-2 bg-slate-100`} />
                    <View style={tw`flex-row justify-between items-end`}>
                        <Text style={tw`text-lg font-bold text-slate-900`}>Total</Text>
                        <Text style={tw`text-3xl font-black text-indigo-600 tracking-tight`}>R {total.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={tw`flex-row gap-3`}>
                    <AnimatedPressable
                        onPress={() => {
                            Haptics.impactAsync();
                            clearCart();
                        }}
                        disabled={cart.length === 0}
                        style={({ pressed }) => [
                            tw`px-5 rounded-2xl items-center justify-center border border-slate-200 bg-white`,
                            cart.length === 0 ? tw`opacity-50` : tw`shadow-sm`,
                            pressed && cart.length > 0 && tw`bg-red-50 border-red-200`
                        ]}
                    >
                        <Trash2 size={20} color={cart.length === 0 ? '#94a3b8' : '#ef4444'} />
                    </AnimatedPressable>

                    <AnimatedPressable
                        onPress={handlePayNow}
                        disabled={cart.length === 0 || isValidating}
                        style={({ pressed }) => [
                            tw`flex-1 h-14 rounded-2xl flex-row items-center justify-center gap-2`,
                            (cart.length === 0 || isValidating) ? tw`bg-slate-100` : tw`bg-indigo-600 shadow-sm`,
                            pressed && cart.length > 0 && tw`bg-indigo-700`
                        ]}
                    >
                        <CreditCard size={20} color={cart.length === 0 ? "#94a3b8" : "white"} strokeWidth={2.5} />
                        <Text style={[
                            tw`font-bold text-lg uppercase tracking-wider`,
                            cart.length === 0 ? tw`text-slate-400` : tw`text-white`
                        ]}>{isValidating ? 'Checking...' : 'Pay Now'}</Text>
                    </AnimatedPressable>
                </View>
            </View>
        </View>
    );
}
