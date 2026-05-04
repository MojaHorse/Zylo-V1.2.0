import React, { useState, useEffect } from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Pressable,
    FlatList,
} from "react-native";
import tw from "twrnc";
import { supabase } from "../../lib/supabase";

export default function EditInventoryModal({ visible, onClose, onSaved, editingItem }) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Meat");
    const [stock, setStock] = useState("0");
    const [lowAlert, setLowAlert] = useState("0");
    const [unit, setUnit] = useState("Units");
    const [costPerUnit, setCostPerUnit] = useState("0");

    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [showUnitPicker, setShowUnitPicker] = useState(false);

    const unitsList = ["Units", "Rolls", "g", "kg", "ml", "L"];
    const categories = ["Meat", "Bread", "Veggies", "Drinks", "Other"];

    // 🔥 FIXED: Always show correct existing data (NO NULLS)
    useEffect(() => {
        if (visible) {
            if (editingItem) {
                setName(editingItem.name || "");
                setCategory(editingItem.category || "Meat");
                setStock(String(editingItem.quantity ?? 0));
                setLowAlert(String(editingItem.low_stock_alert ?? 0));
                setUnit(editingItem.unit || "Units");
                setCostPerUnit(String(editingItem.cost_per_unit ?? 0));
            } else {
                // Default fields when adding new item
                setName("");
                setCategory("Meat");
                setStock("0");
                setLowAlert("5");
                setUnit("Units");
                setCostPerUnit("0");
            }
        }
    }, [visible, editingItem]);

    // Status badge
    const getStatus = () => {
        const qty = Number(stock) || 0;
        const alertLevel = Number(lowAlert) || 0;

        if (qty <= alertLevel) return { label: "Critical Stock", style: "bg-red-500", text: "text-white" };
        if (qty <= alertLevel * 1.5) return { label: "Low Stock", style: "bg-orange-500", text: "text-white" };
        return { label: "Good Stock", style: "bg-green-500", text: "text-black" };
    };

    const status = getStatus();

    // SAVE or UPDATE item
    const saveItem = async () => {
        if (!name.trim()) {
            alert("Item name is required.");
            return;
        }

        const payload = {
            name,
            unit,
            quantity: Number(stock),
            cost_per_unit: Number(costPerUnit),
            category,
            low_stock_alert: Number(lowAlert),
        };

        let error;

        if (editingItem) {
            // UPDATE existing item
            const { error: updateError } = await supabase
                .from("inventory_items")
                .update(payload)
                .eq("id", editingItem.id);

            error = updateError;
        } else {
            // INSERT new item
            const { error: insertError } = await supabase
                .from("inventory_items")
                .insert(payload);

            error = insertError;
        }

        if (error) {
            alert("Error saving item: " + error.message);
            return;
        }

        onSaved?.();
        onClose();
    };

    // Picker modal component
    const PickerModal = ({ data, onSelect, onClose }) => (
        <Modal transparent animationType="fade">
            <Pressable
                onPress={onClose}
                style={tw`flex-1 bg-black/60 justify-center items-center`}
            >
                <View style={tw`bg-[#2b2b2b] w-72 rounded-xl p-4`}>
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => {
                                    onSelect(item);
                                    onClose();
                                }}
                                style={tw`py-3`}
                            >
                                <Text style={tw`text-white text-center text-lg`}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Pressable>
        </Modal>
    );

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={tw`flex-1 bg-black/60 items-center justify-center`}>
                <View style={tw`w-11/12 max-w-xl bg-[#2b2b2b] rounded-2xl p-6`}>

                    {/* HEADER */}
                    <View style={tw`flex-row justify-between items-center mb-6`}>
                        <Text style={tw`text-white text-2xl font-bold`}>
                            {editingItem ? "Edit item" : "Add new item"}
                        </Text>

                        <View style={tw`px-3 py-1.5 rounded-full ${status.style}`}>
                            <Text style={tw`text-xs font-bold ${status.text}`}>
                                {status.label}
                            </Text>
                        </View>
                    </View>

                    {/* NAME */}
                    <Text style={tw`text-gray-300 mb-1`}>Item name</Text>
                    <TextInput
                        placeholder="e.g., Polony rolls"
                        placeholderTextColor="#777"
                        value={name}
                        onChangeText={setName}
                        style={tw`bg-[#1f1f1f] text-white px-4 py-3 rounded-lg mb-4 border border-[#333]`}
                    />

                    {/* CATEGORY */}
                    <Text style={tw`text-gray-300 mb-1`}>Category</Text>
                    <TouchableOpacity
                        onPress={() => setShowCategoryPicker(true)}
                        style={tw`bg-[#1f1f1f] px-4 py-3 rounded-lg mb-4 border border-[#333]`}
                    >
                        <Text style={tw`text-white`}>{category}</Text>
                    </TouchableOpacity>

                    {/* STOCK & UNIT */}
                    <View style={tw`flex-row justify-between mb-4`}>
                        <View style={tw`w-[48%]`}>
                            <Text style={tw`text-gray-300 mb-1`}>Stock</Text>
                            <TextInput
                                value={stock}
                                onChangeText={setStock}
                                keyboardType="numeric"
                                style={tw`bg-[#1f1f1f] text-white px-4 py-3 rounded-lg border border-[#333]`}
                            />
                        </View>

                        <View style={tw`w-[48%]`}>
                            <Text style={tw`text-gray-300 mb-1`}>Units</Text>
                            <TouchableOpacity
                                onPress={() => setShowUnitPicker(true)}
                                style={tw`bg-[#1f1f1f] px-4 py-3 rounded-lg border border-[#333]`}
                            >
                                <Text style={tw`text-white`}>{unit}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* LOW ALERT & COST */}
                    <View style={tw`flex-row justify-between mb-6`}>
                        <View style={tw`w-[48%]`}>
                            <Text style={tw`text-gray-300 mb-1`}>Low stock alert</Text>
                            <TextInput
                                value={lowAlert}
                                onChangeText={setLowAlert}
                                keyboardType="numeric"
                                style={tw`bg-[#1f1f1f] text-white px-4 py-3 rounded-lg border border-[#333]`}
                            />
                        </View>

                        <View style={tw`w-[48%]`}>
                            <Text style={tw`text-gray-300 mb-1`}>Cost Price (per unit)</Text>
                            <TextInput
                                value={costPerUnit}
                                onChangeText={setCostPerUnit}
                                keyboardType="numeric"
                                style={tw`bg-[#1f1f1f] text-white px-4 py-3 rounded-lg border border-[#333]`}
                            />
                        </View>
                    </View>

                    {/* BUTTONS */}
                    <View style={tw`flex-row justify-between`}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={tw`bg-gray-600 px-6 py-3 rounded-lg`}
                        >
                            <Text style={tw`text-white font-medium`}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={saveItem}
                            style={tw`bg-green-500 px-6 py-3 rounded-lg`}
                        >
                            <Text style={tw`text-black font-bold`}>
                                {editingItem ? "Update item" : "Save item"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>

            {/* PICKERS */}
            {showCategoryPicker && (
                <PickerModal
                    data={categories}
                    onSelect={setCategory}
                    onClose={() => setShowCategoryPicker(false)}
                />
            )}

            {showUnitPicker && (
                <PickerModal
                    data={unitsList}
                    onSelect={setUnit}
                    onClose={() => setShowUnitPicker(false)}
                />
            )}
        </Modal>
    );
}
