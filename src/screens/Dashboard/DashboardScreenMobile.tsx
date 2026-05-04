import React from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Pressable, useWindowDimensions } from 'react-native';
import tw from 'twrnc';
import { BarChart } from "react-native-gifted-charts";
import {
    ShoppingBag, AlertTriangle, TrendingUp, TrendingDown,
    BarChart2, Award, Hash
} from 'lucide-react-native';
import { useDashboardLogic } from '../../hooks/useDashboardLogic';
import ActivityFeedItem from '../../../components/ActivityFeedItem';
import * as Haptics from 'expo-haptics';

export default function DashboardScreenMobile() {
    const {
        business, loading, refreshing, onRefresh,
        dailyRevenue, dailyOrders, lowStockCount, avgOrderValue,
        recentOrders, topProducts,
        chartFilter, setChartFilter, chartData,
        revenueTrend
    } = useDashboardLogic();
    const { width: screenWidth } = useWindowDimensions();
    const chartAreaWidth = screenWidth - 64;

    if (loading) return (
        <View style={tw`flex-1 justify-center items-center bg-slate-50`}>
            <ActivityIndicator color="#4f46e5" size="large" />
            <Text style={tw`mt-4 text-slate-400 font-bold text-sm`}>Loading dashboard...</Text>
        </View>
    );

    const trendPositive = revenueTrend >= 0;

    return (
        <View style={tw`flex-1 bg-slate-50`}>
            {/* Header */}
            <View style={tw`px-5 pt-5 pb-3 bg-white border-b border-slate-100`}>
                <Text style={tw`text-2xl font-black text-slate-900 tracking-tight`}>Dashboard</Text>
                <Text style={tw`text-xs font-medium text-slate-400 mt-0.5`}>{business?.name}</Text>
            </View>

            <ScrollView
                contentContainerStyle={tw`p-4 pb-24`}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
                showsVerticalScrollIndicator={false}
            >
                {/* ═══════════ REVENUE HERO ═══════════ */}
                <View style={tw`p-5 rounded-2xl bg-white border border-slate-200 shadow-sm mb-3`}>
                    <View style={tw`flex-row justify-between items-center mb-3`}>
                        <View style={tw`flex-row items-center gap-2`}>
                            <View style={tw`p-2 rounded-xl bg-indigo-50 border border-indigo-100`}>
                                <TrendingUp size={16} color="#4f46e5" />
                            </View>
                            <Text style={tw`text-xs font-black uppercase tracking-widest text-slate-400`}>Today's Revenue</Text>
                        </View>
                        <View style={tw`flex-row items-center px-2 py-1 rounded-lg ${trendPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
                            {trendPositive
                                ? <TrendingUp size={11} color="#10b981" />
                                : <TrendingDown size={11} color="#ef4444" />
                            }
                            <Text style={tw`text-[10px] font-black ml-1 ${trendPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                {trendPositive ? '+' : ''}{revenueTrend}%
                            </Text>
                        </View>
                    </View>
                    <Text style={tw`text-4xl font-black text-slate-900 tracking-tight`}>
                        R {dailyRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </Text>
                </View>

                {/* ═══════════ 3 MINI STATS ═══════════ */}
                <View style={tw`flex-row gap-2 mb-4`}>
                    <View style={tw`flex-1 p-3 rounded-xl bg-white border border-slate-200 shadow-sm`}>
                        <View style={tw`flex-row items-center gap-1.5 mb-1.5`}>
                            <ShoppingBag size={12} color="#3b82f6" />
                            <Text style={tw`text-[9px] font-black uppercase tracking-widest text-slate-400`}>Orders</Text>
                        </View>
                        <Text style={tw`text-2xl font-black text-slate-900 tracking-tight`}>{dailyOrders}</Text>
                    </View>

                    <View style={tw`flex-1 p-3 rounded-xl bg-white border border-slate-200 shadow-sm`}>
                        <View style={tw`flex-row items-center gap-1.5 mb-1.5`}>
                            <Hash size={12} color="#d97706" />
                            <Text style={tw`text-[9px] font-black uppercase tracking-widest text-slate-400`}>Avg</Text>
                        </View>
                        <Text style={tw`text-2xl font-black text-slate-900 tracking-tight`} numberOfLines={1} adjustsFontSizeToFit>
                            R{avgOrderValue.toFixed(0)}
                        </Text>
                    </View>

                    <View style={[tw`flex-1 p-3 rounded-xl border shadow-sm`,
                        lowStockCount > 0 ? tw`bg-red-50 border-red-200` : tw`bg-white border-slate-200`]}>
                        <View style={tw`flex-row items-center gap-1.5 mb-1.5`}>
                            <AlertTriangle size={12} color={lowStockCount > 0 ? '#ef4444' : '#10b981'} />
                            <Text style={tw`text-[9px] font-black uppercase tracking-widest ${lowStockCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>Low</Text>
                        </View>
                        <Text style={tw`text-2xl font-black tracking-tight ${lowStockCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{lowStockCount}</Text>
                    </View>
                </View>

                {/* ═══════════ CHART ═══════════ */}
                <View style={tw`p-4 rounded-2xl border border-slate-200 bg-white shadow-sm mb-4`}>
                    <View style={tw`flex-row justify-between items-center mb-5`}>
                        <Text style={tw`text-base font-black text-slate-900 tracking-tight`}>Sales Trend</Text>
                        <View style={tw`flex-row rounded-xl p-1 bg-slate-50 border border-slate-200`}>
                            {(['Week', 'Month'] as const).map((filter) => (
                                <Pressable
                                    key={filter}
                                    onPress={() => { Haptics.selectionAsync(); setChartFilter(filter); }}
                                    style={[
                                        tw`px-3 py-1.5 rounded-lg`,
                                        chartFilter === filter && tw`bg-white shadow-sm`
                                    ]}
                                >
                                    <Text style={tw`text-[10px] font-black uppercase tracking-wider ${chartFilter === filter ? 'text-slate-900' : 'text-slate-400'}`}>{filter}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {chartData.length > 0 ? (
                        <BarChart
                            data={chartData.map(d => ({ ...d, frontColor: d.value > 0 ? '#4f46e5' : '#e2e8f0' }))}
                            barWidth={chartFilter === 'Week' ? 22 : 8}
                            spacing={chartFilter === 'Week' ? 24 : 6}
                            noOfSections={3}
                            barBorderRadius={4}
                            yAxisThickness={0}
                            xAxisThickness={0}
                            yAxisTextStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: '600' }}
                            xAxisLabelTextStyle={{ color: '#94a3b8', fontSize: 9, fontWeight: '600' }}
                            hideRules
                            height={160}
                            width={chartAreaWidth}
                        />
                    ) : (
                        <View style={tw`h-40 items-center justify-center`}>
                            <View style={tw`w-14 h-14 rounded-full bg-slate-100 items-center justify-center mb-3`}>
                                <BarChart2 size={24} color="#cbd5e1" />
                            </View>
                            <Text style={tw`text-slate-400 font-bold text-sm`}>No sales data yet</Text>
                        </View>
                    )}
                </View>

                {/* ═══════════ TOP SELLERS ═══════════ */}
                {topProducts.length > 0 && (
                    <View style={tw`p-4 rounded-2xl border border-slate-200 bg-white shadow-sm mb-4`}>
                        <View style={tw`flex-row items-center gap-2 mb-4`}>
                            <View style={tw`p-2 rounded-xl bg-amber-50 border border-amber-100`}>
                                <Award size={14} color="#d97706" />
                            </View>
                            <Text style={tw`text-base font-black text-slate-900 tracking-tight`}>Top Sellers</Text>
                        </View>
                        {topProducts.map((product, index) => (
                            <View key={product.name} style={tw`flex-row items-center justify-between py-3 ${index < topProducts.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                <View style={tw`flex-row items-center gap-3`}>
                                    <View style={tw`w-7 h-7 rounded-lg items-center justify-center border ${index === 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                                        <Text style={tw`font-black text-[10px] ${index === 0 ? 'text-amber-600' : 'text-slate-500'}`}>{index + 1}</Text>
                                    </View>
                                    <View>
                                        <Text style={tw`font-black text-sm text-slate-900`} numberOfLines={1}>{product.name}</Text>
                                        <Text style={tw`text-[10px] font-bold text-slate-400`}>{product.qty} sold</Text>
                                    </View>
                                </View>
                                <Text style={tw`font-black text-sm text-slate-900`}>R {product.revenue.toFixed(0)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* ═══════════ RECENT ACTIVITY ═══════════ */}
                <View style={tw`p-4 rounded-2xl border border-slate-200 bg-white shadow-sm`}>
                    <View style={tw`flex-row justify-between items-center mb-3`}>
                        <Text style={tw`text-base font-black text-slate-900 tracking-tight`}>Recent Activity</Text>
                        <View style={tw`px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100`}>
                            <Text style={tw`text-[10px] font-black text-indigo-600 uppercase tracking-wider`}>{recentOrders.length}</Text>
                        </View>
                    </View>
                    {recentOrders.length === 0 ? (
                        <View style={tw`py-8 items-center`}>
                            <View style={tw`w-14 h-14 rounded-full bg-slate-100 items-center justify-center mb-3`}>
                                <ShoppingBag size={24} color="#cbd5e1" />
                            </View>
                            <Text style={tw`text-slate-400 font-bold text-sm`}>No sales yet today</Text>
                        </View>
                    ) : (
                        recentOrders.map((order) => (
                            <ActivityFeedItem
                                key={order.order_uuid}
                                orderId={order.order_uuid}
                                amount={order.grand_total}
                                paymentMethod={order.payment_method}
                                date={order.created_at}
                                dailyOrderNumber={order.daily_order_number}
                            />
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}