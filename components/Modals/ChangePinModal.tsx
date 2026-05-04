import React, { useState } from 'react';
import { View, Text, Modal, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import tw from 'twrnc';
import { KeyRound, X } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../Context/AuthContext';
import { useBusiness } from '../Context/BusinessContext';
import * as Haptics from 'expo-haptics';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function ChangePinModal({ visible, onClose }: Props) {
    const { user, activeStaff } = useAuth();
    const { selectedBusiness } = useBusiness();
    
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!currentPin || !newPin || !confirmPin) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert("Missing Fields", "Please fill in all PIN fields.");
            return;
        }

        if (newPin !== confirmPin) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Mismatch", "New PIN and Confirm PIN do not match.");
            return;
        }

        if (newPin.length !== 4) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert("Invalid Length", "New PIN must be exactly 4 digits.");
            return;
        }

        if (!user || !selectedBusiness) return;

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // 1. Get the member ID for the current user
            let memberId = activeStaff?.id;
            let staffNumber = activeStaff?.staff_number;

            if (!memberId || !staffNumber) {
                const { data: member, error: memberErr } = await supabase
                    .from('business_members')
                    .select('id, staff_number')
                    .eq('user_id', user.id)
                    .eq('business_id', selectedBusiness.id)
                    .single();

                if (memberErr || !member) throw new Error("Could not find your staff record.");
                memberId = member.id;
                staffNumber = member.staff_number;
            }

            // 2. Verify current PIN using staffLogin RPC
            const { data: loginCheck, error: loginErr } = await supabase.rpc('login_staff', {
                input_staff_number: staffNumber,
                input_pin: currentPin
            });

            if (loginErr || !loginCheck?.success) {
                throw new Error("Current PIN is incorrect.");
            }

            // 3. Update PIN
            const { error: updateErr } = await supabase.rpc('update_member_pin', {
                p_member_id: memberId,
                p_new_pin: newPin
            });

            if (updateErr) throw updateErr;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", "Your PIN has been updated successfully.");
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
            onClose();

        } catch (e: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", e.message || "Failed to update PIN");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1`}>
                <View style={tw`flex-1 bg-black/50 justify-center items-center p-4`}>
                    <View style={tw`bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl`}>
                        {/* Header */}
                        <View style={tw`p-5 border-b border-slate-100 flex-row justify-between items-center bg-slate-50`}>
                            <View style={tw`flex-row items-center gap-2`}>
                                <KeyRound size={20} color="#4f46e5" />
                                <Text style={tw`text-slate-900 text-xl font-black`}>Change PIN</Text>
                            </View>
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
                        <View style={tw`p-6`}>
                            <Text style={tw`text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1`}>Current PIN</Text>
                            <TextInput 
                                style={tw`bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-2xl tracking-[12px] font-black mb-4`}
                                keyboardType="numeric"
                                secureTextEntry
                                maxLength={4}
                                value={currentPin}
                                onChangeText={setCurrentPin}
                                placeholder="****"
                            />

                            <Text style={tw`text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1`}>New PIN</Text>
                            <TextInput 
                                style={tw`bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-2xl tracking-[12px] font-black mb-4`}
                                keyboardType="numeric"
                                secureTextEntry
                                maxLength={4}
                                value={newPin}
                                onChangeText={setNewPin}
                                placeholder="****"
                            />

                            <Text style={tw`text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1`}>Confirm New PIN</Text>
                            <TextInput 
                                style={tw`bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-2xl tracking-[12px] font-black mb-8`}
                                keyboardType="numeric"
                                secureTextEntry
                                maxLength={4}
                                value={confirmPin}
                                onChangeText={setConfirmPin}
                                placeholder="****"
                            />

                            <Pressable 
                                onPress={handleSave}
                                disabled={loading}
                                style={({ pressed }) => [
                                    tw`bg-indigo-600 p-4 rounded-2xl items-center shadow-sm`,
                                    pressed && tw`scale-95 bg-indigo-700 shadow-none`
                                ]}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={tw`text-white font-black text-lg tracking-wide uppercase`}>Update PIN</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
