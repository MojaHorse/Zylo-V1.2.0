import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { X, Plus, Trash2, Save } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

interface Props {
    visible: boolean;
    productId: string | null;
    businessId: string;
    onClose: () => void;
}

export default function RecipeLinkModal({ visible, productId, businessId, onClose }: Props) {
    const [ingredients, setIngredients] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (visible && productId) fetchData();
    }, [visible, productId]);

    const fetchData = async () => {
        setLoading(true);
        // 1. Fetch current recipe
        const { data: current } = await supabase
            .from('product_ingredients')
            .select('*, inventory_items(name, unit)')
            .eq('product_id', productId);
        setIngredients(current || []);

        // 2. Fetch all inventory for selection
        const { data: allInv } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('business_id', businessId)
            .order('name');
        setInventory(allInv || []);
        
        setLoading(false);
    };

    const addIngredient = async (invItem: any) => {
        const { error } = await supabase.from('product_ingredients').insert({
            business_id: businessId,
            product_id: productId,
            inventory_item_id: invItem.id,
            quantity_required: 1 // Default
        });
        if (!error) fetchData();
    };

    const updateQuantity = async (id: string, qty: string) => {
        await supabase.from('product_ingredients').update({ quantity_required: parseFloat(qty) }).eq('id', id);
    };

    const removeIngredient = async (id: string) => {
        await supabase.from('product_ingredients').delete().eq('id', id);
        setIngredients(prev => prev.filter(i => i.id !== id));
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={tw`flex-1 bg-[#111]`}>
                <View style={tw`p-4 border-b border-[#333] flex-row justify-between items-center`}>
                    <Text style={tw`text-white text-xl font-bold`}>Edit Recipe</Text>
                    <TouchableOpacity onPress={onClose}><X color="white" size={24} /></TouchableOpacity>
                </View>

                {loading ? <ActivityIndicator color="#84cc16" style={tw`mt-10`} /> : (
                    <View style={tw`flex-1 p-4`}>
                        <Text style={tw`text-gray-400 mb-2 uppercase text-xs font-bold`}>Ingredients Used</Text>
                        <FlatList
                            data={ingredients}
                            keyExtractor={i => i.id}
                            renderItem={({ item }) => (
                                <View style={tw`bg-[#1a1a1a] p-3 rounded-lg mb-2 flex-row items-center justify-between border border-[#333]`}>
                                    <Text style={tw`text-white flex-1`}>{item.inventory_items.name}</Text>
                                    <View style={tw`flex-row items-center gap-2`}>
                                        <TextInput 
                                            style={tw`bg-black text-white w-16 p-2 rounded text-center border border-[#333]`}
                                            defaultValue={String(item.quantity_required)}
                                            keyboardType="numeric"
                                            onEndEditing={(e) => updateQuantity(item.id, e.nativeEvent.text)}
                                        />
                                        <Text style={tw`text-gray-500 text-xs w-8`}>{item.inventory_items.unit}</Text>
                                        <TouchableOpacity onPress={() => removeIngredient(item.id)}>
                                            <Trash2 size={18} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        />

                        <Text style={tw`text-gray-400 mt-6 mb-2 uppercase text-xs font-bold`}>Add From Inventory</Text>
                        <FlatList
                            data={inventory}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    onPress={() => addIngredient(item)}
                                    style={tw`bg-[#222] p-3 rounded-lg mr-2 border border-[#333]`}
                                >
                                    <View style={tw`flex-row items-center gap-1`}>
                                        <Plus size={16} color="#84cc16" />
                                        <Text style={tw`text-white text-xs`}>{item.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}
            </View>
        </Modal>
    );
}