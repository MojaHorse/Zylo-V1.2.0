import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../components/Context/BusinessContext';
import { useAuth } from '../../components/Context/AuthContext';
import * as Haptics from 'expo-haptics';

export function useStartShift() {
    const navigation = useNavigation<any>();
    const { selectedBusiness } = useBusiness();
    const { user, activeStaff } = useAuth();
    
    const [floatAmount, setFloatAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [existingShift, setExistingShift] = useState<any>(null);

    // 1. Check on Load
    useEffect(() => {
        if (selectedBusiness && user) {
            checkOpenShift();
        }
    }, [selectedBusiness, user]);

    const checkOpenShift = async () => {
        if (!selectedBusiness) return;
        
        try {
            let memberId = activeStaff?.id;
            if (!memberId) {
                const { data: member } = await supabase
                    .from('business_members')
                    .select('id')
                    .eq('user_id', user?.id)
                    .eq('business_id', selectedBusiness.id)
                    .single();
                memberId = member?.id;
            }

            const { data } = await supabase
                .from('cash_ups')
                .select('*')
                .eq('business_id', selectedBusiness.id)
                .eq('staff_id', memberId) 
                .eq('status', 'open')
                .single();

            if (data) {
                setExistingShift(data);
            }
        } catch (e) {
            // No shift found, stay here to create one
        } finally {
            setCheckingStatus(false);
        }
    };

    const continueShift = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.replace('Main');
    };

    // 2. Start Logic (With "Resume" protection)
    const startShift = async () => {
        if (!selectedBusiness) return;
        if (!floatAmount) return Alert.alert("Required", "Please enter the amount in the drawer.");
        
        setLoading(true);
        try {
            // Get Staff ID
            let memberId = activeStaff?.id;
            if (!memberId) {
                const { data: memberData, error: memberError } = await supabase
                    .from('business_members')
                    .select('id')
                    .eq('user_id', user?.id)
                    .eq('business_id', selectedBusiness.id)
                    .single();

                if (memberError || !memberData) throw new Error("Could not find your staff profile.");
                memberId = memberData.id;
            }

            // Attempt to Insert
            const { error } = await supabase.from('cash_ups').insert({
                business_id: selectedBusiness.id,
                staff_id: memberId,
                opening_float: parseFloat(floatAmount),
                status: 'open'
            });

            if (error) {
                // 👇 SMART FIX: If error is "Unique Constraint" (Shift already exists), ignore it!
                if (error.code === '23505') {
                    console.log("Shift already exists. Resuming session...");
                } else {
                    // If it's a REAL error (like network fail), throw it
                    throw error;
                }
            }
            
            // Success (or Resume) -> Go to Dashboard
            // 👇 FIX: Use 'Main', not 'HomeScreen'
            navigation.replace('Main');

        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        floatAmount,
        setFloatAmount,
        loading,
        checkingStatus,
        existingShift,
        startShift,
        continueShift
    };
}