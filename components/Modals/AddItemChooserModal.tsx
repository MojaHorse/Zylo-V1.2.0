import React from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable } from 'react-native';
import AnimatedModalContainer from './AnimatedModalContainer';
import AnimatedPressable from '../AnimatedPressable';
import tw from 'twrnc';
import { X, Tag, ChefHat, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectSimple: () => void;
  onSelectRecipe: () => void;
}

export default function AddItemChooserModal({ visible, onClose, onSelectSimple, onSelectRecipe }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={tw`flex-1 bg-slate-900/60 justify-end sm:justify-center items-center p-4 sm:p-0`}>
        <AnimatedModalContainer visible={visible} style={tw`bg-white w-full max-w-sm sm:rounded-[32px] rounded-t-[32px] overflow-hidden shadow-2xl`}>
          
          {/* Header */}
          <View style={tw`flex-row justify-between items-center px-6 py-5 border-b border-slate-100 bg-white`}>
            <Text style={tw`text-slate-900 text-xl font-bold tracking-tight`}>What are you adding?</Text>
            <TouchableOpacity 
              onPress={() => { Haptics.selectionAsync(); onClose(); }}
              style={tw`w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-200`}
            >
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={tw`p-5 gap-4`}>
            
            {/* Simple Product Option */}
            <AnimatedPressable 
              onPress={() => { Haptics.impactAsync(); onSelectSimple(); }}
              style={({ pressed }) => [
                tw`flex-row items-center p-4 rounded-2xl border transition-all`,
                pressed ? tw`bg-indigo-50 border-indigo-200` : tw`bg-white border-slate-200 shadow-sm`
              ]}
            >
              <View style={tw`w-12 h-12 rounded-full bg-indigo-100 items-center justify-center mr-4`}>
                <Tag size={24} color="#4f46e5" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-base font-bold text-slate-800 mb-1`}>Simple Product</Text>
                <Text style={tw`text-xs text-slate-500`}>Drinks, snacks, or pre-packaged items</Text>
              </View>
            </AnimatedPressable>

            {/* Recipe Product Option */}
            <AnimatedPressable 
              onPress={() => { Haptics.impactAsync(); onSelectRecipe(); }}
              style={({ pressed }) => [
                tw`flex-row items-center p-4 rounded-2xl border transition-all`,
                pressed ? tw`bg-orange-50 border-orange-200` : tw`bg-white border-slate-200 shadow-sm`
              ]}
            >
              <View style={tw`w-12 h-12 rounded-full bg-orange-100 items-center justify-center mr-4`}>
                <ChefHat size={24} color="#ea580c" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-base font-bold text-slate-800 mb-1`}>Recipe (Made to Order)</Text>
                <Text style={tw`text-xs text-slate-500`}>Items built from inventory ingredients</Text>
              </View>
            </AnimatedPressable>

          </View>

        </AnimatedModalContainer>
      </View>
    </Modal>
  );
}
