import React, { useState } from 'react';
import {
    View, Text, TextInput, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView, Pressable
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import tw from 'twrnc';
import { ArrowLeft, Mail, Send } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../components/Context/AuthContext';
import * as Haptics from 'expo-haptics';

export default function ForgotPasswordScreen() {
    const navigation = useNavigation<any>();
    const { setIsPasswordReset } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendCode = async () => {
        if (!email) return Alert.alert('Error', 'Please enter your email address');

        Haptics.impactAsync();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email,
            });

            if (error) throw error;

            // Turn on reset mode
            setIsPasswordReset(true);

            // Navigate to the Code Verification Screen
            navigation.navigate('VerifyCode', { email: email, mode: 'reset' });

        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={tw`flex-1 bg-slate-50`}
        >
            <StatusBar style="dark" />

            <ScrollView contentContainerStyle={tw`flex-grow justify-center p-8`}>
                <View style={tw`w-full max-w-[450px] self-center`}>

                    <Pressable
                        onPress={() => {
                            Haptics.selectionAsync();
                            navigation.goBack();
                        }}
                        style={({ pressed }) => [
                            tw`absolute top-0 left-0 z-10 w-10 h-10 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm transition-all`,
                            pressed && tw`scale-95 bg-slate-50`
                        ]}
                    >
                        <ArrowLeft color="#0f172a" size={20} />
                    </Pressable>

                    <View style={tw`items-center mb-10 mt-16`}>
                        <View style={tw`bg-indigo-50 p-6 rounded-full border border-indigo-100 mb-6`}>
                            <Mail size={40} color="#4f46e5" />
                        </View>
                        <Text style={tw`text-slate-900 text-3xl font-black text-center tracking-tight`}>Forgot Password?</Text>
                        <Text style={tw`text-slate-500 mt-2 text-center text-base leading-6 font-medium`}>
                            Enter your email address and we'll send you a 6-digit verification code.
                        </Text>
                    </View>

                    <View style={tw`gap-4`}>
                        <View>
                            <Text style={tw`text-slate-500 text-xs font-bold ml-2 mb-2 uppercase tracking-wider`}>Email Address</Text>
                            <View style={tw`flex-row items-center border border-slate-200 bg-white rounded-2xl px-4 shadow-sm`}>
                                <Mail size={20} color="#64748b" style={tw`mr-2`} />
                                <TextInput
                                    placeholder="name@example.com"
                                    placeholderTextColor="#94a3b8"
                                    style={tw`flex-1 py-4 text-base font-medium text-slate-900`}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        <Pressable
                            onPress={handleSendCode}
                            disabled={loading}
                            style={({ pressed }) => [
                                tw`bg-indigo-600 p-4 rounded-2xl items-center mt-4 flex-row justify-center gap-3 shadow-sm transition-all`,
                                pressed && tw`scale-95 bg-indigo-700 shadow-none`
                            ]}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text style={tw`text-white font-bold text-lg uppercase tracking-wider`}>Send Code</Text>
                                    <Send size={20} color="white" />
                                </>
                            )}
                        </Pressable>
                    </View>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}