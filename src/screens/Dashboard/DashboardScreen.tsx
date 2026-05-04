import React from 'react';
import { useWindowDimensions } from 'react-native';
import DashboardScreenMobile from './DashboardScreenMobile';
import DashboardScreenTablet from './DashboardScreenTablet';

export default function DashboardScreen() {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    return isTablet ? <DashboardScreenTablet /> : <DashboardScreenMobile />;
}