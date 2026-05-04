import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { X, Printer, Mail, Send, CheckCircle, Copy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useBusiness } from '../Context/BusinessContext';
import { formatBusinessDayOrderNumber } from '../../src/utils/formatters';

interface Props {
    visible: boolean;
    order: any;
    items: any[];
    onClose: () => void;
}

export default function ReceiptModal({ visible, order, items, onClose }: Props) {
    const { selectedBusiness } = useBusiness();
    
    const [showEmailInput, setShowEmailInput] = useState(false);
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);

    if (!order) return null;

    const handleSendEmail = async () => {
        if (!email.includes('@') || !email.includes('.')) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        setSending(true);
        setTimeout(() => {
            setSending(false);
            setSentSuccess(true);
            setTimeout(() => {
                setSentSuccess(false);
                setShowEmailInput(false);
                setEmail('');
                Alert.alert("Sent", `Receipt sent to ${email}`);
            }, 1500);
        }, 1500);
    };

    const subtotal = items.reduce((sum, i) => sum + (i.price_at_sale * i.quantity), 0);
    const taxRate = selectedBusiness?.tax_rate ?? 15;
    const taxAmount = subtotal * (taxRate / (100 + taxRate));

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <Pressable style={tw`flex-1 bg-black/70 justify-center items-center p-5`} onPress={onClose}>
                <Pressable style={tw`w-full max-w-sm`} onPress={() => {}}>
                    {/* Thermal Receipt Paper Effect */}
                    <View style={tw`bg-white rounded-3xl overflow-hidden shadow-2xl`}>
                        
                        {/* Header bar */}
                        <View style={tw`flex-row justify-between items-center px-5 py-3.5 border-b border-slate-100`}>
                            <Text style={tw`text-slate-400 font-black text-[10px] tracking-widest uppercase`}>Receipt Preview</Text>
                            <Pressable 
                                onPress={onClose}
                                style={({ pressed }) => [
                                    tw`w-8 h-8 rounded-full bg-slate-100 items-center justify-center`,
                                    pressed && tw`bg-slate-200 scale-90`
                                ]}
                            >
                                <X size={14} color="#64748b" />
                            </Pressable>
                        </View>

                        <ScrollView style={tw`max-h-[460px]`} contentContainerStyle={tw`p-6`}>
                            {/* Business Header */}
                            <View style={tw`items-center mb-1`}>
                                <Text style={tw`text-2xl font-black text-slate-900 uppercase text-center tracking-tight`}>
                                    {selectedBusiness?.name || 'STORE NAME'}
                                </Text>
                                <View style={tw`mt-3 px-4 py-1.5 rounded-lg bg-slate-50 border border-slate-200`}>
                                    <Text style={tw`text-slate-600 text-[10px] font-black uppercase tracking-widest text-center`}>
                                        {order.receipt_number || order.order_uuid?.slice(0, 12)}
                                    </Text>
                                </View>
                                {order.daily_order_number && (
                                    <Text style={tw`text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2`}>
                                        Order {formatBusinessDayOrderNumber(order.daily_order_number)}
                                    </Text>
                                )}
                                <Text style={tw`text-slate-400 text-[10px] text-center mt-1.5 font-medium`}>
                                    {new Date(order.created_at).toLocaleString()}
                                </Text>
                            </View>

                            {/* Divider */}
                            <View style={tw`border-b border-dashed border-slate-300 my-4`} />

                            {/* Items */}
                            <View>
                                {items.map((item, index) => (
                                    <View key={index} style={tw`mb-3`}>
                                        <View style={tw`flex-row justify-between items-start`}>
                                            <View style={tw`flex-1 pr-3`}>
                                                <Text style={tw`text-slate-900 font-bold text-sm`}>
                                                    {item.quantity} × {item.product_name_snapshot || 'Unknown'}
                                                </Text>
                                                {item.quantity > 1 && (
                                                    <Text style={tw`text-slate-400 text-[10px] font-medium mt-0.5`}>
                                                        @ R {Number(item.price_at_sale).toFixed(2)} each
                                                    </Text>
                                                )}
                                            </View>
                                            <Text style={tw`text-slate-900 font-black text-sm`}>
                                                R {(item.price_at_sale * item.quantity).toFixed(2)}
                                            </Text>
                                        </View>
                                        {item.modifiers && item.modifiers.length > 0 && (
                                            <View style={tw`pl-3 mt-1`}>
                                                {item.modifiers.map((mod: any, i: number) => (
                                                    <Text key={i} style={tw`text-indigo-500 text-[10px] font-bold`}>
                                                        + {mod.name}{mod.extra_cost ? ` (R${Number(mod.extra_cost).toFixed(2)})` : ''}
                                                    </Text>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>

                            {/* Divider */}
                            <View style={tw`border-b border-dashed border-slate-300 my-4`} />

                            {/* Totals */}
                            <View style={tw`gap-2`}>
                                <View style={tw`flex-row justify-between`}>
                                    <Text style={tw`text-slate-500 text-xs font-bold`}>Subtotal (excl. tax)</Text>
                                    <Text style={tw`text-slate-700 text-xs font-bold`}>R {(subtotal - taxAmount).toFixed(2)}</Text>
                                </View>
                                <View style={tw`flex-row justify-between`}>
                                    <Text style={tw`text-slate-500 text-xs font-bold`}>VAT ({taxRate}%)</Text>
                                    <Text style={tw`text-slate-700 text-xs font-bold`}>R {taxAmount.toFixed(2)}</Text>
                                </View>
                                <View style={tw`flex-row justify-between items-center mt-2 pt-2 border-t border-slate-200`}>
                                    <Text style={tw`text-slate-900 text-xl font-black`}>TOTAL</Text>
                                    <Text style={tw`text-slate-900 text-2xl font-black tracking-tight`}>
                                        R {Number(order.grand_total).toFixed(2)}
                                    </Text>
                                </View>
                                <View style={tw`flex-row justify-between mt-1`}>
                                    <Text style={tw`text-slate-400 text-[10px] uppercase font-black tracking-widest`}>Payment</Text>
                                    <Text style={tw`text-slate-600 text-[10px] uppercase font-black tracking-wider`}>{order.payment_method}</Text>
                                </View>
                            </View>

                            {/* Divider */}
                            <View style={tw`border-b border-dashed border-slate-300 my-4`} />

                            {/* Footer */}
                            <View style={tw`items-center`}>
                                <Text style={tw`text-slate-900 font-black text-center text-[10px] tracking-widest uppercase`}>
                                    {selectedBusiness?.receipt_message || 'THANK YOU FOR YOUR SUPPORT!'}
                                </Text>
                            </View>
                            <View style={tw`h-4`} />
                        </ScrollView>

                        {/* Action Footer */}
                        <View style={tw`p-4 bg-slate-50 border-t border-slate-100 gap-2.5`}>
                            {/* Print */}
                            <Pressable 
                                onPress={() => {
                                    Haptics.impactAsync();
                                    Alert.alert('Print', 'Sending to Bluetooth Printer...');
                                }}
                                style={({ pressed }) => [
                                    tw`bg-slate-900 py-4 rounded-xl flex-row justify-center items-center gap-2`,
                                    pressed && tw`bg-slate-800 scale-[0.97]`
                                ]}
                            >
                                <Printer color="white" size={16} />
                                <Text style={tw`text-white font-black uppercase tracking-widest text-xs`}>Print Receipt</Text>
                            </Pressable>

                            {/* Email Toggle */}
                            <Pressable 
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setShowEmailInput(!showEmailInput);
                                }}
                                style={({ pressed }) => [
                                    tw`bg-white border border-slate-200 py-3.5 rounded-xl flex-row justify-center items-center gap-2`,
                                    showEmailInput && tw`bg-slate-50`,
                                    pressed && tw`scale-[0.97]`
                                ]}
                            >
                                <Mail color="#475569" size={16} />
                                <Text style={tw`text-slate-700 font-black uppercase tracking-widest text-xs`}>Email Receipt</Text>
                            </Pressable>

                            {/* Email Input */}
                            {showEmailInput && (
                                <View style={tw`bg-white p-2 rounded-xl border border-slate-200 flex-row items-center gap-2`}>
                                    <TextInput 
                                        placeholder="customer@email.com"
                                        placeholderTextColor="#94a3b8"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        style={tw`flex-1 text-slate-900 font-bold h-10 px-3 text-sm`}
                                    />
                                    <Pressable 
                                        onPress={handleSendEmail}
                                        disabled={sending || sentSuccess}
                                        style={({ pressed }) => [
                                            tw`h-10 w-12 items-center justify-center rounded-lg`,
                                            sentSuccess ? tw`bg-emerald-500` : tw`bg-slate-900`,
                                            pressed && !sentSuccess && tw`bg-slate-700 scale-90`
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
