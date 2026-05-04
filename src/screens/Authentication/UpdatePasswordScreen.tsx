import React, { useState } from 'react';
import {
    View, Text, TextInput, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView, Pressable
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import tw from 'twrnc';
import { Lock, CheckCircle } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../components/Context/AuthContext';
import * as Haptics from 'expo-haptics';

export default function UpdatePasswordScreen() {
    const { setIsPasswordReset } = useAuth();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        if (!password) return Alert.alert('Error', 'Please enter a new password');
        if (password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');

        Haptics.impactAsync();
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: password });

            if (error) throw error;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                'Success',
                'Your password has been updated.',
                [{
                    text: 'Go to App',
                    onPress: () => setIsPasswordReset(false)
                }]
            );
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

                    <View style={tw`items-center mb-10`}>
                        <View style={tw`bg-indigo-50 p-6 rounded-full border border-indigo-100 mb-6`}>
                            <Lock size={40} color="#4f46e5" />
                        </View>
                        <Text style={tw`text-slate-900 text-3xl font-black text-center tracking-tight`}>New Password</Text>
                        <Text style={tw`text-slate-500 mt-2 text-center font-medium`}>
                            Enter your new secure password below.
                        </Text>
                    </View>

                    <View style={tw`gap-4`}>
                        <View>
                            <Text style={tw`text-slate-500 text-xs font-bold ml-2 mb-2 uppercase tracking-wider`}>New Password</Text>
                            <View style={tw`flex-row items-center border border-slate-200 bg-white rounded-2xl px-4 shadow-sm`}>
                                <Lock size={20} color="#64748b" style={tw`mr-2`} />
                                <TextInput
                                    placeholder="Min 6 characters"
                                    placeholderTextColor="#94a3b8"
                                    style={tw`flex-1 py-4 text-base font-medium text-slate-900`}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <Pressable
                            onPress={handleUpdate}
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
                                    <Text style={tw`text-white font-bold text-lg uppercase tracking-wider`}>Update Password</Text>
                                    <CheckCircle size={20} color="white" />
                                </>
                            )}
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}