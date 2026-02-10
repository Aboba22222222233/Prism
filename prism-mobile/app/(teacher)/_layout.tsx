import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { Home, BookOpen, Settings } from 'lucide-react-native';

export default function TeacherLayout() {
    const { colors } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    paddingTop: 6,
                    paddingBottom: 2,
                    height: 52,
                },
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.subtext,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="classes"
                options={{
                    title: 'Классы',
                    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="class/[id]"
                options={{
                    title: 'Класс',
                    href: null,
                    tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Настройки',
                    tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
