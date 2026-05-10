import React, { useState, useMemo } from "react";
import { View, Text, FlatList, ActivityIndicator,
    TextInput, RefreshControl, Pressable, ScrollView
} from "react-native";
import tw from "twrnc";
import { 
    Search, Plus, FileText, ClipboardCheck, Check, X,
    TrendingUp, AlertTriangle, Package, ArrowDownUp
} from "lucide-react-native";
import { useInventoryLogic } from "../../hooks/useInventoryLogic";
import InventoryFormModal from "../../../components/Modals/InventoryFormModal";
import StockRow from "../../../components/StockRow";
import StockTakeRow from "../../../components/StockTakeRow";
import OpsPinModal from "../../../components/Modals/OpsPinModal";
import * as Haptics from 'expo-haptics';

import { getCategoryColor } from "../../../src/utils/colors";

export default function InventoryScreenMobile() {
    const {
        items, loading, refreshing, searchQuery, setSearchQuery,
        totalValue, criticalCount, totalItems,
        onRefresh, handleDelete, handleEdit, handleAdd, fetchInventory,
        modalVisible, setModalVisible, editingItem,
        opsPinVisible, setOpsPinVisible, handleSecureDelete, pendingDeleteId, approving,
        isStockTakeMode, toggleStockTakeMode, stockTakeCounts, updateStockCount, commitStockTake, generateReport
    } = useInventoryLogic();

    const [selectedCategory, setSelectedCategory] = useState("All");

    // Dynamic category filters based on current items
    const dynamicCategories = useMemo(() => {
        const cats = new Set<string>();
        items.forEach(item => {
            if (item.category) cats.add(item.category);
        });
        return ["All", ...Array.from(cats).sort()];
    }, [items]);

    // Category-filtered items
    const displayItems = useMemo(() => {
        if (selectedCategory === "All") return items;
        return items.filter(item => item.category === selectedCategory);
    }, [items, selectedCategory]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { All: items.length };
        items.forEach(item => {
            const cat = item.category || 'Other';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }, [items]);

    return (
        <View style={tw`flex-1 bg-slate-50`}>
            {/* ═══════════ HEADER ═══════════ */}
            <View style={tw`px-5 pt-4 pb-3 bg-white border-b border-slate-100 flex-row justify-between items-center`}>
                <View>
                    <Text style={tw`text-2xl font-black text-slate-900 tracking-tight`}>Inventory</Text>
                    <Text style={tw`text-xs font-medium text-slate-400 mt-0.5`}>Raw materials & stock</Text>
                </View>
                <View style={tw`flex-row gap-2`}>
                    <Pressable
                        onPress={() => { Haptics.selectionAsync(); generateReport('pdf'); }}
                        style={({ pressed }) => [
                            tw`p-2.5 rounded-xl border border-slate-200 bg-slate-50`,
                            pressed && tw`scale-95 bg-slate-100`
                        ]}
                    >
                        <FileText size={18} color="#64748b" />
                    </Pressable>
                    <Pressable
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleStockTakeMode(); }}
                        style={({ pressed }) => [
                            tw`p-2.5 rounded-xl border`,
                            isStockTakeMode ? tw`border-indigo-200 bg-indigo-50` : tw`border-slate-200 bg-slate-50`,
                            pressed && tw`scale-95`
                        ]}
                    >
                        <ClipboardCheck size={18} color={isStockTakeMode ? '#4f46e5' : '#64748b'} />
                    </Pressable>
                </View>
            </View>

            {/* ═══════════ COMPACT STATS ═══════════ */}
            <View style={tw`flex-row gap-2 px-4 py-3 bg-white border-b border-slate-100`}>
                <View style={tw`flex-1 p-3 rounded-xl bg-indigo-50 border border-indigo-100`}>
                    <View style={tw`flex-row items-center gap-1.5 mb-1`}>
                        <TrendingUp size={12} color="#4f46e5" />
                        <Text style={tw`text-[9px] font-black uppercase tracking-widest text-indigo-400`}>Value</Text>
                    </View>
                    <Text style={tw`text-lg font-black text-indigo-700 tracking-tight`} numberOfLines={1} adjustsFontSizeToFit>
                        R {totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Text>
                </View>
                <View style={[tw`flex-1 p-3 rounded-xl border`, criticalCount > 0 ? tw`bg-red-50 border-red-100` : tw`bg-slate-50 border-slate-200`]}>
                    <View style={tw`flex-row items-center gap-1.5 mb-1`}>
                        <AlertTriangle size={12} color={criticalCount > 0 ? '#ef4444' : '#94a3b8'} />
                        <Text style={tw`text-[9px] font-black uppercase tracking-widest ${criticalCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>Low</Text>
                    </View>
                    <Text style={tw`text-lg font-black tracking-tight ${criticalCount > 0 ? 'text-red-500' : 'text-slate-900'}`}>{criticalCount}</Text>
                </View>
                <View style={tw`flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200`}>
                    <View style={tw`flex-row items-center gap-1.5 mb-1`}>
                        <Package size={12} color="#334155" />
                        <Text style={tw`text-[9px] font-black uppercase tracking-widest text-slate-400`}>Items</Text>
                    </View>
                    <Text style={tw`text-lg font-black text-slate-900 tracking-tight`}>{totalItems}</Text>
                </View>
            </View>

            {/* ═══════════ CATEGORY CHIPS ═══════════ */}
            <View style={tw`bg-white border-b border-slate-100 px-4 py-2.5`}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-2`}>
                    {dynamicCategories.map(cat => {
                        const isActive = selectedCategory === cat;
                        const count = categoryCounts[cat] || 0;
                        const chipColor = cat === 'All' ? '#4f46e5' : getCategoryColor(cat);
                        return (
                            <Pressable
                                key={cat}
                                onPress={() => { Haptics.selectionAsync(); setSelectedCategory(cat); }}
                                style={({ pressed }) => [
                                    tw`flex-row items-center gap-1.5 px-3 py-2 rounded-lg border`,
                                    isActive
                                        ? [tw`border-transparent`, { backgroundColor: chipColor + '15' }]
                                        : tw`bg-white border-slate-200`,
                                    pressed && tw`scale-95`
                                ]}
                            >
                                {cat !== 'All' && (
                                    <View style={[tw`w-1.5 h-1.5 rounded-full`, { backgroundColor: chipColor }]} />
                                )}
                                <Text style={[
                                    tw`text-[10px] font-black uppercase tracking-wider`,
                                    isActive ? { color: chipColor } : tw`text-slate-500`
                                ]}>
                                    {cat}
                                </Text>
                                {count > 0 && isActive && (
                                    <View style={[tw`px-1 py-0.5 rounded`, { backgroundColor: chipColor + '20' }]}>
                                        <Text style={[tw`text-[8px] font-black`, { color: chipColor }]}>{count}</Text>
                                    </View>
                                )}
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ═══════════ SEARCH & ADD ═══════════ */}
            <View style={tw`px-4 pt-3 pb-2 flex-row gap-3`}>
                <View style={tw`flex-1 flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-2.5`}>
                    <Search size={16} color="#94a3b8" />
                    <TextInput
                        placeholder="Search stock..."
                        placeholderTextColor="#94a3b8"
                        style={tw`flex-1 ml-2.5 font-bold text-slate-900 text-sm`}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery('')}>
                            <X size={14} color="#94a3b8" />
                        </Pressable>
                    )}
                </View>
                <Pressable
                    onPress={() => { Haptics.impactAsync(); handleAdd(); }}
                    style={({ pressed }) => [
                        tw`w-11 items-center justify-center bg-indigo-600 rounded-xl shadow-sm`,
                        pressed && tw`scale-95 bg-indigo-700`
                    ]}
                >
                    <Plus size={20} color="white" />
                </Pressable>
            </View>

            {/* Results count */}
            <View style={tw`px-5 pb-2`}>
                <Text style={tw`text-[10px] font-bold text-slate-400`}>
                    {displayItems.length} {displayItems.length === 1 ? 'item' : 'items'}
                    {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
                </Text>
            </View>

            {/* ═══════════ ITEM LIST ═══════════ */}
            {loading ? (
                <View style={tw`flex-1 justify-center items-center`}>
                    <ActivityIndicator size="large" color="#4f46e5" />
                    <Text style={tw`mt-3 text-slate-400 font-bold text-xs`}>Loading inventory...</Text>
                </View>
            ) : (
                <FlatList
                    data={displayItems}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />
                    }
                    contentContainerStyle={tw`px-4 pb-4 ${isStockTakeMode ? 'pb-28' : 'pb-12'}`}
                    renderItem={({ item }) => (
                        isStockTakeMode ? (
                            <StockTakeRow item={item} count={stockTakeCounts[item.id]} onUpdateCount={updateStockCount} />
                        ) : (
                            <StockRow item={item} onEdit={handleEdit} onDelete={handleDelete} />
                        )
                    )}
                    ListEmptyComponent={
                        <View style={tw`items-center justify-center mt-16`}>
                            <View style={tw`w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4`}>
                                <Package size={28} color="#cbd5e1" />
                            </View>
                            <Text style={tw`text-base font-black text-slate-300`}>No items found</Text>
                            <Text style={tw`mt-1 text-xs font-medium text-slate-400 text-center`}>
                                {searchQuery ? 'Try a different search' : 'Add your first stock item'}
                            </Text>
                            {!searchQuery && (
                                <Pressable
                                    onPress={handleAdd}
                                    style={({ pressed }) => [
                                        tw`mt-4 flex-row items-center gap-2 bg-indigo-600 px-5 py-2.5 rounded-xl`,
                                        pressed && tw`scale-95 bg-indigo-700`
                                    ]}
                                >
                                    <Plus size={16} color="white" />
                                    <Text style={tw`text-white font-black text-xs uppercase tracking-wider`}>Add Item</Text>
                                </Pressable>
                            )}
                        </View>
                    }
                />
            )}

            {/* ═══════════ STOCK TAKE FOOTER ═══════════ */}
            {isStockTakeMode && (
                <View style={tw`absolute bottom-0 left-0 right-0 p-4 bg-white/95 border-t border-slate-200`}>
                    <View style={tw`flex-row items-center gap-3`}>
                        <Pressable
                            onPress={() => { Haptics.selectionAsync(); toggleStockTakeMode(); }}
                            style={({ pressed }) => [
                                tw`px-4 py-3 rounded-xl bg-slate-100 border border-slate-200`,
                                pressed && tw`scale-95`
                            ]}
                        >
                            <Text style={tw`text-slate-600 font-black text-xs uppercase`}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); commitStockTake(); }}
                            style={({ pressed }) => [
                                tw`flex-1 py-3 rounded-xl flex-row items-center justify-center gap-2 bg-indigo-600`,
                                pressed && tw`scale-[0.98] bg-indigo-700`
                            ]}
                        >
                            <Check size={18} color="white" />
                            <Text style={tw`text-white font-black uppercase tracking-widest text-xs`}>Submit ({Object.keys(stockTakeCounts).length})</Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {/* ═══════════ MODALS ═══════════ */}
            <InventoryFormModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSaved={fetchInventory}
                initialData={editingItem}
            />
            <OpsPinModal
                visible={opsPinVisible}
                onClose={() => setOpsPinVisible(false)}
                actionName="Delete Item"
                actionDescription="Enter the Operations PIN to authorize deletion"
                onSuccess={handleSecureDelete}
            />
        </View>
    );
}
