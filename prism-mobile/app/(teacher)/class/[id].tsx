
import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, LayoutAnimation, Platform, UIManager, Modal, TextInput, ScrollView, KeyboardAvoidingView, SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useTheme } from '../../../src/context/ThemeContext';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { ArrowLeft, Users, AlertTriangle, CheckCircle, Trash2, Sparkles, ChevronDown, ChevronUp, FileText, Plus, Clock, X, Eye, MessageSquare, Send, RefreshCw } from 'lucide-react-native';
import { assessStudentRisk, getGeminiInsight, getChatResponse } from '../../../src/lib/gemini';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ClassDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colors } = useTheme();
    const router = useRouter();

    const [classInfo, setClassInfo] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [allCheckins, setAllCheckins] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [studentTasks, setStudentTasks] = useState<any[]>([]);
    const [stats, setStats] = useState({ avgMood: 0, riskCount: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [activeTab, setActiveTab] = useState<'students' | 'assignments'>('students');

    // AI Risk Analysis
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState('');

    // AI Insight
    const [insightVisible, setInsightVisible] = useState(false);
    const [insightText, setInsightText] = useState('');
    const [insightLoading, setInsightLoading] = useState(false);

    // Chat Bot
    const [chatVisible, setChatVisible] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ role: string, content: any }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    // Assignment UI
    const [modalVisible, setModalVisible] = useState(false);
    const [newAssignment, setNewAssignment] = useState({ title: '', description: '' });
    const [viewTask, setViewTask] = useState<any>(null);
    const [viewTaskModalVisible, setViewTaskModalVisible] = useState(false);

    useEffect(() => {
        if (id) fetchClassData();
    }, [id, activeTab]);

    const fetchClassData = async () => {
        try {
            if (!classInfo || classInfo.id !== id) {
                const { data: cls } = await supabase.from('classes').select('*').eq('id', id).single();
                setClassInfo(cls);
            }

            const { data: enrollments } = await supabase
                .from('class_enrollments')
                .select('user_id, profiles!inner(id, full_name, email, avatar_url)')
                .eq('class_id', id);

            const { data: checkins } = await supabase
                .from('checkins')
                .select('*')
                .eq('class_id', id)
                .order('created_at', { ascending: true });

            setAllCheckins(checkins || []);

            const { data: risks } = await supabase
                .from('ai_risk_assessments')
                .select('*')
                .eq('class_id', id);

            const processedStudents = (enrollments || []).map((e: any, i: number) => {
                const studentCheckins = checkins?.filter(c => c.user_id === e.user_id) || [];
                const riskEntry = risks?.find(r => r.student_id === e.user_id);

                const avg = studentCheckins.length > 0
                    ? (studentCheckins.reduce((s, c) => s + c.mood_score, 0) / studentCheckins.length).toFixed(1)
                    : '-';

                const riskLevel = riskEntry ? riskEntry.risk_level : 0;
                let statusColor = 'rgb(34,197,94)'; // Green
                let statusText = 'Норма';

                if (riskLevel >= 8) { statusColor = 'rgb(239,68,68)'; statusText = 'Крит.'; }
                else if (riskLevel >= 5) { statusColor = '#F97316'; statusText = 'Риск'; }
                else if (riskLevel >= 3) { statusColor = '#EAB308'; statusText = 'Внимание'; }

                return {
                    id: e.profiles.id,
                    realName: e.profiles.full_name || e.profiles.email?.split('@')[0],
                    anonName: `Ученик ${i + 1}`,
                    avgMood: avg,
                    riskLevel,
                    statusColor,
                    statusText,
                    checkinCount: studentCheckins.length,
                    riskData: riskEntry
                };
            });

            setStudents(processedStudents);

            const total = processedStudents.length;
            const riskCount = processedStudents.filter(s => s.riskLevel >= 3).length; // Count attention as risk in stats
            const totalMood = checkins?.reduce((s, c) => s + c.mood_score, 0) || 0;
            const avgMood = checkins?.length ? +(totalMood / checkins.length).toFixed(1) : 0;
            setStats({ avgMood, riskCount, total });

            if (activeTab === 'assignments') {
                const { data: loadedTasks } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('class_id', id)
                    .order('created_at', { ascending: false });
                setTasks(loadedTasks || []);

                const { data: loadedStudentTasks } = await supabase
                    .from('student_tasks')
                    .select('*')
                    .in('task_id', (loadedTasks || []).map(t => t.id));
                setStudentTasks(loadedStudentTasks || []);
            }

            // Sync: Load latest class insight form DB
            const { data: latestInsight } = await supabase
                .from('class_insights')
                .select('content')
                .eq('class_id', id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(); // Use maybeSingle to avoid error if no rows

            if (latestInsight) {
                setInsightText(latestInsight.content);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const runMassAnalysis = async () => {
        if (analyzing) return;
        setAnalyzing(true);
        setAnalysisProgress(`Начало...`);

        try {
            let processed = 0;
            for (const student of students) {
                setAnalysisProgress(`${processed + 1}/${students.length}`);
                const studentCheckins = allCheckins.filter(c => c.user_id === student.id).slice(-10);

                if (studentCheckins.length > 0) {
                    const assessment = await assessStudentRisk({
                        name: student.realName,
                        checkins: studentCheckins.map(c => ({
                            date: new Date(c.created_at).toLocaleDateString(),
                            mood: c.mood_score,
                            sleep: c.sleep_hours,
                            energy: c.energy_level,
                            factors: c.factors || [],
                            comment: c.comment || ''
                        }))
                    });

                    await supabase.from('ai_risk_assessments').upsert({
                        student_id: student.id,
                        class_id: id,
                        risk_level: assessment.riskLevel,
                        status: assessment.status,
                        reason: assessment.reason,
                        assessed_at: new Date().toISOString()
                    }, { onConflict: 'student_id,class_id' });
                }
                processed++;
                await new Promise(r => setTimeout(r, 500));
            }
            Alert.alert('Готово', 'Анализ учеников завершен.');
            fetchClassData();
        } catch (e) {
            Alert.alert('Ошибка');
        } finally {
            setAnalyzing(false);
            setAnalysisProgress('');
        }
    };

    const openInsight = () => {
        setInsightVisible(true);
        if (!insightText) generateInsight();
    };

    const generateInsight = async () => {
        if (insightLoading) return;
        setInsightLoading(true);
        try {
            const dataForAI = students.map(s => {
                const sCheckins = allCheckins.filter(c => c.user_id === s.id).slice(-5);
                return {
                    name: s.realName,
                    checkins: sCheckins.map(c => ({
                        date: c.created_at,
                        mood: c.mood_score,
                        comment: c.comment
                    }))
                };
            });

            // Convert data to string for prompt
            const prompt = `Проанализируй состояние класса. Данные: ${JSON.stringify(dataForAI)}. Дай ОЧЕНЬ КРАТКОЕ резюме в простом тексте. 
ВАЖНО: НЕ используй Markdown, звездочки (**), таблицы, решетки (#) или любое форматирование. Пиши только простой текст (буквы, цифры, точки).
Выдели только ключевые тренды и проблемы. Максимум 3-4 предложения.`;

            const response = await getChatResponse([{ role: 'user', content: prompt }]);
            const insightTextContent = typeof response === 'string' ? response : (response.content || JSON.stringify(response));

            setInsightText(insightTextContent);

            // Save to DB for Web Sync
            const { error } = await supabase.from('class_insights').insert({
                class_id: id,
                content: insightTextContent,
                summary: typeof insightTextContent === 'string' ? insightTextContent.substring(0, 100) + '...' : 'Insight'
            });

            if (error) {
                console.log('Insight save error (create table class_insights if missing):', error);
            }

        } catch (e) {
            setInsightText('Не удалось получить анализ. Проверьте соединение.');
        } finally {
            setInsightLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!chatInput.trim()) return;

        // Prepare new message list
        const userInput = chatInput;
        const newMsg = { role: 'user', content: userInput };

        // Optimistic UI update
        const updatedMessages = [...chatMessages, newMsg];
        setChatMessages(updatedMessages);
        setChatInput('');
        setChatLoading(true);

        try {
            const studentsContext = students.slice(0, 10).map((s, i) => {
                const sCheckins = allCheckins.filter(c => c.user_id === s.id).slice(-3);
                const checkinsInfo = sCheckins.map(c => `Настр: ${c.mood_score}/5${c.comment ? `, "${c.comment}"` : ''}`).join('; ') || 'Нет записей';
                return `${i + 1}. ${s.anonName} (Ср: ${s.avgMood}, Статус: ${s.statusText}): ${checkinsInfo}`;
            }).join('\n');

            const context = `Ты — педагогический ассистент для УЧИТЕЛЯ (не ученика). Ты общаешься с учителем, который управляет классом "${classInfo?.name}".
СТРОГИЕ ПРАВИЛА:
- Обращайся к собеседнику на "Вы" как к коллеге-учителю
- НЕ путай учителя с учеником
- Помогай анализировать класс, давай педагогические советы
- Отвечай кратко, 2-4 предложения
- Пиши простым текстом без Markdown

СТАТИСТИКА КЛАССА:
Всего учеников: ${stats.total}, Среднее настроение: ${stats.avgMood}/5, В зоне риска: ${stats.riskCount}

ДАННЫЕ УЧЕНИКОВ:
${studentsContext || 'Нет данных'}`;


            // Format for API: properly map roles
            const apiMessages = [
                { role: 'system', content: context },
                ...updatedMessages.map(m => ({
                    role: m.role === 'model' ? 'assistant' : 'user',
                    content: m.content
                }))
            ];

            const response = await getChatResponse(apiMessages);

            setChatMessages(prev => [...prev, { role: 'model', content: typeof response === 'string' ? response : response.content }]);
        } catch (e) {
            console.error(e);
            setChatMessages(prev => [...prev, { role: 'model', content: 'Ошибка сети. Попробуйте позже.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    // ... delete functions ...
    const removeStudent = async (studentId: string) => {
        Alert.alert('Удалить?', 'Ученик будет удалён.', [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Удалить', style: 'destructive', onPress: async () => {
                    await supabase.from('class_enrollments').delete().eq('user_id', studentId).eq('class_id', id);
                    fetchClassData();
                },
            },
        ]);
    };

    const createAssignment = async () => {
        if (!newAssignment.title) return Alert.alert('Ошибка', 'Введите название');
        try {
            const { error } = await supabase.from('tasks').insert({
                class_id: id,
                title: newAssignment.title,
                description: newAssignment.description,
                type: 'text'
            });
            if (error) throw error;
            setModalVisible(false);
            setNewAssignment({ title: '', description: '' });
            fetchClassData();
        } catch (e) { Alert.alert('Ошибка'); }
    };

    const deleteTask = async (taskId: string) => {
        Alert.alert('Удалить?', 'Задание будет удалено.', [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Удалить', style: 'destructive', onPress: async () => {
                    await supabase.from('tasks').delete().eq('id', taskId);
                    fetchClassData();
                }
            }
        ]);
    };

    const deleteClass = () => {
        Alert.alert('Удалить класс?', 'Это действие нельзя отменить. Все данные класса, ученики и история будут удалены.', [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Удалить', style: 'destructive', onPress: async () => {
                    setLoading(true);
                    try {
                        // Manual Cascade Delete (Database might not have CASCADE set up for all tables)
                        await Promise.all([
                            supabase.from('checkins').delete().eq('class_id', id),
                            supabase.from('class_insights').delete().eq('class_id', id),
                            supabase.from('ai_risk_assessments').delete().eq('class_id', id),
                            supabase.from('class_events').delete().eq('class_id', id),
                            supabase.from('tasks').delete().eq('class_id', id), // Will cascade to student_tasks
                            supabase.from('class_enrollments').delete().eq('class_id', id)
                        ]);

                        // Finally delete the class
                        const { error } = await supabase.from('classes').delete().eq('id', id);

                        if (error) throw error;

                        Alert.alert('Успешно', 'Класс удален.');
                        router.replace('/(teacher)/classes');
                    } catch (error: any) {
                        console.error('Delete Error:', error);
                        Alert.alert('Ошибка', 'Не удалось удалить класс: ' + (error.message || JSON.stringify(error)));
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    const openTaskResponses = (task: any) => {
        setViewTask(task);
        setViewTaskModalVisible(true);
    };

    if (loading && !classInfo) return <ActivityIndicator style={styles.centered} size="large" color={colors.accent} />;

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace('/(teacher)/classes')} style={styles.backBtn}>
                    <ArrowLeft size={20} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.className, { color: colors.text }]}>{classInfo?.name}</Text>
                    <Text style={[styles.code, { color: colors.subtext }]}>Код: {classInfo?.code}</Text>
                </View>
                <TouchableOpacity onPress={deleteClass}>
                    <Trash2 size={24} color="rgba(239,68,68, 0.7)" />
                </TouchableOpacity>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tab, activeTab === 'students' && { borderBottomColor: colors.accent }]} onPress={() => setActiveTab('students')}>
                    <Text style={[styles.tabText, { color: activeTab === 'students' ? colors.accent : colors.subtext }]}>Ученики</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'assignments' && { borderBottomColor: colors.accent }]} onPress={() => setActiveTab('assignments')}>
                    <Text style={[styles.tabText, { color: activeTab === 'assignments' ? colors.accent : colors.subtext }]}>Задания</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'students' ? (
                <>
                    <View style={styles.statsRow}>
                        <Card style={styles.statCard}><Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text><Text style={styles.statLabel}>Учеников</Text></Card>
                        <Card style={styles.statCard}><Text style={[styles.statValue, { color: stats.avgMood >= 3 ? 'rgb(34,197,94)' : 'rgb(239,68,68)' }]}>{stats.avgMood}</Text><Text style={styles.statLabel}>Ср. балл</Text></Card>
                        <Card style={styles.statCard}><Text style={[styles.statValue, { color: stats.riskCount > 0 ? 'rgb(239,68,68)' : 'rgb(34,197,94)' }]}>{stats.riskCount}</Text><Text style={styles.statLabel}>В риске</Text></Card>
                    </View>

                    <FlatList
                        data={students}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 120 }} // Extra padding
                        ListHeaderComponent={
                            <View style={{ marginBottom: 10 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.subtext }}>AI МОНИТОРИНГ</Text>
                                    <TouchableOpacity onPress={() => setIsAnonymous(!isAnonymous)}>
                                        <Text style={{ fontSize: 12, color: colors.accent }}>{isAnonymous ? 'Показать имена' : 'Скрыть'}</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    {/* Mass Risk Analysis */}
                                    <View style={{ flex: 1 }}>
                                        <Card style={{ padding: 16, height: 80, justifyContent: 'center' }}>
                                            <TouchableOpacity
                                                onPress={runMassAnalysis}
                                                disabled={analyzing}
                                                style={{ alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                            >
                                                {analyzing ? <ActivityIndicator size="small" color="#F97316" /> : <Sparkles size={24} color="#F97316" />}
                                                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
                                                    {analyzing ? analysisProgress : 'Анализ учеников'}
                                                </Text>
                                            </TouchableOpacity>
                                        </Card>
                                    </View>

                                    {/* Insight Button */}
                                    <View style={{ flex: 1 }}>
                                        <Card style={{ padding: 16, height: 80, justifyContent: 'center' }}>
                                            <TouchableOpacity onPress={openInsight} style={{ alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                {insightLoading ? <ActivityIndicator size="small" color="#F97316" /> : <FileText size={24} color="#F97316" />}
                                                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'center' }}>Анализ класса</Text>
                                            </TouchableOpacity>
                                        </Card>
                                    </View>
                                </View>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => router.push({ pathname: '/(teacher)/student/[id]', params: { id: item.id, classId: id } })}>
                                <Card>
                                    <View style={styles.studentRow}>
                                        <View style={[styles.moodDot, { backgroundColor: item.statusColor }]} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.studentName, { color: colors.text }]}>{isAnonymous ? item.anonName : item.realName}</Text>
                                            <Text style={{ fontSize: 12, color: colors.subtext }}>Ср: {item.avgMood} • <Text style={{ color: item.statusColor }}>{item.statusText}</Text></Text>
                                        </View>
                                        {item.riskLevel >= 3 ? <AlertTriangle size={18} color={item.statusColor} /> : <CheckCircle size={18} color={item.statusColor} />}
                                        <TouchableOpacity onPress={() => removeStudent(item.id)} style={{ marginLeft: 8 }}><Trash2 size={16} color={colors.subtext} /></TouchableOpacity>
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        )}
                    />

                    {/* Chat Bot FAB */}
                    <TouchableOpacity style={[styles.fab, { backgroundColor: colors.accent }]} onPress={() => setChatVisible(true)}>
                        <MessageSquare color="#fff" size={24} />
                    </TouchableOpacity>
                </>
            ) : (
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={tasks}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 120 }}
                        renderItem={({ item }) => {
                            const completedCount = studentTasks.filter(st => st.task_id === item.id && st.completed).length;
                            return (
                                <Card>
                                    <TouchableOpacity onPress={() => openTaskResponses(item)}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{item.title}</Text>
                                                {item.description && <Text style={{ fontSize: 14, color: colors.subtext, marginTop: 4 }}>{item.description}</Text>}
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
                                                    <CheckCircle size={14} color={completedCount > 0 ? "rgb(34,197,94)" : colors.subtext} />
                                                    <Text style={{ fontSize: 12, color: colors.subtext }}>Сдано: {completedCount} учеников</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity onPress={() => deleteTask(item.id)}><Trash2 size={18} color={colors.subtext} /></TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                </Card>
                            );
                        }}
                    />
                    <TouchableOpacity style={[styles.fab, { backgroundColor: colors.accent }]} onPress={() => setModalVisible(true)}><Plus color="#fff" size={24} /></TouchableOpacity>
                </View>
            )}

            {/* Create Task Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    {/* ... Same ... */}
                    <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Новое задание</Text>
                        <TextInput placeholder="Название" placeholderTextColor={colors.subtext} style={[styles.input, { backgroundColor: colors.background, color: colors.text }]} value={newAssignment.title} onChangeText={t => setNewAssignment({ ...newAssignment, title: t })} />
                        <TextInput placeholder="Описание" placeholderTextColor={colors.subtext} style={[styles.input, { backgroundColor: colors.background, color: colors.text, height: 80 }]} multiline value={newAssignment.description} onChangeText={t => setNewAssignment({ ...newAssignment, description: t })} />
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ color: colors.subtext, padding: 10 }}>Отмена</Text></TouchableOpacity>
                            <TouchableOpacity onPress={createAssignment} style={{ backgroundColor: colors.accent, padding: 10, borderRadius: 8 }}><Text style={{ color: '#fff', fontWeight: '700' }}>Создать</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* View Responses Modal */}
            <Modal visible={viewTaskModalVisible} animationType="slide" presentationStyle="pageSheet">
                {/* ... Same ... */}
                <View style={[styles.fullModal, { backgroundColor: colors.background }]}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setViewTaskModalVisible(false)} style={styles.backBtn}><ArrowLeft size={24} color={colors.text} /></TouchableOpacity>
                        <Text style={[styles.className, { color: colors.text, fontSize: 18 }]}>Ответы: {viewTask?.title}</Text>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        {students.map(student => {
                            const response = studentTasks.find(st => st.task_id === viewTask?.id && st.student_id === student.id);
                            return (
                                <Card key={student.id} style={{ marginBottom: 10, padding: 16 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={{ fontWeight: '700', color: colors.text }}>{isAnonymous ? student.anonName : student.realName}</Text>
                                        <Text style={{ color: response?.completed ? 'rgb(34,197,94)' : 'rgb(239,68,68)' }}>{response?.completed ? 'Сдано' : 'Не сдано'}</Text>
                                    </View>
                                    {response?.completed && <Text style={{ marginTop: 8, color: colors.text }}>{response.response}</Text>}
                                </Card>
                            );
                        })}
                    </ScrollView>
                </View>
            </Modal>

            {/* Insight Modal */}
            <Modal visible={insightVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: colors.surface, maxHeight: '80%' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={[styles.modalTitle, { marginBottom: 0, color: colors.text }]}>Анализ класса</Text>
                            <TouchableOpacity onPress={generateInsight} disabled={insightLoading} style={{ padding: 4 }}>
                                {insightLoading ? <ActivityIndicator size="small" color={colors.accent} /> : <RefreshCw size={20} color={colors.accent} />}
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {insightLoading && !insightText ? <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 20 }} /> : (
                                <Text style={{ color: colors.text, fontSize: 16, lineHeight: 24 }}>{insightText || 'Нет данных для анализа.'}</Text>
                            )}
                        </ScrollView>
                        <TouchableOpacity onPress={() => setInsightVisible(false)} style={{ alignSelf: 'flex-end', marginTop: 10 }}><Text style={{ color: colors.accent, fontSize: 16 }}>Закрыть</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Chat Bot Modal */}
            <Modal visible={chatVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.fullModal, { backgroundColor: colors.background }]}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setChatVisible(false)} style={styles.backBtn}><ArrowLeft size={24} color={colors.text} /></TouchableOpacity>
                        <Text style={[styles.className, { color: colors.text, fontSize: 18 }]}>AI Ассистент</Text>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1, paddingBottom: 100 }}>
                        {chatMessages.length === 0 && (
                            <Text style={{ color: colors.subtext, textAlign: 'center', marginTop: 50 }}>Задайте вопрос о классе или учениках...</Text>
                        )}
                        {chatMessages.map((msg, i) => (
                            <View key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', backgroundColor: msg.role === 'user' ? colors.accent : colors.surface, padding: 12, borderRadius: 12, marginBottom: 8, maxWidth: '80%' }}>
                                <Text style={{ color: '#fff' }}>{msg.content}</Text>
                            </View>
                        ))}
                        {chatLoading && <ActivityIndicator color={colors.accent} style={{ alignSelf: 'flex-start', marginLeft: 20 }} />}
                    </ScrollView>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} // Increased offset
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
                    >
                        <View style={{ flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', backgroundColor: colors.background, paddingBottom: Platform.OS === 'ios' ? 40 : 16 }}>
                            <TextInput value={chatInput} onChangeText={setChatInput} placeholder="Написать сообщение..." placeholderTextColor={colors.subtext} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: colors.text, marginRight: 10 }} />
                            <TouchableOpacity onPress={sendMessage} disabled={chatLoading} style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: colors.accent, width: 44, height: 44, borderRadius: 22 }}>
                                <Send color="#fff" size={20} />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    backBtn: { padding: 8 },
    className: { fontSize: 22, fontWeight: '700' },
    code: { fontSize: 13, marginTop: 2 },
    statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 8 },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: 14 },
    statValue: { fontSize: 24, fontWeight: '700' },
    statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2, color: '#888', textAlign: 'center' }, // Removed uppercase
    studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    moodDot: { width: 10, height: 10, borderRadius: 5 },
    studentName: { fontSize: 15, fontWeight: '600' },
    tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16 }, // Removed border
    tab: { paddingVertical: 12, marginRight: 20, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabText: { fontSize: 16, fontWeight: '600' },
    fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8, backgroundColor: '#8B5CF6' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    modalCard: { borderRadius: 16, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    input: { borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 16 },
    fullModal: { flex: 1, paddingTop: 60, backgroundColor: '#000' } // Ensure background is black
});
