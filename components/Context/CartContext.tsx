import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Product, Modifier } from '../../types'; 
import { useBusiness } from './BusinessContext'; 

export type CartItem = Product & {
    quantity: number;
    modifiers?: Modifier[];
    note?: string;
    internalId: string;
};

type CartContextType = {
    cart: CartItem[];
    addToCart: (product: Product, modifiers?: Modifier[], note?: string) => { success: boolean, message?: string };
    removeFromCart: (internalId: string) => void;
    updateQuantity: (internalId: string, quantity: number) => { success: boolean, message?: string };
    decreaseQty: (internalId: string) => void;
    clearCart: () => void;
    total: number;
    totalQty: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [total, setTotal] = useState(0);
    const [totalQty, setTotalQty] = useState(0);

    // 👇 Get the selected business from your Business Context
    const { selectedBusiness } = useBusiness(); 

    // ✅ FIX: Auto-clear cart if the Business ID changes (or is lost)
    // This prevents "Product does not belong to business" errors if session refreshes
    useEffect(() => {
        setCart([]);
    }, [selectedBusiness?.id]);

    // Recalculate totals whenever cart changes
    useEffect(() => {
        // 1. Calculate Price Total
        const newTotal = cart.reduce((sum, item) => {
            const modifiersCost = item.modifiers
                ? item.modifiers.reduce((acc, mod) => acc + (mod.price || 0), 0)
                : 0;
            return sum + ((item.price + modifiersCost) * item.quantity);
        }, 0);
        setTotal(newTotal);

        // 2. Calculate Quantity Total
        const newQty = cart.reduce((sum, item) => sum + item.quantity, 0);
        setTotalQty(newQty); 

    }, [cart]);

    const addToCart = (product: Product, modifiers: Modifier[] = [], note: string = '') => {
        let isSuccess = false;
        let msg = '';

        setCart((prev) => {
            const internalId = `${product.id}-${modifiers.map(m => m.id).sort().join('-')}`;
            const existing = prev.find((item) => item.internalId === internalId);
            
            // Limit check across all items matching the same base product id
            const currentTotalOfProduct = prev.filter(i => i.id === product.id).reduce((sum, i) => sum + i.quantity, 0);

            if (product.max_quantity !== undefined && (currentTotalOfProduct + 1) > product.max_quantity) {
                msg = `Exceeding available stock for ${product.name}.`;
            }

            isSuccess = true;

            if (existing) {
                return prev.map((item) =>
                    item.internalId === internalId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [...prev, { ...product, quantity: 1, modifiers, note, internalId }];
        });

        return { success: isSuccess, message: msg };
    };

    const removeFromCart = (internalId: string) => {
        setCart((prev) => prev.filter((item) => item.internalId !== internalId));
    };

    const updateQuantity = (internalId: string, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(internalId);
            return { success: true };
        }

        let isSuccess = false;
        let msg = '';

        setCart((prev) => {
            const targetItem = prev.find(i => i.internalId === internalId);
            if (!targetItem) return prev;

            // If increasing, check limit but do not block
            if (quantity > targetItem.quantity && targetItem.max_quantity !== undefined) {
                const currentTotalOfProduct = prev.filter(i => i.id === targetItem.id).reduce((sum, i) => sum + i.quantity, 0);
                if (currentTotalOfProduct + (quantity - targetItem.quantity) > targetItem.max_quantity) {
                    msg = `Exceeding available stock for ${targetItem.name}.`;
                }
            }

            isSuccess = true;
            return prev.map((item) =>
                item.internalId === internalId ? { ...item, quantity } : item
            );
        });

        return { success: isSuccess, message: msg }; 
    };

    const decreaseQty = (internalId: string) => {
        const item = cart.find((i) => i.internalId === internalId);
        if (item) {
            updateQuantity(internalId, item.quantity - 1);
        }
    };

    const clearCart = () => {
        setCart([]);
    };

    return (
        <CartContext.Provider 
            value={{ 
                cart, 
                addToCart, 
                removeFromCart, 
                updateQuantity, 
                decreaseQty,
                clearCart, 
                total, 
                totalQty
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

export { Product };

