import React from 'react';
import { View, Pressable, Image } from 'react-native';
import { LayoutDashboard, Calculator, History, Package, Settings, LogOut, Store } from 'lucide-react-native';
import tw from 'twrnc';
import { useAuth } from './Context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

export type SidebarTab = 'Dashboard' | 'POS' | 'SalesHistory' | 'Inventory' | 'Settings';

type SidebarProps = {
    activeTab: SidebarTab;
    onTabChange: (tab: SidebarTab) => void;
};

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    const navigation = useNavigation<any>();

    const handlePress = (tab: SidebarTab) => {
        if (activeTab !== tab) {
            Haptics.selectionAsync();
            onTabChange(tab);
        }
    };

    const SidebarItem = ({ tab, Icon }: { tab: SidebarTab; Icon: any }) => {
        const isActive = activeTab === tab;
        return (
            <Pressable
                onPress={() => handlePress(tab)}
                style={({ pressed }) => [
                    tw`items-center justify-center w-14 h-14 rounded-2xl mb-4 transition-all`,
                    isActive ? tw`bg-indigo-50` : tw`bg-transparent`,
                    pressed && tw`bg-slate-50 scale-95`
                ]}
            >
                <Icon
                    size={24}
                    color={isActive ? '#4338ca' : '#94a3b8'} // indigo-700 / slate-400
                    strokeWidth={isActive ? 2.5 : 2}
                />
            </Pressable>
        );
    };

    return (
        <View style={tw`w-24 h-full py-8 items-center justify-between border-r border-slate-200 bg-white`}>
            {/* Top Section */}
            <View style={tw`items-center`}>
                <View style={tw`w-14 h-14 rounded-2xl items-center justify-center mb-10 border border-slate-200 bg-white shadow-sm`}>
                    <Image
                        source={require('../assets/icon.png')}
                        style={tw`w-10 h-10`}
                        resizeMode="contain"
                    />
                </View>

                <SidebarItem tab="Dashboard" Icon={LayoutDashboard} />
                <SidebarItem tab="POS" Icon={Calculator} />
                <SidebarItem tab="SalesHistory" Icon={History} />
                <SidebarItem tab="Inventory" Icon={Package} />
            </View>

            {/* Bottom Section */}
            <View style={tw`items-center gap-2`}>
                <SidebarItem tab="Settings" Icon={Settings} />

                {/* 👇 End Shift Button */}
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync();
                        navigation.navigate('CashUp');
                    }}
                    style={({ pressed }) => [
                        tw`items-center justify-center w-14 h-14 rounded-2xl mt-2 border border-red-100 bg-red-50 transition-all`,
                        pressed && tw`scale-95 bg-red-100`
                    ]}
                >
                    <LogOut size={20} color="#ef4444" />
                </Pressable>
            </View>
        </View>
    );
}