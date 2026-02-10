import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useTheme } from '../../../src/context/ThemeContext';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { ArrowLeft, Users, TrendingUp, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react-native';

export default function ClassDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colors } = useTheme();
    const router = useRouter();

    const [classInfo, setClassInfo] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [stats, setStats] = useState({ avgMood: 0, riskCount: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [isAnonymous, setIsAnonymous] = useState(true);

    useEffect(() => {
        if (id) fetchClassData();
    }, [id]);

    const fetchClassData = async () => {
        try {
            // Получаем класс
            const { data: cls } = await supabase
                .from('classes').select('*').eq('id', id).single();
            setClassInfo(cls);

            // Получаем учеников
            const { data: enrollments } = await supabase
                .from('class_enrollments')
                .select('user_id, profiles!inner(id, full_name, email, avatar_url)')
                .eq('class_id', id);

            // Получаем чекины
            const { data: checkins } = await supabase
                .from('checkins')
                .select('*')
                .eq('class_id', id)
                .order('created_at', { ascending: true });

            const processed = (enrollments || []).map((e: any, i: number) => {
                const studentCheckins = checkins?.filter(c => c.user_id === e.user_id) || [];
                const last = studentCheckins.length > 0 ? studentCheckins[studentCheckins.length - 1] : null;
                const avg = studentCheckins.length > 0
                    ? (studentCheckins.reduce((s, c) => s + c.mood_score, 0) / studentCheckins.length).toFixed(1)
                    : '-';

                const recent = studentCheckins.slice(-3).map((c: any) => c.mood_score);
                const isTrendDrop = recent.length === 3 && recent[0] > recent[1] && recent[1] > recent[2];
                const isCritical = last && (last.mood_score <= 2 || last.stress_score >= 8);
                const isRisk = isCritical || isTrendDrop;

                return {
                    id: e.profiles.id,
                    realName: e.profiles.full_name || e.profiles.email?.split('@')[0],
                    anonName: `Ученик ${i + 1}`,
                    email: e.profiles.email,
                    avgMood: avg,
                    isRisk,
                    lastMood: last?.mood_score ?? null,
                    checkinCount: studentCheckins.length,
                };
            });

            setStudents(processed);

            const total = processed.length;
            const riskCount = processed.filter(s => s.isRisk).length;
            const totalMood = checkins?.reduce((s, c) => s + c.mood_score, 0) || 0;
            const avgMood = checkins?.length ? +(totalMood / checkins.length).toFixed(1) : 0;

            setStats({ avgMood, riskCount, total });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const removeStudent = async (studentId: string) => {
        Alert.alert('Удалить ученика?', 'Ученик будет удалён из класса.', [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Удалить', style: 'destructive', onPress: async () => {
                    try {
                        await supabase.from('class_enrollments')
                            .delete().eq('user_id', studentId).eq('class_id', id);
                        setStudents(prev => prev.filter(s => s.id !== studentId));
                    } catch (e) {
                        Alert.alert('Ошибка', 'Не удалось удалить ученика');
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
            {/* Хеадер */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.className, { color: colors.text }]}>{classInfo?.name}</Text>
                    <Text style={[styles.code, { color: colors.subtext }]}>Код: {classInfo?.code}</Text>
                </View>
                <TouchableOpacity onPress={() => setIsAnonymous(!isAnonymous)}>
                    <Text style={[styles.toggleAnon, { color: colors.accent }]}>
                        {isAnonymous ? 'Показать имена' : 'Скрыть имена'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Статы */}
            <View style={styles.statsRow}>
                <Card style={styles.statCard}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
                    <Text style={[styles.statLabel, { color: colors.subtext }]}>Учеников</Text>
                </Card>
                <Card style={styles.statCard}>
                    <Text style={[styles.statValue, { color: stats.avgMood >= 3 ? 'rgb(34,197,94)' : 'rgb(239,68,68)' }]}>
                        {stats.avgMood}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.subtext }]}>Среднее</Text>
                </Card>
                <Card style={styles.statCard}>
                    <Text style={[styles.statValue, { color: stats.riskCount > 0 ? 'rgb(239,68,68)' : 'rgb(34,197,94)' }]}>
                        {stats.riskCount}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.subtext }]}>В риске</Text>
                </Card>
            </View>

            {/* Список учеников */}
            <FlatList
                data={students}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 20, gap: 10 }}
                ListEmptyComponent={
                    <View style={styles.emptySection}>
                        <Users size={40} color={colors.subtext} />
                        <Text style={[styles.emptyText, { color: colors.subtext }]}>
                            Пока нет учеников в этом классе
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <Card>
                        <View style={styles.studentRow}>
                            <View style={[
                                styles.moodDot,
                                { backgroundColor: item.isRisk ? 'rgb(239,68,68)' : 'rgb(34,197,94)' },
                            ]} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.studentName, { color: colors.text }]}>
                                    {isAnonymous ? item.anonName : item.realName}
                                </Text>
                                <Text style={[styles.studentSub, { color: colors.subtext }]}>
                                    Среднее: {item.avgMood} • Записей: {item.checkinCount}
                                </Text>
                            </View>
                            {item.isRisk && <AlertTriangle size={18} color="rgb(239,68,68)" />}
                            {!item.isRisk && <CheckCircle size={18} color="rgb(34,197,94)" />}
                            <TouchableOpacity onPress={() => removeStudent(item.id)} style={{ marginLeft: 8 }}>
                                <Trash2 size={16} color={colors.subtext} />
                            </TouchableOpacity>
                        </View>
                    </Card>
                )}
            />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
    },
    backBtn: { padding: 8 },
    className: { fontSize: 22, fontWeight: '700' },
    code: { fontSize: 13, marginTop: 2 },
    toggleAnon: { fontSize: 12, fontWeight: '600' },
    statsRow: {
        flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 8,
    },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: 14 },
    statValue: { fontSize: 24, fontWeight: '700' },
    statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
    studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    moodDot: { width: 10, height: 10, borderRadius: 5 },
    studentName: { fontSize: 15, fontWeight: '600' },
    studentSub: { fontSize: 12, marginTop: 2 },
    emptySection: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { fontSize: 15, textAlign: 'center' },
});
