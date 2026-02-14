import React, { useState } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    TextInput, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import {
    ArrowLeft, ArrowRight, Smile, Frown, Meh, Sun,
    CloudRain, Moon, Zap, Check,
} from 'lucide-react-native';

const emotionsList = [
    '😌 Спокойствие', '😊 Радость', '😰 Тревога', '😴 Усталость',
    '😠 Злость', '✨ Вдохновение', '😢 Грусть', '😑 Скука',
    '🥰 Благодарность', '😤 Раздражение', '😔 Разочарование', '🤩 Восторг',
    '😟 Беспокойство', '💪 Уверенность', '🫣 Стеснение', '😶 Безразличие',
];

const categorizedFactors: Record<string, string[]> = {
    'Школа': ['Учеба', 'Экзамены', 'Учителя', 'Одноклассники', 'Домашнее задание'],
    'Отношения': ['Друзья', 'Семья', 'Любовь', 'Конфликт', 'Одиночество'],
    'Здоровье': ['Сон', 'Еда', 'Болезнь', 'Спорт', 'Усталость'],
    'Личное': ['Будущее', 'Хобби', 'Деньги', 'Погода', 'Новости'],
};

const moodEmojis = [
    { value: 1, Icon: Frown, color: '#ef4444', label: 'Плохо' },
    { value: 2, Icon: CloudRain, color: '#f97316', label: 'Не очень' },
    { value: 3, Icon: Meh, color: '#a1a1aa', label: 'Нормально' },
    { value: 4, Icon: Sun, color: '#22c55e', label: 'Хорошо' },
    { value: 5, Icon: Smile, color: '#ec4899', label: 'Отлично' },
];

export default function CheckInScreen() {
    const { classId, className } = useLocalSearchParams<{ classId: string; className: string }>();
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [mood, setMood] = useState(3);
    const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
    const [sleep, setSleep] = useState(7);
    const [energy, setEnergy] = useState(5);
    const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState('Школа');
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const toggleItem = (item: string, list: string[], setList: (l: string[]) => void) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (!user) throw new Error('Не авторизован');
            if (!classId) {
                Alert.alert('Ошибка', 'Не выбран класс!');
                router.back();
                return;
            }


            const { error } = await supabase.from('checkins').insert({
                user_id: user.id,
                class_id: classId,
                mood_score: mood,
                emotions: selectedEmotions,
                factors: selectedFactors,
                comment: comment,
                sleep_hours: sleep,
                energy_level: energy,
            });

            if (error) throw error;
            Alert.alert('Готово!', 'Запись сохранена ✓');
            router.back();
        } catch (err: any) {
            Alert.alert('Ошибка', err.message || 'Не удалось сохранить');
        } finally {
            setLoading(false);
        }
    };

    const currentMood = moodEmojis[mood - 1];

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Новая запись</Text>
                </View>

                {/* Progress Dots */}
                <View style={styles.dotsRow}>
                    {[1, 2, 3, 4].map(i => (
                        <View key={i} style={[
                            styles.dot,
                            { backgroundColor: step >= i ? colors.accent : colors.border }
                        ]} />
                    ))}
                </View>

                {/* Step 1: Mood */}
                {step === 1 && (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>Как ты сейчас?</Text>
                        <Text style={[styles.stepSubtitle, { color: colors.subtext }]}>
                            Выбери своё настроение
                        </Text>

                        <View style={styles.moodContainer}>
                            <View style={[styles.moodGlow, {
                                backgroundColor: currentMood.color,
                                opacity: 0.15,
                                transform: [{ scale: 0.8 + mood * 0.15 }]
                            }]} />
                            <currentMood.Icon size={80} color={currentMood.color} strokeWidth={1.5} />
                        </View>

                        <Text style={[styles.moodLabel, { color: currentMood.color }]}>
                            {currentMood.label}
                        </Text>

                        <View style={styles.moodSelector}>
                            {moodEmojis.map(m => (
                                <TouchableOpacity
                                    key={m.value}
                                    onPress={() => setMood(m.value)}
                                    style={[
                                        styles.moodBtn,
                                        {
                                            backgroundColor: mood === m.value ? m.color + '30' : colors.surface,
                                            borderColor: mood === m.value ? m.color : colors.border,
                                        }
                                    ]}
                                >
                                    <m.Icon size={24} color={mood === m.value ? m.color : colors.subtext} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Step 2: Emotions */}
                {step === 2 && (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>Что ты чувствуешь?</Text>
                        <Text style={[styles.stepSubtitle, { color: colors.subtext }]}>
                            Выбери подходящие эмоции
                        </Text>

                        <View style={styles.chipsGrid}>
                            {emotionsList.map(item => {
                                const selected = selectedEmotions.includes(item);
                                return (
                                    <TouchableOpacity
                                        key={item}
                                        onPress={() => toggleItem(item, selectedEmotions, setSelectedEmotions)}
                                        style={[
                                            styles.chip,
                                            {
                                                backgroundColor: selected ? colors.accent + '25' : colors.surface,
                                                borderColor: selected ? colors.accent : colors.border,
                                            }
                                        ]}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            { color: selected ? colors.accent : colors.subtext }
                                        ]}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Step 3: Sleep & Energy */}
                {step === 3 && (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>Физиология</Text>

                        {/* Sleep */}
                        <View style={[styles.sliderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={styles.sliderHeader}>
                                <View style={styles.sliderLabelRow}>
                                    <Moon size={18} color="#818cf8" />
                                    <Text style={[styles.sliderLabel, { color: colors.text }]}>Сон</Text>
                                </View>
                                <Text style={[styles.sliderValue, { color: colors.text }]}>{sleep} ч</Text>
                            </View>
                            <View style={styles.sliderTrack}>
                                {Array.from({ length: 13 }, (_, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => setSleep(i)}
                                        style={[
                                            styles.sliderDot,
                                            {
                                                backgroundColor: i <= sleep ? '#818cf8' : colors.border,
                                                width: i === sleep ? 18 : 10,
                                                height: i === sleep ? 18 : 10,
                                            }
                                        ]}
                                    />
                                ))}
                            </View>
                            <View style={styles.sliderLabels}>
                                <Text style={[styles.sliderMin, { color: colors.subtext }]}>0 ч</Text>
                                <Text style={[styles.sliderMin, { color: colors.subtext }]}>12 ч</Text>
                            </View>
                        </View>

                        {/* Energy */}
                        <View style={[styles.sliderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={styles.sliderHeader}>
                                <View style={styles.sliderLabelRow}>
                                    <Zap size={18} color="#facc15" />
                                    <Text style={[styles.sliderLabel, { color: colors.text }]}>Энергия</Text>
                                </View>
                                <Text style={[styles.sliderValue, { color: colors.text }]}>{energy}/10</Text>
                            </View>
                            <View style={styles.sliderTrack}>
                                {Array.from({ length: 10 }, (_, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => setEnergy(i + 1)}
                                        style={[
                                            styles.sliderDot,
                                            {
                                                backgroundColor: (i + 1) <= energy ? '#facc15' : colors.border,
                                                width: (i + 1) === energy ? 18 : 10,
                                                height: (i + 1) === energy ? 18 : 10,
                                            }
                                        ]}
                                    />
                                ))}
                            </View>
                            <View style={styles.sliderLabels}>
                                <Text style={[styles.sliderMin, { color: colors.subtext }]}>Мало</Text>
                                <Text style={[styles.sliderMin, { color: colors.subtext }]}>Много</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Step 4: Factors + Comment */}
                {step === 4 && (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>Что на это влияет?</Text>
                        <Text style={[styles.stepSubtitle, { color: colors.subtext }]}>
                            Выбери основные сферы
                        </Text>

                        {/* Category Tabs */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                            <View style={styles.catRow}>
                                {Object.keys(categorizedFactors).map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => setActiveCategory(cat)}
                                        style={[
                                            styles.catBtn,
                                            {
                                                backgroundColor: activeCategory === cat ? colors.text : 'transparent',
                                                borderColor: activeCategory === cat ? colors.text : colors.border,
                                            }
                                        ]}
                                    >
                                        <Text style={[
                                            styles.catBtnText,
                                            { color: activeCategory === cat ? colors.background : colors.subtext }
                                        ]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Factor Chips */}
                        <View style={styles.chipsGrid}>
                            {categorizedFactors[activeCategory]?.map(item => {
                                const selected = selectedFactors.includes(item);
                                return (
                                    <TouchableOpacity
                                        key={item}
                                        onPress={() => toggleItem(item, selectedFactors, setSelectedFactors)}
                                        style={[
                                            styles.chip,
                                            {
                                                backgroundColor: selected ? '#06b6d4' + '25' : colors.surface,
                                                borderColor: selected ? '#06b6d4' : colors.border,
                                            }
                                        ]}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            { color: selected ? '#06b6d4' : colors.subtext }
                                        ]}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Comment */}
                        <Text style={[styles.commentLabel, { color: colors.subtext }]}>
                            Личная заметка (необязательно)
                        </Text>
                        <TextInput
                            value={comment}
                            onChangeText={setComment}
                            placeholder="Сегодня я..."
                            placeholderTextColor={colors.subtext}
                            multiline
                            style={[styles.commentInput, {
                                backgroundColor: colors.inputBg,
                                borderColor: colors.border,
                                color: colors.text,
                            }]}
                        />
                    </View>
                )}

                {/* Navigation Footer */}
                <View style={styles.footer}>
                    {step > 1 && (
                        <TouchableOpacity
                            onPress={() => setStep(step - 1)}
                            style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border, flex: 1 }]}
                        >
                            <ArrowLeft size={18} color={colors.text} />
                            <Text style={[styles.navBtnText, { color: colors.text }]}>Назад</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        onPress={step < 4 ? () => setStep(step + 1) : handleSubmit}
                        disabled={loading}
                        style={[styles.navBtn, {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            flex: 1,
                        }]}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.text} />
                        ) : (
                            <>
                                <Text style={[styles.navBtnText, { color: colors.text }]}>
                                    {step === 4 ? 'Завершить' : 'Далее'}
                                </Text>
                                {step === 4 ? (
                                    <Check size={18} color={colors.text} />
                                ) : (
                                    <ArrowRight size={18} color={colors.text} />
                                )}
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: 20, paddingBottom: 40 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: '700' },
    dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    stepContainer: { flex: 1, minHeight: 400 },
    stepTitle: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
    stepSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 28 },

    // Mood
    moodContainer: {
        alignItems: 'center', justifyContent: 'center',
        height: 180, marginBottom: 16, position: 'relative',
    },
    moodGlow: {
        position: 'absolute', width: 160, height: 160, borderRadius: 80,
    },
    moodLabel: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
    moodSelector: {
        flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16,
    },
    moodBtn: {
        width: 52, height: 52, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5,
    },

    // Chips
    chipsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center',
    },
    chip: {
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1,
    },
    chipText: { fontSize: 14, fontWeight: '600' },

    // Sliders
    sliderCard: {
        borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 16,
    },
    sliderHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
    },
    sliderLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sliderLabel: { fontSize: 16, fontWeight: '600' },
    sliderValue: { fontSize: 22, fontWeight: '700' },
    sliderTrack: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 4, marginBottom: 8,
    },
    sliderDot: {
        borderRadius: 10,
    },
    sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
    sliderMin: { fontSize: 11, fontWeight: '500' },

    // Categories
    catScroll: { marginBottom: 16 },
    catRow: { flexDirection: 'row', gap: 8 },
    catBtn: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
    },
    catBtnText: { fontSize: 13, fontWeight: '700' },

    // Comment
    commentLabel: {
        fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
        letterSpacing: 1, marginTop: 24, marginBottom: 8, marginLeft: 4,
    },
    commentInput: {
        borderWidth: 1, borderRadius: 14, padding: 14,
        fontSize: 14, minHeight: 100, textAlignVertical: 'top',
    },

    // Footer
    footer: {
        flexDirection: 'row', gap: 12, marginTop: 28,
    },
    navBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingHorizontal: 20, paddingVertical: 14,
        borderRadius: 14, borderWidth: 1,
    },
    navBtnText: { fontSize: 15, fontWeight: '600' },
});
