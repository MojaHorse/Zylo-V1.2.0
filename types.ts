// --- USER & AUTH ---
export interface StaffProfile {
    id: string;
    email?: string;
    full_name?: string;
    role?: 'owner' | 'manager' | 'cashier';
    pin_hash?: string;
}

export interface BusinessProfile {
    id: string;
    name: string;
    role: 'owner' | 'manager' | 'cashier';
    currency: string;
    business_day_starts_at?: string | null;
}

// --- INVENTORY (Raw Materials) ---
export interface InventoryItem {
    id: string;
    business_id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    cost_price: number; // Standardized to match typical DB column
    low_stock_threshold: number;
    created_at?: string;
}

// --- MODIFIERS (Extras) ---
export interface Modifier {
    id: string; 
    name: string;
    price: number;
}

// --- PRODUCTS (Menu Items) ---
// This is the core type used by ProductCard, MenuScreen, and POSLogic
export interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    product_type?: 'simple' | 'recipe';
    description?: string;
    image_url?: string;
    // Calculated field from 'get_menu_with_status' RPC
    // 'full' = Normal, 'low' = Ingredients running low, 'out' = Unavailable
    stockStatus?: 'full' | 'low' | 'out'; 
    is_available?: boolean;
    max_quantity?: number; // Caps the max cart size
}

// --- CART (Active Sale) ---
export interface CartItem extends Product {
    internalId: string; // Unique ID used for React keys (e.g. "productID-modifierID")
    quantity: number;
    modifiers?: Modifier[];
    note?: string; // Kitchen instructions (e.g. "No onion")
}

// --- ORDERS (History/Database) ---
export interface Order {
    order_uuid: string; // Primary Key in your DB
    id?: number;
    created_at: string;
    grand_total: number;
    payment_method: 'Cash' | 'Card' | 'Split' | 'Wallet';
    payment_status?: 'paid' | 'pending' | 'refunded' | 'void';
    staff_id?: string;
    voided_at?: string | null;
    business_day?: string | null;
    daily_order_number?: number | null;
    receipt_number?: string | null;
}

export interface OrderItem {
    id: string;
    product_name_snapshot: string; // We store name in case product changes later
    quantity: number;
    price_at_sale: number;
    modifiers?: any; // Stored as JSONB in database
}