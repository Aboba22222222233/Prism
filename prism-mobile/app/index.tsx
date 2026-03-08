import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';

export default function Index() {
    const { session, profile, loading } = useAuth();
    const { colors } = useTheme();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (!session) {
            router.replace('/login');
            return;
        }

        if (!profile) {
            const timeout = setTimeout(() => {
                router.replace('/login');
            }, 3000);
            return () => clearTimeout(timeout);
        }

        if (profile.role === 'teacher') {
            router.replace('/(teacher)/classes');
        } else {
            router.replace('/(student)/classes');
        }
    }, [session, profile, loading]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={{ color: colors.subtext, marginTop: 16, fontSize: 14 }}>Загрузка...</Text>
        </View>
    );
}
