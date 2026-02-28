
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { Home, Calendar, Settings, FileText, User } from 'lucide-react-native';
import { View } from 'react-native';

export default function TeacherLayout() {
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
                    shadowOpacity: 0
                },
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.subtext,
            }}
        >
            <Tabs.Screen
                name="classes"
                options={{
                    title: 'Главная',
                    tabBarIcon: ({ color }) => <Home color={color} size={24} />,
                }}
            />
            {/* Hidden screens / Internal routing */}
            <Tabs.Screen
                name="index"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="assignments"
                options={{
                    title: 'Задания',
                    href: null, // Hidden from tab bar
                }}
            />
            <Tabs.Screen
                name="class/[id]"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="student/[id]"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    href: null,
                }}
            />

            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Профиль',
                    tabBarIcon: ({ color }) => <User color={color} size={24} />,
                }}
            />
        </Tabs>
    );
}
