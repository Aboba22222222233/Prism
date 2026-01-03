import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, ArrowRight, Smile, Frown, Meh, Sun, CloudRain, Zap, Moon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ColorBends from '../../ColorBends';

const emotionsList = [
    'Спокойствие', 'Радость', 'Тревога', 'Усталость',
    'Злость', 'Вдохновение', 'Грусть', 'Скука'
];

const categorizedFactors = {
    'Школа': ['Учеба', 'Экзамены', 'Учителя', 'Одноклассники', 'Домашнее задание'],
    'Отношения': ['Друзья', 'Семья', 'Любовь', 'Конфликт', 'Одиночество'],
    'Здоровье': ['Сон', 'Еда', 'Болезнь', 'Спорт', 'Усталость'],
    'Личное': ['Будущее', 'Хобби', 'Деньги', 'Погода', 'Новости']
};

const factorsList = Object.values(categorizedFactors).flat();

const StudentCheckIn = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [mood, setMood] = useState(3); // 1-5
    const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
    const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
    const [comment, setComment] = useState('');
    const [sleep, setSleep] = useState<number>(7);
    const [energy, setEnergy] = useState<number>(5);

    const [loading, setLoading] = useState(false);

    // New: Category State for Factors
    const [activeCategory, setActiveCategory] = useState('Школа');

    // Aura colors based on mood
    const moodColors = {
        1: ["#1a0b2e", "#4a0404", "#000000"], // Very Bad (Dark Red)
        2: ["#1a0b2e", "#5e2a0b", "#2e1a0b"], // Bad (Dark Orange)
        3: ["#1a0b2e", "#3f3f46", "#18181b"], // Neutral (Grey)
        4: ["#1a0b2e", "#0f393b", "#064e3b"], // Good (Teal/Green)
        5: ["#1a0b2e", "#ec4899", "#8b5cf6"], // Very Good (Prism Pink/Purple)
    };

    const currentColors = moodColors[mood as keyof typeof moodColors];

    const toggleSelection = (item: string, list: string[], setList: (l: string[]) => void) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const location = useLocation();
    const classId = location.state?.classId;

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Не авторизован");

            if (!classId) {
                alert("Ошибка: Не выбран класс!");
                navigate('/student-dashboard');
                return;
            }

            // Calculate pseudo stress score based on mood (inverse logic for demo)
            const stressScore = Math.max(1, Math.min(10, (6 - mood) * 2));

            const { error } = await supabase.from('checkins').insert({
                user_id: user.id,
                class_id: classId,
                mood_score: mood,
                stress_score: stressScore,
                emotions: selectedEmotions,
                factors: selectedFactors,
                comment: comment,
                sleep_hours: sleep,
                energy_level: energy
            });

            if (error) throw error;

            navigate('/student-dashboard');

        } catch (error: any) {
            console.error("Save error full object:", error);
            alert(`Ошибка сохранения: ${error.message || JSON.stringify(error)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans flex flex-col items-center justify-center p-6">

            {/* Dynamic Background Aura */}
            <div className="absolute inset-0 z-0 opacity-60 transition-colors duration-1000 ease-in-out">
                <ColorBends
                    colors={currentColors}
                    scale={step === 1 ? 2.5 : 1.5}
                    speed={0.3}
                />
            </div>

            <div className="relative z-10 w-full max-w-md">

                {/* Progress Dots */}
                <div className="flex justify-center gap-2 mb-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-all ${step >= i ? 'bg-white' : 'bg-white/20'}`}></div>
                    ))}
                </div>

                <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl min-h-[500px] flex flex-col">

                    {step === 1 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                            <h2 className="text-2xl font-bold mb-2">Как ты сейчас?</h2>
                            <p className="text-slate-400 mb-8">Сдвинь ползунок, чтобы описать состояние</p>

                            <div className="w-full h-64 flex items-center justify-center relative mb-8">
                                {/* Visual Representation of Mood */}
                                <div className={`w-32 h-32 rounded-full blur-[40px] transition-all duration-500`}
                                    style={{ backgroundColor: currentColors[2], transform: `scale(${0.8 + mood * 0.1})` }}
                                ></div>
                                <div className="absolute text-6xl drop-shadow-lg transition-transform hover:scale-110 duration-300">
                                    {mood === 1 && <Frown className="w-24 h-24 text-red-500" strokeWidth={1.5} />}
                                    {mood === 2 && <CloudRain className="w-24 h-24 text-orange-400" strokeWidth={1.5} />}
                                    {mood === 3 && <Meh className="w-24 h-24 text-slate-300" strokeWidth={1.5} />}
                                    {mood === 4 && <Sun className="w-24 h-24 text-emerald-400" strokeWidth={1.5} />}
                                    {mood === 5 && <Smile className="w-24 h-24 text-pink-400" strokeWidth={1.5} />}
                                </div>
                            </div>

                            <div className="w-full px-4">
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    step="1"
                                    value={mood}
                                    onChange={(e) => setMood(parseInt(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-2 font-bold uppercase tracking-wider">
                                    <span>Плохо</span>
                                    <span>Отлично</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex-1 flex flex-col animate-in slide-in-from-right duration-300">
                            <h2 className="text-xl font-bold mb-6 text-center">Что ты чувствуешь?</h2>

                            <div className="flex flex-wrap gap-3 justify-center content-start">
                                {emotionsList.map(item => (
                                    <button
                                        key={item}
                                        onClick={() => toggleSelection(item, selectedEmotions, setSelectedEmotions)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${selectedEmotions.includes(item)
                                            ? 'bg-purple-500 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                            }`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex-1 flex flex-col animate-in slide-in-from-right duration-300 px-2">
                            <h2 className="text-xl font-bold mb-6 text-center">Физиология</h2>

                            <div className="mb-8">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                        <Moon className="w-4 h-4 text-indigo-400" />
                                        Сон (часов)
                                    </label>
                                    <span className="text-xl font-bold text-white">{sleep} ч</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="12"
                                    step="0.5"
                                    value={sleep}
                                    onChange={(e) => setSleep(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-yellow-400" />
                                        Энергия
                                    </label>
                                    <span className="text-xl font-bold text-white">{energy}/10</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    step="1"
                                    value={energy}
                                    onChange={(e) => setEnergy(parseInt(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                />
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="flex-1 flex flex-col animate-in slide-in-from-right duration-300">
                            <h2 className="text-xl font-bold mb-2 text-center">Что на это влияет?</h2>
                            <p className="text-center text-slate-400 text-xs mb-6">Выбери основные сферы</p>

                            <div className="flex flex-col gap-4 mb-4">
                                <div className="flex gap-2 justify-center pb-2 border-b border-white/10 overflow-x-auto">
                                    {['Школа', 'Отношения', 'Здоровье', 'Личное'].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${activeCategory === cat ? 'bg-white text-black' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center p-2 min-h-[120px] content-start">
                                    {categorizedFactors[activeCategory as keyof typeof categorizedFactors]?.map(item => (
                                        <button
                                            key={item}
                                            onClick={() => toggleSelection(item, selectedFactors, setSelectedFactors)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedFactors.includes(item)
                                                ? 'bg-cyan-500 text-white border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                                }`}
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-auto">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Личная заметка (необязательно)</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-purple-500/50 focus:outline-none resize-none h-24"
                                    placeholder="Сегодня я..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-8 flex justify-between gap-4">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors"
                            >
                                Назад
                            </button>
                        )}

                        <button
                            onClick={step < 4 ? () => setStep(step + 1) : handleSubmit}
                            disabled={loading}
                            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${step === 4
                                ? 'bg-gradient-to-r from-pink-500 to-purple-600 shadow-[0_0_20px_rgba(236,72,153,0.4)] text-white hover:shadow-[0_0_30px_rgba(236,72,153,0.6)]'
                                : 'bg-white text-black hover:bg-slate-200'
                                }`}
                        >
                            {loading ? "Сохранение..." : (step === 4 ? "Завершить" : "Далее")}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StudentCheckIn;
