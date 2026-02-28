import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GitCommit, Plus, Trash2, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Static commits that are always shown
const staticCommits = [
    {
        date: "Jan 24, 2026",
        items: [
            "Добавлен AI анализ риска учеников с сохранением в БД, окно подтверждения выхода, улучшен профиль ученика",
            "Выход для учителей и фикс багов"
        ]
    },
    {
        date: "Jan 23, 2026",
        items: [
            "Исправил мусорные слова в AI анализе",
            "Запрет Markdown в чатах",
            "Исправил дизайн чата"
        ]
    },
    {
        date: "Jan 22, 2026",
        items: [
            "Добавил DeepSeek R1 + контекст записей учеников для AI",
            "Заменил Xiaomi Mimo на Google Gemini 2.0 Flash"
        ]
    },
    {
        date: "Jan 5, 2026",
        items: [
            "Небольшие исправления"
        ]
    },
    {
        date: "Jan 4, 2026",
        items: [
            "Update Landing Page features & cleanup",
            "Rebrand: Prism -> Ramp",
            "Restore missing UI for Calendar & AI Chat",
            "Fix calculateStats syntax error",
            "Remove duplicate KpiCard",
            "Fix TeacherDashboard build error & nesting",
            "Add Teacher AI Chatbot & Calendar",
            "Add Teacher Calendar feature",
            "Fix streak calculation logic",
            "Disable manual checkin delete in Teacher Dashboard",
            "Fix Invalid Date in Teacher Dashboard",
            "Implement delete task functionality",
            "Show student task responses in Teacher Dashboard",
            "Force AI to use plain text",
            "Fix AI button handler in Teacher Dashboard",
            "Switch to NVIDIA Nemotron with reasoning",
            "Prioritize Google Gemini for reliability",
            "Fix AI models syntax error",
            "Switch AI models to stable Google Gemini",
            "Merge remote changes and resolve conflict",
            "Fix leave course"
        ]
    }
];

interface ChangelogEntry {
    id: string;
    date: string;
    content: string;
    created_at: string;
}

const Changelog = () => {
    const navigate = useNavigate();
    const [clickCount, setClickCount] = useState(0);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [dbEntries, setDbEntries] = useState<ChangelogEntry[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newContent, setNewContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    // Load entries and check auth
    useEffect(() => {
        fetchEntries();
        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            checkAdminStatus(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        checkAdminStatus(session);
    };

    const checkAdminStatus = async (session: any) => {
        if (!session) {
            setIsAdmin(false);
            return;
        }

        const { data, error } = await supabase
            .from('blog_admins')
            .select('id')
            .eq('user_id', session.user.id)
            .single();

        if (data && !error) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    };

    const fetchEntries = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('changelog_entries')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setDbEntries(data);
        }
        setLoading(false);
    };

    // Handle secret click
    const handleSecretClick = () => {
        if (isAdmin) return;
        const newCount = clickCount + 1;
        setClickCount(newCount);
        if (newCount >= 5) {
            setShowLoginModal(true);
            setClickCount(0);
        }
    };

    // Handle login
    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) return;

        setLoginLoading(true);
        setLoginError('');

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password
        });

        if (error) {
            setLoginError('Неверный email или пароль');
        } else {
            const { data: adminData } = await supabase
                .from('blog_admins')
                .select('id')
                .eq('user_id', data.user?.id)
                .single();

            if (adminData) {
                setIsAdmin(true);
                setShowLoginModal(false);
                setEmail('');
                setPassword('');
            } else {
                await supabase.auth.signOut();
                setLoginError('У вас нет прав администратора');
            }
        }
        setLoginLoading(false);
    };

    // Handle logout
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAdmin(false);
    };

    // Add new entry
    const handleAddEntry = async () => {
        if (!newDate.trim() || !newContent.trim()) return;

        setSaving(true);
        const { error } = await supabase
            .from('changelog_entries')
            .insert([
                { date: newDate, content: newContent }
            ]);

        if (error) {
            console.error('Error adding entry:', error);
            alert('Ошибка при добавлении записи');
        } else {
            await fetchEntries();
            setNewDate('');
            setNewContent('');
            setShowAddModal(false);
        }
        setSaving(false);
    };

    // Delete entry
    const handleDeleteEntry = async (id: string) => {
        if (!confirm('Удалить запись?')) return;

        const { error } = await supabase
            .from('changelog_entries')
            .delete()
            .eq('id', id);

        if (!error) {
            await fetchEntries();
        }
    };

    // Group DB entries by date
    const groupedDbEntries = dbEntries.reduce((acc, entry) => {
        const existing = acc.find(g => g.date === entry.date);
        if (existing) {
            existing.items.push({ id: entry.id, content: entry.content });
        } else {
            acc.push({ date: entry.date, items: [{ id: entry.id, content: entry.content }] });
        }
        return acc;
    }, [] as { date: string; items: { id: string; content: string }[] }[]);

    return (
        <div className="min-h-screen bg-slate-50 font-geist">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-8 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Changelog</h1>
                            <p className="text-sm text-slate-500">История изменений платформы Prism</p>
                        </div>
                    </div>
                    {isAdmin && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Добавить
                            </button>
                            <button
                                onClick={handleLogout}
                                className="text-slate-500 hover:text-slate-700 text-sm transition-colors"
                            >
                                Выйти
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-8 py-12">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Dynamic entries from DB */}
                        {groupedDbEntries.map((group, groupIndex) => (
                            <div key={`db-${groupIndex}`} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
                                    <h2 className="text-white font-semibold text-lg">{group.date}</h2>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {group.items.map((item) => (
                                        <div key={item.id} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors relative group">
                                            <div className="flex-shrink-0 mt-1">
                                                <GitCommit className="w-5 h-5 text-indigo-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-slate-800 font-medium">{item.content}</p>
                                            </div>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDeleteEntry(item.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Static commits */}
                        {staticCommits.map((group, groupIndex) => (
                            <div key={groupIndex} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
                                    <h2 className="text-white font-semibold text-lg">{group.date}</h2>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {group.items.map((item, itemIndex) => (
                                        <div key={itemIndex} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex-shrink-0 mt-1">
                                                <GitCommit className="w-5 h-5 text-indigo-500" />
                                            </div>
                                            <div>
                                                <p className="text-slate-800 font-medium">{item}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-slate-200 py-8">
                <div className="max-w-4xl mx-auto px-8 text-center text-slate-400 text-sm">
                    © <span onClick={handleSecretClick} className="cursor-pointer select-none">2026</span> Prism. Все права защищены.
                </div>
            </div>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Вход в админ-панель</h3>

                        {loginError && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                                {loginError}
                            </div>
                        )}

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
                            autoFocus
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            placeholder="Пароль"
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowLoginModal(false);
                                    setLoginError('');
                                }}
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleLogin}
                                disabled={loginLoading}
                                className="flex-1 px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loginLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Войти
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Entry Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Новая запись</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            placeholder="Дата (например: Feb 7, 2026)"
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                        />
                        <textarea
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            placeholder="Описание изменения..."
                            rows={4}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-slate-900"
                        />
                        <button
                            onClick={handleAddEntry}
                            disabled={!newDate.trim() || !newContent.trim() || saving}
                            className="w-full px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {saving ? 'Сохранение...' : 'Добавить'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Changelog;
