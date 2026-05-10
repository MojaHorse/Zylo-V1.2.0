import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, Modal, TouchableOpacity, TextInput, Alert, 
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import tw from 'twrnc';
import { X, Save, Tag, Box, Plus, Trash2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useBusiness } from '../Context/BusinessContext';

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
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

export default function AddSimpleProductModal({ visible, onClose, onSaved, editProduct }: Props) {
  const { selectedBusiness: business } = useBusiness();
  const isEditMode = !!editProduct;
  
  // Basic Info
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  
  // Linked Inventory (1:1 tracking)
  const [linkedInventoryId, setLinkedInventoryId] = useState<string | null>(null);
  
  // Customizations
  const [customizations, setCustomizations] = useState<Customization[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const isSubmitting = useRef(false);

  // Picker
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (visible && business) {
      fetchInventory();
      if (editProduct) {
        setName(editProduct.name || '');
        setPrice(String(editProduct.price || ''));
        setCategory(editProduct.category || '');
        // Fetch existing customizations and linked inventory if needed
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
      .select('id, name, unit')
      .eq('business_id', business.id)
      .order('name');
    if (data) setInventoryList(data);
  };

  const fetchExistingData = async (productId: string) => {
    // Fetch customizations
    const { data: custData } = await supabase
      .from('product_customizations')
      .select('name, extra_cost')
      .eq('product_id', productId);
    
    if (custData) {
      setCustomizations(custData.map(c => ({ name: c.name, price: String(c.extra_cost) })));
    }

    // Fetch linked inventory (if any)
    const { data: ingData } = await supabase
      .from('product_ingredients')
      .select('inventory_item_id')
      .eq('product_id', productId)
      .limit(1);
    
    if (ingData && ingData.length > 0) {
      setLinkedInventoryId(ingData[0].inventory_item_id);
    } else {
      setLinkedInventoryId(null);
    }
  };

  const handleSave = async () => {
    if (isSubmitting.current) return;
    if (!name || !price || !business) return Alert.alert("Required", "Name and Price are required.");

    isSubmitting.current = true;
    setLoading(true);

    try {
      let productId = editProduct?.id;

      if (isEditMode && productId) {
        // Update product
        const { error } = await supabase
          .from('products')
          .update({ name, price: parseFloat(price), category, product_type: 'simple' })
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
            product_type: 'simple',
            is_available: true
          })
          .select()
          .single();

        if (error || !data) throw error;
        productId = data.id;
      }

      // Handle Linked Inventory (always replace existing for simplicity)
      if (productId) {
        await supabase.from('product_ingredients').delete().eq('product_id', productId);
        if (linkedInventoryId) {
          const linkedItem = inventoryList.find(i => i.id === linkedInventoryId);
          if (linkedItem) {
            await supabase.from('product_ingredients').insert({
              business_id: business.id,
              product_id: productId,
              inventory_item_id: linkedInventoryId,
              quantity_required: 1,
              unit_used: linkedItem.unit === 'L' ? 'ml' : (linkedItem.unit === 'kg' ? 'g' : linkedItem.unit)
            });
          }
        }

        // Handle Customizations
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
    setName(''); setPrice(''); setCategory(''); setLinkedInventoryId(null); setCustomizations([]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1`}>
        <View style={tw`flex-1 bg-slate-900/60 justify-end sm:justify-center items-center p-4 sm:p-0`}>
          <View style={tw`bg-white w-full max-w-lg h-[90%] sm:h-auto sm:rounded-[32px] rounded-t-[32px] overflow-hidden shadow-2xl`}>
            
            {/* Header */}
            <View style={tw`flex-row justify-between items-center px-6 py-5 border-b border-slate-100 bg-white`}>
              <View style={tw`flex-row items-center gap-3`}>
                <View style={tw`w-10 h-10 bg-indigo-50 rounded-2xl items-center justify-center border border-indigo-100`}>
                  <Tag size={20} color="#4f46e5" />
                </View>
                <Text style={tw`text-slate-900 text-xl font-bold tracking-tight`}>{isEditMode ? 'Edit Product' : 'New Simple Product'}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={tw`w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-200`}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={tw`p-6 bg-slate-50`} keyboardShouldPersistTaps="handled">
              
              {/* Basic Info */}
              <View style={tw`mb-8`}>
                <Text style={tw`text-slate-600 mb-2 font-bold ml-1`}>Product Name <Text style={tw`text-red-500`}>*</Text></Text>
                <TextInput
                  style={tw`bg-white text-slate-900 px-5 py-4 rounded-2xl border border-slate-200 mb-5 text-lg shadow-sm`}
                  placeholder="e.g. Coca-Cola 330ml"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                />

                <View style={tw`flex-row gap-4 mb-4`}>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-slate-600 mb-2 font-bold ml-1`}>Price <Text style={tw`text-red-500`}>*</Text></Text>
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
                      placeholder="e.g. Drinks"
                      placeholderTextColor="#94a3b8"
                      value={category}
                      onChangeText={setCategory}
                    />
                  </View>
                </View>
              </View>

              {/* Linked Inventory */}
              <View style={tw`mb-8 p-5 bg-white rounded-3xl border border-slate-200 shadow-sm`}>
                <Text style={tw`text-slate-800 font-bold mb-1 text-base`}>Inventory Link (Optional)</Text>
                <Text style={tw`text-slate-500 text-sm mb-5`}>Deduct 1 unit from inventory when sold.</Text>
                
                {linkedInventoryId ? (
                  <View style={tw`flex-row items-center justify-between bg-indigo-50 p-4 rounded-2xl border border-indigo-100`}>
                    <View style={tw`flex-row items-center gap-3`}>
                      <Box size={20} color="#4f46e5" />
                      <Text style={tw`text-indigo-900 font-bold text-base`}>
                        {inventoryList.find(i => i.id === linkedInventoryId)?.name || 'Unknown Item'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setLinkedInventoryId(null)} style={tw`bg-white p-1.5 rounded-full border border-indigo-100`}>
                      <X size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    onPress={() => setShowPicker(true)}
                    style={tw`flex-row items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50`}
                  >
                    <Plus size={20} color="#64748b" style={tw`mr-2`} />
                    <Text style={tw`text-slate-600 font-bold`}>Link Inventory Item</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Customizations */}
              <View style={tw`mb-8`}>
                <View style={tw`flex-row justify-between items-center mb-4 px-1`}>
                  <Text style={tw`text-slate-800 font-bold text-base`}>Options / Add-ons</Text>
                  <TouchableOpacity 
                    onPress={() => setCustomizations([...customizations, { name: '', price: '' }])}
                    style={tw`flex-row items-center bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100`}
                  >
                    <Plus size={16} color="#4f46e5" />
                    <Text style={tw`text-indigo-600 text-sm font-bold ml-1`}>Add Option</Text>
                  </TouchableOpacity>
                </View>

                {customizations.map((cust, idx) => (
                  <View key={idx} style={tw`flex-row gap-3 mb-3 items-center`}>
                    <TextInput
                      style={tw`flex-2 bg-white text-slate-900 px-4 py-3 rounded-xl border border-slate-200 shadow-sm`}
                      placeholder="e.g. Extra Syrup"
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
                style={tw`w-full bg-indigo-600 p-4 rounded-2xl items-center flex-row justify-center shadow-md ${loading ? 'opacity-70' : ''}`}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="white" /> : (
                  <>
                    <Save size={20} color="white" style={tw`mr-2`} />
                    <Text style={tw`text-white font-bold text-lg`}>Save Simple Product</Text>
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
              <Text style={tw`text-slate-900 font-bold text-lg`}>Select Inventory Item</Text>
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
                    setLinkedInventoryId(item.id);
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
  );
}
