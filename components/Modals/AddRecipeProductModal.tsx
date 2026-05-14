import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, Modal, TouchableOpacity, TextInput, Alert, 
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import tw from 'twrnc';
import { X, Save, ChefHat, Plus, Trash2, ArrowRight } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../Context/BusinessContext';
import { useAuth } from '../Context/AuthContext';
import OpsPinModal from './OpsPinModal';

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  cost_price: number;
}

interface RecipeItem {
  inventory_item_id: string;
  name: string;
  quantity: string;
  unit: string;
  cost_price: number; // reference for calc
  base_unit: string; // the unit from DB
}

interface Customization {
  name: string;
  price: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  editProduct?: { id: string; name: string; price: number; category: string } | null;
}

const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  'kg': { 'g': 1000, 'kg': 1 },
  'g': { 'g': 1, 'kg': 0.001 },
  'L': { 'ml': 1000, 'L': 1 },
  'ml': { 'ml': 1, 'L': 0.001 },
};

const GET_OPTIONS = (unit: string) => {
  if (['kg', 'g'].includes(unit)) return ['kg', 'g'];
  if (['L', 'ml'].includes(unit)) return ['L', 'ml'];
  return [unit];
};

export default function AddRecipeProductModal({ visible, onClose, onSaved, editProduct }: Props) {
  const { selectedBusiness: business } = useBusiness();
  const isEditMode = !!editProduct;
  
  // Basic Info
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  
  // Recipe
  const [ingredients, setIngredients] = useState<RecipeItem[]>([]);
  
  // Customizations
  const [customizations, setCustomizations] = useState<Customization[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const isSubmitting = useRef(false);

  // Picker
  const [showPicker, setShowPicker] = useState(false);

  // Security
  const { role } = useAuth();
  const [pinModalVisible, setPinModalVisible] = useState(false);

  useEffect(() => {
    if (visible && business) {
      fetchInventory();
      if (editProduct) {
        setName(editProduct.name || '');
        setPrice(String(editProduct.price || ''));
        setCategory(editProduct.category || '');
        fetchExistingData(editProduct.id);
      } else {
        resetForm();
      }
    }
  }, [visible, business, editProduct]);

  const fetchInventory = async () => {
    if (!business) return;
    const { data } = await supabase
      .from('inventory_items')
      .select('id, name, unit, cost_price')
      .eq('business_id', business.id)
      .order('name');
    if (data) setInventoryList(data);
  };

  const fetchExistingData = async (productId: string) => {
    // Customizations
    const { data: custData } = await supabase
      .from('product_customizations')
      .select('name, extra_cost')
      .eq('product_id', productId);
    
    if (custData) {
      setCustomizations(custData.map(c => ({ name: c.name, price: String(c.extra_cost) })));
    }

    // Ingredients
    const { data: ingData } = await supabase
      .from('product_ingredients')
      .select('*, inventory_items(name, unit, cost_price)')
      .eq('product_id', productId);
    
    if (ingData) {
      setIngredients(ingData.map((ing: any) => ({
        inventory_item_id: ing.inventory_item_id,
        name: ing.inventory_items?.name || 'Unknown',
        quantity: String(ing.quantity_required),
        unit: ing.unit_used,
        cost_price: ing.inventory_items?.cost_price || 0,
        base_unit: ing.inventory_items?.unit || ing.unit_used
      })));
    }
  };

  const calculateCost = () => {
    let totalCost = 0;
    ingredients.forEach(ing => {
      const qty = parseFloat(ing.quantity) || 0;
      if (qty <= 0) return;
      
      // Calculate ratio based on base_unit and used unit
      let conversionRatio = 1;
      if (UNIT_CONVERSIONS[ing.base_unit] && UNIT_CONVERSIONS[ing.base_unit][ing.unit]) {
         // e.g. base is kg, used is g -> UNIT_CONVERSIONS['kg']['g'] = 1000. 
         // cost is per kg. So cost of 1g = cost_price / 1000.
         conversionRatio = 1 / UNIT_CONVERSIONS[ing.base_unit][ing.unit];
      }
      
      totalCost += (qty * conversionRatio * ing.cost_price);
    });
    return totalCost;
  };

  const handleSaveAttempt = () => {
    if (isSubmitting.current) return;
    if (!name || !price || !business) return Alert.alert("Required", "Name and Price are required.");
    if (ingredients.length === 0) return Alert.alert("Required", "A recipe must have at least one ingredient.");

    if (role === 'owner' || role === 'manager') {
        handleSave();
    } else {
        setPinModalVisible(true);
    }
  };

  const handleSave = async () => {
    if (isSubmitting.current) return;
    if (!name || !price || !business) return Alert.alert("Required", "Name and Price are required.");
    if (ingredients.length === 0) return Alert.alert("Required", "A recipe must have at least one ingredient.");

    isSubmitting.current = true;
    setLoading(true);

    try {
      let productId = editProduct?.id;

      if (isEditMode && productId) {
        // Update product
        const { error } = await supabase
          .from('products')
          .update({ name, price: parseFloat(price), category, product_type: 'recipe' })
          .eq('id', productId);
        if (error) throw error;
      } else {
        // Insert product
        const { data, error } = await supabase
          .from('products')
          .insert({
            business_id: business.id,
            name,
            price: parseFloat(price),
            category,
            product_type: 'recipe',
            is_available: true
          })
          .select()
          .single();

        if (error || !data) throw error;
        productId = data.id;
      }

      if (productId) {
        // Re-insert ingredients
        await supabase.from('product_ingredients').delete().eq('product_id', productId);
        const ingredientsPayload = ingredients.map(ing => ({
          business_id: business.id,
          product_id: productId,
          inventory_item_id: ing.inventory_item_id,
          quantity_required: parseFloat(ing.quantity) || 0,
          unit_used: ing.unit
        }));
        await supabase.from('product_ingredients').insert(ingredientsPayload);

        // Re-insert Customizations
        await supabase.from('product_customizations').delete().eq('product_id', productId);
        if (customizations.length > 0) {
          const customPayload = customizations
            .filter(c => c.name.trim() !== '')
            .map(c => ({
              business_id: business.id,
              product_id: productId,
              name: c.name,
              extra_cost: parseFloat(c.price) || 0
            }));
          if (customPayload.length > 0) {
            await supabase.from('product_customizations').insert(customPayload);
          }
        }
      }

      onSaved();
      onClose();
      resetForm();

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      isSubmitting.current = false;
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName(''); setPrice(''); setCategory(''); setIngredients([]); setCustomizations([]);
  };

  const cost = calculateCost();
  const margin = parseFloat(price) > 0 ? ((parseFloat(price) - cost) / parseFloat(price)) * 100 : 0;

  return (
    <React.Fragment>
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1`}>
        <View style={tw`flex-1 bg-slate-900/60 justify-end sm:justify-center items-center p-4 sm:p-0`}>
          <View style={tw`bg-white w-full max-w-lg h-[90%] sm:h-auto sm:max-h-[95%] sm:rounded-[32px] rounded-t-[32px] overflow-hidden shadow-2xl`}>
            
            {/* Header */}
            <View style={tw`flex-row justify-between items-center px-6 py-5 border-b border-slate-100 bg-white`}>
              <View style={tw`flex-row items-center gap-3`}>
                <View style={tw`w-10 h-10 bg-orange-50 rounded-2xl items-center justify-center border border-orange-100`}>
                  <ChefHat size={20} color="#ea580c" />
                </View>
                <Text style={tw`text-slate-900 text-xl font-bold tracking-tight`}>{isEditMode ? 'Edit Recipe' : 'New Recipe'}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={tw`w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-200`}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={tw`p-6 bg-slate-50`} keyboardShouldPersistTaps="handled">
              
              {/* Costing Summary Banner */}
              {ingredients.length > 0 && (
                <View style={tw`flex-row bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8 shadow-md`}>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-slate-400 text-xs font-bold uppercase tracking-wider mb-1`}>Recipe Cost</Text>
                    <Text style={tw`text-white text-2xl font-bold`}>${cost.toFixed(2)}</Text>
                  </View>
                  <View style={tw`w-[1px] bg-slate-700 mx-5`} />
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-slate-400 text-xs font-bold uppercase tracking-wider mb-1`}>Est. Margin</Text>
                    <Text style={tw`text-2xl font-bold ${margin > 50 ? 'text-emerald-400' : margin > 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {isNaN(margin) || !isFinite(margin) ? '0%' : `${margin.toFixed(1)}%`}
                    </Text>
                  </View>
                </View>
              )}

              {/* Basic Info */}
              <View style={tw`mb-8`}>
                <Text style={tw`text-slate-600 mb-2 font-bold ml-1`}>Product Name <Text style={tw`text-red-500`}>*</Text></Text>
                <TextInput
                  style={tw`bg-white text-slate-900 px-5 py-4 rounded-2xl border border-slate-200 mb-5 text-lg shadow-sm`}
                  placeholder="e.g. Classic Cheeseburger"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                />

                <View style={tw`flex-row gap-4 mb-4`}>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-slate-600 mb-2 font-bold ml-1`}>Selling Price <Text style={tw`text-red-500`}>*</Text></Text>
                    <View style={tw`bg-white rounded-2xl border border-slate-200 flex-row items-center px-5 shadow-sm`}>
                      <Text style={tw`text-slate-400 font-bold mr-2 text-lg`}>$</Text>
                      <TextInput
                        style={tw`flex-1 text-slate-900 py-4 text-lg`}
                        placeholder="0.00"
                        placeholderTextColor="#94a3b8"
                        keyboardType="decimal-pad"
                        value={price}
                        onChangeText={setPrice}
                      />
                    </View>
                  </View>

                  <View style={tw`flex-1`}>
                    <Text style={tw`text-slate-600 mb-2 font-bold ml-1`}>Category</Text>
                    <TextInput
                      style={tw`bg-white text-slate-900 px-5 py-4 rounded-2xl border border-slate-200 text-lg shadow-sm`}
                      placeholder="e.g. Mains"
                      placeholderTextColor="#94a3b8"
                      value={category}
                      onChangeText={setCategory}
                    />
                  </View>
                </View>
              </View>

              {/* Ingredients List */}
              <View style={tw`mb-8`}>
                <View style={tw`flex-row justify-between items-center mb-4 px-1`}>
                  <Text style={tw`text-slate-800 font-bold text-base`}>Recipe Ingredients <Text style={tw`text-red-500`}>*</Text></Text>
                  <TouchableOpacity 
                    onPress={() => setShowPicker(true)}
                    style={tw`flex-row items-center bg-orange-50 px-4 py-2 rounded-full border border-orange-100`}
                  >
                    <Plus size={16} color="#ea580c" />
                    <Text style={tw`text-orange-600 text-sm font-bold ml-1`}>Add Item</Text>
                  </TouchableOpacity>
                </View>

                {ingredients.length === 0 ? (
                  <View style={tw`border-2 border-dashed border-slate-200 rounded-3xl p-8 items-center justify-center bg-white shadow-sm`}>
                    <View style={tw`w-16 h-16 bg-slate-50 rounded-full items-center justify-center mb-4`}>
                      <ChefHat size={32} color="#94a3b8" />
                    </View>
                    <Text style={tw`text-slate-600 font-bold text-base mb-1`}>No ingredients yet</Text>
                    <Text style={tw`text-slate-400 text-sm text-center`}>Add items from your inventory to build this recipe.</Text>
                  </View>
                ) : (
                  <View style={tw`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm`}>
                    {ingredients.map((ing, idx) => (
                      <View key={idx} style={tw`p-4 border-b border-slate-100 flex-row gap-3 items-center bg-white`}>
                        <View style={tw`flex-1`}>
                          <Text style={tw`text-slate-800 font-bold mb-3`}>{ing.name}</Text>
                          <View style={tw`flex-row gap-2 items-center`}>
                            <TextInput
                              style={tw`bg-slate-50 text-slate-900 p-3 rounded-xl border border-slate-200 w-24 text-center font-bold`}
                              placeholder="0"
                              placeholderTextColor="#94a3b8"
                              keyboardType="decimal-pad"
                              value={ing.quantity}
                              onChangeText={(val) => {
                                const updated = [...ingredients];
                                updated[idx].quantity = val;
                                setIngredients(updated);
                              }}
                            />
                            
                            {/* Toggle Unit */}
                            <TouchableOpacity 
                              onPress={() => {
                                const options = GET_OPTIONS(ing.base_unit);
                                const currIdx = options.indexOf(ing.unit);
                                const nextUnit = options[(currIdx + 1) % options.length];
                                const updated = [...ingredients];
                                updated[idx].unit = nextUnit;
                                setIngredients(updated);
                              }}
                              style={tw`bg-slate-50 px-5 py-3 rounded-xl border border-slate-200 items-center justify-center`}
                            >
                              <Text style={tw`text-slate-700 font-bold`}>{ing.unit}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => {
                          const updated = [...ingredients];
                          updated.splice(idx, 1);
                          setIngredients(updated);
                        }} style={tw`w-12 h-12 bg-red-50 rounded-xl items-center justify-center border border-red-100`}>
                          <Trash2 size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Customizations */}
              <View style={tw`mb-8`}>
                <View style={tw`flex-row justify-between items-center mb-4 px-1`}>
                  <Text style={tw`text-slate-800 font-bold text-base`}>Options / Add-ons</Text>
                  <TouchableOpacity 
                    onPress={() => setCustomizations([...customizations, { name: '', price: '' }])}
                    style={tw`flex-row items-center bg-orange-50 px-4 py-2 rounded-full border border-orange-100`}
                  >
                    <Plus size={16} color="#ea580c" />
                    <Text style={tw`text-orange-600 text-sm font-bold ml-1`}>Add Option</Text>
                  </TouchableOpacity>
                </View>

                {customizations.map((cust, idx) => (
                  <View key={idx} style={tw`flex-row gap-3 mb-3 items-center`}>
                    <TextInput
                      style={tw`flex-2 bg-white text-slate-900 px-4 py-3 rounded-xl border border-slate-200 shadow-sm`}
                      placeholder="e.g. Make it Spicy"
                      placeholderTextColor="#94a3b8"
                      value={cust.name}
                      onChangeText={(val) => {
                        const updated = [...customizations];
                        updated[idx].name = val;
                        setCustomizations(updated);
                      }}
                    />
                    <TextInput
                      style={tw`flex-1 bg-white text-slate-900 px-4 py-3 rounded-xl border border-slate-200 shadow-sm`}
                      placeholder="+ $0.00"
                      placeholderTextColor="#94a3b8"
                      keyboardType="decimal-pad"
                      value={cust.price}
                      onChangeText={(val) => {
                        const updated = [...customizations];
                        updated[idx].price = val;
                        setCustomizations(updated);
                      }}
                    />
                    <TouchableOpacity onPress={() => {
                      const updated = [...customizations];
                      updated.splice(idx, 1);
                      setCustomizations(updated);
                    }} style={tw`p-3 bg-red-50 rounded-xl border border-red-100 items-center justify-center`}>
                      <Trash2 size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={tw`p-6 border-t border-slate-100 bg-white`}>
              <TouchableOpacity 
                style={tw`w-full bg-orange-600 p-4 rounded-2xl items-center flex-row justify-center shadow-md ${loading ? 'opacity-70' : ''}`}
                onPress={handleSaveAttempt}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="white" /> : (
                  <>
                    <Save size={20} color="white" style={tw`mr-2`} />
                    <Text style={tw`text-white font-bold text-lg`}>Save Recipe</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Inventory Picker Modal */}
      <Modal visible={showPicker} transparent animationType="fade">
        <View style={tw`flex-1 bg-slate-900/60 justify-center p-4`}>
          <View style={tw`bg-white rounded-[32px] overflow-hidden max-h-[80%] shadow-2xl`}>
            <View style={tw`px-6 py-5 border-b border-slate-100 flex-row justify-between items-center bg-white`}>
              <Text style={tw`text-slate-900 font-bold text-lg`}>Select Ingredient</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)} style={tw`w-8 h-8 bg-slate-50 rounded-full items-center justify-center border border-slate-200`}>
                <X color="#64748b" size={18} />
              </TouchableOpacity>
            </View>
            <ScrollView style={tw`p-2 bg-slate-50`}>
              {inventoryList.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={tw`p-4 mb-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex-row justify-between items-center`}
                  onPress={() => {
                    let defaultUnit = item.unit;
                    if (item.unit === 'L') defaultUnit = 'ml';
                    if (item.unit === 'kg') defaultUnit = 'g';

                    setIngredients([...ingredients, {
                      inventory_item_id: item.id,
                      name: item.name,
                      quantity: '',
                      unit: defaultUnit,
                      cost_price: item.cost_price || 0,
                      base_unit: item.unit
                    }]);
                    setShowPicker(false);
                  }}
                >
                  <Text style={tw`text-slate-800 font-bold text-base`}>{item.name}</Text>
                  <View style={tw`bg-slate-100 px-3 py-1 rounded-full`}>
                    <Text style={tw`text-slate-600 font-medium text-xs`}>{item.unit}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </Modal>

    {/* Security Modal */}
    <OpsPinModal
        visible={pinModalVisible}
        onClose={() => setPinModalVisible(false)}
        actionName={isEditMode ? "Edit Recipe" : "Add Recipe"}
        actionDescription="Enter the Operations PIN to save changes"
        onSuccess={() => {
            setPinModalVisible(false);
            handleSave();
        }}
    />
    </React.Fragment>
  );
}
