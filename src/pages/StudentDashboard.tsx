import React, { useState, useEffect } from 'react';
import {
    Home, Book, BarChart2, Settings, User, LogOut,
    Zap, Moon, TrendingUp, Activity, Flame, ChevronRight,
    Smile, Frown, Meh, Trash2, Brain, FileText, CheckCircle, CheckCircle2, XCircle, Menu, MessageSquare, Send, Bot, Sparkles
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { MentorChat } from '../components/MentorChat';
import { getGeminiInsight } from '../lib/gemini';
import ResourceHub from './ResourceHub';

const StudentDashboard = () => {
    const navigate = useNavigate();

    // State
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    // const [hasClasses, setHasClasses] = useState(false); // Refactored to use classes array
    const [classes, setClasses] = useState<any[]>([]); // Store list of classes (currently max 1)

    // Navigation State
    const [currentView, setCurrentView] = useState<'courses' | 'dashboard'>('courses');
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('home'); // 'home', 'diary', 'stats', 'settings'
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showResources, setShowResources] = useState(false);
    const [tasks, setTasks] = useState<any[]>([]);
    const [viewingTask, setViewingTask] = useState<any>(null);
    const [taskResponse, setTaskResponse] = useState('');

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    // Settings Mode State
    const [editName, setEditName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editAvatar, setEditAvatar] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [savingProfile, setSavingProfile] = useState(false);

    // Join Class State
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [classCode, setClassCode] = useState('');
    const [joinError, setJoinError] = useState<string | null>(null);

    // Dashboard Data State (Loaded only when entering a class)
    const [streak, setStreak] = useState(0);
    const [checkins, setCheckins] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [stats, setStats] = useState({
        avgMood: 0,
        totalEntries: 0,
        sleepAvg: "0",
        energyAvg: "0"
    });

    // AI State
    const [aiAdvice, setAiAdvice] = useState<string | null>(null);
    const [loadingAI, setLoadingAI] = useState(false);

    useEffect(() => {
        initialLoad();
    }, []);

    useEffect(() => {
        if (userProfile) {
            setEditName(userProfile.full_name || '');
            setEditBio(userProfile.bio || '');
            setEditAvatar(userProfile.avatar_url || '');
        }
    }, [userProfile]);

    const initialLoad = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            // Fetch Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (profile) {
                setUserProfile(profile);

                // MULTI-CLASS: Fetch enrolled classes
                let { data: enrollments } = await supabase
                    .from('class_enrollments')
                    .select('class_id, classes(*)')
                    .eq('user_id', user.id);



                if (enrollments && enrollments.length > 0) {
                    // Extract the class objects from the enrollments
                    const classesList = enrollments.map((e: any) => e.classes);
                    setClasses(classesList);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const enterClass = async (classItem: any) => {
        setSelectedClass(classItem);
        setLoading(true);
        // Fetch data for this specific class context
        await fetchStudentData(userProfile.id, classItem.id);
        setCurrentView('dashboard');
        setLoading(false);
    };



    const fetchStudentData = async (userId: string, classId: string) => {
        try {
            // 1. Fetch Tasks
            const { data: tasksData } = await supabase
                .from('tasks')
                .select(`
                    *,
                    student_tasks ( id, completed, response, student_id )
                `)
                .eq('class_id', classId)
                .order('created_at', { ascending: false });

            const processedTasks = tasksData?.map((t: any) => ({
                ...t,
                mySubmission: t.student_tasks.find((st: any) => st.student_id === userId)
            })) || [];
            setTasks(processedTasks);

            // 2. Fetch Checkins
            const { data: checkinsData } = await supabase
                .from('checkins')
                .select('*')
                .eq('user_id', userId)
                .eq('class_id', classId) // Scope to class
                .order('created_at', { ascending: false });

            if (checkinsData) {
                setCheckins(checkinsData || []);
                calculateStats(checkinsData);
            } else {
                setCheckins([]);
                setStats({ avgMood: 0, totalEntries: 0, sleepAvg: "0", energyAvg: "0" });
            }



        } catch (err) {
            console.error(err);
        }
    };

    const calculateStats = (data: any[]) => {
        // Streak (Consecutive Days)
        const sortedDates = [...data]
            .map(c => new Date(c.created_at).setHours(0, 0, 0, 0)) // Normalize to midnight
            .sort((a, b) => b - a);

        const uniqueDays = Array.from(new Set(sortedDates));
        let streakCount = 0;
        const today = new Date().setHours(0, 0, 0, 0);
        const yesterday = today - 86400000;

        if (uniqueDays.length > 0) {
            // Check if streak is active (latest entry is Today or Yesterday)
            if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
                streakCount = 1;
                for (let i = 0; i < uniqueDays.length - 1; i++) {
                    const diff = Math.round((uniqueDays[i] - uniqueDays[i + 1]) / 86400000);
                    if (diff === 1) {
                        streakCount++;
                    } else {
                        break;
                    }
                }
            }
        }
        setStreak(streakCount);

        // Chart Data
        const last7 = data.slice(0, 7).reverse();
        const chart = last7.map(c => ({
            day: new Date(c.created_at).toLocaleDateString('ru-RU', { weekday: 'short' }),
            mood: c.mood_score,
            energy: c.energy_level || 0
        }));
        setChartData(chart);

        // Stats
        const total = data.length;
        const avgMood = total > 0 ? (data.reduce((acc, c) => acc + c.mood_score, 0) / total).toFixed(1) : "0.0";

        // Sleep & Energy Averages
        const sleepSum = data.reduce((acc, c) => acc + (c.sleep_hours || 0), 0);
        const energySum = data.reduce((acc, c) => acc + (c.energy_level || 0), 0);

        const avgSleep = total > 0 ? (sleepSum / total).toFixed(1) : "0";
        const avgEnergy = total > 0 ? (energySum / total).toFixed(1) : "0";

        setStats({
            avgMood: Number(avgMood),
            totalEntries: total,
            sleepAvg: avgSleep + " ч",
            energyAvg: avgEnergy + "/10"
        });

        // AI Advice
        if (data.length > 0) {
            loadAiAnalysis(data); // Call the new function
        }
    };

    const loadAiAnalysis = async (checkinsData: any[]) => {
        if (!checkinsData || checkinsData.length === 0 || !userProfile) return;

        // Generate a simple hash/key based on the latest check-in
        // If the latest check-in ID is the same, the analysis is likely valid
        const latestCheckin = checkinsData[0];
        const cacheKey = `ai_analysis_${userProfile.id}_${latestCheckin.id}`;

        // CACHING DISABLED BY USER REQUEST
        // const cached = localStorage.getItem(cacheKey);
        // if (cached) {
        //     console.log("Using cached AI analysis");
        //     setAiAdvice(cached);
        //     return;
        // }

        setLoadingAI(true);
        try {
            const recent = checkinsData.slice(0, 5);
            const checkinsText = recent.map(c =>
                `[${new Date(c.created_at).toLocaleDateString()}] Mood:${c.mood_score}/5, Sleep:${c.sleep_hours}, Ene:${c.energy_level}/10, Tags:${c.factors?.join(',')}, Note:${c.comment}`
            ).join('\n');
            const prompt = `Ты школьный психолог. Твоя задача — поддержать ученика.
Обращайся к ученику на "ТЫ". Не используй слово "ученик" или третье лицо.
Кратко (макс 3 предл) оцени его состояние и дай 1 совет.
Данные: ${checkinsText}`;

            const result = await getGeminiInsight(prompt, "openai/gpt-oss-120b");
            setAiAdvice(result);

            // CACHING DISABLED
            // Save to cache and clear old keys for this user to save space
            // We only keep the latest one
            // Object.keys(localStorage).forEach(key => {
            //     if (key.startsWith(`ai_analysis_${userProfile.id}_`) && key !== cacheKey) {
            //         localStorage.removeItem(key);
            //     }
            // });
            // localStorage.setItem(cacheKey, result);

        } catch (err) {
            console.error(err);
            setAiAdvice("Не удалось проанализировать данные. Попробуйте позже.");
        } finally {
            setLoadingAI(false);
        }
    };


    const submitTask = async () => {
        if (!viewingTask || !userProfile) return;
        try {
            const { error } = await supabase
                .from('student_tasks')
                .upsert({
                    task_id: viewingTask.id,
                    student_id: userProfile.id,
                    response: taskResponse,
                    completed: true,
                    completed_at: new Date().toISOString()
                }, { onConflict: 'task_id,student_id' });

            if (error) throw error;

            // Refresh logic (optimistic update better, but simple re-fetch for now)
            setTasks(prev => prev.map(t => t.id === viewingTask.id ? { ...t, mySubmission: { completed: true, response: taskResponse } } : t));
            setViewingTask(null);
            setTaskResponse('');
            alert("Задание отправлено!");

        } catch (error: any) {
            console.error(error);
            alert(`Ошибка отправки: ${error.message || 'Неизвестная ошибка'}`);
        }
    };

    const joinClass = async (e: React.FormEvent) => {
        e.preventDefault();
        setJoinError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not logged in");

            // 1. Find class
            const { data: foundClass, error: findError } = await supabase
                .from('classes')
                .select('*')
                .eq('code', classCode.trim().toUpperCase())
                .single();

            if (findError || !foundClass) throw new Error("Класс с таким кодом не найден");

            // 2. Check overlap
            const existing = classes.find(c => c.id === foundClass.id);
            if (existing) {
                alert("Вы уже состоите в этом классе");
                setShowJoinModal(false);
                return;
            }

            // 3. Create Enrollment
            const { error: enrollError } = await supabase
                .from('class_enrollments')
                .insert({
                    user_id: user.id,
                    class_id: foundClass.id
                });

            if (enrollError) throw enrollError;

            alert(`Вы успешно присоединились к классу "${foundClass.name}"!`);

            setClasses(prev => {
                // Double check to avoid duplicates in state
                if (prev.find(c => c.id === foundClass.id)) return prev;
                return [...prev, foundClass];
            });
            setShowJoinModal(false);
            setClassCode('');

        } catch (err: any) {
            setJoinError(err.message);
        }
    };

    const leaveClass = async (e: React.MouseEvent, classId: string) => {
        e.stopPropagation();
        if (!confirm('Вы уверены, что хотите покинуть этот класс?')) return;

        try {
            // Remove from enrollments
            const { error } = await supabase
                .from('class_enrollments')
                .delete()
                .eq('user_id', userProfile.id)
                .eq('class_id', classId);

            if (error) throw error;

            setClasses(prev => prev.filter(c => c.id !== classId));
            alert('Вы успешно покинули курс');

        } catch (err: any) {
            console.error(err);
            alert(`Ошибка при выходе из курса: ${err.message || JSON.stringify(err)}`);
        }
    };

    const deleteCheckin = async (id: string) => {
        if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;
        try {
            const { error } = await supabase.from('checkins').delete().eq('id', id);
            if (error) throw error;

            const newCheckins = checkins.filter(c => c.id !== id);
            setCheckins(newCheckins);
            calculateStats(newCheckins);

        } catch (err) {
            console.error(err);
            alert('Ошибка при удалении');
        }
    };



    const updateProfile = async () => {
        setSavingProfile(true);
        try {
            let avatarUrl = editAvatar;

            // Upload Avatar if file selected
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${userProfile.id}-${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                avatarUrl = publicUrl;
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: editName,
                    bio: editBio,
                    avatar_url: avatarUrl
                })
                .eq('id', userProfile.id);

            if (error) throw error;

            setUserProfile({ ...userProfile, full_name: editName, bio: editBio, avatar_url: avatarUrl });
            setAvatarFile(null); // Reset file input
            alert('Профиль обновлен!');
        } catch (error: any) {
            console.error(error);
            alert('Ошибка при обновлении профиля: ' + error.message);
        } finally {
            setSavingProfile(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Загрузка...</div>;

    // --- COURSES GALLERY VIEW ---
    if (currentView === 'courses') {
        return (
            <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
                {/* Navbar */}
                <header className="border-b border-white/10 bg-[#0A0A0A] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <div className="p-2 hover:bg-white/5 rounded-full cursor-pointer transition-colors">
                            <div className="w-6 h-0.5 bg-slate-300 mb-1.5"></div>
                            <div className="w-6 h-0.5 bg-slate-300 mb-1.5"></div>
                            <div className="w-6 h-0.5 bg-slate-300"></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <img src="https://i.pinimg.com/736x/c6/5d/e7/c65de7404240bcbc3e45c162551bc009.jpg" className="w-8 h-8 rounded-md" alt="Logo" />
                            <h1 className="text-xl font-medium text-slate-200">Prism Classroom</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowJoinModal(true)} className="p-2 hover:bg-white/5 rounded-full transition-colors" title="Присоединиться к курсу">
                            <span className="text-2xl font-light text-slate-300">+</span>
                        </button>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-indigo-500 overflow-hidden"
                            >
                                {userProfile?.avatar_url ? (
                                    <img src={userProfile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    userProfile?.full_name?.[0] || 'U'
                                )}
                            </button>

                            {showProfileMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowProfileMenu(false)}
                                    ></div>
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="p-4 border-b border-white/5 bg-white/5">
                                            <p className="text-sm font-bold text-white truncate">{userProfile?.full_name}</p>
                                            <p className="text-xs text-slate-400 truncate">{userProfile?.email}</p>
                                        </div>
                                        <button
                                            onClick={() => { setShowProfileMenu(false); setShowLogoutModal(true); }}
                                            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 flex items-center gap-3 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Выйти из аккаунта
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
                    {classes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[70vh] text-center">
                            <div className="w-96 h-auto mb-10 flex items-center justify-center overflow-hidden">
                                <img
                                    src="https://i.pinimg.com/736x/07/34/5d/07345dd1bf45c3387baf6a3be166fb89.jpg"
                                    className="w-full h-full object-contain mix-blend-screen scale-110"
                                    alt="Empty"
                                />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-200 mb-4">Здесь пока пусто</h2>
                            <p className="text-lg text-slate-400 mb-10 max-w-xl leading-relaxed">Присоединитесь к своему первому классу, чтобы начать отслеживать прогресс.</p>
                            <button
                                onClick={() => setShowJoinModal(true)}
                                className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white text-lg rounded-xl font-semibold transition-all shadow-[0_4px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_4px_25px_rgba(37,99,235,0.5)] hover:-translate-y-1"
                            >
                                Присоединиться к курсу
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {classes.map((cls) => (
                                <div
                                    key={cls.id}
                                    onClick={() => enterClass(cls)}
                                    className="bg-[#111] border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-white/30 hover:transform hover:scale-[1.02] transition-all group"
                                >
                                    <div className="h-24 bg-gradient-to-r from-blue-700 to-indigo-800 p-4 relative">
                                        <h3 className="text-xl font-bold text-white relative z-10 truncate">{cls.name}</h3>
                                        <p className="text-blue-200 text-sm relative z-10">{userProfile?.full_name}</p> {/* Showing Student Name contextually or Teacher? Schema says class has teacher_id, but name is class name. Let's just show class name */}
                                        <div className="absolute right-4 top-4 text-white/20 group-hover:text-white/40 transition-colors">
                                            <Book className="w-12 h-12" />
                                        </div>
                                    </div>
                                    <div className="p-4 h-32 flex flex-col justify-between relative bg-[#111]">
                                        <p className="text-xs text-slate-500 truncate">Код курса: {cls.code}</p>
                                        <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-2">
                                            <button
                                                onClick={(e) => leaveClass(e, cls.id)}
                                                className="text-slate-500 hover:text-red-400 text-xs flex items-center gap-1 transition-colors"
                                                title="Покинуть курс"
                                            >
                                                <LogOut className="w-3 h-3" /> Покинуть
                                            </button>
                                            <div className="flex gap-1">
                                                <div className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white">
                                                    <TrendingUp className="w-5 h-5" />
                                                </div>
                                                <div className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white">
                                                    <Book className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                {/* Join Class Modal */}
                {showJoinModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl">
                            <h2 className="text-xl font-bold mb-4">Присоединиться к курсу</h2>
                            <p className="text-slate-400 text-sm mb-6">Попросите код курса у учителя и введите его здесь.</p>
                            <form onSubmit={joinClass}>
                                <input
                                    type="text"
                                    value={classCode}
                                    onChange={(e) => setClassCode(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white mb-4 focus:outline-none focus:border-blue-500"
                                    placeholder="Код курса"
                                />
                                {joinError && <div className="text-red-400 text-sm text-center mb-4">{joinError}</div>}
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowJoinModal(false)}
                                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium"
                                    >
                                        Присоединиться
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- DASHBOARD VIEW (Existing Logic) ---
    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex overflow-hidden selection:bg-purple-500/30">

            {/* Ambient Background */}
            <div className="fixed top-0 left-0 w-[800px] h-[800px] bg-purple-900/10 blur-[150px] rounded-full -translate-x-1/3 -translate-y-1/3 pointer-events-none z-0"></div>
            <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-blue-900/10 blur-[150px] rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none z-0"></div>

            {/* Sidebar */}
            <aside className="w-20 lg:w-64 h-screen border-r border-white/5 bg-[#050505]/50 backdrop-blur-xl flex flex-col z-20 transition-all duration-300">
                <div className="p-6 flex items-center gap-3 mb-8 cursor-pointer hover:bg-white/5 rounded-xl mx-2 mt-2 transition-colors" onClick={() => setCurrentView('courses')}>
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <ChevronRight className="w-5 h-5 text-slate-400 rotate-180" />
                    </div>
                    <span className="hidden lg:block font-bold text-sm tracking-tight text-slate-300">К списку курсов</span>
                </div>

                <div className="px-6 mb-4">
                    <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 hidden lg:block">Курс</h2>
                    <div className="text-sm font-bold text-white truncate px-1 hidden lg:block">{selectedClass?.name || 'Loading...'}</div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <NavItem icon={Home} label="Главная" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                    <NavItem icon={Book} label="Дневник" active={activeTab === 'diary'} onClick={() => setActiveTab('diary')} />
                    <NavItem icon={FileText} label={`Задания ${tasks.filter(t => !t.mySubmission?.completed).length > 0 ? '•' : ''}`} active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
                    <NavItem icon={BarChart2} label="Статистика" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />

                    <button
                        onClick={() => setShowResources(true)}
                        className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                        <Book className="w-5 h-5" />
                        <span className="hidden lg:block font-medium">Ресурсы</span>
                    </button>
                    <NavItem icon={Settings} label="Настройки" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button onClick={handleLogout} className="flex items-center gap-3 p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all w-full text-left">
                        <LogOut className="w-5 h-5" />
                        <span className="hidden lg:block font-medium">Выйти</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto z-10 p-6 lg:p-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>

                            <h1 className="text-4xl lg:text-5xl font-bold text-white">
                                {activeTab === 'home' && `Доброе утро, ${userProfile?.full_name?.split(' ')[0] || 'Ученик'}`}
                                {activeTab === 'diary' && 'Твой Дневник'}
                                {activeTab === 'tasks' && 'Мои Задания'}
                                {activeTab === 'stats' && 'Твой Прогресс'}
                                {activeTab === 'settings' && 'Настройки'}
                            </h1>
                            {activeTab === 'home' && <p className="text-slate-400 mt-2">Готов отслеживать свой прогресс сегодня?</p>}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden">
                            {userProfile?.avatar_url ? (
                                <img src={userProfile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                            ) : (
                                <User className="w-full h-full p-2 text-slate-400" />
                            )}
                        </div>
                    </div>

                    {/* CONTENT AREA BASED ON TAB */}

                    {activeTab === 'home' && (
                        <>
                            {/* Emotions Widget (Big Card) */}
                            <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-[32px] relative overflow-hidden group">
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2">Как ты себя чувствуешь?</h2>
                                        <p className="text-slate-400 mb-6 max-w-md">Отметь свое текущее состояние. Это поможет нам построить более точную карту твоих эмоций.</p>
                                        <button
                                            onClick={() => navigate('/checkin', { state: { classId: selectedClass?.id, prompt: "Как прошел твой день?" } })}
                                            className="bg-white text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                        >
                                            Открыть дневник
                                        </button>

                                        {/* Smart Journaling Prompts */}
                                        <div className="mt-6 space-y-2">
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Или ответь на вопрос:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {["Что тебя сегодня порадовало?", "Что вызвало трудности?", "За что ты благодарен?"].map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => navigate('/checkin', { state: { classId: selectedClass?.id, prompt: p } })}
                                                        className="text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all text-slate-300"
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Emoji Visuals */}
                                    <div className="flex gap-4 p-4 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all cursor-default">😫</div>
                                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all cursor-default">😔</div>
                                        <div className="w-12 h-12 rounded-full bg-slate-500/20 flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all cursor-default">😐</div>
                                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all cursor-default">🙂</div>
                                        <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all shadow-[0_0_15px_rgba(236,72,153,0.5)] scale-110 cursor-default">🤩</div>
                                    </div>
                                </div>
                            </div>



                            {/* Middle Row: Advice & Streak */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* Advice Card */}
                                <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900/10 to-transparent border border-white/5 rounded-[32px] p-8 relative overflow-hidden flex flex-col justify-center">
                                    <div className="flex items-center gap-2 mb-4 relative z-10">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                                            <Brain className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI Анализ состояния</span>
                                    </div>

                                    <div className="relative z-10">
                                        <h2 className="text-lg md:text-xl font-medium leading-relaxed text-slate-200">
                                            {loadingAI ? (
                                                <span className="animate-pulse">Анализирую твои показатели...</span>
                                            ) : (
                                                aiAdvice || "Сделай первую запись в дневнике, чтобы я мог проанализировать твое состояние."
                                            )}
                                        </h2>
                                    </div>
                                    <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-600/5 blur-[80px] rounded-full pointer-events-none"></div>
                                </div>

                                {/* Streak Card */}
                                <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-8 flex flex-col items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent"></div>
                                    <div className="w-20 h-20 bg-gradient-to-tr from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.4)] mb-4">
                                        <Flame className="w-10 h-10 text-white fill-white" />
                                    </div>
                                    <div className="text-4xl font-bold text-white mb-1">{streak}</div>
                                    <div className="text-sm text-slate-400 font-medium">дней подряд</div>
                                    <div className="text-xs text-slate-600 mt-2">Ты в ударе!</div>
                                </div>
                            </div>

                            {/* Bottom Row: Trends & Stats */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                <StatCard label="Среднее" value={stats.avgMood} icon={TrendingUp} color="emerald" />
                                <StatCard label="Записей" value={stats.totalEntries} icon={Book} color="purple" />
                                <StatCard label="Сон" value={stats.sleepAvg} icon={Moon} color="indigo" />
                                <StatCard label="Энергия" value={stats.energyAvg} icon={Zap} color="yellow" />
                            </div>
                        </>
                    )}

                    {activeTab === 'diary' && (
                        <div className="space-y-4">
                            {checkins.length === 0 ? (
                                <div className="text-slate-500">Пока нет записей.</div>
                            ) : checkins.map((entry) => (
                                <div key={entry.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-start gap-4 hover:bg-white/10 transition-colors group">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br ${entry.mood_score >= 4 ? 'from-green-500 to-emerald-700' : entry.mood_score <= 2 ? 'from-red-500 to-orange-700' : 'from-slate-500 to-slate-700'}`}>
                                        {entry.mood_score >= 4 ? '😊' : entry.mood_score <= 2 ? '😔' : '😐'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg">{new Date(entry.created_at).toLocaleDateString('ru-RU')}</h3>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-slate-500">{new Date(entry.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                                                <button
                                                    onClick={() => deleteCheckin(entry.id)}
                                                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                    title="Удалить запись"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {entry.emotions?.map((e: string) => <span key={e} className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-slate-300 border border-white/10">{e}</span>)}
                                        </div>
                                        <p className="text-slate-300 text-sm mb-3">"{entry.comment || "Без комментария"}"</p>
                                        <div className="flex gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><Moon className="w-3 h-3" /> {entry.sleep_hours || '-'}ч</span>
                                            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {entry.energy_level || '-'}/10</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}



                    {activeTab === 'tasks' && (
                        <div className="space-y-4 max-w-2xl">
                            {tasks.map(task => (
                                <div key={task.id} className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                                    {task.mySubmission?.completed && (
                                        <div className="absolute top-0 right-0 p-2 bg-green-500/10 rounded-bl-xl text-green-500 border-l border-b border-green-500/20">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                    )}
                                    <h3 className="text-xl font-bold mb-2">{task.title}</h3>
                                    <p className="text-slate-400 mb-6">{task.description || "Без описания"}</p>

                                    {task.mySubmission?.completed ? (
                                        <div className="bg-white/5 rounded-xl p-4 text-sm text-slate-300">
                                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Твой ответ</div>
                                            {task.mySubmission.response}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setViewingTask(task)}
                                            className="px-6 py-2 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                        >
                                            Выполнить
                                        </button>
                                    )}
                                </div>
                            ))}
                            {tasks.length === 0 && (
                                <div className="text-center py-12 text-slate-500">Учитель пока не добавил заданий.</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <>
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                                <h2 className="text-2xl font-bold mb-6">Твои показатели</h2>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                            <RechartsTooltip
                                                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Area type="monotone" dataKey="mood" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorMood)" />
                                            <Area type="monotone" dataKey="energy" stroke="#eab308" strokeWidth={2} fillOpacity={0} strokeDasharray="5 5" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-center text-slate-500 text-sm mt-4">Фиолетовый: Настроение • Желтый: Энергия</p>
                            </div>

                            {/* MOOD CALENDAR (PIXEL YEAR) */}
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mt-6">
                                <h2 className="text-2xl font-bold mb-6">Календарь настроения</h2>
                                <MoodCalendar checkins={checkins} />
                            </div>
                        </>
                    )}

                    {activeTab === 'settings' && (
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-xl">
                            <h2 className="text-xl font-bold mb-6">Профиль</h2>
                            <div className="mb-6">
                                <label className="block text-slate-400 text-sm mb-2">Имя</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    placeholder="Ваше имя"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-slate-400 text-sm mb-2">Аватар</label>
                                <div className="flex items-start gap-4">
                                    <div className="w-20 h-20 rounded-full bg-white/10 overflow-hidden flex-shrink-0 border border-white/20">
                                        {avatarFile ? (
                                            <img src={URL.createObjectURL(avatarFile)} className="w-full h-full object-cover" alt="Preview" />
                                        ) : editAvatar ? (
                                            <img src={editAvatar} className="w-full h-full object-cover" alt="Current" />
                                        ) : (
                                            <User className="w-full h-full p-4 text-slate-500" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setAvatarFile(e.target.files[0]);
                                                }
                                            }}
                                            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer mb-2"
                                        />
                                        <p className="text-xs text-slate-500 mb-2">Или вставьте ссылку:</p>
                                        <input
                                            type="text"
                                            value={editAvatar}
                                            onChange={(e) => setEditAvatar(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-slate-400 text-sm mb-2">О себе</label>
                                <textarea
                                    value={editBio}
                                    onChange={(e) => setEditBio(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors h-24 resize-none"
                                    placeholder="Расскажите немного о себе..."
                                />
                            </div>
                            <div className="mb-8">
                                <label className="block text-slate-400 text-sm mb-2">Email</label>
                                <input
                                    type="text"
                                    disabled
                                    value={userProfile?.email || ''}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-slate-500 cursor-not-allowed"
                                />
                            </div>

                            <button
                                onClick={updateProfile}
                                disabled={savingProfile}
                                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {savingProfile ? 'Сохранение...' : 'Сохранить изменения'}
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* AI Mentor Chat */}
            < MentorChat
                userProfile={userProfile}
                studentStats={
                    checkins[0] ? {
                        mood: checkins[0].mood_score,
                        energy: checkins[0].energy_level,
                        sleep: checkins[0].sleep_hours
                    } : null}
                recentCheckins={checkins.slice(0, 5)}
            />

            {/* Resource Hub Modal */}
            {showResources && <ResourceHub onClose={() => setShowResources(false)} />}

            {/* Task Response Modal */}
            {viewingTask && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 max-w-lg w-full">
                        <h3 className="text-2xl font-bold mb-4">{viewingTask.title}</h3>
                        <textarea
                            className="w-full h-40 bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 resize-none mb-6"
                            placeholder="Твой ответ..."
                            value={taskResponse}
                            onChange={(e) => setTaskResponse(e.target.value)}
                        ></textarea>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setViewingTask(null)} className="px-6 py-3 text-slate-400 font-bold hover:text-white">Отмена</button>
                            <button onClick={submitTask} className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)]">Отправить</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowLogoutModal(false)}
                    />
                    <div className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                                <LogOut className="w-8 h-8 text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Выйти из аккаунта?</h3>
                            <p className="text-slate-400 text-sm mb-6">Вы уверены, что хотите выйти из своего аккаунта?</p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-medium hover:bg-white/10 transition-colors"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                                >
                                    Выйти
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

// --- COMPONENTS ---

const MoodCalendar = ({ checkins }: { checkins: any[] }) => {
    // Generate last 365 days (or year to date)
    const today = new Date();
    const days = [];
    for (let i = 364; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        days.push(d);
    }

    const getColor = (date: Date) => {
        const dateStr = date.toLocaleDateString('ru-RU');
        // Find existing checkin for this day
        // Note: Checkins string date format might differ, ensuring date-only comparison
        const checkin = checkins.find(c => new Date(c.created_at).toLocaleDateString('ru-RU') === dateStr);

        if (!checkin) return 'bg-white/5';

        const mood = checkin.mood_score;
        if (mood >= 4.5) return 'bg-green-400';
        if (mood >= 3.5) return 'bg-green-600';
        if (mood >= 2.5) return 'bg-yellow-600';
        if (mood >= 1.5) return 'bg-orange-600';
        return 'bg-red-600'; // Mood 1
    };

    return (
        <div className="flex flex-wrap gap-1">
            {days.map((date, i) => (
                <div
                    key={i}
                    className={`w-3 h-3 rounded-sm ${getColor(date)} hover:scale-125 transition-transform cursor-pointer`}
                    title={`${date.toLocaleDateString('ru-RU')}`}
                ></div>
            ))}

        </div>
    );
};

const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
    <div onClick={onClick} className={`
        flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
        ${active ? 'bg-purple-600/10 text-purple-400 border border-purple-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}
    `}>
        <Icon className="w-5 h-5" />
        <span className="hidden lg:block font-medium">{label}</span>
        {active && <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.8)]"></div>}
    </div>
);

const StatCard = ({ label, value, icon: Icon, color }: any) => {
    const colors = {
        emerald: "text-emerald-400 bg-emerald-500/10",
        purple: "text-purple-400 bg-purple-500/10",
        indigo: "text-indigo-400 bg-indigo-500/10",
        yellow: "text-yellow-400 bg-yellow-500/10"
    };

    return (
        <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-colors">
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
                <h3 className="text-2xl font-bold text-white">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${colors[color as keyof typeof colors]} group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
    );
};

export default StudentDashboard;
