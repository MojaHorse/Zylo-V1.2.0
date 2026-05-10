import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    ScrollView,
    Pressable,
} from 'react-native';
import AnimatedModalContainer from './AnimatedModalContainer';
import AnimatedPressable from '../AnimatedPressable';
import tw from 'twrnc';
import {
    X,
    CreditCard,
    Banknote,
    CheckCircle,
    ArrowLeft,
    Printer,
    Mail,
    Send,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useCart } from '../Context/CartContext';
import { useAuth } from '../Context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../Context/BusinessContext';
import {
    formatBusinessDayOrderNumber,
    formatReceiptLabel,
} from '../../src/utils/formatters';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function CheckoutModal({ visible, onClose }: Props) {
    const { cart, total, clearCart } = useCart();
    const { user, activeStaff } = useAuth();
    const { selectedBusiness } = useBusiness();

    const [step, setStep] = useState<1 | 2>(1);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card'>('Cash');
    const [amountTendered, setAmountTendered] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [completedOrderFields, setCompletedOrderFields] = useState<{
        order_uuid?: string | null;
        receipt_number?: string | null;
        daily_order_number?: number | null;
    } | null>(null);

    const [finalChange, setFinalChange] = useState(0);
    const [finalTotal, setFinalTotal] = useState(0);

    const [showEmailInput, setShowEmailInput] = useState(false);
    const [customerEmail, setCustomerEmail] = useState('');
    const [emailSending, setEmailSending] = useState(false);
    const [emailSentSuccess, setEmailSentSuccess] = useState(false);

    useEffect(() => {
        if (visible) {
            setStep(1);
            setAmountTendered('');
            setSuccess(false);
            setLoading(false);
            setFinalChange(0);
            setFinalTotal(0);
            setShowEmailInput(false);
            setCustomerEmail('');
            setCompletedOrderFields(null);
            setEmailSending(false);
            setEmailSentSuccess(false);

            checkShiftStatus();
        }
    }, [visible]);

    const checkShiftStatus = async () => {
        if (!activeStaff?.id) {
            Alert.alert(
                'Authentication Required',
                'Please log in with your PIN to process sales.'
            );
            onClose();
            return;
        }

        if (activeStaff.business_id !== selectedBusiness?.id) {
            Alert.alert(
                'Session Error',
                'Staff session does not belong to the selected business. Please log in again.'
            );
            onClose();
            return;
        }

        const { data: shift, error } = await supabase
            .from('cash_ups')
            .select('id')
            .eq('business_id', selectedBusiness?.id)
            .eq('staff_id', activeStaff.id)
            .eq('status', 'open')
            .maybeSingle();

        if (error) {
            console.error('Shift check error:', error);
            Alert.alert('Shift Error', error.message);
            onClose();
            return;
        }

        if (!shift) {
            Alert.alert(
                'Shift Required',
                'You must open a shift before you can process payments.'
            );
            onClose();
        }
    };

    const tendered = parseFloat(amountTendered) || 0;
    const currentDiff = tendered - total;

    const isSufficient =
        paymentMethod === 'Card' || (paymentMethod === 'Cash' && tendered >= total);

    const handleMethodSelect = (method: 'Cash' | 'Card') => {
        Haptics.selectionAsync();
        setPaymentMethod(method);
        setStep(2);
    };

    const handleBack = () => {
        Haptics.selectionAsync();
        setStep(1);
        setAmountTendered('');
    };

    const addCash = (amt: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const current = amountTendered ? parseFloat(amountTendered) : 0;
        setAmountTendered(String(current + amt));
    };

    const setExact = () => {
        Haptics.impactAsync();
        setAmountTendered(String(total));
    };

    const handlePayment = async () => {
        Keyboard.dismiss();
        Haptics.impactAsync();

        if (!user?.id) {
            Alert.alert('Error', 'No user logged in.');
            return;
        }

        if (!selectedBusiness?.id) {
            Alert.alert('Error', 'No Business Selected.');
            return;
        }

        if (cart.length === 0) {
            Alert.alert('Error', 'Cart is empty.');
            return;
        }

        if (paymentMethod === 'Cash' && tendered < total) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                'Insufficient Funds',
                `Short by R ${(total - tendered).toFixed(2)}`
            );
            return;
        }

        setLoading(true);

        try {
            if (!activeStaff?.id) {
                throw new Error('Could not verify staff credentials.');
            }

            if (activeStaff.business_id !== selectedBusiness.id) {
                throw new Error(
                    'Staff session does not belong to the selected business. Please log in again.'
                );
            }

            const staffId = activeStaff.id;

            const itemsPayload = cart.map((item) => ({
                product_id: item.id.startsWith('custom-') ? null : item.id,
                quantity: item.quantity,
                name: item.name,
                price: item.price,
                modifiers: item.modifiers || [],
            }));

            const changeToRecord =
                paymentMethod === 'Cash' ? tendered - total : 0;

            setFinalChange(changeToRecord);
            setFinalTotal(total);

            const { data, error } = await supabase.rpc('complete_sale', {
                p_business_id: selectedBusiness.id,
                p_total_amount: total,
                p_payment_method: paymentMethod,
                p_cash_tendered: paymentMethod === 'Cash' ? tendered : total,
                p_change_amount: changeToRecord,
                p_staff_id: staffId,
                p_items: itemsPayload,
            });

            if (error) throw error;

            if (data && data.success === false) {
                throw new Error(data.message || 'Transaction failed');
            }

            console.log('complete_sale returned:', data);

            setCompletedOrderFields({
                order_uuid: data?.order_uuid || null,
                receipt_number: data?.receipt_number || null,
                daily_order_number: data?.daily_order_number || null,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSuccess(true);

            setTimeout(() => clearCart(), 100);
        } catch (error: any) {
            console.error('Payment Failed:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            let errorTitle = 'Transaction Failed';
            let friendlyMessage = error.message || 'An unknown error occurred.';

            if (
                error.code === '23514' ||
                friendlyMessage.includes('violates check constraint') ||
                friendlyMessage.toLowerCase().includes('stock')
            ) {
                errorTitle = 'Not Enough Stock';
                friendlyMessage =
                    'You cannot complete this order because one or more ingredients in the cart do not have enough stock left.';
            }

            Alert.alert(errorTitle, friendlyMessage, [
                {
                    text: 'Adjust Cart',
                    style: 'default',
                    onPress: () => {
                        onClose();
                    },
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintReceipt = () => {
        Haptics.impactAsync();
        Alert.alert('Print', 'Sending to printer...');
    };

    const handleEmailReceipt = async () => {
        const trimmedEmail = customerEmail.trim().toLowerCase();

        if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        if (!completedOrderFields?.order_uuid) {
            console.log('completedOrderFields:', completedOrderFields);

            Alert.alert(
                'Missing Order UUID',
                'The sale was completed, but the order UUID was not returned. Update your complete_sale RPC to return order_uuid.'
            );
            return;
        }

        try {
            setEmailSending(true);

            const { data, error } = await supabase.functions.invoke(
                'send-receipt-email',
                {
                    body: {
                        order_uuid: completedOrderFields.order_uuid,
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
                console.error('Checkout receipt email failed:', data);
                Alert.alert('Email Failed', data?.error || 'Could not send receipt.');
                return;
            }

            setEmailSentSuccess(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            setTimeout(() => {
                setShowEmailInput(false);
                setCustomerEmail('');
                setEmailSentSuccess(false);
                Alert.alert('Sent', `Receipt sent to ${trimmedEmail}`);
            }, 1000);
        } catch (e: any) {
            console.error('Checkout receipt email exception:', e);
            Alert.alert('Email Failed', e.message || 'Something went wrong.');
        } finally {
            setEmailSending(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={tw`flex-1 bg-slate-900/60 justify-center items-center px-5`}
            >
                <AnimatedModalContainer
                    visible={visible}
                    style={tw`w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl max-h-[90%] bg-slate-50`}
                >
                    <View
                        style={tw`px-6 py-5 border-b border-slate-100 flex-row justify-between items-center bg-white z-10`}
                    >
                        <View style={tw`w-10`}>
                            {step === 2 && !success && (
                                <Pressable
                                    onPress={handleBack}
                                    style={({ pressed }) => [
                                        tw`w-10 h-10 rounded-full bg-slate-50 border border-slate-200 items-center justify-center`,
                                        pressed && tw`scale-90 bg-slate-100`,
                                    ]}
                                >
                                    <ArrowLeft size={18} color="#475569" />
                                </Pressable>
                            )}
                        </View>

                        <Text
                            style={tw`text-[11px] font-black tracking-widest uppercase text-slate-400`}
                        >
                            {success
                                ? 'Transaction'
                                : step === 1
                                    ? 'Checkout'
                                    : `${paymentMethod} Payment`}
                        </Text>

                        <View style={tw`w-10 items-end`}>
                            {!success && (
                                <Pressable
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        onClose();
                                    }}
                                    style={({ pressed }) => [
                                        tw`w-10 h-10 rounded-full bg-slate-50 border border-slate-200 items-center justify-center`,
                                        pressed && tw`scale-90 bg-slate-100`,
                                    ]}
                                >
                                    <X size={18} color="#ef4444" />
                                </Pressable>
                            )}
                        </View>
                    </View>

                    <ScrollView
                        contentContainerStyle={tw`p-6`}
                        showsVerticalScrollIndicator={false}
                    >
                        {success ? (
                            <View style={tw`items-center w-full mt-2`}>
                                <View
                                    style={tw`w-24 h-24 bg-emerald-50 rounded-full items-center justify-center mb-6 border border-emerald-100 shadow-sm`}
                                >
                                    <CheckCircle size={48} color="#10b981" />
                                </View>

                                <Text
                                    style={tw`text-3xl font-black mb-1 text-slate-900 tracking-tighter`}
                                >
                                    Success!
                                </Text>

                                {completedOrderFields?.daily_order_number != null && (
                                    <Text
                                        style={tw`text-3xl font-black mt-2 mb-1 text-indigo-600 tracking-tight`}
                                    >
                                        Order{' '}
                                        {formatBusinessDayOrderNumber(
                                            completedOrderFields.daily_order_number
                                        )}
                                    </Text>
                                )}

                                {completedOrderFields?.receipt_number && (
                                    <View
                                        style={tw`bg-slate-100 border border-slate-200 px-4 py-1.5 rounded-full mb-4 mt-3`}
                                    >
                                        <Text
                                            style={tw`text-[10px] font-black text-slate-500 uppercase tracking-widest`}
                                        >
                                            {formatReceiptLabel(
                                                completedOrderFields.receipt_number
                                            )}
                                        </Text>
                                    </View>
                                )}

                                <Text
                                    style={tw`text-[10px] font-black tracking-widest mb-8 mt-2 text-slate-300 uppercase`}
                                >
                                    {new Date().toLocaleString()}
                                </Text>

                                <View
                                    style={tw`w-full rounded-3xl border border-slate-100 bg-white overflow-hidden mb-8 shadow-sm`}
                                >
                                    <View
                                        style={tw`p-6 border-b border-slate-50 flex-row justify-between items-center bg-slate-50/50`}
                                    >
                                        <Text
                                            style={tw`text-slate-400 font-black uppercase tracking-widest text-[10px]`}
                                        >
                                            Total Paid
                                        </Text>
                                        <Text
                                            style={tw`text-2xl font-black text-slate-900 tracking-tight`}
                                        >
                                            R {finalTotal.toFixed(2)}
                                        </Text>
                                    </View>

                                    {paymentMethod === 'Cash' && (
                                        <View
                                            style={tw`p-6 flex-row justify-between items-center bg-white`}
                                        >
                                            <View>
                                                <Text
                                                    style={tw`text-[10px] font-black uppercase tracking-widest mb-1 text-slate-400`}
                                                >
                                                    Change Due
                                                </Text>
                                                <Text
                                                    style={tw`text-[10px] text-emerald-600 font-black uppercase tracking-wider`}
                                                >
                                                    Return to customer
                                                </Text>
                                            </View>
                                            <Text
                                                style={tw`text-4xl font-black text-emerald-600 tracking-tighter`}
                                            >
                                                R {finalChange.toFixed(2)}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View style={tw`w-full gap-3`}>
                                    <View style={tw`flex-row gap-3`}>
                                        <Pressable
                                            onPress={handlePrintReceipt}
                                            style={({ pressed }) => [
                                                tw`flex-1 h-14 rounded-2xl items-center justify-center border border-slate-200 bg-white shadow-sm flex-row gap-2`,
                                                pressed && tw`scale-95 bg-slate-50`,
                                            ]}
                                        >
                                            <Printer size={18} color="#64748b" />
                                            <Text
                                                style={tw`font-black text-slate-600 uppercase tracking-widest text-[11px]`}
                                            >
                                                Print
                                            </Text>
                                        </Pressable>

                                        <Pressable
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                Alert.alert('Coming Soon', 'Email receipts are being finalized and will be available shortly.');
                                            }}
                                            style={({ pressed }) => [
                                                tw`flex-1 h-14 rounded-2xl items-center justify-center border border-slate-200 bg-white shadow-sm flex-row gap-2`,
                                                pressed && tw`scale-95 bg-slate-50`,
                                            ]}
                                        >
                                            <Mail
                                                size={18}
                                                color={showEmailInput ? '#4f46e5' : '#64748b'}
                                            />
                                            <Text
                                                style={tw`font-black uppercase tracking-widest text-[11px] ${showEmailInput
                                                        ? 'text-indigo-600'
                                                        : 'text-slate-600'
                                                    }`}
                                            >
                                                Email
                                            </Text>
                                        </Pressable>
                                    </View>

                                    {showEmailInput && (
                                        <View
                                            style={tw`flex-row gap-2 p-2 rounded-2xl border border-slate-200 bg-white shadow-sm`}
                                        >
                                            <TextInput
                                                placeholder="customer@email.com"
                                                placeholderTextColor="#94a3b8"
                                                value={customerEmail}
                                                onChangeText={setCustomerEmail}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                style={tw`flex-1 px-4 py-2 font-bold h-12 text-slate-900 bg-slate-50 rounded-xl`}
                                            />

                                            <Pressable
                                                onPress={handleEmailReceipt}
                                                disabled={emailSending || emailSentSuccess}
                                                style={({ pressed }) => [
                                                    tw`w-14 rounded-xl flex-row items-center justify-center bg-indigo-600`,
                                                    pressed &&
                                                    !emailSending &&
                                                    !emailSentSuccess &&
                                                    tw`scale-95 bg-indigo-700`,
                                                    emailSentSuccess && tw`bg-emerald-500`,
                                                    (emailSending || emailSentSuccess) && tw`opacity-90`,
                                                ]}
                                            >
                                                {emailSending ? (
                                                    <ActivityIndicator color="white" size="small" />
                                                ) : emailSentSuccess ? (
                                                    <CheckCircle size={18} color="white" />
                                                ) : (
                                                    <Send size={18} color="white" />
                                                )}
                                            </Pressable>
                                        </View>
                                    )}

                                    <Pressable
                                        onPress={onClose}
                                        style={({ pressed }) => [
                                            tw`w-full h-18 rounded-2xl items-center justify-center mt-3 shadow-md bg-indigo-600`,
                                            pressed && tw`scale-95 bg-indigo-700 shadow-none`,
                                        ]}
                                    >
                                        <Text
                                            style={tw`text-white font-black text-lg uppercase tracking-widest`}
                                        >
                                            Next Sale
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        ) : step === 1 ? (
                            <View style={tw`flex-1 justify-between min-h-[420px]`}>
                                <View style={tw`items-center justify-center py-10`}>
                                    <Text
                                        style={tw`text-[11px] font-black uppercase tracking-widest mb-4 text-slate-400`}
                                    >
                                        Grand Total Due
                                    </Text>

                                    <View style={tw`flex-row items-baseline`}>
                                        <Text
                                            style={tw`text-4xl font-black mr-2 text-slate-300 mb-2`}
                                        >
                                            R
                                        </Text>
                                        <Text
                                            style={tw`text-7xl font-black tracking-tighter text-slate-900`}
                                        >
                                            {total.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={tw`gap-4`}>
                                    <Pressable
                                        onPress={() => handleMethodSelect('Cash')}
                                        style={({ pressed }) => [
                                            tw`p-5 rounded-[32px] flex-row items-center gap-6 border border-slate-100 bg-white shadow-sm`,
                                            pressed && tw`scale-95 bg-slate-50`,
                                        ]}
                                    >
                                        <View
                                            style={tw`w-16 h-16 rounded-2xl items-center justify-center bg-emerald-50 border border-emerald-100 shadow-sm`}
                                        >
                                            <Banknote size={32} color="#10b981" />
                                        </View>

                                        <View>
                                            <Text
                                                style={tw`text-xl font-black text-slate-900 tracking-tight`}
                                            >
                                                Cash Payment
                                            </Text>
                                            <Text style={tw`text-sm font-bold text-slate-400`}>
                                                Banknotes & Coins
                                            </Text>
                                        </View>
                                    </Pressable>

                                    <Pressable
                                        onPress={() => handleMethodSelect('Card')}
                                        style={({ pressed }) => [
                                            tw`p-5 rounded-[32px] flex-row items-center gap-6 border border-slate-100 bg-white shadow-sm`,
                                            pressed && tw`scale-95 bg-slate-50`,
                                        ]}
                                    >
                                        <View
                                            style={tw`w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl items-center justify-center shadow-sm`}
                                        >
                                            <CreditCard size={32} color="#4f46e5" />
                                        </View>

                                        <View>
                                            <Text
                                                style={tw`text-xl font-black text-slate-900 tracking-tight`}
                                            >
                                                Card Terminal
                                            </Text>
                                            <Text style={tw`text-sm font-bold text-slate-400`}>
                                                External / Bluetooth
                                            </Text>
                                        </View>
                                    </Pressable>
                                </View>
                            </View>
                        ) : (
                            <View style={tw`flex-1 justify-between min-h-[400px]`}>
                                {paymentMethod === 'Cash' ? (
                                    <View>
                                        <View
                                            style={tw`items-center mb-8 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm`}
                                        >
                                            <Text
                                                style={tw`text-xs font-bold uppercase tracking-widest text-slate-400 mb-1`}
                                            >
                                                Total Due
                                            </Text>
                                            <Text style={tw`text-4xl font-black text-slate-900`}>
                                                R {total.toFixed(2)}
                                            </Text>
                                        </View>

                                        <View
                                            style={tw`flex-row items-center rounded-2xl border-2 px-6 h-28 mb-6 bg-white shadow-sm ${isSufficient
                                                    ? 'border-emerald-500 bg-emerald-50'
                                                    : 'border-slate-200'
                                                }`}
                                        >
                                            <Text
                                                style={tw`text-5xl font-black mr-4 text-slate-300`}
                                            >
                                                R
                                            </Text>

                                            <TextInput
                                                style={tw`flex-1 text-6xl font-black h-full text-slate-900 -mt-2`}
                                                keyboardType="numeric"
                                                value={amountTendered}
                                                onChangeText={setAmountTendered}
                                                placeholder="0.00"
                                                placeholderTextColor="#cbd5e1"
                                                autoFocus
                                            />
                                        </View>

                                        <View style={tw`flex-row justify-between gap-3 mb-8`}>
                                            {[10, 20, 50, 100].map((amt) => (
                                                <Pressable
                                                    key={amt}
                                                    onPress={() => addCash(amt)}
                                                    style={({ pressed }) => [
                                                        tw`flex-1 h-14 rounded-2xl items-center justify-center border border-slate-200 bg-white shadow-sm`,
                                                        pressed && tw`scale-95 bg-slate-50`,
                                                    ]}
                                                >
                                                    <Text style={tw`text-slate-700 font-black text-lg`}>
                                                        +{amt}
                                                    </Text>
                                                </Pressable>
                                            ))}

                                            <Pressable
                                                onPress={setExact}
                                                style={({ pressed }) => [
                                                    tw`flex-1 h-14 rounded-2xl items-center justify-center border border-indigo-200 bg-indigo-50 shadow-sm`,
                                                    pressed && tw`scale-95 bg-indigo-100`,
                                                ]}
                                            >
                                                <Text
                                                    style={tw`text-indigo-600 font-bold uppercase tracking-wider text-xs`}
                                                >
                                                    Exact
                                                </Text>
                                            </Pressable>
                                        </View>

                                        <View
                                            style={tw`p-5 rounded-2xl border items-center flex-row justify-between px-6 bg-white shadow-sm border-slate-200`}
                                        >
                                            <Text
                                                style={tw`text-slate-500 font-bold uppercase tracking-wider text-xs`}
                                            >
                                                Change
                                            </Text>

                                            <Text
                                                style={tw`text-3xl font-black ${currentDiff < 0 ? 'text-red-500' : 'text-indigo-600'
                                                    }`}
                                            >
                                                R {currentDiff < 0 ? '0.00' : currentDiff.toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View
                                        style={tw`flex-1 items-center justify-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm`}
                                    >
                                        <View
                                            style={tw`w-32 h-32 bg-indigo-50 rounded-full items-center justify-center mb-8 border border-indigo-100`}
                                        >
                                            <CreditCard size={64} color="#4f46e5" />
                                        </View>

                                        <Text
                                            style={tw`text-3xl font-black mb-4 text-slate-900 tracking-tight`}
                                        >
                                            Use Card Machine
                                        </Text>

                                        <Text
                                            style={tw`text-center font-medium leading-6 text-slate-500 text-lg`}
                                        >
                                            Process{' '}
                                            <Text style={tw`text-indigo-600 font-black`}>
                                                R {total.toFixed(2)}
                                            </Text>{' '}
                                            on your terminal.
                                        </Text>
                                    </View>
                                )}

                                <View style={tw`gap-3 mt-auto pt-8`}>
                                    <Pressable
                                        onPress={handlePayment}
                                        disabled={
                                            (!isSufficient && paymentMethod === 'Cash') || loading
                                        }
                                        style={({ pressed }) => [
                                            tw`w-full h-18 rounded-2xl items-center justify-center shadow-lg`,
                                            (!isSufficient && paymentMethod === 'Cash') || loading
                                                ? tw`bg-slate-200 opacity-60 shadow-none`
                                                : tw`bg-indigo-600`,
                                            pressed &&
                                            isSufficient &&
                                            !loading &&
                                            tw`scale-95 bg-indigo-700 shadow-none`,
                                        ]}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text
                                                style={tw`text-white font-black text-lg uppercase tracking-widest`}
                                            >
                                                {paymentMethod === 'Cash'
                                                    ? tendered < total
                                                        ? `Short by R${(total - tendered).toFixed(2)}`
                                                        : 'Complete Order'
                                                    : 'Transaction Success'}
                                            </Text>
                                        )}
                                    </Pressable>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </AnimatedModalContainer>
            </KeyboardAvoidingView>
        </Modal>
    );
}