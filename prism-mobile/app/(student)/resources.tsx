import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    Linking, ActivityIndicator, Animated, Easing, Image,
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import {
    Wind, BookOpen, Music, Play, Pause, RotateCcw,
    ChevronRight, ArrowLeft,
} from 'lucide-react-native';

// ============ BREATHING WIDGET ============
const BreathingWidget = () => {
    const { colors } = useTheme();
    const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
    const [timeLeft, setTimeLeft] = useState(4);
    const [isActive, setIsActive] = useState(false);
    const [cycleCount, setCycleCount] = useState(0);
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === 1) {
                    if (phase === 'inhale') {
                        setPhase('hold');
                        return 7;
                    } else if (phase === 'hold') {
                        setPhase('exhale');
                        return 8;
                    } else {
                        setPhase('inhale');
                        setCycleCount(c => c + 1);
                        return 4;
                    }
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, phase]);

    useEffect(() => {
        if (!isActive) return;
        const toValue = phase === 'inhale' ? 1.2 : phase === 'hold' ? 1.3 : 0.8;
        const duration = phase === 'inhale' ? 4000 : phase === 'hold' ? 7000 : 8000;

        Animated.timing(scaleAnim, {
            toValue,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, [phase, isActive]);

    const handleReset = () => {
        setIsActive(false);
        setPhase('inhale');
        setTimeLeft(4);
        setCycleCount(0);
        scaleAnim.setValue(1);
    };

    const phaseColors = {
        inhale: '#22d3ee',
        hold: '#818cf8',
        exhale: '#a78bfa',
    };

    const phaseLabels = {
        inhale: 'Вдох',
        hold: 'Задержка',
        exhale: 'Выдох',
    };

    return (
        <View style={styles.breathingContainer}>
            <View style={styles.breathingHeader}>
                <Wind size={22} color="#22d3ee" />
                <Text style={[styles.breathingTitle, { color: colors.text }]}>Дыхание 4-7-8</Text>
            </View>

            <View style={styles.circleWrapper}>
                {/* Glow */}
                <Animated.View style={[
                    styles.breathGlow,
                    {
                        backgroundColor: phaseColors[phase],
                        opacity: isActive ? 0.15 : 0.05,
                        transform: [{ scale: scaleAnim }],
                    }
                ]} />

                {/* Ring */}
                <Animated.View style={[
                    styles.breathRing,
                    {
                        borderColor: isActive ? phaseColors[phase] : colors.border,
                        transform: [{ scale: scaleAnim }],
                    }
                ]} />

                {/* Center Text */}
                <View style={styles.breathCenter}>
                    <Text style={[styles.breathPhase, { color: colors.subtext }]}>
                        {isActive ? phaseLabels[phase] : 'Готов?'}
                    </Text>
                    <Text style={[styles.breathTimer, { color: colors.text }]}>{timeLeft}</Text>
                </View>
            </View>

            <View style={styles.breathBtns}>
                <TouchableOpacity
                    onPress={() => setIsActive(!isActive)}
                    style={[styles.breathMainBtn, { backgroundColor: colors.text }]}
                >
                    {isActive ? (
                        <Pause size={20} color={colors.background} />
                    ) : (
                        <Play size={20} color={colors.background} />
                    )}
                    <Text style={[styles.breathMainBtnText, { color: colors.background }]}>
                        {isActive ? 'Пауза' : 'Начать'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleReset}
                    style={[styles.breathResetBtn, { backgroundColor: colors.surface }]}
                >
                    <RotateCcw size={20} color={colors.subtext} />
                </TouchableOpacity>
            </View>

            <Text style={[styles.breathCycles, { color: colors.subtext }]}>
                Циклов: {cycleCount}
            </Text>
        </View>
    );
};

// ============ DATA ============
const articles = [
    {
        id: 1, title: 'Энергия — как её сохранить на весь день', tag: 'Энергия',
        summary: 'Правило 90 минут, правильное питание, дыхание для заряда.',
        content: 'Мозг работает циклами по 90 минут. После каждого — перерыв 5-10 мин. Утром ешь овсянку и яйца (медленные углеводы), избегай чипсы и газировку до 16:00. Когда устал — дыхание 4-7-8: вдох 4с, задержка 7с, выдох 8с, повтори 4 раза. Ходи 10 000 шагов в день. Сон 7-9 часов — главный источник энергии.',
    },
    {
        id: 2, title: 'Сон — суперсила для мозга', tag: 'Здоровье',
        summary: 'Каждый час сна = +10% к концентрации.',
        content: 'Во сне мозг закрепляет знания дня. Идеальный режим: 22:00-23:00 отбой, 6:00-7:00 подъём. Если не спится — ритуал: 30 мин без гаджетов, горячий душ, чтение. Если не уснул за 20 мин — встань, почитай, вернись. Темнота и прохлада (18-20°C) — лучшие друзья сна.',
    },
    {
        id: 3, title: 'Настроение — как им управлять', tag: 'Психология',
        summary: '5 приёмов смены настроения за 5 минут.',
        content: '1. Дыхание 4-4-4: вдох, задержка, выдох по 4 секунды. 2. Смена позы: выпрями спину, расправь плечи (+20% уверенности). 3. Звук природы: шум дождя или леса. 4. Движение: 10 приседаний или танец. 5. Благодарность: запиши 3 вещи, за которые благодарен.',
    },
    {
        id: 4, title: 'Учеба без выгорания', tag: 'Учеба',
        summary: '80% школьников выгорают к концу четверти.',
        content: 'Правило 52/17: 52 мин работы, 17 мин отдыха. Таймблокинг: Математика 17:00-17:52, Английский 18:10-19:02. Награда: после блока — 10 мин TikTok. Один полный день без учебников каждую неделю.',
    },
    {
        id: 5, title: 'Соцсети — как не тонуть в скролле', tag: 'Цифровой Детокс',
        summary: 'Соцсети крадут 3+ часа в день.',
        content: 'Таймер на приложения (30 мин/день). Утро без телефона до 9:00. "Дофаминовый детокс" — 1 день в неделю без соцсетей. Убери подписки, которые не вдохновляют.',
    },
    {
        id: 6, title: 'Друзья и конфликты', tag: 'Отношения',
        summary: '5 шагов разрешения конфликтов.',
        content: '1. Пауза 24 часа: остынь, не пиши сгоряча. 2. Я-высказывания: "Мне грустно, когда..." вместо "Ты всегда...". 3. Слушай 2 минуты, не перебивай. 4. Общая цель: "Давай не ссориться из-за ерунды". 5. Восстановление связи.',
    },
    {
        id: 7, title: 'ЕНТ без паники', tag: 'Экзамены',
        summary: 'ЕНТ — не конец света.',
        content: 'Правило 80/20: учи "золотые темы". Тренировки по таймеру: 25 мин тест → 5 мин отдых. Метод "Двоечника": сначала 70% легких заданий, трудные в конце. Перед экзаменом спи 8 часов.',
    },
    {
        id: 8, title: 'Прокрастинация — как начать', tag: 'Продуктивность',
        summary: '5 приёмов для начала работы.',
        content: 'Правило 5 секунд: 5-4-3-2-1 → ВСТАВАЙ! "Сделаю только 2 минуты" — 90% продолжат дальше. «Съешь лягушку»: самое сложное — первым делом утром.',
    },
    {
        id: 9, title: 'Тревога перед контрольной', tag: 'Психология',
        summary: 'Анти-тревожный протокол за 10 минут.',
        content: '1 мин — Дыхание 4-7-8. 2 мин — Поза силы (руки на бока, грудь вперед). 3 мин — Запиши 3 факта "Я знаю материал". 2 мин — Жвачка (+40% крови к мозгу).',
    },
];

const videos = [
    { id: 'stress1', title: 'Психология: Стресс', author: 'Диана Старунская', videoId: 'OpUN63HAmSo', cat: 'Стресс' },
    { id: 'stress2', title: 'Как побороть школьный стресс?', author: 'Психология', videoId: 'g5cuGaRbt3k', cat: 'Стресс' },
    { id: 'mot1', title: 'Мотивация на учебу за 9 мин', author: 'Блогер', videoId: '8J6iZkUCmiI', cat: 'Мотивация' },
    { id: 'mot2', title: 'Как заставить себя учиться?', author: 'Советы', videoId: 'g67tmlv9k4s', cat: 'Мотивация' },
    { id: 'sleep', title: 'Здоровый сон подростка', author: 'Врач-сомнолог', videoId: 'HqGjWYaWX1Y', cat: 'Здоровье' },
    { id: 'proc', title: 'Прокрастинация. Что делать?', author: 'Психолог', videoId: 'QaZFayzPoVg', cat: 'Учеба' },
    { id: 'gen', title: '8 Советов Подросткам', author: 'Психология', videoId: '6HbzQT111-k', cat: 'Общее' },
];

const meditations = [
    { id: 'm1', title: '5-мин медитация от стресса', author: 'Заземление', videoId: 'Nc4AXkNTfCs', time: '5 мин' },
    { id: 'm2', title: 'Медитация для детей', author: 'Спокойствие', videoId: 'FRNXuYg-dxU', time: '5 мин' },
    { id: 'm3', title: 'Медитация на ночь', author: 'Сон', videoId: 'elNw_BOE2Rg', time: '10 мин' },
    { id: 'm4', title: 'Дыхательная гимнастика', author: 'Для перемен', videoId: 'W6nFGRliGKM', time: '5 мин' },
];

// ============ MAIN SCREEN ============
type ResourceTab = 'articles' | 'videos' | 'meditation' | 'breathing';

export default function ResourcesScreen() {
    const { colors } = useTheme();
    const [activeTab, setActiveTab] = useState<ResourceTab>('articles');
    const [selectedArticle, setSelectedArticle] = useState<any>(null);

    const openYoutube = (videoId: string) => {
        Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
    };

    const tabItems: { key: ResourceTab; icon: any; label: string }[] = [
        { key: 'articles', icon: BookOpen, label: 'Статьи' },
        { key: 'videos', icon: Play, label: 'Видео' },
        { key: 'meditation', icon: Music, label: 'Медитации' },
        { key: 'breathing', icon: Wind, label: 'Дыхание' },
    ];

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <BookOpen size={24} color={colors.accent} />
                    <Text style={[styles.title, { color: colors.text }]}>Библиотека Ресурсов</Text>
                </View>

                {/* Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
                    <View style={styles.tabRow}>
                        {tabItems.map(tab => {
                            const active = activeTab === tab.key;
                            return (
                                <TouchableOpacity
                                    key={tab.key}
                                    onPress={() => { setActiveTab(tab.key); setSelectedArticle(null); }}
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

                {/* ============ ARTICLES ============ */}
                {activeTab === 'articles' && !selectedArticle && (
                    <>
                        {articles.map(article => (
                            <TouchableOpacity
                                key={article.id}
                                onPress={() => setSelectedArticle(article)}
                                activeOpacity={0.7}
                            >
                                <Card style={styles.articleCard}>
                                    <View style={[styles.articleTagBadge, { backgroundColor: colors.accent + '15' }]}>
                                        <Text style={[styles.articleTag, { color: colors.accent }]}>{article.tag}</Text>
                                    </View>
                                    <Text style={[styles.articleTitle, { color: colors.text }]}>{article.title}</Text>
                                    <Text style={[styles.articleSummary, { color: colors.subtext }]} numberOfLines={2}>
                                        {article.summary}
                                    </Text>
                                    <View style={styles.readMore}>
                                        <Text style={[styles.readMoreText, { color: colors.accent }]}>Читать</Text>
                                        <ChevronRight size={14} color={colors.accent} />
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                {/* Article Detail */}
                {activeTab === 'articles' && selectedArticle && (
                    <View>
                        <TouchableOpacity
                            onPress={() => setSelectedArticle(null)}
                            style={styles.backToList}
                        >
                            <ArrowLeft size={16} color={colors.subtext} />
                            <Text style={[styles.backToListText, { color: colors.subtext }]}>Назад</Text>
                        </TouchableOpacity>
                        <View style={[styles.articleTagBadge, { backgroundColor: colors.accent + '15', alignSelf: 'flex-start' }]}>
                            <Text style={[styles.articleTag, { color: colors.accent }]}>{selectedArticle.tag}</Text>
                        </View>
                        <Text style={[styles.articleDetailTitle, { color: colors.text }]}>
                            {selectedArticle.title}
                        </Text>
                        <Text style={[styles.articleDetailContent, { color: colors.subtext }]}>
                            {selectedArticle.content}
                        </Text>
                    </View>
                )}

                {/* ============ VIDEOS ============ */}
                {activeTab === 'videos' && (
                    <>
                        {videos.map(video => (
                            <TouchableOpacity
                                key={video.id}
                                onPress={() => openYoutube(video.videoId)}
                                activeOpacity={0.7}
                            >
                                <Card style={styles.videoCard}>
                                    <View style={styles.videoRow}>
                                        <View style={[styles.videoThumb, { backgroundColor: colors.surface }]}>
                                            <Image
                                                source={{ uri: `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg` }}
                                                style={styles.videoThumbImg}
                                            />
                                            <View style={styles.videoPlayOverlay}>
                                                <View style={[styles.videoPlayBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                                                    <Play size={16} color="#fff" />
                                                </View>
                                            </View>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.videoCat, { color: colors.accent }]}>{video.cat}</Text>
                                            <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>
                                                {video.title}
                                            </Text>
                                            <Text style={[styles.videoAuthor, { color: colors.subtext }]}>
                                                {video.author}
                                            </Text>
                                        </View>
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                {/* ============ MEDITATIONS ============ */}
                {activeTab === 'meditation' && (
                    <>
                        {meditations.map(m => (
                            <TouchableOpacity
                                key={m.id}
                                onPress={() => openYoutube(m.videoId)}
                                activeOpacity={0.7}
                            >
                                <Card style={styles.medCard}>
                                    <View style={styles.medRow}>
                                        <View style={[styles.medIcon, { backgroundColor: '#818cf8' + '20' }]}>
                                            <Music size={22} color="#818cf8" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.medTitle, { color: colors.text }]}>{m.title}</Text>
                                            <View style={styles.medMeta}>
                                                <Text style={[styles.medTime, { color: colors.subtext }]}>{m.time}</Text>
                                                <Text style={[styles.medDot, { color: colors.subtext }]}>•</Text>
                                                <Text style={[styles.medAuthor, { color: colors.subtext }]}>{m.author}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.medPlayBtn, { backgroundColor: colors.surface }]}>
                                            <Play size={16} color={colors.accent} />
                                        </View>
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                {/* ============ BREATHING ============ */}
                {activeTab === 'breathing' && (
                    <>
                        <BreathingWidget />
                        <Card style={styles.breathInfo}>
                            <Text style={[styles.breathInfoTitle, { color: colors.text }]}>О технике 4-7-8</Text>
                            <Text style={[styles.breathInfoText, { color: colors.subtext }]}>
                                Вдох через нос (4 сек) → Задержка (7 сек) → Выдох ртом (8 сек).
                                Эффективно снижает уровень кортизола и успокаивает нервную систему перед экзаменом или сном.
                            </Text>
                        </Card>
                    </>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '700' },

    // Tabs
    tabScroll: { marginBottom: 20 },
    tabRow: { flexDirection: 'row', gap: 8 },
    tabBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1,
    },
    tabText: { fontSize: 13, fontWeight: '600' },

    // Articles
    articleCard: { marginBottom: 12 },
    articleTagBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
    articleTag: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    articleTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
    articleSummary: { fontSize: 13, lineHeight: 20, marginBottom: 10 },
    readMore: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    readMoreText: { fontSize: 13, fontWeight: '600' },

    // Article Detail
    backToList: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
    backToListText: { fontSize: 14, fontWeight: '600' },
    articleDetailTitle: { fontSize: 26, fontWeight: '700', marginTop: 8, marginBottom: 16, lineHeight: 34 },
    articleDetailContent: { fontSize: 15, lineHeight: 24 },

    // Videos
    videoCard: { marginBottom: 12 },
    videoRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
    videoThumb: {
        width: 100, height: 64, borderRadius: 10, overflow: 'hidden', position: 'relative',
    },
    videoThumbImg: { width: '100%', height: '100%' },
    videoPlayOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center', alignItems: 'center',
    },
    videoPlayBtn: {
        width: 32, height: 32, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
    },
    videoCat: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    videoTitle: { fontSize: 14, fontWeight: '600', marginTop: 2 },
    videoAuthor: { fontSize: 11, marginTop: 3 },

    // Meditations
    medCard: { marginBottom: 12 },
    medRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    medIcon: {
        width: 52, height: 52, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
    },
    medTitle: { fontSize: 15, fontWeight: '600' },
    medMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    medTime: { fontSize: 12 },
    medDot: { fontSize: 12 },
    medAuthor: { fontSize: 12 },
    medPlayBtn: {
        width: 38, height: 38, borderRadius: 19,
        alignItems: 'center', justifyContent: 'center',
    },

    // Breathing
    breathingContainer: { alignItems: 'center', paddingVertical: 20 },
    breathingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 30 },
    breathingTitle: { fontSize: 22, fontWeight: '700' },
    circleWrapper: {
        width: 200, height: 200,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 30,
    },
    breathGlow: {
        position: 'absolute', width: 200, height: 200, borderRadius: 100,
    },
    breathRing: {
        position: 'absolute', width: 180, height: 180, borderRadius: 90,
        borderWidth: 3,
    },
    breathCenter: { alignItems: 'center' },
    breathPhase: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
    breathTimer: { fontSize: 48, fontWeight: '700' },
    breathBtns: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    breathMainBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 28, paddingVertical: 14, borderRadius: 30,
    },
    breathMainBtnText: { fontSize: 16, fontWeight: '700' },
    breathResetBtn: {
        width: 48, height: 48, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center',
    },
    breathCycles: { fontSize: 12, fontWeight: '500' },
    breathInfo: { marginTop: 20 },
    breathInfoTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
    breathInfoText: { fontSize: 14, lineHeight: 22 },
});
