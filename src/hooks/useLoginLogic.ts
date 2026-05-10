import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../components/Context/AuthContext';
import { useBusiness } from '../../components/Context/BusinessContext';
import { supabase } from '../../lib/supabase';

export type StaffMember = {
    id: string;
    staff_number: string;
    role: 'owner' | 'manager' | 'cashier';
    full_name: string;
};

export const useLoginLogic = () => {
    const navigation = useNavigation<any>();
    const { staffLogin } = useAuth();
    const { refreshBusinesses, selectedBusiness, clearBusiness } = useBusiness();

    // --- Step state ---
    // Step 1 = Staff picker (or manual entry), Step 2 = PIN entry
    const [step, setStep] = useState<1 | 2>(1);
    const [staffId, setStaffId] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);

    // --- Staff list state ---
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
    const [loadingStaff, setLoadingStaff] = useState(true);
    const [isManualEntry, setIsManualEntry] = useState(false);

    // --- Selected staff display name (for PIN screen header) ---
    const [selectedStaffName, setSelectedStaffName] = useState('');

    // Fetch staff members for the selected business
    useEffect(() => {
        if (selectedBusiness?.id) {
            fetchStaffMembers();
        }
    }, [selectedBusiness?.id]);

    const fetchStaffMembers = async () => {
        if (!selectedBusiness?.id) return;
        setLoadingStaff(true);
        try {
            const { data, error } = await supabase
                .from('business_members')
                .select('id, staff_number, role, full_name, profiles(full_name)')
                .eq('business_id', selectedBusiness.id)
                .eq('is_active', true)
                .order('role', { ascending: false });

            if (error) throw error;

            const members: StaffMember[] = (data || []).map((m: any) => ({
                id: m.id,
                staff_number: m.staff_number,
                role: m.role,
                full_name: m.full_name || m.profiles?.full_name || 'Staff Member',
            }));

            setStaffMembers(members);
        } catch (e) {
            console.error('Error fetching staff list:', e);
            setStaffMembers([]);
        } finally {
            setLoadingStaff(false);
        }
    };

    // Select a staff member from the picker
    const selectStaff = (member: StaffMember) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setStaffId(member.staff_number);
        setSelectedStaffName(member.full_name);
        setTimeout(() => setStep(2), 200);
    };

    const handleSwitchBusiness = async () => {
        if (clearBusiness) {
            await clearBusiness();
        } else {
            await AsyncStorage.removeItem('zylo_last_business_id');
            await refreshBusinesses();
        }
    };

    // Numpad press handler (used for manual ID entry in step 1, and PIN in step 2)
    const handlePress = async (num: string) => {
        if (loading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (step === 1 && isManualEntry) {
            // Manual ID entry mode
            if (staffId.length < 6) {
                const newId = staffId + num;
                setStaffId(newId);
                if (newId.length === 6) {
                    setSelectedStaffName(''); // No name for manual entry
                    setTimeout(() => setStep(2), 300);
                }
            }
        } else if (step === 2) {
            // PIN entry
            if (pin.length < 4) {
                const newPin = pin + num;
                setPin(newPin);
                if (newPin.length === 4) handleLogin(newPin);
            }
        }
    };

    const handleDelete = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (step === 1 && isManualEntry) {
            setStaffId(staffId.slice(0, -1));
        } else if (step === 2) {
            if (pin.length === 0) {
                setStep(1);
                setStaffId('');
                setSelectedStaffName('');
            }
            else setPin(pin.slice(0, -1));
        }
    };

    const handleLogin = async (completePin: string) => {
        setLoading(true);
        setTimeout(async () => {
            const result = await staffLogin(staffId, completePin, selectedBusiness?.id);
            setLoading(false);
            
            if (!result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Login Failed', result.error || 'Invalid ID or PIN');
                setPin('');
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                navigation.replace('Main');
            }
        }, 300);
    };

    const resetStep = () => {
        setStep(1);
        setPin('');
        setStaffId('');
        setSelectedStaffName('');
    };

    const toggleManualEntry = () => {
        Haptics.selectionAsync();
        setIsManualEntry(!isManualEntry);
        setStaffId('');
    };

    return {
        step,
        staffId,
        pin,
        loading,
        selectedBusiness,
        handlePress,
        handleDelete,
        handleSwitchBusiness,
        resetStep,
        // New staff picker state
        staffMembers,
        loadingStaff,
        isManualEntry,
        selectedStaffName,
        selectStaff,
        toggleManualEntry,
    };
};