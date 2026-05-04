import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { X, ArrowRight, Wallet } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../Context/AuthContext';

interface Props {
    visible: boolean;
    businessId: string;
    onClose: () => void;
}

export default function CashDropModal({ visible, businessId, onClose }: Props) {
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleDrop = async () => {
        if (!amount || !reason) return Alert.alert("Error", "Fill in all fields");
        
        setLoading(true);
        const { error } = await supabase.from('transactions').insert({
            business_id: businessId,
            type: 'payout', // Money leaving
            amount: -parseFloat(amount), // Negative for payouts
            description: `Cash Drop: ${reason}`,
            performed_by: user?.id
        });
        
        setLoading(false);
        if (!error) {
            Alert.alert("Success", "Cash Drop Recorded");
            setAmount('');
            setReason('');
            onClose();
        } else {
            Alert.alert("Error", error.message);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={tw`flex-1 bg-black/80 justify-center items-center p-4`}>
                <View style={tw`bg-[#1a1a1a] w-full max-w-sm rounded-2xl p-6 border border-[#333]`}>
                    <View style={tw`flex-row justify-between items-center mb-6`}>
                        <Text style={tw`text-white text-xl font-bold`}>Cash Drop</Text>
                        <TouchableOpacity onPress={onClose}><X color="#666" /></TouchableOpacity>
                    </View>

                    <View style={tw`gap-4`}>
                        <View>
                            <Text style={tw`text-gray-400 text-xs font-bold uppercase mb-2`}>Amount to Drop</Text>
                            <TextInput 
                                style={tw`bg-[#111] text-white text-2xl font-bold p-4 rounded-xl border border-[#333] text-center`}
                                placeholder="R 0.00"
                                placeholderTextColor="#333"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>
                        <View>
                            <Text style={tw`text-gray-400 text-xs font-bold uppercase mb-2`}>Reason</Text>
                            <TextInput 
                                style={tw`bg-[#111] text-white p-4 rounded-xl border border-[#333]`}
                                placeholder="e.g. Move to Safe, Petrol"
                                placeholderTextColor="#333"
                                value={reason}
                                onChangeText={setReason}
                            />
                        </View>
                        
                        <TouchableOpacity 
                            onPress={handleDrop}
                            disabled={loading}
                            style={tw`bg-red-900/50 p-4 rounded-xl border border-red-500 items-center mt-2 flex-row justify-center gap-2`}
                        >
                            {loading ? <ActivityIndicator color="red" /> : (
                                <>
                                    <Wallet size={18} color="#ef4444" />
                                    <Text style={tw`text-red-500 font-bold`}>Record Cash Drop</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

