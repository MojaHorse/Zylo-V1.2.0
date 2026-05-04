import React from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import tw from 'twrnc';
import { BarChart } from "react-native-gifted-charts";
import {
    TrendingUp, TrendingDown, ShoppingBag,
    AlertTriangle, BarChart2, Award, Hash
} from 'lucide-react-native';
import { useDashboardLogic } from '../../hooks/useDashboardLogic';
import ActivityFeedItem from '../../../components/ActivityFeedItem';
import Header from '../../../components/Header';
import * as Haptics from 'expo-haptics';

export default function DashboardScreenTablet() {
    const {
        business, loading, refreshing, onRefresh,
        dailyRevenue, dailyOrders, lowStockCount, avgOrderValue,
        recentOrders, topProducts,
        chartFilter, setChartFilter, chartData,
        revenueTrend
    } = useDashboardLogic();

    if (loading) return (
        <View style={tw`flex-1 justify-center items-center bg-slate-50`}>
            <ActivityIndicator color="#4f46e5" size="large" />
            <Text style={tw`mt-4 text-slate-400 font-bold text-sm`}>Loading dashboard...</Text>
        </View>
    );

    const trendPositive = revenueTrend >= 0;

    return (
        <View style={tw`flex-1 bg-slate-50`}>
            <View style={tw`px-8 pt-8`}>
                <Header title="Dashboard" subtitle={`Overview for ${business?.name}`} />
            </View>

            <ScrollView
                contentContainerStyle={tw`px-8 pb-10`}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
                showsVerticalScrollIndicator={false}
            >
                {/* ═══════════ STATS ROW ═══════════ */}
                <View style={tw`flex-row gap-4 mt-4 mb-6`}>
                    {/* Revenue */}
                    <View style={tw`flex-1 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm`}>
                        <View style={tw`flex-row items-center justify-between mb-3`}>
                            <View style={tw`flex-row items-center gap-3`}>
                                <View style={tw`p-2.5 rounded-xl bg-indigo-50 border border-indigo-100`}>
                                    <TrendingUp size={18} color="#4f46e5" />
                                </View>
                                <Text style={tw`text-xs font-black uppercase tracking-widest text-slate-400`}>Revenue</Text>
                            </View>
                            <View style={tw`flex-row items-center px-2.5 py-1 rounded-lg ${trendPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                {trendPositive
                                    ? <TrendingUp size={12} color="#10b981" />
                                    : <TrendingDown size={12} color="#ef4444" />
                                }
                                <Text style={tw`text-[10px] font-black ml-1 ${trendPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {trendPositive ? '+' : ''}{revenueTrend}%
                                </Text>
                            </View>
                        </View>
                        <Text style={tw`text-3xl font-black text-slate-900 tracking-tight`}>
                            R {dailyRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </Text>
                    </View>

                    {/* Orders */}
                    <View style={tw`flex-1 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm`}>
                        <View style={tw`flex-row items-center gap-3 mb-3`}>
                            <View style={tw`p-2.5 rounded-xl bg-blue-50 border border-blue-100`}>
                                <ShoppingBag size={18} color="#3b82f6" />
                            </View>
                            <Text style={tw`text-xs font-black uppercase tracking-widest text-slate-400`}>Orders</Text>
                        </View>
                        <View style={tw`flex-row items-baseline gap-1.5`}>
                            <Text style={tw`text-3xl font-black text-slate-900 tracking-tight`}>{dailyOrders}</Text>
                            <Text style={tw`text-sm font-bold text-slate-400`}>today</Text>
                        </View>
                    </View>

                    {/* Avg Order */}
                    <View style={tw`flex-1 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm`}>
                        <View style={tw`flex-row items-center gap-3 mb-3`}>
                            <View style={tw`p-2.5 rounded-xl bg-amber-50 border border-amber-100`}>
                                <Hash size={18} color="#d97706" />
                            </View>
                            <Text style={tw`text-xs font-black uppercase tracking-widest text-slate-400`}>Avg Order</Text>
                        </View>
                        <Text style={tw`text-3xl font-black text-slate-900 tracking-tight`}>
                            R {avgOrderValue.toFixed(0)}
                        </Text>
                    </View>

                    {/* Low Stock */}
                    <View style={tw`flex-1 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm`}>
                        <View style={tw`flex-row items-center gap-3 mb-3`}>
                            <View style={[tw`p-2.5 rounded-xl border`, lowStockCount > 0 ? tw`bg-red-50 border-red-100` : tw`bg-emerald-50 border-emerald-100`]}>
                                <AlertTriangle size={18} color={lowStockCount > 0 ? '#ef4444' : '#10b981'} />
                            </View>
                            <Text style={tw`text-xs font-black uppercase tracking-widest text-slate-400`}>Low Stock</Text>
                        </View>
                        <View style={tw`flex-row items-baseline gap-1.5`}>
                            <Text style={tw`text-3xl font-black tracking-tight ${lowStockCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                {lowStockCount}
                            </Text>
                            <Text style={tw`text-sm font-bold text-slate-400`}>{lowStockCount === 0 ? 'healthy' : 'alerts'}</Text>
                        </View>
                    </View>
                </View>

                {/* ═══════════ CHART + TOP PRODUCTS ═══════════ */}
                <View style={tw`flex-row gap-4 mb-6`}>
                    {/* Chart */}
                    <View style={tw`flex-2 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm`}>
                        <View style={tw`mb-6 flex-row justify-between items-center`}>
                            <View>
                                <Text style={tw`text-lg font-black text-slate-900 tracking-tight`}>Sales Overview</Text>
                                <Text style={tw`text-xs text-slate-400 font-medium mt-0.5`}>
                                    {chartFilter === 'Week' ? 'Last 7 days' : 'Last 30 days'}
                                </Text>
                            </View>
                            <View style={tw`flex-row rounded-xl p-1 bg-slate-50 border border-slate-200`}>
                                {(['Week', 'Month'] as const).map((filter) => (
                                    <Pressable
                                        key={filter}
                                        onPress={() => { Haptics.selectionAsync(); setChartFilter(filter); }}
                                        style={[
                                            tw`px-4 py-2 rounded-lg`,
                                            chartFilter === filter && tw`bg-white shadow-sm`
                                        ]}
                                    >
                                        <Text style={tw`text-xs font-black uppercase tracking-wider ${chartFilter === filter ? 'text-slate-900' : 'text-slate-400'}`}>{filter}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {chartData.length > 0 ? (
                            <BarChart
                                data={chartData.map(d => ({ ...d, frontColor: d.value > 0 ? '#4f46e5' : '#e2e8f0' }))}
                                barWidth={chartFilter === 'Week' ? 40 : 16}
                                spacing={chartFilter === 'Week' ? 40 : 12}
                                noOfSections={4}
                                barBorderRadius={6}
                                yAxisThickness={0}
                                xAxisThickness={0}
                                yAxisTextStyle={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}
                                xAxisLabelTextStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: '600' }}
                                hideRules
                                isAnimated
                                height={220}
                            />
                        ) : (
                            <View style={tw`h-56 items-center justify-center`}>
                                <View style={tw`w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4`}>
                                    <BarChart2 size={28} color="#cbd5e1" />
                                </View>
                                <Text style={tw`text-slate-400 font-bold`}>No sales data yet</Text>
                                <Text style={tw`text-xs text-slate-400 font-medium mt-1`}>Complete your first sale to see trends</Text>
                            </View>
                        )}
                    </View>

                    {/* Top Products */}
                    <View style={tw`flex-1 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm`}>
                        <View style={tw`flex-row items-center gap-2 mb-5`}>
                            <View style={tw`p-2 rounded-xl bg-amber-50 border border-amber-100`}>
                                <Award size={16} color="#d97706" />
                            </View>
                            <Text style={tw`text-lg font-black text-slate-900 tracking-tight`}>Top Sellers</Text>
                        </View>
                        {topProducts.length === 0 ? (
                            <View style={tw`flex-1 justify-center items-center py-8`}>
                                <View style={tw`w-14 h-14 rounded-full bg-slate-100 items-center justify-center mb-3`}>
                                    <Award size={24} color="#cbd5e1" />
                                </View>
                                <Text style={tw`text-slate-400 font-bold text-sm`}>No sales yet</Text>
                            </View>
                        ) : (
                            topProducts.map((product, index) => (
                                <View key={product.name} style={tw`flex-row items-center justify-between py-3.5 ${index < topProducts.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                    <View style={tw`flex-row items-center gap-3`}>
                                        <View style={tw`w-8 h-8 rounded-lg items-center justify-center border ${index === 0 ? 'bg-amber-50 border-amber-200' : index === 1 ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-200'}`}>
                                            <Text style={tw`font-black text-xs ${index === 0 ? 'text-amber-600' : 'text-slate-500'}`}>{index + 1}</Text>
                                        </View>
                                        <View>
                                            <Text style={tw`font-black text-sm text-slate-900`} numberOfLines={1}>{product.name}</Text>
                                            <Text style={tw`text-[10px] font-bold text-slate-400`}>{product.qty} sold</Text>
                                        </View>
                                    </View>
                                    <Text style={tw`font-black text-sm text-slate-900`}>R {product.revenue.toFixed(0)}</Text>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                {/* ═══════════ RECENT ACTIVITY ═══════════ */}
                <View style={tw`p-6 rounded-2xl border border-slate-200 bg-white shadow-sm`}>
                    <View style={tw`flex-row justify-between items-center mb-4`}>
                        <Text style={tw`text-lg font-black text-slate-900 tracking-tight`}>Recent Activity</Text>
                        <View style={tw`px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100`}>
                            <Text style={tw`text-[10px] font-black text-indigo-600 uppercase tracking-wider`}>{recentOrders.length} orders</Text>
                        </View>
                    </View>
                    {recentOrders.length === 0 ? (
                        <View style={tw`py-10 items-center`}>
                            <View style={tw`w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4`}>
                                <ShoppingBag size={28} color="#cbd5e1" />
                            </View>
                            <Text style={tw`text-slate-400 font-bold`}>No sales yet today</Text>
                        </View>
                    ) : (
                        <View style={tw`flex-row flex-wrap`}>
                            {recentOrders.map((order) => (
                                <View key={order.order_uuid} style={tw`w-1/2 pr-4`}>
                                    <ActivityFeedItem
                                        orderId={order.order_uuid}
                                        amount={order.grand_total}
                                        paymentMethod={order.payment_method}
                                        date={order.created_at}
                                        dailyOrderNumber={order.daily_order_number}
                                    />
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}