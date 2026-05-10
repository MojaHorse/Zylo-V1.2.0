import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Alert, ActivityIndicator, Pressable } from 'react-native';
import tw from 'twrnc';
import { Eye, EyeOff, RotateCcw, Box, Edit2, Trash2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../components/Context/BusinessContext';
import * as Haptics from 'expo-haptics';
import AddSimpleProductModal from '../../components/Modals/AddSimpleProductModal';
import AddRecipeProductModal from '../../components/Modals/AddRecipeProductModal';

export default function MenuScreen() {
    const { selectedBusiness } = useBusiness();

    // Data
    const [products, setProducts] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [showArchived, setShowArchived] = useState(false);

    // Modal State
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [editModalType, setEditModalType] = useState<'simple' | 'recipe' | null>(null);

    useEffect(() => {
        if (selectedBusiness) fetchData();
    }, [selectedBusiness]);

    const fetchData = async () => {
        if (!selectedBusiness) return;
        setLoading(true);

        const { data: prodData } = await supabase
            .from('products')
            .select('*')
            .eq('business_id', selectedBusiness.id)
            .order('name');

        if (prodData) setProducts(prodData);

        const { data: invData } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('business_id', selectedBusiness.id)
            .order('name');

        if (invData) setInventory(invData);
        setLoading(false);
    };

    const visibleProducts = products
        .filter(p => showArchived || p.is_available)
        .sort((a, b) => {
            if (a.is_available === b.is_available) {
                return a.name.localeCompare(b.name);
            }
            return a.is_available ? -1 : 1;
        });

    // Actions
    const handleArchiveProduct = async (product: any) => {
        const { error } = await supabase.from('products').update({ is_available: false }).eq('id', product.id);
        if (!error) {
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_available: false } : p));
            Alert.alert("Archived", "Product moved to archive list.");
        }
    };

    const handleRestoreProduct = async (product: any) => {
        const { error } = await supabase.from('products').update({ is_available: true }).eq('id', product.id);
        if (!error) {
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_available: true } : p));
            Alert.alert("Restored", "Product is back on menu.");
        }
    };

    const handleDeleteProduct = (product: any) => {
        Alert.alert("Delete Forever?", `Cannot be undone.`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    const { error } = await supabase.from('products').delete().eq('id', product.id);
                    if (!error) {
                        setProducts(prev => prev.filter(p => p.id !== product.id));
                    } else {
                        Alert.alert("Error", "Cannot delete. Try Archiving instead.");
                    }
                }
            }
        ]);
    };

    // Edit Logic
    const handleEditProduct = (product: any) => {
        setSelectedProduct(product);
        setEditModalType(product.product_type === 'recipe' ? 'recipe' : 'simple');
    };

    return (
        <View style={tw`flex-1 bg-slate-50 p-4`}>

            {/* --- HEADER --- */}
            <View style={tw`flex-row justify-between items-start mb-6`}>
                <View style={tw`flex-1 mr-4`}>
                    <Text style={tw`text-slate-900 text-3xl font-black tracking-tight`}>Menu</Text>
                    <Text style={tw`text-slate-500 font-medium`}>Manage Products</Text>
                </View>

                <Pressable
                    onPress={() => {
                        Haptics.selectionAsync();
                        setShowArchived(!showArchived);
                    }}
                    style={({ pressed }) => [
                        tw`flex-row items-center gap-2 px-5 py-3 rounded-xl border shadow-sm transition-all`,
                        showArchived
                            ? tw`bg-slate-100 border-slate-200`
                            : tw`bg-indigo-600 border-indigo-500`,
                        pressed && tw`scale-95`
                    ]}
                >
                    {showArchived ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="white" />}
                    <Text style={tw`font-bold text-sm ${showArchived ? 'text-slate-600' : 'text-white'}`}>
                        {showArchived ? 'Hide Archived' : 'Show Archived'}
                    </Text>
                </Pressable>
            </View>

            {loading ? <ActivityIndicator color="#4f46e5" style={tw`mt-20`} size="large" /> : (
                <FlatList
                    data={visibleProducts}
                    keyExtractor={item => item.id}
                    contentContainerStyle={tw`pb-20`}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={tw`items-center mt-20 opacity-40`}>
                            <Box size={48} color="#64748b" />
                            <Text style={tw`mt-4 text-lg font-bold text-slate-500`}>No products found</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={tw`
                            bg-white p-4 rounded-2xl mb-3 border flex-row justify-between items-center shadow-sm
                            ${!item.is_available ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200'}
                        `}>
                            {/* Product Info */}
                            <View style={tw`flex-1 mr-4`}>
                                <View style={tw`flex-row items-center gap-2 mb-1`}>
                                    <Text style={tw`text-slate-900 font-black text-lg`}>{item.name}</Text>

                                    {!item.is_available && (
                                        <View style={tw`bg-amber-100 px-2 py-0.5 rounded border border-amber-200`}>
                                            <Text style={tw`text-amber-700 text-[10px] font-bold uppercase tracking-wider`}>Archived</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={tw`text-indigo-600 font-bold`}>R {Number(item.price).toFixed(2)}</Text>
                            </View>

                            {/* Actions */}
                            <View style={tw`flex-row gap-2`}>
                                <Pressable
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        handleEditProduct(item);
                                    }}
                                    style={({ pressed }) => [
                                        tw`p-2.5 rounded-xl border border-slate-200 bg-white shadow-sm transition-all`,
                                        pressed && tw`scale-95 bg-slate-50`
                                    ]}
                                >
                                    <Edit2 size={18} color="#4f46e5" />
                                </Pressable>

                                {item.is_available ? (
                                    <>
                                        <Pressable
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                handleArchiveProduct(item);
                                            }}
                                            style={({ pressed }) => [
                                                tw`p-2.5 rounded-xl border border-amber-200 bg-amber-50 shadow-sm transition-all`,
                                                pressed && tw`scale-95 bg-amber-100`
                                            ]}
                                        >
                                            <Box size={18} color="#f59e0b" />
                                        </Pressable>

                                        <Pressable
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                handleDeleteProduct(item);
                                            }}
                                            style={({ pressed }) => [
                                                tw`p-2.5 rounded-xl border border-red-200 bg-red-50 shadow-sm transition-all`,
                                                pressed && tw`scale-95 bg-red-100`
                                            ]}
                                        >
                                            <Trash2 size={18} color="#ef4444" />
                                        </Pressable>
                                    </>
                                ) : (
                                    <Pressable
                                        onPress={() => {
                                            Haptics.impactAsync();
                                            handleRestoreProduct(item);
                                        }}
                                        style={({ pressed }) => [
                                            tw`px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 flex-row items-center gap-2 shadow-sm transition-all`,
                                            pressed && tw`scale-95 bg-blue-100`
                                        ]}
                                    >
                                        <RotateCcw size={16} color="#3b82f6" />
                                        <Text style={tw`text-blue-600 font-bold text-xs uppercase tracking-wider`}>Restore</Text>
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    )}
                />
            )}

            <AddSimpleProductModal 
                visible={editModalType === 'simple'}
                onClose={() => { setEditModalType(null); setSelectedProduct(null); }}
                onSaved={fetchData}
                editProduct={selectedProduct}
            />

            <AddRecipeProductModal 
                visible={editModalType === 'recipe'}
                onClose={() => { setEditModalType(null); setSelectedProduct(null); }}
                onSaved={fetchData}
                editProduct={selectedProduct}
            />
        </View>
    );
}