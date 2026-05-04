import React, { useState } from 'react';
import {
    View, Text, TextInput, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform, Image, ScrollView, Pressable
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import tw from 'twrnc';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import * as Haptics from 'expo-haptics';

export default function AuthScreen() {
    const navigation = useNavigation<any>();

    // Auth Mode State
    const [isLogin, setIsLogin] = useState(true);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');

    // UI State
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleResendEmail = async () => {
        setLoading(true);
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });
        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert(
                'Code Sent',
                'A new verification code has been sent to your inbox.',
                [{
                    text: 'Enter Code',
                    onPress: () => navigation.navigate('VerifyCode', { email: email, mode: 'signup' })
                }]
            );
        }
    };

    const handleAuth = async () => {
        Haptics.impactAsync();
        if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');

        if (!isLogin) {
            if (!fullName) return Alert.alert('Error', 'Full Name is required for signup');
            if (password !== confirmPassword) return Alert.alert('Error', 'Passwords do not match');
            if (password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');
        }

        setLoading(true);
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName }
                    }
                });
                if (error) throw error;

                if (data.user && !data.session) {
                    Alert.alert(
                        'Account Created',
                        'Please check your email for a verification code.',
                        [{
                            text: 'Enter Code',
                            onPress: () => navigation.navigate('VerifyCode', { email: email, mode: 'signup' })
                        }]
                    );
                    return;
                }
            }
        } catch (error: any) {
            if (error.message.includes('Email not confirmed')) {
                Alert.alert(
                    'Email Not Verified',
                    'You must verify your email before logging in.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Resend Code', onPress: handleResendEmail },
                        {
                            text: 'Enter Code',
                            onPress: () => navigation.navigate('VerifyCode', { email, mode: 'signup' })
                        }
                    ]
                );
            } else {
                Alert.alert('Authentication Failed', error.message);
            }
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

            <ScrollView contentContainerStyle={tw`flex-grow justify-center p-6`}>
                {/* Logo Section */}
                <View style={tw`items-center mb-8`}>
                    <Image
                        source={require('../../../assets/Full_Logo.png')}
                        style={tw`w-30 h-30`}
                        resizeMode="contain"
                    />
                </View>

                {/* Header Text */}
                <View style={tw`items-center mb-2`}>
                    <Text style={tw`text-4xl font-bold text-slate-900 tracking-tight`}>
                        {isLogin ? 'Welcome Back' : 'Join Zylo'}
                    </Text>
                    <Text style={tw`mt-2 text-base font-medium text-slate-500`}>
                        {isLogin ? 'Manage your empire.' : 'Start your journey today.'}
                    </Text>
                </View>

                {/* Form Fields */}
                <View style={tw`gap-4 w-full max-w-[400px] self-center`}>

                    {/* Full Name (Signup Only) */}
                    {!isLogin && (
                        <View style={tw`flex-row items-center border border-slate-200 bg-white rounded-2xl px-4 shadow-sm`}>
                            <User size={20} color="#64748b" style={tw`mr-2`} />
                            <TextInput
                                placeholder="Full Name"
                                placeholderTextColor="#94a3b8"
                                style={tw`flex-1 py-4 text-base font-medium text-slate-900`}
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>
                    )}

                    {/* Email Address */}
                    <View style={tw`flex-row items-center border border-slate-200 bg-white rounded-2xl px-4 shadow-sm`}>
                        <Mail size={20} color="#64748b" style={tw`mr-2`} />
                        <TextInput
                            placeholder="Email Address"
                            placeholderTextColor="#94a3b8"
                            style={tw`flex-1 py-4 text-base font-medium text-slate-900`}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    {/* Password */}
                    <View style={tw`flex-row items-center border border-slate-200 bg-white rounded-2xl px-4 shadow-sm`}>
                        <Lock size={20} color="#64748b" style={tw`mr-2`} />
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor="#94a3b8"
                            style={tw`flex-1 py-4 text-base font-medium text-slate-900`}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <Pressable onPress={() => { Haptics.selectionAsync(); setShowPassword(!showPassword); }} style={tw`p-2`}>
                            {showPassword ? <EyeOff size={20} color="#64748b" /> : <Eye size={20} color="#64748b" />}
                        </Pressable>
                    </View>

                    {/* Confirm Password (Signup Only) */}
                    {!isLogin && (
                        <View style={tw`flex-row items-center border border-slate-200 bg-white rounded-2xl px-4 shadow-sm`}>
                            <Lock size={20} color="#64748b" style={tw`mr-2`} />
                            <TextInput
                                placeholder="Confirm Password"
                                placeholderTextColor="#94a3b8"
                                style={tw`flex-1 py-4 text-base font-medium text-slate-900`}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                            />
                            <Pressable onPress={() => { Haptics.selectionAsync(); setShowConfirmPassword(!showConfirmPassword); }} style={tw`p-2`}>
                                {showConfirmPassword ? <EyeOff size={20} color="#64748b" /> : <Eye size={20} color="#64748b" />}
                            </Pressable>
                        </View>
                    )}

                    {/* Forgot Password Link (Login Only) */}
                    {isLogin && (
                        <Pressable
                            onPress={() => navigation.navigate('ForgotPassword')}
                            style={({ pressed }) => [tw`items-end py-1`, pressed && tw`opacity-50`]}
                        >
                            <Text style={tw`text-indigo-600 font-bold`}>Forgot Password?</Text>
                        </Pressable>
                    )}

                    {/* Main Action Button */}
                    <Pressable
                        onPress={handleAuth}
                        disabled={loading}
                        style={({ pressed }) => [
                            tw`p-4 rounded-2xl items-center mt-4 bg-indigo-600 shadow-sm transition-all`,
                            pressed && tw`scale-95 bg-indigo-700 shadow-none`
                        ]}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={tw`text-white font-bold text-lg uppercase tracking-wider`}>
                                {isLogin ? 'Log In' : 'Create Account'}
                            </Text>
                        )}
                    </Pressable>

                    {/* Toggle Login/Signup */}
                    <Pressable 
                        onPress={() => {
                            Haptics.selectionAsync();
                            setIsLogin(!isLogin);
                        }} 
                        style={({ pressed }) => [tw`mt-4 items-center p-2`, pressed && tw`opacity-50`]}
                    >
                        <Text style={tw`text-slate-500 font-medium`}>
                            {isLogin ? "New here? " : "Have an account? "}
                            <Text style={tw`font-bold text-indigo-600`}>
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </Text>
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}