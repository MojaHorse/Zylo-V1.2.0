import { useState, useEffect, useCallback } from 'react';
import { Alert, BackHandler } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../components/Context/BusinessContext';
import { useAuth } from '../../components/Context/AuthContext'; 

export type Order = {
    id: string;
    order_uuid: string;
    created_at: string;
    grand_total: number;
    payment_method: 'Cash' | 'Card' | 'Split' | 'Wallet';
    payment_status: 'paid' | 'unpaid' | 'refunded' | 'void'; 
    voided_at?: string | null;
    business_day?: string | null;
    daily_order_number?: number | null;
    receipt_number?: string | null;
};

export type OrderItem = {
    id: string;
    product_name_snapshot: string;
    quantity: number;
    price_at_sale: number;
    modifiers: any[];
};

export type SortOption = 'newest' | 'oldest' | 'amount_high' | 'amount_low';
export type DateFilter = 'all' | 'today' | 'yesterday' | 'week';

export const useSalesHistoryLogic = (isMobile: boolean) => {
    const { selectedBusiness: business } = useBusiness();
    const { user } = useAuth();
    
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);

    // Filter & Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'refunded'>('all');
    const [methodFilter, setMethodFilter] = useState<'all' | 'Cash' | 'Card'>('all');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');

    useEffect(() => {
        if (business) {
            fetchOrders();
        }
    }, [business, statusFilter, methodFilter, sortBy, dateFilter]);

    // Handle Search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (business) fetchOrders();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle Hardware Back Button
    useEffect(() => {
        const backAction = () => {
            if (isMobile && selectedOrder) {
                setSelectedOrder(null);
                return true; 
            }
            return false;
        };
        const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
        return () => backHandler.remove();
    }, [isMobile, selectedOrder]);

    const fetchOrders = async () => {
        setLoading(true);
        if (!business) return;

        let query = supabase
            .from('orders')
            .select('*')
            .eq('business_id', business.id);

        // --- APPLY FILTERS ---
        if (statusFilter === 'paid') {
            query = query.eq('payment_status', 'paid');
        } else if (statusFilter === 'refunded') {
            query = query.in('payment_status', ['refunded', 'void']);
        }

        if (methodFilter !== 'all') {
            query = query.eq('payment_method', methodFilter);
        }

        if (searchQuery.trim()) {
            // Search by receipt number OR UUID fragment
            query = query.or(`receipt_number.ilike.%${searchQuery}%,order_uuid.ilike.%${searchQuery}%`);
        }

        // --- DATE FILTER ---
        if (dateFilter !== 'all') {
            const now = new Date();
            let startDate = new Date();
            let endDate = new Date();

            if (dateFilter === 'today') {
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
            } else if (dateFilter === 'yesterday') {
                startDate.setDate(now.getDate() - 1);
                startDate.setHours(0, 0, 0, 0);
                endDate.setDate(now.getDate() - 1);
                endDate.setHours(23, 59, 59, 999);
            } else if (dateFilter === 'week') {
                startDate.setDate(now.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
            }
            query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
        }

        // --- APPLY SORTING ---
        if (sortBy === 'newest') {
            query = query.order('created_at', { ascending: false });
        } else if (sortBy === 'oldest') {
            query = query.order('created_at', { ascending: true });
        } else if (sortBy === 'amount_high') {
            query = query.order('grand_total', { ascending: false });
        } else if (sortBy === 'amount_low') {
            query = query.order('grand_total', { ascending: true });
        }

        const { data, error } = await query.limit(100);

        if (!error && data) {
            setOrders(data);
        }
        setLoading(false);
    };

    const handleSelectOrder = async (order: Order) => {
        setSelectedOrder(order);
        setLoadingDetails(true);

        const { data, error } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_uuid', order.order_uuid);

        if (!error && data) {
            setOrderItems(data);
        }
        setLoadingDetails(false);
    };

    const handleRefund = () => {
        if (!selectedOrder) return;
        
        if (selectedOrder.voided_at || selectedOrder.payment_status === 'void' || selectedOrder.payment_status === 'refunded') {
            Alert.alert("Action Blocked", "This order has already been processed.");
            return;
        }

        Alert.alert(
            "Process Refund",
            "Is this a mistake (restock items) or a return of damaged/eaten goods (waste)?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Waste (No Restock)", 
                    style: 'destructive',
                    onPress: () => executeRefund(false)
                },
                { 
                    text: "Restock Items", 
                    onPress: () => executeRefund(true)
                }
            ]
        );
    };

    const executeRefund = async (shouldRestock: boolean) => {
        if (!user || !business || !selectedOrder) return;
        
        const { data: memberData, error: memberError } = await supabase
            .from('business_members')
            .select('id')
            .eq('user_id', user.id)
            .eq('business_id', business.id)
            .single();

        if (memberError || !memberData) {
            Alert.alert("Error", "Could not verify staff credentials.");
            return;
        }

        const staffId = memberData.id;
        const reason = shouldRestock ? 'Void/Restock' : 'Refund/Waste';

        const { data, error } = await supabase.rpc('void_order', {
            p_order_uuid: selectedOrder.order_uuid,
            p_void_reason: reason,
            p_performed_by_id: staffId,
            p_restock: shouldRestock
        });

        if (error) {
            Alert.alert("Error", error.message);
        } else if (data && data.success) {
            const successMsg = shouldRestock 
                ? "Order voided and items restocked." 
                : "Refund processed (items logged as waste).";
                
            Alert.alert("Success", successMsg);
            
            const updatedOrder = { 
                ...selectedOrder, 
                payment_status: 'refunded' as const, 
                voided_at: new Date().toISOString() 
            };

            setOrders(prev => prev.map(o => 
                o.order_uuid === selectedOrder.order_uuid ? updatedOrder : o
            ));
            setSelectedOrder(updatedOrder);
        } else {
            Alert.alert("Failed", data?.error || "Unknown error");
        }
    };

    const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    return {
        orders,
        selectedOrder,
        setSelectedOrder, 
        orderItems,
        loading,
        loadingDetails,
        showReceipt,
        setShowReceipt,
        handleSelectOrder,
        fetchOrders,
        handleRefund,
        formatTime,
        formatDate,
        // New Filter State & Handlers
        searchQuery, setSearchQuery,
        statusFilter, setStatusFilter,
        methodFilter, setMethodFilter,
        sortBy, setSortBy,
        dateFilter, setDateFilter
    };
};
