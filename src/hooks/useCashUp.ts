import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../components/Context/BusinessContext';
import { useAuth } from '../../components/Context/AuthContext';

export function useCashUp() {
    const navigation = useNavigation<any>();
    const { selectedBusiness } = useBusiness();
    const { user } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Inputs
    const [declaredCash, setDeclaredCash] = useState('');
    const [declaredCard, setDeclaredCard] = useState('');
    const [notes, setNotes] = useState('');

    // System Data (Hidden from user initially)
    const [shiftId, setShiftId] = useState<string | null>(null);
    const [systemCash, setSystemCash] = useState(0);
    const [systemCard, setSystemCard] = useState(0);
    const [openingFloat, setOpeningFloat] = useState(0);

    // Load Data
    useEffect(() => {
        if (selectedBusiness && user) {
            fetchShiftData();
        }
    }, [selectedBusiness, user]);

    const fetchShiftData = async () => {
        try {
            // 1. Get Staff Member ID
            const { data: member } = await supabase
                .from('business_members')
                .select('id')
                .eq('user_id', user?.id)
                .eq('business_id', selectedBusiness!.id)
                .single();
            
            if (!member) throw new Error("Staff profile not found.");

            // 2. Get Open Shift
            const { data: shift } = await supabase
                .from('cash_ups')
                .select('*')
                .eq('staff_id', member.id)
                .eq('status', 'open')
                .single();

            if (!shift) {
                Alert.alert("No Open Shift", "You don't have a shift to close.");
                navigation.goBack();
                return;
            }

            setShiftId(shift.id);
            setOpeningFloat(shift.opening_float || 0);

            // 3. Calculate Sales since Shift Started
            // We fetch all orders created AFTER the shift opened
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('grand_total, payment_method')
                .eq('business_id', selectedBusiness!.id)
                .eq('staff_id', member.id)
                .is('voided_at', null)
                .gte('created_at', shift.opened_at);
                
            if (ordersError) throw ordersError;

            // Sum them up
            let cashTotal = 0;
            let cardTotal = 0;

            orders?.forEach((order: any) => {
                if (order.payment_method === 'Cash') cashTotal += Number(order.grand_total || 0);
                if (order.payment_method === 'Card') cardTotal += Number(order.grand_total || 0);
            });

            setSystemCash(cashTotal);
            setSystemCard(cardTotal);

        } catch (error: any) {
            Alert.alert("Error", "Could not calculate sales totals.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const closeShift = async () => {
        if (!declaredCash) return Alert.alert("Required", "Please count the cash.");
        if (!shiftId) return;

        setSubmitting(true);
        try {
            const finalCash = parseFloat(declaredCash) || 0;
            const finalCard = parseFloat(declaredCard) || 0;

            const { error } = await supabase
                .from('cash_ups')
                .update({
                    closed_at: new Date().toISOString(),
                    status: 'closed',
                    
                    // Save what the system thought
                    system_cash_total: systemCash,
                    system_card_total: systemCard,

                    // Save what user counted
                    declared_cash_total: finalCash,
                    declared_card_total: finalCard,
                    
                    notes: notes
                })
                .eq('id', shiftId);

            if (error) throw error;

            // SUCCESS
            // Calculate variance for the alert
            const cashVariance = (finalCash - openingFloat) - systemCash;
            const message = cashVariance === 0 
                ? "Perfect Match! Shift closed." 
                : `Shift Closed. Cash Variance: R${cashVariance.toFixed(2)}`;

            Alert.alert("Shift Ended", message, [
                { text: "OK", onPress: () => navigation.replace('Login') } // Log them out
            ]);

        } catch (error: any) {
            Alert.alert("Error", error.message);
            setSubmitting(false);
        }
    };

    return {
        loading,
        submitting,
        declaredCash, setDeclaredCash,
        declaredCard, setDeclaredCard,
        notes, setNotes,
        closeShift,
        systemCash // Exposed only if you want to show it (usually we hide it)
    };
}