import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: string; // Hex code (e.g. #84cc16)
    subText?: string;
    width?: string; // Tailwind width class (e.g. 'w-[48%]')
}

export default function StatCard({ title, value, icon: Icon, color, subText, width = 'w-[32%]' }: StatCardProps) {
    return (
        <View style={[
            tw`${width} p-5 rounded-2xl border shadow-sm mb-4`,
            tw`bg-white border-slate-100`
        ]}>
            <View style={tw`flex-row justify-between items-start mb-4`}>
                <View style={[tw`p-3 rounded-full`, { backgroundColor: color + '1A' }]}>
                    <Icon size={24} color={color} />
                </View>
                {subText && (
                    <View style={tw`px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200`}>
                        <Text style={tw`text-[10px] font-bold text-slate-500 uppercase tracking-wider`}>{subText}</Text>
                    </View>
                )}
            </View>
            <Text style={tw`text-xs font-bold uppercase tracking-wider mb-1 text-slate-500`}>{title}</Text>
            <Text style={tw`text-3xl font-black text-slate-900 tracking-tight`}>{value}</Text>
        </View>
    );
}