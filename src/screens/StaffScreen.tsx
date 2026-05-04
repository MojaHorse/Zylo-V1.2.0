import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, Alert,
    Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable
} from 'react-native';
import tw from 'twrnc';
import { User, KeyRound, ShieldCheck, Plus, X, ArrowRight, Briefcase, ShoppingCart } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/Context/AuthContext';
import { useBusiness } from '../../components/Context/BusinessContext';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

export default function StaffScreen() {
    const { user } = useAuth();
    const { refreshBusiness, selectedBusiness, businesses } = useBusiness();

    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // --- ADD STAFF MODAL STATE ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newStaffName, setNewStaffName] = useState('');
    const [newStaffPin, setNewStaffPin] = useState('');
    const [newStaffRole, setNewStaffRole] = useState<'manager' | 'cashier'>('cashier');
    const [addingStaff, setAddingStaff] = useState(false);

    // --- EDIT PIN MODAL STATE ---
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [editPinValue, setEditPinValue] = useState('');
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [editingMemberRole, setEditingMemberRole] = useState('');
    const [updatingPin, setUpdatingPin] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, [selectedBusiness]);

    const fetchStaff = async () => {
        try {
            let targetBusinessId = selectedBusiness?.id;

            if (!targetBusinessId) {
                const { data: linkData } = await supabase
                    .from('business_members')
                    .select('business_id')
                    .eq('user_id', user?.id)
                    .single();
                
                if (linkData) targetBusinessId = linkData.business_id;
            }

            if (!targetBusinessId) return;

            const { data, error } = await supabase
                .from('business_members')
                .select('id, role, user_id, pin_hash, business_id, staff_number, profiles(full_name, email), full_name')
                .eq('is_active', true)
                .eq('business_id', targetBusinessId)
                .order('role', { ascending: false });

            if (error) throw error;
            if (data) setMembers(data);

        } catch (e) {
            console.error("Error fetching staff:", e);
        }
    };

    const copyToClipboard = async (text: string) => {
        if (!text) return;
        Haptics.selectionAsync();
        await Clipboard.setStringAsync(text);
        Alert.alert("Copied", `Staff ID ${text} copied to clipboard.`);
    };

    const handleAddStaff = async () => {
        if (!newStaffName || newStaffPin.length !== 4) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return Alert.alert("Invalid Input", "Name is required and PIN must be 4 digits.");
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setAddingStaff(true);
        try {
            let targetBusinessId = selectedBusiness?.id;

            if (!targetBusinessId && members.length > 0) {
                 targetBusinessId = members[0].business_id;
            }

            if (!targetBusinessId) {
                const { data: fallbackData } = await supabase
                    .from('business_members')
                    .select('business_id')
                    .eq('user_id', user?.id)
                    .single();
                if (fallbackData) targetBusinessId = fallbackData.business_id;
            }

            if (!targetBusinessId) throw new Error("Could not find your Shop ID. Please restart the app.");

            const { data: newId, error } = await supabase.rpc('create_staff_member', {
                full_name: newStaffName,
                pin: newStaffPin,
                role: newStaffRole,
                business_id: targetBusinessId
            });
            
            if (error) throw error;

            handleSuccess(newId);

        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", error.message);
        } finally {
            setAddingStaff(false);
        }
    };

    const handleSuccess = (newId: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsAddModalOpen(false);
        Alert.alert(
            "Staff Created Successfully",
            `Name: ${newStaffName}\n\nLogin ID: ${newId}\n\nPlease write this ID down on their staff card.`,
            [{ text: "OK, Copied", onPress: () => copyToClipboard(newId) }]
        );
        setNewStaffName('');
        setNewStaffPin('');
        setNewStaffRole('cashier');
        fetchStaff();
    };

    const openPinModal = (memberId: string, role: string) => {
        Haptics.selectionAsync();
        setEditingMemberId(memberId);
        setEditingMemberRole(role);
        setEditPinValue('');
        setIsPinModalOpen(true);
    };

    const handleSavePin = async () => {
        if (!editPinValue || editPinValue.length !== 4) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return Alert.alert("Invalid", "PIN must be exactly 4 digits.");
        }
        if (!editingMemberId) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setUpdatingPin(true);
        try {
            const { error } = await supabase.rpc('update_member_pin', {
                member_id: editingMemberId,
                new_pin: editPinValue
            });

            if (error) throw error;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", "PIN Updated Successfully");
            setIsPinModalOpen(false);
            fetchStaff();
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", error.message);
        } finally {
            setUpdatingPin(false);
        }
    };

    const handleFinishSetup = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setLoading(true);
        try {
            await refreshBusiness();
            
            if (!selectedBusiness && businesses.length === 0) {
                 setTimeout(async () => {
                    await refreshBusiness();
                 }, 1000);
            }
        } catch (error: any) {
            console.error("Setup Error:", error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error Entering Shop", "Could not load business details. Please check your internet connection.");
            setLoading(false);
        }
    };

    const myProfile = members.find(m => m.user_id === user?.id);
    const otherStaff = members.filter(m => m.user_id !== user?.id);

    return (
        <View style={tw`flex-1 bg-slate-50 p-6 pt-16`}>
            {/* --- HEADER --- */}
            <View style={tw`mb-8`}>
                <Text style={tw`text-indigo-600 font-bold text-xs uppercase tracking-widest mb-2`}>
                    Team Management
                </Text>
                <Text style={tw`text-slate-900 text-4xl font-black tracking-tight`}>Staff & Security</Text>
                <Text style={tw`text-slate-500 mt-2 text-base font-medium`}>
                    Manage who can access your shop.
                </Text>
            </View>

            {/* --- SECTION 1: MY PROFILE (OWNER) --- */}
            {myProfile && (
                <View style={tw`mb-10`}>
                    <Text style={tw`text-slate-500 font-bold mb-3 text-xs tracking-widest`}>MY ACCESS (OWNER)</Text>
                    <View style={tw`bg-white p-5 rounded-3xl border border-slate-200 flex-row items-center shadow-sm`}>
                        <View style={tw`bg-indigo-50 p-4 rounded-full mr-4 border border-indigo-100`}>
                            <ShieldCheck size={28} color="#4f46e5" />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-slate-900 font-black text-xl`}>{myProfile.profiles?.full_name || myProfile.full_name} (You)</Text>
                            <View style={tw`flex-row items-center gap-2 mt-1.5`}>
                                <Text style={tw`text-indigo-600 text-[10px] font-black bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-wider`}>OWNER</Text>
                                <Text style={tw`text-slate-400 text-xs font-mono font-bold`}>ID: {myProfile.staff_number}</Text>
                            </View>
                        </View>
                        <Pressable
                            onPress={() => openPinModal(myProfile.id, 'Owner')}
                            style={({ pressed }) => [
                                tw`bg-slate-100 px-4 py-3 rounded-xl flex-row items-center gap-2 transition-all border border-slate-200`,
                                pressed && tw`scale-95 bg-slate-200`
                            ]}
                        >
                            <KeyRound size={16} color="#64748b" />
                            <Text style={tw`text-slate-700 text-xs font-bold`}>Edit PIN</Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {/* --- SECTION 2: STAFF LIST --- */}
            <View style={tw`flex-1`}>
                <View style={tw`flex-row justify-between items-center mb-4`}>
                    <Text style={tw`text-slate-500 font-bold text-xs tracking-widest`}>STAFF MEMBERS</Text>
                    <Pressable 
                        onPress={() => {
                            Haptics.selectionAsync();
                            setIsAddModalOpen(true);
                        }} 
                        style={({ pressed }) => [
                            tw`flex-row items-center gap-1 transition-all`,
                            pressed && tw`opacity-50`
                        ]}
                    >
                        <Plus size={16} color="#4f46e5" />
                        <Text style={tw`text-indigo-600 font-bold`}>Add New</Text>
                    </Pressable>
                </View>

                <FlatList
                    data={otherStaff}
                    keyExtractor={item => item.id}
                    contentContainerStyle={tw`pb-32`}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={tw`p-8 bg-white rounded-[2rem] border border-slate-200 items-center justify-center border-dashed`}>
                            <User size={32} color="#94a3b8" style={tw`mb-2 opacity-50`} />
                            <Text style={tw`text-slate-400 font-bold`}>No staff added yet.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={tw`bg-white p-4 rounded-2xl mb-3 border border-slate-200 flex-row items-center shadow-sm`}>
                            <View style={tw`bg-slate-50 p-3 rounded-full mr-4 border border-slate-100`}>
                                {item.role === 'manager' ? <Briefcase size={22} color="#f59e0b" /> : <ShoppingCart size={22} color="#94a3b8" />}
                            </View>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-slate-900 font-bold text-lg`}>{item.full_name || "Unknown Staff"}</Text>
                                <View style={tw`flex-row gap-2 mt-1 items-center`}>
                                    <Text style={tw`text-xs uppercase font-black ${item.role === 'manager' ? 'text-amber-500' : 'text-slate-400'}`}>
                                        {item.role}
                                    </Text>
                                    <View style={tw`w-1 h-1 rounded-full bg-slate-300`} />
                                    <Pressable 
                                        onPress={() => copyToClipboard(item.staff_number)}
                                        style={({ pressed }) => [pressed && tw`opacity-50`]}
                                    >
                                        <Text style={tw`text-slate-400 text-xs font-mono font-bold tracking-wider`}>
                                            ID: {item.staff_number || "..."}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                            <Pressable
                                onPress={() => openPinModal(item.id, item.role)}
                                style={({ pressed }) => [
                                    tw`bg-slate-50 px-3 py-3 rounded-xl mr-1 border border-slate-100 transition-all`,
                                    pressed && tw`scale-95 bg-slate-200`
                                ]}
                            >
                                <KeyRound size={18} color="#64748b" />
                            </Pressable>
                        </View>
                    )}
                />
            </View>

            {/* --- BOTTOM ACTION --- */}
            <View style={tw`absolute bottom-10 left-6 right-6`}>
                <Pressable
                    onPress={handleFinishSetup}
                    disabled={loading}
                    style={({ pressed }) => [
                        tw`bg-indigo-600 p-5 rounded-2xl flex-row items-center justify-center gap-3 shadow-md transition-all`,
                        pressed && tw`scale-95 bg-indigo-700 shadow-none`
                    ]}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text style={tw`text-white font-black text-xl tracking-wide uppercase`}>Enter Shop</Text>
                            <ArrowRight color="white" size={24} />
                        </>
                    )}
                </Pressable>
            </View>

            {/* ============================================================ */}
            {/* MODAL 1: ADD NEW STAFF */}
            {/* ============================================================ */}
            <Modal visible={isAddModalOpen} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1 justify-end`}>
                    <Pressable
                        style={tw`flex-1 bg-black/40`}
                        onPress={() => setIsAddModalOpen(false)}
                    />
                    <View style={tw`bg-white p-8 rounded-t-[2.5rem] border-t border-slate-200 shadow-2xl`}>
                        <View style={tw`flex-row justify-between items-center mb-8`}>
                            <Text style={tw`text-slate-900 text-3xl font-black tracking-tight`}>Add New Staff</Text>
                            <Pressable 
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setIsAddModalOpen(false);
                                }}
                                style={({ pressed }) => [
                                    tw`p-2 bg-slate-100 rounded-full transition-all`,
                                    pressed && tw`scale-90 bg-slate-200`
                                ]}
                            >
                                <X color="#64748b" size={24} />
                            </Pressable>
                        </View>

                        <Text style={tw`text-slate-500 mb-2 ml-1 text-xs font-bold uppercase tracking-widest`}>Staff Name</Text>
                        <TextInput
                            style={tw`bg-slate-50 text-slate-900 font-bold p-4 rounded-2xl border border-slate-200 mb-6 text-lg shadow-sm`}
                            placeholder="e.g. Sarah Jones"
                            placeholderTextColor="#94a3b8"
                            value={newStaffName}
                            onChangeText={setNewStaffName}
                        />

                        <Text style={tw`text-slate-500 mb-2 ml-1 text-xs font-bold uppercase tracking-widest`}>Select Role</Text>
                        <View style={tw`flex-row gap-3 mb-6`}>
                            <Pressable
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setNewStaffRole('cashier');
                                }}
                                style={tw`flex-1 p-5 rounded-2xl border-2 items-center transition-all ${newStaffRole === 'cashier' ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-slate-200'}`}
                            >
                                <ShoppingCart size={24} color={newStaffRole === 'cashier' ? '#4f46e5' : '#94a3b8'} style={tw`mb-2`} />
                                <Text style={tw`font-bold ${newStaffRole === 'cashier' ? 'text-indigo-700' : 'text-slate-500'}`}>Cashier</Text>
                            </Pressable>

                            <Pressable
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setNewStaffRole('manager');
                                }}
                                style={tw`flex-1 p-5 rounded-2xl border-2 items-center transition-all ${newStaffRole === 'manager' ? 'bg-amber-50 border-amber-500' : 'bg-white border-slate-200'}`}
                            >
                                <Briefcase size={24} color={newStaffRole === 'manager' ? '#f59e0b' : '#94a3b8'} style={tw`mb-2`} />
                                <Text style={tw`font-bold ${newStaffRole === 'manager' ? 'text-amber-600' : 'text-slate-500'}`}>Manager</Text>
                            </Pressable>
                        </View>

                        <Text style={tw`text-slate-500 mb-2 ml-1 text-xs font-bold uppercase tracking-widest`}>Set 4-Digit PIN</Text>
                        <TextInput
                            style={tw`bg-slate-50 text-slate-900 text-center p-4 rounded-2xl border border-slate-200 mb-8 text-2xl tracking-[10px] font-black shadow-sm`}
                            placeholder="0000"
                            placeholderTextColor="#cbd5e1"
                            keyboardType="numeric"
                            maxLength={4}
                            value={newStaffPin}
                            onChangeText={setNewStaffPin}
                        />

                        <Pressable
                            onPress={handleAddStaff}
                            disabled={addingStaff}
                            style={({ pressed }) => [
                                tw`bg-indigo-600 p-5 rounded-2xl items-center mb-8 shadow-sm transition-all`,
                                pressed && tw`scale-95 bg-indigo-700 shadow-none`
                            ]}
                        >
                            {addingStaff ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={tw`text-white font-black uppercase tracking-wide text-lg`}>Create Account</Text>
                            )}
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ============================================================ */}
            {/* MODAL 2: EDIT PIN */}
            {/* ============================================================ */}
            <Modal visible={isPinModalOpen} animationType="fade" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1 justify-center items-center bg-black/40`}>
                    <View style={tw`bg-white w-[90%] p-8 rounded-[2rem] border border-slate-200 shadow-2xl`}>
                        <View style={tw`items-center mb-8`}>
                            <View style={tw`bg-indigo-50 p-5 rounded-full mb-5 border border-indigo-100`}>
                                <KeyRound size={40} color="#4f46e5" />
                            </View>
                            <Text style={tw`text-slate-900 text-2xl font-black tracking-tight`}>Change Access PIN</Text>
                            <Text style={tw`text-slate-500 text-center mt-2 font-medium`}>
                                Enter a new 4-digit PIN for this {editingMemberRole}.
                            </Text>
                        </View>

                        <TextInput
                            style={tw`bg-slate-50 text-slate-900 text-center text-4xl p-5 rounded-2xl border border-slate-200 mb-10 font-black tracking-[16px] shadow-sm`}
                            placeholder="0000"
                            placeholderTextColor="#cbd5e1"
                            keyboardType="numeric"
                            maxLength={4}
                            autoFocus={true}
                            value={editPinValue}
                            onChangeText={setEditPinValue}
                        />

                        <View style={tw`flex-row gap-4`}>
                            <Pressable
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setIsPinModalOpen(false);
                                }}
                                style={({ pressed }) => [
                                    tw`flex-1 bg-slate-100 p-4 rounded-2xl items-center border border-slate-200 transition-all`,
                                    pressed && tw`bg-slate-200 scale-95`
                                ]}
                            >
                                <Text style={tw`text-slate-700 font-bold text-lg`}>Cancel</Text>
                            </Pressable>

                            <Pressable
                                onPress={handleSavePin}
                                disabled={updatingPin}
                                style={({ pressed }) => [
                                    tw`flex-1 bg-indigo-600 p-4 rounded-2xl items-center shadow-sm transition-all`,
                                    pressed && tw`bg-indigo-700 scale-95 shadow-none`
                                ]}
                            >
                                {updatingPin ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text style={tw`text-white font-bold text-lg`}>Save PIN</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

        </View>
    );
}