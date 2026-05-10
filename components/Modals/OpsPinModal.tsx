import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, Modal, TextInput, ActivityIndicator,
    KeyboardAvoidingView, Platform, Pressable, Animated
} from 'react-native';
import tw from 'twrnc';
import { ShieldCheck, X, AlertCircle } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../Context/BusinessContext';
import * as Haptics from 'expo-haptics';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    actionName?: string;
    actionDescription?: string;
}

export default function OpsPinModal({
    visible,
    onClose,
    onSuccess,
    actionName = 'Authorize Action',
    actionDescription = 'Enter the Operations PIN to continue'
}: Props) {
    const { selectedBusiness } = useBusiness();
    const [pin, setPin] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (visible) {
            setPin('');
            setError('');
            // Small delay to allow modal animation before focusing
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [visible]);

    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleVerify = async (pinValue?: string) => {
        const pinToCheck = pinValue || pin;
        if (pinToCheck.length !== 4 || !selectedBusiness) return;
        
        setVerifying(true);
        setError('');

        try {
            const { data: isValid, error: rpcError } = await supabase.rpc('verify_ops_pin', {
                p_business_id: selectedBusiness.id,
                p_pin: pinToCheck
            });

            if (rpcError) throw rpcError;

            if (isValid) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onSuccess();
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                triggerShake();
                setError('Incorrect PIN');
                setPin('');
            }
        } catch (e: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            triggerShake();
            setError(e.message || 'Verification failed');
            setPin('');
        } finally {
            setVerifying(false);
        }
    };

    const handlePinChange = (val: string) => {
        setPin(val);
        setError('');
        // Auto-submit when 4 digits entered
        if (val.length === 4) {
            handleVerify(val);
        }
    };

    // Render PIN dots
    const renderPinDots = () => (
        <View style={tw`flex-row justify-center gap-4 mb-6`}>
            {[0, 1, 2, 3].map((i) => (
                <View
                    key={i}
                    style={[
                        tw`w-4 h-4 rounded-full`,
                        i < pin.length
                            ? tw`bg-indigo-600`
                            : tw`bg-slate-200 border border-slate-300`
                    ]}
                />
            ))}
        </View>
    );

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={tw`flex-1`}
            >
                <View style={tw`flex-1 bg-black/60 justify-center items-center p-6`}>
                    <Animated.View
                        style={[
                            tw`bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl`,
                            { transform: [{ translateX: shakeAnim }] }
                        ]}
                    >
                        {/* Header */}
                        <View style={tw`p-6 pb-4 flex-row justify-between items-start`}>
                            <View style={tw`flex-row items-center gap-3`}>
                                <View style={tw`bg-indigo-100 p-3 rounded-2xl`}>
                                    <ShieldCheck size={24} color="#4f46e5" />
                                </View>
                                <View>
                                    <Text style={tw`text-slate-900 text-lg font-black`}>
                                        {actionName}
                                    </Text>
                                    <Text style={tw`text-slate-500 text-xs font-medium mt-0.5`}>
                                        Operations PIN required
                                    </Text>
                                </View>
                            </View>
                            <Pressable
                                onPress={onClose}
                                style={({ pressed }) => [
                                    tw`p-2 rounded-full bg-slate-100`,
                                    pressed && tw`bg-slate-200`
                                ]}
                            >
                                <X size={18} color="#64748b" />
                            </Pressable>
                        </View>

                        {/* Body */}
                        <View style={tw`px-6 pb-8 pt-4`}>
                            <Text style={tw`text-slate-500 text-center mb-6 font-medium`}>
                                {actionDescription}
                            </Text>

                            {renderPinDots()}

                            {/* Hidden input — captures keyboard */}
                            <TextInput
                                ref={inputRef}
                                style={tw`absolute opacity-0`}
                                keyboardType="numeric"
                                secureTextEntry
                                maxLength={4}
                                value={pin}
                                onChangeText={handlePinChange}
                                autoFocus
                            />

                            {/* Tap target to re-focus keyboard */}
                            <Pressable
                                onPress={() => inputRef.current?.focus()}
                                style={tw`absolute inset-0`}
                            />

                            {/* Error */}
                            {error !== '' && (
                                <View style={tw`flex-row items-center justify-center gap-2 mb-4`}>
                                    <AlertCircle size={14} color="#ef4444" />
                                    <Text style={tw`text-red-500 font-bold text-sm`}>{error}</Text>
                                </View>
                            )}

                            {/* Loading */}
                            {verifying && (
                                <View style={tw`items-center`}>
                                    <ActivityIndicator color="#4f46e5" size="small" />
                                    <Text style={tw`text-slate-400 text-xs font-bold mt-2`}>
                                        Verifying...
                                    </Text>
                                </View>
                            )}
                        </View>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
