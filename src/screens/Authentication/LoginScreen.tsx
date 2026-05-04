import React from 'react';
import { useWindowDimensions } from 'react-native';
import LoginScreenMobile from './LoginScreenMobile';
import LoginScreenTablet from './LoginScreenTablet';

export default function LoginScreen() {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    return isTablet ? <LoginScreenTablet /> : <LoginScreenMobile />;
}