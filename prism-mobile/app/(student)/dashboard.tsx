import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity,
    TextInput, Alert, Modal, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { getGeminiInsight } from '../../src/lib/gemini';
import { StudentMentorChat } from '../../src/components/StudentMentorChat';
import {
    ArrowLeft, Flame, TrendingUp, BookOpen, Moon, Zap,
    Smile, Frown, Meh, Plus, Trash2, Send, MessageSquare,
    BarChart3, ClipboardList, Home, Brain, Sparkles,
} from 'lucide-react-native';

type DashTab = 'home' | 'diary' | 'tasks' | 'stats';

export default function StudentDashboardScreen() {
    const { classId, className } = useLocalSearchParams<{ classId: string; className: string }>();
    const { colors } = useTheme();
    const { user, profile } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [checkins, setCheckins] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [streak, setStreak] = useState(0);
    const [activeTab, setActiveTab] = useState<DashTab>('home');
    const [showChat, setShowChat] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [taskResponse, setTaskResponse] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState<string | null>(null);
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
            const { data: checkinsData } = await supabase
                .from('checkins')
                .select('*')
                .eq('user_id', user!.id)
                .eq('class_id', classId)
                .order('created_at', { ascending: false });

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

    const loadAiAnalysis = async () => {
        if (checkins.length === 0 || !profile) return;

        // Generate cache key
        const latestCheckin = checkins[0];
        const cacheKey = `ai_analysis_${profile.id}_${latestCheckin.id}`;

        try {
            // CACHING DISABLED
            // const cached = await AsyncStorage.getItem(cacheKey);
            // if (cached) {
            //     console.log("Found cached AI analysis");
            //     setAiAnalysis(cached);
            //     return;
            // }

            setAiLoading(true);
            const recent = checkins.slice(0, 5);
            const checkinsText = recent.map(c =>
                `[${new Date(c.created_at).toLocaleDateString()}] Mood:${c.mood_score}/5, Sleep:${c.sleep_hours}, Ene:${c.energy_level}/10, Tags:${c.factors?.join(',')}, Note:${c.comment}`
            ).join('\n');

            const prompt = `Ты школьный психолог. Кратко (макс 3 предл) оцени состояние ученика и дай 1 совет.
Данные: ${checkinsText}`;

            const result = await getGeminiInsight(prompt, "meta-llama/llama-3.3-70b-instruct:free");
            setAiAnalysis(result);

            // Save to cache and clear old user keys
            const keys = await AsyncStorage.getAllKeys();
            const userKeys = keys.filter(k => k.startsWith(`ai_analysis_${profile.id}_`) && k !== cacheKey);
            if (userKeys.length > 0) {
                await AsyncStorage.multiRemove(userKeys);
            }
            await AsyncStorage.setItem(cacheKey, result);

        } catch (err) {
            setAiAnalysis('Не удалось загрузить анализ.');
            console.error(err);
        } finally {
            setAiLoading(false);
        }
    };

    const deleteCheckin = async (id: string) => {
        Alert.alert('Удалить запись?', 'Это действие нельзя отменить.', [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Удалить', style: 'destructive', onPress: async () => {
                    try {
                        const { error } = await supabase.from('checkins').delete().eq('id', id);
                        if (error) throw error;
                        setCheckins(prev => prev.filter(c => c.id !== id));
                    } catch (err) {
                        Alert.alert('Ошибка', 'Не удалось удалить запись');
                    }
                }
            }
        ]);
    };

    const submitTask = async (taskId: string) => {
        const response = taskResponse[taskId]?.trim();
        if (!response) {
            Alert.alert('Внимание', 'Введите ответ');
            return;
        }
        setSubmitting(taskId);
        try {
            const { data: existing } = await supabase
                .from('student_tasks')
                .select('id')
                .eq('task_id', taskId)
                .eq('student_id', user!.id)
                .maybeSingle();

            if (existing) {
                await supabase.from('student_tasks')
                    .update({ response, completed: true })
                    .eq('id', existing.id);
            } else {
                await supabase.from('student_tasks').insert({
                    task_id: taskId,
                    student_id: user!.id,
                    response,
                    completed: true,
                });
            }

            Alert.alert('Готово!', 'Ответ отправлен ✓');
            fetchData();
        } catch (err) {
            Alert.alert('Ошибка', 'Не удалось отправить');
        } finally {
            setSubmitting(null);
        }
    };

    // Last 7 days mood+energy data for stats tab
    const getLast7DaysData = () => {
        const days: { date: string; mood: number | null; energy: number | null }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('ru-RU', { weekday: 'short' });
            const dayStart = new Date(d.setHours(0, 0, 0, 0)).getTime();
            const dayEnd = dayStart + 86400000;
            const dayCheckins = checkins.filter(c => {
                const t = new Date(c.created_at).getTime();
                return t >= dayStart && t < dayEnd;
            });
            const avgMood = dayCheckins.length > 0
                ? dayCheckins.reduce((s, c) => s + c.mood_score, 0) / dayCheckins.length
                : null;
            const avgEnergy = dayCheckins.length > 0
                ? dayCheckins.reduce((s, c) => s + (c.energy_level || 0), 0) / dayCheckins.length
                : null;
            days.push({ date: dateStr, mood: avgMood, energy: avgEnergy });
        }
        return days;
    };

    // Calendar heatmap data (last 90 days)
    const getCalendarData = () => {
        const cells: { date: Date; mood: number | null }[] = [];
        for (let i = 89; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const dayStart = d.getTime();
            const dayEnd = dayStart + 86400000;
            const dayCheckins = checkins.filter(c => {
                const t = new Date(c.created_at).getTime();
                return t >= dayStart && t < dayEnd;
            });
            const avgMood = dayCheckins.length > 0
                ? dayCheckins.reduce((s, c) => s + c.mood_score, 0) / dayCheckins.length
                : null;
            cells.push({ date: new Date(d), mood: avgMood });
        }
        return cells;
    };

    const moodHeatColor = (mood: number | null) => {
        if (mood === null) return colors.border;
        if (mood >= 4.5) return '#22c55e';
        if (mood >= 3.5) return '#86efac';
        if (mood >= 2.5) return '#facc15';
        if (mood >= 1.5) return '#fb923c';
        return '#ef4444';
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

    // AI Chat Modal
    if (showChat) {
        return (
            <ScreenWrapper padded={false}>
                <StudentMentorChat
                    userProfile={profile}
                    studentStats={stats}
                    recentCheckins={checkins}
                    onClose={() => setShowChat(false)}
                />
            </ScreenWrapper>
        );
    }

    const tabs: { key: DashTab; icon: any; label: string }[] = [
        { key: 'home', icon: Home, label: 'Главная' },
        { key: 'diary', icon: ClipboardList, label: 'Дневник' },
        { key: 'tasks', icon: BookOpen, label: 'Задания' },
        { key: 'stats', icon: BarChart3, label: 'Статистика' },
    ];

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                        {className || 'Класс'}
                    </Text>
                    <TouchableOpacity onPress={() => setShowChat(true)} style={[styles.chatBtn, { backgroundColor: colors.accent + '20' }]}>
                        <MessageSquare size={20} color={colors.accent} />
                    </TouchableOpacity>
                </View>

                {/* Tab Navigation */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
                    <View style={styles.tabRow}>
                        {tabs.map(tab => {
                            const active = activeTab === tab.key;
                            return (
                                <TouchableOpacity
                                    key={tab.key}
                                    onPress={() => setActiveTab(tab.key)}
                                    style={[
                                        styles.tabBtn,
                                        {
                                            backgroundColor: active ? colors.accent : colors.surface,
                                            borderColor: active ? colors.accent : colors.border,
                                        }
                                    ]}
                                >
                                    <tab.icon size={16} color={active ? '#fff' : colors.subtext} />
                                    <Text style={[styles.tabText, { color: active ? '#fff' : colors.subtext }]}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* ============ HOME TAB ============ */}
                {activeTab === 'home' && (
                    <>
                        {/* Greeting */}
                        <Text style={[styles.hi, { color: colors.text }]}>
                            Привет, {profile?.full_name?.split(' ')[0] || 'Ученик'} 👋
                        </Text>
                        <Text style={[styles.hiSub, { color: colors.subtext }]}>
                            Готов отслеживать свой прогресс?
                        </Text>

                        {/* New Checkin Button */}
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/(student)/checkin', params: { classId, className } })}
                            style={[styles.newCheckinBtn, { backgroundColor: colors.accent }]}
                        >
                            <Plus size={22} color="#fff" />
                            <Text style={styles.newCheckinText}>Новая запись</Text>
                        </TouchableOpacity>

                        {/* Streak */}
                        <Card style={styles.streakCard}>
                            <Flame size={28} color={colors.accent} />
                            <View>
                                <Text style={[styles.streakNum, { color: colors.text }]}>{streak}</Text>
                                <Text style={[styles.streakLabel, { color: colors.subtext }]}>дней подряд</Text>
                            </View>
                        </Card>

                        {/* Stats Grid */}
                        <View style={styles.statsGrid}>
                            <StatMini label="Среднее" value={String(stats.avgMood)} color={colors} icon={<TrendingUp size={16} color={colors.accent} />} />
                            <StatMini label="Записей" value={String(stats.totalEntries)} color={colors} icon={<BookOpen size={16} color={colors.accent} />} />
                            <StatMini label="Сон" value={stats.sleepAvg} color={colors} icon={<Moon size={16} color={colors.accent} />} />
                            <StatMini label="Энергия" value={stats.energyAvg} color={colors} icon={<Zap size={16} color={colors.accent} />} />
                        </View>

                        {/* AI Analysis Card */}
                        <Card style={styles.aiCard}>
                            <View style={styles.aiHeader}>
                                <Sparkles size={20} color={colors.accent} />
                                <Text style={[styles.aiTitle, { color: colors.text }]}>AI Анализ</Text>
                            </View>
                            {aiAnalysis ? (
                                <Text style={[styles.aiText, { color: colors.subtext }]}>{aiAnalysis}</Text>
                            ) : (
                                <TouchableOpacity
                                    onPress={loadAiAnalysis}
                                    disabled={aiLoading || checkins.length === 0}
                                    style={[styles.aiBtn, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}
                                >
                                    {aiLoading ? (
                                        <ActivityIndicator color={colors.accent} />
                                    ) : (
                                        <>
                                            <Brain size={18} color={colors.accent} />
                                            <Text style={[styles.aiBtnText, { color: colors.accent }]}>
                                                {checkins.length === 0 ? 'Нет данных для анализа' : 'Запросить анализ'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </Card>

                        {/* Recent Entries (last 3) */}
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Последние записи</Text>
                        {checkins.length === 0 ? (
                            <Text style={[styles.emptyText, { color: colors.subtext }]}>Пока нет записей. Начните с чекина!</Text>
                        ) : (
                            checkins.slice(0, 3).map(entry => (
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
                    </>
                )}

                {/* ============ DIARY TAB ============ */}
                {activeTab === 'diary' && (
                    <>
                        <View style={styles.diaryHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Дневник записей</Text>
                            <Text style={[styles.diaryCount, { color: colors.subtext }]}>
                                {checkins.length} {checkins.length === 1 ? 'запись' : 'записей'}
                            </Text>
                        </View>

                        {/* New Checkin */}
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/(student)/checkin', params: { classId, className } })}
                            style={[styles.newCheckinBtn, { backgroundColor: colors.accent, marginBottom: 16 }]}
                        >
                            <Plus size={22} color="#fff" />
                            <Text style={styles.newCheckinText}>Новая запись</Text>
                        </TouchableOpacity>

                        {checkins.length === 0 ? (
                            <Text style={[styles.emptyText, { color: colors.subtext }]}>Дневник пуст. Создайте первую запись!</Text>
                        ) : (
                            checkins.map(entry => (
                                <Card key={entry.id} style={{ marginBottom: 12 }}>
                                    <View style={styles.entryRow}>
                                        <Text style={{ fontSize: 28 }}>{moodEmoji(entry.mood_score)}</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.entryDate, { color: colors.text }]}>
                                                {new Date(entry.created_at).toLocaleDateString('ru-RU', {
                                                    weekday: 'short', day: 'numeric', month: 'short',
                                                })}
                                            </Text>
                                            <Text style={[styles.entryComment, { color: colors.subtext }]}>
                                                {entry.comment || 'Без комментария'}
                                            </Text>
                                            {entry.emotions?.length > 0 && (
                                                <View style={styles.tagsRow}>
                                                    {entry.emotions.map((e: string) => (
                                                        <View key={e} style={[styles.tag, { backgroundColor: colors.accent + '15' }]}>
                                                            <Text style={[styles.tagText, { color: colors.accent }]}>{e}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                            <View style={styles.miniStats}>
                                                <Text style={[styles.miniStat, { color: colors.subtext }]}>
                                                    😴 {entry.sleep_hours || '?'}ч
                                                </Text>
                                                <Text style={[styles.miniStat, { color: colors.subtext }]}>
                                                    ⚡ {entry.energy_level || '?'}/10
                                                </Text>

                                            </View>
                                        </View>
                                        <View style={styles.entryActions}>
                                            <Text style={[styles.entryMood, {
                                                color: entry.mood_score >= 4 ? 'rgb(34,197,94)' : entry.mood_score <= 2 ? 'rgb(239,68,68)' : colors.subtext,
                                            }]}>
                                                {entry.mood_score}/5
                                            </Text>
                                            <TouchableOpacity onPress={() => deleteCheckin(entry.id)} style={styles.deleteBtn}>
                                                <Trash2 size={16} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </Card>
                            ))
                        )}
                    </>
                )}

                {/* ============ TASKS TAB ============ */}
                {activeTab === 'tasks' && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Задания</Text>
                        {tasks.length === 0 ? (
                            <Text style={[styles.emptyText, { color: colors.subtext }]}>Учитель пока не добавил заданий.</Text>
                        ) : (
                            tasks.map(task => (
                                <Card key={task.id} style={{ marginBottom: 14 }}>
                                    <View style={styles.taskHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                                            <Text style={[styles.taskDesc, { color: colors.subtext }]}>
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

                                    {!task.mySubmission?.completed && (
                                        <View style={[styles.taskInput, { borderTopColor: colors.border }]}>
                                            <TextInput
                                                value={taskResponse[task.id] || ''}
                                                onChangeText={text => setTaskResponse(prev => ({ ...prev, [task.id]: text }))}
                                                placeholder="Напишите ответ..."
                                                placeholderTextColor={colors.subtext}
                                                multiline
                                                style={[styles.responseInput, {
                                                    backgroundColor: colors.inputBg,
                                                    borderColor: colors.border,
                                                    color: colors.text,
                                                }]}
                                            />
                                            <TouchableOpacity
                                                onPress={() => submitTask(task.id)}
                                                disabled={submitting === task.id}
                                                style={[styles.submitBtn, { backgroundColor: colors.accent }]}
                                            >
                                                {submitting === task.id ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <>
                                                        <Send size={16} color="#fff" />
                                                        <Text style={styles.submitText}>Отправить</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {task.mySubmission?.completed && task.mySubmission?.response && (
                                        <View style={[styles.myResponse, { borderTopColor: colors.border }]}>
                                            <Text style={[styles.myResponseLabel, { color: colors.subtext }]}>Мой ответ:</Text>
                                            <Text style={[styles.myResponseText, { color: colors.text }]}>
                                                {task.mySubmission.response}
                                            </Text>
                                        </View>
                                    )}
                                </Card>
                            ))
                        )}
                    </>
                )}

                {/* ============ STATS TAB ============ */}
                {activeTab === 'stats' && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Статистика</Text>

                        {/* Overall Stats */}
                        <View style={styles.statsGrid}>
                            <StatMini label="Ср. настр." value={String(stats.avgMood)} color={colors} icon={<TrendingUp size={16} color={colors.accent} />} />
                            <StatMini label="Записей" value={String(stats.totalEntries)} color={colors} icon={<BookOpen size={16} color={colors.accent} />} />
                            <StatMini label="Ср. сон" value={stats.sleepAvg} color={colors} icon={<Moon size={16} color={colors.accent} />} />
                            <StatMini label="Ср. энергия" value={stats.energyAvg} color={colors} icon={<Zap size={16} color={colors.accent} />} />
                        </View>

                        {/* Streak */}
                        <Card style={[styles.streakCard, { marginTop: 8 }]}>
                            <Flame size={28} color={colors.accent} />
                            <View>
                                <Text style={[styles.streakNum, { color: colors.text }]}>{streak}</Text>
                                <Text style={[styles.streakLabel, { color: colors.subtext }]}>дней подряд</Text>
                            </View>
                        </Card>

                        {/* Line Chart: Mood + Energy */}
                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Твои показатели</Text>
                        <Card style={styles.chartCard}>
                            {(() => {
                                const data = getLast7DaysData();
                                const chartW = Dimensions.get('window').width - 80;
                                const chartH = 140;
                                const maxMood = 5;
                                const maxEnergy = 10;

                                // Build polyline points for mood
                                const moodPoints = data.map((d, i) => {
                                    const x = (i / (data.length - 1)) * chartW;
                                    const y = d.mood !== null ? chartH - (d.mood / maxMood) * chartH : null;
                                    return { x, y };
                                }).filter(p => p.y !== null) as { x: number; y: number }[];

                                // Build polyline points for energy (normalized to same scale)
                                const energyPoints = data.map((d, i) => {
                                    const x = (i / (data.length - 1)) * chartW;
                                    const y = d.energy !== null ? chartH - (d.energy / maxEnergy) * chartH : null;
                                    return { x, y };
                                }).filter(p => p.y !== null) as { x: number; y: number }[];

                                return (
                                    <View>
                                        {/* Y-axis scale lines */}
                                        <View style={{ position: 'relative', height: chartH, marginBottom: 8 }}>
                                            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
                                                <View key={i} style={{
                                                    position: 'absolute', top: frac * chartH,
                                                    left: 0, right: 0, height: 1,
                                                    backgroundColor: colors.border, opacity: 0.3,
                                                }} />
                                            ))}

                                            {/* Mood line + dots */}
                                            {moodPoints.map((p, i) => {
                                                const next = moodPoints[i + 1];
                                                return (
                                                    <React.Fragment key={'m' + i}>
                                                        <View style={{
                                                            position: 'absolute', left: p.x - 4, top: p.y - 4,
                                                            width: 8, height: 8, borderRadius: 4,
                                                            backgroundColor: '#818cf8', zIndex: 2,
                                                        }} />
                                                        {next && (
                                                            <View style={{
                                                                position: 'absolute',
                                                                left: p.x,
                                                                top: Math.min(p.y, next.y),
                                                                width: Math.sqrt(Math.pow(next.x - p.x, 2) + Math.pow(next.y - p.y, 2)),
                                                                height: 2,
                                                                backgroundColor: '#818cf8',
                                                                transformOrigin: 'left center',
                                                                transform: [{ rotate: `${Math.atan2(next.y - p.y, next.x - p.x)}rad` }],
                                                                zIndex: 1,
                                                            }} />
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}

                                            {/* Energy line + dots (dashed effect via dots) */}
                                            {energyPoints.map((p, i) => {
                                                const next = energyPoints[i + 1];
                                                return (
                                                    <React.Fragment key={'e' + i}>
                                                        <View style={{
                                                            position: 'absolute', left: p.x - 3, top: p.y - 3,
                                                            width: 6, height: 6, borderRadius: 3,
                                                            backgroundColor: '#facc15', zIndex: 2,
                                                        }} />
                                                        {next && (
                                                            <View style={{
                                                                position: 'absolute',
                                                                left: p.x,
                                                                top: Math.min(p.y, next.y),
                                                                width: Math.sqrt(Math.pow(next.x - p.x, 2) + Math.pow(next.y - p.y, 2)),
                                                                height: 2,
                                                                backgroundColor: '#facc15',
                                                                opacity: 0.6,
                                                                transformOrigin: 'left center',
                                                                transform: [{ rotate: `${Math.atan2(next.y - p.y, next.x - p.x)}rad` }],
                                                                zIndex: 1,
                                                            }} />
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </View>

                                        {/* X-axis labels */}
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            {data.map((d, i) => (
                                                <Text key={i} style={[styles.chartLabel, { color: colors.subtext }]}>
                                                    {d.date}
                                                </Text>
                                            ))}
                                        </View>

                                        {/* Legend */}
                                        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <View style={{ width: 12, height: 3, backgroundColor: '#818cf8', borderRadius: 2 }} />
                                                <Text style={{ color: colors.subtext, fontSize: 11 }}>Настроение</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <View style={{ width: 12, height: 3, backgroundColor: '#facc15', borderRadius: 2 }} />
                                                <Text style={{ color: colors.subtext, fontSize: 11 }}>Энергия</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })()}
                        </Card>

                        {/* Emotion Calendar Heatmap */}
                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Календарь настроения</Text>
                        <Card style={styles.chartCard}>
                            <View style={styles.calendarGrid}>
                                {getCalendarData().map((cell, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.calendarCell,
                                            { backgroundColor: moodHeatColor(cell.mood) }
                                        ]}
                                    />
                                ))}
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10 }}>
                                {[null, 1, 2, 3, 4, 5].map((m, i) => (
                                    <View key={i} style={{
                                        width: 10, height: 10, borderRadius: 2,
                                        backgroundColor: moodHeatColor(m),
                                    }} />
                                ))}
                                <Text style={{ color: colors.subtext, fontSize: 10, marginLeft: 4 }}>Плохо → Отлично</Text>
                            </View>
                        </Card>

                        {/* Top Emotions */}
                        {checkins.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Частые эмоции</Text>
                                <Card>
                                    <View style={styles.emotionsGrid}>
                                        {(() => {
                                            const emotionCount: Record<string, number> = {};
                                            checkins.forEach(c => {
                                                c.emotions?.forEach((e: string) => {
                                                    emotionCount[e] = (emotionCount[e] || 0) + 1;
                                                });
                                            });
                                            return Object.entries(emotionCount)
                                                .sort((a, b) => b[1] - a[1])
                                                .slice(0, 6)
                                                .map(([emotion, count]) => (
                                                    <View key={emotion} style={[styles.emotionItem, { backgroundColor: colors.accent + '12' }]}>
                                                        <Text style={[styles.emotionName, { color: colors.text }]}>{emotion}</Text>
                                                        <Text style={[styles.emotionCount, { color: colors.accent }]}>{count}x</Text>
                                                    </View>
                                                ));
                                        })()}
                                    </View>
                                </Card>
                            </>
                        )}

                        {/* Top Factors */}
                        {checkins.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Частые факторы</Text>
                                <Card>
                                    <View style={styles.emotionsGrid}>
                                        {(() => {
                                            const factorCount: Record<string, number> = {};
                                            checkins.forEach(c => {
                                                c.factors?.forEach((f: string) => {
                                                    factorCount[f] = (factorCount[f] || 0) + 1;
                                                });
                                            });
                                            return Object.entries(factorCount)
                                                .sort((a, b) => b[1] - a[1])
                                                .slice(0, 6)
                                                .map(([factor, count]) => (
                                                    <View key={factor} style={[styles.emotionItem, { backgroundColor: '#06b6d415' }]}>
                                                        <Text style={[styles.emotionName, { color: colors.text }]}>{factor}</Text>
                                                        <Text style={[styles.emotionCount, { color: '#06b6d4' }]}>{count}x</Text>
                                                    </View>
                                                ));
                                        })()}
                                    </View>
                                </Card>
                            </>
                        )}
                    </>
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
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '600', flex: 1 },
    chatBtn: {
        width: 40, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },

    // Tabs
    tabScroll: { marginBottom: 20 },
    tabRow: { flexDirection: 'row', gap: 8 },
    tabBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1,
    },
    tabText: { fontSize: 13, fontWeight: '600' },

    // Home
    hi: { fontSize: 28, fontWeight: '700' },
    hiSub: { fontSize: 15, marginTop: 4, marginBottom: 16 },
    newCheckinBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 14, borderRadius: 14, marginBottom: 16,
    },
    newCheckinText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    streakCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16,
    },
    streakNum: { fontSize: 28, fontWeight: '700' },
    streakLabel: { fontSize: 12 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    statMini: { flex: 1, minWidth: '45%', alignItems: 'center', gap: 4, paddingVertical: 14 },
    statValue: { fontSize: 20, fontWeight: '700' },
    statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },

    // AI
    aiCard: { marginBottom: 20 },
    aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    aiTitle: { fontSize: 17, fontWeight: '700' },
    aiText: { fontSize: 14, lineHeight: 22 },
    aiBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
    },
    aiBtnText: { fontSize: 14, fontWeight: '600' },

    // Entries
    sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
    emptyText: { fontSize: 14, marginBottom: 12 },
    entryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    entryDate: { fontSize: 15, fontWeight: '600' },
    entryComment: { fontSize: 13, marginTop: 2 },
    entryMood: { fontSize: 16, fontWeight: '700' },
    entryActions: { alignItems: 'flex-end', gap: 8 },
    deleteBtn: { padding: 6 },

    // Diary
    diaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    diaryCount: { fontSize: 13 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    tagText: { fontSize: 11, fontWeight: '600' },
    miniStats: { flexDirection: 'row', gap: 12, marginTop: 6 },
    miniStat: { fontSize: 12 },

    // Tasks
    taskHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    taskTitle: { fontSize: 16, fontWeight: '600' },
    taskDesc: { fontSize: 13, marginTop: 4 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    taskInput: { borderTopWidth: 1, marginTop: 12, paddingTop: 12, gap: 10 },
    responseInput: {
        borderWidth: 1, borderRadius: 12, padding: 12,
        fontSize: 14, minHeight: 80, textAlignVertical: 'top',
    },
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 12, borderRadius: 12,
    },
    submitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    myResponse: { borderTopWidth: 1, marginTop: 12, paddingTop: 12 },
    myResponseLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
    myResponseText: { fontSize: 14, lineHeight: 20 },

    // Stats / Chart
    chartCard: { marginBottom: 16 },
    chartLabel: { fontSize: 10, fontWeight: '600' },
    calendarGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 3,
    },
    calendarCell: {
        width: 11, height: 11, borderRadius: 2,
    },
    emotionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    emotionItem: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    },
    emotionName: { fontSize: 13, fontWeight: '600' },
    emotionCount: { fontSize: 12, fontWeight: '700' },
});
