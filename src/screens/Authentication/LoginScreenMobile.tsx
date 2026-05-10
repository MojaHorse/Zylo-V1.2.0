import React from 'react';
import { View, Text, Pressable, ActivityIndicator, Dimensions, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import tw from 'twrnc';
import { ArrowLeft, Store, Keyboard, Users, ChevronRight } from 'lucide-react-native';
import { useLoginLogic, StaffMember } from '../../hooks/useLoginLogic';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const BUTTON_SIZE = width / 4.5;

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

export default function LoginScreenMobile() {
    const { 
        step, 
        staffId, 
        pin, 
        loading, 
        selectedBusiness, 
        handlePress, 
        handleDelete, 
        handleSwitchBusiness, 
        resetStep,
        staffMembers,
        loadingStaff,
        isManualEntry,
        selectedStaffName,
        selectStaff,
        toggleManualEntry,
    } = useLoginLogic();

    const keypadRows = [
        ['1', '2', '3'], 
        ['4', '5', '6'], 
        ['7', '8', '9']
    ];

    const onKeyPress = (num: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handlePress(num);
    };

    const onDelete = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handleDelete();
    };

    // ============================================================
    // STEP 1: Staff Picker
    // ============================================================
    const renderStaffPicker = () => (
        <View style={tw`flex-1`}>
            {/* Header */}
            <View style={tw`px-6 pt-4 flex-row justify-between items-center z-10`}>
                <Pressable 
                    onPress={() => {
                        Haptics.selectionAsync();
                        handleSwitchBusiness();
                    }} 
                    style={({ pressed }) => [
                        tw`flex-row items-center bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm`,
                        pressed && tw`bg-slate-50 scale-95`
                    ]}
                >
                    <ArrowLeft color="#64748b" size={16} />
                    <Text style={tw`text-slate-600 font-bold ml-2 text-xs`}>Switch Shop</Text>
                </Pressable>

                <View style={tw`flex-row items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100`}>
                    <Store size={14} color="#4338ca" />
                    <Text style={tw`text-indigo-700 font-bold text-xs uppercase tracking-wider`}>
                        {selectedBusiness?.name || 'Loading...'}
                    </Text>
                </View>
            </View>

            {/* Title */}
            <View style={tw`px-6 pt-8 pb-4`}>
                <Text style={tw`text-indigo-600 uppercase tracking-widest text-xs font-bold`}>
                    Authentication
                </Text>
                <Text style={tw`text-slate-900 text-3xl font-black tracking-tight mt-1`}>
                    Who's clocking in?
                </Text>
            </View>

            {/* Staff List or Manual Entry */}
            {isManualEntry ? (
                // --- Manual ID Entry Mode ---
                <View style={tw`flex-1 justify-center items-center`}>
                    <View style={tw`items-center gap-2 mb-8`}>
                        <Text style={tw`text-slate-900 text-2xl font-black tracking-tight`}>
                            Enter Staff ID
                        </Text>
                        <Text style={tw`text-4xl font-black tracking-[0.5em] text-slate-900 mt-2`}>
                            {staffId || '______'}
                        </Text>
                    </View>

                    {/* Numpad */}
                    <View style={tw`gap-y-4`}>
                        {keypadRows.map((row, i) => (
                            <View key={i} style={tw`flex-row gap-4`}>
                                {row.map((num) => (
                                    <Pressable 
                                        key={num} 
                                        onPress={() => onKeyPress(num)} 
                                        disabled={loading} 
                                        style={({ pressed }) => [
                                            tw`items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm`,
                                            { width: BUTTON_SIZE, height: BUTTON_SIZE },
                                            pressed && tw`bg-indigo-50 border-indigo-200 scale-95 shadow-none`
                                        ]}
                                    >
                                        <Text style={tw`text-slate-800 text-3xl font-semibold`}>{num}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        ))}
                        <View style={tw`flex-row gap-4`}>
                            <Pressable 
                                onPress={toggleManualEntry}
                                style={({ pressed }) => [
                                    tw`items-center justify-center rounded-full`,
                                    { width: BUTTON_SIZE, height: BUTTON_SIZE },
                                    pressed && tw`bg-slate-100 scale-95`
                                ]}
                            >
                                <Users size={20} color="#64748b" />
                                <Text style={tw`text-slate-400 text-[10px] font-bold mt-1`}>Back</Text>
                            </Pressable>
                            
                            <Pressable 
                                onPress={() => onKeyPress('0')} 
                                disabled={loading} 
                                style={({ pressed }) => [
                                    tw`items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm`,
                                    { width: BUTTON_SIZE, height: BUTTON_SIZE },
                                    pressed && tw`bg-indigo-50 border-indigo-200 scale-95 shadow-none`
                                ]}
                            >
                                <Text style={tw`text-slate-800 text-3xl font-semibold`}>0</Text>
                            </Pressable>

                            <Pressable 
                                onPress={onDelete} 
                                disabled={loading} 
                                style={({ pressed }) => [
                                    tw`items-center justify-center rounded-full`,
                                    { width: BUTTON_SIZE, height: BUTTON_SIZE },
                                    pressed && tw`bg-red-50 scale-95 border border-red-100`
                                ]}
                            >
                                <Text style={tw`text-red-500 text-lg font-bold`}>DEL</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            ) : (
                // --- Staff Picker Mode ---
                <View style={tw`flex-1 px-6`}>
                    {loadingStaff ? (
                        <View style={tw`flex-1 justify-center items-center`}>
                            <ActivityIndicator size="large" color="#4f46e5" />
                            <Text style={tw`text-slate-400 font-bold mt-4 text-sm`}>Loading team...</Text>
                        </View>
                    ) : staffMembers.length === 0 ? (
                        <View style={tw`flex-1 justify-center items-center px-8`}>
                            <View style={tw`bg-slate-100 p-6 rounded-full mb-6`}>
                                <Users size={40} color="#94a3b8" />
                            </View>
                            <Text style={tw`text-slate-900 font-black text-xl text-center mb-2`}>No Staff Found</Text>
                            <Text style={tw`text-slate-400 text-center font-medium text-sm`}>
                                Ask the business owner to add staff from Settings → Staff Management.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={staffMembers}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={tw`pb-24`}
                            renderItem={({ item }) => {
                                const colors = ROLE_COLORS[item.role] || ROLE_COLORS.cashier;
                                return (
                                    <Pressable
                                        onPress={() => selectStaff(item)}
                                        style={({ pressed }) => [
                                            tw`flex-row items-center p-4 mb-3 rounded-2xl bg-white border border-slate-200 shadow-sm`,
                                            pressed && tw`scale-[0.98] bg-slate-50 border-indigo-200`
                                        ]}
                                    >
                                        {/* Avatar */}
                                        <View style={tw`${colors.avatar} w-14 h-14 rounded-full items-center justify-center mr-4`}>
                                            <Text style={tw`text-white font-black text-lg`}>
                                                {getInitials(item.full_name)}
                                            </Text>
                                        </View>

                                        {/* Info */}
                                        <View style={tw`flex-1`}>
                                            <Text style={tw`text-slate-900 font-bold text-lg`}>
                                                {item.full_name}
                                            </Text>
                                            <View style={tw`flex-row items-center gap-2 mt-1`}>
                                                <Text style={tw`${colors.text} text-[10px] font-black ${colors.bg} ${colors.border} border px-2 py-0.5 rounded uppercase tracking-wider`}>
                                                    {item.role}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Arrow */}
                                        <ChevronRight size={20} color="#cbd5e1" />
                                    </Pressable>
                                );
                            }}
                        />
                    )}

                    {/* Manual entry toggle */}
                    {!loadingStaff && (
                        <View style={tw`absolute bottom-6 left-0 right-0 items-center`}>
                            <Pressable
                                onPress={toggleManualEntry}
                                style={({ pressed }) => [
                                    tw`flex-row items-center gap-2 bg-white px-5 py-3 rounded-full border border-slate-200 shadow-sm`,
                                    pressed && tw`bg-slate-50 scale-95`
                                ]}
                            >
                                <Keyboard size={16} color="#64748b" />
                                <Text style={tw`text-slate-500 font-bold text-sm`}>Enter ID manually</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            )}
        </View>
    );

    // ============================================================
    // STEP 2: PIN Entry (unchanged)
    // ============================================================
    const renderPinEntry = () => (
        <View style={tw`flex-1`}>
            {/* Header */}
            <View style={tw`px-6 pt-4 flex-row justify-between items-center z-10`}>
                <Pressable 
                    onPress={() => {
                        Haptics.selectionAsync();
                        resetStep();
                    }} 
                    style={({ pressed }) => [
                        tw`flex-row items-center bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm`,
                        pressed && tw`bg-slate-50 scale-95`
                    ]}
                >
                    <ArrowLeft color="#64748b" size={16} />
                    <Text style={tw`text-slate-600 font-bold ml-2 text-xs`}>Back</Text>
                </Pressable>

                <View style={tw`flex-row items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100`}>
                    <Store size={14} color="#4338ca" />
                    <Text style={tw`text-indigo-700 font-bold text-xs uppercase tracking-wider`}>
                        {selectedBusiness?.name || 'Loading...'}
                    </Text>
                </View>
            </View>

            {/* Title + Dots */}
            <View style={tw`flex-1 justify-center items-center gap-6`}>
                <View style={tw`items-center gap-2`}>
                    <Text style={tw`text-indigo-600 uppercase tracking-widest text-xs font-bold`}>
                        Security Check
                    </Text>
                    <Text style={tw`text-slate-900 text-3xl font-black tracking-tight`}>
                        Enter PIN
                    </Text>
                    {selectedStaffName ? (
                        <Text style={tw`text-slate-400 font-bold text-base mt-1`}>
                            Welcome, {selectedStaffName.split(' ')[0]}
                        </Text>
                    ) : null}
                </View>

                {/* PIN Dots */}
                <View style={tw`h-12 justify-center items-center`}>
                    <View style={tw`flex-row gap-4`}>
                        {[...Array(4)].map((_, i) => (
                            <View 
                                key={i} 
                                style={tw`w-4 h-4 rounded-full ${i < pin.length ? 'bg-indigo-600 scale-125' : 'bg-slate-200'}`} 
                            />
                        ))}
                    </View>
                </View>
            </View>

            {/* Keypad */}
            <View style={tw`px-8 pb-10 items-center justify-end`}>
                <View style={tw`gap-y-4`}>
                    {keypadRows.map((row, i) => (
                        <View key={i} style={tw`flex-row gap-4`}>
                            {row.map((num) => (
                                <Pressable 
                                    key={num} 
                                    onPress={() => onKeyPress(num)} 
                                    disabled={loading} 
                                    style={({ pressed }) => [
                                        tw`items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm`,
                                        { width: BUTTON_SIZE, height: BUTTON_SIZE },
                                        pressed && tw`bg-indigo-50 border-indigo-200 scale-95 shadow-none`
                                    ]}
                                >
                                    <Text style={tw`text-slate-800 text-3xl font-semibold`}>{num}</Text>
                                </Pressable>
                            ))}
                        </View>
                    ))}
                    
                    {/* Bottom Row */}
                    <View style={tw`flex-row gap-4`}>
                        <Pressable 
                            onPress={() => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                Alert.alert(
                                    'Forgot PIN?', 
                                    'Please ask your manager to check or reset your credentials.'
                                );
                            }}
                            style={({ pressed }) => [
                                tw`items-center justify-center rounded-full`,
                                { width: BUTTON_SIZE, height: BUTTON_SIZE },
                                pressed && tw`bg-slate-100 scale-95`
                            ]}
                        >
                            <Text style={tw`text-slate-400 text-sm font-bold text-center`}>{'Forgot\nPIN?'}</Text>
                        </Pressable>
                        
                        <Pressable 
                            onPress={() => onKeyPress('0')} 
                            disabled={loading} 
                            style={({ pressed }) => [
                                tw`items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm`,
                                { width: BUTTON_SIZE, height: BUTTON_SIZE },
                                pressed && tw`bg-indigo-50 border-indigo-200 scale-95 shadow-none`
                            ]}
                        >
                            <Text style={tw`text-slate-800 text-3xl font-semibold`}>0</Text>
                        </Pressable>

                        <Pressable 
                            onPress={onDelete} 
                            disabled={loading} 
                            style={({ pressed }) => [
                                tw`items-center justify-center rounded-full`,
                                { width: BUTTON_SIZE, height: BUTTON_SIZE },
                                pressed && tw`bg-red-50 scale-95 border border-red-100`
                            ]}
                        >
                            <Text style={tw`text-red-500 text-lg font-bold`}>DEL</Text>
                        </Pressable>
                    </View>
                </View>

                {loading && (
                    <View style={tw`absolute inset-0 justify-center items-center`}>
                        <View style={tw`bg-white/80 absolute inset-0`} />
                        <ActivityIndicator size="large" color="#4f46e5" />
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={tw`flex-1 bg-slate-50`}>
            <StatusBar style="dark" />
            {step === 1 ? renderStaffPicker() : renderPinEntry()}
        </SafeAreaView>
    );
}