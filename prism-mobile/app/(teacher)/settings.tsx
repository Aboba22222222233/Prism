import React from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useRouter } from 'expo-router';
import { Moon, Sun, SignOut as LogOut, User } from 'phosphor-react-native';

export default function TeacherSettingsScreen() {
    const { colors, mode, toggleTheme } = useTheme();
    const { profile, signOut } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm('Are you sure you want to sign out?');
            if (confirmed) {
                await signOut();
                router.replace('/login');
            }
        } else {
            Alert.alert('Sign Out', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out', style: 'destructive', onPress: async () => {
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
                <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

                {/* Profile */}
                <Card style={{ marginBottom: 16 }}>
                    <View style={styles.profileRow}>
                        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                            <User size={24} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.profileName, { color: colors.text }]}>
                                {(!profile?.full_name || profile.full_name === 'Teacher') ? 'Psychologist' : profile.full_name}
                            </Text>
                            <Text style={[styles.profileEmail, { color: colors.subtext }]}>
                                {profile?.email}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Theme */}
                <Card style={{ marginBottom: 16 }}>
                    <View style={styles.settingRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.settingTitle, { color: colors.text }]}>Theme</Text>
                            <Text style={[styles.settingDesc, { color: colors.subtext }]}>
                                {mode === 'dark' ? 'Dark theme' : 'Light theme'}
                            </Text>
                        </View>
                        <Button
                            title={mode === 'dark' ? 'вЂпёЏ Light' : 'рџЊ™ Dark'}
                            variant="secondary"
                            onPress={toggleTheme}
                            style={{ paddingVertical: 10, paddingHorizontal: 16 }}
                            textStyle={{ fontSize: 13 }}
                        />
                    </View>
                </Card>

                {/* Sign out */}
                <Button
                    title="Sign Out"
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
