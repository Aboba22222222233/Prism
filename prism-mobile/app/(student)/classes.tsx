import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, FlatList, StyleSheet,
    Alert, ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { BookOpen, Plus, LogOut, ChevronRight } from 'lucide-react-native';

export default function StudentClassesScreen() {
    const { colors } = useTheme();
    const { profile, user } = useAuth();
    const router = useRouter();

    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [classCode, setClassCode] = useState('');
    const [joinError, setJoinError] = useState<string | null>(null);

    const fetchClasses = useCallback(async () => {
        try {
            if (!user) return;

            const { data: enrollments } = await supabase
                .from('class_enrollments')
                .select('class_id, classes(*)')
                .eq('user_id', user.id);

            if (enrollments && enrollments.length > 0) {
                setClasses(enrollments.map((e: any) => e.classes));
            } else {
                setClasses([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchClasses();
    };

    const joinClass = async () => {
        setJoinError(null);
        try {
            if (!user) throw new Error('Не авторизован');

            const { data: foundClass, error: findError } = await supabase
                .from('classes')
                .select('*')
                .eq('code', classCode.trim().toUpperCase())
                .single();

            if (findError || !foundClass) throw new Error('Класс с таким кодом не найден');

            if (classes.find(c => c.id === foundClass.id)) {
                Alert.alert('Внимание', 'Вы уже состоите в этом классе');
                setShowJoin(false);
                return;
            }

            const { error: enrollError } = await supabase
                .from('class_enrollments')
                .insert({ user_id: user.id, class_id: foundClass.id });

            if (enrollError) throw enrollError;

            Alert.alert('Готово', `Вы присоединились к классу "${foundClass.name}"!`);
            setClasses(prev => [...prev, foundClass]);
            setShowJoin(false);
            setClassCode('');
        } catch (err: any) {
            setJoinError(err.message);
        }
    };

    const leaveClass = (classId: string, className: string) => {
        Alert.alert('Покинуть курс?', `Вы выйдете из "${className}".`, [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Покинуть', style: 'destructive', onPress: async () => {
                    try {
                        await supabase.from('class_enrollments')
                            .delete().eq('user_id', user!.id).eq('class_id', classId);
                        setClasses(prev => prev.filter(c => c.id !== classId));
                    } catch (err) {
                        Alert.alert('Ошибка', 'Не удалось покинуть курс');
                    }
                },
            },
        ]);
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
                        {profile?.full_name || 'Ученик'} 👋
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => setShowJoin(true)}
                    style={[styles.addBtn, { backgroundColor: colors.accent }]}
                >
                    <Plus size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Список классов */}
            {classes.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <BookOpen size={48} color={colors.subtext} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>Здесь пока пусто</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.subtext }]}>
                        Присоединитесь к классу,{'\n'}чтобы начать обучение.
                    </Text>
                    <Button
                        title="Присоединиться к курсу"
                        variant="accent"
                        onPress={() => setShowJoin(true)}
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
                            onPress={() => router.push({ pathname: '/(student)/dashboard', params: { classId: item.id, className: item.name } })}
                            activeOpacity={0.7}
                        >
                            <Card>
                                <View style={styles.classRow}>
                                    <View style={[styles.classIcon, { backgroundColor: colors.accent + '20' }]}>
                                        <BookOpen size={20} color={colors.accent} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.className, { color: colors.text }]}>{item.name}</Text>
                                        <Text style={[styles.classCode, { color: colors.subtext }]}>Код: {item.code}</Text>
                                    </View>
                                    <ChevronRight size={18} color={colors.subtext} />
                                </View>
                                <TouchableOpacity
                                    onPress={() => leaveClass(item.id, item.name)}
                                    style={styles.leaveBtn}
                                >
                                    <LogOut size={12} color={colors.subtext} />
                                    <Text style={[styles.leaveText, { color: colors.subtext }]}>Покинуть</Text>
                                </TouchableOpacity>
                            </Card>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Модалка "Присоединиться" */}
            <Modal visible={showJoin} transparent animationType="fade">
                <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
                    <Card style={styles.modalCard}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Присоединиться к курсу</Text>
                        <Text style={[styles.modalDesc, { color: colors.subtext }]}>
                            Попросите код курса у учителя.
                        </Text>
                        <Input
                            placeholder="Код курса"
                            value={classCode}
                            onChangeText={setClassCode}
                            autoCapitalize="characters"
                            autoFocus
                            error={joinError || undefined}
                        />
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                            <Button
                                title="Отмена"
                                variant="secondary"
                                onPress={() => { setShowJoin(false); setJoinError(null); }}
                                style={{ flex: 1 }}
                            />
                            <Button
                                title="Войти"
                                variant="accent"
                                onPress={joinClass}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </Card>
                </View>
            </Modal>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    },
    greeting: { fontSize: 14 },
    name: { fontSize: 26, fontWeight: '700' },
    addBtn: {
        width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
    },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyTitle: { fontSize: 24, fontWeight: '700', marginTop: 16, marginBottom: 8 },
    emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
    classRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    classIcon: {
        width: 42, height: 42, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    className: { fontSize: 17, fontWeight: '600' },
    classCode: { fontSize: 12, marginTop: 2 },
    leaveBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)',
    },
    leaveText: { fontSize: 12 },
    modalOverlay: {
        flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24,
    },
    modalCard: { width: '100%', maxWidth: 400 },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
    modalDesc: { fontSize: 14, marginBottom: 16 },
});
