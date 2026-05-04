import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

// Contexts
import { AuthProvider, useAuth } from './components/Context/AuthContext';
import { BusinessProvider, useBusiness } from './components/Context/BusinessContext';
import { CartProvider } from './components/Context/CartContext';

// Screens
import SplashScreenComponent from './screens/Onboarding/SplashScreen';
import AuthScreen from './screens/Authentication/AuthScreen';
import CreateBusinessScreen from './screens/Authentication/CreateBusinessScreen';
import SelectBusinessScreen from './screens/Authentication/SelectBusinessScreen';
import LoginScreen from './screens/Authentication/LoginScreen';
import MainLayout from './screens/MainLayout';

// Sub Screens
import MenuScreen from './screens/MenuScreen';
import StaffScreen from './screens/StaffScreen';
import CashUpScreen from './screens/CashUpScreen';

// 🛠️ DEBUG SCREEN IMPORT
import DebugScreen from './screens/DebugScreen'; 

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

function AppNavigation() {
  const { session, loading: authLoading } = useAuth();
  const { businesses, selectedBusiness, loading: bizLoading } = useBusiness();
  const [isSplashAnimationDone, setSplashAnimationDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashAnimationDone(true);
      SplashScreen.hideAsync();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 🔴 DEBUG OVERRIDE: 
  // This forces the app to show the Debugger immediately.
  // Once you fix the database errors, delete this line!
  return <DebugScreen />;

  // ---------------------------------------------------------
  // NORMAL APP LOGIC (Currently Disabled/Unreachable)
  // ---------------------------------------------------------

  // 1. LOADING STATE
  /* if (authLoading || bizLoading || !isSplashAnimationDone) {
    return <SplashScreenComponent />;
  }

  // 2. CHECK: Logged In?
  if (!session) {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
    );
  }

  // 3. CHECK: Has ANY Business?
  if (!businesses || businesses.length === 0) {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="CreateBusiness" component={CreateBusinessScreen} />
            <Stack.Screen name="StaffSetup" component={StaffScreen} />
        </Stack.Navigator>
    );
  }

  // 4. CHECK: Business Selected?
  if (!selectedBusiness) {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
             <Stack.Screen name="SelectBusiness" component={SelectBusinessScreen} />
             <Stack.Screen name="CreateBusiness" component={CreateBusinessScreen} />
             <Stack.Screen name="StaffSetup" component={StaffScreen} />
        </Stack.Navigator>
    );
  }

  // 5. MAIN APP (Business is Selected)
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainLayout} />
      
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="Staff" component={StaffScreen} />
        <Stack.Screen name="CashUp" component={CashUpScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
  */
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BusinessProvider>
          <CartProvider>
            <NavigationContainer>
              <AppNavigation />
              <StatusBar style="light" />
            </NavigationContainer>
          </CartProvider>
        </BusinessProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}