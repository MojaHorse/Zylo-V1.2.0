import React from 'react';
import { 
    View, Text, TextInput, ActivityIndicator, 
    KeyboardAvoidingView, Platform, ScrollView, Pressable
} from 'react-native';
import tw from 'twrnc';
import { Wallet, ArrowRight, Lock, Clock, History } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// Import our new separate logic hook
import { useStartShift } from '../../hooks/useStartShift';

export default function StartShiftScreen() {
    // 👇 The logic lives here now
    const { floatAmount, setFloatAmount, loading, checkingStatus, existingShift, startShift, continueShift } = useStartShift();

    if (checkingStatus) {
        return (
            <View style={tw`flex-1 bg-slate-50 items-center justify-center`}>
                <ActivityIndicator color="#4f46e5" size="large" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={tw`flex-1 bg-slate-50`}
        >
            <ScrollView 
                contentContainerStyle={tw`flex-grow justify-center p-8`} 
                keyboardShouldPersistTaps="handled"
            >
                {/* RESPONSIVE CONTAINER */}
                <View style={tw`w-full max-w-[450px] self-center`}>
                    
                    {/* HEADER */}
                    <View style={tw`items-center mb-10`}>
                        <View style={tw`bg-indigo-50 w-24 h-24 rounded-[2rem] items-center justify-center border border-indigo-100 mb-6 shadow-sm`}>
                            <Wallet size={48} color="#4338ca" />
                        </View>
                        <Text style={tw`text-slate-900 text-4xl font-black mb-2 text-center tracking-tight`}>Start Shift</Text>
                        <Text style={tw`text-slate-500 text-lg text-center font-medium leading-6`}>
                            Count the cash in the drawer before you begin selling.
                        </Text>
                    </View>

                    {existingShift ? (
                        <View style={tw`bg-white p-8 rounded-3xl border border-slate-200 shadow-sm items-center`}>
                            <View style={tw`bg-amber-50 p-4 rounded-full mb-4`}>
                                <History size={32} color="#d97706" />
                            </View>
                            <Text style={tw`text-slate-800 text-xl font-bold mb-2 text-center`}>Open Shift Found</Text>
                            <Text style={tw`text-slate-500 text-center mb-6 leading-5`}>
                                You already have a shift that was opened on{'\n'}
                                <Text style={tw`font-bold text-slate-700`}>
                                    {new Date(existingShift.opened_at).toLocaleDateString()} at {new Date(existingShift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </Text>

                            <Pressable
                                onPress={continueShift}
                                style={({ pressed }) => [
                                    tw`bg-indigo-600 w-full p-5 rounded-2xl flex-row items-center justify-center gap-3 shadow-sm transition-all`,
                                    pressed && tw`scale-95 bg-indigo-700 shadow-none`
                                ]}
                            >
                                <ArrowRight size={20} color="white" />
                                <Text style={tw`text-white font-bold text-lg`}>Continue Shift</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <>
                            {/* INPUT CARD */}
                            <View style={tw`bg-white p-8 rounded-3xl border border-slate-200 shadow-sm`}>
                                <Text style={tw`text-slate-400 text-xs uppercase font-bold mb-4 tracking-widest`}>Opening Float Amount (R)</Text>
                                
                                <View style={tw`flex-row items-center border-b-2 border-slate-100 mb-4 pb-2`}>
                                    <Text style={tw`text-slate-300 text-5xl font-black mr-2`}>R</Text>
                                    <TextInput
                                        style={tw`text-slate-900 text-6xl font-black flex-1 -mt-1`}
                                        placeholder="0"
                                        placeholderTextColor="#cbd5e1"
                                        keyboardType="numeric"
                                        value={floatAmount}
                                        onChangeText={setFloatAmount}
                                        autoFocus
                                    />
                                </View>
                                
                                <Text style={tw`text-slate-500 text-sm font-medium`}>
                                    Check for coins and small notes.
                                </Text>
                            </View>

                            {/* ACTION BUTTON */}
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync();
                                    startShift();
                                }}
                                disabled={loading}
                                style={({ pressed }) => [
                                    tw`bg-indigo-600 mt-8 p-5 rounded-2xl flex-row items-center justify-center gap-3 shadow-sm transition-all`,
                                    pressed && !loading && tw`scale-95 bg-indigo-700 shadow-none`,
                                    loading && tw`opacity-70`
                                ]}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Lock size={20} color="white" />
                                        <Text style={tw`text-white font-bold text-lg`}>Confirm & Open Register</Text>
                                        <ArrowRight size={20} color="white" />
                                    </>
                                )}
                            </Pressable>
                        </>
                    )}

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}