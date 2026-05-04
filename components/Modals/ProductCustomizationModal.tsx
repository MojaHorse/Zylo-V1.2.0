import React, { useState, useEffect } from 'react';
import {
    Modal, View, Text, ScrollView,
    TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Pressable
} from 'react-native';
import tw from 'twrnc';
import { supabase } from '../../lib/supabase';
import { X, Check, MessageSquare } from 'lucide-react-native';
import type { Product, Modifier } from '../../types';
import * as Haptics from 'expo-haptics';
import { useToast } from '../Context/ToastContext';

interface Props {
    visible: boolean;
    product: Product | null;
    onClose: () => void;
    onAddToCart: (product: Product, modifiers: Modifier[], note: string) => { success: boolean, message?: string };
}

// Internal type for what we fetch from Supabase
interface FetchedModifier {
    id: string; // customization ID
    name: string;
    extra_cost: number;
    inventory_item_id: string;
}

export default function ProductCustomizationModal({ visible, product, onClose, onAddToCart }: Props) {
    const { showToast } = useToast();
    const [availableModifiers, setAvailableModifiers] = useState<FetchedModifier[]>([]);
    const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    // Load extras when modal opens
    useEffect(() => {
        if (visible && product) {
            fetchAllowedExtras(product.id);
            setSelectedModifiers([]);
            setNote('');
        }
    }, [visible, product]);

    const fetchAllowedExtras = async (productId: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('product_customizations')
            .select(`
                id,
                name,
                extra_cost,
                inventory_item_id
            `)
            .eq('product_id', productId);

        if (error) {
            console.error(error);
            Alert.alert('Error loading extras', error.message || 'Unknown error');
        } else {
            setAvailableModifiers(data || []);
        }
        setLoading(false);
    };

    const toggleModifier = (item: FetchedModifier) => {
        Haptics.selectionAsync();
        const modifierObj: Modifier = {
            id: item.inventory_item_id || item.id,
            name: item.name,
            price: item.extra_cost
        };

        const exists = selectedModifiers.find(m => m.id === modifierObj.id);

        if (exists) {
            setSelectedModifiers(prev => prev.filter(m => m.id !== modifierObj.id));
        } else {
            setSelectedModifiers(prev => [...prev, modifierObj]);
        }
    };

    const handleConfirm = () => {
        if (product) {
            const result = onAddToCart(product, selectedModifiers, note);
            if (!result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                showToast(result.message || 'Maximum stock reached', 'error');
                return;
            }

            if (result.message) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                showToast(result.message, 'warning');
            } else {
                Haptics.impactAsync();
            }
            onClose();
        }
    };

    const currentTotal = (product?.price || 0) + selectedModifiers.reduce((sum, m) => sum + m.price, 0);

    if (!product) return null;

    return (
        <Modal visible={visible} transparent animationType="slide">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={tw`flex-1 bg-slate-900/40 justify-end`}
            >
                <View style={tw`h-[85%] rounded-t-[32px] overflow-hidden w-full max-w-2xl mx-auto bg-slate-50 shadow-2xl`}>

                    {/* Header */}
                    <View style={tw`p-6 border-b border-slate-100 bg-white flex-row justify-between items-start`}>
                        <View style={tw`flex-1 mr-4`}>
                            <Text style={tw`text-3xl font-black mb-1 text-slate-900 tracking-tighter`}>{product.name}</Text>
                            <Text style={tw`font-black text-2xl text-indigo-600 tracking-tight`}>R {product.price.toFixed(2)}</Text>
                        </View>
                        <Pressable 
                            onPress={() => {
                                Haptics.selectionAsync();
                                onClose();
                            }} 
                            style={({ pressed }) => [
                                tw`w-11 h-11 rounded-full bg-slate-50 border border-slate-200 items-center justify-center transition-all`,
                                pressed && tw`scale-90 bg-slate-100 border-slate-300`
                            ]}
                        >
                            <X size={20} color="#475569" />
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={tw`p-6`}>

                        {/* 1. KITCHEN NOTES */}
                        <View style={tw`mb-8`}>
                            <View style={tw`flex-row items-center gap-2 mb-3.5`}>
                                <MessageSquare size={14} color="#64748b" />
                                <Text style={tw`font-black uppercase text-[10px] tracking-widest text-slate-400`}>
                                    Kitchen Instructions
                                </Text>
                            </View>
                            <TextInput
                                placeholder="e.g. No Sauce, Cut in half, Well done..."
                                placeholderTextColor="#94a3b8"
                                value={note}
                                onChangeText={setNote}
                                style={tw`p-5 rounded-2xl border border-slate-200 bg-white h-28 text-lg font-bold text-slate-900 shadow-sm`}
                                multiline
                            />
                        </View>

                        {/* 2. EXTRAS GRID */}
                        <Text style={tw`font-black mb-4 uppercase text-[10px] tracking-widest text-slate-400`}>
                            Add Extras
                        </Text>

                        {loading ? (
                            <ActivityIndicator color="#4f46e5" size="large" />
                        ) : availableModifiers.length === 0 ? (
                            <View style={tw`p-6 rounded-2xl items-center bg-white border border-slate-200 shadow-sm`}>
                                <Text style={tw`text-slate-500 font-medium`}>No extras configured for this item.</Text>
                            </View>
                        ) : (
                            <View style={tw`flex-row flex-wrap gap-3`}>
                                {availableModifiers.map((mod) => {
                                    const isSelected = selectedModifiers.some(m => m.id === (mod.inventory_item_id || mod.id));
                                    return (
                                        <Pressable
                                            key={mod.id}
                                            onPress={() => toggleModifier(mod)}
                                            style={({ pressed }) => [
                                                tw`w-[48%] p-4 rounded-2xl border flex-row justify-between items-center transition-all shadow-sm`,
                                                isSelected
                                                    ? tw`bg-indigo-50 border-indigo-200`
                                                    : tw`bg-white border-slate-100`,
                                                pressed && tw`scale-95 opacity-80`
                                            ]}
                                        >
                                            <View style={tw`flex-1 pr-2`}>
                                                <Text style={tw`font-black text-base tracking-tight ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                                                    {mod.name}
                                                </Text>
                                                <Text style={tw`text-xs font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}>
                                                    + R{Number(mod.extra_cost).toFixed(2)}
                                                </Text>
                                            </View>
                                            <View style={tw`h-7 w-7 rounded-full border items-center justify-center transition-all ${
                                                isSelected ? 'bg-indigo-600 border-indigo-600 shadow-sm' : 'bg-slate-50 border-slate-200'
                                            }`}>
                                                {isSelected && <Check size={14} color="white" />}
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer: Add Button */}
                    <View style={tw`p-6 border-t border-slate-100 bg-white`}>
                        <Pressable
                            onPress={handleConfirm}
                            style={({ pressed }) => [
                                tw`h-18 rounded-2xl flex-row justify-between items-center px-8 shadow-sm transition-all bg-indigo-600`,
                                pressed && tw`scale-95 bg-indigo-700 shadow-none`
                            ]}
                        >
                            <Text style={tw`text-white font-black text-xl tracking-tight uppercase`}>Add to Order</Text>
                            <View style={tw`bg-black/20 px-4 py-1.5 rounded-xl`}>
                                <Text style={tw`text-white font-black text-2xl tracking-tighter`}>R {currentTotal.toFixed(2)}</Text>
                            </View>
                        </Pressable>
                    </View>

                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}