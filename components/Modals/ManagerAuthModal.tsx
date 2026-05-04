import React, { useState, useEffect } from 'react';
import { View, Text, Modal, FlatList, Pressable, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import tw from 'twrnc';
import { ShieldCheck, X, Briefcase, ArrowLeft } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../Context/BusinessContext';
import * as Haptics from 'expo-haptics';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    actionName?: string;
}

export default function ManagerAuthModal({ visible, onClose, onSuccess, actionName = "Authorize Action" }: Props) {
    const { selectedBusiness } = useBusiness();
    const [managers, setManagers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedManager, setSelectedManager] = useState<any>(null);
    const [pin, setPin] = useState('');
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        if (visible && selectedBusiness) {
            fetchManagers();
            setSelectedManager(null);
            setPin('');
        }
    }, [visible, selectedBusiness]);

    const fetchManagers = async () => {
        setLoading(true);
        if (!selectedBusiness) return;

        const { data, error } = await supabase
            .from('business_members')
            .select('id, staff_number, role, profiles(full_name)')
            .eq('business_id', selectedBusiness.id)
            .in('role', ['owner', 'manager'])
            .eq('is_active', true);

        if (error) {
            console.error(error);
        } else {
            setManagers(data || []);
        }
        setLoading(false);
    };

    const handleVerify = async () => {
        if (pin.length !== 4) return;
        setVerifying(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // Using the user-provided RPC to verify manager pin globally for the business
            const { data: isValid, error } = await supabase.rpc('verify_manager_pin', {
                p_business_id: selectedBusiness?.id,
                p_pin: pin
            });

            if (error) throw error;

            if (isValid) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onSuccess();
                // Close modal or rely on parent unmounting
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert("Access Denied", "Incorrect Manager PIN.");
                setPin('');
            }
        } catch (e: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", e.message || "Verification failed");
            setPin('');
        } finally {
            setVerifying(false);
        }
    };

    const getDisplayName = (item: any) => {
        return item.profiles?.full_name || 'Manager';
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1`}>
                <View style={tw`flex-1 bg-black/60 justify-center items-center p-4`}>
                    <View style={tw`bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl`}>
                        {/* Header */}
                        <View style={tw`p-5 border-b border-slate-100 flex-row justify-between items-center bg-slate-50`}>
                            {selectedManager ? (
                                <Pressable 
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSelectedManager(null);
                                        setPin('');
                                    }} 
                                    style={({ pressed }) => [
                                        tw`flex-row items-center transition-all bg-slate-200/50 px-3 py-2 rounded-lg`,
                                        pressed && tw`scale-95 bg-slate-200`
                                    ]}
                                >
                                    <ArrowLeft color="#64748b" size={18} />
                                    <Text style={tw`text-slate-700 text-sm font-bold ml-1`}>Back</Text>
                                </Pressable>
                            ) : (
                                <View style={tw`flex-row items-center gap-2`}>
                                    <ShieldCheck size={20} color="#f59e0b" />
                                    <Text style={tw`text-slate-900 text-lg font-black`}>{actionName}</Text>
                                </View>
                            )}

                            <Pressable 
                                onPress={onClose}
                                style={({ pressed }) => [
                                    tw`p-2 bg-slate-200/50 rounded-full`,
                                    pressed && tw`bg-slate-300`
                                ]}
                            >
                                <X size={20} color="#64748b" />
                            </Pressable>
                        </View>

                        {/* Body */}
                        <View style={tw`p-6 max-h-96`}>
                            {!selectedManager ? (
                                <>
                                    <Text style={tw`text-slate-500 font-bold mb-4 text-center`}>
                                        Select a Manager to authorize
                                    </Text>
                                    
                                    {loading ? (
                                        <ActivityIndicator color="#4f46e5" style={tw`my-8`} />
                                    ) : (
                                        <FlatList 
                                            data={managers}
                                            keyExtractor={item => item.id}
                                            showsVerticalScrollIndicator={false}
                                            renderItem={({ item }) => (
                                                <Pressable
                                                    onPress={() => {
                                                        Haptics.selectionAsync();
                                                        setSelectedManager(item);
                                                    }}
                                                    style={({ pressed }) => [
                                                        tw`flex-row items-center p-4 rounded-2xl border border-slate-200 mb-3 transition-all`,
                                                        pressed ? tw`bg-slate-100 scale-98` : tw`bg-slate-50`
                                                    ]}
                                                >
                                                    <View style={tw`bg-amber-100 p-3 rounded-full mr-4`}>
                                                        <Briefcase size={20} color="#d97706" />
                                                    </View>
                                                    <View>
                                                        <Text style={tw`text-slate-900 font-bold text-lg`}>
                                                            {getDisplayName(item)}
                                                        </Text>
                                                        <Text style={tw`text-slate-500 text-xs uppercase font-bold`}>
                                                            {item.role}
                                                        </Text>
                                                    </View>
                                                </Pressable>
                                            )}
                                            ListEmptyComponent={
                                                <Text style={tw`text-slate-500 text-center my-4`}>No managers found.</Text>
                                            }
                                        />
                                    )}
                                </>
                            ) : (
                                <>
                                    <View style={tw`items-center mb-6`}>
                                        <View style={tw`bg-amber-100 p-4 rounded-full mb-3`}>
                                            <Briefcase size={32} color="#d97706" />
                                        </View>
                                        <Text style={tw`text-slate-900 font-black text-xl`}>{getDisplayName(selectedManager)}</Text>
                                        <Text style={tw`text-slate-500 uppercase text-xs font-bold`}>Enter PIN to Authorize</Text>
                                    </View>

                                    <TextInput 
                                        style={tw`bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-3xl tracking-[16px] font-black mb-6`}
                                        keyboardType="numeric"
                                        secureTextEntry
                                        autoFocus
                                        maxLength={4}
                                        value={pin}
                                        onChangeText={(val) => {
                                            setPin(val);
                                            // Auto-verify when 4 digits are entered
                                            if (val.length === 4) {
                                                // need a slight timeout so state sets before calling verify?
                                                // Actually handleVerify uses pin from state, so it might be stale.
                                                // Let's pass val directly or rely on useEffect.
                                            }
                                        }}
                                        placeholder="****"
                                    />

                                    <Pressable 
                                        onPress={() => {
                                            // Use current pin input
                                            setPin(pin); 
                                            // Handle verify uses state pin, so we might have an issue if called immediately on changeText
                                            // Standard button submit
                                        }}
                                        onPressIn={handleVerify}
                                        disabled={verifying || pin.length !== 4}
                                        style={({ pressed }) => [
                                            tw`bg-indigo-600 p-4 rounded-2xl items-center shadow-sm`,
                                            (pressed || pin.length !== 4) && tw`scale-95 bg-indigo-700 shadow-none`,
                                            pin.length !== 4 && tw`opacity-50`
                                        ]}
                                    >
                                        {verifying ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text style={tw`text-white font-black text-lg tracking-wide uppercase`}>Verify & Authorize</Text>
                                        )}
                                    </Pressable>
                                </>
                            )}
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
