import React from 'react';
import { useWindowDimensions } from 'react-native';
import SalesHistoryMobile from './SalesHistoryMobile';
import SalesHistoryTablet from './SalesHistoryTablet';

export default function SalesHistoryScreen() {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    return isTablet ? <SalesHistoryTablet /> : <SalesHistoryMobile />;
}