import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, ActivityIndicator, Alert, Pressable, LayoutAnimation } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { Search, Calendar, RefreshCcw, Calculator, Grid } from 'lucide-react-native';
import { usePOSLogic } from '../../hooks/usePOSLogic';
import ProductCard from '../../../components/ProductCard';
import CategoryPill from '../../../components/CategoryPill';
import OrderSummary from '../../../components/OrderSummary';
import AddItemChooserModal from '../../../components/Modals/AddItemChooserModal';
import AddSimpleProductModal from '../../../components/Modals/AddSimpleProductModal';
import AddRecipeProductModal from '../../../components/Modals/AddRecipeProductModal';
import ProductCustomizationModal from '../../../components/Modals/ProductCustomizationModal';
import CheckoutModal from '../../../components/Modals/CheckoutModal';
import POSKeypad from '../../../components/POSKeypad';
import * as Haptics from 'expo-haptics';
import type { Product } from '../../../types';

export default function POSScreenTablet() {
    const {
        products, categories, selectedCategory, setSelectedCategory, loading, searchQuery, setSearchQuery,
        handleQuickAdd, handleDeleteProduct,
        clearCart, fetchProducts, calculateColumns,
        showAddModal, setShowAddModal, showCheckout, setShowCheckout,
        customizingProduct, setCustomizingProduct, addToCart,
        orderCollapsed, setOrderCollapsed,
        isKeypadMode, setIsKeypadMode, customAmount, setCustomAmount, handleAddCustomAmount
    } = usePOSLogic();

    // Edit product state (for the 3-dot menu "Edit Product")
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [addModalType, setAddModalType] = useState<'chooser' | 'simple' | 'recipe' | null>(null);

    return (
        <SafeAreaView style={tw`flex-1 flex-row bg-slate-50`} edges={['top', 'bottom', 'left']}>
            {/* Left Grid */}
            <View style={tw`flex-1 p-6 pl-8`}>
                <View style={tw`flex-row justify-between items-center mb-6`}>
                    <View style={tw`flex-row items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm`}>
                        <Calendar size={16} color="#64748b" />
                        <Text style={tw`text-slate-600 font-bold text-sm`}>{new Date().toLocaleDateString()}</Text>
                    </View>
                    <View style={tw`flex-row gap-3`}>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync();
                                Alert.alert("Reset", "Clear Cart?", [
                                    { text: "Yes", onPress: clearCart, style: 'destructive' }, 
                                    { text: "No", style: 'cancel' }
                                ])
                            }}
                            style={({ pressed }) => [
                                tw`px-4 py-2 rounded-xl flex-row items-center gap-2 bg-white border border-slate-200 shadow-sm transition-all`,
                                pressed && tw`scale-95 bg-red-50 border-red-100`
                            ]}
                        >
                            <RefreshCcw size={16} color="#ef4444" />
                            <Text style={tw`text-red-500 font-bold`}>Reset</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync();
                                setAddModalType('chooser');
                            }}
                            style={({ pressed }) => [
                                tw`px-5 py-2 rounded-xl bg-indigo-600 shadow-sm items-center justify-center transition-all`,
                                pressed && tw`scale-95 bg-indigo-700 shadow-none`
                            ]}
                        >
                            <Text style={tw`text-white font-bold tracking-wider`}>+ Add Product</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={tw`flex-row items-center gap-3 mb-6`}>
                    <View style={tw`flex-1 bg-white border border-slate-200 rounded-2xl h-14 flex-row items-center px-4 shadow-sm`}>
                        <Search size={20} color="#94a3b8" style={tw`mr-3`} />
                        <TextInput
                            placeholder="Search items..."
                            placeholderTextColor="#94a3b8"
                            style={tw`flex-1 text-lg font-medium text-slate-900`}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <Pressable
                        onPress={() => {
                            Haptics.selectionAsync();
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setIsKeypadMode(!isKeypadMode);
                        }}
                        style={({ pressed }) => [
                            tw`h-14 px-5 rounded-2xl border items-center justify-center flex-row gap-2 transition-all`,
                            isKeypadMode ? tw`bg-indigo-50 border-indigo-200` : tw`bg-white border-slate-200 shadow-sm`,
                            pressed && tw`scale-95 bg-slate-50`
                        ]}
                    >
                        {isKeypadMode ? (
                            <>
                                <Grid size={20} color="#4f46e5" />
                                <Text style={tw`font-bold text-indigo-600`}>Grid</Text>
                            </>
                        ) : (
                            <>
                                <Calculator size={20} color="#64748b" />
                                <Text style={tw`font-bold text-slate-600`}>Keypad</Text>
                            </>
                        )}
                    </Pressable>
                </View>

                {!isKeypadMode && (
                    <View style={tw`flex-row gap-3 mb-6`}>
                        {categories.map((cat) => (
                            <CategoryPill 
                                key={cat} 
                                label={cat} 
                                isActive={selectedCategory === cat} 
                                onPress={() => setSelectedCategory(cat)} 
                            />
                        ))}
                    </View>
                )}

                {isKeypadMode ? (
                    <POSKeypad 
                        amount={customAmount} 
                        onAmountChange={setCustomAmount} 
                        onAdd={handleAddCustomAmount} 
                    />
                ) : (
                    loading ? <ActivityIndicator size="large" color="#4f46e5" style={tw`mt-10`} /> : (
                        <FlatList
                            key={`grid-${calculateColumns()}`}
                            data={products}
                            keyExtractor={(item) => item.id}
                            numColumns={calculateColumns()}
                            columnWrapperStyle={tw`gap-4 mb-4`}
                            contentContainerStyle={tw`pb-20`}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <View style={tw`flex-1 max-w-[240px]`}>
                                    <ProductCard
                                        product={item}
                                        onAdd={handleQuickAdd}
                                        onEdit={setCustomizingProduct}
                                        onEditProduct={setEditingProduct}
                                        onDelete={handleDeleteProduct}
                                        onInfoPress={(p) => Alert.alert('Info', p.description || 'No description')}
                                    />
                                </View>
                            )}
                        />
                    )
                )}
            </View>

            {/* Right Sidebar */}
            <OrderSummary onCollapsedChange={(collapsed) => setOrderCollapsed(collapsed)} onCheckoutPress={() => setShowCheckout(true)} />

            {/* Modals */}
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
        </SafeAreaView>
    );
}