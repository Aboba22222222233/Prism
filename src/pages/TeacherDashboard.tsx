import React, { useState, useEffect } from 'react';
import {
    Users, Activity, Bell, Search, Settings,
    TrendingUp, TrendingDown, AlertTriangle, CheckCircle, AlertCircle,
    BrainCircuit, ChevronDown, Plus, Copy, Eye, EyeOff, Bot, X, Trash2, FileText, Calendar as CalendarIcon, Clock, LogOut
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { supabase } from '../lib/supabase';
import { getGeminiInsight, assessStudentRisk } from '../lib/gemini';
import { useNavigate } from 'react-router-dom';

const KpiCard = ({ title, value, status }: any) => {
    const colors = {
        green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        red: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        yellow: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        neutral: 'text-slate-300 bg-white/5 border-white/10'
    }[status as string] || 'text-slate-300';

    return (
        <div className={`p-4 rounded-xl border ${colors.split(' ').slice(1).join(' ')}`}>
            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</div>
            <div className={`text-2xl font-bold ${colors.split(' ')[0]}`}>{value}</div>
        </div>
    );
}

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [selectedPeriod, setSelectedPeriod] = useState('Неделя');

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    // AI State
    const [showInsight, setShowInsight] = useState(false);
    const [insightText, setInsightText] = useState("");
    const [analyzing, setAnalyzing] = useState(false);

    // Data State
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [moodChartData, setMoodChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);

    // UX State
    const [isAnonymous, setIsAnonymous] = useState(true); // Privacy by default
    const [newClassName, setNewClassName] = useState('');
    const [creatingClass, setCreatingClass] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'calendar'>('dashboard');
    const [tasks, setTasks] = useState<any[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [creatingTask, setCreatingTask] = useState(false);

    // Calendar State
    const [events, setEvents] = useState<any[]>([]);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDate, setNewEventDate] = useState('');
    const [newEventType, setNewEventType] = useState('sor');
    const [creatingEvent, setCreatingEvent] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Detailed Profile State
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    // Stats
    const [stats, setStats] = useState({
        avgMood: 0,
        riskCount: 0,
        activeCount: 0,
        totalStudents: 0
    });

    // AI Risk Assessment State
    const [aiRiskAssessments, setAiRiskAssessments] = useState<Record<string, {
        isRisk: boolean;
        riskLevel: number;
        status: 'critical' | 'warning' | 'attention' | 'normal';
        reason: string;
    }>>({});
    const [assessingRisk, setAssessingRisk] = useState(false);
    const [assessingStudentId, setAssessingStudentId] = useState<string | null>(null);

    useEffect(() => {
        checkAccessAndFetch();
    }, []);

    // Fetch Data whenever class changes
    useEffect(() => {
        if (selectedClass) {
            fetchDashboardData(selectedClass.id);
        }
    }, [selectedClass]);

    const checkAccessAndFetch = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                window.location.href = '/login';
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            let role = profile?.role;

            if (!role) {
                // Fallback to metadata if RLS blocks profile read
                const { data: { user: authUser } } = await supabase.auth.getUser();
                role = authUser?.user_metadata?.role;
            }

            if (role !== 'teacher') {
                setAccessDenied(true);
                setLoading(false);
                return;
            }

            // Fetch ALL classes
            const { data: classList, error } = await supabase
                .from('classes')
                .select('*')
                .eq('teacher_id', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            setClasses(classList || []);
            if (classList && classList.length > 0) {
                setSelectedClass(classList[0]); // Select first class by default
            } else {
                setLoading(false);
            }

        } catch (error) {
            console.error("Init Error:", error);
            setLoading(false);
        }
    };


    const createTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !selectedClass) return;

        try {
            setCreatingTask(true);
            const { data, error } = await supabase
                .from('tasks')
                .insert([{
                    class_id: selectedClass.id,
                    title: newTaskTitle,
                    description: '', // Optional for now
                    type: 'text'
                }])
                .select()
                .single();

            if (error) throw error;

            setTasks([data, ...tasks]);
            setNewTaskTitle('');
            alert('Задание создано!');

        } catch (error) {
            console.error(error);
            alert('Ошибка создания задания');
        } finally {
            setCreatingTask(false);
        }
    };

    const deleteTask = async (taskId: string) => {
        if (!confirm('Вы уверены, что хотите удалить это задание? Это также удалит все ответы учеников.')) return;

        try {
            // Optimistic Update
            setTasks(prev => prev.filter(t => t.id !== taskId));

            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;

        } catch (error) {
            console.error(error);
            alert('Ошибка при удалении задания. Попробуйте обновить страницу.');
        }
    };

    const createClass = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingClass(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Session expired. Please login again.");
                return;
            }

            const code = Math.random().toString(36).substring(2, 8).toUpperCase();

            // 1. Create Class
            const { data, error } = await supabase
                .from('classes')
                .insert({
                    name: newClassName,
                    teacher_id: user.id, // Use the user object directly
                    code: code
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Update State
            const newClassKey = { ...data, studentCount: 0 };
            setClasses([...classes, newClassKey]);
            setSelectedClass(newClassKey); // Automatically select the new class
            setNewClassName('');

        } catch (error) {
            console.error('Error creating class:', error);
            alert('Ошибка при создании класса');
        } finally {
            setCreatingClass(false);
        }
    };

    const createEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClass || !newEventTitle || !newEventDate) return;

        setCreatingEvent(true);
        try {
            const { data, error } = await supabase
                .from('class_events')
                .insert({
                    class_id: selectedClass.id,
                    title: newEventTitle,
                    date: new Date(newEventDate).toISOString(),
                    type: newEventType,
                    description: ''
                })
                .select()
                .single();

            if (error) throw error;

            setEvents([...events, data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            setShowEventModal(false);
            setNewEventTitle('');
            setNewEventDate('');
            alert('Событие добавлено!');
        } catch (err) {
            console.error(err);
            alert('Ошибка при создании события');
        } finally {
            setCreatingEvent(false);
        }
    };

    const fetchDashboardData = async (classId: string) => {
        try {
            setLoading(true);
            setShowInsight(false); // Reset AI insight for new class

            // 1. Fetch Students (Enrollments)
            const { data: enrollments } = await supabase
                .from('class_enrollments')
                .select('user_id, created_at, profiles!inner(id, full_name, email, avatar_url)')
                .eq('class_id', classId);

            // 2. Fetch Checkins
            const { data: checkins } = await supabase
                .from('checkins')
                .select('*')
                .eq('class_id', classId)
                .eq('class_id', classId)
                .order('created_at', { ascending: true }); // Ascending for chart

            // 3. Fetch Tasks
            const { data: classTasks } = await supabase
                .from('tasks')
                .select('*, student_tasks(*)')
                .eq('class_id', classId)
                .order('created_at', { ascending: false });

            // 4. Fetch Events
            const { data: classEvents } = await supabase
                .from('class_events')
                .select('*')
                .eq('class_id', classId)
                .order('date', { ascending: true });

            setTasks(classTasks || []);
            setEvents(classEvents || []);

            // DEBUG: Check data counts
            // alert(`DEBUG DATA:\nEnrollments: ${enrollments?.length}\nCheckins: ${checkins?.length}\nTasks: ${classTasks?.length}`);

            // Process Data
            const processedStudents = (enrollments || []).map((e: any, index: number) => {
                // Find student's checkins
                const studentCheckins = checkins?.filter(c => c.user_id === e.user_id) || [];
                // Latest checkin
                const lastCheckin = studentCheckins.length > 0 ? studentCheckins[studentCheckins.length - 1] : null;
                // Avg Mood
                const avgMood = studentCheckins.length > 0
                    ? (studentCheckins.reduce((sum, c) => sum + c.mood_score, 0) / studentCheckins.length).toFixed(1)
                    : '-';

                // Risk Logic: 
                // 1. Critical: Low Mood (<=2) in latest checkin
                // 2. Trend: Mood dropped consecutive last 3 entries
                const recentMoods = studentCheckins.slice(-3).map((c: any) => c.mood_score);
                const isTrendDrop = recentMoods.length === 3 && recentMoods[0] > recentMoods[1] && recentMoods[1] > recentMoods[2];
                const isCriticalLast = lastCheckin && (lastCheckin.mood_score <= 2);

                const isRisk = isCriticalLast || isTrendDrop;

                // Student Chart Data
                const chartHistory = studentCheckins.slice(-7).map((c: any) => ({
                    date: new Date(c.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
                    mood: c.mood_score
                }));

                return {
                    id: e.profiles.id,
                    realName: e.profiles.full_name || e.profiles.email.split('@')[0],
                    anonName: `Ученик ${index + 1}`,
                    email: e.profiles.email,
                    avatar: e.profiles.avatar_url,
                    avgMood,
                    lastCheckin: lastCheckin, // Pass raw object or null
                    isRisk,
                    status: isRisk ? 'risk' : 'ok',
                    history: chartHistory,
                    rawCheckins: studentCheckins
                };
            });

            setStudents(processedStudents);

            // Calculate Stats
            const totalStudents = processedStudents.length;
            const riskCount = processedStudents.filter(s => s.isRisk).length;
            const activeCount = processedStudents.filter(s => s.lastCheckin !== 'Нет записей').length;

            const totalMoodSum = checkins?.reduce((sum, c) => sum + c.mood_score, 0) || 0;
            const globalAvgMood = checkins?.length ? (totalMoodSum / checkins.length).toFixed(1) : "0.0";

            setStats({
                avgMood: Number(globalAvgMood),
                riskCount,
                activeCount,
                totalStudents
            });

            // Prepare Chart Data
            if (checkins && checkins.length > 0) {
                const grouped = checkins.reduce((acc: any, curr: any) => {
                    const date = new Date(curr.created_at).toLocaleDateString('ru-RU', { weekday: 'short' });
                    if (!acc[date]) {
                        acc[date] = { sum: 0, count: 0, name: date };
                    }
                    acc[date].sum += curr.mood_score;
                    acc[date].count += 1;
                    return acc;
                }, {});

                const chart = Object.values(grouped).map((g: any) => ({
                    name: g.name,
                    mood: parseFloat((g.sum / g.count).toFixed(1))
                }));
                setMoodChartData(chart);
            } else {
                setMoodChartData([]);
            }

            // Load saved AI Risk Assessments
            const { data: savedAssessments } = await supabase
                .from('ai_risk_assessments')
                .select('*')
                .eq('class_id', classId);

            if (savedAssessments && savedAssessments.length > 0) {
                const assessmentsMap: Record<string, any> = {};
                savedAssessments.forEach((a: any) => {
                    assessmentsMap[a.student_id] = {
                        isRisk: a.risk_level >= 5,
                        riskLevel: a.risk_level,
                        status: a.status,
                        reason: a.reason
                    };
                });
                setAiRiskAssessments(assessmentsMap);

                // Update risk count based on saved assessments
                const aiRiskCount = savedAssessments.filter((a: any) => a.risk_level >= 5).length;
                setStats(prev => ({ ...prev, riskCount: aiRiskCount }));
            }

            // Load latest class insight
            const { data: latestInsight } = await supabase
                .from('class_insights')
                .select('content')
                .eq('class_id', classId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (latestInsight) {
                setInsightText(latestInsight.content);
            } else {
                setInsightText("");
            }


        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const runAIAnalysis = async () => {
        if (students.length === 0) return;
        setAnalyzing(true);

        try {
            // Aggregate anonymous data
            const lowMoodCount = students.filter(s => s.avgMood !== '-' && Number(s.avgMood) <= 2).length;
            const highMoodCount = students.filter(s => s.avgMood !== '-' && Number(s.avgMood) >= 4).length;

            // Prepare students context (last 3 checkins per student)
            const studentsContext = students.slice(0, 10).map((s, i) => {
                const recentCheckins = (s.rawCheckins || []).slice(0, 3).map((c: any) =>
                    `  - ${new Date(c.created_at).toLocaleDateString('ru-RU')}: Настр. ${c.mood_score}/5${c.factors?.length ? ', Факторы: ' + c.factors.join(', ') : ''}`
                ).join('\n') || '  Нет записей';
                return `${s.anonName} ${s.isRisk ? '⚠️ РИСК' : ''}:\n${recentCheckins}`;
            }).join('\n\n');

            const prompt = `Ты педагогический ассистент. Проанализируй класс и дай краткую сводку.

СТРОГИЕ ПРАВИЛА:
- Пиши ТОЛЬКО на русском языке
- НЕ используй английские, немецкие или другие иностранные слова
- НЕ используй технические термины и специальные символы
- Максимум 3-4 предложения

Статистика: ${stats.totalStudents} учеников, среднее настроение ${stats.avgMood}/5, в зоне риска ${stats.riskCount}.

Данные учеников:
${studentsContext}

Дай: 1) Сводку атмосферы класса. 2) Один совет учителю.`;

            const insight = await getGeminiInsight(prompt);
            setInsightText(insight);
            setShowInsight(true);

            // Save to DB
            try {
                await supabase.from('class_insights').insert({
                    class_id: selectedClass.id,
                    content: insight,
                    summary: insight.substring(0, 100) + '...'
                });
            } catch (err) {
                console.error("Failed to save insight", err);
            }

        } catch (err) {
            console.error(err);
            setInsightText("Не удалось выполнить анализ.");
        } finally {
            setAnalyzing(false);
        }
    };

    // AI Risk Assessment for all students
    const runAIRiskAssessment = async () => {
        if (students.length === 0) return;
        setAssessingRisk(true);

        const newAssessments: Record<string, any> = {};

        for (const student of students) {
            setAssessingStudentId(student.id);

            try {
                // Prepare checkins data
                const checkinsData = (student.rawCheckins || []).slice(-7).map((c: any) => ({
                    date: new Date(c.created_at).toLocaleDateString('ru-RU'),
                    mood: c.mood_score,
                    sleep: c.sleep_hours || 7,
                    energy: c.energy_level || 3,
                    factors: c.factors || [],
                    comment: c.comment || ''
                }));

                const assessment = await assessStudentRisk({
                    name: isAnonymous ? student.anonName : student.realName,
                    checkins: checkinsData
                });

                newAssessments[student.id] = assessment;

                // Small delay to avoid rate limiting
                await new Promise(res => setTimeout(res, 500));

            } catch (error) {
                console.error(`Failed to assess ${student.id}:`, error);
                newAssessments[student.id] = {
                    isRisk: false,
                    riskLevel: 0,
                    status: 'normal',
                    reason: 'Ошибка анализа'
                };
            }
        }

        setAiRiskAssessments(newAssessments);

        // Update risk count based on AI assessment
        const aiRiskCount = Object.values(newAssessments).filter((a: any) => a.isRisk).length;
        setStats(prev => ({ ...prev, riskCount: aiRiskCount }));

        // Save to database
        try {
            for (const [studentId, assessment] of Object.entries(newAssessments)) {
                await supabase
                    .from('ai_risk_assessments')
                    .upsert({
                        student_id: studentId,
                        class_id: selectedClass.id,
                        risk_level: (assessment as any).riskLevel,
                        status: (assessment as any).status,
                        reason: (assessment as any).reason,
                        assessed_at: new Date().toISOString()
                    }, {
                        onConflict: 'student_id,class_id'
                    });
            }
            console.log('AI assessments saved to database');
        } catch (error) {
            console.error('Failed to save assessments:', error);
        }

        setAssessingStudentId(null);
        setAssessingRisk(false);
    };


    const removeStudent = async (studentId: string, studentName: string) => {
        // NOTE: Confirmation handled by button UI now

        try {
            // 1. Try to Clear legacy class_id in profile (Non-blocking)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ class_id: null })
                .eq('id', studentId);

            if (profileError) {
                console.warn("Could not update profile class_id (likely permission), proceeding to enrollment removal:", profileError);
            }

            // 2. Remove from enrollments (The real source of truth)
            if (selectedClass) {
                const { error: enrollmentError } = await supabase
                    .from('class_enrollments')
                    .delete()
                    .eq('user_id', studentId)
                    .eq('class_id', selectedClass.id);

                if (enrollmentError) throw enrollmentError;
            }

            // Optimistic update
            setStudents(prev => prev.filter(s => s.id !== studentId));
            setStats(prev => ({ ...prev, totalStudents: Math.max(0, prev.totalStudents - 1) }));
            return { success: true };

        } catch (error) {
            console.error('Error removing student:', error);
            return { success: false, error };
        }
    };

    // ... (lines 351-402 deleteClass ...)

    // ... (rendering code ...)


    const exportToCSV = () => {
        if (!students || students.length === 0) {
            alert("Нет данных для экспорта");
            return;
        }

        const headers = ['Класс', 'Имя ученика', 'Email', 'Состояние', 'Оценка ИИ (0-10)', 'Ср. настроение'];

        const dataRows = students.map(s => {
            const aiAssessment = aiRiskAssessments[s.id];

            const className = selectedClass?.name || '';
            const name = s.realName;
            const email = s.email;

            let status = s.isRisk ? 'Риск' : 'Норма';
            let riskLevel = 0;

            if (aiAssessment) {
                const statusLabels: any = {
                    critical: 'Критично',
                    warning: 'Риск',
                    attention: 'Внимание',
                    normal: 'Норма'
                };
                status = statusLabels[aiAssessment.status] || aiAssessment.status;
                riskLevel = aiAssessment.riskLevel;
            }

            const avgMoodNum = s.avgMood ? parseFloat(s.avgMood as string) : null;

            return [
                className,
                name,
                email,
                status,
                riskLevel,
                avgMoodNum
            ];
        });

        const importXLSX = async () => {
            try {
                const ExcelJS = await import('exceljs');
                const { saveAs } = await import('file-saver');

                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Отчет по ученикам');

                worksheet.addRow(headers);
                dataRows.forEach(row => worksheet.addRow(row));

                worksheet.columns.forEach((column) => {
                    let maxLength = 0;
                    column.eachCell!({ includeEmpty: true }, (cell) => {
                        const columnLength = cell.value ? cell.value.toString().length : 10;
                        if (columnLength > maxLength) {
                            maxLength = columnLength;
                        }
                    });
                    column.width = maxLength < 10 ? 10 : maxLength + 2;
                });

                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                saveAs(blob, `Отчет_Класс_${selectedClass?.name || 'Экспорт'}_${new Date().toLocaleDateString('ru-RU')}.xlsx`);
            } catch (err) {
                console.error("Ошибка при экспорте Excel:", err);
                alert("Ошибка при создании Excel файла. Проверьте консоль.");
            }
        };

        importXLSX();
    };

    const deleteClass = async () => {
        alert("DEBUG: Start Delete"); // Prove it connects
        console.log("Delete button clicked", selectedClass);
        if (!selectedClass) {
            alert("Ошибка: класс не выбран");
            return;
        }

        if (!window.confirm(`Вы действительно хотите удалить класс "${selectedClass.name}"?`)) {
            return;
        }

        try {
            setLoading(true);

            // 1. Delete associated check-ins (manual cascade)
            // NOTE: Commenting out to rely on DB Cascade and avoid "text=uuid" error
            // const { error: checkinError } = await supabase
            //     .from('checkins')
            //     .delete()
            //     .eq('class_id', selectedClass.id);
            // if (checkinError) console.error("Error cleaning checkins:", checkinError);

            // 2. Delete class (enrollments verify cascade)
            const { error } = await supabase
                .from('classes')
                .delete()
                .eq('id', selectedClass.id);

            if (error) throw error;

            // 3. Update State
            const remainingClasses = classes.filter(c => c.id !== selectedClass.id);
            setClasses(remainingClasses);

            if (remainingClasses.length > 0) {
                // Select the first available class
                setSelectedClass(remainingClasses[0]);
            } else {
                setSelectedClass(null);
            }

            alert(`Класс "${selectedClass.name}" удален.`);

        } catch (error) {
            console.error('Error deleting class:', error);
            alert('Ошибка при удалении класса. Попробуйте еще раз.');
        } finally {
            setLoading(false);
        }
    };



    // --- RENDER ---
    if (loading && !selectedClass) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Загрузка...</div>;
    if (accessDenied) return <div className="text-white bg-black h-screen flex items-center justify-center">Доступ запрещен</div>;

    // NO CLASSES VIEW
    if (classes.length === 0 && !loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden font-sans">
                <div className="bg-white/5 border border-white/10 p-10 rounded-3xl max-w-md w-full text-center relative z-10 backdrop-blur-xl shadow-2xl">
                    <h1 className="text-3xl font-bold mb-3">Создание класса</h1>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        Создайте свой первый класс, чтобы начать работу.
                    </p>
                    <form onSubmit={createClass} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Название (например, 9Б)"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-purple-500"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            required
                        />
                        <button type="submit" disabled={creatingClass} className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-slate-200 transition-colors">
                            {creatingClass ? "Создание..." : "Создать класс"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30 flex">

            {/* STUDENT MODAL */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${isAnonymous ? 'bg-slate-800 text-slate-400' : 'bg-purple-600 text-white'}`}>
                                    {isAnonymous ? '#' : (selectedStudent.realName[0] || 'U')}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">
                                        {isAnonymous ? selectedStudent.anonName : selectedStudent.realName}
                                    </h2>
                                    <p className="text-slate-400 text-sm">
                                        {isAnonymous ? 'Информация скрыта' : selectedStudent.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">

                            {/* Key Metrics */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Среднее настроение</div>
                                    <div className={`text-2xl font-bold ${Number(selectedStudent.avgMood) < 3 ? 'text-red-400' : Number(selectedStudent.avgMood) > 4 ? 'text-green-400' : 'text-white'}`}>
                                        {selectedStudent.avgMood}
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Записей</div>
                                    <div className="text-2xl font-bold text-white">
                                        {selectedStudent.rawCheckins.length}
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Статус</div>
                                    <div className="text-xl font-bold">
                                        {(() => {
                                            const aiAssessment = aiRiskAssessments[selectedStudent.id];

                                            if (aiAssessment) {
                                                const statusColors = {
                                                    critical: 'text-red-400',
                                                    warning: 'text-orange-400',
                                                    attention: 'text-yellow-400',
                                                    normal: 'text-emerald-400'
                                                };
                                                const statusLabels = {
                                                    critical: 'Критично',
                                                    warning: 'Риск',
                                                    attention: 'Внимание',
                                                    normal: 'Норма'
                                                };
                                                const StatusIcon = {
                                                    critical: AlertCircle,
                                                    warning: AlertTriangle,
                                                    attention: Activity,
                                                    normal: CheckCircle
                                                }[aiAssessment.status];

                                                return (
                                                    <div>
                                                        <span className={`${statusColors[aiAssessment.status]} flex items-center gap-2`}>
                                                            <StatusIcon className="w-5 h-5" />
                                                            {statusLabels[aiAssessment.status]} ({aiAssessment.riskLevel}/10)
                                                        </span>
                                                        <p className="text-xs text-slate-400 mt-1 font-normal">{aiAssessment.reason}</p>
                                                    </div>
                                                );
                                            }

                                            // Fallback to rule-based
                                            return selectedStudent.isRisk ? (
                                                <span className="text-red-400 flex items-center gap-2">
                                                    <AlertTriangle className="w-5 h-5" /> Риск
                                                </span>
                                            ) : (
                                                <span className="text-emerald-400 flex items-center gap-2">
                                                    <CheckCircle className="w-5 h-5" /> Норма
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Динамика (7 дней)</h3>
                                <div className="h-40 w-full bg-white/5 rounded-xl border border-white/10 p-4">
                                    {selectedStudent.history.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={selectedStudent.history}>
                                                <defs>
                                                    <linearGradient id="colorMoodStudent" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                                <YAxis domain={[1, 5]} hide />
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                                />
                                                <Area type="monotone" dataKey="mood" stroke="#a855f7" strokeWidth={2} fill="url(#colorMoodStudent)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                                            Нет данных для графика
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recent Notes (Only if not anonymous ideally, but showing for now with caveat) */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Последние заметки</h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {selectedStudent.rawCheckins.slice().reverse().slice(0, 5).map((c: any) => (
                                        <div key={c.id} className="bg-white/5 rounded-lg p-3 text-sm border border-white/5">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-slate-500 text-xs">{new Date(c.created_at).toLocaleDateString('ru-RU')}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs font-bold ${c.mood_score < 3 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                        Настроение: {c.mood_score}/5
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-4 mb-2 text-xs">
                                                <span className="text-blue-400">
                                                    Сон: {c.sleep_hours || '?'}ч
                                                </span>
                                                <span className="text-yellow-400">
                                                    Энергия: {c.energy_level || '?'}/10
                                                </span>
                                            </div>
                                            <p className="text-slate-300">
                                                {isAnonymous ? "Текст скрыт настройками приватности" : (c.comment || "Без заметки")}
                                            </p>
                                        </div>
                                    ))}
                                    {selectedStudent.rawCheckins.length === 0 && (
                                        <div className="text-slate-600 text-sm italic">Записей нет</div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}


            {/* SIDEBAR (Class Selector) */}
            <aside className="w-64 border-r border-white/10 p-6 flex flex-col bg-[#050505]">
                <div className="flex items-center gap-3 font-bold text-xl mb-8">
                    <img src="/logo.png" alt="Prism Logo" className="w-8 h-8 object-contain" />
                    <span>Prism <span className="text-slate-500 text-sm">Teacher</span></span>
                </div>

                <div className="mb-6">
                    <button
                        onClick={() => setCreatingClass(!creatingClass)}
                        className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors text-sm font-bold"
                    >
                        <Plus className="w-4 h-4" /> Новый класс
                    </button>
                    {creatingClass && (
                        <form onSubmit={createClass} className="mt-3 space-y-2 animate-in slide-in-from-top-2">
                            <input className="w-full bg-black border border-white/20 rounded-lg p-2 text-sm" placeholder="Название..." autoFocus value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                        </form>
                    )}
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto">
                    {classes.map(c => (
                        <div
                            key={c.id}
                            onClick={() => setSelectedClass(c)}
                            className={`p-3 rounded-xl cursor-pointer transition-colors flex justify-between items-center ${selectedClass?.id === c.id ? 'bg-purple-600/20 border border-purple-500/50 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <span className="font-medium truncate">{c.name}</span>
                            {selectedClass?.id === c.id && <div className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]"></div>}
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-white/10 text-xs text-slate-500">
                    v2.1 • Teacher Dashboard
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 p-8 h-screen overflow-y-auto">

                {/* HEADER */}
                <header className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-1">{selectedClass?.name}</h1>
                        <div className="flex items-center gap-2 text-slate-400 text-sm cursor-pointer hover:text-white transition-colors"
                            onClick={() => { if (selectedClass) navigator.clipboard.writeText(selectedClass.code); }}
                        >
                            <span className="bg-white/10 px-2 py-0.5 rounded text-white font-mono">{selectedClass?.code}</span>
                            <Copy className="w-3 h-3" />
                            <span>Код для входа</span>
                        </div>
                    </div>



                    <div className="flex items-center gap-4">
                        {/* DELETE BUTTON INTEGRATED */}
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                const btn = e.currentTarget;

                                if (btn.dataset.confirming === "true") {
                                    // EXECUTE DELETE
                                    btn.innerHTML = "Удаление...";
                                    btn.disabled = true;

                                    try {
                                        const { error: cErr } = await supabase.from('checkins').delete().eq('class_id', selectedClass.id);
                                        if (cErr) console.error(cErr);
                                        const { error: clErr } = await supabase.from('classes').delete().eq('id', selectedClass.id);
                                        if (clErr) throw clErr;

                                        window.location.reload();
                                    } catch (err) {
                                        alert("Ошибка: " + JSON.stringify(err));
                                        btn.disabled = false;
                                        btn.innerText = "Ошибка";
                                    }
                                } else {
                                    // ARM
                                    btn.dataset.confirming = "true";
                                    const originalContent = btn.innerHTML;
                                    btn.innerHTML = `<span class="font-bold text-xs uppercase">Подтвердить?</span>`;
                                    btn.className = "flex items-center gap-2 px-4 py-2 rounded-full border transition-all bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]";

                                    // Reset after 3 seconds
                                    setTimeout(() => {
                                        if (btn && !btn.disabled) {
                                            btn.dataset.confirming = "false";
                                            btn.innerHTML = originalContent;
                                            btn.className = "p-2 bg-white/5 border border-white/10 rounded-full hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50 transition-colors text-slate-400";
                                        }
                                    }, 3000);
                                }
                            }}
                            className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50 transition-colors text-slate-400"
                            title="Удалить класс"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>

                        <button
                            onClick={exportToCSV}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-full border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-colors`}
                            title="Скачать отчет"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Экспорт CSV</span>
                        </button>

                        <button
                            onClick={() => setIsAnonymous(!isAnonymous)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${isAnonymous ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400'}`}
                        >
                            {isAnonymous ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            <span className="text-sm font-bold">{isAnonymous ? 'Имена скрыты' : 'Имена открыты'}</span>
                        </button>
                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full border bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
                            title="Выйти из аккаунта"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-bold">Выйти</span>
                        </button>
                    </div>
                </header>

                <div className="flex gap-4 mb-8 border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`pb-3 px-2 font-bold transition-colors ${activeTab === 'dashboard' ? 'text-white border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Дашборд
                    </button>
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`pb-3 px-2 font-bold transition-colors ${activeTab === 'tasks' ? 'text-white border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Задания ({tasks.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`pb-3 px-2 font-bold transition-colors ${activeTab === 'calendar' ? 'text-white border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Календарь
                    </button>
                </div>



                {activeTab === 'tasks' ? (
                    <div className="max-w-4xl">
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 mb-8">
                            <h3 className="text-xl font-bold mb-4">Новое задание</h3>
                            <form onSubmit={createTask} className="flex gap-4">
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Например: Опишите свое настроение одним словом..."
                                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                                />
                                <button
                                    type="submit"
                                    disabled={creatingTask}
                                    className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
                                >
                                    Создать
                                </button>
                            </form>
                        </div>

                        <div className="grid gap-4">
                            {tasks.map(task => (
                                <div key={task.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-lg font-bold mb-1">{task.title}</h4>
                                            <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded">
                                                {new Date(task.created_at).toLocaleDateString('ru-RU')}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => deleteTask(task.id)}
                                            className="text-red-400 hover:text-red-300 text-sm opacity-50 hover:opacity-100 transition-opacity"
                                        >
                                            Удалить
                                        </button>
                                    </div>

                                    {/* Submissions List */}
                                    <div className="border-t border-white/5 pt-4">
                                        <h5 className="text-xs font-bold text-slate-500 uppercase mb-3">
                                            Ответы ({task.student_tasks?.length || 0})
                                        </h5>
                                        <div className="space-y-3">
                                            {task.student_tasks && task.student_tasks.length > 0 ? (
                                                task.student_tasks.map((submission: any) => {
                                                    const student = students.find(s => s.id === submission.student_id);
                                                    return (
                                                        <div key={submission.id} className="bg-black/30 rounded-lg p-3 text-sm">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-bold text-purple-300">
                                                                    {student ? (isAnonymous ? student.anonName : student.realName) : 'Неизвестный'}
                                                                </span>
                                                                <span className="text-xs text-slate-600">
                                                                    {new Date(submission.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-300">{submission.response}</p>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <p className="text-slate-600 italic text-sm">Пока нет ответов</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {tasks.length === 0 && (
                                <div className="text-center py-12 text-slate-500 border border-dashed border-white/10 rounded-2xl">
                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>В этом классе пока нет заданий</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : activeTab === 'dashboard' ? (
                    <>
                        {/* STATS ROW */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <KpiCard title="Учеников" value={stats.totalStudents} status="neutral" />
                            <KpiCard title="Среднее настроение" value={stats.avgMood} status={stats.avgMood > 3.5 ? 'green' : stats.avgMood < 2.5 ? 'red' : 'yellow'} />
                            <KpiCard title="В зоне риска" value={stats.riskCount} status={stats.riskCount > 0 ? 'red' : 'green'} />
                            <KpiCard title="Активных" value={stats.activeCount} status="neutral" />
                        </div>

                        {/* MAIN GRID */}
                        <div className="grid grid-cols-12 gap-6">

                            {/* LEFT: STUDENT TABLE */}
                            <div className="col-span-12 lg:col-span-8">
                                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 min-h-[500px]">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-lg">Успеваемость и Состояние</h3>
                                        <button
                                            onClick={runAIRiskAssessment}
                                            disabled={assessingRisk || students.length === 0}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${assessingRisk
                                                ? 'bg-purple-500/20 text-purple-300 cursor-wait'
                                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20'
                                                }`}
                                        >
                                            <BrainCircuit className={`w-4 h-4 ${assessingRisk ? 'animate-spin' : ''}`} />
                                            {assessingRisk ? `Анализ ${assessingStudentId ? '...' : ''}` : 'AI Анализ риска'}
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-white/10">
                                                    <th className="pb-3 pl-2">Ученик</th>
                                                    <th className="pb-3">Mood (Avg)</th>
                                                    <th className="pb-3">Статус</th>
                                                    <th className="pb-3 text-right pr-2">Посл. запись</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {students.map((s, i) => (
                                                    <tr
                                                        key={s.id}
                                                        onClick={() => setSelectedStudent(s)} // OPEN MODAL
                                                        className="border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer"
                                                    >
                                                        <td className="py-4 pl-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isAnonymous ? 'bg-slate-800 text-slate-400' : 'bg-purple-600 text-white'}`}>
                                                                    {isAnonymous ? '#' : (s.realName[0] || 'U')}
                                                                </div>
                                                                <div>
                                                                    <div className={`font-medium ${isAnonymous ? 'font-mono text-slate-500' : 'text-white'}`}>
                                                                        {isAnonymous ? s.anonName : s.realName}
                                                                    </div>
                                                                    {!isAnonymous && <div className="text-xs text-slate-500">{s.email}</div>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-bold ${Number(s.avgMood) < 3 ? 'text-red-400' : Number(s.avgMood) > 4 ? 'text-green-400' : 'text-slate-300'}`}>
                                                                    {s.avgMood}
                                                                </span>
                                                                {s.avgMood !== '-' && <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                                                    <div className={`h-full ${Number(s.avgMood) < 3 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${(Number(s.avgMood) / 5) * 100}%` }}></div>
                                                                </div>}
                                                            </div>
                                                        </td>
                                                        <td className="py-4">
                                                            {(() => {
                                                                const aiAssessment = aiRiskAssessments[s.id];
                                                                const isAssessing = assessingStudentId === s.id;

                                                                if (isAssessing) {
                                                                    return (
                                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse">
                                                                            <BrainCircuit className="w-3 h-3 animate-spin" />
                                                                            Анализ...
                                                                        </span>
                                                                    );
                                                                }

                                                                if (aiAssessment) {
                                                                    const statusColors = {
                                                                        critical: 'bg-red-500/20 text-red-400 border-red-500/30',
                                                                        warning: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                                                                        attention: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                                                                        normal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                                    };
                                                                    const statusLabels = {
                                                                        critical: 'Критично',
                                                                        warning: 'Риск',
                                                                        attention: 'Внимание',
                                                                        normal: 'Норма'
                                                                    };

                                                                    return (
                                                                        <div className="flex flex-col gap-1">
                                                                            <span
                                                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[aiAssessment.status]}`}
                                                                                title={aiAssessment.reason}
                                                                            >
                                                                                {aiAssessment.status === 'critical' && <AlertCircle className="w-3 h-3" />}
                                                                                {aiAssessment.status === 'warning' && <AlertTriangle className="w-3 h-3" />}
                                                                                {aiAssessment.status === 'attention' && <Activity className="w-3 h-3" />}
                                                                                {aiAssessment.status === 'normal' && <CheckCircle className="w-3 h-3" />}
                                                                                {statusLabels[aiAssessment.status]} ({aiAssessment.riskLevel}/10)
                                                                            </span>
                                                                            <span className="text-[10px] text-slate-500 max-w-[150px] truncate" title={aiAssessment.reason}>
                                                                                {aiAssessment.reason}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }

                                                                // Fallback to rule-based
                                                                return (
                                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.isRisk
                                                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                                        }`}>
                                                                        {s.isRisk ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                                                                        {s.isRisk ? 'Риск' : 'Норма'}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="py-4 text-right text-slate-500 pr-2">
                                                            {s.lastCheckin ? new Date(s.lastCheckin.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                        </td>
                                                        {/* DELETE BUTTON */}
                                                        <td className="py-4 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    const btn = e.currentTarget;

                                                                    if (btn.dataset.confirming === "true") {
                                                                        // ACTION: Delete
                                                                        btn.dataset.processing = "true"; // Lock explicit reset
                                                                        btn.innerHTML = "...";

                                                                        const result = await removeStudent(s.id, s.realName);

                                                                        if (!result.success) {
                                                                            btn.dataset.processing = "false";
                                                                            btn.dataset.confirming = "false";
                                                                            btn.innerHTML = "Ошибка";
                                                                            console.error(result.error);
                                                                            alert("Ошибка при удалении: " + (result.error.message || "Unknown error"));
                                                                        }
                                                                        // If success, react will unmount this button/row, so no need to reset.

                                                                    } else {
                                                                        // ACTION: Arm
                                                                        btn.dataset.confirming = "true";
                                                                        const originalData = btn.innerHTML; // icon
                                                                        btn.innerHTML = `<span class="text-xs font-bold text-red-500">Удалить?</span>`;

                                                                        setTimeout(() => {
                                                                            if (btn && btn.dataset.processing !== "true") {
                                                                                btn.dataset.confirming = "false";
                                                                                // Restore Icon
                                                                                btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
                                                                            }
                                                                        }, 3000);
                                                                    }
                                                                }}
                                                                className="p-2 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-500 transition-colors"
                                                                title="Исключить из класса"
                                                            >
                                                                <Trash2 className="w-4 h-4 pointer-events-none" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT GAP: AI INSIGHTS? OR CHARTS */}
                            <div className="col-span-12 lg:col-span-4 space-y-6">
                                {/* AI INSIGHT CARD */}
                                <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 p-6 rounded-2xl relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                                <BrainCircuit className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <h3 className="font-bold text-indigo-100">AI Аналитик</h3>
                                        </div>
                                        <button
                                            onClick={runAIAnalysis}
                                            disabled={analyzing}
                                            className="text-xs bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {analyzing ? 'Думаю...' : 'Анализ'}
                                        </button>
                                    </div>
                                    <p className="text-sm text-indigo-200 leading-relaxed mb-4 min-h-[60px]">
                                        {insightText || "Нажмите 'Анализ', чтобы получить саммари состояния класса на основе последних данных."}
                                    </p>
                                </div>

                                {/* CHART CARD */}
                                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                                    <h3 className="font-bold text-lg mb-4">Динамика настроения</h3>
                                    <div className="h-48 text-xs">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={moodChartData}>
                                                <defs>
                                                    <linearGradient id="colorMoodA" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                                <XAxis dataKey="name" stroke="#666" axisLine={false} tickLine={false} />
                                                <YAxis stroke="#666" axisLine={false} tickLine={false} domain={[1, 5]} hide />
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                                <Area type="monotone" dataKey="mood" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorMoodA)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                            </div>

                        </div>
                    </>
                ) : activeTab === 'calendar' ? (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Расписание и оценки</h3>
                            <button
                                onClick={() => setShowEventModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Добавить
                            </button>
                        </div>

                        {/* Calendar Grid / List */}
                        <div className="grid gap-4">
                            {events.map((ev) => (
                                <div key={ev.id} className="bg-[#0A0A0A] border border-white/10 p-4 rounded-xl flex justify-between items-center group">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl border ${ev.type === 'sor' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                            ev.type === 'soch' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                            }`}>
                                            <CalendarIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">{ev.title}</h4>
                                            <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {new Date(ev.date).toLocaleDateString()} {new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="capitalize px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs">
                                                    {ev.type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="p-2 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            {events.length === 0 && (
                                <div className="text-center py-12 text-slate-500 border border-dashed border-white/10 rounded-2xl">
                                    <p>Нет запланированных событий</p>
                                </div>
                            )}
                        </div>

                        {/* Event Modal */}
                        {showEventModal && (
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 max-w-sm w-full">
                                    <h3 className="text-xl font-bold mb-4">Новое событие</h3>
                                    <form onSubmit={createEvent} className="space-y-4">
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Название</label>
                                            <input
                                                className="w-full bg-black border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none"
                                                value={newEventTitle}
                                                onChange={e => setNewEventTitle(e.target.value)}
                                                placeholder="СОР по Алгебре"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Дата и время</label>
                                            <input
                                                type="datetime-local"
                                                className="w-full bg-black border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none scheme-dark text-slate-400"
                                                value={newEventDate}
                                                onChange={e => setNewEventDate(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Тип</label>
                                            <select
                                                className="w-full bg-black border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none text-slate-300"
                                                value={newEventType}
                                                onChange={e => setNewEventType(e.target.value)}
                                            >
                                                <option value="sor">СОР</option>
                                                <option value="soch">СОЧ</option>
                                                <option value="control_work">Контрольная</option>
                                                <option value="homework">ДЗ</option>
                                                <option value="other">Другое</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button type="button" onClick={() => setShowEventModal(false)} className="flex-1 py-3 bg-white/5 rounded-lg text-slate-400 hover:text-white">Отмена</button>
                                            <button type="submit" disabled={creatingEvent} className="flex-1 py-3 bg-purple-600 rounded-lg hover:bg-purple-500 font-bold">
                                                {creatingEvent ? '...' : 'Создать'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}

                {/* AI Assistant */}



            </main>

            {/* AI Assistant - Removed TeacherMentorChat component */}

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

        </div>
    );
};



export default TeacherDashboard;
