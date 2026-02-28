
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Bot, X, Send } from 'lucide-react-native';
import { getChatResponse } from '../lib/gemini';
import { useTheme } from '../context/ThemeContext';

interface TeacherMentorChatProps {
    teacherName?: string;
    visible: boolean;
    onClose: () => void;
}

const MODELS = [
    { id: "qwen/qwen3-235b-a22b-thinking-2507", name: "Qwen 2.5 (Smart)" },
    { id: "openai/gpt-oss-120b:free", name: "GPT-OSS 120B" },
    { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B" },
];

export const TeacherMentorChat: React.FC<TeacherMentorChatProps> = ({ teacherName, visible, onClose }) => {
    const { colors } = useTheme();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
    const [messages, setMessages] = useState<any[]>([
        {
            role: 'assistant',
            content: `Здравствуйте, коллега! Я ваш педагогический ассистент. Готов помочь с анализом класса, идеями для уроков или составлением плана. Чем могу быть полезен?`
        }
    ]);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (visible) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [visible, messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const contextSystemMsg = {
                role: 'system',
                content: `Ты - опытный педагогический ассистент для учителя.
                Твой коллега: ${teacherName || 'Учитель'}.
                Отвечай кратко, по делу и на русском языке.
                Не используй markdown таблицы, пиши простым текстом.`
            };

            const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
            const fullConversation = [contextSystemMsg, ...history, userMsg];

            const response = await getChatResponse(fullConversation, selectedModel);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.content,
            }]);

        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Извините, коллега, возникла ошибка связи.",
                isError: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.surface }]}>
                        <View style={styles.headerTitle}>
                            <View style={[styles.avatar, { borderColor: colors.accent }]}>
                                <Bot size={20} color={colors.accent} />
                            </View>
                            <View>
                                <Text style={[styles.title, { color: colors.text }]}>Пед. Ассистент</Text>
                                <Text style={[styles.subtitle, { color: colors.subtext }]}>{MODELS.find(m => m.id === selectedModel)?.name}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Messages */}
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(_, i) => i.toString()}
                        contentContainerStyle={styles.messagesList}
                        renderItem={({ item }) => (
                            <View style={[
                                styles.messageRow,
                                item.role === 'user' ? styles.userRow : styles.botRow
                            ]}>
                                {item.role !== 'user' && (
                                    <View style={[styles.msgAvatar, { backgroundColor: colors.surface }]}>
                                        <Bot size={16} color={colors.accent} />
                                    </View>
                                )}
                                <View style={[
                                    styles.bubble,
                                    item.role === 'user'
                                        ? { backgroundColor: colors.accent }
                                        : { backgroundColor: colors.surface },
                                    item.isError && { backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: 'red' }
                                ]}>
                                    <Text style={[
                                        styles.msgText,
                                        item.role === 'user' ? { color: '#fff' } : { color: colors.text }
                                    ]}>
                                        {item.content}
                                    </Text>
                                </View>
                            </View>
                        )}
                    />

                    {/* Input */}
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        <View style={[styles.inputArea, { borderTopColor: colors.surface, backgroundColor: colors.background }]}>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                                value={input}
                                onChangeText={setInput}
                                placeholder="Спросите совет..."
                                placeholderTextColor={colors.subtext}
                                onSubmitEditing={handleSend}
                            />
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={loading || !input.trim()}
                                style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.accent : colors.surface }]}
                            >
                                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Send size={20} color={input.trim() ? '#fff' : colors.subtext} />}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    container: { height: '85%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(139, 92, 246, 0.1)' },
    title: { fontSize: 18, fontWeight: '700' },
    subtitle: { fontSize: 12 },
    closeBtn: { padding: 4 },
    messagesList: { padding: 16, gap: 12 },
    messageRow: { flexDirection: 'row', gap: 8, maxWidth: '85%' },
    userRow: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
    botRow: { alignSelf: 'flex-start' },
    msgAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    bubble: { padding: 12, borderRadius: 16 },
    msgText: { fontSize: 15, lineHeight: 22 },
    inputArea: { flexDirection: 'row', padding: 16, gap: 10, borderTopWidth: 1 },
    input: { flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
