import React from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import tw from 'twrnc';
import { useCart } from './Context/CartContext';
import {
    Trash2, Minus, Plus, CreditCard, Tag, AlertCircle, ShoppingBag
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useToast } from './Context/ToastContext';
import { validateOrderStock } from '../src/utils/validateOrderStock';

type OrderSummaryMobileProps = {
    onCheckoutPress: () => void;
    onClose: () => void; // Added for modal dismissal
};

export default function OrderSummaryMobile({ onCheckoutPress, onClose }: OrderSummaryMobileProps) {
    const { cart, total, removeFromCart, updateQuantity, clearCart } = useCart();
    const { showToast } = useToast();
    const [isValidating, setIsValidating] = React.useState(false);

    const vatRate = 0.15;
    const taxAmount = total - (total / (1 + vatRate));
    const subTotal = total - taxAmount;

    // --- EMPTY STATE ---
    if (cart.length === 0) {
        return (
            <View style={tw`flex-1 items-center justify-center p-8 bg-slate-50`}>
                <ShoppingBag size={64} color="#e2e8f0" style={tw`mb-4`} />
                <Text style={tw`text-xl font-bold mb-2 text-slate-800`}>Cart is Empty</Text>
                <Text style={tw`text-center mb-8 text-slate-500`}>Add items from the menu to start an order.</Text>
                <Pressable 
                    onPress={() => {
                        Haptics.selectionAsync();
                        onClose();
                    }} 
                    style={({ pressed }) => [
                        tw`px-6 py-3 rounded-full bg-white border border-slate-200 shadow-sm transition-all`,
                        pressed && tw`bg-slate-50 scale-95`
                    ]}
                >
                    <Text style={tw`font-bold text-slate-700`}>Back to Menu</Text>
                </Pressable>
            </View>
        );
    }

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

    return (
        <View style={tw`flex-1 bg-slate-50`}>
            {/* --- LIST --- */}
            <FlatList
                data={cart}
                keyExtractor={(item) => item.internalId}
                contentContainerStyle={tw`p-4 pb-48`} // Extra padding for fixed footer
                renderItem={({ item }) => (
                    <View style={tw`p-4 rounded-xl mb-3 border border-slate-200 bg-white shadow-sm`}>

                        {/* Header: Name + Price */}
                        <View style={tw`flex-row justify-between items-start mb-2`}>
                            <Text style={tw`font-bold text-base flex-1 text-slate-900 mr-2`} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                            <Text style={tw`font-black text-base text-indigo-600`}>
                                R {((item.price + (item.modifiers?.reduce((s, m) => s + (m.price || 0), 0) || 0)) * item.quantity).toFixed(2)}
                            </Text>
                        </View>

                        {/* Modifiers */}
                        {item.modifiers && item.modifiers.length > 0 && (
                            <View style={tw`flex-row flex-wrap gap-2 mb-3`}>
                                {item.modifiers.map((m, i) => (
                                    <View key={i} style={tw`px-2 py-1 rounded border border-slate-100 bg-slate-50 flex-row items-center`}>
                                        <Tag size={10} color="#4f46e5" style={tw`mr-1`} />
                                        <Text style={tw`text-xs font-bold text-indigo-600`}>{m.name}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Notes */}
                        {item.note ? (
                            <View style={tw`flex-row items-center gap-2 mb-3 p-2 rounded border border-red-100 bg-red-50`}>
                                <AlertCircle size={12} color="#ef4444" />
                                <Text style={tw`text-xs italic font-semibold text-red-600`}>{item.note}</Text>
                            </View>
                        ) : null}

                        {/* Footer: Controls */}
                        <View style={tw`flex-row justify-between items-center border-t border-slate-100 pt-3 mt-1`}>
                            <Pressable 
                                onPress={() => {
                                    Haptics.impactAsync();
                                    removeFromCart(item.internalId);
                                }}
                                style={({ pressed }) => [tw`px-2 py-1 rounded`, pressed && tw`bg-red-50`]}
                            >
                                <Text style={tw`text-xs font-bold uppercase tracking-wider text-red-500`}>Remove</Text>
                            </Pressable>

                            <View style={tw`flex-row items-center rounded-lg border border-slate-200 bg-white shadow-sm`}>
                                <Pressable
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        updateQuantity(item.internalId, Math.max(0, item.quantity - 1));
                                    }}
                                    style={({ pressed }) => [tw`w-9 h-7 items-center justify-center border-r border-slate-200`, pressed && tw`bg-slate-50`]}
                                >
                                    <Minus size={14} color={item.quantity === 1 ? '#ef4444' : '#0f172a'} />
                                </Pressable>
                                <Text style={tw`w-8 text-center font-bold text-slate-900 text-sm`}>{item.quantity}</Text>
                                <Pressable
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        const res = updateQuantity(item.internalId, item.quantity + 1);
                                        if (!res.success) {
                                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                                            showToast(res.message || 'Limit reached', 'error');
                                        }
                                    }}
                                    style={({ pressed }) => [tw`w-9 h-7 items-center justify-center border-l border-slate-200`, pressed && tw`bg-slate-50`]}
                                >
                                    <Plus size={14} color="#0f172a" />
                                </Pressable>
                            </View>
                        </View>
                    </View>
                )}
            />

            {/* --- FOOTER (Fixed at Bottom) --- */}
            <View style={tw`absolute bottom-0 left-0 right-0 border-t border-slate-200 p-5 pb-8 bg-white shadow-lg`}>

                {/* Totals */}
                <View style={tw`mb-5 gap-2`}>
                    <View style={tw`flex-row justify-between`}>
                        <Text style={tw`text-sm font-medium text-slate-500`}>Subtotal</Text>
                        <Text style={tw`text-sm font-medium text-slate-900`}>R {subTotal.toFixed(2)}</Text>
                    </View>
                    <View style={tw`flex-row justify-between`}>
                        <Text style={tw`text-sm font-medium text-slate-500`}>VAT (15%)</Text>
                        <Text style={tw`text-sm font-medium text-slate-900`}>R {taxAmount.toFixed(2)}</Text>
                    </View>
                    <View style={tw`h-[1px] my-2 bg-slate-100`} />
                    <View style={tw`flex-row justify-between items-end`}>
                        <Text style={tw`font-bold text-base text-slate-900 mb-1`}>Total</Text>
                        <Text style={tw`font-black text-2xl text-indigo-600 tracking-tight`} numberOfLines={1} adjustsFontSizeToFit>R {total.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={tw`flex-row gap-3`}>
                    <Pressable 
                        onPress={() => {
                            Haptics.impactAsync();
                            clearCart();
                        }} 
                        style={({ pressed }) => [
                            tw`p-4 rounded-2xl border justify-center transition-all`,
                            cart.length === 0 ? tw`bg-white border-slate-200 opacity-50` : tw`bg-white border-slate-200 shadow-sm`,
                            pressed && cart.length > 0 && tw`bg-red-50 border-red-200 scale-95`
                        ]}
                    >
                        <Trash2 size={24} color={cart.length === 0 ? '#94a3b8' : '#ef4444'} />
                    </Pressable>

                    <Pressable 
                        onPress={handlePayNow}
                        disabled={cart.length === 0 || isValidating}
                        style={({ pressed }) => [
                            tw`flex-1 p-4 rounded-2xl flex-row items-center justify-center gap-2 transition-all`,
                            (cart.length === 0 || isValidating) ? tw`bg-slate-100` : tw`bg-indigo-600 shadow-sm`,
                            pressed && cart.length > 0 && tw`bg-indigo-700 scale-95`
                        ]}
                    >
                        <CreditCard size={20} color={cart.length === 0 ? "#94a3b8" : "white"} />
                        <Text style={[
                            tw`font-black text-lg uppercase tracking-wider`,
                            cart.length === 0 ? tw`text-slate-400` : tw`text-white`
                        ]}>{isValidating ? 'Checking...' : 'Pay Now'}</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}