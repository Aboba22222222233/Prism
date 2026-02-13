import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, ThemeColors, ThemeMode } from '../constants/Colors';

interface ThemeContextType {
    mode: ThemeMode;
    colors: ThemeColors;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    mode: 'dark',
    colors: Colors.dark,
    toggleTheme: () => { },
});

const THEME_KEY = '@prism_theme';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [mode, setMode] = useState<ThemeMode>('dark');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        setMode('dark'); // Force dark mode
    };

    const toggleTheme = async () => {
        const next = mode === 'dark' ? 'light' : 'dark';
        setMode(next);
        try {
            await AsyncStorage.setItem(THEME_KEY, next);
        } catch { }
    };

    const colors = Colors[mode];

    return (
        <ThemeContext.Provider value={{ mode, colors, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
