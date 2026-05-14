import React, { useState, useEffect } from "react";
import {
    Modal, View, Text, TextInput, Pressable,
    FlatList, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from "react-native";
import tw from "twrnc";
import { supabase } from "../../lib/supabase";
import { useBusiness } from "../../components/Context/BusinessContext";
import { useAuth } from "../../components/Context/AuthContext";
import OpsPinModal from "./OpsPinModal";
import type { InventoryItem } from "../../types";
import { Calculator, AlertTriangle, Trash2, X } from "lucide-react-native";
import * as Haptics from 'expo-haptics';

// --- CONFIG ---
const UNIT_CONVERSIONS: Record<string, { base: string; multiplier: number }> = {
    'kg': { base: 'g', multiplier: 1000 },
    'L': { base: 'ml', multiplier: 1000 },
};


const UNITS = ["Units", "Rolls", "g", "kg", "ml", "L", "Box"];

interface Props {
    visible: boolean;
    onClose: () => void;
    onSaved: () => void;
    initialData?: InventoryItem | null;
}

export default function InventoryFormModal({ visible, onClose, onSaved, initialData }: Props) {
    const { selectedBusiness: business } = useBusiness();
    const userRole = business?.role ?? 'cashier';

    // Form State
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Meat");
    const [stockInput, setStockInput] = useState("0");
    const [lowAlertInput, setLowAlertInput] = useState("5");
    const [costInput, setCostInput] = useState("0");
    const [selectedUnit, setSelectedUnit] = useState("Units");

    // UI State
    const [loading, setLoading] = useState(false);

    const [showUnitPicker, setShowUnitPicker] = useState(false);

    // Security State
    const [pinModalVisible, setPinModalVisible] = useState(false);
    const [approving, setApproving] = useState(false);

    // Calculator State
    const [showRestockCalc, setShowRestockCalc] = useState(false);
    const [calcQty, setCalcQty] = useState("");
    const [calcSize, setCalcSize] = useState("");

    useEffect(() => {
        if (visible) {
            if (initialData) {
                // EDIT MODE
                setName(initialData.name);
                setCategory(initialData.category);
                setSelectedUnit(initialData.unit);
                setStockInput(String(initialData.quantity));
                // Handle naming variations
                setLowAlertInput(String(initialData.low_stock_threshold ?? 5));
                setCostInput(String(initialData.cost_price ?? 0));
            } else {
                // ADD MODE
                resetForm();
            }
            setShowRestockCalc(false);
            setPinModalVisible(false);
        }
    }, [visible, initialData]);

    const resetForm = () => {
        setName("");
        setCategory("Meat");
        setStockInput("0");
        setLowAlertInput("10");
        setSelectedUnit("Units");
        setCostInput("0");
        setCalcQty("");
        setCalcSize("");
    };

    const handleCalculatorAdd = () => {
        Haptics.selectionAsync();
        const qty = parseFloat(calcQty);
        const size = parseFloat(calcSize);

        if (isNaN(qty) || isNaN(size)) return Alert.alert("Error", "Enter valid numbers");

        const toAdd = qty * size;
        const current = parseFloat(stockInput) || 0;
        setStockInput(String(current + toAdd));

        setCalcQty("");
        setCalcSize("");
    };

    // --- HELPER: Prepare Payload ---
    const preparePayload = () => {
        if (!name.trim()) {
            Alert.alert("Required", "Item Name is required.");
            return null;
        }
        if (!business) return null;

        let finalUnit = selectedUnit;
        let finalStock = parseFloat(stockInput) || 0;
        let finalAlert = parseFloat(lowAlertInput) || 0;
        let finalCost = parseFloat(costInput) || 0;

        // Auto-Conversion Logic
        const conversion = UNIT_CONVERSIONS[selectedUnit];
        if (conversion) {
            finalUnit = conversion.base;
            finalStock = finalStock * conversion.multiplier;
            finalAlert = finalAlert * conversion.multiplier;
            if (finalCost > 0) finalCost = finalCost / conversion.multiplier;
        }

        return {
            business_id: business.id,
            name,
            category,
            quantity: finalStock,
            unit: finalUnit,
            cost_price: finalCost,
            low_stock_threshold: finalAlert,
        };
    };

    // --- MAIN SAVE HANDLER ---
    const handleSaveAttempt = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const payload = preparePayload();
        if (!payload) return;

        // 1. If Owner/Manager -> Save Directly
        if (userRole === 'owner' || userRole === 'manager') {
            await performDirectSave(payload);
        }
        // 2. If Cashier -> Ask for PIN
        else {
            setPinModalVisible(true);
        }
    };

    // Option A: Direct Save
    const performDirectSave = async (payload: any) => {
        setLoading(true);
        let error;

        // Map payload fields to DB columns if needed (e.g. cost_price vs cost_per_unit)
        // Ensure your payload keys match your DB columns exactly
        const dbPayload = {
            ...payload,
            // Add any specific mapping here if your Supabase types differ
        };

        if (initialData) {
            const { error: err } = await supabase
                .from("inventory_items")
                .update(dbPayload)
                .eq("id", initialData.id);
            error = err;
        } else {
            const { error: err } = await supabase
                .from("inventory_items")
                .insert(dbPayload);
            error = err;
        }

        setLoading(false);
        if (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", error.message);
        } else {
            handleSuccess();
        }
    };

    // Option B: Secure Save (after Ops PIN verified)
    const handleSecureSave = async () => {
        const payload = preparePayload();
        if (!payload) return;
        setPinModalVisible(false);
        await performDirectSave(payload);
    };

    const handleSuccess = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
        // Wait for Form modal to close before triggering the heavy list update
        setTimeout(() => {
            onSaved();
        }, 500);
    };

    const handleDelete = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        if (!initialData) return;
        Alert.alert("Delete Item", "Are you sure? This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    setLoading(true);
                    const { error } = await supabase.from("inventory_items").delete().eq("id", initialData.id);
                    setLoading(false);
                    if (!error) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        onSaved();
                        onClose();
                    } else {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        Alert.alert("Error", error.message);
                    }
                }
            }
        ]);
    };

    // --- RENDER HELPERS ---
    const PickerModal = ({ data, onSelect, visible, close }: any) => (
        <Modal visible={visible} transparent animationType="fade">
            <Pressable onPress={close} style={tw`flex-1 bg-black/40 justify-center items-center p-4`}>
                <View style={tw`bg-white w-full max-w-sm rounded-[2rem] max-h-96 shadow-2xl`}>
                    <FlatList
                        data={data}
                        keyExtractor={item => item}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item, index }) => (
                            <Pressable
                                onPress={() => { 
                                    Haptics.selectionAsync();
                                    onSelect(item); 
                                    close(); 
                                }}
                                style={({ pressed }) => [
                                    tw`py-5 items-center bg-white transition-all`,
                                    index !== data.length - 1 && tw`border-b border-slate-100`,
                                    pressed && tw`bg-slate-50`
                                ]}
                            >
                                <Text style={tw`text-slate-900 text-lg font-bold`}>{item}</Text>
                            </Pressable>
                        )}
                    />
                </View>
            </Pressable>
        </Modal>
    );

    return (
        <React.Fragment>
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={tw`flex-1 bg-black/40 justify-end sm:justify-center items-center`}
            >
                <View style={tw`w-full sm:w-[500px] bg-white rounded-t-[2rem] sm:rounded-[2rem] max-h-[95%] shadow-2xl`}>

                    {/* Header */}
                    <View style={tw`p-6 border-b border-slate-100 flex-row justify-between items-center`}>
                        <Text style={tw`text-slate-900 text-2xl font-black tracking-tight`}>
                            {initialData ? "Edit Stock" : "Add New Stock"}
                        </Text>
                        <Pressable 
                            onPress={() => {
                                Haptics.selectionAsync();
                                onClose();
                            }} 
                            style={({ pressed }) => [
                                tw`bg-slate-100 p-2.5 rounded-full transition-all`,
                                pressed && tw`bg-slate-200 scale-95`
                            ]}
                        >
                            <X size={20} color="#64748b" />
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={tw`p-6`} showsVerticalScrollIndicator={false}>

                        {/* Name Input */}
                        <Text style={tw`text-slate-500 text-xs font-bold uppercase mb-2 tracking-widest ml-1`}>Item Name</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            style={tw`bg-slate-50 text-slate-900 p-4 rounded-2xl text-lg border border-slate-200 mb-6 font-bold shadow-sm`}
                            placeholder="e.g. Burger Patties"
                            placeholderTextColor="#94a3b8"
                        />

                        {/* Pickers Row */}
                        <View style={tw`flex-row gap-4 mb-6`}>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-slate-500 text-xs font-bold uppercase mb-2 tracking-widest ml-1`}>Category</Text>
                                <TextInput
                                    value={category}
                                    onChangeText={setCategory}
                                    style={tw`bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm text-slate-900 font-bold text-base`}
                                    placeholder="e.g. Meat"
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-slate-500 text-xs font-bold uppercase mb-2 tracking-widest ml-1`}>Unit</Text>
                                <Pressable 
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setShowUnitPicker(true);
                                    }} 
                                    style={({ pressed }) => [
                                        tw`bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm transition-all`,
                                        pressed && tw`bg-slate-100`
                                    ]}
                                >
                                    <Text style={tw`text-slate-900 font-bold text-base`}>{selectedUnit}</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Stock Section */}
                        <View style={tw`bg-white p-5 rounded-3xl border border-slate-200 mb-6 shadow-sm`}>
                            <View style={tw`flex-row justify-between items-center mb-4`}>
                                <Text style={tw`text-indigo-600 text-xs font-black uppercase tracking-widest`}>Current Quantity</Text>
                                <Pressable 
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setShowRestockCalc(!showRestockCalc);
                                    }} 
                                    style={({ pressed }) => [
                                        tw`flex-row items-center gap-1 transition-all`,
                                        pressed && tw`opacity-50`
                                    ]}
                                >
                                    <Calculator size={14} color="#4f46e5" />
                                    <Text style={tw`text-indigo-600 text-xs font-bold`}>Calculator</Text>
                                </Pressable>
                            </View>

                            <TextInput
                                value={stockInput}
                                onChangeText={setStockInput}
                                keyboardType="numeric"
                                style={tw`bg-slate-50 text-slate-900 text-4xl font-black p-4 rounded-2xl border border-slate-200 text-center shadow-inner tracking-widest`}
                            />

                            {/* Calculator Dropdown */}
                            {showRestockCalc && (
                                <View style={tw`mt-4 bg-slate-50 p-4 rounded-2xl border border-slate-200`}>
                                    <Text style={tw`text-slate-500 text-xs mb-3 text-center font-bold tracking-widest uppercase`}>Quick Add (e.g. 5 cases of 24)</Text>
                                    <View style={tw`flex-row gap-3 items-center`}>
                                        <TextInput
                                            placeholder="Qty" placeholderTextColor="#cbd5e1"
                                            value={calcQty} onChangeText={setCalcQty} keyboardType="numeric"
                                            style={tw`flex-1 bg-white text-slate-900 p-3 rounded-xl text-center border border-slate-200 font-bold text-lg`}
                                        />
                                        <Text style={tw`text-slate-400 font-black text-lg`}>X</Text>
                                        <TextInput
                                            placeholder="Size" placeholderTextColor="#cbd5e1"
                                            value={calcSize} onChangeText={setCalcSize} keyboardType="numeric"
                                            style={tw`flex-1 bg-white text-slate-900 p-3 rounded-xl text-center border border-slate-200 font-bold text-lg`}
                                        />
                                        <Pressable 
                                            onPress={handleCalculatorAdd} 
                                            style={({ pressed }) => [
                                                tw`bg-indigo-600 px-5 py-3.5 justify-center rounded-xl shadow-sm transition-all`,
                                                pressed && tw`scale-95 bg-indigo-700 shadow-none`
                                            ]}
                                        >
                                            <Text style={tw`text-white font-black text-sm uppercase tracking-wider`}>ADD</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Cost & Alert Row */}
                        <View style={tw`flex-row gap-4 mb-8`}>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-slate-500 text-xs font-bold uppercase mb-2 tracking-widest ml-1`}>Low Stock Alert</Text>
                                <View style={tw`bg-slate-50 flex-row items-center px-4 rounded-2xl border border-slate-200 shadow-sm`}>
                                    <AlertTriangle size={18} color="#f59e0b" />
                                    <TextInput
                                        value={lowAlertInput}
                                        onChangeText={setLowAlertInput}
                                        keyboardType="numeric"
                                        style={tw`flex-1 text-slate-900 p-4 font-bold text-lg`}
                                    />
                                </View>
                            </View>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-slate-500 text-xs font-bold uppercase mb-2 tracking-widest ml-1`}>Cost per {selectedUnit}</Text>
                                <View style={tw`bg-slate-50 flex-row items-center px-4 rounded-2xl border border-slate-200 shadow-sm`}>
                                    <Text style={tw`text-slate-500 font-bold mr-1`}>R</Text>
                                    <TextInput
                                        value={costInput}
                                        onChangeText={setCostInput}
                                        keyboardType="numeric"
                                        placeholder="0.00"
                                        placeholderTextColor="#cbd5e1"
                                        style={tw`flex-1 text-slate-900 p-4 font-bold text-lg`}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Save Button */}
                        <Pressable
                            onPress={handleSaveAttempt}
                            disabled={loading}
                            style={({ pressed }) => [
                                tw`bg-indigo-600 p-5 rounded-2xl items-center mb-4 shadow-sm transition-all flex-row justify-center gap-2`,
                                pressed && tw`scale-95 bg-indigo-700 shadow-none`
                            ]}
                        >
                            {loading ? <ActivityIndicator color="white" /> : (
                                <Text style={tw`text-white text-xl font-black uppercase tracking-wide`}>Save Inventory Item</Text>
                            )}
                        </Pressable>

                        {/* Delete Button (Only in Edit Mode) */}
                        {initialData && (
                            <Pressable 
                                onPress={handleDelete} 
                                style={({ pressed }) => [
                                    tw`flex-row justify-center items-center gap-2 p-4 transition-all opacity-70`,
                                    pressed && tw`opacity-100 scale-95`
                                ]}
                            >
                                <Trash2 size={16} color="#ef4444" />
                                <Text style={tw`text-red-500 font-bold text-sm tracking-wide uppercase`}>Delete Item</Text>
                            </Pressable>
                        )}

                    </ScrollView>
                </View>
            </KeyboardAvoidingView>

            {/* Helper Modals */}
            <PickerModal data={UNITS} visible={showUnitPicker} close={() => setShowUnitPicker(false)} onSelect={setSelectedUnit} />
        </Modal>

        {/* 👇 SECURITY MODAL MOVED OUTSIDE */}
        <OpsPinModal
            visible={pinModalVisible}
            onClose={() => setPinModalVisible(false)}
            actionName={initialData ? "Edit Inventory" : "Add Inventory"}
            actionDescription="Enter the Operations PIN to save changes"
            onSuccess={handleSecureSave}
        />
        </React.Fragment>
    );
}
