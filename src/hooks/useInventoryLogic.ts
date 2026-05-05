import { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../components/Context/BusinessContext';
import { useAuth } from '../../components/Context/AuthContext';
import { useToast } from '../../components/Context/ToastContext'; // 👈 Import
import type { InventoryItem } from '../../types';
import { triggerHaptic } from '../../src/utils/haptics';
import { generateInventoryReport } from '../utils/reporting'; // 👈 Import

export const useInventoryLogic = () => {
    const { selectedBusiness: business } = useBusiness();
    const userRole = business?.role ?? 'cashier';
    const { showToast } = useToast(); // 👈 Hook

    // Data State
    const [allItems, setAllItems] = useState<InventoryItem[]>([]); // Store ALL items here
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

    // Security State
    const [pinModalVisible, setPinModalVisible] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [approving, setApproving] = useState(false);

    // Stock Take State
    const [isStockTakeMode, setIsStockTakeMode] = useState(false);
    const [stockTakeCounts, setStockTakeCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        if (business) fetchInventory();
    }, [business]);

    const fetchInventory = async (forceLoading = false) => {
        if (!business) return;

        // Only show skeleton loader if we have no items, or if explicitly forced.
        // This prevents the "flash/freeze" when updating single items.
        if (!refreshing && (allItems.length === 0 || forceLoading)) {
            setLoading(true);
        }

        const { data, error } = await supabase
            .from("inventory_items")
            .select("*")
            .eq("business_id", business.id)
            .order("name", { ascending: true });

        if (!error && data) {
            setAllItems(data as InventoryItem[]);
        } else {
            Alert.alert("Error", "Failed to load inventory.");
        }
        setLoading(false);
        setRefreshing(false);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchInventory(false); // Don't force loading state, refreshing handles it
    };

    // --- SEARCH FILTER ---
    const filteredItems = useMemo(() => {
        if (!searchQuery) return allItems;
        const query = searchQuery.toLowerCase();
        return allItems.filter(item =>
            item.name.toLowerCase().includes(query) ||
            (item.category && item.category.toLowerCase().includes(query))
        );
    }, [allItems, searchQuery]);

    // --- STATS CALCULATION (Uses Filtered Items) ---
    const stats = useMemo(() => {
        return filteredItems.reduce((acc, item) => {
            // 🛡️ SAFE GUARD: Check both new and old column names
            const price = item.cost_price ?? 0;
            const threshold = item.low_stock_threshold ?? 0;
            const qty = item.quantity || 0;

            return {
                totalValue: acc.totalValue + (qty * price),
                criticalCount: acc.criticalCount + (qty <= threshold ? 1 : 0),
                count: acc.count + 1
            };
        }, { totalValue: 0, criticalCount: 0, count: 0 });
    }, [filteredItems]);

    // --- ACTIONS ---
    // --- ACTIONS ---
    const handleDelete = useCallback(async (id: string) => {
        if (userRole === 'owner' || userRole === 'manager') {
            performDirectDelete(id);
        } else {
            setPendingDeleteId(id);
            setPinModalVisible(true);
        }
    }, [userRole]);

    const performDirectDelete = (id: string) => {
        triggerHaptic('warning');
        Alert.alert("Delete Item", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    const { error } = await supabase.from("inventory_items").delete().eq("id", id);
                    if (!error) setAllItems(prev => prev.filter(i => i.id !== id));
                }
            }
        ]);
    };

    const handleSecureDelete = async (pin: string) => {
        if (!pendingDeleteId) return;
        setApproving(true);
        const { data, error } = await supabase.rpc('secure_inventory_delete', {
            p_item_id: pendingDeleteId,
            p_pin: pin
        });
        setApproving(false);

        if (error || !data?.success) {
            showToast("Invalid PIN", 'error');
        } else {
            setAllItems(prev => prev.filter(i => i.id !== pendingDeleteId));
            setPinModalVisible(false);
            setPendingDeleteId(null);
            showToast("Item deleted securely", 'success');
        }
    };

    const handleEdit = useCallback((item: InventoryItem) => {
        setEditingItem(item);
        setModalVisible(true);
    }, []);

    const handleAdd = useCallback(() => {
        setEditingItem(null);
        setModalVisible(true);
    }, []);

    // --- REPORTING ---
    const generateReport = async (type: 'csv' | 'pdf') => {
        await generateInventoryReport(filteredItems, type, business?.name || 'My Business');
    };

    // --- STOCK TAKE ---
    const toggleStockTakeMode = useCallback(() => {
        setIsStockTakeMode(prev => {
            if (!prev) setStockTakeCounts({}); // Reset on enter
            return !prev;
        });
    }, []);

    const updateStockCount = useCallback((id: string, count: number) => {
        setStockTakeCounts(prev => ({ ...prev, [id]: count }));
    }, []);

    const commitStockTake = async () => {
        Alert.alert("Confirm Stock Take", "This will update quantity for all counted items.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Submit",
                onPress: async () => {
                    setLoading(true); // Show loader during commit

                    // Use Promise.all for parallel updates instead of sequential loop
                    const updates = Object.entries(stockTakeCounts).map(([id, quantity]) =>
                        supabase.from('inventory_items').update({ quantity }).eq('id', id)
                    );

                    await Promise.all(updates);

                    triggerHaptic('success');
                    showToast("Stock take submitted", 'success');
                    setIsStockTakeMode(false);
                    setStockTakeCounts({});
                    fetchInventory(true); // Reload fresh data
                }
            }
        ]);
    };

    return {
        // Data
        items: filteredItems, // For the List
        loading,
        refreshing,

        // Search
        searchQuery,
        setSearchQuery,

        // Calculated Stats
        totalValue: stats.totalValue,
        criticalCount: stats.criticalCount,
        totalItems: stats.count,

        // Actions
        fetchInventory,
        onRefresh,
        handleEdit,
        handleAdd,
        handleDelete,

        // Modal & Security Props
        modalVisible,
        setModalVisible,
        editingItem,
        pinModalVisible,
        setPinModalVisible,
        handleSecureDelete,
        approving,
        // Reporting
        generateReport,
        // Stock Take
        isStockTakeMode,
        toggleStockTakeMode,
        stockTakeCounts,
        updateStockCount,
        commitStockTake
    };
};
