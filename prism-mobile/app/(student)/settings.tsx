import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TextInput } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';
import { User, LogOut } from 'lucide-react-native';

export default function StudentSettingsScreen() {
    const { colors, mode, toggleTheme } = useTheme();
    const { profile, signOut, refreshProfile } = useAuth();
    const router = useRouter();

    const [editName, setEditName] = useState(profile?.full_name || '');
    const [saving, setSaving] = useState(false);

    const handleLogout = () => {
        Alert.alert('Выход', 'Вы уверены?', [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Выйти', style: 'destructive', onPress: async () => {
                    await signOut();
                    router.replace('/login');
                },
            },
        ]);
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: editName })
                .eq('id', profile!.id);

            if (error) throw error;
            await refreshProfile();
            Alert.alert('Готово', 'Профиль обновлён');
        } catch (e: any) {
            Alert.alert('Ошибка', e.message);
        } finally {
            setSaving(false);
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
                            <TextInput
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Ваше имя"
                                placeholderTextColor={colors.subtext}
                                style={[styles.nameInput, { color: colors.text, borderColor: colors.border }]}
                            />
                            <Text style={[styles.email, { color: colors.subtext }]}>{profile?.email}</Text>
                        </View>
                    </View>
                    <Button
                        title="Сохранить"
                        variant="accent"
                        onPress={saveProfile}
                        loading={saving}
                        style={{ marginTop: 14 }}
                        textStyle={{ fontSize: 14 }}
                    />
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
    nameInput: {
        fontSize: 17, fontWeight: '600',
        borderBottomWidth: 1, paddingVertical: 4,
    },
    email: { fontSize: 13, marginTop: 4 },
    settingRow: { flexDirection: 'row', alignItems: 'center' },
    settingTitle: { fontSize: 16, fontWeight: '600' },
    settingDesc: { fontSize: 13, marginTop: 2 },
});
