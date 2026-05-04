import React, { useState } from 'react';
import { Modal, View, Text, TextInput, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import tw from 'twrnc';
import * as Haptics from 'expo-haptics';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onApprove: (pin: string) => Promise<void>; 
  loading?: boolean;
}

export default function ManagerApprovalModal({ visible, onCancel, onApprove, loading }: Props) {
  const [pin, setPin] = useState('');

  const handleSubmit = () => {
    if (!pin) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApprove(pin);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1`}>
        <View style={tw`flex-1 bg-slate-900/40 justify-center items-center p-4`}>
          <View style={tw`bg-white w-full max-w-sm p-8 rounded-[2rem] border border-slate-200 shadow-2xl`}>
            <Text style={tw`text-slate-900 text-2xl font-black mb-2 text-center tracking-tight`}>Manager Approval</Text>
            <Text style={tw`text-slate-500 font-medium text-sm mb-6 text-center`}>
               Enter Manager or Owner PIN to authorize.
            </Text>

            <Text style={tw`text-slate-400 text-xs uppercase font-bold mb-2 ml-1 tracking-widest`}>Access PIN</Text>
            <TextInput
              style={tw`bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-2xl mb-8 text-center text-3xl font-black tracking-[16px] shadow-sm`}
              placeholder="0000"
              placeholderTextColor="#cbd5e1"
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              keyboardType="numeric"
              autoFocus={true}
              maxLength={4}
            />

            <View style={tw`flex-row gap-3`}>
              <Pressable 
                onPress={() => {
                  Haptics.selectionAsync();
                  onCancel();
                }}
                style={({ pressed }) => [
                  tw`flex-1 bg-slate-100 p-4 rounded-xl items-center transition-all border border-slate-200`,
                  pressed && tw`bg-slate-200 scale-95`
                ]}
              >
                <Text style={tw`text-slate-700 font-bold text-lg`}>Cancel</Text>
              </Pressable>

              <Pressable 
                onPress={handleSubmit}
                disabled={loading}
                style={({ pressed }) => [
                  tw`flex-1 bg-indigo-600 p-4 rounded-xl items-center flex-row justify-center shadow-sm transition-all`,
                  pressed && tw`bg-indigo-700 shadow-none scale-95`
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={tw`text-white font-bold text-lg`}>Authorize</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
