import React, { useState, useEffect, useRef } from 'react';
import { View, useWindowDimensions, Animated, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/Context/AuthContext';
import { useBusiness } from '../../components/Context/BusinessContext';
import { usePushNotifications } from '../hooks/usePushNotifications';

import Sidebar, { SidebarTab } from '../../components/Sidebar';
import BottomNav from '../../components/BottomNav';
import StartShiftPromptModal from '../../components/Modals/StartShiftPromptModal';
import { Clock } from 'lucide-react-native';

import DashboardScreen from './Dashboard/DashboardScreen';
import POSScreen from './POS/POSScreen';
import InventoryScreen from './Inventory/InventoryScreen';
import SalesHistoryScreen from './SalesHistory/SalesHistoryScreen';
import SettingsScreen from './SettingsScreen';


export default function MainLayout() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();

    const { user, activeStaff } = useAuth();
    const { selectedBusiness } = useBusiness();

    const [activeTab, setActiveTab] = useState<SidebarTab>('Dashboard');
    const [showShiftPrompt, setShowShiftPrompt] = useState(false);
    const [showResumeToast, setShowResumeToast] = useState(false);
    const hasPromptedShift = useRef(false);
    const toastOpacity = useRef(new Animated.Value(0)).current;

    // 2. Add this line inside the component (near the top)
    usePushNotifications();

    // 👇 SHIFT GUARD: Forces user to Start Shift if they haven't
    useEffect(() => {
        if (isFocused && selectedBusiness && user) {
            checkShiftStatus();
        }
    }, [isFocused, selectedBusiness, user]);

    const checkShiftStatus = async () => {
        // 👇 CRITICAL FIX: Ensure business exists before using .id
        if (!selectedBusiness || !user) return;

        let memberId = activeStaff?.id;

        // 1. Find the Staff Member ID
        if (!memberId) {
            const { data: member } = await supabase
                .from('business_members')
                .select('id')
                .eq('user_id', user.id)
                .eq('business_id', selectedBusiness.id)
                .single();

            if (!member) return;
            memberId = member.id;
        }

        // 2. Check for OPEN shift
        const { data: shift } = await supabase
            .from('cash_ups')
            .select('id')
            .eq('staff_id', memberId)
            .eq('status', 'open')
            .maybeSingle();

        // 3. If NO open shift, ask instead of forcing
        if (!shift) {
            if (!hasPromptedShift.current) {
                hasPromptedShift.current = true;
                setShowShiftPrompt(true);
            }
        } else {
            // Shift exists: Show a temporary "Resuming Shift" toast
            if (!hasPromptedShift.current) {
                hasPromptedShift.current = true;
                setShowResumeToast(true);
                
                Animated.sequence([
                    Animated.timing(toastOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
                    Animated.delay(2000),
                    Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true })
                ]).start(() => {
                    setShowResumeToast(false);
                });
            }
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'Dashboard': return <DashboardScreen />;
            case 'POS': return <POSScreen />;
            case 'Inventory': return <InventoryScreen />;
            case 'SalesHistory': return <SalesHistoryScreen />;
            case 'Settings': return <SettingsScreen />;
            default: return <DashboardScreen />;
        }
    };

    return (
        <SafeAreaView
            style={tw`flex-1 bg-slate-50 ${isMobile ? 'flex-col' : 'flex-row'}`}
            edges={isMobile ? ['top', 'left', 'right'] : ['top', 'left', 'bottom']}
        >
            {!isMobile && (
                <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            )}

            <View style={tw`flex-1 overflow-hidden bg-slate-50`}>
                {renderContent()}
            </View>

            {isMobile && (
                <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
            )}

            <StartShiftPromptModal 
                visible={showShiftPrompt} 
                onClose={() => setShowShiftPrompt(false)} 
                onStartShift={() => {
                    setShowShiftPrompt(false);
                    navigation.navigate('StartShift');
                }} 
            />

            {/* RESUME SHIFT TOAST */}
            {showResumeToast && (
                <Animated.View 
                    style={[
                        tw`absolute top-16 self-center bg-slate-900 rounded-full px-5 py-3 flex-row items-center shadow-lg`,
                        { opacity: toastOpacity, zIndex: 9999 }
                    ]}
                >
                    <Clock size={18} color="#4ade80" style={tw`mr-2`} />
                    <Text style={tw`text-white font-medium text-sm`}>Active shift resumed</Text>
                </Animated.View>
            )}
        </SafeAreaView>
    );
}