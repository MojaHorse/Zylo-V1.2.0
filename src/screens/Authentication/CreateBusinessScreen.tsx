import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert, ActivityIndicator, Pressable } from 'react-native';
import tw from 'twrnc';
import { Store, ShoppingBag, ArrowRight, CheckCircle2, ChevronLeft, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';
import * as Haptics from 'expo-haptics';

import { useAuth } from '../../../components/Context/AuthContext';

// Templates Data
const TEMPLATES = [
    { id: 'food', name: 'Fast Food / Kota', icon: ShoppingBag, desc: 'Includes recipes & ingredient tracking.' },
    { id: 'retail', name: 'Retail Shop', icon: Store, desc: 'Standard barcode inventory.' },
];

export default function CreateBusinessScreen() {
    const navigation = useNavigation<any>();
    const { signOut } = useAuth(); // <-- ADDED

    const [step, setStep] = useState(1);
    const [shopName, setShopName] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [loading, setLoading] = useState(false);
    const [createdBiz, setCreatedBiz] = useState<any>(null);

    const handleBack = () => {
        Haptics.selectionAsync();
        if (step === 2) {
            setStep(1);
        } else {
            // If they can't go back, let's offer sign out
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                Alert.alert(
                    "Sign Out",
                    "Do you want to sign out and use a different account?",
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Sign Out", style: 'destructive', onPress: () => signOut() }
                    ]
                );
            }
        }
    };
// ... rest of the functions
    const handleCreate = async () => {
        if (!shopName) return Alert.alert('Required', 'Please enter a shop name.');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('create_business_with_owner', {
                name: shopName,
                slug: null,
            });
            if (error) throw error;
            setCreatedBiz(data);
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        Haptics.impactAsync();
        if (createdBiz?.id) {
            navigation.navigate('StaffSetup', { businessId: createdBiz.id });
        } else {
            navigation.navigate('StaffSetup');
        }
    };

    // --- SUCCESS SCREEN ---
    if (createdBiz) {
        return (
            <View style={tw`flex-1 bg-slate-50 p-8 items-center justify-center`}>
                <View style={tw`bg-white w-full max-w-md p-8 rounded-3xl border border-slate-200 items-center shadow-sm`}>
                    <View style={tw`w-20 h-20 rounded-full bg-emerald-50 items-center justify-center mb-6 border border-emerald-100`}>
                        <CheckCircle2 size={48} color="#10b981" />
                    </View>
                    <Text style={tw`text-slate-900 text-3xl font-black mb-2 text-center tracking-tight`}>Shop Ready!</Text>
                    <Text style={tw`text-slate-500 text-center mb-8 font-medium`}>"{shopName}" has been set up.</Text>

                    <View style={tw`bg-slate-50 w-full p-6 rounded-2xl border border-dashed border-slate-300 mb-8 items-center`}>
                        <Text style={tw`text-slate-500 text-xs uppercase font-bold tracking-widest mb-3`}>Your Owner Staff Number</Text>
                        <Text style={tw`text-indigo-600 font-black text-4xl tracking-[0.3em]`}>
                            {createdBiz.owner_staff_number}
                        </Text>
                    </View>

                    <Pressable
                        onPress={handleContinue}
                        style={({ pressed }) => [
                            tw`bg-indigo-600 w-full p-4 rounded-2xl items-center shadow-sm transition-all`,
                            pressed && tw`scale-95 bg-indigo-700`
                        ]}
                    >
                        <Text style={tw`text-white font-bold text-lg uppercase tracking-wider`}>Setup Staff PINs</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    // --- WIZARD FORM ---
    return (
        <View style={tw`flex-1 bg-slate-50 p-6 pt-16`}>

            {/* Header: Back Button & Progress */}
            <View style={tw`flex-row items-center justify-between mb-10 max-w-lg self-center w-full`}>
                <Pressable
                    onPress={handleBack}
                    style={({ pressed }) => [
                        tw`w-10 h-10 bg-white rounded-full items-center justify-center border border-slate-200 shadow-sm transition-all`,
                        pressed && tw`scale-95 bg-slate-50`
                    ]}
                >
                    <ChevronLeft color="#0f172a" size={24} />
                </Pressable>

                {/* Progress Bar */}
                <View style={tw`flex-1 h-2 bg-slate-200 rounded-full overflow-hidden mx-4`}>
                    <View
                        style={[
                            tw`h-full bg-indigo-600 rounded-full`,
                            { width: step === 1 ? '50%' : '100%' }
                        ]}
                    />
                </View>
                
                {/* Logout Button */}
                <Pressable
                    onPress={() => {
                        Haptics.selectionAsync();
                        signOut();
                    }}
                    style={({ pressed }) => [
                        tw`px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm transition-all`,
                        pressed && tw`scale-95 bg-slate-50`
                    ]}
                >
                    <Text style={tw`text-slate-600 font-bold text-sm`}>Log Out</Text>
                </Pressable>
            </View>

            {/* Main Content Area */}
            <View style={tw`flex-1 max-w-lg self-center w-full`}>
                <Text style={tw`text-slate-900 text-4xl font-black mb-3 tracking-tight`}>
                    {step === 1 ? "Name your Shop" : "What do you sell?"}
                </Text>
                <Text style={tw`text-slate-500 text-base mb-8 leading-6 font-medium`}>
                    {step === 1
                        ? "This name will appear on your receipts."
                        : "We will customize your inventory based on this."}
                </Text>

                {step === 1 ? (
                    <View>
                        <TextInput
                            placeholder="e.g. Kota Kings"
                            placeholderTextColor="#94a3b8"
                            style={tw`bg-white text-slate-900 text-2xl p-6 rounded-2xl border border-slate-200 mb-8 font-black shadow-sm`}
                            autoFocus
                            value={shopName}
                            onChangeText={setShopName}
                        />

                        <Pressable
                            onPress={() => {
                                if (shopName) {
                                    Haptics.impactAsync();
                                    setStep(2);
                                }
                            }}
                            disabled={!shopName}
                            style={({ pressed }) => [
                                tw`bg-indigo-600 p-5 rounded-2xl items-center flex-row justify-center gap-2 shadow-sm transition-all`,
                                !shopName && tw`opacity-40`,
                                pressed && shopName ? tw`scale-95 bg-indigo-700` : {}
                            ]}
                        >
                            <Text style={tw`text-white font-bold text-lg uppercase tracking-wider`}>Next Step</Text>
                            <ArrowRight color="white" size={20} />
                        </Pressable>
                    </View>
                ) : (
                    <View style={tw`flex-1`}>
                        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                            <View style={tw`gap-4`}>
                                {TEMPLATES.map((t) => {
                                    const isSelected = selectedTemplate === t.id;
                                    return (
                                        <Pressable
                                            key={t.id}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setSelectedTemplate(t.id);
                                            }}
                                            style={({ pressed }) => [
                                                tw`p-5 rounded-2xl border-2 flex-row items-center gap-4 transition-all`,
                                                isSelected
                                                    ? tw`bg-indigo-50 border-indigo-300`
                                                    : tw`bg-white border-slate-200`,
                                                pressed && !isSelected && tw`bg-slate-50`
                                            ]}
                                        >
                                            <View style={tw`p-4 rounded-xl ${isSelected ? 'bg-indigo-600' : 'bg-slate-50 border border-slate-200'}`}>
                                                <t.icon size={28} color={isSelected ? 'white' : '#64748b'} />
                                            </View>
                                            <View style={tw`flex-1`}>
                                                <Text style={tw`font-black text-xl mb-1 ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>{t.name}</Text>
                                                <Text style={tw`text-slate-500 text-sm font-medium`}>{t.desc}</Text>
                                            </View>
                                            <View style={tw`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                                                {isSelected && <Check size={14} color="white" strokeWidth={4} />}
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        <Pressable
                            onPress={handleCreate}
                            disabled={loading || !selectedTemplate}
                            style={({ pressed }) => [
                                tw`bg-indigo-600 p-5 rounded-2xl items-center mt-6 shadow-sm transition-all`,
                                (!selectedTemplate) && tw`opacity-40`,
                                pressed && selectedTemplate ? tw`scale-95 bg-indigo-700` : {}
                            ]}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={tw`text-white font-bold text-lg uppercase tracking-wider`}>Create Shop</Text>
                            )}
                        </Pressable>
                    </View>
                )}
            </View>
        </View>
    );
}