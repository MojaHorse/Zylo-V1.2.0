import React, { useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import tw from 'twrnc';
import {
    CreditCard, Banknote, ChevronRight, Receipt,
    X, Search, ArrowUpDown, TrendingUp, Wallet
} from 'lucide-react-native';
import { useSalesHistoryLogic } from '../../hooks/useSalesHistoryLogic';
import ReceiptModal from '../../../components/Modals/ReceiptModal';
import TransactionDetailModal from '../../../components/Modals/TransactionDetailModal';
import * as Haptics from 'expo-haptics';
import { formatBusinessDayOrderNumber } from '../../utils/formatters';

export default function SalesHistoryMobile() {
    const {
        orders, selectedOrder, setSelectedOrder, orderItems, loading, loadingDetails,
        showReceipt, handleRefund, setShowReceipt, handleSelectOrder, formatTime, formatDate, fetchOrders,
        searchQuery, setSearchQuery,
        statusFilter, setStatusFilter,
        methodFilter, setMethodFilter,
        sortBy, setSortBy,
        dateFilter, setDateFilter
    } = useSalesHistoryLogic(true);

    // --- Computed Stats ---
    const stats = useMemo(() => {
        const totalRevenue = orders
            .filter(o => o.payment_status === 'paid')
            .reduce((sum, o) => sum + Number(o.grand_total), 0);
        const voidedCount = orders.filter(o => o.payment_status === 'refunded' || o.payment_status === 'void').length;
        return { totalRevenue, totalCount: orders.length, voidedCount };
    }, [orders]);

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case 'Cash': return <Banknote size={18} color="#10b981" />;
            case 'Card': return <CreditCard size={18} color="#3b82f6" />;
            case 'Wallet': return <Wallet size={18} color="#8b5cf6" />;
            default: return <CreditCard size={18} color="#64748b" />;
        }
    };

    const getPaymentIconBg = (method: string) => {
        switch (method) {
            case 'Cash': return tw`bg-emerald-50 border-emerald-100`;
            case 'Card': return tw`bg-blue-50 border-blue-100`;
            case 'Wallet': return tw`bg-violet-50 border-violet-100`;
            default: return tw`bg-slate-50 border-slate-100`;
        }
    };

    return (
        <View style={tw`flex-1 bg-slate-50`}>
            {/* ═══════════ HEADER ═══════════ */}
            <View style={tw`px-5 pt-4 pb-3 bg-white border-b border-slate-100`}>
                <Text style={tw`text-2xl font-black text-slate-900 tracking-tight`}>Sales History</Text>
                <Text style={tw`text-xs font-medium text-slate-400 mt-0.5`}>Track & manage transactions</Text>
            </View>

            {/* ═══════════ ANALYTICS BUTTON ═══════════ */}
            <View style={tw`px-4 pt-4 pb-1 bg-white`}>
                <Pressable 
                    onPress={() => {
                        Haptics.impactAsync();
                        Alert.alert('Coming Soon', 'Analytics dashboard is under development.');
                    }}
                    style={({ pressed }) => [
                        tw`flex-row items-center justify-center gap-2 bg-indigo-50 py-3 rounded-xl border border-indigo-100`,
                        pressed && tw`bg-indigo-100 scale-[0.98]`
                    ]}
                >
                    <TrendingUp size={16} color="#4f46e5" />
                    <Text style={tw`text-xs font-black uppercase tracking-wider text-indigo-700`}>Analytics (Coming Soon)</Text>
                </Pressable>
            </View>

            {/* ═══════════ SEARCH & FILTERS ═══════════ */}
            <View style={tw`bg-white border-b border-slate-100 px-4 pt-3 pb-3.5`}>
                {/* Search Bar */}
                <View style={tw`flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-3`}>
                    <Search size={18} color="#94a3b8" />
                    <TextInput
                        style={tw`flex-1 ml-2.5 font-bold text-slate-900 text-sm`}
                        placeholder="Search receipt or order ID..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery('')} style={tw`p-0.5`}>
                            <X size={16} color="#94a3b8" />
                        </Pressable>
                    )}
                </View>

                {/* Filter Chips Scroll */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-2`}>
                    {/* Date Filters */}
                    {[
                        { id: 'all', label: 'All Time' },
                        { id: 'today', label: 'Today' },
                        { id: 'yesterday', label: 'Yesterday' },
                        { id: 'week', label: '7 Days' }
                    ].map((f) => (
                        <Pressable
                            key={`date-${f.id}`}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setDateFilter(f.id as any);
                            }}
                            style={[
                                tw`px-3.5 py-2 rounded-full border`,
                                dateFilter === f.id ? tw`bg-indigo-600 border-indigo-600` : tw`bg-white border-slate-200`
                            ]}
                        >
                            <Text style={[tw`text-[11px] font-black uppercase tracking-wider`, dateFilter === f.id ? tw`text-white` : tw`text-slate-500`]}>
                                {f.label}
                            </Text>
                        </Pressable>
                    ))}

                    <View style={tw`w-[1px] h-4 bg-slate-200 self-center mx-0.5`} />

                    {/* Status Filters */}
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'paid', label: 'Paid' },
                        { id: 'refunded', label: 'Voided' }
                    ].map((f) => (
                        <Pressable
                            key={`status-${f.id}`}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setStatusFilter(f.id as any);
                            }}
                            style={[
                                tw`px-3.5 py-2 rounded-full border`,
                                statusFilter === f.id ? tw`bg-indigo-600 border-indigo-600` : tw`bg-white border-slate-200`
                            ]}
                        >
                            <Text style={[tw`text-[11px] font-black uppercase tracking-wider`, statusFilter === f.id ? tw`text-white` : tw`text-slate-500`]}>
                                {f.label}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* ═══════════ TRANSACTION LIST ═══════════ */}
            {loading ? (
                <View style={tw`flex-1 justify-center items-center`}>
                    <ActivityIndicator color="#4f46e5" size="large" />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={item => item.order_uuid}
                    contentContainerStyle={tw`p-4 pb-28`}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading}
                    onRefresh={fetchOrders}
                    ListHeaderComponent={() => (
                        <View style={tw`flex-row justify-between items-center mb-3`}>
                            <Text style={tw`text-xs font-black text-slate-400 uppercase tracking-widest`}>
                                {orders.length} {orders.length === 1 ? 'Transaction' : 'Transactions'}
                            </Text>
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    const sorts: any[] = ['newest', 'oldest', 'amount_high', 'amount_low'];
                                    const nextIdx = (sorts.indexOf(sortBy) + 1) % sorts.length;
                                    setSortBy(sorts[nextIdx]);
                                }}
                                style={({ pressed }) => [
                                    tw`flex-row items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm`,
                                    pressed && tw`scale-95 bg-slate-50`
                                ]}
                            >
                                <ArrowUpDown size={12} color="#6366f1" />
                                <Text style={tw`text-[10px] font-black uppercase text-indigo-600 tracking-wider`}>
                                    {sortBy.replace('_', ' ')}
                                </Text>
                            </Pressable>
                        </View>
                    )}
                    ListEmptyComponent={() => (
                        <View style={tw`flex-1 items-center justify-center mt-20 opacity-40`}>
                            <Receipt size={48} color="#94a3b8" />
                            <Text style={tw`text-lg font-bold mt-4 text-slate-600`}>No transactions found</Text>
                            <Text style={tw`text-sm text-slate-400 font-medium mt-1`}>Try adjusting your filters</Text>
                        </View>
                    )}
                    renderItem={({ item }) => {
                        const isVoided = item.payment_status === 'refunded' || item.payment_status === 'void';
                        return (
                            <Pressable
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    handleSelectOrder(item);
                                }}
                                style={({ pressed }) => [
                                    tw`p-4 rounded-2xl mb-2.5 border bg-white border-slate-100 shadow-sm`,
                                    pressed && tw`scale-[0.98] bg-slate-50 shadow-none`,
                                    isVoided && tw`border-red-100`
                                ]}
                            >
                                <View style={tw`flex-row items-center`}>
                                    {/* Icon */}
                                    <View style={[tw`w-11 h-11 rounded-xl items-center justify-center border mr-3.5`, getPaymentIconBg(item.payment_method)]}>
                                        {getPaymentIcon(item.payment_method)}
                                    </View>

                                    {/* Info */}
                                    <View style={tw`flex-1`}>
                                        <View style={tw`flex-row items-center gap-2 mb-1`}>
                                            <Text style={tw`font-black text-base text-slate-900 tracking-tight`}>
                                                {item.receipt_number || `Order #${item.id.slice(0, 4)}`}
                                            </Text>
                                            {isVoided && (
                                                <View style={tw`bg-red-50 border border-red-100 px-2 py-0.5 rounded-md`}>
                                                    <Text style={tw`text-[9px] font-black text-red-600 uppercase`}>Void</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={tw`flex-row items-center`}>
                                            <Text style={tw`text-xs font-bold text-slate-400`}>
                                                {item.daily_order_number ? `${formatBusinessDayOrderNumber(item.daily_order_number)} • ` : ''}{formatTime(item.created_at)}
                                            </Text>
                                            <Text style={tw`text-xs font-bold text-slate-300 mx-1.5`}>•</Text>
                                            <View style={[tw`px-2 py-0.5 rounded-md border`, getPaymentIconBg(item.payment_method)]}>
                                                <Text style={tw`text-[9px] font-black text-slate-500 uppercase tracking-wider`}>
                                                    {item.payment_method}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Amount + Chevron */}
                                    <View style={tw`items-end ml-2`}>
                                        <Text style={tw`font-black text-base text-slate-900 tracking-tight`}>R {Number(item.grand_total).toFixed(2)}</Text>
                                        <ChevronRight size={14} color="#cbd5e1" style={tw`mt-1`} />
                                    </View>
                                </View>
                            </Pressable>
                        );
                    }}
                />
            )}

            {/* ═══════════ DETACHED MODALS ═══════════ */}
            <TransactionDetailModal
                visible={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                order={selectedOrder}
                items={orderItems}
                loadingDetails={loadingDetails}
                onRefund={handleRefund}
                onViewReceipt={() => setShowReceipt(true)}
                formatDate={formatDate}
                formatTime={formatTime}
                getPaymentIcon={getPaymentIcon}
                getPaymentIconBg={getPaymentIconBg}
            />

            <ReceiptModal 
                visible={showReceipt} 
                order={selectedOrder} 
                items={orderItems} 
                onClose={() => setShowReceipt(false)} 
            />
        </View>
    );
}
