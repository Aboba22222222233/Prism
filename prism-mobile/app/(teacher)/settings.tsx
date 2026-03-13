import React from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useRouter } from 'expo-router';
import { Moon, Sun, LogOut, User } from 'lucide-react-native';

export default function TeacherSettingsScreen() {
    const { colors, mode, toggleTheme } = useTheme();
    const { profile, signOut } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm('Вы уверены, что хотите выйти?');
            if (confirmed) {
                await signOut();
                router.replace('/login');
            }
        } else {
            Alert.alert('Выход', 'Вы уверены?', [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Выйти', style: 'destructive', onPress: async () => {
                        await signOut();
                        router.replace('/login');
                    },
                },
            ]);
        }
    };

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <Text style={[styles.title, { color: colors.text }]}>Настройки</Text>

                {/* Профиль */}
                <Card style={{ marginBottom: 16 }}>
                    <View style={styles.profileRow}>
                        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                            <User size={24} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.profileName, { color: colors.text }]}>
                                {(!profile?.full_name || profile.full_name === 'Учитель') ? 'Психолог' : profile.full_name}
                            </Text>
                            <Text style={[styles.profileEmail, { color: colors.subtext }]}>
                                {profile?.email}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Тема */}
                <Card style={{ marginBottom: 16 }}>
                    <View style={styles.settingRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.settingTitle, { color: colors.text }]}>Тема</Text>
                            <Text style={[styles.settingDesc, { color: colors.subtext }]}>
                                {mode === 'dark' ? 'Тёмная тема' : 'Светлая тема'}
                            </Text>
                        </View>
                        <Button
                            title={mode === 'dark' ? '☀️ Светлая' : '🌙 Тёмная'}
                            variant="secondary"
                            onPress={toggleTheme}
                            style={{ paddingVertical: 10, paddingHorizontal: 16 }}
                            textStyle={{ fontSize: 13 }}
                        />
                    </View>
                </Card>

                {/* Выход */}
                <Button
                    title="Выйти из аккаунта"
                    variant="danger"
                    onPress={handleLogout}
                    icon={<LogOut size={16} color="rgb(239,68,68)" />}
                />
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, paddingTop: 16 },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
    profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatar: {
        width: 48, height: 48, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
    },
    profileName: { fontSize: 17, fontWeight: '600' },
    profileEmail: { fontSize: 13, marginTop: 2 },
    settingRow: { flexDirection: 'row', alignItems: 'center' },
    settingTitle: { fontSize: 16, fontWeight: '600' },
    settingDesc: { fontSize: 13, marginTop: 2 },
});
