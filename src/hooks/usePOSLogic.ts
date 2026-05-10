import { useState, useEffect } from 'react';
import { Alert, useWindowDimensions } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../../components/Context/BusinessContext';
import { useCart } from '../../components/Context/CartContext';
import { useToast } from '../../components/Context/ToastContext';
import type { Product } from '../../types';
import { triggerHaptic } from '../utils/haptics';
import { validateOrderStock } from '../utils/validateOrderStock';

export const usePOSLogic = () => {
    const { selectedBusiness: business } = useBusiness();
    const { addToCart, clearCart, cart } = useCart();
    const { showToast } = useToast(); // 👈 Hook

    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>(['All']);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Keypad State
    const [isKeypadMode, setIsKeypadMode] = useState(false);
    const [customAmount, setCustomAmount] = useState('0');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [showMobileCart, setShowMobileCart] = useState(false);
    const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
    const [orderCollapsed, setOrderCollapsed] = useState(false);

    useEffect(() => {
        if (business) fetchProducts();
    }, [business]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            if (!business) return;

            const { data, error } = await supabase.rpc('get_menu_with_status', {
                target_business_id: business.id
            });

            if (error) throw error;

            if (data) {
                const normalized: Product[] = data.map((d: any) => ({
                    id: String(d.id),
                    name: d.name,
                    price: Number(d.price),
                    category: d.category || 'Other',
                    description: d.description || '',
                    stockStatus: d.stock_status,
                    is_available: d.is_available,
                    max_quantity: d.max_quantity,
                    product_type: d.product_type
                }));
                setProducts(normalized);

                const uniqueCats = Array.from(new Set(
                    normalized.map((p) => p.category).filter((c): c is string => !!c)
                ));
                setCategories(['All', ...uniqueCats.sort()]);
            }
        } catch (err: any) {
            // 👇 THIS IS THE CRITICAL CHANGE
            console.error("Menu Load Error:", err);
            Alert.alert('Database Error', err.message || 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAdd = async (product: Product) => {
        if (product.stockStatus === 'out') {
            triggerHaptic('warning');
            
            const check = await validateOrderStock([{ ...product, quantity: 1, internalId: 'temp', modifiers: [] }]);
            
            const missingText = check.warnings && check.warnings.length > 0 
                ? check.warnings.map(w => `• ${w}`).join('\n')
                : '• Ingredient details unavailable';

            Alert.alert(
                "Some items are out of stock",
                `Missing:\n${missingText}\n\nDo you still want to add this?`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Add Anyway", onPress: () => {
                        triggerHaptic('medium');
                        const result = addToCart(product);
                        if (result.message) showToast(result.message, 'warning');
                        else showToast(`${product.name} added to cart`, 'success');
                    }}
                ]
            );
            return;
        }

        const result = addToCart(product);
        if (!result.success) {
            triggerHaptic('error');
            showToast(result.message || 'Maximum stock reached', 'error');
            return;
        }

        if (result.message) {
            triggerHaptic('warning');
            showToast(result.message, 'warning');
        } else {
            triggerHaptic('success');
            showToast(`${product.name} added to cart`, 'success');
        }
    };

    const handleAddCustomAmount = () => {
        const amount = parseFloat(customAmount);
        if (isNaN(amount) || amount <= 0) return;

        const customProduct: Product = {
            id: `custom-${amount}`,
            name: 'Custom Amount',
            price: amount,
            category: 'Custom',
            is_available: true
        };

        const result = addToCart(customProduct);
        if (result.success) {
            showToast(`Custom Amount R${amount} added`, 'success');
            setCustomAmount('0'); // Reset after adding
        }
    };

    const handleDeleteProduct = (product: Product) => {
        triggerHaptic('warning');
        Alert.alert(
            "Delete Product",
            `Are you sure you want to delete "${product.name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const { error } = await supabase.from('products').delete().eq('id', product.id);

                        if (!error) {
                            setProducts(prev => prev.filter(p => p.id !== product.id));
                            showToast("Product deleted", 'success');
                        } else {
                            if (error.code === '23503') {
                                Alert.alert(
                                    "Cannot Delete",
                                    "This product has sales history. Archive (hide) it instead?",
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        {
                                            text: "Archive",
                                            onPress: async () => {
                                                await supabase.from('products').update({ is_available: false }).eq('id', product.id);
                                                fetchProducts();
                                                showToast("Product archived", 'success');
                                            }
                                        }
                                    ]
                                );
                            } else {
                                showToast(error.message, 'error');
                            }
                        }
                    }
                }
            ]
        );
    };

    const filteredProducts = products.filter((p) => {
        if (p.is_available === false) return false;

        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    const calculateColumns = () => {
        if (!isTablet) return 2;
        const navSidebarWidth = 96;   // Sidebar.tsx w-24
        const orderPanelWidth = orderCollapsed ? 80 : 350;  // collapsed w-20 vs expanded 350
        const horizontalPadding = 64; // pl-8 (32) + p-6 right (24) + gap buffer (8)
        const availableWidth = width - navSidebarWidth - orderPanelWidth - horizontalPadding;
        const cols = Math.max(1, Math.floor(availableWidth / 220));
        return cols;
    };

    return {
        products: filteredProducts,
        categories,
        selectedCategory,
        setSelectedCategory,
        loading,
        searchQuery,
        setSearchQuery,
        handleQuickAdd,
        handleDeleteProduct,
        clearCart,
        cart,
        fetchProducts,
        calculateColumns,
        showAddModal, setShowAddModal,
        showCheckout, setShowCheckout,
        showMobileCart, setShowMobileCart,
        customizingProduct, setCustomizingProduct,
        orderCollapsed, setOrderCollapsed,
        addToCart,
        isKeypadMode, setIsKeypadMode,
        customAmount, setCustomAmount,
        handleAddCustomAmount
    };
};