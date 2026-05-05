import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    Pressable,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import tw from 'twrnc';
import { X, Printer, Mail, Send, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { supabase } from '../../lib/supabase';
import { useBusiness } from '../Context/BusinessContext';
import { formatBusinessDayOrderNumber } from '../../src/utils/formatters';

interface Props {
    visible: boolean;
    order: any;
    items: any[];
    onClose: () => void;
}

export default function ReceiptModal({
    visible,
    order,
    items,
    onClose,
}: Props) {
    const { selectedBusiness } = useBusiness();

    const [showEmailInput, setShowEmailInput] = useState(false);
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);

    if (!order) return null;

    const subtotal = items.reduce((sum, item) => {
        const price = Number(item.price_at_sale) || 0;
        const quantity = Number(item.quantity) || 0;
        return sum + price * quantity;
    }, 0);

    const taxRate = selectedBusiness?.tax_rate ?? 15;
    const taxAmount = subtotal * (taxRate / (100 + taxRate));
    const subtotalExcludingTax = subtotal - taxAmount;

    const receiptNumber =
        order.receipt_number || order.order_uuid?.slice(0, 12) || 'NO RECEIPT';

    const grandTotal = Number(order.grand_total) || subtotal;

    const handleSendEmail = async () => {
        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        if (!order?.order_uuid) {
            console.log('ReceiptModal order object:', order);

            Alert.alert(
                'Missing Order UUID',
                'This receipt cannot be emailed because the order UUID is missing.'
            );
            return;
        }

        try {
            setSending(true);

            const { data, error } = await supabase.functions.invoke(
                'send-receipt-email',
                {
                    body: {
                        order_uuid: order.order_uuid,
                        customer_email: trimmedEmail,
                    },
                }
            );

            if (error) {
                console.error('Receipt email error:', error);

                let serverMessage = error.message || 'Could not send receipt.';

                try {
                    const context = (error as any).context;

                    if (context) {
                        const errorBody = await context.json();
                        console.log('Edge Function error body:', errorBody);

                        serverMessage =
                            errorBody?.error ||
                            errorBody?.details?.message ||
                            errorBody?.details ||
                            serverMessage;
                    }
                } catch (readError) {
                    console.log('Could not read Edge Function error body:', readError);
                }

                Alert.alert('Email Failed', String(serverMessage));
                return;
            }

            if (!data?.success) {
                console.error('Receipt email failed:', data);
                Alert.alert('Email Failed', data?.error || 'Could not send receipt.');
                return;
            }

            setSentSuccess(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            setTimeout(() => {
                setSentSuccess(false);
                setShowEmailInput(false);
                setEmail('');
                Alert.alert('Sent', `Receipt sent to ${trimmedEmail}`);
            }, 1000);
        } catch (e: any) {
            console.error('Receipt email exception:', e);
            Alert.alert('Email Failed', e.message || 'Something went wrong.');
        } finally {
            setSending(false);
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <Pressable
                style={tw`flex-1 bg-black/70 justify-center items-center p-5`}
                onPress={onClose}
            >
                <Pressable style={tw`w-full max-w-sm`} onPress={() => { }}>
                    <View style={tw`bg-white rounded-3xl overflow-hidden shadow-2xl`}>
                        <View
                            style={tw`flex-row justify-between items-center px-5 py-3.5 border-b border-slate-100`}
                        >
                            <Text
                                style={tw`text-slate-400 font-black text-[10px] tracking-widest uppercase`}
                            >
                                Receipt Preview
                            </Text>

                            <Pressable
                                onPress={onClose}
                                style={({ pressed }) => [
                                    tw`w-8 h-8 rounded-full bg-slate-100 items-center justify-center`,
                                    pressed && tw`bg-slate-200 scale-90`,
                                ]}
                            >
                                <X size={14} color="#64748b" />
                            </Pressable>
                        </View>

                        <ScrollView
                            style={tw`max-h-[460px]`}
                            contentContainerStyle={tw`p-6`}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={tw`items-center mb-1`}>
                                <Text
                                    style={tw`text-2xl font-black text-slate-900 uppercase text-center tracking-tight`}
                                >
                                    {selectedBusiness?.name || 'STORE NAME'}
                                </Text>

                                <View
                                    style={tw`mt-3 px-4 py-1.5 rounded-lg bg-slate-50 border border-slate-200`}
                                >
                                    <Text
                                        style={tw`text-slate-600 text-[10px] font-black uppercase tracking-widest text-center`}
                                    >
                                        {receiptNumber}
                                    </Text>
                                </View>

                                {order.daily_order_number && (
                                    <Text
                                        style={tw`text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2`}
                                    >
                                        Order{' '}
                                        {formatBusinessDayOrderNumber(order.daily_order_number)}
                                    </Text>
                                )}

                                <Text
                                    style={tw`text-slate-400 text-[10px] text-center mt-1.5 font-medium`}
                                >
                                    {order.created_at
                                        ? new Date(order.created_at).toLocaleString()
                                        : 'No date available'}
                                </Text>
                            </View>

                            <View style={tw`border-b border-dashed border-slate-300 my-4`} />

                            <View>
                                {items.map((item, index) => {
                                    const price = Number(item.price_at_sale) || 0;
                                    const quantity = Number(item.quantity) || 0;
                                    const lineTotal = price * quantity;

                                    return (
                                        <View key={item.id || index} style={tw`mb-3`}>
                                            <View style={tw`flex-row justify-between items-start`}>
                                                <View style={tw`flex-1 pr-3`}>
                                                    <Text style={tw`text-slate-900 font-bold text-sm`}>
                                                        {quantity} ×{' '}
                                                        {item.product_name_snapshot || 'Unknown'}
                                                    </Text>

                                                    {quantity > 1 && (
                                                        <Text
                                                            style={tw`text-slate-400 text-[10px] font-medium mt-0.5`}
                                                        >
                                                            @ R {price.toFixed(2)} each
                                                        </Text>
                                                    )}
                                                </View>

                                                <Text style={tw`text-slate-900 font-black text-sm`}>
                                                    R {lineTotal.toFixed(2)}
                                                </Text>
                                            </View>

                                            {item.modifiers && item.modifiers.length > 0 && (
                                                <View style={tw`pl-3 mt-1`}>
                                                    {item.modifiers.map((mod: any, modIndex: number) => (
                                                        <Text
                                                            key={mod.id || modIndex}
                                                            style={tw`text-indigo-500 text-[10px] font-bold`}
                                                        >
                                                            + {mod.name}
                                                            {mod.extra_cost
                                                                ? ` (R${Number(mod.extra_cost).toFixed(2)})`
                                                                : ''}
                                                        </Text>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>

                            <View style={tw`border-b border-dashed border-slate-300 my-4`} />

                            <View style={tw`gap-2`}>
                                <View style={tw`flex-row justify-between`}>
                                    <Text style={tw`text-slate-500 text-xs font-bold`}>
                                        Subtotal excl. VAT
                                    </Text>
                                    <Text style={tw`text-slate-700 text-xs font-bold`}>
                                        R {subtotalExcludingTax.toFixed(2)}
                                    </Text>
                                </View>

                                <View style={tw`flex-row justify-between`}>
                                    <Text style={tw`text-slate-500 text-xs font-bold`}>
                                        VAT ({taxRate}%)
                                    </Text>
                                    <Text style={tw`text-slate-700 text-xs font-bold`}>
                                        R {taxAmount.toFixed(2)}
                                    </Text>
                                </View>

                                <View
                                    style={tw`flex-row justify-between items-center mt-2 pt-2 border-t border-slate-200`}
                                >
                                    <Text style={tw`text-slate-900 text-xl font-black`}>
                                        TOTAL
                                    </Text>
                                    <Text
                                        style={tw`text-slate-900 text-2xl font-black tracking-tight`}
                                    >
                                        R {grandTotal.toFixed(2)}
                                    </Text>
                                </View>

                                <View style={tw`flex-row justify-between mt-1`}>
                                    <Text
                                        style={tw`text-slate-400 text-[10px] uppercase font-black tracking-widest`}
                                    >
                                        Payment
                                    </Text>
                                    <Text
                                        style={tw`text-slate-600 text-[10px] uppercase font-black tracking-wider`}
                                    >
                                        {order.payment_method || 'N/A'}
                                    </Text>
                                </View>
                            </View>

                            <View style={tw`border-b border-dashed border-slate-300 my-4`} />

                            <View style={tw`items-center`}>
                                <Text
                                    style={tw`text-slate-900 font-black text-center text-[10px] tracking-widest uppercase`}
                                >
                                    {selectedBusiness?.receipt_message ||
                                        'THANK YOU FOR YOUR SUPPORT!'}
                                </Text>
                            </View>

                            <View style={tw`h-4`} />
                        </ScrollView>

                        <View style={tw`p-4 bg-slate-50 border-t border-slate-100 gap-2.5`}>
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync();
                                    Alert.alert('Print', 'Sending to Bluetooth Printer...');
                                }}
                                style={({ pressed }) => [
                                    tw`bg-slate-900 py-4 rounded-xl flex-row justify-center items-center gap-2`,
                                    pressed && tw`bg-slate-800 scale-[0.97]`,
                                ]}
                            >
                                <Printer color="white" size={16} />
                                <Text
                                    style={tw`text-white font-black uppercase tracking-widest text-xs`}
                                >
                                    Print Receipt
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    Alert.alert('Coming Soon', 'Email receipts are being finalized and will be available shortly.');
                                }}
                                style={({ pressed }) => [
                                    tw`bg-white border border-slate-200 py-3.5 rounded-xl flex-row justify-center items-center gap-2`,
                                    showEmailInput && tw`bg-slate-50`,
                                    pressed && tw`scale-[0.97]`,
                                ]}
                            >
                                <Mail color="#475569" size={16} />
                                <Text
                                    style={tw`text-slate-700 font-black uppercase tracking-widest text-xs`}
                                >
                                    Email Receipt
                                </Text>
                            </Pressable>

                            {showEmailInput && (
                                <View
                                    style={tw`bg-white p-2 rounded-xl border border-slate-200 flex-row items-center gap-2`}
                                >
                                    <TextInput
                                        placeholder="customer@email.com"
                                        placeholderTextColor="#94a3b8"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        keyboardType="email-address"
                                        style={tw`flex-1 text-slate-900 font-bold h-10 px-3 text-sm`}
                                    />

                                    <Pressable
                                        onPress={handleSendEmail}
                                        disabled={sending || sentSuccess}
                                        style={({ pressed }) => [
                                            tw`h-10 w-12 items-center justify-center rounded-lg`,
                                            sentSuccess ? tw`bg-emerald-500` : tw`bg-slate-900`,
                                            pressed && !sentSuccess && tw`bg-slate-700 scale-90`,
                                            (sending || sentSuccess) && tw`opacity-90`,
                                        ]}
                                    >
                                        {sending ? (
                                            <ActivityIndicator color="white" size="small" />
                                        ) : sentSuccess ? (
                                            <CheckCircle color="white" size={18} />
                                        ) : (
                                            <Send color="white" size={16} />
                                        )}
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}