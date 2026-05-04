import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import tw from 'twrnc';
import {
  CreditCard,
  Banknote,
  ChevronRight,
  Receipt,
  RotateCcw,
  Search,
  ArrowUpDown,
  X,
  TrendingUp,
  AlertTriangle,
  Clock,
  Wallet,
  ShoppingBag,
  Hash,
  Calendar,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useSalesHistoryLogic } from '../../hooks/useSalesHistoryLogic';
import ReceiptModal from '../../../components/Modals/ReceiptModal';
import Header from '../../../components/Header';
import { formatBusinessDayOrderNumber } from '../../utils/formatters';

const PAYMENT_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  Cash: { icon: Banknote, color: '#059669', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Card: { icon: CreditCard, color: '#3b82f6', bg: 'bg-blue-50', border: 'border-blue-200' },
  Wallet: { icon: Wallet, color: '#8b5cf6', bg: 'bg-violet-50', border: 'border-violet-200' },
};

type ChipProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: React.ComponentType<any>;
  tone?: 'indigo' | 'emerald' | 'red' | 'slate';
  style?: any;
};

function FilterChip({
  label,
  active = false,
  onPress,
  icon: Icon,
  tone = 'indigo',
  style,
}: ChipProps) {
  const activeStyles = {
    indigo: {
      wrap: tw`bg-indigo-50 border-indigo-200`,
      text: tw`text-indigo-700`,
      icon: '#4f46e5',
    },
    emerald: {
      wrap: tw`bg-emerald-50 border-emerald-200`,
      text: tw`text-emerald-700`,
      icon: '#059669',
    },
    red: {
      wrap: tw`bg-red-50 border-red-200`,
      text: tw`text-red-700`,
      icon: '#dc2626',
    },
    slate: {
      wrap: tw`bg-slate-100 border-slate-200`,
      text: tw`text-slate-700`,
      icon: '#475569',
    },
  }[tone];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tw`flex-row items-center rounded-xl border px-3.5 py-2`,
        active ? activeStyles.wrap : tw`bg-white border-slate-200`,
        style,
        pressed && tw`scale-95`,
      ]}
    >
      {Icon ? (
        <Icon size={13} color={active ? activeStyles.icon : '#94a3b8'} />
      ) : null}
      <Text
        style={[
          tw`${Icon ? 'ml-2' : ''} text-[11px] font-black uppercase tracking-wider`,
          active ? activeStyles.text : tw`text-slate-500`,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type StatCardProps = {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  iconWrap: any;
  isLast?: boolean;
};

function StatCard({ title, value, icon, iconWrap, isLast }: StatCardProps) {
  return (
    <View
      style={[
        tw`flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-4`,
        !isLast && tw`mr-3`,
      ]}
    >
      <View style={tw`mb-2 flex-row items-center`}>
        <View style={[iconWrap, tw`mr-2.5`]}>{icon}</View>
        <Text style={tw`text-[11px] font-black uppercase tracking-[2px] text-slate-400`}>
          {title}
        </Text>
      </View>
      {value}
    </View>
  );
}

export default function SalesHistoryTablet() {
  const {
    orders,
    selectedOrder,
    setSelectedOrder,
    orderItems,
    loading,
    loadingDetails,
    showReceipt,
    handleRefund,
    setShowReceipt,
    handleSelectOrder,
    formatTime,
    formatDate,
    fetchOrders,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    sortBy,
    setSortBy,
    dateFilter,
    setDateFilter,
  } = useSalesHistoryLogic(false);

  const stats = useMemo(() => {
    const paid = orders.filter(o => o.payment_status === 'paid');
    const totalRevenue = paid.reduce((sum, o) => sum + Number(o.grand_total), 0);
    const voidedCount = orders.filter(
      o => o.payment_status === 'refunded' || o.payment_status === 'void'
    ).length;
    const avgOrder = paid.length > 0 ? totalRevenue / paid.length : 0;

    return {
      totalRevenue,
      totalCount: orders.length,
      voidedCount,
      avgOrder,
    };
  }, [orders]);

  const getPayment = (method: string) =>
    PAYMENT_CONFIG[method] || {
      icon: CreditCard,
      color: '#64748b',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
    };

  const sortLabel =
    sortBy === 'newest'
      ? 'Newest'
      : sortBy === 'oldest'
        ? 'Oldest'
        : sortBy === 'amount_high'
          ? 'High $'
          : 'Low $';

  return (
    <View style={tw`flex-1 bg-slate-50`}>
      <View style={tw`flex-1 px-8 pt-5 pb-3`}>
        <Header title="Transactions" subtitle="Full audit trail & order management" />

        {/* KPI ROW */}
        <View style={tw`mt-4 mb-6 flex-row`}>
          <StatCard
            title="Revenue"
            icon={<TrendingUp size={16} color="#059669" />}
            iconWrap={tw`rounded-xl border border-emerald-100 bg-emerald-50 p-2`}
            value={
              <Text style={tw`text-[30px] font-black tracking-tight text-slate-900`}>
                R {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Text>
            }
          />

          <StatCard
            title="Orders"
            icon={<ShoppingBag size={16} color="#4f46e5" />}
            iconWrap={tw`rounded-xl border border-indigo-100 bg-indigo-50 p-2`}
            value={
              <View style={tw`flex-row items-baseline`}>
                <Text style={tw`mr-1 text-[30px] font-black tracking-tight text-slate-900`}>
                  {stats.totalCount}
                </Text>
                <Text style={tw`text-sm font-bold text-slate-400`}>total</Text>
              </View>
            }
          />

          <StatCard
            title="Avg Order"
            icon={<Hash size={16} color="#d97706" />}
            iconWrap={tw`rounded-xl border border-amber-100 bg-amber-50 p-2`}
            value={
              <Text style={tw`text-[30px] font-black tracking-tight text-slate-900`}>
                R {stats.avgOrder.toFixed(0)}
              </Text>
            }
          />

          <StatCard
            title="Voided"
            isLast
            icon={
              <AlertTriangle
                size={16}
                color={stats.voidedCount > 0 ? '#ef4444' : '#10b981'}
              />
            }
            iconWrap={[
              tw`rounded-xl border p-2`,
              stats.voidedCount > 0
                ? tw`border-red-100 bg-red-50`
                : tw`border-emerald-100 bg-emerald-50`,
            ]}
            value={
              <View style={tw`flex-row items-baseline`}>
                <Text
                  style={tw`mr-1 text-[30px] font-black tracking-tight ${
                    stats.voidedCount > 0 ? 'text-red-500' : 'text-emerald-600'
                  }`}
                >
                  {stats.voidedCount}
                </Text>
                <Text style={tw`text-sm font-bold text-slate-400`}>
                  {stats.voidedCount === 0 ? 'clean' : 'orders'}
                </Text>
              </View>
            }
          />
        </View>

        {/* TOOLBAR BLOCK */}
        <View style={tw`mb-3 rounded-2xl border border-slate-200 bg-white px-4 py-4`}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`items-center pr-2`}
          >
            <FilterChip
              label="All Time"
              icon={Calendar}
              active={dateFilter === 'all'}
              onPress={() => {
                Haptics.selectionAsync();
                setDateFilter('all' as any);
              }}
              style={tw`mr-2`}
            />

            <FilterChip
              label="Today"
              icon={Clock}
              active={dateFilter === 'today'}
              onPress={() => {
                Haptics.selectionAsync();
                setDateFilter('today' as any);
              }}
              style={tw`mr-2`}
            />

            <FilterChip
              label="7 Days"
              icon={Calendar}
              active={dateFilter === 'week'}
              onPress={() => {
                Haptics.selectionAsync();
                setDateFilter('week' as any);
              }}
            />

            <View style={tw`mx-3 h-5 w-px bg-slate-200`} />

            <FilterChip
              label="All"
              active={statusFilter === 'all'}
              tone="indigo"
              onPress={() => {
                Haptics.selectionAsync();
                setStatusFilter('all' as any);
              }}
              style={tw`mr-2`}
            />

            <FilterChip
              label="Paid"
              active={statusFilter === 'paid'}
              tone="emerald"
              onPress={() => {
                Haptics.selectionAsync();
                setStatusFilter('paid' as any);
              }}
              style={tw`mr-2`}
            />

            <FilterChip
              label="Voided"
              active={statusFilter === 'refunded'}
              tone="red"
              onPress={() => {
                Haptics.selectionAsync();
                setStatusFilter('refunded' as any);
              }}
            />

            <View style={tw`mx-3 h-5 w-px bg-slate-200`} />

            {['Cash', 'Card'].map((method, index) => {
              const cfg = getPayment(method);
              const active = methodFilter === method;
              const Icon = cfg.icon;

              return (
                <Pressable
                  key={method}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setMethodFilter(active ? ('all' as any) : (method as any));
                  }}
                  style={({ pressed }) => [
                    tw`flex-row items-center rounded-xl border px-3.5 py-2`,
                    active ? tw`${cfg.bg} ${cfg.border}` : tw`bg-white border-slate-200`,
                    index === 0 && tw`mr-2`,
                    pressed && tw`scale-95`,
                  ]}
                >
                  <Icon size={13} color={active ? cfg.color : '#94a3b8'} />
                  <Text
                    style={[
                      tw`ml-2 text-[11px] font-black uppercase tracking-wider`,
                      { color: active ? cfg.color : '#64748b' },
                    ]}
                  >
                    {method}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={tw`mt-3 flex-row items-center`}>
            <View
              style={tw`mr-3 flex-1 flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5`}
            >
              <Search size={17} color="#94a3b8" />
              <TextInput
                style={tw`ml-3 flex-1 text-sm font-bold text-slate-900`}
                placeholder="Search receipt number..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <X size={15} color="#94a3b8" />
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                const sorts: any[] = ['newest', 'oldest', 'amount_high', 'amount_low'];
                setSortBy(sorts[(sorts.indexOf(sortBy) + 1) % sorts.length]);
              }}
              style={({ pressed }) => [
                tw`flex-row items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5`,
                pressed && tw`scale-95 bg-slate-50`,
              ]}
            >
              <ArrowUpDown size={15} color="#4f46e5" />
              <Text style={tw`ml-2 text-[11px] font-black uppercase tracking-wider text-indigo-600`}>
                {sortLabel}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* LIST HEADER */}
        <View style={tw`mb-2 flex-row items-center justify-between px-1`}>
          <Text style={tw`text-xs font-bold text-slate-400`}>
            {orders.length} {orders.length === 1 ? 'transaction' : 'transactions'}
            {searchQuery ? ` matching "${searchQuery}"` : ''}
          </Text>
        </View>

        {/* TABLE */}
        {loading ? (
          <View style={tw`flex-1 items-center justify-center`}>
            <ActivityIndicator color="#4f46e5" size="large" />
            <Text style={tw`mt-4 text-sm font-bold text-slate-400`}>
              Loading transactions...
            </Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={item => item.order_uuid}
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={fetchOrders}
            contentContainerStyle={tw`pb-6`}
            ListEmptyComponent={() => (
              <View style={tw`my-20 items-center justify-center`}>
                <View style={tw`mb-5 h-18 w-18 items-center justify-center rounded-full bg-slate-100`}>
                  <Receipt size={32} color="#cbd5e1" />
                </View>
                <Text style={tw`text-lg font-black text-slate-300`}>
                  No transactions found
                </Text>
                <Text style={tw`mt-2 text-sm font-medium text-slate-400`}>
                  Try adjusting your filters
                </Text>
              </View>
            )}
            renderItem={({ item }) => {
              const isVoided = item.payment_status === 'refunded' || item.payment_status === 'void';
              const pay = getPayment(item.payment_method);
              const PayIcon = pay.icon;

              return (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    handleSelectOrder(item);
                  }}
                  style={({ pressed }) => [
                    tw`mb-2 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3`,
                    pressed && tw`bg-slate-50`,
                    isVoided && tw`border-red-200 bg-red-50/30`,
                  ]}
                >
                  <View
                    style={tw`mr-3 h-10 w-10 items-center justify-center rounded-xl border ${pay.bg} ${pay.border}`}
                  >
                    <PayIcon size={17} color={pay.color} />
                  </View>

                  <View style={tw`flex-1`}>
                    <Text style={tw`text-base font-black tracking-tight text-slate-900`}>
                      {item.receipt_number || `#${(item.order_uuid || item.id || '').slice(0, 8).toUpperCase()}`}
                    </Text>

                    {item.daily_order_number && (
                      <Text style={tw`mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400`}>
                        Order {formatBusinessDayOrderNumber(item.daily_order_number)}
                      </Text>
                    )}
                  </View>

                  <View style={tw`mr-4 items-end`}>
                    <Text style={tw`text-sm font-bold text-slate-700`}>
                      {formatDate(item.created_at)}
                    </Text>
                    <Text style={tw`mt-0.5 text-[10px] font-medium text-slate-400`}>
                      {formatTime(item.created_at)}
                    </Text>
                  </View>

                  <View style={tw`mr-2.5`}>
                    <View style={tw`rounded-lg border px-3 py-1 ${pay.bg} ${pay.border}`}>
                      <Text
                        style={[tw`text-[10px] font-black uppercase tracking-wider`, { color: pay.color }]}
                      >
                        {item.payment_method}
                      </Text>
                    </View>
                  </View>

                  <View style={tw`mr-3`}>
                    <View
                      style={tw`rounded-lg border px-3 py-1 ${
                        isVoided ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      <Text
                        style={tw`text-[10px] font-black uppercase tracking-wider ${
                          isVoided ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {isVoided ? 'Void' : 'Paid'}
                      </Text>
                    </View>
                  </View>

                  <Text style={tw`min-w-18 mr-1 text-right text-lg font-black tracking-tight text-slate-900`}>
                    R {Number(item.grand_total).toFixed(2)}
                  </Text>

                  <ChevronRight size={15} color="#cbd5e1" />
                </Pressable>
              );
            }}
          />
        )}
      </View>

      {/* DETAIL MODAL */}
      <Modal
        visible={!!selectedOrder}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedOrder(null)}
      >
        <Pressable
          style={tw`flex-1 items-center justify-center bg-black/50 p-10`}
          onPress={() => setSelectedOrder(null)}
        >
          <Pressable
            style={tw`w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl`}
            onPress={() => {}}
          >
            <View style={tw`flex-row items-center justify-between border-b border-slate-100 px-7 py-4`}>
              <View style={tw`flex-row items-center`}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedOrder(null);
                  }}
                  style={({ pressed }) => [
                    tw`mr-3 h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100`,
                    pressed && tw`bg-slate-200`,
                  ]}
                >
                  <X size={18} color="#0f172a" />
                </Pressable>

                <View>
                  <Text style={tw`text-lg font-black tracking-tight text-slate-900`}>
                    Order Details
                  </Text>
                  <Text style={tw`mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400`}>
                    {selectedOrder?.receipt_number || `ID: ${selectedOrder?.order_uuid?.slice(0, 8)}`}
                  </Text>
                </View>
              </View>

              <View style={tw`flex-row items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5`}>
                <Clock size={12} color="#64748b" />
                <Text style={tw`ml-2 text-xs font-bold text-slate-500`}>
                  {selectedOrder ? `${formatDate(selectedOrder.created_at)} • ${formatTime(selectedOrder.created_at)}` : ''}
                </Text>
              </View>
            </View>

            <View style={tw`flex-row`}>
              <View style={tw`flex-1 border-r border-slate-100 bg-white p-7`}>
                {(selectedOrder?.payment_status === 'refunded' ||
                  selectedOrder?.payment_status === 'void') && (
                  <View style={tw`mb-5 flex-row items-center rounded-2xl border border-red-100 bg-red-50 px-4 py-3`}>
                    <AlertTriangle size={17} color="#ef4444" />
                    <Text style={tw`ml-3 text-sm font-black uppercase tracking-wider text-red-600`}>
                      Voided
                    </Text>
                  </View>
                )}

                <View style={tw`items-center py-5`}>
                  <Text style={tw`mb-3 text-xs font-bold uppercase tracking-widest text-slate-400`}>
                    Total Amount
                  </Text>
                  <Text style={tw`text-5xl font-black tracking-tighter text-slate-900`}>
                    R {Number(selectedOrder?.grand_total).toFixed(2)}
                  </Text>

                  <View style={tw`mt-4 flex-row items-center`}>
                    {(() => {
                      const pay = getPayment(selectedOrder?.payment_method || 'Card');
                      const PayIcon = pay.icon;

                      return (
                        <View style={tw`flex-row items-center rounded-xl border px-4 py-2 ${pay.bg} ${pay.border}`}>
                          <PayIcon size={15} color={pay.color} />
                          <Text
                            style={[tw`ml-2 text-xs font-black uppercase tracking-wider`, { color: pay.color }]}
                          >
                            {selectedOrder?.payment_method}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>

                  {selectedOrder?.daily_order_number && (
                    <Text style={tw`mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400`}>
                      Order {formatBusinessDayOrderNumber(selectedOrder.daily_order_number)}
                    </Text>
                  )}
                </View>

                <View style={tw`mt-5`}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowReceipt(true);
                    }}
                    style={({ pressed }) => [
                      tw`mb-3 flex-row items-center justify-center rounded-xl bg-indigo-600 p-3.5`,
                      pressed && tw`bg-indigo-700`,
                    ]}
                  >
                    <Receipt size={17} color="white" />
                    <Text style={tw`ml-2 text-sm font-black uppercase tracking-wider text-white`}>
                      View Receipt
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      handleRefund();
                    }}
                    style={({ pressed }) => [
                      tw`flex-row items-center justify-center rounded-xl border border-red-100 bg-red-50 p-3.5`,
                      pressed && tw`bg-red-100`,
                    ]}
                  >
                    <RotateCcw size={16} color="#ef4444" />
                    <Text style={tw`ml-2 text-sm font-black uppercase tracking-wider text-red-500`}>
                      Refund / Void
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={tw`flex-1 bg-slate-50 p-7`}>
                <View style={tw`mb-4 flex-row items-center justify-between`}>
                  <Text style={tw`text-xs font-black uppercase tracking-widest text-slate-400`}>
                    Ordered Items
                  </Text>
                  <View style={tw`rounded-lg bg-slate-200 px-3 py-1`}>
                    <Text style={tw`text-[10px] font-black text-slate-500`}>
                      {orderItems.length} items
                    </Text>
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={tw`max-h-[460px]`}>
                  {loadingDetails ? (
                    <ActivityIndicator color="#4f46e5" style={tw`mt-16`} />
                  ) : (
                    orderItems.map((item, i) => (
                      <View
                        key={i}
                        style={tw`mb-3 rounded-2xl border border-slate-100 bg-white p-4`}
                      >
                        <View style={tw`flex-row items-start justify-between`}>
                          <View style={tw`flex-1 flex-row items-center pr-4`}>
                            <View style={tw`mr-3 h-8 w-8 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50`}>
                              <Text style={tw`text-xs font-black text-indigo-600`}>
                                {item.quantity}x
                              </Text>
                            </View>

                            <View style={tw`flex-1`}>
                              <Text style={tw`text-base font-black text-slate-900`}>
                                {item.product_name_snapshot}
                              </Text>
                              {item.modifiers && item.modifiers.length > 0 && (
                                <Text style={tw`mt-1 text-xs font-bold text-indigo-500`}>
                                  + {item.modifiers.map((m: any) => m.name).join(', ')}
                                </Text>
                              )}
                            </View>
                          </View>

                          <Text style={tw`text-lg font-black text-slate-900`}>
                            R {(item.price_at_sale * item.quantity).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}

                  {!loadingDetails && orderItems.length > 0 && (
                    <View style={tw`mt-1 flex-row items-center justify-between rounded-2xl bg-indigo-600 p-4`}>
                      <Text style={tw`text-sm font-black uppercase tracking-wider text-indigo-200`}>
                        Total
                      </Text>
                      <Text style={tw`text-2xl font-black tracking-tight text-white`}>
                        R {Number(selectedOrder?.grand_total).toFixed(2)}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Pressable>
        </Pressable>

        <ReceiptModal
          visible={showReceipt}
          order={selectedOrder}
          items={orderItems}
          onClose={() => setShowReceipt(false)}
        />
      </Modal>
    </View>
  );
}