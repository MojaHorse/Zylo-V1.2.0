import React, { useState, useRef, useEffect } from 'react';
import { 
    View, Text, TextInput, Alert, ActivityIndicator, 
    KeyboardAvoidingView, Platform, Keyboard, Pressable 
} from 'react-native';
import tw from 'twrnc';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Clock, RotateCcw } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

export default function VerifyCodeScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { email, mode = 'reset' } = route.params || {}; 

    // Input State
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const inputs = useRef<Array<TextInput | null>>([]);
    
    // UI State
    const [loading, setLoading] = useState(false);
    
    // 👇 COUNTDOWN TIMER STATE
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

    // Timer Logic
    useEffect(() => {
        if (timeLeft <= 0) return;
        const intervalId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(intervalId);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Handle Input Change (Auto-focus next)
    const handleChange = (text: string, index: number) => {
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        if (text && index < 5) {
            inputs.current[index + 1]?.focus();
        }
        if (text && index === 5) {
            Keyboard.dismiss();
            handleVerify(newCode.join(''));
        }
    };

    // Handle Backspace
    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (fullCode?: string) => {
        Haptics.impactAsync();
        const otp = fullCode || code.join('');
        if (otp.length !== 6) return Alert.alert("Error", "Please enter the full 6-digit code.");

        setLoading(true);
        try {
            const type = mode === 'signup' ? 'signup' : 'recovery';

            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: type,
            });

            if (error) throw error;

            if (mode === 'signup') {
                // Session is active, App.tsx handles navigation
                Alert.alert("Success", "Email verified!");
            } else {
                navigation.replace('ResetPassword'); 
            }

        } catch (error: any) {
            Alert.alert("Verification Failed", error.message || "Invalid code");
            setCode(['', '', '', '', '', '']); // Reset inputs
            inputs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        Haptics.impactAsync();
        setTimeLeft(300); // Reset timer
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });
            if (error) throw error;
            Alert.alert("Sent", "New code sent to your email.");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1 bg-slate-50`}>
            <StatusBar style="dark" />
            <View style={tw`flex-1 px-6 pt-16`}>
                
                {/* Header */}
                <Pressable 
                    onPress={() => {
                        Haptics.selectionAsync();
                        navigation.goBack();
                    }} 
                    style={({ pressed }) => [tw`mb-8 w-10 h-10 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm`, pressed && tw`scale-95 bg-slate-50`]}
                >
                    <ArrowLeft size={20} color="#64748b" />
                </Pressable>

                <Text style={tw`text-slate-900 text-3xl font-black mb-2 tracking-tight`}>
                    {mode === 'signup' ? 'Verify Email' : 'Reset Code'}
                </Text>
                <Text style={tw`text-slate-500 text-base font-medium mb-8`}>
                    Enter the 6-digit code sent to{"\n"}
                    <Text style={tw`text-indigo-600 font-bold`}>{email}</Text>
                </Text>

                {/* 6-Digit Input Boxes */}
                <View style={tw`flex-row justify-between mb-8 gap-2`}>
                    {code.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputs.current[index] = ref; }}
                            style={tw`w-[14%] aspect-square border ${digit ? 'border-indigo-600 bg-indigo-50 shadow-none' : 'border-slate-200 bg-white shadow-sm'} rounded-xl text-slate-900 text-center text-3xl font-bold transition-all`}
                            keyboardType="number-pad"
                            maxLength={1}
                            value={digit}
                            onChangeText={(text) => handleChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            autoFocus={index === 0}
                            selectionColor="#4f46e5"
                        />
                    ))}
                </View>

                {/* Verify Button */}
                <Pressable 
                    onPress={() => handleVerify()} 
                    disabled={loading || timeLeft === 0}
                    style={({ pressed }) => [
                        tw`bg-indigo-600 p-4 rounded-xl items-center shadow-sm mb-6 transition-all`, 
                        timeLeft === 0 && tw`opacity-50`,
                        pressed && timeLeft > 0 && tw`bg-indigo-700 scale-95 shadow-none`
                    ]}
                >
                    {loading ? <ActivityIndicator color="white" /> : (
                        <Text style={tw`text-white font-bold text-lg uppercase tracking-wider`}>Verify Code</Text>
                    )}
                </Pressable>

                {/* Countdown / Resend Logic */}
                <View style={tw`items-center`}>
                    {timeLeft > 0 ? (
                        <View style={tw`flex-row items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm`}>
                            <Clock size={16} color="#64748b" />
                            <Text style={tw`text-slate-500 font-medium`}>
                                Expires in <Text style={tw`text-slate-900 font-bold`}>{formatTime(timeLeft)}</Text>
                            </Text>
                        </View>
                    ) : (
                        <Pressable 
                            onPress={handleResend} 
                            style={({ pressed }) => [tw`flex-row items-center gap-2 p-2 rounded-lg`, pressed && tw`bg-indigo-50`]}
                        >
                            <RotateCcw size={18} color="#4f46e5" />
                            <Text style={tw`text-indigo-600 font-bold`}>Resend Code</Text>
                        </Pressable>
                    )}
                </View>

            </View>
        </KeyboardAvoidingView>
    );
}