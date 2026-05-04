import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { ArrowLeft, AlertTriangle, Clock, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface TransactionDetailModalProps {
    visible: boolean;
    onClose: () => void;
    order: any;
    items: any[];
    loadingDetails: boolean;
    onRefund: () => void;
    onViewReceipt: () => void;
    formatDate: (date: string) => string;
    formatTime: (date: string) => string;
    getPaymentIcon: (method: string) => React.ReactNode;
    getPaymentIconBg: (method: string) => any;
}

export default function TransactionDetailModal({
    visible,
    onClose,
    order,
    items,
    loadingDetails,
    onRefund,
    onViewReceipt,
    formatDate,
    formatTime,
    getPaymentIcon,
    getPaymentIconBg
}: TransactionDetailModalProps) {
    if (!order) return null;

    return (
        <Modal 
            visible={visible} 
            animationType="slide" 
            presentationStyle="pageSheet" 
            onRequestClose={onClose}
        >
            <View style={tw`flex-1 bg-slate-50`}>
                {/* Modal Header */}
                <View style={tw`flex-row justify-between items-center p-5 bg-white border-b border-slate-100`}>
                    <Pressable
                        onPress={() => {
                            Haptics.selectionAsync();
                            onClose();
                        }}
                        style={({ pressed }) => [
                            tw`w-10 h-10 rounded-full bg-slate-50 border border-slate-200 items-center justify-center transition-all`,
                            pressed && tw`scale-90 bg-slate-100`
                        ]}
                    >
                        <ArrowLeft size={18} color="#0f172a" />
                    </Pressable>
                    <View style={tw`items-end`}>
                        <Text style={tw`text-[10px] uppercase font-black tracking-widest text-slate-400`}>
                            {order.receipt_number || `ID: ${order.id?.slice(0, 8)}`}
                        </Text>
                        <Text style={tw`text-[10px] font-bold text-indigo-600 uppercase tracking-wider mt-0.5`}>
                            {formatDate(order.created_at)}
                        </Text>
                    </View>
                </View>

                {/* Content */}
                <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false} contentContainerStyle={tw`p-4 pb-8`}>
                    {/* Hero Amount Card */}
                    <View style={tw`rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden mb-5`}>
                        {/* Voided Banner */}
                        {(order.payment_status === 'refunded' || order.payment_status === 'void') && (
                            <View style={tw`px-5 py-3 bg-red-50 border-b border-red-100 flex-row items-center justify-center gap-2`}>
                                <AlertTriangle size={14} color="#ef4444" />
                                <Text style={tw`text-xs font-black text-red-600 uppercase tracking-wider`}>Transaction Voided</Text>
                            </View>
                        )}

                        <View style={tw`p-6 items-center`}>
                            <View style={tw`px-3 py-1 bg-slate-100 rounded-full mb-3`}>
                                <Text style={tw`text-[9px] font-black uppercase tracking-widest text-slate-500`}>Total Amount</Text>
                            </View>
                            <Text style={tw`text-4xl font-black text-slate-900 tracking-tighter mb-4`}>
                                <Text style={tw`text-2xl text-slate-400 font-bold`}>R</Text> {Number(order.grand_total).toFixed(2)}
                            </Text>
                            <View style={tw`flex-row items-center gap-3`}>
                                <View style={[tw`px-4 py-2 rounded-2xl border flex-row items-center gap-2`, getPaymentIconBg(order.payment_method || 'Card')]}>
                                    {getPaymentIcon(order.payment_method || 'Card')}
                                    <Text style={tw`text-[11px] font-black uppercase tracking-wider text-slate-700`}>{order.payment_method}</Text>
                                </View>
                                <View style={tw`px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 flex-row items-center gap-1.5`}>
                                    <Clock size={12} color="#64748b" />
                                    <Text style={tw`text-[11px] font-black text-slate-500 uppercase tracking-wider`}>{formatTime(order.created_at)}</Text>
                                </View>
                            </View>
                            {order.daily_order_number && (
                                <Text style={tw`text-[9px] font-black text-slate-300 uppercase tracking-widest mt-6`}>
                                    ORDER #{order.daily_order_number}
                                    {order.business_day ? ` • DAY: ${order.business_day}` : ''}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Items List */}
                    <View style={tw`mb-4`}>
                        <View style={tw`flex-row items-center justify-between mb-4 px-1`}>
                            <Text style={tw`text-xs font-black text-slate-400 uppercase tracking-widest`}>Items Breakdown</Text>
                            <View style={tw`px-2.5 py-0.5 rounded-full bg-slate-200`}>
                                <Text style={tw`text-[9px] font-black text-slate-500`}>{items.length}</Text>
                            </View>
                        </View>

                        {loadingDetails ? (
                            <ActivityIndicator color="#4f46e5" style={tw`my-10`} />
                        ) : (
                            <View style={tw`gap-2.5`}>
                                {items.map((item, i) => (
                                    <View key={i} style={tw`p-4 rounded-3xl bg-white border border-slate-100 shadow-sm`}>
                                        <View style={tw`flex-row justify-between items-center`}>
                                            <View style={tw`flex-1 pr-3 flex-row items-center gap-3`}>
                                                <View style={tw`w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 items-center justify-center`}>
                                                    <Text style={tw`text-[11px] font-black text-indigo-600`}>{item.quantity}x</Text>
                                                </View>
                                                <View style={tw`flex-1`}>
                                                    <Text style={tw`font-bold text-sm text-slate-900`} numberOfLines={1}>{item.product_name_snapshot}</Text>
                                                    {item.modifiers && item.modifiers.length > 0 && (
                                                        <Text style={tw`text-[10px] mt-0.5 font-bold text-indigo-400 uppercase tracking-wider`}>
                                                            {item.modifiers.map((m: any) => m.name).join(', ')}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                            <Text style={tw`font-black text-sm text-slate-900`}>
                                                R {(item.price_at_sale * item.quantity).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Clean Total Summary */}
                        {!loadingDetails && items.length > 0 && (
                            <View style={tw`mt-6 pt-6 border-t-2 border-dashed border-slate-200 flex-row justify-between items-end px-1`}>
                                <View>
                                    <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest`}>Grand Total</Text>
                                    <Text style={tw`text-slate-900 font-bold text-[11px]`}>Tax & Fees Included</Text>
                                </View>
                                <View style={tw`items-end`}>
                                    <Text style={tw`text-4xl font-black text-indigo-600 tracking-tighter`}>
                                        <Text style={tw`text-xl text-indigo-300 font-bold`}>R</Text> {Number(order.grand_total).toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Footer Actions */}
                <View style={tw`p-5 pt-4 border-t border-slate-100 bg-white flex-row gap-3`}>
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onViewReceipt();
                        }}
                        style={({ pressed }) => [
                            tw`flex-1 h-14 rounded-3xl items-center justify-center bg-indigo-600 shadow-sm`,
                            pressed && tw`scale-[0.97] bg-indigo-700 shadow-none`
                        ]}
                    >
                        <Text style={tw`text-white font-black text-sm tracking-widest uppercase`}>View Receipt</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            onRefund();
                        }}
                        style={({ pressed }) => [
                            tw`w-14 h-14 items-center justify-center rounded-3xl border border-red-100 bg-red-50 shadow-sm`,
                            pressed && tw`scale-[0.97] bg-red-100 shadow-none`
                        ]}
                    >
                        <RotateCcw size={20} color="#ef4444" />
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
