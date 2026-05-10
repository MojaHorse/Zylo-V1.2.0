import React from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, Alert, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import tw from 'twrnc';
import { ArrowLeft, Store, Keyboard, Users, ChevronRight } from 'lucide-react-native';
import { useLoginLogic, StaffMember } from '../../hooks/useLoginLogic';
import * as Haptics from 'expo-haptics';

// Role color mapping
const ROLE_COLORS: Record<string, { bg: string; text: string; border: string; avatar: string }> = {
    owner: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', avatar: 'bg-indigo-600' },
    manager: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', avatar: 'bg-amber-500' },
    cashier: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', avatar: 'bg-slate-500' },
};

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export default function LoginScreenTablet() {
    const { 
        step, staffId, pin, loading, selectedBusiness, 
        handlePress, handleDelete, handleSwitchBusiness, resetStep,
        staffMembers, loadingStaff, isManualEntry, selectedStaffName,
        selectStaff, toggleManualEntry,
    } = useLoginLogic();

    const keypadRows = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']];

    const onKeyPress = (num: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handlePress(num);
    };

    const onDelete = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handleDelete();
    };

    // ============================================================
    // LEFT PANEL — Info + Branding (shared between steps)
    // ============================================================
    const renderLeftPanel = () => (
        <View style={tw`flex-1 bg-white border-r border-slate-200 items-center justify-center p-12 shadow-sm z-10`}>
            <Image source={require('../../../assets/Full_Logo.png')} style={tw`w-64 h-64 mb-10`} resizeMode="contain" />
            <View style={tw`w-full max-w-xs`}>
                <Text style={tw`text-indigo-600 font-bold uppercase tracking-widest text-xs mb-2`}>
                    {step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
                </Text>
                <Text style={tw`text-slate-900 text-5xl font-black mb-4 tracking-tight`}>
                    {step === 1 ? 'Select Staff' : 'Enter PIN'}
                </Text>
                
                {step === 2 && selectedStaffName ? (
                    <View style={tw`bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex-row items-center gap-4 mb-4`}>
                        <View style={tw`bg-indigo-600 w-12 h-12 rounded-full items-center justify-center`}>
                            <Text style={tw`text-white font-black text-lg`}>
                                {getInitials(selectedStaffName)}
                            </Text>
                        </View>
                        <View>
                            <Text style={tw`text-slate-500 text-xs uppercase font-bold tracking-wider`}>Clocking In</Text>
                            <Text style={tw`text-slate-900 font-black text-lg`}>{selectedStaffName}</Text>
                        </View>
                    </View>
                ) : null}

                <View style={tw`bg-slate-50 p-4 rounded-2xl border border-slate-200 flex-row items-center gap-4`}>
                    <View style={tw`bg-indigo-100 p-2.5 rounded-full`}><Store size={24} color="#4338ca" /></View>
                    <View>
                        <Text style={tw`text-slate-500 text-xs uppercase font-bold tracking-wider`}>Current Shop</Text>
                        <Text style={tw`text-slate-900 font-black text-lg`}>{selectedBusiness?.name}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    // ============================================================
    // RIGHT PANEL — Step 1: Staff Picker
    // ============================================================
    const renderStaffPickerPanel = () => (
        <View style={tw`flex-1 bg-slate-50 relative`}>
            {/* Top Actions */}
            <Pressable 
                onPress={() => {
                    Haptics.selectionAsync();
                    handleSwitchBusiness();
                }} 
                style={({ pressed }) => [
                    tw`absolute top-10 left-10 flex-row items-center gap-2 p-3 rounded-full`,
                    pressed && tw`bg-slate-200 scale-95`
                ]}
            >
                <ArrowLeft color="#64748b" size={24} />
                <Text style={tw`text-slate-600 font-bold text-lg`}>Switch Shop</Text>
            </Pressable>

            {isManualEntry ? (
                // --- Manual ID Entry Mode ---
                <View style={tw`flex-1 items-center justify-center`}>
                    <View style={tw`mb-12 items-center h-24 justify-center`}>
                        <Text style={tw`text-slate-500 font-bold text-sm uppercase tracking-widest mb-4`}>Enter Staff ID</Text>
                        <View style={tw`flex-row gap-6`}>
                            {[...Array(6)].map((_, i) => (
                                <View key={i} style={tw`w-5 h-5 rounded-full ${i < staffId.length ? 'bg-indigo-600 scale-110' : 'bg-slate-200'}`} />
                            ))}
                        </View>
                        <Text style={tw`text-slate-900 text-4xl font-black mt-6 tracking-[0.5em] h-12`}>{staffId}</Text>
                    </View>

                    <View style={tw`w-[360px] gap-y-6`}>
                        {keypadRows.map((row, i) => (
                            <View key={i} style={tw`flex-row justify-between w-full`}>
                                {row.map((num) => (
                                    <Pressable 
                                        key={num} 
                                        onPress={() => onKeyPress(num)} 
                                        disabled={loading} 
                                        style={({ pressed }) => [
                                            tw`w-24 h-24 rounded-full items-center justify-center border border-slate-200 bg-white shadow-sm`,
                                            pressed && tw`bg-indigo-50 border-indigo-200 scale-95 shadow-none`
                                        ]}
                                    >
                                        <Text style={tw`text-slate-800 text-4xl font-semibold`}>{num}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        ))}
                        <View style={tw`flex-row justify-between w-full`}>
                            <Pressable 
                                onPress={toggleManualEntry}
                                style={({ pressed }) => [
                                    tw`w-24 h-24 rounded-full items-center justify-center`,
                                    pressed && tw`bg-slate-100 scale-95`
                                ]}
                            >
                                <Users size={22} color="#64748b" />
                                <Text style={tw`text-slate-400 text-xs font-bold mt-1`}>Back</Text>
                            </Pressable>
                            <Pressable 
                                onPress={() => onKeyPress('0')} 
                                disabled={loading} 
                                style={({ pressed }) => [
                                    tw`w-24 h-24 rounded-full items-center justify-center border border-slate-200 bg-white shadow-sm`,
                                    pressed && tw`bg-indigo-50 border-indigo-200 scale-95 shadow-none`
                                ]}
                            >
                                <Text style={tw`text-slate-800 text-4xl font-semibold`}>0</Text>
                            </Pressable>
                            <Pressable 
                                onPress={onDelete} 
                                disabled={loading} 
                                style={({ pressed }) => [
                                    tw`w-24 h-24 rounded-full items-center justify-center`,
                                    pressed && tw`bg-red-50 scale-95 border border-red-100`
                                ]}
                            >
                                <Text style={tw`text-red-500 text-xl font-bold`}>DEL</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            ) : (
                // --- Staff Picker Grid ---
                <View style={tw`flex-1 pt-24 px-10`}>
                    <Text style={tw`text-slate-500 font-bold text-xs uppercase tracking-widest mb-6`}>
                        Select Your Profile
                    </Text>

                    {loadingStaff ? (
                        <View style={tw`flex-1 justify-center items-center`}>
                            <ActivityIndicator size="large" color="#4f46e5" />
                            <Text style={tw`text-slate-400 font-bold mt-4 text-sm`}>Loading team...</Text>
                        </View>
                    ) : staffMembers.length === 0 ? (
                        <View style={tw`flex-1 justify-center items-center px-8`}>
                            <View style={tw`bg-slate-100 p-8 rounded-full mb-6`}>
                                <Users size={48} color="#94a3b8" />
                            </View>
                            <Text style={tw`text-slate-900 font-black text-2xl text-center mb-2`}>No Staff Found</Text>
                            <Text style={tw`text-slate-400 text-center font-medium`}>
                                Ask the business owner to add staff from Settings → Staff Management.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={staffMembers}
                            keyExtractor={item => item.id}
                            numColumns={2}
                            columnWrapperStyle={tw`gap-4 mb-4`}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={tw`pb-24`}
                            renderItem={({ item }) => {
                                const colors = ROLE_COLORS[item.role] || ROLE_COLORS.cashier;
                                return (
                                    <Pressable
                                        onPress={() => selectStaff(item)}
                                        style={({ pressed }) => [
                                            tw`flex-1 items-center p-6 rounded-3xl bg-white border border-slate-200 shadow-sm`,
                                            pressed && tw`scale-[0.97] bg-slate-50 border-indigo-200`
                                        ]}
                                    >
                                        <View style={tw`${colors.avatar} w-18 h-18 rounded-full items-center justify-center mb-4`}>
                                            <Text style={tw`text-white font-black text-2xl`}>
                                                {getInitials(item.full_name)}
                                            </Text>
                                        </View>
                                        <Text style={tw`text-slate-900 font-bold text-lg text-center`}>
                                            {item.full_name}
                                        </Text>
                                        <Text style={tw`${colors.text} text-[10px] font-black ${colors.bg} ${colors.border} border px-2.5 py-1 rounded-full uppercase tracking-wider mt-2`}>
                                            {item.role}
                                        </Text>
                                    </Pressable>
                                );
                            }}
                        />
                    )}

                    {/* Manual entry toggle */}
                    {!loadingStaff && (
                        <View style={tw`absolute bottom-8 left-0 right-0 items-center`}>
                            <Pressable
                                onPress={toggleManualEntry}
                                style={({ pressed }) => [
                                    tw`flex-row items-center gap-2 bg-white px-6 py-3 rounded-full border border-slate-200 shadow-sm`,
                                    pressed && tw`bg-slate-50 scale-95`
                                ]}
                            >
                                <Keyboard size={18} color="#64748b" />
                                <Text style={tw`text-slate-500 font-bold`}>Enter ID manually</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            )}
        </View>
    );

    // ============================================================
    // RIGHT PANEL — Step 2: PIN Entry (preserved from original)
    // ============================================================
    const renderPinPanel = () => (
        <View style={tw`flex-1 items-center justify-center bg-slate-50 relative`}>
            <Pressable 
                onPress={() => {
                    Haptics.selectionAsync();
                    resetStep();
                }} 
                style={({ pressed }) => [
                    tw`absolute top-10 left-10 flex-row items-center gap-2 p-3 rounded-full`,
                    pressed && tw`bg-slate-200 scale-95`
                ]}
            >
                <ArrowLeft color="#64748b" size={24} />
                <Text style={tw`text-slate-600 font-bold text-lg`}>Back</Text>
            </Pressable>

            <View style={tw`mb-12 items-center h-24 justify-center`}>
                 <View style={tw`flex-row gap-6`}>
                     {[...Array(4)].map((_, i) => (
                         <View key={i} style={tw`w-5 h-5 rounded-full ${i < pin.length ? 'bg-indigo-600 scale-110' : 'bg-slate-200'}`} />
                     ))}
                 </View>
                 {selectedStaffName ? (
                    <Text style={tw`text-slate-400 font-bold text-lg mt-6`}>
                        Welcome, {selectedStaffName.split(' ')[0]}
                    </Text>
                 ) : (
                    <Text style={tw`text-slate-400 font-bold text-base mt-6`}>Enter your 4-digit PIN</Text>
                 )}
            </View>

            <View style={tw`w-[360px] gap-y-6`}>
                {keypadRows.map((row, i) => (
                    <View key={i} style={tw`flex-row justify-between w-full`}>
                        {row.map((num) => (
                            <Pressable 
                                key={num} 
                                onPress={() => onKeyPress(num)} 
                                disabled={loading} 
                                style={({ pressed }) => [
                                    tw`w-24 h-24 rounded-full items-center justify-center border border-slate-200 bg-white shadow-sm`,
                                    pressed && tw`bg-indigo-50 border-indigo-200 scale-95 shadow-none`
                                ]}
                            >
                                <Text style={tw`text-slate-800 text-4xl font-semibold`}>{num}</Text>
                            </Pressable>
                        ))}
                    </View>
                ))}
                <View style={tw`flex-row justify-between w-full`}>
                    <Pressable 
                        onPress={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                            Alert.alert('Forgot PIN?', 'Please ask your manager to check or reset your credentials.');
                        }}
                        style={({ pressed }) => [
                            tw`w-24 h-24 rounded-full items-center justify-center`,
                            pressed && tw`bg-slate-100 scale-95`
                        ]}
                    >
                        <Text style={tw`text-slate-400 text-lg font-bold text-center`}>{'Forgot\nPIN?'}</Text>
                    </Pressable>
                    <Pressable 
                        onPress={() => onKeyPress('0')} 
                        disabled={loading} 
                        style={({ pressed }) => [
                            tw`w-24 h-24 rounded-full items-center justify-center border border-slate-200 bg-white shadow-sm`,
                            pressed && tw`bg-indigo-50 border-indigo-200 scale-95 shadow-none`
                        ]}
                    >
                        <Text style={tw`text-slate-800 text-4xl font-semibold`}>0</Text>
                    </Pressable>
                    <Pressable 
                        onPress={onDelete} 
                        disabled={loading} 
                        style={({ pressed }) => [
                            tw`w-24 h-24 rounded-full items-center justify-center`,
                            pressed && tw`bg-red-50 scale-95 border border-red-100`
                        ]}
                    >
                        <Text style={tw`text-red-500 text-xl font-bold`}>DEL</Text>
                    </Pressable>
                </View>
            </View>
            {loading && <ActivityIndicator style={tw`absolute bottom-10`} size="large" color="#4f46e5" />}
        </View>
    );

    return (
        <View style={tw`flex-1 bg-slate-50 flex-row`}>
            <StatusBar style="dark" />
            {renderLeftPanel()}
            {step === 1 ? renderStaffPickerPanel() : renderPinPanel()}
        </View>
    );
}