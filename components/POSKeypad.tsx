import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import tw from 'twrnc';
import * as Haptics from 'expo-haptics';
import { Delete, Plus } from 'lucide-react-native';

interface Props {
    amount: string;
    onAmountChange: (amount: string) => void;
    onAdd: () => void;
}

export default function POSKeypad({ amount, onAmountChange, onAdd }: Props) {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    
    const handlePress = (val: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (amount === '0') {
            if (val === '0') return;
            if (val === '.') {
                onAmountChange('0.');
                return;
            }
            onAmountChange(val);
        } else {
            // Prevent multiple decimals
            if (val === '.' && amount.includes('.')) return;
            
            // Prevent more than 2 decimal places
            if (amount.includes('.')) {
                const parts = amount.split('.');
                if (parts[1].length >= 2) return;
            }

            // Prevent absurdly long amounts
            if (amount.length > 8) return;
            onAmountChange(amount + val);
        }
    };

    const handleDelete = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (amount.length <= 1) {
            onAmountChange('0');
        } else {
            onAmountChange(amount.slice(0, -1));
        }
    };

    const handleClear = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onAmountChange('0');
    };

    // Format amount as currency (assumes amount represents cents if you want implied decimal, 
    // but typically POS keypads enter Rands, and you can add a '.' button or just whole rands).
    // Let's assume they are typing whole rands for simplicity, or we can format it.
    // Actually, a simpler approach for a quick-add keypad: 
    // They type exactly what they see. If they type '50', it's 50.
    
    const numPad = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['Clear', '0', '.']
    ];

    return (
        <View style={tw`flex-1 items-center justify-center p-4 max-w-md mx-auto w-full`}>
            {/* Display */}
            <View style={tw`w-full bg-white border border-slate-200 rounded-3xl p-6 mb-8 shadow-sm items-center`}>
                <Text style={tw`text-slate-400 font-bold uppercase tracking-widest text-xs mb-2`}>Custom Amount</Text>
                <View style={tw`flex-row items-baseline`}>
                    <Text style={tw`text-4xl font-black text-slate-300 mr-2`}>R</Text>
                    <Text style={tw`text-7xl font-black text-slate-900 tracking-tighter`} numberOfLines={1} adjustsFontSizeToFit>
                        {amount}
                    </Text>
                </View>
            </View>

            {/* Keypad */}
            <View style={tw`w-full gap-3 mb-8`}>
                {numPad.map((row, rowIndex) => (
                    <View key={rowIndex} style={tw`flex-row gap-3`}>
                        {row.map((key) => {
                            const isClear = key === 'Clear';
                            return (
                                <Pressable
                                    key={key}
                                    onPress={() => isClear ? handleClear() : handlePress(key)}
                                    style={({ pressed }) => [
                                        tw`flex-1 h-20 rounded-2xl items-center justify-center border shadow-sm transition-all`,
                                        isClear ? tw`bg-slate-100 border-slate-200` : tw`bg-white border-slate-200`,
                                        pressed && (isClear ? tw`scale-95 bg-slate-200` : tw`scale-95 bg-slate-50`)
                                    ]}
                                >
                                    <Text style={[tw`font-black`, isClear ? tw`text-lg text-slate-500 uppercase tracking-widest` : tw`text-3xl text-slate-800`]}>
                                        {key}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                ))}
            </View>

            {/* Actions */}
            <View style={tw`flex-row w-full gap-3`}>
                <Pressable
                    onPress={handleDelete}
                    style={({ pressed }) => [
                        tw`h-20 w-24 rounded-2xl bg-white border border-slate-200 shadow-sm items-center justify-center transition-all`,
                        pressed && tw`scale-95 bg-slate-50`
                    ]}
                >
                    <Delete size={28} color="#64748b" />
                </Pressable>

                <Pressable
                    onPress={() => {
                        if (amount !== '0' && amount !== '') {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            onAdd();
                        } else {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        }
                    }}
                    style={({ pressed }) => [
                        tw`flex-1 h-20 rounded-2xl bg-indigo-600 shadow-md items-center justify-center flex-row gap-2 transition-all`,
                        pressed && tw`scale-95 bg-indigo-700 shadow-none`
                    ]}
                >
                    <Plus size={24} color="white" />
                    <Text style={tw`text-white font-black text-xl tracking-widest uppercase`}>Add to Cart</Text>
                </Pressable>
            </View>
        </View>
    );
}
