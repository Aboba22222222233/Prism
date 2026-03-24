
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { House as Home, CalendarBlank as Calendar, Gear as Settings, FileText, User } from 'phosphor-react-native';
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
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => <Home color={color} size={24} weight={focused ? 'fill' : 'regular'} />,
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
                    title: 'Assignments',
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
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => <User color={color} size={24} weight={focused ? 'fill' : 'regular'} />,
                }}
            />
        </Tabs>
    );
}
