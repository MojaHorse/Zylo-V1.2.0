import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/Context/AuthContext';
import { useBusiness } from '../components/Context/BusinessContext';

export default function DebugScreen() {
    const { user, session } = useAuth();
    const { business, selectedBusiness } = useBusiness();
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const log = (label: string, status: string, details: string = '') => {
        const color = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        setLogs(prev => [...prev, `${color} ${label}: ${status} ${details}`]);
    };

    const runTests = async () => {
        setLogs([]);
        setLoading(true);
        
        try {
            // ---------------------------------------------------------
            // TEST 1: REACT CONTEXT (The Frontend Memory)
            // ---------------------------------------------------------
            if (user) log('Auth Context', 'PASS', user.email || 'No Email');
            else log('Auth Context', 'FAIL', 'User object is null');

            if (selectedBusiness) log('Business Context', 'PASS', `${selectedBusiness.name} (ID: ${selectedBusiness.id})`);
            else log('Business Context', 'FAIL', 'No Business Selected in App State');

            const targetBizId = selectedBusiness?.id;

            if (!targetBizId) {
                log('STOPPING', 'FAIL', 'Cannot test DB without a Business ID');
                setLoading(false);
                return;
            }

            // ---------------------------------------------------------
            // TEST 2: SUPABASE CONNECTION (The Network)
            // ---------------------------------------------------------
            const { data: healthCheck, error: healthError } = await supabase.from('profiles').select('id').limit(1);
            if (healthError) log('DB Connection', 'FAIL', healthError.message);
            else log('DB Connection', 'PASS', 'Supabase is reachable');

            // ---------------------------------------------------------
            // TEST 3: MEMBERSHIP PERMISSIONS (The Gatekeeper)
            // ---------------------------------------------------------
            // Can the DB verify you work at this shop?
            const { data: memberData, error: memberError } = await supabase
                .from('business_members')
                .select('role')
                .eq('user_id', user?.id)
                .eq('business_id', targetBizId);
            
            if (memberError) {
                log('Membership Check', 'FAIL', `DB Error: ${memberError.code} - ${memberError.message}`);
                if (memberError.code === '42P17') log('--> DIAGNOSIS', 'CRITICAL', 'Infinite Recursion Loop Detected!');
                if (memberError.code === '42501') log('--> DIAGNOSIS', 'CRITICAL', 'Permission Denied (RLS)');
            } else if (memberData && memberData.length > 0) {
                log('Membership Check', 'PASS', `Found Role: ${memberData[0].role}`);
            } else {
                log('Membership Check', 'FAIL', '0 Rows returned. You are not in this business DB.');
            }

            // ---------------------------------------------------------
            // TEST 4: INVENTORY READ (The Final Block)
            // ---------------------------------------------------------
            // Try to read 1 item
            const { data: invData, error: invError } = await supabase
                .from('inventory_items')
                .select('id, name')
                .eq('business_id', targetBizId)
                .limit(1);

            if (invError) {
                log('Inventory Read', 'FAIL', `DB Error: ${invError.code} - ${invError.message}`);
                if (invError.code === '42P17') log('--> DIAGNOSIS', 'CRITICAL', 'Inventory Table Infinite Loop!');
            } else {
                log('Inventory Read', 'PASS', `Read Success. Rows: ${invData?.length}`);
            }

        } catch (e: any) {
            log('CRASH', 'FAIL', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={tw`flex-1 bg-black p-8 pt-20`}>
            <Text style={tw`text-white text-3xl font-bold mb-6`}>System Debugger</Text>
            
            <View style={tw`bg-[#111] p-4 rounded-xl border border-[#333] mb-6`}>
                <Text style={tw`text-gray-400 text-xs uppercase mb-2`}>Current State</Text>
                <Text style={tw`text-white`}>User ID: {user?.id || 'NULL'}</Text>
                <Text style={tw`text-white`}>Biz ID: {selectedBusiness?.id || 'NULL'}</Text>
            </View>

            <TouchableOpacity 
                onPress={runTests}
                style={tw`bg-[#84cc16] p-4 rounded-xl items-center mb-6`}
            >
                {loading ? <ActivityIndicator color="black" /> : <Text style={tw`text-black font-bold text-lg`}>RUN DIAGNOSTICS</Text>}
            </TouchableOpacity>

            <ScrollView style={tw`flex-1 bg-[#0a0a0a] p-4 rounded-xl border border-[#333]`}>
                {logs.map((l, i) => (
                    <Text key={i} style={tw`text-white font-mono mb-3 text-sm border-b border-[#222] pb-1`}>
                        {l}
                    </Text>
                ))}
            </ScrollView>
        </View>
    );
}