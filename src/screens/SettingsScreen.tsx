import React, { useState, useEffect } from 'react';
import {
    View, Text, Switch, TextInput, ScrollView,
    Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable, Modal, TouchableOpacity
} from 'react-native';
import tw from 'twrnc';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../../components/Context/AuthContext';
import { useBusiness } from '../../components/Context/BusinessContext';
import { supabase } from '../../lib/supabase';
import {
    LogOut, User, Printer, Percent, Shield, ChevronRight, Store,
    Receipt, Users, AlertTriangle, Smartphone, Lock, Banknote, Clock
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import StaffManagerModal from '../../components/Modals/StaffManagerModal';
import ManagerAuthModal from '../../components/Modals/ManagerAuthModal';
import ChangePinModal from '../../components/Modals/ChangePinModal';

export default function SettingsScreen() {
    const navigation = useNavigation<any>();
    const { signOut, user, activeStaff } = useAuth();
    const { selectedBusiness, refreshBusinesses } = useBusiness();

    const userRole = activeStaff?.role || selectedBusiness?.role || 'cashier';
    const canEdit = userRole === 'owner' || userRole === 'manager';

    // --- STATE ---
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showManagerAuth, setShowManagerAuth] = useState(false);
    const [showChangePin, setShowChangePin] = useState(false);

    // Form Fields
    const [storeName, setStoreName] = useState('');
    const [taxRate, setTaxRate] = useState('0');
    const [receiptFooter, setReceiptFooter] = useState('');
    const [lowStockThreshold, setLowStockThreshold] = useState('10');
    const [allowNegativeStock, setAllowNegativeStock] = useState(false);
    const [autoPrint, setAutoPrint] = useState(true);

    const [businessDayStartsAt, setBusinessDayStartsAt] = useState('00:00:00');
    const [showTimePicker, setShowTimePicker] = useState(false);

    const TIME_OPTIONS = [
        '00:00:00', '01:00:00', '02:00:00', '03:00:00', '04:00:00', '05:00:00', '06:00:00'
    ];

    // 1. FETCH FRESH DATA ON MOUNT
    useEffect(() => {
        if (selectedBusiness) fetchSettings();
    }, [selectedBusiness]);

    const fetchSettings = async () => {
        if (!selectedBusiness) return;
        setFetching(true);

        // Fetch directly from DB to get all columns (tax, receipt message, etc.)
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', selectedBusiness.id)
            .single();

        if (data && !error) {
            setStoreName(data.name || '');
            setTaxRate(String(data.tax_rate || '0'));
            setReceiptFooter(data.receipt_message || '');
            setLowStockThreshold(String(data.low_stock_threshold || '10'));
            setAllowNegativeStock(data.allow_negative_stock || false);
            setBusinessDayStartsAt(data.business_day_starts_at || '00:00:00');
        }
        setFetching(false);
    };

    // 2. SAVE SETTINGS
    const handleSave = async () => {
        if (!selectedBusiness) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);

        const updates = {
            name: storeName,
            tax_rate: parseFloat(taxRate) || 0,
            receipt_message: receiptFooter,
            low_stock_threshold: parseInt(lowStockThreshold) || 10,
            allow_negative_stock: allowNegativeStock,
            business_day_starts_at: businessDayStartsAt
        };

        const { error } = await supabase
            .from('businesses')
            .update(updates)
            .eq('id', selectedBusiness.id);

        setLoading(false);

        if (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", "Failed to save settings: " + error.message);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", "Settings updated successfully!");
            refreshBusinesses(); // Update global context
        }
    };

    const handleLogout = () => {
        Haptics.selectionAsync();
        Alert.alert(
            'Exit Options',
            'Do you want to switch users (Lock) or sign out completely?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Lock Register',
                    style: 'default',
                    onPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            })
                        )
                    }
                },
                {
                    text: 'Full Sign Out',
                    style: 'destructive',
                    onPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        if (canEdit) {
                            signOut();
                        } else {
                            setShowManagerAuth(true);
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    };

    // --- HELPER COMPONENTS ---
    const Section = ({ title, children }: any) => (
        <View style={tw`mb-8`}>
            <Text style={tw`text-slate-500 uppercase text-xs font-bold mb-3 ml-2 tracking-wider`}>{title}</Text>
            <View style={tw`overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-sm`}>
                {children}
            </View>
        </View>
    );

    const Row = ({ icon: Icon, label, value, onPress, isLast, color }: any) => (
        <Pressable
            onPress={() => {
                if (onPress) {
                    Haptics.selectionAsync();
                    onPress();
                }
            }}
            disabled={!onPress}
            style={({ pressed }) => [
                tw`flex-row items-center p-4 transition-all bg-white`,
                !isLast && tw`border-b border-slate-100`,
                pressed && onPress && tw`bg-slate-50`
            ]}
        >
            <View style={tw`p-2.5 rounded-xl mr-4 bg-slate-50 border border-slate-100`}>
                <Icon size={20} color={color || '#64748b'} />
            </View>
            <Text style={tw`flex-1 font-bold text-slate-900 text-base`}>{label}</Text>
            {value && <View>{value}</View>}
        </Pressable>
    );

    const ToggleRow = ({ icon: Icon, label, value, onValueChange, isLast }: any) => (
        <View style={[tw`flex-row items-center justify-between p-4 bg-white`, !isLast && tw`border-b border-slate-100`]}>
            <View style={tw`flex-row items-center`}>
                <View style={tw`p-2.5 rounded-xl mr-4 bg-slate-50 border border-slate-100`}>
                    <Icon size={20} color="#64748b" />
                </View>
                <Text style={tw`font-bold text-slate-900 text-base`}>{label}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={(val) => {
                    Haptics.selectionAsync();
                    onValueChange(val);
                }}
                trackColor={{ false: '#e2e8f0', true: '#4f46e5' }}
                thumbColor={'#ffffff'}
            />
        </View>
    );

    const InputRow = ({ icon: Icon, label, value, onChangeText, placeholder, isLast, numeric = false }: any) => (
        <View style={[tw`flex-row items-center justify-between p-4 bg-white`, !isLast && tw`border-b border-slate-100`]}>
            <View style={tw`flex-row items-center`}>
                <View style={tw`p-2.5 rounded-xl mr-4 bg-slate-50 border border-slate-100`}>
                    <Icon size={20} color="#64748b" />
                </View>
                <Text style={tw`font-bold text-slate-900 text-base`}>{label}</Text>
            </View>
            <TextInput
                style={tw`px-4 py-3 rounded-xl min-w-[120px] text-right border border-slate-200 font-bold bg-slate-50 text-slate-900`}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                keyboardType={numeric ? 'numeric' : 'default'}
                editable={canEdit}
            />
        </View>
    );

    if (fetching) {
        return (
            <View style={tw`flex-1 justify-center items-center bg-slate-50`}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={tw`mt-4 text-slate-500 font-bold`}>Loading Settings...</Text>
            </View>
        );
    }

    return (
        <View style={tw`flex-1 bg-slate-50`}>
            {/* Header */}
            <View style={tw`p-8 pb-6 border-b border-slate-200 bg-white shadow-sm flex-row justify-between items-center z-10`}>
                <View>
                    <Text style={tw`text-3xl font-black text-slate-900 tracking-tight`}>Settings</Text>
                    <Text style={tw`text-slate-500 mt-1 uppercase text-xs font-bold tracking-widest`}>
                        {storeName || selectedBusiness?.name} • {userRole} Mode
                    </Text>
                </View>
                <View style={tw`px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100`}>
                    <Text style={tw`text-indigo-600 font-bold text-xs`}>v1.0.2</Text>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={tw`flex-1`}>
                <ScrollView contentContainerStyle={tw`p-8 pb-24`} showsVerticalScrollIndicator={false}>

                    {/* CASHIER SPECIFIC ACTIONS */}
                    {!canEdit && (
                        <Section title="Cashier Actions">
                            <Row
                                icon={Banknote}
                                label="Cash Up / End Shift"
                                value={<ChevronRight size={20} color="#ef4444" />}
                                color="#ef4444"
                                onPress={() => navigation.navigate('CashUp')}
                            />
                            <Row
                                icon={Shield}
                                label="Change My PIN"
                                value={<ChevronRight size={20} color="#94a3b8" />}
                                onPress={() => setShowChangePin(true)}
                            />
                            <Row 
                                icon={User} 
                                label="Logged In As" 
                                value={<Text style={tw`text-slate-500 font-medium`}>{user?.email}</Text>} 
                                isLast 
                            />
                        </Section>
                    )}

                    {/* OWNER / MANAGER SPECIFIC ACTIONS */}
                    {canEdit && (
                        <>
                            {/* 1. BUSINESS PROFILE */}
                            <Section title="Business Profile">
                                <InputRow icon={Store} label="Store Name" value={storeName} onChangeText={setStoreName} />
                                <InputRow icon={Percent} label="Tax Rate (%)" value={taxRate} onChangeText={setTaxRate} numeric />
                                <InputRow icon={Receipt} label="Receipt Footer" value={receiptFooter} onChangeText={setReceiptFooter} placeholder="Message..." isLast />
                            </Section>

                            {/* 1.5. BUSINESS DAY */}
                            <Section title="Business Day">
                                <Pressable
                                    onPress={() => setShowTimePicker(true)}
                                    style={({ pressed }) => [
                                        tw`flex-row items-center justify-between p-4 bg-white`,
                                        pressed && tw`bg-slate-50`
                                    ]}
                                >
                                    <View style={tw`flex-row items-center`}>
                                        <View style={tw`p-2.5 rounded-xl mr-4 bg-slate-50 border border-slate-100`}>
                                            <Clock size={20} color="#64748b" />
                                        </View>
                                        <View>
                                            <Text style={tw`font-bold text-slate-900 text-base`}>Business day starts at</Text>
                                        </View>
                                    </View>
                                    <View style={tw`flex-row items-center gap-2`}>
                                        <Text style={tw`font-bold text-indigo-600 text-lg`}>
                                            {businessDayStartsAt.substring(0, 5)}
                                        </Text>
                                        <ChevronRight size={18} color="#94a3b8" />
                                    </View>
                                </Pressable>
                                <View style={tw`px-4 pt-0 pb-4 bg-white border-t border-slate-50`}>
                                    <Text style={tw`text-xs text-slate-500`}>Sales before this time count towards the previous trading day.</Text>
                                </View>
                            </Section>

                            {/* 2. HARDWARE (Local State Only) */}
                            <Section title="Hardware (Local)">
                                <ToggleRow icon={Printer} label="Auto-Print Receipt" value={autoPrint} onValueChange={setAutoPrint} />
                                <Row icon={Smartphone} label="Card Terminal" value={<Text style={tw`text-red-500 text-sm font-bold`}>Disconnected</Text>} onPress={() => Alert.alert('Search', 'Looking for terminals...')} isLast />
                            </Section>

                            {/* 3. INVENTORY */}
                            <Section title="Inventory Rules">
                                <InputRow icon={AlertTriangle} label="Low Stock Warning" value={lowStockThreshold} onChangeText={setLowStockThreshold} numeric />
                                <ToggleRow icon={Shield} label="Allow Negative Stock" value={allowNegativeStock} onValueChange={setAllowNegativeStock} isLast />
                            </Section>

                            {/* 4. STAFF & SECURITY */}
                            <Section title="Staff & Security">
                                <Row
                                    icon={Users}
                                    label="Manage Staff"
                                    value={<ChevronRight size={20} color="#94a3b8" />}
                                    onPress={() => setShowStaffModal(true)}
                                />

                                {/* Start/End Shift Button */}
                                <Row
                                    icon={Banknote}
                                    label="Cash Up / End Shift"
                                    value={<ChevronRight size={20} color="#ef4444" />}
                                    color="#ef4444"
                                    onPress={() => navigation.navigate('CashUp')}
                                />

                                <Row icon={User} label="Logged In As" value={<Text style={tw`text-slate-500 font-medium`}>{user?.email}</Text>} isLast />
                            </Section>

                            {/* ACTIONS */}
                            <Pressable 
                                onPress={handleSave} 
                                disabled={loading} 
                                style={({ pressed }) => [
                                    tw`p-4 rounded-2xl items-center mb-4 flex-row justify-center gap-3 bg-indigo-600 shadow-sm transition-all`,
                                    pressed && tw`scale-95 bg-indigo-700 shadow-none`
                                ]}
                            >
                                {loading ? <ActivityIndicator color="white" /> : <Shield size={20} color="white" />}
                                <Text style={tw`text-white font-bold text-lg tracking-wide uppercase`}>{loading ? "Saving..." : "Save Settings"}</Text>
                            </Pressable>
                        </>
                    )}

                    <Pressable 
                        onPress={handleLogout} 
                        style={({ pressed }) => [
                            tw`p-4 rounded-2xl items-center border border-red-200 bg-red-50 flex-row justify-center gap-3 transition-all`,
                            pressed && tw`scale-95 bg-red-100`
                        ]}
                    >
                        <Lock size={20} color="#ef4444" />
                        <Text style={tw`font-bold text-lg text-red-500 tracking-wide uppercase`}>Log Out / Switch User</Text>
                    </Pressable>

                </ScrollView>
            </KeyboardAvoidingView>

            <StaffManagerModal visible={showStaffModal} onClose={() => setShowStaffModal(false)} />
            <ChangePinModal visible={showChangePin} onClose={() => setShowChangePin(false)} />
            <ManagerAuthModal 
                visible={showManagerAuth} 
                onClose={() => setShowManagerAuth(false)} 
                actionName="Authorize Logout"
                onSuccess={() => {
                    setShowManagerAuth(false);
                    signOut();
                }} 
            />

            {/* TIME PICKER MODAL */}
            <Modal visible={showTimePicker} transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
                <View style={tw`flex-1 bg-black/60 justify-center items-center px-6`}>
                    <View style={tw`bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl`}>
                        <View style={tw`p-5 border-b border-slate-100 bg-slate-50 items-center`}>
                            <Text style={tw`text-lg font-bold text-slate-900`}>Select Start Time</Text>
                            <Text style={tw`text-xs text-slate-500 mt-1`}>Format: 24-Hour</Text>
                        </View>
                        <ScrollView style={tw`max-h-64`}>
                            {TIME_OPTIONS.map((time, idx) => {
                                const isSelected = businessDayStartsAt === time;
                                return (
                                    <TouchableOpacity
                                        key={time}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setBusinessDayStartsAt(time);
                                            setShowTimePicker(false);
                                        }}
                                        style={tw`flex-row justify-center py-4 border-b border-slate-50 ${isSelected ? 'bg-indigo-50' : 'bg-white'}`}
                                    >
                                        <Text style={tw`text-xl font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-700'}`}>
                                            {time.substring(0, 5)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        <TouchableOpacity
                            onPress={() => setShowTimePicker(false)}
                            style={tw`p-5 items-center border-t border-slate-100 bg-slate-50`}
                        >
                            <Text style={tw`font-bold text-slate-500`}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}