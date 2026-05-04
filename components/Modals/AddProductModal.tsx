import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, Modal, TouchableOpacity, TextInput, Alert, 
  ActivityIndicator, ScrollView, FlatList, KeyboardAvoidingView, Platform 
} from 'react-native';
import tw from 'twrnc';
import { X, Save, Plus, Trash2, Box, Tag } from 'lucide-react-native'; // Ensure imports match your icon library
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../Context/BusinessContext';

// --- TYPES ---
interface InventoryItem {
  id: string;
  name: string;
  unit: string;
}

interface RecipeItem {
  inventory_item_id: string;
  name: string;
  quantity: string;
  unit: string;
}

interface Customization {
  inventory_item_id?: string; // Optional: Some extras might just be text like "Well Done"
  name: string;
  price: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  editProduct?: { id: string; name: string; price: number; category: string; description?: string } | null;
}

// --- CONSTANTS ---
const UNIT_OPTIONS: Record<string, string[]> = {
  'L': ['L', 'ml'],
  'kg': ['kg', 'g'],
  'Units': ['Units'],
  'Rolls': ['Rolls'],
  'ml': ['ml'],
  'g': ['g']
};

export default function AddProductModal({ visible, onClose, onSaved, editProduct }: Props) {
  const { selectedBusiness: business } = useBusiness();
  const isEditMode = !!editProduct;
  
  // Basic Info
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  
  // Complex Data
  const [ingredients, setIngredients] = useState<RecipeItem[]>([]);
  const [customizations, setCustomizations] = useState<Customization[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  
  // 👇 REF FOR SUBMISSION LOCK
  const isSubmitting = useRef(false);

  // PICKER LOGIC
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'ingredient' | 'customization'>('ingredient');

  // --- 1. FETCH INVENTORY & PRE-FILL FOR EDIT ---
  useEffect(() => {
    if (visible && business) {
      fetchInventory();
      if (editProduct) {
        // Pre-fill form with existing product data
        setName(editProduct.name || '');
        setPrice(String(editProduct.price || ''));
        setCategory(editProduct.category || '');
      } else {
        resetForm();
      }
    }
  }, [visible, business, editProduct]);

  const fetchInventory = async () => {
    if (!business) return;
    const { data } = await supabase
      .from('inventory_items')
      .select('id, name, unit')
      .eq('business_id', business.id)
      .order('name');
    if (data) setInventoryList(data);
  };

  // --- 2. PICKER HANDLER ---
  const handleOpenPicker = (mode: 'ingredient' | 'customization') => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  const handlePickItem = (item: InventoryItem) => {
    if (pickerMode === 'ingredient') {
      // Add as Recipe Ingredient
      let defaultUnit = item.unit;
      if (item.unit === 'L') defaultUnit = 'ml';
      if (item.unit === 'kg') defaultUnit = 'g';

      setIngredients([...ingredients, {
        inventory_item_id: item.id,
        name: item.name,
        quantity: '',
        unit: defaultUnit
      }]);

    } else {
      // Add as Customization Extra
      setCustomizations([...customizations, {
        inventory_item_id: item.id,
        name: item.name, // Pre-fill name from inventory
        price: '' // User decides the selling price
      }]);
    }
    setShowPicker(false);
  };

  // --- 3. LIST MODIFIERS ---
  const updateIngredient = (index: number, field: keyof RecipeItem, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    const updated = [...ingredients];
    updated.splice(index, 1);
    setIngredients(updated);
  };

  const updateCustomization = (index: number, field: keyof Customization, value: string) => {
    const updated = [...customizations];
    updated[index] = { ...updated[index], [field]: value };
    setCustomizations(updated);
  };

  const removeCustomization = (index: number) => {
    const updated = [...customizations];
    updated.splice(index, 1);
    setCustomizations(updated);
  };

  // --- 4. SAVE LOGIC ---
  const handleSave = async () => {
    // 🔒 GUARD: If already submitting, stop immediately.
    if (isSubmitting.current) return;
    
    if (!name || !price || !business) return Alert.alert("Error", "Name and Price required");

    // 🔒 LOCK: Set flag to true
    isSubmitting.current = true;
    setLoading(true);

    try {
      if (isEditMode && editProduct) {
        // UPDATE existing product
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name,
            price: parseFloat(price),
            category,
          })
          .eq('id', editProduct.id);

        if (updateError) throw updateError;
      } else {
        // INSERT new product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .insert({
            business_id: business.id,
            name,
            price: parseFloat(price),
            category,
            is_available: true
          })
          .select()
          .single();

        if (productError || !productData) throw productError;
        const productId = productData.id;

        // B. Insert Ingredients (only for new products)
        if (ingredients.length > 0) {
          const ingredientsPayload = ingredients.map(ing => ({
            business_id: business.id,
            product_id: productId,
            inventory_item_id: ing.inventory_item_id,
            quantity_required: parseFloat(ing.quantity) || 0,
            unit_used: ing.unit
          }));

          const { error: ingError } = await supabase.from('product_ingredients').insert(ingredientsPayload);
          if (ingError) throw ingError;
        }

        // C. Insert Customizations (only for new products)
        if (customizations.length > 0) {
          const customPayload = customizations
            .filter(c => c.name.trim() !== '')
            .map(c => ({
              business_id: business.id,
              product_id: productId,
              inventory_item_id: c.inventory_item_id || null,
              name: c.name,
              extra_cost: parseFloat(c.price) || 0
            }));
            
          const { error: custError } = await supabase.from('product_customizations').insert(customPayload);
          if (custError) throw custError;
        }
      }

      onSaved();
      onClose();
      resetForm();

    } catch (error: any) {
      Alert.alert("Error Saving Product", error.message);
    } finally {
      // 🔓 UNLOCK: Release flag so user can retry if needed
      isSubmitting.current = false;
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName(''); setPrice(''); setCategory(''); setIngredients([]); setCustomizations([]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1`}>
        <View style={tw`flex-1 bg-black/90 justify-end sm:justify-center items-center`}>
          <View style={tw`bg-[#1a1a1a] w-full max-w-lg h-[90%] sm:h-auto sm:rounded-2xl rounded-t-2xl border border-[#333] overflow-hidden`}>
            
            {/* Header */}
            <View style={tw`flex-row justify-between items-center p-5 border-b border-[#333]`}>
              <Text style={tw`text-white text-xl font-bold`}>{isEditMode ? 'Edit Product' : 'New Product'}</Text>
              <TouchableOpacity onPress={onClose}><X color="#666" /></TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={tw`p-5 pb-20`}>
              {/* DETAILS */}
              <Text style={tw`text-[#84cc16] font-bold mb-2 uppercase text-xs tracking-wider`}>Basic Details</Text>
              <TextInput
                placeholder="Product Name" placeholderTextColor="#666"
                style={tw`bg-[#111] text-white p-4 rounded-xl border border-[#333] mb-3 font-bold text-lg`}
                value={name} onChangeText={setName}
              />
              <View style={tw`flex-row gap-3 mb-6`}>
                <TextInput
                  placeholder="Price (R)" placeholderTextColor="#666" keyboardType="numeric"
                  style={tw`flex-1 bg-[#111] text-white p-4 rounded-xl border border-[#333]`}
                  value={price} onChangeText={setPrice}
                />
                <TextInput
                  placeholder="Category" placeholderTextColor="#666"
                  style={tw`flex-1 bg-[#111] text-white p-4 rounded-xl border border-[#333]`}
                  value={category} onChangeText={setCategory}
                />
              </View>

              {/* RECIPE SECTION */}
              <View style={tw`flex-row justify-between items-center mb-2 mt-2`}>
                <Text style={tw`text-[#84cc16] font-bold uppercase text-xs tracking-wider`}>Recipe (Ingredients)</Text>
                <TouchableOpacity onPress={() => handleOpenPicker('ingredient')} style={tw`flex-row items-center`}>
                  <Plus size={16} color="#84cc16" />
                  <Text style={tw`text-[#84cc16] text-xs font-bold ml-1`}>Add Ingredient</Text>
                </TouchableOpacity>
              </View>

              {ingredients.map((ing, index) => (
                <View key={index} style={tw`bg-[#111] p-3 rounded-xl border border-[#333] mb-2 flex-row items-center gap-2`}>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-white text-sm font-bold`}>{ing.name}</Text>
                    <Text style={tw`text-gray-500 text-xs`}>Recipe Item</Text>
                  </View>
                  <TextInput
                    placeholder="Qty" placeholderTextColor="#444" keyboardType="numeric"
                    style={tw`bg-[#222] text-white p-2 rounded-lg w-20 text-center border border-[#333]`}
                    value={ing.quantity}
                    onChangeText={(val) => updateIngredient(index, 'quantity', val)}
                  />
                  {/* Unit Toggle */}
                  <TouchableOpacity 
                    style={tw`bg-[#222] p-2 rounded-lg border border-[#333] w-14 items-center`}
                    onPress={() => {
                       const options = UNIT_OPTIONS[ing.unit] || UNIT_OPTIONS['L'];
                       const currentIdx = options.indexOf(ing.unit);
                       const nextUnit = options[(currentIdx + 1) % options.length] || ing.unit;
                       updateIngredient(index, 'unit', nextUnit);
                    }}
                  >
                    <Text style={tw`text-[#84cc16] font-bold text-xs`}>{ing.unit}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeIngredient(index)}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* CUSTOMIZATIONS SECTION */}
              <View style={tw`flex-row justify-between items-center mb-2 mt-4`}>
                <Text style={tw`text-[#84cc16] font-bold uppercase text-xs tracking-wider`}>Extras / Add-ons</Text>
                <TouchableOpacity onPress={() => handleOpenPicker('customization')} style={tw`flex-row items-center`}>
                  <Plus size={16} color="#84cc16" />
                  <Text style={tw`text-[#84cc16] text-xs font-bold ml-1`}>Add Extra</Text>
                </TouchableOpacity>
              </View>

              {customizations.map((cust, index) => (
                <View key={index} style={tw`flex-row gap-2 mb-2 items-center`}>
                   {/* Visual Indicator that it is linked to inventory */}
                   {cust.inventory_item_id ? (
                      <Box size={16} color="#84cc16" style={tw`mr-1`} />
                   ) : (
                      <Tag size={16} color="gray" style={tw`mr-1`} />
                   )}
                  
                  <TextInput
                    placeholder="Option Name" placeholderTextColor="#444"
                    style={tw`flex-2 bg-[#111] text-white p-3 rounded-xl border border-[#333]`}
                    value={cust.name}
                    onChangeText={(val) => updateCustomization(index, 'name', val)}
                  />
                  <TextInput
                    placeholder="+ Price" placeholderTextColor="#444" keyboardType="numeric"
                    style={tw`flex-1 bg-[#111] text-white p-3 rounded-xl border border-[#333]`}
                    value={cust.price}
                    onChangeText={(val) => updateCustomization(index, 'price', val)}
                  />
                  <TouchableOpacity onPress={() => removeCustomization(index)} style={tw`justify-center px-2`}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
              <Text style={tw`text-gray-500 text-xs italic mt-1`}>
                <Box size={10} color="#84cc16"/> = Linked to Stock
              </Text>

              <View style={tw`h-10`} /> 
            </ScrollView>

            {/* Footer */}
            <View style={tw`p-5 border-t border-[#333] bg-[#1a1a1a]`}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={loading} // Also disable UI state if loading
                style={tw`bg-[#84cc16] p-4 rounded-xl items-center flex-row justify-center gap-2 ${loading ? 'opacity-50' : ''}`}
              >
                {loading ? <ActivityIndicator color="black" /> : (
                  <>
                    <Save size={18} color="black" />
                    <Text style={tw`text-black font-bold text-lg`}>{isEditMode ? 'Update Product' : 'Save Product'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* --- SHARED INVENTORY PICKER --- */}
            <Modal visible={showPicker} animationType="fade" transparent>
              <View style={tw`flex-1 bg-black/90 justify-center items-center p-5`}>
                <View style={tw`bg-[#222] w-full max-w-sm max-h-[70%] rounded-xl border border-[#444] overflow-hidden`}>
                  <View style={tw`p-4 border-b border-[#333] flex-row justify-between items-center`}>
                    <Text style={tw`text-white font-bold`}>
                      {pickerMode === 'ingredient' ? 'Select Ingredient' : 'Select Inventory for Extra'}
                    </Text>
                    <TouchableOpacity onPress={() => setShowPicker(false)}><X color="white" /></TouchableOpacity>
                  </View>
                  <FlatList
                    data={inventoryList}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        onPress={() => handlePickItem(item)}
                        style={tw`p-4 border-b border-[#333] flex-row justify-between`}
                      >
                        <Text style={tw`text-white`}>{item.name}</Text>
                        <Text style={tw`text-gray-500 text-xs`}>{item.unit}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>
            </Modal>

          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

