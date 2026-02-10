import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import {
    ArrowLeft, Flame, TrendingUp, BookOpen, Moon, Zap,
    Smile, Frown, Meh
} from 'lucide-react-native';

export default function StudentDashboardScreen() {
    const { classId, className } = useLocalSearchParams<{ classId: string; className: string }>();
    const { colors } = useTheme();
    const { user, profile } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [checkins, setCheckins] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [streak, setStreak] = useState(0);
    const [stats, setStats] = useState({
        avgMood: 0,
        totalEntries: 0,
        sleepAvg: '0',
        energyAvg: '0',
    });

    useEffect(() => {
        if (classId && user) fetchData();
    }, [classId, user]);

    const fetchData = async () => {
        try {
            // Чекины
            const { data: checkinsData } = await supabase
                .from('checkins')
                .select('*')
                .eq('user_id', user!.id)
                .eq('class_id', classId)
                .order('created_at', { ascending: false });

            // Задания
            const { data: tasksData } = await supabase
                .from('tasks')
                .select('*, student_tasks(id, completed, response, student_id)')
                .eq('class_id', classId)
                .order('created_at', { ascending: false });

            const processed = tasksData?.map((t: any) => ({
                ...t,
                mySubmission: t.student_tasks?.find((st: any) => st.student_id === user!.id),
            })) || [];

            setTasks(processed);
            setCheckins(checkinsData || []);

            if (checkinsData && checkinsData.length > 0) {
                calculateStats(checkinsData);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: any[]) => {
        // Streak
        const sorted = [...data]
            .map(c => new Date(c.created_at).setHours(0, 0, 0, 0))
            .sort((a, b) => b - a);
        const unique = Array.from(new Set(sorted));
        let s = 0;
        const today = new Date().setHours(0, 0, 0, 0);
        const yesterday = today - 86400000;
        if (unique.length > 0 && (unique[0] === today || unique[0] === yesterday)) {
            s = 1;
            for (let i = 0; i < unique.length - 1; i++) {
                if (Math.round((unique[i] - unique[i + 1]) / 86400000) === 1) s++;
                else break;
            }
        }
        setStreak(s);

        // Stats
        const total = data.length;
        const avgMood = total > 0
            ? +(data.reduce((acc, c) => acc + c.mood_score, 0) / total).toFixed(1)
            : 0;
        const sleepSum = data.reduce((acc, c) => acc + (c.sleep_hours || 0), 0);
        const energySum = data.reduce((acc, c) => acc + (c.energy_level || 0), 0);

        setStats({
            avgMood,
            totalEntries: total,
            sleepAvg: total > 0 ? (sleepSum / total).toFixed(1) + ' ч' : '0',
            energyAvg: total > 0 ? (energySum / total).toFixed(1) + '/10' : '0',
        });
    };

    const moodEmoji = (mood: number) => {
        if (mood >= 4) return '😊';
        if (mood <= 2) return '😔';
        return '😐';
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
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Хеадер */}
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{className || 'Класс'}</Text>
                </View>

                {/* Приветствие */}
                <Text style={[styles.hi, { color: colors.text }]}>
                    Привет, {profile?.full_name?.split(' ')[0] || 'Ученик'} 👋
                </Text>
                <Text style={[styles.hiSub, { color: colors.subtext }]}>
                    Готов отслеживать свой прогресс?
                </Text>

                {/* Streak */}
                <Card style={styles.streakCard}>
                    <Flame size={28} color={colors.accent} />
                    <View>
                        <Text style={[styles.streakNum, { color: colors.text }]}>{streak}</Text>
                        <Text style={[styles.streakLabel, { color: colors.subtext }]}>дней подряд</Text>
                    </View>
                </Card>

                {/* Статы */}
                <View style={styles.statsGrid}>
                    <StatMini label="Среднее" value={String(stats.avgMood)} color={colors} icon={<TrendingUp size={16} color={colors.accent} />} />
                    <StatMini label="Записей" value={String(stats.totalEntries)} color={colors} icon={<BookOpen size={16} color={colors.accent} />} />
                    <StatMini label="Сон" value={stats.sleepAvg} color={colors} icon={<Moon size={16} color={colors.accent} />} />
                    <StatMini label="Энергия" value={stats.energyAvg} color={colors} icon={<Zap size={16} color={colors.accent} />} />
                </View>

                {/* Последние записи */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Последние записи</Text>
                {checkins.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.subtext }]}>Пока нет записей. Начните с чекина!</Text>
                ) : (
                    checkins.slice(0, 5).map(entry => (
                        <Card key={entry.id} style={{ marginBottom: 10 }}>
                            <View style={styles.entryRow}>
                                <Text style={{ fontSize: 24 }}>{moodEmoji(entry.mood_score)}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.entryDate, { color: colors.text }]}>
                                        {new Date(entry.created_at).toLocaleDateString('ru-RU')}
                                    </Text>
                                    <Text style={[styles.entryComment, { color: colors.subtext }]} numberOfLines={1}>
                                        {entry.comment || 'Без комментария'}
                                    </Text>
                                </View>
                                <Text style={[styles.entryMood, {
                                    color: entry.mood_score >= 4 ? 'rgb(34,197,94)' : entry.mood_score <= 2 ? 'rgb(239,68,68)' : colors.subtext,
                                }]}>
                                    {entry.mood_score}/5
                                </Text>
                            </View>
                        </Card>
                    ))
                )}

                {/* Задания */}
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Задания</Text>
                {tasks.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.subtext }]}>Учитель пока не добавил заданий.</Text>
                ) : (
                    tasks.slice(0, 5).map(task => (
                        <Card key={task.id} style={{ marginBottom: 10 }}>
                            <View style={styles.taskRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                                    <Text style={[styles.taskDesc, { color: colors.subtext }]} numberOfLines={1}>
                                        {task.description || 'Без описания'}
                                    </Text>
                                </View>
                                {task.mySubmission?.completed ? (
                                    <View style={[styles.badge, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                                        <Text style={{ color: 'rgb(34,197,94)', fontSize: 11, fontWeight: '600' }}>✓ Сдано</Text>
                                    </View>
                                ) : (
                                    <View style={[styles.badge, { backgroundColor: colors.accent + '20' }]}>
                                        <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '600' }}>Открыто</Text>
                                    </View>
                                )}
                            </View>
                        </Card>
                    ))
                )}
            </ScrollView>
        </ScreenWrapper>
    );
}

const StatMini = ({ label, value, color, icon }: any) => (
    <Card style={styles.statMini}>
        {icon}
        <Text style={[styles.statValue, { color: color.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: color.subtext }]}>{label}</Text>
    </Card>
);

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 20, paddingBottom: 40 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    hi: { fontSize: 28, fontWeight: '700' },
    hiSub: { fontSize: 15, marginTop: 4, marginBottom: 20 },
    streakCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        marginBottom: 16,
    },
    streakNum: { fontSize: 28, fontWeight: '700' },
    streakLabel: { fontSize: 12 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    statMini: { flex: 1, minWidth: '45%', alignItems: 'center', gap: 4, paddingVertical: 14 },
    statValue: { fontSize: 20, fontWeight: '700' },
    statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
    sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
    emptyText: { fontSize: 14, marginBottom: 12 },
    entryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    entryDate: { fontSize: 15, fontWeight: '600' },
    entryComment: { fontSize: 13, marginTop: 2 },
    entryMood: { fontSize: 16, fontWeight: '700' },
    taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    taskTitle: { fontSize: 15, fontWeight: '600' },
    taskDesc: { fontSize: 12, marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
});
