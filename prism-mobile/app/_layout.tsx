import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { AuthProvider } from '../src/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useNotifications } from '../src/lib/useNotifications';

function RootLayoutInner() {
    const { mode, colors } = useTheme();
    useNotifications();

    return (
        <>
            <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                    animation: 'fade',
                }}
            />
        </>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AuthProvider>
                    <RootLayoutInner />
                </AuthProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
