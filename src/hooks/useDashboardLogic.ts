import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../components/Context/BusinessContext';

export const useDashboardLogic = () => {
    const { selectedBusiness: business } = useBusiness();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Stats
    const [dailyRevenue, setDailyRevenue] = useState(0);
    const [dailyOrders, setDailyOrders] = useState(0);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [avgOrderValue, setAvgOrderValue] = useState(0);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<{ name: string; qty: number; revenue: number }[]>([]);

    // Chart
    const [chartFilter, setChartFilter] = useState<'Week' | 'Month'>('Week');
    const [chartData, setChartData] = useState<{ value: number; label: string }[]>([]);

    // Revenue comparison
    const [yesterdayRevenue, setYesterdayRevenue] = useState(0);

    useEffect(() => { if (business) fetchDashboardData(); }, [business]);
    useEffect(() => { if (business) fetchChartData(); }, [business, chartFilter]);

    const fetchDashboardData = async () => {
        try {
            if (!business) return;
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const todayISO = now.toISOString();

            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayISO = yesterday.toISOString();

            const [ordersRes, inventoryRes, recentRes, yesterdayRes, topProductsRes] = await Promise.all([
                // Today's orders
                supabase
                    .from('orders')
                    .select('grand_total')
                    .eq('business_id', business.id)
                    .is('voided_at', null)
                    .gte('created_at', todayISO),
                // Inventory
                supabase
                    .from('inventory_items')
                    .select('quantity, low_stock_threshold')
                    .eq('business_id', business.id),
                // Recent 8 orders
                supabase
                    .from('orders')
                    .select('order_uuid, grand_total, payment_method, created_at, daily_order_number, receipt_number')
                    .eq('business_id', business.id)
                    .is('voided_at', null)
                    .order('created_at', { ascending: false })
                    .limit(8),
                // Yesterday's orders (for comparison)
                supabase
                    .from('orders')
                    .select('grand_total')
                    .eq('business_id', business.id)
                    .is('voided_at', null)
                    .gte('created_at', yesterdayISO)
                    .lt('created_at', todayISO),
                // Top products today
                supabase
                    .from('order_items')
                    .select('product_name_snapshot, quantity, price_at_sale, orders!inner(business_id, created_at, voided_at)')
                    .eq('orders.business_id', business.id)
                    .is('orders.voided_at', null)
                    .gte('orders.created_at', todayISO)
            ]);

            if (ordersRes.data) {
                const total = ordersRes.data.reduce((sum, o) => sum + Number(o.grand_total), 0);
                setDailyRevenue(total);
                setDailyOrders(ordersRes.data.length);
                setAvgOrderValue(ordersRes.data.length > 0 ? total / ordersRes.data.length : 0);
            }

            if (inventoryRes.data) {
                setLowStockCount(inventoryRes.data.filter(i => i.quantity <= i.low_stock_threshold).length);
            }

            if (recentRes.data) {
                setRecentOrders(recentRes.data);
            }

            if (yesterdayRes.data) {
                const yTotal = yesterdayRes.data.reduce((sum, o) => sum + Number(o.grand_total), 0);
                setYesterdayRevenue(yTotal);
            }

            // Aggregate top products
            if (topProductsRes.data && topProductsRes.data.length > 0) {
                const productMap: Record<string, { qty: number; revenue: number }> = {};
                topProductsRes.data.forEach((item: any) => {
                    const name = item.product_name_snapshot || 'Unknown';
                    if (!productMap[name]) productMap[name] = { qty: 0, revenue: 0 };
                    productMap[name].qty += item.quantity || 1;
                    productMap[name].revenue += (item.price_at_sale || 0) * (item.quantity || 1);
                });
                const sorted = Object.entries(productMap)
                    .map(([name, data]) => ({ name, ...data }))
                    .sort((a, b) => b.qty - a.qty)
                    .slice(0, 5);
                setTopProducts(sorted);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchChartData = async () => {
        if (!business) return;
        try {
            const days = chartFilter === 'Week' ? 7 : 30;
            const dayLabelsShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            // Fetch orders for the last N days
            const since = new Date();
            since.setDate(since.getDate() - days);
            since.setHours(0, 0, 0, 0);

            const { data } = await supabase
                .from('orders')
                .select('grand_total, created_at')
                .eq('business_id', business.id)
                .is('voided_at', null)
                .gte('created_at', since.toISOString())
                .order('created_at', { ascending: true });

            if (!data || data.length === 0) {
                setChartData([]);
                return;
            }

            // Group by day
            const buckets: Record<string, number> = {};
            for (let i = 0; i < days; i++) {
                const d = new Date();
                d.setDate(d.getDate() - (days - 1 - i));
                const key = d.toISOString().split('T')[0];
                buckets[key] = 0;
            }

            data.forEach(order => {
                const key = order.created_at.split('T')[0];
                if (buckets[key] !== undefined) {
                    buckets[key] += Number(order.grand_total);
                }
            });

            const result = Object.entries(buckets).map(([dateStr, value]) => {
                const d = new Date(dateStr + 'T12:00:00');
                let label: string;
                if (chartFilter === 'Week') {
                    label = dayLabelsShort[d.getDay()];
                } else {
                    label = `${d.getDate()}/${d.getMonth() + 1}`;
                }
                return { value, label };
            });

            setChartData(result);
        } catch (error) {
            console.error('Chart data error:', error);
            setChartData([]);
        }
    };

    const onRefresh = () => { setRefreshing(true); fetchDashboardData(); fetchChartData(); };

    // Revenue trend percentage
    const revenueTrend = yesterdayRevenue > 0
        ? Math.round(((dailyRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
        : dailyRevenue > 0 ? 100 : 0;

    return {
        business, loading, refreshing, onRefresh,
        dailyRevenue, dailyOrders, lowStockCount, avgOrderValue,
        recentOrders, topProducts,
        chartFilter, setChartFilter, chartData,
        revenueTrend
    };
};