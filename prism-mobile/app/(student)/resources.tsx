import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    Linking, ActivityIndicator, Animated, Easing, Image,
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import {
    Wind, BookOpen, MusicNote as Music, Play, Pause, ArrowCounterClockwise as RotateCcw,
    CaretRight as ChevronRight, ArrowLeft,
} from 'phosphor-react-native';

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
        inhale: 'Inhale',
        hold: 'Hold',
        exhale: 'Exhale',
    };

    return (
        <View style={styles.breathingContainer}>
            <View style={styles.breathingHeader}>
                <Wind size={22} color="#22d3ee" />
                <Text style={[styles.breathingTitle, { color: colors.text }]}>4-7-8 Breathing</Text>
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
                        {isActive ? phaseLabels[phase] : 'Ready?'}
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
                        {isActive ? 'Pause' : 'Start'}
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
                Cycles: {cycleCount}
            </Text>
        </View>
    );
};

// ============ DATA ============
const articles = [
    {
        id: 1, title: 'Energy: How to Keep It All Day', tag: 'Energy',
        summary: 'The 90-minute rule, better nutrition, and breathing for a reset.',
        content: 'Your brain works in 90-minute cycles. After each cycle, take a 5-10 minute break: stand up, walk, and look away from a screen. In the morning, choose oatmeal and eggs for steady energy, and avoid chips or soda before 4 PM. When you feel tired, use 4-7-8 breathing for four rounds. Aim for 10,000 steps a day and 7-9 hours of sleep.',
    },
    {
        id: 2, title: 'Sleep: A Superpower for the Brain', tag: 'Health',
        summary: 'Every hour of sleep can improve focus by around 10%.',
        content: 'Sleep helps your brain lock in what you learned during the day. A strong routine is lights out around 10-11 PM and waking up around 6-7 AM. If you cannot sleep, try 30 minutes without devices, a warm shower, or reading. If you are still awake after 20 minutes, get up, read quietly, and return later. Darkness and a cool room help.',
    },
    {
        id: 3, title: 'Mood: How to Reset It', tag: 'Psychology',
        summary: 'Five ways to shift your mood in five minutes.',
        content: '1. Try 4-4-4 breathing: inhale, hold, exhale for 4 seconds each. 2. Change your posture: straighten your back and shoulders. 3. Listen to nature sounds like rain or forest ambience. 4. Move your body with 10 squats or a short dance. 5. Write down 3 things you feel grateful for.',
    },
    {
        id: 4, title: 'Study Without Burnout', tag: 'Study',
        summary: 'Many students feel burned out by the end of a term.',
        content: 'Use the 52/17 rule: 52 minutes of focused work and 17 minutes of rest. Time-block subjects instead of mixing everything at once. Give yourself a short reward after each block, and keep one lighter day each week.',
    },
    {
        id: 5, title: 'Social Media: How Not to Drown in the Scroll', tag: 'Digital Detox',
        summary: 'Social media can take more than 3 hours a day.',
        content: 'Set app timers to 30 minutes a day. Keep mornings phone-free until 9 AM. Try one social-free day a week, and unfollow accounts that leave you drained.',
    },
    {
        id: 6, title: 'Friends and Conflict', tag: 'Relationships',
        summary: 'Five steps for handling conflict.',
        content: '1. Pause for 24 hours before reacting. 2. Use I-statements such as "I feel upset when..." instead of "You always...". 3. Listen for two minutes without interrupting. 4. Focus on a shared goal. 5. Repair the connection after the conflict.',
    },
    {
        id: 7, title: 'Exams Without Panic', tag: 'Exams',
        summary: 'Major exams are not the end of the world.',
        content: 'Use the 80/20 rule and focus on the highest-value topics. Practice in 25-minute timed blocks with 5-minute breaks. Start with easier questions first, then move to harder ones. Before an exam, protect your sleep.',
    },
    {
        id: 8, title: 'Procrastination: How to Start', tag: 'Productivity',
        summary: 'Five ways to get started.',
        content: 'Use the 5-second rule to start moving. Tell yourself you will work for just two minutes; most people keep going. Tackle the hardest task first when your energy is highest.',
    },
    {
        id: 9, title: 'Anxiety Before a Test', tag: 'Psychology',
        summary: 'A 10-minute anti-anxiety reset.',
        content: '1 minute of 4-7-8 breathing. 2 minutes of a strong posture. 3 minutes writing down 3 facts that prove you know the material. 2 minutes of chewing gum or a quick physical reset.',
    },
];

const videos = [
    { id: 'stress1', title: 'Psychology: Stress', author: 'Diana Starunskaya', videoId: 'OpUN63HAmSo', cat: 'Stress' },
    { id: 'stress2', title: 'How to Beat School Stress?', author: 'Psychology', videoId: 'g5cuGaRbt3k', cat: 'Stress' },
    { id: 'mot1', title: 'Study Motivation in 9 Minutes', author: 'Creator', videoId: '8J6iZkUCmiI', cat: 'Motivation' },
    { id: 'mot2', title: 'How to Make Yourself Study?', author: 'Tips', videoId: 'g67tmlv9k4s', cat: 'Motivation' },
    { id: 'sleep', title: 'Healthy Sleep for Teens', author: 'Sleep Doctor', videoId: 'HqGjWYaWX1Y', cat: 'Health' },
    { id: 'proc', title: 'Procrastination: What to Do?', author: 'Psychologist', videoId: 'QaZFayzPoVg', cat: 'Study' },
    { id: 'gen', title: '8 Tips for Teens', author: 'Psychology', videoId: '6HbzQT111-k', cat: 'General' },
];

const meditations = [
    { id: 'm1', title: '5-Minute Stress Meditation', author: 'Grounding', videoId: 'Nc4AXkNTfCs', time: '5 min' },
    { id: 'm2', title: 'Meditation for Kids', author: 'Calm', videoId: 'FRNXuYg-dxU', time: '5 min' },
    { id: 'm3', title: 'Night Meditation', author: 'Sleep', videoId: 'elNw_BOE2Rg', time: '10 min' },
    { id: 'm4', title: 'Breathing Practice', author: 'For Break Time', videoId: 'W6nFGRliGKM', time: '5 min' },
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
        { key: 'articles', icon: BookOpen, label: 'Articles' },
        { key: 'videos', icon: Play, label: 'Videos' },
        { key: 'meditation', icon: Music, label: 'Meditations' },
        { key: 'breathing', icon: Wind, label: 'Breathing' },
    ];

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <BookOpen size={24} color={colors.accent} />
                    <Text style={[styles.title, { color: colors.text }]}>Resource Library</Text>
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
                                        <Text style={[styles.readMoreText, { color: colors.accent }]}>Read</Text>
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
                            <Text style={[styles.backToListText, { color: colors.subtext }]}>Back</Text>
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
                            <Text style={[styles.breathInfoTitle, { color: colors.text }]}>About the 4-7-8 Method</Text>
                            <Text style={[styles.breathInfoText, { color: colors.subtext }]}>
                                Inhale through the nose (4 sec) → Hold (7 sec) → Exhale through the mouth (8 sec).
                                This technique helps lower cortisol and calm the nervous system before sleep or an exam.
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

