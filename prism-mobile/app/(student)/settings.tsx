import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Alert, TextInput, ScrollView,
    TouchableOpacity, ActivityIndicator, Platform
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';
import { User, LogOut, Mail } from 'lucide-react-native';

export default function StudentSettingsScreen() {
    const { colors, mode, toggleTheme } = useTheme();
    const { profile, signOut, refreshProfile } = useAuth();
    const router = useRouter();

    const [editName, setEditName] = useState(profile?.full_name || '');
    const [editBio, setEditBio] = useState(profile?.bio || '');

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setEditName(profile.full_name || '');
            setEditBio(profile.bio || '');

        }
    }, [profile]);

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

    const saveProfile = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: editName,
                    bio: editBio,

                })
                .eq('id', profile!.id);

            if (error) throw error;
            await refreshProfile();
            Alert.alert('Готово', 'Профиль обновлён ✓');
        } catch (e: any) {
            Alert.alert('Ошибка', e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <Text style={[styles.title, { color: colors.text }]}>Настройки</Text>

                {/* Профиль */}
                <Card style={{ marginBottom: 16 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Профиль</Text>

                    {/* Профиль иконка */}
                    <View style={styles.avatarSection}>
                        <View style={[styles.avatarCircle, { backgroundColor: colors.accent + '20' }]}>
                            <User size={32} color={colors.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Профиль</Text>
                            <Text style={[styles.fieldHint, { color: colors.subtext }]}>
                                {profile?.email}
                            </Text>
                        </View>
                    </View>

                    {/* Имя */}
                    <Text style={[styles.fieldLabel, { color: colors.subtext, marginTop: 20 }]}>Имя</Text>
                    <TextInput
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="Ваше имя"
                        placeholderTextColor={colors.subtext + '80'}
                        style={[styles.input, {
                            color: colors.text,
                            backgroundColor: colors.inputBg,
                            borderColor: colors.border,
                        }]}
                    />

                    {/* О себе */}
                    <Text style={[styles.fieldLabel, { color: colors.subtext, marginTop: 20 }]}>О себе</Text>
                    <TextInput
                        value={editBio}
                        onChangeText={setEditBio}
                        placeholder="Расскажите немного о себе..."
                        placeholderTextColor={colors.subtext + '80'}
                        multiline
                        style={[styles.input, styles.bioInput, {
                            color: colors.text,
                            backgroundColor: colors.inputBg,
                            borderColor: colors.border,
                        }]}
                    />

                    {/* Email (readonly) */}
                    <Text style={[styles.fieldLabel, { color: colors.subtext, marginTop: 20 }]}>Email</Text>
                    <View style={[styles.emailRow, {
                        backgroundColor: colors.inputBg,
                        borderColor: colors.border,
                    }]}>
                        <Mail size={16} color={colors.subtext} />
                        <Text style={[styles.emailText, { color: colors.subtext }]}>
                            {profile?.email}
                        </Text>
                    </View>

                    {/* Сохранить */}
                    <TouchableOpacity
                        onPress={saveProfile}
                        disabled={saving}
                        style={[styles.saveBtn, { backgroundColor: colors.accent }]}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveBtnText}>Сохранить изменения</Text>
                        )}
                    </TouchableOpacity>
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
                    icon={<LogOut size={16} color="#ef4444" />}
                />
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, paddingTop: 16, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },

    // Avatar
    avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
    avatarCircle: {
        width: 64, height: 64, borderRadius: 32,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    avatarImage: { width: 64, height: 64, borderRadius: 32 },

    // Fields
    fieldLabel: {
        fontSize: 12, fontWeight: '700', textTransform: 'uppercase',
        letterSpacing: 1, marginBottom: 6,
    },
    fieldHint: { fontSize: 12, marginTop: 2 },
    input: {
        borderWidth: 1, borderRadius: 12, paddingHorizontal: 14,
        paddingVertical: 12, fontSize: 15,
    },
    bioInput: { minHeight: 80, textAlignVertical: 'top' },

    // Email
    emailRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1, borderRadius: 12, paddingHorizontal: 14,
        paddingVertical: 12, opacity: 0.7,
    },
    emailText: { fontSize: 15 },

    // Save
    saveBtn: {
        marginTop: 20, paddingVertical: 14, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    // Settings
    settingRow: { flexDirection: 'row', alignItems: 'center' },
    settingTitle: { fontSize: 16, fontWeight: '600' },
    settingDesc: { fontSize: 13, marginTop: 2 },
});
