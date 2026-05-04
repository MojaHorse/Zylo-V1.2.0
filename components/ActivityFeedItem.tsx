import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import { CreditCard, Banknote } from 'lucide-react-native';
import { formatBusinessDayOrderNumber } from '../src/utils/formatters';

interface Props {
    orderId: string;
    amount: number;
    paymentMethod: string;
    date: string;
    dailyOrderNumber?: number | null;
}

export default function ActivityFeedItem({ orderId, amount, paymentMethod, date, dailyOrderNumber }: Props) {
    const isCard = paymentMethod === 'Card';
    const PayIcon = isCard ? CreditCard : Banknote;
    const timeString = new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const orderLabel = dailyOrderNumber
        ? `Order ${formatBusinessDayOrderNumber(dailyOrderNumber)}`
        : `#${orderId.toString().slice(-6)}`;

    return (
        <View style={tw`flex-row justify-between items-center py-3 border-b border-slate-100`}>
            <View style={tw`flex-row items-center gap-3`}>
                <View style={tw`w-10 h-10 rounded-xl items-center justify-center ${isCard ? 'bg-blue-50 border border-blue-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                    <PayIcon size={18} color={isCard ? '#3b82f6' : '#10b981'} />
                </View>
                <View>
                    <Text style={tw`text-sm font-bold text-slate-900`}>
                        {orderLabel}
                    </Text>
                    <Text style={tw`text-[11px] font-medium text-slate-400`}>
                        {timeString} • {paymentMethod}
                    </Text>
                </View>
            </View>
            <Text style={tw`font-black text-base text-slate-900`}>
                R {Number(amount).toFixed(2)}
            </Text>
        </View>
    );
}