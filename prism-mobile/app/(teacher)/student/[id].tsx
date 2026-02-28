
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useTheme } from '../../../src/context/ThemeContext';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { ArrowLeft, Moon, Zap, CheckCircle, AlertTriangle, Play, RefreshCw, Sparkles } from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { assessStudentRisk } from '../../../src/lib/gemini';

const { width } = Dimensions.get('window');

// Simple Line Chart Component
const SimpleLineChart = ({ data, color }: { data: number[], color: string }) => {
    if (data.length < 2) {
        return (
            <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#888', fontStyle: 'italic' }}>Недостаточно данных</Text>
            </View>
        );
    }

    const height = 100;
    const chartWidth = width - 80;
    const maxY = 5;
    const minY = 1;

    const normalizeY = (val: number) => height - ((val - minY) / (maxY - minY)) * height;
    const stepX = chartWidth / (data.length - 1);

    let path = `M 0 ${normalizeY(data[0])}`;
    for (let i = 1; i < data.length; i++) {
        const x = i * stepX;
        const y = normalizeY(data[i]);
        path += ` L ${x} ${y}`;
    }

    const areaPath = path + ` L ${chartWidth} ${height} L 0 ${height} Z`;

    return (
        <View style={{ marginTop: 10 }}>
            <Svg height={height} width={chartWidth}>
                <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={color} stopOpacity="0.5" />
                        <Stop offset="1" stopColor={color} stopOpacity="0.0" />
                    </LinearGradient>
                </Defs>
                <Path d={areaPath} fill="url(#grad)" />
                <Path d={path} stroke={color} strokeWidth="3" fill="none" />
            </Svg>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                {data.map((_, i) => (
                    <Text key={i} style={{ fontSize: 10, color: '#888' }}>{i + 1}</Text>
                ))}
            </View>
        </View>
    );
};

export default function StudentDetailScreen() {
    const { id, classId } = useLocalSearchParams<{ id: string, classId: string }>();
    const { colors } = useTheme();
    const router = useRouter();

    const [student, setStudent] = useState<any>(null);
    const [checkins, setCheckins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ avgMood: 0, total: 0 });
    const [risk, setRisk] = useState<any>(null);
    const [assessing, setAssessing] = useState(false);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            // Profile
            const { data: profile } = await supabase
                .from('profiles').select('*').eq('id', id).single();
            setStudent(profile);

            // Checkins
            const { data: checks } = await supabase
                .from('checkins')
                .select('*')
                .eq('user_id', id)
                .order('created_at', { ascending: false })
                .limit(20);

            const list = checks || [];
            setCheckins(list);

            const total = list.length;
            const avgMood = total > 0
                ? +(list.reduce((acc, c) => acc + c.mood_score, 0) / total).toFixed(1)
                : 0;

            setStats({ avgMood, total });

            // Fetch EXISTING Risk Assessment from DB
            if (classId) {
                const { data: existingRisk } = await supabase
                    .from('ai_risk_assessments')
                    .select('*')
                    .eq('student_id', id)
                    .eq('class_id', classId)
                    .maybeSingle(); // Use maybeSingle to avoid error if not found

                if (existingRisk) {
                    setRisk({
                        riskLevel: existingRisk.risk_level,
                        status: existingRisk.status,
                        reason: existingRisk.reason,
                        date: existingRisk.assessed_at
                    });
                }
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const runAnalysis = async () => {
        if (assessing) return;
        if (checkins.length === 0) return Alert.alert('Нет данных', 'У ученика нет записей для анализа.');

        setAssessing(true);
        try {
            const analysisData = {
                name: student?.full_name || 'Ученик',
                checkins: checkins.slice(0, 10).map(c => ({
                    date: new Date(c.created_at).toLocaleDateString(),
                    mood: c.mood_score,
                    sleep: c.sleep_hours,
                    energy: c.energy_level,
                    factors: c.factors || [],
                    comment: c.comment || ''
                }))
            };

            const result = await assessStudentRisk(analysisData);

            setRisk(result);

            // Save to DB
            if (classId) {
                await supabase.from('ai_risk_assessments').upsert({
                    student_id: id,
                    class_id: classId,
                    risk_level: result.riskLevel,
                    status: result.status,
                    reason: result.reason,
                    assessed_at: new Date().toISOString()
                }, { onConflict: 'student_id,class_id' });
            }

        } catch (e) {
            Alert.alert('Ошибка', 'Не удалось провести анализ');
        } finally {
            setAssessing(false);
        }
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

    const chartData = checkins.slice(0, 7).reverse().map(c => c.mood_score);

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => classId ? router.push({ pathname: '/(teacher)/class/[id]', params: { id: classId } }) : router.back()}
                        style={styles.backBtn}
                    >
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.name, { color: colors.text }]}>{student?.full_name || 'Ученик'}</Text>
                        <Text style={[styles.email, { color: colors.subtext }]}>{student?.email}</Text>
                    </View>
                </View>

                <View style={{ paddingHorizontal: 20, gap: 16 }}>

                    {/* Stats Grid */}
                    <View style={styles.statsRow}>
                        <Card style={styles.statCard}>
                            <Text style={[styles.label, { color: colors.subtext }]}>СРЕДНЕЕ НАСТРОЕНИЕ</Text>
                            <Text style={[styles.value, { color: colors.text }]}>{stats.avgMood}</Text>
                        </Card>
                        <Card style={styles.statCard}>
                            <Text style={[styles.label, { color: colors.subtext }]}>ЗАПИСЕЙ</Text>
                            <Text style={[styles.value, { color: colors.text }]}>{stats.total}</Text>
                        </Card>
                    </View>

                    {/* Risk Status & Analysis Button */}
                    <Card style={{
                        padding: 16,
                        borderWidth: 1,
                        borderColor: risk?.status === 'normal' ? 'rgba(34,197,94,0.3)' : risk?.status === 'critical' ? 'rgba(239,68,68,0.3)' : 'rgba(255,165,0,0.3)'
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: colors.subtext, marginBottom: 4 }]}>AI СТАТУС РИСКА</Text>
                                {risk ? (
                                    <>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            {risk.status === 'normal'
                                                ? <CheckCircle size={20} color="rgb(34,197,94)" />
                                                : <AlertTriangle size={20} color={risk.status === 'critical' ? "rgb(239,68,68)" : "orange"} />
                                            }
                                            <Text style={{ fontSize: 18, fontWeight: '700', color: risk.status === 'normal' ? "rgb(34,197,94)" : (risk.status === 'critical' ? "rgb(239,68,68)" : "orange") }}>
                                                {risk.status === 'normal' ? 'Норма' : risk.status === 'critical' ? 'Критический' : 'Внимание'} ({risk.riskLevel}/10)
                                            </Text>
                                        </View>
                                        <Text style={{ color: colors.subtext, fontSize: 13, marginTop: 4 }}>
                                            {risk.reason}
                                        </Text>
                                        {risk.date && (
                                            <Text style={{ color: colors.subtext, fontSize: 10, marginTop: 4, opacity: 0.7 }}>
                                                Обновлено: {new Date(risk.date).toLocaleDateString()}
                                            </Text>
                                        )}
                                    </>
                                ) : (
                                    <Text style={{ color: colors.subtext, fontStyle: 'italic' }}>Анализ еще не проводился</Text>
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={runAnalysis}
                                disabled={assessing}
                                style={{ backgroundColor: colors.accent, padding: 10, borderRadius: 12, marginLeft: 10 }}
                            >
                                {assessing ? <ActivityIndicator color="#fff" size="small" /> : <Sparkles color="#fff" size={20} />}
                            </TouchableOpacity>
                        </View>
                    </Card>

                    {/* Chart */}
                    <Card>
                        <Text style={[styles.label, { color: colors.subtext, marginBottom: 10 }]}>ДИНАМИКА (7 ЗАПИСЕЙ)</Text>
                        <SimpleLineChart data={chartData} color={colors.accent} />
                    </Card>

                    {/* Checkins History */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>ПОСЛЕДНИЕ ЗАМЕТКИ</Text>

                    {checkins.map((item, i) => (
                        <Card key={item.id} style={{ marginBottom: 4 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                <Text style={{ color: colors.subtext, fontSize: 13 }}>
                                    {new Date(item.created_at).toLocaleDateString()}
                                </Text>
                                <Text style={{ color: item.mood_score >= 4 ? 'rgb(34,197,94)' : item.mood_score <= 2 ? 'rgb(239,68,68)' : 'orange', fontWeight: '700' }}>
                                    Настроение: {item.mood_score}/5
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Moon size={14} color="#60A5FA" />
                                    <Text style={{ color: colors.text, fontSize: 13 }}>Сон: {item.sleep_hours}ч</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Zap size={14} color="#FBBF24" />
                                    <Text style={{ color: colors.text, fontSize: 13 }}>Энергия: {item.energy_level}/10</Text>
                                </View>
                            </View>

                            {item.comment ? (
                                <Text style={{ color: colors.text, fontSize: 14, fontStyle: 'italic' }}>
                                    "{item.comment}"
                                </Text>
                            ) : (
                                <Text style={{ color: colors.subtext, fontSize: 14, fontStyle: 'italic' }}>
                                    Нет комментария
                                </Text>
                            )}
                        </Card>
                    ))}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20 },
    backBtn: { padding: 4 },
    name: { fontSize: 24, fontWeight: '700' },
    email: { fontSize: 14 },
    statsRow: { flexDirection: 'row', gap: 16 },
    statCard: { flex: 1, padding: 16 },
    label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    value: { fontSize: 28, fontWeight: '700', marginTop: 4 },
    sectionTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', marginTop: 10, letterSpacing: 1, marginLeft: 4 }
});
