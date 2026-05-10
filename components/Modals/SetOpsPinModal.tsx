import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, Modal, TextInput, ActivityIndicator,
    KeyboardAvoidingView, Platform, Pressable, Alert
} from 'react-native';
import tw from 'twrnc';
import { Shield, X, Eye, EyeOff, Check } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../Context/BusinessContext';
import { useToast } from '../Context/ToastContext';
import * as Haptics from 'expo-haptics';

interface Props {
    visible: boolean;
    onClose: () => void;
    hasExistingPin: boolean;
}

export default function SetOpsPinModal({ visible, onClose, hasExistingPin }: Props) {
    const { selectedBusiness } = useBusiness();
    const { showToast } = useToast();

    // Step 1: Verify current PIN (only if changing existing)
    // Step 2: Enter new PIN
    // Step 3: Confirm new PIN
    const [step, setStep] = useState<1 | 2 | 3>(hasExistingPin ? 1 : 2);
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const newPinRef = useRef<TextInput>(null);
    const confirmPinRef = useRef<TextInput>(null);
    const currentPinRef = useRef<TextInput>(null);

    useEffect(() => {
        if (visible) {
            setStep(hasExistingPin ? 1 : 2);
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
            setError('');
            setShowPin(false);
        }
    }, [visible, hasExistingPin]);

    // Auto-focus the right input when step changes
    useEffect(() => {
        if (!visible) return;
        const timer = setTimeout(() => {
            if (step === 1) currentPinRef.current?.focus();
            if (step === 2) newPinRef.current?.focus();
            if (step === 3) confirmPinRef.current?.focus();
        }, 200);
        return () => clearTimeout(timer);
    }, [step, visible]);

    const handleVerifyCurrent = async (finalCurrentPin?: string) => {
        const pinToVerify = finalCurrentPin || currentPin;
        if (pinToVerify.length !== 4 || !selectedBusiness) return;
        setLoading(true);
        setError('');

        try {
            const { data: isValid, error: rpcError } = await supabase.rpc('verify_ops_pin', {
                p_business_id: selectedBusiness.id,
                p_pin: pinToVerify
            });

            if (rpcError) throw rpcError;

            if (isValid) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep(2);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setError('Incorrect current PIN');
                setCurrentPin('');
            }
        } catch (e: any) {
            setError(e.message || 'Verification failed');
            setCurrentPin('');
        } finally {
            setLoading(false);
        }
    };

    const handleSetPin = async (finalConfirmPin?: string) => {
        // newPin is from step 2 so it is already set in state and won't be stale here.
        const confirmVal = finalConfirmPin || confirmPin;
        
        if (newPin.length !== 4) {
            setError('PIN must be 4 digits');
            return;
        }
        if (newPin !== confirmVal) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setError('PINs do not match');
            setConfirmPin('');
            return;
        }

        if (!selectedBusiness) return;
        setLoading(true);
        setError('');

        try {
            const { data, error: rpcError } = await supabase.rpc('set_ops_pin', {
                p_business_id: selectedBusiness.id,
                p_new_pin: newPin
            });

            if (rpcError) throw rpcError;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast(hasExistingPin ? 'Operations PIN updated' : 'Operations PIN set', 'success');
            onClose();
        } catch (e: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setError(e.message || 'Failed to set PIN');
        } finally {
            setLoading(false);
        }
    };

    const getStepTitle = () => {
        if (step === 1) return 'Verify Current PIN';
        if (step === 2) return 'Enter New PIN';
        return 'Confirm New PIN';
    };

    const getStepSubtitle = () => {
        if (step === 1) return 'Enter your current operations PIN first';
        if (step === 2) return 'Choose a 4-digit PIN for restricted operations';
        return 'Re-enter the PIN to confirm';
    };

    const renderPinInput = (
        value: string,
        onChange: (val: string) => void,
        ref: React.RefObject<TextInput | null>,
        onComplete?: (val: string) => void
    ) => (
        <View style={tw`mb-4`}>
            <View style={tw`flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden`}>
                <TextInput
                    ref={ref}
                    style={tw`flex-1 p-5 text-center text-3xl tracking-[16px] font-black text-slate-900`}
                    keyboardType="numeric"
                    secureTextEntry={!showPin}
                    maxLength={4}
                    value={value}
                    onChangeText={(val) => {
                        onChange(val);
                        setError('');
                        if (val.length === 4 && onComplete) {
                            setTimeout(() => onComplete(val), 100);
                        }
                    }}
                    placeholder="••••"
                    placeholderTextColor="#cbd5e1"
                />
                <Pressable
                    onPress={() => setShowPin(!showPin)}
                    style={tw`pr-4`}
                >
                    {showPin ?
                        <EyeOff size={20} color="#94a3b8" /> :
                        <Eye size={20} color="#94a3b8" />
                    }
                </Pressable>
            </View>
        </View>
    );

    // Step progress indicator
    const renderProgress = () => {
        const steps = hasExistingPin ? [1, 2, 3] : [2, 3];
        const currentIdx = steps.indexOf(step);
        return (
            <View style={tw`flex-row justify-center gap-2 mb-6`}>
                {steps.map((s, idx) => (
                    <View
                        key={s}
                        style={[
                            tw`h-1.5 rounded-full`,
                            idx <= currentIdx ? tw`bg-indigo-600 w-8` : tw`bg-slate-200 w-6`
                        ]}
                    />
                ))}
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={tw`flex-1`}
            >
                <View style={tw`flex-1 bg-black/60 justify-center items-center p-6`}>
                    <View style={tw`bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl`}>
                        {/* Header */}
                        <View style={tw`p-6 pb-2 flex-row justify-between items-start`}>
                            <View style={tw`flex-row items-center gap-3`}>
                                <View style={tw`bg-indigo-100 p-3 rounded-2xl`}>
                                    <Shield size={24} color="#4f46e5" />
                                </View>
                                <View>
                                    <Text style={tw`text-slate-900 text-lg font-black`}>
                                        {hasExistingPin ? 'Change Ops PIN' : 'Set Ops PIN'}
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
                            {renderProgress()}

                            <Text style={tw`text-slate-900 font-bold text-base text-center mb-1`}>
                                {getStepTitle()}
                            </Text>
                            <Text style={tw`text-slate-500 text-sm text-center mb-6 font-medium`}>
                                {getStepSubtitle()}
                            </Text>

                            {/* Step 1: Verify Current */}
                            {step === 1 && renderPinInput(
                                currentPin,
                                setCurrentPin,
                                currentPinRef,
                                handleVerifyCurrent
                            )}

                            {/* Step 2: New PIN */}
                            {step === 2 && renderPinInput(
                                newPin,
                                setNewPin,
                                newPinRef,
                                () => setStep(3)
                            )}

                            {/* Step 3: Confirm PIN */}
                            {step === 3 && (
                                <>
                                    {renderPinInput(
                                        confirmPin,
                                        setConfirmPin,
                                        confirmPinRef,
                                        handleSetPin
                                    )}
                                </>
                            )}

                            {/* Error */}
                            {error !== '' && (
                                <Text style={tw`text-red-500 text-center text-sm font-bold mt-2`}>
                                    {error}
                                </Text>
                            )}

                            {/* Loading */}
                            {loading && (
                                <ActivityIndicator color="#4f46e5" style={tw`mt-4`} />
                            )}

                            {/* Manual Submit (fallback if auto-submit doesn't trigger) */}
                            {step === 3 && confirmPin.length === 4 && !loading && (
                                <Pressable
                                    onPress={() => handleSetPin()}
                                    style={({ pressed }) => [
                                        tw`mt-4 bg-indigo-600 p-4 rounded-2xl flex-row items-center justify-center gap-2`,
                                        pressed && tw`scale-95 bg-indigo-700`
                                    ]}
                                >
                                    <Check size={20} color="white" />
                                    <Text style={tw`text-white font-black text-base uppercase tracking-wider`}>
                                        Save PIN
                                    </Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
