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
        // Ждём пока загрузится всё: сессия И профиль
        if (loading) return;

        if (!session) {
            router.replace('/login');
            return;
        }

        // Если сессия есть, но профиль ещё не загрузился — ждём
        if (!profile) {
            // Даём время на загрузку профиля, потом отправляем на логин
            const timeout = setTimeout(() => {
                router.replace('/login');
            }, 3000);
            return () => clearTimeout(timeout);
        }

        // Профиль загружен — роутим по роли
        console.log('Роль пользователя:', profile.role);
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
