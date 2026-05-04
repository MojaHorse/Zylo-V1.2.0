import React from 'react';
import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import tw from 'twrnc';
import { ArrowLeft, Store } from 'lucide-react-native';
import { useLoginLogic } from '../../hooks/useLoginLogic';
import * as Haptics from 'expo-haptics';

export default function LoginScreenTablet() {
    const { step, staffId, pin, loading, selectedBusiness, handlePress, handleDelete, handleSwitchBusiness, resetStep } = useLoginLogic();
    const keypadRows = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']];

    const onKeyPress = (num: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handlePress(num);
    };

    const onDelete = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handleDelete();
    };

    return (
        <View style={tw`flex-1 bg-slate-50 flex-row`}>
            <StatusBar style="dark" />
            
            {/* Left: Info */}
            <View style={tw`flex-1 bg-white border-r border-slate-200 items-center justify-center p-12 shadow-sm z-10`}>
                <Image source={require('../../../assets/Full_Logo.png')} style={tw`w-64 h-64 mb-10`} resizeMode="contain" />
                <View style={tw`w-full max-w-xs`}>
                    <Text style={tw`text-indigo-600 font-bold uppercase tracking-widest text-xs mb-2`}>{step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}</Text>
                    <Text style={tw`text-slate-900 text-5xl font-black mb-4 tracking-tight`}>{step === 1 ? 'Staff ID' : 'Enter PIN'}</Text>
                    
                    <View style={tw`bg-slate-50 p-4 rounded-2xl border border-slate-200 flex-row items-center gap-4`}>
                        <View style={tw`bg-indigo-100 p-2.5 rounded-full`}><Store size={24} color="#4338ca" /></View>
                        <View>
                            <Text style={tw`text-slate-500 text-xs uppercase font-bold tracking-wider`}>Current Shop</Text>
                            <Text style={tw`text-slate-900 font-black text-lg`}>{selectedBusiness?.name}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Right: Keypad */}
            <View style={tw`flex-1 items-center justify-center bg-slate-50 relative`}>
                <Pressable 
                    onPress={() => {
                        Haptics.selectionAsync();
                        step === 1 ? handleSwitchBusiness() : resetStep();
                    }} 
                    style={({ pressed }) => [
                        tw`absolute top-10 left-10 flex-row items-center gap-2 p-3 rounded-full transition-all`,
                        pressed && tw`bg-slate-200 scale-95`
                    ]}
                >
                    <ArrowLeft color="#64748b" size={24} />
                    <Text style={tw`text-slate-600 font-bold text-lg`}>{step === 1 ? 'Switch Shop' : 'Back to ID'}</Text>
                </Pressable>

                <View style={tw`mb-12 items-center h-24 justify-center`}>
                     <View style={tw`flex-row gap-6`}>
                         {[...Array(step === 1 ? 6 : 4)].map((_, i) => (
                             <View key={i} style={tw`w-5 h-5 rounded-full ${i < (step === 1 ? staffId.length : pin.length) ? 'bg-indigo-600 scale-110' : 'bg-slate-200'} transition-all`} />
                         ))}
                     </View>
                     <Text style={tw`text-slate-900 text-4xl font-black mt-6 tracking-[0.5em] h-12`}>{step === 1 ? staffId : ''}</Text>
                </View>

                <View style={tw`w-[360px] gap-y-6`}>
                    {keypadRows.map((row, i) => (
                        <View key={i} style={tw`flex-row justify-between w-full`}>
                            {row.map((num) => (
                                <Pressable 
                                    key={num} 
                                    onPress={() => onKeyPress(num)} 
                                    disabled={loading} 
                                    style={({ pressed }) => [
                                        tw`w-24 h-24 rounded-full items-center justify-center border border-slate-200 bg-white shadow-sm transition-all`,
                                        pressed && tw`bg-indigo-50 border-indigo-200 scale-95 shadow-none`
                                    ]}
                                >
                                    <Text style={tw`text-slate-800 text-4xl font-semibold`}>{num}</Text>
                                </Pressable>
                            ))}
                        </View>
                    ))}
                    <View style={tw`flex-row justify-between w-full`}>
                        <View style={tw`w-24 h-24`} />
                        <Pressable 
                            onPress={() => onKeyPress('0')} 
                            disabled={loading} 
                            style={({ pressed }) => [
                                tw`w-24 h-24 rounded-full items-center justify-center border border-slate-200 bg-white shadow-sm transition-all`,
                                pressed && tw`bg-indigo-50 border-indigo-200 scale-95 shadow-none`
                            ]}
                        >
                            <Text style={tw`text-slate-800 text-4xl font-semibold`}>0</Text>
                        </Pressable>
                        <Pressable 
                            onPress={onDelete} 
                            disabled={loading} 
                            style={({ pressed }) => [
                                tw`w-24 h-24 rounded-full items-center justify-center transition-all`,
                                pressed && tw`bg-red-50 scale-95 border border-red-100`
                            ]}
                        >
                            <Text style={tw`text-red-500 text-xl font-bold`}>DEL</Text>
                        </Pressable>
                    </View>
                </View>
                {loading && <ActivityIndicator style={tw`absolute bottom-10`} size="large" color="#4f46e5" />}
            </View>
        </View>
    );
}