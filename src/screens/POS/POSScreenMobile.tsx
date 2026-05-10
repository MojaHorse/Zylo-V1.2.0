import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, ActivityIndicator, Modal, Alert, Pressable } from 'react-native';
import tw from 'twrnc';
import { Search, Calendar, RefreshCcw, X, Calculator, Grid } from 'lucide-react-native';
import { usePOSLogic } from '../../hooks/usePOSLogic';
import ProductCard from '../../../components/ProductCard';
import CategoryPill from '../../../components/CategoryPill';
import OrderSummaryMobile from '../../../components/OrderSummaryMobile';
import AddItemChooserModal from '../../../components/Modals/AddItemChooserModal';
import AddSimpleProductModal from '../../../components/Modals/AddSimpleProductModal';
import AddRecipeProductModal from '../../../components/Modals/AddRecipeProductModal';
import ProductCustomizationModal from '../../../components/Modals/ProductCustomizationModal';
import CheckoutModal from '../../../components/Modals/CheckoutModal';
import { ProductCardSkeleton } from '../../../components/Skeletons/ProductCardSkeleton';
import POSKeypad from '../../../components/POSKeypad';
import * as Haptics from 'expo-haptics';
import type { Product } from '../../../types';

export default function POSScreenMobile() {
    const {
        products, categories, selectedCategory, setSelectedCategory, loading, searchQuery, setSearchQuery,
        handleQuickAdd, handleDeleteProduct,
        clearCart, cart, fetchProducts,
        showAddModal, setShowAddModal, showCheckout, setShowCheckout, showMobileCart, setShowMobileCart,
        customizingProduct, setCustomizingProduct, addToCart,
        isKeypadMode, setIsKeypadMode, customAmount, setCustomAmount, handleAddCustomAmount
    } = usePOSLogic();

    const [addModalType, setAddModalType] = useState<'chooser' | 'simple' | 'recipe' | null>(null);

    // Edit product state (for the 3-dot menu "Edit Product")
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    return (
        <View style={tw`flex-1 bg-slate-50`}>
            {/* Main Content Area */}
            <View style={tw`flex-1 px-4 pt-2`}>

                {/* Header */}
                <View style={tw`flex-row justify-between items-center mb-4`}>
                    <View style={tw`flex-row items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm`}>
                        <Calendar size={14} color="#64748b" />
                        <Text style={tw`text-xs font-bold text-slate-500`}>{new Date().toLocaleDateString()}</Text>
                    </View>

                    <View style={tw`flex-row gap-2`}>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync();
                                Alert.alert("Reset Order", "Clear cart?", [
                                    { text: "Cancel", style: "cancel" }, 
                                    { text: "Clear", onPress: clearCart, style: 'destructive' }
                                ])
                            }}
                            style={({ pressed }) => [
                                tw`p-2.5 rounded-full border border-slate-200 bg-white shadow-sm transition-all text-center justify-center`,
                                pressed && tw`scale-95 bg-red-50 border-red-100`
                            ]}
                        >
                            <RefreshCcw size={16} color="#ef4444" />
                        </Pressable>

                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync();
                                setAddModalType('chooser');
                            }}
                            style={({ pressed }) => [
                                tw`px-4 py-2 rounded-full bg-indigo-600 items-center justify-center shadow-sm transition-all`,
                                pressed && tw`scale-95 bg-indigo-700 shadow-none`
                            ]}
                        >
                            <Text style={tw`text-xs font-bold text-white tracking-wide`}>+ Add Item</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Search & Keypad Toggle */}
                <View style={tw`flex-row gap-2 mb-4`}>
                    <View style={tw`flex-1 bg-white border border-slate-200 rounded-2xl h-12 flex-row items-center px-4 shadow-sm`}>
                        <Search size={20} color="#94a3b8" style={tw`mr-3`} />
                        <TextInput
                            placeholder="Search menu..."
                            placeholderTextColor="#94a3b8"
                            style={tw`flex-1 text-base font-medium text-slate-900`}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <Pressable onPress={() => { Haptics.selectionAsync(); setSearchQuery(''); }} style={tw`p-1`}>
                                <X size={18} color="#94a3b8" />
                            </Pressable>
                        )}
                    </View>
                    <Pressable
                        onPress={() => {
                            Haptics.selectionAsync();
                            setIsKeypadMode(!isKeypadMode);
                        }}
                        style={({ pressed }) => [
                            tw`h-12 w-14 rounded-2xl border items-center justify-center transition-all`,
                            isKeypadMode ? tw`bg-indigo-50 border-indigo-200` : tw`bg-white border-slate-200 shadow-sm`,
                            pressed && tw`scale-95 bg-slate-50`
                        ]}
                    >
                        {isKeypadMode ? (
                            <Grid size={20} color="#4f46e5" />
                        ) : (
                            <Calculator size={20} color="#64748b" />
                        )}
                    </Pressable>
                </View>

                {/* Categories */}
                {!isKeypadMode && (
                    <View style={tw`h-10 mb-4`}>
                        <FlatList
                            horizontal
                            data={categories}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={tw`gap-2 pr-4`}
                            renderItem={({ item }) => (
                                <CategoryPill
                                    label={item}
                                    isActive={selectedCategory === item}
                                    onPress={() => setSelectedCategory(item)}
                                />
                            )}
                        />
                    </View>
                )}

                {/* Product Grid / Keypad */}
                {isKeypadMode ? (
                    <POSKeypad 
                        amount={customAmount} 
                        onAmountChange={setCustomAmount} 
                        onAdd={handleAddCustomAmount} 
                    />
                ) : (
                    loading ? (
                        <View style={tw`flex-1 p-1 flex-row flex-wrap gap-3`}>
                            <View style={tw`w-[48%]`}>
                                <ProductCardSkeleton />
                            </View>
                            <View style={tw`w-[48%]`}>
                                <ProductCardSkeleton />
                            </View>
                            <View style={tw`w-[48%]`}>
                                <ProductCardSkeleton />
                            </View>
                            <View style={tw`w-[48%]`}>
                                <ProductCardSkeleton />
                            </View>
                        </View>
                    ) : (
                        <FlatList
                            data={products}
                            keyExtractor={(item) => item.id}
                            numColumns={2}
                            columnWrapperStyle={tw`gap-3 mb-3`}
                            contentContainerStyle={tw`pb-32 pt-2 px-1`}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <View style={tw`flex-1 max-w-[48%]`}>
                                    <ProductCard
                                        product={item}
                                        onAdd={handleQuickAdd}
                                        onEdit={setCustomizingProduct}
                                        onEditProduct={setEditingProduct}
                                        onDelete={handleDeleteProduct}
                                        onInfoPress={() => { }}
                                    />
                                </View>
                            )}
                            ListEmptyComponent={
                                <View style={tw`items-center justify-center mt-20 opacity-50`}>
                                    <Text style={tw`font-bold text-lg text-slate-400`}>No items found</Text>
                                </View>
                            }
                        />
                    )
                )}
            </View>

            {/* Floating Cart Button */}
            {cart.length > 0 && (
                <View style={tw`absolute bottom-8 left-4 right-4 z-50`}>
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync();
                            setShowMobileCart(true);
                        }}
                        style={({ pressed }) => [
                            tw`h-16 rounded-2xl flex-row justify-between items-center px-5 bg-indigo-600 shadow-md transition-all`,
                            pressed && tw`scale-95 bg-indigo-700 shadow-sm`
                        ]}
                    >
                        <View style={tw`flex-row items-center gap-3`}>
                            <View style={tw`bg-white/20 w-8 h-8 rounded-full items-center justify-center border border-white/20`}>
                                <Text style={tw`text-white font-black text-xs`}>
                                    {cart.reduce((a, b) => a + b.quantity, 0)}
                                </Text>
                            </View>
                            <Text style={tw`text-white font-black text-lg uppercase tracking-wider`}>View Order</Text>
                        </View>
                        <Text style={tw`text-white font-black text-xl`}>
                            R {cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}
                        </Text>
                    </Pressable>
                </View>
            )}

            {/* Modals */}
            <Modal visible={showMobileCart} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowMobileCart(false)}>
                <View style={tw`flex-1 bg-slate-50`}>
                    <View style={tw`flex-row justify-between items-center px-5 py-4 border-b border-slate-200 bg-white`}>
                        <Text style={tw`font-black text-xl tracking-tight text-slate-900`}>Current Order</Text>
                        <Pressable 
                            onPress={() => { Haptics.selectionAsync(); setShowMobileCart(false); }} 
                            style={({ pressed }) => [tw`p-2 rounded-full transition-all`, pressed ? tw`bg-slate-100` : tw`bg-slate-50`]}
                        >
                            <X color="#64748b" size={20} />
                        </Pressable>
                    </View>
                    <OrderSummaryMobile onClose={() => setShowMobileCart(false)} onCheckoutPress={() => { setShowMobileCart(false); setShowCheckout(true); }} />
                </View>
            </Modal>

            <AddItemChooserModal 
                visible={addModalType === 'chooser'}
                onClose={() => setAddModalType(null)}
                onSelectSimple={() => setAddModalType('simple')}
                onSelectRecipe={() => setAddModalType('recipe')}
            />

            <AddSimpleProductModal 
                visible={addModalType === 'simple' || (editingProduct?.product_type === 'simple')}
                onClose={() => { setAddModalType(null); setEditingProduct(null); }}
                onSaved={fetchProducts}
                editProduct={editingProduct?.product_type === 'simple' ? editingProduct : null}
            />

            <AddRecipeProductModal 
                visible={addModalType === 'recipe' || (editingProduct?.product_type === 'recipe')}
                onClose={() => { setAddModalType(null); setEditingProduct(null); }}
                onSaved={fetchProducts}
                editProduct={editingProduct?.product_type === 'recipe' ? editingProduct : null}
            />

            <ProductCustomizationModal 
                visible={!!customizingProduct} 
                product={customizingProduct} 
                onClose={() => setCustomizingProduct(null)} 
                onAddToCart={(p, m, n) => {
                    const result = addToCart(p, m, n);
                    setCustomizingProduct(null);
                    return result;
                }} 
            />
            <CheckoutModal visible={showCheckout} onClose={() => { setShowCheckout(false); fetchProducts(); }} />
        </View>
    );
}