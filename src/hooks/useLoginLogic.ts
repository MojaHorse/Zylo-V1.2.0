import { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../components/Context/AuthContext';
import { useBusiness } from '../../components/Context/BusinessContext';

export const useLoginLogic = () => {
    const navigation = useNavigation<any>();
    const { staffLogin } = useAuth();
    const { refreshBusinesses, selectedBusiness, clearBusiness } = useBusiness();

    const [step, setStep] = useState<1 | 2>(1);
    const [staffId, setStaffId] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSwitchBusiness = async () => {
        if (clearBusiness) {
            await clearBusiness();
        } else {
            await AsyncStorage.removeItem('zylo_last_business_id');
            await refreshBusinesses();
        }
    };

    const handlePress = async (num: string) => {
        if (loading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (step === 1) {
            if (staffId.length < 6) {
                const newId = staffId + num;
                setStaffId(newId);
                if (newId.length === 6) setTimeout(() => setStep(2), 300);
            }
        } else {
            if (pin.length < 4) {
                const newPin = pin + num;
                setPin(newPin);
                if (newPin.length === 4) handleLogin(newPin);
            }
        }
    };

    const handleDelete = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (step === 1) setStaffId(staffId.slice(0, -1));
        else {
            if (pin.length === 0) setStep(1);
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
        resetStep
    };
};