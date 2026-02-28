import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, ChevronDown, User, Bot, Brain, Sparkles, AlertCircle } from 'lucide-react';
import { getChatResponse } from '../lib/gemini';

interface MentorChatProps {
    userProfile: any;
    studentStats: any;
    recentCheckins?: any[]; // Последние 5 записей для контекста AI
}

const MODELS = [
    { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B (Groq)" },
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B" },
];

export const MentorChat: React.FC<MentorChatProps> = ({ userProfile, studentStats, recentCheckins = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
    const [messages, setMessages] = useState<any[]>([
        {
            role: 'assistant',
            content: `Привет, ${userProfile?.full_name?.split(' ')[0] || 'друг'}! Я Клаудик, твой ментор. Готов помочь советом или объяснить сложную тему. Что тебя волнует?`
        }
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Prepare context prompt with recent checkins
            const checkinsContext = recentCheckins.slice(0, 5).map((c, i) =>
                `${i + 1}. ${new Date(c.created_at).toLocaleDateString('ru-RU')}: Настр. ${c.mood_score}/5, Сон ${c.sleep_hours || '?'}ч, Энергия ${c.energy_level || '?'}/10${c.comment ? `, Заметка: "${c.comment}"` : ''}${c.factors?.length ? `, Факторы: ${c.factors.join(', ')}` : ''}`
            ).join('\n') || 'Нет записей';

            const contextSystemMsg = {
                role: 'system',
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
                
                Текущее состояние: Настроение ${studentStats?.mood || '?'}/5, Энергия ${studentStats?.energy || '?'}, Сон ${studentStats?.sleep || '?'}ч.
                
                Давай короткие персонализированные советы на основе данных.`
            };

            // Combine history (limit last 10 messages to save tokens)
            const history = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));

            const fullConversation = [contextSystemMsg, ...history, userMsg];

            const response = await getChatResponse(fullConversation, selectedModel);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.content,
                // Reasoning is intentionally hidden from UI as per user request
            }]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Извини, произошла ошибка связи. Попробуй еще раз или смени модель.",
                isError: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #475569;
                }
            `}</style>

            {/* Toggle Button */}
            {!isOpen && (
                <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-10 group">
                    <div className="bg-black text-white px-4 py-2 rounded-xl rounded-br-none shadow-lg mb-2 mr-4 text-sm font-bold transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none border border-white/10">
                        Совет от ментора 👈
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer border-2 border-white/20 overflow-hidden bg-black"
                    >
                        <img
                            src="https://user-gen-media-assets.s3.amazonaws.com/gemini_images/203c437d-ad6c-4cee-a764-6eb651b53ddc.png"
                            alt="Cloudik"
                            className="w-full h-full object-cover"
                        />
                    </button>
                </div>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-[#000000] border-l border-white/10 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                                <img
                                    src="https://user-gen-media-assets.s3.amazonaws.com/gemini_images/203c437d-ad6c-4cee-a764-6eb651b53ddc.png"
                                    alt="Cloudik"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Клаудик (твой ментор)</h3>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Model Selector */}
                    <div className="px-4 py-3 border-b border-white/10 bg-black">
                        <div className="relative">
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full bg-[#111] border border-white/10 rounded-lg py-2 pl-3 pr-8 text-sm text-slate-300 focus:outline-none focus:border-purple-500 appearance-none cursor-pointer hover:bg-[#222] transition-colors"
                            >
                                {MODELS.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 custom-scrollbar bg-black">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${msg.role === 'user' ? 'bg-slate-800' : 'border border-white/10'}`}>
                                    {msg.role === 'user' ? (
                                        <User className="w-4 h-4 text-white" />
                                    ) : (
                                        <img
                                            src="https://user-gen-media-assets.s3.amazonaws.com/gemini_images/203c437d-ad6c-4cee-a764-6eb651b53ddc.png"
                                            alt="Cloudik"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                                <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`
                                        p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                                        ${msg.role === 'user'
                                            ? 'bg-[#222] text-white border border-white/10 rounded-tr-sm'
                                            : msg.isError
                                                ? 'bg-red-900/20 border border-red-500/30 text-red-200'
                                                : 'bg-[#111] border border-white/10 text-slate-300 rounded-tl-sm'
                                        }
                                    `}>
                                        {msg.content}
                                    </div>
                                    {/* Reasoning details HIDDEN as requested */}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                                    <img
                                        src="https://user-gen-media-assets.s3.amazonaws.com/gemini_images/203c437d-ad6c-4cee-a764-6eb651b53ddc.png"
                                        alt="Cloudik"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="bg-[#111] border border-white/10 p-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-black border-t border-white/10">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Спроси Клаудика..."
                                className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="absolute right-2 p-2 bg-white text-black rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-center text-[10px] text-slate-600 mt-2">
                            AI может совершать ошибки. Проверяйте важную информацию.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

