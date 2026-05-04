import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark' | 'system';

export type ThemeColors = {
    background: string;
    surface: string;
    surfaceHighlight: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    activeTab: string;
    inactiveTab: string;
    danger: string;
    dangerSurface: string;
};

const lightColors: ThemeColors = {
    background: '#f3f4f6', // gray-100
    surface: '#ffffff',
    surfaceHighlight: '#e5e7eb', // gray-200
    text: '#111827', // gray-900
    textSecondary: '#6b7280', // gray-500
    border: '#e5e7eb', // gray-200
    primary: '#84cc16', // lime-500
    activeTab: '#84cc16',
    inactiveTab: '#6b7280',
    danger: '#ef4444',
    dangerSurface: '#fee2e2',
};

const darkColors: ThemeColors = {
    background: '#000000',
    surface: '#111111', // zinc-900? #111
    surfaceHighlight: '#1a1a1a',
    text: '#ffffff',
    textSecondary: '#9ca3af', // gray-400
    border: '#333333',
    primary: '#84cc16',
    activeTab: '#84cc16',
    inactiveTab: '#ffffff',
    danger: '#ef4444',
    dangerSurface: '#2a1515',
};

type ThemeContextType = {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
    colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = useColorScheme();
    const [theme, setThemeState] = useState<Theme>('system');
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('zylo_theme');
            if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
                setThemeState(savedTheme as Theme);
            }
        } catch (e) {
            console.error('Failed to load theme settings', e);
        } finally {
            setLoaded(true);
        }
    };

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem('zylo_theme', newTheme);
        } catch (e) {
            console.error('Failed to save theme', e);
        }
    };

    const toggleTheme = () => {
        if (theme === 'system') setTheme('light');
        else if (theme === 'light') setTheme('dark');
        else setTheme('system');
    };

    // Resolve the actual theme to display
    const resolvedTheme = theme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : theme;
    const colors = resolvedTheme === 'dark' ? darkColors : lightColors;

    if (!loaded) return null;

    return (
        <ThemeContext.Provider value={{
            theme,
            resolvedTheme,
            setTheme,
            toggleTheme,
            colors
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
