import React, { useState } from "react";
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

interface Props {
    visible: boolean;
    onClose: () => void;
    onSaved?: () => void;
}

interface PickerModalProps {
    data: string[];
    onSelect: (item: string) => void;
    onClose: () => void;
}

export default function AddInventoryModal({ visible, onClose, onSaved }: Props) {
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

    const saveItem = async () => {
        if (!name.trim()) {
            alert("Item name is required.");
            return;
        }

        const { error } = await supabase.from("inventory_items").insert({
            name,
            unit,
            quantity: Number(stock),
            cost_per_unit: Number(costPerUnit),
            category,
            low_stock_alert: Number(lowAlert)
        });

        if (error) {
            alert("Error saving item: " + error.message);
            return;
        }

        // Reset
        setName("");
        setStock("0");
        setCostPerUnit("0");
        setLowAlert("0");
        setUnit("Units");

        onSaved?.();
        onClose();
    };

    const PickerModal = ({ data, onSelect, onClose }: PickerModalProps) => (
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
                    <Text style={tw`text-white text-2xl font-bold mb-4`}>
                        Add new item
                    </Text>

                    {/* Item Name */}
                    <Text style={tw`text-gray-300 mb-1`}>Item name</Text>
                    <TextInput
                        placeholder="e.g., Polony rolls"
                        placeholderTextColor="#777"
                        value={name}
                        onChangeText={setName}
                        style={tw`bg-[#1f1f1f] text-white px-4 py-3 rounded-lg mb-4`}
                    />

                    {/* CATEGORY */}
                    <Text style={tw`text-gray-300 mb-1`}>Category</Text>
                    <TouchableOpacity
                        onPress={() => setShowCategoryPicker(true)}
                        style={tw`bg-[#1f1f1f] px-4 py-3 rounded-lg mb-4`}
                    >
                        <Text style={tw`text-white`}>{category}</Text>
                    </TouchableOpacity>

                    {/* STOCK + UNITS */}
                    <View style={tw`flex-row justify-between mb-4`}>
                        <View style={tw`w-[48%]`}>
                            <Text style={tw`text-gray-300 mb-1`}>Stock</Text>
                            <TextInput
                                value={stock}
                                onChangeText={setStock}
                                keyboardType="numeric"
                                style={tw`bg-[#1f1f1f] text-white px-4 py-3 rounded-lg`}
                            />
                        </View>

                        <View style={tw`w-[48%]`}>
                            <Text style={tw`text-gray-300 mb-1`}>Units</Text>
                            <TouchableOpacity
                                onPress={() => setShowUnitPicker(true)}
                                style={tw`bg-[#1f1f1f] px-4 py-3 rounded-lg`}
                            >
                                <Text style={tw`text-white`}>{unit}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* LOW ALERT + COST */}
                    <View style={tw`flex-row justify-between mb-6`}>
                        <View style={tw`w-[48%]`}>
                            <Text style={tw`text-gray-300 mb-1`}>Low stock alert</Text>
                            <TextInput
                                value={lowAlert}
                                onChangeText={setLowAlert}
                                keyboardType="numeric"
                                style={tw`bg-[#1f1f1f] text-white px-4 py-3 rounded-lg`}
                            />
                        </View>

                        <View style={tw`w-[48%]`}>
                            <Text style={tw`text-gray-300 mb-1`}>Cost Price (per unit)</Text>
                            <TextInput
                                value={costPerUnit}
                                onChangeText={setCostPerUnit}
                                keyboardType="numeric"
                                style={tw`bg-[#1f1f1f] text-white px-4 py-3 rounded-lg`}
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
                            <Text style={tw`text-black font-bold`}>Save item</Text>
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
