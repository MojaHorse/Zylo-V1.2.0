import React, { useState, useMemo } from "react";
import {
    View, Text, FlatList, ActivityIndicator,
    TextInput, RefreshControl, Pressable, ScrollView
} from "react-native";
import tw from "twrnc";
import { 
    Search, Plus, FileText, ClipboardCheck, Check, 
    TrendingUp, AlertTriangle, Package, X, ArrowDownUp
} from "lucide-react-native";
import { useInventoryLogic } from "../../hooks/useInventoryLogic";
import InventoryFormModal from "../../../components/Modals/InventoryFormModal";
import OpsPinModal from "../../../components/Modals/OpsPinModal";
import StockRow from "../../../components/StockRow";
import StockTakeRow from "../../../components/StockTakeRow";
import Header from "../../../components/Header";
import * as Haptics from 'expo-haptics';

import { getCategoryColor } from "../../../src/utils/colors";

export default function InventoryScreenTablet() {
    const {
        items, loading, refreshing, searchQuery, setSearchQuery,
        totalValue, criticalCount, totalItems,
        onRefresh, handleDelete, handleEdit, handleAdd, fetchInventory,
        modalVisible, setModalVisible, editingItem,
        opsPinVisible, setOpsPinVisible, handleSecureDelete, pendingDeleteId, approving,
        isStockTakeMode, toggleStockTakeMode, stockTakeCounts, updateStockCount, commitStockTake, generateReport
    } = useInventoryLogic();

    // Local filter state
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'status'>('name');

    // Dynamic category filters based on current items
    const dynamicCategories = useMemo(() => {
        const cats = new Set<string>();
        items.forEach(item => {
            if (item.category) cats.add(item.category);
        });
        return ["All", ...Array.from(cats).sort()];
    }, [items]);

    // Apply category filter + sort
    const displayItems = useMemo(() => {
        let filtered = items;
        
        if (selectedCategory !== "All") {
            filtered = filtered.filter(item => item.category === selectedCategory);
        }

        return [...filtered].sort((a, b) => {
            if (sortBy === 'quantity') return (a.quantity || 0) - (b.quantity || 0);
            if (sortBy === 'status') {
                const aStatus = (a.quantity || 0) <= (a.low_stock_threshold ?? 5) ? 0 : 1;
                const bStatus = (b.quantity || 0) <= (b.low_stock_threshold ?? 5) ? 0 : 1;
                return aStatus - bStatus;
            }
            return a.name.localeCompare(b.name);
        });
    }, [items, selectedCategory, sortBy]);

    // Count items per category for badges
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { All: items.length };
        items.forEach(item => {
            const cat = item.category || 'Other';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }, [items]);

    const cycleSortBy = () => {
        Haptics.selectionAsync();
        setSortBy(prev => {
            if (prev === 'name') return 'quantity';
            if (prev === 'quantity') return 'status';
            return 'name';
        });
    };

    const sortLabel = sortBy === 'name' ? 'A–Z' : sortBy === 'quantity' ? 'Qty ↑' : 'Status';

    return (
        <View style={tw`flex-1 bg-slate-50`}>
            {/* Header */}
            <View style={tw`px-8 pt-8`}>
                <Header title="Inventory" subtitle="Manage stock levels & costs" />
            </View>

            {/* ═══════════ STATS BAR ═══════════ */}
            <View style={tw`flex-row gap-4 px-8 mt-4 mb-6`}>
                {/* Total Value */}
                <View style={tw`flex-1 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm`}>
                    <View style={tw`flex-row items-center gap-3 mb-3`}>
                        <View style={tw`p-2.5 rounded-xl bg-indigo-50 border border-indigo-100`}>
                            <TrendingUp size={18} color="#4f46e5" />
                        </View>
                        <Text style={tw`text-xs font-black uppercase tracking-widest text-slate-400`}>Total Value</Text>
                    </View>
                    <Text style={tw`text-3xl font-black text-slate-900 tracking-tight`}>
                        R {totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </Text>
                </View>

                {/* Low Stock Alerts */}
                <View style={tw`flex-1 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm`}>
                    <View style={tw`flex-row items-center gap-3 mb-3`}>
                        <View style={[tw`p-2.5 rounded-xl border`, 
                            criticalCount > 0 ? tw`bg-red-50 border-red-100` : tw`bg-emerald-50 border-emerald-100`]}>
                            <AlertTriangle size={18} color={criticalCount > 0 ? '#ef4444' : '#10b981'} />
                        </View>
                        <Text style={tw`text-xs font-black uppercase tracking-widest text-slate-400`}>Alerts</Text>
                    </View>
                    <View style={tw`flex-row items-baseline gap-1.5`}>
                        <Text style={tw`text-3xl font-black tracking-tight ${criticalCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                            {criticalCount}
                        </Text>
                        <Text style={tw`text-sm font-bold text-slate-400`}>
                            {criticalCount === 0 ? 'All good' : 'need restock'}
                        </Text>
                    </View>
                </View>

                {/* Total Items */}
                <View style={tw`flex-1 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm`}>
                    <View style={tw`flex-row items-center gap-3 mb-3`}>
                        <View style={tw`p-2.5 rounded-xl bg-slate-50 border border-slate-100`}>
                            <Package size={18} color="#334155" />
                        </View>
                        <Text style={tw`text-xs font-black uppercase tracking-widest text-slate-400`}>Items</Text>
                    </View>
                    <View style={tw`flex-row items-baseline gap-1.5`}>
                        <Text style={tw`text-3xl font-black text-slate-900 tracking-tight`}>{totalItems}</Text>
                        <Text style={tw`text-sm font-bold text-slate-400`}>tracked</Text>
                    </View>
                </View>
            </View>

            {/* ═══════════ CATEGORY FILTER CHIPS ═══════════ */}
            <View style={tw`px-8 mb-4`}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-2`}>
                    {dynamicCategories.map(cat => {
                        const isActive = selectedCategory === cat;
                        const count = categoryCounts[cat] || 0;
                        const chipColor = cat === 'All' ? '#4f46e5' : getCategoryColor(cat);
                        
                        return (
                            <Pressable
                                key={cat}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setSelectedCategory(cat);
                                }}
                                style={({ pressed }) => [
                                    tw`flex-row items-center gap-2 px-4 py-2.5 rounded-xl border`,
                                    isActive
                                        ? [tw`border-transparent`, { backgroundColor: chipColor + '15' }]
                                        : tw`bg-white border-slate-200`,
                                    pressed && tw`scale-95 opacity-80`
                                ]}
                            >
                                {cat !== 'All' && (
                                    <View style={[tw`w-2 h-2 rounded-full`, { backgroundColor: chipColor }]} />
                                )}
                                <Text style={[
                                    tw`text-xs font-black uppercase tracking-wider`,
                                    isActive ? { color: chipColor } : tw`text-slate-500`
                                ]}>
                                    {cat}
                                </Text>
                                {count > 0 && (
                                    <View style={[
                                        tw`px-1.5 py-0.5 rounded-md`,
                                        isActive ? { backgroundColor: chipColor + '20' } : tw`bg-slate-100`
                                    ]}>
                                        <Text style={[
                                            tw`text-[9px] font-black`,
                                            isActive ? { color: chipColor } : tw`text-slate-400`
                                        ]}>
                                            {count}
                                        </Text>
                                    </View>
                                )}
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ═══════════ ACTION BAR ═══════════ */}
            <View style={tw`flex-row items-center gap-3 px-8 mb-4`}>
                {/* Search */}
                <View style={tw`flex-1 flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm`}>
                    <Search size={18} color="#94a3b8" />
                    <TextInput
                        placeholder="Search by name or category..."
                        placeholderTextColor="#94a3b8"
                        style={tw`flex-1 ml-3 font-bold text-slate-900 text-sm`}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery('')}>
                            <X size={16} color="#94a3b8" />
                        </Pressable>
                    )}
                </View>

                {/* Sort Toggle */}
                <Pressable
                    onPress={cycleSortBy}
                    style={({ pressed }) => [
                        tw`flex-row items-center gap-2 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm`,
                        pressed && tw`scale-95 bg-slate-50`
                    ]}
                >
                    <ArrowDownUp size={16} color="#64748b" />
                    <Text style={tw`text-slate-700 font-black text-xs uppercase tracking-wider`}>{sortLabel}</Text>
                </Pressable>
                
                {/* Add Stock */}
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync();
                        handleAdd();
                    }}
                    style={({ pressed }) => [
                        tw`flex-row items-center gap-2 bg-indigo-600 px-5 py-3 rounded-xl shadow-sm`,
                        pressed && tw`scale-95 bg-indigo-700 shadow-none`
                    ]}
                >
                    <Plus size={18} color="white" />
                    <Text style={tw`text-white font-black text-xs tracking-wider uppercase`}>Add Stock</Text>
                </Pressable>

                {/* Report */}
                <Pressable
                    onPress={() => {
                        Haptics.selectionAsync();
                        generateReport('pdf');
                    }}
                    style={({ pressed }) => [
                        tw`flex-row items-center gap-2 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm`,
                        pressed && tw`scale-95 bg-slate-50`
                    ]}
                >
                    <FileText size={16} color="#0f172a" />
                    <Text style={tw`text-slate-900 font-black text-xs uppercase tracking-wider`}>Report</Text>
                </Pressable>

                {/* Stock Take */}
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        toggleStockTakeMode();
                    }}
                    style={({ pressed }) => [
                        tw`flex-row items-center gap-2 px-4 py-3 rounded-xl border shadow-sm`,
                        isStockTakeMode ? tw`border-indigo-200 bg-indigo-50` : tw`border-slate-200 bg-white`,
                        pressed && tw`scale-95`
                    ]}
                >
                    <ClipboardCheck size={16} color={isStockTakeMode ? '#4f46e5' : '#0f172a'} />
                    <Text style={tw`font-black text-xs uppercase tracking-wider ${isStockTakeMode ? 'text-indigo-700' : 'text-slate-900'}`}>
                        Stock Take
                    </Text>
                </Pressable>
            </View>

            {/* ═══════════ RESULTS COUNT ═══════════ */}
            <View style={tw`px-8 mb-2`}>
                <Text style={tw`text-xs font-bold text-slate-400`}>
                    {displayItems.length} {displayItems.length === 1 ? 'item' : 'items'}
                    {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
                    {searchQuery ? ` matching "${searchQuery}"` : ''}
                </Text>
            </View>

            {/* ═══════════ LIST ═══════════ */}
            <View style={tw`flex-1 px-8`}>
                {loading ? (
                    <View style={tw`flex-1 justify-center items-center`}>
                        <ActivityIndicator size="large" color="#4f46e5" />
                        <Text style={tw`mt-4 text-slate-400 font-bold text-sm`}>Loading inventory...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={displayItems}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />
                        }
                        contentContainerStyle={tw`pb-8 ${isStockTakeMode ? 'pb-28' : ''}`}
                        renderItem={({ item }) => (
                            isStockTakeMode ? (
                                <StockTakeRow
                                    item={item}
                                    count={stockTakeCounts[item.id]}
                                    onUpdateCount={updateStockCount}
                                />
                            ) : (
                                <StockRow
                                    item={item}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            )
                        )}
                        ListEmptyComponent={
                            <View style={tw`items-center justify-center my-24`}>
                                <View style={tw`w-20 h-20 rounded-full bg-slate-100 items-center justify-center mb-6`}>
                                    <Package size={36} color="#cbd5e1" />
                                </View>
                                <Text style={tw`text-xl font-black text-slate-300 tracking-tight`}>No items found</Text>
                                <Text style={tw`mt-2 text-sm font-medium text-slate-400`}>
                                    {searchQuery ? 'Try a different search term' : 'Add your first stock item to get started'}
                                </Text>
                                {!searchQuery && (
                                    <Pressable
                                        onPress={handleAdd}
                                        style={({ pressed }) => [
                                            tw`mt-6 flex-row items-center gap-2 bg-indigo-600 px-6 py-3 rounded-xl`,
                                            pressed && tw`scale-95 bg-indigo-700`
                                        ]}
                                    >
                                        <Plus size={18} color="white" />
                                        <Text style={tw`text-white font-black text-sm uppercase tracking-wider`}>Add First Item</Text>
                                    </Pressable>
                                )}
                            </View>
                        }
                    />
                )}
            </View>

            {/* ═══════════ STOCK TAKE SUBMIT FOOTER ═══════════ */}
            {isStockTakeMode && (
                <View style={tw`absolute bottom-0 left-0 right-0 p-6 bg-white/95 border-t border-slate-200`}>
                    <View style={tw`flex-row items-center gap-4`}>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-sm font-black text-slate-900`}>
                                {Object.keys(stockTakeCounts).length} items counted
                            </Text>
                            <Text style={tw`text-xs text-slate-500 font-medium`}>
                                Review variance before submitting
                            </Text>
                        </View>
                        <Pressable
                            onPress={() => {
                                Haptics.selectionAsync();
                                toggleStockTakeMode();
                            }}
                            style={({ pressed }) => [
                                tw`px-5 py-3.5 rounded-xl bg-slate-100 border border-slate-200`,
                                pressed && tw`scale-95 bg-slate-200`
                            ]}
                        >
                            <Text style={tw`text-slate-700 font-black text-sm uppercase tracking-wider`}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                commitStockTake();
                            }}
                            style={({ pressed }) => [
                                tw`flex-row items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 shadow-sm`,
                                pressed && tw`scale-95 bg-indigo-700 shadow-none`
                            ]}
                        >
                            <Check size={20} color="white" />
                            <Text style={tw`text-white font-black text-sm uppercase tracking-widest`}>Submit Stock Take</Text>
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
