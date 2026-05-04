import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BusinessProfile = {
    id: string;
    name: string;
    role: 'owner' | 'manager' | 'cashier';
    currency: string;
    business_day_starts_at?: string | null;
};

type BusinessContextType = {
    businesses: BusinessProfile[];
    selectedBusiness: BusinessProfile | null;
    loading: boolean;
    refreshBusinesses: () => Promise<void>; // Fetch list
    refreshBusiness: () => Promise<void>;   // 👈 NEW: Fetch single (Fixes your error)
    selectBusiness: (business: BusinessProfile) => Promise<void>;
    clearBusiness: () => Promise<void>;
};

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
    const [selectedBusiness, setSelectedBusiness] = useState<BusinessProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setBusinesses([]);
            setSelectedBusiness(null);
            setLoading(false);
            return;
        }

        loadBusinesses();
    }, [user, authLoading]);

    // 1. LOAD LIST (Your existing logic)
    const loadBusinesses = async () => {
        setLoading(true);
        try {
            console.log("Fetching businesses for:", user?.email);
            const { data, error } = await supabase
                .from('business_members')
                .select(`
                    role,
                    business_id,
                    businesses (
                        id,
                        name,
                        currency,
                        business_day_starts_at
                    )
                `)
                .eq('user_id', user?.id);

            if (error) {
                console.error("Supabase Error:", error);
                throw error;
            }

            if (data) {
                const formattedList: BusinessProfile[] = [];
                for (const item of data) {
                    if (!item.businesses) {
                        console.warn("Found business_member but no matching business row (RLS issue?)", item);
                        continue;
                    }
                    // Handle array vs object depending on Supabase version
                    const biz = Array.isArray(item.businesses) ? item.businesses[0] : item.businesses;
                    
                    if (biz) {
                        formattedList.push({
                            id: item.business_id,
                            name: biz.name || 'Unknown',
                            role: item.role,
                            currency: biz.currency || 'ZAR',
                            business_day_starts_at: biz.business_day_starts_at || null
                        });
                    }
                }

                console.log("Loaded Businesses:", formattedList.length);
                setBusinesses(formattedList);
                
                // If we are currently selected, update that selection with new data
                if (selectedBusiness) {
                    const updated = formattedList.find(b => b.id === selectedBusiness.id);
                    if (updated) setSelectedBusiness(updated);
                }
            }
        } catch (e: any) {
            console.error('Error loading businesses:', e);
            // Alert so we can see what's happening
            alert("Error loading businesses: " + (e.message || JSON.stringify(e)));
            setBusinesses([]);
        } finally {
            setLoading(false);
        }
    };

    // 2. REFRESH SINGLE (Fixes StaffScreen Error)
    const refreshBusiness = async () => {
        // This function forces a reload of the current business data
        // and ensures we are "entered" into the shop.
        await loadBusinesses();
        
        // If no business is selected yet (e.g. fresh setup), auto-select the first one found
        if (!selectedBusiness && businesses.length > 0) {
             // Default to the first one so "Enter Shop" works immediately
             await selectBusiness(businesses[0]);
        }
    };

    const selectBusiness = async (biz: BusinessProfile) => {
        setSelectedBusiness(biz);
        await AsyncStorage.setItem('zylo_last_business_id', biz.id);
    };

    const clearBusiness = async () => {
        setSelectedBusiness(null);
        await AsyncStorage.removeItem('zylo_last_business_id');
    };

    return (
        <BusinessContext.Provider value={{ 
            businesses, 
            selectedBusiness, 
            loading, 
            refreshBusinesses: loadBusinesses, 
            refreshBusiness, // 👈 Exported here
            selectBusiness,
            clearBusiness
        }}>
            {children}
        </BusinessContext.Provider>
    );
};

export const useBusiness = () => {
    const ctx = useContext(BusinessContext);
    if (!ctx) throw new Error('useBusiness must be used inside BusinessProvider');
    return ctx;
};