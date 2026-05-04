import React from 'react';
import { useWindowDimensions } from 'react-native';
import InventoryScreenMobile from './InventoryScreenMobile';
import InventoryScreenTablet from './InventoryScreenTablet';

export default function InventoryScreen() {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    
    return isTablet ? <InventoryScreenTablet /> : <InventoryScreenMobile />;
}