import React from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import tw from 'twrnc';
import { Bell, X, AlertTriangle, Info } from 'lucide-react-native';
import { useNotificationContext, AppNotification } from '../Context/NotificationContext';
import * as Haptics from 'expo-haptics';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function NotificationPanel({ visible, onClose }: Props) {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationContext();

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            {/* Dark Overlay Background */}
            <Pressable style={tw`flex-1 bg-slate-900/40`} onPress={onClose}>
                
                {/* Popover Card (Spawns top-right under header) */}
                <Pressable 
                    onPress={e => e.stopPropagation()} 
                    style={tw`absolute top-20 right-8 w-96 max-h-[80%] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden`}
                >
                    {/* Header */}
                    <View style={tw`px-6 py-5 border-b border-slate-100 flex-row justify-between items-center bg-slate-50`}>
                        <View style={tw`flex-row items-center gap-2`}>
                            <Bell size={20} color="#0f172a" />
                            <Text style={tw`font-black text-lg text-slate-900 tracking-tight`}>Notifications</Text>
                            {unreadCount > 0 && (
                                <View style={tw`bg-red-100 px-2 py-0.5 rounded-full ml-1`}>
                                    <Text style={tw`text-red-700 font-bold text-[10px] tracking-wider uppercase`}>{unreadCount} New</Text>
                                </View>
                            )}
                        </View>
                        <Pressable 
                            onPress={() => { 
                                Haptics.impactAsync(); 
                                onClose(); 
                            }} 
                            style={({pressed}) => [
                                tw`p-2 rounded-full border border-slate-200 bg-white transition-all`,
                                pressed && tw`scale-95 bg-slate-100`
                            ]}
                        >
                            <X size={16} color="#64748b" />
                        </Pressable>
                    </View>

                    {/* Actions Bar */}
                    {unreadCount > 0 && (
                        <Pressable 
                            onPress={() => {
                                Haptics.selectionAsync();
                                markAllAsRead();
                            }}
                            style={({pressed}) => [
                                tw`px-6 py-3 border-b border-slate-100 bg-white flex-row justify-end transition-all`,
                                pressed && tw`bg-slate-50`
                            ]}
                        >
                            <Text style={tw`text-xs font-bold uppercase tracking-widest text-indigo-600`}>Mark all as read</Text>
                        </Pressable>
                    )}

                    {/* Notification List */}
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`p-2`}>
                        {notifications.length === 0 ? (
                            <View style={tw`py-16 items-center justify-center opacity-40`}>
                                <Bell size={48} color="#94a3b8" />
                                <Text style={tw`mt-4 text-sm font-bold tracking-widest uppercase text-slate-500`}>All caught up</Text>
                            </View>
                        ) : (
                            notifications.map((notif) => (
                                <NotificationItem 
                                    key={notif.id} 
                                    notif={notif} 
                                    onPress={() => {
                                        if (!notif.read) {
                                            Haptics.selectionAsync();
                                            markAsRead(notif.id);
                                        }
                                    }} 
                                />
                            ))
                        )}
                    </ScrollView>

                </Pressable>
            </Pressable>
        </Modal>
    );
}

function NotificationItem({ notif, onPress }: { notif: AppNotification, onPress: () => void }) {
    // Basic heuristic: if it says alert, warning, low, or sync, change the icon formatting
    const titleLower = notif.title.toLowerCase();
    const isAlert = titleLower.includes('alert') || titleLower.includes('low');
    
    const Icon = isAlert ? AlertTriangle : Info;
    const timeStr = new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <Pressable 
            onPress={onPress}
            style={({ pressed }) => [
                tw`p-4 rounded-2xl flex-row items-start gap-4 transition-all mb-1 border border-transparent`,
                !notif.read ? tw`bg-indigo-50/40 border-indigo-100` : tw`bg-white`,
                pressed && tw`bg-slate-50 border-slate-200`
            ]}
        >
            {/* Themed Icon */}
            <View style={tw`w-10 h-10 rounded-xl items-center justify-center ${isAlert ? 'bg-amber-100 border border-amber-200' : 'bg-indigo-100 border border-indigo-200'}`}>
                <Icon size={18} color={isAlert ? '#d97706' : '#4f46e5'} />
            </View>
            
            {/* Body */}
            <View style={tw`flex-1`}>
                <Text style={tw`text-sm font-bold text-slate-900 mb-1`} numberOfLines={1}>{notif.title}</Text>
                <Text style={tw`text-xs font-medium text-slate-600 leading-tight`} numberOfLines={3}>{notif.message}</Text>
                <Text style={tw`text-[10px] font-bold tracking-widest uppercase text-slate-400 mt-2`}>{timeStr}</Text>
            </View>
            
            {/* Unread Indicator Dot */}
            {!notif.read && (
                <View style={tw`w-2 h-2 rounded-full bg-red-500 mt-1 shadow-sm`} />
            )}
        </Pressable>
    )
}
