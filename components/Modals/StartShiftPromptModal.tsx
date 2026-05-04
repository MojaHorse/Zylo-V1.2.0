import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import tw from 'twrnc';
import { Clock, X, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface Props {
    visible: boolean;
    onClose: () => void;
    onStartShift: () => void;
}

export default function StartShiftPromptModal({ visible, onClose, onStartShift }: Props) {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={tw`flex-1 justify-center items-center bg-slate-900/40 p-4`}>
                <View style={tw`bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl`}>
                    
                    {/* Header */}
                    <View style={tw`flex-row justify-between items-center mb-6`}>
                        <View style={tw`bg-indigo-50 p-3 rounded-2xl`}>
                            <Clock size={28} color="#4338ca" />
                        </View>
                        <Pressable 
                            onPress={() => {
                                Haptics.selectionAsync();
                                onClose();
                            }}
                            style={({ pressed }) => [
                                tw`bg-slate-100 p-2 rounded-full`,
                                pressed && tw`bg-slate-200`
                            ]}
                        >
                            <X size={20} color="#64748b" />
                        </Pressable>
                    </View>

                    {/* Content */}
                    <Text style={tw`text-xl font-bold text-slate-800 mb-2`}>
                        Start a Shift?
                    </Text>
                    <Text style={tw`text-slate-500 text-sm leading-5 mb-8`}>
                        You don't currently have an open shift. Would you like to declare your opening float and start selling?
                    </Text>

                    {/* Actions */}
                    <View style={tw`flex-row gap-3`}>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                onClose();
                            }}
                            style={({ pressed }) => [
                                tw`flex-1 bg-slate-100 py-4 rounded-xl items-center justify-center`,
                                pressed && tw`bg-slate-200`
                            ]}
                        >
                            <Text style={tw`text-slate-600 font-bold text-base`}>Not Now</Text>
                        </Pressable>
                        
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                onStartShift();
                            }}
                            style={({ pressed }) => [
                                tw`flex-1 bg-indigo-600 py-4 rounded-xl items-center justify-center flex-row gap-2 shadow-sm`,
                                pressed && tw`bg-indigo-700`
                            ]}
                        >
                            <Text style={tw`text-white font-bold text-base`}>Start Shift</Text>
                            <ArrowRight size={18} color="white" />
                        </Pressable>
                    </View>

                </View>
            </View>
        </Modal>
    );
}
