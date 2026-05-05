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

  // Receipt settings
  tax_rate?: number | null;
  receipt_message?: string | null;
};

type BusinessContextType = {
  businesses: BusinessProfile[];
  selectedBusiness: BusinessProfile | null;
  loading: boolean;
  refreshBusinesses: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
  selectBusiness: (business: BusinessProfile) => Promise<void>;
  clearBusiness: () => Promise<void>;
};

const BusinessContext = createContext<BusinessContextType | undefined>(
  undefined
);

export const BusinessProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, loading: authLoading } = useAuth();

  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [selectedBusiness, setSelectedBusiness] =
    useState<BusinessProfile | null>(null);
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

  const loadBusinesses = async () => {
    setLoading(true);

    try {
      console.log('Fetching businesses for:', user?.email);

      const { data, error } = await supabase
        .from('business_members')
        .select(`
          role,
          business_id,
          businesses (
            id,
            name,
            currency,
            business_day_starts_at,
            tax_rate,
            receipt_message
          )
        `)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Supabase Error:', error);
        throw error;
      }

      const formattedList: BusinessProfile[] = [];

      if (data) {
        for (const item of data) {
          if (!item.businesses) {
            console.warn(
              'Found business_member but no matching business row (RLS issue?)',
              item
            );
            continue;
          }

          const biz = Array.isArray(item.businesses)
            ? item.businesses[0]
            : item.businesses;

          if (biz) {
            formattedList.push({
              id: item.business_id,
              name: biz.name || 'Unknown',
              role: item.role,
              currency: biz.currency || 'ZAR',
              business_day_starts_at: biz.business_day_starts_at || null,
              tax_rate: biz.tax_rate ?? 15,
              receipt_message:
                biz.receipt_message || 'THANK YOU FOR YOUR SUPPORT!',
            });
          }
        }
      }

      console.log('Loaded Businesses:', formattedList.length);

      setBusinesses(formattedList);

      setSelectedBusiness((currentSelected) => {
        if (!currentSelected) return currentSelected;

        const updated = formattedList.find(
          (business) => business.id === currentSelected.id
        );

        return updated || currentSelected;
      });
    } catch (e: any) {
      console.error('Error loading businesses:', e);
      alert('Error loading businesses: ' + (e.message || JSON.stringify(e)));
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshBusiness = async () => {
    await loadBusinesses();
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
    <BusinessContext.Provider
      value={{
        businesses,
        selectedBusiness,
        loading,
        refreshBusinesses: loadBusinesses,
        refreshBusiness,
        selectBusiness,
        clearBusiness,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const ctx = useContext(BusinessContext);

  if (!ctx) {
    throw new Error('useBusiness must be used inside BusinessProvider');
  }

  return ctx;
};