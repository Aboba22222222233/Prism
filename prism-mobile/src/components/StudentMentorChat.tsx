import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getChatResponse } from '../lib/gemini';
import { Send, User, Bot, X } from 'lucide-react-native';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    isError?: boolean;
}

interface StudentMentorChatProps {
    userProfile: any;
    studentStats: any;
    recentCheckins?: any[];
    onClose?: () => void;
}

export const StudentMentorChat: React.FC<StudentMentorChatProps> = ({
    userProfile, studentStats, recentCheckins = [], onClose
}) => {
    const { colors } = useTheme();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: `Привет, ${userProfile?.full_name?.split(' ')[0] || 'друг'}! Я Клаудик, твой ментор. Готов помочь советом или объяснить сложную тему. Что тебя волнует?`
        }
    ]);

    useEffect(() => {
        if (flatListRef.current && messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const checkinsContext = recentCheckins.slice(0, 5).map((c, i) =>
                `${i + 1}. ${new Date(c.created_at).toLocaleDateString('ru-RU')}: Настр. ${c.mood_score}/5, Сон ${c.sleep_hours || '?'}ч, Энергия ${c.energy_level || '?'}/10${c.comment ? `, Заметка: "${c.comment}"` : ''}${c.factors?.length ? `, Факторы: ${c.factors.join(', ')}` : ''}`
            ).join('\n') || 'Нет записей';

            const contextSystemMsg = {
                role: 'system' as const,
                content: `Ты - Клаудик, поддерживающий ментор для студента.
                
                СТРОГИЕ ПРАВИЛА ФОРМАТИРОВАНИЯ:
                - Отвечай ТОЛЬКО на русском языке
                - НЕ используй Markdown: никаких **, ##, |, таблиц
                - НЕ используй китайские/японские символы и странные скобки
                - Пиши простым текстом без форматирования
                - Максимум 2-3 предложения на ответ
                - Будь кратким, тёплым и дружелюбным
                
                Ученик: ${userProfile?.full_name || 'Студент'}.
                
                Последние записи:
                ${checkinsContext}
                
                Текущее состояние: Настроение ${studentStats?.avgMood || '?'}/5, Энергия ${studentStats?.energyAvg || '?'}, Сон ${studentStats?.sleepAvg || '?'}.
                
                Давай короткие персонализированные советы на основе данных.`
            };

            const history = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));

            const fullConversation = [contextSystemMsg, ...history, userMsg];

            const response = await getChatResponse(fullConversation);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: typeof response === 'string' ? response : response?.content || 'Нет ответа',
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Извини, произошла ошибка связи. Попробуй еще раз.',
                isError: true,
            }]);
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';
        return (
            <View style={[styles.msgRow, isUser && styles.msgRowReversed]}>
                <View style={[
                    styles.avatar,
                    {
                        backgroundColor: isUser ? colors.surface : colors.accent + '20',
                        borderColor: colors.border,
                    }
                ]}>
                    {isUser ? (
                        <User size={16} color={colors.text} />
                    ) : (
                        <Bot size={16} color={colors.accent} />
                    )}
                </View>
                <View style={[
                    styles.bubble,
                    isUser ? {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderTopRightRadius: 4,
                    } : {
                        backgroundColor: item.isError ? '#7f1d1d30' : colors.accent + '12',
                        borderColor: item.isError ? '#ef4444' + '40' : colors.accent + '25',
                        borderTopLeftRadius: 4,
                    }
                ]}>
                    <Text style={[
                        styles.bubbleText,
                        { color: item.isError ? '#fca5a5' : colors.text }
                    ]}>
                        {item.content}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={100}
        >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={[styles.headerAvatar, { backgroundColor: colors.accent + '20' }]}>
                    <Bot size={22} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Клаудик</Text>
                    <Text style={[styles.headerSub, { color: colors.subtext }]}>твой ментор</Text>
                </View>
                {onClose && (
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X size={22} color={colors.subtext} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(_, idx) => String(idx)}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Typing Indicator */}
            {loading && (
                <View style={[styles.typingRow]}>
                    <View style={[styles.avatar, { backgroundColor: colors.accent + '20', borderColor: colors.border }]}>
                        <Bot size={16} color={colors.accent} />
                    </View>
                    <View style={[styles.typingBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.dotsRow}>
                            <View style={[styles.typingDot, { backgroundColor: colors.subtext }]} />
                            <View style={[styles.typingDot, { backgroundColor: colors.subtext, opacity: 0.7 }]} />
                            <View style={[styles.typingDot, { backgroundColor: colors.subtext, opacity: 0.4 }]} />
                        </View>
                    </View>
                </View>
            )}

            {/* Input */}
            <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
                <TextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder="Спроси Клаудика..."
                    placeholderTextColor={colors.subtext}
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                    style={[styles.input, {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.text,
                    }]}
                />
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={!input.trim() || loading}
                    style={[
                        styles.sendBtn,
                        {
                            backgroundColor: input.trim() ? colors.accent : colors.surface,
                            opacity: input.trim() && !loading ? 1 : 0.5,
                        }
                    ]}
                >
                    <Send size={18} color={input.trim() ? '#fff' : colors.subtext} />
                </TouchableOpacity>
            </View>

            <Text style={[styles.disclaimer, { color: colors.subtext }]}>
                AI может совершать ошибки. Проверяйте важную информацию.
            </Text>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1,
    },
    headerAvatar: {
        width: 42, height: 42, borderRadius: 21,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 17, fontWeight: '700' },
    headerSub: { fontSize: 12 },
    closeBtn: { padding: 8 },
    messagesList: { padding: 16, gap: 12 },
    msgRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
    msgRowReversed: { flexDirection: 'row-reverse' },
    avatar: {
        width: 32, height: 32, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1,
    },
    bubble: {
        maxWidth: '78%', padding: 12, borderRadius: 18, borderWidth: 1,
    },
    bubbleText: { fontSize: 14, lineHeight: 20 },
    typingRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 8, alignItems: 'flex-end' },
    typingBubble: {
        padding: 14, borderRadius: 18, borderWidth: 1,
    },
    dotsRow: { flexDirection: 'row', gap: 4 },
    typingDot: { width: 8, height: 8, borderRadius: 4 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1,
    },
    input: {
        flex: 1, borderWidth: 1, borderRadius: 14,
        paddingHorizontal: 16, paddingVertical: 12, fontSize: 14,
    },
    sendBtn: {
        width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
    },
    disclaimer: {
        textAlign: 'center', fontSize: 10, paddingBottom: 8, paddingTop: 2,
    },
});
