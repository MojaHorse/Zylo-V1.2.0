import React from 'react';
import { View, Text, Pressable } from 'react-native';
import tw from 'twrnc';
import { Bell } from 'lucide-react-native';
import { useAuth } from '../components/Context/AuthContext';
import * as Haptics from 'expo-haptics';
import { useNotificationContext } from './Context/NotificationContext';
import NotificationPanel from './Modals/NotificationPanel';

interface HeaderProps {
    title: string;
    subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
    const { user } = useAuth();
    const { unreadCount } = useNotificationContext();
    const [panelVisible, setPanelVisible] = React.useState(false);

    const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <View style={tw`flex-row justify-between items-center mb-6`}>
            {/* Left: Title & Subtitle */}
            <View>
                <Text style={tw`text-3xl font-bold tracking-tight text-slate-900`}>{title}</Text>
                <Text style={tw`text-sm mt-1 font-medium text-slate-500`}>{subtitle || dateStr}</Text>
            </View>

            {/* Right: Status & Profile */}
            <View style={tw`flex-row items-center gap-4`}>
                {/* Status Pill */}
                <View style={tw`flex-row items-center px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100`}>
                    <View style={tw`w-2 h-2 rounded-full mr-2 bg-emerald-500`} />
                    <Text style={tw`text-xs font-bold uppercase tracking-wider text-emerald-700`}>Online</Text>
                </View>

                {/* Notifications */}
                <View style={tw`relative`}>
                    <Pressable 
                        onPress={() => {
                            Haptics.selectionAsync();
                            setPanelVisible(true);
                        }}
                        style={({ pressed }) => [
                            tw`w-10 h-10 rounded-full items-center justify-center border border-slate-200 bg-white shadow-sm transition-all`,
                            pressed && tw`bg-slate-50 scale-95`
                        ]}
                    >
                        <Bell size={18} color="#64748b" />
                        
                        {/* Unread Badge Overlay */}
                        {unreadCount > 0 && (
                            <View style={tw`absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white items-center justify-center`} />
                        )}
                    </Pressable>
                </View>

                {/* Profile Circle */}
                <View style={tw`w-10 h-10 rounded-full items-center justify-center bg-indigo-100 border border-indigo-200`}>
                    <Text style={tw`font-bold text-indigo-700`}>
                        {user?.user_metadata?.full_name ? user.user_metadata.full_name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'U')}
                    </Text>
                </View>
            </View>

            {/* Render the Slide-out Notification Dropdown */}
            <NotificationPanel visible={panelVisible} onClose={() => setPanelVisible(false)} />
        </View>
    );
}