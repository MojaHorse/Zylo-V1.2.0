import React, { useEffect } from 'react';
import { View, Image, ActivityIndicator, Animated, Text } from 'react-native';
import tw from 'twrnc';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

export default function SplashScreen() {
    const navigation = useNavigation<any>();
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        // 1. Fade In Animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        // 2. Check Session & Navigate
        const checkSession = async () => {
            // Fake delay for "Branding" moment
            await new Promise(resolve => setTimeout(resolve, 2000));

            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                navigation.replace('POS'); // Go to Main App
            } else {
                // If first launch, go to Onboarding. If not, go to Login.
                // For now, we default to Onboarding for the demo.
                navigation.replace('Onboarding'); 
            }
        };

        checkSession();
    }, []);

    return (
        <View style={tw`flex-1 bg-black items-center justify-center`}>
            <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
                <Image 
                    source={require('../../assets/Full_Logo.png')} 
                    style={tw`w-64 h-64`} 
                    resizeMode="contain" 
                />
                <ActivityIndicator size="large" color="#84cc16" style={tw`mt-8`} />
            </Animated.View>
            
            {/* Version Number Footer */}
            <View style={tw`absolute bottom-10`}>
                <Text style={tw`text-[#4F3872] font-bold tracking-widest text-xs`}>
                    V 1.0.0 • POWERED BY Novus IQ
                </Text>
            </View>
        </View>
    );
}