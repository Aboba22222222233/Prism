import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getChatResponse } from '../lib/ai';
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
            content: `Hi, ${userProfile?.full_name?.split(' ')[0] || 'friend'}! I'm Cloudik, your AI mentor. I can give advice, explain something difficult, or help you think through how you're feeling. What's on your mind?`
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
                `${i + 1}. ${new Date(c.created_at).toLocaleDateString('en-US')}: Mood ${c.mood_score}/5, Sleep ${c.sleep_hours || '?'}h, Energy ${c.energy_level || '?'}/10${c.comment ? `, Note: "${c.comment}"` : ''}${c.factors?.length ? `, Factors: ${c.factors.join(', ')}` : ''}`
            ).join('\n') || 'No entries';

            const contextSystemMsg = {
                role: 'system' as const,
                content: `You are Cloudik, a supportive mentor for a student.

                STRICT RESPONSE RULES:
                - Respond only in English
                - Do not use Markdown, tables, or bullet lists
                - Write in plain text only
                - Keep each answer to 2-3 sentences maximum
                - Be warm, supportive, and concise

                Student: ${userProfile?.full_name || 'Student'}.

                Recent entries:
                ${checkinsContext}

                Current state: Mood ${studentStats?.avgMood || '?'}/5, Energy ${studentStats?.energyAvg || '?'}, Sleep ${studentStats?.sleepAvg || '?'}.

                Give short personalized advice based on the data.`
            };

            const history = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));

            const fullConversation = [contextSystemMsg, ...history, userMsg];

            const response = await getChatResponse(fullConversation);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: typeof response === 'string' ? response : response?.content || 'No response',
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'A connection error occurred. Please try again.',
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
        <Modal visible={true} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top']}>
                    <KeyboardAvoidingView
                        style={[styles.container]}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    >
                        {/* Header */}
                        <View style={[styles.header, { borderBottomColor: colors.border }]}>
                            <View style={[styles.headerAvatar, { backgroundColor: colors.accent + '20' }]}>
                                <Bot size={22} color={colors.accent} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.headerTitle, { color: colors.text }]}>Cloudik</Text>
                                <Text style={[styles.headerSub, { color: colors.subtext }]}>your AI mentor</Text>
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
                                placeholder="Ask Cloudik..."
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
                            AI can make mistakes. Verify important information.
                        </Text>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContainer: { height: '90%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
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
