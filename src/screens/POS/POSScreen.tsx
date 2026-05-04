import React from 'react';
import { useWindowDimensions } from 'react-native';
import POSScreenMobile from './POSScreenMobile';
import POSScreenTablet from './POSScreenTablet';

export default function POSScreen() {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    return isTablet ? <POSScreenTablet /> : <POSScreenMobile />;
}