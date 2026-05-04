import React, { useEffect, useState } from 'react';
import { 
    View, Text, Modal, FlatList, Alert, 
    ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Pressable 
} from 'react-native';
import tw from 'twrnc';
import { 
    X, Trash2, Plus, KeyRound, Briefcase, ShoppingCart, ArrowLeft, 
    Copy, Maximize2 
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../Context/BusinessContext';
import { useAuth } from '../Context/AuthContext';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function StaffManagerModal({ visible, onClose }: Props) {
    const { user, activeStaff } = useAuth();
    const { selectedBusiness: business } = useBusiness();
    const myRole = activeStaff?.role;
    const navigation = useNavigation<any>(); 
    
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI States
    const [viewMode, setViewMode] = useState<'list' | 'add' | 'success'>('list');
    const [processing, setProcessing] = useState(false);

    // Form State
    const [newName, setNewName] = useState('');
    const [newPin, setNewPin] = useState('');
    const [newRole, setNewRole] = useState<'manager' | 'cashier'>('cashier');

    // Success State
    const [createdStaffId, setCreatedStaffId] = useState('');
    const [createdStaffName, setCreatedStaffName] = useState('');

    useEffect(() => {
        if (visible && business) {
            fetchStaff();
            setViewMode('list');
        }
    }, [visible, business]);

    const fetchStaff = async () => {
        setLoading(true);
        if (!business) return;

        const { data, error } = await supabase
            .from('business_members')
            .select('*, profiles(full_name)') 
            .eq('business_id', business.id)
            .eq('is_active', true)
            .order('role', { ascending: false });

        if (error) Alert.alert("Error", error.message);
        else setStaff(data || []);
        
        setLoading(false);
    };

    const handleAddStaff = async () => {
        if (!newName || newPin.length !== 4) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return Alert.alert("Invalid", "Name required & PIN must be 4 digits.");
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setProcessing(true);
        try {
            const { data, error } = await supabase.rpc('create_staff_member', {
                full_name: newName,
                pin: newPin,
                role: newRole,
                business_id: business?.id
            });

            if (error) throw error;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setCreatedStaffId(data.staff_number);
            setCreatedStaffName(data.full_name);
            setViewMode('success');
            fetchStaff();

        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", error.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdatePin = async (memberId: string, roleName: string) => {
        Haptics.selectionAsync();
        if (Platform.OS === 'android') {
             Alert.alert("Notice", "PIN editing is optimized for iOS. To change PIN on Android, please remove and re-add the staff member.");
             return;
        }

        Alert.prompt(
            "Change PIN",
            `Enter new 4-digit PIN for this ${roleName}.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Save",
                    onPress: async (pin?: string) => {
                        if (!pin || pin.length !== 4) return Alert.alert("Error", "PIN must be 4 digits");
                        const { error } = await supabase.rpc('update_member_pin', { member_id: memberId, new_pin: pin });
                        if (!error) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert("Success", "PIN Updated");
                        } else {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            Alert.alert("Error", error.message);
                        }
                    }
                }
            ],
            "plain-text",
            "",
            "numeric"
        );
    };

    const handleRemove = async (memberId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        if (myRole !== 'owner') return Alert.alert("Permission Denied", "Only Owners can delete staff.");

        Alert.alert("Delete Staff?", "This cannot be undone. They will lose access immediately.", [
            { text: "Cancel" },
            { 
                text: "Delete", 
                style: 'destructive', 
                onPress: async () => {
                    const { error } = await supabase
                        .from('business_members')
                        .delete()
                        .eq('id', memberId);
                    
                    if (error) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        Alert.alert("Error", error.message);
                    } else {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        fetchStaff();
                    }
                }
            }
        ]);
    };

    const copyToClipboard = async () => {
        Haptics.selectionAsync();
        await Clipboard.setStringAsync(createdStaffId);
        Alert.alert("Copied", "Staff ID copied to clipboard.");
    };

    const getDisplayName = (item: any) => {
        return item.full_name || item.profiles?.full_name || 'Unknown Staff';
    };

    const handleGoToStaffScreen = () => {
        Haptics.selectionAsync();
        onClose(); 
        navigation.navigate('Staff'); 
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1`}>
                <View style={tw`flex-1 bg-black/40 justify-center items-center p-4`}>
                    <View style={tw`bg-slate-50 w-full max-w-lg rounded-[2rem] border border-slate-200 shadow-2xl max-h-[85%] overflow-hidden`}>
                        
                        {/* HEADER */}
                        <View style={tw`p-5 border-b border-slate-200 flex-row justify-between items-center bg-white`}>
                            {viewMode === 'list' ? (
                                <Text style={tw`text-slate-900 text-2xl font-black tracking-tight`}>Manage Team</Text>
                            ) : (
                                <Pressable 
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setViewMode('list');
                                    }} 
                                    style={({ pressed }) => [
                                        tw`flex-row items-center transition-all bg-slate-100 px-3 py-2 rounded-lg`,
                                        pressed && tw`scale-95 bg-slate-200`
                                    ]}
                                >
                                    <ArrowLeft color="#64748b" size={18} />
                                    <Text style={tw`text-slate-700 text-sm font-bold ml-1`}>Back</Text>
                                </Pressable>
                            )}
                            
                            {/* RIGHT SIDE ACTIONS */}
                            <View style={tw`flex-row items-center gap-3`}>
                                <Pressable 
                                    onPress={handleGoToStaffScreen}
                                    style={({ pressed }) => [
                                        tw`px-3 py-2 rounded-xl flex-row items-center gap-1.5 transition-all`,
                                        pressed && tw`scale-95 opacity-50`
                                    ]}
                                >
                                    <Maximize2 size={16} color="#4f46e5" />
                                    <Text style={tw`text-indigo-600 text-xs font-bold`}>Full Screen</Text>
                                </Pressable>

                                <Pressable 
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        onClose();
                                    }}
                                    style={({ pressed }) => [
                                        tw`p-2 bg-slate-100 rounded-full transition-all`,
                                        pressed && tw`scale-90 bg-slate-200`
                                    ]}
                                >
                                    <X color="#64748b" size={20} />
                                </Pressable>
                            </View>
                        </View>

                        {/* --- VIEW 1: LIST --- */}
                        {viewMode === 'list' && (
                            <>
                                {loading ? <ActivityIndicator color="#4f46e5" style={tw`my-10`} /> : (
                                    <FlatList
                                        data={staff}
                                        keyExtractor={item => item.id}
                                        contentContainerStyle={tw`p-4 pb-10`}
                                        showsVerticalScrollIndicator={false}
                                        renderItem={({ item }) => (
                                            <View style={tw`flex-row justify-between items-center bg-white p-4 rounded-2xl mb-3 border border-slate-200 shadow-sm`}>
                                                <View style={tw`flex-row gap-4 items-center flex-1`}>
                                                    <View style={tw`bg-slate-50 border border-slate-100 p-3 rounded-full items-center justify-center`}>
                                                        {item.role === 'manager' ? <Briefcase size={22} color="#f59e0b" /> : <ShoppingCart size={22} color="#94a3b8" />}
                                                    </View>
                                                    <View>
                                                        <Text style={tw`text-slate-900 font-bold text-lg`}>{getDisplayName(item)}</Text>
                                                        <Text style={tw`text-slate-500 text-xs font-medium`}>ID: <Text style={tw`text-slate-700 font-bold`}>{item.staff_number}</Text> • <Text style={tw`uppercase font-bold ${item.role === 'manager' ? 'text-amber-500' : 'text-slate-400'}`}>{item.role}</Text></Text>
                                                    </View>
                                                </View>
                                                
                                                <View style={tw`flex-row gap-2`}>
                                                    <Pressable 
                                                        onPress={() => handleUpdatePin(item.id, item.role)} 
                                                        style={({ pressed }) => [
                                                            tw`bg-slate-50 border border-slate-100 px-3 py-3 rounded-xl justify-center transition-all`,
                                                            pressed && tw`scale-95 bg-slate-200`
                                                        ]}
                                                    >
                                                        <KeyRound size={18} color="#64748b" />
                                                    </Pressable>

                                                    {myRole === 'owner' && item.role !== 'owner' && (
                                                        <Pressable 
                                                            onPress={() => handleRemove(item.id)} 
                                                            style={({ pressed }) => [
                                                                tw`bg-red-50 p-3 rounded-xl justify-center border border-red-100 transition-all`,
                                                                pressed && tw`scale-95 bg-red-100`
                                                            ]}
                                                        >
                                                            <Trash2 size={18} color="#ef4444" />
                                                        </Pressable>
                                                    )}
                                                </View>
                                            </View>
                                        )}
                                    />
                                )}
                                <View style={tw`p-5 border-t border-slate-200 bg-white`}>
                                    <Pressable 
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setNewName(''); setNewPin(''); setViewMode('add');
                                        }} 
                                        style={({ pressed }) => [
                                            tw`flex-row bg-indigo-600 p-4 rounded-xl items-center justify-center gap-2 shadow-sm transition-all`,
                                            pressed && tw`scale-95 bg-indigo-700 shadow-none`
                                        ]}
                                    >
                                        <Plus size={20} color="white" />
                                        <Text style={tw`text-white font-bold text-base`}>Add New Staff</Text>
                                    </Pressable>
                                </View>
                            </>
                        )}

                        {/* --- VIEW 2: ADD FORM --- */}
                        {viewMode === 'add' && (
                            <View style={tw`p-6 bg-white flex-1`}>
                                <Text style={tw`text-slate-500 text-xs font-bold uppercase mb-2 tracking-widest ml-1`}>Staff Name</Text>
                                <TextInput style={tw`bg-slate-50 text-slate-900 p-4 rounded-2xl border border-slate-200 mb-6 font-bold text-lg shadow-sm`} placeholder="e.g. John" placeholderTextColor="#94a3b8" value={newName} onChangeText={setNewName} />

                                <Text style={tw`text-slate-500 text-xs font-bold uppercase mb-2 tracking-widest ml-1`}>Role</Text>
                                <View style={tw`flex-row gap-3 mb-6`}>
                                    <Pressable
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setNewRole('cashier');
                                        }}
                                        style={tw`flex-1 p-5 rounded-2xl border-2 items-center transition-all ${newRole === 'cashier' ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-slate-200'}`}
                                    >
                                        <Text style={tw`font-bold capitalize ${newRole === 'cashier' ? 'text-indigo-700' : 'text-slate-500'}`}>Cashier</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setNewRole('manager');
                                        }}
                                        style={tw`flex-1 p-5 rounded-2xl border-2 items-center transition-all ${newRole === 'manager' ? 'bg-amber-50 border-amber-500' : 'bg-white border-slate-200'}`}
                                    >
                                        <Text style={tw`font-bold capitalize ${newRole === 'manager' ? 'text-amber-600' : 'text-slate-500'}`}>Manager</Text>
                                    </Pressable>
                                </View>

                                <Text style={tw`text-slate-500 text-xs font-bold uppercase mb-2 tracking-widest ml-1`}>Access PIN</Text>
                                <TextInput style={tw`bg-slate-50 text-slate-900 p-4 rounded-2xl border border-slate-200 mb-8 text-center text-3xl tracking-[16px] font-black shadow-sm`} placeholder="0000" placeholderTextColor="#cbd5e1" keyboardType="numeric" maxLength={4} value={newPin} onChangeText={setNewPin} />

                                <Pressable 
                                    onPress={handleAddStaff} 
                                    disabled={processing} 
                                    style={({ pressed }) => [
                                        tw`bg-indigo-600 p-5 rounded-2xl items-center shadow-sm transition-all`,
                                        pressed && tw`scale-95 bg-indigo-700 shadow-none`
                                    ]}
                                >
                                    {processing ? <ActivityIndicator color="white" /> : <Text style={tw`text-white font-black text-lg uppercase tracking-wide`}>Create Account</Text>}
                                </Pressable>
                            </View>
                        )}

                        {/* --- VIEW 3: SUCCESS --- */}
                        {viewMode === 'success' && (
                            <View style={tw`p-8 items-center bg-white flex-1`}>
                                <View style={tw`bg-indigo-50 border border-indigo-100 p-6 rounded-full mb-6`}>
                                    <KeyRound size={48} color="#4f46e5" />
                                </View>
                                <Text style={tw`text-slate-900 text-3xl tracking-tight font-black mb-2 text-center`}>Account Created!</Text>
                                <Text style={tw`text-slate-500 text-center mb-8 font-medium`}>
                                    Please give <Text style={tw`font-bold text-slate-700`}>{createdStaffName}</Text> their unique Login ID. They will need this and their PIN to log in.
                                </Text>

                                <View style={tw`bg-slate-50 p-6 rounded-[2rem] border border-dashed border-indigo-300 w-full items-center mb-8`}>
                                    <Text style={tw`text-indigo-600 text-xs uppercase font-black tracking-widest mb-2`}>Login ID</Text>
                                    <Text style={tw`text-slate-900 text-5xl font-black tracking-widest`}>{createdStaffId}</Text>
                                </View>

                                <Pressable 
                                    onPress={copyToClipboard} 
                                    style={({ pressed }) => [
                                        tw`flex-row items-center gap-2 mb-8 bg-slate-100 px-5 py-3 rounded-full transition-all`,
                                        pressed && tw`scale-95 bg-slate-200`
                                    ]}
                                >
                                    <Copy size={16} color="#4f46e5" />
                                    <Text style={tw`text-indigo-700 font-bold`}>Copy Login ID</Text>
                                </Pressable>

                                <Pressable 
                                    onPress={() => setViewMode('list')} 
                                    style={({ pressed }) => [
                                        tw`bg-slate-900 p-4 rounded-2xl w-full items-center transition-all shadow-sm`,
                                        pressed && tw`scale-95 bg-slate-800`
                                    ]}
                                >
                                    <Text style={tw`text-white font-bold text-lg`}>Done</Text>
                                </Pressable>
                            </View>
                        )}

                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}