import React, { useState, useEffect, useRef } from 'react';
import { X, PaperPlaneTilt as Send, ChatCircleText as MessageSquare, CaretDown as ChevronDown, User, Robot as Bot, Brain, Sparkle as Sparkles, WarningCircle as AlertCircle } from '@phosphor-icons/react';
import { getChatResponse } from '../lib/ai';

interface TeacherMentorChatProps {
    teacherName: string;
    classStats: {
        avgMood: number;
        riskCount: number;
        activeCount: number;
        totalStudents: number;
    };
    events?: any[];
    studentsData?: any[]; // Student data with recent check-ins
}

const MODELS = [
    { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B (Groq)" },
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B" },
];

export const TeacherMentorChat: React.FC<TeacherMentorChatProps> = ({ teacherName, classStats, events = [], studentsData = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
    const [messages, setMessages] = useState<any[]>([
        {
            role: 'assistant',
            content: `Hello. I am your AI assistant for class wellbeing support. I can help analyze the class, identify concerns, and suggest practical next steps. How can I help?`
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
            // Prepare students context (last 3 check-ins per student)
            const studentsContext = studentsData.slice(0, 10).map((s, i) => {
                const recentCheckins = (s.rawCheckins || []).slice(0, 3).map((c: any) =>
                    `  - ${new Date(c.created_at).toLocaleDateString('en-US')}: Mood ${c.mood_score}/5${c.comment ? `, "${c.comment}"` : ''}`
                ).join('\n') || '  No entries';
                return `${i + 1}. ${s.anonName} ${s.isRisk ? 'AT RISK' : 'OK'}:\n${recentCheckins}`;
            }).join('\n\n') || 'No student data available';

            // Prepare context prompt
            const contextSystemMsg = {
                role: 'system',
                content: `You are an experienced support assistant for a school psychologist.

                STRICT RESPONSE RULES:
                - Respond only in English
                - Do not use Markdown, tables, or bullet lists
                - Write in plain text only
                - Keep each answer to 3-4 sentences maximum
                - Be concise, practical, and specific

                Your colleague: ${teacherName || 'Psychologist'}.

                CLASS STATISTICS:
                Average mood: ${classStats.avgMood}/5, At risk: ${classStats.riskCount}, Total students: ${classStats.totalStudents}

                STUDENT DATA:
                ${studentsContext}

                Help analyze the class, explain possible concerns, and suggest short practical next steps.`
            };

            // Combine history (limit last 10 messages)
            const history = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));

            const fullConversation = [contextSystemMsg, ...history, userMsg];

            const response = await getChatResponse(fullConversation, selectedModel);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.content,
            }]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "A connection error occurred. Please try again.",
                isError: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                    .custom - scrollbar::- webkit - scrollbar {
                        width: 6px;
        }
                .custom - scrollbar:: -webkit - scrollbar - track {
    background: transparent;
}
                .custom - scrollbar:: -webkit - scrollbar - thumb {
    background: #334155;
    border - radius: 10px;
}
                .custom - scrollbar:: -webkit - scrollbar - thumb:hover {
    background: #475569;
}
`}</style>

            {/* Float Button */}
            {!isOpen && (
                <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-10 group">
                    <div className="bg-purple-600 text-white px-4 py-2 rounded-xl rounded-br-none shadow-lg mb-2 mr-4 text-sm font-bold transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none border border-white/10">
                        Psychologist Assistant
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer border-4 border-purple-500/20 overflow-hidden bg-[#1A1A1A]"
                    >
                        <Bot className="w-8 h-8 text-purple-400" />
                    </button>
                </div>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-[#0A0A0A] border-l border-white/10 shadow-2xl z-[9999] flex flex-col animate-in slide-in-from-right duration-300">
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#111]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                <Bot className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Psychologist Assistant</h3>
                                <p className="text-xs text-slate-400">AI-powered</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Model Selector */}
                    <div className="px-4 py-3 border-b border-white/10 bg-[#0A0A0A]">
                        <div className="relative">
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2 pl-3 pr-8 text-sm text-slate-300 focus:outline-none focus:border-purple-500 appearance-none cursor-pointer hover:bg-[#222] transition-colors"
                            >
                                {MODELS.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 custom-scrollbar bg-[#0A0A0A]">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${msg.role === 'user' ? 'bg-purple-600' : 'bg-[#222] border border-white/10'}`}>
                                    {msg.role === 'user' ? (
                                        <User className="w-4 h-4 text-white" />
                                    ) : (
                                        <Bot className="w-4 h-4 text-purple-400" />
                                    )}
                                </div>
                                <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`
                                        p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                                        ${msg.role === 'user'
                                            ? 'bg-purple-600 text-white border border-purple-500 rounded-tr-sm'
                                            : msg.isError
                                                ? 'bg-red-900/20 border border-red-500/30 text-red-200'
                                                : 'bg-[#1A1A1A] border border-white/10 text-slate-300 rounded-tl-sm'
                                        }
                                    `}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#222] border border-white/10 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="bg-[#1A1A1A] border border-white/10 p-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-[#0A0A0A] border-t border-white/10">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about class wellbeing, risks, or support strategies..."
                                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="absolute right-2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
