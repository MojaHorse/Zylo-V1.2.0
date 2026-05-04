import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Contexts
import { AuthProvider, useAuth } from './components/Context/AuthContext';
import { BusinessProvider, useBusiness } from './components/Context/BusinessContext';
import { CartProvider } from './components/Context/CartContext';
import { ThemeProvider, useTheme } from './components/Context/ThemeContext';
import { ToastProvider } from './components/Context/ToastContext';
import { NotificationProvider } from './components/Context/NotificationContext';

// Screens
import SplashScreenComponent from './src/Onboarding/SplashScreen';
import OnboardingScreen from './src/Onboarding/OnboardingScreen';
import AuthScreen from './src/screens/Authentication/AuthScreen';
import ForgotPasswordScreen from './src/screens/Authentication/ForgotPasswordScreen';
import VerifyCodeScreen from './src/screens/Authentication/VerifyCodeScreen';
import UpdatePasswordScreen from './src/screens/Authentication/UpdatePasswordScreen';
import CreateBusinessScreen from './src/screens/Authentication/CreateBusinessScreen';
import SelectBusinessScreen from './src/screens/Authentication/SelectBusinessScreen';
import LoginScreen from './src/screens/Authentication/LoginScreen';
import MainLayout from './src/screens/MainLayout';
import StartShiftScreen from './src/screens/POS/StartShiftScreen';
import CashUpScreen from './src/screens/POS/CashUpScreen';

// Sub Screens
import MenuScreen from './src/screens/MenuScreen';
import StaffScreen from './src/screens/StaffScreen';

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

function AppNavigation() {
  const { session, loading: authLoading, isPasswordReset } = useAuth(); // 👈 Get Flag
  const { businesses, selectedBusiness, loading: bizLoading } = useBusiness();
  const [isSplashAnimationDone, setSplashAnimationDone] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashAnimationDone(true);
      SplashScreen.hideAsync();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('hasSeenOnboarding').then(value => {
      setHasSeenOnboarding(value === 'true');
    });
  }, []);

  if (authLoading || bizLoading || !isSplashAnimationDone || hasSeenOnboarding === null) {
    return <SplashScreenComponent />;
  }

  // Show onboarding on first launch
  if (!hasSeenOnboarding) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Onboarding">
          {(props: any) => <OnboardingScreen {...props} onComplete={() => setHasSeenOnboarding(true)} />}
        </Stack.Screen>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
      </Stack.Navigator>
    );
  }

  // 1. Not Logged In
  if (!session) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
        {/* UpdatePassword removed from here, moved to step 2 */}
      </Stack.Navigator>
    );
  }

  // 2. 👇 Logged In BUT In Password Reset Mode (Intercepts the user)
  if (isPasswordReset) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="UpdatePassword" component={UpdatePasswordScreen} />
      </Stack.Navigator>
    );
  }

  // 3. Logged In, But No Business
  if (!businesses || businesses.length === 0) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="CreateBusiness" component={CreateBusinessScreen} />
        <Stack.Screen name="StaffSetup" component={StaffScreen} />
      </Stack.Navigator>
    );
  }

  // 4. Business Not Selected
  if (!selectedBusiness) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="SelectBusiness" component={SelectBusinessScreen} />
        <Stack.Screen name="CreateBusiness" component={CreateBusinessScreen} />
        <Stack.Screen name="StaffSetup" component={StaffScreen} />
      </Stack.Navigator>
    );
  }

  // 5. Main App
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="StartShift" component={StartShiftScreen} />
      <Stack.Screen name="Main" component={MainLayout} />

      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="Staff" component={StaffScreen} />
        <Stack.Screen name="CashUp" component={CashUpScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { theme, colors, resolvedTheme } = useTheme();

  // Construct React Navigation Theme
  const MyTheme = {
    dark: resolvedTheme === 'dark',
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '900' },
    }
  };

  return (
    <AuthProvider>
      <BusinessProvider>
        <CartProvider>
          <NotificationProvider>
            <ToastProvider>
              <NavigationContainer theme={MyTheme as any}>
                <AppNavigation />
                <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
              </NavigationContainer>
            </ToastProvider>
          </NotificationProvider>
        </CartProvider>
      </BusinessProvider>
    </AuthProvider>
  );
}