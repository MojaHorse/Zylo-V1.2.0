import React from 'react';
import { 
    View, Text, TextInput, ActivityIndicator, 
    KeyboardAvoidingView, Platform, ScrollView, Pressable 
} from 'react-native';
import tw from 'twrnc';
import { ShieldCheck, Banknote, CreditCard, LogOut } from 'lucide-react-native';
import { useCashUp } from '../../hooks/useCashUp'; // Import logic
import * as Haptics from 'expo-haptics';

export default function CashUpScreen() {
    const { 
        loading, submitting, 
        declaredCash, setDeclaredCash, 
        declaredCard, setDeclaredCard, 
        notes, setNotes, 
        closeShift 
    } = useCashUp();

    if (loading) {
        return (
            <View style={tw`flex-1 bg-slate-50 items-center justify-center`}>
                <ActivityIndicator color="#4f46e5" size="large" />
                <Text style={tw`text-slate-500 font-medium mt-4`}>Calculating Totals...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={tw`flex-1 bg-slate-50`}
        >
            <ScrollView contentContainerStyle={tw`p-6 pb-20`}>
                <View style={tw`w-full max-w-[500px] self-center`}>
                    
                    {/* Header */}
                    <View style={tw`items-center mb-8 mt-6`}>
                        <View style={tw`bg-red-50 w-24 h-24 rounded-[2rem] items-center justify-center border border-red-100 mb-6 shadow-sm`}>
                            <ShieldCheck size={48} color="#ef4444" />
                        </View>
                        <Text style={tw`text-slate-900 text-4xl font-black tracking-tight`}>End Shift</Text>
                        <Text style={tw`text-slate-500 font-medium text-center mt-2 leading-6 text-lg`}>
                            Count your money. Do not guess.{"\n"}Once you submit, you cannot change it.
                        </Text>
                    </View>

                    {/* Cash Input */}
                    <View style={tw`bg-white p-6 rounded-3xl border border-slate-200 mb-4 shadow-sm`}>
                        <View style={tw`flex-row items-center gap-3 mb-4`}>
                            <View style={tw`p-2 bg-emerald-50 rounded-xl`}>
                                <Banknote color="#10b981" size={24} />
                            </View>
                            <Text style={tw`text-slate-900 font-black text-xl tracking-tight`}>Cash in Drawer</Text>
                        </View>
                        <Text style={tw`text-slate-400 text-xs uppercase font-bold mb-2 tracking-widest`}>Total Count (R)</Text>
                        <TextInput
                            style={tw`bg-slate-50 text-slate-900 text-4xl font-black p-4 rounded-xl border border-slate-200 text-right`}
                            placeholder="0.00"
                            placeholderTextColor="#cbd5e1"
                            keyboardType="numeric"
                            value={declaredCash}
                            onChangeText={setDeclaredCash}
                        />
                    </View>

                    {/* Card Input */}
                    <View style={tw`bg-white p-6 rounded-3xl border border-slate-200 mb-6 shadow-sm`}>
                        <View style={tw`flex-row items-center gap-3 mb-4`}>
                            <View style={tw`p-2 bg-indigo-50 rounded-xl`}>
                                <CreditCard color="#4f46e5" size={24} />
                            </View>
                            <Text style={tw`text-slate-900 font-black text-xl tracking-tight`}>Card Machine Total</Text>
                        </View>
                        <Text style={tw`text-slate-400 text-xs uppercase font-bold mb-2 tracking-widest`}>Summary on Speedpoint (R)</Text>
                        <TextInput
                            style={tw`bg-slate-50 text-slate-900 text-4xl font-black p-4 rounded-xl border border-slate-200 text-right`}
                            placeholder="0.00"
                            placeholderTextColor="#cbd5e1"
                            keyboardType="numeric"
                            value={declaredCard}
                            onChangeText={setDeclaredCard}
                        />
                    </View>

                    {/* Notes (Optional) */}
                    <View style={tw`mb-8`}>
                        <Text style={tw`text-slate-500 text-xs font-bold mb-2 ml-2 tracking-widest`}>NOTES (OPTIONAL)</Text>
                        <TextInput
                            style={tw`bg-white text-slate-900 p-4 rounded-2xl border border-slate-200 h-28 font-medium shadow-sm font-medium`}
                            placeholder="e.g. Took R20 for taxi..."
                            placeholderTextColor="#94a3b8"
                            multiline
                            textAlignVertical="top"
                            value={notes}
                            onChangeText={setNotes}
                        />
                    </View>

                    {/* Submit Button */}
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            closeShift();
                        }}
                        disabled={submitting}
                        style={({ pressed }) => [
                            tw`bg-red-600 p-5 rounded-2xl flex-row items-center justify-center gap-3 shadow-sm transition-all`,
                            pressed && !submitting && tw`scale-95 bg-red-700 shadow-none`,
                            submitting && tw`opacity-70`
                        ]}
                    >
                        {submitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <LogOut size={24} color="white" />
                                <Text style={tw`text-white font-bold text-xl uppercase tracking-wider`}>Close Shift & Log Out</Text>
                            </>
                        )}
                    </Pressable>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}