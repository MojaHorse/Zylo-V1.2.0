import React from 'react';
import { View, Text, Pressable, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import tw from 'twrnc';
import { ArrowLeft, Store } from 'lucide-react-native';
import { useLoginLogic } from '../../hooks/useLoginLogic';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const BUTTON_SIZE = width / 4.5;

export default function LoginScreenMobile() {
    const { 
        step, 
        staffId, 
        pin, 
        loading, 
        selectedBusiness, 
        handlePress, 
        handleDelete, 
        handleSwitchBusiness, 
        resetStep 
    } = useLoginLogic();

    const keypadRows = [
        ['1', '2', '3'], 
        ['4', '5', '6'], 
        ['7', '8', '9']
    ];

    const onKeyPress = (num: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handlePress(num);
    };

    const onDelete = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handleDelete();
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-slate-50`}>
            <StatusBar style="dark" />
            
            {/* --- HEADER ACTIONS --- */}
            <View style={tw`px-6 pt-4 flex-row justify-between items-center z-10`}>
                <Pressable 
                    onPress={() => {
                        Haptics.selectionAsync();
                        step === 1 ? handleSwitchBusiness() : resetStep();
                    }} 
                    style={({ pressed }) => [
                        tw`flex-row items-center bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm transition-all`,
                        pressed && tw`bg-slate-50 scale-95`
                    ]}
                >
                    <ArrowLeft color="#64748b" size={16} />
                    <Text style={tw`text-slate-600 font-bold ml-2 text-xs`}>
                        {step === 1 ? 'Switch Shop' : 'Back'}
                    </Text>
                </Pressable>

                {/* Shop Badge */}
                <View style={tw`flex-row items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100`}>
                    <Store size={14} color="#4338ca" />
                    <Text style={tw`text-indigo-700 font-bold text-xs uppercase tracking-wider`}>
                        {selectedBusiness?.name || 'Loading...'}
                    </Text>
                </View>
            </View>

            {/* --- MAIN CONTENT (Logo + Dots) --- */}
            <View style={tw`flex-1 justify-center items-center gap-6`}>
                
                <View style={tw`items-center gap-2`}>
                    <Text style={tw`text-indigo-600 uppercase tracking-widest text-xs font-bold`}>
                        {step === 1 ? 'Authentication' : 'Security Check'}
                    </Text>
                    <Text style={tw`text-slate-900 text-3xl font-black tracking-tight`}>
                        {step === 1 ? 'Enter Staff ID' : 'Enter PIN'}
                    </Text>
                </View>

                {/* Input Dots / Preview */}
                <View style={tw`h-12 justify-center items-center`}>
                    {step === 1 ? (
                        <Text style={tw`text-slate-900 text-4xl font-black tracking-[0.5em]`}>
                            {staffId || '______'}
                        </Text>
                    ) : (
                        <View style={tw`flex-row gap-4`}>
                            {[...Array(4)].map((_, i) => (
                                <View 
                                    key={i} 
                                    style={tw`w-4 h-4 rounded-full ${i < pin.length ? 'bg-indigo-600 scale-125' : 'bg-slate-200'} transition-all`} 
                                />
                            ))}
                        </View>
                    )}
                </View>
            </View>

            {/* --- KEYPAD SECTION --- */}
            <View style={tw`px-8 pb-10 items-center justify-end`}>
                <View style={tw`gap-y-4`}>
                    {keypadRows.map((row, i) => (
                        <View key={i} style={tw`flex-row gap-4`}>
                            {row.map((num) => (
                                <Pressable 
                                    key={num} 
                                    onPress={() => onKeyPress(num)} 
                                    disabled={loading} 
                                    style={({ pressed }) => [
                                        tw`items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-all`,
                                        { width: BUTTON_SIZE, height: BUTTON_SIZE },
                                        pressed && tw`bg-indigo-50 border-indigo-200 scale-95 shadow-none`
                                    ]}
                                >
                                    <Text style={tw`text-slate-800 text-3xl font-semibold`}>{num}</Text>
                                </Pressable>
                            ))}
                        </View>
                    ))}
                    
                    {/* Bottom Row */}
                    <View style={tw`flex-row gap-4`}>
                        <Pressable 
                            onPress={() => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                Alert.alert(
                                    step === 1 ? 'Forgot ID?' : 'Forgot PIN?', 
                                    'Please ask your manager to check or reset your credentials.'
                                );
                            }}
                            style={({ pressed }) => [
                                tw`items-center justify-center rounded-full transition-all`,
                                { width: BUTTON_SIZE, height: BUTTON_SIZE },
                                pressed && tw`bg-slate-100 scale-95`
                            ]}
                        >
                            <Text style={tw`text-slate-400 text-sm font-bold text-center`}>{step === 1 ? 'Forgot\nID?' : 'Forgot\nPIN?'}</Text>
                        </Pressable>
                        
                        <Pressable 
                            onPress={() => onKeyPress('0')} 
                            disabled={loading} 
                            style={({ pressed }) => [
                                tw`items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-all`,
                                { width: BUTTON_SIZE, height: BUTTON_SIZE },
                                pressed && tw`bg-indigo-50 border-indigo-200 scale-95 shadow-none`
                            ]}
                        >
                            <Text style={tw`text-slate-800 text-3xl font-semibold`}>0</Text>
                        </Pressable>

                        <Pressable 
                            onPress={onDelete} 
                            disabled={loading} 
                            style={({ pressed }) => [
                                tw`items-center justify-center rounded-full transition-all`,
                                { width: BUTTON_SIZE, height: BUTTON_SIZE },
                                pressed && tw`bg-red-50 scale-95 border border-red-100`
                            ]}
                        >
                            <Text style={tw`text-red-500 text-lg font-bold`}>DEL</Text>
                        </Pressable>
                    </View>
                </View>

                {loading && (
                    <View style={tw`absolute inset-0 justify-center items-center`}>
                        <View style={tw`bg-white/80 absolute inset-0`} />
                        <ActivityIndicator size="large" color="#4f46e5" />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}