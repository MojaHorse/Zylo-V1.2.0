import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Update Context Type
export type ActiveStaff = {
    id: string;
    staff_number: string;
    role: 'owner' | 'manager' | 'cashier';
    full_name: string;
};

type AuthContextType = {
    session: Session | null;
    user: User | null;
    userRole?: string; // 👈 Derived from user metadata
    activeStaff: ActiveStaff | null;
    setActiveStaff: (staff: ActiveStaff | null) => void;
    loading: boolean;
    isPasswordReset: boolean;
    setIsPasswordReset: (value: boolean) => void;
    signOut: () => Promise<void>;
    pinLogin: (pin: string) => Promise<{ error?: string }>;
    staffLogin: (staffNumber: string, pin: string, businessId?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeStaff, setActiveStaffState] = useState<ActiveStaff | null>(null);

    // 👇 NEW STATE: Tracks if user is currently resetting password
    const [isPasswordReset, setIsPasswordReset] = useState(false);

    const setActiveStaff = async (staff: ActiveStaff | null) => {
        setActiveStaffState(staff);
        if (staff) {
            await AsyncStorage.setItem('zylo_active_staff', JSON.stringify(staff));
        } else {
            await AsyncStorage.removeItem('zylo_active_staff');
        }
    };

    useEffect(() => {
        // Load active staff on mount
        AsyncStorage.getItem('zylo_active_staff').then((data) => {
            if (data) {
                try {
                    setActiveStaffState(JSON.parse(data));
                } catch (e) {
                    console.error("Failed to parse active staff", e);
                }
            }
        });
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        console.log("Signing out...");
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error("Supabase SignOut failed, forcing local clear:", e);
        } finally {
            await AsyncStorage.removeItem('zylo_active_business');
            await AsyncStorage.removeItem('zylo_active_staff');
            const keys = await AsyncStorage.getAllKeys();
            const sbKeys = keys.filter(k => k.includes('supabase'));
            if (sbKeys.length > 0) await AsyncStorage.multiRemove(sbKeys);

            setSession(null);
            setUser(null);
            setActiveStaffState(null);
            setIsPasswordReset(false); // Reset flag on logout
        }
    };

    const pinLogin = async (pin: string) => {
        try {
            const { data, error } = await supabase.rpc('verify_pin', {
                pin_attempt: pin,
            });
            if (error) return { error: error.message };
            if (!data) return { error: 'Invalid PIN' };
            return {};
        } catch (e: any) {
            return { error: e.message };
        }
    };

    const staffLogin = async (staffNumber: string, pin: string, businessId?: string) => {
        try {
            const { data, error } = await supabase.rpc('login_staff', {
                input_staff_number: staffNumber,
                input_pin: pin
            });

            if (error) throw error;

            if (!data.success) {
                return { success: false, error: data.message || 'Login failed' };
            }

            // Security Check: Verify if staff belongs to the active shop
            if (businessId) {
                const { data: memberCheck, error: memberErr } = await supabase
                    .from('business_members')
                    .select('id, role, staff_number, profiles(full_name)')
                    .eq('staff_number', staffNumber)
                    .eq('business_id', businessId)
                    .single();

                if (memberErr || !memberCheck) {
                    return { success: false, error: 'Access Denied: You do not belong to this shop.' };
                }

                await setActiveStaff({
                    id: memberCheck.id,
                    staff_number: memberCheck.staff_number,
                    role: memberCheck.role as any,
                    full_name: (memberCheck.profiles as any)?.full_name || 'Staff'
                });
            }

            return { success: true, data };

        } catch (e: any) {
            console.error("Staff Login Error:", e);
            return { success: false, error: e.message || 'Connection Error' };
        }
    };

    const userRole = user?.user_metadata?.role; // 👈 Derived

    return (
        <AuthContext.Provider value={{
            session,
            user,
            userRole,
            activeStaff,
            setActiveStaff,
            loading,
            isPasswordReset,
            setIsPasswordReset,
            signOut,
            pinLogin,
            staffLogin
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};