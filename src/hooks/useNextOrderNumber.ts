import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../components/Context/BusinessContext';
import { useCart } from '../../components/Context/CartContext';

export const useNextOrderNumber = () => {
    const [nextOrderNum, setNextOrderNum] = useState<number | null>(null);
    const { selectedBusiness } = useBusiness();
    const { cart } = useCart();

    useEffect(() => {
        if (!selectedBusiness) return;
        
        const fetchNextNumber = async () => {
            const { data } = await supabase
                .from('orders')
                .select('daily_order_number')
                .eq('business_id', selectedBusiness.id)
                .not('daily_order_number', 'is', null)
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (data && data.length > 0) {
                setNextOrderNum((data[0].daily_order_number || 0) + 1);
            } else {
                setNextOrderNum(1); // First order ever
            }
        };

        fetchNextNumber();
    // Intentionally trigger when the cart explicitly empties (signaling a checkout just finished)
    // or when the selected business changes.
    }, [selectedBusiness, cart.length === 0]); 

    return nextOrderNum;
};
