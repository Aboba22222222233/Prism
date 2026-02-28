import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, FlatList, TextInput,
    StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Plus, Users, Copy, ChevronRight } from 'lucide-react-native';

export default function TeacherClassesScreen() {
    const { colors } = useTheme();
    const { profile } = useAuth();
    const router = useRouter();

    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [creating, setCreating] = useState(false);

    const fetchClasses = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('teacher_id', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setClasses(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchClasses();
    };

    const createClass = async () => {
        if (!newClassName.trim()) return;
        setCreating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const code = Math.random().toString(36).substring(2, 8).toUpperCase();

            const { data, error } = await supabase
                .from('classes')
                .insert({ name: newClassName.trim(), teacher_id: user.id, code })
                .select()
                .single();

            if (error) throw error;

            setClasses(prev => [...prev, data]);
            setNewClassName('');
            setShowCreate(false);
            Alert.alert('Готово', `Класс "${data.name}" создан!\nКод: ${code}`);
        } catch (err: any) {
            Alert.alert('Ошибка', err.message || 'Не удалось создать класс');
        } finally {
            setCreating(false);
        }
    };

    const copyCode = (code: string) => {
        Alert.alert('Код класса', code, [{ text: 'OK' }]);
    };

    if (loading) {
        return (
            <ScreenWrapper>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            {/* Заголовок */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.greeting, { color: colors.subtext }]}>Привет,</Text>
                    <Text style={[styles.name, { color: colors.text }]}>
                        {profile?.full_name || 'Учитель'} 👋
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => setShowCreate(!showCreate)}
                    style={[styles.addBtn, { backgroundColor: colors.accent }]}
                >
                    <Plus size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Форма создания класса */}
            {showCreate && (
                <Card style={{ marginHorizontal: 20, marginBottom: 16 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Новый класс</Text>
                    <Input
                        placeholder="Название (например, 9Б)"
                        value={newClassName}
                        onChangeText={setNewClassName}
                    />
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                        <Button
                            title="Отмена"
                            variant="secondary"
                            onPress={() => setShowCreate(false)}
                            style={{ flex: 1 }}
                        />
                        <Button
                            title="Создать"
                            variant="accent"
                            onPress={createClass}
                            loading={creating}
                            style={{ flex: 1 }}
                        />
                    </View>
                </Card>
            )}

            {/* Список классов */}
            {classes.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>Нет классов</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.subtext }]}>
                        Создайте свой первый класс,{'\n'}чтобы начать работу.
                    </Text>
                    <Button
                        title="Создать класс"
                        variant="accent"
                        onPress={() => setShowCreate(true)}
                        style={{ marginTop: 24 }}
                    />
                </View>
            ) : (
                <FlatList
                    data={classes}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 20, gap: 12 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => router.push(`/(teacher)/class/${item.id}`)}
                            activeOpacity={0.7}
                        >
                            <Card>
                                <View style={styles.classRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.className, { color: colors.text }]}>{item.name}</Text>
                                        <TouchableOpacity
                                            style={styles.codeRow}
                                            onPress={() => copyCode(item.code)}
                                        >
                                            <Text style={[styles.codeText, { color: colors.subtext }]}>
                                                Код: {item.code}
                                            </Text>
                                            <Copy size={12} color={colors.subtext} />
                                        </TouchableOpacity>
                                    </View>
                                    <ChevronRight size={20} color={colors.subtext} />
                                </View>
                            </Card>
                        </TouchableOpacity>
                    )}
                />
            )}
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    greeting: { fontSize: 14 },
    name: { fontSize: 26, fontWeight: '700' },
    addBtn: {
        width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
    },
    cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 14 },
    classRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    className: { fontSize: 18, fontWeight: '600' },
    codeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    codeText: { fontSize: 13 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
    emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
