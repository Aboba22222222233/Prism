import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { Home, BookOpen, Settings, MessageSquare, Heart } from 'lucide-react-native';

export default function StudentLayout() {
    const { colors } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopWidth: 0,
                    height: 85,
                    paddingBottom: 25,
                    paddingTop: 10,
                    elevation: 0,
                    shadowOpacity: 0,
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
                    title: 'Мои курсы',
                    tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Дашборд',
                    href: null,
                    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="checkin"
                options={{
                    title: 'Чекин',
                    href: null,
                }}
            />
            <Tabs.Screen
                name="resources"
                options={{
                    title: 'Ресурсы',
                    tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
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
