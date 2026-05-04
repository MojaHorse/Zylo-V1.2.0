import React from 'react';
import {
  View,
  Pressable,
  Text,
  Platform,
  LayoutAnimation,
  UIManager,
  useWindowDimensions,
} from 'react-native';
import {
  LayoutDashboard,
  Calculator,
  History,
  Package,
  Settings,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type SidebarTab =
  | 'Dashboard'
  | 'POS'
  | 'SalesHistory'
  | 'Inventory'
  | 'Settings';

type BottomNavProps = {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
};

const TABS = [
  { key: 'Dashboard' as SidebarTab, label: 'Home', Icon: LayoutDashboard },
  { key: 'POS' as SidebarTab, label: 'POS', Icon: Calculator },
  { key: 'SalesHistory' as SidebarTab, label: 'Sales', Icon: History },
  { key: 'Inventory' as SidebarTab, label: 'Stock', Icon: Package },
  { key: 'Settings' as SidebarTab, label: 'Settings', Icon: Settings },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isSmall = width < 360;
  const isLarge = width >= 430;

  const iconSize = isSmall ? 20 : 22;
  const labelSize = isSmall ? 13 : 14;

  // slightly shorter for a tighter iOS-like look
  const navHeight = isSmall ? 68 : 72;
  const maxWidth = isLarge ? 560 : 500;

  const handlePress = (tab: SidebarTab) => {
    if (tab === activeTab) return;

    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onTabChange(tab);
  };

  // Keep Android closer to the bottom instead of floating too high
  const bottomPadding =
    Platform.OS === 'ios'
      ? Math.max(insets.bottom, 8)
      : Math.max(insets.bottom, 10);

  return (
    <View
      pointerEvents="box-none"
      style={{
        width: '100%',
        paddingHorizontal: 16,
        paddingBottom: bottomPadding,
      }}
    >
      <View
        style={{
          alignSelf: 'center',
          width: '100%',
          maxWidth,
          height: navHeight,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          borderRadius: 999,
          paddingHorizontal: 8,

          // softer shadow so Android feels closer to iOS
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: Platform.OS === 'ios' ? 0.10 : 0.08,
          shadowRadius: 18,
          elevation: Platform.OS === 'android' ? 4 : 0,
        }}
      >
        {TABS.map(({ key, label, Icon }) => {
          const isActive = activeTab === key;

          return (
            <Pressable
              key={key}
              onPress={() => handlePress(key)}
              hitSlop={8}
              style={({ pressed }: { pressed: boolean }) => ({
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: navHeight - 18,
                  borderRadius: 999,
                  paddingHorizontal: isActive
                    ? isSmall
                      ? 14
                      : 18
                    : isSmall
                    ? 12
                    : 14,
                  backgroundColor: isActive ? '#EEF2FF' : 'transparent',
                }}
              >
                <Icon
                  size={iconSize}
                  color={isActive ? '#4F46E5' : '#94A3B8'}
                  strokeWidth={isActive ? 2.4 : 2}
                />

                {isActive && (
                  <Text
                    numberOfLines={1}
                    style={{
                      marginLeft: 8,
                      fontSize: labelSize,
                      fontWeight: '700',
                      color: '#4F46E5',
                      letterSpacing: 0.1,
                      flexShrink: 1,
                      includeFontPadding: false,
                    }}
                  >
                    {label}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}