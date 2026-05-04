import React from 'react';
import { View, Text, FlatList, Image, Pressable } from 'react-native';
import tw from 'twrnc';
import { Store, ChevronRight, PlusCircle, LogOut } from 'lucide-react-native';
import { useBusiness, BusinessProfile } from '../../../components/Context/BusinessContext';
import { useAuth } from '../../../components/Context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

export default function SelectBusinessScreen() {
    const { businesses, selectBusiness } = useBusiness();
    const { signOut, user } = useAuth();
    const navigation = useNavigation<any>();

    const handleSelect = async (biz: BusinessProfile) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await selectBusiness(biz);
    };

    return (
        <View style={tw`flex-1 bg-slate-50 p-6 pt-8`}>
            {/* Header */}
            <View style={tw`items-center mb-6`}>
                <Image
                    source={require('../../../assets/Full_Logo.png')}
                    style={tw`w-30 h-30`}
                    resizeMode="contain"
                />
                <Text style={tw`text-slate-900 text-3xl font-black tracking-tight mt-4`}>Select Store</Text>
                <Text style={tw`text-slate-500 font-medium mt-1`}>
                    You are linked to {businesses.length} {businesses.length === 1 ? 'business' : 'businesses'}.
                </Text>
            </View>

            {/* List */}
            <FlatList
                data={businesses}
                keyExtractor={item => item.id}
                contentContainerStyle={tw`max-w-lg self-center w-full`}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => handleSelect(item)}
                        style={({ pressed }) => [
                            tw`p-5 rounded-2xl mb-3 border flex-row items-center bg-white border-slate-200 shadow-sm transition-all`,
                            pressed && tw`scale-98 bg-slate-50 border-indigo-200`
                        ]}
                    >
                        <View style={tw`bg-indigo-50 p-3 rounded-xl mr-4 border border-indigo-100`}>
                            <Store size={24} color="#4f46e5" />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-slate-900 font-black text-lg tracking-tight`}>{item.name}</Text>
                            <Text style={tw`text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5`}>{item.role}</Text>
                        </View>
                        <ChevronRight color="#94a3b8" size={20} />
                    </Pressable>
                )}
            />

            {/* Actions */}
            <View style={tw`mt-4 gap-3 max-w-lg self-center w-full`}>
                <Pressable
                    onPress={() => {
                        Haptics.selectionAsync();
                        navigation.navigate('CreateBusiness');
                    }}
                    style={({ pressed }) => [
                        tw`flex-row items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-slate-300 bg-white transition-all`,
                        pressed && tw`scale-98 bg-slate-50`
                    ]}
                >
                    <PlusCircle size={20} color="#94a3b8" />
                    <Text style={tw`text-slate-500 font-bold`}>Register Another Business</Text>
                </Pressable>

                <Pressable
                    onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        signOut();
                    }}
                    style={({ pressed }) => [
                        tw`flex-row items-center justify-center gap-2 p-4 transition-all`,
                        pressed && tw`opacity-50`
                    ]}
                >
                    <LogOut size={18} color="#ef4444" />
                    <Text style={tw`text-red-500 font-bold`}>Log Out</Text>
                </Pressable>
            </View>
        </View>
    );
}